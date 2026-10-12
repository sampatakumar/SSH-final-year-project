import { academicStudyService } from "../services/study.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * GET /api/v1/study/profile
 * Get authenticated user's structured academic study profile.
 */
export const getStudyProfile = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const profile = await academicStudyService.getOrCreateStudyProfile(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, { profile }, "Academic study profile retrieved")
  );
});

/**
 * GET /api/v1/study/syllabus
 * Get syllabus guide and pedagogical breakdown for a topic.
 */
export const getTopicSyllabus = asyncHandler(async (req, res) => {
  const { subject = "Data Structures & Algorithms", topic = "Arrays & Strings", level = "Undergraduate" } = req.query;

  const syllabus = await academicStudyService.getTopicSyllabus(subject, topic, level);
  return res.status(200).json(
    new ApiResponse(200, { syllabus }, "Topic syllabus retrieved")
  );
});

/**
 * POST /api/v1/study/quiz/generate
 * Generate formative adaptive quiz questions for a topic.
 */
export const generateQuiz = asyncHandler(async (req, res) => {
  const { subject = "Data Structures & Algorithms", topic = "Hash Tables", difficulty = "Medium", count = 3 } = req.body;

  const quiz = await academicStudyService.generateAdaptiveQuiz(req.user?._id, {
    subject,
    topic,
    difficulty,
    count,
  });

  return res.status(200).json(
    new ApiResponse(200, { quiz }, "Formative quiz generated")
  );
});

/**
 * POST /api/v1/study/quiz/submit
 * Submit quiz answers, update topic mastery, apply decay if contradictory.
 */
export const submitQuiz = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required to submit quiz.");
  }

  const { subject, topic, answers, totalQuestions } = req.body;

  if (!topic || !Array.isArray(answers)) {
    throw new ApiError(400, "topic and answers array are required.");
  }

  const result = await academicStudyService.submitQuizResults(req.user._id, {
    subject,
    topic,
    answers,
    totalQuestions,
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Quiz evaluated and mastery updated")
  );
});

/**
 * GET /api/v1/study/flashcards
 * Get flashcards due for review.
 */
export const getFlashcards = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const { subject, topic, limit } = req.query;
  const flashcards = await academicStudyService.getDueFlashcards(req.user._id, {
    subject,
    topic,
    limit: limit ? Number(limit) : 20,
  });

  return res.status(200).json(
    new ApiResponse(200, { flashcards }, "Flashcards retrieved")
  );
});

/**
 * POST /api/v1/study/flashcards/review
 * Record flashcard SM-2 review rating.
 */
export const reviewFlashcard = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const { flashcardId, qualityRating } = req.body;

  if (!flashcardId || qualityRating === undefined) {
    throw new ApiError(400, "flashcardId and qualityRating (0-5) are required.");
  }

  const result = await academicStudyService.reviewFlashcard(
    req.user._id,
    flashcardId,
    qualityRating
  );

  return res.status(200).json(
    new ApiResponse(200, result, "Flashcard review recorded")
  );
});

/**
 * GET /api/v1/study/revision-plan
 * Get adaptive revision plan prioritizing decayed topics & overdue items.
 */
export const getRevisionPlan = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const revisionPlan = await academicStudyService.getAdaptiveRevisionPlan(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, { revisionPlan }, "Adaptive revision plan retrieved")
  );
});
