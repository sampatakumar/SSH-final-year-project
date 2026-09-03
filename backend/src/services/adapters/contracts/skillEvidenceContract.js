import { z } from "zod";

export const EVIDENCE_CONTRACT_VERSION = "1.0.0";

export const EVIDENCE_SOURCES = {
  RESUME: "resume",
  GITHUB: "github",
  CODING: "coding",
};

export const EVIDENCE_TYPES = {
  CLAIMED: "claimed", // Self-reported in resume / portfolio text
  OBSERVED_PROJECT: "observed_project", // Detected in public GitHub repositories / commit activity
  PRACTICAL_ASSESSMENT: "practical_assessment", // Verified through isolated sandbox test suite execution
};

/**
 * Zod schema for single skill item in an evidence package.
 */
export const skillEvidenceItemSchema = z.object({
  skill: z.string().min(1),
  canonicalName: z.string().min(1),
  category: z.string().default("Other Technical Skills"),
  evidenceType: z.enum([
    EVIDENCE_TYPES.CLAIMED,
    EVIDENCE_TYPES.OBSERVED_PROJECT,
    EVIDENCE_TYPES.PRACTICAL_ASSESSMENT,
  ]),
  confidence: z.number().min(0).max(1),
  signals: z.record(z.any()).default({}),
  observations: z.array(z.string()).default([]),
});

/**
 * Zod schema for full standardized Skill Evidence Package.
 */
export const skillEvidencePackageSchema = z.object({
  contractVersion: z.literal(EVIDENCE_CONTRACT_VERSION).default(EVIDENCE_CONTRACT_VERSION),
  source: z.enum([EVIDENCE_SOURCES.RESUME, EVIDENCE_SOURCES.GITHUB, EVIDENCE_SOURCES.CODING]),
  userId: z.string().min(1, "userId must be a non-empty string representing canonical user"),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
  skills: z.array(skillEvidenceItemSchema),
  metadata: z.record(z.any()).default({}),
});

/**
 * Validate a candidate object against the Skill Evidence Contract.
 *
 * @param {object} candidate
 * @returns {{ isValid: boolean, data?: object, errors?: string[] }}
 */
export function validateSkillEvidence(candidate) {
  const result = skillEvidencePackageSchema.safeParse(candidate);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  return {
    isValid: true,
    data: result.data,
  };
}

/**
 * Factory helper to construct a valid, standardized Skill Evidence Package.
 */
export function createSkillEvidencePackage({
  source,
  userId,
  skills = [],
  metadata = {},
  timestamp = new Date().toISOString(),
}) {
  const rawPackage = {
    contractVersion: EVIDENCE_CONTRACT_VERSION,
    source,
    userId: String(userId),
    timestamp,
    skills,
    metadata,
  };

  const validation = validateSkillEvidence(rawPackage);
  if (!validation.isValid) {
    throw new Error(`Invalid Skill Evidence Package created:\n${validation.errors.join("\n")}`);
  }

  return validation.data;
}
