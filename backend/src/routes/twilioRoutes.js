import express from "express";
import { Router } from "express";
import { logger } from "../config/logger.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";
import { getSellerById, getSellerByPhone } from "../services/sellerService.js";
import { runLoanEvaluationPipeline } from "../controllers/loanController.js";
import { buildLoanEvaluationWhatsAppMessage, queueNotification } from "../services/notificationService.js";
import { getLatestDecision } from "../services/decisionService.js";
import { getConversationHistory, saveConversationMessage } from "../services/conversationService.js";
import { runAgent } from "../services/agentService.js";
import { ensureSellerLanguage } from "../services/translationService.js";

const router = Router();
router.use(express.urlencoded({ extended: false }));

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function isEvaluationRequest(text) {
  const normalized = String(text || "").trim().toLowerCase();
  if (!normalized) return false;

  if (/^(evaluate|eval|loan|evalute)([\s_-]+[a-z0-9_-]+)?$/i.test(normalized)) return true;
  if (normalized.includes("evaluate loan")) return true;
  if (normalized.includes("evalute loan")) return true;
  if (normalized.includes("check loan")) return true;
  return false;
}

function buildGreetingReply() {
  return "Hi! I’m your Meesho Pragati financial coach. Send EVALUATE <SELLER_ID> for your latest loan evaluation. After that, ask me anything about your business, dispatch, returns, ratings, or how to improve your loan eligibility and I’ll keep helping in your preferred language.";
}

function extractIncomingPayload(req) {
  const body = req.body;

  if (!body) {
    return { text: "", from: "" };
  }

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === "object") {
        return {
          text: String(parsed.Body ?? parsed.body ?? "").trim(),
          from: normalizePhoneNumber(String(parsed.From ?? parsed.from ?? "")),
        };
      }
    } catch {
      return { text: body, from: "" };
    }
  }

  if (typeof body === "object") {
    if (body.Body || body.body || body.From || body.from) {
      return {
        text: String(body.Body ?? body.body ?? "").trim(),
        from: normalizePhoneNumber(String(body.From ?? body.from ?? "")),
      };
    }

    const values = Object.values(body);
    if (values.length === 1 && typeof values[0] === "string") {
      try {
        const parsed = JSON.parse(values[0]);
        if (parsed && typeof parsed === "object") {
          return {
            text: String(parsed.Body ?? parsed.body ?? "").trim(),
            from: normalizePhoneNumber(String(parsed.From ?? parsed.from ?? "")),
          };
        }
      } catch {
        return { text: values[0], from: "" };
      }
    }
  }

  return { text: "", from: "" };
}

router.get(["/", "/incoming"], (_req, res) => {
  res.json({ ok: true, message: "Twilio webhook is active. POST a message payload to /api/twilio or /api/twilio/incoming." });
});

