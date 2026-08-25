from pathlib import Path
import numpy as np
import pandas as pd

ML_ROOT = Path(__file__).resolve().parents[2]

DATA_PATH = ML_ROOT / "data" / "processed" / "training_dataset.csv"

OUTPUT_PATH = ML_ROOT / "data" / "processed" / "synthetic_training_dataset.csv"

TARGET_SIZE = 5000

RANDOM_SEED = 42


def load_dataset(data_path: Path = DATA_PATH) -> pd.DataFrame:
    #Load original training dataset from CSV.
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")
    return pd.read_csv(data_path)

def generate_synthetic_data(
    df: pd.DataFrame, num_samples: int = TARGET_SIZE, seed: int = RANDOM_SEED
) -> pd.DataFrame:
    """
    Generate synthetic rows by bootstrap sampling real rows with replacement
    and applying 5-15% Gaussian noise while respecting column constraints.
    """
    np.random.seed(seed)

    # 1. Bootstrap sample real rows with replacement to preserve row relationships
    sampled_df = df.sample(n=num_samples, replace=True, random_state=seed).reset_index(drop=True)

    # Preserve Date column if present with sequential daily dates
    if "Date" in df.columns:
        start_date = df["Date"].iloc[0]
        sampled_df["Date"] = pd.date_range(
            start=start_date, periods=num_samples, freq="D"
        ).strftime("%Y-%m-%d")

    numeric_columns = df.select_dtypes(include=[np.number]).columns

    # 2. Add 5-15% Gaussian noise to numeric columns
    for col in numeric_columns:
        col_std = df[col].std()
        col_min = df[col].min()
        col_max = df[col].max()

        # Generate noise scale factor between 5% (0.05) and 15% (0.15)
        noise_factor = np.random.uniform(0.05, 0.15, size=num_samples)
        noise = np.random.normal(loc=0.0, scale=noise_factor * (col_std if col_std > 0 else 1.0))

        noisy_values = sampled_df[col] + noise

        # Apply clipping to original range
        noisy_values = np.clip(noisy_values, col_min, col_max)

        # Apply special rules & non-negative constraints
        if col == "Transaction_Count":
            noisy_values = np.round(noisy_values).astype(int)
            noisy_values = np.clip(noisy_values, 1, None)
        elif col in ["Cash_In", "Cash_Out", "Rolling_Std_7"]:
            noisy_values = np.clip(noisy_values, 0.0, None)

        sampled_df[col] = noisy_values

    return sampled_df


# -------------------------------------------------
# Save Synthetic Dataset
# -------------------------------------------------

def save_synthetic_dataset(
    synthetic_df: pd.DataFrame, output_path: Path = OUTPUT_PATH
) -> None:
    """Save generated synthetic dataset to CSV file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    synthetic_df.to_csv(output_path, index=False)


# -------------------------------------------------
# Main
# -------------------------------------------------

def main():
    print("=" * 60)
    print("SYNTHETIC DATASET GENERATION (BOOTSTRAP + NOISE)")
    print("=" * 60)

    original_df = load_dataset()
    original_count = len(original_df)

    synthetic_df = generate_synthetic_data(original_df, num_samples=TARGET_SIZE)
    synthetic_count = len(synthetic_df)

    save_synthetic_dataset(synthetic_df)

    print("\nGeneration Complete!\n")
    print(f"Original row count:  {original_count}")
    print(f"Synthetic row count: {synthetic_count}")
    print(f"Output file path:    {OUTPUT_PATH}\n")


if __name__ == "__main__":
    main()
