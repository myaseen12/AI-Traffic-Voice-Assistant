from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.models.challan import Challan, ChallanStatus

class ChallanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, challan_id: int) -> Optional[Challan]:
        return self.db.query(Challan).options(joinedload(Challan.violation)).filter(Challan.id == challan_id).first()

    def get_by_challan_no(self, challan_no: str) -> Optional[Challan]:
        return self.db.query(Challan).options(joinedload(Challan.violation)).filter(Challan.challan_no == challan_no).first()

    def get_by_vehicle_no(self, vehicle_no: str) -> List[Challan]:
        clean_no = vehicle_no.replace(" ", "").upper()
        return self.db.query(Challan).options(joinedload(Challan.violation)).filter(
            Challan.vehicle_no.ilike(f"%{clean_no}%")
        ).all()

    def get_by_user_id(self, user_id: int) -> List[Challan]:
        return self.db.query(Challan).options(joinedload(Challan.violation)).filter(Challan.user_id == user_id).all()

    def get_all(self, skip: int = 0, limit: int = 100, status: Optional[ChallanStatus] = None) -> List[Challan]:
        query = self.db.query(Challan).options(joinedload(Challan.violation))
        if status:
            query = query.filter(Challan.status == status)
        return query.order_by(Challan.issued_at.desc()).offset(skip).limit(limit).all()

    def create(self, challan_data: dict) -> Challan:
        challan = Challan(**challan_data)
        self.db.add(challan)
        self.db.commit()
        self.db.refresh(challan)
        return challan
