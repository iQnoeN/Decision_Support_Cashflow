"""Main application entry point for the FastAPI backend service."""

from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth_router, prediction_router, upload_router
from app.core.config import settings
from app.core.database import create_tables
from app.utils.logging import get_logger

# Import models so they register with Base.metadata
import app.models.user  # noqa: F401

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Async lifespan: create DB tables on startup."""
    logger.info("Creating database tables if they do not exist...")
    await create_tables()
    logger.info("Database tables ready.")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "Backend API for short-term cashflow forecasting, "
        "liquidity risk assessment and financial decision support."
    ),
    lifespan=lifespan,
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
app.include_router(auth_router)
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
