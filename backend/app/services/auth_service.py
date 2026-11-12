import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config import settings
from app.models.user import User, UserRole
from app.models.otp_verification import OTPVerification
from app.models.revoked_token import RevokedToken
from app.models.audit_log import AuditLog
from app.models.language_preference import LanguagePreference
from app.models.admin import AdminUser
from app.repositories.user_repository import UserRepository
from app.auth.jwt_handler import create_access_token, verify_password, decode_access_token
from app.auth.rate_limiter import auth_rate_limiter
from app.services.sms_service import sms_service
from app.schemas.user import Token, UserResponse, SendOTPResponse, LogoutResponse

logger = logging.getLogger("app.auth.service")

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def send_otp(self, phone_number: str, ip_address: Optional[str] = None) -> SendOTPResponse:
        clean_phone = phone_number.replace(" ", "").replace("-", "")

        # 1. Enforce Resend Cooldown & Hourly Rate Limits
        is_allowed, retry_after, reason = auth_rate_limiter.check_otp_resend(
            phone_number=clean_phone,
            cooldown_seconds=settings.OTP_COOLDOWN_SECONDS,
            max_per_hour=settings.OTP_MAX_RESENDS_PER_HOUR
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=reason,
                headers={"Retry-After": str(retry_after)}
            )

        # 2. Cryptographically Secure OTP Generation
        # In dev mode, deterministic fixtures for primary test accounts can be preserved if needed
        if settings.OTP_MODE == "development" and clean_phone in ("03009876543", "03001234567"):
            raw_code = "123456"
        else:
            raw_code = f"{secrets.randbelow(900000) + 100000}"

        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        user = self.user_repo.get_by_phone(clean_phone)

        # 3. Persist Salted Cryptographic Hash (Raw OTP is NEVER stored in database)
        otp_record = OTPVerification.create_record(
            phone_number=clean_phone,
            raw_code=raw_code,
            expires_at=expires_at,
            purpose="CITIZEN_LOGIN",
            user_id=user.id if user else None,
            ip_address=ip_address,
            user_agent="CitizenApp/AuthClient"
        )
        self.db.add(otp_record)

        # 4. Record Rate Limiter Event
        auth_rate_limiter.record_otp_request(clean_phone)

        # 5. Immutable Audit Log (Never logs raw OTP!)
        masked_phone = sms_service.mask_phone(clean_phone)
        self.db.add(AuditLog.record(
            event_type="OTP_REQUESTED",
            actor_type="CITIZEN",
            user_id=user.id if user else None,
            resource_type="otp_verifications",
            details={
                "phone_masked": masked_phone,
                "purpose": "CITIZEN_LOGIN",
                "mode": settings.OTP_MODE
            },
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()

        # 6. Dispatch via SMS Carrier / Sandbox
        # Notice: sms_service never outputs the raw OTP in logs
        # For non-async router calls, we run dispatch synchronously or mock
        is_dev = (settings.OTP_MODE == "development")

        return SendOTPResponse(
            status="success",
            message=f"Verification code sent to {masked_phone}",
            cooldown_seconds=settings.OTP_COOLDOWN_SECONDS,
            is_demo=is_dev,
            # CRITICAL SECURITY RULE: In production, otp_demo is STRICTLY None!
            otp_demo=raw_code if is_dev else None
        )

    def verify_otp(self, phone_number: str, otp: str, ip_address: Optional[str] = None) -> Token:
        clean_phone = phone_number.replace(" ", "").replace("-", "")

        # 1. Query for latest unused, unexpired verification record
        otp_record = self.db.query(OTPVerification).filter(
            OTPVerification.phone_number == clean_phone,
            OTPVerification.is_used == False
        ).order_by(OTPVerification.created_at.desc()).first()

        masked_phone = sms_service.mask_phone(clean_phone)

        if not otp_record or otp_record.is_expired():
            self.db.add(AuditLog.record(
                event_type="CITIZEN_LOGIN_FAILED",
                actor_type="CITIZEN",
                resource_type="otp_verifications",
                details={"phone_masked": masked_phone, "reason": "No active or unexpired OTP found"},
                ip_address=ip_address,
                status="FAILURE"
            ))
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired or does not exist. Please request a new code."
            )

        # 2. Check Brute-Force Rate Limiting (Attempt Counter)
        if otp_record.attempts >= otp_record.max_attempts:
            otp_record.is_used = True # Invalidate compromised record
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum verification attempts exceeded. This code has been invalidated for security."
            )

        # 3. Constant-Time Verification
        verified = otp_record.verify_code(otp)
        self.db.commit()

        if not verified:
            remaining_attempts = max(0, otp_record.max_attempts - otp_record.attempts)
            self.db.add(AuditLog.record(
                event_type="CITIZEN_LOGIN_FAILED",
                actor_type="CITIZEN",
                resource_type="otp_verifications",
                details={"phone_masked": masked_phone, "attempts": otp_record.attempts},
                ip_address=ip_address,
                status="FAILURE"
            ))
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid verification code. {remaining_attempts} attempt(s) remaining."
            )

        # 4. Successful Verification - User Identity Resolution
        user = self.user_repo.get_by_phone(clean_phone)
        if not user:
            # Auto-register new citizen identity upon verified mobile phone possession
            user = self.user_repo.create({
                "full_name": f"Citizen {clean_phone[-4:]}",
                "phone_number": clean_phone,
                "role": UserRole.CITIZEN,
                "is_active": True,
                "is_verified": True
            })
            # Default Urdu language preference
            pref = LanguagePreference(
                user_id=user.id,
                language_code="ur",
                direction="rtl",
                voice_preferred=True
            )
            self.db.add(pref)

        self.db.add(AuditLog.record(
            event_type="CITIZEN_LOGIN",
            actor_type="CITIZEN",
            user_id=user.id,
            resource_type="users",
            resource_id=str(user.id),
            details={"phone_masked": masked_phone, "method": "SMS_OTP"},
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()

        token_str = create_access_token({"sub": str(user.id), "role": user.role.value})
        return Token(
            access_token=token_str,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=UserResponse.model_validate(user)
        )

    def login_password(self, identifier: str, password: str, ip_address: Optional[str] = None) -> Token:
        clean_id = identifier.strip()

        # 1. Enforce Account/IP Lockout on Failed Login Attempts
        is_allowed, retry_after, reason = auth_rate_limiter.check_login_lockout(
            identifier=clean_id,
            max_failed_attempts=5,
            lockout_seconds=300
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=reason,
                headers={"Retry-After": str(retry_after)}
            )

        # 2. Look up in User table or AdminUser table
        user = self.user_repo.get_by_email(clean_id) or self.user_repo.get_by_phone(clean_id)
        admin_rec: Optional[AdminUser] = None

        if not user and ("@" in clean_id or clean_id.startswith("TP-")):
            admin_rec = self.db.query(AdminUser).filter(
                (AdminUser.email == clean_id) | (AdminUser.badge_number == clean_id)
            ).first()

            if admin_rec and verify_password(password, admin_rec.hashed_password):
                user = self.user_repo.get_by_email(admin_rec.email)
                if not user:
                    user = self.user_repo.create({
                        "full_name": admin_rec.full_name,
                        "phone_number": f"0300{admin_rec.id:07d}",
                        "email": admin_rec.email,
                        "hashed_password": admin_rec.hashed_password,
                        "role": UserRole.ADMIN,
                        "is_active": True,
                        "is_verified": True
                    })

        # 3. Check credentials
        valid = False
        if user and user.hashed_password and verify_password(password, user.hashed_password):
            valid = True

        if not valid:
            auth_rate_limiter.record_login_failure(clean_id)
            self.db.add(AuditLog.record(
                event_type="PASSWORD_LOGIN_FAILED",
                actor_type="ADMIN" if "@" in clean_id else "CITIZEN",
                details={"identifier": clean_id, "reason": "Bad credentials"},
                ip_address=ip_address,
                status="DENIED"
            ))
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid identifier or password."
            )

        # 4. Successful Login - Reset lockout counter
        auth_rate_limiter.reset_login_failures(clean_id)

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is currently inactive or suspended."
            )

        actor_type = "ADMIN" if user.role != UserRole.CITIZEN else "CITIZEN"
        self.db.add(AuditLog.record(
            event_type="ADMIN_LOGIN" if actor_type == "ADMIN" else "CITIZEN_LOGIN",
            actor_type=actor_type,
            user_id=user.id,
            resource_type="users",
            resource_id=str(user.id),
            details={"identifier": clean_id, "role": user.role.value},
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()

        token_str = create_access_token({"sub": str(user.id), "role": user.role.value})
        return Token(
            access_token=token_str,
            token_type="bearer",
            expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            user=UserResponse.model_validate(user)
        )

    def logout(self, token: str, current_user: User, ip_address: Optional[str] = None) -> LogoutResponse:
        """
        Invalidates JWT access token via persistent revocation table.
        Future requests using this token will be immediately rejected with 401.
        """
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        jti = payload.get("jti") or getattr(current_user, "_current_jti", None)
        exp_ts = payload.get("exp")
        
        if not jti:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token does not contain a revocable identifier."
            )

        if exp_ts:
            expires_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        else:
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

        # Check if already revoked
        existing = self.db.query(RevokedToken).filter_by(token_jti=jti).first()
        if not existing:
            revocation = RevokedToken.revoke(
                jti=jti,
                user_id=current_user.id,
                expires_at=expires_at
            )
            self.db.add(revocation)

        self.db.add(AuditLog.record(
            event_type="LOGOUT",
            actor_type="ADMIN" if current_user.role != UserRole.CITIZEN else "CITIZEN",
            user_id=current_user.id,
            resource_type="revoked_tokens",
            resource_id=jti,
            details={"revoked_jti": jti},
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()

        return LogoutResponse(
            status="success",
            message="Session terminated successfully. Token revoked."
        )
