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

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const applicationFiles = [
  { name: "aadhaar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "bank", maxCount: 1 },
  { name: "gst", maxCount: 1 },
];

function normalizeApplicationPayload(body = {}) {
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
    documents: body.documents || {},
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
  (req, res) => {
    try {
      const payload = normalizeApplicationPayload(req.body);
      const application = createApplication(payload);

      if (req.files && Object.keys(req.files).length > 0) {
        application.documents = saveApplicationDocuments(application, req.files);
      }

      res.json({ application });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.get("/applications", (req, res) => {
  const sellerId = req.query.seller_id || req.query.sellerId;
  const status = req.query.status;
  res.json({ applications: listApplications({ sellerId, status }) });
});

router.post("/applications/:id/approve", (req, res) => {
  try {
    const application = updateApplicationStatus(req.params.id, "approved", req.body.adminNote || "");
    res.json({ application });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.post("/applications/:id/reject", (req, res) => {
  try {
    const application = updateApplicationStatus(req.params.id, "rejected", req.body.adminNote || "");
    res.json({ application });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.get("/notifications", (req, res) => {
  const sellerId = req.query.seller_id || req.query.sellerId;
  res.json({ notifications: getNotificationsForSeller(sellerId) });
});

router.get("/:sellerId/estimate", getSellerEstimate);
router.get("/:sellerId", getSeller);

export default router;
