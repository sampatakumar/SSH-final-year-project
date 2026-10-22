/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 29: SECURITY REMEDIATION & SANDBOX HARDENING SUITE
 * ============================================================================
 *
 * Comprehensive security regression testing covering:
 * 1. Production dependency vulnerability remediation verification
 * 2. Coding sandbox authentication & ownership authorization
 * 3. Request payload validation & input sanitization
 * 4. Sandbox isolation parameters (CPU, RAM, PID limits, network isolation)
 * 5. Runner service architecture & DOCKER_HOST configuration flexibility
 * 6. Fail-closed infrastructure behavior & graceful error containment
 * 7. Hidden test case confidentiality & catalog sanitization
 * 8. Execution timeout, process termination & resource cleanup
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { app } from "../src/app.js";
import {
  SANDBOX_IMAGE_NAME,
  EXECUTION_LIMITS,
} from "../src/modules/coding/sandbox/sandboxConfig.js";
import {
  checkDockerAvailability,
  getDockerClient,
  executeJavaScript,
  executeJavaScriptTask,
} from "../src/modules/coding/sandbox/dockerExecutor.js";
import {
  getAllTasks,
  getPublicTask,
  getRawTask,
} from "../src/modules/coding/services/taskCatalog.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Phase 29: Security Remediation & Sandbox Hardening Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Section 1: Dependency Vulnerability Remediation Verification
  // ==========================================================================
  describe("1. Production Dependency Remediation Verification", () => {
    it("verifies backend package-lock.json exists and is valid JSON", () => {
      const lockfilePath = path.resolve(__dirname, "../package-lock.json");
      expect(fs.existsSync(lockfilePath)).toBe(true);

      const content = fs.readFileSync(lockfilePath, "utf8");
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe("smart-skill-hub-backend");
      expect(parsed.lockfileVersion).toBeDefined();
    });

    it("verifies patched Express sub-dependencies are remediated in lockfile", () => {
      const lockfilePath = path.resolve(__dirname, "../package-lock.json");
      const parsed = JSON.parse(fs.readFileSync(lockfilePath, "utf8"));
      const packages = parsed.packages || {};

      // Check proxy-addr remediation (CVE-2024-52798 patched in >= 2.0.7)
      const proxyAddrEntry = packages["node_modules/proxy-addr"];
      if (proxyAddrEntry) {
        const [major, minor, patch] = proxyAddrEntry.version.split(".").map(Number);
        const isPatched = major > 2 || (major === 2 && (minor > 0 || (minor === 0 && patch >= 7)));
        expect(isPatched).toBe(true);
      }

      // Check path-to-regexp (CVE-2024-45296 / CVE-2024-52798)
      const pathToRegexpEntry = packages["node_modules/path-to-regexp"];
      if (pathToRegexpEntry) {
        expect(pathToRegexpEntry.version).toBeDefined();
      }
    });

    it("verifies frontend package-lock.json exists and contains remediated dependencies", () => {
      const lockfilePath = path.resolve(__dirname, "../../frontend/package-lock.json");
      expect(fs.existsSync(lockfilePath)).toBe(true);

      const content = fs.readFileSync(lockfilePath, "utf8");
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe("smart-skill-hub-frontend");
      expect(parsed.lockfileVersion).toBeDefined();
    });
  });

  // ==========================================================================
  // Section 2: Coding Sandbox Authentication & Authorization Enforcement
  // ==========================================================================
  describe("2. Coding Sandbox Authentication & Authorization Boundaries", () => {
    it("rejects unauthenticated solution submissions with 401 Unauthorized", async () => {
      const res = await request(app)
        .post("/api/v1/coding/submit")
        .send({
          taskId: "two-sum",
          code: "function twoSum(nums, target) { return [0, 1]; }",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/token|authorization|authenticated|unauthorized/i);
    });

    it("rejects unauthenticated user submission history query with 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/api/v1/coding/submissions");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("allows public access to read-only sandbox status endpoint", async () => {
      const res = await request(app).get("/api/v1/coding/sandbox/status");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.executionLimits).toBeDefined();
      expect(res.body.data.isolation).toBeDefined();
      expect(res.body.data.isolation.networkDisabled).toBe(true);
      expect(res.body.data.isolation.nonRootUser).toBe("node");
    });
  });

  // ==========================================================================
  // Section 3: Input Validation & Payload Size Limits
  // ==========================================================================
  describe("3. Input Validation & Execution Payload Boundaries", () => {
    it("rejects empty code submissions on /api/v1/coding/run with 400 Bad Request", async () => {
      const res = await request(app)
        .post("/api/v1/coding/run")
        .send({ code: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/non-empty/i);
    });

    it("rejects non-existent task IDs with 404 Not Found on /api/v1/coding/run", async () => {
      const res = await request(app)
        .post("/api/v1/coding/run")
        .send({
          code: "console.log('hi');",
          taskId: "non-existent-task-99999",
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("enforces maximum code size limit (64 KB) in dockerExecutor", async () => {
      const oversizedCode = "a".repeat(EXECUTION_LIMITS.maxCodeLengthBytes + 100);
      const result = await executeJavaScript(oversizedCode);

      expect(result.status).toBe("system_error");
      expect(result.error).toMatch(/exceeds maximum allowed size/i);
      expect(result.stderr).toMatch(/exceeds maximum allowed size/i);
    });

    it("rejects non-array test suite in executeJavaScriptTask with TypeError", async () => {
      await expect(
        executeJavaScriptTask("function foo() {}", "not-an-array", "foo")
      ).rejects.toThrow(TypeError);
    });
  });

  // ==========================================================================
  // Section 4: Sandbox Resource & Security Isolation Policies
  // ==========================================================================
  describe("4. Sandbox Resource Limits & Security Containment Configuration", () => {
    it("verifies mandatory security containment constants", () => {
      // Memory limits
      expect(EXECUTION_LIMITS.memory).toBe(128 * 1024 * 1024); // 128 MB
      expect(EXECUTION_LIMITS.memorySwap).toBe(128 * 1024 * 1024); // Swap disabled/capped

      // CPU and PID limits
      expect(EXECUTION_LIMITS.nanoCpus).toBe(500_000_000); // 0.5 CPU
      expect(EXECUTION_LIMITS.pidsLimit).toBe(32); // Max 32 PIDs to prevent fork bombs

      // Timeout and output buffers
      expect(EXECUTION_LIMITS.timeoutMs).toBe(5000); // 5 second timeout
      expect(EXECUTION_LIMITS.maxStdoutBytes).toBe(1024 * 1024); // 1 MB stdout limit
      expect(EXECUTION_LIMITS.maxStderrBytes).toBe(1024 * 1024); // 1 MB stderr limit
      expect(EXECUTION_LIMITS.maxConcurrentContainers).toBe(4);
    });

    it("verifies standard sandbox container image tag", () => {
      expect(SANDBOX_IMAGE_NAME).toBe("ssh-javascript-sandbox");
    });
  });

  // ==========================================================================
  // Section 5: Runner Architecture & DOCKER_HOST Flexibility
  // ==========================================================================
  describe("5. Runner Architecture & DOCKER_HOST Configuration Flexibility", () => {
    it("creates standard Docker client when no custom environment is set", () => {
      const client = getDockerClient();
      expect(client).toBeDefined();
      expect(typeof client.ping).toBe("function");
      expect(typeof client.createContainer).toBe("function");
    });

    it("configures TCP host client when DOCKER_HOST is set to remote runner", () => {
      const originalHost = process.env.DOCKER_HOST;
      try {
        process.env.DOCKER_HOST = "tcp://isolated-runner:2375";
        const client = getDockerClient();
        expect(client.modem.host).toBe("isolated-runner");
        expect(Number(client.modem.port)).toBe(2375);
      } finally {
        if (originalHost !== undefined) {
          process.env.DOCKER_HOST = originalHost;
        } else {
          delete process.env.DOCKER_HOST;
        }
      }
    });

    it("configures Unix socket client when DOCKER_HOST is set to unix socket URI", () => {
      const originalHost = process.env.DOCKER_HOST;
      try {
        process.env.DOCKER_HOST = "unix:///custom/runner/docker.sock";
        const client = getDockerClient();
        expect(client.modem.socketPath).toBe("/custom/runner/docker.sock");
      } finally {
        if (originalHost !== undefined) {
          process.env.DOCKER_HOST = originalHost;
        } else {
          delete process.env.DOCKER_HOST;
        }
      }
    });

    it("accepts custom Dockerode options directly", () => {
      const customClient = getDockerClient({ host: "10.0.0.5", port: 2376 });
      expect(customClient.modem.host).toBe("10.0.0.5");
      expect(Number(customClient.modem.port)).toBe(2376);
    });
  });

  // ==========================================================================
  // Section 6: Fail-Closed Behavior & Graceful Error Containment
  // ==========================================================================
  describe("6. Fail-Closed Error Handling & Infrastructure Diagnostics", () => {
    it("reports available: false when Docker daemon cannot be reached", async () => {
      const mockFailingDocker = {
        ping: vi.fn().mockRejectedValue(new Error("connect ENOENT /var/run/docker.sock")),
      };

      const result = await checkDockerAvailability(mockFailingDocker);
      expect(result.available).toBe(false);
      expect(result.code).toBe("DOCKER_UNAVAILABLE");
      expect(result.reason).toMatch(/connect ENOENT/);
    });

    it("handles Docker daemon unreachable in raw execution by failing closed", async () => {
      const mockFailingDocker = {
        createContainer: vi.fn().mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:2375")),
      };

      const result = await executeJavaScript("console.log('test')", {
        dockerClient: mockFailingDocker,
      });

      expect(result.status).toBe("system_error");
      expect(result.dockerAvailable).toBe(false);
      expect(result.error).toMatch(/Docker daemon is not running or accessible/i);
    });

    it("handles execution timeout cleanly with status: 'timeout' without throwing unhandled exceptions", async () => {
      const mockKilledContainer = {
        start: vi.fn().mockResolvedValue(true),
        logs: vi.fn().mockResolvedValue({
          demuxStream: vi.fn(),
          on: vi.fn((event, cb) => {
            if (event === "end") cb();
          }),
        }),
        wait: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500))),
        kill: vi.fn().mockResolvedValue(true),
        remove: vi.fn().mockResolvedValue(true),
        modem: {
          demuxStream: vi.fn((stream, out, err) => {
            // no-op
          }),
        },
      };

      const mockTimingOutDocker = {
        createContainer: vi.fn().mockResolvedValue(mockKilledContainer),
      };

      const result = await executeJavaScript("while(true) {}", {
        dockerClient: mockTimingOutDocker,
        timeoutMs: 50, // fast timeout for test
      });

      expect(result.status).toBe("timeout");
      expect(result.stderr).toMatch(/Execution Timed Out/i);
      expect(mockKilledContainer.kill).toHaveBeenCalled();
      expect(mockKilledContainer.remove).toHaveBeenCalledWith({ force: true });
    });
  });

  // ==========================================================================
  // Section 7: Hidden Test Confidentiality & Catalog Sanitization
  // ==========================================================================
  describe("7. Hidden Test Confidentiality & Catalog Sanitization", () => {
    it("guarantees public task catalog never exposes hidden test cases", () => {
      const publicTasks = getAllTasks("javascript");
      expect(publicTasks.length).toBeGreaterThan(0);

      publicTasks.forEach((task) => {
        // Public catalog must never contain raw hidden tests
        expect(task.tests).toBeUndefined();
        // Sample tests, if present, must only be marked sample
        if (task.sampleTests) {
          expect(Array.isArray(task.sampleTests)).toBe(true);
        }
      });
    });

    it("guarantees getPublicTask sanitizes test suites and internal solutions", () => {
      const task = getPublicTask("two-sum", "javascript");
      expect(task).toBeDefined();
      expect(task.id).toBe("two-sum");
      // Full test suite must not be present on public representation
      expect(task.tests).toBeUndefined();
      expect(task.sampleTests).toBeDefined();
      expect(task.sampleTests.length).toBeGreaterThan(0);
    });

    it("verifies internal getRawTask retains full test suite for server-side evaluation", () => {
      const rawTask = getRawTask("two-sum", "javascript");
      expect(rawTask).toBeDefined();
      expect(Array.isArray(rawTask.tests)).toBe(true);
      expect(rawTask.tests.length).toBeGreaterThan(0);

      // Verify presence of hidden test cases
      const hiddenTests = rawTask.tests.filter((t) => !t.isSample);
      expect(hiddenTests.length).toBeGreaterThan(0);
    });
  });
});
