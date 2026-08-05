"""Main application entry point for the FastAPI backend service."""

from typing import Dict

from fastapi import FastAPI

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
