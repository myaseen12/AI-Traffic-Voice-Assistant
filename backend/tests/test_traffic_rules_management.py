import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.models import User, UserRole, TrafficRule, Challan
from app.models.traffic_rule import RuleVerificationStatus
from app.auth.jwt_handler import create_access_token

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_auth_and_rules():
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

        # 2. Citizen Account
        citizen = db.query(User).filter_by(phone_number="03009876543").first()
        if not citizen:
            citizen = User(
                full_name="Citizen Tester",
                phone_number="03009876543",
                role=UserRole.CITIZEN,
                is_active=True,
                is_verified=True
            )
            db.add(citizen)
            db.commit()
            db.refresh(citizen)

        admin_token = create_access_token({"sub": str(admin.id), "role": "admin"})
        citizen_token = create_access_token({"sub": str(citizen.id), "role": "citizen"})

        return {
            "admin_token": admin_token,
            "citizen_token": citizen_token,
            "admin_id": admin.id,
        }
    finally:
        db.close()

# -------------------------------------------------------------
# 1. Public Retrieval, Multilingual Support & Filtering
# -------------------------------------------------------------
def test_public_get_traffic_rules_default():
    res = client.get("/api/v1/traffic-rules")
    assert res.status_code == 200
    rules = res.json()
    assert isinstance(rules, list)
    assert len(rules) >= 5

    sample = rules[0]
    # Every rule must include its source, jurisdiction, and verification status
    assert "source" in sample and len(sample["source"]) > 0
    assert "jurisdiction" in sample and len(sample["jurisdiction"]) > 0
    assert "verification_status" in sample
    assert sample["verification_status"] == "VERIFIED"
    assert sample["is_verified"] is True
    assert "statutory_disclaimer" in sample

def test_public_filter_rules_by_category():
    res = client.get("/api/v1/traffic-rules?category=Speed")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 1
    assert any("Speed" in r["category"] for r in rules)

def test_public_filter_rules_by_jurisdiction():
    res = client.get("/api/v1/traffic-rules?jurisdiction=Highways")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 1
    for r in rules:
        assert "Highways" in r["jurisdiction"]

def test_public_search_rules_keyword_english():
    res = client.get("/api/v1/traffic-rules?search=helmet")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 1
    assert any("Helmet" in r["title"] or "helmet" in r["description"].lower() for r in rules)

def test_public_search_rules_keyword_urdu():
    res = client.get("/api/v1/traffic-rules?search=ہیلمٹ")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 1
    assert any("89-A" in r["section"] or "ہیلمٹ" in (r.get("title_ur") or "") for r in rules)

def test_public_search_rules_keyword_pashto():
    res = client.get("/api/v1/traffic-rules?search=سرعت")
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 1
    assert any("112" in r["section"] or "سرعت" in (r.get("description_ps") or "") for r in rules)

def test_public_get_rule_by_code():
    res = client.get("/api/v1/traffic-rules/MVO-SEC-89A")
    assert res.status_code == 200
    rule = res.json()
    assert rule["rule_code"] == "MVO-SEC-89A"
    assert "89-A" in rule["section"]
    assert rule["source"].startswith("Provincial Motor Vehicles Ordinance")
    assert rule["fine_amount"] == 1000.0
    assert rule["is_verified"] is True
    assert rule["source_wording"] is not None

def test_public_get_rule_by_numeric_id():
    # First get list to obtain valid ID
    list_res = client.get("/api/v1/traffic-rules")
    rule_id = list_res.json()[0]["id"]

    res = client.get(f"/api/v1/traffic-rules/{rule_id}")
    assert res.status_code == 200
    assert res.json()["id"] == rule_id

