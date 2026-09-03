import { getAllTasks, getPublicTask, getRawTask } from "../services/taskCatalog.service.js";
import { executeJavaScript, executeJavaScriptTask } from "../sandbox/dockerExecutor.js";
import { evaluateTask } from "../services/codingExecution.service.js";
import { CodingSubmission } from "../models/codingSubmission.models.js";
import { ApiError, CodingExecutionError, CodingEvaluationError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * List all available coding tasks.
 */
export const listTasks = asyncHandler(async (req, res) => {
  const language = req.query.language || "javascript";
  const tasks = getAllTasks(language);
  return res.status(200).json(new ApiResponse(200, { tasks }, "Available coding tasks"));
});

/**
 * Get public details of a single task.
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const language = req.query.language || "javascript";
  const task = getPublicTask(taskId, language);

  if (!task) {
    throw new ApiError(404, `Coding task "${taskId}" not found.`);
  }

  return res.status(200).json(new ApiResponse(200, { task }, "Coding task details"));
});

/**
 * Fast Run against public sample test cases (or raw script).
 */
export const runCodeSample = asyncHandler(async (req, res) => {
  const { code, taskId } = req.body;

  if (typeof code !== "string" || !code.trim()) {
    throw new ApiError(400, "Code must be a non-empty string.");
  }

  if (taskId) {
    const task = getRawTask(taskId, "javascript");
    if (!task) {
      throw new ApiError(404, `Task "${taskId}" not found.`);
    }

    const sampleTests = (task.tests || []).filter((t) => t.isSample === true);
    const execution = await executeJavaScriptTask(
      code,
      sampleTests,
      task.functionName || "add"
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          type: "sample_test_run",
          taskId,
          status: execution.status,
          taskResults: execution.taskResults,
          stdout: execution.stdout,
          stderr: execution.stderr,
          executionTimeMs: execution.executionTime,
        },
        "Sample test execution completed"
      )
    );
  }

  // Raw script execution
  const execution = await executeJavaScript(code);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        type: "raw_execution",
        status: execution.status,
        stdout: execution.stdout,
        stderr: execution.stderr,
        executionTimeMs: execution.executionTime,
      },
      "Raw code execution completed"
    )
  );
});

/**
 * Submit solution for full evaluation against hidden test cases.
 * Authenticated: records submission to MongoDB under req.user._id.
 */
export const submitSolution = asyncHandler(async (req, res) => {
  const { taskId, code, language = "javascript" } = req.body;

  if (!taskId) {
    throw new ApiError(400, "taskId is required.");
  }

  if (typeof code !== "string" || !code.trim()) {
    throw new ApiError(400, "code must be a non-empty string.");
  }

  const result = await evaluateTask(taskId, code);

  // If user is authenticated, save submission
  let savedSubmission = null;
  if (req.user?._id) {
    savedSubmission = await CodingSubmission.create({
      owner: req.user._id,
      taskId,
      language,
      code,
      status: result.status,
      score: result.score,
      maxScore: result.maxScore,
      passed: result.passed,
      failed: result.failed,
      total: result.total,
      executionTimeMs: result.executionTimeMs || 0,
      skillsCovered: result.skillsCovered || [],
      tests: result.tests || [],
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      submittedAt: new Date(),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        submissionId: savedSubmission?._id || null,
      },
      "Evaluation completed"
    )
  );
});

/**
 * Get user's coding submission history.
 * Enforces ownership strictly via req.user._id.
 */
export const getUserSubmissionHistory = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const { taskId, limit = 20 } = req.query;
  const filter = { owner: req.user._id };
  if (taskId) filter.taskId = taskId;

  const submissions = await CodingSubmission.find(filter)
    .sort({ submittedAt: -1 })
    .limit(Number(limit))
    .select("-code");

  return res.status(200).json(
    new ApiResponse(200, { submissions }, "User submission history")
  );
});
