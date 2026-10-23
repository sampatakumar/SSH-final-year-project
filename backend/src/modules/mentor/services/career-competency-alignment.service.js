import mongoose from "mongoose";
import { User } from "../../../core/database/models/user.models.js";
import { CareerRole } from "../../../core/database/models/careerRole.models.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { LearnerSkillAssessmentHistory } from "../../skills/models/learnerSkillAssessmentHistory.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { SpacedRevisionSchedule } from "../../skills/models/spacedRevisionSchedule.models.js";
import { LearningActivityRecord } from "../../skills/models/learningActivityRecord.models.js";
import { evaluateStudentCompetencyMatrix } from "../../skills/services/competencyMatrix.service.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import {
  INITIAL_CAREER_ROLES,
  INITIAL_BRANCH_ROLE_MAPPINGS,
} from "../../academic/constants/academicCatalog.js";
import { normalizeAcademicProfile } from "../../academic/services/academicNormalization.service.js";

// Standard canonical requirements fallback for core engineering career roles
const STANDARD_ROLE_REQUIREMENTS = {
  "full stack developer": {
    title: "Full Stack Developer",
    coreSkills: ["JavaScript", "React", "Node.js", "Python", "Data Structures", "Docker", "MongoDB"],
    prerequisiteSkills: ["JavaScript", "Data Structures"],
  },
  "frontend developer": {
    title: "Frontend Developer",
    coreSkills: ["JavaScript", "React", "TypeScript", "HTML/CSS", "Next.js"],
    prerequisiteSkills: ["JavaScript"],
  },
  "backend developer": {
    title: "Backend Developer",
    coreSkills: ["Node.js", "Python", "Docker", "Data Structures", "MongoDB", "SQL"],
    prerequisiteSkills: ["Data Structures", "SQL"],
  },
  "devops engineer": {
    title: "DevOps Engineer",
    coreSkills: ["Docker", "Kubernetes", "Linux", "Python", "CI/CD", "AWS"],
    prerequisiteSkills: ["Linux", "Docker"],
  },
  "data scientist": {
    title: "Data Scientist",
    coreSkills: ["Python", "Machine Learning", "SQL", "Data Structures", "Statistics"],
    prerequisiteSkills: ["Python", "SQL"],
  },
};

export class CareerCompetencyAlignmentService {
  /**
   * Resolve core skill requirements for a given career role name.
   */
  async resolveRoleRequirements(roleTitle) {
    const cleanTitle = (roleTitle || "").trim().toLowerCase();

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (isDbConnected || CareerRole.findOne?.mock) {
      try {
        const dbRole = await CareerRole.findOne({
          $or: [
            { title: { $regex: new RegExp(`^${cleanTitle}$`, "i") } },
            { slug: cleanTitle },
            { slug: cleanTitle.replace(/\s+/g, "-") },
          ],
          isActive: true,
        }).lean();

        if (dbRole && Array.isArray(dbRole.coreSkills) && dbRole.coreSkills.length > 0) {
          return {
            title: dbRole.title,
            category: dbRole.category || "Software & Computing",
            coreSkills: dbRole.coreSkills.map(normalizeSkill).filter(Boolean),
            prerequisiteSkills: (dbRole.prerequisiteSkills || []).map(normalizeSkill).filter(Boolean),
          };
        }
      } catch {
        // Non-blocking fallback
      }
    }

    const standard = STANDARD_ROLE_REQUIREMENTS[cleanTitle];
    if (standard) {
      return {
        title: standard.title,
        category: standard.category || "Software & Computing",
        coreSkills: (standard.coreSkills || []).map(normalizeSkill).filter(Boolean),
        prerequisiteSkills: (standard.prerequisiteSkills || []).map(normalizeSkill).filter(Boolean),
      };
    }

    const catalogRole = INITIAL_CAREER_ROLES.find(
      (r) =>
        r.title?.toLowerCase() === cleanTitle ||
        r.slug?.toLowerCase() === cleanTitle ||
        r.slug?.toLowerCase() === cleanTitle.replace(/\s+/g, "-")
    );
    if (catalogRole) {
      return {
        title: catalogRole.title,
        category: catalogRole.category,
        coreSkills: (catalogRole.coreSkills || []).map(normalizeSkill).filter(Boolean),
        prerequisiteSkills: (catalogRole.prerequisiteSkills || []).map(normalizeSkill).filter(Boolean),
      };
    }

    const fallback = STANDARD_ROLE_REQUIREMENTS[cleanTitle] || {
      title: roleTitle || "Full Stack Developer",
      category: "Software & Computing",
      coreSkills: ["JavaScript", "Python", "Data Structures", "Docker"],
      prerequisiteSkills: ["Data Structures"],
    };

    return {
      title: fallback.title,
      category: fallback.category || "Software & Computing",
      coreSkills: fallback.coreSkills.map(normalizeSkill).filter(Boolean),
      prerequisiteSkills: fallback.prerequisiteSkills.map(normalizeSkill).filter(Boolean),
    };
  }

