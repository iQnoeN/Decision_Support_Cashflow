from pathlib import Path
import json

import joblib
import matplotlib.pyplot as plt
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    root_mean_squared_error,
    r2_score,
)


# -------------------------------------------------
# Paths
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "training_dataset.csv"

MODEL_PATH = ML_ROOT / "models" / "random_forest_model.pkl"

OUTPUT_DIR = ML_ROOT / "outputs"

OUTPUT_DIR.mkdir(exist_ok=True)


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset():
    return pd.read_csv(DATA_PATH)


# -------------------------------------------------
# Prepare Features
# -------------------------------------------------

def prepare_data(df):

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

def split_data(X, y):

    split_index = int(len(X) * 0.8)

    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]

    y_train = y.iloc[:split_index]
    y_test = y.iloc[split_index:]

    return X_train, X_test, y_train, y_test


# -------------------------------------------------
# Train Model
# -------------------------------------------------

def train_model(X_train, y_train):

    model = RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        max_depth=10,
        min_samples_leaf=2,
        n_jobs=-1
    )

    model.fit(X_train, y_train)

    return model


# -------------------------------------------------
# Evaluate Model
# -------------------------------------------------

def evaluate_model(model, X_test, y_test):

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)

    mse = mean_squared_error(
        y_test,
        predictions
    )

    rmse = mse ** 0.5

    r2 = r2_score(
        y_test,
        predictions
    )

    metrics = {
        "MAE": round(mae, 2),
        "MSE": round(mse, 2),
        "RMSE": round(rmse, 2),
        "R2": round(r2, 4)
    }

    return predictions, metrics


# -------------------------------------------------
# Save Model
# -------------------------------------------------

def save_model(model):

    joblib.dump(
        model,
        MODEL_PATH
    )


# -------------------------------------------------
# Save Predictions
# -------------------------------------------------

def save_predictions(y_test, predictions):

    prediction_df = pd.DataFrame({
        "Actual": y_test.values,
        "Predicted": predictions
    })

    prediction_df.to_csv(
        OUTPUT_DIR / "predictions.csv",
        index=False
    )

    return prediction_df


# -------------------------------------------------
# Save Metrics
# -------------------------------------------------

def save_metrics(metrics):

    with open(
        OUTPUT_DIR / "metrics.json",
        "w"
    ) as file:

        json.dump(
            metrics,
            file,
            indent=4
        )


# -------------------------------------------------
# Save Feature Importance
# -------------------------------------------------

def save_feature_importance(model, X):

    importance = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_
    })

    importance = importance.sort_values(
        by="Importance",
        ascending=False
    )

    importance.to_csv(
        OUTPUT_DIR / "feature_importance.csv",
        index=False
    )


# -------------------------------------------------
# Save Prediction Plot
# -------------------------------------------------

def save_plot(y_test, predictions):

    plt.figure(figsize=(12,6))

    plt.plot(
        y_test.values,
        label="Actual"
    )

    plt.plot(
        predictions,
        label="Predicted"
    )

    plt.title("Random Forest Prediction")

    plt.xlabel("Test Samples")

    plt.ylabel("Net Cashflow")

    plt.legend()

    plt.tight_layout()

    plt.savefig(
        OUTPUT_DIR / "prediction_plot.png"
    )

    plt.close()


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():

    print("=" * 60)
    print("RANDOM FOREST TRAINING")
    print("=" * 60)

    df = load_dataset()
    print("\n" + "=" * 60)
    print("TARGET VARIABLE SUMMARY")
    print("=" * 60)
    print(df["Target"].describe())

    X, y = prepare_data(df)

    X_train, X_test, y_train, y_test = split_data(X, y)

    model = train_model(
        X_train,
        y_train
    )

    predictions, metrics = evaluate_model(
        model,
        X_test,
        y_test
    )

    save_model(model)

    save_predictions(
        y_test,
        predictions
    )

    save_metrics(metrics)

    save_feature_importance(
        model,
        X
    )

    save_plot(
        y_test,
        predictions
    )

    print("\nTraining Complete!\n")

    print("Evaluation Metrics")

    for key, value in metrics.items():
        print(f"{key}: {value}")

    print("\nSaved Files:")

    print(f"Model: {MODEL_PATH}")

    print(f"Outputs: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()