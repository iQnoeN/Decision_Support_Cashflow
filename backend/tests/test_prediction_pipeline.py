"""Unit and API integration tests for XGBoost Prediction pipeline and Liquidity assessment."""

import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.services.prediction_service import PredictionService
from app.integrations.prediction_adapter import PredictionAdapter
from app.integrations.liquidity_adapter import LiquidityAdapter
from app.services.liquidity_service import LiquidityService


class TestPredictionPipeline(unittest.TestCase):
    """Test suite for PredictionAdapter, PredictionService, and POST /predict API endpoint."""

    def setUp(self):
        """Set up test features dictionary."""
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

    def test_xgboost_adapter_prediction(self):
        """Test that PredictionAdapter loads XGBoost model and returns a float forecast."""
        adapter = PredictionAdapter()
        prediction = adapter.predict(self.test_features)
        self.assertIsInstance(prediction, float)

    def test_xgboost_adapter_missing_features(self):
        """Test that PredictionAdapter raises ValueError when required features are missing."""
        adapter = PredictionAdapter()
        incomplete_features = {"cash_in": 100.0}
        with self.assertRaises(ValueError):
            adapter.predict(incomplete_features)

    def test_xgboost_adapter_missing_model_file(self):
        """Test that PredictionAdapter raises FileNotFoundError for invalid model path."""
        invalid_path = Path(__file__).resolve().parents[2] / "ml" / "models" / "non_existent.pkl"
        adapter = PredictionAdapter(model_path=invalid_path)
        with self.assertRaises(FileNotFoundError):
            adapter.predict(self.test_features)

    def test_prediction_service_orchestration(self):
        """Test that PredictionService orchestrates prediction and liquidity assessment."""
        pred_adapter = PredictionAdapter()
        liq_adapter = LiquidityAdapter()
        liq_service = LiquidityService(adapter=liq_adapter)
        service = PredictionService(
            prediction_adapter=pred_adapter,
            liquidity_service=liq_service
        )

        result = service.predict(self.test_features)

        self.assertIn("predicted_cashflow", result)
        self.assertIn("liquidity_score", result)
        self.assertIn("risk", result)
        self.assertIn("recommendations", result)
        self.assertIsInstance(result["predicted_cashflow"], float)
        self.assertIsInstance(result["liquidity_score"], float)
        self.assertIsInstance(result["risk"], str)
        self.assertIsInstance(result["recommendations"], list)

    def test_post_predict_endpoint(self):
        """Test POST /predict/ API route using FastAPI TestClient."""
        client = TestClient(app)
        response = client.post("/predict/", json=self.test_features)

        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertIn("predicted_cashflow", data)
        self.assertIn("liquidity_score", data)
        self.assertIn("risk", data)
        self.assertIn("recommendations", data)
        self.assertIsInstance(data["predicted_cashflow"], float)
        self.assertIsInstance(data["liquidity_score"], float)
        self.assertIsInstance(data["risk"], str)
        self.assertIsInstance(data["recommendations"], list)


if __name__ == "__main__":
    unittest.main()
