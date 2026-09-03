import { Router } from "express";
import {
  getUserGaps,
  analyzeGaps,
  getAvailableRoles,
  getRoleGaps,
} from "../controllers/gaps.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

// Publicly list supported benchmark roles
router.get("/roles", getAvailableRoles);

// Authenticated gap analysis operations
router.use(verifyFirebaseToken);

router.get("/", getUserGaps);
router.post("/analyze", analyzeGaps);
router.get("/role/:role", getRoleGaps);

export default router;
