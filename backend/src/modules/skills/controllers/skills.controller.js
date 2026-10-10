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
