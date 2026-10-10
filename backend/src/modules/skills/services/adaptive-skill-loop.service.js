/**
 * Adaptive Skill Loop Service
 *
 * Implements the continuous skill-development loop:
 * 1. Identify knowledge gap.
 * 2. Determine prerequisite skills & evaluate readiness.
 * 3. Recommend appropriately difficult educational lesson (EduTube).
 * 4. Select practical coding exercise (Docker sandbox challenge).
 * 5. Assess performance & record verifiable evidence.
 * 6. Update skill mastery & gap status based on empirical test results.
 * 7. Schedule spaced revision (retrieval practice).
 * 8. Formulate transparent, evidence-grounded reasoning.
 */

import { SkillProfile } from "../models/skillProfile.models.js";
import { LearnerSkillAssessmentHistory } from "../models/learnerSkillAssessmentHistory.models.js";
import { SpacedRevisionSchedule } from "../models/spacedRevisionSchedule.models.js";
import { VERIFIED_CODING_TASKS } from "../../recommendations/catalog/taskMappings.js";
import { AUTHORITATIVE_DOCS } from "../../recommendations/catalog/documentationCatalog.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { edutubeSearchService } from "../../edutube/services/edutube-search.service.js";
import { edutubeQualityGateService } from "../../edutube/services/edutube-quality-gate.service.js";

// Canonical prerequisite dependency graph
export const SKILL_PREREQUISITE_GRAPH = {
  Docker: {
    prerequisites: ["Linux CLI", "Networking Basics", "Node.js"],
    difficulty: "Medium",
    progressiveFollowUps: ["Docker Compose", "Kubernetes", "CI/CD Pipelines"],
  },
  React: {
    prerequisites: ["JavaScript", "HTML/CSS", "DOM API"],
    difficulty: "Medium",
    progressiveFollowUps: ["React Hooks", "State Management", "Next.js"],
  },
  TypeScript: {
    prerequisites: ["JavaScript", "Static Typing Concepts"],
    difficulty: "Medium",
    progressiveFollowUps: ["Generics", "Advanced Types", "Full Stack TypeScript"],
  },
  "REST APIs": {
    prerequisites: ["HTTP Protocol", "Node.js"],
    difficulty: "Easy",
    progressiveFollowUps: ["API Authentication", "Rate Limiting", "GraphQL"],
  },
  MongoDB: {
    prerequisites: ["Database Fundamentals", "JSON"],
    difficulty: "Easy",
    progressiveFollowUps: ["Mongoose Aggregations", "Indexing Strategies", "NoSQL Scaling"],
  },
  "Data Structures": {
    prerequisites: ["Arrays", "Variables & Loops"],
    difficulty: "Medium",
    progressiveFollowUps: ["Hash Maps", "Trees", "Graphs"],
  },
  Algorithms: {
    prerequisites: ["Data Structures", "Time Complexity"],
    difficulty: "Medium",
    progressiveFollowUps: ["Dynamic Programming", "Graph Traversal", "System Design"],
  },
  "Node.js": {
    prerequisites: ["JavaScript", "Asynchronous Programming"],
    difficulty: "Easy",
    progressiveFollowUps: ["Express.js", "REST APIs", "Microservices"],
  },
};

// Spaced revision intervals (in days)
const REVISION_INTERVALS_DAYS = [1, 3, 7, 14, 30];

export class AdaptiveSkillLoopService {
  /**
   * Evaluate prerequisite readiness for a skill against learner profile.
   *
   * @param {string} skill - Canonical skill name
   * @param {Array<object>} profileSkills - Learner's evaluated skills
   * @returns {object} { isReady: boolean, prerequisites: Array<object>, missingPrerequisites: Array<string> }
   */
  evaluatePrerequisiteReadiness(skill, profileSkills = []) {
    const canonical = normalizeSkill(skill) || skill;
    const config = SKILL_PREREQUISITE_GRAPH[canonical] || {
      prerequisites: [],
      difficulty: "Medium",
      progressiveFollowUps: [],
    };

    const skillMap = new Map();
    for (const s of profileSkills) {
      const name = normalizeSkill(s.canonicalName || s.skill) || s.skill;
      skillMap.set(name.toLowerCase(), s);
    }

    const prerequisitesStatus = [];
    const missing = [];

    for (const prereq of config.prerequisites) {
      const existing = skillMap.get(prereq.toLowerCase());
      const score = existing ? existing.score || 0 : 0;
      const isMet = score >= 50;

      prerequisitesStatus.push({
        prerequisite: prereq,
        score,
        isMet,
      });

      if (!isMet) {
        missing.push(prereq);
      }
    }

    return {
      isReady: missing.length === 0,
      prerequisites: prerequisitesStatus,
      missingPrerequisites: missing,
      difficulty: config.difficulty,
      progressiveFollowUps: config.progressiveFollowUps,
    };
  }

