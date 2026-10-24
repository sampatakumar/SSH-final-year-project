import mongoose from "mongoose";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { AssessmentAttempt } from "../../academic/models/assessmentAttempt.models.js";
import { StudentProject } from "../../academic/models/studentProject.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { SpacedRevisionSchedule } from "../models/spacedRevisionSchedule.models.js";
import { EduTubeCheckpointAttempt } from "../../edutube/models/edutubeCheckpointAttempt.models.js";
import { LearnerSkillAssessmentHistory } from "../models/learnerSkillAssessmentHistory.models.js";
import { ASSESSMENTS_CATALOG } from "../../academic/constants/assessmentCatalog.js";

// Map assessmentId to relevant canonical skills for quick lookup
const ASSESSMENT_SKILLS_MAP = new Map();
ASSESSMENTS_CATALOG.forEach((a) => {
  if (a.assessmentId && a.relevantSkills) {
    ASSESSMENT_SKILLS_MAP.set(a.assessmentId, a.relevantSkills);
  }
});

export class EvidenceNormalizationService {
  /**
   * Safe DB query helper ensuring non-connected Mongoose calls in offline tests do not hang
   */
  async safeFind(model, filter, sort = {}, limit = 50) {
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (model?.find?.mock || isDbConnected) {
      try {
        return await model.find(filter).sort(sort).limit(limit).lean();
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  /**
   * Fetch and normalize all available learning evidence for an authenticated student
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Student ID
   * @returns {Promise<object>} Normalized evidence by skill and chronological list
   */
  async getNormalizedStudentEvidence(ownerId) {
    if (!ownerId) {
      return { rawCount: 0, normalizedBySkill: {}, timeline: [] };
    }

    const [
      assessmentAttempts,
      studentProjects,
      codingSubmissions,
      spacedRevisions,
      checkpointAttempts,
      historyRecords,
    ] = await Promise.all([
      this.safeFind(AssessmentAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 50),
      this.safeFind(StudentProject, { owner: ownerId }, { updatedAt: -1 }, 30),
      this.safeFind(CodingSubmission, { owner: ownerId }, { submittedAt: -1 }, 50),
      this.safeFind(SpacedRevisionSchedule, { owner: ownerId }, { updatedAt: -1 }, 30),
      this.safeFind(EduTubeCheckpointAttempt, { owner: ownerId }, { attemptedAt: -1 }, 30),
      this.safeFind(LearnerSkillAssessmentHistory, { owner: ownerId }, { assessmentDate: -1 }, 50),
    ]);

    const timeline = [];

    // 1. Normalize Assessment Center attempts (Phase 44)
    for (const attempt of assessmentAttempts) {
      const percentage = attempt.percentage ?? (attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0);
      const isPass = attempt.isPassing ?? percentage >= 70;
      const skills = ASSESSMENT_SKILLS_MAP.get(attempt.assessmentId) || [attempt.assessmentId];

      for (const rawSkill of skills) {
        const canonical = normalizeSkill(rawSkill) || rawSkill;
        timeline.push({
          evidenceId: `ev_assess_${attempt._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          canonicalSkill: canonical,
          sourceType: "assessment_attempt",
          status: isPass ? "demonstrated_knowledge" : "demonstrated_knowledge", // Still demonstrated performance, even if below passing
          isPassing: isPass,
          score: attempt.score ?? 0,
          maxScore: attempt.maxScore ?? 100,
          percentage,
          timestamp: attempt.submittedAt || attempt.createdAt || new Date().toISOString(),
          confidence: 0.95, // Objective server-side graded
          version: attempt.version || 1,
          assessmentId: attempt.assessmentId,
          topicPerformance: attempt.topicPerformance || [],
          metadata: {
            strengths: attempt.strengths || [],
            areasForImprovement: attempt.areasForImprovement || [],
            scoringMethod: attempt.scoringMethod,
          },
        });
      }
    }

    // 2. Normalize Coding Challenges
    for (const sub of codingSubmissions) {
      const percentage = sub.score !== undefined ? Math.round((sub.score / 10) * 100) : sub.status === "passed" ? 100 : 0;
      const canonical = normalizeSkill(sub.skill || sub.taskId) || "Software Development";
      timeline.push({
        evidenceId: `ev_code_${sub._id}`,
        canonicalSkill: canonical,
        sourceType: "coding_submission",
        status: sub.status === "passed" ? "demonstrated_knowledge" : "demonstrated_knowledge",
        isPassing: sub.status === "passed" || percentage >= 70,
        score: sub.score ?? 0,
        maxScore: 10,
        percentage,
        timestamp: sub.submittedAt || sub.createdAt || new Date().toISOString(),
        confidence: 0.95, // Verified Docker sandbox evaluation
        taskId: sub.taskId,
        metadata: {
          testCasesPassed: sub.testCasesPassed,
          testCasesTotal: sub.testCasesTotal,
          language: sub.language,
        },
      });
    }

    // 3. Normalize Project Studio Deliverables (Phase 43)
    for (const proj of studentProjects) {
      const evaluation = proj.evaluation || {};
      const percentage = evaluation.overallScore ?? (proj.status === "completed" ? 85 : 50);
      const isPass = percentage >= 70;

      const skills = proj.relevantSkills || [proj.disciplineCategory || "Applied Project"];
      for (const rawSkill of skills) {
        const canonical = normalizeSkill(rawSkill) || rawSkill;
        timeline.push({
          evidenceId: `ev_proj_${proj._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          canonicalSkill: canonical,
          sourceType: "project_deliverable",
          status: "inferred_proficiency", // Structured rubric assessment
          isPassing: isPass,
          score: evaluation.overallScore ?? percentage,
          maxScore: 100,
          percentage,
          timestamp: proj.evaluatedAt || proj.updatedAt || new Date().toISOString(),
          confidence: 0.85, // Rubric evaluated
          templateId: proj.templateId,
          metadata: {
            status: proj.status,
            milestonesCompleted: (proj.milestonesProgress || []).filter((m) => m.isCompleted).length,
            milestonesTotal: (proj.milestonesProgress || []).length,
          },
        });
      }
    }

    // 4. Normalize Spaced Revision Sessions
    for (const rev of spacedRevisions) {
      if (rev.lastReviewedDate) {
        const percentage = rev.lastScore ?? (rev.status === "completed" ? 80 : 50);
        const canonical = normalizeSkill(rev.canonicalName || rev.skill) || rev.skill;
        timeline.push({
          evidenceId: `ev_rev_${rev._id}`,
          canonicalSkill: canonical,
          sourceType: "spaced_revision",
          status: "inferred_proficiency",
          isPassing: percentage >= 70,
          score: percentage,
          maxScore: 100,
          percentage,
          timestamp: rev.lastReviewedDate,
          confidence: 0.75,
          metadata: {
            retrievalInterval: rev.currentIntervalDays,
            consecutiveSuccesses: rev.consecutiveSuccesses,
          },
        });
      }
    }

    // 5. Normalize Checkpoint Quiz Attempts
    for (const cp of checkpointAttempts) {
      const canonical = normalizeSkill(cp.skill || "General Knowledge") || "General Knowledge";
      timeline.push({
        evidenceId: `ev_cp_${cp._id}`,
        canonicalSkill: canonical,
        sourceType: "quiz_checkpoint",
        status: cp.isCorrect ? "demonstrated_knowledge" : "demonstrated_knowledge",
        isPassing: Boolean(cp.isCorrect),
        score: cp.isCorrect ? 100 : 0,
        maxScore: 100,
        percentage: cp.isCorrect ? 100 : 0,
        timestamp: cp.attemptedAt || new Date().toISOString(),
        confidence: 0.80,
        metadata: {
          videoId: cp.videoId,
          questionId: cp.questionId,
        },
      });
    }

    // 6. Normalize Historical Assessment records (LearnerSkillAssessmentHistory)
    for (const hist of historyRecords) {
      const canonical = normalizeSkill(hist.canonicalName || hist.skill) || hist.skill;
      timeline.push({
        evidenceId: `ev_hist_${hist._id}`,
        canonicalSkill: canonical,
        sourceType: "skill_history",
        status: "demonstrated_knowledge",
        isPassing: hist.score >= 70,
        score: hist.score,
        maxScore: 100,
        percentage: hist.score,
        timestamp: hist.assessmentDate || hist.createdAt || new Date().toISOString(),
        confidence: 0.90,
        metadata: {
          scoreDelta: hist.scoreDelta,
          previousScore: hist.previousScore,
          evidenceSource: hist.evidenceSource,
        },
      });
    }

    // Sort complete timeline descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Group normalized evidence by canonical skill
    const normalizedBySkill = {};
    for (const item of timeline) {
      const key = item.canonicalSkill;
      if (!normalizedBySkill[key]) {
        normalizedBySkill[key] = {
          canonicalSkill: key,
          history: [],
          latestEvidence: null,
          previousEvidence: null,
          highestEvidence: null,
          overallStatus: "insufficient_evidence",
          latestScore: 0,
          previousScore: null,
          scoreDelta: null,
          hasPassed: false,
        };
      }

      normalizedBySkill[key].history.push(item);
    }

    // Compute skill aggregates and progression deltas
    for (const [key, skillData] of Object.entries(normalizedBySkill)) {
      const items = skillData.history;
      if (items.length > 0) {
        skillData.latestEvidence = items[0];
        skillData.latestScore = items[0].percentage;
        skillData.hasPassed = items.some((i) => i.isPassing);

        // Find highest score
        let highest = items[0];
        for (const it of items) {
          if (it.percentage > highest.percentage) {
            highest = it;
          }
        }
        skillData.highestEvidence = highest;

        // If there's an earlier comparable evidence item (e.g. from the same source type)
        const previousComparable = items.slice(1).find((it) => it.sourceType === items[0].sourceType);
        if (previousComparable) {
          skillData.previousEvidence = previousComparable;
          skillData.previousScore = previousComparable.percentage;
          skillData.scoreDelta = items[0].percentage - previousComparable.percentage;
        }

        // Determine overall status based on highest confidence evidence
        const hasDemonstrated = items.some((i) => i.status === "demonstrated_knowledge");
        const hasInferred = items.some((i) => i.status === "inferred_proficiency");

        if (hasDemonstrated) {
          skillData.overallStatus = "demonstrated_knowledge";
        } else if (hasInferred) {
          skillData.overallStatus = "inferred_proficiency";
        } else {
          skillData.overallStatus = "self_reported";
        }
      }
    }

    return {
      rawCount: timeline.length,
      normalizedBySkill,
      timeline,
    };
  }
}

export const evidenceNormalizationService = new EvidenceNormalizationService();
export default evidenceNormalizationService;
