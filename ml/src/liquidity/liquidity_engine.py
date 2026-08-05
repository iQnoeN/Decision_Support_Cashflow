from pathlib import Path
import pandas as pd
import numpy as np

# ==================================================
# CONFIGURATION
# ==================================================

WEIGHTS = {
    "cashflow": 0.35,
    "balance": 0.30,
    "ratio": 0.15,
    "volatility": 0.10,
    "negative": 0.10
}

RISK_THRESHOLDS = {
    "stable": 75,
    "moderate": 50
}

# ==================================================
# LOAD DATASET
# ==================================================

def load_dataset():

    data_path = (
        Path(__file__).resolve().parents[2]
        / "data"
        / "processed"
        / "training_dataset.csv"
    )

    return pd.read_csv(data_path)


# ==================================================
# CASH RATIO
# ==================================================

def calculate_cash_ratio(df):

    df["Cash_Ratio"] = np.where(
        df["Cash_Out"] == 0,
        10.0,
        df["Cash_In"] / df["Cash_Out"]
    )

    return df


# ==================================================
# NEGATIVE STREAK
# ==================================================

def calculate_negative_streak(df):

    streak = []
    current = 0

    for value in df["Net_Cashflow"]:

        if value < 0:
            current += 1
        else:
            current = 0

        streak.append(current)

    df["Negative_Streak"] = streak

    return df


# ==================================================
# NORMALIZATION FUNCTIONS
# ==================================================

def normalize_positive(series):

    p5 = series.quantile(0.05)
    p95 = series.quantile(0.95)

    score = ((series - p5) / (p95 - p5)) * 100

    return score.clip(0, 100)


def normalize_negative(series):

    p5 = series.quantile(0.05)
    p95 = series.quantile(0.95)

    score = 100 - (((series - p5) / (p95 - p5)) * 100)

    return score.clip(0, 100)


# ==================================================
# INDICATOR SCORES
# ==================================================

def calculate_indicator_scores(df):

    df["Cashflow_Score"] = normalize_positive(df["Target"])

    df["Balance_Score"] = normalize_positive(df["End_Balance"])

    df["Ratio_Score"] = normalize_positive(df["Cash_Ratio"])

    df["Volatility_Score"] = normalize_negative(df["Rolling_Std_7"])

    df["NegativeDay_Score"] = normalize_negative(df["Negative_Streak"])

    return df


# ==================================================
# LIQUIDITY SCORE
# ==================================================

def calculate_liquidity_score(df):

    df["Liquidity_Score"] = (

        df["Cashflow_Score"] * WEIGHTS["cashflow"]

        + df["Balance_Score"] * WEIGHTS["balance"]

        + df["Ratio_Score"] * WEIGHTS["ratio"]

        + df["Volatility_Score"] * WEIGHTS["volatility"]

        + df["NegativeDay_Score"] * WEIGHTS["negative"]

    )

    df["Liquidity_Score"] = df["Liquidity_Score"].round(2)

    return df


# ==================================================
# RISK CLASSIFICATION
# ==================================================

def classify_risk(df):

    conditions = [

        df["Liquidity_Score"] >= RISK_THRESHOLDS["stable"],

        df["Liquidity_Score"] >= RISK_THRESHOLDS["moderate"]

    ]

    choices = [

        "Stable",

        "Moderate Risk"

    ]

    df["Liquidity_Risk"] = np.select(
        conditions,
        choices,
        default="High Risk"
    )

    return df


# ==================================================
# RECOMMENDATIONS
# ==================================================

def generate_recommendations(df):

    recommendations = []

    for _, row in df.iterrows():

        rec = []

        if row["Liquidity_Risk"] == "Stable":

            rec.append("Maintain current financial strategy")
            rec.append("Continue monitoring cashflow")

        elif row["Liquidity_Risk"] == "Moderate Risk":

            if row["Cash_Ratio"] < 1:
                rec.append("Review operational expenses")

            if row["Negative_Streak"] >= 2:
                rec.append("Monitor recurring negative cashflow")

            rec.append("Delay non-essential purchases")

        else:

            if row["Cash_Ratio"] < 1:
                rec.append("Increase cash inflows immediately")

            if row["End_Balance"] < 1000:
                rec.append("Maintain emergency cash reserve")

            if row["Negative_Streak"] >= 2:
                rec.append("Investigate continuous losses")

            rec.append("Reduce discretionary spending")
            rec.append("Accelerate receivable collection")

        recommendations.append(" | ".join(rec))

    df["Recommendation"] = recommendations

    return df


# ==================================================
# PREVIEW
# ==================================================

def preview(df):

    print("\n")
    print("=" * 70)
    print("LIQUIDITY ENGINE OUTPUT")
    print("=" * 70)

    print(
        df[
            [
                "Date",
                "Liquidity_Score",
                "Liquidity_Risk",
                "Recommendation"
            ]
        ].head(15)
    )

    print("\nDataset Shape:", df.shape)


# ==================================================
# SAVE
# ==================================================

def save_dataset(df):

    output_path = (

        Path(__file__).resolve().parents[2]

        / "data"

        / "processed"

        / "liquidity_assessment.csv"

    )

    df.to_csv(output_path, index=False)

    print("\nSaved to:")
    print(output_path)


# ==================================================
# MAIN
# ==================================================

def main():

    print("=" * 70)
    print("LIQUIDITY ASSESSMENT ENGINE")
    print("=" * 70)

    df = load_dataset()

    df = calculate_cash_ratio(df)

    df = calculate_negative_streak(df)

    df = calculate_indicator_scores(df)

    df = calculate_liquidity_score(df)

    df = classify_risk(df)

    df = generate_recommendations(df)

    preview(df)

    save_dataset(df)

    print("\n")
    print("=" * 70)
    print("LIQUIDITY ASSESSMENT COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()