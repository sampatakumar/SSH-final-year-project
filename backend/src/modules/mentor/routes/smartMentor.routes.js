import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import {
  getMentorContext,
  refreshMentorContext,
  handleMentorChat,
  handleMentorChatStream,
  getMentorHistory,
  clearMentorHistory,
} from "../controllers/smartMentor.controller.js";

const router = Router();

const mentorLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many mentor requests. Please wait a moment before sending more messages.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/context", verifyFirebaseToken, getMentorContext);
router.post("/refresh-context", verifyFirebaseToken, refreshMentorContext);
router.post("/chat", verifyFirebaseToken, mentorLimiter, handleMentorChat);
router.post("/chat/stream", verifyFirebaseToken, mentorLimiter, handleMentorChatStream);
router.get("/history", verifyFirebaseToken, getMentorHistory);
router.delete("/history", verifyFirebaseToken, clearMentorHistory);

export default router;
