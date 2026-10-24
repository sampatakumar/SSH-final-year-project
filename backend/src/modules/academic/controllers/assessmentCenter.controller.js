import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { assessmentCenterService } from "../services/assessmentCenter.service.js";

export const listAssessmentsController = asyncHandler(async (req, res) => {
  const result = await assessmentCenterService.listAssessments(req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessments retrieved successfully"));
});

export const getAssessmentByIdController = asyncHandler(async (req, res) => {
  const { assessmentId } = req.params;
  const assessment = await assessmentCenterService.getAssessmentById(assessmentId, {
    sanitize: true,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, assessment, "Assessment details retrieved successfully"));
});

export const getRecommendedAssessmentsController = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const recommendations = await assessmentCenterService.getRecommendedAssessments(studentId);
  return res
    .status(200)
    .json(new ApiResponse(200, recommendations, "Recommended assessments retrieved successfully"));
});

export const startAssessmentAttemptController = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const { assessmentId } = req.params;
  const attempt = await assessmentCenterService.startAttempt(studentId, assessmentId);
  return res
    .status(201)
    .json(new ApiResponse(201, attempt, "Assessment attempt started successfully"));
});

export const submitAssessmentAttemptController = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const { attemptId } = req.params;
  const evaluatedAttempt = await assessmentCenterService.submitAttempt(
    studentId,
    attemptId,
    req.body
  );
  return res
    .status(200)
    .json(new ApiResponse(200, evaluatedAttempt, "Assessment evaluated and recorded successfully"));
});

export const getStudentAttemptsController = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const attempts = await assessmentCenterService.getStudentAttempts(studentId, req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, attempts, "Assessment attempts retrieved successfully"));
});

export const getAttemptByIdController = asyncHandler(async (req, res) => {
  const studentId = req.user?._id;
  const { attemptId } = req.params;
  const attempt = await assessmentCenterService.getAttemptById(studentId, attemptId);
  return res
    .status(200)
    .json(new ApiResponse(200, attempt, "Assessment attempt details retrieved successfully"));
});

export const seedAssessmentCatalogController = asyncHandler(async (req, res) => {
  const result = await assessmentCenterService.seedCatalog();
  return res
    .status(200)
    .json(new ApiResponse(200, result, "Assessment catalog seeded successfully"));
});
