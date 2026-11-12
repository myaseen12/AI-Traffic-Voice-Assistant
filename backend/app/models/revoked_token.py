from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class RevokedToken(Base):
    """
    Registry of blacklisted / revoked JWT identifiers (JTI).
    Populated upon explicit citizen or administrator logout to prevent replay attacks.
    """
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token_jti = Column(String(64), unique=True, index=True, nullable=False) # JWT unique identifier
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), index=True, nullable=False) # Token original exp to enable auto-cleanup

    # Relationships
    user = relationship("User")

    @classmethod
    def revoke(cls, jti: str, user_id: int, expires_at: datetime) -> "RevokedToken":
        return cls(
            token_jti=jti,
            user_id=user_id,
            expires_at=expires_at
        )

    def is_expired(self) -> bool:
        now = datetime.now(timezone.utc)
        if self.expires_at.tzinfo is None:
            return datetime.now(timezone.utc).replace(tzinfo=None) > self.expires_at
        return now > self.expires_at
