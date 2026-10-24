import mongoose from "mongoose";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { AssessmentAttempt } from "../../academic/models/assessmentAttempt.models.js";
import { PracticalLabAttempt } from "../../academic/models/practicalLabAttempt.models.js";
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

/**
 * Deterministic Heuristic Evidence-Strength Weights (0.0 to 1.0)
 *
 * IMPORTANT METHODOLOGICAL DEFINITION:
 * These values represent deterministic heuristic ranking weights characterizing
 * the verification rigor and objective evaluation veracity of different evidence sources.
 * They are NOT statistically calibrated Bayesian or frequentist probabilities.
 *
 * Veracity Tiers:
 * - 0.95: Objective automated grading (Assessment Center, Docker sandbox execution)
 * - 0.90: Authoritative server-evaluated interactive calculations (Practical Labs, Historical verified records)
 * - 0.85: Structured rubric-based milestone evaluation (Project Studio Deliverables)
 * - 0.80: Formative checkpoint quiz evaluations (EduTube Checkpoints)
 * - 0.75: Spaced retrieval practice recall repetitions (Spaced Revision)
 */
export const DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS = Object.freeze({
  ASSESSMENT_CENTER: 0.95,
  CODING_SANDBOX: 0.95,
  PRACTICAL_LAB: 0.90,
  HISTORICAL_ASSESSMENT: 0.90,
  PROJECT_STUDIO_RUBRIC: 0.85,
  QUIZ_CHECKPOINT: 0.80,
  SPACED_REVISION: 0.75,
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
      practicalLabAttempts,
    ] = await Promise.all([
      this.safeFind(AssessmentAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 50),
      this.safeFind(StudentProject, { owner: ownerId }, { updatedAt: -1 }, 30),
      this.safeFind(CodingSubmission, { owner: ownerId }, { submittedAt: -1 }, 50),
      this.safeFind(SpacedRevisionSchedule, { owner: ownerId }, { updatedAt: -1 }, 30),
      this.safeFind(EduTubeCheckpointAttempt, { owner: ownerId }, { attemptedAt: -1 }, 30),
      this.safeFind(LearnerSkillAssessmentHistory, { owner: ownerId }, { assessmentDate: -1 }, 50),
      this.safeFind(PracticalLabAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 50),
    ]);

    const timeline = [];
    const seenEvidenceIds = new Set();

    // Helper to safely append deduplicated evidence items
    const appendEvidence = (item) => {
      if (!item || !item.evidenceId || seenEvidenceIds.has(item.evidenceId)) {
        return;
      }
      seenEvidenceIds.add(item.evidenceId);
      timeline.push(item);
    };

    // 1. Normalize Assessment Center attempts (Phase 44)
    for (const attempt of assessmentAttempts) {
      const percentage = attempt.percentage ?? (attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0);
      const isPass = attempt.isPassing ?? percentage >= 70;
      const rawSkills = ASSESSMENT_SKILLS_MAP.get(attempt.assessmentId) || [attempt.assessmentId];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_assess_${attempt._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          canonicalSkill: canonical,
          sourceType: "assessment_attempt",
          status: "demonstrated_knowledge", // Veracity tier: objectively tested by assessment
          isPassing: isPass,
          score: attempt.score ?? 0,
          maxScore: attempt.maxScore ?? 100,
          percentage,
          timestamp: attempt.submittedAt || attempt.createdAt || new Date().toISOString(),
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER,
          confidenceType: "deterministic_heuristic_strength",
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
      appendEvidence({
        evidenceId: `ev_code_${sub._id}`,
        canonicalSkill: canonical,
        sourceType: "coding_submission",
        status: "demonstrated_knowledge", // Veracity tier: automated container execution
        isPassing: sub.status === "passed" || percentage >= 70,
        score: sub.score ?? 0,
        maxScore: 10,
        percentage,
        timestamp: sub.submittedAt || sub.createdAt || new Date().toISOString(),
        confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.CODING_SANDBOX,
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.CODING_SANDBOX,
        confidenceType: "deterministic_heuristic_strength",
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

      const rawSkills = proj.relevantSkills || [proj.disciplineCategory || "Applied Project"];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_proj_${proj._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          canonicalSkill: canonical,
          sourceType: "project_deliverable",
          status: "inferred_proficiency", // Structured rubric assessment
          isPassing: isPass,
          score: evaluation.overallScore ?? percentage,
          maxScore: 100,
          percentage,
          timestamp: proj.evaluatedAt || proj.updatedAt || new Date().toISOString(),
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC,
          confidenceType: "deterministic_heuristic_strength",
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
        appendEvidence({
          evidenceId: `ev_rev_${rev._id}`,
          canonicalSkill: canonical,
          sourceType: "spaced_revision",
          status: "inferred_proficiency",
          isPassing: percentage >= 70,
          score: percentage,
          maxScore: 100,
          percentage,
          timestamp: rev.lastReviewedDate,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.SPACED_REVISION,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.SPACED_REVISION,
          confidenceType: "deterministic_heuristic_strength",
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
      appendEvidence({
        evidenceId: `ev_cp_${cp._id}`,
        canonicalSkill: canonical,
        sourceType: "quiz_checkpoint",
        status: "demonstrated_knowledge",
        isPassing: Boolean(cp.isCorrect),
        score: cp.isCorrect ? 100 : 0,
        maxScore: 100,
        percentage: cp.isCorrect ? 100 : 0,
        timestamp: cp.attemptedAt || new Date().toISOString(),
        confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.QUIZ_CHECKPOINT,
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.QUIZ_CHECKPOINT,
        confidenceType: "deterministic_heuristic_strength",
        metadata: {
          videoId: cp.videoId,
          questionId: cp.questionId,
        },
      });
    }

    // 6. Normalize Historical Assessment records (LearnerSkillAssessmentHistory)
    for (const hist of historyRecords) {
      const canonical = normalizeSkill(hist.canonicalName || hist.skill) || hist.skill;
      appendEvidence({
        evidenceId: `ev_hist_${hist._id}`,
        canonicalSkill: canonical,
        sourceType: "skill_history",
        status: "demonstrated_knowledge",
        isPassing: hist.score >= 70,
        score: hist.score,
        maxScore: 100,
        percentage: hist.score,
        timestamp: hist.assessmentDate || hist.createdAt || new Date().toISOString(),
        confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.HISTORICAL_ASSESSMENT,
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.HISTORICAL_ASSESSMENT,
        confidenceType: "deterministic_heuristic_strength",
        metadata: {
          scoreDelta: hist.scoreDelta,
          previousScore: hist.previousScore,
          evidenceSource: hist.evidenceSource,
        },
      });
    }

    // 7. Normalize Practical Learning Lab Attempts (Phase 46)
    for (const labAttempt of practicalLabAttempts) {
      const percentage = labAttempt.percentage ?? (labAttempt.maxScore ? Math.round((labAttempt.serverScore / labAttempt.maxScore) * 100) : 0);
      const isPass = labAttempt.isPassing ?? percentage >= 70;
      const rawSkills = (labAttempt.skillsEvaluated && labAttempt.skillsEvaluated.length > 0)
        ? labAttempt.skillsEvaluated
        : [labAttempt.disciplineCategory || "Practical Skills"];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_lab_${labAttempt._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          canonicalSkill: canonical,
          sourceType: "practical_lab",
          status: "demonstrated_knowledge", // Server-evaluated practical exercise
          isPassing: isPass,
          score: labAttempt.serverScore ?? 0,
          maxScore: labAttempt.maxScore ?? 100,
          percentage,
          timestamp: labAttempt.submittedAt || labAttempt.createdAt || new Date().toISOString(),
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PRACTICAL_LAB,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PRACTICAL_LAB,
          confidenceType: "deterministic_heuristic_strength",
          labId: labAttempt.labId,
          version: labAttempt.labVersion || 1,
          metadata: {
            disciplineCategory: labAttempt.disciplineCategory,
            masteryLevel: labAttempt.masteryLevel,
            taskResultsCount: (labAttempt.taskResults || []).length,
          },
        });
      }
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
