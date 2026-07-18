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

export function buildCoachFallbackResponse({ sellerId, latestDecision = null, language = "English", userMessage = "" }) {
  const finalLoanLimit = latestDecision?.final_loan_limit ?? 0;
  const decisionStatus = latestDecision?.decision_status ?? "Pending";
  const normalizedMessage = String(userMessage || "").trim().toLowerCase();

  const thankYou = /thank you|thanks|thx|gracias|dhanyavaad/i.test(normalizedMessage);
  const greeting = /^(hi|hello|hey|namaste|hii|hola|good morning|good evening)/i.test(normalizedMessage);
  const improvementRequest = /(improve|improvement|plan|increase|loan limit|dispatch|returns|rating|ad spend|roi)/i.test(normalizedMessage);

  let sellerMessage;
  if (thankYou) {
    sellerMessage = language === "English"
      ? "You’re very welcome — thank you for reaching out. I’m happy to help with practical next steps to strengthen your business and protect or grow your loan eligibility."
      : `आपका स्वागत है — आपसे बात करके खुशी हुई। मैं आपके व्यवसाय को मजबूत करने और अपनी ऋण पात्रता को सुरक्षित या बढ़ाने के लिए व्यावहारिक अगले कदमों में मदद कर सकता हूँ।`;
  } else if (improvementRequest) {
    sellerMessage = language === "English"
      ? `For your improvement plan, the most useful next steps are to strengthen dispatch reliability, reduce return-to-origin issues, keep customer ratings healthy, and grow sales steadily. These actions can help protect your current limit and improve your eligibility over time.`
      : `आपकी सुधार योजना के लिए सबसे उपयोगी अगले कदम यह हैं कि आप dispatch reliability को मजबूत करें, return-to-origin issues कम करें, customer ratings को स्वस्थ रखें और sales को लगातार बढ़ाएँ। ये कार्रवाई आपके वर्तमान limit को सुरक्षित रखने और समय के साथ आपकी पात्रता को बेहतर बनाने में मदद कर सकती हैं।`;
  } else if (greeting) {
    sellerMessage = language === "English"
      ? `Hello! Your latest assessment shows ${decisionStatus.toLowerCase()} status with a final limit of Rs. ${finalLoanLimit}. I can help you with practical next steps around dispatch, returns, ratings, and sales growth.`
      : `नमस्ते! आपकी नवीनतम मूल्यांकन में ${decisionStatus.toLowerCase()} स्थिति दिखाई गई है और अंतिम सीमा Rs. ${finalLoanLimit} है। मैं आप को dispatch, returns, ratings और sales growth के आसपास व्यावहारिक अगले कदमों में मदद कर सकता हूँ।`;
  } else {
    sellerMessage = language === "English"
      ? `Your latest assessment shows ${decisionStatus.toLowerCase()} status with a final limit of Rs. ${finalLoanLimit}. I can help you with practical next steps around dispatch, returns, ratings, and sales growth.`
      : `आपकी नवीनतम मूल्यांकन में ${decisionStatus.toLowerCase()} स्थिति दिखाई गई है और अंतिम सीमा Rs. ${finalLoanLimit} है। मैं आप को dispatch, returns, ratings और sales growth के आसपास व्यावहारिक अगले कदमों में मदद कर सकता हूँ।`;
  }

  return {
    seller_message: sellerMessage,
    auditor_trail: `Coach fallback response generated for seller ${sellerId} because the Groq service was unavailable. The reply was tailored to the latest user message and latest decision status ${decisionStatus}.`,
    improvement_plan: [
      "Maintain strong order health — aim for dispatch SLA above 95%.",
      "Reduce return-to-origin (RTO) rate below 10% to improve risk profile.",
      "Build customer trust through consistent ratings above 4.0.",
      "Grow your monthly sales steadily over the next 3 months.",
    ],
    is_fallback: true,
  };
}

