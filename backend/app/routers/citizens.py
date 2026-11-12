from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.challan import Challan, ChallanStatus

router = APIRouter(prefix="/citizens", tags=["Citizens"])

@router.get("/dashboard")
def get_citizen_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    challans = db.query(Challan).filter(Challan.user_id == current_user.id).all()
    pending = [c for c in challans if c.status == ChallanStatus.PENDING]
    paid = [c for c in challans if c.status == ChallanStatus.PAID]

    # Unique registered vehicles from citizen challans
    vehicles = list(set([c.vehicle_no for c in challans]))
    if not vehicles:
        vehicles = ["ICT-LE-402"]

    total_penalty_points = sum(
        c.violation.penalty_points for c in pending if c.violation and c.violation.penalty_points
    )

    return {
        "user": {
            "name": current_user.full_name,
            "phone": current_user.phone_number,
            "email": current_user.email,
            "license": current_user.driving_license_no or "ICT-DL-2019-88392",
            "language": current_user.preferred_language or "en",
            "vehicles": vehicles,
            "member_since": current_user.created_at.strftime("%b %Y") if current_user.created_at else "Nov 2024",
            "is_verified": True
        },
        "stats": {
            "total_challans": len(challans),
            "pending_count": len(pending),
            "pending_amount": sum(c.amount for c in pending),
            "paid_count": len(paid),
            "paid_amount": sum(c.amount for c in paid),
            "penalty_points": total_penalty_points,
            "safe_driving_score": 85 if total_penalty_points < 5 else 68
        },
        "recent_challans": [
            {
                "id": c.id,
                "challan_no": c.challan_no,
                "vehicle_no": c.vehicle_no,
                "amount": c.amount,
                "status": c.status.value,
                "date": c.issued_at.strftime("%d %b %Y"),
                "due_date": c.due_date.strftime("%d %b %Y") if c.due_date else "14 Days",
                "violation": c.violation.title if c.violation else "Traffic Regulation Violation",
                "section": c.violation.section if c.violation else "Section 113, MVO 1965",
                "location": c.location,
                "remarks": c.remarks
            }
            for c in challans[:6]
        ],
        "is_backend_data": True
    }
