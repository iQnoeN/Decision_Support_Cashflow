from pathlib import Path
import pandas as pd

# -----------------------------
# Locate the dataset
# -----------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "bank_statements.csv"

# -----------------------------
# Load dataset
# -----------------------------
df = pd.read_csv(DATA_PATH)

# -----------------------------
# Basic information
# -----------------------------
print("=" * 50)
print("DATASET LOADED SUCCESSFULLY")
print("=" * 50)

print(f"\nShape: {df.shape}")

print("\nColumn Names:")
print(df.columns.tolist())

print("\nFirst 5 Rows:")
print(df.head())

print("\nData Types:")
print(df.dtypes)

print("\nGeneral Information:")
print(df.info())