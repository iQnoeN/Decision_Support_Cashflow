"""Upload API routes for handling CSV data uploads."""

from fastapi import APIRouter, File, UploadFile, status

from app.schemas.upload import UploadResponse
from app.services.upload_service import UploadService
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])

_upload_service = UploadService()


@router.post(
    "/",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload CSV data file",
    description="Accepts a CSV file, validates its format (.csv extension), and returns confirmation for downstream processing.",
)
async def upload_csv_file(file: UploadFile = File(...)) -> UploadResponse:
    """Endpoint to upload a single CSV file for processing."""
    logger.info(f"Received upload request for file: {file.filename if file else 'None'}")
    result = _upload_service.validate_and_process_upload(file)
    return UploadResponse(**result)
