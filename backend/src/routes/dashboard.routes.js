import { Router } from "express";
import {
  getDashboardSummary,
  getFullProfileSnapshot,
  getDashboardIntelligenceController,
} from "../controllers/dashboard.controller.js";
import { verifyFirebaseToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary", verifyFirebaseToken, getDashboardSummary);
router.get("/profile", verifyFirebaseToken, getFullProfileSnapshot);
router.get("/intelligence", verifyFirebaseToken, getDashboardIntelligenceController);

export default router;
