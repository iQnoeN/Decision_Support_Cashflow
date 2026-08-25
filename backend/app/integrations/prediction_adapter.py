"""Prediction adapter interface for XGBoost forecasting ML model integration."""

from pathlib import Path
from typing import Dict, Any, Optional

import joblib
import pandas as pd

from app.utils.logging import get_logger

logger = get_logger(__name__)

# Exact feature order required by the XGBoost forecasting model
REQUIRED_FEATURE_KEYS = [
    "cash_in",
    "cash_out",
    "end_balance",
    "transaction_count",
    "lag_1",
    "lag_7",
    "rolling_mean_7",
    "rolling_std_7",
    "rolling_cashin_7",
    "rolling_cashout_7",
]

FEATURE_COLUMNS_ORDER = [
    "Cash_In",
    "Cash_Out",
    "End_Balance",
    "Transaction_Count",
    "Lag_1",
    "Lag_7",
    "Rolling_Mean_7",
    "Rolling_Std_7",
    "Rolling_CashIn_7",
    "Rolling_CashOut_7",
]


class PredictionAdapter:
    """Adapter bridging backend services and the trained XGBoost forecasting ML model."""

    def __init__(self, model_path: Optional[Path] = None) -> None:
        """Initialize adapter with optional model path and private model cache."""
        if model_path is None:
            project_root = Path(__file__).resolve().parents[3]
            model_path = project_root / "ml" / "models" / "xgboost_model.pkl"

        self.model_path = model_path
        self._model: Optional[Any] = None

    def _load_model(self) -> Any:
        """Lazy load and cache the trained XGBoost forecasting model."""
        if self._model is None:
            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Trained XGBoost forecasting model artifact not found at: {self.model_path}"
                )
            logger.info(f"Loading trained XGBoost ML model from {self.model_path}")
            self._model = joblib.load(self.model_path)
            logger.info("XGBoost ML model successfully loaded and cached")
        return self._model

    def predict(self, features: Dict[str, Any]) -> float:
        """Predict the next-day net cashflow using the XGBoost forecasting model.

        Args:
            features: Dictionary containing engineered cashflow features.

        Returns:
            Predicted cashflow numeric value.

        Raises:
            ValueError: If features is invalid or missing required feature keys.
            FileNotFoundError: If the XGBoost model file does not exist.
        """
        if not features or not isinstance(features, dict):
            raise ValueError("Features must be a non-empty dictionary.")

        missing_keys = [k for k in REQUIRED_FEATURE_KEYS if k not in features]
        if missing_keys:
            raise ValueError(
                f"Missing required feature(s) for prediction: {', '.join(missing_keys)}"
            )

        model = self._load_model()

        # Map request features into exact column names and order expected by trained XGBoost model
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

        df = pd.DataFrame([input_data])[FEATURE_COLUMNS_ORDER]
        predictions = model.predict(df)
        return float(predictions[0])
