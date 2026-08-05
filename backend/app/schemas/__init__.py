"""Schemas package for data transfer models and validation schemas."""

from app.schemas.request import PredictionRequest
from app.schemas.response import PredictionResponse

__all__ = ["PredictionRequest", "PredictionResponse"]
