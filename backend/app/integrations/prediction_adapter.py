"""Prediction adapter interface for ML model integration."""

from typing import Dict, Any


class PredictionAdapter:
    """Adapter interface bridging backend services and ML cashflow forecasting models."""

    def predict(self, features: Dict[str, Any]) -> float:
        """Predict the next-day cashflow.

        Args:
            features: Dictionary containing engineered features.

        Returns:
            Predicted cashflow value.

        Raises:
            NotImplementedError: Raised when prediction adapter is not yet connected.
        """
        raise NotImplementedError(
            "Prediction adapter has not yet been connected to the ML package."
        )
