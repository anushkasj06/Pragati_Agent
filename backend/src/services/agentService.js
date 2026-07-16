import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { logger } from "../config/logger.js";
import {
  chatCompletion,
  getGroqModel,
  GroqChatModel,
  setAgentInstance,
} from "../config/groq.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";
import { buildSellerPrompt } from "../prompts/sellerPrompt.js";
import { buildAuditorPrompt } from "../prompts/auditorPrompt.js";
import * as mlService from "./mlService.js";
import { evaluateRules } from "./rulesEngine.js";
import { translateText } from "./translationService.js";
import {
  formatHistoryForAgent,
  getConversationHistory,
} from "./conversationService.js";

/** Cached singleton — never recreated per request */
let groqModel = null;

// ---------------------------------------------------------------------------
// JSON parsing helpers
// ---------------------------------------------------------------------------

/**
 * Extract JSON object from LLM response (handles markdown fences).
 * @param {string} text
 * @returns {object}
 */
export function parseAgentJson(text) {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in agent response");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Attempt to repair malformed JSON from LLM output.
 * @param {string} text
 * @returns {object}
 */
export function repairAndParseJson(text) {
  try {
    return parseAgentJson(text);
  } catch {
    const fixed = text
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');
    return parseAgentJson(fixed);
  }
}

// ---------------------------------------------------------------------------
// LangChain tool definitions
// ---------------------------------------------------------------------------

/**
 * Build LangChain tools for the agentic underwriting assistant.
 * @param {object} ctx - Shared evaluation context
 */
function buildTools(ctx) {
  const mlScoringTool = new DynamicStructuredTool({
    name: "ml_scoring_tool",
    description: "Fetch ML risk score, risk class, loan limit, and top reasoning features.",
    schema: z.object({ seller_id: z.string() }),
    func: async ({ seller_id }) => {
      if (ctx.mlResult) return JSON.stringify(ctx.mlResult);
      const result = await mlService.scoreSeller(seller_id, ctx.sellerData);
      ctx.mlResult = result;
      return JSON.stringify(result);
    },
  });

  const rulesEngineTool = new DynamicStructuredTool({
    name: "rules_engine_tool",
    description: "Apply deterministic lending rules. Returns final_loan_limit, requires_human_review, decision_status.",
    schema: z.object({}),
    func: async () => {
      const rules = evaluateRules({ mlLoanLimit: ctx.mlResult?.loan_limit ?? 0, sellerData: ctx.sellerData });
      ctx.rulesResult = rules;
      return JSON.stringify(rules);
    },
  });

  const translationTool = new DynamicStructuredTool({
    name: "translation_tool",
    description: "Translate text to target language (fallback only). Auditor trail stays English.",
    schema: z.object({ text: z.string(), target_language: z.string() }),
    func: async ({ text, target_language }) => translateText(text, target_language),
  });

  const conversationHistoryTool = new DynamicStructuredTool({
    name: "conversation_history_tool",
    description: "Load previous conversation messages for a seller.",
    schema: z.object({ seller_id: z.string(), limit: z.number().optional().default(5) }),
    func: async ({ seller_id, limit }) => {
      const history = await getConversationHistory(seller_id, limit);
      return formatHistoryForAgent(history);
    },
  });

  const sellerContextTool = new DynamicStructuredTool({
    name: "seller_context_tool",
    description: "Return the current seller profile and evaluation context.",
    schema: z.object({}),
    func: async () => JSON.stringify({
      seller_id:   ctx.sellerId,
      seller_data: ctx.sellerData,
      language:    ctx.language,
      ml_result:   ctx.mlResult   ?? null,
      rules_result:ctx.rulesResult ?? null,
    }),
  });

  return [mlScoringTool, rulesEngineTool, translationTool, conversationHistoryTool, sellerContextTool];
}

// ---------------------------------------------------------------------------
// Model singleton
// ---------------------------------------------------------------------------

export function getGroqModelInstance() {
  if (!groqModel) {
    groqModel = new GroqChatModel();
    setAgentInstance(groqModel);
    logger.info("Groq LangChain model initialised", { model: getGroqModel() });
  }
  return groqModel;
}

// ---------------------------------------------------------------------------
// Fallback response (no LLM)
// ---------------------------------------------------------------------------

export function buildFallbackAgentResponse({ sellerId, mlResult, rulesResult, language }) {
  const finalLoanLimit = rulesResult?.final_loan_limit ?? mlResult?.loan_limit ?? 0;
  const decisionStatus = rulesResult?.decision_status ?? "Approved";
  const riskClass      = mlResult?.risk_class ?? "unknown";
  const riskScore      = mlResult?.risk_score ?? "unknown";

  const fallbackNote = "⚠️ FALLBACK MODE — AI explanation unavailable. Groq service was unreachable. Showing deterministic summary only.";

  const sellerFallback = language === "English"
    ? `Your loan application has been ${decisionStatus.toLowerCase()} with a final limit of Rs. ${finalLoanLimit}. Our AI agent is temporarily unavailable, so we are showing a system-generated summary. Your risk class is ${riskClass} with a score of ${riskScore}. Please try again shortly for a detailed AI explanation in your preferred language.`
    : `Your loan evaluation is complete. Status: ${decisionStatus}. Limit: Rs. ${finalLoanLimit}. Risk: ${riskClass}. AI explanation temporarily unavailable — please retry for a full response in ${language}. (${fallbackNote})`;

  return {
    seller_message: sellerFallback,
    auditor_trail:
      `[FALLBACK PATH ACTIVATED — Groq LLM was unavailable at evaluation time] ` +
      `Seller ${sellerId} was evaluated through the deterministic pipeline. ` +
      `Risk class: ${riskClass}. Risk score: ${riskScore}/100. ` +
      `ML loan limit: Rs. ${mlResult?.loan_limit ?? 0}. ` +
      `Rules Engine final limit: Rs. ${finalLoanLimit}. ` +
      `Decision status: ${decisionStatus}. ` +
      `Human review required: ${rulesResult?.requires_human_review ?? false}. ` +
      `No AI explanation was generated — retry when Groq is available.`,
    improvement_plan: [
      "Maintain strong order health — aim for dispatch SLA above 95%.",
      "Reduce return-to-origin (RTO) rate below 10% to improve risk profile.",
      "Build customer trust through consistent ratings above 4.0.",
      "Grow your monthly sales steadily over the next 3 months.",
      "Contact Meesho support if you need help understanding your evaluation.",
    ],
    is_fallback: true,
  };
}

// ---------------------------------------------------------------------------
// Optimized prompt builder — target <4000 characters
// ---------------------------------------------------------------------------

/**
 * Build a detailed user prompt for Groq.
 * All 5 SHAP features included. Full seller context. Detailed explanation required.
 */
function buildCompactPrompt(ctx) {
  const { sellerId, sellerData, mlResult, rulesResult, language, conversationSummary } = ctx;

  const allFeatures = (mlResult.top_reasoning_features ?? [])
    .map((f, i) => `  ${i + 1}. ${f.feature} — Impact: ${f.impact} — ${f.reason}`)
    .join("\n");

  const historyNote = conversationSummary && conversationSummary !== "No previous conversations."
    ? `\nPREVIOUS INTERACTIONS:\n${conversationSummary}`
    : "";

  const sellerMetrics = Object.entries(sellerData || {})
    .map(([k, v]) => `  ${k}: ${v}`)
    .join("\n");

  return `You are Meesho Pragati Agent — an AI Financial Growth Partner for Meesho sellers in Bharat.

Generate a JSON response with EXACTLY these three keys:
- seller_message  (string — detailed explanation in ${language}, minimum 4 sentences)
- auditor_trail   (string — detailed English audit record, minimum 6 sentences)
- improvement_plan (array of 4 to 5 specific, actionable strings)

${buildSellerPrompt(language)}

${buildAuditorPrompt()}

─── EVALUATION DATA ───────────────────────────────────────────────────────────
SELLER ID: ${sellerId}
RESPONSE LANGUAGE: ${language}

ML MODEL OUTPUT:
  risk_class:   ${mlResult.risk_class}
  risk_score:   ${mlResult.risk_score} / 100
  ml_loan_limit: Rs. ${mlResult.loan_limit}

RULES ENGINE OUTPUT:
  final_loan_limit:      Rs. ${rulesResult.final_loan_limit}
  decision_status:       ${rulesResult.decision_status}
  requires_human_review: ${rulesResult.requires_human_review}

ALL SHAP REASONING FACTORS (explain these in your messages):
${allFeatures || "  No factors available"}

SELLER BUSINESS METRICS:
${sellerMetrics}
${historyNote}
────────────────────────────────────────────────────────────────────────────────

CRITICAL RULES:
- seller_message MUST be written entirely in ${language}
- Use ONLY the exact numbers above — never invent or modify figures
- improvement_plan must be specific to this seller's weak metrics — not generic
- auditor_trail must reference specific rules that fired (loan cap, young account, rejection trigger, etc.)
- Do NOT mention SHAP, XGBoost, machine learning, or any technical system name in seller_message
- Respond with valid JSON only — no markdown, no extra text`;
}

// ---------------------------------------------------------------------------
// Main agent entry point
// ---------------------------------------------------------------------------

export async function runAgent({
  sellerId,
  sellerData,
  mlResult,
  rulesResult,
  conversationHistory,
  language = "English",
}) {
  const ctx = { sellerId, sellerData, mlResult, rulesResult, language };
  const tools   = buildTools(ctx);
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));

  // Pre-invoke required tools to populate ctx (skip if already provided)
  if (!ctx.mlResult)    await toolMap.ml_scoring_tool.invoke({ seller_id: sellerId });
  if (!ctx.rulesResult) await toolMap.rules_engine_tool.invoke({});

  // Lightweight history — last 5 turns, not 15
  const history = conversationHistory.length ? conversationHistory : await getConversationHistory(sellerId, 5);
  const conversationSummary = formatHistoryForAgent(history);

  const userPrompt = buildCompactPrompt({ sellerId, sellerData, mlResult: ctx.mlResult, rulesResult: ctx.rulesResult, language, conversationSummary });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: userPrompt },
  ];

  try {
    const response   = await chatCompletion(messages);
    const rawContent = response.content;
    const agentOutput = repairAndParseJson(rawContent);

    return normalizeAgentOutput(agentOutput);
  } catch (error) {
    logger.warn("Groq agent fallback activated", { sellerId, language, error: error.message });
    return buildFallbackAgentResponse({ sellerId, mlResult: ctx.mlResult, rulesResult: ctx.rulesResult, language });
  }
}

