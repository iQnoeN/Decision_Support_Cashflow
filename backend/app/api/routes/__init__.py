"""API route handlers package."""

from app.api.routes.prediction import router as prediction_router
from app.api.routes.upload import router as upload_router

__all__ = ["prediction_router", "upload_router"]
