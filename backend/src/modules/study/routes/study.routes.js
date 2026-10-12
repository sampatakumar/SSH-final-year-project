import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  getStudyProfile,
  getTopicSyllabus,
  generateQuiz,
  submitQuiz,
  getFlashcards,
  reviewFlashcard,
  getRevisionPlan,
} from "../controllers/study.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

const studyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: "Too many study requests. Please try again later." },
});

// All study endpoints enforce canonical authenticated student identity
router.use(verifyFirebaseToken);

router.get("/profile", studyLimiter, getStudyProfile);
router.get("/syllabus", studyLimiter, getTopicSyllabus);
router.post("/quiz/generate", studyLimiter, generateQuiz);
router.post("/quiz/submit", studyLimiter, submitQuiz);
router.get("/flashcards", studyLimiter, getFlashcards);
router.post("/flashcards/review", studyLimiter, reviewFlashcard);
router.get("/revision-plan", studyLimiter, getRevisionPlan);

export default router;
