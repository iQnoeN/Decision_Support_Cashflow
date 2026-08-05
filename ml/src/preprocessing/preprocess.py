from pathlib import Path
import pandas as pd


def load_data():
    """
    Load the raw bank statement dataset.
    """

    data_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "raw"
        / "bank_statements.csv"
    )

    df = pd.read_csv(data_path)

    return df


def convert_dates(df):
    """
    Convert transaction timestamp column into datetime format.
    """

    df["transactionTimestamp"] = pd.to_datetime(
        df["transactionTimestamp"]
    )

    return df


def sort_transactions(df):
    """
    Sort all transactions chronologically.
    """

    df = df.sort_values(
        by="transactionTimestamp"
    ).reset_index(drop=True)

    return df


def create_signed_amount(df):
    """
    Convert CREDIT transactions to positive values
    and DEBIT transactions to negative values.
    """

    df["signed_amount"] = df.apply(
        lambda row: row["amount"]
        if row["type"] == "CREDIT"
        else -row["amount"],
        axis=1
    )

    return df

def aggregate_daily(df):
    """
    Aggregate transactions into daily cashflow.
    """

    # Extract only the date (remove time)
    df["Date"] = df["transactionTimestamp"].dt.date

    daily_df = (
        df.groupby("Date")
        .agg(
            Cash_In=("amount", lambda x: x[df.loc[x.index, "type"] == "CREDIT"].sum()),
            Cash_Out=("amount", lambda x: x[df.loc[x.index, "type"] == "DEBIT"].sum()),
            Net_Cashflow=("signed_amount", "sum"),
            End_Balance=("currentBalance", "last"),
            Transaction_Count=("txnId", "count"),
        )
        .reset_index()
    )

    return daily_df

def preview_dataset(df, rows=10):
    """
    Print a quick preview of the processed dataset.
    """

    print("\n")
    print("=" * 60)
    print("PREPROCESSED DATA PREVIEW")
    print("=" * 60)

    pd.set_option("display.max_columns", None)
    print(df.head(rows))

    print("\n")
    print("Dataset Shape:", df.shape)

    print("\nColumns:")
    print(df.columns.tolist())



def main():

    print("=" * 60)
    print("PREPROCESSING PIPELINE")
    print("=" * 60)

    # Step 1
    df = load_data()

    # Step 2
    df = convert_dates(df)

    # Step 3
    df = sort_transactions(df)

    # Step 4
    df = create_signed_amount(df)

    # Step 5
    daily_df = aggregate_daily(df)

    # Preview processed dataset
    daily_df = aggregate_daily(df)
    preview_dataset(daily_df)

    # Save processed dataset
    output_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "processed"
        / "daily_cashflow.csv"
    )

    daily_df.to_csv(output_path, index=False)

    print("\n")
    print("=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"Processed dataset saved to:\n{output_path}")


if __name__ == "__main__":
    main()