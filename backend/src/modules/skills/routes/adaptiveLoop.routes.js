import { Router } from "express";
import {
  evaluateAdaptiveLoopController,
  getAdaptiveLoopStateController,
  getAdaptiveTelemetryController,
} from "../controllers/adaptiveLoop.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

// Strictly enforce authenticated student context
router.use(verifyFirebaseToken);

router.post("/evaluate", evaluateAdaptiveLoopController);
router.get("/state", getAdaptiveLoopStateController);
router.get("/telemetry", getAdaptiveTelemetryController);

export default router;
