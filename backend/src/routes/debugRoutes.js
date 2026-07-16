import { Router } from "express";
import {
  buildGroqRequestUrl,
  chatCompletion,
  getGroqBaseUrl,
  getGroqModel,
} from "../config/groq.js";
import {
  getTwilioClient,
  getWhatsAppSender,
  buildWhatsAppUrl,
} from "../config/twilio.js";
import { buildLoanEvaluationWhatsAppMessage, resendPendingNotifications } from "../services/notificationService.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";

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

/**
 * @openapi
 * /api/debug/twilio:
 *   get:
 *     summary: Test Twilio WhatsApp sandbox connectivity
 *     tags: [Debug]
 *     responses:
 *       200:
 *         description: Twilio is reachable and sandbox config is valid
 *       502:
 *         description: Twilio connectivity failed or config is invalid
 */
router.get("/twilio", async (_req, res) => {
  try {
    const client = getTwilioClient();
    const sender = getWhatsAppSender();
    const sandboxUrl = buildWhatsAppUrl();

    const account = await client.api.accounts(getTwilioClient().username).fetch();

    res.json({
      ok: true,
      provider: "twilio",
      account_sid: account.sid,
      account_name: account.friendlyName,
      whatsapp_sender: sender,
      whatsapp_sandbox_url: sandboxUrl,
      note: "Ensure the receiver has joined the sandbox using the exact join code shown in Twilio",
    });
  } catch (error) {
    res.status(502).json({
      ok: false,
      provider: "twilio",
      error: error.message,
      stack: error.stack,
    });
  }
});

router.get("/twilio/send", async (req, res) => {
  const to = String(req.query.to || "").trim();
  if (!to) {
    return res.status(400).json({
      ok: false,
      error: "Missing query parameter 'to'. Example: /api/debug/twilio/send?to=+918446102366",
    });
  }

  const normalized = to.replace(/[^0-9]/g, "");
  const destination = normalized.length === 10 ? `+91${normalized}` : normalized.startsWith("+") ? normalized : `+${normalized}`;
  const toWhatsApp = destination.startsWith("whatsapp:") ? destination : `whatsapp:${destination}`;

  try {
    const client = getTwilioClient();
    const sender = getWhatsAppSender();
    const body = "Twilio WhatsApp test message from Pragati backend.";

    const payload = { from: sender, to: toWhatsApp, body };
    const message = await client.messages.create(payload);

    res.json({
      ok: true,
      provider: "twilio",
      message_sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      api_response: message,
    });
  } catch (error) {
    const details = {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      stack: error.stack,
    };

    res.status(502).json({
      ok: false,
      provider: "twilio",
      error: error.message,
      details,
    });
  }
});

router.get("/twilio/send-loan", async (req, res) => {
  const to = String(req.query.to || "").trim();
  if (!to) {
    return res.status(400).json({
      ok: false,
      error: "Missing query parameter 'to'. Example: /api/debug/twilio/send-loan?to=+918446102366",
    });
  }

  const normalized = to.replace(/[^0-9]/g, "");
  const destination = normalized.length === 10 ? `+91${normalized}` : normalized.startsWith("+") ? normalized : `+${normalized}`;
  const toWhatsApp = destination.startsWith("whatsapp:") ? destination : `whatsapp:${destination}`;

  try {
    const client = getTwilioClient();
    const sender = getWhatsAppSender();

    const evaluateResponse = {
      seller_id: "SELL_78965",
      decision: {
        risk_class: "Low",
        risk_score: 92,
        loan_limit: 50000,
        requires_human_review: false,
        decision_status: "Approved",
      },
      top_reasoning_features: [
        { feature: "dispatch_sla_compliance", impact: "positive", reason: "High on-time delivery" },
        { feature: "avg_customer_rating", impact: "positive", reason: "Strong review score" },
      ],
      seller_message: "Congratulations! Based on your performance, your loan limit is approved.",
      auditor_trail: "Approved by AI underwriting rules.",
      improvement_plan: ["Improve invoice turnaround", "Keep improving delivery SLA"],
      language: "English",
      execution_time_ms: 1234,
      is_fallback: false,
    };

    const body = buildLoanEvaluationWhatsAppMessage(evaluateResponse);
    const payload = { from: sender, to: toWhatsApp, body };
    const message = await client.messages.create(payload);

    res.json({
      ok: true,
      provider: "twilio",
      message_sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      api_response: message,
    });
  } catch (error) {
    const details = {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      stack: error.stack,
    };

    res.status(502).json({
      ok: false,
      provider: "twilio",
      error: error.message,
      details,
    });
  }
});

router.get("/twilio/resend-failed", async (req, res) => {
  try {
    const sellerId = req.query.sellerId || req.query.seller_id;
    const phoneNumber = req.query.phoneNumber || req.query.phone_number;
    const results = await resendPendingNotifications({ sellerId, phoneNumber, status: "failed" });
    res.json({ ok: true, results });
  } catch (error) {
    const details = {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
      stack: error.stack,
    };
    res.status(502).json({ ok: false, error: error.message, details });
  }
});

export default router;