export function buildFallbackAgentResponse({ sellerId, mlResult, rulesResult, language, mode = "evaluation", latestDecision = null, userMessage = "" }) {
  const finalLoanLimit = latestDecision?.final_loan_limit ?? rulesResult?.final_loan_limit ?? mlResult?.loan_limit ?? 0;
  const decisionStatus = latestDecision?.decision_status ?? rulesResult?.decision_status ?? "Approved";
  const riskClass      = latestDecision?.risk_class ?? mlResult?.risk_class ?? "unknown";
  const riskScore      = latestDecision?.risk_score ?? mlResult?.risk_score ?? "unknown";

  const fallbackNote = "⚠️ FALLBACK MODE — AI explanation unavailable. Groq service was unreachable. Showing a deterministic summary only.";

  const sellerFallback = mode === "coach"
    ? buildCoachFallbackResponse({ sellerId, latestDecision, language, userMessage }).seller_message
    : (language === "English"
      ? `Your loan application has been ${decisionStatus.toLowerCase()} with a final limit of Rs. ${finalLoanLimit}. Our AI agent is temporarily unavailable, so we are showing a system-generated summary. Your risk class is ${riskClass} with a score of ${riskScore}. Please try again shortly for a detailed AI explanation in your preferred language.`
      : `Your loan evaluation is complete. Status: ${decisionStatus}. Limit: Rs. ${finalLoanLimit}. Risk: ${riskClass}. AI explanation temporarily unavailable — please retry for a full response in ${language}. (${fallbackNote})`);

  return {
    seller_message: sellerFallback,
    auditor_trail:
      `[FALLBACK PATH ACTIVATED — Groq LLM was unavailable at evaluation time] ` +
      `Seller ${sellerId} was handled through the deterministic fallback path. ` +
      `Decision status: ${decisionStatus}. Final limit: Rs. ${finalLoanLimit}. ` +
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

function buildCoachPrompt(ctx) {
  const { sellerId, language, latestDecision, userMessage = "", conversationSummary } = ctx;

  const historyNote = conversationSummary && conversationSummary !== "No previous conversations."
    ? `\nPREVIOUS INTERACTIONS:\n${conversationSummary}`
    : "";

  const decisionSummary = latestDecision
    ? `LATEST DECISION:\n  decision_status: ${latestDecision.decision_status}\n  final_loan_limit: Rs. ${latestDecision.final_loan_limit}\n  risk_class: ${latestDecision.risk_class}`
    : "LATEST DECISION: no previous decision is available yet.";

  return `You are Meesho Pragati Agent — an AI Financial Growth Coach for Meesho sellers in Bharat.

Generate a JSON response with EXACTLY these three keys:
- seller_message  (string — guidance in ${language}, minimum 4 sentences)
- auditor_trail   (string — detailed English audit record, minimum 4 sentences)
- improvement_plan (array of 4 to 5 specific, actionable strings)

Your role is to answer follow-up questions about:
- loan eligibility
- how to increase loan amount
- business improvement
- dispatch
- returns
- customer ratings
- growth tips
- loan re-evaluation
- multilingual conversations

Use the latest loan decision and the seller's conversation history. Never invent or change numeric limits.
Do not mention SHAP, machine learning internals, or model architecture details.
Write seller_message entirely in ${language}.
If the user asks how to increase the loan limit, focus on concrete actions such as improving dispatch SLA, reducing returns, boosting customer ratings, increasing sales growth, and improving ad-spend ROI.

SELLER ID: ${sellerId}
RESPONSE LANGUAGE: ${language}

${decisionSummary}

USER MESSAGE:
${userMessage}
${historyNote}

CRITICAL RULES:
- seller_message MUST be written entirely in ${language}
- Use ONLY the facts supplied in the context
- Keep advice practical and encouraging
- Do not expose ML internals or SHAP details
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
  mode = "evaluation",
  latestDecision = null,
  userMessage = "",
}) {
  const ctx = { sellerId, sellerData, mlResult, rulesResult, language, mode, latestDecision, userMessage };
  const tools   = buildTools(ctx);
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));

  // Pre-invoke required tools to populate ctx (skip if already provided)
  if (!ctx.mlResult)    await toolMap.ml_scoring_tool.invoke({ seller_id: sellerId });
  if (!ctx.rulesResult) await toolMap.rules_engine_tool.invoke({});

  // Lightweight history — last 5 turns, not 15
  const history = Array.isArray(conversationHistory) && conversationHistory.length
    ? conversationHistory
    : await getConversationHistory(sellerId, 5);
  const conversationSummary = formatHistoryForAgent(history);

  const userPrompt = mode === "coach"
    ? buildCoachPrompt({ sellerId, language, latestDecision: ctx.latestDecision, userMessage: ctx.userMessage, conversationSummary })
    : buildCompactPrompt({ sellerId, sellerData, mlResult: ctx.mlResult, rulesResult: ctx.rulesResult, language, conversationSummary });

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: userPrompt },
  ];

  try {
    const response   = await chatCompletion(messages);
    const rawContent = response.content;
    const agentOutput = repairAndParseJson(rawContent);
    const normalized = normalizeCoachAgentOutput({
      agentOutput,
      sellerId,
      language,
      mode,
      userMessage: ctx.userMessage,
      latestDecision: ctx.latestDecision,
    });

    return normalized;
  } catch (error) {
    // Log full error details: rate limit, auth failure, network error, etc.
    logger.warn("Groq agent fallback activated", {
      sellerId,
      language,
      mode,
      error: error.message,
      details: error.details,
      status_code: error.statusCode || error.response?.status,
      error_code: error.code,
      error_type: error.constructor.name,
    });
    return buildFallbackAgentResponse({
      sellerId,
      mlResult: ctx.mlResult,
      rulesResult: ctx.rulesResult,
      language,
      mode,
      latestDecision: ctx.latestDecision,
      userMessage: ctx.userMessage,
    });
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

export function normalizeCoachAgentOutput({ agentOutput, sellerId, language, mode, userMessage = "", latestDecision = null }) {
  const normalized = normalizeAgentOutput(agentOutput);
  const text = String(normalized.seller_message || "").trim();
  const lower = text.toLowerCase();
  const isGenericApproval = /congratulations|loan approval|loan limit|ad spend roi|dispatch sla compliance|maintain and potentially increase|data-driven decisions/i.test(lower);
  const wantsImprovementPlan = /(improvement plan|improve|improvement|increase|dispatch|returns|rating|roi|loan limit)/i.test(String(userMessage || ""));

  if (mode === "coach" && isGenericApproval && wantsImprovementPlan) {
    const decisionStatus = latestDecision?.decision_status ?? "Approved";
    const limit = latestDecision?.final_loan_limit ?? "your current limit";
    const hindi = language === "Hindi";
    normalized.seller_message = hindi
      ? `सुधार योजना के लिए सबसे असरदार कदम यह हैं: पहले अपनी dispatch reliability मजबूत करें, फिर return-to-origin समस्याओं को कम करें, customer ratings को बनाए रखें और sales growth को धीरे-धीरे बढ़ाएँ। ये कदम आपके वर्तमान loan limit को सुरक्षित रखने और समय के साथ आपकी पात्रता को बेहतर बनाने में मदद करेंगे। आपकी हाल की оцен में ${decisionStatus.toLowerCase()} स्थिति दिखाई गई है और final limit Rs. ${limit} है।`
      : `For your improvement plan, the most useful next steps are to strengthen dispatch reliability, reduce return-to-origin issues, keep customer ratings healthy, and grow sales steadily. These actions can help protect your current limit and improve your eligibility over time. Your latest assessment shows ${String(decisionStatus).toLowerCase()} status with a final limit of Rs. ${limit}.`;

    normalized.improvement_plan = [
      hindi ? "Dispatch SLA को 95% से ऊपर रखें" : "Keep dispatch SLA above 95%",
      hindi ? "RTO दर 10% से नीचे लाएँ" : "Reduce RTO below 10%",
      hindi ? "Customer ratings को लगातार अच्छा रखें" : "Maintain strong customer ratings",
      hindi ? "Ad-spend ROI और sales growth पर काम करें" : "Improve ad-spend ROI and sales growth",
    ];
    normalized.auditor_trail = `Coach response for seller ${sellerId} was rewritten from a generic approval template into an improvement-focused response because the user asked for coaching guidance in ${language}.`;
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
