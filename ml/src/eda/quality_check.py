from pathlib import Path
import pandas as pd

# -----------------------------
# Locate dataset
# -----------------------------
ML_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ML_ROOT / "data" / "raw" / "bank_statements.csv"

# -----------------------------
# Load dataset
# -----------------------------
df = pd.read_csv(DATA_PATH)

print("=" * 60)
print("DATA QUALITY REPORT")
print("=" * 60)

# -----------------------------
# Missing Values
# -----------------------------
print("\nMissing Values:")
print(df.isnull().sum())

# -----------------------------
# Duplicate Rows
# -----------------------------
print("\nDuplicate Rows:")
print(df.duplicated().sum())

# -----------------------------
# Unique Values
# -----------------------------
print("\nUnique Values Per Column:")
print(df.nunique())

# -----------------------------
# Numeric Statistics
# -----------------------------
print("\nNumeric Summary:")
print(df.describe())