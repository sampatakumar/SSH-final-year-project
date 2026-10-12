/**
 * ============================================================================
 * SMART SKILL HUB — CODING ASSESSMENT INTELLIGENCE ENGINE (v2.1.0)
 * ============================================================================
 *
 * Provides deep static, algorithmic, and qualitative intelligence on submitted code:
 * 1. Test results as the sole primary evidence of functional correctness.
 * 2. Static complexity analysis (Time & Space Big-O heuristics).
 * 3. Security antipattern detection (eval, prototype pollution, dangerous globals).
 * 4. Reproducible bug counter-examples for failed test cases.
 * 5. Recurring error pattern tracking across submission history.
 * 6. Actionable next exercise recommendations.
 * ============================================================================
 */

import { aiOrchestrator } from "../../../core/ai/aiOrchestrator.service.js";
import { CodingSubmission } from "../models/codingSubmission.models.js";
import { VERIFIED_CODING_TASKS } from "../../recommendations/catalog/taskMappings.js";

/**
 * Perform deterministic static code analysis on JavaScript code.
 */
export function analyzeCodeStatic(code = "") {
  if (typeof code !== "string") return {};

  const lines = code.split("\n").map((l) => l.trim()).filter(Boolean);
  const totalLines = lines.length;

  // 1. Complexity Heuristics (loops & nesting)
  const forLoops = (code.match(/\bfor\s*\(/g) || []).length;
  const whileLoops = (code.match(/\bwhile\s*\(/g) || []).length;
  const mapFilterLoops = (code.match(/\.(?:map|forEach|filter|reduce|flatMap)\s*\(/g) || []).length;
  const totalLoopConstructs = forLoops + whileLoops + mapFilterLoops;

  // Check for nested loops
  const hasNestedLoops =
    /(?:for|while)\s*\([^{}]*\{[^{}]*(?:for|while|\.map|\.forEach|\.filter)\s*\(/s.test(code);

  let estimatedTimeComplexity = "O(1)";
  let complexityRationale = "No significant loops or iterations detected.";

  if (hasNestedLoops || totalLoopConstructs >= 2) {
    estimatedTimeComplexity = "O(N²)";
    complexityRationale = "Nested iteration or multiple traversals detected over input elements.";
  } else if (totalLoopConstructs === 1) {
    estimatedTimeComplexity = "O(N)";
    complexityRationale = "Single linear traversal over input data.";
  }

  // Hash Map / Set usage (O(1) lookups)
  const usesMapOrSet = /\b(?:new Map|new Set|\bMap\b|\bSet\b|Object\.fromEntries)\b/.test(code);
  const usesAuxiliaryArray = /\[\]|\bnew Array\b|\.slice\(|\.concat\(/.test(code);

  let estimatedSpaceComplexity = "O(1)";
  if (usesMapOrSet || usesAuxiliaryArray) {
    estimatedSpaceComplexity = "O(N)";
  }

  // 2. Security & Anti-Pattern Inspection
  const securityWarnings = [];
  if (/\beval\s*\(/.test(code)) {
    securityWarnings.push("Prohibited use of eval() detected.");
  }
  if (/\bFunction\s*\(/.test(code)) {
    securityWarnings.push("Dynamic Function constructor invocation detected.");
  }
  if (/\b__proto__\b|\bprototype\b/.test(code)) {
    securityWarnings.push("Suspicious prototype manipulation detected.");
  }
  if (/while\s*\(\s*(?:true|1)\s*\)/.test(code) && !/\bbreak\b/.test(code)) {
    securityWarnings.push("Potential unbounded infinite loop detected without break statement.");
  }

  // 3. Hygiene & Maintainability Signals
  const hasComments = /\/\/|\/\*/.test(code);
  const hasProperNaming = !/\b(?:var\s+[a-z]\b)/.test(code);
  let hygieneScore = 70;
  if (hasComments) hygieneScore += 15;
  if (hasProperNaming) hygieneScore += 15;
  hygieneScore = Math.min(100, hygieneScore);

  return {
    totalLines,
    estimatedTimeComplexity,
    estimatedSpaceComplexity,
    complexityRationale,
    usesMapOrSet,
    hasNestedLoops,
    securityWarnings,
    hygieneScore,
  };
}

/**
 * Format a clear, reproducible counter-example when test cases fail.
 */
export function formatReproducibleBugExample(failingTests = []) {
  if (!Array.isArray(failingTests) || failingTests.length === 0) {
    return null;
  }

  const primaryFailure = failingTests[0];
  const inputStr = primaryFailure.input !== undefined ? JSON.stringify(primaryFailure.input) : "(hidden)";
  const expectedStr = primaryFailure.expected !== undefined ? JSON.stringify(primaryFailure.expected) : "(hidden)";
  const actualStr = primaryFailure.actual !== undefined ? JSON.stringify(primaryFailure.actual) : "(hidden)";

  let diagnosis = `Failing Test: "${primaryFailure.name || "Test Case 1"}".`;
  if (primaryFailure.input !== "(hidden)") {
    diagnosis += `\nInput: ${inputStr}\nExpected: ${expectedStr}\nActual Output: ${actualStr}`;
  } else {
    diagnosis += `\nFailed on hidden boundary conditions (e.g. empty collection, negative integers, or single-element inputs).`;
  }

  if (primaryFailure.error) {
    diagnosis += `\nRuntime Error: ${primaryFailure.error}`;
  }

  return {
    testName: primaryFailure.name,
    input: primaryFailure.input,
    expected: primaryFailure.expected,
    actual: primaryFailure.actual,
    error: primaryFailure.error,
    diagnosis,
  };
}

/**
 * Track recurring error patterns and progress across submission history.
 */
export async function trackSubmissionTrends(userId, taskId) {
  if (!userId || !taskId) return { submissionCount: 1, hasImproved: false, recurringErrors: [] };

  try {
    const history = await CodingSubmission.find({ owner: userId, taskId })
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();

    if (!history || history.length <= 1) {
      return {
        submissionCount: 1,
        hasImproved: false,
        previousBestScore: 0,
        recurringErrors: [],
      };
    }

    const previousRuns = history.slice(1);
    const previousBestScore = Math.max(...previousRuns.map((r) => r.score || 0));
    const currentRun = history[0];
    const hasImproved = (currentRun.score || 0) > previousBestScore;

    // Detect recurring runtime errors
    const recurringErrors = [];
    const hadTimeoutBefore = previousRuns.some((r) => String(r.stderr || "").includes("timed out") || r.status === "timeout");
    if (hadTimeoutBefore && (String(currentRun.stderr || "").includes("timed out") || currentRun.status === "timeout")) {
      recurringErrors.push("Repeated timeout detected across consecutive attempts.");
    }

    const hadSyntaxBefore = previousRuns.some((r) => String(r.stderr || "").includes("SyntaxError"));
    if (hadSyntaxBefore && String(currentRun.stderr || "").includes("SyntaxError")) {
      recurringErrors.push("Repeated syntax errors encountered.");
    }

    return {
      submissionCount: history.length,
      hasImproved,
      previousBestScore,
      scoreDelta: (currentRun.score || 0) - previousBestScore,
      recurringErrors,
    };
  } catch (err) {
    return { submissionCount: 1, hasImproved: false, recurringErrors: [] };
  }
}

/**
 * Generate comprehensive Coding Intelligence report.
 */
export async function generateCodingIntelligenceReport({
  code,
  task,
  executionResult,
  userId = null,
}) {
  const staticSignals = analyzeCodeStatic(code);
  const failingTests = (executionResult.tests || []).filter((t) => !t.passed);
  const bugCounterExample = formatReproducibleBugExample(failingTests);
  const trends = await trackSubmissionTrends(userId, task?.id);

  // Fallback explanation generator
  const fallbackFeedback = () => {
    if (executionResult.passed === executionResult.total) {
      return `Excellent solution! All ${executionResult.total} automated tests passed with ${staticSignals.estimatedTimeComplexity} estimated time complexity. Code hygiene is rated at ${staticSignals.hygieneScore}/100.`;
    }
    return `Solution passed ${executionResult.passed}/${executionResult.total} test cases. Focus on resolving the counter-example identified above (${staticSignals.complexityRationale}).`;
  };

  // Generate qualitative review via AI Orchestrator
  let aiFeedback = fallbackFeedback();
  try {
    const aiResult = await aiOrchestrator.executeTask({
      taskName: "CODING_EXPLANATION",
      systemInstruction:
        "You are an expert algorithm coach. Provide concise, constructive feedback on student code. Highlight time complexity, potential edge cases, and actionable next steps.",
      userPrompt: `Task: ${task?.title || "Coding Challenge"}\nDescription: ${task?.description || ""}\nPassed: ${executionResult.passed}/${executionResult.total}\nCode:\n${code}\nStatic Analysis: ${JSON.stringify(staticSignals)}\nBug Example: ${JSON.stringify(bugCounterExample)}`,
      fallbackGenerator: fallbackFeedback,
    });
    if (aiResult.success && aiResult.data) {
      aiFeedback = typeof aiResult.data === "string" ? aiResult.data : aiResult.data.feedback || fallbackFeedback();
    }
  } catch (e) {
    // Non-blocking fallback
  }

  // Next exercises suggestions
  const targetedExercises = [];
  const primarySkill = task?.skills?.[0] || task?.category || "Problem Solving";
  const mappedTask = VERIFIED_CODING_TASKS[primarySkill];
  if (mappedTask && mappedTask.taskId !== task?.id) {
    targetedExercises.push({
      taskId: mappedTask.taskId,
      title: mappedTask.taskTitle,
      reason: `Practice advanced ${primarySkill} patterns in the sandbox.`,
    });
  }

  return {
    taskId: task?.id,
    title: task?.title,
    functionalCorrectness: {
      score: executionResult.score,
      maxScore: executionResult.maxScore,
      passed: executionResult.passed,
      failed: executionResult.failed,
      total: executionResult.total,
    },
    algorithmicComplexity: {
      timeComplexity: staticSignals.estimatedTimeComplexity,
      spaceComplexity: staticSignals.estimatedSpaceComplexity,
      rationale: staticSignals.complexityRationale,
    },
    codeQuality: {
      hygieneScore: staticSignals.hygieneScore,
      totalLines: staticSignals.totalLines,
      securityWarnings: staticSignals.securityWarnings,
    },
    counterExample: bugCounterExample,
    trends,
    feedback: aiFeedback,
    targetedExercises,
    evaluatedAt: new Date().toISOString(),
  };
}
