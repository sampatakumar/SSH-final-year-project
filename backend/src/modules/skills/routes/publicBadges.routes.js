import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyPublicBadgeController } from "../controllers/competencyBadge.controller.js";

const router = Router();

const publicVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please try again in a few minutes.",
  },
});

// Public cryptographic verification endpoint (No auth required)
router.get("/verify/:badgeId", publicVerifyLimiter, verifyPublicBadgeController);

export default router;
