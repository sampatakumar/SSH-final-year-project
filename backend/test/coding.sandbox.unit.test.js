import { describe, it, expect, vi } from "vitest";
import {
  checkDockerAvailability,
  executeJavaScript,
  executeJavaScriptTask,
} from "../src/modules/coding/sandbox/dockerExecutor.js";
import { EXECUTION_LIMITS } from "../src/modules/coding/sandbox/sandboxConfig.js";

describe("Coding Sandbox Unit Tests (Injectable / Mocked Docker Client)", () => {
  describe("Docker Daemon Connectivity & Ping Checker", () => {
    it("reports available: true when docker ping succeeds", async () => {
      const mockDocker = {
        ping: vi.fn().mockResolvedValue("OK"),
      };

      const result = await checkDockerAvailability(mockDocker);
      expect(result.available).toBe(true);
      expect(mockDocker.ping).toHaveBeenCalledTimes(1);
    });

    it("reports available: false when docker ping rejects with connection error", async () => {
      const connError = new Error("connect ENOENT //./pipe/docker_engine");
      connError.code = "ENOENT";

      const mockDocker = {
        ping: vi.fn().mockRejectedValue(connError),
      };

      const result = await checkDockerAvailability(mockDocker);
      expect(result.available).toBe(false);
      expect(result.code).toBe("ENOENT");
      expect(result.reason).toContain("ENOENT");
    });

    it("reports available: false when docker ping times out", async () => {
      const mockDocker = {
        ping: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 3000))
        ),
      };

      const result = await checkDockerAvailability(mockDocker);
      expect(result.available).toBe(false);
      expect(result.reason).toContain("timed out");
    }, 5000);
  });

  describe("Input Validation & Resource Bounds Enforcement", () => {
    it("rejects code exceeding maximum code length (64 KB) with system_error", async () => {
      const oversizedCode = "a".repeat(EXECUTION_LIMITS.maxCodeLengthBytes + 10);
      const result = await executeJavaScript(oversizedCode);

      expect(result.status).toBe("system_error");
      expect(result.error).toContain("exceeds maximum allowed size");
      expect(result.stderr).toContain("64 KB");
    });

    it("rejects non-string student code with system_error", async () => {
      const result = await executeJavaScript(null);
      expect(result.status).toBe("system_error");
      expect(result.error).toContain("exceeds maximum allowed size");
    });

    it("throws TypeError if tests argument to executeJavaScriptTask is not an array", async () => {
      await expect(
        executeJavaScriptTask("function foo() {}", "not-an-array", "foo")
      ).rejects.toThrow(TypeError);
    });
  });

  describe("Docker Error Normalization & Graceful Fallback", () => {
    it("normalizes Docker connection failure into clear system_error with dockerAvailable: false", async () => {
      const mockDocker = {
        createContainer: vi.fn().mockRejectedValue({
          code: "ENOENT",
          message: "connect ENOENT //./pipe/docker_engine",
        }),
      };

      const result = await executeJavaScript("console.log(1);", {
        dockerClient: mockDocker,
      });

      expect(result.status).toBe("system_error");
      expect(result.dockerAvailable).toBe(false);
      expect(result.error).toContain("Docker daemon is not running or accessible");
      expect(result.stderr).toContain("Docker daemon unavailable");
    });
  });

  describe("Execution Timeout & Container Lifecycle Orchestration", () => {
    it("handles execution timeout and ensures container kill and cleanup", async () => {
      let killed = false;
      let removed = false;

      const mockContainer = {
        start: vi.fn().mockResolvedValue(undefined),
        logs: vi.fn().mockResolvedValue({
          on: vi.fn((event, cb) => {
            if (event === "end") setTimeout(cb, 10);
            return mockContainer;
          }),
        }),
        modem: {
          demuxStream: vi.fn((stream, stdout, stderr) => {
            // mock stream
          }),
        },
        wait: vi.fn().mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve({ StatusCode: 0 }), 1000))
        ),
        kill: vi.fn().mockImplementation(async () => {
          killed = true;
        }),
        remove: vi.fn().mockImplementation(async () => {
          removed = true;
        }),
      };

      const mockDocker = {
        createContainer: vi.fn().mockResolvedValue(mockContainer),
      };

      // Set timeoutMs to 50ms to verify race condition
      const result = await executeJavaScript("while(true){}", {
        dockerClient: mockDocker,
        timeoutMs: 50,
      });

      expect(result.status).toBe("timeout");
      expect(result.stderr).toContain("Execution Timed Out");
      expect(killed).toBe(true);
      expect(removed).toBe(true);
    });

    it("guarantees container removal even when execution encounters runtime error", async () => {
      let removed = false;

      const mockContainer = {
        start: vi.fn().mockRejectedValue(new Error("Container start failure")),
        remove: vi.fn().mockImplementation(async () => {
          removed = true;
        }),
      };

      const mockDocker = {
        createContainer: vi.fn().mockResolvedValue(mockContainer),
      };

      const result = await executeJavaScript("console.log(42);", {
        dockerClient: mockDocker,
      });

      expect(result.status).toBe("system_error");
      expect(result.error).toContain("Container start failure");
      expect(removed).toBe(true);
    });
  });
});
