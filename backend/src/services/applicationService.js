import { Application } from "../models/Application.js";
import { persistAppNotification } from "./notificationService.js";
import { getAppNotifications } from "./notificationService.js";

async function createApplicationId() {
  return `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function createApplication(payload) {
  const application = {
    id: await createApplicationId(),
    sellerId: String(payload.sellerId || payload.seller_id || "").trim().toUpperCase(),
    sellerName: payload.sellerName || payload.seller_name || "Seller",
    phoneNumber: String(payload.phoneNumber || payload.phone_number || "").trim(),
    amount: Number(payload.amount || 0),
    requestedAmount: Number(payload.requestedAmount || payload.requested_amount || payload.amount || 0),
    purpose: payload.purpose || "Working capital",
    status: "pending",
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    adminNote: "",
    decisionMessage: payload.decisionMessage || "Documents submitted. Awaiting admin review.",
    documents: payload.documents || {},
    riskClass: payload.riskClass || payload.risk_class || "Pending",
    language: payload.language || "English",
    evaluation: payload.evaluation || null,
    businessStats: payload.businessStats || null,
  };

  const saved = await Application.create(application);

  await persistAppNotification({
    sellerId: saved.sellerId,
    title: "Loan application submitted",
    message: `${saved.sellerName} submitted documents for a loan of ₹${saved.amount.toLocaleString("en-IN")}.`,
    type: "pending",
    link: "/seller/history",
  });

  return saved.toObject();
}

export async function listApplications({ sellerId, status } = {}) {
  const filter = {};
  if (sellerId) filter.sellerId = String(sellerId).trim().toUpperCase();
  if (status) filter.status = status;

  return Application.find(filter).sort({ submittedAt: -1 }).lean();
}

export async function updateApplicationStatus(id, action, adminNote = "") {
  const application = await Application.findOne({ id }).exec();
  if (!application) {
    throw new Error("Application not found");
  }

  application.status = action === "approved" ? "approved" : "rejected";
  application.reviewedAt = new Date();
  application.reviewedBy = "Admin";
  application.adminNote = adminNote;
  application.decisionMessage =
    action === "approved"
      ? "Loan sanctioned and documents approved."
      : "Documents reviewed and the loan request was rejected.";

  await application.save();

  await persistAppNotification({
    sellerId: application.sellerId,
    title: action === "approved" ? "Loan approved" : "Loan rejected",
    message:
      action === "approved"
        ? `Your loan request for ₹${application.amount.toLocaleString("en-IN")} has been approved.`
        : `Your loan request for ₹${application.amount.toLocaleString("en-IN")} was reviewed and rejected.`,
    type: action === "approved" ? "success" : "rejected",
    link: "/seller/history",
  });

  return application.toObject();
}

export async function getNotificationsForSeller(sellerId) {
  return getAppNotifications(sellerId);
}
