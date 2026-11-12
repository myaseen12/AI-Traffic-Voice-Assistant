from typing import Optional, List
from sqlalchemy.orm import Session
from app.models.user import User, UserRole

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_phone(self, phone_number: str) -> Optional[User]:
        return self.db.query(User).filter(User.phone_number == phone_number).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_all_citizens(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.db.query(User).filter(User.role == UserRole.CITIZEN).offset(skip).limit(limit).all()

    def create(self, user_data: dict) -> User:
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
