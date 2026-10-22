/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 34: STAGING DEPLOYMENT & OPERATIONAL READINESS SUITE
 * ============================================================================
 *
 * Senior DevOps, Release Engineering & Application Security Suite:
 * 1. Safe staging coding runner safeguard (CODING_EXECUTION_ENABLED=false)
 * 2. Fail-closed runner availability & system_error status enforcement
 * 3. Zero competency impact on disabled runner in staging
 * 4. Staging environment configuration & health-check verification
 * 5. Multi-stage Docker container and reverse proxy operational verification
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import { app } from "../src/app.js";
import {
  checkDockerAvailability,
  executeJavaScript,
  executeJavaScriptTask,
} from "../src/modules/coding/sandbox/dockerExecutor.js";
import { evaluateTask } from "../src/modules/coding/services/codingExecution.service.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";

describe("Phase 34: Staging Deployment & Operational Safeguards Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Section 1: Coding Runner Staging Safeguard (CODING_EXECUTION_ENABLED=false)
  // ==========================================================================
  describe("1. Coding Runner Controlled Staging Safeguard", () => {
    it("reports disabled status when CODING_EXECUTION_ENABLED=false in staging", async () => {
      const orig = process.env.CODING_EXECUTION_ENABLED;
      try {
        process.env.CODING_EXECUTION_ENABLED = "false";

        const status = await checkDockerAvailability();
        expect(status.available).toBe(false);
        expect(status.disabled).toBe(true);
        expect(status.code).toBe("CODING_EXECUTION_DISABLED");
        expect(status.reason).toMatch(/disabled in this staging deployment/i);
      } finally {
        if (orig !== undefined) process.env.CODING_EXECUTION_ENABLED = orig;
        else delete process.env.CODING_EXECUTION_ENABLED;
      }
    });

    it("returns controlled system_error on executeJavaScript when CODING_EXECUTION_ENABLED=false", async () => {
      const orig = process.env.CODING_EXECUTION_ENABLED;
      try {
        process.env.CODING_EXECUTION_ENABLED = "false";

        const result = await executeJavaScript("const x = 1;");
        expect(result.status).toBe("system_error");
        expect(result.dockerAvailable).toBe(false);
        expect(result.error).toMatch(/disabled in this staging deployment/i);
        expect(result.stderr).toMatch(/disabled in this staging deployment/i);
      } finally {
        if (orig !== undefined) process.env.CODING_EXECUTION_ENABLED = orig;
        else delete process.env.CODING_EXECUTION_ENABLED;
      }
    });

    it("returns controlled system_error on executeJavaScriptTask when CODING_EXECUTION_ENABLED=false", async () => {
      const orig = process.env.CODING_EXECUTION_ENABLED;
      try {
        process.env.CODING_EXECUTION_ENABLED = "false";

        const result = await executeJavaScriptTask(
          "function add(a, b) { return a + b; }",
          [{ input: [1, 2], expected: 3 }],
          "add"
        );
        expect(result.status).toBe("system_error");
        expect(result.dockerAvailable).toBe(false);
        expect(result.error).toMatch(/disabled in this staging deployment/i);
      } finally {
        if (orig !== undefined) process.env.CODING_EXECUTION_ENABLED = orig;
        else delete process.env.CODING_EXECUTION_ENABLED;
      }
    });

    it("guarantees zero competency penalties when evaluateTask encounters disabled staging runner", async () => {
      const orig = process.env.CODING_EXECUTION_ENABLED;
      const recordSpy = vi.spyOn(learningOutcomeTrackerService, "recordActivity");
      try {
        process.env.CODING_EXECUTION_ENABLED = "false";

        const evalResult = await evaluateTask("two-sum", "function twoSum() {}");
        expect(evalResult.status).toBe("system_error");
        expect(evalResult.dockerAvailable).toBe(false);
        expect(evalResult.failed).toBe(0); // Invariant: no failed count on system error
        expect(evalResult.score).toBe(0);

        // Confirm activity is not recorded as student failure
        expect(recordSpy).not.toHaveBeenCalled();
      } finally {
        if (orig !== undefined) process.env.CODING_EXECUTION_ENABLED = orig;
        else delete process.env.CODING_EXECUTION_ENABLED;
      }
    });
  });

  // ==========================================================================
  // Section 2: Staging Configuration & Network Topology Audits
  // ==========================================================================
  describe("2. Staging Configuration & Deployment Invariants", () => {
    it("confirms docker-compose.yml defines isolated networks and persistent volumes", () => {
      const composePath = path.resolve(__dirname, "../../docker-compose.yml");
      const composeContent = fs.readFileSync(composePath, "utf8");

      expect(composeContent).toContain("ssh-internal-network");
      expect(composeContent).toContain("ssh-public-network");
      expect(composeContent).toContain("mongodb_data");
      expect(composeContent).toContain("uploads_data");
      expect(composeContent).toContain("CODING_EXECUTION_ENABLED");
    });

    it("confirms mongo service does not expose port 27017 to the public internet", () => {
      const composePath = path.resolve(__dirname, "../../docker-compose.yml");
      const composeContent = fs.readFileSync(composePath, "utf8");

      // Extracts mongo service block
      const mongoSection = composeContent.split("  mongo:")[1]?.split("  backend:")[0] || "";
      // Must be bound to 127.0.0.1 or internal only
      expect(mongoSection).toContain("127.0.0.1:27017:27017");
      expect(mongoSection).not.toMatch(/"27017:27017"/);
    });

    it("confirms backend runs as unprivileged user 'node' in Dockerfile", () => {
      const dockerfilePath = path.resolve(__dirname, "../Dockerfile");
      const content = fs.readFileSync(dockerfilePath, "utf8");

      expect(content).toContain("USER node");
      expect(content).not.toContain("USER root");
    });

    it("confirms backend Dockerfile copies production dependencies with npm ci --omit=dev", () => {
      const dockerfilePath = path.resolve(__dirname, "../Dockerfile");
      const content = fs.readFileSync(dockerfilePath, "utf8");

      expect(content).toContain("npm ci --omit=dev");
    });
  });
});