  /**
   * Get complete adaptive skill-development loop state for a learner.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Learner ID
   * @returns {Promise<object>} Complete adaptive loop status, next action, and rationale
   */
  async getAdaptiveLoopState(ownerId) {
    const [skillProfile, dueRevisions, recentAssessments] = await Promise.all([
      SkillProfile.findOne({ owner: ownerId }).lean(),
      SpacedRevisionSchedule.find({
        owner: ownerId,
        status: "pending",
        scheduledDate: { $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      })
        .sort({ scheduledDate: 1 })
        .limit(3)
        .lean(),
      LearnerSkillAssessmentHistory.find({ owner: ownerId })
        .sort({ assessmentDate: -1 })
        .limit(5)
        .lean(),
    ]);

    const targetRole = skillProfile?.targetRole || "Full Stack Developer";
    const evaluatedSkills = skillProfile?.skills || [];
    const activeGaps = (skillProfile?.skillGaps || []).filter(
      (g) => g.priority === "Critical" || g.priority === "High" || g.priority === "Medium"
    );

    // 1. Identify primary focal gap
    const focalGap = activeGaps[0] || null;
    const focalSkill = focalGap ? focalGap.canonicalName || focalGap.skill : "JavaScript";

    // 2. Evaluate prerequisite readiness
    const prereqStatus = this.evaluatePrerequisiteReadiness(focalSkill, evaluatedSkills);

    // 3. Recommended Practical Coding Sandbox Task
    const codingTask = VERIFIED_CODING_TASKS[focalSkill] || VERIFIED_CODING_TASKS["JavaScript"] || null;

    // 4. Fetch recommended EduTube lesson for this focal skill
    let recommendedLesson = null;
    try {
      const searchRes = await edutubeSearchService.searchVideos({
        q: `${focalSkill} full course tutorial step by step`,
        maxResults: 4,
      });

      const validItems = edutubeQualityGateService.filterCandidateBatch(searchRes.items || []);
      if (validItems.length > 0) {
        recommendedLesson = validItems[0];
      } else if (searchRes.items && searchRes.items.length > 0) {
        recommendedLesson = searchRes.items[0];
      }
    } catch (err) {
      console.warn(`[adaptive-loop] Video search fallback for ${focalSkill}:`, err.message);
    }

    // 5. Documentation lookup
    const docUrl = AUTHORITATIVE_DOCS[focalSkill] || "https://developer.mozilla.org/";

    // 6. Transparent evidence-grounded explanation
    let whyRecommended = "";
    if (focalGap) {
      whyRecommended = prereqStatus.isReady
        ? `Identified ${focalGap.priority} priority gap in ${focalSkill} (current score: ${focalGap.currentScore}/100). All prerequisites (${prereqStatus.prerequisites.map((p) => p.prerequisite).join(", ")}) are satisfied.`
        : `Identified ${focalGap.priority} priority gap in ${focalSkill}. Prerequisites needing brush-up: ${prereqStatus.missingPrerequisites.join(", ")}.`;
    } else {
      whyRecommended = `All primary role requirements for ${targetRole} are met. Practicing ${focalSkill} reinforces advanced mastery.`;
    }

    return {
      focalSkill,
      targetRole,
      gapPriority: focalGap?.priority || "None",
      currentScore: focalGap?.currentScore || 0,
      targetScore: focalGap?.targetScore || 75,
      prerequisites: prereqStatus,
      recommendedLesson: recommendedLesson
        ? {
            videoId: recommendedLesson.videoId,
            title: recommendedLesson.title,
            thumbnail: recommendedLesson.thumbnail?.high || recommendedLesson.thumbnail?.default,
            channelTitle: recommendedLesson.channelTitle,
            duration: recommendedLesson.duration,
            verifiedDurationSeconds: recommendedLesson.verifiedDurationSeconds,
            educationalScore: recommendedLesson.educationalScore,
            embedUrl: recommendedLesson.embedUrl,
          }
        : null,
      practicalExercise: codingTask
        ? {
            taskId: codingTask.taskId,
            taskTitle: codingTask.taskTitle,
            category: codingTask.category,
            language: codingTask.language,
            skillsCovered: codingTask.skillsCovered,
          }
        : null,
      documentationUrl: docUrl,
      dueSpacedRevisions: dueRevisions,
      recentAssessments: recentAssessments.map((a) => ({
        skill: a.skill,
        score: a.score,
        previousScore: a.previousScore,
        scoreDelta: a.scoreDelta,
        assessmentDate: a.assessmentDate,
        assessmentType: a.assessmentType,
      })),
      whyRecommended,
      nextStepAction: prereqStatus.isReady && codingTask
        ? `Solve the "${codingTask.taskTitle}" challenge in the isolated sandbox.`
        : recommendedLesson
        ? `Watch "${recommendedLesson.title}" to master ${focalSkill} fundamentals.`
        : `Review official ${focalSkill} documentation.`,
    };
  }

  /**
   * Record formative assessment or coding challenge outcome, update SkillProfile
   * with empirical evidence, adjust gaps, and schedule spaced revision.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Learner ID
   * @param {object} payload - Assessment outcome details
   * @returns {Promise<object>} Result summary with score delta and updated mastery
   */
  async recordAdaptiveAssessmentOutcome(ownerId, payload = {}) {
    const {
      skill,
      taskId = "",
      score = 0,
      maxScore = 10,
      testCasesPassed = 0,
      testCasesTotal = 0,
      assessmentType = "coding_challenge",
    } = payload;

    const canonicalName = normalizeSkill(skill) || skill;
    const normalizedScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : score;

    // 1. Fetch current profile
    const profile = await SkillProfile.findOne({ owner: ownerId });
    if (!profile) {
      throw new Error("Learner skill profile not found.");
    }

    // 2. Find existing skill entry
    const existingSkill = profile.skills.find(
      (s) => s.canonicalName.toLowerCase() === canonicalName.toLowerCase()
    );
    const previousScore = existingSkill ? existingSkill.score : 0;
    const scoreDelta = normalizedScore - previousScore;

    // 3. Log Assessment History Record
    await LearnerSkillAssessmentHistory.create({
      owner: ownerId,
      skill: canonicalName,
      canonicalName,
      assessmentType,
      taskId,
      score: normalizedScore,
      previousScore,
      scoreDelta,
      testCasesPassed,
      testCasesTotal,
      evidenceSource: "coding",
      assessmentDate: new Date(),
    });

    // 4. Update Skill Profile with Empirical Evidence
    const updatedScore = existingSkill
      ? Math.round(previousScore * 0.4 + normalizedScore * 0.6) // Weighted toward recent empirical performance
      : normalizedScore;

    let updatedLevel = "Developing";
    if (updatedScore >= 80) updatedLevel = "Proficient";
    else if (updatedScore >= 60) updatedLevel = "Competent";
    else if (updatedScore >= 40) updatedLevel = "Developing";
    else updatedLevel = "Beginner";

    if (existingSkill) {
      existingSkill.score = updatedScore;
      existingSkill.level = updatedLevel;
      existingSkill.confidence = 0.85; // Empirical sandbox evidence provides high confidence!
      if (!existingSkill.sources.includes("coding")) {
        existingSkill.sources.push("coding");
      }
      existingSkill.evidence.push({
        source: "coding",
        evidenceType: "docker_sandbox_test",
        details: `Passed ${testCasesPassed}/${testCasesTotal} test cases on task ${taskId} (score ${normalizedScore}/100)`,
        confidence: 0.9,
        timestamp: new Date(),
      });
      existingSkill.lastAssessedAt = new Date();
    } else {
      profile.skills.push({
        skill: canonicalName,
        canonicalName,
        category: getSkillCategory(canonicalName),
        score: updatedScore,
        level: updatedLevel,
        confidence: 0.85,
        sources: ["coding"],
        evidence: [
          {
            source: "coding",
            evidenceType: "docker_sandbox_test",
            details: `Passed ${testCasesPassed}/${testCasesTotal} test cases on task ${taskId}`,
            confidence: 0.9,
            timestamp: new Date(),
          },
        ],
        explanation: `Empirical sandbox coding assessment completed.`,
        lastAssessedAt: new Date(),
      });
    }

    // 5. Update or remove skill gap
    const gapIndex = profile.skillGaps.findIndex(
      (g) => g.canonicalName.toLowerCase() === canonicalName.toLowerCase()
    );
    if (gapIndex >= 0) {
      if (updatedScore >= profile.skillGaps[gapIndex].targetScore) {
        // Gap closed!
        profile.skillGaps.splice(gapIndex, 1);
      } else {
        profile.skillGaps[gapIndex].currentScore = updatedScore;
        // Downgrade priority if significant improvement
        if (updatedScore >= 50 && profile.skillGaps[gapIndex].priority === "Critical") {
          profile.skillGaps[gapIndex].priority = "Medium";
        }
      }
    }

    // 6. Recalculate Overall Readiness Score
    const totalSkills = profile.skills.length;
    if (totalSkills > 0) {
      const avgScore = profile.skills.reduce((acc, s) => acc + s.score, 0) / totalSkills;
      profile.overallReadinessScore = Math.min(100, Math.round(avgScore));
    }

    await profile.save();

    // 7. Schedule Spaced Revision (Stage 1: 1-3 days out)
    const intervalDays = REVISION_INTERVALS_DAYS[0] || 1;
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + intervalDays);

    await SpacedRevisionSchedule.create({
      owner: ownerId,
      skill: canonicalName,
      canonicalName,
      stage: 1,
      intervalDays,
      scheduledDate,
      status: "pending",
      lastScore: updatedScore,
      promptQuestion: `Retrieval practice: Implement ${canonicalName} core functions without reference solutions.`,
      recommendedExerciseId: taskId,
    });

    return {
      skill: canonicalName,
      previousScore,
      newScore: updatedScore,
      scoreDelta,
      updatedLevel,
      gapClosed: gapIndex >= 0 && updatedScore >= 75,
      nextRevisionScheduledAt: scheduledDate.toISOString(),
      overallReadinessScore: profile.overallReadinessScore,
    };
  }
}

export const adaptiveSkillLoopService = new AdaptiveSkillLoopService();
