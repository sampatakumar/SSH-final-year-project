import { Router } from "express";
import {
  getCareerRolesController,
  getRoleByIdController,
  evaluateRoleReadinessController,
  compareRolesController,
  generateRolePreparationPlanController,
} from "../controllers/careerPathway.controller.js";
import { verifyFirebaseToken, optionalFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

// Public / discovery endpoints (with optional auth to infer user's branch)
router.get("/roles", optionalFirebaseToken, getCareerRolesController);
router.get("/roles/:roleId", getRoleByIdController);

// Authenticated learner endpoints
router.get("/readiness/:roleId", verifyFirebaseToken, evaluateRoleReadinessController);
router.post("/compare", verifyFirebaseToken, compareRolesController);
router.get("/preparation-plan/:roleId", verifyFirebaseToken, generateRolePreparationPlanController);

export default router;
