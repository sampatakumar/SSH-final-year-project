import Docker from "dockerode";
import fs from "fs/promises";
import os from "os";
import path from "path";
import pLimit from "p-limit";
import { SANDBOX_IMAGE_NAME, EXECUTION_LIMITS } from "./sandboxConfig.js";
import { CodingExecutionError } from "../../../core/errors/ApiError.js";

const docker = new Docker();
const containerExecutionLimit = pLimit(EXECUTION_LIMITS.maxConcurrentContainers || 4);

/**
 * Collect Docker stdout/stderr streams with bounded buffers.
 */
function demuxDockerStream(container, stream) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";

    container.modem.demuxStream(
      stream,
      {
        write: (chunk) => {
          if (stdout.length < EXECUTION_LIMITS.maxStdoutBytes) {
            stdout += chunk.toString();
          }
        },
      },
      {
        write: (chunk) => {
          if (stderr.length < EXECUTION_LIMITS.maxStderrBytes) {
            stderr += chunk.toString();
          }
        },
      }
    );

    stream.on("end", () => {
      resolve({ stdout, stderr });
    });

    stream.on("error", () => {
      resolve({ stdout, stderr });
    });
  });
}

/**
 * Raw script execution (Run Code mode).
 */
export async function executeJavaScript(code) {
  return executeInDocker({
    studentCode: code,
    isRawScript: true,
  });
}

/**
 * Task execution against structured test cases.
 */
export async function executeJavaScriptTask(code, tests, functionName = "add") {
  if (!Array.isArray(tests)) {
    throw new TypeError("executeJavaScriptTask() requires tests to be an array.");
  }

  return executeInDocker({
    studentCode: code,
    tests,
    functionName,
    isRawScript: false,
  });
}

/**
 * Concurrency-bounded execution entrypoint.
 */
function executeInDocker(params) {
  return containerExecutionLimit(() => executeInDockerCore(params));
}

/**
 * Internal Docker execution with strict sandboxing and resource limits.
 */
async function executeInDockerCore({
  studentCode,
  tests = null,
  functionName = "add",
  isRawScript = false,
}) {
  let container = null;
  let tempDir = null;
  const startedAt = Date.now();

  try {
    if (typeof studentCode !== "string" || studentCode.length > EXECUTION_LIMITS.maxCodeLengthBytes) {
      return {
        status: "system_error",
        error: "Student code exceeds maximum allowed size (64 KB).",
        stdout: "",
        stderr: "Student code exceeds maximum allowed size (64 KB).",
        executionTime: 0,
      };
    }

    // 1. Create unique temporary directory
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "ssh-js-execution-")
    );

    // 2. Write student source
    const studentFile = path.join(tempDir, "student.js");
    await fs.writeFile(studentFile, studentCode, {
      encoding: "utf8",
      mode: 0o444,
    });

    // 3. Prepare Docker bind mounts
    const binds = [`${studentFile}:/input/student.js:ro`];

    // 4. Write tests payload if in test runner mode
    if (!isRawScript && tests !== null) {
      const testsFile = path.join(tempDir, "tests.json");
      const testsPayload = {
        functionName,
        tests,
      };

      await fs.writeFile(
        testsFile,
        JSON.stringify(testsPayload),
        {
          encoding: "utf8",
          mode: 0o444,
        }
      );

      binds.push(`${testsFile}:/input/tests.json:ro`);
    }

    // 5. Container command
    const cmd = isRawScript
      ? ["node", "/input/student.js"]
      : ["node", "test-runner.js"];

    // 6. Create isolated Docker container
    container = await docker.createContainer({
      Image: SANDBOX_IMAGE_NAME,
      Cmd: cmd,
      NetworkDisabled: true,
      User: "node",
      WorkingDir: "/sandbox",
      HostConfig: {
        AutoRemove: false,
        Memory: EXECUTION_LIMITS.memory,
        MemorySwap: EXECUTION_LIMITS.memorySwap,
        NanoCpus: EXECUTION_LIMITS.nanoCpus,
        PidsLimit: EXECUTION_LIMITS.pidsLimit,
        ReadonlyRootfs: true,
        Tmpfs: {
          "/tmp": "rw,noexec,nosuid,size=16m",
        },
        Binds: binds,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges:true"],
      },
    });

    // 7. Start container
    await container.start();

    // 8. Stream output
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });

    const outputPromise = demuxDockerStream(container, stream);

    // 9. Process timeout race
    const waitPromise = container.wait();
    let timeoutHandle;

    const timeoutPromise = new Promise((resolve) => {
      timeoutHandle = setTimeout(() => {
        resolve({ timedOut: true });
      }, EXECUTION_LIMITS.timeoutMs);
    });

    const result = await Promise.race([waitPromise, timeoutPromise]);
    clearTimeout(timeoutHandle);

    if (result && result.timedOut) {
      try {
        await container.kill();
      } catch {
        // ignore if already exited
      }

      const streams = await outputPromise;
      return {
        status: "timeout",
        stdout: streams.stdout,
        stderr: streams.stderr + "\nExecution Timed Out (exceeded 5000ms limit).",
        executionTime: Date.now() - startedAt,
      };
    }

    // Normal execution termination
    const streams = await outputPromise;
    const executionTime = Date.now() - startedAt;

    let taskResults = null;
    if (!isRawScript) {
      try {
        const lastLine = streams.stdout.trim().split("\n").pop();
        if (lastLine) {
          taskResults = JSON.parse(lastLine);
        }
      } catch {
        taskResults = null;
      }
    }

    return {
      status: result.StatusCode === 0 ? "completed" : "error",
      exitCode: result.StatusCode,
      stdout: streams.stdout,
      stderr: streams.stderr,
      executionTime,
      taskResults,
    };
  } catch (error) {
    return {
      status: "system_error",
      error: error.message || "Failed to execute in sandbox.",
      stdout: "",
      stderr: error.message || "Internal sandbox error",
      executionTime: Date.now() - startedAt,
    };
  } finally {
    // 10. Guaranteed Container cleanup
    if (container) {
      try {
        await container.remove({ force: true });
      } catch {
        // ignore cleanup error
      }
    }

    // 11. Cleanup temporary directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  }
}
