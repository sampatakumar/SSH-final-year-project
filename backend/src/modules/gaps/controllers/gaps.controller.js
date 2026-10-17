import { analyzeUserGaps, compareUserRoles } from "../services/skillGap.service.js";
import { TARGET_ROLES, ROLE_REQUIREMENTS } from "../benchmarks/roleRequirements.js";
import { INITIAL_CAREER_ROLES } from "../../academic/constants/academicCatalog.js";
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
  const benchmarkRoles = Object.entries(ROLE_REQUIREMENTS).map(([key, config]) => ({
    key,
    roleName: config.roleName,
    description: config.description,
    coreSkillsCount: config.coreSkills.length,
    recommendedSkillsCount: config.recommendedSkills.length,
    hasValidatedBenchmark: true,
    benchmarkStatus: "validated",
  }));

  const catalogRoles = INITIAL_CAREER_ROLES.filter(
    (cr) => !benchmarkRoles.some((r) => r.roleName.toLowerCase() === cr.title.toLowerCase())
  ).map((cr) => ({
    key: cr.title,
    roleName: cr.title,
    description: cr.description,
    category: cr.category,
    coreSkillsCount: cr.coreSkills.length,
    recommendedSkillsCount: 0,
    hasValidatedBenchmark: false,
    benchmarkStatus: "benchmark_pending",
  }));

  return res.status(200).json(
    new ApiResponse(200, { roles: [...benchmarkRoles, ...catalogRoles] }, "Available benchmark roles")
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

/**
 * POST /api/v1/gaps/compare or GET /api/v1/gaps/compare
 * Compare skill gaps and shared competencies across multiple target roles.
 */
export const compareRolesController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new GapAnalysisError("Authentication required.", 401);
  }

  let requestedRoles = [];
  if (req.body?.roles && Array.isArray(req.body.roles)) {
    requestedRoles = req.body.roles;
  } else if (req.query?.roles) {
    requestedRoles = String(req.query.roles)
      .split(",")
      .map((r) => decodeURIComponent(r.trim()))
      .filter(Boolean);
  } else if (Array.isArray(req.user.targetRoles) && req.user.targetRoles.length > 0) {
    requestedRoles = req.user.targetRoles;
  } else if (req.user.targetRole) {
    requestedRoles = [req.user.targetRole];
  }

  const comparison = await compareUserRoles(req.user, requestedRoles);

  return res.status(200).json(
    new ApiResponse(200, { comparison }, "Multi-role skill comparison completed")
  );
});

