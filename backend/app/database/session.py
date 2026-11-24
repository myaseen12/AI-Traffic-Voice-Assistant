import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Normalize Postgres URI scheme if needed (e.g. postgres:// -> postgresql://)
database_url = settings.DATABASE_URL
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# In serverless environments (Vercel, AWS Lambda), filesystem is read-only except /tmp
is_serverless = bool(
    os.environ.get("VERCEL")
    or os.environ.get("VERCEL_ENV")
    or os.environ.get("VERCEL_REGION")
    or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    or os.environ.get("LAMBDA_TASK_ROOT")
    or os.environ.get("AWS_REGION")
    or not os.access(".", os.W_OK)
)
if database_url.startswith("sqlite") and is_serverless:
    database_url = "sqlite:////tmp/traffic_assistant.db"

engine_kwargs = {
    "echo": False, # Disabled raw query console echoing to support UTF-8 multilingual text safely on Windows
}

if database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production PostgreSQL connection pool configuration
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True # Active heartbeat to detect dropped sockets

engine = create_engine(database_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
