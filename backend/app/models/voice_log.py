from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class VoiceLog(Base):
    """
    Historical log of voice and speech assistant queries.
    Preserves detected intent, language, and response transcripts.
    """
    __tablename__ = "voice_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    query_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    detected_intent = Column(String(50), nullable=True) # e.g. "CHECK_CHALLAN", "TRAFFIC_RULE_QUERY", "PAYMENT_INFO"
    language = Column(String(10), default="en")
    audio_duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="voice_logs")
