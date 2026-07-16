import { createHttpError } from "../middleware/errorHandler.js";
import { evaluateRules } from "../services/rulesEngine.js";
import { scoreSeller } from "../services/mlService.js";
import { createSeller } from "../services/sellerService.js";
import { getSellerProfile, listSellerProfiles } from "../services/sellerProfileService.js";
import { buildWhatsAppUrl } from "../config/twilio.js";
import { queueNotification, buildLoanEvaluationWhatsAppMessage } from "../services/notificationService.js";
import { runLoanEvaluationPipeline } from "../controllers/loanController.js";

function publicSellerProfile(seller) {
  return {
    id: seller.id,
    risk_category: seller.risk_category,
    name: seller.name,
    business: seller.business,
    city: seller.city,
    phone: seller.phone,
    language: seller.language,
    summary: seller.summary,
    metrics: seller.metrics,
  };
}

export function getSellers(req, res) {
  const sellers = listSellerProfiles(req.query.risk).map(publicSellerProfile);
  res.json({ sellers });
}

export async function registerSeller(req, res) {
  const payload = {
    seller_id: String(req.body.seller_id || req.body.sellerId || "").trim().toUpperCase(),
    seller_name: String(req.body.seller_name || req.body.sellerName || "").trim(),
    phone_number: String(req.body.phone_number || req.body.phoneNumber || "").trim(),
    preferred_language: String(req.body.preferred_language || req.body.preferredLanguage || "English").trim(),
    seller_data: req.body.seller_data || {},
  };

  if (!payload.seller_id) {
    throw createHttpError(400, "seller_id is required");
  }
  if (!payload.seller_name) {
    throw createHttpError(400, "seller_name is required");
  }
  if (!payload.phone_number) {
    throw createHttpError(400, "phone_number is required");
  }
  if (!payload.preferred_language) {
    throw createHttpError(400, "preferred_language is required");
  }
  if (!payload.seller_data || typeof payload.seller_data !== "object") {
    throw createHttpError(400, "seller_data must be an object");
  }

  const seller = await createSeller(payload);
  const whatsAppUrl = buildWhatsAppUrl();
  const sandboxJoinCode = "join large-president";

  void queueNotification({
    sellerId: seller.seller_id,
    phoneNumber: seller.phone_number,
    sellerMessage: `Welcome ${seller.seller_name}! Your seller profile is set up and the WhatsApp sandbox is connected. Open the sandbox link and send '${sandboxJoinCode}' to configure the sandbox, then send EVALUATE ${seller.seller_id} to receive your loan evaluation result.`,
    loanStatus: "Registered",
    loanLimit: 0,
    riskClass: "N/A",
    improvementPlan: [
      `Open the WhatsApp sandbox link and send '${sandboxJoinCode}' to the Twilio sandbox number.`,
      `After sandbox setup is complete, send EVALUATE ${seller.seller_id} from WhatsApp to request a loan evaluation.`,
    ],
  }).catch((error) => {
    console.error("Failed to send seller onboarding WhatsApp message", error);
  });

  res.status(201).json({
    seller_id: seller.seller_id,
    registration_status: "created",
    next_step: "Loan evaluation available",
    whatsAppUrl,
    sandboxJoinCode: sandboxJoinCode,
  });
}

export function getSeller(req, res, next) {
  try {
    const seller = getSellerProfile(req.params.sellerId);
    if (!seller) throw createHttpError(404, "Seller profile not found");
    res.json({ seller: publicSellerProfile(seller) });
  } catch (error) {
    next(error);
  }
}

export async function getSellerEstimate(req, res, next) {
  try {
    const seller = getSellerProfile(req.params.sellerId);
    if (!seller) throw createHttpError(404, "Seller profile not found");

    const mlResult = await scoreSeller(seller.id, seller.metrics);
    const rulesResult = evaluateRules({
      mlLoanLimit: mlResult.loan_limit,
      sellerData: seller.metrics,
    });

    res.json({
      seller_id: seller.id,
      risk_category: seller.risk_category,
      decision: {
        risk_class: mlResult.risk_class,
        risk_score: mlResult.risk_score,
        loan_limit: rulesResult.final_loan_limit,
        requires_human_review: rulesResult.requires_human_review,
        decision_status: rulesResult.decision_status,
      },
      top_reasoning_features: mlResult.top_reasoning_features ?? [],
    });
  } catch (error) {
    next(error);
  }
}
