from typing import Dict, List

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
# NORMALIZATION RANGES
# Derived from training dataset percentiles
# ==================================================

NORMALIZATION = {
    "cashflow": (-4574.80, 2417.50),
    "balance": (189.47, 24521.04),
    "ratio": (0.0, 10.0),
    "volatility": (306.25, 11065.72),
    "negative": (0.0, 5.0)
}


# ==================================================
# NORMALIZATION
# ==================================================

def normalize_positive(value, lower, upper):

    score = ((value - lower) / (upper - lower)) * 100

    return max(0.0, min(100.0, score))


def normalize_negative(value, lower, upper):

    score = 100 - (((value - lower) / (upper - lower)) * 100)

    return max(0.0, min(100.0, score))


# ==================================================
# CASH RATIO
# ==================================================

def calculate_cash_ratio(cash_in, cash_out):

    if cash_out == 0:
        return 10.0

    return cash_in / cash_out


# ==================================================
# RISK
# ==================================================

def classify(score):

    if score >= RISK_THRESHOLDS["stable"]:
        return "Stable"

    if score >= RISK_THRESHOLDS["moderate"]:
        return "Moderate Risk"

    return "High Risk"


# ==================================================
# RECOMMENDATIONS
# ==================================================

def recommendations(
    risk,
    cash_ratio,
    end_balance,
    negative_streak
) -> List[str]:

    rec = []

    if risk == "Stable":

        rec.append("Maintain current financial strategy")
        rec.append("Continue monitoring cashflow")

    elif risk == "Moderate Risk":

        if cash_ratio < 1:
            rec.append("Review operational expenses")

        if negative_streak >= 2:
            rec.append("Monitor recurring negative cashflow")

        rec.append("Delay non-essential purchases")

    else:

        if cash_ratio < 1:
            rec.append("Increase cash inflows immediately")

        if end_balance < 1000:
            rec.append("Maintain emergency cash reserve")

        if negative_streak >= 2:
            rec.append("Investigate continuous losses")

        rec.append("Reduce discretionary spending")
        rec.append("Accelerate receivable collection")

    return rec


# ==================================================
# MAIN ENTRY
# ==================================================

def assess_liquidity(
    predicted_cashflow: float,
    features: Dict
) -> Dict:

    cash_ratio = calculate_cash_ratio(
        features["Cash_In"],
        features["Cash_Out"]
    )

    negative_streak = features.get(
        "Negative_Streak",
        0
    )

    cashflow_score = normalize_positive(
        predicted_cashflow,
        *NORMALIZATION["cashflow"]
    )

    balance_score = normalize_positive(
        features["End_Balance"],
        *NORMALIZATION["balance"]
    )

    ratio_score = normalize_positive(
        cash_ratio,
        *NORMALIZATION["ratio"]
    )

    volatility_score = normalize_negative(
        features["Rolling_Std_7"],
        *NORMALIZATION["volatility"]
    )

    negative_score = normalize_negative(
        negative_streak,
        *NORMALIZATION["negative"]
    )

    liquidity_score = (

        cashflow_score * WEIGHTS["cashflow"]

        + balance_score * WEIGHTS["balance"]

        + ratio_score * WEIGHTS["ratio"]

        + volatility_score * WEIGHTS["volatility"]

        + negative_score * WEIGHTS["negative"]

    )

    liquidity_score = round(liquidity_score, 2)

    risk = classify(liquidity_score)

    return {

        "liquidity_score": liquidity_score,

        "risk": risk,

        "recommendations": recommendations(
            risk,
            cash_ratio,
            features["End_Balance"],
            negative_streak
        )

    }