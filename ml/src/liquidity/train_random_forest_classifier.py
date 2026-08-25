"""
Random Forest Liquidity Classifier Training Pipeline

Trains an ensemble Random Forest classifier on the labeled liquidity dataset
to predict financial risk categories (High Risk, Moderate Risk, Stable).
"""

from pathlib import Path
import json

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.preprocessing import LabelEncoder


# -------------------------------------------------
# Paths & Settings
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "liquidity_training_dataset.csv"

MODEL_PATH = ML_ROOT / "models" / "random_forest_classifier.pkl"

OUTPUT_DIR = ML_ROOT / "outputs" / "random_forest_classifier"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Load labeled liquidity dataset from CSV."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)


# -------------------------------------------------
# Feature Preparation & Target Encoding
# -------------------------------------------------

def prepare_data(
    df: pd.DataFrame,
) -> tuple[pd.DataFrame, np.ndarray, LabelEncoder]:
    """
    Extract features and encode string target labels using LabelEncoder.
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
        "Target",
    ]
    X = df[feature_columns]

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(df["Risk_Label"])

    return X, y_encoded, label_encoder


# -------------------------------------------------
# Chronological Train/Test Split
# -------------------------------------------------

def split_data(
    X: pd.DataFrame, y: np.ndarray, train_ratio: float = 0.8
) -> tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray]:
    """Split features and target chronologically (80% train, 20% test)."""
    split_index = int(len(X) * train_ratio)
    X_train = X.iloc[:split_index]
    X_test = X.iloc[split_index:]
    y_train = y[:split_index]
    y_test = y[split_index:]
    return X_train, X_test, y_train, y_test


# -------------------------------------------------
# Train Model
# -------------------------------------------------

def train_model(
    X_train: pd.DataFrame, y_train: np.ndarray
) -> RandomForestClassifier:
    """Initialize and fit multi-class Random Forest classifier."""
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    return model


# -------------------------------------------------
# Evaluate Model
# -------------------------------------------------

def evaluate_model(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    y_test: np.ndarray,
    label_encoder: LabelEncoder,
) -> tuple[np.ndarray, dict, str, pd.DataFrame]:
    """
    Generate predictions and compute Accuracy, Precision, Recall, F1, and Confusion Matrix.
    """
    predictions = model.predict(X_test)

    acc = accuracy_score(y_test, predictions)
    prec = precision_score(y_test, predictions, average="weighted")
    rec = recall_score(y_test, predictions, average="weighted")
    f1 = f1_score(y_test, predictions, average="weighted")

    metrics = {
        "Accuracy": round(float(acc), 4),
        "Precision_Weighted": round(float(prec), 4),
        "Recall_Weighted": round(float(rec), 4),
        "F1_Score_Weighted": round(float(f1), 4),
    }

    report_str = classification_report(
        y_test,
        predictions,
        target_names=label_encoder.classes_,
        digits=4,
    )

    cm_matrix = confusion_matrix(y_test, predictions)
    cm_df = pd.DataFrame(
        cm_matrix,
        index=label_encoder.classes_,
        columns=label_encoder.classes_,
    )

    return predictions, metrics, report_str, cm_df


# -------------------------------------------------
# Extract Feature Importance
# -------------------------------------------------

def extract_feature_importance(
    model: RandomForestClassifier, X: pd.DataFrame
) -> pd.DataFrame:
    """Extract and sort feature importances descending."""
    importance_df = pd.DataFrame({
        "Feature": X.columns,
        "Importance": model.feature_importances_,
    })
    return importance_df.sort_values(by="Importance", ascending=False)


# -------------------------------------------------
# Save Artifacts & Visualizations
# -------------------------------------------------

def save_artifacts(
    model: RandomForestClassifier,
    label_encoder: LabelEncoder,
    y_test: np.ndarray,
    predictions: np.ndarray,
    metrics: dict,
    report_str: str,
    cm_df: pd.DataFrame,
    importance_df: pd.DataFrame,
    output_dir: Path = OUTPUT_DIR,
) -> None:
    """Save model, metrics, predictions, reports, and visualization plots."""
    # 1. Model Bundle
    joblib.dump(
        {
            "model": model,
            "label_encoder": label_encoder,
        },
        MODEL_PATH,
    )

    # 2. Metrics JSON
    with open(output_dir / "metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=4)

    # 3. Classification Report TXT
    with open(
        output_dir / "classification_report.txt", "w", encoding="utf-8"
    ) as f:
        f.write(report_str)

    # 4. Confusion Matrix CSV
    cm_df.to_csv(output_dir / "confusion_matrix.csv")

    # 5. Feature Importance CSV
    importance_df.to_csv(output_dir / "feature_importance.csv", index=False)

    # 6. Predictions CSV
    pred_df = pd.DataFrame({
        "Actual_Code": y_test,
        "Actual_Label": label_encoder.inverse_transform(y_test),
        "Predicted_Code": predictions,
        "Predicted_Label": label_encoder.inverse_transform(predictions),
    })
    pred_df.to_csv(output_dir / "predictions.csv", index=False)

    # 7. Confusion Matrix Heatmap PNG
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm_df, annot=True, fmt="d", cmap="Blues")
    plt.title("Random Forest Confusion Matrix")
    plt.xlabel("Predicted Label")
    plt.ylabel("Actual Label")
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png")
    plt.close()

    # 8. Feature Importance Bar Chart PNG
    plt.figure(figsize=(10, 6))
    sns.barplot(
        data=importance_df,
        x="Importance",
        y="Feature",
        palette="viridis",
        hue="Feature",
        legend=False,
    )
    plt.title("Random Forest Feature Importances")
    plt.xlabel("Importance Score")
    plt.ylabel("Feature")
    plt.tight_layout()
    plt.savefig(output_dir / "feature_importance.png")
    plt.close()


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 60)
    print("RANDOM FOREST LIQUIDITY CLASSIFIER")
    print("=" * 60)

    df = load_dataset()
    print(f"\nLoaded dataset from: {DATA_PATH}")
    print(f"Total observations:  {len(df)}")
    print(f"Feature columns:     11")

    print("\nClass Distribution:")
    print(df["Risk_Label"].value_counts().to_string())

    X, y, label_encoder = prepare_data(df)
    X_train, X_test, y_train, y_test = split_data(X, y, train_ratio=0.8)

    print("\nDataset Split Summary:")
    print(f"Train samples:       {len(X_train)}")
    print(f"Test samples:        {len(X_test)}")

    print("\nTraining Random Forest Classifier...")
    model = train_model(X_train, y_train)

    predictions, metrics, report_str, cm_df = evaluate_model(
        model, X_test, y_test, label_encoder
    )
    importance_df = extract_feature_importance(model, X)

    save_artifacts(
        model,
        label_encoder,
        y_test,
        predictions,
        metrics,
        report_str,
        cm_df,
        importance_df,
    )

    print("\nTraining Complete!\n")
    print("Evaluation Metrics:")
    for key, value in metrics.items():
        print(f"  {key}: {value}")

    print("\nTop 10 Feature Importances:")
    print(importance_df.head(10).to_string(index=False))

    print("\nSaved Files:")
    print(f"  Model:   {MODEL_PATH}")
    print(f"  Outputs: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
