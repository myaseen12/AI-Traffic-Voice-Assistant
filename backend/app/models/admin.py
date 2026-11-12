import json
from datetime import datetime, timezone
from typing import List
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship, validates
from app.database.base import Base

class AdminRole(Base):
    """
    Role definition for administrative and enforcement personnel.
    Stores assigned capabilities and access levels.
    """
    __tablename__ = "admin_roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False) # e.g. "SUPER_ADMIN", "OPERATIONS_ADMIN", "TRAFFIC_WARDEN"
    description = Column(String(255), nullable=True)
    permissions = Column(Text, nullable=False, default="[]") # JSON array string of permission codes
    is_system_role = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    admin_users = relationship("AdminUser", back_populates="role")

    def get_permissions(self) -> List[str]:
        try:
            return json.loads(self.permissions)
        except Exception:
            return []

    def set_permissions(self, perms: List[str]):
        self.permissions = json.dumps(perms)

    def has_permission(self, perm: str) -> bool:
        perms = self.get_permissions()
        return "*" in perms or perm in perms

class AdminUser(Base):
    """
    Administrative operator account.
    Accesses administrative portal, audit logs, safe-city feeds, and rule management.
    """
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    hashed_password = Column(String(255), nullable=False) # Bcrypt or PBKDF2 hash
    badge_number = Column(String(50), unique=True, index=True, nullable=True) # e.g. "TP-KHI-0491"
    department = Column(String(100), default="Traffic Police Headquarters", nullable=False)
    role_id = Column(Integer, ForeignKey("admin_roles.id", ondelete="RESTRICT"), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    role = relationship("AdminRole", back_populates="admin_users")
    audit_logs = relationship("AuditLog", back_populates="admin", foreign_keys="[AuditLog.admin_id]")

    @validates("email")
    def validate_email(self, key, email_val: str) -> str:
        if not email_val or "@" not in email_val:
            raise ValueError(f"Invalid admin email address: {email_val}")
        return email_val.strip().lower()
