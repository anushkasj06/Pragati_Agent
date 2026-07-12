"""
Train and evaluate XGBoost models for Meesho Pragati Agent loan-risk prediction.

Trains a risk classifier and loan-limit regressor on sellers_synthetic.csv,
evaluates performance, generates SHAP explainability plots, and saves artifacts.
"""

import json
import random
from datetime import datetime, timezone
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier, XGBRegressor

# ---------------------------------------------------------------------------
# Constants — reproducibility and artifact paths
# ---------------------------------------------------------------------------
RANDOM_STATE = 42
random.seed(RANDOM_STATE)
np.random.seed(RANDOM_STATE)

DATA_PATH = Path("sellers_synthetic.csv")
ARTIFACTS_DIR = Path("artifacts")

FEATURE_COLUMNS = [
    "sales_velocity_6m",
    "sales_growth_rate",
    "rto_rate",
    "dispatch_sla_compliance",
    "avg_customer_rating",
    "rating_trend",
    "order_cancellation_rate",
    "ad_spend_roi",
    "account_age_months",
    "total_orders_6m",
    "catalog_size",
    "prior_loan_default",
]

RISK_CLASS_LABELS = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}


def load_data(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load the synthetic seller dataset and display an initial overview."""
    print(f"\n{'=' * 60}")
    print("STEP 1: Loading dataset")
    print(f"{'=' * 60}")

    df = pd.read_csv(path)

    print(f"Dataset shape: {df.shape}")
    print(f"Feature names: {list(df.columns)}")
    print("\nFirst five rows:")
    print(df.head().to_string(index=False))

    return df


def prepare_features_targets(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series, pd.Series]:
    """
    Separate input features from target variables.

    Drops seller_id (identifier only) and returns X, y_risk, y_loan.
    """
    print(f"\n{'=' * 60}")
    print("STEP 2: Defining features and targets")
    print(f"{'=' * 60}")

    X = df[FEATURE_COLUMNS].copy()
    y_risk = df["risk_class"]
    y_loan = df["loan_limit"]

    print(f"Input features ({len(FEATURE_COLUMNS)}): {FEATURE_COLUMNS}")
    print("Targets: risk_class (classification), loan_limit (regression)")

    return X, y_risk, y_loan


def split_data(
    X: pd.DataFrame,
    y_risk: pd.Series,
    y_loan: pd.Series,
    test_size: float = 0.2,
) -> dict:
    """
    80/20 train-test split with stratification on risk_class.

    Stratified splitting preserves class proportions in both sets.
    """
    print(f"\n{'=' * 60}")
    print("STEP 3: Train-test split (80/20, stratified on risk_class)")
    print(f"{'=' * 60}")

    # Stratify on risk_class so class ratios are consistent across splits
    X_train, X_test, y_risk_train, y_risk_test = train_test_split(
        X,
        y_risk,
        test_size=test_size,
        random_state=RANDOM_STATE,
        stratify=y_risk,
    )

    # Loan target must use the same row indices as the risk split
    _, _, y_loan_train, y_loan_test = train_test_split(
        X,
        y_loan,
        test_size=test_size,
        random_state=RANDOM_STATE,
        stratify=y_risk,
    )

    print(f"Training samples: {len(X_train)}")
    print(f"Test samples:     {len(X_test)}")
    print(f"Train risk distribution:\n{y_risk_train.value_counts(normalize=True).sort_index().round(3)}")

    return {
        "X_train": X_train,
        "X_test": X_test,
        "y_risk_train": y_risk_train,
        "y_risk_test": y_risk_test,
        "y_loan_train": y_loan_train,
        "y_loan_test": y_loan_test,
    }


def preprocess_features(X_train: pd.DataFrame, X_test: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Validate data quality before training.

    XGBoost handles raw numerical features — no scaling needed.
    """
    print(f"\n{'=' * 60}")
    print("STEP 4: Feature preprocessing & validation")
    print(f"{'=' * 60}")

    missing_train = X_train.isnull().sum().sum()
    missing_test = X_test.isnull().sum().sum()
    print(f"Missing values — train: {missing_train}, test: {missing_test}")

    if missing_train > 0 or missing_test > 0:
        raise ValueError("Dataset contains missing values that must be handled before training.")

    print("\nTraining set summary statistics:")
    print(X_train.describe().round(2).to_string())

    return X_train, X_test


def train_classifier(X_train: pd.DataFrame, y_train: pd.Series) -> XGBClassifier:
    """Train an XGBoost multi-class classifier for seller risk prediction."""
    print(f"\n{'=' * 60}")
    print("STEP 5a: Training risk classification model (XGBClassifier)")
    print(f"{'=' * 60}")

    classifier = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="multi:softprob",
        num_class=3,
        random_state=RANDOM_STATE,
        eval_metric="mlogloss",
    )

    print("Fitting classifier...")
    classifier.fit(X_train, y_train)
    print("Classifier training complete.")

    return classifier


