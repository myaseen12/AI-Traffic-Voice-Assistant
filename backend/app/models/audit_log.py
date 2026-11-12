import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class AuditLog(Base):
    """
    Immutable audit trail recording critical civic transactions, administrative mutations,
    QR citation decodings, authentication events, and system security actions.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(64), index=True, nullable=False) # e.g. "CITIZEN_LOGIN", "QR_SCANNED", "CHALLAN_STATUS_UPDATE"
    severity = Column(String(20), default="INFO", index=True, nullable=False) # "INFO", "WARNING", "SECURITY", "CRITICAL"
    actor_type = Column(String(20), index=True, nullable=False) # "CITIZEN", "ADMIN", "SYSTEM", "API"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    resource_type = Column(String(50), nullable=True) # "challans", "traffic_rules", "users", "knowledge_base"
    resource_id = Column(String(100), nullable=True)
    action_details = Column(Text, nullable=True) # JSON payload of changed attributes or event parameters
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    status = Column(String(20), default="SUCCESS", nullable=False) # "SUCCESS", "FAILURE", "DENIED"
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="audit_logs", foreign_keys="[AuditLog.user_id]")
    admin = relationship("AdminUser", back_populates="audit_logs", foreign_keys="[AuditLog.admin_id]")

    @classmethod
    def record(
        cls,
        event_type: str,
        actor_type: str = "SYSTEM",
        severity: str = "INFO",
        user_id: Optional[int] = None,
        admin_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        status: str = "SUCCESS"
    ) -> "AuditLog":
        """Factory helper to construct an audit log entry."""
        details_str = json.dumps(details) if details is not None else None
        return cls(
            event_type=event_type,
            actor_type=actor_type,
            severity=severity,
            user_id=user_id,
            admin_id=admin_id,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else None,
            action_details=details_str,
            ip_address=ip_address,
            user_agent=user_agent,
            status=status
        )

    def get_details(self) -> Dict[str, Any]:
        if not self.action_details:
            return {}
        try:
            return json.loads(self.action_details)
        except Exception:
            return {}
