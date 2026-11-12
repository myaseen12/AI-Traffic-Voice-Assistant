from typing import Optional, List
from datetime import datetime
from decimal import Decimal
import enum
from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer

class RuleVerificationStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    UNVERIFIED = "UNVERIFIED"
    DEPRECATED = "DEPRECATED"

class TrafficRuleBase(BaseModel):
    rule_code: str = Field(..., min_length=2, max_length=50, description="Statutory rule identifier, e.g. MVO-SEC-89A")
    section: str = Field(..., min_length=2, max_length=120, description="Statutory legal section, e.g. Section 89-A, Motor Vehicles Ordinance 1965")
    title: str = Field(..., min_length=2, max_length=255, description="Rule title in English")
    title_ur: Optional[str] = Field(None, max_length=255, description="Rule title in Urdu (اردو)")
    title_ps: Optional[str] = Field(None, max_length=255, description="Rule title in Pashto (پښتو)")
    description: str = Field(..., min_length=5, description="Official statutory explanation in English")
    description_ur: Optional[str] = Field(None, description="Official civic explanation in Urdu")
    description_ps: Optional[str] = Field(None, description="Official civic explanation in Pashto")
    category: str = Field("General", max_length=64, description="Violation category e.g. Speed Regulation, Safety Equipment")
    fine_amount: Decimal = Field(..., ge=0, description="Statutory fine penalty amount in PKR")
    penalty_points: int = Field(0, ge=0, description="Demerit points assigned to driving license")
    source: str = Field(..., min_length=3, max_length=255, description="Official enactment / Gazette publication reference")
    jurisdiction: str = Field(..., min_length=2, max_length=120, description="Applicable region / command e.g. Islamabad Capital Territory, Motorways")
    source_wording: Optional[str] = Field(None, description="Verbatim statutory text from official legislation")
    source_url: Optional[str] = Field(None, max_length=500, description="Official Pakistan Code or Gazette link")
    verification_status: RuleVerificationStatus = Field(RuleVerificationStatus.VERIFIED, description="Verification standing")
    is_active: bool = Field(True, description="Whether rule is active for enforcement")

    @field_validator("rule_code", "section", "source", "jurisdiction", mode="before")
    @classmethod
    def strip_and_validate_non_empty(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("Field cannot be empty or blank")
        return v

    @field_validator("fine_amount", mode="before")
    @classmethod
    def validate_fine_amount(cls, v):
        if v is not None and Decimal(str(v)) < 0:
            raise ValueError("Fine amount cannot be negative")
        return v

class TrafficRuleCreate(TrafficRuleBase):
    pass

class TrafficRuleUpdate(BaseModel):
    rule_code: Optional[str] = Field(None, min_length=2, max_length=50)
    section: Optional[str] = Field(None, min_length=2, max_length=120)
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    title_ur: Optional[str] = Field(None, max_length=255)
    title_ps: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, min_length=5)
    description_ur: Optional[str] = None
    description_ps: Optional[str] = None
    category: Optional[str] = Field(None, max_length=64)
    fine_amount: Optional[Decimal] = Field(None, ge=0)
    penalty_points: Optional[int] = Field(None, ge=0)
    source: Optional[str] = Field(None, min_length=3, max_length=255)
    jurisdiction: Optional[str] = Field(None, min_length=2, max_length=120)
    source_wording: Optional[str] = None
    source_url: Optional[str] = Field(None, max_length=500)
    verification_status: Optional[RuleVerificationStatus] = None
    is_active: Optional[bool] = None
    verification_notes: Optional[str] = None

class TrafficRuleVerifyRequest(BaseModel):
    verification_status: RuleVerificationStatus = Field(..., description="Target verification status (VERIFIED, UNVERIFIED, etc.)")
    verification_notes: Optional[str] = Field(None, description="Audit note documenting legal gazette cross-reference")
    source_wording: Optional[str] = Field(None, description="Updated verbatim statutory wording")
    source_url: Optional[str] = Field(None, description="Official legal repository reference URL")

class TrafficRuleResponse(TrafficRuleBase):
    id: int
    is_verified: bool
    penalty_amount: float # Legacy compatibility alias for fine_amount
    verified_by_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    localized_title: Optional[str] = None
    localized_description: Optional[str] = None
    language_used: Optional[str] = "en"
    verification_badge: Optional[str] = None
    statutory_disclaimer: str = (
        "Statutory traffic regulation under Pakistani law (Motor Vehicles Ordinance 1965 / NHSO 2000). "
        "Fines and points reflect verified gazetted legal schedules."
    )

    @field_serializer("fine_amount")
    def serialize_fine_amount(self, v) -> float:
        return float(v) if v is not None else 0.0

    model_config = ConfigDict(from_attributes=True)

class ClassifiedSearchResult(BaseModel):
    status: str = Field(..., description="Classification: 'VERIFIED', 'UNVERIFIED', or 'UNAVAILABLE'")
    query: Optional[str] = None
    category: Optional[str] = None
    jurisdiction: Optional[str] = None
    language: str = "en"
    total_results: int
    rules: List[TrafficRuleResponse]
    guidance_message: str
    caution_warning: Optional[str] = None
    statutory_disclaimer: str = "Official statutory traffic law under Pakistan legal code. No arbitrary fines may be assessed."