def train_regressor(X_train: pd.DataFrame, y_train: pd.Series) -> XGBRegressor:
    """Train an XGBoost regressor for loan-limit prediction."""
    print(f"\n{'=' * 60}")
    print("STEP 5b: Training loan prediction model (XGBRegressor)")
    print(f"{'=' * 60}")

    regressor = XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
    )

    print("Fitting regressor...")
    regressor.fit(X_train, y_train)
    print("Regressor training complete.")

    return regressor


def evaluate_models(
    classifier: XGBClassifier,
    regressor: XGBRegressor,
    splits: dict,
) -> dict:
    """Evaluate both models on the held-out test set and return all metrics."""
    print(f"\n{'=' * 60}")
    print("STEP 6: Model evaluation")
    print(f"{'=' * 60}")

    X_test = splits["X_test"]
    y_risk_test = splits["y_risk_test"]
    y_loan_test = splits["y_loan_test"]

    # --- Classifier metrics ---
    y_risk_pred = classifier.predict(X_test)

    accuracy = accuracy_score(y_risk_test, y_risk_pred)
    precision = precision_score(y_risk_test, y_risk_pred, average="weighted", zero_division=0)
    recall = recall_score(y_risk_test, y_risk_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_risk_test, y_risk_pred, average="weighted", zero_division=0)

    print("\n--- Risk Classifier ---")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-score:  {f1:.4f}")

    print("\nClassification Report:")
    print(
        classification_report(
            y_risk_test,
            y_risk_pred,
            target_names=["Low Risk", "Medium Risk", "High Risk"],
        )
    )

    print("Confusion Matrix:")
    print(confusion_matrix(y_risk_test, y_risk_pred))

    # --- Regressor metrics ---
    y_loan_pred = regressor.predict(X_test)

    rmse = float(np.sqrt(mean_squared_error(y_loan_test, y_loan_pred)))
    mae = float(mean_absolute_error(y_loan_test, y_loan_pred))
    r2 = float(r2_score(y_loan_test, y_loan_pred))

    print("\n--- Loan Regressor ---")
    print(f"RMSE:      {rmse:.2f}")
    print(f"MAE:       {mae:.2f}")
    print(f"R2 Score:  {r2:.4f}")

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "rmse": round(rmse, 2),
        "mae": round(mae, 2),
        "r2": round(r2, 4),
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _shap_values_to_importance(shap_values, feature_names: list[str]) -> pd.Series:
    """
    Convert SHAP output (list or ndarray) into a per-feature importance Series.

    Handles both legacy list-of-arrays and newer (n_samples, n_features, n_classes) layouts.
    """
    if isinstance(shap_values, list):
        # Legacy API: one (n_samples, n_features) array per class
        stacked = np.stack([np.abs(sv) for sv in shap_values], axis=0)
        mean_abs = stacked.mean(axis=(0, 1))
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        # Newer API: (n_samples, n_features, n_classes)
        mean_abs = np.abs(shap_values).mean(axis=(0, 2))
    elif isinstance(shap_values, np.ndarray) and shap_values.ndim == 2:
        mean_abs = np.abs(shap_values).mean(axis=0)
    else:
        raise TypeError(f"Unexpected SHAP value type/shape: {type(shap_values)}")

    return pd.Series(mean_abs, index=feature_names).sort_values(ascending=False)


