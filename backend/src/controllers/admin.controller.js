import { asyncHandler } from "../core/errors/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Analytics } from "../models/analytics.models.js";
import {
  listAdminUsers,
  getAdminUserDetails,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../modules/admin/services/adminUser.service.js";
import {
  checkCatalogIntegrity,
  safeDeleteDegree,
  safeDeleteBranch,
  safeDeleteCareerRole,
} from "../modules/admin/services/adminCatalog.service.js";

/**
 * GET /api/v1/admin/analytics
 */
export const getAdminAnalyticsController = asyncHandler(async (req, res) => {
  const analytics = await Analytics.find()
    .sort({ date: -1 })
    .limit(14)
    .lean();

  return res.status(200).json({
    success: true,
    data: analytics.reverse(),
  });
});

/**
 * GET /api/v1/admin/users
 */
export const listAdminUsersController = asyncHandler(async (req, res) => {
  const data = await listAdminUsers(req.query);
  return res.status(200).json(
    new ApiResponse(200, data, "Admin users retrieved successfully")
  );
});

/**
 * GET /api/v1/admin/users/:userId
 */
export const getAdminUserDetailsController = asyncHandler(async (req, res) => {
  const data = await getAdminUserDetails(req.params.userId);
  return res.status(200).json(
    new ApiResponse(200, data, "User details retrieved successfully")
  );
});

/**
 * PATCH /api/v1/admin/users/:userId/role
 */
export const updateAdminUserRoleController = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const data = await updateAdminUserRole(req.user?._id, req.params.userId, role);
  return res.status(200).json(
    new ApiResponse(200, data, "User role updated successfully")
  );
});

/**
 * PATCH /api/v1/admin/users/:userId/status
 */
export const updateAdminUserStatusController = asyncHandler(async (req, res) => {
  const data = await updateAdminUserStatus(req.user?._id, req.params.userId, req.body);
  return res.status(200).json(
    new ApiResponse(200, data, "User account status updated successfully")
  );
});

/**
 * GET /api/v1/admin/catalog/integrity
 */
export const getCatalogIntegrityController = asyncHandler(async (req, res) => {
  const report = await checkCatalogIntegrity();
  return res.status(200).json(
    new ApiResponse(200, report, "Catalog integrity report generated successfully")
  );
});

/**
 * DELETE /api/v1/admin/catalog/degrees/:slug
 */
export const safeDeleteDegreeController = asyncHandler(async (req, res) => {
  const result = await safeDeleteDegree(req.params.slug);
  return res.status(200).json(
    new ApiResponse(200, result, result.message)
  );
});

/**
 * DELETE /api/v1/admin/catalog/branches/:slug
 */
export const safeDeleteBranchController = asyncHandler(async (req, res) => {
  const result = await safeDeleteBranch(req.params.slug);
  return res.status(200).json(
    new ApiResponse(200, result, result.message)
  );
});

/**
 * DELETE /api/v1/admin/catalog/career-roles/:slug
 */
export const safeDeleteCareerRoleController = asyncHandler(async (req, res) => {
  const result = await safeDeleteCareerRole(req.params.slug);
  return res.status(200).json(
    new ApiResponse(200, result, result.message)
  );
});
