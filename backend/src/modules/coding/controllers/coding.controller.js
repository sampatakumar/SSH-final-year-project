import { getAllTasks, getPublicTask, getRawTask } from "../services/taskCatalog.service.js";
import { executeJavaScript, executeJavaScriptTask, checkDockerAvailability } from "../sandbox/dockerExecutor.js";
import { EXECUTION_LIMITS } from "../sandbox/sandboxConfig.js";
import { evaluateTask } from "../services/codingExecution.service.js";
import { generateCodingIntelligenceReport } from "../services/codeIntelligence.service.js";
import { adaptiveSkillLoopService } from "../../skills/services/adaptive-skill-loop.service.js";
import { learningOutcomeTrackerService } from "../../skills/services/learningOutcomeTracker.service.js";
import { CodingSubmission } from "../models/codingSubmission.models.js";
import { ApiError, CodingExecutionError, CodingEvaluationError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

const SUPPORTED_LANGUAGES = ["javascript", "python", "typescript"];

export function validateLanguage(lang = "javascript") {
  const normalized = String(lang || "javascript").toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES.includes(normalized)) {
    throw new ApiError(
      400,
      `Language '${lang}' is not supported. Supported languages: ${SUPPORTED_LANGUAGES.join(", ")}.`
    );
  }
  return normalized;
}

/**
 * List all available coding tasks.
 */
export const listTasks = asyncHandler(async (req, res) => {
  const language = validateLanguage(req.query.language || "javascript");
  const tasks = getAllTasks(language);
  return res.status(200).json(new ApiResponse(200, { tasks, language }, "Available coding tasks"));
});

/**
 * Get public details of a single task.
 */
export const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const language = validateLanguage(req.query.language || "javascript");
  const task = getPublicTask(taskId, language);

  if (!task) {
    throw new ApiError(404, `Coding task "${taskId}" not found for language "${language}".`);
  }

  return res.status(200).json(new ApiResponse(200, { task }, "Coding task details"));
});

/**
 * Fast Run against public sample test cases (or raw script).
 */