def _shap_values_for_plot(shap_values):
    """Normalise SHAP values into the list format expected by summary_plot."""
    if isinstance(shap_values, list):
        return shap_values
    if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        return [shap_values[:, :, i] for i in range(shap_values.shape[2])]
    return shap_values


def generate_shap_summary(
    classifier: XGBClassifier,
    X_train: pd.DataFrame,
    output_dir: Path = ARTIFACTS_DIR,
) -> list[tuple[str, float]]:
    """
    Compute SHAP values for the classifier and save explainability plots.

    Returns the top 10 features ranked by mean |SHAP|.
    """
    print(f"\n{'=' * 60}")
    print("STEP 7: SHAP explainability")
    print(f"{'=' * 60}")

    output_dir.mkdir(parents=True, exist_ok=True)

    print("Computing SHAP values with TreeExplainer...")
    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer.shap_values(X_train)

    # Rank features by mean absolute SHAP contribution across all classes
    feature_importance = _shap_values_to_importance(shap_values, list(X_train.columns))

    print("\nTop 10 most important features (mean |SHAP|):")
    for rank, (feat, val) in enumerate(feature_importance.head(10).items(), start=1):
        print(f"  {rank:2d}. {feat}: {val:.4f}")

    # --- feature_importance.png (bar chart) ---
    top_features = feature_importance.head(12)
    fig, ax = plt.subplots(figsize=(10, 6))
    top_features.sort_values().plot.barh(ax=ax, color="#F43397")
    ax.set_xlabel("Mean |SHAP value|")
    ax.set_title("Top Feature Importance — Risk Classifier")
    fig.tight_layout()
    importance_path = output_dir / "feature_importance.png"
    fig.savefig(importance_path, dpi=150)
    plt.close(fig)
    print(f"Saved: {importance_path}")

    # --- shap_summary.png (beeswarm plot) ---
    print("Generating SHAP summary plot...")
    plot_values = _shap_values_for_plot(shap_values)
    plt.figure(figsize=(10, 8))
    if isinstance(plot_values, list):
        shap.summary_plot(
            plot_values,
            X_train,
            feature_names=list(X_train.columns),
            class_names=["Low Risk", "Medium Risk", "High Risk"],
            show=False,
        )
    else:
        shap.summary_plot(plot_values, X_train, show=False)

    summary_path = output_dir / "shap_summary.png"
    plt.tight_layout()
    plt.savefig(summary_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved: {summary_path}")

    return list(feature_importance.head(10).items())


def save_models(
    classifier: XGBClassifier,
    regressor: XGBRegressor,
    metrics: dict,
    models_dir: Path = ARTIFACTS_DIR,
) -> None:
    """Persist trained models, feature names, and evaluation metrics to disk."""
    print(f"\n{'=' * 60}")
    print("STEP 8: Saving trained artifacts")
    print(f"{'=' * 60}")

    models_dir.mkdir(parents=True, exist_ok=True)

    classifier_path = models_dir / "risk_classifier.pkl"
    regressor_path = models_dir / "loan_regressor.pkl"
    features_path = models_dir / "feature_names.json"
    metrics_path = models_dir / "model_metrics.json"

    joblib.dump(classifier, classifier_path)
    joblib.dump(regressor, regressor_path)

    with open(features_path, "w", encoding="utf-8") as f:
        json.dump(FEATURE_COLUMNS, f, indent=2)

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"Saved: {classifier_path}")
    print(f"Saved: {regressor_path}")
    print(f"Saved: {features_path}")
    print(f"Saved: {metrics_path}")


