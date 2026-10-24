import { Router } from "express";
import {
  getLabCatalogController,
  getLabByIdController,
  submitLabAttemptController,
  getUserLabAttemptsController,
  getAttemptByIdController,
} from "../controllers/practicalLab.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

// Public / Discovery endpoints
router.get("/", getLabCatalogController);

// Protected endpoints requiring student authentication
router.get("/history", verifyFirebaseToken, getUserLabAttemptsController);
router.get("/attempts/:attemptId", verifyFirebaseToken, getAttemptByIdController);
router.post("/:labId/submit", verifyFirebaseToken, submitLabAttemptController);

// Single lab definition
router.get("/:labId", getLabByIdController);

export default router;
