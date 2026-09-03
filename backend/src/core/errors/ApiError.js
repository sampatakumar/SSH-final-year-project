class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
    module = "CORE"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    this.module = module;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Module-Specific Error Classes for Domain Isolation
class ResumeError extends ApiError {
  constructor(statusCode = 400, message = "Resume processing error", errors = []) {
    super(statusCode, `[RESUME] ${message}`, errors, "", "RESUME");
  }
}

class GitHubError extends ApiError {
  constructor(statusCode = 400, message = "GitHub integration error", errors = []) {
    super(statusCode, `[GITHUB] ${message}`, errors, "", "GITHUB");
  }
}

class CodingExecutionError extends ApiError {
  constructor(statusCode = 400, message = "Coding execution error", errors = []) {
    super(statusCode, `[CODING] ${message}`, errors, "", "CODING");
  }
}

class CodingEvaluationError extends ApiError {
  constructor(statusCode = 400, message = "Coding evaluation error", errors = []) {
    super(statusCode, `[CODING] ${message}`, errors, "", "CODING");
  }
}

class SkillEvaluationError extends ApiError {
  constructor(statusCode = 400, message = "Skill evaluation error", errors = []) {
    super(statusCode, `[SKILLS] ${message}`, errors, "", "SKILLS");
  }
}

class GapAnalysisError extends ApiError {
  constructor(statusCode = 400, message = "Skill gap analysis error", errors = []) {
    super(statusCode, `[GAPS] ${message}`, errors, "", "GAPS");
  }
}

class RecommendationError extends ApiError {
  constructor(statusCode = 400, message = "Recommendation generation error", errors = []) {
    super(statusCode, `[RECOMMENDATIONS] ${message}`, errors, "", "RECOMMENDATIONS");
  }
}

class EduTubeError extends ApiError {
  constructor(statusCode = 400, message = "EduTube service error", errors = []) {
    super(statusCode, `[EDUTUBE] ${message}`, errors, "", "EDUTUBE");
  }
}

export {
  ApiError,
  ResumeError,
  GitHubError,
  CodingExecutionError,
  CodingEvaluationError,
  SkillEvaluationError,
  GapAnalysisError,
  RecommendationError,
  EduTubeError,
};
