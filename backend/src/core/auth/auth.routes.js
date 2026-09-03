import { Router } from "express";
import {
  firebaseSignIn,
  getCurrentUser,
  updateCurrentUser,
  sendVerificationEmail,
  sendPasswordReset,
} from "./auth.controller.js";
import { verifyFirebaseToken } from "./auth.middleware.js";
import {
  verificationEmailLimiter,
  passwordResetLimiter,
} from "./auth.limiter.js";
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

// Custom Firebase Auth Email endpoints
router.post("/send-verification-email", verificationEmailLimiter, verifyFirebaseToken, sendVerificationEmail);
router.post("/send-password-reset", passwordResetLimiter, sendPasswordReset);

export default router;

