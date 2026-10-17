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

export const ROLE_ALIAS_MAP = {
  frontend: "Frontend Developer",
  "front-end": "Frontend Developer",
  backend: "Backend Developer",
  "back-end": "Backend Developer",
  fullstack: "Full Stack Developer",
  "full-stack": "Full Stack Developer",
  devops: "DevOps Engineer",
  cloud: "Cloud Engineer",
  sre: "Site Reliability Engineer",
  ml: "Machine Learning Engineer",
  ai: "AI Application Developer",
  dsa: "Software Engineer (General / Core CS)",
  swe: "Software Engineer",
  sde: "Software Engineer",
  qa: "QA Automation Engineer",
  testing: "Software Test Engineer",
  cybersecurity: "Cybersecurity Analyst",
  security: "Cybersecurity Analyst",
  data: "Data Analyst",
  mobile: "Mobile App Developer",
  android: "Mobile App Developer",
  ios: "Mobile App Developer",
  embedded: "Embedded Systems Engineer",
  vlsi: "VLSI Design Engineer",
  iot: "IoT Developer",
  robotics: "Robotics Engineer",
};

/**
 * Resolve target role identifier against validated benchmarks and known aliases.
 * Supports exact names, lowercase, slugs (e.g. "embedded-systems-engineer"), and aliases.
 */
