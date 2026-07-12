"""
Meesho Pragati Agent — ML inference microservice.

Loads XGBoost classifier/regressor once at startup, serves /score with
SHAP-based explainability for the React dashboard and Node.js backend.
"""

from __future__ import annotations

import json
import logging
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional

import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("pragati-ml-api")

# ---------------------------------------------------------------------------
# Constants & metadata
# ---------------------------------------------------------------------------
ARTIFACTS_DIR = Path("artifacts")
MODEL_VERSION = "1.0.0"
RISK_LABELS = {0: "Low", 1: "Medium", 2: "High"}

FEATURE_DISPLAY_NAMES: dict[str, str] = {
    "sales_velocity_6m": "Sales Velocity",
    "sales_growth_rate": "Sales Growth Rate",
    "rto_rate": "RTO Rate",
    "dispatch_sla_compliance": "Dispatch SLA Compliance",
    "avg_customer_rating": "Customer Rating",
    "rating_trend": "Rating Trend",
    "order_cancellation_rate": "Order Cancellation Rate",
    "ad_spend_roi": "Ad Spend ROI",
    "account_age_months": "Account Age",
    "total_orders_6m": "Total Orders (6M)",
    "catalog_size": "Catalog Size",
    "prior_loan_default": "Prior Loan Default",
}

FEATURE_METADATA: dict[str, dict[str, str]] = {
    "sales_velocity_6m": {
        "positive": "Strong sales performance increased eligibility.",
        "negative": "Lower sales reduced eligibility.",
    },
    "sales_growth_rate": {
        "positive": "Positive sales growth strengthened the profile.",
        "negative": "Declining sales growth reduced eligibility.",
    },
    "dispatch_sla_compliance": {
        "positive": "Orders are dispatched on time, improving trust.",
        "negative": "Late dispatches reduced customer confidence.",
    },
    "avg_customer_rating": {
        "positive": "Excellent customer ratings increased trust.",
        "negative": "Customer ratings need improvement.",
    },
    "rating_trend": {
        "positive": "Improving customer ratings build lender trust.",
        "negative": "Declining ratings signal potential quality issues.",
    },
    "rto_rate": {
        "positive": "Low return rate increased lender confidence.",
        "negative": "High return rate increased lending risk.",
    },
    "order_cancellation_rate": {
        "positive": "Low cancellation rate improved reliability.",
        "negative": "Frequent cancellations reduced reliability.",
    },
    "ad_spend_roi": {
        "positive": "Advertising performance is healthy.",
        "negative": "Advertising ROI could be improved.",
    },
    "account_age_months": {
        "positive": "Long business history improved trust.",
        "negative": "Business is still relatively new.",
    },
    "total_orders_6m": {
        "positive": "High order volume strengthened the profile.",
        "negative": "Order volume is currently low.",
    },
    "catalog_size": {
        "positive": "Large product catalog increased confidence.",
        "negative": "Expanding the catalog may improve eligibility.",
    },
    "prior_loan_default": {
        "positive": "No previous loan defaults found.",
        "negative": "Previous loan default reduced eligibility.",
    },
}


# ---------------------------------------------------------------------------
# Global singleton — loaded once at startup, never recreated per request
# ---------------------------------------------------------------------------
class ModelStore:
    """Holds loaded models and the SHAP explainer as application singletons."""

    classifier: Any = None
    regressor: Any = None
    feature_names: list[str] = []
    shap_explainer: shap.TreeExplainer | None = None
    loaded: bool = False


models = ModelStore()