def predict_with_confidence(
    classifier: XGBClassifier,
    regressor: XGBRegressor,
    features: pd.DataFrame,
) -> dict:
    """
    Run inference on a single seller and return predictions with confidence.

    Confidence is the maximum class probability from predict_proba,
    expressed as a percentage for dashboard display.
    """
    proba = classifier.predict_proba(features)[0]
    predicted_class = int(classifier.predict(features)[0])
    confidence_pct = float(np.max(proba) * 100)

    predicted_loan = float(regressor.predict(features)[0])

    return {
        "predicted_risk_class": predicted_class,
        "predicted_risk_label": RISK_CLASS_LABELS[predicted_class],
        "confidence_pct": round(confidence_pct, 2),
        "class_probabilities": {
            RISK_CLASS_LABELS[i]: round(float(p) * 100, 2) for i, p in enumerate(proba)
        },
        "predicted_loan_limit": round(predicted_loan, 2),
    }


def sample_prediction(
    classifier: XGBClassifier,
    regressor: XGBRegressor,
    splits: dict,
) -> None:
    """Demonstrate inference on one random seller from the test set."""
    print(f"\n{'=' * 60}")
    print("STEP 9: Sample inference on a random test seller")
    print(f"{'=' * 60}")

    X_test = splits["X_test"]
    y_risk_test = splits["y_risk_test"]
    y_loan_test = splits["y_loan_test"]

    # Pick a reproducible random index from the test set
    rng = np.random.RandomState(RANDOM_STATE)
    sample_idx = rng.randint(0, len(X_test))

    sample_features = X_test.iloc[[sample_idx]]
    actual_risk = int(y_risk_test.iloc[sample_idx])
    actual_loan = float(y_loan_test.iloc[sample_idx])

    result = predict_with_confidence(classifier, regressor, sample_features)

    print("\nSeller features:")
    for col in FEATURE_COLUMNS:
        print(f"  {col}: {sample_features[col].values[0]}")

    print(f"\nPredicted Risk Class:  {result['predicted_risk_class']} ({result['predicted_risk_label']})")
    print(f"Classifier Confidence: {result['confidence_pct']:.2f}%")
    print(f"Class Probabilities:   {result['class_probabilities']}")
    print(f"Actual Risk Class:     {actual_risk} ({RISK_CLASS_LABELS[actual_risk]})")
    print(f"\nPredicted Loan Limit:  INR {result['predicted_loan_limit']:,.2f}")
    print(f"Actual Loan Limit:     INR {actual_loan:,.2f}")


def main() -> None:
    """End-to-end training pipeline."""
    print("Meesho Pragati Agent — Model Training Pipeline")
    print(f"Started at: {datetime.now(timezone.utc).isoformat()}")

    # 1. Load data
    df = load_data()

    # 2. Define features and targets
    X, y_risk, y_loan = prepare_features_targets(df)

    # 3. Train-test split
    splits = split_data(X, y_risk, y_loan)

    # 4. Preprocess / validate
    X_train, X_test = preprocess_features(splits["X_train"], splits["X_test"])
    splits["X_train"] = X_train
    splits["X_test"] = X_test

    # 5. Train models
    classifier = train_classifier(splits["X_train"], splits["y_risk_train"])
    regressor = train_regressor(splits["X_train"], splits["y_loan_train"])

    # 6. Evaluate
    metrics = evaluate_models(classifier, regressor, splits)

    # 7. SHAP explainability
    generate_shap_summary(classifier, splits["X_train"])

    # 8. Save artifacts
    save_models(classifier, regressor, metrics)

    # 9. Sample prediction with confidence score
    sample_prediction(classifier, regressor, splits)

    print(f"\n{'=' * 60}")
    print("Training pipeline completed successfully.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
