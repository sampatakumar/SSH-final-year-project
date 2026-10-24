/**
 * SMART SKILL HUB — ASSESSMENT CENTER SERVICE (PHASE 44)
 *
 * Coordinates assessment catalog discovery, server-side grading,
 * persistent student attempt lifecycles, skill-evidence integration,
 * branch-aware recommendations, and Project Studio connections.
 */

import mongoose from "mongoose";
import { BranchAssessment } from "../models/branchAssessment.models.js";
import { AssessmentAttempt } from "../models/assessmentAttempt.models.js";
import { ASSESSMENTS_CATALOG } from "../constants/assessmentCatalog.js";
import {
  evaluateAssessmentSubmission,
  sanitizeAssessmentForClient,
} from "./assessmentGrading.service.js";
import { LearnerSkillAssessmentHistory } from "../../skills/models/learnerSkillAssessmentHistory.models.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { normalizeAcademicProfile } from "./academicNormalization.service.js";
import { User } from "../../../core/database/models/user.models.js";
import { StudentProject } from "../models/studentProject.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export class AssessmentCenterService {
  /**
   * Seed the centralized assessment catalog into MongoDB.
   */
  async seedCatalog() {
    const isDbConnected = mongoose.connection.readyState === 1;
    if (!isDbConnected && !BranchAssessment.bulkWrite?.mock) {
      return { seeded: ASSESSMENTS_CATALOG.length, source: "in_memory" };
    }

    const operations = ASSESSMENTS_CATALOG.map((assessment) => ({
      updateOne: {
        filter: { assessmentId: assessment.assessmentId },
        update: { $set: assessment },
        upsert: true,
      },
    }));

    if (BranchAssessment.bulkWrite) {
      await BranchAssessment.bulkWrite(operations);
    }
    return { seeded: ASSESSMENTS_CATALOG.length, source: "database" };
  }

  /**
   * List published assessments with branch, discipline, and difficulty filtering.
   */
  async listAssessments(query = {}) {
    const {
      branchSlug,
      disciplineCategory,
      difficulty,
      roleSlug,
      search,
      page = 1,
      limit = 20,
    } = query;

    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected && BranchAssessment.find && !BranchAssessment.find?.mock) {
      const filter = { status: "published" };

      if (branchSlug && branchSlug !== "all") {
        filter.branchSlugs = { $in: [branchSlug.toLowerCase().trim()] };
      }
      if (disciplineCategory && disciplineCategory !== "all") {
        filter.disciplineCategory = disciplineCategory;
      }
      if (difficulty && difficulty !== "all") {
        filter.difficulty = difficulty;
      }
      if (roleSlug) {
        filter.relevantRoleSlugs = { $in: [roleSlug.toLowerCase().trim()] };
      }
      if (search) {
        const regex = new RegExp(search.trim(), "i");
        filter.$or = [{ title: regex }, { description: regex }, { relevantSkills: regex }];
      }

      const skip = (Number(page) - 1) * Number(limit);
      const [assessments, total] = await Promise.all([
        BranchAssessment.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        BranchAssessment.countDocuments(filter),
      ]);

      return {
        assessments: assessments.map((a) => sanitizeAssessmentForClient(a)),
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      };
    }

    // In-memory catalog fallback
    let list = [...ASSESSMENTS_CATALOG];

    if (branchSlug && branchSlug !== "all") {
      const cleanBranch = branchSlug.toLowerCase().trim();
      list = list.filter((a) =>
        (a.branchSlugs || []).map((b) => b.toLowerCase()).includes(cleanBranch)
      );
    }
    if (disciplineCategory && disciplineCategory !== "all") {
      list = list.filter((a) => a.disciplineCategory === disciplineCategory);
    }
    if (difficulty && difficulty !== "all") {
      list = list.filter((a) => a.difficulty === difficulty);
    }
    if (roleSlug) {
      const cleanRole = roleSlug.toLowerCase().trim();
      list = list.filter((a) =>
        (a.relevantRoleSlugs || []).map((r) => r.toLowerCase()).includes(cleanRole)
      );
    }
    if (search) {
      const term = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.description.toLowerCase().includes(term) ||
          (a.relevantSkills || []).some((s) => s.toLowerCase().includes(term))
      );
    }

    const total = list.length;
    const skip = (Number(page) - 1) * Number(limit);
    const paginated = list.slice(skip, skip + Number(limit));

    return {
      assessments: paginated.map((a) => sanitizeAssessmentForClient(a)),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Retrieve a single assessment by ID.
   */
  async getAssessmentById(assessmentId, { sanitize = true } = {}) {
    const cleanId = String(assessmentId || "").trim().toLowerCase();
    const isDbConnected = mongoose.connection.readyState === 1;

    let assessment = null;
    if (isDbConnected && BranchAssessment.findOne && !BranchAssessment.findOne?.mock) {
      assessment = await BranchAssessment.findOne({ assessmentId: cleanId }).lean();
    }

    if (!assessment) {
      assessment = ASSESSMENTS_CATALOG.find((a) => a.assessmentId === cleanId) || null;
    }

    if (!assessment) {
      throw new ApiError(404, `Assessment with ID "${assessmentId}" not found`);
    }

    return sanitize ? sanitizeAssessmentForClient(assessment) : assessment;
  }

  /**
   * Start an assessment attempt for an authenticated student.
   */
  async startAttempt(studentId, assessmentId) {
    if (!studentId) {
      throw new ApiError(401, "Authentication required to start an assessment attempt");
    }

    const assessment = await this.getAssessmentById(assessmentId, { sanitize: false });

    // Create persistent attempt record
    const attempt = await AssessmentAttempt.create({
      owner: studentId,
      assessmentId: assessment.assessmentId,
      version: assessment.version || 1,
      status: "in_progress",
      startedAt: new Date(),
      submittedAnswers: {},
      scoringMethod: "deterministic_server_evaluated",
    });

    return {
      attemptId: attempt._id,
      assessment: sanitizeAssessmentForClient(assessment),
      startedAt: attempt.startedAt,
      status: attempt.status,
    };
  }

  /**
   * Submit an assessment attempt for deterministic server-side evaluation.
   */
  async submitAttempt(studentId, attemptId, payload = {}) {
    if (!studentId) {
      throw new ApiError(401, "Authentication required to submit an assessment attempt");
    }

    const { answers = {}, timeSpentSeconds = 0 } = payload;

    const attempt = await AssessmentAttempt.findById(attemptId);
    if (!attempt) {
      throw new ApiError(404, "Assessment attempt not found");
    }

    // Ownership check
    if (attempt.owner.toString() !== studentId.toString()) {
      throw new ApiError(403, "Access denied: cannot submit another student's assessment attempt");
    }

    if (attempt.status === "submitted") {
      throw new ApiError(400, "This assessment attempt has already been submitted and graded");
    }

    // Fetch authoritative assessment definition (with answer keys)
    const assessment = await this.getAssessmentById(attempt.assessmentId, { sanitize: false });

    // Run server-side deterministic evaluation
    const evaluation = evaluateAssessmentSubmission(assessment, answers, timeSpentSeconds);

    // Update attempt
    attempt.status = "submitted";
    attempt.submittedAt = new Date();
    attempt.timeSpentSeconds = Number(timeSpentSeconds) || attempt.timeSpentSeconds || 0;
    attempt.submittedAnswers = answers;
    attempt.score = evaluation.score;
    attempt.maxScore = evaluation.maxScore;
    attempt.percentage = evaluation.percentage;
    attempt.isPassing = evaluation.isPassing;
    attempt.questionResults = evaluation.questionResults;
    attempt.topicPerformance = evaluation.topicPerformance;
    attempt.strengths = evaluation.strengths;
    attempt.areasForImprovement = evaluation.areasForImprovement;
    attempt.recommendedNextSteps = evaluation.recommendedNextSteps;
    attempt.scoringMethod = evaluation.scoringMethod;

    await attempt.save();

    // Skill Evidence Integration: Log formal assessment outcomes into LearnerSkillAssessmentHistory
    try {
      const isDbConnected = mongoose.connection.readyState === 1;
      if (isDbConnected || LearnerSkillAssessmentHistory.create?.mock) {
        const skillsToRecord = assessment.relevantSkills || [];
        for (const rawSkill of skillsToRecord) {
          const canonicalName = normalizeSkill(rawSkill) || rawSkill;
          await LearnerSkillAssessmentHistory.create({
            owner: studentId,
            skill: canonicalName,
            canonicalName,
            assessmentType: "formative_quiz",
            taskId: assessment.assessmentId,
            score: evaluation.percentage,
            previousScore: 0,
            scoreDelta: 0,
            testCasesPassed: evaluation.isPassing ? 1 : 0,
            testCasesTotal: 1,
            evidenceSource: "assessment",
            assessmentDate: new Date(),
          }).catch(() => null);
        }
      }
    } catch {
      // Non-blocking telemetry logging failure
    }

    return attempt;
  }

  /**
   * Retrieve student's attempt history.
   */
  async getStudentAttempts(studentId, query = {}) {
    if (!studentId) {
      throw new ApiError(401, "Authentication required to view attempt history");
    }

    const { assessmentId, limit = 20, page = 1 } = query;
    const filter = { owner: studentId };

    if (assessmentId) {
      filter.assessmentId = String(assessmentId).trim().toLowerCase();
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [attempts, total] = await Promise.all([
      AssessmentAttempt.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      AssessmentAttempt.countDocuments(filter),
    ]);

    return {
      attempts,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Get single attempt detail with authorization check.
   */
  async getAttemptById(studentId, attemptId) {
    if (!studentId) {
      throw new ApiError(401, "Authentication required to view attempt details");
    }

    const attempt = await AssessmentAttempt.findById(attemptId).lean();
    if (!attempt) {
      throw new ApiError(404, "Assessment attempt not found");
    }

    if (attempt.owner.toString() !== studentId.toString()) {
      throw new ApiError(403, "Access denied: cannot view another student's assessment attempt");
    }

    return attempt;
  }

  /**
   * Provide branch-aware, personalized assessment recommendations.
   */
  async getRecommendedAssessments(studentId) {
    if (!studentId) {
      return { recommendations: [], branchSlug: "general" };
    }

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    const [user, pastAttempts, activeProjects] = await Promise.all([
      (isDbConnected || User.findById?.mock) ? User.findById(studentId).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || AssessmentAttempt.find?.mock) ? AssessmentAttempt.find({ owner: studentId }).sort({ createdAt: -1 }).limit(30).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || StudentProject.find?.mock) ? StudentProject.find({ owner: studentId }).sort({ updatedAt: -1 }).limit(5).lean().catch(() => []) : Promise.resolve([]),
    ]);

    const normalizedAcademic = normalizeAcademicProfile(user?.academic);
    const branchSlug = normalizedAcademic.branchSlug || "general";

    // Index best past percentage per assessmentId
    const bestScoreMap = new Map();
    for (const att of pastAttempts) {
      if (att.status === "submitted") {
        const cur = bestScoreMap.get(att.assessmentId) ?? 0;
        if (att.percentage > cur) {
          bestScoreMap.set(att.assessmentId, att.percentage);
        }
      }
    }

    const allAssessments = ASSESSMENTS_CATALOG;
    const recommendations = [];

    // 1. Check for retakes (attempted, but score < 70%)
    for (const [id, score] of bestScoreMap.entries()) {
      if (score < 70) {
        const match = allAssessments.find((a) => a.assessmentId === id);
        if (match) {
          recommendations.push({
            reason: "retake_to_pass",
            reasonLabel: `Retry Recommended (Previous Score: ${score}%)`,
            assessment: sanitizeAssessmentForClient(match),
            priority: 1,
          });
        }
      }
    }

    // 2. Check for active project prerequisites
    const activeProjectTemplateIds = activeProjects
      .filter((p) => ["in_progress", "changes_requested"].includes(p.status))
      .map((p) => p.templateId);

    for (const a of allAssessments) {
      if (
        (a.recommendedProjectIds || []).some((pid) => activeProjectTemplateIds.includes(pid)) &&
        !recommendations.some((r) => r.assessment.assessmentId === a.assessmentId)
      ) {
        const best = bestScoreMap.get(a.assessmentId);
        if (best === undefined || best < 70) {
          recommendations.push({
            reason: "project_prerequisite",
            reasonLabel: "Recommended Prerequisite for Active Project",
            assessment: sanitizeAssessmentForClient(a),
            priority: 2,
          });
        }
      }
    }

    // 3. Match by student academic branch
    const branchMatches = allAssessments.filter((a) =>
      (a.branchSlugs || []).includes(branchSlug) &&
      !recommendations.some((r) => r.assessment.assessmentId === a.assessmentId)
    );

    for (const a of branchMatches) {
      const best = bestScoreMap.get(a.assessmentId);
      recommendations.push({
        reason: "branch_core",
        reasonLabel: `Core Assessment for ${normalizedAcademic.branchName || branchSlug}`,
        assessment: sanitizeAssessmentForClient(a),
        priority: best !== undefined && best >= 70 ? 4 : 3,
        passed: best !== undefined && best >= 70,
      });
    }

    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);

    return {
      recommendations: recommendations.slice(0, 6),
      branchSlug,
      targetRole: user?.targetRole || null,
      totalAttempts: pastAttempts.length,
    };
  }
}

export const assessmentCenterService = new AssessmentCenterService();
export default assessmentCenterService;