  /**
   * Compare student evidence against their selected career roles with branch context.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - User MongoDB ID
   * @returns {Promise<object>} Grounded multi-role competency alignment
   */
  async getCareerCompetencyAlignment(ownerId) {
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);

    const [user, skillProfile, matrixResult] = await Promise.all([
      (isDbConnected || User.findById?.mock) ? User.findById(ownerId).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || SkillProfile.findOne?.mock) ? SkillProfile.findOne({ owner: ownerId }).lean().catch(() => null) : Promise.resolve(null),
      isDbConnected ? evaluateStudentCompetencyMatrix(ownerId).catch(() => ({ matrix: [], summary: {} })) : Promise.resolve({ matrix: [], summary: {} }),
    ]);

    const academic = normalizeAcademicProfile(user?.academic);
    const branchSlug = academic.branchSlug;

    const primaryTargetRole = user?.targetRole || skillProfile?.targetRole || "Full Stack Developer";
    const rawTargetRoles = Array.isArray(user?.targetRoles) && user.targetRoles.length > 0
      ? user.targetRoles
      : [primaryTargetRole];

    // Ensure unique target roles
    const targetRoles = Array.from(new Set(rawTargetRoles.filter(Boolean)));

    // Index competency matrix by canonical skill
    const competencyBySkill = new Map();
    for (const item of matrixResult.matrix || []) {
      competencyBySkill.set(item.canonicalSkill.toLowerCase(), item);
    }

    // Index skill profile scores
    const profileSkillMap = new Map();
    for (const s of skillProfile?.skills || []) {
      const canon = normalizeSkill(s.skill || s.canonicalName).toLowerCase();
      profileSkillMap.set(canon, s);
    }

    // Evaluate each role
    const roleEvaluations = [];
    const allRoleSkills = new Map(); // skill -> count of roles requiring it

    for (const roleName of targetRoles) {
      const reqs = await this.resolveRoleRequirements(roleName);
      const skillBreakdown = [];
      let metCount = 0;

      // Determine relationship with student's branch
      const roleSlugClean = reqs.title.toLowerCase().replace(/[\s/&]+/g, "-");
      const branchMapping = branchSlug
        ? INITIAL_BRANCH_ROLE_MAPPINGS.find(
            (m) =>
              m.branchSlug === branchSlug &&
              (m.roleSlug === roleSlugClean || reqs.title.toLowerCase().includes(m.roleSlug.replace(/-/g, " ")))
          )
        : null;

      const isPrimaryDiscipline = Boolean(branchMapping && branchMapping.relationshipType === "primary");
      const isCrossDisciplinary = Boolean(
        branchSlug &&
        (!branchMapping || branchMapping.relationshipType === "interdisciplinary" || branchMapping.relationshipType === "optional")
      );
      const isNonSoftwareRole = reqs.category && !["Software & Computing", "Other"].includes(reqs.category);

      for (const coreSkill of reqs.coreSkills) {
        const lower = coreSkill.toLowerCase();
        allRoleSkills.set(lower, (allRoleSkills.get(lower) || 0) + 1);

        const comp = competencyBySkill.get(lower);
        const prof = profileSkillMap.get(lower);

        let status = "not_assessed";
        let evidenceTier = "MISSING";
        let currentScore = prof?.score || 0;

        if (comp && comp.status === "demonstrated_at_specified_level") {
          status = "demonstrated";
          evidenceTier = "VERIFIED";
          metCount++;
        } else if (currentScore >= 70) {
          status = "demonstrated";
          evidenceTier = (prof?.sources?.includes("coding") || prof?.sources?.includes("assessment")) ? "VERIFIED" : "INFERRED";
          metCount++;
        } else if (comp && comp.status === "evidence_incomplete") {
          status = "evidence_incomplete";
          evidenceTier = "INFERRED";
        } else if (currentScore > 0) {
          status = "in_progress";
          evidenceTier = "INFERRED";
        }

        skillBreakdown.push({
          skill: coreSkill,
          status,
          evidenceTier,
          currentScore,
          isPrerequisite: reqs.prerequisiteSkills.map((p) => p.toLowerCase()).includes(lower),
          competencyId: comp?.competencyId || null,
          earnedBadges: (comp?.earnedBadges || []).map((b) => b.badgeType),
          missingRequirements: comp?.missingRequirements || [
            `Complete knowledge checkpoints and practical assessment exercises for ${coreSkill}`,
          ],
        });
      }

      const totalCore = reqs.coreSkills.length;
      const readinessPercent = totalCore > 0 ? Math.round((metCount / totalCore) * 100) : 0;
      const topGaps = skillBreakdown.filter((s) => s.status !== "demonstrated").slice(0, 3);

      roleEvaluations.push({
        roleName: reqs.title,
        roleTitle: reqs.title,
        category: reqs.category,
        readinessPercent,
        groundedReadinessPercent: readinessPercent,
        metCount,
        totalRequired: totalCore,
        skills: skillBreakdown,
        consequentialGaps: topGaps,
        isPrimaryDiscipline,
        isCrossDisciplinary,
        isNonSoftwareRole,
        evidenceContext: isNonSoftwareRole
          ? "Domain-specific evaluation. GitHub repository activity is optional and not required for this non-software career path."
          : "Software evaluation. Empirical code execution and repository activity contribute to evidence tiers.",
      });
    }

    // Cross-Role Comparison
    const sharedSkills = [];
    const uniqueSkills = [];
    const highImpactGaps = [];

    for (const [skillLower, roleCount] of allRoleSkills.entries()) {
      const sampleItem = roleEvaluations
        .flatMap((r) => r.skills)
        .find((s) => s.skill.toLowerCase() === skillLower);
      const skillName = sampleItem?.skill || skillLower;

      if (roleCount > 1) {
        sharedSkills.push({
          skill: skillName,
          requiredByRoleCount: roleCount,
          status: sampleItem?.status || "not_assessed",
        });

        if (sampleItem && sampleItem.status !== "demonstrated") {
          highImpactGaps.push({
            skill: skillName,
            impactScore: roleCount,
            reason: `Required by ${roleCount} of your target career roles. Closing this gap accelerates multiple goals simultaneously.`,
            recommendedAction: {
              title: `Master ${skillName} Multi-Role Skill`,
              route: "/dashboard/coding",
            },
          });
        }
      } else {
        uniqueSkills.push({
          skill: skillName,
          status: sampleItem?.status || "not_assessed",
        });
      }
    }

    const multiRoleData = {
      totalRolesCompared: targetRoles.length,
      isMultiRole: targetRoles.length > 1,
      sharedSkills,
      sharedSkillNames: sharedSkills.map((s) => s.skill),
      uniqueSkills,
      highImpactGaps: highImpactGaps.sort((a, b) => b.impactScore - a.impactScore),
    };

    return {
      primaryRole: primaryTargetRole,
      primaryTargetRole,
      targetRoles,
      roleEvaluations,
      rolesEvaluated: roleEvaluations,
      multiRoleComparison: multiRoleData,
      multiRoleAnalysis: multiRoleData,
      academicContext: {
        branchSlug: academic.branchSlug,
        branchName: academic.branchName,
        degreeSlug: academic.degreeSlug,
        degreeName: academic.degreeName,
        stream: academic.stream,
        isConfigured: academic.isConfigured,
      },
      competencySummary: matrixResult.summary,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate an evidence-grounded progress explanation based on real assessment records.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - User MongoDB ID
   * @returns {Promise<object>} Explanatory progress report
   */
  async getPersonalizedProgressExplanation(ownerId) {
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);

    const [assessments, codingSubs, schedules, activities, matrix] = await Promise.all([
      (isDbConnected || LearnerSkillAssessmentHistory.find?.mock)
        ? LearnerSkillAssessmentHistory.find({ owner: ownerId }).sort({ assessmentDate: -1 }).limit(10).lean().catch(() => [])
        : Promise.resolve([]),
      (isDbConnected || CodingSubmission.find?.mock)
        ? CodingSubmission.find({ owner: ownerId }).sort({ submittedAt: -1 }).limit(10).lean().catch(() => [])
        : Promise.resolve([]),
      (isDbConnected || SpacedRevisionSchedule.find?.mock)
        ? SpacedRevisionSchedule.find({ owner: ownerId }).sort({ updatedAt: -1 }).limit(10).lean().catch(() => [])
        : Promise.resolve([]),
      (isDbConnected || LearningActivityRecord.find?.mock)
        ? LearningActivityRecord.find({ owner: ownerId }).sort({ recordedAt: -1 }).limit(10).lean().catch(() => [])
        : Promise.resolve([]),
      isDbConnected
        ? evaluateStudentCompetencyMatrix(ownerId).catch(() => ({ matrix: [], summary: {} }))
        : Promise.resolve({ matrix: [], summary: {} }),
    ]);

    // 1. Measurable improvements
    const improvedSkills = [];
    for (const a of assessments) {
      if (a.scoreDelta > 0) {
        improvedSkills.push({
          skill: a.skill,
          scoreDelta: a.scoreDelta,
          newScore: a.score,
          previousScore: a.previousScore,
          assessmentType: a.assessmentType,
          date: a.assessmentDate,
          provenance: `Verified score increase of +${a.scoreDelta} recorded on ${new Date(a.assessmentDate).toLocaleDateString()}.`,
        });
      }
    }

    // 2. Verified Coding Milestones
    const passedTasks = codingSubs.filter((c) => c.status === "passed" || c.score >= 8);
    const verifiedCodingCount = passedTasks.length;

    // 3. Spaced Retention Streak & Due Topics
    const activeStreak = schedules.reduce((max, s) => Math.max(max, s.consecutiveSuccesses || 0), 0);
    const overdueTopics = schedules.filter((s) => s.status === "pending" && new Date(s.scheduledDate) <= new Date());

    // 4. Competency Status Changes
    const demonstrated = (matrix.matrix || []).filter((m) => m.status === "demonstrated_at_specified_level");
    const incomplete = (matrix.matrix || []).filter((m) => m.status === "evidence_incomplete");

    // 5. Synthesis Explanation Narrative
    const narrativePoints = [];

    if (demonstrated.length > 0) {
      narrativePoints.push(
        `🏆 You have achieved verified competency status in ${demonstrated.length} core technical area(s): ${demonstrated.map((d) => d.name).slice(0, 3).join(", ")}.`
      );
    }

    if (improvedSkills.length > 0) {
      narrativePoints.push(
        `📈 Recent empirical gains: ${improvedSkills.map((i) => `${i.skill} (+${i.scoreDelta} pts)`).slice(0, 2).join(", ")}.`
      );
    }

    if (verifiedCodingCount > 0) {
      const skillsCoveredNames = passedTasks.flatMap((t) => t.skillsCovered || [t.taskId]).filter(Boolean);
      const skillsSuffix = skillsCoveredNames.length > 0 ? ` in ${skillsCoveredNames.slice(0, 2).join(", ")}` : "";
      narrativePoints.push(
        `💻 Sandbox verification: ${verifiedCodingCount} challenge(s) successfully solved${skillsSuffix} with all test cases passing.`
      );
    }

    if (overdueTopics.length > 0) {
      narrativePoints.push(
        `⏳ Retention attention required: ${overdueTopics.length} scheduled revision item(s) due today to prevent memory decay.`
      );
    } else if (activeStreak >= 2) {
      narrativePoints.push(
        `🧠 Strong retention: You have maintained a ${activeStreak}-review successful retrieval streak.`
      );
    }

    if (incomplete.length > 0) {
      const topIncomplete = incomplete[0];
      narrativePoints.push(
        `🎯 Highest-yield next target: Complete missing requirements for ${topIncomplete.name}. Action: ${topIncomplete.recommendedNextAction?.title || "Complete practice challenge"}.`
      );
    }

    if (narrativePoints.length === 0) {
      narrativePoints.push(
        "🚀 Foundational baseline established. Complete interactive EduTube quizzes and sandbox coding challenges to record verified competency evidence."
      );
    }

    return {
      narrative: narrativePoints.join("\n\n"),
      improvedSkills,
      improvedSkillsCount: improvedSkills.length,
      verifiedCodingCount,
      verifiedSandboxPassesCount: verifiedCodingCount,
      activeRetentionStreak: activeStreak,
      overdueRevisionCount: overdueTopics.length,
      demonstratedCompetenciesCount: demonstrated.length,
      incompleteCompetenciesCount: incomplete.length,
      recommendedNextFocus: incomplete[0] || null,
      recentActivityCount: activities.length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const careerCompetencyAlignmentService = new CareerCompetencyAlignmentService();
