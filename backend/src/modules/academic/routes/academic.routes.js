import { Router } from "express";
import {
  getAcademicOptionsController,
  getDegreesController,
  getBranchesController,
  getBranchRolesController,
  getBranchCapabilitiesController,
  getCareerRolesController,
  getCareerRoleBySlugController,
  seedAcademicCatalogController,
  upsertDegreeController,
  upsertBranchController,
  upsertCareerRoleController,
  upsertBranchRoleMappingController,
} from "../controllers/academic.controller.js";
import { ensureAdmin } from "../../../core/middleware/admin.middleware.js";

const router = Router();

// Student / Public read endpoints
router.get("/options", getAcademicOptionsController);
router.get("/degrees", getDegreesController);
router.get("/branches", getBranchesController);
router.get("/branches/:branchSlug/roles", getBranchRolesController);
router.get("/branches/:branchSlug/capabilities", getBranchCapabilitiesController);
router.get("/career-roles", getCareerRolesController);
router.get("/career-roles/:roleSlug", getCareerRoleBySlugController);

// Protected Admin Mutation endpoints
router.post("/seed", ensureAdmin, seedAcademicCatalogController);
router.post("/degrees", ensureAdmin, upsertDegreeController);
router.post("/branches", ensureAdmin, upsertBranchController);
router.post("/career-roles", ensureAdmin, upsertCareerRoleController);
router.post("/branch-roles/map", ensureAdmin, upsertBranchRoleMappingController);

export default router;
