import { logger } from "../config/logger.js";
import { Notification } from "../models/Notification.js";
import { getTwilioClient, buildWhatsAppPayload } from "../config/twilio.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";

function formatMessage({ sellerMessage, loanStatus, loanLimit, riskClass, improvementPlan }) {
  const planText = Array.isArray(improvementPlan) && improvementPlan.length > 0
    ? improvementPlan.map((item, idx) => `${idx + 1}. ${item}`).join("\n")
    : "No improvement plan available.";

  return [
    `Loan Status: ${loanStatus}`,
    `Loan Limit: ₹${Number(loanLimit).toLocaleString("en-IN")}`,
    `Risk Class: ${riskClass}`,
    "Improvement Plan:",
    planText,
    "",
    "Message:",
    sellerMessage,
  ].join("\n");
}

export function buildLoanEvaluationWhatsAppMessage(evaluateResponse) {
  const {
    seller_id,
    decision,
    top_reasoning_features,
    seller_message,
    auditor_trail,
    improvement_plan,
    language,
    execution_time_ms,
    is_fallback,
  } = evaluateResponse;

  const featuresText = Array.isArray(top_reasoning_features) && top_reasoning_features.length > 0
    ? top_reasoning_features.map((item, idx) => `  ${idx + 1}. ${item.feature}: ${item.reason} (${item.impact})`).join("\n")
    : "  None provided.";

  const planText = Array.isArray(improvement_plan) && improvement_plan.length > 0
    ? improvement_plan.map((item, idx) => `  ${idx + 1}. ${item}`).join("\n")
    : "  No improvement plan available.";

  return [
    "Loan Evaluation Result",
    "----------------------",
    `Seller ID: ${seller_id}`,
    `Language: ${language}`,
    "",
    "Decision:",
    `  Risk Class: ${decision.risk_class}`,
    `  Risk Score: ${decision.risk_score}`,
    `  Loan Limit: ₹${Number(decision.loan_limit).toLocaleString("en-IN")}`,
    `  Requires Human Review: ${decision.requires_human_review ? "Yes" : "No"}`,
    `  Decision Status: ${decision.decision_status}`,
    "",
    "Top Reasoning Features:",
    featuresText,
    "",
    "Improvement Plan:",
    planText,
    "",
    "AI Message:",
    `  ${seller_message}`,
    "",
    "Auditor Trail:",
    `  ${auditor_trail || "None"}`,
    "",
    `Execution Time: ${execution_time_ms} ms`,
    `Fallback Used: ${is_fallback ? "Yes" : "No"}`,
  ].join("\n");
}

async function persistNotification({ sellerId, normalizedNumber, from, body, metadata }) {
  return Notification.create({
    seller_id: sellerId,
    phone_number: normalizedNumber,
    from_number: from,
    body,
    status: "queued",
    metadata,
  });
}

const WHATSAPP_MAX_BODY_LENGTH = 1500;

function splitWhatsAppMessage(body, maxLength = WHATSAPP_MAX_BODY_LENGTH) {
  if (!body || typeof body !== "string") return [String(body)];
  if (body.length <= maxLength) return [body];

  const parts = [];
  let start = 0;

  while (start < body.length) {
    let end = Math.min(start + maxLength, body.length);
    if (end === body.length) {
      parts.push(body.slice(start).trim());
      break;
    }

    let splitIndex = body.lastIndexOf("\n", end);
    if (splitIndex <= start) {
      splitIndex = body.lastIndexOf(" ", end);
    }
    if (splitIndex <= start) {
      splitIndex = end;
    }

    parts.push(body.slice(start, splitIndex).trim());
    start = splitIndex;
    while (start < body.length && body[start] === " ") {
      start += 1;
    }
  }

  return parts.filter((part) => part.length > 0);
}

async function sendPayload(notification, payload) {
  const client = getTwilioClient();
  const message = await client.messages.create(payload);

  await Notification.findByIdAndUpdate(notification._id, {
    status: "sent",
    twilio_sid: message.sid,
    sent_at: new Date(),
  });

  return message;
}

