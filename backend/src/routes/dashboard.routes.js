import { Router } from "express";
import {
  getDashboardSummary,
  getFullProfileSnapshot,
  getDashboardIntelligenceController,
  toggleDailyMissionController,
} from "../controllers/dashboard.controller.js";
import { verifyFirebaseToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/summary", verifyFirebaseToken, getDashboardSummary);
router.get("/profile", verifyFirebaseToken, getFullProfileSnapshot);
router.get("/intelligence", verifyFirebaseToken, getDashboardIntelligenceController);
router.post("/missions/:id/toggle", verifyFirebaseToken, toggleDailyMissionController);

export default router;
