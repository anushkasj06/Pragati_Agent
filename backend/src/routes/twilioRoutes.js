import express from "express";
import { Router } from "express";
import { logger } from "../config/logger.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";
import { getSellerById, getSellerByPhone } from "../services/sellerService.js";
import { runLoanEvaluationPipeline } from "../controllers/loanController.js";
import { buildLoanEvaluationWhatsAppMessage, queueNotification } from "../services/notificationService.js";

const router = Router();
router.use(express.urlencoded({ extended: false }));

router.get(["/", "/incoming"], (_req, res) => {
  res.json({ ok: true, message: "Twilio webhook is active. POST a message payload to /api/twilio or /api/twilio/incoming." });
});

router.post(["/", "/incoming"], async (req, res) => {
  try {
    const incomingText = String(req.body.Body || req.body.body || "").trim();
    const incomingFrom = normalizePhoneNumber(String(req.body.From || req.body.from || ""));

    logger.info("Twilio inbound message received", {
      body: incomingText,
      from: incomingFrom,
      rawBody: req.body,
    });

    let seller = null;
    const match = incomingText.match(/(?:EVALUATE|EVAL|LOAN)\s+([A-Za-z0-9_-]+)/i);
    const sellerIdFromText = match?.[1]?.toUpperCase();

    if (sellerIdFromText) {
      seller = await getSellerById(sellerIdFromText);
    }

    if (!seller && incomingFrom) {
      seller = await getSellerByPhone(incomingFrom);
    }

    if (!seller) {
      const message = `Unable to locate your seller profile. Please register first and then send 'EVALUATE <SELLER_ID>' to this number.`;
      logger.warn("Twilio inbound message could not resolve seller", { incomingText, incomingFrom });
      res.type("text/xml").send(`<Response><Message>${message}</Message></Response>`);
      return;
    }

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
      "Your loan evaluation request was received. The full result will be delivered to you via WhatsApp shortly.";
    const escapedConfirmation = confirmationMessage
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    res.type("text/xml").send(`<Response><Message>${escapedConfirmation}</Message></Response>`);
  } catch (error) {
    logger.error("Twilio inbound handler failed", { error: error.message, stack: error.stack });
    res.type("text/xml").send(`<Response><Message>There was an error processing your request: ${error.message}</Message></Response>`);
  }
});

export default router;
