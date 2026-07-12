import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { logger } from "../config/logger.js";
import { chatCompletion, getLlamaModel, LlamaChatModel, setAgentInstance } from "../config/llama.js";
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
let llamaModel = null;

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
  const end = cleaned.lastIndexOf("}");
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

/**
 * Build LangChain tools for the agentic underwriting assistant.
 * @param {object} ctx - Shared evaluation context
 * @returns {import('@langchain/core/tools').StructuredToolInterface[]}
 */
function buildTools(ctx) {
  const mlScoringTool = new DynamicStructuredTool({
    name: "ml_scoring_tool",
    description: "Fetch ML risk score, risk class, loan limit, and top reasoning features for a seller.",
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
    description: "Apply deterministic lending rules to ML output. Returns final_loan_limit, requires_human_review, decision_status.",
    schema: z.object({}),
    func: async () => {
      const rules = evaluateRules({
        mlLoanLimit: ctx.mlResult?.loan_limit ?? 0,
        sellerData: ctx.sellerData,
      });
      ctx.rulesResult = rules;
      logger.info("Rules engine output", rules);
      return JSON.stringify(rules);
    },
  });

  const translationTool = new DynamicStructuredTool({
    name: "translation_tool",
    description: "Translate text to a target language (fallback only). Auditor trail must stay English.",
    schema: z.object({
      text: z.string(),
      target_language: z.string(),
    }),
    func: async ({ text, target_language }) => {
      const translated = await translateText(text, target_language);
      return translated;
    },
  });

  const conversationHistoryTool = new DynamicStructuredTool({
    name: "conversation_history_tool",
    description: "Load previous conversation messages for a seller to maintain context.",
    schema: z.object({
      seller_id: z.string(),
      limit: z.number().optional().default(10),
    }),
    func: async ({ seller_id, limit }) => {
      const history = await getConversationHistory(seller_id, limit);
      return formatHistoryForAgent(history);
    },
  });

  const sellerContextTool = new DynamicStructuredTool({
    name: "seller_context_tool",
    description: "Return the current seller profile features and evaluation context.",
    schema: z.object({}),
    func: async () => JSON.stringify({
      seller_id: ctx.sellerId,
      seller_data: ctx.sellerData,
      language: ctx.language,
      ml_result: ctx.mlResult ?? null,
      rules_result: ctx.rulesResult ?? null,
    }),
  });

  return [
    mlScoringTool,
    rulesEngineTool,
    translationTool,
    conversationHistoryTool,
    sellerContextTool,
  ];
}

/**
 * Initialise the LangChain Llama model singleton.
 * @returns {LlamaChatModel}
 */
export function getLlamaModelInstance() {
  if (!llamaModel) {
    llamaModel = new LlamaChatModel();
    setAgentInstance(llamaModel);
    logger.info("Llama LangChain model initialised", { model: getLlamaModel() });
  }
  return llamaModel;
}

/**
 * Invoke agent tools in a deterministic pre-flight sequence,
 * then ask Llama to generate the final structured response.
 *
 * @param {object} params
 * @returns {Promise<{seller_message: string, auditor_trail: string, improvement_plan: string[]}>}
 */
export async function runAgent({
  sellerId,
  sellerData,
  mlResult,
  rulesResult,
  conversationHistory,
  language = "English",
}) {
  const ctx = {
    sellerId,
    sellerData,
    mlResult,
    rulesResult,
    language,
  };

  const tools = buildTools(ctx);
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));

  // Agent decides tool invocation order — pre-invoke required tools
  await toolMap.seller_context_tool.invoke({});
  if (!ctx.mlResult) await toolMap.ml_scoring_tool.invoke({ seller_id: sellerId });
  if (!ctx.rulesResult) await toolMap.rules_engine_tool.invoke({});
  await toolMap.conversation_history_tool.invoke({ seller_id: sellerId, limit: 15 });

  const contextPayload = {
    seller_id: sellerId,
    language,
    seller_data: sellerData,
    ml_prediction: ctx.mlResult,
    rules_decision: ctx.rulesResult,
    conversation_history: formatHistoryForAgent(
      conversationHistory.length
        ? conversationHistory
        : await getConversationHistory(sellerId, 15)
    ),
    read_only_fields: {
      risk_class: ctx.mlResult.risk_class,
      risk_score: ctx.mlResult.risk_score,
      ml_loan_limit: ctx.mlResult.loan_limit,
      final_loan_limit: ctx.rulesResult.final_loan_limit,
      requires_human_review: ctx.rulesResult.requires_human_review,
      decision_status: ctx.rulesResult.decision_status,
    },
    top_reasoning_features: ctx.mlResult.top_reasoning_features,
  };

  const userPrompt = `Using the context below, generate a JSON response with exactly these keys:
- seller_message (string, 2-4 sentences, in ${language})
- auditor_trail (string, 4-6 sentences, English only)
- improvement_plan (array of 3-5 actionable strings)

${buildSellerPrompt(language)}

${buildAuditorPrompt()}

IMPORTANT:
- Use ONLY the read_only_fields values for all financial numbers.
- NEVER modify risk_score, risk_class, or loan amounts.
- NEVER expose SHAP values or ML internals.

CONTEXT:
${JSON.stringify(contextPayload, null, 2)}

Respond with valid JSON only.`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  let rawContent = "";
  try {
    const first = await chatCompletion(messages);
    rawContent = first.content;
    return parseAgentJson(rawContent);
  } catch (firstError) {
    logger.warn("Agent JSON parse failed — retrying once", { error: firstError.message });

    try {
      const retry = await chatCompletion([
        ...messages,
        {
          role: "user",
          content:
            "Your previous response was not valid JSON. Return ONLY a valid JSON object with keys: seller_message, auditor_trail, improvement_plan.",
        },
      ]);
      rawContent = retry.content;
      return parseAgentJson(rawContent);
    } catch (retryError) {
      logger.warn("Agent retry failed — attempting JSON repair", { error: retryError.message });
      return repairAndParseJson(rawContent);
    }
  }
}

/**
 * Warm up the agent singleton at server startup.
 */
export function initializeAgent() {
  getLlamaModelInstance();
  logger.info("Agent service ready");
}