export const runCodeSample = asyncHandler(async (req, res) => {
  const { code, taskId, language: rawLang = "javascript" } = req.body;
  const language = validateLanguage(rawLang);

  if (typeof code !== "string" || !code.trim()) {
    throw new ApiError(400, "Code must be a non-empty string.");
  }

  if (taskId) {
    const task = getRawTask(taskId, language);
    if (!task) {
      throw new ApiError(404, `Task "${taskId}" not found for language "${language}".`);
    }

    // Enforce execution safeguard: Staging disables execution or non-JS runner unprovisioned
    if (language !== "javascript" || process.env.CODING_EXECUTION_ENABLED === "false") {
      const reasonMsg =
        language !== "javascript"
          ? `Execution sandbox for ${language} is not enabled in this staging deployment.`
          : "Coding sandbox execution is disabled in this staging deployment until a dedicated remote runner is provisioned.";

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            type: "sample_test_run",
            taskId,
            language,
            status: "system_error",
            error: reasonMsg,
            taskResults: { results: [] },
            stdout: "",
            stderr: reasonMsg,
            executionTimeMs: 0,
          },
          "Sample test execution completed"
        )
      );
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
          language,
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
  if (language !== "javascript" || process.env.CODING_EXECUTION_ENABLED === "false") {
    const reasonMsg =
      language !== "javascript"
        ? `Execution sandbox for ${language} is not enabled in this staging deployment.`
        : "Coding sandbox execution is disabled in this staging deployment until a dedicated remote runner is provisioned.";

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          type: "raw_execution",
          language,
          status: "system_error",
          error: reasonMsg,
          stdout: "",
          stderr: reasonMsg,
          executionTimeMs: 0,
        },
        "Raw code execution completed"
      )
    );
  }

  const execution = await executeJavaScript(code);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        type: "raw_execution",
        language,
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
  const { taskId, code, language: rawLang = "javascript" } = req.body;
  const language = validateLanguage(rawLang);

  if (!taskId) {
    throw new ApiError(400, "taskId is required.");
  }

  if (typeof code !== "string" || !code.trim()) {
    throw new ApiError(400, "code must be a non-empty string.");
  }

  const task = getRawTask(taskId, language);
  if (!task) {
    throw new ApiError(404, `Task "${taskId}" not found for language "${language}".`);
  }

  let result;
  if (language !== "javascript" || process.env.CODING_EXECUTION_ENABLED === "false") {
    const reasonMsg =
      language !== "javascript"
        ? `Coding sandbox execution for ${language} is disabled in this staging deployment until a dedicated remote runner is provisioned.`
        : "Coding sandbox execution is disabled in this staging deployment until a dedicated remote runner is provisioned.";

    result = {
      taskId: task.id,
      title: task.title,
      functionName: task.functionName,
      status: "system_error",
      error: reasonMsg,
      dockerAvailable: false,
      score: 0,
      maxScore: task.points || 10,
      passed: 0,
      failed: 0,
      total: task.tests ? task.tests.length : 0,
      tests: [],
      stdout: "",
      stderr: reasonMsg,
      executionTimeMs: 0,
      skillsCovered: task.skills || [task.category || "Problem Solving"],
    };
  } else {
    result = await evaluateTask(taskId, code);
  }

  // Generate deep coding intelligence report
  const intelligence = await generateCodingIntelligenceReport({
    code,
    task,
    executionResult: result,
    userId: req.user?._id || null,
  });

  // If user is authenticated, save submission & update empirical skill profile
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

    // Invalidate mentor context cache so next advice reflects the submission
    try {
      const { smartMentorContextService } = await import("../../mentor/services/smart-mentor-context.service.js");
      smartMentorContextService.invalidateContext(req.user._id);
    } catch {
      // non-blocking
    }

    // Only record authoritative learning activity if execution actually ran (not a sandbox infrastructure failure)
    if (result.status !== "system_error") {
      try {
        const primarySkill = task?.skills?.[0] || task?.category || "Problem Solving";
        const isPass = result.status === "passed";
        const isTimeout = result.status === "timeout";
        const activityType = isPass
          ? "coding_passed"
          : isTimeout
          ? "coding_attempted"
          : "coding_failed";
        const status = isPass ? "passed" : isTimeout ? "timeout" : "failed";

        await learningOutcomeTrackerService.recordActivity(req.user._id, {
          activityType,
          skill: primarySkill,
          entityId: taskId,
          title: task?.title || taskId,
          status,
          evidence: {
            score: result.score,
            maxScore: result.maxScore,
            testCasesPassed: result.passed,
            testCasesTotal: result.total,
            executionTimeMs: result.executionTimeMs || 0,
            evidenceSource: "coding",
            sandboxVerified: true,
            isTimeout,
            details: isPass
              ? `Passed all ${result.passed}/${result.total} test cases in Docker sandbox`
              : isTimeout
              ? `Execution timed out (${result.executionTimeMs || 5000}ms). Recorded as attempt without penalizing competency.`
              : `Failed ${result.failed}/${result.total} test cases in Docker sandbox`,
          },
          idempotencyKey: `coding_sub_${savedSubmission._id.toString()}`,
        });

        try {
          const { recommendationPipelineService } = await import("../../edutube/services/recommendation-engine/recommendation-pipeline.service.js");
          recommendationPipelineService.invalidateCache(req.user._id);
        } catch {}
      } catch (err) {
        console.warn("[coding-controller] Error updating adaptive learning loop:", err.message);
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        submissionId: savedSubmission?._id || null,
        intelligence,
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

/**
 * GET /api/v1/coding/sandbox/status
 * Proactively check Docker sandbox availability, resource limits, and execution status.
 */
export const getSandboxStatus = asyncHandler(async (req, res) => {
  const availability = await checkDockerAvailability();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        dockerAvailable: availability.available,
        reason: availability.reason || null,
        executionLimits: {
          memory: "128MB",
          timeoutMs: EXECUTION_LIMITS.timeoutMs || 5000,
          maxCodeLengthBytes: EXECUTION_LIMITS.maxCodeLengthBytes || 65536,
          maxConcurrentContainers: EXECUTION_LIMITS.maxConcurrentContainers || 4,
          maxStdoutBytes: EXECUTION_LIMITS.maxStdoutBytes || 65536,
          maxStderrBytes: EXECUTION_LIMITS.maxStderrBytes || 65536,
        },
        isolation: {
          networkDisabled: true,
          readonlyRootfs: true,
          tmpfsMounted: true,
          capDrop: ["ALL"],
          securityOpt: ["no-new-privileges:true"],
          nonRootUser: "node",
        },
        supportedLanguages: ["javascript"],
      },
      "Sandbox status retrieved successfully"
    )
  );
});

