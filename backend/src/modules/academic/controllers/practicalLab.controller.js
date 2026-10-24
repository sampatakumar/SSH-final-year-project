import { practicalLabService } from "../services/practicalLab.service.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export const getLabCatalogController = asyncHandler(async (req, res) => {
  const { branch, difficulty, search, labType } = req.query;
  const labs = await practicalLabService.getLabCatalog({ branch, difficulty, search, labType });
  res.status(200).json(new ApiResponse(200, labs, "Practical labs catalog retrieved successfully."));
});

export const getLabByIdController = asyncHandler(async (req, res) => {
  const { labId } = req.params;
  const lab = await practicalLabService.getLabById(labId);
  res.status(200).json(new ApiResponse(200, lab, "Practical lab retrieved successfully."));
});

export const submitLabAttemptController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required to submit lab attempt.");
  }

  const { labId } = req.params;
  const { submittedAnswers, startedAt } = req.body;

  const attemptResult = await practicalLabService.submitLabAttempt(ownerId, labId, {
    submittedAnswers,
    startedAt,
  });

  res.status(201).json(new ApiResponse(201, attemptResult, "Practical lab submitted and evaluated successfully."));
});

export const getUserLabAttemptsController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required to view attempt history.");
  }

  const { labId } = req.query;
  const history = await practicalLabService.getUserAttemptHistory(ownerId, labId);

  res.status(200).json(new ApiResponse(200, history, "User lab attempt history retrieved successfully."));
});

export const getAttemptByIdController = asyncHandler(async (req, res) => {
  const ownerId = req.user?._id;
  if (!ownerId) {
    throw new ApiError(401, "Authentication required.");
  }

  const { attemptId } = req.params;
  const attempt = await practicalLabService.getAttemptById(ownerId, attemptId);

  res.status(200).json(new ApiResponse(200, attempt, "Lab attempt retrieved successfully."));
});
