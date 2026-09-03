import { Router } from "express";
import {
  firebaseSignIn,
  getCurrentUser,
  updateCurrentUser,
} from "./auth.controller.js";
import { verifyFirebaseToken } from "./auth.middleware.js";
import {
  connectGitHub,
  handleGitHubCallback,
} from "../../modules/settings/controllers/integrations.controller.js";

const router = Router();

// GitHub OAuth routes under /api/v1/auth
router.get("/github/callback", handleGitHubCallback);
router.get("/github", verifyFirebaseToken, connectGitHub);
router.get("/github/connect", verifyFirebaseToken, connectGitHub);

router.post("/firebase/sign-in", verifyFirebaseToken, firebaseSignIn);
router.get("/me", verifyFirebaseToken, getCurrentUser);
router.patch("/me", verifyFirebaseToken, updateCurrentUser);

export default router;
