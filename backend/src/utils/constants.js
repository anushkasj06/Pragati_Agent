/** @typedef {'English'|'Hindi'|'Marathi'|'Tamil'|'Telugu'|'Kannada'|'Gujarati'|'Malayalam'} SupportedLanguage */

/** @type {SupportedLanguage[]} */
export const SUPPORTED_LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Gujarati",
  "Malayalam",
];

export const SERVICE_NAME = "Meesho Pragati Agent Backend";
export const SERVICE_VERSION = "1.0.0";

export const MAX_LOAN_LIMIT = 100_000;
export const YOUNG_ACCOUNT_CAP = 50_000;
export const HUMAN_REVIEW_THRESHOLD = 75_000;
export const LOAN_ROUNDING = 5_000;
export const YOUNG_ACCOUNT_MONTHS = 6;

export const ML_TIMEOUT_MS = 5_000;
export const ML_MAX_RETRIES = 3;

// Legacy aliases kept for any code that still imports LLAMA_* constants
export const LLAMA_TEMPERATURE = 0.2;
export const LLAMA_TOP_P = 0.9;
export const LLAMA_MAX_TOKENS = 700;

// Groq provider constants
export const GROQ_TEMPERATURE = 0.2;
export const GROQ_TOP_P = 0.9;
// Increased to 1200 to allow detailed seller explanations and full audit trails
export const GROQ_MAX_TOKENS = 1200;

/** BCP-47 codes for Google Translation fallback */
export const LANGUAGE_CODES = {
  English: "en",
  Hindi: "hi",
  Marathi: "mr",
  Tamil: "ta",
  Telugu: "te",
  Kannada: "kn",
  Gujarati: "gu",
  Malayalam: "ml",
};
