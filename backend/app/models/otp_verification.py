import hashlib
import secrets
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class OTPVerification(Base):
    """
    Secure One-Time Password (OTP) verification records.
    Raw OTP codes are never stored in plaintext — only salted cryptographic digests.
    """
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    otp_hash = Column(String(255), nullable=False) # Salted SHA-256 digest
    salt = Column(String(64), nullable=False)
    purpose = Column(String(50), default="CITIZEN_LOGIN", nullable=False) # CITIZEN_LOGIN, PHONE_VERIFY, 2FA
    is_used = Column(Boolean, default=False, nullable=False, index=True)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=5, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True) # IPv4 or IPv6
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="otp_verifications")

    @classmethod
    def create_record(
        cls,
        phone_number: str,
        raw_code: str,
        expires_at: datetime,
        purpose: str = "CITIZEN_LOGIN",
        user_id: int = None,
        ip_address: str = None,
        user_agent: str = None
    ) -> "OTPVerification":
        """Factory method to salt and hash the raw OTP code before persistence."""
        salt = secrets.token_hex(16)
        salted_payload = f"{salt}:{raw_code}".encode("utf-8")
        otp_hash = hashlib.sha256(salted_payload).hexdigest()
        return cls(
            phone_number=phone_number,
            user_id=user_id,
            otp_hash=otp_hash,
            salt=salt,
            purpose=purpose,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )

    def verify_code(self, candidate_code: str) -> bool:
        """
        Constant-time verification of candidate OTP code.
        Increments attempt count and marks record used upon success.
        """
        if self.is_used:
            return False
        if self.attempts >= self.max_attempts:
            return False
        
        now = datetime.now(timezone.utc)
        if self.expires_at.tzinfo is None:
            # Compare naive UTC
            if datetime.now(timezone.utc).replace(tzinfo=None) > self.expires_at:
                return False
        elif now > self.expires_at:
            return False

        self.attempts += 1
        salted_candidate = f"{self.salt}:{candidate_code}".encode("utf-8")
        candidate_hash = hashlib.sha256(salted_candidate).hexdigest()

        if secrets.compare_digest(self.otp_hash, candidate_hash):
            self.is_used = True
            self.verified_at = now
            return True
        return False

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        if self.expires_at.tzinfo is None:
            return datetime.now(timezone.utc).replace(tzinfo=None) > self.expires_at
        return now > self.expires_at
