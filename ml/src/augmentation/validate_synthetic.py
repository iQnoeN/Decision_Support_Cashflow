"""
Synthetic Data Quality Validation Utility

Compares statistical properties of original vs. synthetic datasets 
and generates a validation report.
"""

from pathlib import Path
import numpy as np
import pandas as pd


# -------------------------------------------------
# Paths
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

ORIGINAL_DATA_PATH = ML_ROOT / "data" / "processed" / "training_dataset.csv"

SYNTHETIC_DATA_PATH = (
    ML_ROOT / "data" / "processed" / "synthetic_training_dataset.csv"
)

OUTPUT_DIR = ML_ROOT / "outputs"

OUTPUT_PATH = OUTPUT_DIR / "synthetic_validation.csv"


# -------------------------------------------------
# Load Datasets
# -------------------------------------------------

def load_datasets(
    orig_path: Path = ORIGINAL_DATA_PATH, synth_path: Path = SYNTHETIC_DATA_PATH
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load original and synthetic datasets."""
    if not orig_path.exists():
        raise FileNotFoundError(f"Original dataset not found at {orig_path}")
    if not synth_path.exists():
        raise FileNotFoundError(f"Synthetic dataset not found at {synth_path}")

    orig_df = pd.read_csv(orig_path)
    synth_df = pd.read_csv(synth_path)
    return orig_df, synth_df


# -------------------------------------------------
# Validate Synthetic Data
# -------------------------------------------------

def validate_datasets(orig_df: pd.DataFrame, synth_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compare statistical metrics (Mean, Std, Min, Max) for all numeric columns
    and compute percentage differences.
    """
    numeric_columns = orig_df.select_dtypes(include=[np.number]).columns
    validation_records = []

    for col in numeric_columns:
        if col not in synth_df.columns:
            continue

        orig_mean = orig_df[col].mean()
        synth_mean = synth_df[col].mean()

        orig_std = orig_df[col].std()
        synth_std = synth_df[col].std()

        orig_min = orig_df[col].min()
        synth_min = synth_df[col].min()

        orig_max = orig_df[col].max()
        synth_max = synth_df[col].max()

        mean_diff_pct = (
            abs(synth_mean - orig_mean) / abs(orig_mean) * 100.0
            if orig_mean != 0
            else 0.0
        )
        std_diff_pct = (
            abs(synth_std - orig_std) / abs(orig_std) * 100.0
            if orig_std != 0
            else 0.0
        )

        validation_records.append(
            {
                "Column": col,
                "Original_Mean": round(orig_mean, 4),
                "Synthetic_Mean": round(synth_mean, 4),
                "Mean_Difference_Percent": round(mean_diff_pct, 4),
                "Original_Std": round(orig_std, 4),
                "Synthetic_Std": round(synth_std, 4),
                "Std_Difference_Percent": round(std_diff_pct, 4),
                "Original_Min": round(orig_min, 4),
                "Synthetic_Min": round(synth_min, 4),
                "Original_Max": round(orig_max, 4),
                "Synthetic_Max": round(synth_max, 4),
            }
        )

    return pd.DataFrame(validation_records)


# -------------------------------------------------
# Save Validation Report
# -------------------------------------------------

def save_validation_report(
    validation_df: pd.DataFrame, output_path: Path = OUTPUT_PATH
) -> None:
    """Save validation dataframe to CSV."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    validation_df.to_csv(output_path, index=False)


# -------------------------------------------------
# Print Summary
# -------------------------------------------------

def print_summary(validation_df: pd.DataFrame) -> None:
    """Print validation summary metrics to terminal."""
    avg_mean_diff = validation_df["Mean_Difference_Percent"].mean()
    avg_std_diff = validation_df["Std_Difference_Percent"].mean()
    cols_evaluated = len(validation_df)

    print("=" * 70)
    print("SYNTHETIC DATA QUALITY VALIDATION")
    print("=" * 70)
    print("\nValidation Summary:")
    print(f"Average Mean Difference: {avg_mean_diff:.2f}%")
    print(f"Average Std Difference:  {avg_std_diff:.2f}%")
    print(f"Columns Evaluated:       {cols_evaluated}")

    print("\nColumn Detail Comparison:")
    print("-" * 70)
    display_cols = [
        "Column",
        "Original_Mean",
        "Synthetic_Mean",
        "Mean_Difference_Percent",
        "Original_Std",
        "Synthetic_Std",
        "Std_Difference_Percent",
    ]
    print(validation_df[display_cols].to_string(index=False))
    print("=" * 70)


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    orig_df, synth_df = load_datasets()

    validation_df = validate_datasets(orig_df, synth_df)

    save_validation_report(validation_df)

    print_summary(validation_df)

    print(f"\nValidation report saved to: {OUTPUT_PATH}\n")


if __name__ == "__main__":
    main()
