import { Router } from "express";
import { registerSeller } from "../controllers/sellerController.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    await registerSeller(req, res);
  } catch (error) {
    next(error);
  }
});

export default router;
