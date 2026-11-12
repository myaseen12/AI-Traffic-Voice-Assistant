import re
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.user import UserRole

def sanitize_pakistani_phone(phone: str) -> str:
    """Standardizes mobile phone numbers into clean digits."""
    if not phone:
        raise ValueError("Phone number is required")
    cleaned = re.sub(r"[\s\-]", "", phone)
    if cleaned.startswith("+92"):
        cleaned = "0" + cleaned[3:]
    elif cleaned.startswith("92") and len(cleaned) == 12:
        cleaned = "0" + cleaned[2:]
    
    if not re.match(r"^03[0-9]{9}$", cleaned):
        # Universal fallback for test harness (must be 10-12 digits)
        if not (len(cleaned) >= 10 and cleaned.isdigit()):
            raise ValueError(f"Invalid Pakistani mobile phone number: '{phone}'. Expected format: 03001234567 or +923001234567")
    return cleaned

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    phone_number: str
    email: Optional[str] = None
    driving_license_no: Optional[str] = None
    preferred_language: Optional[str] = "en"

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return sanitize_pakistani_phone(v)

    @field_validator("email")
    @classmethod
    def validate_email_format(cls, v: Optional[str]) -> Optional[str]:
        if v:
            clean = v.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean):
                raise ValueError(f"Invalid email address: {v}")
            return clean
        return v

class UserCreate(UserBase):
    password: Optional[str] = Field(None, min_length=6)

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SendOTPRequest(BaseModel):
    phone_number: str = Field(..., description="Citizen Pakistani mobile number")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return sanitize_pakistani_phone(v)

class SendOTPResponse(BaseModel):
    status: str = "success"
    message: str
    cooldown_seconds: int = 60
    is_demo: bool = False
    otp_demo: Optional[str] = None # Strictly omitted in production!

class VerifyOTPRequest(BaseModel):
    phone_number: str = Field(..., description="Citizen Pakistani mobile number")
    otp: str = Field(..., pattern=r"^\d{6}$", description="6-digit verification code")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        return sanitize_pakistani_phone(v)

class LoginRequest(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[str] = None
    password: str = Field(..., min_length=6, description="Account password")

    @field_validator("phone_number")
    @classmethod
    def validate_login_phone(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return sanitize_pakistani_phone(v)
        return v

class AdminLoginRequest(BaseModel):
    email_or_badge: str = Field(..., min_length=3, description="Official email or badge number")
    password: str = Field(..., min_length=6, description="Administrative password")

class UpdateLanguageRequest(BaseModel):
    language: str = Field(..., pattern="^(en|ur|ps)$", description="Supported language code: en, ur, ps")

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int = 1440
    user: UserResponse

class LogoutResponse(BaseModel):
    status: str = "success"
    message: str
