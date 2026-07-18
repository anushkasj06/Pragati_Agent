import { Router } from "express";
import multer from "multer";
import {
  getSeller,
  getSellerEstimate,
  getSellers,
} from "../controllers/sellerController.js";
import {
  createApplication,
  listApplications,
  updateApplicationStatus,
  getNotificationsForSeller,
} from "../services/applicationService.js";
import { saveApplicationDocuments } from "../services/documentService.js";
import { Application } from "../models/Application.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const applicationFiles = [
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "bank", maxCount: 1 },
  { name: "gst", maxCount: 1 },
];

function normalizeApplicationPayload(body = {}) {
  let documents = body.documents || {};
  if (typeof documents === "string") {
    try {
      documents = JSON.parse(documents);
    } catch {
      documents = {};
    }
  }

  let evaluation = body.evaluation || null;
  if (typeof evaluation === "string") {
    try {
      evaluation = JSON.parse(evaluation);
    } catch {
      evaluation = null;
    }
  }

  let businessStats = body.businessStats || null;
  if (typeof businessStats === "string") {
    try {
      businessStats = JSON.parse(businessStats);
    } catch {
      businessStats = null;
    }
  }

  return {
    sellerId: body.sellerId || body.seller_id,
    sellerName: body.sellerName || body.seller_name || "Seller",
    phoneNumber: body.phoneNumber || body.phone_number || "",
    amount: body.amount || body.requestedAmount || body.requested_amount || 0,
    requestedAmount: body.requestedAmount || body.requested_amount || body.amount || 0,
    purpose: body.purpose || "Working capital loan",
    decisionMessage:
      body.decisionMessage || body.decision_message || "Documents submitted successfully. Awaiting admin review.",
    riskClass: body.riskClass || body.risk_class || "Pending",
    language: body.language || "English",
    documents,
    evaluation,
    businessStats,
  };
}

router.get("/", getSellers);

router.post(
  "/applications",
  (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      return upload.fields(applicationFiles)(req, res, next);
    }
    next();
  },
  async (req, res) => {
    try {
      const payload = normalizeApplicationPayload(req.body);
      const application = await createApplication(payload);

      if (req.files && Object.keys(req.files).length > 0) {
        const savedDocuments = saveApplicationDocuments(application, req.files);
        application.documents = {
          ...(application.documents || {}),
          ...savedDocuments,
        };
        const updated = await Application.findOneAndUpdate(
          { id: application.id },
          { documents: application.documents },
          { new: true }
        ).lean().exec();
        if (updated) {
          application.documents = updated.documents || application.documents;
        }
      }

      res.json({ application });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/applications", async (req, res) => {
  try {
    const sellerId = req.query.seller_id || req.query.sellerId;
    const status = req.query.status;
    const applications = await listApplications({ sellerId, status });
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/applications/:id/approve", async (req, res) => {
  try {
    const application = await updateApplicationStatus(req.params.id, "approved", req.body.adminNote || "");
    res.json({ application });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/applications/:id/reject", async (req, res) => {
  try {
    const application = await updateApplicationStatus(req.params.id, "rejected", req.body.adminNote || "");
    res.json({ application });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const sellerId = req.query.seller_id || req.query.sellerId;
    const notifications = await getNotificationsForSeller(sellerId);
    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:sellerId/estimate", getSellerEstimate);
router.get("/:sellerId", getSeller);

export default router;
