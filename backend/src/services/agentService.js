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
  const finalLoanLimit  = rulesResult?.final_loan_limit ?? mlResult?.loan_limit ?? 0;
  const decisionStatus  = rulesResult?.decision_status  ?? "Approved";
  const lenderMessage   =
    `Your application is currently ${decisionStatus.toLowerCase()} with a loan limit of ₹${finalLoanLimit}. ` +
    `Based on your business metrics, we have completed a full risk evaluation. ` +
    `We are here to support your growth on Meesho.`;

  return {
    seller_message: `${lenderMessage} (${language})`,
    auditor_trail:
      `Fallback path activated — Groq was unavailable. ` +
      `Risk class: ${mlResult?.risk_class ?? "unknown"}. ` +
      `Risk score: ${mlResult?.risk_score ?? "unknown"}. ` +
      `Final loan limit: ₹${finalLoanLimit}. Decision: ${decisionStatus}.`,
    improvement_plan: [
      "Maintain strong order health and delivery performance.",
      "Reduce return-to-origin issues to improve your profile.",
      "Continue building customer trust through consistent service quality.",
    ],
  };
}

// ---------------------------------------------------------------------------
// Optimized prompt builder — target <4000 characters
// ---------------------------------------------------------------------------

/**
 * Build a compact user prompt for Groq.
 * Keeps only what the model needs — eliminates all repetition.
 */
function buildCompactPrompt(ctx) {
  const { sellerId, sellerData, mlResult, rulesResult, language, conversationSummary } = ctx;

  // Top 3 reasoning features only — enough context, far less tokens
  const topFeatures = (mlResult.top_reasoning_features ?? [])
    .slice(0, 3)
    .map((f) => `  - ${f.feature} (${f.impact}): ${f.reason}`)
    .join("\n");

  const historyNote = conversationSummary && conversationSummary !== "No previous conversations."
    ? `\nPRIOR INTERACTION SUMMARY:\n${conversationSummary}`
    : "";

  return `Generate a JSON response with EXACTLY these three keys:
1. seller_message  — 2-3 sentences in ${language}, friendly, mention decision and one strength
2. auditor_trail   — 3-4 sentences in English, professional, reference risk_class/risk_score/final_loan_limit
3. improvement_plan — array of 3 actionable strings

${buildSellerPrompt(language)}
${buildAuditorPrompt()}

SELLER: ${sellerId}
LANGUAGE: ${language}
DECISION:
  risk_class: ${mlResult.risk_class}
  risk_score: ${mlResult.risk_score}
  ml_loan_limit: ₹${mlResult.loan_limit}
  final_loan_limit: ₹${rulesResult.final_loan_limit}
  status: ${rulesResult.decision_status}
  requires_human_review: ${rulesResult.requires_human_review}

TOP FACTORS:
${topFeatures || "  - No factors available"}
${historyNote}

RULES: Use ONLY the values above. Never modify any number. Respond with valid JSON only.`;
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
    return repairAndParseJson(rawContent);
  } catch (error) {
    logger.warn("Groq agent fallback activated", { sellerId, language, error: error.message });
    return buildFallbackAgentResponse({ sellerId, mlResult: ctx.mlResult, rulesResult: ctx.rulesResult, language });
  }
}

// ---------------------------------------------------------------------------
// Startup initialisation
// ---------------------------------------------------------------------------

export function initializeAgent() {
  getGroqModelInstance();
  logger.info("Agent service ready", { provider: "groq", model: getGroqModel() });
}
