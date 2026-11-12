from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.challan import ChallanStatus
from app.schemas.violation import ViolationResponse

class ChallanBase(BaseModel):
    challan_no: str = Field(..., description="Unique official e-challan citation number")
    vehicle_no: str = Field(..., description="Vehicle registration plate number")
    vehicle_type: Optional[str] = "Motorcycle"
    violation_id: int = Field(..., description="Foreign key to statutory traffic rule")
    amount: float = Field(..., ge=0, description="Base penalty in PKR")
    late_fee: Optional[float] = Field(0.0, ge=0, description="Late payment surcharge in PKR")
    location: str = Field(..., description="Location of infraction")
    city: Optional[str] = "Karachi"
    evidence_image_url: Optional[str] = None
    remarks: Optional[str] = None
    due_date: datetime

class ChallanCreate(ChallanBase):
    user_id: Optional[int] = None
    officer_badge_no: Optional[str] = None
    is_demo: Optional[bool] = False

class ChallanResponse(ChallanBase):
    id: int
    user_id: Optional[int] = None
    status: ChallanStatus
    issued_at: datetime
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    payment_transaction_id: Optional[str] = None
    is_demo: bool = False
    qr_token: Optional[str] = None
    violation: Optional[ViolationResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ChallanStatusResponse(BaseModel):
    challan_no: str
    vehicle_no: str
    status: ChallanStatus
    amount: float
    late_fee: float = 0.0
    total_payable: float
    due_date: datetime
    is_overdue: bool
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    violation_title: str
    section: str
    location: str
    city: str
    is_demo: bool = False

    model_config = ConfigDict(from_attributes=True)

class ChallanStatusUpdateRequest(BaseModel):
    status: ChallanStatus
    remarks: Optional[str] = None

class ChallanPayRequest(BaseModel):
    payment_method: str = Field("1Link", description="1Link, Easypaisa, JazzCash, NBP")
    transaction_reference: Optional[str] = None

class ChallanPayResponse(BaseModel):
    challan_no: str
    status: str
    transaction_id: str
    amount_paid: float
    receipt_url: Optional[str] = None
    message: str

# -------------------------------------------------------------
# QR Reference Schemas
# -------------------------------------------------------------
class QRGenerateRequest(BaseModel):
    challan_id: int = Field(..., description="Challan ID to bind QR reference")
    validity_days: Optional[int] = Field(30, ge=1, le=365, description="Validity period in days")

class QRReferenceResponse(BaseModel):
    id: int
    qr_token: str
    challan_id: int
    challan_no: str
    vehicle_no: str
    amount: float
    scan_count: int
    last_scanned_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_valid: bool
    is_revoked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QRValidateRequest(BaseModel):
    qr_token: str = Field(..., min_length=3, description="Scanned QR token or digital reference code")

class QRValidateResponse(BaseModel):
    status: str = "valid"
    qr_token: str
    scan_count: int
    challan: ChallanResponse
    message: str
