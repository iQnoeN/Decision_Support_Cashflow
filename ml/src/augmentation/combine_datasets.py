"""
Augmented Dataset Combiner Utility

Combines original training dataset and synthetic dataset into an augmented dataset
for data augmentation experiments.
"""

from pathlib import Path
import pandas as pd


# -------------------------------------------------
# Paths
# -------------------------------------------------

ML_ROOT = Path(__file__).resolve().parents[2]

TRAINING_DATA_PATH = ML_ROOT / "data" / "processed" / "training_dataset.csv"

SYNTHETIC_DATA_PATH = (
    ML_ROOT / "data" / "processed" / "synthetic_training_dataset.csv"
)

OUTPUT_PATH = ML_ROOT / "data" / "processed" / "augmented_training_dataset.csv"


# -------------------------------------------------
# Load Datasets
# -------------------------------------------------

def load_datasets(
    train_path: Path = TRAINING_DATA_PATH, synth_path: Path = SYNTHETIC_DATA_PATH
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load original training dataset and synthetic dataset."""
    if not train_path.exists():
        raise FileNotFoundError(f"Training dataset not found at {train_path}")
    if not synth_path.exists():
        raise FileNotFoundError(f"Synthetic dataset not found at {synth_path}")

    train_df = pd.read_csv(train_path)
    synth_df = pd.read_csv(synth_path)
    return train_df, synth_df


# -------------------------------------------------
# Combine Datasets
# -------------------------------------------------

def combine_datasets(train_df: pd.DataFrame, synth_df: pd.DataFrame) -> pd.DataFrame:
    """
    Concatenate original and synthetic datasets without row removal or deduplication.
    """
    augmented_df = pd.concat([train_df, synth_df], ignore_index=True)
    return augmented_df


# -------------------------------------------------
# Save Augmented Dataset
# -------------------------------------------------

def save_augmented_dataset(
    augmented_df: pd.DataFrame, output_path: Path = OUTPUT_PATH
) -> None:
    """Save augmented dataset to CSV file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    augmented_df.to_csv(output_path, index=False)


# -------------------------------------------------
# Verify Dataset
# -------------------------------------------------

def verify_augmented_dataset(
    train_df: pd.DataFrame, synth_df: pd.DataFrame, augmented_df: pd.DataFrame
) -> dict:
    """
    Verify row counts and missing value counts in the augmented dataset.
    """
    train_rows = len(train_df)
    synth_rows = len(synth_df)
    final_rows = len(augmented_df)
    missing_values = int(augmented_df.isnull().sum().sum())

    return {
        "train_rows": train_rows,
        "synth_rows": synth_rows,
        "final_rows": final_rows,
        "missing_values": missing_values,
    }


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 60)
    print("COMBINING TRAINING AND SYNTHETIC DATASETS")
    print("=" * 60)

    train_df, synth_df = load_datasets()

    augmented_df = combine_datasets(train_df, synth_df)

    save_augmented_dataset(augmented_df)

    verification = verify_augmented_dataset(train_df, synth_df, augmented_df)

    print("\nDataset Combination Complete!\n")
    print(f"Training row count:  {verification['train_rows']}")
    print(f"Synthetic row count: {verification['synth_rows']}")
    print(f"Final row count:     {verification['final_rows']}")
    print(f"Missing value count: {verification['missing_values']}")
    print(f"\nSaved augmented dataset to: {OUTPUT_PATH}\n")


if __name__ == "__main__":
    main()
