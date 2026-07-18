import { Router } from "express";
import { evaluateLoan, getDecisionHistory } from "../controllers/loanController.js";
import { createApplication, listApplications, updateApplicationStatus } from "../services/applicationService.js";

const router = Router();

/**
 * @openapi
 * /api/loan/evaluate:
 *   post:
 *     summary: Evaluate seller loan eligibility
 *     tags: [Loan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [seller_id, seller_data]
 *             properties:
 *               seller_id:
 *                 type: string
 *               language:
 *                 type: string
 *                 enum: [English, Hindi, Marathi, Tamil, Telugu, Kannada, Gujarati, Malayalam]
 *               seller_data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Loan evaluation result
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal error
 */
router.post("/evaluate", evaluateLoan);
router.get("/decisions", getDecisionHistory);
router.post("/applications", async (req, res) => {
  try {
    const application = await createApplication(req.body);
    res.json({ application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
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

export default router;
