import { Router } from "express";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import {
  getIntegrations,
  getGitHubStatus,
  connectGitHub,
  handleGitHubCallback,
  syncGitHub,
  disconnectGitHub,
} from "../controllers/integrations.controller.js";

const router = Router();

// Callback does not require JWT middleware since it is called by browser redirect from GitHub OAuth
router.get("/github/callback", handleGitHubCallback);

// Authenticated integration routes
router.get("/", verifyFirebaseToken, getIntegrations);
router.get("/github", verifyFirebaseToken, getGitHubStatus);
router.get("/github/connect", verifyFirebaseToken, connectGitHub);
router.post("/github/sync", verifyFirebaseToken, syncGitHub);
router.delete("/github", verifyFirebaseToken, disconnectGitHub);

export default router;
