import { z } from "zod";

/**
 * Domain-Specific AI Contracts & Schemas
 * Used for strict schema validation, repair, and normalization.
 */

// Helper transformers
const safeString = z.union([z.string(), z.null(), z.undefined()]).transform((val) => (val || "").trim());
const safeStringArray = z
  .union([z.array(z.string()), z.null(), z.undefined()])
  .transform((val) => {
    if (!Array.isArray(val)) return [];
    return Array.from(new Set(val.map((v) => (v || "").toString().trim()).filter(Boolean)));
  });

const safeScore = (min = 0, max = 100, defaultVal = 70) =>
  z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
      const num = Number(val);
      if (Number.isFinite(num)) {
        return Math.max(min, Math.min(max, Math.round(num)));
      }
      return defaultVal;
    });

/**
 * Contract A: Professional Resume Summary
 */
export const ProfessionalSummarySchema = z.object({
  summary: safeString,
  strengths: safeStringArray,
  keywords: safeStringArray,
});

/**
 * Contract B: Resume Bullet Enhancement
 * Note: metricsAdded must only contain metrics actually grounded in the source input.
 */
export const ResumeBulletEnhancementSchema = z.object({
  original: safeString,
  improved: safeString,
  actionVerb: safeString,
  skills: safeStringArray,
  metricsAdded: safeStringArray,
});

/**
 * Contract C: ATS Analysis
 */
export const AtsAnalysisSchema = z.object({
  score: safeScore(0, 100, 75),
  strengths: safeStringArray,
  weaknesses: safeStringArray,
  missingKeywords: safeStringArray,
  recommendations: safeStringArray,
});

/**
 * Contract D: GitHub Professional Developer Review
 */
export const GitHubProfessionalReviewSchema = z.object({
  overallScore: safeScore(0, 100, 80),
  specialization: safeString,
  technicalStrengths: safeStringArray,
  engineeringQuality: safeStringArray,
  documentationQuality: safeStringArray,
  projectQuality: safeStringArray,
  careerOpportunities: safeStringArray,
  recommendations: safeStringArray,
  recommendedTechnologies: safeStringArray,
});

/**
 * Contract E: Career Mentor
 */
export const CareerMentorSchema = z.object({
  careerSummary: safeString,
  currentLevel: safeString,
  strengths: safeStringArray,
  weaknesses: safeStringArray,
  priorityActions: safeStringArray,
  recommendedProjects: safeStringArray,
  recommendedSkills: safeStringArray,
  careerPath: safeStringArray,
  next30Days: safeStringArray,
  next90Days: safeStringArray,
});

/**
 * Contract F: Learning Roadmap
 */
export const LearningRoadmapSchema = z.object({
  targetRole: safeString,
  estimatedWeeks: safeScore(1, 52, 12),
  phases: z
    .array(
      z.object({
        phaseNumber: safeScore(1, 10, 1),
        title: safeString,
        focusSkills: safeStringArray,
        milestones: safeStringArray,
        practicalProject: safeString,
        estimatedHours: safeScore(1, 100, 15),
      })
    )
    .default([]),
  keyOutcomes: safeStringArray,
});

/**
 * Contract G: Skill Gap Reasoning
 */
export const SkillGapReasoningSchema = z.object({
  targetRole: safeString,
  readinessPercentage: safeScore(0, 100, 60),
  criticalGaps: z
    .array(
      z.object({
        skill: safeString,
        importance: safeString,
        reason: safeString,
        recommendedAction: safeString,
      })
    )
    .default([]),
  highGaps: safeStringArray,
  growthTrajectory: safeString,
});

/**
 * Validate and normalize AI output against a target schema with 1 controlled repair attempt.
 */
export function validateAndNormalizeAIOutput(rawOutput, schema, fallback = {}) {
  // If rawOutput is already parsed object
  let parsed = rawOutput;

  if (typeof rawOutput === "string") {
    try {
      let cleaned = rawOutput.trim();
      // Remove code fences
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      // Extract json object if surrounded by chat chatter
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn("[aiContracts] Initial JSON.parse failed. Attempting safe recovery.");
      parsed = null;
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return {
      success: false,
      data: fallback,
      repaired: false,
      error: "Malformed JSON output from AI model",
    };
  }

  // Schema Safe Parse
  const validation = schema.safeParse(parsed);
  if (validation.success) {
    return {
      success: true,
      data: validation.data,
      repaired: false,
      error: null,
    };
  }

  // Attempt 1 controlled schema normalization repair
  try {
    const repairedObj = { ...fallback, ...parsed };
    const repairedValidation = schema.safeParse(repairedObj);
    if (repairedValidation.success) {
      return {
        success: true,
        data: repairedValidation.data,
        repaired: true,
        error: null,
      };
    }
  } catch (repairErr) {
    console.warn("[aiContracts] Schema repair attempt failed:", repairErr.message);
  }

  return {
    success: false,
    data: fallback,
    repaired: false,
    error: `Schema validation failed: ${validation.error.message}`,
  };
}
