"""Adapter for bridging backend services with ML liquidity assessment and XGBoost risk classification."""

from typing import Dict, Any, Optional

from app.integrations.liquidity_classifier_adapter import LiquidityClassifierAdapter
from ml.src.liquidity.liquidity_inference import (
    assess_liquidity,
    calculate_cash_ratio,
    recommendations,
)


class LiquidityAdapter:
    """Adapter combining rule-based numerical liquidity scoring with XGBoost Risk Classification."""

    def __init__(
        self,
        classifier_adapter: Optional[LiquidityClassifierAdapter] = None,
    ) -> None:
        """Initialize LiquidityAdapter with optional LiquidityClassifierAdapter instance.

        Args:
            classifier_adapter: Instance of LiquidityClassifierAdapter.
        """
        self.classifier_adapter = classifier_adapter or LiquidityClassifierAdapter()

    def assess(
        self,
        predicted_cashflow: float,
        features: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Assess numerical liquidity score and predict risk category using XGBoost classifier.

        Args:
            predicted_cashflow: Predicted net cashflow value from XGBoost Regressor model.
            features: Dictionary containing financial features.

        Returns:
            Dictionary containing liquidity_score, risk, and recommendations.
        """
        # 1. Map features for rule-based engine calculations (liquidity score and recommendations)
        ml_features = {
            "Cash_In": float(features.get("Cash_In", features.get("cash_in", 0.0))),
            "Cash_Out": float(features.get("Cash_Out", features.get("cash_out", 0.0))),
            "End_Balance": float(features.get("End_Balance", features.get("end_balance", 0.0))),
            "Rolling_Std_7": float(features.get("Rolling_Std_7", features.get("rolling_std_7", 0.0))),
            "Negative_Streak": int(features.get("Negative_Streak", features.get("negative_streak", 0))),
        }

        # 2. Compute rule-based liquidity assessment (preserves numerical liquidity score)
        rule_assessment = assess_liquidity(predicted_cashflow, ml_features)
        liquidity_score = float(rule_assessment["liquidity_score"])

        # 3. Predict primary Risk Label using XGBoost Liquidity Classifier
        risk_label = self.classifier_adapter.predict_risk(predicted_cashflow, features)

        # 4. Generate recommendations based on XGBoost risk label and business rules
        cash_ratio = calculate_cash_ratio(ml_features["Cash_In"], ml_features["Cash_Out"])
        recs = recommendations(
            risk_label,
            cash_ratio,
            ml_features["End_Balance"],
            ml_features["Negative_Streak"],
        )

        return {
            "liquidity_score": liquidity_score,
            "risk": risk_label,
            "recommendations": recs,
        }
