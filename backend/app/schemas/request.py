"""Prediction request schemas using Pydantic."""

from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    """Schema defining input features required for cashflow prediction."""

    cash_in: float = Field(
        ...,
        description="Total cash inflows for the current day."
    )
    cash_out: float = Field(
        ...,
        description="Total cash outflows for the current day."
    )
    end_balance: float = Field(
        ...,
        description="Ending cash balance at the end of the current day."
    )
    transaction_count: int = Field(
        ...,
        description="Total number of transactions completed during the day."
    )
    lag_1: float = Field(
        ...,
        description="Net cashflow from 1 day prior (previous day)."
    )
    lag_7: float = Field(
        ...,
        description="Net cashflow from 7 days prior (previous week)."
    )
    rolling_mean_7: float = Field(
        ...,
        description="7-day rolling average of net cashflow."
    )
    rolling_std_7: float = Field(
        ...,
        description="7-day rolling standard deviation of net cashflow."
    )
    rolling_cashin_7: float = Field(
        ...,
        description="7-day rolling sum of cash inflows."
    )
    rolling_cashout_7: float = Field(
        ...,
        description="7-day rolling sum of cash outflows."
    )
