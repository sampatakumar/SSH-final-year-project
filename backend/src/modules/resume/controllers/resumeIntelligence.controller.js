import { z } from "zod";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { Resume } from "../models/resume.models.js";
import {
  serializeResumeToDraftContext,
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
  reviewResumeLanguage,
  analyzeRoleAndJobDescription,
  chatWithResumeCopilot,
} from "../services/resumeIntelligence.service.js";

const resumeDataSchema = z.object({
  name: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().optional().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
  website: z.string().optional().default(""),
  professionalSummary: z.string().optional().default(""),
  education: z.array(z.any()).optional().default([]),
  experience: z.array(z.any()).optional().default([]),
  projects: z.array(z.any()).optional().default([]),
  achievements: z.array(z.any()).optional().default([]),
  skills: z.record(z.any()).optional().default({}),
  skillSections: z.array(z.any()).optional().default([]),
  customSections: z.array(z.any()).optional().default([]),
  config: z.record(z.any()).optional().default({}),
}).passthrough();

/**
 * 1. LIVE RESUME COPILOT CHAT
 * POST /api/v1/ai/resume/copilot-chat
 */
export const copilotChatHandler = asyncHandler(async (req, res) => {
  const schema = z.object({
    resumeData: resumeDataSchema,
    messages: z.array(z.object({ role: z.string(), content: z.string() })).optional().default([]),
    userQuestion: z.string().min(1, "Question or message is required"),
    targetRole: z.string().optional().default(""),
    jobDescription: z.string().optional().default(""),
    githubEvidence: z.any().optional().default(null),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const result = await chatWithResumeCopilot(parsed.data);
  return res.status(200).json(new ApiResponse(200, result, "Resume copilot response generated"));
});

/**
 * 2. RESUME LANGUAGE & GRAMMAR REVIEW
 * POST /api/v1/ai/resume/review-language
 */
export const reviewLanguageHandler = asyncHandler(async (req, res) => {
  const schema = z.object({
    resumeData: resumeDataSchema,
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const result = await reviewResumeLanguage(parsed.data.resumeData);
  return res.status(200).json(new ApiResponse(200, result, "Language review completed"));
});

/**
 * 3. EVALUATE DUAL SCORING (ATS READINESS & QUALITY RATING)
 * POST /api/v1/ai/resume/evaluate-scores
 */
export const evaluateScoresHandler = asyncHandler(async (req, res) => {
  const schema = z.object({
    resumeData: resumeDataSchema,
    targetRole: z.string().optional().default(""),
    jobDescription: z.string().optional().default(""),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { resumeData, targetRole, jobDescription } = parsed.data;

  const atsReadiness = calculateAtsReadinessDeterministic(resumeData);
  const qualityRating = calculateResumeQualityDeterministic(resumeData);
  const roleMatch = analyzeRoleAndJobDescription(resumeData, { targetRole, jobDescription });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        atsReadiness,
        qualityRating,
        roleMatch,
      },
      "Resume evaluation scores calculated"
    )
  );
});

/**
 * 4. TARGET ROLE & JOB DESCRIPTION ANALYSIS
 * POST /api/v1/ai/resume/analyze-role
 */
export const analyzeRoleHandler = asyncHandler(async (req, res) => {
  const schema = z.object({
    resumeData: resumeDataSchema,
    targetRole: z.string().optional().default(""),
    jobDescription: z.string().optional().default(""),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const result = analyzeRoleAndJobDescription(parsed.data.resumeData, {
    targetRole: parsed.data.targetRole,
    jobDescription: parsed.data.jobDescription,
  });

  return res.status(200).json(new ApiResponse(200, result, "Role and job description analysis completed"));
});

/**
 * 5. UPLOADED RESUME ANALYSIS
 * POST /api/v1/ai/resume/analyze-uploaded
 */
export const analyzeUploadedResumeHandler = asyncHandler(async (req, res) => {
  const schema = z.object({
    resumeId: z.string().min(1, "resumeId is required"),
    targetRole: z.string().optional().default(""),
    jobDescription: z.string().optional().default(""),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues.map((i) => i.message).join(", "));
  }

  const { resumeId, targetRole, jobDescription } = parsed.data;

  const resume = await Resume.findOne({ _id: resumeId, owner: req.user._id });
  if (!resume) {
    throw new ApiError(404, "Resume document not found or access denied");
  }

  // Construct structured resumeData representation from extracted profile / content
  const resumeData = {
    name: resume.title || "Uploaded Resume",
    email: "",
    phone: "",
    professionalSummary: resume.content || "",
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], frameworks: [], tools: [] },
  };

  const atsReadiness = calculateAtsReadinessDeterministic(resumeData);
  const qualityRating = calculateResumeQualityDeterministic(resumeData);
  const languageReview = await reviewResumeLanguage(resumeData);
  const roleMatch = analyzeRoleAndJobDescription(resumeData, { targetRole, jobDescription });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resumeId: resume._id,
        title: resume.title,
        atsReadiness,
        qualityRating,
        languageReview,
        roleMatch,
      },
      "Uploaded resume analyzed successfully"
    )
  );
});
