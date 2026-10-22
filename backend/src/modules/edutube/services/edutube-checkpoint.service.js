/**
 * EduTube Checkpoint & Video Quiz Service
 *
 * Manages interactive knowledge checks associated with educational video checkpoints.
 * Enforces server-side answer evaluation without disclosing correctOptionIndex to clients.
 * Connects quiz outcomes directly into the Adaptive Spaced Revision engine.
 */

import { EduTubeVideoCheckpoint } from "../models/edutubeVideoCheckpoint.models.js";
import { EduTubeCheckpointAttempt } from "../models/edutubeCheckpointAttempt.models.js";
import { getCuratedCheckpointsForVideo } from "../catalog/curatedCheckpoints.js";
import { spacedRevisionService } from "../../skills/services/spacedRevision.service.js";
import { learningOutcomeTrackerService } from "../../skills/services/learningOutcomeTracker.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export class EduTubeCheckpointService {
  /**
   * Retrieve video checkpoints with answers securely stripped.
   *
   * @param {string} ownerId - Authenticated student ID
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Array<object>>} List of checkpoints with student attempt state
   */
  async getCheckpointsForVideo(ownerId, videoId) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "videoId is required.");
    }
    const cleanVideoId = videoId.trim();

    // 1. Fetch checkpoints from MongoDB
    let checkpoints = await EduTubeVideoCheckpoint.find({ videoId: cleanVideoId })
      .sort({ timestampSeconds: 1 })
      .lean()
      .catch(() => []);

    // 2. If no custom checkpoints stored, fallback to curated catalog
    if (!checkpoints || checkpoints.length === 0) {
      checkpoints = getCuratedCheckpointsForVideo(cleanVideoId);
    }

    // 3. Fetch past attempts for this student if authenticated
    let studentAttempts = [];
    if (ownerId) {
      studentAttempts = await EduTubeCheckpointAttempt.find({
        owner: ownerId,
        videoId: cleanVideoId,
      })
        .lean()
        .catch(() => []);
    }

    const attemptMap = new Map();
    for (const att of studentAttempts) {
      const existing = attemptMap.get(att.checkpointId);
      // Keep most recent attempt or passed attempt
      if (!existing || att.isCorrect) {
        attemptMap.set(att.checkpointId, att);
      }
    }

    // 4. Sanitize checkpoints: STRIP correctOptionIndex for security!
    return checkpoints.map((cp) => {
      const studentAttempt = attemptMap.get(cp.checkpointId);
      return {
        checkpointId: cp.checkpointId,
        videoId: cp.videoId,
        timestampSeconds: cp.timestampSeconds,
        question: cp.question,
        options: cp.options,
        conceptKey: cp.conceptKey,
        skill: cp.skill,
        canonicalName: cp.canonicalName,
        difficulty: cp.difficulty,
        // Include explanation only if already attempted
        explanation: studentAttempt ? cp.explanation : undefined,
        hasAttempted: Boolean(studentAttempt),
        isPassed: Boolean(studentAttempt?.isCorrect),
        lastScore: studentAttempt?.score ?? null,
      };
    });
  }

  /**
   * Submit an answer to a video checkpoint question.
   *
   * @param {string} ownerId - Authenticated student ID
   * @param {string} videoId - YouTube video ID
   * @param {string} checkpointId - Checkpoint identifier
   * @param {object} payload - { selectedOptionIndex, idempotencyKey }
   * @returns {Promise<object>} Evaluation outcome, explanation, and next review scheduling
   */
  async submitCheckpointAnswer(ownerId, videoId, checkpointId, payload = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to submit checkpoint answer.");
    }
    if (!videoId?.trim() || !checkpointId?.trim()) {
      throw new ApiError(400, "videoId and checkpointId are required.");
    }

    const cleanVideoId = videoId.trim();
    const cleanCheckpointId = checkpointId.trim();
    const { selectedOptionIndex, idempotencyKey = null } = payload;

    if (
      typeof selectedOptionIndex !== "number" ||
      isNaN(selectedOptionIndex) ||
      selectedOptionIndex < 0
    ) {
      throw new ApiError(400, "selectedOptionIndex must be a non-negative integer.");
    }

    // 1. Idempotency check: if already processed, return existing outcome
    if (idempotencyKey) {
      const existingAttempt = await EduTubeCheckpointAttempt.findOne({
        owner: ownerId,
        idempotencyKey,
      })
        .lean()
        .catch(() => null);

      if (existingAttempt) {
        let cpDef = await EduTubeVideoCheckpoint.findOne({ checkpointId: cleanCheckpointId })
          .lean()
          .catch(() => null);
        if (!cpDef) {
          const curated = getCuratedCheckpointsForVideo(cleanVideoId);
          cpDef = curated.find((c) => c.checkpointId === cleanCheckpointId);
        }

        return {
          isDuplicate: true,
          isCorrect: existingAttempt.isCorrect,
          score: existingAttempt.score,
          correctOptionIndex: cpDef?.correctOptionIndex,
          explanation: cpDef?.explanation || "",
          message: "Attempt already recorded.",
        };
      }
    }

    // 2. Find authoritative checkpoint definition
    let checkpoint = await EduTubeVideoCheckpoint.findOne({
      checkpointId: cleanCheckpointId,
    })
      .lean()
      .catch(() => null);

    if (!checkpoint) {
      const curated = getCuratedCheckpointsForVideo(cleanVideoId);
      checkpoint = curated.find((c) => c.checkpointId === cleanCheckpointId);
    }

    if (!checkpoint) {
      throw new ApiError(404, `Checkpoint with id '${cleanCheckpointId}' not found.`);
    }

    if (selectedOptionIndex >= checkpoint.options.length) {
      throw new ApiError(
        400,
        `selectedOptionIndex (${selectedOptionIndex}) exceeds available options count (${checkpoint.options.length}).`
      );
    }

    // 3. Server-side validation
    const isCorrect = selectedOptionIndex === checkpoint.correctOptionIndex;
    const score = isCorrect ? 100 : 0;

    // 4. Persist student checkpoint attempt
    let attemptRecord;
    try {
      attemptRecord = await EduTubeCheckpointAttempt.create({
        owner: ownerId,
        checkpointId: cleanCheckpointId,
        videoId: cleanVideoId,
        selectedOptionIndex,
        isCorrect,
        score,
        skill: checkpoint.skill,
        canonicalName: checkpoint.canonicalName,
        attemptedAt: new Date(),
        idempotencyKey: idempotencyKey || undefined,
      });
    } catch (err) {
      // In case of parallel race condition on unique compound index
      if (err.code === 11000 && idempotencyKey) {
        const existing = await EduTubeCheckpointAttempt.findOne({
          owner: ownerId,
          idempotencyKey,
        }).lean();
        if (existing) {
          return {
            isDuplicate: true,
            isCorrect: existing.isCorrect,
            score: existing.score,
            correctOptionIndex: checkpoint.correctOptionIndex,
            explanation: checkpoint.explanation,
          };
        }
      }
      throw err;
    }

    // 5. Persist learning activity record (non-blocking)
    try {
      await learningOutcomeTrackerService.recordActivity(ownerId, {
        activityType: "quiz_checkpoint",
        skill: checkpoint.canonicalName,
        targetRole: "Full Stack Developer",
        entityId: cleanCheckpointId,
        title: `Video Quiz: ${checkpoint.question.slice(0, 60)}...`,
        status: isCorrect ? "passed" : "failed",
        evidence: {
          score,
          maxScore: 100,
          evidenceSource: "edutube",
          details: `Selected option ${selectedOptionIndex} (${isCorrect ? "Correct" : "Incorrect"})`,
        },
        idempotencyKey: idempotencyKey ? `learning_act_${idempotencyKey}` : undefined,
      });
    } catch (err) {
      console.warn("[checkpoint] Learning activity record warning:", err.message);
    }

    // 6. Connect to Adaptive Spaced Revision Schedule
    let nextScheduledReview = null;
    try {
      nextScheduledReview = await spacedRevisionService.scheduleOrUpdateTarget(ownerId, {
        skill: checkpoint.canonicalName,
        targetId: `target_${cleanCheckpointId}`,
        targetConcept: checkpoint.conceptKey || checkpoint.canonicalName,
        resourceId: cleanVideoId,
        resourceType: "quiz_checkpoint",
        quizId: cleanCheckpointId,
        promptQuestion: checkpoint.question,
        isPassed: isCorrect,
        lastScore: score,
      });
    } catch (err) {
      console.warn("[checkpoint] Spaced revision scheduling warning:", err.message);
    }

    return {
      isDuplicate: false,
      isCorrect,
      score,
      correctOptionIndex: checkpoint.correctOptionIndex,
      explanation: checkpoint.explanation,
      conceptKey: checkpoint.conceptKey,
      skill: checkpoint.canonicalName,
      nextScheduledReview: nextScheduledReview?.scheduledDate || null,
      reviewStatus: nextScheduledReview?.status || (isCorrect ? "pending" : "needs_reinforcement"),
    };
  }
}

export const edutubeCheckpointService = new EduTubeCheckpointService();
