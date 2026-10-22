import Docker from "dockerode";
import fs from "fs/promises";
import os from "os";
import path from "path";
import pLimit from "p-limit";
import { SANDBOX_IMAGE_NAME, EXECUTION_LIMITS } from "./sandboxConfig.js";
import { CodingExecutionError } from "../../../core/errors/ApiError.js";

/**
 * Factory for creating configured Dockerode client instances.
 * Respects DOCKER_HOST (e.g. tcp://isolated-runner:2375 or unix:///var/run/docker.sock)
 * and DOCKER_SOCKET_PATH environment variables, or explicit options.
 */
export function getDockerClient(customOpts = {}) {
  if (customOpts && Object.keys(customOpts).length > 0) {
    return new Docker(customOpts);
  }

  if (process.env.DOCKER_HOST) {
    const url = process.env.DOCKER_HOST;
    if (url.startsWith("tcp://")) {
      const parsed = new URL(url.replace(/^tcp:\/\//, "http://"));
      return new Docker({
        host: parsed.hostname,
        port: parseInt(parsed.port || "2375", 10),
      });
    } else if (url.startsWith("unix://")) {
      return new Docker({
        socketPath: url.replace(/^unix:\/\//, ""),
      });
    }
    return new Docker({ host: url });
  }

  if (process.env.DOCKER_SOCKET_PATH) {
    return new Docker({ socketPath: process.env.DOCKER_SOCKET_PATH });
  }

  return new Docker();
}

const docker = getDockerClient();
const containerExecutionLimit = pLimit(EXECUTION_LIMITS.maxConcurrentContainers || 4);

/**
 * Proactively check Docker daemon connectivity with a strict timeout.
 */
export async function checkDockerAvailability(dockerInstance = null) {
  const instance = dockerInstance || getDockerClient();
  try {
    const pingPromise = instance.ping();
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error("Docker ping timed out (1500ms)")), 1500);
    });

    await Promise.race([pingPromise, timeoutPromise]);
    clearTimeout(timeoutHandle);
    return { available: true };
  } catch (err) {
    return {
      available: false,
      reason: err?.message || "Docker daemon unreachable",
      code: err?.code || "DOCKER_UNAVAILABLE",
    };
  }
}

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
export async function executeJavaScript(code, options = {}) {
  return executeInDocker({
    studentCode: code,
    isRawScript: true,
    dockerClient: options.dockerClient || docker,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Task execution against structured test cases.
 */
export async function executeJavaScriptTask(code, tests, functionName = "add", options = {}) {
  if (!Array.isArray(tests)) {
    throw new TypeError("executeJavaScriptTask() requires tests to be an array.");
  }

  return executeInDocker({
    studentCode: code,
    tests,
    functionName,
    isRawScript: false,
    dockerClient: options.dockerClient || docker,
    timeoutMs: options.timeoutMs,
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
  dockerClient = docker,
  timeoutMs = EXECUTION_LIMITS.timeoutMs,
}) {
  let container = null;
  let tempDir = null;
  const startedAt = Date.now();
  const client = dockerClient || docker;

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
    container = await client.createContainer({
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
      }, timeoutMs);
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
        stderr: streams.stderr + `\nExecution Timed Out (exceeded ${timeoutMs}ms limit).`,
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
    const isConnError =
      error.code === "ENOENT" ||
      error.code === "ECONNREFUSED" ||
      error.code === "EACCES" ||
      (typeof error.message === "string" &&
        (error.message.includes("docker_engine") ||
          error.message.includes("docker.sock") ||
          error.message.includes("connect")));

    const errorMessage = isConnError
      ? "Coding sandbox is unavailable: Docker daemon is not running or accessible. Please ensure Docker Desktop is running."
      : (error.message || "Failed to execute in sandbox.");

    return {
      status: "system_error",
      dockerAvailable: !isConnError,
      error: errorMessage,
      stdout: "",
      stderr: isConnError
        ? "Docker daemon unavailable. Code execution requires an active Docker daemon for secure isolation."
        : (error.message || "Internal sandbox error"),
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
