"""Prediction adapter interface for ML model integration."""

from pathlib import Path
from typing import Dict, Any, Optional

import joblib
import pandas as pd

from app.utils.logging import get_logger

logger = get_logger(__name__)


class PredictionAdapter:
    """Adapter bridging backend services and the trained Random Forest ML model."""

    def __init__(self, model_path: Optional[Path] = None) -> None:
        """Initialize adapter with optional model path and private model cache."""
        if model_path is None:
            project_root = Path(__file__).resolve().parents[3]
            model_path = project_root / "ml" / "models" / "random_forest_model.pkl"

        self.model_path = model_path
        self._model: Optional[Any] = None

    def _load_model(self) -> Any:
        """Lazy load and cache the trained Random Forest model."""
        if self._model is None:
            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Trained model artifact not found at: {self.model_path}"
                )
            logger.info(f"Loading trained ML model from {self.model_path}")
            self._model = joblib.load(self.model_path)
            logger.info("ML model successfully loaded and cached")
        return self._model

    def predict(self, features: Dict[str, Any]) -> float:
        """Predict the next-day net cashflow.

        Args:
            features: Dictionary containing engineered features.

        Returns:
            Predicted cashflow value.
        """
        model = self._load_model()

        # Map request features into exact column names expected by the trained model
        input_data = {
            "Cash_In": float(features["cash_in"]),
            "Cash_Out": float(features["cash_out"]),
            "End_Balance": float(features["end_balance"]),
            "Transaction_Count": int(features["transaction_count"]),
            "Lag_1": float(features["lag_1"]),
            "Lag_7": float(features["lag_7"]),
            "Rolling_Mean_7": float(features["rolling_mean_7"]),
            "Rolling_Std_7": float(features["rolling_std_7"]),
            "Rolling_CashIn_7": float(features["rolling_cashin_7"]),
            "Rolling_CashOut_7": float(features["rolling_cashout_7"]),
        }

        df = pd.DataFrame([input_data])
        predictions = model.predict(df)
        return float(predictions[0])
