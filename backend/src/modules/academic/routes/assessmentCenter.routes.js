import { Router } from "express";
import {
  listAssessmentsController,
  getAssessmentByIdController,
  getRecommendedAssessmentsController,
  startAssessmentAttemptController,
  submitAssessmentAttemptController,
  getStudentAttemptsController,
  getAttemptByIdController,
  seedAssessmentCatalogController,
} from "../controllers/assessmentCenter.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import { ensureAdmin } from "../../../core/middleware/admin.middleware.js";

const router = Router();

// Public / Discovery endpoints
router.get("/", listAssessmentsController);

// Protected endpoints requiring student authentication
router.get("/user/recommendations", verifyFirebaseToken, getRecommendedAssessmentsController);
router.get("/user/attempts", verifyFirebaseToken, getStudentAttemptsController);
router.get("/attempts/:attemptId", verifyFirebaseToken, getAttemptByIdController);
router.post("/:assessmentId/start", verifyFirebaseToken, startAssessmentAttemptController);
router.post("/attempts/:attemptId/submit", verifyFirebaseToken, submitAssessmentAttemptController);

// Single assessment detail
router.get("/:assessmentId", getAssessmentByIdController);

// Protected Admin Mutation endpoints
router.post("/admin/seed", ensureAdmin, seedAssessmentCatalogController);

export default router;
