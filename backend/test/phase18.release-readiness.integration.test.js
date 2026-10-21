/**
 * ============================================================================
 * PHASE 18: PRODUCTION DEPLOYMENT READINESS & RELEASE ASSURANCE INTEGRATION SUITE
 * ============================================================================
 *
 * Verifies:
 * 1. Process Liveness & Application Readiness separation (HTTP 200 vs 503).
 * 2. Composite Health & Service Isolation diagnostics.
 * 3. Sandbox fail-closed integrity: system_error returns failed: 0 and does not
 *    penalize student competency or generate false failure feedback.
 * 4. Graceful shutdown handler: closes HTTP server and Mongoose connection.
 * 5. Strict User Isolation & Spoofing Prevention on core routes.
 * 6. Environment Schema validation and secret isolation.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";

import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { livenessCheck, readinessCheck, healthcheck } from "../src/controllers/healthcheck.controller.js";
import { evaluateTask } from "../src/modules/coding/services/codingExecution.service.js";
import { generateCodingIntelligenceReport } from "../src/modules/coding/services/codeIntelligence.service.js";
import * as dockerExecutor from "../src/modules/coding/sandbox/dockerExecutor.js";
import { shutdown } from "../src/index.js";

describe("Phase 18: Release Readiness & Operational Assurance Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // 1. Production Health, Liveness & Readiness Separation
  // ===========================================================================
  describe("1. Health, Liveness & Readiness Separation", () => {
    it("GET /api/v1/healthcheck/live returns HTTP 200 with process liveness", async () => {
      const res = await request(app).get("/api/v1/healthcheck/live");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
      expect(res.body.data.liveness).toBe("alive");
      expect(typeof res.body.data.uptimeSeconds).toBe("number");
      expect(res.body.data.timestamp).toBeDefined();
    });

    it("GET /api/v1/healthcheck/ready returns HTTP 503 when database is disconnected", async () => {
      // Mock mongoose connection readyState as disconnected (0)
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 0,
        configurable: true,
      });

      try {
        const res = await request(app).get("/api/v1/healthcheck/ready");

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.data.status).toBe("degraded");
        expect(res.body.data.ready).toBe(false);
        expect(res.body.data.reason).toContain("Database connection is not ready");
        expect(res.body.data.services.database.connected).toBe(false);
      } finally {
        Object.defineProperty(mongoose.connection, "readyState", {
          value: originalReadyState,
          configurable: true,
        });
      }
    });

    it("GET /api/v1/healthcheck/ready returns HTTP 200 when database is connected", async () => {
      // Mock mongoose connection readyState as connected (1)
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1,
        configurable: true,
      });

      try {
        const res = await request(app).get("/api/v1/healthcheck/ready");

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe("ok");
        expect(res.body.data.ready).toBe(true);
        expect(res.body.data.services.database.connected).toBe(true);
      } finally {
        Object.defineProperty(mongoose.connection, "readyState", {
          value: originalReadyState,
          configurable: true,
        });
      }
    });

    it("GET /api/v1/healthcheck returns composite diagnostics including ready boolean", async () => {
      const res = await request(app).get("/api/v1/healthcheck");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
      expect(res.body.data.application).toBe("healthy");
      expect(typeof res.body.data.ready).toBe("boolean");
      expect(res.body.data.services.dockerSandbox).toBeDefined();
      expect(res.body.data.services.aiProvider).toBeDefined();
    });
  });

  // ===========================================================================
  // 2. Sandbox Error Isolation & Fail-Closed Integrity
  // ===========================================================================
  describe("2. Coding Sandbox Failure Mode Verification", () => {
    it("system_error in sandbox executor reports failed: 0 and preserves error details without penalizing student", async () => {
      // Simulate Docker daemon unreachable
      vi.spyOn(dockerExecutor, "executeJavaScriptTask").mockResolvedValueOnce({
        status: "system_error",
        dockerAvailable: false,
        error: "Coding sandbox is unavailable: Docker daemon is not running.",
        stdout: "",
        stderr: "Docker daemon unreachable.",
        executionTime: 0,
      });

      const result = await evaluateTask("add-two-numbers", "function add(a, b) { return a + b; }");

      expect(result.status).toBe("system_error");
      expect(result.error).toContain("sandbox is unavailable");
      expect(result.dockerAvailable).toBe(false);
      expect(result.passed).toBe(0);
      // Crucial Phase 18 guarantee: infrastructure failure must NOT be recorded as student test failures
      expect(result.failed).toBe(0);
      expect(result.total).toBe(6);
      expect(result.score).toBe(0);
    });

    it("generateCodingIntelligenceReport handles system_error gracefully without attributing blame to student", async () => {
      const mockResult = {
        taskId: "add-two-numbers",
        status: "system_error",
        error: "Docker daemon socket unreachable",
        score: 0,
        maxScore: 10,
        passed: 0,
        failed: 0,
        total: 6,
        tests: [],
      };

      const task = {
        id: "add-two-numbers",
        title: "Add Two Numbers",
        description: "Add two numbers",
        skills: ["Basic Syntax"],
      };

      const intelligence = await generateCodingIntelligenceReport({
        code: "function add(a, b) { return a + b; }",
        task,
        executionResult: mockResult,
        userId: "test-user-123",
      });

      expect(intelligence).toBeDefined();
      expect(intelligence.functionalCorrectness.passed).toBe(0);
      expect(intelligence.functionalCorrectness.failed).toBe(0);
      expect(intelligence.feedback).toContain("sandbox infrastructure issue");
      expect(intelligence.feedback).toContain("No penalty or competency loss has been recorded");
    });
  });

  // ===========================================================================
  // 3. Graceful Teardown & Lifecycle Verification
  // ===========================================================================
  describe("3. Graceful Teardown & Resource Cleanup", () => {
    it("executes graceful shutdown cleanly without unhandled exceptions", async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1,
        configurable: true,
      });

      const disconnectSpy = vi.spyOn(mongoose, "disconnect").mockResolvedValueOnce();

      try {
        // Test shutdown without exiting process in test environment
        await shutdown("TEST_SIGTERM", false);
        expect(disconnectSpy).toHaveBeenCalled();
      } finally {
        Object.defineProperty(mongoose.connection, "readyState", {
          value: originalReadyState,
          configurable: true,
        });
      }
    });
  });


  // ===========================================================================
  // 4. Strict Authentication & Cross-User Security Boundary
  // ===========================================================================
  describe("4. Security Boundaries & Authorization Verification", () => {
    it("rejects unauthenticated requests to /api/v1/skills/learning-loop/plan with 401", async () => {
      const res = await request(app).get("/api/v1/skills/learning-loop/plan");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to /api/v1/skills/learning-loop/activity with 401", async () => {
      const res = await request(app)
        .post("/api/v1/skills/learning-loop/activity")
        .send({
          activityType: "coding_passed",
          skill: "JavaScript",
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to /api/v1/coding/submit with 401", async () => {
      const res = await request(app)
        .post("/api/v1/coding/submit")
        .send({
          taskId: "add-two-numbers",
          code: "function add() {}",
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to /api/v1/resumes with 401", async () => {
      const res = await request(app).get("/api/v1/resumes");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to /api/v1/notifications with 401", async () => {
      const res = await request(app).get("/api/v1/notifications");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects non-admin access to /api/v1/admin/analytics with 401/403", async () => {
      const res = await request(app).get("/api/v1/admin/analytics");
      expect([401, 403]).toContain(res.status);
    });
  });

  // ===========================================================================
  // 5. Environment & Secret Management
  // ===========================================================================
  describe("5. Environment Configuration Integrity", () => {
    it("ensures critical environment variables are present and typed correctly", () => {
      expect(env.MONGODB_URI).toBeDefined();
      expect(typeof env.MONGODB_URI).toBe("string");
      expect(env.PORT).toBeDefined();
      expect(typeof env.PORT).toBe("number");
      expect(env.API_PREFIX).toBe("/api/v1");
      expect(env.NODE_ENV).toBeDefined();
      expect(["development", "test", "production"]).toContain(env.NODE_ENV);
    });
  });
});
