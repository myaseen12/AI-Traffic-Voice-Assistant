from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship, validates
from app.database.base import Base

class LanguagePreference(Base):
    """
    Multilingual localization and speech synthesizer preferences for citizens:
    - Urdu (اردو) - RTL
    - Pashto (پښتو) - RTL
    - English (en) - LTR
    """
    __tablename__ = "language_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    language_code = Column(String(10), default="en", nullable=False) # "en", "ur", "ps"
    voice_preferred = Column(Boolean, default=True, nullable=False)
    speech_speed = Column(Float, default=1.0, nullable=False) # 0.75, 1.0, 1.25
    auto_play_voice = Column(Boolean, default=True, nullable=False)
    direction = Column(String(5), default="ltr", nullable=False) # "ltr" or "rtl"
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="language_preference")

    @validates("language_code")
    def validate_language(self, key, code: str) -> str:
        valid_codes = {"en", "ur", "ps"}
        clean = (code or "en").lower().strip()
        if clean not in valid_codes:
            raise ValueError(f"Unsupported language code '{code}'. Supported languages: {valid_codes}")
        # Auto-set text direction based on chosen language
        self.direction = "rtl" if clean in {"ur", "ps"} else "ltr"
        return clean
