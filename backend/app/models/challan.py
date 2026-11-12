import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum, ForeignKey, Text, Boolean, func
from sqlalchemy.orm import relationship, validates, synonym
from app.database.base import Base

class ChallanStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    DISPUTED = "DISPUTED"
    CANCELLED = "CANCELLED"
    OVERDUE = "OVERDUE"

class Challan(Base):
    """
    Electronic traffic violation citation (e-Challan) model.
    Anchored in statutory traffic rules, supports multi-city traffic police departments
    (Karachi, Lahore, Islamabad, Peshawar, Quetta), and links to secure QR verification.
    """
    __tablename__ = "challans"

    id = Column(Integer, primary_key=True, index=True)
    challan_no = Column(String(64), unique=True, index=True, nullable=False) # e.g. "KHI-2024-883492"
    vehicle_no = Column(String(32), index=True, nullable=False) # e.g. "LEA-24-9182", "ICT-LE-402"
    vehicle_type = Column(String(32), default="Motorcycle", nullable=False) # Motorcycle, Car, Commercial, HTV
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    rule_id = Column(Integer, ForeignKey("traffic_rules.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    amount = Column(Numeric(10, 2), nullable=False) # Fine amount in PKR
    late_fee = Column(Numeric(10, 2), default=0.00, nullable=False)
    status = Column(Enum(ChallanStatus), default=ChallanStatus.PENDING, index=True, nullable=False)
    
    location = Column(String(255), nullable=False) # e.g. "Sharah-e-Faisal near Baloch Colony, Karachi"
    city = Column(String(64), default="Karachi", index=True, nullable=False)
    evidence_image_url = Column(String(500), nullable=True) # ANPR camera capture URL
    issued_by_officer = Column(String(100), nullable=True)
    officer_badge_no = Column(String(50), nullable=True)
    remarks = Column(Text, nullable=True)
    
    issued_at = Column(DateTime(timezone=True), default=func.now(), index=True, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False, index=True)
    paid_at = Column(DateTime(timezone=True), nullable=True)
    payment_method = Column(String(50), nullable=True) # "1Link", "Easypaisa", "JazzCash", "NBP"
    payment_transaction_id = Column(String(100), nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False) # Clearly marks demonstration fixtures

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    citizen = relationship("User", back_populates="challans", foreign_keys="[Challan.user_id]")
    traffic_rule = relationship("TrafficRule", back_populates="challans", foreign_keys="[Challan.rule_id]")
    violation = synonym("traffic_rule") # Synonym for seamless joinedload(Challan.violation)

    qr_reference = relationship(
        "QRReference",
        back_populates="challan",
        uselist=False,
        cascade="all, delete-orphan"
    )
    conversations = relationship("ChatConversation", back_populates="challan")

    def __init__(self, **kwargs):
        # Allow violation_id as alias for rule_id in constructor
        if "violation_id" in kwargs and "rule_id" not in kwargs:
            kwargs["rule_id"] = kwargs.pop("violation_id")
        super().__init__(**kwargs)

    @property
    def violation_id(self) -> int:
        return self.rule_id

    @violation_id.setter
    def violation_id(self, value: int):
        self.rule_id = value

    @validates("amount")
    def validate_amount(self, key, amt):
        if amt is not None and float(amt) < 0:
            raise ValueError("Challan amount cannot be negative")
        return amt

    @property
    def qr_token(self) -> Optional[str]:
        return self.qr_reference.qr_token if self.qr_reference else None

    @property
    def is_overdue(self) -> bool:
        if self.status in (ChallanStatus.PAID, ChallanStatus.CANCELLED):
            return False
        now = datetime.now(timezone.utc)
        if self.due_date.tzinfo is None:
            return datetime.now(timezone.utc).replace(tzinfo=None) > self.due_date
        return now > self.due_date

    @property
    def total_payable(self) -> float:
        base = float(self.amount) if self.amount else 0.0
        late = float(self.late_fee) if self.late_fee else 0.0
        return base + late
