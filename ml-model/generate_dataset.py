"""
Generate a synthetic dataset of Meesho seller profiles for loan-risk model training.

Produces sellers_synthetic.csv with correlated business metrics and rule-based
risk_class / loan_limit labels.
"""

import random

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Reproducibility — fixed seeds ensure identical output on every run
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

N_SELLERS = 1000

# Target risk-class proportions (Low / Medium / High)
TARGET_LOW_PCT = 0.35
TARGET_MED_PCT = 0.40
TARGET_HIGH_PCT = 0.25


def clip(arr: np.ndarray, low: float, high: float) -> np.ndarray:
    """Clamp values to [low, high]."""
    return np.clip(arr, low, high)


def generate_correlated_features(n: int) -> pd.DataFrame:
    """
    Build seller features with realistic cross-feature correlations.

    Strategy:
      1. Draw a latent 'seller_quality' score (standard normal).
      2. Derive each observable metric from quality + related drivers + noise.
      3. Apply a penalty block for sellers with prior_loan_default == 1.
    """
    # --- Latent driver shared across many metrics ---
    seller_quality = np.random.normal(0, 1, n)

    # --- Foundational features (less dependent on quality) ---
    account_age_months = np.random.randint(1, 61, size=n)

    # ~10 % of sellers have a prior default (≈90 % are 0)
    prior_loan_default = np.random.binomial(1, 0.10, size=n)

    # --- Catalog size grows with account age and seller quality ---
    catalog_size = clip(
        30
        + 4 * account_age_months
        + 40 * seller_quality
        + np.random.normal(0, 25, n),
        5,
        500,
    ).astype(int)

    # --- Sales velocity scales with catalog breadth and quality ---
    sales_velocity_6m = clip(
        15_000
        + 250 * catalog_size
        + 25_000 * seller_quality
        + np.random.normal(0, 15_000, n),
        5_000,
        200_000,
    ).round(2)

    # --- Total orders: older, higher-velocity sellers fulfil more orders ---
    total_orders_6m = clip(
        80 * account_age_months
        + 0.015 * sales_velocity_6m
        + 300 * seller_quality
        + np.random.normal(0, 200, n),
        50,
        5_000,
    ).astype(int)

    # --- Customer rating: quality-driven, slight upward drift for mature accounts ---
    avg_customer_rating = clip(
        3.5
        + 0.45 * seller_quality
        + 0.005 * account_age_months
        + np.random.normal(0, 0.25, n),
        1.0,
        5.0,
    ).round(2)

    # --- Rating trend follows quality with small noise ---
    rating_trend = clip(
        0.12 * seller_quality + np.random.normal(0, 0.15, n),
        -0.5,
        0.5,
    ).round(3)

    # --- RTO inversely related to rating and quality ---
    rto_rate = clip(
        14
        - 2.5 * seller_quality
        - 1.5 * (avg_customer_rating - 3.0)
        + np.random.normal(0, 2.5, n),
        2,
        25,
    ).round(2)

    # --- Dispatch SLA improves with quality ---
    dispatch_sla_compliance = clip(
        82
        + 6 * seller_quality
        + np.random.normal(0, 4, n),
        60,
        100,
    ).round(2)

    # --- Cancellation inversely related to rating ---
    order_cancellation_rate = clip(
        10
        - 2.0 * seller_quality
        - 1.2 * (avg_customer_rating - 3.0)
        + np.random.normal(0, 2, n),
        0,
        20,
    ).round(2)

    # --- Growth and ad ROI track overall seller health ---
    sales_growth_rate = clip(
        8
        + 8 * seller_quality
        + 0.05 * sales_velocity_6m / 1000
        + np.random.normal(0, 6, n),
        -20,
        40,
    ).round(2)

    ad_spend_roi = clip(
        2.0
        + 0.7 * seller_quality
        + 0.3 * (avg_customer_rating - 3.0)
        + np.random.normal(0, 0.4, n),
        0.5,
        5.0,
    ).round(2)

    # --- Penalise prior defaulters: degrade key business metrics slightly ---
    default_mask = prior_loan_default == 1
    rto_rate[default_mask] = clip(rto_rate[default_mask] + np.random.uniform(2, 6, default_mask.sum()), 2, 25)
    dispatch_sla_compliance[default_mask] = clip(
        dispatch_sla_compliance[default_mask] - np.random.uniform(5, 15, default_mask.sum()), 60, 100
    )
    avg_customer_rating[default_mask] = clip(
        avg_customer_rating[default_mask] - np.random.uniform(0.3, 0.8, default_mask.sum()), 1.0, 5.0
    )
    sales_growth_rate[default_mask] = clip(
        sales_growth_rate[default_mask] - np.random.uniform(3, 10, default_mask.sum()), -20, 40
    )
    ad_spend_roi[default_mask] = clip(
        ad_spend_roi[default_mask] - np.random.uniform(0.3, 1.0, default_mask.sum()), 0.5, 5.0
    )

    # --- Assemble raw feature frame ---
    df = pd.DataFrame(
        {
            "seller_id": [f"SELL_{i:05d}" for i in range(1, n + 1)],
            "sales_velocity_6m": sales_velocity_6m,
            "sales_growth_rate": sales_growth_rate,
            "rto_rate": rto_rate,
            "dispatch_sla_compliance": dispatch_sla_compliance,
            "avg_customer_rating": avg_customer_rating,
            "rating_trend": rating_trend,
            "order_cancellation_rate": order_cancellation_rate,
            "ad_spend_roi": ad_spend_roi,
            "account_age_months": account_age_months,
            "total_orders_6m": total_orders_6m,
            "catalog_size": catalog_size,
            "prior_loan_default": prior_loan_default,
        }
    )

    return df


