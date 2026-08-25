"""
Dataset Profiling Utility

Generates a statistical profile of the original cashflow training dataset
and saves the result as a JSON document.
"""

from pathlib import Path
import json
import numpy as np
import pandas as pd


# -------------------------------------------------
# Paths
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "training_dataset.csv"

OUTPUT_DIR = ML_ROOT / "outputs"

OUTPUT_PATH = OUTPUT_DIR / "dataset_profile.json"


# -------------------------------------------------
# Load Dataset
# -------------------------------------------------

def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    """Load training dataset from CSV file."""
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)


# -------------------------------------------------
# Generate Profile
# -------------------------------------------------

def generate_profile(df: pd.DataFrame) -> dict:
    """
    Calculate statistical profile for all numeric columns in the dataframe.
    """
    numeric_df = df.select_dtypes(include=[np.number])
    profile = {}

    for column in numeric_df.columns:
        series = numeric_df[column]
        profile[column] = {
            "count": int(series.count()),
            "mean": float(round(series.mean(), 4)),
            "median": float(round(series.median(), 4)),
            "std": float(round(series.std(), 4)),
            "min": float(round(series.min(), 4)),
            "max": float(round(series.max(), 4)),
            "25th_percentile": float(round(series.quantile(0.25), 4)),
            "75th_percentile": float(round(series.quantile(0.75), 4)),
        }

    return profile


# -------------------------------------------------
# Save Profile
# -------------------------------------------------

def save_profile(profile: dict, output_path: Path = OUTPUT_PATH) -> None:
    """Save dataset profile to JSON file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(profile, file, indent=4)


# -------------------------------------------------
# Print Summary
# -------------------------------------------------

def print_summary(profile: dict) -> None:
    """Print concise statistical summary to terminal."""
    profile_df = pd.DataFrame(profile).T
    print("=" * 70)
    print("DATASET STATISTICAL PROFILE SUMMARY")
    print("=" * 70)
    print(profile_df.to_string())
    print("=" * 70)


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 70)
    print("RUNNING DATASET PROFILING PIPELINE")
    print("=" * 70)

    df = load_dataset()
    print(f"Loaded dataset from: {DATA_PATH}")
    print(f"Dataset shape: {df.shape[0]} rows, {df.shape[1]} columns\n")

    profile = generate_profile(df)
    save_profile(profile)
    print_summary(profile)

    print(f"\nProfile successfully saved to: {OUTPUT_PATH}\n")


if __name__ == "__main__":
    main()
