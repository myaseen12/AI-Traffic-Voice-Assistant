from app.routers.auth import router as auth_router
from app.routers.challans import router as challans_router
from app.routers.traffic_rules import router as traffic_rules_router
from app.routers.assistant import router as assistant_router
from app.routers.citizens import router as citizens_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "challans_router",
    "traffic_rules_router",
    "assistant_router",
    "citizens_router",
    "admin_router"
]
