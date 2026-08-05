"""Unit tests for LiquidityAdapter and LiquidityService."""

import unittest
from app.integrations.liquidity_adapter import LiquidityAdapter
from app.services.liquidity_service import LiquidityService


class TestLiquidityIntegration(unittest.TestCase):
    """Test suite for adapter and service integration."""

    def test_liquidity_adapter_and_service_integration(self):
        """Test that LiquidityAdapter and LiquidityService delegate calls properly."""
        adapter = LiquidityAdapter()
        service = LiquidityService(adapter)

        test_features = {
            "Cash_In": 1500.0,
            "Cash_Out": 1000.0,
            "End_Balance": 5000.0,
            "Rolling_Std_7": 400.0,
            "Negative_Streak": 0,
        }
        predicted_cashflow = 500.0

        result = service.assess(predicted_cashflow, test_features)

        self.assertIn("liquidity_score", result)
        self.assertIn("risk", result)
        self.assertIn("recommendations", result)
        self.assertIsInstance(result["liquidity_score"], float)
        self.assertIsInstance(result["risk"], str)
        self.assertIsInstance(result["recommendations"], list)


if __name__ == "__main__":
    unittest.main()