export async function retryFailedNotifications({ sellerId, phoneNumber, maxAttempts = 10 } = {}) {
  const filter = { status: "failed", retry_count: { $lt: maxAttempts } };
  if (sellerId) filter.seller_id = sellerId;
  if (phoneNumber) filter.phone_number = normalizePhoneNumber(phoneNumber);

  const notifications = await Notification.find(filter).sort({ created_at: 1 });
  const results = [];

  for (const notification of notifications) {
    const payload = buildWhatsAppPayload({
      toPhoneNumber: notification.phone_number,
      body: notification.body,
    });

    await Notification.findByIdAndUpdate(notification._id, { status: "queued", error: null });

    try {
      const message = await sendPayload(notification, payload);
      results.push({
        notificationId: notification._id,
        sellerId: notification.seller_id,
        status: "sent",
        twilioSid: message.sid,
      });
    } catch (error) {
      const failedMessage = error?.message || String(error);
      await Notification.findByIdAndUpdate(notification._id, {
        status: "failed",
        retry_count: (notification.retry_count || 0) + 1,
        error: failedMessage,
      });
      results.push({
        notificationId: notification._id,
        sellerId: notification.seller_id,
        status: "failed",
        error: failedMessage,
        retry_count: (notification.retry_count || 0) + 1,
      });
    }
  }

  return results;
}

export async function resendPendingNotifications({ sellerId, phoneNumber, status = "failed" } = {}) {
  const filter = { status };
  if (sellerId) filter.seller_id = sellerId;
  if (phoneNumber) filter.phone_number = normalizePhoneNumber(phoneNumber);

  const notifications = await Notification.find(filter).sort({ created_at: 1 });
  const results = [];

  for (const notification of notifications) {
    const payload = buildWhatsAppPayload({
      toPhoneNumber: notification.phone_number,
      body: notification.body,
    });

    await Notification.findByIdAndUpdate(notification._id, { status: "queued", error: null });

    try {
      const message = await sendPayload(notification, payload);
      results.push({
        notificationId: notification._id,
        sellerId: notification.seller_id,
        status: "sent",
        twilioSid: message.sid,
      });
    } catch (error) {
      const failedMessage = error?.message || String(error);
      await Notification.findByIdAndUpdate(notification._id, {
        status: "failed",
        error: failedMessage,
      });
      results.push({
        notificationId: notification._id,
        sellerId: notification.seller_id,
        status: "failed",
        error: failedMessage,
      });
    }
  }

  return results;
}

/**
 * Send a WhatsApp notification to the seller and persist the message status.
 * @param {object} params
 * @param {string} params.sellerId
 * @param {string} params.phoneNumber
 * @param {string} [params.body]
 * @param {string} [params.sellerMessage]
 * @param {string} [params.loanStatus]
 * @param {number} [params.loanLimit]
 * @param {string} [params.riskClass]
 * @param {Array<string>} [params.improvementPlan]
 * @returns {Promise<void>}
 */
export async function queueNotification({
  sellerId,
  phoneNumber,
  body,
  sellerMessage,
  loanStatus = "Pending",
  loanLimit = 0,
  riskClass = "Unknown",
  improvementPlan = [],
}) {
  const normalizedNumber = normalizePhoneNumber(phoneNumber);
  if (!normalizedNumber) {
    logger.warn("Skipping WhatsApp notification because phone number is missing", { sellerId });
    return;
  }

  const messageBody = body || formatMessage({ sellerMessage, loanStatus, loanLimit, riskClass, improvementPlan });
  const messageParts = splitWhatsAppMessage(messageBody);

  const notification = await persistNotification({
    sellerId,
    normalizedNumber,
    from: buildWhatsAppPayload({ toPhoneNumber: normalizedNumber, body: messageBody }).from,
    body: messageBody,
    metadata: {
      loanStatus,
      loanLimit,
      riskClass,
      improvementPlan,
      parts: messageParts.length,
    },
  });

  logger.info("WhatsApp notification payload prepared", {
    sellerId,
    to: normalizedNumber,
    partCount: messageParts.length,
    preview: messageBody.substring(0, 120),
  });

  await Notification.findByIdAndUpdate(notification._id, {
    status: "queued",
    error: null,
    retry_count: notification.retry_count || 0,
  });

  try {
    for (let index = 0; index < messageParts.length; index += 1) {
      const part = messageParts[index];
      const partPayload = buildWhatsAppPayload({ toPhoneNumber: normalizedNumber, body: part });
      const message = await sendPayload(notification, partPayload);
      logger.info("WhatsApp notification part sent", {
        sellerId,
        phoneNumber: normalizedNumber,
        part: index + 1,
        totalParts: messageParts.length,
        twilioSid: message.sid,
        status: message.status,
      });
    }
  } catch (error) {
    const failedMessage = error?.message || String(error);
    await Notification.findByIdAndUpdate(notification._id, {
      status: "failed",
      retry_count: (notification.retry_count || 0) + 1,
      error: failedMessage,
    });

    logger.error("WhatsApp notification failed", {
      sellerId,
      phoneNumber: normalizedNumber,
      error: failedMessage,
      stack: error?.stack,
      partCount: messageParts.length,
    });
  }
}
