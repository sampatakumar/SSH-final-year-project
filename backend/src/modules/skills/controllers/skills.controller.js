import { evaluateUserProfile, getOrCreateSkillProfile } from "../services/skillProfile.service.js";
import { SkillProfile } from "../models/skillProfile.models.js";
import { SkillEvaluationError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * POST /api/v1/skills/evaluate
 * Trigger fresh evaluation across all connected evidence sources.
 */
export const evaluateSkills = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const result = await evaluateUserProfile(req.user);
  return res.status(200).json(
    new ApiResponse(200, result, "Skill evaluation completed successfully")
  );
});

/**
 * GET /api/v1/skills/profile
 * Get authenticated user's current unified Skill Profile.
 */
export const getSkillProfile = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const profile = await getOrCreateSkillProfile(req.user);

  return res.status(200).json(
    new ApiResponse(200, { profile }, "User skill profile")
  );
});

/**
 * GET /api/v1/skills/history
 * Get authenticated user's evaluation history / timeline.
 */
export const getSkillHistory = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const profile = await SkillProfile.findOne({ owner: req.user._id });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        lastEvaluatedAt: profile?.lastEvaluatedAt || null,
        evaluationVersion: profile?.evaluationVersion || "1.0.0",
        skillsCount: profile?.skills?.length || 0,
        overallReadinessScore: profile?.overallReadinessScore || 0,
      },
      "Skill evaluation history"
    )
  );
});

/**
 * GET /api/v1/skills/adaptive/loop
 * Get complete continuous adaptive skill-development loop state.
 */
export const getAdaptiveLoop = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const { adaptiveSkillLoopService } = await import("../services/adaptive-skill-loop.service.js");
  const loopState = await adaptiveSkillLoopService.getAdaptiveLoopState(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, loopState, "Adaptive skill development loop state")
  );
});

/**
 * POST /api/v1/skills/adaptive/assess
 * Record formative assessment or coding outcome, update mastery, and schedule spaced revision.
 */
export const recordAdaptiveAssessment = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const { adaptiveSkillLoopService } = await import("../services/adaptive-skill-loop.service.js");
  const result = await adaptiveSkillLoopService.recordAdaptiveAssessmentOutcome(
    req.user._id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Adaptive assessment outcome recorded successfully")
  );
});

/**
 * POST /api/v1/skills/learning-loop/activity
 * Record learning activity with idempotency, evidence, and competency validation.
 */
export const recordLearningActivityController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const { learningOutcomeTrackerService } = await import("../services/learningOutcomeTracker.service.js");
  const result = await learningOutcomeTrackerService.recordActivity(req.user._id, req.body);

  return res.status(200).json(
    new ApiResponse(200, result, "Learning activity recorded successfully")
  );
});

/**
 * GET /api/v1/skills/learning-loop/activities
 * Get authenticated student's chronological learning activities.
 */
export const getLearnerActivitiesController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const { learningOutcomeTrackerService } = await import("../services/learningOutcomeTracker.service.js");
  const result = await learningOutcomeTrackerService.getLearnerActivities(req.user._id, req.query);

  return res.status(200).json(
    new ApiResponse(200, result, "Learner activities retrieved successfully")
  );
});

/**
 * GET /api/v1/skills/learning-loop/plan
 * Calculate personalized adaptive learning plan with prerequisite ordering and targeted remediations.
 */
export const getAdaptiveLearningPlanController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const { adaptiveLearningPlanService } = await import("../../recommendations/services/adaptiveLearningPlan.service.js");
  const targetRole = req.query.role || req.user.targetRole || "Full Stack Developer";
  const plan = await adaptiveLearningPlanService.generateAdaptivePlan(req.user._id, targetRole);

  return res.status(200).json(
    new ApiResponse(200, plan, "Adaptive learning plan generated successfully")
  );
});

/**
 * GET /api/v1/skills/learning-loop/compare
 * Compare student readiness and next actions across multiple career roles.
 */
export const compareMultiRolePlansController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new SkillEvaluationError("Authentication required.", 401);
  }

  const { adaptiveLearningPlanService } = await import("../../recommendations/services/adaptiveLearningPlan.service.js");
  const roles = typeof req.query.roles === "string" ? req.query.roles.split(",").map((r) => r.trim()).filter(Boolean) : [];
  const comparison = await adaptiveLearningPlanService.compareMultiRolePlans(req.user._id, roles);

  return res.status(200).json(
    new ApiResponse(200, comparison, "Multi-role progress comparison generated successfully")
  );
});

