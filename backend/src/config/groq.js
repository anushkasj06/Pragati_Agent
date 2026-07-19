/**
 * Groq AI client — production configuration for Meesho Pragati Agent.
 *
 * Provider: Groq (https://api.groq.com/openai/v1)
 * Model:    llama-3.1-8b-instant
 *
 * Environment variables (all required):
 *   GROQ_API_KEY       — Groq API key
 *   GROQ_MODEL         — Model name (default: llama-3.1-8b-instant)
 *   GROQ_API_BASE_URL  — Base URL   (default: https://api.groq.com/openai/v1)
 */

import axios from "axios";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage } from "@langchain/core/messages";
import { logger } from "./logger.js";
import { GROQ_MAX_TOKENS, GROQ_TEMPERATURE, GROQ_TOP_P } from "../utils/constants.js";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Resolved values — read once to avoid repeated process.env lookups */
function resolveGroqConfig() {
  // Accept both GROQ_* (preferred) and legacy LLAMA_* for backward compatibility
  return {
    apiKey:  process.env.GROQ_API_KEY  || process.env.LLAMA_API_KEY  || "",
    model:   process.env.GROQ_MODEL    || process.env.LLAMA_MODEL    || "llama-3.1-8b-instant",
    baseUrl: process.env.GROQ_API_BASE_URL || process.env.LLAMA_API_BASE_URL || "https://api.groq.com/openai/v1",
  };
}

/**
 * Validate that all required Groq environment variables are present.
 * Call this once at startup. Throws with a human-readable message on failure.
 */
export function validateGroqConfig() {
  const cfg = resolveGroqConfig();
  const missing = [];

  if (!cfg.apiKey)  missing.push("GROQ_API_KEY");
  if (!cfg.model)   missing.push("GROQ_MODEL");
  if (!cfg.baseUrl) missing.push("GROQ_API_BASE_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
      `Add them to your .env file before starting the server.`
    );
  }

  logger.info("✓ Groq initialized", { model: cfg.model, base_url: cfg.baseUrl });
}

/** Public accessors -------------------------------------------------------- */

export function getGroqApiKey()  { return resolveGroqConfig().apiKey; }
export function getGroqModel()   { return resolveGroqConfig().model; }
export function getGroqFallbackModel() { return process.env.GROQ_FALLBACK_MODEL || process.env.LLAMA_FALLBACK_MODEL || ""; }
export function getGroqBaseUrl() { return resolveGroqConfig().baseUrl; }

/**
 * Build the canonical chat-completions URL for the configured Groq endpoint.
 * @param {string} [baseUrl]
 * @returns {string}
 */
export function buildGroqRequestUrl(baseUrl = getGroqBaseUrl()) {
  const normalized = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("chat/completions", normalized).toString();
}

/**
 * Build Groq-specific request headers.
 * Groq uses a plain Bearer token — no HTTP-Referer or X-Title required.
 * @returns {Record<string, string>}
 */
