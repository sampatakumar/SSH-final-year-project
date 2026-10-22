/**
 * Spaced Revision Controller
 *
 * Exposes endpoints for managing student spaced-retrieval schedules,
 * retrieving due and upcoming items, and recording review attempts.
 */

import { spacedRevisionService } from "../services/spacedRevision.service.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiError } from "../../../core/errors/ApiError.js";

/**
 * GET /api/v1/skills/spaced-revision/due
 * Retrieve revisions due today or overdue.
 */
export const getDueRevisionsController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required.");
  }

  const { limit = 20 } = req.query;
  const dueItems = await spacedRevisionService.getDueRevisions(ownerId, { limit });

  return res
    .status(200)
    .json(new ApiResponse(200, { items: dueItems, count: dueItems.length }, "Due revisions retrieved."));
});

/**
 * GET /api/v1/skills/spaced-revision/upcoming
 * Retrieve upcoming scheduled revisions.
 */
export const getUpcomingRevisionsController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required.");
  }

  const { limit = 20 } = req.query;
  const upcomingItems = await spacedRevisionService.getUpcomingRevisions(ownerId, { limit });

  return res
    .status(200)
    .json(new ApiResponse(200, { items: upcomingItems, count: upcomingItems.length }, "Upcoming revisions retrieved."));
});

/**
 * GET /api/v1/skills/spaced-revision/queue
 * Retrieve complete breakdown of revision queue (due, upcoming, stats).
 */
export const getRevisionQueueController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required.");
  }

  const { limit = 10 } = req.query;
  const queue = await spacedRevisionService.getRevisionQueue(ownerId, { limit });

  return res
    .status(200)
    .json(new ApiResponse(200, queue, "Revision queue retrieved."));
});

/**
 * POST /api/v1/skills/spaced-revision/:id/review
 * Record a student retrieval attempt on a scheduled item.
 */
export const reviewRevisionAttemptController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required.");
  }

  const { id } = req.params;
  const { score, idempotencyKey, answerGiven } = req.body;

  if (typeof score !== "number" || isNaN(score)) {
    throw new ApiError(400, "score must be a number between 0 and 100.");
  }

  const result = await spacedRevisionService.recordRevisionAttempt(ownerId, id, {
    score,
    idempotencyKey,
    answerGiven,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Revision review processed successfully."));
});

/**
 * POST /api/v1/skills/spaced-revision/target
 * Create or schedule a revision target for a skill/concept.
 */
export const createRevisionTargetController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required.");
  }

  const {
    skill,
    targetId,
    targetConcept,
    resourceId,
    resourceType,
    quizId,
    promptQuestion,
    recommendedExerciseId,
    isPassed = true,
    lastScore = 80,
  } = req.body;

  if (!skill) {
    throw new ApiError(400, "skill is required.");
  }

  const schedule = await spacedRevisionService.scheduleOrUpdateTarget(ownerId, {
    skill,
    targetId,
    targetConcept,
    resourceId,
    resourceType,
    quizId,
    promptQuestion,
    recommendedExerciseId,
    isPassed,
    lastScore,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { schedule }, "Spaced revision target created successfully."));
});
