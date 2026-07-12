import { z } from "zod";
import { scoreSeller } from "../services/mlService.js";
import { runAgent } from "../services/agentService.js";
import { evaluateRules } from "../services/rulesEngine.js";
import { ensureSellerLanguage } from "../services/translationService.js";
import { saveDecision } from "../services/decisionService.js";
import {
  getConversationHistory,
  saveConversationMessage,
} from "../services/conversationService.js";
import { queueNotification } from "../services/notificationService.js";
import { formatEvaluateResponse } from "../utils/responseFormatter.js";
import { createHttpError } from "../middleware/errorHandler.js";
import { logger } from "../config/logger.js";
import { SUPPORTED_LANGUAGES } from "../utils/constants.js";

/** Zod schema for seller feature payload */
const sellerDataSchema = z.object({
  sales_velocity_6m: z.number(),
  sales_growth_rate: z.number(),
  rto_rate: z.number(),
  dispatch_sla_compliance: z.number(),
  avg_customer_rating: z.number(),
  rating_trend: z.number(),
  order_cancellation_rate: z.number(),
  ad_spend_roi: z.number(),
  account_age_months: z.number().int(),
  total_orders_6m: z.number().int(),
  catalog_size: z.number().int(),
  prior_loan_default: z.number().int().min(0).max(1),
});

/** Zod schema for loan evaluation request */
const evaluateRequestSchema = z.object({
  seller_id: z.string().min(1),
  seller_data: sellerDataSchema,
  language: z.enum(SUPPORTED_LANGUAGES).optional().default("English"),
  phone_number: z.string().optional(),
});

/**
 * POST /api/loan/evaluate — full underwriting orchestration pipeline.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function evaluateLoan(req, res, next) {
  const pipelineStart = Date.now();

  try {
    // 1. Validate request
    const parsed = evaluateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createHttpError(400, parsed.error.errors.map((e) => e.message).join("; "));
    }

    const { seller_id: sellerId, seller_data: sellerData, language, phone_number: phoneNumber } =
      parsed.data;

    logger.info("Loan evaluation started", { sellerId, language });

    // 2. Call FastAPI ML service
    const mlStart = Date.now();
    const mlResult = await scoreSeller(sellerId, sellerData);
    const mlElapsed = Date.now() - mlStart;

    // 3. Load seller conversation history
    const conversationHistory = await getConversationHistory(sellerId);

    // 4. Apply deterministic rules engine (before agent so messages use final numbers)
    const rulesResult = evaluateRules({
      mlLoanLimit: mlResult.loan_limit,
      sellerData,
    });

    logger.info("Rules engine output", { sellerId, ...rulesResult });

    // 5. LangChain agent — interpret, explain, generate messages
    const agentStart = Date.now();
    const agentOutput = await runAgent({
      sellerId,
      sellerData,
      mlResult,
      rulesResult,
      conversationHistory,
      language,
    });
    const agentElapsed = Date.now() - agentStart;

    // 6. Translation fallback for seller message if needed
    const translationStart = Date.now();
    const sellerMessage = await ensureSellerLanguage(agentOutput.seller_message, language);
    const translationElapsed = Date.now() - translationStart;

    const totalElapsed = Date.now() - pipelineStart;

    // 7. Save decision to MongoDB
    await saveDecision({
      seller_id: sellerId,
      seller_features: sellerData,
      risk_class: mlResult.risk_class,
      risk_score: mlResult.risk_score,
      ml_loan_limit: mlResult.loan_limit,
      final_loan_limit: rulesResult.final_loan_limit,
      requires_human_review: rulesResult.requires_human_review,
      decision_status: rulesResult.decision_status,
      top_reasoning_features: mlResult.top_reasoning_features,
      seller_message: sellerMessage,
      auditor_trail: agentOutput.auditor_trail,
      improvement_plan: agentOutput.improvement_plan ?? [],
      execution_time_ms: totalElapsed,
      language,
    });

    // 8. Save conversation turns
    await saveConversationMessage({
      sellerId,
      role: "user",
      message: `Loan evaluation requested for seller ${sellerId}`,
      language,
    });

    await saveConversationMessage({
      sellerId,
      role: "assistant",
      message: sellerMessage,
      language,
      metadata: {
        risk_class: mlResult.risk_class,
        loan_limit: rulesResult.final_loan_limit,
      },
    });

    // 9. Queue notification (placeholder)
    await queueNotification({ sellerId, message: sellerMessage, phoneNumber });

    logger.info("Loan evaluation completed", {
      sellerId,
      ml_elapsed_ms: mlElapsed,
      agent_elapsed_ms: agentElapsed,
      translation_elapsed_ms: translationElapsed,
      total_elapsed_ms: totalElapsed,
    });

    // 10. Return response
    res.json(
      formatEvaluateResponse({
        sellerId,
        decision: {
          risk_class: mlResult.risk_class,
          risk_score: mlResult.risk_score,
          final_loan_limit: rulesResult.final_loan_limit,
          requires_human_review: rulesResult.requires_human_review,
          decision_status: rulesResult.decision_status,
        },
        topReasoningFeatures: mlResult.top_reasoning_features,
        sellerMessage,
        auditorTrail: agentOutput.auditor_trail,
        improvementPlan: agentOutput.improvement_plan ?? [],
        language,
        executionTimeMs: totalElapsed,
      })
    );
  } catch (error) {
    next(error);
  }
}
