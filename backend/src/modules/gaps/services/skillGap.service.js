import { ROLE_REQUIREMENTS, TARGET_ROLES } from "../benchmarks/roleRequirements.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { getOrCreateSkillProfile } from "../../skills/services/skillProfile.service.js";
import { GapAnalysisError } from "../../../core/errors/ApiError.js";
import { INITIAL_CAREER_ROLES } from "../../academic/constants/academicCatalog.js";
import { CareerRole } from "../../../core/database/models/careerRole.models.js";

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

function escapeRegex(string) {
  return String(string || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Locate a career role definition from static academic catalog constants or provided catalog doc.
 */
export function findCatalogRoleDefinition(roleIdentifier, catalogRole = null) {
  if (catalogRole && typeof catalogRole === "object" && (catalogRole.title || catalogRole.slug)) {
    return catalogRole;
  }
  if (!roleIdentifier || typeof roleIdentifier !== "string") {
    return null;
  }
  const clean = roleIdentifier.trim().toLowerCase();
  const slugified = clean.replace(/\s+/g, "-");

  return (
    INITIAL_CAREER_ROLES.find(
      (r) =>
        r.slug.toLowerCase() === slugified ||
        r.title.toLowerCase() === clean
    ) || null
  );
}

/**
 * Compare evaluated user skills against target role expectations.
 *
 * 1. Roles with validated benchmarks (e.g. 24 engineering tracks) receive full rubric evaluation.
 * 2. Academic catalog roles without detailed rubrics return a transparent 'benchmark_pending' status based on catalog core skills.
 * 3. Unknown roles return 'unknown_role' without fabricating gaps or falling back to Full Stack Developer.
 *
 * @param {Array<object>} evaluatedSkills - List of evaluated skill objects from Skill Profile
 * @param {string} [targetRole="Full Stack Developer"] - Desired career track
 * @param {object} [options={}] - Optional overrides { catalogRole }
 * @returns {object} Skill gap analysis breakdown
 */
export function analyzeSkillGaps(
  evaluatedSkills = [],
  targetRole = TARGET_ROLES.FULL_STACK_DEVELOPER,
  options = {}
) {
  const roleName = String(targetRole || "").trim();

  // 1. Check validated static rubrics
  let roleConfig = ROLE_REQUIREMENTS[roleName];
  if (!roleConfig) {
    const matchKey = Object.keys(ROLE_REQUIREMENTS).find(
      (k) => k.toLowerCase() === roleName.toLowerCase()
    );
    if (matchKey) {
      roleConfig = ROLE_REQUIREMENTS[matchKey];
    }
  }

  // 2. If validated rubric exists, perform full benchmark evaluation
  if (roleConfig) {
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
      benchmarkStatus: "validated",
      benchmarkPending: false,
      roleMatchPercentage,
      totalRequiredSkills: allRequirements.length,
      metSkillsCount: metSkills.length,
      gapsCount: gaps.length,
      gaps,
      metSkills,
    };
  }

  // 3. Check Academic Catalog for roles without validated detailed rubrics
  const catalogRole = findCatalogRoleDefinition(roleName, options.catalogRole);

  if (catalogRole) {
    const userSkillMap = new Map();
    for (const s of evaluatedSkills) {
      const canonical = normalizeSkill(s.skill || s.canonicalName);
      if (canonical) {
        userSkillMap.set(canonical.toLowerCase(), s);
      }
    }

    const coreSkills = Array.isArray(catalogRole.coreSkills) ? catalogRole.coreSkills : [];
    const gaps = [];
    const metSkills = [];

    for (const skillName of coreSkills) {
      const canonicalReq = normalizeSkill(skillName);
      const key = canonicalReq.toLowerCase();
      let userSkill = userSkillMap.get(key);

      // Support multi-option catalog skills like "Python / C++" or "ROS / ROS 2"
      if (!userSkill && key.includes("/")) {
        const parts = key.split("/").map((p) => normalizeSkill(p.trim()).toLowerCase());
        for (const part of parts) {
          const match = userSkillMap.get(part);
          if (match) {
            userSkill = match;
            break;
          }
        }
      }

      if (!userSkill) {
        gaps.push({
          skill: canonicalReq,
          canonicalName: canonicalReq,
          category: getSkillCategory(canonicalReq),
          status: GAP_STATUSES.MISSING,
          priority: GAP_PRIORITIES.HIGH,
          isCore: true,
          currentScore: 0,
          currentLevel: "None",
          requiredLevel: "Competent",
          reason: `Target role "${catalogRole.title}" lists ${canonicalReq} as a core skill, but no evidence was detected across your verified profiles.`,
        });
      } else {
        const userRank = PROFICIENCY_RANK[userSkill.level] || 1;
        if (userRank < 3) {
          const isWeak = userSkill.score < 40;
          gaps.push({
            skill: canonicalReq,
            canonicalName: canonicalReq,
            category: userSkill.category || getSkillCategory(canonicalReq),
            status: isWeak ? GAP_STATUSES.WEAK : GAP_STATUSES.DEVELOPING,
            priority: isWeak ? GAP_PRIORITIES.HIGH : GAP_PRIORITIES.MEDIUM,
            isCore: true,
            currentScore: userSkill.score,
            currentLevel: userSkill.level,
            requiredLevel: "Competent",
            reason: `Current proficiency is "${userSkill.level}" (${userSkill.score}/100), but "${catalogRole.title}" requires demonstrable competence in ${canonicalReq}.`,
          });
        } else {
          metSkills.push({
            skill: canonicalReq,
            canonicalName: canonicalReq,
            category: userSkill.category || getSkillCategory(canonicalReq),
            status: GAP_STATUSES.MET,
            priority: GAP_PRIORITIES.NONE,
            isCore: true,
            currentScore: userSkill.score,
            currentLevel: userSkill.level,
            requiredLevel: "Competent",
          });
        }
      }
    }

    const priorityOrder = {
      [GAP_PRIORITIES.CRITICAL]: 0,
      [GAP_PRIORITIES.HIGH]: 1,
      [GAP_PRIORITIES.MEDIUM]: 2,
      [GAP_PRIORITIES.LOW]: 3,
      [GAP_PRIORITIES.NONE]: 4,
    };
    gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const totalCoreSkills = coreSkills.length;
    const roleMatchPercentage = totalCoreSkills > 0
      ? Math.round((metSkills.length / totalCoreSkills) * 100)
      : null;

    return {
      targetRole: catalogRole.title,
      roleDescription: catalogRole.description || "Career track defined in academic catalog.",
      benchmarkStatus: "benchmark_pending",
      benchmarkPending: true,
      benchmarkNotice: "Detailed proficiency rubric is currently pending for this career track. Evaluation is based on verified catalog core skills.",
      roleMatchPercentage,
      totalRequiredSkills: totalCoreSkills,
      metSkillsCount: metSkills.length,
      gapsCount: gaps.length,
      gaps,
      metSkills,
    };
  }

  // 4. Unknown role: Not in validated benchmarks AND not in academic catalog
  return {
    targetRole: roleName || "Unknown Role",
    roleDescription: "No industry benchmark or catalog definition available for this role.",
    benchmarkStatus: "unknown_role",
    benchmarkPending: true,
    benchmarkNotice: `Role "${roleName}" is not recognized in standard benchmarks or the academic catalog. Please select a recognized career role.`,
    roleMatchPercentage: null,
    totalRequiredSkills: 0,
    metSkillsCount: 0,
    gapsCount: 0,
    gaps: [],
    metSkills: [],
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

  // Attempt dynamic lookup in CareerRole collection first
  let catalogRole = null;
  try {
    catalogRole = await CareerRole.findOne({
      $or: [
        { title: { $regex: new RegExp(`^${escapeRegex(targetRole)}$`, "i") } },
        { slug: targetRole.toLowerCase().trim().replace(/\s+/g, "-") },
      ],
    }).lean();
  } catch {
    // If DB query fails or disconnected, static catalog will be used
  }

  const gapAnalysis = analyzeSkillGaps(profile.skills, targetRole, { catalogRole });

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

