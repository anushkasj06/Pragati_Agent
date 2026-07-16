import { z } from "zod";
import { scoreSeller } from "../services/mlService.js";
import { runAgent } from "../services/agentService.js";
import { evaluateRules } from "../services/rulesEngine.js";
import { ensureSellerLanguage } from "../services/translationService.js";
import { listDecisions, saveDecision } from "../services/decisionService.js";
import {
  getConversationHistory,
  saveConversationMessage,
} from "../services/conversationService.js";
import { queueNotification, buildLoanEvaluationWhatsAppMessage } from "../services/notificationService.js";
import { getSellerById } from "../services/sellerService.js";
import { formatEvaluateResponse } from "../utils/responseFormatter.js";
import { createHttpError } from "../middleware/errorHandler.js";
import { logger } from "../config/logger.js";
import { SUPPORTED_LANGUAGES } from "../utils/constants.js";
import { normalizePhoneNumber } from "../utils/phoneUtils.js";

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

export async function runLoanEvaluationPipeline({ sellerId, sellerData, language = "English" }) {
  const pipelineStart = Date.now();

  const mlStart = Date.now();
  const mlResult = await scoreSeller(sellerId, sellerData);
  const mlElapsed = Date.now() - mlStart;

  const conversationHistory = await getConversationHistory(sellerId);

  const rulesResult = evaluateRules({
    mlLoanLimit: mlResult.loan_limit,
    sellerData,
  });

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

  const translationStart = Date.now();
  const sellerMessage = await ensureSellerLanguage(agentOutput.seller_message, language);
  const translationElapsed = Date.now() - translationStart;

  const totalElapsed = Date.now() - pipelineStart;

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

  return formatEvaluateResponse({
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
    isFallback: agentOutput.is_fallback === true,
  });
}

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

    const sellerProfile = await getSellerById(sellerId);
    const resolvedPhoneNumber = phoneNumber || sellerProfile?.phone_number;

    if (!resolvedPhoneNumber) {
      logger.warn("Loan evaluation has no seller phone number", {
        sellerId,
        providedPhoneNumber: phoneNumber,
        sellerProfileExists: Boolean(sellerProfile),
      });
    }

    logger.info("Loan evaluation started", { sellerId, language, phoneNumber: resolvedPhoneNumber });

    const evaluationResponse = await runLoanEvaluationPipeline({
      sellerId,
      sellerData,
      language,
    });

    void queueNotification({
      sellerId,
      phoneNumber: resolvedPhoneNumber,
      body: buildLoanEvaluationWhatsAppMessage(evaluationResponse),
      sellerMessage: evaluationResponse.seller_message,
      loanStatus: evaluationResponse.decision.decision_status,
      loanLimit: evaluationResponse.decision.loan_limit,
      riskClass: evaluationResponse.decision.risk_class,
      improvementPlan: evaluationResponse.improvement_plan ?? [],
    }).catch((error) => {
      logger.error("WhatsApp notification pipeline error", { sellerId, error: error.message });
    });

    logger.info("Loan evaluation completed", {
      sellerId,
      total_elapsed_ms: Date.now() - pipelineStart,
    });

    res.json(evaluationResponse);
  } catch (error) {
    next(error);
  }
}

function formatDecisionHistoryItem(decision) {
  return {
    id: decision._id?.toString?.() ?? `${decision.seller_id}-${decision.timestamp}`,
    seller_id: decision.seller_id,
    timestamp: decision.timestamp ?? decision.createdAt,
    decision: {
      risk_class: decision.risk_class,
      risk_score: decision.risk_score,
      loan_limit: decision.final_loan_limit,
      requires_human_review: decision.requires_human_review,
      decision_status: decision.decision_status,
    },
    language: decision.language,
    seller_message: decision.seller_message,
    auditor_trail: decision.auditor_trail,
    improvement_plan: decision.improvement_plan ?? [],
    top_reasoning_features: decision.top_reasoning_features ?? [],
    execution_time_ms: decision.execution_time_ms,
  };
}

/**
 * GET /api/loan/decisions — recent saved underwriting decisions.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function getDecisionHistory(req, res, next) {
  try {
    const decisions = await listDecisions({
      sellerId: req.query.seller_id,
      limit: req.query.limit,
    });

    res.json({
      decisions: decisions.map(formatDecisionHistoryItem),
    });
  } catch (error) {
    next(error);
  }
}
