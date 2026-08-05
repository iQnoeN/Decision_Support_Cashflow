"""Prediction service module for orchestrating cashflow prediction requests."""

from typing import Dict, Any

from app.integrations.prediction_adapter import PredictionAdapter


class PredictionService:
    """Service responsible for validating features and orchestrating predictions via the adapter."""

    def __init__(self, adapter: PredictionAdapter) -> None:
        """Initialize the PredictionService with a PredictionAdapter dependency.

        Args:
            adapter: An instance of PredictionAdapter.
        """
        self.adapter = adapter

    def predict(self, features: Dict[str, Any]) -> float:
        """Validate input features and delegate prediction to the PredictionAdapter.

        Args:
            features: Dictionary containing engineered features required for prediction.

        Returns:
            Predicted cashflow value as a float.

        Raises:
            ValueError: If features is None or not a dictionary.
            NotImplementedError: Propagated from adapter when prediction logic is unimplemented.
        """
        if features is None or not isinstance(features, dict):
            raise ValueError("Features must be a valid dictionary.")

        return self.adapter.predict(features)
