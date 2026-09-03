import { analyzeUserGaps } from "../services/skillGap.service.js";
import { TARGET_ROLES, ROLE_REQUIREMENTS } from "../benchmarks/roleRequirements.js";
import { GapAnalysisError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * GET /api/v1/gaps
 * Retrieve gap analysis for authenticated user's target role.
 */
export const getUserGaps = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new GapAnalysisError("Authentication required.", 401);
  }

  const requestedRole = req.query.role || req.user.targetRole || TARGET_ROLES.FULL_STACK_DEVELOPER;
  const gapAnalysis = await analyzeUserGaps(req.user, requestedRole);

  return res.status(200).json(
    new ApiResponse(200, { gapAnalysis }, "Target role skill gaps")
  );
});

/**
 * POST /api/v1/gaps/analyze
 * Trigger fresh gap analysis against a specified or updated role.
 */
export const analyzeGaps = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new GapAnalysisError("Authentication required.", 401);
  }

  const { targetRole } = req.body || {};
  const gapAnalysis = await analyzeUserGaps(req.user, targetRole);

  return res.status(200).json(
    new ApiResponse(200, { gapAnalysis }, "Gap analysis computed successfully")
  );
});

/**
 * GET /api/v1/gaps/roles
 * List all available benchmark roles.
 */
export const getAvailableRoles = asyncHandler(async (req, res) => {
  const roles = Object.entries(ROLE_REQUIREMENTS).map(([key, config]) => ({
    key,
    roleName: config.roleName,
    description: config.description,
    coreSkillsCount: config.coreSkills.length,
    recommendedSkillsCount: config.recommendedSkills.length,
  }));

  return res.status(200).json(
    new ApiResponse(200, { roles }, "Available benchmark roles")
  );
});

/**
 * GET /api/v1/gaps/:role
 * Get gap analysis for a specific named benchmark role.
 */
export const getRoleGaps = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new GapAnalysisError("Authentication required.", 401);
  }

  const roleParam = decodeURIComponent(req.params.role);
  const gapAnalysis = await analyzeUserGaps(req.user, roleParam);

  return res.status(200).json(
    new ApiResponse(200, { gapAnalysis }, `Skill gaps for ${roleParam}`)
  );
});
