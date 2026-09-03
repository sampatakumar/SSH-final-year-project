import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  analyzeProfile,
  compareProfiles,
  getAIInsights,
  getLatestUserAnalysis,
  getSkillEvidence,
  getCareerMentorDashboard,
  askCareerMentor,
  getMentorActionPlan,
  getMentorGitHubPlan,
  getMentorCareerPath,
  getRepositoryQualityDetails,
  generateProjectReadme,
} from "../controllers/github.controller.js";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";

const router = Router();

const githubLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: "Too many GitHub analysis requests. Please try again later." },
});

// Profile Analysis (public or with optional/required auth)
router.get("/profile/:username", githubLimiter, analyzeProfile);
router.post("/analyze", githubLimiter, analyzeProfile);
router.post("/ai/insights", githubLimiter, getAIInsights);
router.get("/compare", githubLimiter, compareProfiles);
router.get("/evidence/:username", githubLimiter, getSkillEvidence);
router.get("/evidence", githubLimiter, getSkillEvidence);

// Personal Career Mentor Routes
router.get("/mentor/:username", githubLimiter, getCareerMentorDashboard);
router.get("/mentor", githubLimiter, getCareerMentorDashboard);
router.post("/mentor/:username/ask", githubLimiter, askCareerMentor);
router.post("/mentor/ask", githubLimiter, askCareerMentor);
router.get("/mentor/:username/action-plan", githubLimiter, getMentorActionPlan);
router.get("/mentor/:username/github-plan", githubLimiter, getMentorGitHubPlan);
router.get("/mentor/:username/career-path", githubLimiter, getMentorCareerPath);
router.get("/mentor/:username/repository/:repoName", githubLimiter, getRepositoryQualityDetails);
router.post("/mentor/:username/repository/:repoName/generate-readme", githubLimiter, generateProjectReadme);
router.post("/mentor/readme", githubLimiter, generateProjectReadme);

// Authenticated user-specific analysis
router.get("/latest", verifyFirebaseToken, getLatestUserAnalysis);

export default router;
