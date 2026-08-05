"""Prediction response schemas using Pydantic."""

from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    """Schema defining response payload for cashflow prediction."""

    predicted_cashflow: float = Field(
        ...,
        description="Predicted net cashflow value for the next day."
    )