export function resolveRoleBenchmark(roleIdentifier) {
  if (!roleIdentifier || typeof roleIdentifier !== "string") return null;

  const raw = roleIdentifier.trim();
  if (!raw) return null;

  // 1. Direct exact match in ROLE_REQUIREMENTS
  if (ROLE_REQUIREMENTS[raw]) {
    return ROLE_REQUIREMENTS[raw];
  }

  // 2. Case-insensitive exact match
  const lower = raw.toLowerCase();
  const directMatchKey = Object.keys(ROLE_REQUIREMENTS).find(
    (k) => k.toLowerCase() === lower
  );
  if (directMatchKey) return ROLE_REQUIREMENTS[directMatchKey];

  // 3. Slug / kebab-case / snake-case match
  const slugified = lower.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const slugMatchKey = Object.keys(ROLE_REQUIREMENTS).find((k) => {
    const kSlug = k.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return kSlug === slugified;
  });
  if (slugMatchKey) return ROLE_REQUIREMENTS[slugMatchKey];

  // 4. Normalized spaces match
  const normalizedSpaces = lower.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const spaceMatchKey = Object.keys(ROLE_REQUIREMENTS).find((k) => {
    const kNorm = k.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    return kNorm === normalizedSpaces;
  });
  if (spaceMatchKey) return ROLE_REQUIREMENTS[spaceMatchKey];

  // 5. Common role alias mapping
  if (ROLE_ALIAS_MAP[slugified] && ROLE_REQUIREMENTS[ROLE_ALIAS_MAP[slugified]]) {
    return ROLE_REQUIREMENTS[ROLE_ALIAS_MAP[slugified]];
  }
  if (ROLE_ALIAS_MAP[lower] && ROLE_REQUIREMENTS[ROLE_ALIAS_MAP[lower]]) {
    return ROLE_REQUIREMENTS[ROLE_ALIAS_MAP[lower]];
  }

  return null;
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

  // 1. Resolve role benchmark using robust slug and alias resolution
  const roleConfig = resolveRoleBenchmark(roleName);

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
        // Missing evidence: no records found across Resume, GitHub, or Coding
        gaps.push({
          skill: canonicalReq,
          canonicalName: canonicalReq,
          category: getSkillCategory(canonicalReq),
          status: GAP_STATUSES.MISSING,
          evidenceState: "missing_evidence",
          priority: req.importance === "critical" ? GAP_PRIORITIES.CRITICAL : req.isCore ? GAP_PRIORITIES.HIGH : GAP_PRIORITIES.MEDIUM,
          isCore: req.isCore,
          evidenceType: req.evidenceType || ["project", "github", "coding"],
          observableEvidence: req.observableEvidence || (roleConfig.observableEvidence && roleConfig.observableEvidence[0]) || "",
          howToDemonstrate: `Submit an original project repository or pass a verified coding sandbox challenge demonstrating ${canonicalReq}.`,
          learningRoute: `/dashboard/edutube?search=${encodeURIComponent(canonicalReq)}`,
          roadmapRoute: "/dashboard/roadmap",
          currentScore: 0,
          currentLevel: "None",
          requiredLevel: minRequired,
          reason: `Target role "${roleConfig.roleName}" requires ${canonicalReq}, but no evidence was detected across Resume, GitHub, or Coding submissions. (Status: Missing Evidence)`,
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
            evidenceState: "demonstrated_weakness",
            priority,
            isCore: req.isCore,
            evidenceType: req.evidenceType || ["project", "github", "coding"],
            observableEvidence: req.observableEvidence || (roleConfig.observableEvidence && roleConfig.observableEvidence[0]) || "",
            howToDemonstrate: `Strengthen ${canonicalReq} through practical projects with automated testing and documented APIs.`,
            learningRoute: `/dashboard/edutube?search=${encodeURIComponent(canonicalReq)}`,
            roadmapRoute: "/dashboard/roadmap",
            currentScore: userSkill.score,
            currentLevel: userSkill.level,
            requiredLevel: minRequired,
            reason: `Current evaluated proficiency is "${userSkill.level}" (${userSkill.score}/100), but "${roleConfig.roleName}" recommends "${minRequired}". Additional verified projects or coding tasks needed.`,
          });
        } else {
          metSkills.push({
            skill: canonicalReq,
            canonicalName: canonicalReq,
            category: userSkill.category || getSkillCategory(canonicalReq),
            status: GAP_STATUSES.MET,
            evidenceState: "demonstrated_competence",
            priority: GAP_PRIORITIES.NONE,
            isCore: req.isCore,
            evidenceType: req.evidenceType || ["project", "github", "coding"],
            observableEvidence: req.observableEvidence || (roleConfig.observableEvidence && roleConfig.observableEvidence[0]) || "",
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

    const totalUserSkills = evaluatedSkills.length;
    const isSparseEvidence = totalUserSkills < 3;
    const evidenceCoverage = isSparseEvidence ? "sparse" : (totalUserSkills >= 6 ? "comprehensive" : "moderate");

    return {
      targetRole: roleConfig.roleName,
      roleDescription: roleConfig.description,
      benchmarkStatus: "validated",
      benchmarkPending: false,
      roleMatchPercentage,
      evidenceCoverage,
      evidenceNotice: isSparseEvidence
        ? `Evaluation is based on sparse available profile evidence (${totalUserSkills} skill${totalUserSkills === 1 ? "" : "s"} evaluated). Role match percentage reflects evidence coverage rather than definitive lack of competence.`
        : null,
      totalRequiredSkills: allRequirements.length,
      metSkillsCount: metSkills.length,
      gapsCount: gaps.length,
      gaps,
      metSkills,
      prerequisites: roleConfig.prerequisites || [],
      observableEvidence: roleConfig.observableEvidence || [],
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
          evidenceType: ["project", "coursework", "portfolio"],
          learningRoute: `/dashboard/edutube?search=${encodeURIComponent(canonicalReq)}`,
          roadmapRoute: "/dashboard/roadmap",
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
            evidenceType: ["project", "coursework", "portfolio"],
            learningRoute: `/dashboard/edutube?search=${encodeURIComponent(canonicalReq)}`,
            roadmapRoute: "/dashboard/roadmap",
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
            evidenceType: ["project", "coursework", "portfolio"],
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
      prerequisites: catalogRole.prerequisiteSkills || [],
      observableEvidence: ["Verified project or portfolio demonstration of core discipline competencies."],
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
    prerequisites: [],
    observableEvidence: [],
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

/**
 * Perform a comparative skill-gap analysis across multiple target roles.
 * Identifies shared skills, role-specific skills, high-leverage overlap skills,
 * and individual role match summaries.
 *
 * @param {Array<object>} evaluatedSkills - Evaluated user skills
 * @param {Array<string>} targetRoles - List of role names to compare
 * @param {object} [options={}] - Optional config { catalogRoles }
 * @returns {object} Comparative multi-role analysis
 */
export function compareRoles(
  evaluatedSkills = [],
  targetRoles = [],
  options = {}
) {
  if (Array.isArray(targetRoles) && targetRoles.length === 0) {
    return {
      comparedRoles: [],
      rolesCount: 0,
      rolesSummary: [],
      sharedSkillsCount: 0,
      sharedSkills: [],
      roleSpecificSkillsCount: 0,
      roleSpecificSkills: {},
      highLeverageSkillsCount: 0,
      highLeverageSkills: [],
      topCombinedGaps: [],
      roleAnalyses: [],
    };
  }

  const rawRoles = Array.isArray(targetRoles) && targetRoles.length > 0
    ? targetRoles
    : [TARGET_ROLES.FULL_STACK_DEVELOPER];

  const uniqueRoles = Array.from(
    new Set(rawRoles.map((r) => String(r || "").trim()).filter(Boolean))
  );

  const rolesToCompare = uniqueRoles.length > 0 ? uniqueRoles : [TARGET_ROLES.FULL_STACK_DEVELOPER];

  const roleAnalyses = rolesToCompare.map((role) =>
    analyzeSkillGaps(evaluatedSkills, role, options)
  );

  const skillUsageMap = new Map();

  for (const analysis of roleAnalyses) {
    const roleName = analysis.targetRole;
    const allRoleSkills = [
      ...analysis.gaps.map((g) => ({ ...g, isMet: false })),
      ...analysis.metSkills.map((m) => ({ ...m, isMet: true })),
    ];

    for (const item of allRoleSkills) {
      const key = item.canonicalName.toLowerCase();
      if (!skillUsageMap.has(key)) {
        skillUsageMap.set(key, {
          skill: item.skill,
          canonicalName: item.canonicalName,
          category: item.category,
          rolesRequiring: [],
          rolesMet: [],
          rolesMissing: [],
          currentScore: item.currentScore,
          currentLevel: item.currentLevel,
          requiredLevel: item.requiredLevel,
          priority: item.priority,
          evidenceType: item.evidenceType || ["project", "github", "coding"],
          observableEvidence: item.observableEvidence || "",
          learningRoute: item.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(item.canonicalName)}`,
        });
      }

      const entry = skillUsageMap.get(key);
      if (!entry.rolesRequiring.includes(roleName)) {
        entry.rolesRequiring.push(roleName);
      }
      if (item.isMet) {
        if (!entry.rolesMet.includes(roleName)) entry.rolesMet.push(roleName);
      } else {
        if (!entry.rolesMissing.includes(roleName)) entry.rolesMissing.push(roleName);
      }
      if (item.currentScore > entry.currentScore) {
        entry.currentScore = item.currentScore;
        entry.currentLevel = item.currentLevel;
      }
      if (!entry.observableEvidence && item.observableEvidence) {
        entry.observableEvidence = item.observableEvidence;
      }
    }
  }

  const allSkills = Array.from(skillUsageMap.values());

  // 1. Shared Skills: Required by >= 2 compared roles
  const sharedSkills = allSkills
    .filter((s) => s.rolesRequiring.length >= 2)
    .sort((a, b) => b.rolesRequiring.length - a.rolesRequiring.length);

  // 2. Role-Specific Skills: Required by only 1 role
  const roleSpecificSkillsList = allSkills
    .filter((s) => s.rolesRequiring.length === 1)
    .sort((a, b) => a.rolesRequiring[0].localeCompare(b.rolesRequiring[0]));

  const roleSpecificSkillsMap = {};
  for (const role of rolesToCompare) {
    roleSpecificSkillsMap[role] = roleSpecificSkillsList.filter((s) => s.rolesRequiring.includes(role));
  }

  // 3. High-Leverage Skills: Shared skills that are currently in gap/missing status in >= 2 roles
  const highLeverageSkills = sharedSkills
    .filter((s) => s.rolesMissing.length >= 2 || (s.rolesMissing.length > 0 && s.rolesRequiring.length >= 2))
    .map((s) => ({
      ...s,
      roleCount: s.rolesRequiring.length,
      roles: s.rolesRequiring,
    }))
    .sort((a, b) => b.rolesMissing.length - a.rolesMissing.length);

  // 4. Roles Summary Matrix
  const rolesSummary = roleAnalyses.map((a) => ({
    roleName: a.targetRole,
    targetRole: a.targetRole,
    roleDescription: a.roleDescription,
    benchmarkStatus: a.benchmarkStatus,
    benchmarkPending: a.benchmarkPending,
    roleMatchPercentage: a.roleMatchPercentage,
    totalRequiredSkills: a.totalRequiredSkills,
    metSkillsCount: a.metSkillsCount,
    gapsCount: a.gapsCount,
    topPriorityGap: a.gaps[0] || null,
  }));

  // 5. Combined Prioritized Gaps across all roles (deduplicated)
  const combinedGapsMap = new Map();
  for (const analysis of roleAnalyses) {
    for (const gap of analysis.gaps) {
      const key = gap.canonicalName.toLowerCase();
      if (!combinedGapsMap.has(key)) {
        combinedGapsMap.set(key, {
          ...gap,
          affectedRoles: [analysis.targetRole],
        });
      } else {
        const existing = combinedGapsMap.get(key);
        if (!existing.affectedRoles.includes(analysis.targetRole)) {
          existing.affectedRoles.push(analysis.targetRole);
        }
      }
    }
  }

  const priorityWeights = {
    [GAP_PRIORITIES.CRITICAL]: 4,
    [GAP_PRIORITIES.HIGH]: 3,
    [GAP_PRIORITIES.MEDIUM]: 2,
    [GAP_PRIORITIES.LOW]: 1,
    [GAP_PRIORITIES.NONE]: 0,
  };

  const topCombinedGaps = Array.from(combinedGapsMap.values()).sort((a, b) => {
    const weightDiff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;
    return b.affectedRoles.length - a.affectedRoles.length;
  });

  const incompleteBenchmarks = roleAnalyses.filter((a) => a.benchmarkPending);

  return {
    comparedRoles: rolesToCompare,
    rolesCount: rolesToCompare.length,
    rolesSummary,
    incompleteBenchmarksCount: incompleteBenchmarks.length,
    benchmarkNotices: incompleteBenchmarks.map((a) => ({
      role: a.targetRole,
      status: a.benchmarkStatus,
      notice: a.benchmarkNotice || `Role "${a.targetRole}" benchmark is pending full validation.`,
    })),
    sharedSkillsCount: sharedSkills.length,
    sharedSkills,
    roleSpecificSkillsCount: roleSpecificSkillsList.length,
    roleSpecificSkills: roleSpecificSkillsMap,
    roleSpecificSkillsList,
    highLeverageSkillsCount: highLeverageSkills.length,
    highLeverageSkills,
    topCombinedGaps,
    roleAnalyses,
  };
}

/**
 * Execute multi-role comparison for authenticated user.
 *
 * @param {object} user - Authenticated user object
 * @param {Array<string>} [requestedRoles] - Optional roles array override
 * @returns {Promise<object>} Comparative multi-role report
 */
export async function compareUserRoles(user, requestedRoles = null) {
  if (!user || !user._id) {
    throw new GapAnalysisError("Authentication required for role comparison", 401);
  }

  let roles = requestedRoles;
  if (!Array.isArray(roles) || roles.length === 0) {
    if (Array.isArray(user.targetRoles) && user.targetRoles.length > 0) {
      roles = user.targetRoles;
    } else if (user.targetRole) {
      roles = [user.targetRole];
    } else {
      roles = [TARGET_ROLES.FULL_STACK_DEVELOPER];
    }
  }

  const profile = await getOrCreateSkillProfile(user);
  if (!profile || !Array.isArray(profile.skills)) {
    throw new GapAnalysisError("Skill profile could not be loaded", 500);
  }

  return compareRoles(profile.skills, roles);
}


