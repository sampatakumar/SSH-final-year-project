/**
 * Adaptive Spaced Revision Service
 *
 * Implements a configurable, performance-informed spaced-retrieval engine
 * inspired by cognitive science retrieval practice and forgetting-curve heuristics.
 *
 * NOTE: This implementation is a configurable product heuristic designed to support
 * student learning workflows, not a scientifically validated clinical memory model.
 */

import { SpacedRevisionSchedule } from "../models/spacedRevisionSchedule.models.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";

// Configurable spaced-revision intervals (in days)
export const REVISION_INTERVALS_DAYS = [1, 3, 7, 14, 30];
export const SUCCESS_THRESHOLD_SCORE = 70;

export class SpacedRevisionService {
  /**
   * Calculate UTC date boundaries for today.
   */
  getUtcDayBounds(baseDate = new Date()) {
    const startOfToday = new Date(baseDate);
    startOfToday.setUTCHours(0, 0, 0, 0);

    const endOfToday = new Date(baseDate);
    endOfToday.setUTCHours(23, 59, 59, 999);

    return { startOfToday, endOfToday };
  }

  /**
   * Retrieve revisions due today or overdue for the authenticated student.
   */
  async getDueRevisions(ownerId, { limit = 20 } = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to retrieve due revisions.");
    }

    const { startOfToday, endOfToday } = this.getUtcDayBounds();

    const dueItems = await SpacedRevisionSchedule.find({
      owner: ownerId,
      status: { $in: ["pending", "needs_reinforcement", "overdue", "in_progress"] },
      scheduledDate: { $lte: endOfToday },
    })
      .sort({ scheduledDate: 1 })
      .limit(Number(limit) || 20)
      .lean();

