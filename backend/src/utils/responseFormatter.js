/**
 * Build the standard loan evaluation API response envelope.
 * @param {object} params
 * @returns {object}
 */
export function formatEvaluateResponse({
  sellerId, decision, topReasoningFeatures, sellerMessage,
  auditorTrail, improvementPlan, language, executionTimeMs, isFallback = false,
}) {
  return {
    seller_id: sellerId,
    decision: {
      risk_class:            decision.risk_class,
      risk_score:            decision.risk_score,
      loan_limit:            decision.final_loan_limit,
      requires_human_review: decision.requires_human_review,
      decision_status:       decision.decision_status,
    },
    top_reasoning_features: topReasoningFeatures,
    seller_message:  sellerMessage,
    auditor_trail:   auditorTrail,
    improvement_plan: improvementPlan,
    language,
    execution_time_ms: executionTimeMs,
    is_fallback:       isFallback,
  };
}

/**
 * Standard error payload.
 * @param {string} message
 * @returns {{ error: string }}
 */
export function formatError(message) {
  return { error: message };
}
