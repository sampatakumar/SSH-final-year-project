import { Router } from "express";
import { getUserAnalytics } from "../controllers/analytics.controller.js";
import { verifyFirebaseToken } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/v1/analytics/me
router.get("/me", verifyFirebaseToken, getUserAnalytics);

export default router;
