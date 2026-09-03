import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getTaskById,
  getUserSubmissionHistory,
  listTasks,
  runCodeSample,
  submitSolution,
} from "../controllers/coding.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

const executionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many code execution requests. Please wait a moment." },
});

// Public endpoints
router.get("/tasks", listTasks);
router.get("/tasks/:taskId", getTaskById);
router.post("/run", executionLimiter, runCodeSample);

// Authenticated endpoints
router.post("/submit", verifyFirebaseToken, executionLimiter, submitSolution);
router.get("/submissions", verifyFirebaseToken, getUserSubmissionHistory);

export default router;
