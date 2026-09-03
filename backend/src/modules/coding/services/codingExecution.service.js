import { getRawTask } from "./taskCatalog.service.js";
import { executeJavaScriptTask } from "../sandbox/dockerExecutor.js";
import { CodingEvaluationError } from "../../../core/errors/ApiError.js";

/**
 * Evaluates student code against all test cases (samples and hidden) for a specific task.
 */
export async function evaluateTask(taskId, studentCode) {
  const task = getRawTask(taskId, "javascript");

  if (!task) {
    throw new CodingEvaluationError(`Task not found: ${taskId}`, 404);
  }

  if (task.language !== "javascript") {
    throw new CodingEvaluationError(`Unsupported language: ${task.language}`, 400);
  }

  const execution = await executeJavaScriptTask(
    studentCode,
    task.tests,
    task.functionName || "add"
  );

  // If container execution failed (syntax error, timeout, runtime crash)
  if (execution.status !== "completed") {
    return {
      taskId: task.id,
      title: task.title,
      functionName: task.functionName,
      status: execution.status,
      score: 0,
      maxScore: task.points,
      passed: 0,
      failed: task.tests.length,
      total: task.tests.length,
      tests: [],
      stdout: execution.stdout,
      stderr: execution.stderr,
      executionTimeMs: execution.executionTime,
      skillsCovered: task.skills || [task.category || "Problem Solving"],
    };
  }

  const results = execution.taskResults?.results || [];

  const tests = task.tests.map((test, index) => {
    const result = results[index];

    return {
      id: test.id || index + 1,
      name: test.name,
      passed: result?.passed === true,
      isSample: Boolean(test.isSample),
      expected: test.isSample ? test.expected : (result?.passed ? test.expected : "(hidden)"),
      actual: test.isSample ? result?.actual : (result?.passed ? result?.actual : "(hidden)"),
      input: test.isSample ? test.input : "(hidden)",
      executionTimeMs: result?.executionTimeMs,
      error: result?.error,
    };
  });

  const passed = tests.filter((t) => t.passed).length;
  const failed = tests.length - passed;
  const total = tests.length;

  const score = total === 0 ? 0 : Math.round((passed / total) * task.points);

  return {
    taskId: task.id,
    title: task.title,
    functionName: task.functionName,
    status: failed === 0 ? "passed" : "failed",
    score,
    maxScore: task.points,
    passed,
    failed,
    total,
    tests,
    stdout: execution.stdout,
    stderr: execution.stderr,
    executionTimeMs: execution.executionTime,
    skillsCovered: task.skills || [task.category || "Problem Solving"],
  };
}
