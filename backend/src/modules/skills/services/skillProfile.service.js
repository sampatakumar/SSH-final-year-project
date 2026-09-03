import { extractResumeEvidence } from "../../resume/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../../github/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../../coding/adapters/codingEvidenceAdapter.js";
import { validateSkillEvidencePackage } from "../../../shared/evidence/skillEvidenceContract.js";
import { evaluateEvidencePackages } from "./evaluation.engine.js";
import { SkillProfile } from "../models/skillProfile.models.js";
import { GitHubAnalysis } from "../../github/models/githubAnalysis.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { SkillEvaluationError } from "../../../core/errors/ApiError.js";

/**
 * Execute full skill evaluation pipeline for a user.
 *
 * @param {object} user - Authenticated user mongoose document or object
 * @returns {Promise<object>} Result containing evaluated skill profile and metrics
 */
export async function evaluateUserProfile(user) {
  if (!user || !user._id) {
    throw new SkillEvaluationError("Invalid user supplied for skill evaluation", 400);
  }

  const userId = user._id.toString();
  const targetRole = user.targetRole || "Full Stack Developer";

  // 1. Gather Resume Evidence
  const rawResumeEvidence = extractResumeEvidence({
    userId,
    userProfile: user.toObject ? user.toObject() : user,
  });
  const resumeValidation = validateSkillEvidencePackage(rawResumeEvidence);
  if (!resumeValidation.valid) {
    throw new SkillEvaluationError(`Invalid resume evidence package: ${resumeValidation.errors.join(", ")}`, 400);
  }

  const packages = [rawResumeEvidence];

  // 2. Gather GitHub Evidence (if user has analyzed GitHub profile)
  const ghRecord = await GitHubAnalysis.findOne({ owner: user._id }).sort({ updatedAt: -1 });
  if (ghRecord) {
    const rawGhEvidence = extractGitHubEvidence({
      userId,
      githubData: ghRecord.toObject ? ghRecord.toObject() : ghRecord,
    });
    const ghValidation = validateSkillEvidencePackage(rawGhEvidence);
    if (ghValidation.valid) {
      packages.push(rawGhEvidence);
    }
  }

  // 3. Gather Coding Evidence (from user's submission history)
  const codingSubs = await CodingSubmission.find({ owner: user._id }).sort({ submittedAt: -1 }).limit(100);
  if (codingSubs && codingSubs.length > 0) {
    const rawCodingEvidence = extractCodingEvidence({
      userId,
      submissions: codingSubs,
    });
    const codingValidation = validateSkillEvidencePackage(rawCodingEvidence);
    if (codingValidation.valid) {
      packages.push(rawCodingEvidence);
    }
  }

  // 4. Run deterministic Evaluation Engine
  const evaluation = evaluateEvidencePackages(packages);

  // 5. Build evidence summary
  const evidenceSummary = {
    resumeEvidenceCount: rawResumeEvidence.skills?.length || 0,
    githubReposAnalyzed: ghRecord?.repositories?.length || 0,
    codingProblemsSolved: codingSubs.filter((s) => s.status === "passed").length,
    totalSubmissions: codingSubs.length,
  };

  // 6. Upsert SkillProfile in MongoDB
  const savedProfile = await SkillProfile.findOneAndUpdate(
    { owner: user._id },
    {
      owner: user._id,
      targetRole,
      overallReadinessScore: evaluation.overallReadinessScore,
      skills: evaluation.skills.map((s) => ({
        skill: s.skill,
        canonicalName: s.canonicalName,
        category: s.category,
        score: s.score,
        level: s.level,
        confidence: s.confidence,
        sources: s.sources,
        evidence: s.evidence || [],
        explanation: s.explanation,
        lastAssessedAt: new Date(s.lastAssessedAt || Date.now()),
      })),
      evidenceSummary,
      evaluationVersion: evaluation.evaluationVersion,
      lastEvaluatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    profile: savedProfile,
    evaluation,
    evidenceSummary,
  };
}

/**
 * Retrieve current Skill Profile for user, generating on-the-fly if not evaluated yet.
 *
 * @param {object} user - Authenticated user
 * @returns {Promise<object>} SkillProfile document
 */
export async function getOrCreateSkillProfile(user) {
  if (!user || !user._id) {
    throw new SkillEvaluationError("Invalid user identity", 401);
  }

  let profile = await SkillProfile.findOne({ owner: user._id });
  if (!profile) {
    const result = await evaluateUserProfile(user);
    profile = result.profile;
  }
  return profile;
}
