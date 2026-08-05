"""Upload API routes for handling CSV data uploads and inference."""

from fastapi import APIRouter, File, UploadFile, status

from app.schemas.response import PredictionResponse
from app.services.upload_service import UploadService
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])

_upload_service = UploadService()


@router.post(
    "/",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload CSV data file for end-to-end prediction and liquidity assessment",
    description="Accepts a CSV file, runs preprocessing and feature engineering via Track A modules, and returns cashflow forecast and liquidity assessment.",
)
async def upload_csv_file(file: UploadFile = File(...)) -> PredictionResponse:
    """Endpoint to upload a CSV file and execute full prediction & liquidity assessment pipeline."""
    logger.info(f"Received upload inference request for file: {file.filename if file else 'None'}")
    result = _upload_service.process_upload_and_predict(file)
    return PredictionResponse(**result)
