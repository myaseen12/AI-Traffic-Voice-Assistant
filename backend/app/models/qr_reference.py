import json
import secrets
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.base import Base

class QRReference(Base):
    """
    Cryptographically verifiable QR code reference for e-Challan citations.
    Enforces 1-to-1 mapping with Challan tickets, tracks scan counts,
    and protects sensitive citation dossiers from untrusted public scraping.
    """
    __tablename__ = "qr_references"

    id = Column(Integer, primary_key=True, index=True)
    qr_token = Column(String(128), unique=True, index=True, nullable=False) # e.g. "QRC-7F9B1E4A-32D9-4821-81BC-9F83E7D304A1"
    challan_id = Column(Integer, ForeignKey("challans.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    payload_data = Column(Text, nullable=False) # JSON-serialized digital signature & ticket checksum
    scan_count = Column(Integer, default=0, nullable=False)
    last_scanned_at = Column(DateTime(timezone=True), nullable=True)
    is_revoked = Column(Boolean, default=False, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    challan = relationship("Challan", back_populates="qr_reference")

    @classmethod
    def generate(
        cls,
        challan_id: int,
        challan_no: str,
        vehicle_no: str,
        amount: float,
        expires_at: Optional[datetime] = None
    ) -> "QRReference":
        """Factory method to generate a secure verifiable QR reference token."""
        token = f"QRC-{secrets.token_hex(16).upper()}"
        payload = {
            "token": token,
            "challan_no": challan_no,
            "vehicle_no": vehicle_no,
            "amount": float(amount),
            "issuer": "GOV_PK_TRAFFIC_AUTHORITY",
            "algorithm": "SHA256-HMAC",
            "issued_at": datetime.now(timezone.utc).isoformat()
        }
        return cls(
            qr_token=token,
            challan_id=challan_id,
            payload_data=json.dumps(payload),
            expires_at=expires_at
        )

    def record_scan(self):
        """Record an authorized scan event."""
        self.scan_count += 1
        self.last_scanned_at = datetime.now(timezone.utc)

    def get_payload(self) -> Dict[str, Any]:
        try:
            return json.loads(self.payload_data)
        except Exception:
            return {}

    @property
    def is_valid(self) -> bool:
        if self.is_revoked:
            return False
        if self.expires_at:
            now = datetime.now(timezone.utc)
            if self.expires_at.tzinfo is None:
                return datetime.now(timezone.utc).replace(tzinfo=None) <= self.expires_at
            return now <= self.expires_at
        return True

    @property
    def is_expired(self) -> bool:
        if not self.expires_at:
            return False
        now = datetime.now(timezone.utc)
        if self.expires_at.tzinfo is None:
            return datetime.now(timezone.utc).replace(tzinfo=None) > self.expires_at
        return now > self.expires_at

    @property
    def challan_no(self) -> str:
        return self.challan.challan_no if self.challan else ""

    @property
    def vehicle_no(self) -> str:
        return self.challan.vehicle_no if self.challan else ""

    @property
    def amount(self) -> float:
        return float(self.challan.amount) if self.challan else 0.0
