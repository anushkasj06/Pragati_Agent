import twilio from "twilio";
import { logger } from "./logger.js";

/**
 * Twilio configuration for WhatsApp messaging.
 */
export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || "",
  authToken: process.env.TWILIO_AUTH_TOKEN || "",
  whatsappNumber:
    process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_FROM_NUMBER || "",
};

let twilioClient = null;

export function getTwilioClient() {
  if (twilioClient) return twilioClient;
  const { accountSid, authToken } = twilioConfig;
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured");
  }
  twilioClient = twilio(accountSid, authToken);
  return twilioClient;
}

export function getWhatsAppSender() {
  const sender = twilioConfig.whatsappNumber.trim();
  if (!sender) {
    throw new Error("TWILIO_WHATSAPP_NUMBER is not configured");
  }
  return sender.startsWith("whatsapp:") ? sender : `whatsapp:${sender}`;
}

export function buildWhatsAppPayload({ toPhoneNumber, body }) {
  const to = toPhoneNumber.startsWith("whatsapp:")
    ? toPhoneNumber
    : `whatsapp:${toPhoneNumber}`;

  return {
    body,
    from: getWhatsAppSender(),
    to,
  };
}

export function buildWhatsAppUrl() {
  const whatsapp = twilioConfig.whatsappNumber.trim();
  if (!whatsapp) {
    throw new Error("Twilio WhatsApp number is not configured");
  }
  const number = whatsapp.replace(/[^0-9]/g, "");
  return `https://wa.me/${number}`;
}

export function buildWhatsAppAppUrl(joinCode = "") {
  const whatsapp = twilioConfig.whatsappNumber.trim();
  if (!whatsapp) {
    throw new Error("Twilio WhatsApp number is not configured");
  }
  const number = whatsapp.replace(/[^0-9]/g, "");
  const normalizedPhone = `+${number}`;
  const query = [`phone=${encodeURIComponent(normalizedPhone)}`];

  if (joinCode) {
    query.push(`text=${encodeURIComponent(joinCode)}`);
  }

  query.push("type=phone_number", "app_absent=0");
  return `https://api.whatsapp.com/send/?${query.join("&")}`;
}

export function buildWhatsAppWebUrl(joinCode = "") {
  const whatsapp = twilioConfig.whatsappNumber.trim();
  if (!whatsapp) {
    throw new Error("Twilio WhatsApp number is not configured");
  }
  const number = whatsapp.replace(/[^0-9]/g, "");
  const normalizedPhone = `+${number}`;
  const query = [`phone=${encodeURIComponent(normalizedPhone)}`];

  if (joinCode) {
    query.push(`text=${encodeURIComponent(joinCode)}`);
  }

  return `https://web.whatsapp.com/send?${query.join("&")}`;
}

export function logTwilioConfig() {
  const configured = Boolean(
    twilioConfig.accountSid &&
    twilioConfig.authToken &&
    twilioConfig.whatsappNumber
  );
  logger.info("Twilio WhatsApp config", {
    configured,
    whatsappNumber: twilioConfig.whatsappNumber,
  });
}
