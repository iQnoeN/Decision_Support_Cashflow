"""
LSTM Deep Learning Forecasting Model Training Pipeline

Trains a 7-step sliding window LSTM network on the augmented cashflow dataset
and evaluates performance using a chronological train/test split.
"""

from pathlib import Path
import json
import os

# Configure Keras backend before importing Keras modules
os.environ["KERAS_BACKEND"] = "torch"

import joblib
import keras
from keras import Input, Sequential
from keras.callbacks import EarlyStopping
from keras.layers import Dense, Dropout, LSTM
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.preprocessing import MinMaxScaler


# -------------------------------------------------
# Paths & Settings
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "augmented_training_dataset.csv"

MODEL_PATH = ML_ROOT / "models" / "lstm_model.keras"

SCALER_PATH = ML_ROOT / "models" / "lstm_scalers.pkl"

OUTPUT_DIR = ML_ROOT / "outputs" / "lstm"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

WINDOW_SIZE = 7


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Load augmented training dataset from CSV."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)


# -------------------------------------------------
# Chronological Split & Feature Scaling
# -------------------------------------------------

def split_and_scale_data(
    df: pd.DataFrame, train_ratio: float = 0.8
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, MinMaxScaler, MinMaxScaler]:
    """
    Split data chronologically and fit MinMaxScaler ONLY on training set.
    """
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
    target_column = "Target"

    split_index = int(len(df) * train_ratio)
    train_df = df.iloc[:split_index]
    test_df = df.iloc[split_index:]

    scaler_x = MinMaxScaler()
    scaler_y = MinMaxScaler()

    train_x_scaled = scaler_x.fit_transform(train_df[feature_columns])
    train_y_scaled = scaler_y.fit_transform(train_df[[target_column]])

    test_x_scaled = scaler_x.transform(test_df[feature_columns])
    test_y_scaled = scaler_y.transform(test_df[[target_column]])

    return (
        train_x_scaled,
        train_y_scaled,
        test_x_scaled,
        test_y_scaled,
        scaler_x,
        scaler_y,
    )


# -------------------------------------------------
# Prepare Sequences (Sliding Window)
# -------------------------------------------------

def prepare_sequences(
    x_data: np.ndarray, y_data: np.ndarray, window_size: int = WINDOW_SIZE
) -> tuple[np.ndarray, np.ndarray]:
    """
    Create sliding window sequences of (samples, window_size, features) and targets.
    """
    X_seq, y_seq = [], []
    for i in range(len(x_data) - window_size):
        X_seq.append(x_data[i : i + window_size])
        y_seq.append(y_data[i + window_size, 0])
    return np.array(X_seq), np.array(y_seq)


# -------------------------------------------------
# Build & Train Model
# -------------------------------------------------

def build_model(input_shape: tuple[int, int]) -> Sequential:
    """Build simple baseline LSTM neural network architecture."""
    model = Sequential([
        Input(shape=input_shape),
        LSTM(50),
        Dropout(0.2),
        Dense(25, activation="relu"),
        Dense(1),
    ])
    model.compile(optimizer="adam", loss="mse")
    return model


def train_model(
    model: Sequential, X_train: np.ndarray, y_train: np.ndarray
) -> keras.callbacks.History:
    """Train LSTM model with early stopping."""
    early_stopping = EarlyStopping(
        monitor="val_loss", patience=5, restore_best_weights=True
    )
    history = model.fit(
        X_train,
        y_train,
        epochs=50,
        batch_size=32,
        validation_split=0.1,
        callbacks=[early_stopping],
        verbose=1,
    )
    return history


# -------------------------------------------------
# Evaluate Model
# -------------------------------------------------

def evaluate_model(
    model: Sequential,
    X_test_seq: np.ndarray,
    y_test_seq: np.ndarray,
    scaler_y: MinMaxScaler,
) -> tuple[np.ndarray, np.ndarray, dict]:
    """
    Predict on test sequences and calculate unscaled evaluation metrics.
    """
    y_pred_scaled = model.predict(X_test_seq)

    # Inverse transform predictions and actual targets to original scale
    predictions = scaler_y.inverse_transform(
        y_pred_scaled.reshape(-1, 1)
    ).flatten()
    actuals = scaler_y.inverse_transform(
        y_test_seq.reshape(-1, 1)
    ).flatten()

    mae = mean_absolute_error(actuals, predictions)
    mse = mean_squared_error(actuals, predictions)
    rmse = mse ** 0.5
    r2 = r2_score(actuals, predictions)

    metrics = {
        "MAE": round(float(mae), 2),
        "MSE": round(float(mse), 2),
        "RMSE": round(float(rmse), 2),
        "R2": round(float(r2), 4),
    }
    return actuals, predictions, metrics


