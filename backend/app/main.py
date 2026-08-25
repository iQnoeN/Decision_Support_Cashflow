"""Main application entry point for the FastAPI backend service."""

from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import prediction_router, upload_router
from app.core.config import settings
from app.utils.logging import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "Backend API for short-term cashflow forecasting, "
        "liquidity risk assessment and financial decision support."
    ),
)

# Enable CORS for frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(prediction_router)
app.include_router(upload_router)


@app.get("/", response_model=Dict[str, str])
def read_root() -> Dict[str, str]:
    """Root endpoint returning application status message."""
    logger.info("Handling request at GET /")
    return {"message": "Backend is running successfully."}


@app.get("/health", response_model=Dict[str, str])
def health_check() -> Dict[str, str]:
    """Health check endpoint returning service status details."""
    logger.info("Handling request at GET /health")
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.VERSION,
    }
