"""Adapter for bridging backend services with the ML liquidity inference module."""

from typing import Dict, Any
from ml.src.liquidity.liquidity_inference import assess_liquidity


class LiquidityAdapter:
    """Adapter for ML liquidity inference assessment."""

    def assess(
        self,
        predicted_cashflow: float,
        features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Assess liquidity using the ML module's assess_liquidity function.

        Args:
            predicted_cashflow: Predicted net cashflow value.
            features: Dictionary containing feature values.

        Returns:
            Dictionary containing liquidity_score, risk classification, and recommendations.
        """
        # Map feature dictionary keys to PascalCase expected by assess_liquidity
        ml_features = {
            "Cash_In": float(features.get("Cash_In", features.get("cash_in", 0.0))),
            "Cash_Out": float(features.get("Cash_Out", features.get("cash_out", 0.0))),
            "End_Balance": float(features.get("End_Balance", features.get("end_balance", 0.0))),
            "Rolling_Std_7": float(features.get("Rolling_Std_7", features.get("rolling_std_7", 0.0))),
            "Negative_Streak": int(features.get("Negative_Streak", features.get("negative_streak", 0))),
        }
        return assess_liquidity(predicted_cashflow, ml_features)
