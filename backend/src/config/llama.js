import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { logger } from "./logger.js";
import {
  LLAMA_MAX_TOKENS,
  LLAMA_TEMPERATURE,
  LLAMA_TOP_P,
} from "../utils/constants.js";

/**
 * Build a deterministic fallback response when Llama credentials or the hosted API are unavailable.
 * @param {Array<{role: string, content: string}>} messages
 * @param {string} model
 * @returns {{content: string, usage: null, model: string, elapsed_ms: number}}
 */
function buildFallbackChatResponse(messages = [], model) {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  const languageHint = /\b(hindi|marathi|tamil|telugu|kannada|gujarati|malayalam)\b/i.test(lastUserMessage)
    ? "the requested local language"
    : "English";

  return {
    content: JSON.stringify({
      seller_message: `Thank you for sharing your seller profile. We have prepared a preliminary review based on the information available right now.`,
      auditor_trail: `A deterministic fallback response was used because the hosted Llama service is not available. The ML output, rules-based decision, and financial limits remain unchanged.`,
      improvement_plan: [
        "Maintain strong sales and service performance.",
        "Reduce return and cancellation risk where possible.",
        "Keep catalog quality and dispatch reliability consistent.",
      ],
    }),
    usage: null,
    model,
    elapsed_ms: 0,
  };
}

/** Reusable Axios client for Meta Llama official hosted inference API */
import axios from "axios";

export const llamaClient = axios.create({
  baseURL: process.env.LLAMA_API_BASE_URL || "https://api.llama.com/compat/v1",
  timeout: 90_000,
  headers: { "Content-Type": "application/json" },
});

let agentInstance = null;

/**
 * Get configured Llama model name from environment.
 * @returns {string}
 */
export function getLlamaModel() {
  return process.env.LLAMA_MODEL || "Llama-3.3-70B-Instruct";
}

/**
 * Convert LangChain messages to OpenAI-compatible chat format.
 * @param {import('@langchain/core/messages').BaseMessage[]} messages
 * @returns {Array<{role: string, content: string}>}
 */
function toChatMessages(messages) {
  return messages.map((msg) => {
    const type = msg._getType();
    if (type === "human") return { role: "user", content: String(msg.content) };
    if (type === "ai") return { role: "assistant", content: String(msg.content) };
    if (type === "system") return { role: "system", content: String(msg.content) };
    return { role: "user", content: String(msg.content) };
  });
}

/**
 * Call Meta Llama official Chat Completions API via REST (Axios).
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [options]
 * @returns {Promise<{content: string, usage: object|null, model: string, elapsed_ms: number}>}
 */
export async function chatCompletion(messages, options = {}) {
  const apiKey = process.env.LLAMA_API_KEY;
  const model = options.model || getLlamaModel();

  if (!apiKey) {
    logger.warn("LLAMA_API_KEY is not configured, using deterministic fallback response");
    return buildFallbackChatResponse(messages, model);
  }

  const start = Date.now();

  try {
    const response = await llamaClient.post(
      "/chat/completions",
      {
        model,
        messages,
        temperature: options.temperature ?? LLAMA_TEMPERATURE,
        top_p: options.topP ?? LLAMA_TOP_P,
        max_tokens: options.maxTokens ?? LLAMA_MAX_TOKENS,
        stream: false,
      },
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const elapsed = Date.now() - start;
    const choice = response.data?.choices?.[0];
    const content = choice?.message?.content ?? "";
    const usage = response.data?.usage ?? null;

    logger.info("Llama inference completed", {
      model,
      elapsed_ms: elapsed,
      prompt_tokens: usage?.prompt_tokens,
      completion_tokens: usage?.completion_tokens,
      total_tokens: usage?.total_tokens,
    });

    return { content, usage, model, elapsed_ms: elapsed };
  } catch (error) {
    logger.warn("Llama inference failed, using deterministic fallback response", {
      model,
      error: error.message,
    });
    return buildFallbackChatResponse(messages, model);
  }
}

/**
 * LangChain-compatible chat model backed by Meta Llama hosted API.
 * Never uses OpenAI, Ollama, or Groq.
 */
export class LlamaChatModel extends BaseChatModel {
  constructor(fields = {}) {
    super(fields);
    this.model = fields.model || getLlamaModel();
    this.temperature = fields.temperature ?? LLAMA_TEMPERATURE;
    this.topP = fields.topP ?? LLAMA_TOP_P;
    this.maxTokens = fields.maxTokens ?? LLAMA_MAX_TOKENS;
  }

  _llmType() {
    return "meta-llama-hosted";
  }

  /**
   * @param {import('@langchain/core/messages').BaseMessage[]} messages
   * @param {import('@langchain/core/callbacks/manager').CallbackManagerForLLMRun} [_runManager]
   * @returns {Promise<any>}
   */
  async _generate(messages, _options, _runManager) {
    const formatted = toChatMessages(messages);
    const { content, usage } = await chatCompletion(formatted, {
      model: this.model,
      temperature: this.temperature,
      topP: this.topP,
      maxTokens: this.maxTokens,
    });

    const aiMessage = new AIMessage(content);
    return {
      generations: [{ text: content, message: aiMessage }],
      llmOutput: { usage },
    };
  }
}

export function setAgentInstance(agent) {
  agentInstance = agent;
}

export function getAgentInstance() {
  return agentInstance;
}

export { SystemMessage, HumanMessage, AIMessage };
