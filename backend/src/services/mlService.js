import axios from "axios";
import { logger } from "../config/logger.js";
import { ML_MAX_RETRIES, ML_TIMEOUT_MS } from "../utils/constants.js";
import { createHttpError } from "../middleware/errorHandler.js";

/** Reusable HTTP client for the FastAPI ML microservice */
const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || "http://localhost:5001",
  timeout: ML_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

/**
 * Sleep helper for retry backoff.
 * @param {number} ms
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** * Build a deterministic fallback score when the ML service is unavailable.
 * @param {string} sellerId
 * @param {object} sellerData
 * @returns {{risk_class: string, risk_score: number, loan_limit: number, top_reasoning_features: Array<{feature:string, impact:string, reason:string}>}}
 */
function buildFallbackScore(sellerId, sellerData = {}) {
  const velocity = Number(sellerData.sales_velocity_6m || 0);
  const rating = Number(sellerData.avg_customer_rating || 0);
  const compliance = Number(sellerData.dispatch_sla_compliance || 0);
  const rtoRate = Number(sellerData.rto_rate || 0);
  const priorDefault = Number(sellerData.prior_loan_default || 0);
  const ageMonths = Number(sellerData.account_age_months || 0);

  let riskScore = 60;
  if (velocity > 100_000) riskScore += 8;
  if (rating >= 4.5) riskScore += 8;
  else if (rating >= 4.0) riskScore += 4;
  if (compliance >= 90) riskScore += 8;
  if (rtoRate > 20) riskScore -= 18;
  if (priorDefault === 1) riskScore -= 12;
  if (ageMonths < 6) riskScore -= 10;

  riskScore = Math.max(35, Math.min(95, riskScore));
  const riskClass = riskScore >= 80 ? "Low" : riskScore >= 60 ? "Moderate" : "High";

  let loanLimit = 50_000;
  loanLimit += velocity > 100_000 ? 15_000 : 0;
  loanLimit += rating >= 4.5 ? 15_000 : 0;
  loanLimit += compliance >= 90 ? 10_000 : 0;
  loanLimit -= priorDefault === 1 ? 20_000 : 0;
  loanLimit -= rtoRate > 20 ? 20_000 : 0;
  loanLimit = Math.max(0, Math.min(100_000, loanLimit));
  loanLimit = Math.round(loanLimit / 5_000) * 5_000;

  return {
    risk_class: riskClass,
    risk_score: Math.round(riskScore),
    loan_limit: loanLimit,
    top_reasoning_features: [
      {
        feature: "sales_velocity_6m",
        impact: "positive",
        reason: "Healthy sales velocity supports a stronger profile.",
      },
      {
        feature: "dispatch_sla_compliance",
        impact: "positive",
        reason: "Consistent dispatch compliance improves overall risk posture.",
      },
      {
        feature: "rto_rate",
        impact: "negative",
        reason: "Higher return-to-origin rates may reduce eligibility.",
      },
    ],
  };
}

/** * Call the FastAPI /score endpoint with retries and timeout.
 * @param {string} sellerId
 * @param {object} sellerData - Seller feature payload
 * @returns {Promise<{
 *   risk_class: string,
 *   risk_score: number,
 *   loan_limit: number,
 *   top_reasoning_features: Array<{feature: string, impact: string, reason: string}>
 * }>}
 */
export async function scoreSeller(sellerId, sellerData) {
  const payload = { seller_id: sellerId, ...sellerData };
  let lastError;

  for (let attempt = 1; attempt <= ML_MAX_RETRIES; attempt++) {
    const start = Date.now();
    try {
      logger.info("ML scoring request", { sellerId, attempt });

      const { data } = await mlClient.post("/score", payload);
      const elapsed = Date.now() - start;

      logger.info("ML scoring response", {
        sellerId,
        risk_class: data.risk_class,
        risk_score: data.risk_score,
        loan_limit: data.loan_limit,
        elapsed_ms: elapsed,
      });

      return {
        risk_class: data.risk_class,
        risk_score: data.risk_score,
        loan_limit: data.loan_limit,
        top_reasoning_features: data.top_reasoning_features ?? [],
      };
    } catch (error) {
      lastError = error;
      const elapsed = Date.now() - start;

      logger.warn("ML scoring attempt failed", {
        sellerId,
        attempt,
        elapsed_ms: elapsed,
        error: error.message,
        status: error.response?.status,
      });

      if (attempt < ML_MAX_RETRIES) {
        await delay(300 * attempt);
      }
    }
  }

  const message =
    lastError?.response?.data?.error ||
    lastError?.message ||
    "ML service unavailable after retries";

  logger.warn("ML scoring unavailable, using deterministic fallback", {
    sellerId,
    reason: message,
  });

  return buildFallbackScore(sellerId, sellerData);
}

export { mlClient };
