"""Prediction service module for orchestrating cashflow prediction requests and liquidity assessment."""

from typing import Dict, Any, Optional

from app.integrations.prediction_adapter import PredictionAdapter
from app.integrations.liquidity_adapter import LiquidityAdapter
from app.services.liquidity_service import LiquidityService


class PredictionService:
    """Service responsible for validating features and orchestrating predictions and liquidity assessment."""

    def __init__(
        self,
        prediction_adapter: Optional[PredictionAdapter] = None,
        liquidity_service: Optional[LiquidityService] = None,
        adapter: Optional[PredictionAdapter] = None,
    ) -> None:
        """Initialize the PredictionService with PredictionAdapter and LiquidityService.

        Args:
            prediction_adapter: Instance of PredictionAdapter.
            liquidity_service: Instance of LiquidityService.
            adapter: Backward-compatible parameter alias for prediction_adapter.
        """
        self.prediction_adapter = prediction_adapter or adapter or PredictionAdapter()

        if liquidity_service is None:
            liquidity_adapter = LiquidityAdapter()
            liquidity_service = LiquidityService(adapter=liquidity_adapter)

        self.liquidity_service = liquidity_service

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input features, predict next-day cashflow, and delegate liquidity assessment.

        Args:
            features: Dictionary containing engineered features required for prediction.

        Returns:
            Dictionary containing predicted_cashflow, liquidity_score, risk, and recommendations.

        Raises:
            ValueError: If features is None or not a dictionary.
        """
        if features is None or not isinstance(features, dict):
            raise ValueError("Features must be a valid dictionary.")

        # 1. Predict next-day cashflow via PredictionAdapter
        predicted_cashflow = float(self.prediction_adapter.predict(features))

        # 2. Assess liquidity via LiquidityService
        liquidity_result = self.liquidity_service.assess(
            predicted_cashflow=predicted_cashflow,
            features=features
        )

        # 3. Consolidate into unified response dictionary
        return {
            "predicted_cashflow": predicted_cashflow,
            "liquidity_score": float(liquidity_result["liquidity_score"]),
            "risk": str(liquidity_result["risk"]),
            "recommendations": list(liquidity_result["recommendations"]),
        }
