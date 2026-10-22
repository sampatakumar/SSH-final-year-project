import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  evaluateSkills,
  getSkillProfile,
  getSkillHistory,
  getAdaptiveLoop,
  recordAdaptiveAssessment,
  recordLearningActivityController,
  getLearnerActivitiesController,
  getAdaptiveLearningPlanController,
  compareMultiRolePlansController,
} from "../controllers/skills.controller.js";
import {
  evaluateAdaptiveLoopController,
  getAdaptiveLoopStateController,
  getAdaptiveTelemetryController,
} from "../controllers/adaptiveLoop.controller.js";
import { getUserGaps, getRoleGaps } from "../../gaps/controllers/gaps.controller.js";
import { getRecommendations, getRecommendationRoadmap } from "../../recommendations/controllers/recommendations.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

const evaluationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many skill evaluation requests. Please wait a moment." },
});

// All skill endpoints strictly enforce canonical authenticated user identity
router.use(verifyFirebaseToken);

router.post("/evaluate", evaluationLimiter, evaluateSkills);
router.get("/profile", getSkillProfile);
router.get("/history", getSkillHistory);

// Adaptive Skill Development Loop
router.get("/adaptive/loop", getAdaptiveLoop);
router.post("/adaptive/assess", recordAdaptiveAssessment);

// End-to-End Learning Intelligence & Adaptive Recommendations
router.post("/learning-loop/activity", recordLearningActivityController);
router.get("/learning-loop/activities", getLearnerActivitiesController);
router.get("/learning-loop/plan", getAdaptiveLearningPlanController);
router.get("/learning-loop/compare", compareMultiRolePlansController);

// Adaptive Loop Evaluation & Telemetry (Phase 38)
router.post("/adaptive-loop/evaluate", evaluateAdaptiveLoopController);
router.get("/adaptive-loop/state", getAdaptiveLoopStateController);
router.get("/adaptive-loop/telemetry", getAdaptiveTelemetryController);

// Compatibility aliases for legacy/variant route patterns
router.get("/gaps", getUserGaps);
router.get("/gaps/role/:role", getRoleGaps);
router.get("/recommendations", getRecommendations);
router.get("/roadmap", getRecommendationRoadmap);

export default router;
