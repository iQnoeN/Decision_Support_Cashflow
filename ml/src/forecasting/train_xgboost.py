"""
XGBoost Forecasting Model Training Pipeline

Trains an XGBoost regressor on the augmented cashflow dataset
and evaluates performance using a chronological train/test split.
"""

from pathlib import Path
import json

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from xgboost import XGBRegressor


# -------------------------------------------------
# Paths
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "augmented_training_dataset.csv"

MODEL_PATH = ML_ROOT / "models" / "xgboost_model.pkl"

OUTPUT_DIR = ML_ROOT / "outputs" / "xgboost"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Load augmented training dataset from CSV."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)


# -------------------------------------------------
# Prepare Features
# -------------------------------------------------

def prepare_data(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Extract feature matrix X and target vector y."""
    feature_columns = [
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
    ]
    X = df[feature_columns]
    y = df["Target"]
    return X, y


# -------------------------------------------------
# Chronological Train/Test Split
# -------------------------------------------------

def split_data(
    X: pd.DataFrame, y: pd.Series, train_ratio: float = 0.8
) -> tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Split features and target chronologically (80% train, 20% test)."""
    split_index = int(len(X) * train_ratio)
    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]
    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]
    return X_train, X_test, y_train, y_test


# -------------------------------------------------
# Train Model
# -------------------------------------------------

def train_model(X_train: pd.DataFrame, y_train: pd.Series) -> XGBRegressor:
    """Initialize and fit XGBoost regressor model."""
    model = XGBRegressor(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    return model


# -------------------------------------------------
# Evaluate Model
# -------------------------------------------------

def evaluate_model(
    model: XGBRegressor, X_test: pd.DataFrame, y_test: pd.Series
) -> tuple[np.ndarray, dict]:
    """Generate predictions and compute MAE, MSE, RMSE, and R2 metrics."""
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    mse = mean_squared_error(y_test, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(y_test, predictions)

    metrics = {
        "MAE": round(float(mae), 2),
        "MSE": round(float(mse), 2),
        "RMSE": round(float(rmse), 2),
        "R2": round(float(r2), 4),
    }
    return predictions, metrics


# -------------------------------------------------
# Save Model
# -------------------------------------------------

def save_model(model: XGBRegressor, model_path: Path = MODEL_PATH) -> None:
    """Save trained XGBoost model to disk using joblib."""
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
        "Predicted": predictions,
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
# Save Feature Importance
# -------------------------------------------------

def save_feature_importance(
    model: XGBRegressor, X: pd.DataFrame, output_dir: Path = OUTPUT_DIR
) -> pd.DataFrame:
    """Extract and save feature importances sorted descending."""
    importance_df = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_,
    })
    importance_df = importance_df.sort_values(by="Importance", ascending=False)
    importance_df.to_csv(output_dir / "feature_importance.csv", index=False)
    return importance_df


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
    plt.title("XGBoost Prediction")
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
    print("XGBOOST TRAINING")
    print("=" * 60)

    df = load_dataset()
    print(f"\nLoaded dataset from: {DATA_PATH}")
    print(f"Total observations:  {len(df)}")

    X, y = prepare_data(df)
    X_train, X_test, y_train, y_test = split_data(X, y, train_ratio=0.8)

    print("\nDataset Split Summary:")
    print(f"Train samples:       {len(X_train)}")
    print(f"Test samples:        {len(X_test)}")

    print("\nTraining XGBoost Model...")
    model = train_model(X_train, y_train)

    predictions, metrics = evaluate_model(model, X_test, y_test)

    save_model(model)
    save_predictions(y_test, predictions)
    save_metrics(metrics)
    importance_df = save_feature_importance(model, X)
    save_plot(y_test, predictions)

    print("\nTraining Complete!\n")
    print("Evaluation Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print("\nFeature Importance Ranking:")
    print(importance_df.to_string(index=False))

    print("\nSaved Files:")
    print(f"  Model:   {MODEL_PATH}")
    print(f"  Outputs: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
