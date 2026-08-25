"""
Liquidity Label Generator Pipeline

Applies the liquidity inference engine over the augmented cashflow dataset
to generate Liquidity_Score and Risk_Label columns for machine learning experimentation.
"""

from pathlib import Path
import sys
import pandas as pd

# Add ML root to sys.path to support module imports
ML_ROOT = Path(__file__).resolve().parents[2]
if str(ML_ROOT) not in sys.path:
    sys.path.append(str(ML_ROOT))

from src.liquidity.liquidity_inference import assess_liquidity


# -------------------------------------------------
# Paths
# -------------------------------------------------

DATA_PATH = ML_ROOT / "data" / "processed" / "augmented_training_dataset.csv"

OUTPUT_PATH = ML_ROOT / "data" / "processed" / "liquidity_training_dataset.csv"


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Load augmented dataset from CSV."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)


# -------------------------------------------------
# Generate Liquidity Labels
# -------------------------------------------------

def generate_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Run assess_liquidity() for each row to compute Liquidity_Score and Risk_Label.
    """
    scores = []
    labels = []

    for _, row in df.iterrows():
        features_dict = row.to_dict()
        predicted_cashflow = float(row["Target"])

        assessment = assess_liquidity(
            predicted_cashflow=predicted_cashflow,
            features=features_dict,
        )

        scores.append(assessment["liquidity_score"])
        labels.append(assessment["risk"])

    df["Liquidity_Score"] = scores
    df["Risk_Label"] = labels

    expected_columns = [
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
        "Liquidity_Score",
        "Risk_Label",
    ]

    return df[expected_columns]


# -------------------------------------------------
# Save Dataset
# -------------------------------------------------

def save_dataset(df: pd.DataFrame, output_path: Path = OUTPUT_PATH) -> None:
    """Save dataset with liquidity labels to CSV."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 60)
    print("LIQUIDITY LABEL GENERATION PIPELINE")
    print("=" * 60)

    df = load_dataset()
    print(f"\nLoaded dataset from: {DATA_PATH}")
    print(f"Total observations:  {len(df)}")

    print("\nGenerating Liquidity Scores and Risk Labels...")
    labeled_df = generate_labels(df)

    save_dataset(labeled_df)

    print("\nGeneration Complete!\n")
    print(
        f"Output Dataset Shape: {labeled_df.shape[0]} rows, {labeled_df.shape[1]} columns"
    )
    print("\nRisk Label Breakdown:")
    print(labeled_df["Risk_Label"].value_counts().to_string())

    print("\nSample Output:")
    print(labeled_df[["Liquidity_Score", "Risk_Label"]].head())

    print(f"\nSaved labeled dataset to: {OUTPUT_PATH}\n")


if __name__ == "__main__":
    main()
