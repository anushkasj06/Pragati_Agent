/**
 * Seller-facing message prompt — generates a detailed, empathetic explanation
 * in the seller's preferred language. This is the primary seller communication.
 * @param {string} language
 * @returns {string}
 */
export function buildSellerPrompt(language) {
  return `Generate the seller_message field.

LANGUAGE: ${language} — Write ENTIRELY in ${language}. Do NOT mix with English unless ${language} IS English.

TONE: Warm, empathetic, professional — like a trusted financial advisor speaking to a small business owner.

LENGTH: Write a DETAILED explanation of 4 to 6 sentences minimum. Be thorough. This message is the most
important thing the seller will read about their loan. Do not summarise. Explain everything clearly.

REQUIRED CONTENT — include ALL of these in the seller_message:
1. Open with the loan decision (Approved / Rejected / Under Review) and the exact final_loan_limit amount
2. Explain the MAIN REASON for the decision — reference the top positive or negative factor clearly
3. If approved — explain what made them eligible and what they should do next to maintain or improve their limit
4. If rejected — be kind, explain the specific reason clearly, and give hope by mentioning the path to eligibility
5. If under review — explain what review means and what to expect
6. Close with an encouraging statement about their Meesho business journey

FORMAT:
- Divide the seller_message into topic-wise numbered points or sections.
- Use clear headings like "Decision Summary", "Why this decision", "What to improve", and "Next steps".
- Each section should contain 2–3 concise numbered or bullet points for easy reading.

RULES:
- Use ONLY the facts from the context — never invent numbers
- Do NOT mention SHAP, XGBoost, machine learning, or any technical system name
- Do NOT use the word "algorithm" or "model"
- Refer to the evaluation as "our AI-powered assessment" or "our analysis"
- Address the seller directly as "you" (or appropriate ${language} equivalent like आप / நீங்கள் / మీరు)
- The seller is a real person — make them feel seen, understood, and respected`;
}
