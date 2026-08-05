"""CSV upload response and request schemas using Pydantic."""

from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Schema defining response payload for CSV file upload."""

    filename: str = Field(
        ...,
        description="Name of the uploaded CSV file."
    )
    status: str = Field(
        ...,
        description="Status message of the upload process."
    )
    next_step: str = Field(
        ...,
        description="Description of the next pipeline stage."
    )
