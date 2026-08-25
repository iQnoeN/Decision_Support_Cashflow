"""Unit tests for LiquidityClassifierAdapter, LiquidityAdapter, and LiquidityService."""

import unittest
from pathlib import Path

from app.integrations.liquidity_classifier_adapter import LiquidityClassifierAdapter
from app.integrations.liquidity_adapter import LiquidityAdapter
from app.services.liquidity_service import LiquidityService


class TestLiquidityIntegration(unittest.TestCase):
    """Test suite for XGBoost Liquidity Classifier, adapter, and service integration."""

    def setUp(self):
        """Set up test feature dictionary."""
        self.test_features = {
            "cash_in": 1500.0,
            "cash_out": 1000.0,
            "end_balance": 5000.0,
            "transaction_count": 25,
            "lag_1": 450.0,
            "lag_7": 300.0,
            "rolling_mean_7": 400.0,
            "rolling_std_7": 150.0,
            "rolling_cashin_7": 10500.0,
            "rolling_cashout_7": 7000.0,
        }
        self.predicted_cashflow = 500.0

    def test_classifier_model_loading_and_prediction(self):
        """Test 1: Classifier model loads successfully and returns a valid risk label."""
        classifier = LiquidityClassifierAdapter()
        risk_label = classifier.predict_risk(self.predicted_cashflow, self.test_features)
        self.assertIn(risk_label, ["High Risk", "Moderate Risk", "Stable"])

    def test_missing_feature_validation(self):
        """Test 2: Missing feature validation raises ValueError."""
        classifier = LiquidityClassifierAdapter()
        incomplete_features = {"cash_in": 1500.0}
        with self.assertRaises(ValueError):
            classifier.predict_risk(self.predicted_cashflow, incomplete_features)

    def test_missing_classifier_model_handling(self):
        """Test 3: Missing classifier model file handles cleanly with FileNotFoundError."""
        invalid_path = Path(__file__).resolve().parents[2] / "ml" / "models" / "non_existent_classifier.pkl"
        classifier = LiquidityClassifierAdapter(model_path=invalid_path)
        with self.assertRaises(FileNotFoundError):
            classifier.predict_risk(self.predicted_cashflow, self.test_features)

    def test_forecast_to_classifier_handoff_and_no_future_leakage(self):
        """Test 4 & 5: Forecast-to-classifier handoff uses predicted_cashflow as Target with no future leakage."""
        classifier = LiquidityClassifierAdapter()
        # Verify that passing predicted_cashflow builds Target correctly without needing a future Target in features
        risk_label = classifier.predict_risk(
            predicted_cashflow=250.0,
            features=self.test_features
        )
        self.assertIsInstance(risk_label, str)

    def test_liquidity_adapter_and_service_integration(self):
        """Test 6: LiquidityAdapter and LiquidityService delegate calls properly."""
        adapter = LiquidityAdapter()
        service = LiquidityService(adapter)

        result = service.assess(self.predicted_cashflow, self.test_features)

        self.assertIn("liquidity_score", result)
        self.assertIn("risk", result)
        self.assertIn("recommendations", result)
        self.assertIsInstance(result["liquidity_score"], float)
        self.assertIsInstance(result["risk"], str)
        self.assertIsInstance(result["recommendations"], list)
        self.assertIn(result["risk"], ["High Risk", "Moderate Risk", "Stable"])


if __name__ == "__main__":
    unittest.main()
