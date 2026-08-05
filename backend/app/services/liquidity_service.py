"""Service module for orchestrating liquidity assessment requests."""

from typing import Dict, Any
from app.integrations.liquidity_adapter import LiquidityAdapter


class LiquidityService:
    """Service responsible for delegating liquidity assessment to the LiquidityAdapter."""

    def __init__(self, adapter: LiquidityAdapter) -> None:
        """Initialize LiquidityService with a LiquidityAdapter instance.

        Args:
            adapter: An instance of LiquidityAdapter.
        """
        self.adapter = adapter

    def assess(
        self,
        predicted_cashflow: float,
        features: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Delegate liquidity assessment to the LiquidityAdapter.

        Args:
            predicted_cashflow: Predicted net cashflow value.
            features: Dictionary containing financial features.

        Returns:
            Dictionary containing liquidity score, risk classification, and recommendations.
        """
        return self.adapter.assess(predicted_cashflow, features)