def compute_risk_score(row: pd.Series) -> float:
    """
    Deterministic rule-based risk score (higher = riskier).

    Each rule adds or subtracts points based on thresholds that reflect
    real lending heuristics for e-commerce sellers.
    """
    score = 0.0

    # Return-to-Origin: high RTO erodes margin and signals product/fulfilment issues
    if row["rto_rate"] > 18:
        score += 25
    elif row["rto_rate"] > 12:
        score += 15
    elif row["rto_rate"] < 6:
        score -= 10

    # On-time dispatch: reliable fulfilment reduces operational risk
    if row["dispatch_sla_compliance"] < 75:
        score += 20
    elif row["dispatch_sla_compliance"] < 85:
        score += 10
    elif row["dispatch_sla_compliance"] > 95:
        score -= 10

    # Customer satisfaction: low ratings predict churn and disputes
    if row["avg_customer_rating"] < 3.0:
        score += 20
    elif row["avg_customer_rating"] < 3.8:
        score += 10
    elif row["avg_customer_rating"] > 4.5:
        score -= 10

    # Sales momentum: negative growth is a red flag
    if row["sales_growth_rate"] < 0:
        score += 15
    elif row["sales_growth_rate"] > 15:
        score -= 10

    # Ad spend efficiency: poor ROI means wasted capital
    if row["ad_spend_roi"] < 1.0:
        score += 15
    elif row["ad_spend_roi"] > 3.0:
        score -= 10

    # Prior default is the strongest single signal
    if row["prior_loan_default"] == 1:
        score += 25

    # Young accounts lack track record
    if row["account_age_months"] < 6:
        score += 10
    elif row["account_age_months"] > 24:
        score -= 5

    # High cancellation rate indicates listing or inventory problems
    if row["order_cancellation_rate"] > 12:
        score += 10
    elif row["order_cancellation_rate"] < 5:
        score -= 5

    # Declining ratings are an early warning sign
    if row["rating_trend"] < -0.2:
        score += 8
    elif row["rating_trend"] > 0.2:
        score -= 5

    return score


def assign_risk_class(risk_scores: pd.Series) -> pd.Series:
    """
    Map continuous risk scores to discrete classes while hitting target mix.

    Sort sellers by score ascending (lowest score = safest) and slice into
    35 % Low / 40 % Medium / 25 % High buckets.
    """
    n = len(risk_scores)
    n_low = int(n * TARGET_LOW_PCT)
    n_med = int(n * TARGET_MED_PCT)
    # Remainder goes to High Risk to avoid rounding gaps
    n_high = n - n_low - n_med

    # Order indices from safest (lowest score) to riskiest (highest score)
    sorted_idx = risk_scores.sort_values().index

    risk_class = pd.Series(1, index=risk_scores.index, dtype=int)  # default Medium
    risk_class.loc[sorted_idx[:n_low]] = 0          # Low Risk
    risk_class.loc[sorted_idx[n_low : n_low + n_med]] = 1  # Medium Risk
    risk_class.loc[sorted_idx[n_low + n_med :]] = 2   # High Risk

    return risk_class


def compute_loan_limit(row: pd.Series) -> int:
    """
    Deterministic loan-limit rules: better sellers and lower risk → higher limits.

    Base cap scales with monthly sales velocity; risk class applies a multiplier.
    High-risk sellers with prior defaults may receive ₹0.
    """
    # Sales-based ceiling: up to 50 % of 3-month sales proxy
    sales_cap = min(row["sales_velocity_6m"] * 0.5, 100_000)

    # Risk-class multipliers
    multipliers = {0: 1.0, 1: 0.55, 2: 0.20}
    base_limit = sales_cap * multipliers[row["risk_class"]]

    # Bonus for strong operational metrics (Low / Medium only)
    if row["risk_class"] <= 1:
        if row["dispatch_sla_compliance"] > 95 and row["avg_customer_rating"] > 4.3:
            base_limit *= 1.15
        if row["ad_spend_roi"] > 3.0 and row["sales_growth_rate"] > 10:
            base_limit *= 1.10

    # Penalties
    if row["prior_loan_default"] == 1:
        base_limit *= 0.30
    if row["rto_rate"] > 18:
        base_limit *= 0.70

    # High-risk + prior default → no loan
    if row["risk_class"] == 2 and row["prior_loan_default"] == 1:
        return 0

    return int(clip(np.array([base_limit]), 0, 100_000)[0])


def main() -> None:
    # Step 1: Generate correlated seller features
    df = generate_correlated_features(N_SELLERS)

    # Step 2: Compute rule-based risk score for every seller
    df["risk_score"] = df.apply(compute_risk_score, axis=1)

    # Step 3: Discretise into Low / Medium / High with target proportions
    df["risk_class"] = assign_risk_class(df["risk_score"])

    # Step 4: Derive loan limits from risk class + business metrics
    df["loan_limit"] = df.apply(compute_loan_limit, axis=1)

    # Drop intermediate score — keep only final labels for the training set
    df = df.drop(columns=["risk_score"])

    # Step 5: Persist to CSV
    output_path = "sellers_synthetic.csv"
    df.to_csv(output_path, index=False)

    # Step 6: Print summary statistics
    print(f"Dataset saved to {output_path}")
    print(f"\nDataset shape: {df.shape}")

    print("\nRisk class distribution:")
    class_labels = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
    dist = df["risk_class"].value_counts().sort_index()
    for cls, count in dist.items():
        pct = count / len(df) * 100
        print(f"  {cls} ({class_labels[cls]}): {count} ({pct:.1f}%)")

    print("\nLoan limit statistics (INR):")
    print(df["loan_limit"].describe().round(2).to_string())

    print("\nFirst five rows:")
    print(df.head().to_string(index=False))


if __name__ == "__main__":
    main()
