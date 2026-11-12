import time
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("app.middleware")

class SecurityAndLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response: Response = await call_next(request)
        
        process_time = time.time() - start_time
        duration_ms = round(process_time * 1000, 2)
        
        # Performance & Timing Headers
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        response.headers["X-Response-Time-MS"] = f"{duration_ms}ms"
        
        # Security Hardening Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response

# Backward compatibility alias
LoggingMiddleware = SecurityAndLoggingMiddleware