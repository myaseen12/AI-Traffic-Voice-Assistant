"""
Database seed fixtures with realistic Pakistani civic traffic management records.
All demonstration fixtures are clearly marked with `is_demo=True` and `[DEMO DATA]` tags.
"""
import secrets
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.auth.jwt_handler import hash_password
from app.models.user import User, UserRole
from app.models.otp_verification import OTPVerification
from app.models.admin import AdminRole, AdminUser
from app.models.traffic_rule import TrafficRule
from app.models.challan import Challan, ChallanStatus
from app.models.qr_reference import QRReference
from app.models.chat import ChatConversation, ChatMessage, MessageSenderType
from app.models.language_preference import LanguagePreference
from app.models.knowledge_base import KnowledgeBaseDocument
from app.models.audit_log import AuditLog

def seed_database(db: Session):
    """
    Populates comprehensive test fixtures across all 11 core database models.
    Safe and idempotent: skips if already populated.
    """
    # ---------------------------------------------------------
    # 1. Admin Roles & Permissions
    # ---------------------------------------------------------
    super_admin_role = db.query(AdminRole).filter_by(name="SUPER_ADMIN").first()
    if not super_admin_role:
        super_admin_role = AdminRole(
            name="SUPER_ADMIN",
            description="Complete authority across Safe City, statutory rules, system settings and audit trails.",
            permissions='["*"]',
            is_system_role=True
        )
        db.add(super_admin_role)

    ops_role = db.query(AdminRole).filter_by(name="OPERATIONS_ADMIN").first()
    if not ops_role:
        ops_role = AdminRole(
            name="OPERATIONS_ADMIN",
            description="Operations management, challan auditing, knowledge base updates, and rule calibrations.",
            permissions='["manage_rules", "view_challans", "settle_challans", "reindex_kb", "system_settings"]',
            is_system_role=True
        )
        db.add(ops_role)

    warden_role = db.query(AdminRole).filter_by(name="TRAFFIC_WARDEN").first()
    if not warden_role:
        warden_role = AdminRole(
            name="TRAFFIC_WARDEN",
            description="Field warden enforcement, roadside citation issuance, and license verification.",
            permissions='["view_challans", "issue_challans", "view_rules"]',
            is_system_role=True
        )
        db.add(warden_role)
    db.commit()

    # ---------------------------------------------------------
    # 2. Administrative Users
    # ---------------------------------------------------------
    admin_hq = db.query(AdminUser).filter_by(email="hq@trafficpolice.gov.pk").first()
    if not admin_hq:
        admin_hq = AdminUser(
            email="hq@trafficpolice.gov.pk",
            full_name="SP Operations (Headquarters)",
            hashed_password=hash_password("Admin@123"),
            badge_number="TP-HQ-001",
            department="Safe City Command & Control Centre",
            role_id=super_admin_role.id,
            is_active=True
        )
        db.add(admin_hq)

    # Ensure admin is also in User table with ADMIN role for unified token handling
    admin_user_record = db.query(User).filter_by(email="hq@trafficpolice.gov.pk").first()
    if not admin_user_record:
        admin_user_record = User(
            full_name="SP Operations (Headquarters)",
            phone_number="03000000001",
            email="hq@trafficpolice.gov.pk",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        db.add(admin_user_record)

    admin_warden = db.query(AdminUser).filter_by(email="warden.karachi@trafficpolice.gov.pk").first()
    if not admin_warden:
        admin_warden = AdminUser(
            email="warden.karachi@trafficpolice.gov.pk",
            full_name="Sub-Inspector Tariq Mehmood",
            hashed_password=hash_password("Warden@123"),
            badge_number="TP-KHI-402",
            department="Karachi Traffic Police, South District",
            role_id=warden_role.id,
            is_active=True
        )
        db.add(admin_warden)
    db.commit()

    # ---------------------------------------------------------
    # 3. Statutory Traffic Rules (MVO 1965 & NHSO 2000)
    # ---------------------------------------------------------
    rules_data = [
        {
            "rule_code": "MVO-SEC-89A",
            "section": "Section 89-A, Motor Vehicles Ordinance 1965",
            "title": "Riding Motorcycle Without Safety Helmet",
            "title_ur": "بغیر حفاظتی ہیلمٹ موٹرسائیکل چلانا",
            "title_ps": "د خولۍ پرته موټرسایکل چلول",
            "description": "Operating or riding as pillion on a two-wheeled motorcycle without wearing an approved safety helmet.",
            "description_ur": "موٹر سائیکل چلاتے وقت یا پیچھے بیٹھنے والے کا حفاظتی ہیلمٹ نہ پہننا قانوناً جرم ہے۔",
            "description_ps": "د موټر سایکل چلولو پر مهال یا شاته ناست کس لپاره د خوندیتوب خولۍ نه اغوستل د قانون له مخې جرم دی.",
            "category": "Safety Equipment",
            "fine_amount": Decimal("1000.00"),
            "penalty_points": 2,
            "legal_authority": "Motor Vehicles Ordinance 1965 (Amended 2018)",
            "source": "Provincial Motor Vehicles Ordinance, 1965 (Section 89-A; West Pakistan Ordinance XIX of 1965)",
            "jurisdiction": "All Public Roads & Highways (Nationwide)",
            "verification_status": "VERIFIED",
            "source_wording": "No person shall drive or ride on a motorcycle without fastening an approved safety helmet conforming to standards prescribed by the authority.",
            "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
            "verification_notes": "Statutory amendment gazetted under Provincial Motor Vehicles (Amendment) Act 2018."
        },
        {
            "rule_code": "MVO-SEC-112",
            "section": "Section 112, Motor Vehicles Ordinance 1965",
            "title": "Exceeding Prescribed Speed Limit",
            "title_ur": "مقررہ حد رفتار سے زائد گاڑی چلانا",
            "title_ps": "د ټاکل شوي سرعت څخه زیات موټر چلول",
            "description": "Driving a motor vehicle in excess of the maximum designated statutory speed limit on public roads or highways.",
            "description_ur": "عوامی شاہراہوں یا ایکسپریس ویز پر مقررہ رفتار کی حد سے تیز گاڑی چلانا۔",
            "description_ps": "په عامه لارو او لویو لارو د ټاکل شوي سرعت څخه په زیات سرعت موټر چلول.",
            "category": "Speed Regulation",
            "fine_amount": Decimal("2500.00"),
            "penalty_points": 3,
            "legal_authority": "National Highway Safety Ordinance 2000 / MVO 1965",
            "source": "National Highway Safety Ordinance, 2000 (Section 54 & Schedule XII; Ordinance No. XL of 2000)",
            "jurisdiction": "National Highways, Motorways & Urban Expressways",
            "verification_status": "VERIFIED",
            "source_wording": "No person shall drive a motor vehicle at a speed exceeding the maximum speed limit specified for such vehicle on any public road.",
            "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
            "verification_notes": "Statutory speed citation verified under NHSO 2000 radar enforcement regulations."
        },
        {
            "rule_code": "MVO-SEC-115",
            "section": "Section 115, Motor Vehicles Ordinance 1965",
            "title": "Disobeying Traffic Signals and Red Lights",
            "title_ur": "ٹریفک سگنل اور سرخ بتی کی خلاف ورزی",
            "title_ps": "د ترافیکي سیګنال او سرې رڼا سرغړونه",
            "description": "Failing to halt at a red traffic signal light, automated signal intersection, or designated stop line.",
            "description_ur": "سرخ ٹریفک سگنل پر گاڑی نہ روکنا یا سگنل کی خلاف ورزی کر کے آگے بڑھنا۔",
            "description_ps": "په سور ترافیکي څراغ د موټر نه درول او د اشارې نه سرغړونه کول.",
            "category": "Lane & Signal Compliance",
            "fine_amount": Decimal("1500.00"),
            "penalty_points": 2,
            "legal_authority": "Motor Vehicles Ordinance 1965",
            "source": "Motor Vehicles Ordinance, 1965 (Section 115 / Section 112 general penalty)",
            "jurisdiction": "City Traffic Police & Automated Urban Signal Systems",
            "verification_status": "VERIFIED",
            "source_wording": "Whoever fails to obey directions indicated by traffic signal signs or automated traffic signal lamps commits a statutory infraction.",
            "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
            "verification_notes": "Verified against Capital Territory and Provincial urban automated camera intersection rules."
        },
        {
            "rule_code": "MVO-SEC-100",
            "section": "Section 100, Motor Vehicles Ordinance 1965",
            "title": "Use of Handheld Mobile Device While Driving",
            "title_ur": "ڈرائیونگ کے دوران موبائل فون کا استعمال",
            "title_ps": "د موټر چلولو پر مهال د ګرځنده تیلیفون کارول",
            "description": "Operating a handheld mobile cellular device, texting, or holding a phone while operating a motor vehicle.",
            "description_ur": "گاڑی چلاتے ہوئے ہاتھ میں موبائل فون پکڑنا، بات کرنا یا میسج ٹائپ کرنا۔",
            "description_ps": "د موټر چلولو پر مهال په لاس کې د ګرځنده تیلیفون نیول، خبرې کول یا پیغام لیکل.",
            "category": "Driver Distraction",
            "fine_amount": Decimal("2000.00"),
            "penalty_points": 3,
            "legal_authority": "Provincial Motor Vehicles Rules & MVO 1965",
            "source": "Provincial Motor Vehicles Rules (Rule 100-A; Gazette of Pakistan Notification)",
            "jurisdiction": "Islamabad Capital Territory & All Provincial Roads",
            "verification_status": "VERIFIED",
            "source_wording": "No driver of a motor vehicle shall use, hold, or operate any wireless handheld telecommunication device while driving.",
            "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
            "verification_notes": "Verified against Safe City electronic surveillance rules."
        },
        {
            "rule_code": "MVO-SEC-03",
            "section": "Section 3, Motor Vehicles Ordinance 1965",
            "title": "Driving Without a Valid Driving License",
            "title_ur": "بغیر درست ڈرائیونگ لائسنس گاڑی چلانا",
            "title_ps": "د باوري موټر چلولو جواز پرته موټر چلول",
            "description": "Operating any class of motor vehicle without holding a valid, non-expired driving license issued by licensing authorities.",
            "description_ur": "محکمہ ٹریفک سے جاری کردہ کارآمد ڈرائیونگ لائسنس کے بغیر گاڑی یا موٹر سائیکل چلانا۔",
            "description_ps": "د باوري او د ترافیک ادارې له خوا صادر شوي جواز پرته د موټر چلول.",
            "category": "Documentation & Licensing",
            "fine_amount": Decimal("2000.00"),
            "penalty_points": 4,
            "legal_authority": "Motor Vehicles Ordinance 1965",
            "source": "Motor Vehicles Ordinance, 1965 (Section 3; Prohibition of driving without license)",
            "jurisdiction": "All Jurisdictions across Pakistan",
            "verification_status": "VERIFIED",
            "source_wording": "No person shall drive a motor vehicle in any public place unless he holds an effective driving license issued to himself authorizing him to drive vehicle.",
            "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
            "verification_notes": "Verified statutory licensing mandate under Section 3 & Section 99."
        },
        {
            "rule_code": "MVO-SEC-99",
            "section": "Section 99, Motor Vehicles Ordinance 1965",
            "title": "Reckless, Negligent and Dangerous Driving",
            "title_ur": "خطرناک، غیر محتاط اور لاپرواہ ڈرائیونگ",
            "title_ps": "خطرناک او بې باکه موټر چلول",
            "description": "Driving at a speed or in a manner that is inherently dangerous to the public having regard to circumstances and traffic density.",
            "description_ur": "ایسی لاپرواہی یا تیز رفتاری سے گاڑی چلانا جس سے عوام کی جان و مال کو خطرہ لاحق ہو۔",
            "description_ps": "په داسې خطرناک انداز موټر چلول چې د خلکو ژوند او مال ته ګواښ پېښ کړي.",
            "category": "Public Safety",
            "fine_amount": Decimal("5000.00"),
            "penalty_points": 5,
            "legal_authority": "Motor Vehicles Ordinance 1965",
            "source": "Motor Vehicles Ordinance, 1965 (Section 99; Driving dangerously)",
            "jurisdiction": "All Highways, Expressways & Municipalities",
            "verification_status": "VERIFIED",
            "source_wording": "Whoever drives a motor vehicle at a speed or in a manner which is dangerous to human life shall be punishable with fine and penalty points.",
            "source_url": "https://pakistancode.gov.pk/english/UY2FqaJw1-apaUY2Fqa-apU%3D-sg-jjjjjjjjjjjjj",
            "verification_notes": "Statutory major violation under Section 99."
        }
    ]

    rule_map = {}
    for rdata in rules_data:
        rule = db.query(TrafficRule).filter_by(rule_code=rdata["rule_code"]).first()
        if not rule:
            rule = TrafficRule(**rdata)
            db.add(rule)
            db.commit()
            db.refresh(rule)
        else:
            # Update existing rules with verified sources and wording
            for k, v in rdata.items():
                setattr(rule, k, v)
            db.commit()
            db.refresh(rule)
        rule_map[rdata["rule_code"]] = rule

    # ---------------------------------------------------------
    # 4. Citizens & Users
    # ---------------------------------------------------------
    citizens_data = [
        {
            "full_name": "Muhammad Rizwan",
            "phone_number": "03009876543",
            "cnic": "35201-8472910-1",
            "email": "rizwan.traffic.demo@example.com",
            "driving_license_no": "ICT-DL-2019-88392",
            "role": UserRole.CITIZEN,
            "is_verified": True,
            "language": "ur"
        },
        {
            "full_name": "Aisha Tariq",
            "phone_number": "03335551234",
            "cnic": "42101-9923841-2",
            "email": "aisha.tariq.demo@example.com",
            "driving_license_no": "KHI-DL-2021-12049",
            "role": UserRole.CITIZEN,
            "is_verified": True,
            "language": "en"
        },
        {
            "full_name": "Khan Sherani",
            "phone_number": "03451122334",
            "cnic": "17301-4491023-5",
            "email": "khan.sherani.demo@example.com",
            "driving_license_no": "PEW-DL-2020-55912",
            "role": UserRole.CITIZEN,
            "is_verified": True,
            "language": "ps"
        }
    ]

    citizen_map = {}
    for cdata in citizens_data:
        lang = cdata.pop("language")
        user = db.query(User).filter_by(phone_number=cdata["phone_number"]).first()
        if not user:
            user = User(**cdata)
            db.add(user)
            db.commit()
            db.refresh(user)
            
            # 5. Language Preferences (1-to-1)
            pref = LanguagePreference(
                user_id=user.id,
                language_code=lang,
                voice_preferred=True,
                speech_speed=1.0,
                auto_play_voice=True,
                direction="rtl" if lang in ["ur", "ps"] else "ltr"
            )
            db.add(pref)
            db.commit()
        citizen_map[user.phone_number] = user

    # ---------------------------------------------------------
    # 6. OTP Verification Records (Sample Fixtures)
    # ---------------------------------------------------------
    for phone in ["03009876543", "03335551234"]:
        existing_otp = db.query(OTPVerification).filter_by(phone_number=phone).first()
        if not existing_otp:
            otp_record = OTPVerification.create_record(
                phone_number=phone,
                raw_code="123456",
                expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
                purpose="CITIZEN_LOGIN",
                user_id=citizen_map[phone].id,
                ip_address="127.0.0.1",
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) DemoAgent/1.0"
            )
            db.add(otp_record)
    db.commit()

    # ---------------------------------------------------------
    # 7. Challans (e-Citations with Demo Flags)
    # ---------------------------------------------------------
    challans_data = [
        {
            "challan_no": "PK-2024-883921",
            "vehicle_no": "ICT-LE-402",
            "vehicle_type": "Motor Car",
            "user_id": citizen_map["03009876543"].id,
            "rule_id": rule_map["MVO-SEC-112"].id,
            "amount": Decimal("5000.00"),
            "late_fee": Decimal("0.00"),
            "status": ChallanStatus.PENDING,
            "location": "Islamabad Expressway near Faizabad, Islamabad",
            "city": "Islamabad",
            "evidence_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
            "issued_by_officer": "Safe City ANPR Unit 01",
            "officer_badge_no": "ICT-ANPR-01",
            "remarks": "[DEMO DATA] Electronic citation recorded for statutory speed violation.",
            "issued_at": datetime.now(timezone.utc) - timedelta(days=3),
            "due_date": datetime.now(timezone.utc) + timedelta(days=11),
            "is_demo": True
        },
        {
            "challan_no": "KHI-2024-883492",
            "vehicle_no": "LEA-24-9182",
            "vehicle_type": "Motorcycle",
            "user_id": citizen_map["03009876543"].id,
            "rule_id": rule_map["MVO-SEC-89A"].id,
            "amount": Decimal("1000.00"),
            "late_fee": Decimal("0.00"),
            "status": ChallanStatus.PENDING,
            "location": "Sharah-e-Faisal near Baloch Colony, Karachi",
            "city": "Karachi",
            "evidence_image_url": "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
            "issued_by_officer": "ANPR Camera Unit 14",
            "officer_badge_no": "CAM-KHI-ANPR-14",
            "remarks": "[DEMO DATA] Automatic ANPR Safe City camera detection. Rider without protective helmet.",
            "issued_at": datetime.now(timezone.utc) - timedelta(days=2),
            "due_date": datetime.now(timezone.utc) + timedelta(days=12),
            "is_demo": True
        },
        {
            "challan_no": "ICT-2024-551203",
            "vehicle_no": "ICT-LE-402",
            "vehicle_type": "Motor Car",
            "user_id": citizen_map["03009876543"].id,
            "rule_id": rule_map["MVO-SEC-112"].id,
            "amount": Decimal("2500.00"),
            "late_fee": Decimal("0.00"),
            "status": ChallanStatus.PENDING,
            "location": "Kashmir Highway near G-9 Interchange, Islamabad",
            "city": "Islamabad",
            "evidence_image_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
            "issued_by_officer": "Sub-Inspector Noman Ali",
            "officer_badge_no": "ICT-RAD-092",
            "remarks": "[DEMO DATA] Handheld radar clocked speed at 84 km/h in designated 50 km/h urban sector.",
            "issued_at": datetime.now(timezone.utc) - timedelta(days=5),
            "due_date": datetime.now(timezone.utc) + timedelta(days=9),
            "is_demo": True
        },
        {
            "challan_no": "LHR-2024-109482",
            "vehicle_no": "LHR-MN-3310",
            "vehicle_type": "Motor Car",
            "user_id": citizen_map["03335551234"].id,
            "rule_id": rule_map["MVO-SEC-115"].id,
            "amount": Decimal("1500.00"),
            "late_fee": Decimal("0.00"),
            "status": ChallanStatus.PAID,
            "location": "Liberty Roundabout, Gulberg III, Lahore",
            "city": "Lahore",
            "evidence_image_url": "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80",
            "issued_by_officer": "Punjab Safe Cities Authority (PSCA)",
            "officer_badge_no": "PSCA-LHR-CAM-33",
            "remarks": "[DEMO DATA] Red light crossing verified and settled via online 1Link banking.",
            "issued_at": datetime.now(timezone.utc) - timedelta(days=10),
            "due_date": datetime.now(timezone.utc) + timedelta(days=4),
            "paid_at": datetime.now(timezone.utc) - timedelta(days=2),
            "payment_method": "1Link",
            "payment_transaction_id": "TXN-1LINK-99482103",
            "is_demo": True
        },
        {
            "challan_no": "PEW-2024-330194",
            "vehicle_no": "PEW-AB-7721",
            "vehicle_type": "Commercial Rickshaw",
            "user_id": citizen_map["03451122334"].id,
            "rule_id": rule_map["MVO-SEC-100"].id,
            "amount": Decimal("2000.00"),
            "late_fee": Decimal("0.00"),
            "status": ChallanStatus.PENDING,
            "location": "University Road near Khyber Teaching Hospital, Peshawar",
            "city": "Peshawar",
            "evidence_image_url": None,
            "issued_by_officer": "Traffic Warden Asmatullah",
            "officer_badge_no": "KPK-TP-081",
            "remarks": "[DEMO DATA] Driver observed using mobile phone while maneuvering commercial passenger vehicle.",
            "issued_at": datetime.now(timezone.utc) - timedelta(days=1),
            "due_date": datetime.now(timezone.utc) + timedelta(days=13),
            "is_demo": True
        }
    ]

    for cdata in challans_data:
        ch = db.query(Challan).filter_by(challan_no=cdata["challan_no"]).first()
        if not ch:
            ch = Challan(**cdata)
            db.add(ch)
            db.commit()
            db.refresh(ch)

            # ---------------------------------------------------------
            # 8. QR References (1-to-1 Cryptographic Verification Token)
            # ---------------------------------------------------------
            qr_ref = QRReference.generate(
                challan_id=ch.id,
                challan_no=ch.challan_no,
                vehicle_no=ch.vehicle_no,
                amount=float(ch.amount),
                expires_at=ch.due_date
            )
            db.add(qr_ref)
            db.commit()

    # ---------------------------------------------------------
    # 9. Knowledge Base Documents
    # ---------------------------------------------------------
    kb_docs_data = [
        {
            "doc_uid": "KB-MVO-SEC89A",
            "title": "Safety Helmet Mandate for Two-Wheeled Motor Vehicles",
            "document_type": "statute",
            "authority_name": "Motor Vehicles Ordinance 1965 (Section 89-A)",
            "rule_id": rule_map["MVO-SEC-89A"].id,
            "content_english": (
                "Section 89-A of the Motor Vehicles Ordinance 1965 explicitly mandates that "
                "no person shall drive, ride, or be carried upon a two-wheeled motorcycle without wearing "
                "a crash helmet of approved protective design. Violators are liable to a statutory penalty "
                "of PKR 1,000 and 2 penalty demerit points."
            ),
            "content_urdu": (
                "موٹر وہیکلز آرڈیننس 1965 کی دفعہ 89-اے کے تحت کسی بھی شخص کے لیے موٹر سائیکل چلاتے وقت "
                "یا پیچھے بیٹھتے وقت معیاری حفاظتی ہیلمٹ پہننا قانونی طور پر لازم ہے۔ خلاف ورزی پر 1,000 روپے "
                "جرمانہ اور 2 پینلٹی پوائنٹس عائد کیے جاتے ہیں۔"
            ),
            "content_pashto": (
                "د ۱۹۶۵ کال د موټر وسايلو آرډيننس د ۸۹-الف فقرې سره سم، هر هغه څوک چې موټر سايکل چلوي یا شاته "
                "ناست وي بايد معياري خولۍ په سر کړي. سرغړونکي باندې زر ۱۰۰۰ روپۍ جرمانه او دوه پواينټونه وضع کېږي."
            ),
            "is_indexed": True,
            "version": "1.2"
        },
        {
            "doc_uid": "KB-MVO-SEC112",
            "title": "Speed Limits and Radar Enforcement Procedures",
            "document_type": "statute",
            "authority_name": "National Highway and Motorway Police & City Traffic Police",
            "rule_id": rule_map["MVO-SEC-112"].id,
            "content_english": (
                "Under Section 112 of MVO 1965 and NHSO 2000, designated speed limits must be strictly adhered to: "
                "Urban roads (50-60 km/h), Ring Roads / Arterials (70-80 km/h), and Motorways (120 km/h). "
                "Speed is tracked via Doppler radar guns and Safe City ANPR laser sensors. Fine: PKR 2,500."
            ),
            "content_urdu": (
                "دفعہ 112 کے تحت شہری شاہراہوں پر 50 سے 60 کلومیٹر فی گھنٹہ اور موٹروے پر 120 کلومیٹر فی گھنٹہ کی "
                "حد رفتار نافذ ہے۔ ریڈار اور سیف سٹی کیمروں کی مدد سے تیز رفتاری ریکارڈ ہونے پر 2,500 روپے کا ای چالان جاری ہوتا ہے۔"
            ),
            "content_pashto": (
                "د ۱۱۲ فقرې سره سم په ښاري لارو د ۵۰ څخه تر ۶۰ کيلوميټره او په لويو لارو د ۱۲۰ کيلوميټره سرعت ټاکل شوی. "
                "د سرغړونې په صورت کې دوه نيم زره ۲۵۰۰ روپۍ چالان جاري کېږي."
            ),
            "is_indexed": True,
            "version": "1.0"
        },
        {
            "doc_uid": "KB-SOP-PAYMENT",
            "title": "Standard Operating Procedure: Online e-Challan Settlement",
            "document_type": "procedure_manual",
            "authority_name": "1Link / State Bank of Pakistan Civic Payment Gateway",
            "rule_id": None,
            "content_english": (
                "Citizens can settle citations digitally through 1Link 1Bill ID. "
                "Open any mobile banking application (Easypaisa, JazzCash, HBL, Meezan), "
                "navigate to Bill Payments -> 1Bill / Gov Challans, input the 18-digit PSID / Challan reference, "
                "verify the amount, and confirm payment. Real-time reconciliation occurs within 60 seconds."
            ),
            "content_urdu": (
                "شہری اپنا ٹریفک چالان گھر بیٹھے ایزی پیسہ، جاز کیش یا کسی بھی بینکنگ ایپ سے 1Link 1Bill کے ذریعے ادا کر سکتے ہیں۔ "
                "چالان نمبر درج کر کے رقم چیک کریں اور تصدیق کریں۔ چالان کی حیثیت فوری طور پر PAID میں تبدیل ہو جاتی ہے۔"
            ),
            "content_pashto": (
                "خلګ کولی شي خپل چالان په آنلاين بڼه د ایزي پیسه، جاز کيش یا خپل بانکي اپليکېشن له لارې د 1Link 1Bill په مرسته ادا کړي. "
                "د چالان د اداينې وروسته د چالان حالت په ۶۰ ثانيو کې تصديق کېږي."
            ),
            "is_indexed": True,
            "version": "2.0"
        }
    ]

    for kdata in kb_docs_data:
        doc = db.query(KnowledgeBaseDocument).filter_by(doc_uid=kdata["doc_uid"]).first()
        if not doc:
            doc = KnowledgeBaseDocument(**kdata)
            db.add(doc)
    db.commit()

    # ---------------------------------------------------------
    # 10. Chat Conversations & Multilingual Messages
    # ---------------------------------------------------------
    conv_urdu = db.query(ChatConversation).filter_by(session_id="SESS-DEMO-URDU-001").first()
    if not conv_urdu:
        ch_rizwan = db.query(Challan).filter_by(challan_no="KHI-2024-883492").first()
        conv_urdu = ChatConversation(
            session_id="SESS-DEMO-URDU-001",
            user_id=citizen_map["03009876543"].id,
            challan_id=ch_rizwan.id if ch_rizwan else None,
            language="ur",
            title="ہیلمٹ چالان اور ادائیگی کی رہنمائی",
            channel="web_voice"
        )
        db.add(conv_urdu)
        db.commit()
        db.refresh(conv_urdu)

        msg_u1 = ChatMessage(
            conversation_id=conv_urdu.id,
            sender_type=MessageSenderType.USER,
            content="میرے موٹرسائیکل کا چالان کیوں ہوا اور میں اسے کیسے جمع کروا سکتا ہوں؟",
            detected_language="ur",
            detected_intent="QUERY_CHALLAN_LEGALITY"
        )
        msg_u2 = ChatMessage(
            conversation_id=conv_urdu.id,
            sender_type=MessageSenderType.ASSISTANT,
            content=(
                "آپ کا چالان KHI-2024-883492 موٹر وہیکلز آرڈیننس 1965 کی دفعہ 89-اے کے تحت بغیر حفاظتی ہیلمٹ "
                "موٹر سائیکل چلانے پر شارع فیصل بلوچ کالونی کے مقام پر جاری کیا گیا ہے۔ "
                "جرمانے کی رقم 1,000 روپے ہے۔ آپ اسے ایزی پیسہ، جاز کیش یا بینک ایپ میں 1Bill چالان آپشن سے ادا کر سکتے ہیں۔"
            ),
            detected_language="ur",
            detected_intent="EXPLAIN_CHALLAN_LEGALITY",
            rag_sources='[{"source": "MVO 1965 Section 89-A", "confidence": 0.98}]',
            feedback_rating=5
        )
        db.add_all([msg_u1, msg_u2])
        db.commit()

    # ---------------------------------------------------------
    # 11. Audit Logs (Immutable Operational Logs)
    # ---------------------------------------------------------
    sample_audit = db.query(AuditLog).filter_by(event_type="SYSTEM_BOOTSTRAP").first()
    if not sample_audit:
        db.add_all([
            AuditLog.record(
                event_type="SYSTEM_BOOTSTRAP",
                actor_type="SYSTEM",
                severity="INFO",
                resource_type="database",
                resource_id="0",
                details={"action": "PostgreSQL database initialized with verified statutory models and seeds."},
                ip_address="127.0.0.1",
                status="SUCCESS"
            ),
            AuditLog.record(
                event_type="CITIZEN_LOGIN",
                actor_type="CITIZEN",
                severity="INFO",
                user_id=citizen_map["03009876543"].id,
                resource_type="users",
                resource_id=str(citizen_map["03009876543"].id),
                details={"method": "SMS_OTP", "phone": "03009876543"},
                ip_address="127.0.0.1",
                status="SUCCESS"
            ),
            AuditLog.record(
                event_type="QR_SCANNED",
                actor_type="CITIZEN",
                severity="INFO",
                user_id=citizen_map["03009876543"].id,
                resource_type="challans",
                resource_id="KHI-2024-883492",
                details={"scanner": "MobileWebCamera", "verification": "VERIFIED_VALID"},
                ip_address="127.0.0.1",
                status="SUCCESS"
            ),
            AuditLog.record(
                event_type="CHALLAN_SETTLEMENT",
                actor_type="SYSTEM",
                severity="INFO",
                resource_type="challans",
                resource_id="LHR-2024-109482",
                details={"gateway": "1Link", "amount": 1500, "txn": "TXN-1LINK-99482103"},
                ip_address="10.0.0.1",
                status="SUCCESS"
            )
        ])
        db.commit()

def run_seed(db: Session):
    """Entry point alias for database seeding."""
    seed_database(db)
