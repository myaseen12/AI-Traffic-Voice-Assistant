from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.violation import Violation
from app.models.challan import Challan, ChallanStatus
from app.auth.jwt_handler import hash_password
from app.rag.verified_rules import VERIFIED_TRAFFIC_RULES

def run_seed(db: Session):
    # Check if already seeded
    if db.query(Violation).first():
        return

    print("Seeding verified Pakistan traffic statutory rules and demo challans...")

    # 1. Seed Verified Violations from MVO 1965
    violations_map = {}
    for rule in VERIFIED_TRAFFIC_RULES:
        v = Violation(
            section=rule["section"],
            title=rule["title_en"],
            description=rule["legal_basis"],
            category=rule["category"],
            penalty_amount=rule["penalty_amount"],
            penalty_points=rule["points"]
        )
        db.add(v)
        db.flush()
        violations_map[rule["id"]] = v

    db.commit()

    # 2. Seed Users
    admin_user = User(
        full_name="Traffic Operations HQ",
        phone_number="03001234567",
        email="hq@trafficpolice.gov.pk",
        hashed_password=hash_password("admin123"),
        role=UserRole.ADMIN,
        preferred_language="en"
    )
    db.add(admin_user)

    citizen_user = User(
        full_name="Muhammad Yaseen",
        phone_number="03009876543",
        email="yaseen@example.com",
        hashed_password=hash_password("citizen123"),
        role=UserRole.CITIZEN,
        driving_license_no="ICT-DL-2019-88392",
        preferred_language="ur"
    )
    db.add(citizen_user)
    db.commit()

    # 3. Seed Realistic Sample Challans (Matching QR Code format and screenshot mockup)
    speed_viol = violations_map.get("RULE-113-SPEED")
    helmet_viol = violations_map.get("RULE-89A-HELMET")
    signal_viol = violations_map.get("RULE-112-SIGNAL")
    seatbelt_viol = violations_map.get("RULE-89B-SEATBELT")

    sample_challans = [
        {
            "challan_no": "PK-2024-883921",
            "vehicle_no": "ICT-LE-402",
            "user_id": citizen_user.id,
            "violation_id": speed_viol.id if speed_viol else 1,
            "amount": 5000.0,
            "status": ChallanStatus.PENDING,
            "location": "Islamabad Expressway, Zero Point Interchange",
            "issued_at": datetime.utcnow() - timedelta(days=2),
            "due_date": datetime.utcnow() + timedelta(days=12),
            "remarks": "Safe City ANPR Camera #Cam08: Speed detected 104 km/h in 80 km/h zone."
        },
        {
            "challan_no": "PK-2024-774102",
            "vehicle_no": "ICT-LE-402",
            "user_id": citizen_user.id,
            "violation_id": helmet_viol.id if helmet_viol else 2,
            "amount": 2000.0,
            "status": ChallanStatus.PENDING,
            "location": "Faizabad Crossing, Rawalpindi-Islamabad",
            "issued_at": datetime.utcnow() - timedelta(days=4),
            "due_date": datetime.utcnow() + timedelta(days=10),
            "remarks": "Smart Surveillance Sensor: Rider without standard safety headgear."
        },
        {
            "challan_no": "PK-2024-551209",
            "vehicle_no": "ICT-LE-402",
            "user_id": citizen_user.id,
            "violation_id": seatbelt_viol.id if seatbelt_viol else 3,
            "amount": 1500.0,
            "status": ChallanStatus.PAID,
            "location": "Jinnah Avenue, Blue Area Islamabad",
            "issued_at": datetime.utcnow() - timedelta(days=20),
            "due_date": datetime.utcnow() + timedelta(days=5),
            "paid_at": datetime.utcnow() - timedelta(days=18),
            "payment_transaction_id": "1LINK-88930412A",
            "remarks": "Settled via 1Link Online Banking / EasyPaisa"
        },
        {
            "challan_no": "PK-2024-339912",
            "vehicle_no": "LEB-19-4402",
            "violation_id": signal_viol.id if signal_viol else 4,
            "amount": 2500.0,
            "status": ChallanStatus.PENDING,
            "location": "Canal Road Crossing, Lahore",
            "issued_at": datetime.utcnow() - timedelta(days=1),
            "due_date": datetime.utcnow() + timedelta(days=13),
            "remarks": "Automated RLVD sensor recorded red light jump at 14:22:10."
        }
    ]

    for c in sample_challans:
        challan = Challan(**c)
        db.add(challan)
    db.commit()
    print("Pakistan traffic database seeding completed.")
