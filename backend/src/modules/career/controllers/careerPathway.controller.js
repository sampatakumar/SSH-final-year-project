import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { careerPathwayService } from "../services/careerPathway.service.js";

/**
 * GET /api/v1/career/pathways/roles
 * List canonical multi-branch career roles with branch relevance.
 */
export const getCareerRolesController = asyncHandler(async (req, res) => {
  const { branch, roleFamily, search, includeCrossDisciplinary } = req.query;

  // Use explicitly requested branch or fallback to authenticated user's profile branch
  const effectiveBranch = branch || req.user?.academic?.branch || req.user?.academicBranch || req.user?.branch || null;

  const roles = careerPathwayService.getCareerRoles({
    branch: effectiveBranch,
    roleFamily: typeof roleFamily === "string" ? roleFamily : null,
    search: typeof search === "string" ? search : null,
    includeCrossDisciplinary: includeCrossDisciplinary !== "false",
  });

  return res.status(200).json(
    new ApiResponse(200, { roles, branch: effectiveBranch, total: roles.length }, "Career roles retrieved successfully")
  );
});

/**
 * GET /api/v1/career/pathways/roles/:roleId
 * Get single canonical career role by ID.
 */
export const getRoleByIdController = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const role = careerPathwayService.getRoleById(roleId);

  return res.status(200).json(
    new ApiResponse(200, { role }, "Career role details retrieved successfully")
  );
});

/**
 * GET /api/v1/career/pathways/readiness/:roleId
 * Evaluate authenticated student's evidence-based readiness for a target role.
 */
export const evaluateRoleReadinessController = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const ownerId = req.user?._id;

  if (!ownerId) {
    throw new ApiError(401, "Authentication required to evaluate role readiness.");
  }

  const diagnosis = await careerPathwayService.evaluateRoleReadiness(ownerId, roleId);

  return res.status(200).json(
    new ApiResponse(200, diagnosis, "Role readiness evaluated successfully")
  );
});

/**
 * POST /api/v1/career/pathways/compare
 * Side-by-side comparison between two career roles for the student.
 */
export const compareRolesController = asyncHandler(async (req, res) => {
  const { roleId1, roleId2 } = req.body;
  const ownerId = req.user?._id;

  if (!ownerId) {
    throw new ApiError(401, "Authentication required to compare career roles.");
  }
  if (!roleId1 || !roleId2) {
    throw new ApiError(400, "Both roleId1 and roleId2 are required.");
  }

  const comparison = await careerPathwayService.compareRoles(ownerId, roleId1, roleId2);

  return res.status(200).json(
    new ApiResponse(200, comparison, "Career roles compared successfully")
  );
});

/**
 * GET /api/v1/career/pathways/preparation-plan/:roleId
 * Generate prioritized, deduplicated preparation plan connecting to SSH platform activities.
 */
export const generateRolePreparationPlanController = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const ownerId = req.user?._id;

  if (!ownerId) {
    throw new ApiError(401, "Authentication required to generate preparation plan.");
  }

  const plan = await careerPathwayService.generateRolePreparationPlan(ownerId, roleId);

  return res.status(200).json(
    new ApiResponse(200, plan, "Career preparation plan generated successfully")
  );
});
