/**
 * Prompt template for seller-facing messages.
 * @param {string} language - Target language for direct generation
 * @returns {string}
 */
export function buildSellerPrompt(language) {
  return `Generate a seller_message for the Meesho seller app.

REQUIREMENTS:
- Language: ${language} (write directly in this language — do NOT use English unless requested)
- Tone: Friendly, encouraging, conversational
- Length: 2–4 sentences
- Mention the final loan decision and one positive factor
- If rejected or under review, explain kindly with next steps
- Use ONLY supplied facts — never invent numbers
- Do NOT mention SHAP, ML models, or internal scoring mechanics`;
}
