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
import {
  getDueRevisionsController,
  getUpcomingRevisionsController,
  getRevisionQueueController,
  reviewRevisionAttemptController,
  createRevisionTargetController,
} from "../controllers/spacedRevision.controller.js";
import {
  getCompetencyMatrixController,
  getCompetencyTaxonomyController,
  getCompetencyEvidenceController,
  getCapstoneWorkflowController,
  getMyBadgesController,
  claimBadgeController,
  revokeBadgeController,
  verifyPublicBadgeController,
} from "../controllers/competencyBadge.controller.js";
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

// Spaced Revision Engine (Phase 39)
router.get("/spaced-revision/due", getDueRevisionsController);
router.get("/spaced-revision/upcoming", getUpcomingRevisionsController);
router.get("/spaced-revision/queue", getRevisionQueueController);
router.post("/spaced-revision/target", createRevisionTargetController);
router.post("/spaced-revision/:id/review", reviewRevisionAttemptController);

// Competency Matrix & Synthesis (Phase 40)
router.get("/competencies/matrix", getCompetencyMatrixController);
router.get("/competencies/taxonomy", getCompetencyTaxonomyController);
router.get("/competencies/:id/evidence", getCompetencyEvidenceController);
router.get("/competencies/:id/capstone", getCapstoneWorkflowController);

// Verifiable Skill Badges (Phase 40)
router.get("/badges/my", getMyBadgesController);
router.post("/badges/claim", claimBadgeController);
router.post("/badges/:badgeId/revoke", revokeBadgeController);
router.get("/badges/verify/:badgeId", verifyPublicBadgeController);

// Compatibility aliases for legacy/variant route patterns
router.get("/gaps", getUserGaps);
router.get("/gaps/role/:role", getRoleGaps);
router.get("/recommendations", getRecommendations);
router.get("/roadmap", getRecommendationRoadmap);

export default router;
