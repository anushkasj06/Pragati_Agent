/**
 * coachRoutes.js — AI Financial Coach chat endpoint.
 * POST /api/coach/chat
 * Accepts messages array + seller context, calls Groq directly.
 */
import { Router } from "express";
import { chatCompletion } from "../config/groq.js";
import { logger } from "../config/logger.js";
import { GROQ_MAX_TOKENS } from "../utils/constants.js";

const router = Router();

/**
 * @openapi
 * /api/coach/chat:
 *   post:
 *     summary: AI Financial Coach chat (seller-facing)
 *     tags: [Coach]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messages]
 *             properties:
 *               messages:
 *                 type: array
 *               seller_id:
 *                 type: string
 *               language:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI coach reply
 *       502:
 *         description: Groq unavailable
 */
router.post("/chat", async (req, res, next) => {
  try {
    const { messages, seller_id, language } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    logger.info("Coach chat request", { seller_id, language, turns: messages.length });

    const response = await chatCompletion(messages, {
      maxTokens: 800,   // Coach responses can be longer than evaluation responses
      temperature: 0.35, // Slightly more creative/warm for coaching tone
    });

    logger.info("Coach chat response", {
      seller_id,
      language,
      tokens: response.usage?.total_tokens,
      elapsed_ms: response.elapsed_ms,
    });

    res.json({
      content: response.content,
      usage:   response.usage,
      elapsed_ms: response.elapsed_ms,
    });
  } catch (error) {
    logger.warn("Coach chat Groq error", { error: error.message });
    // Return 502 so frontend knows to use fallback
    res.status(502).json({
      error: "Groq AI coach temporarily unavailable",
      details: error.message,
    });
  }
});

export default router;
