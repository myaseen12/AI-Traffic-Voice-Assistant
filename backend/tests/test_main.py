import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["tagline"] == "Ask. Understand. Follow."
    assert "supported_languages" in data

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["rag_vector_store"] == "ready"

def test_traffic_rules_endpoint():
    response = client.get("/api/v1/traffic-rules")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_security_headers_and_middleware():
    response = client.get("/health")
    assert response.status_code == 200
    assert "X-Process-Time" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "SAMEORIGIN"

def test_centralized_error_handling_404():
    response = client.get("/api/v1/challans/NON_EXISTENT_CHALLAN_999999")
    assert response.status_code == 404
    data = response.json()
    assert data["status"] == "error"
    assert "detail" in data

def test_centralized_error_handling_422():
    response = client.post("/api/v1/auth/verify-otp", json={"invalid_field": 123})
    assert response.status_code == 422
    data = response.json()
    assert data["status"] == "error"
    assert "validation_errors" in data

def test_update_language_preference():
    phone = "03451122334"
    send_res = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert send_res.status_code == 200
    demo_otp = send_res.json()["otp_demo"]

    otp_res = client.post("/api/v1/auth/verify-otp", json={"phone_number": phone, "otp": demo_otp})
    assert otp_res.status_code == 200
    token = otp_res.json()["access_token"]
    
    # Update language to Urdu
    patch_res = client.patch(
        "/api/v1/auth/preferred-language",
        json={"language": "ur"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["preferred_language"] == "ur"

    # Update language to Pashto
    patch_res_ps = client.patch(
        "/api/v1/auth/preferred-language",
        json={"language": "ps"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert patch_res_ps.status_code == 200
    assert patch_res_ps.json()["preferred_language"] == "ps"

def test_admin_login_and_dashboard():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "hq@trafficpolice.gov.pk", "password": "Admin@123"}
    )
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "admin"
    admin_token = login_res.json()["access_token"]

    dash_res = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "metrics" in dash_data
    assert "total_challans" in dash_data["metrics"]
