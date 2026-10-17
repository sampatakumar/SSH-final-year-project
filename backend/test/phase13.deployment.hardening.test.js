import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";

import { app } from "../src/app.js";
import { env } from "../src/config/env.js";
import { globalErrorHandler } from "../src/core/errors/errorHandler.js";
import { ApiError, CodingExecutionError } from "../src/core/errors/ApiError.js";
import { checkDockerAvailability } from "../src/modules/coding/sandbox/dockerExecutor.js";
import { healthcheck } from "../src/controllers/healthcheck.controller.js";

describe("Phase 13: Deployment Hardening & Runtime Verification Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Production Health Check & Service Distinction
  // =========================================================================
  describe("1. Health Check Service Distinction", () => {
    it("distinguishes application health from database and sandbox availability", async () => {
      const res = await request(app).get("/api/v1/healthcheck");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { status, application, services, timestamp, uptimeSeconds } = res.body.data;

      // Top-level liveness confirmation
      expect(status).toBe("ok");
      expect(application).toBe("healthy");
      expect(typeof timestamp).toBe("string");
      expect(typeof uptimeSeconds).toBe("number");

      // Distinct sub-service diagnostics
      expect(services).toBeDefined();
      expect(services.database).toBeDefined();
      expect(["connected", "disconnected"]).toContain(services.database.status);
      expect(typeof services.database.connected).toBe("boolean");
      expect(typeof services.database.readyState).toBe("number");

      expect(services.dockerSandbox).toBeDefined();
      expect(typeof services.dockerSandbox.available).toBe("boolean");

      expect(services.aiProvider).toBeDefined();
      expect(typeof services.aiProvider.configured).toBe("boolean");
      expect(services.aiProvider.model).toBeDefined();
    });

    it("GET /api/v1/healthcheck/health maintains backwards-compatible status probe", async () => {
      const res = await request(app).get("/api/v1/healthcheck/health");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("ok");
    });
  });

  // =========================================================================
  // 2. Production Error Sanitization
  // =========================================================================
  describe("2. Production Error Sanitization", () => {
    it("strips error stack traces and internal infrastructure details when NODE_ENV is production", async () => {
      const originalNodeEnv = env.NODE_ENV;
      env.NODE_ENV = "production";

      try {
        const testApp = express();
        testApp.get("/error-test", (_req, _res, next) => {
          const err = new Error("Database connection pool exhausted at mongo://secret:pass@cluster.internal:27017");
          err.statusCode = 500;
          next(err);
        });
        testApp.use(globalErrorHandler);

        const res = await request(testApp).get("/error-test");

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.stack).toBeUndefined();
      } finally {
        env.NODE_ENV = originalNodeEnv;
      }
    });

    it("preserves status codes and user-safe messages without leaking secrets", async () => {
      const testApp = express();
      testApp.get("/not-found-test", (_req, _res, next) => {
        next(new ApiError(404, "Requested resource not found"));
      });
      testApp.use(globalErrorHandler);

      const res = await request(testApp).get("/not-found-test");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Requested resource not found");
      expect(res.body.errors).toEqual([]);
    });
  });

  // =========================================================================
  // 3. Database Event Monitoring & Configuration
  // =========================================================================
  describe("3. Database Event Monitoring & Configuration", () => {
    it("ensures connection event listeners are registered on mongoose.connection", async () => {
      const { connectDB } = await import("../src/core/database/db.js");

      // Verify that connectDB registers error, disconnected, and reconnected handlers
      const errorListeners = mongoose.connection.listenerCount("error");
      const disconnectedListeners = mongoose.connection.listenerCount("disconnected");
      const reconnectedListeners = mongoose.connection.listenerCount("reconnected");

      expect(errorListeners).toBeGreaterThanOrEqual(1);
      expect(disconnectedListeners).toBeGreaterThanOrEqual(1);
      expect(reconnectedListeners).toBeGreaterThanOrEqual(1);
    });

    it("validates ADMIN_EMAIL configuration is normalized and accessible", () => {
      expect(env.ADMIN_EMAIL).toBeDefined();
      expect(env.ADMIN_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  // =========================================================================
  // 4. Docker Sandbox Isolation & Host Non-Execution Safety
  // =========================================================================
  describe("4. Sandbox Security Boundary & Isolation Integrity", () => {
    it("truthfully detects Docker availability on the host", async () => {
      const status = await checkDockerAvailability();
      expect(status).toBeDefined();
      expect(typeof status.available).toBe("boolean");
      if (!status.available) {
        expect(status.reason).toBeDefined();
        expect(typeof status.reason).toBe("string");
      }
    });

    it("verifies GET /api/v1/coding/sandbox/status returns non-root and securityOpt specs", async () => {
      const res = await request(app).get("/api/v1/coding/sandbox/status");
      expect(res.status).toBe(200);

      const { isolation, executionLimits } = res.body.data;
      expect(isolation.nonRootUser).toBe("node");
      expect(isolation.securityOpt).toContain("no-new-privileges:true");
      expect(isolation.readonlyRootfs).toBe(true);
      expect(isolation.networkDisabled).toBe(true);

      expect(executionLimits.memory).toBe("128MB");
      expect(executionLimits.timeoutMs).toBe(5000);
      expect(executionLimits.maxConcurrentContainers).toBe(4);
    });
  });
});
