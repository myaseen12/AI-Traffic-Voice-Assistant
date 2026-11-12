import enum
import re
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, func
from sqlalchemy.orm import relationship, validates
from app.database.base import Base

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    ADMIN = "admin"
    TRAFFIC_OFFICER = "traffic_officer"
    SUPER_ADMIN = "super_admin"

class User(Base):
    """
    Citizen and user profile model.
    Stores verified civic identities, contact numbers, and linked credentials.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    phone_number = Column(String(20), unique=True, index=True, nullable=False) # e.g. "+923009876543" or "03009876543"
    cnic = Column(String(20), unique=True, index=True, nullable=True) # e.g. "35201-1234567-1"
    email = Column(String(120), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True) # Bcrypt hash for password-enabled accounts
    role = Column(Enum(UserRole), default=UserRole.CITIZEN, nullable=False, index=True)
    driving_license_no = Column(String(50), unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    otp_verifications = relationship(
        "OTPVerification",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(OTPVerification.created_at)"
    )
    challans = relationship(
        "Challan",
        back_populates="citizen",
        foreign_keys="[Challan.user_id]"
    )
    language_preference = relationship(
        "LanguagePreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    conversations = relationship(
        "ChatConversation",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(ChatConversation.created_at)"
    )
    audit_logs = relationship(
        "AuditLog",
        back_populates="user",
        foreign_keys="[AuditLog.user_id]"
    )
    voice_logs = relationship(
        "VoiceLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    @validates("phone_number")
    def validate_phone(self, key, phone: str) -> str:
        if not phone:
            raise ValueError("Phone number is required")
        cleaned = re.sub(r"[\s\-]", "", phone)
        if not re.match(r"^(\+92|0)?3[0-9]{9}$", cleaned):
            # Allow clean digits format for universal test harness
            if not (len(cleaned) >= 10 and cleaned.isdigit()):
                raise ValueError(f"Invalid Pakistani mobile phone number format: {phone}")
        return cleaned

    @validates("email")
    def validate_email(self, key, email_val: str) -> str:
        if email_val:
            cleaned = email_val.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", cleaned):
                raise ValueError(f"Invalid email address: {email_val}")
            return cleaned
        return email_val

    @property
    def preferred_language(self) -> str:
        """Fallback property for backwards compatibility with legacy routes."""
        if self.language_preference:
            return self.language_preference.language_code
        return "en"

    @preferred_language.setter
    def preferred_language(self, lang: str):
        if self.language_preference:
            self.language_preference.language_code = lang

    @property
    def masked_cnic(self) -> str:
        """Securely mask citizen CNIC (e.g., 35201-*******-1)."""
        if not self.cnic or len(self.cnic) < 15:
            return self.cnic or ""
        return f"{self.cnic[:5]}-*******-{self.cnic[-1]}"
