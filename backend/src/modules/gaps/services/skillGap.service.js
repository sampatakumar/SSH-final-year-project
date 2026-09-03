import { ROLE_REQUIREMENTS, TARGET_ROLES } from "../benchmarks/roleRequirements.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { getOrCreateSkillProfile } from "../../skills/services/skillProfile.service.js";
import { GapAnalysisError } from "../../../core/errors/ApiError.js";

export const GAP_STATUSES = {
  MISSING: "Missing",
  WEAK: "Weak / Action Required",
  DEVELOPING: "Developing / Limited Evidence",
  MET: "Met Requirement",
};

export const GAP_PRIORITIES = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NONE: "None",
};

const PROFICIENCY_RANK = {
  "Limited Evidence": 1,
  "Developing": 2,
  "Competent": 3,
  "Proficient": 4,
  "Strong Evidence": 5,
};

/**
 * Compare evaluated user skills against standard target role expectations.
 *
 * @param {Array<object>} evaluatedSkills - List of evaluated skill objects from Skill Profile
 * @param {string} [targetRole="Full Stack Developer"] - Desired career track
 * @returns {object} Skill gap analysis breakdown
 */
export function analyzeSkillGaps(evaluatedSkills = [], targetRole = TARGET_ROLES.FULL_STACK_DEVELOPER) {
  const roleConfig = ROLE_REQUIREMENTS[targetRole] || ROLE_REQUIREMENTS[TARGET_ROLES.FULL_STACK_DEVELOPER];
  if (!roleConfig) {
    throw new GapAnalysisError(`Invalid or unsupported target role: ${targetRole}`, 400);
  }

  // Index evaluated user skills by canonical lower-case name
  const userSkillMap = new Map();
  for (const s of evaluatedSkills) {
    const canonical = normalizeSkill(s.skill || s.canonicalName);
    if (canonical) {
      userSkillMap.set(canonical.toLowerCase(), s);
    }
  }

  const allRequirements = [
    ...(roleConfig.coreSkills || []).map((req) => ({ ...req, isCore: true })),
    ...(roleConfig.recommendedSkills || []).map((req) => ({
      ...req,
      isCore: false,
      minProficiency: req.minProficiency || "Competent",
    })),
  ];

  const gaps = [];
  const metSkills = [];

  for (const req of allRequirements) {
    const canonicalReq = normalizeSkill(req.skill);
    const key = canonicalReq.toLowerCase();
    const userSkill = userSkillMap.get(key);

    const minRequired = req.minProficiency || "Competent";
    const requiredRank = PROFICIENCY_RANK[minRequired] || 3;

    if (!userSkill) {
      // 1. Missing: No evidence found from any source
      gaps.push({
        skill: canonicalReq,
        canonicalName: canonicalReq,
        category: getSkillCategory(canonicalReq),
        status: GAP_STATUSES.MISSING,
        priority: req.importance === "critical" ? GAP_PRIORITIES.CRITICAL : req.isCore ? GAP_PRIORITIES.HIGH : GAP_PRIORITIES.MEDIUM,
        isCore: req.isCore,
        currentScore: 0,
        currentLevel: "None",
        requiredLevel: minRequired,
        reason: `Target role "${roleConfig.roleName}" requires ${canonicalReq}, but no evidence was detected across Resume, GitHub, or Coding submissions.`,
      });
    } else {
      const userRank = PROFICIENCY_RANK[userSkill.level] || 1;

      if (userRank < requiredRank) {
        // 2. Skill present but below role expectation
        const isWeak = userSkill.score < 40;
        const status = isWeak ? GAP_STATUSES.WEAK : GAP_STATUSES.DEVELOPING;
        let priority = GAP_PRIORITIES.MEDIUM;

        if (req.importance === "critical") {
          priority = isWeak ? GAP_PRIORITIES.CRITICAL : GAP_PRIORITIES.HIGH;
        } else if (req.isCore) {
          priority = isWeak ? GAP_PRIORITIES.HIGH : GAP_PRIORITIES.MEDIUM;
        } else {
          priority = GAP_PRIORITIES.LOW;
        }

        gaps.push({
          skill: canonicalReq,
          canonicalName: canonicalReq,
          category: userSkill.category || getSkillCategory(canonicalReq),
          status,
          priority,
          isCore: req.isCore,
          currentScore: userSkill.score,
          currentLevel: userSkill.level,
          requiredLevel: minRequired,
          reason: `Current proficiency is "${userSkill.level}" (${userSkill.score}/100), but "${roleConfig.roleName}" recommends "${minRequired}". Additional verified projects or coding tasks needed.`,
        });
      } else {
        // 3. Met Requirement
        metSkills.push({
          skill: canonicalReq,
          canonicalName: canonicalReq,
          category: userSkill.category || getSkillCategory(canonicalReq),
          status: GAP_STATUSES.MET,
          priority: GAP_PRIORITIES.NONE,
          isCore: req.isCore,
          currentScore: userSkill.score,
          currentLevel: userSkill.level,
          requiredLevel: minRequired,
        });
      }
    }
  }

  // Sort gaps: Critical -> High -> Medium -> Low
  const priorityOrder = {
    [GAP_PRIORITIES.CRITICAL]: 0,
    [GAP_PRIORITIES.HIGH]: 1,
    [GAP_PRIORITIES.MEDIUM]: 2,
    [GAP_PRIORITIES.LOW]: 3,
    [GAP_PRIORITIES.NONE]: 4,
  };

  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const totalEvaluatedReqs = allRequirements.length;
  const roleMatchPercentage = totalEvaluatedReqs > 0
    ? Math.round((metSkills.length / totalEvaluatedReqs) * 100)
    : 0;

  return {
    targetRole: roleConfig.roleName,
    roleDescription: roleConfig.description,
    roleMatchPercentage,
    totalRequiredSkills: allRequirements.length,
    metSkillsCount: metSkills.length,
    gapsCount: gaps.length,
    gaps,
    metSkills,
  };
}

/**
 * Execute gap analysis for authenticated user.
 *
 * @param {object} user - Authenticated user object
 * @param {string} [requestedRole] - Optional target role override
 * @returns {Promise<object>} Gap analysis report
 */
export async function analyzeUserGaps(user, requestedRole = null) {
  if (!user || !user._id) {
    throw new GapAnalysisError("Authentication required for gap analysis", 401);
  }

  const targetRole = requestedRole || user.targetRole || TARGET_ROLES.FULL_STACK_DEVELOPER;
  const profile = await getOrCreateSkillProfile(user);

  if (!profile || !Array.isArray(profile.skills)) {
    throw new GapAnalysisError("Skill profile could not be loaded for gap analysis", 500);
  }

  const gapAnalysis = analyzeSkillGaps(profile.skills, targetRole);

  // Update skillGaps inside SkillProfile
  await SkillProfile.updateOne(
    { owner: user._id },
    {
      $set: {
        targetRole,
        skillGaps: gapAnalysis.gaps.map((g) => ({
          skill: g.skill,
          canonicalName: g.canonicalName,
          category: g.category,
          priority: g.priority,
          reason: g.reason,
          targetScore: 75,
          currentScore: g.currentScore,
          missingFrom: g.status === GAP_STATUSES.MISSING ? ["resume", "github", "coding"] : [],
        })),
      },
    }
  );

  return gapAnalysis;
}
