"""Prediction API routes for cashflow forecasting and liquidity assessment."""

from fastapi import APIRouter, HTTPException, status

from app.integrations.prediction_adapter import PredictionAdapter
from app.integrations.liquidity_adapter import LiquidityAdapter
from app.services.liquidity_service import LiquidityService
from app.services.prediction_service import PredictionService
from app.schemas.request import PredictionRequest
from app.schemas.response import PredictionResponse
from app.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/predict", tags=["Prediction"])

# Initialize dependencies for prediction route
_prediction_adapter = PredictionAdapter()
_liquidity_adapter = LiquidityAdapter()
_liquidity_service = LiquidityService(adapter=_liquidity_adapter)
_prediction_service = PredictionService(
    prediction_adapter=_prediction_adapter,
    liquidity_service=_liquidity_service,
)


@router.post(
    "/",
    response_model=PredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict next-day cashflow and assess liquidity",
    description="Accepts engineered cashflow features and returns predicted next-day net cashflow along with liquidity assessment.",
)
def predict_cashflow(request: PredictionRequest) -> PredictionResponse:
    """Predict next-day cashflow and assess financial liquidity based on input features."""
    logger.info("Received cashflow prediction request")
    try:
        assessment_result = _prediction_service.predict(request.model_dump())
        return PredictionResponse(**assessment_result)
    except NotImplementedError:
        logger.warning("Prediction engine is not connected yet")
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Prediction engine has not been connected yet.",
        )
