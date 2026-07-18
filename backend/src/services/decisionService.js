import { Decision } from "../models/Decision.js";
import { logger } from "../config/logger.js";

/**
 * Persist a loan evaluation decision to MongoDB.
 * @param {object} decisionData
 * @returns {Promise<object>}
 */
export async function saveDecision(decisionData) {
  const start = Date.now();

  try {
    const decision = await Decision.create(decisionData);
    const elapsed = Date.now() - start;

    logger.info("Decision saved to MongoDB", {
      sellerId: decisionData.seller_id,
      elapsed_ms: elapsed,
    });

    return decision;
  } catch (error) {
    logger.warn("Decision persistence unavailable; continuing without MongoDB", {
      sellerId: decisionData.seller_id,
      error: error.message,
    });
    return null;
  }
}

/**
 * Fetch the latest decision for a seller.
 * @param {string} sellerId
 * @returns {Promise<object|null>}
 */
export async function getLatestDecision(sellerId) {
  try {
    return await Decision.findOne({ seller_id: sellerId }).sort({ timestamp: -1 }).lean();
  } catch (error) {
    logger.warn("Latest decision unavailable; continuing without MongoDB", {
      sellerId,
      error: error.message,
    });
    return null;
  }
}

/**
 * Fetch recent decisions, optionally filtered by seller.
 * @param {object} [params]
 * @param {string} [params.sellerId]
 * @param {number} [params.limit=50]
 * @returns {Promise<object[]>}
 */
export async function listDecisions({ sellerId, limit = 50 } = {}) {
  try {
    const query = sellerId ? { seller_id: sellerId } : {};
    return Decision.find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
      .lean();
  } catch (error) {
    logger.warn("Decision history unavailable; continuing without MongoDB", {
      sellerId,
      error: error.message,
    });
    return [];
  }
}