router.post(["/", "/incoming"], async (req, res) => {
  try {
    const { text: incomingText, from: incomingFrom } = extractIncomingPayload(req);

    logger.info("Twilio inbound message received", {
      body: incomingText,
      from: incomingFrom,
      rawBody: req.body,
      headers: req.headers,
    });

    let seller = null;
    const match = incomingText.match(/(?:EVALUATE|EVAL|LOAN|EVALUTE)[\s_-]*([A-Za-z0-9_-]+)/i);
    const sellerIdFromText = match?.[1]?.toUpperCase();
    const shouldRunEvaluation = isEvaluationRequest(incomingText);

    if (sellerIdFromText) {
      seller = await getSellerById(sellerIdFromText);
    }

    if (!seller && incomingFrom) {
      seller = await getSellerByPhone(incomingFrom);
    }

    if (!seller) {
      const message = isEvaluationRequest(incomingText)
        ? `Unable to locate your seller profile. Please register first and then send 'EVALUATE <SELLER_ID>' to this number.`
        : buildGreetingReply();
      logger.warn("Twilio inbound message could not resolve seller", { incomingText, incomingFrom });
      res.type("text/xml").send(`<Response><Message>${escapeXml(message)}</Message></Response>`);
      return;
    }

    if (shouldRunEvaluation) {
      const evaluationResponse = await runLoanEvaluationPipeline({
        sellerId: seller.seller_id,
        sellerData: seller.seller_data,
        language: seller.preferred_language || "English",
      });

      const evaluationMessage = buildLoanEvaluationWhatsAppMessage(evaluationResponse);

      void queueNotification({
        sellerId: seller.seller_id,
        phoneNumber: incomingFrom,
        body: evaluationMessage,
        sellerMessage: evaluationResponse.seller_message,
        loanStatus: evaluationResponse.decision.decision_status,
        loanLimit: evaluationResponse.decision.loan_limit,
        riskClass: evaluationResponse.decision.risk_class,
        improvementPlan: evaluationResponse.improvement_plan ?? [],
      }).catch((error) => {
        logger.error("Failed to persist outgoing Twilio evaluation notification", {
          sellerId: seller.seller_id,
          error: error.message,
          stack: error.stack,
        });
      });

      const confirmationMessage =
        "Your loan evaluation request was received. Your full result is being prepared and sent to you via WhatsApp. After that, you can keep chatting with me for financial coaching and business advice.";
      res.type("text/xml").send(`<Response><Message>${escapeXml(confirmationMessage)}</Message></Response>`);
      return;
    }

    const language = seller.preferred_language || "English";
    const latestDecision = await getLatestDecision(seller.seller_id);
    const conversationHistory = await getConversationHistory(seller.seller_id, 10);

    const previousTurns = conversationHistory.filter((entry) => entry && entry.message);
    const recentContext = previousTurns.slice(-8).map((entry) => `${entry.role}:${entry.message}`).join("\n");

    await saveConversationMessage({
      sellerId: seller.seller_id,
      phoneNumber: incomingFrom,
      role: "user",
      message: incomingText,
      language,
      contextUsed: "coach",
    });

    const agentResponse = await runAgent({
      sellerId: seller.seller_id,
      sellerData: seller.seller_data,
      mlResult: latestDecision
        ? {
            risk_class: latestDecision.risk_class,
            risk_score: latestDecision.risk_score,
            loan_limit: latestDecision.final_loan_limit,
          }
        : null,
      rulesResult: latestDecision
        ? {
            final_loan_limit: latestDecision.final_loan_limit,
            decision_status: latestDecision.decision_status,
            requires_human_review: Boolean(latestDecision.requires_human_review),
          }
        : null,
      conversationHistory,
      language,
      mode: "coach",
      latestDecision,
      userMessage: incomingText,
    });

    const coachReply = await ensureSellerLanguage(agentResponse.seller_message, language);

    await saveConversationMessage({
      sellerId: seller.seller_id,
      phoneNumber: incomingFrom,
      role: "assistant",
      message: coachReply,
      language,
      contextUsed: "coach",
      metadata: {
        latest_decision_status: latestDecision?.decision_status ?? null,
        fallback_used: agentResponse.is_fallback === true,
      },
    });

    void queueNotification({
      sellerId: seller.seller_id,
      phoneNumber: incomingFrom,
      body: coachReply,
      sellerMessage: coachReply,
      loanStatus: latestDecision?.decision_status ?? "Pending",
      loanLimit: latestDecision?.final_loan_limit ?? 0,
      riskClass: latestDecision?.risk_class ?? "Unknown",
      improvementPlan: agentResponse.improvement_plan ?? [],
    }).catch((error) => {
      logger.error("Failed to send Twilio coach reply", {
        sellerId: seller.seller_id,
        error: error.message,
        stack: error.stack,
      });
    });

    res.type("text/xml").send(`<Response><Message>${escapeXml(coachReply)}</Message></Response>`);
  } catch (error) {
    logger.error("Twilio inbound handler failed", { error: error.message, stack: error.stack });
    res.type("text/xml").send(`<Response><Message>There was an error processing your request: ${error.message}</Message></Response>`);
  }
});

export default router;
