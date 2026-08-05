"""Upload service module for processing CSV uploads through the ML inference pipeline."""

import io
from typing import Dict, Any, Optional

import pandas as pd
from fastapi import UploadFile, HTTPException, status

from ml.src.preprocessing.preprocess import (
    convert_dates,
    sort_transactions,
    create_signed_amount,
    aggregate_daily,
)
from ml.src.features.feature_engineering import (
    convert_date_column,
    sort_by_date,
    create_lag_features,
    create_rolling_features,
    remove_missing_rows,
)
from app.services.prediction_service import PredictionService


class UploadService:
    """Service responsible for validating, preprocessing, feature engineering, and predicting from uploaded CSVs."""

    def __init__(self, prediction_service: Optional[PredictionService] = None) -> None:
        """Initialize UploadService with optional PredictionService dependency.

        Args:
            prediction_service: Instance of PredictionService.
        """
        self.prediction_service = prediction_service or PredictionService()

    def process_upload_and_predict(self, file: UploadFile) -> Dict[str, Any]:
        """Validate, preprocess, feature engineer, and execute inference for an uploaded CSV file.

        Args:
            file: Uploaded CSV file object.

        Returns:
            Dictionary containing prediction and liquidity assessment results.

        Raises:
            HTTPException: If file validation fails, CSV parsing fails, or data is insufficient.
        """
        # 1. Validate file extension
        if not file or not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided."
            )

        if not file.filename.lower().endswith(".csv"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only CSV files (.csv) are allowed."
            )

        # 2. Read CSV content into pandas DataFrame
        try:
            contents = file.file.read()
            raw_df = pd.read_csv(io.BytesIO(contents))
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to parse CSV file: {str(e)}"
            )

        if raw_df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded CSV file is empty."
            )

        # 3. Preprocess raw transactions into daily cashflow using Track A functions
        if "transactionTimestamp" in raw_df.columns:
            df = convert_dates(raw_df)
            df = sort_transactions(df)
            df = create_signed_amount(df)
            daily_df = aggregate_daily(df)
        else:
            daily_df = raw_df

        # 4. Apply Track A feature engineering functions (Skipping create_target)
        print("=" * 60)
        print(daily_df.head())
        print(daily_df.columns.tolist())
        print("=" * 60)
        engineered_df = convert_date_column(daily_df)
        engineered_df = sort_by_date(engineered_df)
        engineered_df = create_lag_features(engineered_df)
        engineered_df = create_rolling_features(engineered_df)
        engineered_df = remove_missing_rows(engineered_df)

        if engineered_df.empty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient data after feature engineering. At least 8 consecutive days of cashflow data are required."
            )

        # 5. Extract the final (most recent) row for inference
        latest_row = engineered_df.iloc[-1]

        # 6. Convert row into feature dictionary required by PredictionService
        features = {
            "cash_in": float(latest_row["Cash_In"]),
            "cash_out": float(latest_row["Cash_Out"]),
            "end_balance": float(latest_row["End_Balance"]),
            "transaction_count": int(latest_row["Transaction_Count"]),
            "lag_1": float(latest_row["Lag_1"]),
            "lag_7": float(latest_row["Lag_7"]),
            "rolling_mean_7": float(latest_row["Rolling_Mean_7"]),
            "rolling_std_7": float(latest_row["Rolling_Std_7"]),
            "rolling_cashin_7": float(latest_row["Rolling_CashIn_7"]),
            "rolling_cashout_7": float(latest_row["Rolling_CashOut_7"]),
        }

        # 7. Delegate to PredictionService
        return self.prediction_service.predict(features)
