import { LearningActivityRecord } from "../models/learningActivityRecord.models.js";
import { SkillProfile } from "../models/skillProfile.models.js";
import { adaptiveSkillLoopService } from "./adaptive-skill-loop.service.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { VERIFIED_CODING_TASKS } from "../../recommendations/catalog/taskMappings.js";
import { createNotification } from "../../notifications/services/notification.service.js";
import { NOTIFICATION_TYPES } from "../../notifications/models/notification.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export class LearningOutcomeTrackerService {
  /**
   * Record a learning activity or assessment outcome with idempotency and competency validation.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user ID
   * @param {object} payload - Activity parameters
   * @returns {Promise<object>} Result record and adaptation summary
   */
  async recordActivity(ownerId, payload = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to record learning activity.");
    }

    const {
      activityType,
      skill,
      targetRole = "Full Stack Developer",
      entityId = "",
      title = "",
      status = "completed",
      evidence = {},
      idempotencyKey = null,
    } = payload;

    const validTypes = [
      "course_selected",
      "module_started",
      "module_completed",
      "coding_attempted",
      "coding_passed",
      "coding_failed",
      "project_milestone",
      "skill_reassessed",
      "roadmap_milestone",
    ];

    if (!activityType || !validTypes.includes(activityType)) {
      throw new ApiError(400, `Invalid activityType. Allowed types: ${validTypes.join(", ")}`);
    }

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      throw new ApiError(400, "skill is required.");
    }

    const canonicalName = normalizeSkill(skill) || skill.trim();

    // 1. Idempotency check: if an idempotency key was supplied, return existing record
    if (idempotencyKey && typeof idempotencyKey === "string") {
      const existing = await LearningActivityRecord.findOne({
        owner: ownerId,
        idempotencyKey: idempotencyKey.trim(),
      }).lean();

      if (existing) {
        return {
          isDuplicate: true,
          activity: existing,
          message: "Activity previously recorded (idempotent duplicate).",
        };
      }
    }

    // 2. Explicit competency boundary:
    // Only verified sandbox test passes or authenticated assessments demonstrate actual competency.
    // Video completion, reading docs, or manual completion does NOT award mastery.
    const isDemonstratedCompetency =
      activityType === "coding_passed" ||
      (activityType === "skill_reassessed" && Number(evidence.score) >= 70 && evidence.evidenceSource === "coding");

    // 3. Create persistent learning record
    let record;
    try {
      record = await LearningActivityRecord.create({
        owner: ownerId,
        activityType,
        skill: canonicalName,
        canonicalName,
        targetRole,
        entityId: String(entityId || ""),
        title: String(title || (activityType.replace(/_/g, " "))),
        isDemonstratedCompetency,
        evidence: {
          score: Number(evidence.score) || 0,
          maxScore: Number(evidence.maxScore) || 10,
          testCasesPassed: Number(evidence.testCasesPassed) || 0,
          testCasesTotal: Number(evidence.testCasesTotal) || 0,
          executionTimeMs: Number(evidence.executionTimeMs) || 0,
          details: String(evidence.details || ""),
          evidenceSource: String(evidence.evidenceSource || (activityType.startsWith("coding") ? "coding" : "edutube")),
          sandboxVerified: Boolean(evidence.sandboxVerified ?? activityType.startsWith("coding")),
        },
        status,
        idempotencyKey: idempotencyKey ? idempotencyKey.trim() : undefined,
        recordedAt: new Date(),
      });
    } catch (err) {
      // In case of parallel race condition on unique compound index
      if (err.code === 11000 && idempotencyKey) {
        const existing = await LearningActivityRecord.findOne({
          owner: ownerId,
          idempotencyKey: idempotencyKey.trim(),
        }).lean();
        if (existing) {
          return {
            isDuplicate: true,
            activity: existing,
            message: "Activity previously recorded (idempotent race).",
          };
        }
      }
      throw err;
    }

    // 4. Adapt learning loop based on outcome
    let adaptation = {
      reassessmentApplied: false,
      repeatedFailureDetected: false,
      remediationRequired: false,
      nextPracticeTask: null,
    };

    if (activityType === "coding_passed") {
      // Empirical pass -> update skill profile and empirical confidence
      const assessmentResult = await adaptiveSkillLoopService.recordAdaptiveAssessmentOutcome(ownerId, {
        skill: canonicalName,
        taskId: entityId,
        score: evidence.score || 10,
        maxScore: evidence.maxScore || 10,
        testCasesPassed: evidence.testCasesPassed || 1,
        testCasesTotal: evidence.testCasesTotal || 1,
        assessmentType: "coding_challenge",
      });

      adaptation.reassessmentApplied = true;
      adaptation.updatedSkill = assessmentResult;
    } else if (activityType === "coding_failed") {
      // Check for repeated failures on this skill (2+ recent failed attempts)
      const recentFailures = await LearningActivityRecord.countDocuments({
        owner: ownerId,
        canonicalName,
        activityType: "coding_failed",
        recordedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      if (recentFailures >= 2) {
        adaptation.repeatedFailureDetected = true;
        adaptation.remediationRequired = true;

        // Flag demonstrated weakness in SkillProfile
        await SkillProfile.updateOne(
          { owner: ownerId, "skillGaps.canonicalName": canonicalName },
          {
            $set: {
              "skillGaps.$.evidenceState": "demonstrated_weakness",
              "skillGaps.$.reason": `Demonstrated repeated difficulty in sandbox challenges (${recentFailures} failed attempts). Review foundational prerequisites.`,
            },
          }
        ).catch(() => null);

        createNotification(ownerId, {
          type: NOTIFICATION_TYPES.SKILL_GAP,
          title: `Targeted Practice Recommended: ${canonicalName}`,
          message: `You've attempted challenges in ${canonicalName} multiple times. We recommend reviewing foundational concepts before re-attempting.`,
          destination: "/dashboard/mentor",
          eventId: `remediation_${ownerId}_${canonicalName}_${Date.now()}`,
          metadata: { skill: canonicalName, failureCount: recentFailures },
        }).catch(() => null);
      }
    } else if (activityType === "module_completed") {
      // Educational content completed! Suggest corresponding hands-on challenge to prove competency
      const verifiedTask = VERIFIED_CODING_TASKS[canonicalName] || null;
      if (verifiedTask) {
        adaptation.nextPracticeTask = {
          taskId: verifiedTask.taskId,
          title: verifiedTask.taskTitle,
          category: verifiedTask.category,
        };

        createNotification(ownerId, {
          type: NOTIFICATION_TYPES.LEARNING_MILESTONE,
          title: `Module Completed: ${canonicalName}`,
          message: `Great job completing the ${canonicalName} lesson! Now prove your competency by solving the "${verifiedTask.taskTitle}" sandbox challenge.`,
          destination: `/dashboard/coding`,
          eventId: `module_complete_${ownerId}_${entityId || canonicalName}`,
          metadata: { skill: canonicalName, taskId: verifiedTask.taskId },
        }).catch(() => null);
      }
    }

    return {
      isDuplicate: false,
      activity: record,
      adaptation,
    };
  }

  /**
   * Get learner's recent chronological activities with strict per-user authorization.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user ID
   * @param {object} options - { limit, skip, activityType, skill }
   * @returns {Promise<Array<object>>}
   */
  async getLearnerActivities(ownerId, { limit = 20, skip = 0, activityType = null, skill = null } = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }

    const query = { owner: ownerId };
    if (activityType) query.activityType = activityType;
    if (skill) query.canonicalName = normalizeSkill(skill) || skill;

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeSkip = Math.max(Number(skip) || 0, 0);

    const [activities, total] = await Promise.all([
      LearningActivityRecord.find(query)
        .sort({ recordedAt: -1 })
        .skip(safeSkip)
        .limit(safeLimit)
        .lean(),
      LearningActivityRecord.countDocuments(query),
    ]);

    return {
      activities,
      total,
      limit: safeLimit,
      skip: safeSkip,
    };
  }

  /**
   * Get aggregated progress summary for a specific skill.
   */
  async getSkillProgressSummary(ownerId, skill) {
    if (!ownerId) throw new ApiError(401, "Authentication required.");
    const canonicalName = normalizeSkill(skill) || skill;

    const activities = await LearningActivityRecord.find({
      owner: ownerId,
      canonicalName,
    })
      .sort({ recordedAt: -1 })
      .lean();

    const modulesWatched = activities.filter((a) => a.activityType === "module_completed").length;
    const codingAttempts = activities.filter((a) => a.activityType.startsWith("coding")).length;
    const codingPasses = activities.filter((a) => a.activityType === "coding_passed").length;
    const codingFailures = activities.filter((a) => a.activityType === "coding_failed").length;

    const hasDemonstratedCompetency = activities.some((a) => a.isDemonstratedCompetency === true);

    return {
      skill: canonicalName,
      modulesWatched,
      codingAttempts,
      codingPasses,
      codingFailures,
      hasDemonstratedCompetency,
      lastActivityDate: activities[0]?.recordedAt || null,
      recentActivityTypes: activities.slice(0, 5).map((a) => a.activityType),
    };
  }
}

export const learningOutcomeTrackerService = new LearningOutcomeTrackerService();
