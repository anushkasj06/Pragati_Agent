import { logger } from "../config/logger.js";
import { buildTwilioPayload } from "../config/twilio.js";

/**
 * Placeholder notification service — prepares Twilio payload but does not send.
 * @param {object} params
 * @param {string} params.sellerId
 * @param {string} params.message
 * @param {string} [params.phoneNumber]
 * @returns {Promise<{ status: string, payload?: object }>}
 */
export async function queueNotification({ sellerId, message, phoneNumber }) {
  const payload = buildTwilioPayload({
    to: phoneNumber || `seller:${sellerId}`,
    body: message,
  });

  logger.info("Notification queued (placeholder)", {
    sellerId,
    to: payload.to,
    status: "queued",
  });

  return { status: "queued", payload };
}
