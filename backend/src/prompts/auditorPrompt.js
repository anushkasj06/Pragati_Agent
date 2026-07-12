/**
 * Prompt template for internal auditor trail (always English).
 * @returns {string}
 */
export function buildAuditorPrompt() {
  return `Generate an auditor_trail for internal underwriting review.

REQUIREMENTS:
- Language: English only
- Tone: Professional, structured, audit-ready
- Length: 4–6 sentences
- Reference risk_class, risk_score, and final_loan_limit exactly as provided
- Mention both positive and negative factors from top_reasoning_features
- Explain why the Rules Engine reached its decision (caps, review flags, rejection rules)
- Do NOT expose SHAP values or raw ML internals
- Do NOT modify any numeric decision fields`;
}
