from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.user import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    LoginRequest,
    AdminLoginRequest,
    Token,
    UserResponse,
    UpdateLanguageRequest,
    LogoutResponse
)
from app.services.auth_service import AuthService
from app.auth.dependencies import get_current_user, oauth2_scheme
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_client_ip(request: Request) -> str:
    """Extract client IP respecting potential reverse proxy headers."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(req: SendOTPRequest, request: Request, db: Session = Depends(get_db)):
    """
    Initiates 2FA Citizen Mobile Verification.
    Applies rate limiting (60s cooldown, max 5 requests/hr).
    In development mode, returns demo OTP. In production, dispatches exclusively via SMS.
    """
    service = AuthService(db)
    client_ip = get_client_ip(request)
    return service.send_otp(req.phone_number, ip_address=client_ip)

@router.post("/verify-otp", response_model=Token)
def verify_otp(req: VerifyOTPRequest, request: Request, db: Session = Depends(get_db)):
    """
    Validates 6-digit OTP code against salted cryptographic database digest.
    Enforces expiration and locks after 5 failed attempts.
    Returns signed JWT access token and citizen profile.
    """
    service = AuthService(db)
    client_ip = get_client_ip(request)
    return service.verify_otp(req.phone_number, req.otp, ip_address=client_ip)

@router.post("/login", response_model=Token)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Unified credential authentication (email or mobile + password).
    Enforces account lockout on repeated failed attempts.
    """
    service = AuthService(db)
    identifier = req.email or req.phone_number or ""
    client_ip = get_client_ip(request)
    return service.login_password(identifier, req.password, ip_address=client_ip)

@router.post("/admin/login", response_model=Token)
def admin_login(req: AdminLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Dedicated Command & Control Headquarters / Officer login.
    Supports official police email or badge number with password authentication.
    """
    service = AuthService(db)
    client_ip = get_client_ip(request)
    return service.login_password(req.email_or_badge, req.password, ip_address=client_ip)

@router.post("/logout", response_model=LogoutResponse)
def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Secure session termination.
    Revokes the current JWT identifier (JTI) immediately.
    """
    service = AuthService(db)
    client_ip = get_client_ip(request)
    raw_token = getattr(current_user, "_current_token", token)
    return service.logout(raw_token, current_user, ip_address=client_ip)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Protected endpoint returning the currently authenticated user identity."""
    return current_user

@router.patch("/preferred-language", response_model=UserResponse)
def update_preferred_language(
    req: UpdateLanguageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Protected endpoint updating the citizen's preferred interface and TTS language."""
    current_user.preferred_language = req.language
    db.commit()
    db.refresh(current_user)
    return current_user
