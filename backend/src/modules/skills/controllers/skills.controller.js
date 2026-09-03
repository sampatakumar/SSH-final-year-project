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
