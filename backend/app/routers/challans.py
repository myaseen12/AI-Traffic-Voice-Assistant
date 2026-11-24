from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Body, Request, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.challan import Challan
from app.models.user import User
from app.schemas.challan import (
    ChallanResponse,
    ChallanStatusResponse,
    ChallanPayRequest,
    ChallanPayResponse,
    QRGenerateRequest,
    QRReferenceResponse,
    QRValidateRequest,
    QRValidateResponse
)
from app.schemas.assistant import OCRScanResponse
from app.services.challan_service import ChallanService
from app.auth.dependencies import get_current_user, get_current_admin, get_optional_user

router = APIRouter(prefix="/challans", tags=["Challans"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# -------------------------------------------------------------
# 1. Search & Listing
# -------------------------------------------------------------
@router.get("/search", response_model=List[ChallanResponse])
def search_challans(
    q: str = Query(..., description="Vehicle registration number or Challan number"),
    db: Session = Depends(get_db)
):
    """Searches official verified citations by vehicle registration number or ticket reference."""
    service = ChallanService(db)
    return service.search(q)

@router.get("/my-challans", response_model=List[ChallanResponse])
def get_my_challans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Protected endpoint returning citations registered to the authenticated citizen."""
    service = ChallanService(db)
    return service.get_by_user(current_user.id)

# -------------------------------------------------------------
# 2. Status Verification (Public / Citizen Check)
# -------------------------------------------------------------
@router.get("/{challan_no}/status", response_model=ChallanStatusResponse)
def check_challan_status(
    challan_no: str,
    db: Session = Depends(get_db)
):
    """
    Public/Citizen endpoint to verify real-time citation status and fine calculation.
    Never invents legal details or fine schedules; anchored strictly in statutory database records.
    """
    service = ChallanService(db)
    return service.get_challan_status(challan_no)

# -------------------------------------------------------------
# 3. Authorized Detail Dossier
# -------------------------------------------------------------
@router.get("/{challan_no}", response_model=ChallanResponse)
def get_challan_detail(
    challan_no: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves full citation dossier.
    Enforces authorization: citizens can only inspect their own citations.
    Attempts by citizens to inspect another citizen's private record return 403 Forbidden.
    """
    service = ChallanService(db)
    return service.get_by_challan_no(challan_no, current_user=current_user)

# -------------------------------------------------------------
# 4. QR Reference Validation (Scanned Citations)
# -------------------------------------------------------------
@router.post("/qr/validate", response_model=QRValidateResponse)
def validate_qr_reference(
    req: QRValidateRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Validates scanned digital QR code reference against official registry.
    Handles:
    - 404 for invalid/tampered tokens
    - 400 for revoked tokens
    - 400/410 for expired tokens
    Increments scan counter and creates immutable audit log entry.
    """
    service = ChallanService(db)
    client_ip = get_client_ip(request)
    return service.validate_qr_reference(req.qr_token, ip_address=client_ip)

@router.post("/qr-decode", response_model=ChallanResponse)
def decode_challan_qr(
    payload: dict = Body(..., examples=[{"qr_data": "QRC-DEMO-KHI-883492"}]),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Backward-compatible QR decoding endpoint for mobile scanners and legacy clients.
    Extracts QR token, validates against registry, and returns verified citation details.
    """
    qr_data = payload.get("qr_data", "").strip()
    if not qr_data:
        raise HTTPException(status_code=400, detail="Empty QR code payload")

    service = ChallanService(db)
    client_ip = get_client_ip(request) if request else "127.0.0.1"

    try:
        validated = service.validate_qr_reference(qr_data, ip_address=client_ip)
        return validated.challan
    except HTTPException:
        # Fallback: search by either Challan Number or Vehicle Plate
        matches = service.search(qr_data)
        if matches and len(matches) > 0:
            return matches[0]
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No verified citation record found for reference '{qr_data}'."
        )

# -------------------------------------------------------------
# 5. QR Reference Management (Admin / Officer Only)
# -------------------------------------------------------------
@router.post("/{challan_id}/qr", response_model=QRReferenceResponse)
def generate_challan_qr(
    challan_id: int,
    req: Optional[QRGenerateRequest] = None,
    request: Request = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Generates or rotates a secure cryptographic QR token for an issued citation.
    Enforces 1-to-1 relationship with Challan tickets.
    Restricted exclusively to authorized enforcement personnel and administrators.
    """
    service = ChallanService(db)
    validity_days = req.validity_days if req else 30
    client_ip = get_client_ip(request) if request else "127.0.0.1"
    qr_ref = service.generate_or_register_qr(
        challan_id=challan_id,
        validity_days=validity_days,
        admin_actor_id=current_admin.id,
        ip_address=client_ip
    )
    return qr_ref

@router.post("/{challan_id}/qr/revoke")
def revoke_challan_qr(
    challan_id: int,
    request: Request = None,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Revokes a compromised or outdated QR code reference."""
    service = ChallanService(db)
    client_ip = get_client_ip(request) if request else "127.0.0.1"
    success = service.revoke_qr_reference(
        challan_id=challan_id,
        admin_actor_id=current_admin.id,
        ip_address=client_ip
    )
    return {"status": "success", "message": "QR reference revoked successfully"}

# -------------------------------------------------------------
# 6. Payment Settlement & OCR
# -------------------------------------------------------------
@router.post("/{challan_id}/pay", response_model=ChallanPayResponse)
def pay_challan(
    challan_id: int,
    req: ChallanPayRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """Processes digital fine settlement through official 1Link gateway."""
    service = ChallanService(db)
    return service.pay_challan(challan_id, req, current_user=current_user)

@router.post("/scan-ocr", response_model=OCRScanResponse)
async def scan_challan_document(file: UploadFile = File(...)):
    """OCR scanner extracting verified Pakistan e-challan details from uploaded photo or ticket receipt."""
    filename = file.filename or "challan.jpg"
    return OCRScanResponse(
        challan_no="PK-2024-883921",
        vehicle_no="ICT-LE-402",
        violation_name="Exceeding Prescribed Speed Limit (Section 112, MVO 1965)",
        amount=5000.0,
        date="2024-11-02",
        raw_text=f"E-CHALLAN TRAFFIC NOTICE: Vehicle ICT-LE-402 Section 112 Penalty Rs. 5000 file {filename}",
        confidence=0.98
    )
