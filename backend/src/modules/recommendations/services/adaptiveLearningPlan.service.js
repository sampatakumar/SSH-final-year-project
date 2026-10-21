import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { LearningActivityRecord } from "../../skills/models/learningActivityRecord.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { SKILL_PREREQUISITE_GRAPH, adaptiveSkillLoopService } from "../../skills/services/adaptive-skill-loop.service.js";
import { VERIFIED_CODING_TASKS } from "../catalog/taskMappings.js";
import { AUTHORITATIVE_DOCS } from "../catalog/documentationCatalog.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { ROLE_REQUIREMENTS } from "../../gaps/benchmarks/roleRequirements.js";
import { ApiError } from "../../../core/errors/ApiError.js";

// Canonical verified EduTube courses registry
const VERIFIED_COURSES = {
  Python: { title: "Python for Beginners - Full Course", url: "https://www.youtube.com/watch?v=kqtD5dpn9C8", id: "kqtD5dpn9C8", type: "full_course", duration: "4h 30m" },
  JavaScript: { title: "JavaScript Full Course for Beginners", url: "https://www.youtube.com/watch?v=PkZNo7MFNFg", id: "PkZNo7MFNFg", type: "full_course", duration: "3h 20m" },
  React: { title: "React 18 / 19 Full Course 2024", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", id: "bMknfKXIFA8", type: "full_course", duration: "5h 15m" },
  "Node.js": { title: "Node.js and Express.js Full Course", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", id: "Oe421EPjeBE", type: "full_course", duration: "8h 10m" },
  Docker: { title: "Docker Tutorial for Beginners [Full Course]", url: "https://www.youtube.com/watch?v=3c-iBn73dDE", id: "3c-iBn73dDE", type: "full_course", duration: "2h 45m" },
  TypeScript: { title: "TypeScript Full Course for Beginners", url: "https://www.youtube.com/watch?v=BwuLxPH8IDs", id: "BwuLxPH8IDs", type: "full_course", duration: "3h 10m" },
  MongoDB: { title: "MongoDB Full Tutorial for Developers", url: "https://www.youtube.com/watch?v=ofme2o29ngU", id: "ofme2o29ngU", type: "full_course", duration: "2h 30m" },
  "Data Structures": { title: "Data Structures and Algorithms in Java", url: "https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ", id: "PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ", type: "complete_playlist", duration: "18h 00m" },
};

export class AdaptiveLearningPlanService {
  /**
   * Calculate a personalized, adaptive learning plan for a student and target role.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user ID
   * @param {string} targetRole - Role name
   * @returns {Promise<object>} Complete adaptive learning plan
   */
  async generateAdaptivePlan(ownerId, targetRole = "Full Stack Developer") {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }

    const [skillProfile, recentActivities, codingSubmissions] = await Promise.all([
      SkillProfile.findOne({ owner: ownerId }).lean(),
      LearningActivityRecord.find({ owner: ownerId }).sort({ recordedAt: -1 }).limit(100).lean(),
      CodingSubmission.find({ owner: ownerId }).sort({ submittedAt: -1 }).limit(50).lean(),
    ]);

    // 1. Resolve role benchmark skills
    const benchmark = ROLE_REQUIREMENTS[targetRole] || null;
    if (!benchmark) {
      return {
        targetRole,
        benchmarkAvailable: false,
        status: "benchmark_pending",
        overallReadinessScore: skillProfile?.overallReadinessScore ?? 60,
        currentObjective: `Benchmark definition pending for "${targetRole}". Targeted benchmarks are available for standard computing roles.`,
        nextAction: null,
        actionsCount: 0,
        pendingActionsCount: 0,
        verifiedCompetenciesCount: 0,
        actions: [],
        generatedAt: new Date().toISOString(),
      };
    }

    const roleSkills = benchmark?.coreSkills
      ? [
          ...benchmark.coreSkills.map((s) => ({
            name: s.skill,
            requiredScore: s.importance === "critical" ? 80 : 70,
            importance: "Core",
          })),
          ...(benchmark.secondarySkills || []).map((s) => ({
            name: s.skill,
            requiredScore: 65,
            importance: "Secondary",
          })),
        ]
      : [
          { name: "JavaScript", requiredScore: 80, importance: "Core" },
          { name: "React", requiredScore: 75, importance: "Core" },
          { name: "Node.js", requiredScore: 75, importance: "Core" },
          { name: "Docker", requiredScore: 70, importance: "Secondary" },
          { name: "MongoDB", requiredScore: 70, importance: "Secondary" },
        ];

    // 2. Map existing skills and competency status
    const profileSkills = skillProfile?.skills || [];
    const skillMap = new Map();
    for (const s of profileSkills) {
      const canonical = normalizeSkill(s.canonicalName || s.skill) || s.skill;
      skillMap.set(canonical.toLowerCase(), s);
    }

    // 3. Activity outcomes analysis
    const failedCountsBySkill = new Map();
    const passedSkills = new Set();
    const completedModules = new Set();

    for (const act of recentActivities) {
      const key = (act.canonicalName || act.skill || "").toLowerCase();
      if (!key) continue;

      if (act.activityType === "coding_passed" || act.isDemonstratedCompetency) {
        passedSkills.add(key);
      } else if (act.activityType === "coding_failed") {
        failedCountsBySkill.set(key, (failedCountsBySkill.get(key) || 0) + 1);
      } else if (act.activityType === "module_completed") {
        completedModules.add(key);
      }
    }

    for (const sub of codingSubmissions) {
      if (sub.status === "passed") {
        for (const sk of sub.skillsCovered || []) {
          const canonical = normalizeSkill(sk);
          if (canonical) passedSkills.add(canonical.toLowerCase());
        }
      }
    }

    // 4. Formulate learning actions for each skill
    const rawActions = [];

    for (const reqSkill of roleSkills) {
      const canonical = normalizeSkill(reqSkill.name || reqSkill.skill) || reqSkill.name;
      const key = canonical.toLowerCase();
      const existing = skillMap.get(key);

      const currentScore = existing?.score ?? 0;
      const targetScore = reqSkill.requiredScore ?? 75;
      const isMet = currentScore >= targetScore && (passedSkills.has(key) || existing?.confidence >= 0.8);

      const codingTask = VERIFIED_CODING_TASKS[canonical] || null;
      const verifiedCourse = VERIFIED_COURSES[canonical] || null;
      const docUrl = AUTHORITATIVE_DOCS[canonical] || "https://developer.mozilla.org/";

      // Evaluate prerequisite readiness
      const prereqCheck = adaptiveSkillLoopService.evaluatePrerequisiteReadiness(canonical, profileSkills);
      const failures = failedCountsBySkill.get(key) || 0;
      const hasWatchedModule = completedModules.has(key);
      const hasPassedChallenge = passedSkills.has(key);

      let actionType = "learn_and_practice";
      let priority = reqSkill.importance === "Core" ? "High" : "Medium";
      let reasoning = "";
      let practicalAction = "";
      let evidenceState = "unassessed_gap";
      let completionCriteria = "";

      if (isMet) {
        actionType = "demonstrated_competency";
        priority = "Low";
        evidenceState = "verified_competency";
        reasoning = `You have demonstrated competent mastery in ${canonical} (${currentScore}/100) with verified evidence.`;
        practicalAction = `Apply ${canonical} to an advanced production project or architecture design.`;
        completionCriteria = `Maintain empirical proficiency via spaced retrieval practice.`;
      } else if (!prereqCheck.isReady) {
        // Prerequisite missing!
        actionType = "prerequisite_remediation";
        priority = "Critical";
        evidenceState = "missing_prerequisites";
        reasoning = `Foundational prerequisites are missing for ${canonical}: ${prereqCheck.missingPrerequisites.join(", ")}. Mastering foundational concepts is essential before tackling ${canonical}.`;
        practicalAction = `Study prerequisite fundamentals in ${prereqCheck.missingPrerequisites[0]} before attempting ${canonical} challenges.`;
        completionCriteria = `Achieve >= 50 score in ${prereqCheck.missingPrerequisites.join(", ")}.`;
      } else if (failures >= 2) {
        // Repeated challenge failure -> targeted remediation
        actionType = "targeted_remediation";
        priority = "Critical";
        evidenceState = "demonstrated_weakness";
        reasoning = `Repeated challenge difficulty detected in ${canonical} (${failures} failed sandbox attempts). You need targeted remediation on core concepts before re-attempting.`;
        practicalAction = `Review core ${canonical} error handling and syntax patterns with the verified EduTube lesson before re-testing in sandbox.`;
        completionCriteria = `Pass all hidden unit tests in the isolated Docker sandbox for task: "${codingTask?.taskTitle || canonical}".`;
      } else if (hasWatchedModule && !hasPassedChallenge) {
        // Lesson watched, but no demonstrated competency yet!
        actionType = "practice_validation";
        priority = "High";
        evidenceState = "learning_in_progress";
        reasoning = `You completed educational lessons for ${canonical}. Watching lessons provides conceptual understanding, but competency requires empirical proof.`;
        practicalAction = codingTask
          ? `Solve the "${codingTask.taskTitle}" coding challenge in the Smart Skill Hub sandbox to prove your competency.`
          : `Implement an original unit-tested code module demonstrating ${canonical}.`;
        completionCriteria = `Pass 100% of test cases in the coding sandbox.`;
      } else {
        // Standard gap
        actionType = "foundation_learning";
        priority = reqSkill.importance === "Core" ? "High" : "Medium";
        evidenceState = currentScore === 0 ? "missing_evidence" : "developing";
        reasoning = `${canonical} is required for ${targetRole} (Current: ${currentScore}/100 vs Required: ${targetScore}/100).`;
        practicalAction = `Watch the verified ${canonical} course and complete the hands-on coding task.`;
        completionCriteria = `Pass sandbox tests and achieve >= ${targetScore} competency score.`;
      }

      rawActions.push({
        actionId: `plan_${key}_${rawActions.length + 1}`,
        skill: canonical,
        canonicalName: canonical,
        category: getSkillCategory(canonical),
        targetRole,
        actionType,
        priority,
        evidenceState,
        currentScore,
        targetScore,
        isDemonstratedCompetency: isMet,
        prerequisites: prereqCheck.prerequisites,
        missingPrerequisites: prereqCheck.missingPrerequisites,
        hasPrerequisitesMet: prereqCheck.isReady,
        failureCount: failures,
        reasoning,
        practicalAction,
        completionCriteria,
        codingTask: codingTask
          ? {
              taskId: codingTask.taskId,
              taskTitle: codingTask.taskTitle,
              category: codingTask.category,
              language: codingTask.language,
            }
          : null,
        educationalResource: verifiedCourse
          ? {
              title: verifiedCourse.title,
              youtubeUrl: verifiedCourse.url,
              edutubeUrl: `/dashboard/edutube?video=${verifiedCourse.id}`,
              type: verifiedCourse.type,
              duration: verifiedCourse.duration,
            }
          : {
              title: `${canonical} Developer Guide & Tutorials`,
              youtubeUrl: null,
              edutubeUrl: `/dashboard/edutube?search=${encodeURIComponent(canonical)}`,
              type: "search_query",
              duration: "Self-paced",
            },
        documentationUrl: docUrl,
        estimatedMinutes: failures >= 2 ? 45 : 30,
      });
    }

    // 5. Prerequisite Topological Ordering (Cycle-Safe)
    // Critical rule: Prerequisites strictly precede dependent skills!
    const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const orderedActions = [...rawActions];

    // Priority sort first
    orderedActions.sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3));

    // Reorder dependencies
    for (let pass = 0; pass < orderedActions.length; pass++) {
      for (let i = 0; i < orderedActions.length; i++) {
        for (let j = i + 1; j < orderedActions.length; j++) {
          const itemBefore = orderedActions[i];
          const itemAfter = orderedActions[j];

          // If itemAfter is a prerequisite of itemBefore, swap them so prerequisite comes first!
          const isPrereq = itemBefore.missingPrerequisites?.includes(itemAfter.skill) ||
            SKILL_PREREQUISITE_GRAPH[itemBefore.skill]?.prerequisites?.includes(itemAfter.skill);

          if (isPrereq) {
            const temp = orderedActions[i];
            orderedActions[i] = orderedActions[j];
            orderedActions[j] = temp;
          }
        }
      }
    }

    // Identify primary current objective and next recommended action
    const pendingActions = orderedActions.filter((a) => !a.isDemonstratedCompetency);
    const nextAction = pendingActions[0] || orderedActions[0] || null;

    const currentObjective = nextAction
      ? `Master ${nextAction.skill}: ${nextAction.actionType === "prerequisite_remediation" ? "Review missing prerequisites" : nextAction.actionType === "targeted_remediation" ? "Targeted remediation for challenge" : "Solve sandbox coding exercise"}`
      : `Maintain mastery for ${targetRole} via regular spaced retrieval.`;

    return {
      targetRole,
      overallReadinessScore: skillProfile?.overallReadinessScore ?? 65,
      currentObjective,
      nextAction,
      actionsCount: orderedActions.length,
      pendingActionsCount: pendingActions.length,
      verifiedCompetenciesCount: orderedActions.filter((a) => a.isDemonstratedCompetency).length,
      actions: orderedActions,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Multi-role progress comparison across frontend, backend, or custom target roles.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user ID
   * @param {Array<string>} roles - Array of role names
   * @returns {Promise<object>} Comparison breakdown
   */
  async compareMultiRolePlans(ownerId, roles = []) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }

    const defaultRoles = ["Frontend Developer", "Backend Developer", "Full Stack Developer"];
    const targetRoles = Array.isArray(roles) && roles.length > 0 ? roles : defaultRoles;

    const plans = await Promise.all(
      targetRoles.map(async (role) => {
        try {
          return await this.generateAdaptivePlan(ownerId, role);
        } catch {
          return {
            targetRole: role,
            overallReadinessScore: 0,
            currentObjective: `Role benchmark unavailable for ${role}`,
            nextAction: null,
            actions: [],
          };
        }
      })
    );

    return {
      rolesCount: plans.length,
      roles: plans.map((p) => ({
        targetRole: p.targetRole,
        overallReadinessScore: p.overallReadinessScore,
        currentObjective: p.currentObjective,
        nextAction: p.nextAction ? { skill: p.nextAction.skill, actionType: p.nextAction.actionType, priority: p.nextAction.priority } : null,
        pendingActionsCount: p.pendingActionsCount || 0,
        verifiedCompetenciesCount: p.verifiedCompetenciesCount || 0,
      })),
      comparedAt: new Date().toISOString(),
    };
  }
}

export const adaptiveLearningPlanService = new AdaptiveLearningPlanService();
