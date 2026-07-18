/**
 * Translation Routes — Google Cloud Translation API
 * Batch endpoint for translating UI strings and dynamic content
 * Supports caching to reduce costs and improve performance
 */

import express from "express";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { v3 as translate } from "@google-cloud/translate";
import { logger } from "../config/logger.js";
import { Translation } from "../models/Translation.js";

const router = express.Router();
const translationClient = new translate.TranslationServiceClient();

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "";
const location = "global";

const supportedLanguages = new Set([
  "en", "hi", "mr", "bn", "gu", "pa", "ta", "te", "kn", "ml", "or", "as", "ur",
]);

const translationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: "Too many translation requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create cache key from text + language pair
 */
function createCacheKey(text, sourceLanguage, targetLanguage) {
  return crypto
    .createHash("sha256")
    .update(`${sourceLanguage}:${targetLanguage}:${text}`)
    .digest("hex");
}

/**
 * POST /api/translate/batch
 * Translate array of strings with caching
 *
 * Body:
 *   {
 *     "texts": ["string1", "string2", ...],
 *     "sourceLanguage": "en",
 *     "targetLanguage": "hi"
 *   }
 */
router.post("/batch", translationLimiter, async (req, res) => {
  try {
    const { texts, sourceLanguage = "en", targetLanguage } = req.body;

    // Validation
    if (!projectId) {
      logger.error("Translation: GOOGLE_CLOUD_PROJECT not configured");
      return res.status(500).json({
        error: "Server not configured for translation",
        message: "GOOGLE_CLOUD_PROJECT is not set in environment",
      });
    }

    if (!supportedLanguages.has(targetLanguage)) {
      return res.status(400).json({
        error: "Unsupported language",
        message: `Target language "${targetLanguage}" not supported. Supported: ${[...supportedLanguages].join(", ")}`,
      });
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: "Invalid input",
        message: "texts must be a non-empty array",
      });
    }

    if (texts.length > 100) {
      return res.status(400).json({
        error: "Request too large",
        message: "Maximum 100 strings per request",
      });
    }

    const cleanTexts = texts.map((text) =>
      typeof text === "string" ? text.trim() : ""
    );

    // Validate each text
    if (cleanTexts.some((text) => !text || text.length > 5000)) {
      return res.status(400).json({
        error: "Invalid text",
        message: "Each text must be 1-5000 characters",
      });
    }

    // If source and target are same, return as-is
    if (sourceLanguage === targetLanguage) {
      logger.info("Translation: source and target same, returning as-is", {
        language: targetLanguage,
        count: texts.length,
      });
      return res.json({
        sourceLanguage,
        targetLanguage,
        translations: cleanTexts,
        cached: true,
      });
    }

    const results = new Array(cleanTexts.length);
    const cacheChecks = [];

    // Check MongoDB cache first
    for (let i = 0; i < cleanTexts.length; i++) {
      const key = createCacheKey(
        cleanTexts[i],
        sourceLanguage,
        targetLanguage
      );
      cacheChecks.push(
        Translation.findOne({
          sourceHash: key,
          sourceLanguage,
          targetLanguage,
        })
          .then((doc) => ({
            index: i,
            cached: doc,
            sourceHash: key,
            sourceText: cleanTexts[i],
          }))
          .catch(() => ({
            index: i,
            cached: null,
            sourceHash: key,
            sourceText: cleanTexts[i],
          }))
      );
    }

    const cacheResults = await Promise.all(cacheChecks);
    const toTranslate = [];

    cacheResults.forEach(({ index, cached, sourceHash, sourceText }) => {
      if (cached) {
        results[index] = cached.translatedText;
      } else {
        toTranslate.push({ index, sourceHash, sourceText });
      }
    });

    // Call Google API for uncached texts
    if (toTranslate.length > 0) {
      logger.info("Translation: calling Google API", {
        count: toTranslate.length,
        targetLanguage,
      });

      const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: toTranslate.map((item) => item.sourceText),
        mimeType: "text/plain",
        sourceLanguageCode: sourceLanguage,
        targetLanguageCode: targetLanguage,
      };

      const [response] = await translationClient.translateText(request);

      // Save to cache and populate results
      const savePromises = [];
      response.translations.forEach((translation, idx) => {
        const { index, sourceHash, sourceText } = toTranslate[idx];
        const translatedText = translation.translatedText;

        results[index] = translatedText;

        // Save to MongoDB cache
        savePromises.push(
          Translation.findOneAndUpdate(
            {
              sourceHash,
              sourceLanguage,
              targetLanguage,
            },
            {
              sourceHash,
              sourceLanguage,
              targetLanguage,
              sourceText,
              translatedText,
              updatedAt: new Date(),
            },
            { upsert: true }
          ).catch((err) => {
            logger.warn("Translation: cache save failed", { error: err.message });
          })
        );
      });

      await Promise.all(savePromises);
    }

    logger.info("Translation: batch complete", {
      total: texts.length,
      cached: results.filter(Boolean).length,
      uncached: toTranslate.length,
      targetLanguage,
    });

    return res.json({
      sourceLanguage,
      targetLanguage,
      translations: results,
      cacheHit: toTranslate.length === 0,
    });
  } catch (error) {
    logger.error("Translation error", {
      error: error.message,
      code: error.code,
      status: error.status,
    });

    return res.status(500).json({
      error: "Translation failed",
      message: error.message || "Could not complete translation",
    });
  }
});

export default router;
