import { Router } from "express";
import { evaluateLoan } from "../controllers/loanController.js";

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

export default router;
