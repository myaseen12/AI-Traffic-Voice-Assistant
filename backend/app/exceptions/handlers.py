from datetime import datetime, timezone
import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from app.exceptions.custom_exceptions import TrafficAppException

logger = logging.getLogger("app.exceptions")

def register_exception_handlers(app: FastAPI):
    @app.exception_handler(TrafficAppException)
    async def traffic_app_exception_handler(request: Request, exc: TrafficAppException):
        logger.warning(f"TrafficAppException [{exc.error_code}]: {exc.message} on {request.url.path}")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status": "error",
                "detail": exc.message,
                "error_code": exc.error_code,
                "details": exc.details,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path
            }
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail_msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            headers=getattr(exc, "headers", None),
            content={
                "status": "error",
                "detail": detail_msg,
                "status_code": exc.status_code,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path
            }
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        logger.info(f"Validation error on {request.url.path}: {exc.errors()}")
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "detail": "Request validation failed",
                "validation_errors": jsonable_encoder(exc.errors()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path
            }
        )

    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        logger.error(f"Database error on {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "detail": "A database operation encountered an unexpected error. Please try again.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path
            }
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled server error on {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "detail": "An internal server error occurred.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path
            }
        )