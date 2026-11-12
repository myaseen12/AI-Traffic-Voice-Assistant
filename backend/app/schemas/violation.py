from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.traffic_rule import TrafficRuleResponse, TrafficRuleCreate, RuleVerificationStatus

class ViolationBase(BaseModel):
    section: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = "General"
    penalty_amount: float
    penalty_points: Optional[int] = 0

class ViolationCreate(ViolationBase):
    rule_code: Optional[str] = None
    source: Optional[str] = "Provincial Motor Vehicles Ordinance 1965"
    jurisdiction: Optional[str] = "National Highways & Urban Roads"
    source_wording: Optional[str] = None
    verification_status: Optional[str] = "VERIFIED"

class ViolationResponse(ViolationBase):
    id: int
    created_at: datetime
    rule_code: Optional[str] = None
    source: Optional[str] = "Provincial Motor Vehicles Ordinance 1965"
    jurisdiction: Optional[str] = "National Highways & Urban Roads"
    verification_status: Optional[str] = "VERIFIED"

    model_config = ConfigDict(from_attributes=True)
