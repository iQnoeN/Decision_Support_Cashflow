"""Upload service module for validating CSV file uploads."""

from typing import Dict, Any
from fastapi import UploadFile, HTTPException, status


class UploadService:
    """Service responsible for validating uploaded files for downstream processing."""

    def validate_and_process_upload(self, file: UploadFile) -> Dict[str, Any]:
        """Validate uploaded file existence and format (.csv extension).

        Args:
            file: The FastAPI UploadFile object.

        Returns:
            Dictionary containing upload response details (filename, status, next_step).

        Raises:
            HTTPException: If file is missing or file extension is not .csv.
        """
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided."
            )

        filename = file.filename
        if not filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only CSV files (.csv) are allowed."
            )

        return {
            "filename": filename,
            "status": "File uploaded successfully.",
            "next_step": "Ready for preprocessing."
        }