function flattenToText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value.map(flattenToText).filter(Boolean).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, nestedValue]) => {
        const body = flattenToText(nestedValue);
        return body ? `${key}: ${body}` : key;
      })
      .join("\n");
  }
  return String(value);
}

function normalizeAgentOutput(agentOutput) {
  const normalized = { ...agentOutput };

  if (normalized.seller_message && typeof normalized.seller_message !== "string") {
    if (typeof normalized.seller_message === "object") {
      normalized.seller_message = Object.entries(normalized.seller_message)
        .map(([section, content]) => {
          const body = flattenToText(content);
          return `${section}:\n${body}`;
        })
        .join("\n\n");
    } else {
      normalized.seller_message = String(normalized.seller_message);
    }
  }

  if (normalized.auditor_trail && typeof normalized.auditor_trail !== "string") {
    normalized.auditor_trail = flattenToText(normalized.auditor_trail);
  }

  if (!Array.isArray(normalized.improvement_plan)) {
    normalized.improvement_plan = normalized.improvement_plan
      ? [flattenToText(normalized.improvement_plan)]
      : [];
  }

  return normalized;
}

// ---------------------------------------------------------------------------
// Startup initialisation
// ---------------------------------------------------------------------------

export function initializeAgent() {
  getGroqModelInstance();
  logger.info("Agent service ready", { provider: "groq", model: getGroqModel() });
}