# -------------------------------------------------
# Save Artifacts
# -------------------------------------------------

def save_artifacts(
    model: Sequential,
    history: keras.callbacks.History,
    actuals: np.ndarray,
    predictions: np.ndarray,
    metrics: dict,
    scaler_x: MinMaxScaler,
    scaler_y: MinMaxScaler,
    output_dir: Path = OUTPUT_DIR,
) -> None:
    """Save model, scalers, predictions, metrics, history, and plots."""
    # 1. Native Keras model format
    model.save(MODEL_PATH)

    # 2. Scalers
    joblib.dump({"scaler_x": scaler_x, "scaler_y": scaler_y}, SCALER_PATH)

    # 3. Predictions CSV
    pred_df = pd.DataFrame({"Actual": actuals, "Predicted": predictions})
    pred_df.to_csv(output_dir / "predictions.csv", index=False)

    # 4. Metrics JSON
    with open(output_dir / "metrics.json", "w", encoding="utf-8") as file:
        json.dump(metrics, file, indent=4)

    # 5. Training History CSV
    history_df = pd.DataFrame(history.history)
    history_df.to_csv(output_dir / "training_history.csv", index=False)

    # 6. Prediction Plot
    plt.figure(figsize=(12, 6))
    plt.plot(actuals, label="Actual")
    plt.plot(predictions, label="Predicted")
    plt.title("LSTM Prediction")
    plt.xlabel("Test Sequences")
    plt.ylabel("Net Cashflow")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "prediction_plot.png")
    plt.close()

    # 7. Loss Curve Plot
    plt.figure(figsize=(10, 5))
    plt.plot(history.history["loss"], label="Train Loss")
    if "val_loss" in history.history:
        plt.plot(history.history["val_loss"], label="Validation Loss")
    plt.title("LSTM Training Loss Curve")
    plt.xlabel("Epoch")
    plt.ylabel("Loss (MSE)")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "loss_curve.png")
    plt.close()


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 60)
    print("LSTM TRAINING")
    print("=" * 60)

    df = load_dataset()
    print(f"\nLoaded dataset from: {DATA_PATH}")
    print(f"Total observations:  {len(df)}")

    (
        train_x_scaled,
        train_y_scaled,
        test_x_scaled,
        test_y_scaled,
        scaler_x,
        scaler_y,
    ) = split_and_scale_data(df, train_ratio=0.8)

    X_train_seq, y_train_seq = prepare_sequences(
        train_x_scaled, train_y_scaled, window_size=WINDOW_SIZE
    )
    X_test_seq, y_test_seq = prepare_sequences(
        test_x_scaled, test_y_scaled, window_size=WINDOW_SIZE
    )

    print("\nSequence Summary:")
    print(f"Window Size:         {WINDOW_SIZE}")
    print(f"Features:            {X_train_seq.shape[2]}")
    print(f"X_train tensor:      {X_train_seq.shape}")
    print(f"y_train tensor:      {y_train_seq.shape}")
    print(f"X_test tensor:       {X_test_seq.shape}")
    print(f"y_test tensor:       {y_test_seq.shape}")

    print("\nBuilding and Training LSTM Model...")
    model = build_model(input_shape=(WINDOW_SIZE, X_train_seq.shape[2]))
    history = train_model(model, X_train_seq, y_train_seq)

    actuals, predictions, metrics = evaluate_model(
        model, X_test_seq, y_test_seq, scaler_y
    )

    save_artifacts(
        model,
        history,
        actuals,
        predictions,
        metrics,
        scaler_x,
        scaler_y,
    )

    print("\nTraining Complete!\n")
    print("Evaluation Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print("\nSaved Files:")
    print(f"  Model:   {MODEL_PATH}")
    print(f"  Outputs: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