def load_artifacts() -> None:
    """Load model pickles, feature names, and initialise the SHAP explainer."""
    classifier_path = ARTIFACTS_DIR / "risk_classifier.pkl"
    regressor_path = ARTIFACTS_DIR / "loan_regressor.pkl"
    features_path = ARTIFACTS_DIR / "feature_names.json"

    for path in (classifier_path, regressor_path, features_path):
        if not path.exists():
            raise FileNotFoundError(f"Required artifact not found: {path}")

    models.classifier = joblib.load(classifier_path)
    models.regressor = joblib.load(regressor_path)

    with open(features_path, encoding="utf-8") as f:
        models.feature_names = json.load(f)

    # SHAP explainer is expensive — create exactly once
    models.shap_explainer = shap.TreeExplainer(models.classifier)
    models.loaded = True

    logger.info(
        "Artifacts loaded | classifier=%s regressor=%s features=%d",
        classifier_path,
        regressor_path,
        len(models.feature_names),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan hook — load models before serving traffic."""
    try:
        load_artifacts()
    except FileNotFoundError as exc:
        logger.error("Startup failed: %s", exc)
        models.loaded = False
    yield


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Meesho Pragati Agent ML API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------
class SellerFeatures(BaseModel):
    """Seller profile input for risk scoring and loan-limit prediction."""

    seller_id: Optional[str] = None
    sales_velocity_6m: float = Field(..., ge=5000, le=200_000)
    sales_growth_rate: float = Field(..., ge=-20, le=40)
    rto_rate: float = Field(..., ge=2, le=25)
    dispatch_sla_compliance: float = Field(..., ge=60, le=100)
    avg_customer_rating: float = Field(..., ge=1.0, le=5.0)
    rating_trend: float = Field(..., ge=-0.5, le=0.5)
    order_cancellation_rate: float = Field(..., ge=0, le=20)
    ad_spend_roi: float = Field(..., ge=0.5, le=5.0)
    account_age_months: int = Field(..., ge=1, le=60)
    total_orders_6m: int = Field(..., ge=50, le=5000)
    catalog_size: int = Field(..., ge=5, le=500)
    prior_loan_default: int = Field(..., ge=0, le=1)

    @field_validator("prior_loan_default")
    @classmethod
    def validate_binary_default(cls, value: int) -> int:
        if value not in (0, 1):
            raise ValueError("prior_loan_default must be 0 or 1")
        return value


class ReasoningFeature(BaseModel):
    feature: str
    impact: str
    reason: str


class ScoreResponse(BaseModel):
    seller_id: Optional[str]
    risk_class: str
    risk_score: int
    loan_limit: int
    top_reasoning_features: list[ReasoningFeature]


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------
def _ensure_models_loaded() -> None:
    """Raise HTTP 500 if startup loading failed."""
    if not models.loaded or models.classifier is None or models.regressor is None:
        raise HTTPException(
            status_code=500,
            detail={"error": "Models are not loaded. Check server startup logs."},
        )


def features_to_dataframe(payload: SellerFeatures) -> pd.DataFrame:
    """Convert validated Pydantic input into a single-row DataFrame with correct column order."""
    row = payload.model_dump(exclude={"seller_id"})
    df = pd.DataFrame([row])
    return df[models.feature_names]


def _extract_class_shap(shap_values: Any, predicted_class: int) -> np.ndarray:
    """
    Extract per-feature SHAP contributions for the predicted class.

    Handles legacy list-of-arrays and newer (n_samples, n_features, n_classes) layouts.
    """
    if isinstance(shap_values, list):
        return shap_values[predicted_class][0]
    if isinstance(shap_values, np.ndarray) and shap_values.ndim == 3:
        return shap_values[0, :, predicted_class]
    return shap_values[0]


def build_top_reasoning_features(
    shap_contributions: np.ndarray,
    top_k: int = 5,
) -> list[ReasoningFeature]:
    """
    Map SHAP signs to human-readable explanations using FEATURE_METADATA.

    Returns the top-k features sorted by absolute SHAP magnitude (no raw values exposed).
    """
    reasoning: list[tuple[float, ReasoningFeature]] = []

    for idx, feature_key in enumerate(models.feature_names):
        contribution = float(shap_contributions[idx])
        impact = "Positive" if contribution >= 0 else "Negative"
        meta = FEATURE_METADATA[feature_key]
        reason = meta["positive"] if contribution >= 0 else meta["negative"]

        reasoning.append(
            (
                abs(contribution),
                ReasoningFeature(
                    feature=FEATURE_DISPLAY_NAMES[feature_key],
                    impact=impact,
                    reason=reason,
                ),
            )
        )

    reasoning.sort(key=lambda item: item[0], reverse=True)
    return [item[1] for item in reasoning[:top_k]]


def run_prediction(df: pd.DataFrame) -> dict[str, Any]:
    """Execute classifier + regressor inference and SHAP explainability."""
    if models.shap_explainer is None:
        raise RuntimeError("SHAP explainer is not initialised")

    # Risk classification
    probabilities = models.classifier.predict_proba(df)[0]
    predicted_class = int(models.classifier.predict(df)[0])
    max_probability = float(np.max(probabilities))
    risk_score = int(max_probability * 100)

    # Loan limit regression
    loan_limit = int(round(float(models.regressor.predict(df)[0])))

    # SHAP explainability for the predicted class only
    shap_values = models.shap_explainer.shap_values(df)
    class_shap = _extract_class_shap(shap_values, predicted_class)
    top_reasons = build_top_reasoning_features(class_shap)

    return {
        "risk_class": RISK_LABELS[predicted_class],
        "risk_score": risk_score,
        "loan_limit": max(loan_limit, 0),
        "top_reasoning_features": top_reasons,
    }


# ---------------------------------------------------------------------------
# Error handlers — always return {"error": "message"}
# ---------------------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    """HTTP 400 for missing fields, invalid types, or out-of-range values."""
    messages = []
    for err in exc.errors():
        loc = " -> ".join(str(part) for part in err.get("loc", ()))
        messages.append(f"{loc}: {err.get('msg')}")
    return JSONResponse(status_code=400, content={"error": "; ".join(messages)})


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    """Normalise HTTPException payloads to {"error": ...}."""
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    """HTTP 500 for unexpected internal failures."""
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal model error"})


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
async def health() -> dict[str, Any]:
    """Liveness probe — confirms service is running and models are loaded."""
    return {
        "status": "ok",
        "models_loaded": models.loaded,
        "service": "Meesho Pragati Agent ML API",
    }


@app.get("/model-info")
async def model_info() -> dict[str, Any]:
    """Return metadata about the loaded models for debugging and dashboards."""
    _ensure_models_loaded()
    return {
        "algorithm": "XGBoost",
        "classifier_loaded": models.classifier is not None,
        "regressor_loaded": models.regressor is not None,
        "feature_count": len(models.feature_names),
        "feature_names": models.feature_names,
        "model_version": MODEL_VERSION,
    }


@app.post("/score", response_model=ScoreResponse)
async def score_seller(payload: SellerFeatures) -> ScoreResponse:
    """
    Score a seller for credit risk and loan eligibility.

    Returns predicted risk class, confidence score, loan limit, and top-5
    SHAP-based reasoning features for dashboard display.
    """
    _ensure_models_loaded()

    seller_ref = payload.seller_id or "unknown"
    logger.info("Score request received | seller_id=%s", seller_ref)
    start = time.perf_counter()

    try:
        df = features_to_dataframe(payload)
        result = run_prediction(df)
    except Exception as exc:
        logger.exception("Prediction failed | seller_id=%s error=%s", seller_ref, exc)
        raise HTTPException(status_code=500, detail={"error": "Internal model error"}) from exc

    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "Prediction completed | seller_id=%s risk=%s score=%d loan=%d elapsed=%.2fms",
        seller_ref,
        result["risk_class"],
        result["risk_score"],
        result["loan_limit"],
        elapsed_ms,
    )

    return ScoreResponse(
        seller_id=payload.seller_id,
        risk_class=result["risk_class"],
        risk_score=result["risk_score"],
        loan_limit=result["loan_limit"],
        top_reasoning_features=result["top_reasoning_features"],
    )
