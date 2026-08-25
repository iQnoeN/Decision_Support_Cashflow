"""
Prophet Forecasting Model Training Pipeline

Trains a Facebook Prophet time-series model on daily cashflow data
and evaluates its performance using chronological train/test split.
"""

from pathlib import Path
import json
import logging
import warnings

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from prophet import Prophet
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)

# Suppress Prophet / cmdstanpy verbose logs
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)
warnings.filterwarnings("ignore")


# -------------------------------------------------
# Paths
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "daily_cashflow.csv"

MODEL_PATH = ML_ROOT / "models" / "prophet_model.pkl"

OUTPUT_DIR = ML_ROOT / "outputs" / "prophet"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Load daily cashflow dataset from CSV."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)


# -------------------------------------------------
# Prepare Prophet Dataset
# -------------------------------------------------

def prepare_prophet_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Format dataset for Prophet by renaming Date -> ds and Net_Cashflow -> y.
    """
    prophet_df = pd.DataFrame({
        "ds": pd.to_datetime(df["Date"]),
        "y": df["Net_Cashflow"]
    })
    return prophet_df


# -------------------------------------------------
# Chronological Train/Test Split
# -------------------------------------------------

def split_data(
    df: pd.DataFrame, train_ratio: float = 0.8
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split time-series data chronologically (80% train, 20% test).
    """
    split_index = int(len(df) * train_ratio)
    train_df = df.iloc[:split_index].copy()
    test_df = df.iloc[split_index:].copy()
    return train_df, test_df


# -------------------------------------------------
# Train Model
# -------------------------------------------------

def train_model(train_df: pd.DataFrame) -> Prophet:
    """Initialize and fit Prophet model on training data."""
    model = Prophet(
        yearly_seasonality="auto",
        weekly_seasonality=True,
        daily_seasonality=False
    )
    model.fit(train_df)
    return model


# -------------------------------------------------
# Generate Predictions
# -------------------------------------------------

def generate_predictions(model: Prophet, test_df: pd.DataFrame) -> np.ndarray:
    """Generate forecast predictions for test dataset timestamps."""
    future = test_df[["ds"]].copy()
    forecast = model.predict(future)
    return forecast["yhat"].values


# -------------------------------------------------
# Evaluate Model
# -------------------------------------------------

def evaluate_model(y_test: pd.Series, predictions: np.ndarray) -> dict:
    """Compute MAE, MSE, RMSE, and R2 evaluation metrics."""
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    metrics = {
        "MAE": round(float(mae), 2),
        "MSE": round(float(mse), 2),
        "RMSE": round(float(rmse), 2),
        "R2": round(float(r2), 4)
    }
    return metrics


# -------------------------------------------------
# Save Model
# -------------------------------------------------

def save_model(model: Prophet, model_path: Path = MODEL_PATH) -> None:
    """Save trained Prophet model to disk using joblib."""
    joblib.dump(model, model_path)


# -------------------------------------------------
# Save Predictions
# -------------------------------------------------

def save_predictions(
    y_test: pd.Series, predictions: np.ndarray, output_dir: Path = OUTPUT_DIR
) -> pd.DataFrame:
    """Save actual vs. predicted values to CSV."""
    prediction_df = pd.DataFrame({
        "Actual": y_test.values,
        "Predicted": predictions
    })
    prediction_df.to_csv(output_dir / "predictions.csv", index=False)
    return prediction_df


# -------------------------------------------------
# Save Metrics
# -------------------------------------------------

def save_metrics(metrics: dict, output_dir: Path = OUTPUT_DIR) -> None:
    """Save evaluation metrics to JSON file."""
    with open(output_dir / "metrics.json", "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=4)


# -------------------------------------------------
# Save Prediction Plot
# -------------------------------------------------

def save_plot(
    y_test: pd.Series, predictions: np.ndarray, output_dir: Path = OUTPUT_DIR
) -> None:
    """Generate and save actual vs. predicted cashflow plot."""
    plt.figure(figsize=(12, 6))
    plt.plot(y_test.values, label="Actual")
    plt.plot(predictions, label="Predicted")
    plt.title("Prophet Prediction")
    plt.xlabel("Test Samples")
    plt.ylabel("Net Cashflow")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "prediction_plot.png")
    plt.close()


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 60)
    print("PROPHET TRAINING")
    print("=" * 60)

    df = load_dataset()
    print(f"\nLoaded dataset from: {DATA_PATH}")
    print(f"Total observations:  {len(df)}")

    prophet_df = prepare_prophet_data(df)
    train_df, test_df = split_data(prophet_df, train_ratio=0.8)

    print("\nDataset Split Summary:")
    print(f"Train samples:       {len(train_df)}")
    print(f"Test samples:        {len(test_df)}")

    print("\nTraining Prophet Model...")
    model = train_model(train_df)

    predictions = generate_predictions(model, test_df)
    metrics = evaluate_model(test_df["y"], predictions)

    save_model(model)
    save_predictions(test_df["y"], predictions)
    save_metrics(metrics)
    save_plot(test_df["y"], predictions)

    print("\nTraining Complete!\n")
    print("Evaluation Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print("\nSaved Files:")
    print(f"  Model:   {MODEL_PATH}")
    print(f"  Outputs: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
