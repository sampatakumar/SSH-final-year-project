import { Router } from "express";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import {
  getUserSettings,
  updateUserSettings,
} from "../controllers/settings.controller.js";

const router = Router();

router.get("/", verifyFirebaseToken, getUserSettings);
router.patch("/", verifyFirebaseToken, updateUserSettings);

export default router;
