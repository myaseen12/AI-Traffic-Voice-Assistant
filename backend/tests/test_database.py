import pytest
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.models import (
    Base,
    User,
    UserRole,
    OTPVerification,
    AdminRole,
    AdminUser,
    TrafficRule,
    Challan,
    ChallanStatus,
    QRReference,
    ChatConversation,
    ChatMessage,
    MessageSenderType,
    LanguagePreference,
    KnowledgeBaseDocument,
    AuditLog,
    VoiceLog
)
from app.database.seeds import seed_database

# Use in-memory SQLite engine for fast, isolated database testing
TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

# -------------------------------------------------------------
# 1. Database Connectivity & Ping
# -------------------------------------------------------------
def test_database_connectivity(test_db):
    result = test_db.execute(text("SELECT 1")).scalar()
    assert result == 1

# -------------------------------------------------------------
# 2. Database Seeding & Demo Fixtures
# -------------------------------------------------------------
def test_seed_database_fixtures(test_db):
    seed_database(test_db)

    # Verify Admin Roles & Users
    super_admin_role = test_db.query(AdminRole).filter_by(name="SUPER_ADMIN").first()
    assert super_admin_role is not None
    assert super_admin_role.has_permission("*") is True

    admin_hq = test_db.query(AdminUser).filter_by(email="hq@trafficpolice.gov.pk").first()
    assert admin_hq is not None
    assert admin_hq.role.name == "SUPER_ADMIN"

    # Verify Traffic Rules
    helmet_rule = test_db.query(TrafficRule).filter_by(rule_code="MVO-SEC-89A").first()
    assert helmet_rule is not None
    assert "ہیلمٹ" in helmet_rule.title_ur
    assert helmet_rule.fine_amount == Decimal("1000.00")

    # Verify Citizens & Language Preferences
    citizen = test_db.query(User).filter_by(phone_number="03009876543").first()
    assert citizen is not None
    assert citizen.language_preference is not None
    assert citizen.language_preference.language_code == "ur"
    assert citizen.language_preference.direction == "rtl"

    # Verify Challans & QR References
    challans = test_db.query(Challan).filter_by(is_demo=True).all()
    assert len(challans) >= 4
    for ch in challans:
        assert ch.is_demo is True
        assert "[DEMO DATA]" in (ch.remarks or "")
        assert ch.qr_reference is not None
        assert ch.qr_reference.qr_token.startswith("QRC-")

    # Verify Knowledge Base Documents
    kb_doc = test_db.query(KnowledgeBaseDocument).filter_by(doc_uid="KB-MVO-SEC89A").first()
    assert kb_doc is not None
    assert kb_doc.traffic_rule.rule_code == "MVO-SEC-89A"

    # Verify Chat Conversation & Multilingual Messages
    conv = test_db.query(ChatConversation).filter_by(session_id="SESS-DEMO-URDU-001").first()
    assert conv is not None
    assert len(conv.messages) == 2
    assert conv.language == "ur"

    # Verify Audit Logs
    audit = test_db.query(AuditLog).filter_by(event_type="SYSTEM_BOOTSTRAP").first()
    assert audit is not None
    assert audit.status == "SUCCESS"