    return dueItems.map((item) => {
      const isOverdue = new Date(item.scheduledDate) < startOfToday && item.status !== "needs_reinforcement";
      return {
        ...item,
        isDue: true,
        isOverdue,
        computedStatus: item.status === "needs_reinforcement" ? "needs_reinforcement" : isOverdue ? "overdue" : "due",
      };
    });
  }

  /**
   * Retrieve upcoming scheduled revisions for the authenticated student.
   */
  async getUpcomingRevisions(ownerId, { limit = 20 } = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to retrieve upcoming revisions.");
    }

    const { endOfToday } = this.getUtcDayBounds();

    const upcomingItems = await SpacedRevisionSchedule.find({
      owner: ownerId,
      status: "pending",
      scheduledDate: { $gt: endOfToday },
    })
      .sort({ scheduledDate: 1 })
      .limit(Number(limit) || 20)
      .lean();

    return upcomingItems.map((item) => ({
      ...item,
      isDue: false,
      computedStatus: "upcoming",
    }));
  }

  /**
   * Get full revision queue breakdown for student dashboard intelligence.
   */
  async getRevisionQueue(ownerId, { limit = 10 } = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }

    const [due, upcoming, reinforcementCount] = await Promise.all([
      this.getDueRevisions(ownerId, { limit }),
      this.getUpcomingRevisions(ownerId, { limit }),
      SpacedRevisionSchedule.countDocuments({
        owner: ownerId,
        status: "needs_reinforcement",
      }),
    ]);

    const totalScheduled = await SpacedRevisionSchedule.countDocuments({ owner: ownerId });

    return {
      due,
      upcoming,
      stats: {
        dueTodayCount: due.length,
        upcomingCount: upcoming.length,
        needsReinforcementCount: reinforcementCount,
        totalScheduled,
      },
    };
  }

  /**
   * Record a student retrieval attempt on a scheduled revision item.
   *
   * @param {string} ownerId - Authenticated student ID
   * @param {string} scheduleId - SpacedRevisionSchedule _id
   * @param {object} payload - { score, answers, idempotencyKey, answerGiven }
   */
  async recordRevisionAttempt(ownerId, scheduleId, payload = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }
    if (!scheduleId) {
      throw new ApiError(400, "scheduleId is required.");
    }

    const schedule = await SpacedRevisionSchedule.findById(scheduleId);
    if (!schedule) {
      throw new ApiError(404, "Revision schedule item not found.");
    }

    // Enforce student ownership isolation
    if (schedule.owner.toString() !== ownerId.toString()) {
      throw new ApiError(403, "Access forbidden: You cannot review another student's revision schedule.");
    }

    const { score = 0, idempotencyKey = null, answerGiven = "" } = payload;
    const cleanScore = Math.max(0, Math.min(100, Number(score) || 0));

    // Idempotency check: if already processed, return existing outcome
    if (idempotencyKey) {
      const existingHistory = (schedule.history || []).find(
        (h) => h.idempotencyKey === idempotencyKey
      );
      if (existingHistory) {
        return {
          isDuplicate: true,
          schedule,
          passed: existingHistory.passed,
          score: existingHistory.score,
          nextDueDate: schedule.scheduledDate,
          intervalDays: schedule.intervalDays,
          message: "Attempt already processed.",
        };
      }
    }

    const passed = cleanScore >= SUCCESS_THRESHOLD_SCORE;
    const previousIntervalDays = schedule.intervalDays || 1;
    let newIntervalDays = 1;
    let newStage = 1;
    let newStatus = "pending";

    if (passed) {
      // Advance retrieval stage along heuristic interval ladder
      const currentStage = Number(schedule.stage) || 1;
      newStage = Math.min(currentStage + 1, REVISION_INTERVALS_DAYS.length);
      newIntervalDays = REVISION_INTERVALS_DAYS[newStage - 1] || 14;
      schedule.consecutiveSuccesses = (schedule.consecutiveSuccesses || 0) + 1;
      newStatus = "pending";
    } else {
      // Reset to Stage 1 (1 day review) and flag for reinforcement
      newStage = 1;
      newIntervalDays = REVISION_INTERVALS_DAYS[0] || 1;
      schedule.consecutiveSuccesses = 0;
      newStatus = "needs_reinforcement";
    }

    const scheduledDate = new Date();
    scheduledDate.setUTCDate(scheduledDate.getUTCDate() + newIntervalDays);

    schedule.stage = newStage;
    schedule.intervalDays = newIntervalDays;
    schedule.scheduledDate = scheduledDate;
    schedule.status = newStatus;
    schedule.lastScore = cleanScore;
    schedule.attemptsCount = (schedule.attemptsCount || 0) + 1;
    schedule.lastReviewedAt = new Date();

    schedule.history.push({
      reviewedAt: new Date(),
      score: cleanScore,
      passed,
      previousIntervalDays,
      newIntervalDays,
      answerGiven: String(answerGiven || "").slice(0, 500),
      idempotencyKey: idempotencyKey || "",
    });

    await schedule.save();

    // Invalidate recommendation and mentor context caches (non-blocking)
    try {
      const { recommendationPipelineService } = await import(
        "../../edutube/services/recommendation-engine/recommendation-pipeline.service.js"
      );
      recommendationPipelineService.invalidateCache(ownerId);
    } catch {
      // non-blocking
    }
    try {
      const { smartMentorContextService } = await import(
        "../../mentor/services/smart-mentor-context.service.js"
      );
      smartMentorContextService.invalidateContext(ownerId);
    } catch {
      // non-blocking
    }

    return {
      isDuplicate: false,
      schedule,
      passed,
      score: cleanScore,
      previousIntervalDays,
      newIntervalDays,
      nextDueDate: scheduledDate,
      status: newStatus,
      rationale: passed
        ? `Retrieval successful (${cleanScore}%). Advanced to Stage ${newStage} (${newIntervalDays} day interval).`
        : `Retrieval below threshold (${cleanScore}% < ${SUCCESS_THRESHOLD_SCORE}%). Reset to 1-day reinforcement.`,
    };
  }

  /**
   * Schedule or update a revision target from an external learning event
   * (e.g. video checkpoint completion, roadmap milestone, or coding challenge).
   */
  async scheduleOrUpdateTarget(ownerId, targetData = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }

    const {
      skill,
      targetId = "",
      targetConcept = "",
      resourceId = "",
      resourceType = "concept_review",
      quizId = "",
      promptQuestion = "",
      recommendedExerciseId = "",
      isPassed = true,
      lastScore = 80,
    } = targetData;

    if (!skill || typeof skill !== "string" || !skill.trim()) {
      throw new ApiError(400, "skill is required.");
    }

    const canonicalName = normalizeSkill(skill) || skill.trim();

    // Query existing schedule by targetId or canonicalName
    const query = { owner: ownerId };
    if (targetId) {
      query.targetId = targetId;
    } else {
      query.canonicalName = canonicalName;
    }

    let existing = await SpacedRevisionSchedule.findOne(query);

    const initialInterval = isPassed ? REVISION_INTERVALS_DAYS[0] : 1;
    const scheduledDate = new Date();
    scheduledDate.setUTCDate(scheduledDate.getUTCDate() + initialInterval);

    if (existing) {
      if (!isPassed) {
        existing.status = "needs_reinforcement";
        existing.intervalDays = 1;
        existing.stage = 1;
        existing.scheduledDate = scheduledDate;
        existing.consecutiveSuccesses = 0;
      } else {
        // If already completed or pending far out, advance stage
        const nextStage = Math.min((existing.stage || 1) + 1, REVISION_INTERVALS_DAYS.length);
        existing.stage = nextStage;
        existing.intervalDays = REVISION_INTERVALS_DAYS[nextStage - 1];
        const nextDate = new Date();
        nextDate.setUTCDate(nextDate.getUTCDate() + existing.intervalDays);
        existing.scheduledDate = nextDate;
        existing.status = "pending";
        existing.consecutiveSuccesses = (existing.consecutiveSuccesses || 0) + 1;
      }

      existing.lastScore = Number(lastScore) || 0;
      existing.lastReviewedAt = new Date();
      if (promptQuestion) existing.promptQuestion = promptQuestion;
      if (resourceId) existing.resourceId = resourceId;
      if (resourceType) existing.resourceType = resourceType;

      await existing.save();
      return existing;
    }

    const newSchedule = await SpacedRevisionSchedule.create({
      owner: ownerId,
      skill: canonicalName,
      canonicalName,
      targetId: targetId || `target_${canonicalName.toLowerCase().replace(/\s+/g, "_")}`,
      targetConcept: targetConcept || canonicalName,
      resourceId: resourceId || "",
      resourceType,
      quizId: quizId || "",
      stage: isPassed ? 1 : 1,
      intervalDays: initialInterval,
      scheduledDate,
      status: isPassed ? "pending" : "needs_reinforcement",
      lastScore: Number(lastScore) || 0,
      attemptsCount: 1,
      consecutiveSuccesses: isPassed ? 1 : 0,
      lastReviewedAt: new Date(),
      promptQuestion:
        promptQuestion || `Retrieval practice: Review core architecture and principles of ${canonicalName}.`,
      recommendedExerciseId: recommendedExerciseId || "",
    });

    return newSchedule;
  }
}

export const spacedRevisionService = new SpacedRevisionService();
