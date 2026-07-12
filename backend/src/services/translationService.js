import { v2 as TranslateV2 } from "@google-cloud/translate";
import { logger } from "../config/logger.js";
import { LANGUAGE_CODES, SUPPORTED_LANGUAGES } from "../utils/constants.js";

let translateClient = null;

/**
 * Lazily initialise Google Cloud Translation client.
 * @returns {TranslateV2.Translate|null}
 */
function getTranslateClient() {
  if (translateClient) return translateClient;

  if (!process.env.GOOGLE_PROJECT_ID) {
    return null;
  }

  try {
    translateClient = new TranslateV2.Translate({
      projectId: process.env.GOOGLE_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    return translateClient;
  } catch (error) {
    logger.warn("Google Translation client init failed", { error: error.message });
    return null;
  }
}

/**
 * Detect if text appears to be English (simple heuristic).
 * @param {string} text
 * @returns {boolean}
 */
function looksEnglish(text) {
  const asciiRatio = (text.match(/[\x00-\x7F]/g) || []).length / Math.max(text.length, 1);
  return asciiRatio > 0.85;
}

/**
 * Translate text via Google Cloud Translation API (fallback only).
 * @param {string} text
 * @param {string} targetLanguage
 * @returns {Promise<string>}
 */
export async function translateText(text, targetLanguage) {
  if (!text || targetLanguage === "English") return text;

  const client = getTranslateClient();
  if (!client) {
    logger.warn("Translation fallback skipped — Google credentials not configured");
    return text;
  }

  const targetCode = LANGUAGE_CODES[targetLanguage];
  if (!targetCode) {
    throw new Error(`Unsupported translation language: ${targetLanguage}`);
  }

  const start = Date.now();
  const [translation] = await client.translate(text, targetCode);
  const elapsed = Date.now() - start;

  logger.info("Translation completed", {
    targetLanguage,
    elapsed_ms: elapsed,
    chars: text.length,
  });

  return translation;
}

/**
 * Ensure seller message is in the requested language.
 * Llama should generate directly; Google Translate is fallback only.
 *
 * @param {string} sellerMessage
 * @param {string} language
 * @returns {Promise<string>}
 */
export async function ensureSellerLanguage(sellerMessage, language) {
  if (!sellerMessage) return sellerMessage;
  if (language === "English") return sellerMessage;

  if (!looksEnglish(sellerMessage)) {
    return sellerMessage;
  }

  logger.info("Applying translation fallback", { language });
  return translateText(sellerMessage, language);
}

/**
 * Validate language is supported.
 * @param {string} language
 * @returns {boolean}
 */
export function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}