# -------------------------------------------------------------
# 3. User CRUD & Data Validation
# -------------------------------------------------------------
def test_user_crud_and_validation(test_db):
    # CREATE
    new_user = User(
        full_name="Babar Azam",
        phone_number="03112233445",
        cnic="35202-9988776-3",
        email="babar.azam@example.pk",
        role=UserRole.CITIZEN
    )
    test_db.add(new_user)
    test_db.commit()
    test_db.refresh(new_user)
    assert new_user.id is not None
    assert new_user.masked_cnic == "35202-*******-3"

    # READ
    queried = test_db.query(User).filter_by(phone_number="03112233445").first()
    assert queried is not None
    assert queried.full_name == "Babar Azam"

    # UPDATE
    queried.full_name = "Babar W. Azam"
    test_db.commit()
    updated = test_db.query(User).filter_by(phone_number="03112233445").first()
    assert updated.full_name == "Babar W. Azam"

    # VALIDATION: Invalid phone throws ValueError
    with pytest.raises(ValueError, match="Invalid Pakistani mobile phone number"):
        invalid_user = User(full_name="Test", phone_number="123")
        test_db.add(invalid_user)
        test_db.commit()

    test_db.rollback()

    # VALIDATION: Invalid email throws ValueError
    with pytest.raises(ValueError, match="Invalid email address"):
        invalid_email_user = User(full_name="Test", phone_number="03119988776", email="not-an-email")
        test_db.add(invalid_email_user)
        test_db.commit()

    test_db.rollback()

    # DELETE
    test_db.delete(queried)
    test_db.commit()
    assert test_db.query(User).filter_by(phone_number="03112233445").first() is None

# -------------------------------------------------------------
# 4. OTP Verification Records & Cryptographic Security
# -------------------------------------------------------------
def test_otp_verification_security(test_db):
    raw_code = "849201"
    otp = OTPVerification.create_record(
        phone_number="03215558899",
        raw_code=raw_code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        purpose="CITIZEN_LOGIN"
    )
    test_db.add(otp)
    test_db.commit()
    test_db.refresh(otp)

    # Raw code must NEVER be stored in plaintext
    assert raw_code not in otp.otp_hash
    assert len(otp.salt) == 32
    assert otp.is_used is False
    assert otp.attempts == 0

    # Wrong candidate code must fail and increment attempts
    assert otp.verify_code("000000") is False
    assert otp.attempts == 1
    assert otp.is_used is False

    # Correct candidate code must succeed, mark used, and set verified_at
    assert otp.verify_code(raw_code) is True
    assert otp.is_used is True
    assert otp.verified_at is not None

    # Re-use must fail
    assert otp.verify_code(raw_code) is False

# -------------------------------------------------------------
# 5. Traffic Rules & Validation
# -------------------------------------------------------------
def test_traffic_rule_crud(test_db):
    rule = TrafficRule(
        rule_code="TEST-RULE-01",
        section="Section 42-A, MVO 1965",
        title="Illegal U-Turn on Urban Expressway",
        title_ur="ایکسپریس وے پر غیر قانونی یو ٹرن",
        title_ps="په لويه لار ناقانونه يو ټرن کول",
        description="Executing an unauthorized U-turn across central median.",
        category="Lane & Signal Compliance",
        fine_amount=Decimal("1500.00"),
        penalty_points=2
    )
    test_db.add(rule)
    test_db.commit()
    test_db.refresh(rule)

    assert rule.id is not None
    assert rule.penalty_amount == 1500.0

    # Validation: Negative fine must fail
    with pytest.raises(ValueError, match="Fine amount cannot be negative"):
        rule.fine_amount = Decimal("-500.00")

