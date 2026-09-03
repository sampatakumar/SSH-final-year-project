import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  evaluateSkills,
  getSkillProfile,
  getSkillHistory,
} from "../controllers/skills.controller.js";
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

// Compatibility aliases for legacy/variant route patterns
router.get("/gaps", getUserGaps);
router.get("/gaps/role/:role", getRoleGaps);
router.get("/recommendations", getRecommendations);
router.get("/roadmap", getRecommendationRoadmap);

export default router;
