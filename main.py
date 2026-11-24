import os
import sys
import traceback

# Ensure root directory and backend directory are in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(root_dir, "backend")
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

app = None
init_error = None

try:
    try:
        from app.main import app
    except ImportError:
        from backend.app.main import app
except Exception as e:
    init_error = traceback.format_exc()
    print(f"[CRITICAL STARTUP ERROR] {init_error}")

if app is None:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware

    app = FastAPI(title="Diagnostic Fallback Service")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    def catch_all_diagnostic(full_path: str = ""):
        return JSONResponse(
            status_code=500,
            content={
                "status": "initialization_failed",
                "error": init_error or "Application failed to import",
                "path": full_path,
                "sys_path": sys.path[:5]
            }
        )

__all__ = ["app"]
