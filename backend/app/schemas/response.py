"""Prediction response schemas using Pydantic."""

from typing import List
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    """Schema defining response payload for cashflow prediction and liquidity assessment."""

    predicted_cashflow: float = Field(
        ...,
        description="Predicted net cashflow value for the next day."
    )
    liquidity_score: float = Field(
        ...,
        description="Calculated liquidity score (0-100)."
    )
    risk: str = Field(
        ...,
        description="Risk classification level (e.g., Stable, Moderate Risk, High Risk)."
    )
    recommendations: List[str] = Field(
        ...,
        description="List of financial recommendations based on liquidity assessment."
    )
