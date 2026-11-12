import pytest
from app.database.base import Base
from app.database.session import engine, SessionLocal
from database.seeds.seed_data import run_seed

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield
