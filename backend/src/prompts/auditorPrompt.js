/**
 * Auditor trail prompt — generates a detailed internal underwriting record.
 * Always English. Professional and audit-ready.
 * @returns {string}
 */
export function buildAuditorPrompt() {
  return `Generate the auditor_trail field for internal underwriting review.

LANGUAGE: English only — this is an internal document.

TONE: Professional, precise, structured — suitable for regulatory review and compliance audit.

LENGTH: Write a DETAILED audit record of 6 to 8 sentences. Be thorough and specific.

REQUIRED CONTENT — include ALL of these in the auditor_trail:
1. Seller identification and evaluation timestamp context
2. Exact risk_class and risk_score with interpretation
3. The ML model's raw loan_limit prediction before rules engine
4. The Rules Engine final_loan_limit after all policy caps and adjustments applied
5. Specific mention of which rules fired — e.g., young account cap, maximum loan cap, human review flag,
   or dual-trigger rejection (prior default + high RTO)
6. The top positive factors from the reasoning features and what they indicate
7. The top negative factors from the reasoning features and what risk they represent
8. Final decision_status and whether human review is required, with justification

RULES:
- Reference all numeric values exactly as provided — do not round or approximate
- Use formal language: "The evaluation determined...", "The Rules Engine applied...", "Factors indicating..."
- Do NOT expose raw SHAP values or model hyperparameters
- Do NOT modify any numeric decision fields`;
}
