from pathlib import Path
import pandas as pd


def load_processed_data():
    """
    Load the daily cashflow dataset produced by the preprocessing pipeline.
    """

    data_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "processed"
        / "daily_cashflow.csv"
    )

    df = pd.read_csv(data_path)

    return df


def convert_date_column(df):
    """
    Convert Date column into datetime format.
    """

    df["Date"] = pd.to_datetime(df["Date"])

    return df


def sort_by_date(df):
    """
    Ensure chronological ordering.
    """

    df = df.sort_values("Date").reset_index(drop=True)

    return df


def create_lag_features(df):
    """
    Previous day and previous week's net cashflow.
    """

    df["Lag_1"] = df["Net_Cashflow"].shift(1)
    df["Lag_7"] = df["Net_Cashflow"].shift(7)

    return df


def create_rolling_features(df):
    """
    Rolling window statistics.
    """

    df["Rolling_Mean_7"] = (
        df["Net_Cashflow"]
        .rolling(window=7)
        .mean()
    )

    df["Rolling_Std_7"] = (
        df["Net_Cashflow"]
        .rolling(window=7)
        .std()
    )

    df["Rolling_CashIn_7"] = (
        df["Cash_In"]
        .rolling(window=7)
        .sum()
    )

    df["Rolling_CashOut_7"] = (
        df["Cash_Out"]
        .rolling(window=7)
        .sum()
    )

    return df


def create_target(df):
    """
    Predict tomorrow's net cashflow.
    """

    df["Target"] = df["Net_Cashflow"].shift(-1)

    return df


def remove_missing_rows(df):
    """
    Remove rows created by lag/rolling operations.
    """

    df = df.dropna().reset_index(drop=True)

    return df


def preview_dataset(df, rows=10):

    print("\n")
    print("=" * 60)
    print("FEATURE ENGINEERING PREVIEW")
    print("=" * 60)

    pd.set_option("display.max_columns", None)

    print(df.head(rows))

    print("\nDataset Shape:", df.shape)

    print("\nColumns:")
    print(df.columns.tolist())


def save_dataset(df):
    """
    Save ML-ready dataset.
    """

    output_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "processed"
        / "training_dataset.csv"
    )

    df.to_csv(output_path, index=False)

    print("\n")
    print("=" * 60)
    print("FEATURE ENGINEERING COMPLETE")
    print("=" * 60)

    print(f"Dataset saved to:\n{output_path}")


def main():

    print("=" * 60)
    print("FEATURE ENGINEERING PIPELINE")
    print("=" * 60)

    df = load_processed_data()

    df = convert_date_column(df)

    df = sort_by_date(df)

    df = create_lag_features(df)

    df = create_rolling_features(df)

    df = create_target(df)

    df = remove_missing_rows(df)

    preview_dataset(df)

    save_dataset(df)


if __name__ == "__main__":
    main()