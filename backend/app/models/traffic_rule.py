import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship, validates
from app.database.base import Base

class RuleVerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    UNVERIFIED = "UNVERIFIED"
    DEPRECATED = "DEPRECATED"

class TrafficRule(Base):
    """
    Statutory traffic violation rules anchored in Pakistani law:
    - Provincial Motor Vehicles Ordinance (MVO) 1965
    - National Highway Safety Ordinance (NHSO) 2000
    Includes verified multilingual titles, descriptions, statutory sources,
    jurisdictions, and verification statuses.
    """
    __tablename__ = "traffic_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. "MVO-SEC-89A"
    section = Column(String(120), index=True, nullable=False) # e.g. "Section 89-A, MVO 1965"
    
    # Multilingual Titles
    title = Column(String(255), nullable=False) # English
    title_ur = Column(String(255), nullable=True) # Urdu (اردو)
    title_ps = Column(String(255), nullable=True) # Pashto (پښتو)

    # Multilingual Detailed Descriptions
    description = Column(Text, nullable=False) # English
    description_ur = Column(Text, nullable=True) # Urdu (اردو)
    description_ps = Column(Text, nullable=True) # Pashto (پښتو)

    category = Column(String(64), index=True, default="General", nullable=False) # e.g. "Safety Equipment", "Speed Regulation"
    fine_amount = Column(Numeric(10, 2), nullable=False) # Statutory penalty in PKR
    penalty_points = Column(Integer, default=0, nullable=False) # Demerit points
    legal_authority = Column(String(150), default="Motor Vehicles Ordinance 1965", nullable=False)
    
    # Statutory Source & Verification Details
    source = Column(String(255), default="Provincial Motor Vehicles Ordinance 1965", nullable=False) # Legal source citation / Gazette
    jurisdiction = Column(String(120), default="National Highways & Urban Roads", nullable=False, index=True) # e.g. ICT, Motorways, Punjab
    verification_status = Column(String(32), default=RuleVerificationStatus.VERIFIED.value, nullable=False, index=True) # VERIFIED / UNVERIFIED / PENDING_VERIFICATION / DEPRECATED
    source_wording = Column(Text, nullable=True) # Exact verbatim statutory text from legislation
    source_url = Column(String(500), nullable=True) # Official legal code/gazette reference link
    
    verified_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_notes = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True, index=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    challans = relationship("Challan", back_populates="traffic_rule", foreign_keys="[Challan.rule_id]")
    kb_documents = relationship("KnowledgeBaseDocument", back_populates="traffic_rule")
    verified_by = relationship("User", foreign_keys=[verified_by_id])

    @validates("fine_amount")
    def validate_fine_amount(self, key, amount):
        if amount is not None and float(amount) < 0:
            raise ValueError("Fine amount cannot be negative")
        return amount

    @property
    def is_verified(self) -> bool:
        return self.verification_status == RuleVerificationStatus.VERIFIED.value or self.verification_status == "VERIFIED"

    @property
    def penalty_amount(self) -> float:
        """Compatibility property for legacy code referring to violation.penalty_amount."""
        return float(self.fine_amount) if self.fine_amount is not None else 0.0

    @penalty_amount.setter
    def penalty_amount(self, value):
        self.fine_amount = value

    def get_localized_content(self, lang: str = "en") -> dict:
        """Returns localized titles and explanations while preserving statutory source wording."""
        if lang == "ur":
            return {
                "title": self.title_ur or self.title,
                "description": self.description_ur or self.description,
                "language": "ur"
            }
        elif lang == "ps":
            return {
                "title": self.title_ps or self.title,
                "description": self.description_ps or self.description,
                "language": "ps"
            }
        return {
            "title": self.title,
            "description": self.description,
            "language": "en"
        }

# Export Violation and RuleVerificationStatus as aliases for complete backward compatibility
Violation = TrafficRule
