/**
 * Smart Skill Hub — Isolated In-Container JavaScript Test Runner
 * Executes student submissions against tests.json inside secure sandbox container.
 */

const fs = require("fs");

let testsData;
try {
  testsData = JSON.parse(fs.readFileSync("/input/tests.json", "utf8"));
} catch (err) {
  console.error("Runner Error: Failed to parse /input/tests.json:", err.message);
  process.exit(1);
}

const studentSource = fs.readFileSync("/input/student.js", "utf8");
const fnName = testsData.functionName || "add";

let studentFn = null;
try {
  const wrapper = new Function(`
    ${studentSource}
    if (typeof ${fnName} !== 'undefined') {
      return ${fnName};
    }
    if (typeof module !== 'undefined' && module.exports) {
      if (typeof module.exports === 'function') return module.exports;
      if (module.exports && module.exports.${fnName}) return module.exports.${fnName};
    }
    return null;
  `);
  studentFn = wrapper();
} catch (loadErr) {
  console.error(`${loadErr.name || "SyntaxError"}: ${loadErr.message}`);
  process.exit(1);
}

if (!studentFn || typeof studentFn !== "function") {
  const results = (testsData.tests || []).map((t) => ({
    id: t.id,
    name: t.name,
    passed: false,
    isSample: Boolean(t.isSample),
    actual: null,
    error: `Function '${fnName}' is not defined.`,
    executionTimeMs: 0,
  }));
  console.log(JSON.stringify({ results }));
  process.exit(0);
}

const deepEqual = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
};

const results = [];
for (const test of testsData.tests || []) {
  const start = Date.now();
  try {
    const inputArgs = Array.isArray(test.input) ? test.input : [test.input];
    const clonedArgs = JSON.parse(JSON.stringify(inputArgs));
    const actual = studentFn(...clonedArgs);
    const duration = Date.now() - start;
    const passed = deepEqual(actual, test.expected);
    results.push({
      id: test.id,
      name: test.name,
      passed,
      isSample: Boolean(test.isSample),
      actual,
      executionTimeMs: duration,
    });
  } catch (runErr) {
    results.push({
      id: test.id,
      name: test.name,
      passed: false,
      isSample: Boolean(test.isSample),
      actual: null,
      error: runErr?.message || "Runtime exception",
      executionTimeMs: Date.now() - start,
    });
  }
}

console.log(JSON.stringify({ results }));
