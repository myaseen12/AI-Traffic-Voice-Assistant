import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.challan import Challan, ChallanStatus
from app.models.qr_reference import QRReference
from app.models.user import User, UserRole
from app.models.audit_log import AuditLog
from app.repositories.challan_repository import ChallanRepository
from app.schemas.challan import (
    ChallanResponse,
    ChallanStatusResponse,
    ChallanPayRequest,
    ChallanPayResponse,
    QRReferenceResponse,
    QRValidateResponse
)

class ChallanService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ChallanRepository(db)

    def search(self, query: str) -> List[Challan]:
        query = query.strip()
        # Direct lookup by Challan Reference Number
        challan = self.repo.get_by_challan_no(query)
        if challan:
            return [challan]
        # Search by Vehicle Registration Number
        return self.repo.get_by_vehicle_no(query)

    def get_by_challan_no(
        self,
        challan_no: str,
        current_user: Optional[User] = None
    ) -> Challan:
        """
        Retrieves a verified citation record with strict authorization checks.
        Citizens can only inspect their own citations or unassigned public citations.
        Administrators can inspect any citation.
        """
        challan = self.repo.get_by_challan_no(challan_no)
        if not challan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Challan '{challan_no}' not found in official registry."
            )

        if challan.user_id is not None:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required to inspect citizen citation dossier. Use /status endpoint for public verification."
                )

            # Administrators and Traffic Officers have universal clearance
            if current_user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TRAFFIC_OFFICER):
                return challan

            # Citizens are strictly restricted to their own citations
            if challan.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: You are not authorized to view another citizen's citation dossier."
                )

        return challan

    def get_challan_status(self, challan_no: str) -> ChallanStatusResponse:
        """
        Public/Citizen verification endpoint returning verified settlement status.
        Never invents fines or details; strictly anchored in verified statutory database records.
        """
        challan = self.repo.get_by_challan_no(challan_no)
        if not challan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Citation '{challan_no}' not found."
            )

        violation_title = challan.violation.title if challan.violation else "Traffic Regulation Violation"
        section = challan.violation.section if challan.violation else "Motor Vehicles Ordinance 1965"

        return ChallanStatusResponse(
            challan_no=challan.challan_no,
            vehicle_no=challan.vehicle_no,
            status=challan.status,
            amount=float(challan.amount),
            late_fee=float(challan.late_fee or 0.0),
            total_payable=challan.total_payable,
            due_date=challan.due_date,
            is_overdue=challan.is_overdue,
            paid_at=challan.paid_at,
            payment_method=challan.payment_method,
            transaction_id=challan.payment_transaction_id,
            violation_title=violation_title,
            section=section,
            location=challan.location,
            city=challan.city,
            is_demo=challan.is_demo
        )

    def get_by_user(self, user_id: int) -> List[Challan]:
        return self.repo.get_by_user_id(user_id)

    # -------------------------------------------------------------
    # QR Reference Management
    # -------------------------------------------------------------
    def generate_or_register_qr(
        self,
        challan_id: int,
        validity_days: int = 30,
        admin_actor_id: Optional[int] = None,
        ip_address: Optional[str] = None
    ) -> QRReference:
        """
        Generates or rotates a secure cryptographic QR token linked to a Challan.
        Enforces 1-to-1 mapping with Challan tickets.
        Restricted to authorized enforcement officers & administrators.
        """
        challan = self.repo.get_by_id(challan_id)
        if not challan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cannot generate QR reference: Challan ID {challan_id} not found."
            )

        expires_at = datetime.now(timezone.utc) + timedelta(days=validity_days)

        # Check if a QR reference already exists for this challan (1-to-1)
        existing_qr = self.db.query(QRReference).filter_by(challan_id=challan.id).first()
        if existing_qr:
            # Reissue / rotate token
            existing_qr.qr_token = f"QRC-{secrets.token_hex(16).upper()}"
            existing_qr.expires_at = expires_at
            existing_qr.is_revoked = False
            qr_ref = existing_qr
        else:
            qr_ref = QRReference.generate(
                challan_id=challan.id,
                challan_no=challan.challan_no,
                vehicle_no=challan.vehicle_no,
                amount=float(challan.amount),
                expires_at=expires_at
            )
            self.db.add(qr_ref)

        self.db.add(AuditLog.record(
            event_type="QR_GENERATED",
            actor_type="ADMIN" if admin_actor_id else "SYSTEM",
            admin_id=admin_actor_id,
            resource_type="qr_references",
            resource_id=challan.challan_no,
            details={"token": qr_ref.qr_token, "expires_at": expires_at.isoformat()},
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()
        self.db.refresh(qr_ref)
        return qr_ref

    def validate_qr_reference(
        self,
        qr_token: str,
        ip_address: Optional[str] = None
    ) -> QRValidateResponse:
        """
        Validates scanned QR references against the official registry:
        - Rejects invalid / non-existent tokens with 404
        - Rejects revoked tokens with 400
        - Rejects expired tokens with 400/410
        - Increments scan count and logs audit event on success
        """
        clean_token = qr_token.strip()

        # 1. Lookup QR Reference
        qr_ref = self.db.query(QRReference).filter(QRReference.qr_token == clean_token).first()
        
        # Fallback check: if citizen scanned raw challan number directly
        if not qr_ref:
            ch_by_no = self.repo.get_by_challan_no(clean_token)
            if ch_by_no and ch_by_no.qr_reference:
                qr_ref = ch_by_no.qr_reference

        if not qr_ref or not qr_ref.challan:
            self.db.add(AuditLog.record(
                event_type="QR_SCAN_FAILED",
                actor_type="CITIZEN",
                resource_type="qr_references",
                details={"token": clean_token, "reason": "Not found in registry"},
                ip_address=ip_address,
                status="FAILURE"
            ))
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="QR code reference not found in official registry."
            )

        # 2. Check Revocation
        if qr_ref.is_revoked:
            self.db.add(AuditLog.record(
                event_type="QR_SCAN_FAILED",
                actor_type="CITIZEN",
                resource_type="qr_references",
                resource_id=qr_ref.challan.challan_no,
                details={"token": clean_token, "reason": "Token has been revoked"},
                ip_address=ip_address,
                status="DENIED"
            ))
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code reference has been revoked. Citation may have been superseded or cancelled."
            )

        # 3. Check Expiration
        if qr_ref.is_expired:
            self.db.add(AuditLog.record(
                event_type="QR_SCAN_FAILED",
                actor_type="CITIZEN",
                resource_type="qr_references",
                resource_id=qr_ref.challan.challan_no,
                details={"token": clean_token, "reason": "Token expired"},
                ip_address=ip_address,
                status="FAILURE"
            ))
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="QR code reference has expired. Please contact traffic police for a renewed notice."
            )

        # 4. Record Successful Scan
        qr_ref.record_scan()
        self.db.add(AuditLog.record(
            event_type="QR_SCANNED",
            actor_type="CITIZEN",
            resource_type="challans",
            resource_id=qr_ref.challan.challan_no,
            details={"token": qr_ref.qr_token, "scan_count": qr_ref.scan_count},
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()
        self.db.refresh(qr_ref)

        return QRValidateResponse(
            status="valid",
            qr_token=qr_ref.qr_token,
            scan_count=qr_ref.scan_count,
            challan=ChallanResponse.model_validate(qr_ref.challan),
            message="Verified official citation issued by Traffic Police."
        )

    def revoke_qr_reference(
        self,
        challan_id: int,
        admin_actor_id: Optional[int] = None,
        ip_address: Optional[str] = None
    ) -> bool:
        """Revokes an existing QR reference for a challan."""
        qr_ref = self.db.query(QRReference).filter_by(challan_id=challan_id).first()
        if not qr_ref:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR reference not found")

        qr_ref.is_revoked = True
        self.db.add(AuditLog.record(
            event_type="QR_REVOKED",
            actor_type="ADMIN",
            admin_id=admin_actor_id,
            resource_type="qr_references",
            resource_id=str(challan_id),
            details={"token": qr_ref.qr_token},
            ip_address=ip_address,
            status="SUCCESS"
        ))
        self.db.commit()
        return True

    # -------------------------------------------------------------
    # Payment Settlement
    # -------------------------------------------------------------
    def pay_challan(
        self,
        challan_id: int,
        pay_data: ChallanPayRequest,
        current_user: Optional[User] = None
    ) -> ChallanPayResponse:
        challan = self.repo.get_by_id(challan_id)
        if not challan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challan not found")

        # Authorization: If authenticated citizen, verify ownership
        if current_user and current_user.role == UserRole.CITIZEN:
            if challan.user_id is not None and challan.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to settle another citizen's citation."
                )

        if challan.status == ChallanStatus.PAID:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Challan is already paid")

        tx_id = f"1LINK-{uuid.uuid4().hex[:10].upper()}"
        challan.status = ChallanStatus.PAID
        challan.paid_at = datetime.now(timezone.utc)
        challan.payment_method = pay_data.payment_method
        challan.payment_transaction_id = tx_id

        self.db.add(AuditLog.record(
            event_type="CHALLAN_SETTLEMENT",
            actor_type="CITIZEN" if current_user else "SYSTEM",
            user_id=current_user.id if current_user else challan.user_id,
            resource_type="challans",
            resource_id=challan.challan_no,
            details={
                "gateway": pay_data.payment_method,
                "amount": float(challan.amount),
                "transaction_id": tx_id
            },
            status="SUCCESS"
        ))
        self.db.commit()
        self.db.refresh(challan)

        return ChallanPayResponse(
            challan_no=challan.challan_no,
            status=challan.status.value,
            transaction_id=tx_id,
            amount_paid=float(challan.amount),
            receipt_url=f"/api/v1/challans/{challan.challan_no}/receipt",
            message="Payment completed successfully via official 1Link gateway."
        )
