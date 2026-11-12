import os
from app.database.session import engine, SessionLocal
from app.models import Base
from app.database.seeds import seed_database

def main():
    db_file = os.path.join(os.path.dirname(__file__), "traffic_assistant.db")
    if os.path.exists(db_file):
        try:
            os.remove(db_file)
            print("Removed old SQLite DB file.")
        except Exception as e:
            print(f"Notice: {e}")

    Base.metadata.create_all(bind=engine)
    print("Created all tables.")
    db = SessionLocal()
    try:
        seed_database(db)
        print("Database seeded with verified statutory fixtures successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    main()
