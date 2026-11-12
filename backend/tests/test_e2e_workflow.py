import pytest
import io
import wave
import struct
import base64
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.models.challan import Challan, ChallanStatus
from app.models.violation import Violation
from app.models.traffic_rule import TrafficRule, RuleVerificationStatus
from app.models.qr_reference import QRReference
from app.models.otp_verification import OTPVerification
from app.auth.jwt_handler import create_access_token
from app.auth.rate_limiter import auth_rate_limiter

client = TestClient(app)

def create_synthetic_wav(duration_sec: float = 1.0, freq: float = 440.0) -> bytes:
    """Generates valid WAV audio bytes in memory for testing audio endpoints."""
    sample_rate = 16000
    num_samples = int(sample_rate * duration_sec)
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        frames = bytearray()
        import math
        for i in range(num_samples):
            val = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * freq * (i / sample_rate)))
            frames.extend(struct.pack("<h", val))
        wav_file.writeframes(frames)
    return buffer.getvalue()


@pytest.fixture(scope="module")
def setup_e2e_data():
    """Sets up a test database with verified rules, citizen, challan, and QR code."""
    db: Session = SessionLocal()
    try:
        # 1. Create or retrieve test citizen
        citizen = db.query(User).filter(User.phone_number == "03009988776").first()
        if not citizen:
            citizen = User(
                phone_number="03009988776",
                full_name="Muhammad Zeeshan",
                email="zeeshan.test@example.com",
                role=UserRole.CITIZEN,
                preferred_language="en",
                is_active=True,
                is_verified=True
            )
            db.add(citizen)
            db.commit()
            db.refresh(citizen)

        # 2. Create or retrieve test admin
        admin = db.query(User).filter(User.phone_number == "+923001112233").first()
        if not admin:
            admin = User(
                phone_number="+923001112233",
                full_name="Traffic Superintendent",
                email="admin.test@traffic.gov.pk",
                role=UserRole.ADMIN,
                preferred_language="en",
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 3. Create or retrieve violation rule
        rule = db.query(TrafficRule).filter(TrafficRule.rule_code == "MVO-113-SPEED").first()
        if not rule:
            rule = TrafficRule(
                rule_code="MVO-113-SPEED",
                section="Section 113, Motor Vehicles Ordinance 1965",
                title="Exceeding Prescribed Speed Limit",
                title_ur="مقررہ رفتار سے تجاوز",
                title_ps="د ټاکلي سرعت څخه تجاوز",
                description="Penalty for driving above legal speed limits on public highways.",
                category="Speeding",
                fine_amount=5000.0,
                penalty_points=3,
                jurisdiction="National Highways & Motorways",
                source="Motor Vehicles Ordinance 1965",
                verification_status=RuleVerificationStatus.VERIFIED.value,
                is_active=True
            )
            db.add(rule)
            db.commit()
            db.refresh(rule)

        # 4. Create citizen challan
        challan = db.query(Challan).filter(Challan.challan_no == "E2E-CH-2026-9001").first()
        if not challan:
            challan = Challan(
                challan_no="E2E-CH-2026-9001",
                vehicle_no="ICT-ABC-9001",
                amount=5000.0,
                status=ChallanStatus.PENDING,
                location="Kashmir Highway (Srinagar Highway), Islamabad",
                user_id=citizen.id,
                rule_id=rule.id,
                issued_at=datetime.now(timezone.utc),
                due_date=datetime.now(timezone.utc) + timedelta(days=14)
            )
            db.add(challan)
            db.commit()
            db.refresh(challan)
        else:
            challan.user_id = citizen.id
            db.commit()
            db.refresh(challan)

        # 5. Create valid QR reference
        qr_ref = db.query(QRReference).filter(QRReference.challan_id == challan.id).first()
        if not qr_ref:
            qr_ref = QRReference.generate(
                challan_id=challan.id,
                challan_no=challan.challan_no,
                vehicle_no=challan.vehicle_no,
                amount=float(challan.amount)
            )
            db.add(qr_ref)
            db.commit()
            db.refresh(qr_ref)

        yield {
            "citizen": citizen,
            "admin": admin,
            "challan": challan,
            "qr_ref": qr_ref,
            "rule": rule
        }
    finally:
        db.close()


# -----------------------------------------------------------------------------
# 1. Full Citizen Journey: English
# -----------------------------------------------------------------------------
def test_e2e_complete_workflow_english(setup_e2e_data):
    """
    Tests complete workflow:
    1. Scan QR code -> valid reference
    2. Request OTP & Verify OTP -> receives access token
    3. Select English language
    4. View authorized challan details
    5. Ask question via Assistant (Speeding Section 113)
    6. Whisper transcription + RAG retrieval + Llama 3 grounded response + Coqui TTS audio
    7. Retrieve conversation history
    """
    data = setup_e2e_data

    # Step 1: Scan QR code
    qr_res = client.post("/api/v1/challans/qr/validate", json={"qr_token": data["qr_ref"].qr_token})
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert qr_data["status"].lower() == "valid"
    assert qr_data["challan"]["challan_no"] == "E2E-CH-2026-9001"

    # Step 2: Request OTP
    auth_rate_limiter.clear()
    phone = "03009988776"
    otp_req = client.post("/api/v1/auth/send-otp", json={
        "phone_number": phone
    })
    assert otp_req.status_code == 200
    otp_code = otp_req.json().get("otp_demo")
    assert otp_code is not None

    # Verify OTP
    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "phone_number": phone,
        "otp": otp_code
    })
    assert verify_res.status_code == 200
    auth_data = verify_res.json()
    token = auth_data["access_token"]
    assert token is not None

    headers = {"Authorization": f"Bearer {token}"}

    # Step 3: Select Language (English)
    lang_res = client.patch("/api/v1/auth/preferred-language", json={"language": "en"}, headers=headers)
    assert lang_res.status_code == 200

    # Step 4: View Authorized Challans
    my_challans = client.get("/api/v1/challans/my-challans", headers=headers)
    assert my_challans.status_code == 200
    challans_list = my_challans.json()
    assert len(challans_list) >= 1
    assert any(c["challan_no"] == "E2E-CH-2026-9001" for c in challans_list)

    dash_res = client.get("/api/v1/citizens/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["user"]["phone"] == data["citizen"].phone_number

    # Step 5: Ask Question (Voice/Text Assistant Query)
    session_id = "e2e-session-en-001"
    query_res = client.post("/api/v1/assistant/query", json={
        "query_text": "What is the penalty for exceeding the prescribed speed limit?",
        "language": "en",
        "session_id": session_id,
        "user_id": data["citizen"].id
    }, headers=headers)
    assert query_res.status_code == 200
    ai_data = query_res.json()

    # Step 6: Verify Grounded RAG + Llama 3 Answer
    assert ai_data["status"] == "VERIFIED"
    assert ai_data["is_grounded"] is True
    assert "113" in ai_data["reply_text"] or "5,000" in ai_data["reply_text"]
    assert ai_data["rag_sources"] is not None
    assert len(ai_data["rag_sources"]) >= 1
    assert "113" in ai_data["rag_sources"][0]["section"]

    # Step 7: Verify Spoken Audio Output
    assert ai_data["audio_base64"] is not None
    assert len(ai_data["audio_base64"]) > 50
    assert ai_data["audio_format"] in ["wav", "mp3"]

    # Step 8: Verify Conversation History
    hist_res = client.get(f"/api/v1/assistant/history/{session_id}", headers=headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert len(hist_data["messages"]) >= 2  # user message + assistant reply


# -----------------------------------------------------------------------------
# 2. Full Citizen Journey: Urdu
# -----------------------------------------------------------------------------
def test_e2e_complete_workflow_urdu(setup_e2e_data):
    """
    Tests complete workflow in Urdu (اردو):
    - Selects Urdu
    - Asks question in Urdu regarding safety helmet
    - RAG retrieves Section 89-A
    - Llama 3 answers in fluent Urdu
    - TTS synthesizes Urdu audio
    """
    data = setup_e2e_data
    token = create_access_token(data={"sub": str(data["citizen"].id), "phone": data["citizen"].phone_number, "role": "citizen"})
    headers = {"Authorization": f"Bearer {token}"}

    # Select Urdu
    client.patch("/api/v1/auth/preferred-language", json={"language": "ur"}, headers=headers)

    session_id = "e2e-session-ur-002"
    query_res = client.post("/api/v1/assistant/query", json={
        "query_text": "ہیلمٹ نہ پہننے پر کتنا جرمانہ ہے؟",
        "language": "ur",
        "session_id": session_id,
        "user_id": data["citizen"].id
    }, headers=headers)

    assert query_res.status_code == 200
    ai_data = query_res.json()
    assert ai_data["status"] == "VERIFIED"
    assert ai_data["is_grounded"] is True
    # Urdu title or 2000 rupees fine
    assert "89-A" in ai_data["reply_text"] or "2,000" in ai_data["reply_text"] or "ہیلمٹ" in ai_data["reply_text"]
    assert ai_data["audio_base64"] is not None


# -----------------------------------------------------------------------------
# 3. Full Citizen Journey: Pashto
# -----------------------------------------------------------------------------
def test_e2e_complete_workflow_pashto(setup_e2e_data):
    """
    Tests complete workflow in Pashto (پښتو):
    - Asks question in Pashto regarding red light signal violation
    - RAG retrieves Section 112
    - Llama 3 answers in Pashto
    - TTS synthesizes audio
    """
    data = setup_e2e_data
    token = create_access_token(data={"sub": str(data["citizen"].id), "phone": data["citizen"].phone_number, "role": "citizen"})
    headers = {"Authorization": f"Bearer {token}"}

    session_id = "e2e-session-ps-003"
    query_res = client.post("/api/v1/assistant/query", json={
        "query_text": "د سرې اشارې ماتولو جریمه څومره ده؟",
        "language": "ps",
        "session_id": session_id,
        "user_id": data["citizen"].id
    }, headers=headers)

    assert query_res.status_code == 200
    ai_data = query_res.json()
    assert ai_data["status"] == "VERIFIED"
    assert ai_data["is_grounded"] is True
    assert "112" in ai_data["reply_text"] or "2,500" in ai_data["reply_text"] or "اشار" in ai_data["reply_text"]
    assert ai_data["audio_base64"] is not None


# -----------------------------------------------------------------------------
# 4. Whisper STT Audio Pipeline Test
# -----------------------------------------------------------------------------
def test_e2e_whisper_voice_pipeline(setup_e2e_data):
    """
    Tests audio file upload -> Whisper speech transcription -> Grounded answer.
    """
    data = setup_e2e_data
    wav_bytes = create_synthetic_wav(duration_sec=1.5, freq=500.0)

    files = {"file": ("recording.wav", wav_bytes, "audio/wav")}
    data_form = {
        "language": "en",
        "session_id": "e2e-audio-session-004",
        "user_id": str(data["citizen"].id)
    }

    res = client.post("/api/v1/assistant/voice-audio", files=files, data=data_form)
    assert res.status_code == 200
    resp_json = res.json()
    assert "reply_text" in resp_json
    assert "transcript" in resp_json
    assert "audio_base64" in resp_json


# -----------------------------------------------------------------------------
# 5. Edge Cases & Security Tests
# -----------------------------------------------------------------------------
def test_e2e_invalid_qr_code():
    """Scans non-existent QR reference -> Returns 404."""
    res = client.post("/api/v1/challans/qr/validate", json={"qr_token": "QRC-INVALID-NONEXISTENT"})
    assert res.status_code in (404, 400)

def test_e2e_expired_otp():
    """Submits expired OTP -> Returns 400."""
    auth_rate_limiter.clear()
    phone = "03445556677"
    db = SessionLocal()
    expired_record = OTPVerification.create_record(
        phone_number=phone,
        raw_code="987654",
        expires_at=datetime.now(timezone.utc) - timedelta(minutes=10)
    )
    db.add(expired_record)
    db.commit()
    db.close()

    res = client.post("/api/v1/auth/verify-otp", json={
        "phone_number": phone,
        "otp": "987654"
    })
    assert res.status_code == 400
    assert "expired" in res.json().get("detail", "").lower()

def test_e2e_unauthorized_access():
    """Accessing protected endpoints without Bearer token -> Returns 401."""
    res = client.get("/api/v1/challans/my-challans")
    assert res.status_code == 401

def test_e2e_unsupported_out_of_scope_query():
    """
    Submits out-of-scope question with zero traffic relevance ->
    Guarantees status='UNAVAILABLE' and zero hallucinated penalties.
    """
    res = client.post("/api/v1/assistant/query", json={
        "query_text": "What is the official penalty for flying a drone in heavy rain?",
        "language": "en"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UNAVAILABLE"
    assert data["is_grounded"] is False
    assert "unavailable" in data["reply_text"].lower()

def test_e2e_unclear_voice_audio():
    """Submits empty/silent audio -> Returns uncertainty indication."""
    empty_bytes = b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80>\x00\x00\x00}\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    files = {"file": ("silent.wav", empty_bytes, "audio/wav")}
    res = client.post("/api/v1/assistant/transcribe", files=files, data={"language": "en"})
    assert res.status_code in (200, 400)
    if res.status_code == 200:
        data = res.json()
        assert data["is_uncertain"] is True

def test_e2e_admin_permissions(setup_e2e_data):
    """
    Verifies that a regular citizen CANNOT access admin management endpoints (403),
    while an authorized admin can.
    """
    data = setup_e2e_data

    citizen_token = create_access_token(data={"sub": str(data["citizen"].id), "phone": data["citizen"].phone_number, "role": "citizen"})
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}

    # Citizen tries to access admin dashboard
    res_citizen = client.get("/api/v1/admin/dashboard", headers=citizen_headers)
    assert res_citizen.status_code == 403

    # Admin accesses admin dashboard
    admin_token = create_access_token(data={"sub": str(data["admin"].id), "phone": data["admin"].phone_number, "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    res_admin = client.get("/api/v1/admin/dashboard", headers=admin_headers)
    assert res_admin.status_code == 200
    assert "metrics" in res_admin.json()
