import { Router } from "express";
import {
  buildGroqRequestUrl,
  chatCompletion,
  getGroqBaseUrl,
  getGroqModel,
} from "../config/groq.js";

const router = Router();

/**
 * @openapi
 * /api/debug/groq:
 *   get:
 *     summary: Test Groq LLM connectivity
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Groq responded successfully
 *       502:
 *         description: Groq connection failed
 */
router.get("/groq", async (_req, res) => {
  const model      = getGroqModel();
  const baseUrl    = getGroqBaseUrl();
  const requestUrl = buildGroqRequestUrl(baseUrl);

  try {
    const response = await chatCompletion([
      { role: "system", content: "You are a helpful assistant." },
      { role: "user",   content: "Say Hello" },
    ]);

    res.json({
      ok:           true,
      provider:     "groq",
      model,
      base_url:     baseUrl,
      request_url:  requestUrl,
      status_code:  response.status_code ?? 200,
      content:      response.content,
      usage:        response.usage,
      elapsed_ms:   response.elapsed_ms,
    });
  } catch (error) {
    const details = error.details ?? {
      error_message: error.message,
      status_code:   error.response?.status,
      response_body: error.response?.data,
      error_code:    error.code,
    };

    res.status(502).json({
      ok:          false,
      provider:    "groq",
      model,
      base_url:    baseUrl,
      request_url: requestUrl,
      error:       error.message,
      details,
    });
  }
});

// Keep backward-compatible alias so any existing bookmark to /api/debug/llama still works
router.get("/llama", (_req, res) => {
  res.redirect(301, "/api/debug/groq");
});

export default router;