export function getGroqHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${getGroqApiKey()}`,
  };
}

// ---------------------------------------------------------------------------
// Reusable Axios client — created lazily so tests can mock process.env first
// ---------------------------------------------------------------------------
let _groqClient = null;

function getGroqClient() {
  if (!_groqClient) {
    _groqClient = axios.create({
      baseURL: getGroqBaseUrl(),
      timeout: 15_000,
      headers: { "Content-Type": "application/json" },
    });
  }
  return _groqClient;
}

// Expose for testing / advanced use
export { getGroqClient as groqClient };

// ---------------------------------------------------------------------------
// LangChain message conversion
// ---------------------------------------------------------------------------

/**
 * Convert LangChain BaseMessage array to OpenAI-compatible chat format.
 * @param {import('@langchain/core/messages').BaseMessage[]} messages
 * @returns {Array<{role: string, content: string}>}
 */
function toChatMessages(messages) {
  return messages.map((msg) => {
    const type = msg._getType();
    if (type === "human")  return { role: "user",      content: String(msg.content) };
    if (type === "ai")     return { role: "assistant",  content: String(msg.content) };
    if (type === "system") return { role: "system",     content: String(msg.content) };
    return                        { role: "user",       content: String(msg.content) };
  });
}

// ---------------------------------------------------------------------------
// Core chat-completion function
// ---------------------------------------------------------------------------

/**
 * POST /chat/completions to Groq with one retry on 429 / timeout.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {object}  [options]
 * @param {string}  [options.model]
 * @param {number}  [options.temperature]
 * @param {number}  [options.topP]
 * @param {number}  [options.maxTokens]
 * @returns {Promise<{content: string, usage: object|null, model: string, elapsed_ms: number}>}
 */
export async function chatCompletion(messages, options = {}) {
  const apiKey      = getGroqApiKey();
  const primaryModel = options.model       ?? getGroqModel();
  const fallbackModel = getGroqFallbackModel();
  const baseUrl      = getGroqBaseUrl();
  const requestUrl   = buildGroqRequestUrl(baseUrl);

  if (!apiKey) {
    const err = new Error("Missing GROQ_API_KEY in .env");
    logger.error("Groq request rejected — no API key", { model: primaryModel });
    throw err;
  }

  const requestBody = {
    model:        primaryModel,
    messages,
    temperature:  options.temperature ?? GROQ_TEMPERATURE,
    top_p:        options.topP        ?? GROQ_TOP_P,
    max_tokens:   options.maxTokens   ?? GROQ_MAX_TOKENS,
    stream:       false,
  };

  // One retry only — for 429 (rate-limit) and network timeouts
  const MAX_ATTEMPTS = 2;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const start = Date.now();
    try {
      logger.info("Groq HTTP request", { model: primaryModel, attempt, request_url: requestUrl });

      const response = await getGroqClient().post("chat/completions", requestBody, {
        headers: getGroqHeaders(),
      });

      const elapsed = Date.now() - start;
      const choice  = response.data?.choices?.[0];
      const content = choice?.message?.content ?? "";
      const usage   = response.data?.usage ?? null;

      logger.info("Groq HTTP response", {
        provider:          "groq",
        model:             primaryModel,
        status_code:       response.status,
        elapsed_ms:        elapsed,
        prompt_tokens:     usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        total_tokens:      usage?.total_tokens,
        attempt,
      });

      return { content, usage, model, elapsed_ms: elapsed, status_code: response.status };

    } catch (error) {
      lastError = error;
      const elapsed     = Date.now() - start;
      const status      = error.response?.status;
      const isRetryable = status === 429 || error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";

      logger.error("Groq HTTP error", {
        provider:    "groq",
        model:        primaryModel,
        status_code: status,
        error:       error.message,
        error_code:  error.code,
        elapsed_ms:  elapsed,
        attempt,
        will_retry:  isRetryable && attempt < MAX_ATTEMPTS,
      });

      // Structured error for known status codes — do NOT retry these
      if (status === 401) throw Object.assign(new Error("Groq: invalid API key (401)"),        { statusCode: 401 });
      if (status === 403) throw Object.assign(new Error("Groq: access forbidden (403)"),       { statusCode: 403 });
      if (status === 404) throw Object.assign(new Error(`Groq: model not found (404): ${primaryModel}`), { statusCode: 404 });
      if (status === 500) throw Object.assign(new Error("Groq: internal server error (500)"),  { statusCode: 502 });

      if (!isRetryable || attempt >= MAX_ATTEMPTS) break;

      // Back-off: respect Retry-After header or fall back to 1 s
      const retryAfterHeader =
        error.response?.headers?.["retry-after"] ||
        error.response?.headers?.["Retry-After"] || "1";
      const sleepMs = Math.min(Number(retryAfterHeader) * 1000 || 1000, 5000);

      logger.warn("Groq retrying after transient failure", { model: primaryModel, attempt, sleep_ms: sleepMs, status_code: status });
      await new Promise((r) => setTimeout(r, sleepMs));
    }
  }

  if (fallbackModel && fallbackModel !== primaryModel) {
    logger.warn("Groq primary model failed, attempting fallback model", { primaryModel, fallbackModel });

    const fallbackBody = { ...requestBody, model: fallbackModel };
    try {
      const start = Date.now();
      const response = await getGroqClient().post("chat/completions", fallbackBody, {
        headers: getGroqHeaders(),
      });

      const elapsed = Date.now() - start;
      const choice  = response.data?.choices?.[0];
      const content = choice?.message?.content ?? "";
      const usage   = response.data?.usage ?? null;

      logger.info("Groq fallback HTTP response", {
        provider:          "groq",
        model:             fallbackModel,
        status_code:       response.status,
        elapsed_ms:        elapsed,
        prompt_tokens:     usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        total_tokens:      usage?.total_tokens,
        attempt:           "fallback",
      });

      return { content, usage, model: fallbackModel, elapsed_ms: elapsed, status_code: response.status };
    } catch (fallbackError) {
      logger.error("Groq fallback model failed", {
        provider:    "groq",
        model:       fallbackModel,
        error:       fallbackError.message,
        status_code: fallbackError.response?.status,
      });
      lastError = fallbackError;
    }
  }

  const wrapped = new Error(`Groq request failed: ${lastError?.message ?? "unknown error"}`);
  wrapped.details = {
    provider:    "groq",
    model:       primaryModel,
    fallback_model: fallbackModel || null,
    request_url: requestUrl,
    error:       lastError?.message,
    status_code: lastError?.response?.status,
  };
  throw wrapped;
}

// ---------------------------------------------------------------------------
// LangChain-compatible chat model backed by Groq
// ---------------------------------------------------------------------------

let agentInstance = null;

/**
 * LangChain BaseChatModel implementation backed by Groq.
 */
export class GroqChatModel extends BaseChatModel {
  constructor(fields = {}) {
    super(fields);
    this.model       = fields.model       || getGroqModel();
    this.temperature = fields.temperature ?? GROQ_TEMPERATURE;
    this.topP        = fields.topP        ?? GROQ_TOP_P;
    this.maxTokens   = fields.maxTokens   ?? GROQ_MAX_TOKENS;
  }

  _llmType() { return "groq"; }

  async _generate(messages, _options, _runManager) {
    const formatted = toChatMessages(messages);
    const { content, usage } = await chatCompletion(formatted, {
      model:       this.model,
      temperature: this.temperature,
      topP:        this.topP,
      maxTokens:   this.maxTokens,
    });
    const aiMessage = new AIMessage(content);
    return {
      generations: [{ text: content, message: aiMessage }],
      llmOutput:   { usage },
    };
  }
}

export function setAgentInstance(agent) { agentInstance = agent; }
export function getAgentInstance()      { return agentInstance; }
