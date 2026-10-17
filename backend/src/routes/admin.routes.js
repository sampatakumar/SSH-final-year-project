import { Router } from "express";
import { ensureAdmin } from "../core/middleware/admin.middleware.js";
import {
  getAdminAnalyticsController,
  listAdminUsersController,
  getAdminUserDetailsController,
  updateAdminUserRoleController,
  updateAdminUserStatusController,
  getCatalogIntegrityController,
  safeDeleteDegreeController,
  safeDeleteBranchController,
  safeDeleteCareerRoleController,
} from "../controllers/admin.controller.js";

const router = Router();

// Authoritative server-side admin check enforced on all admin routes
router.use(ensureAdmin);

// System Analytics
router.get("/analytics", getAdminAnalyticsController);

// User Management
router.get("/users", listAdminUsersController);
router.get("/users/:userId", getAdminUserDetailsController);
router.patch("/users/:userId/role", updateAdminUserRoleController);
router.patch("/users/:userId/status", updateAdminUserStatusController);

// Academic & Career Catalog Administration
router.get("/catalog/integrity", getCatalogIntegrityController);
router.delete("/catalog/degrees/:slug", safeDeleteDegreeController);
router.delete("/catalog/branches/:slug", safeDeleteBranchController);
router.delete("/catalog/career-roles/:slug", safeDeleteCareerRoleController);

export default router;
