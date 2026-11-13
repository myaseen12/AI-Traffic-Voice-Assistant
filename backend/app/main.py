import os
import sys
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Dict, Any

# Ensure root directory and backend directory are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.middleware.auth_middleware import SecurityAndLoggingMiddleware
from app.exceptions.handlers import register_exception_handlers
from app.routers import (
    auth_router,
    challans_router,
    traffic_rules_router,
    assistant_router,
    citizens_router,
    admin_router
)

SERVER_START_TIME = datetime.now(timezone.utc)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan:
    - Verifies database schema tables
    - Seeds default verified violations and demonstration fixtures
    """
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            from app.database.seeds import run_seed
            run_seed(db)
        except Exception as e:
            print(f"[Startup Warning] Seed initialization note: {e}")
        finally:
            db.close()
    except Exception as db_init_err:
        print(f"[Startup Warning] Database initialization warning: {db_init_err}")
    yield

# OpenAPI Tags Metadata for Swagger Documentation
TAGS_METADATA = [
    {
        "name": "Authentication",
        "description": "Citizen 2FA SMS OTP login, officer badge credentials, and JWT session tokens.",
    },
    {
        "name": "Challans",
        "description": "e-Challan lookup, encrypted QR code decoding, OCR document processing, and 1Link digital settlements.",
    },
    {
        "name": "Traffic Rules",
        "description": "Statutory fine schedules authorized under Motor Vehicles Ordinance 1965 and NHSO 2000.",
    },
    {
        "name": "Voice Assistant",
        "description": "Multilingual AI Traffic Voice Assistant queries (Urdu, Pashto, English) with grounded RAG retrieval.",
    },
    {
        "name": "Citizens",
        "description": "Authenticated citizen portal dashboard, active vehicle records, and personal citation dossiers.",
    },
    {
        "name": "Admin Portal",
        "description": "Police Command & Safe City Operations management, ANPR audit trails, and ChromaDB vector indexing.",
    },
]

app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "**AI Traffic Voice Assistant Backend**\n\n"
        "Multilingual Pakistani Civic Traffic Management, Safe City e-Challan Verification, "
        "and Statutory RAG Voice Assistant Platform.\n\n"
        "*Tagline: Ask. Understand. Follow.*\n\n"
        "**Supported Languages:**\n"
        "- 🇵🇰 **Urdu (اردو)** — National Language\n"
        "- 🇵🇰 **Pashto (پښتو)** — Regional Language\n"
        "- 🇬🇧 **English** — Statutory Legal Citation Standard"
    ),
    version="1.0.0",
    openapi_tags=TAGS_METADATA,
    docs_url="/docs",
    redoc_url="/redoc",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,
        "persistAuthorization": True,
        "displayRequestDuration": True
    },
    lifespan=lifespan
)

# Register Centralized Error Handlers
register_exception_handlers(app)

# Register Custom Middleware
app.add_middleware(SecurityAndLoggingMiddleware)

# Configure Secure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-Response-Time-MS"]
)

# Mount API Routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(challans_router, prefix=API_PREFIX)
app.include_router(traffic_rules_router, prefix=API_PREFIX)
app.include_router(assistant_router, prefix=API_PREFIX)
app.include_router(citizens_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)

@app.get("/", tags=["System"])
def root() -> Dict[str, Any]:
    """Root metadata discovery endpoint."""
    return {
        "service": settings.APP_NAME,
        "tagline": "Ask. Understand. Follow.",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "supported_languages": [
            {"code": "ur", "name": "Urdu", "native": "اردو", "dir": "rtl"},
            {"code": "ps", "name": "Pashto", "native": "پښتو", "dir": "rtl"},
            {"code": "en", "name": "English", "native": "English", "dir": "ltr"}
        ],
        "statutory_framework": [
            "Motor Vehicles Ordinance 1965 (Amended)",
            "National Highways Safety Ordinance 2000 (NHSO)",
            "Islamabad Capital Territory Traffic Regulations 2024"
        ]
    }

@app.get("/health", tags=["System"])
@app.get("/api/v1/health", tags=["System"])
def health_check() -> Dict[str, Any]:
    """
    Health check endpoint verifying:
    - Application online state
    - Database connectivity (via SELECT 1 ping)
    - Uptime duration
    """
    db_status = "connected"
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    now_utc = datetime.now(timezone.utc)
    uptime_seconds = round((now_utc - SERVER_START_TIME).total_seconds())

    return {
        "status": "healthy" if "unhealthy" not in db_status else "degraded",
        "service": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "database": db_status,
        "rag_vector_store": "ready",
        "uptime_seconds": uptime_seconds,
        "timestamp": now_utc.isoformat()
    }