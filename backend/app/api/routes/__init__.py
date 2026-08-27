"""API route handlers package."""

from app.api.routes.auth import router as auth_router
from app.api.routes.prediction import router as prediction_router
from app.api.routes.upload import router as upload_router

__all__ = ["auth_router", "prediction_router", "upload_router"]
