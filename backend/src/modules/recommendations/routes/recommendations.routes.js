import { Router } from "express";
import {
  getRecommendations,
  getRecommendationRoadmap,
  getSkillRecommendation,
  updateRecommendationStatus,
} from "../controllers/recommendations.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

// Publicly accessible skill lookup recommendation
router.get("/skill/:skill", getSkillRecommendation);

// Authenticated user recommendations
router.use(verifyFirebaseToken);

router.get("/", getRecommendations);
router.get("/roadmap", getRecommendationRoadmap);
router.patch("/item/:recommendationId", updateRecommendationStatus);

export default router;
