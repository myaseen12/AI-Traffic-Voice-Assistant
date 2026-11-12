import enum
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import Column, Integer, String, Text, Enum, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class MessageSenderType(str, enum.Enum):
    USER = "USER"
    ASSISTANT = "ASSISTANT"
    SYSTEM = "SYSTEM"

class ChatConversation(Base):
    """
    Multilingual conversation session for citizens and traffic voice assistant.
    Tracks context, user identity, linked challan inquiries, and preferred language.
    """
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(64), unique=True, index=True, nullable=False) # UUID identifier
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    challan_id = Column(Integer, ForeignKey("challans.id", ondelete="SET NULL"), nullable=True, index=True)
    language = Column(String(10), default="en", index=True, nullable=False) # "en", "ur", "ps"
    title = Column(String(255), default="Traffic Assistance Session", nullable=False)
    channel = Column(String(32), default="web_voice", nullable=False) # "web_voice", "web_text", "mobile"
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="conversations")
    challan = relationship("Challan", back_populates="conversations")
    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )

class ChatMessage(Base):
    """
    Individual turn in an AI traffic voice assistance interaction.
    Preserves transcribed speech, synthesized TTS response, detected intent,
    and verified statutory legal sources retrieved via RAG.
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(Enum(MessageSenderType), default=MessageSenderType.USER, index=True, nullable=False)
    content = Column(Text, nullable=False)
    audio_url = Column(String(500), nullable=True) # Storage path to WAV/MP3 query or TTS output
    audio_duration_ms = Column(Integer, nullable=True)
    detected_language = Column(String(10), nullable=True) # "ur", "ps", "en"
    detected_intent = Column(String(64), nullable=True) # e.g. "QUERY_CHALLAN_LEGALITY", "PAYMENT_OPTIONS"
    rag_sources = Column(Text, nullable=True) # JSON array of statutory sections and confidence scores
    feedback_rating = Column(Integer, nullable=True) # 1 to 5 rating or thumbs up/down
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)

    # Relationships
    conversation = relationship("ChatConversation", back_populates="messages")

    def get_rag_sources(self) -> List[Dict[str, Any]]:
        if not self.rag_sources:
            return []
        try:
            return json.loads(self.rag_sources)
        except Exception:
            return []

    def set_rag_sources(self, sources: List[Dict[str, Any]]):
        self.rag_sources = json.dumps(sources)
