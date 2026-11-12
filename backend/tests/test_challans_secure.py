import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.models import (
    User,
    UserRole,
    Challan,
    ChallanStatus,
    TrafficRule,
    QRReference,
    AdminUser
)
from app.auth.jwt_handler import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_test_data():
    """Seeds verified test fixtures for secure challan and QR testing."""
    db: Session = SessionLocal()
    try:
        # 1. Admin Account
        admin = db.query(User).filter_by(email="hq@trafficpolice.gov.pk").first()
        if not admin:
            admin = User(
                full_name="SP Headquarters",
                phone_number="03000000001",
                email="hq@trafficpolice.gov.pk",
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 2. Citizen Alpha
        citizen_a = db.query(User).filter_by(phone_number="03009876543").first()
        if not citizen_a:
            citizen_a = User(
                full_name="Citizen Alpha",
                phone_number="03009876543",
                role=UserRole.CITIZEN,
                is_active=True,
                is_verified=True
            )
            db.add(citizen_a)
            db.commit()
            db.refresh(citizen_a)

        # 3. Citizen Beta
        citizen_b = db.query(User).filter_by(phone_number="03335551234").first()
        if not citizen_b:
            citizen_b = User(
                full_name="Citizen Beta",
                phone_number="03335551234",
                role=UserRole.CITIZEN,
                is_active=True,
                is_verified=True
            )
            db.add(citizen_b)
            db.commit()
            db.refresh(citizen_b)

        # 4. Traffic Rule
        rule = db.query(TrafficRule).filter_by(rule_code="MVO-SEC-89A").first()
        if not rule:
            rule = TrafficRule(
                rule_code="MVO-SEC-89A",
                section="Section 89-A, Motor Vehicles Ordinance 1965",
                title="Riding Motorcycle Without Safety Helmet",
                description="Statutory helmet requirement under MVO 1965.",
                category="Safety Equipment",
                fine_amount=Decimal("1000.00"),
                penalty_points=2
            )
            db.add(rule)
            db.commit()
            db.refresh(rule)

        # 5. Challan for Citizen Alpha
        ch_a = db.query(Challan).filter_by(challan_no="TEST-SEC-CH-01").first()
        if not ch_a:
            ch_a = Challan(
                challan_no="TEST-SEC-CH-01",
                vehicle_no="ICT-AA-101",
                vehicle_type="Motorcycle",
                user_id=citizen_a.id,
                rule_id=rule.id,
                amount=Decimal("1000.00"),
                location="Faizabad Interchange, Islamabad",
                city="Islamabad",
                due_date=datetime.now(timezone.utc) + timedelta(days=14),
                is_demo=True
            )
            db.add(ch_a)
            db.commit()
            db.refresh(ch_a)

        # 6. Challan for Citizen Beta
        ch_b = db.query(Challan).filter_by(challan_no="TEST-SEC-CH-02").first()
        if not ch_b:
            ch_b = Challan(
                challan_no="TEST-SEC-CH-02",
                vehicle_no="KHI-BB-202",
                vehicle_type="Motor Car",
                user_id=citizen_b.id,
                rule_id=rule.id,
                amount=Decimal("2500.00"),
                location="Clifton Block 2, Karachi",
                city="Karachi",
                due_date=datetime.now(timezone.utc) + timedelta(days=10),
                is_demo=True
            )
            db.add(ch_b)
            db.commit()
            db.refresh(ch_b)

        # 7. QR Reference for Challan A (Valid)
        qr_valid = db.query(QRReference).filter_by(challan_id=ch_a.id).first()
        if not qr_valid:
            qr_valid = QRReference.generate(
                challan_id=ch_a.id,
                challan_no=ch_a.challan_no,
                vehicle_no=ch_a.vehicle_no,
                amount=float(ch_a.amount),
                expires_at=datetime.now(timezone.utc) + timedelta(days=30)
            )
            db.add(qr_valid)
            db.commit()
            db.refresh(qr_valid)

        # 8. Expired QR Reference (for testing expiration handling)
        ch_expired = db.query(Challan).filter_by(challan_no="TEST-SEC-CH-EXP").first()
        if not ch_expired:
            ch_expired = Challan(
                challan_no="TEST-SEC-CH-EXP",
                vehicle_no="LHR-EXP-001",
                vehicle_type="Motorcycle",
                user_id=citizen_a.id,
                rule_id=rule.id,
                amount=Decimal("1000.00"),
                location="Mall Road, Lahore",
                city="Lahore",
                due_date=datetime.now(timezone.utc) - timedelta(days=1),
                is_demo=True
            )
            db.add(ch_expired)
            db.commit()
            db.refresh(ch_expired)

            qr_exp = QRReference(
                qr_token="QRC-TEST-EXPIRED-TOKEN",
                challan_id=ch_expired.id,
                payload_data="{}",
                expires_at=datetime.now(timezone.utc) - timedelta(days=2) # Expired in the past!
            )
            db.add(qr_exp)
            db.commit()

        # 9. Revoked QR Reference (for testing revocation handling)
        ch_revoked = db.query(Challan).filter_by(challan_no="TEST-SEC-CH-REV").first()
        if not ch_revoked:
            ch_revoked = Challan(
                challan_no="TEST-SEC-CH-REV",
                vehicle_no="PEW-REV-999",
                vehicle_type="Motor Car",
                user_id=citizen_b.id,
                rule_id=rule.id,
                amount=Decimal("2000.00"),
                location="Saddar, Peshawar",
                city="Peshawar",
                due_date=datetime.now(timezone.utc) + timedelta(days=10),
                is_demo=True
            )
            db.add(ch_revoked)
            db.commit()
            db.refresh(ch_revoked)

            qr_rev = QRReference(
                qr_token="QRC-TEST-REVOKED-TOKEN",
                challan_id=ch_revoked.id,
                payload_data="{}",
                is_revoked=True,
                expires_at=datetime.now(timezone.utc) + timedelta(days=20)
            )
            db.add(qr_rev)
            db.commit()

        admin_token = create_access_token({"sub": str(admin.id), "role": "admin"})
        citizen_a_token = create_access_token({"sub": str(citizen_a.id), "role": "citizen"})
        citizen_b_token = create_access_token({"sub": str(citizen_b.id), "role": "citizen"})

        return {
            "admin_token": admin_token,
            "citizen_a_token": citizen_a_token,
            "citizen_b_token": citizen_b_token,
            "ch_a_id": ch_a.id,
            "ch_a_no": ch_a.challan_no,
            "ch_b_id": ch_b.id,
            "ch_b_no": ch_b.challan_no,
            "qr_valid_token": qr_valid.qr_token
        }
    finally:
        db.close()

# -------------------------------------------------------------
# 1. QR Reference Generation & Role-Based Access Control
# -------------------------------------------------------------
def test_generate_qr_admin_authorized(setup_test_data):
    headers = {"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    res = client.post(
        f"/api/v1/challans/{setup_test_data['ch_b_id']}/qr",
        json={"challan_id": setup_test_data['ch_b_id'], "validity_days": 45},
        headers=headers
    )
    assert res.status_code == 200
    data = res.json()
    assert data["qr_token"].startswith("QRC-")
    assert data["is_valid"] is True
    assert data["is_revoked"] is False

def test_generate_qr_citizen_forbidden(setup_test_data):
    headers = {"Authorization": f"Bearer {setup_test_data['citizen_a_token']}"}
    res = client.post(
        f"/api/v1/challans/{setup_test_data['ch_a_id']}/qr",
        json={"challan_id": setup_test_data['ch_a_id']},
        headers=headers
    )
    assert res.status_code == 403 # Forbidden for citizens

def test_generate_qr_unauthenticated_rejected(setup_test_data):
    res = client.post(f"/api/v1/challans/{setup_test_data['ch_a_id']}/qr")
    assert res.status_code == 401 # Unauthorized

# -------------------------------------------------------------
# 2. QR Reference Validation (Valid, Invalid, Expired, Revoked)
# -------------------------------------------------------------
def test_validate_qr_valid_token(setup_test_data):
    res = client.post(
        "/api/v1/challans/qr/validate",
        json={"qr_token": setup_test_data["qr_valid_token"]}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "valid"
    assert data["qr_token"] == setup_test_data["qr_valid_token"]
    assert data["scan_count"] >= 1
    assert data["challan"]["challan_no"] == setup_test_data["ch_a_no"]

def test_validate_qr_invalid_token():
    res = client.post(
        "/api/v1/challans/qr/validate",
        json={"qr_token": "QRC-NON-EXISTENT-FAKE-TOKEN"}
    )
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_validate_qr_expired_token():
    res = client.post(
        "/api/v1/challans/qr/validate",
        json={"qr_token": "QRC-TEST-EXPIRED-TOKEN"}
    )
    assert res.status_code == 400
    assert "expired" in res.json()["detail"].lower()

def test_validate_qr_revoked_token():
    res = client.post(
        "/api/v1/challans/qr/validate",
        json={"qr_token": "QRC-TEST-REVOKED-TOKEN"}
    )
    assert res.status_code == 400
    assert "revoked" in res.json()["detail"].lower()

# -------------------------------------------------------------
# 3. Challan Status Check (Public Verification)
# -------------------------------------------------------------
def test_check_challan_status(setup_test_data):
    res = client.get(f"/api/v1/challans/{setup_test_data['ch_a_no']}/status")
    assert res.status_code == 200
    data = res.json()
    assert data["challan_no"] == setup_test_data["ch_a_no"]
    assert data["status"] == "PENDING"
    assert data["amount"] == 1000.0
    assert data["total_payable"] == 1000.0
    assert "Helmet" in data["violation_title"]
    assert "Section 89-A" in data["section"]
    assert data["is_demo"] is True

# -------------------------------------------------------------
# 4. Authorized Dossier Retrieval & Cross-Citizen Privacy Protection
# -------------------------------------------------------------
def test_citizen_can_view_own_challan(setup_test_data):
    headers = {"Authorization": f"Bearer {setup_test_data['citizen_a_token']}"}
    res = client.get(f"/api/v1/challans/{setup_test_data['ch_a_no']}", headers=headers)
    assert res.status_code == 200
    assert res.json()["challan_no"] == setup_test_data["ch_a_no"]

def test_citizen_cannot_view_another_citizen_challan(setup_test_data):
    # Citizen A tries to view Citizen B's private citation
    headers = {"Authorization": f"Bearer {setup_test_data['citizen_a_token']}"}
    res = client.get(f"/api/v1/challans/{setup_test_data['ch_b_no']}", headers=headers)
    assert res.status_code == 403
    assert "authorized" in res.json()["detail"].lower()

def test_admin_can_view_any_citizen_challan(setup_test_data):
    headers = {"Authorization": f"Bearer {setup_test_data['admin_token']}"}
    res_a = client.get(f"/api/v1/challans/{setup_test_data['ch_a_no']}", headers=headers)
    assert res_a.status_code == 200
    res_b = client.get(f"/api/v1/challans/{setup_test_data['ch_b_no']}", headers=headers)
    assert res_b.status_code == 200

# -------------------------------------------------------------
# 5. Citizen Personal Citations Listing
# -------------------------------------------------------------
def test_get_my_challans_authenticated(setup_test_data):
    headers = {"Authorization": f"Bearer {setup_test_data['citizen_a_token']}"}
    res = client.get("/api/v1/challans/my-challans", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert any(c["challan_no"] == setup_test_data["ch_a_no"] for c in items)
    # Ensure Citizen B's citation is NOT in Citizen A's list
    assert not any(c["challan_no"] == setup_test_data["ch_b_no"] for c in items)

def test_get_my_challans_unauthenticated_rejected():
    res = client.get("/api/v1/challans/my-challans")
    assert res.status_code == 401
