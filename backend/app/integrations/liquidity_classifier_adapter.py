"""Adapter for bridging backend services with the trained XGBoost Liquidity Classifier."""

from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import joblib
import pandas as pd

from app.utils.logging import get_logger

logger = get_logger(__name__)

# Required 10 input feature keys (snake_case or PascalCase)
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

# Exact 11-feature column order expected by trained XGBoost Classifier
CLASSIFIER_FEATURE_COLUMNS = [
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
    "Target",
]


class LiquidityClassifierAdapter:
    """Adapter bridging backend services and the trained XGBoost Liquidity Classifier."""

    def __init__(self, model_path: Optional[Path] = None) -> None:
        """Initialize adapter with optional model path and private cache."""
        if model_path is None:
            project_root = Path(__file__).resolve().parents[3]
            model_path = project_root / "ml" / "models" / "xgboost_classifier.pkl"

        self.model_path = model_path
        self._model: Optional[Any] = None
        self._label_encoder: Optional[Any] = None

    def _load_model_bundle(self) -> Tuple[Any, Any]:
        """Lazy load and cache trained model and label encoder from artifact."""
        if self._model is None or self._label_encoder is None:
            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Trained XGBoost Classifier artifact not found at: {self.model_path}"
                )
            logger.info(f"Loading trained XGBoost Classifier from {self.model_path}")
            bundle = joblib.load(self.model_path)
            if not isinstance(bundle, dict) or "model" not in bundle or "label_encoder" not in bundle:
                raise ValueError("Model artifact is missing required 'model' or 'label_encoder' keys.")
            self._model = bundle["model"]
            self._label_encoder = bundle["label_encoder"]
            logger.info("XGBoost Classifier successfully loaded and cached")
        return self._model, self._label_encoder

    def predict_risk(self, predicted_cashflow: float, features: Dict[str, Any]) -> str:
        """Predict liquidity risk label (High Risk, Moderate Risk, Stable) using XGBoost Classifier.

        Args:
            predicted_cashflow: Forecasted net cashflow from XGBoost regressor (used as Target feature).
            features: Dictionary containing the 10 financial features.

        Returns:
            Risk classification label string.

        Raises:
            ValueError: If features is invalid or missing required keys.
            FileNotFoundError: If classifier model artifact is missing.
        """
        if not features or not isinstance(features, dict):
            raise ValueError("Features must be a non-empty dictionary.")

        # Check for missing feature keys (supporting both snake_case and PascalCase)
        missing = []
        for key in REQUIRED_FEATURE_KEYS:
            pascal_key = "".join(word.capitalize() for word in key.split("_"))
            if key not in features and pascal_key not in features and key.upper() not in features:
                missing.append(key)

        if missing:
            raise ValueError(f"Missing required feature(s) for risk classification: {', '.join(missing)}")

        model, label_encoder = self._load_model_bundle()

        # Construct 11-feature input dict mapping features + predicted cashflow as Target
        def get_val(snake_k: str, pascal_k: str) -> Any:
            return features.get(snake_k, features.get(pascal_k, 0.0))

        input_data = {
            "Cash_In": float(get_val("cash_in", "Cash_In")),
            "Cash_Out": float(get_val("cash_out", "Cash_Out")),
            "End_Balance": float(get_val("end_balance", "End_Balance")),
            "Transaction_Count": int(get_val("transaction_count", "Transaction_Count")),
            "Lag_1": float(get_val("lag_1", "Lag_1")),
            "Lag_7": float(get_val("lag_7", "Lag_7")),
            "Rolling_Mean_7": float(get_val("rolling_mean_7", "Rolling_Mean_7")),
            "Rolling_Std_7": float(get_val("rolling_std_7", "Rolling_Std_7")),
            "Rolling_CashIn_7": float(get_val("rolling_cashin_7", "Rolling_CashIn_7")),
            "Rolling_CashOut_7": float(get_val("rolling_cashout_7", "Rolling_CashOut_7")),
            "Target": float(predicted_cashflow),
        }

        df = pd.DataFrame([input_data])[CLASSIFIER_FEATURE_COLUMNS]
        pred_code = model.predict(df)[0]
        risk_label = str(label_encoder.inverse_transform([pred_code])[0])
        return risk_label
