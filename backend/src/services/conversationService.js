import { Conversation } from "../models/Conversation.js";
import { logger } from "../config/logger.js";

/**
 * Fetch recent conversation history for a seller.
 * @param {string} sellerId
 * @param {number} [limit=20]
 * @returns {Promise<Array<{role: string, message: string, timestamp: Date, language: string}>>}
 */
export async function getConversationHistory(sellerId, limit = 20) {
  try {
    const messages = await Conversation.find({ seller_id: sellerId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return messages.reverse();
  } catch (error) {
    logger.warn("Conversation history unavailable; continuing without MongoDB", {
      sellerId,
      error: error.message,
    });
    return [];
  }
}

/**
 * Persist a conversation message.
 * @param {object} params
 */
export async function saveConversationMessage({
  sellerId,
  role,
  message,
  language = "English",
  metadata = {},
  phoneNumber = null,
  contextUsed = "loan-evaluation",
}) {
  try {
    const entry = await Conversation.create({
      seller_id: sellerId,
      phone_number: phoneNumber,
      role,
      message,
      language,
      context_used: contextUsed,
      metadata,
      timestamp: new Date(),
    });

    logger.info("Conversation saved", { sellerId, role, language });
    return entry;
  } catch (error) {
    logger.warn("Conversation persistence unavailable; continuing without MongoDB", {
      sellerId,
      role,
      language,
      error: error.message,
    });
    return null;
  }
}

/**
 * Format history for agent context.
 * @param {Array} history
 * @returns {string}
 */
export function formatHistoryForAgent(history) {
  if (!history.length) return "No previous conversations.";

  return history
    .map((h) => `[${h.role}] (${h.language}): ${h.message}`)
    .join("\n");
}
