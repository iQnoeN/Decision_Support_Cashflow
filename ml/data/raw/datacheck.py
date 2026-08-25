from pathlib import Path
import pandas as pd

CSV_PATH = Path(__file__).parent / "transactions_data.csv"

print(f"Analyzing: {CSV_PATH.name}")
print(f"File Size: {CSV_PATH.stat().st_size / (1024 * 1024):.2f} MB\n")

preview_df = pd.read_csv(CSV_PATH, nrows=5)

print("Columns:")
print(preview_df.columns.tolist())

print("\nSample (First 5 Rows):")
print(preview_df.head())

total_rows = 0
missing_counts = pd.Series(0, index=preview_df.columns, dtype=int)

print("\nProcessing dataset in chunks...")
for chunk in pd.read_csv(CSV_PATH, chunksize=200000):
    total_rows += len(chunk)
    missing_counts += chunk.isnull().sum()

print("\nTotal Shape:")
print((total_rows, len(preview_df.columns)))

print("\nMissing Values:")
print(missing_counts)