def test_public_get_rule_not_found_404():
    res = client.get("/api/v1/traffic-rules/NON-EXISTENT-RULE-9999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

def test_language_specific_content_urdu():
    res = client.get("/api/v1/traffic-rules/MVO-SEC-89A?language=ur")
    assert res.status_code == 200
    rule = res.json()
    assert rule["language_used"] == "ur"
    assert rule["localized_title"] == rule["title_ur"]
    # Authentic source wording is retained intact
    assert "Provincial Motor Vehicles Ordinance" in rule["source"]
    assert rule["source_wording"] is not None

def test_language_specific_content_pashto():
    res = client.get("/api/v1/traffic-rules/MVO-SEC-112?language=ps")
    assert res.status_code == 200
    rule = res.json()
    assert rule["language_used"] == "ps"
    assert rule["localized_title"] == rule["title_ps"]
    assert rule["source_wording"] is not None

# -------------------------------------------------------------
# 2. Distinction: Verified Rules vs Unverified vs Unavailable
# -------------------------------------------------------------
def test_classify_endpoint_verified_found():
    res = client.get("/api/v1/traffic-rules/classify?q=helmet")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "VERIFIED"
    assert data["total_results"] >= 1
    assert all(r["is_verified"] for r in data["rules"])
    assert "verified statutory" in data["guidance_message"].lower()

def test_classify_endpoint_unavailable_information():
    # Query for invented/non-existent violation
    res = client.get("/api/v1/traffic-rules/classify?q=driving_hovercraft_without_parachutes")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UNAVAILABLE"
    assert data["total_results"] == 0
    assert len(data["rules"]) == 0
    assert "unavailable information" in data["guidance_message"].lower()
    assert "cannot be fabricated" in data["guidance_message"].lower()

def test_taxonomies_endpoints():
    cat_res = client.get("/api/v1/traffic-rules/categories")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert isinstance(categories, list)
    assert any(c["category"] == "Safety Equipment" for c in categories)

    jur_res = client.get("/api/v1/traffic-rules/jurisdictions")
    assert jur_res.status_code == 200
    jurisdictions = jur_res.json()
    assert isinstance(jurisdictions, list)
    assert len(jurisdictions) >= 1

    status_res = client.get("/api/v1/traffic-rules/verification-statuses")
    assert status_res.status_code == 200
    statuses = status_res.json()
    assert any(s["status"] == "VERIFIED" for s in statuses)
    assert any(s["status"] == "UNVERIFIED" for s in statuses)

# -------------------------------------------------------------
# 3. Admin Management Endpoints & Role-Based Access Control
# -------------------------------------------------------------
def test_admin_create_traffic_rule_authorized(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['admin_token']}"}
    payload = {
        "rule_code": "NHSO-SEC-75-LANE",
        "section": "Section 75, National Highway Safety Ordinance 2000",
        "title": "Lane Discipline and Slow Vehicle Stride Violation",
        "title_ur": "لین ڈسپلن اور سست رفتار گاڑی کی خلاف ورزی",
        "title_ps": "د لین دسپلین او سست موټر چلولو سرغړونه",
        "description": "Failing to maintain designated slow/fast lane compliance on multi-lane motorways.",
        "description_ur": "موٹروے یا ہائی وے پر مقررہ لین قوانین کی پابندی نہ کرنا۔",
        "description_ps": "په موټروې د ټاکل شوي لین نه مراعات کول.",
        "category": "Lane Compliance",
        "fine_amount": 1500.0,
        "penalty_points": 2,
        "source": "National Highway Safety Ordinance, 2000 (Section 75; Lane rules)",
        "jurisdiction": "National Highways & Motorways (NHMP)",
        "source_wording": "Every driver shall observe the lane markings and lane disciplines prescribed for motorways.",
        "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
        "verification_status": "VERIFIED",
        "is_active": True
    }
    res = client.post("/api/v1/admin/traffic-rules", json=payload, headers=headers)
    assert res.status_code == 201
    created = res.json()
    assert created["rule_code"] == "NHSO-SEC-75-LANE"
    assert created["fine_amount"] == 1500.0
    assert created["is_verified"] is True
    assert created["verified_by_id"] == setup_auth_and_rules["admin_id"]

def test_admin_create_duplicate_code_conflict(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['admin_token']}"}
    payload = {
        "rule_code": "NHSO-SEC-75-LANE", # Duplicate
        "section": "Section 75, NHSO 2000",
        "title": "Lane Violation Duplicate",
        "description": "Duplicate rule code test.",
        "category": "Lane Compliance",
        "fine_amount": 1500.0,
        "penalty_points": 1,
        "source": "NHSO 2000",
        "jurisdiction": "Motorways"
    }
    res = client.post("/api/v1/admin/traffic-rules", json=payload, headers=headers)
    assert res.status_code == 409
    assert "already exists" in res.json()["detail"].lower()

def test_admin_create_rule_negative_fine_rejected(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['admin_token']}"}
    payload = {
        "rule_code": "TEST-NEG-FINE",
        "section": "Section 999",
        "title": "Invalid Negative Fine",
        "description": "Should fail validation.",
        "category": "General",
        "fine_amount": -500.0, # Negative fine forbidden
        "penalty_points": 0,
        "source": "MVO 1965",
        "jurisdiction": "Punjab"
    }
    res = client.post("/api/v1/admin/traffic-rules", json=payload, headers=headers)
    assert res.status_code == 422 # Pydantic validation error

def test_admin_update_traffic_rule(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['admin_token']}"}
    # Retrieve created rule
    get_res = client.get("/api/v1/traffic-rules/NHSO-SEC-75-LANE")
    rule_id = get_res.json()["id"]

    update_payload = {
        "fine_amount": 2000.0, # Updated statutory fine
        "penalty_points": 3,
        "verification_notes": "Fine revised per official 2026 gazette amendment."
    }
    res = client.put(f"/api/v1/admin/traffic-rules/{rule_id}", json=update_payload, headers=headers)
    assert res.status_code == 200
    updated = res.json()
    assert updated["fine_amount"] == 2000.0
    assert updated["penalty_points"] == 3
    assert updated["verification_notes"] == "Fine revised per official 2026 gazette amendment."

def test_admin_patch_verification_status(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['admin_token']}"}
    get_res = client.get("/api/v1/traffic-rules/NHSO-SEC-75-LANE")
    rule_id = get_res.json()["id"]

    # Change to UNVERIFIED for testing classification
    patch_payload = {
        "verification_status": "UNVERIFIED",
        "verification_notes": "Pending supreme court appellate review on motorway jurisdiction."
    }
    res = client.patch(f"/api/v1/admin/traffic-rules/{rule_id}/verify", json=patch_payload, headers=headers)
    assert res.status_code == 200
    assert res.json()["verification_status"] == "UNVERIFIED"
    assert res.json()["is_verified"] is False

    # Check that /classify returns UNVERIFIED warning
    classify_res = client.get("/api/v1/traffic-rules/classify?q=Lane Discipline")
    assert classify_res.status_code == 200
    assert classify_res.json()["status"] in ("UNVERIFIED", "MIXED")
    assert classify_res.json()["caution_warning"] is not None

    # Restore to VERIFIED
    restore_payload = {
        "verification_status": "VERIFIED",
        "verification_notes": "Re-verified against official gazette notification."
    }
    res_restored = client.patch(f"/api/v1/admin/traffic-rules/{rule_id}/verify", json=restore_payload, headers=headers)
    assert res_restored.status_code == 200
    assert res_restored.json()["verification_status"] == "VERIFIED"
    assert res_restored.json()["is_verified"] is True

def test_admin_delete_traffic_rule(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['admin_token']}"}
    get_res = client.get("/api/v1/traffic-rules/NHSO-SEC-75-LANE")
    rule_id = get_res.json()["id"]

    res = client.delete(f"/api/v1/admin/traffic-rules/{rule_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"

# -------------------------------------------------------------
# 4. Security: Citizen & Unauthenticated Calls Blocked
# -------------------------------------------------------------
def test_admin_endpoints_citizen_forbidden_403(setup_auth_and_rules):
    headers = {"Authorization": f"Bearer {setup_auth_and_rules['citizen_token']}"}
    payload = {
        "rule_code": "FORBIDDEN-RULE",
        "section": "Section X",
        "title": "Citizen Should Be Blocked",
        "description": "Citizen cannot add rules.",
        "fine_amount": 1000.0,
        "source": "Invalid",
        "jurisdiction": "None"
    }
    res = client.post("/api/v1/admin/traffic-rules", json=payload, headers=headers)
    assert res.status_code == 403 # Forbidden for citizens

def test_admin_endpoints_unauthenticated_rejected_401():
    res = client.post("/api/v1/admin/traffic-rules", json={"rule_code": "FAIL"})
    assert res.status_code == 401 # Unauthorized
