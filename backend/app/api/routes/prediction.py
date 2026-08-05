"""Prediction API routes for cashflow forecasting."""

from fastapi import APIRouter, HTTPException, status

from app.integrations.prediction_adapter import PredictionAdapter
from app.schemas.request import PredictionRequest
from app.schemas.response import PredictionResponse
from app.services.prediction_service import PredictionService
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/predict", tags=["Prediction"])

# Initialize dependencies for prediction route
_adapter = PredictionAdapter()
_prediction_service = PredictionService(adapter=_adapter)


@router.post(
    "/",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict next-day cashflow",
    description="Accepts engineered cashflow features and returns predicted next-day net cashflow.",
)
def predict_cashflow(request: PredictionRequest) -> PredictionResponse:
    """Predict next-day cashflow based on input features."""
    logger.info("Received cashflow prediction request")
    try:
        predicted_value = _prediction_service.predict(request.model_dump())
        return PredictionResponse(predicted_cashflow=predicted_value)
    except NotImplementedError:
        logger.warning("Prediction engine is not connected yet")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Prediction engine has not been connected yet.",
        )
