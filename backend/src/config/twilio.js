import { logger } from "./logger.js";

/**
 * Twilio placeholder configuration — messages are queued but never sent.
 */
export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || "",
  authToken: process.env.TWILIO_AUTH_TOKEN || "",
  fromNumber: process.env.TWILIO_FROM_NUMBER || "",
};

/**
 * Build a Twilio SMS payload (placeholder — not sent).
 * @param {{ to: string, body: string }} params
 * @returns {{ to: string, from: string, body: string }}
 */
export function buildTwilioPayload({ to, body }) {
  return {
    to,
    from: twilioConfig.fromNumber || "+10000000000",
    body,
  };
}

/**
 * Validate Twilio config (informational only in placeholder mode).
 */
export function logTwilioConfig() {
  const configured = Boolean(twilioConfig.accountSid && twilioConfig.authToken);
  logger.info("Twilio placeholder mode", { configured });
}