# -------------------------------------------------------------
# 6. Challan Issuance & 1-to-1 QR Reference
# -------------------------------------------------------------
def test_challan_and_qr_reference(test_db):
    # Setup prerequisite rule and citizen
    rule = TrafficRule(
        rule_code="TEST-RULE-02",
        section="Section 99",
        title="Careless Driving",
        description="Careless driving",
        fine_amount=Decimal("2000.00")
    )
    citizen = User(full_name="Ali Khan", phone_number="03221112233")
    test_db.add_all([rule, citizen])
    test_db.commit()

    # Create Challan
    challan = Challan(
        challan_no="TEST-CH-2024-001",
        vehicle_no="ICT-XY-999",
        vehicle_type="Motorcycle",
        user_id=citizen.id,
        rule_id=rule.id,
        amount=Decimal("2000.00"),
        location="Blue Area, Islamabad",
        city="Islamabad",
        due_date=datetime.now(timezone.utc) + timedelta(days=14),
        is_demo=True
    )
    test_db.add(challan)
    test_db.commit()
    test_db.refresh(challan)

    # Attach QR Reference
    qr_ref = QRReference.generate(
        challan_id=challan.id,
        challan_no=challan.challan_no,
        vehicle_no=challan.vehicle_no,
        amount=float(challan.amount),
        expires_at=challan.due_date
    )
    test_db.add(qr_ref)
    test_db.commit()
    test_db.refresh(challan)

    # Verify 1-to-1 relationship
    assert challan.qr_reference is not None
    assert challan.qr_reference.qr_token.startswith("QRC-")
    assert challan.qr_reference.challan.challan_no == "TEST-CH-2024-001"

    # Verify scan recording
    assert challan.qr_reference.scan_count == 0
    challan.qr_reference.record_scan()
    test_db.commit()
    assert challan.qr_reference.scan_count == 1
    assert challan.qr_reference.last_scanned_at is not None

# -------------------------------------------------------------
# 7. Multilingual Chat Conversations & Messages
# -------------------------------------------------------------
def test_chat_conversations_and_cascade(test_db):
    user = User(full_name="Zainab Bibi", phone_number="03457788990")
    test_db.add(user)
    test_db.commit()

    conv = ChatConversation(
        session_id="SESS-TEST-001",
        user_id=user.id,
        language="ur",
        title="چالان کی معلومات",
        channel="web_voice"
    )
    test_db.add(conv)
    test_db.commit()
    test_db.refresh(conv)

    m1 = ChatMessage(
        conversation_id=conv.id,
        sender_type=MessageSenderType.USER,
        content="میرا چالان کب تک جمع ہو سکتا ہے؟"
    )
    m2 = ChatMessage(
        conversation_id=conv.id,
        sender_type=MessageSenderType.ASSISTANT,
        content="آپ کا چالان 14 دنوں کے اندر قابلِ ادائیگی ہے۔"
    )
    test_db.add_all([m1, m2])
    test_db.commit()

    # Verify message relationship
    assert len(conv.messages) == 2
    assert conv.messages[0].sender_type == MessageSenderType.USER

    # Verify Cascade Delete: Deleting conversation deletes messages
    test_db.delete(conv)
    test_db.commit()
    assert test_db.query(ChatMessage).filter_by(conversation_id=conv.id).count() == 0

# -------------------------------------------------------------
# 8. Language Preferences & RTL Auto-Direction
# -------------------------------------------------------------
def test_language_preference_rtl(test_db):
    user = User(full_name="Gul Khan", phone_number="03339998877")
    test_db.add(user)
    test_db.commit()

    pref = LanguagePreference(
        user_id=user.id,
        language_code="ps",
        voice_preferred=True
    )
    test_db.add(pref)
    test_db.commit()
    test_db.refresh(pref)

    # Pashto auto-detects RTL direction
    assert pref.direction == "rtl"

    # Switching to English auto-detects LTR
    pref.language_code = "en"
    test_db.commit()
    assert pref.direction == "ltr"

    # Unsupported language code throws ValueError
    with pytest.raises(ValueError, match="Unsupported language code"):
        pref.language_code = "fr"

# -------------------------------------------------------------
# 9. Audit Logging
# -------------------------------------------------------------
def test_audit_log_recording(test_db):
    log = AuditLog.record(
        event_type="DEMO_PAYMENT_INITIATED",
        actor_type="CITIZEN",
        severity="INFO",
        resource_type="challans",
        resource_id="KHI-2024-883492",
        details={"channel": "Easypaisa", "amount_pkr": 1000},
        ip_address="192.168.1.10",
        status="SUCCESS"
    )
    test_db.add(log)
    test_db.commit()
    test_db.refresh(log)

    assert log.id is not None
    assert log.get_details()["channel"] == "Easypaisa"
    assert log.timestamp is not None
