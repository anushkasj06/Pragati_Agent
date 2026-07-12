import {
  HUMAN_REVIEW_THRESHOLD,
  LOAN_ROUNDING,
  MAX_LOAN_LIMIT,
  YOUNG_ACCOUNT_CAP,
  YOUNG_ACCOUNT_MONTHS,
} from "../utils/constants.js";

/**
 * Round a loan amount to the nearest ₹5000.
 * @param {number} amount
 * @returns {number}
 */
export function roundLoanAmount(amount) {
  if (amount <= 0) return 0;
  return Math.round(amount / LOAN_ROUNDING) * LOAN_ROUNDING;
}

/**
 * Deterministic rules engine — no AI, no randomness.
 * Applies business caps and rejection rules on top of ML loan_limit.
 *
 * @param {object} params
 * @param {number} params.mlLoanLimit - Raw loan limit from ML model
 * @param {object} params.sellerData - Seller feature object
 * @returns {{
 *   final_loan_limit: number,
 *   requires_human_review: boolean,
 *   decision_status: 'Approved'|'Rejected'
 * }}
 */
export function evaluateRules({ mlLoanLimit, sellerData }) {
  let finalLoanLimit = Math.min(mlLoanLimit, MAX_LOAN_LIMIT);
  let requiresHumanReview = false;
  let decisionStatus = "Approved";

  // Young accounts capped at ₹50,000
  if (sellerData.account_age_months < YOUNG_ACCOUNT_MONTHS) {
    finalLoanLimit = Math.min(finalLoanLimit, YOUNG_ACCOUNT_CAP);
  }

  // Reject: prior default AND high RTO
  const priorDefault = Number(sellerData.prior_loan_default) === 1;
  const highRto = Number(sellerData.rto_rate) > 20;

  if (priorDefault && highRto) {
    return {
      final_loan_limit: 0,
      requires_human_review: false,
      decision_status: "Rejected",
    };
  }

  // Large loans require human review
  if (finalLoanLimit > HUMAN_REVIEW_THRESHOLD) {
    requiresHumanReview = true;
  }

  finalLoanLimit = roundLoanAmount(finalLoanLimit);

  return {
    final_loan_limit: finalLoanLimit,
    requires_human_review: requiresHumanReview,
    decision_status: decisionStatus,
  };
}
