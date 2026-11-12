import time
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.config import settings
from app.database.base import Base
from app.database.session import get_db
from app.models import (
    User,
    UserRole,
    OTPVerification,
    RevokedToken,
    AdminRole,
    AdminUser,
    AuditLog
)
from app.auth.jwt_handler import hash_password, verify_password, create_access_token
from app.auth.rate_limiter import auth_rate_limiter

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Ensure rate limits are clean between tests."""
    auth_rate_limiter.clear()
    yield
    auth_rate_limiter.clear()

# -------------------------------------------------------------
# 1. Citizen OTP Flow & Input Validation
# -------------------------------------------------------------
def test_send_otp_success_dev_mode():
    phone = "03119988771"
    res = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "cooldown_seconds" in data
    assert data["is_demo"] is True
    # In development mode, demo code is returned for local testing
    assert len(data["otp_demo"]) == 6

def test_send_otp_invalid_phone():
    res = client.post("/api/v1/auth/send-otp", json={"phone_number": "not-a-phone"})
    assert res.status_code == 422 # Pydantic input validation error

def test_send_otp_resend_cooldown():
    phone = "03225556677"
    # First request
    res1 = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert res1.status_code == 200

    # Immediate second request must trigger 429 Too Many Requests
    res2 = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert res2.status_code == 429
    assert "Retry-After" in res2.headers
    assert "Please wait" in res2.json()["detail"]

def test_verify_otp_success_and_token():
    phone = "03334445566"
    send_res = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert send_res.status_code == 200
    code = send_res.json()["otp_demo"]

    # Verify with correct OTP
    verify_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": phone, "otp": code}
    )
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["phone_number"] == phone
    assert data["user"]["role"] == "citizen"

    # Re-use must fail
    reuse_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": phone, "otp": code}
    )
    assert reuse_res.status_code == 400

def test_verify_otp_max_failed_attempts():
    phone = "03441112233"
    send_res = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert send_res.status_code == 200

    # Submit wrong OTP 5 times
    for _ in range(5):
        client.post(
            "/api/v1/auth/verify-otp",
            json={"phone_number": phone, "otp": "999999"}
        )

    # 6th attempt must be rejected for exceeding max attempts
    sixth_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": phone, "otp": "999999"}
    )
    assert sixth_res.status_code == 400
    assert "attempts" in sixth_res.json()["detail"].lower()

# -------------------------------------------------------------
# 2. Production vs Development Separation
# -------------------------------------------------------------
def test_production_mode_omits_demo_otp(monkeypatch):
    monkeypatch.setattr(settings, "OTP_MODE", "production")
    phone = "03123456789"
    res = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    assert res.status_code == 200
    data = res.json()
    assert data["is_demo"] is False
    assert data["otp_demo"] is None # Strictly omitted in production!

# -------------------------------------------------------------
# 3. Secure Password Hashing (Bcrypt)
# -------------------------------------------------------------
def test_bcrypt_password_hashing():
    raw_pwd = "SuperSecretPassword123!"
    hashed = hash_password(raw_pwd)
    
    assert hashed.startswith("$2b$")
    assert raw_pwd not in hashed
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

# -------------------------------------------------------------
# 4. Admin Authentication & Role-Based Access Control (RBAC)
# -------------------------------------------------------------
def test_admin_authentication_and_rbac():
    # Admin login
    admin_login = client.post(
        "/api/v1/auth/admin/login",
        json={"email_or_badge": "hq@trafficpolice.gov.pk", "password": "Admin@123"}
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]

    # Citizen login
    citizen_send = client.post("/api/v1/auth/send-otp", json={"phone_number": "03009876543"})
    citizen_code = citizen_send.json()["otp_demo"]
    citizen_verify = client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": "03009876543", "otp": citizen_code}
    )
    citizen_token = citizen_verify.json()["access_token"]

    # Admin access to /api/v1/admin/dashboard must succeed
    admin_dash = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert admin_dash.status_code == 200

    # Citizen access to /api/v1/admin/dashboard must be FORBIDDEN (403)
    citizen_dash = client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert citizen_dash.status_code == 403

    # Unauthenticated access must be UNAUTHORIZED (401)
    unauth_dash = client.get("/api/v1/admin/dashboard")
    assert unauth_dash.status_code == 401

# -------------------------------------------------------------
# 5. Logout and Token Revocation
# -------------------------------------------------------------
def test_logout_and_token_revocation():
    # Login as citizen
    phone = "03337778899"
    send_res = client.post("/api/v1/auth/send-otp", json={"phone_number": phone})
    code = send_res.json()["otp_demo"]
    verify_res = client.post(
        "/api/v1/auth/verify-otp",
        json={"phone_number": phone, "otp": code}
    )
    token = verify_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify protected endpoint works
    me_res1 = client.get("/api/v1/auth/me", headers=headers)
    assert me_res1.status_code == 200

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    assert logout_res.json()["status"] == "success"

    # Subsequent request using the revoked token must fail with 401
    me_res2 = client.get("/api/v1/auth/me", headers=headers)
    assert me_res2.status_code == 401
    assert "revoked" in me_res2.json()["detail"].lower()

# -------------------------------------------------------------
# 6. Login Lockout Protection
# -------------------------------------------------------------
def test_login_brute_force_lockout():
    identifier = "locked.user@example.com"
    # 5 consecutive failed attempts
    for _ in range(5):
        client.post(
            "/api/v1/auth/login",
            json={"email": identifier, "password": "BadPassword123"}
        )

    # 6th attempt must trigger 429 Too Many Requests
    lockout_res = client.post(
        "/api/v1/auth/login",
        json={"email": identifier, "password": "BadPassword123"}
    )
    assert lockout_res.status_code == 429
    assert "locked" in lockout_res.json()["detail"].lower()
