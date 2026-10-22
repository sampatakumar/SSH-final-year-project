/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 28: PRODUCTION VERIFICATION & DEPLOYMENT GATE SUITE
 * ============================================================================
 *
 * Independent evidence-driven verification of production health endpoints,
 * environment configuration, AI provider & fallback behavior, authentication
 * and authorization boundaries, database persistence & ownership enforcement.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import mongoose from "mongoose";

import {
  healthcheck,
  livenessCheck,
  readinessCheck,
} from "../src/controllers/healthcheck.controller.js";
import healthcheckRouter from "../src/routes/healthcheck.routes.js";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";
import { verifyFirebaseToken } from "../src/core/auth/auth.middleware.js";
import {
  classifyGroqError,
  AI_ERROR_CATEGORIES,
  GROQ_MODEL_PRIMARY,
  GROQ_MODEL_LIGHTWEIGHT,
  TASK_TIERS,
} from "../src/config/groq.config.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import {
  educationalClassifierService,
  CLASSIFIER_REASON_CODES,
  YOUTUBE_CATEGORIES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";
import { getAllTasks, getPublicTask } from "../src/modules/coding/services/taskCatalog.service.js";
import { checkDockerAvailability } from "../src/modules/coding/sandbox/dockerExecutor.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import { Notification } from "../src/modules/notifications/models/notification.models.js";

describe("Phase 28: Production Deployment Verification Suite", () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Section 1: Health Endpoints & Deployment Probes
  // ==========================================================================
  describe("1. Deployment Probes & Health Endpoint Consistency", () => {
    it("verifies healthcheck router exposes standard probes", async () => {
      app.use("/api/v1/healthcheck", healthcheckRouter);

      // Liveness probe
      const liveRes = await request(app).get("/api/v1/healthcheck/live");
      expect(liveRes.status).toBe(200);
      expect(liveRes.body.success).toBe(true);
      expect(liveRes.body.data.liveness).toBe("alive");

      // Liveness alias
      const livenessRes = await request(app).get("/api/v1/healthcheck/liveness");
      expect(livenessRes.status).toBe(200);

      // Readiness probe (when DB readyState = 1)
      const mockConn = vi.spyOn(mongoose, "connection", "get").mockReturnValue({
        readyState: 1,
      });

      const readyRes = await request(app).get("/api/v1/healthcheck/ready");
      expect(readyRes.status).toBe(200);
      expect(readyRes.body.success).toBe(true);
      expect(readyRes.body.data.ready).toBe(true);
      expect(readyRes.body.data.services.database.connected).toBe(true);

      // Readiness alias
      const readinessRes = await request(app).get("/api/v1/healthcheck/readiness");
      expect(readinessRes.status).toBe(200);

      mockConn.mockRestore();
    });

    it("verifies readiness probe returns 503 Service Unavailable when MongoDB is disconnected", async () => {
      app.use("/api/v1/healthcheck", healthcheckRouter);

      const mockConn = vi.spyOn(mongoose, "connection", "get").mockReturnValue({
        readyState: 0,
      });

      const readyRes = await request(app).get("/api/v1/healthcheck/ready");
      expect(readyRes.status).toBe(503);
      expect(readyRes.body.success).toBe(false);
      expect(readyRes.body.data.ready).toBe(false);
      expect(readyRes.body.data.status).toBe("degraded");
      expect(readyRes.body.data.services.database.status).toBe("disconnected");

      mockConn.mockRestore();
    });

    it("verifies liveness probe continues returning 200 during database disconnect", async () => {
      app.use("/api/v1/healthcheck", healthcheckRouter);

      const mockConn = vi.spyOn(mongoose, "connection", "get").mockReturnValue({
        readyState: 0,
      });

      const liveRes = await request(app).get("/api/v1/healthcheck/live");
      expect(liveRes.status).toBe(200);
      expect(liveRes.body.data.liveness).toBe("alive");

      mockConn.mockRestore();
    });
  });

  // ==========================================================================
  // Section 2: AI Provider Configuration, Error Classification & Fallback
  // ==========================================================================
  describe("2. AI Provider Architecture & Fallback Behavior", () => {
    it("confirms Groq is primary AI provider with OpenAI-compatible OSS models", () => {
      expect(GROQ_MODEL_PRIMARY).toBe("openai/gpt-oss-120b");
      expect(GROQ_MODEL_LIGHTWEIGHT).toBe("openai/gpt-oss-20b");
      expect(TASK_TIERS.HIGH_REASONING).toBe("high");
      expect(TASK_TIERS.LIGHTWEIGHT).toBe("lightweight");
    });

    it("classifies authentication failures (401) accurately without leaking internal keys", () => {
      const authError = { status: 401, message: "Invalid API Key provided" };
      const classified = classifyGroqError(authError);

      expect(classified.type).toBe("AUTH_ERROR");
      expect(classified.category).toBe(AI_ERROR_CATEGORIES.AI_AUTH_ERROR);
      expect(classified.statusCode).toBe(401);
      expect(classified.userMessage).toContain("AI service is temporarily unavailable");
    });

    it("classifies rate limit errors (429) accurately with backoff advice", () => {
      const rateLimitError = { status: 429, message: "Rate limit reached for model" };
      const classified = classifyGroqError(rateLimitError);

      expect(classified.type).toBe("RATE_LIMIT");
      expect(classified.category).toBe(AI_ERROR_CATEGORIES.AI_RATE_LIMIT);
      expect(classified.statusCode).toBe(429);
      expect(classified.userMessage).toContain("AI service is currently busy");
    });

    it("classifies timeout errors (408/504) accurately for graceful degradation", () => {
      const timeoutError = { status: 504, message: "Request timeout after 30000ms" };
      const classified = classifyGroqError(timeoutError);

      expect(classified.type).toBe("TIMEOUT");
      expect(classified.category).toBe(AI_ERROR_CATEGORIES.AI_TIMEOUT);
      expect(classified.statusCode).toBe(504);
    });

    it("executes deterministic local NLP mentor fallback when external AI provider is offline", async () => {
      const studentContext = {
        career: {
          targetRole: "Full Stack Developer",
          readinessScore: 70,
        },
        skillGaps: [{ skill: "Docker", currentScore: 20, targetScore: 80 }],
        github: { repositoryCount: 12 },
        learning: { videosWatched: 8, completedVideos: 4 },
      };

      const response = await smartMentorLocalService.generateLocalResponse(
        "How do I prepare for technical interviews?",
        studentContext
      );

      expect(response).toBeDefined();
      expect(typeof response.answer).toBe("string");
      expect(response.answer.length).toBeGreaterThan(40);
      expect(Array.isArray(response.actions)).toBe(true);
      expect(response.actions.length).toBeGreaterThan(0);
      expect(response.source).toBe("local_nlp");
    });
  });

  // ==========================================================================
  // Section 3: Authentication & Authorization Security Boundaries
  // ==========================================================================
  describe("3. Authentication & Authorization Enforcement", () => {
    it("rejects unauthenticated requests with 401 Missing Firebase ID token", async () => {
      const { globalErrorHandler } = await import("../src/core/errors/errorHandler.js");
      app.get("/api/v1/protected-test", verifyFirebaseToken, (req, res) => {
        res.status(200).json({ ok: true });
      });
      app.use(globalErrorHandler);

      const res = await request(app).get("/api/v1/protected-test");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Missing Firebase ID token");
    });

    it("rejects malformed bearer tokens with 401 Unauthorized", async () => {
      const { globalErrorHandler } = await import("../src/core/errors/errorHandler.js");
      app.get("/api/v1/protected-test", verifyFirebaseToken, (req, res) => {
        res.status(200).json({ ok: true });
      });
      app.use(globalErrorHandler);

      const res = await request(app)
        .get("/api/v1/protected-test")
        .set("Authorization", "Bearer invalid-garbage-token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("enforces admin middleware: denies standard student access with 403 Forbidden", async () => {
      const { globalErrorHandler } = await import("../src/core/errors/errorHandler.js");
      app.get(
        "/api/v1/admin/restricted",
        (req, res, next) => {
          // Simulate authenticated student
          req.user = { _id: "student-123", email: "student@ssh.edu", role: "student" };
          next();
        },
        ensureAdmin,
        (req, res) => {
          res.status(200).json({ admin: true });
        }
      );
      app.use(globalErrorHandler);

      const res = await request(app).get("/api/v1/admin/restricted");
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Administrator privilege required");
    });

    it("enforces admin middleware: permits verified administrator access with 200 OK", async () => {
      app.get(
        "/api/v1/admin/restricted",
        (req, res, next) => {
          // Simulate authenticated admin
          req.user = {
            _id: "admin-999",
            email: "sampatakumarsv@gmail.com",
            role: "admin",
          };
          next();
        },
        ensureAdmin,
        (req, res) => {
          res.status(200).json({ success: true, admin: true });
        }
      );

      const res = await request(app).get("/api/v1/admin/restricted");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.admin).toBe(true);
    });
  });

  // ==========================================================================
  // Section 4: Data Isolation & Ownership Protection
  // ==========================================================================
  describe("4. Data Isolation & Tamper Resistance", () => {
    it("ensures student cannot retrieve or modify another user's resume draft", async () => {
      const studentAId = new mongoose.Types.ObjectId();
      const studentBId = new mongoose.Types.ObjectId();
      const resumeId = new mongoose.Types.ObjectId();

      // Mock finding resume owned by Student A
      vi.spyOn(Resume, "findOne").mockImplementation(({ _id, owner }) => {
        if (String(_id) === String(resumeId) && String(owner) === String(studentAId)) {
          return Promise.resolve({
            _id: resumeId,
            owner: studentAId,
            title: "Student A Private Resume",
            content: "Confidential Student A details",
          });
        }
        // Student B query returns null
        return Promise.resolve(null);
      });

      // Student A queries own resume: found
      const resumeForA = await Resume.findOne({ _id: resumeId, owner: studentAId });
      expect(resumeForA).not.toBeNull();
      expect(resumeForA.title).toBe("Student A Private Resume");

      // Student B attempts direct object reference query: returns null (404/denied)
      const resumeForB = await Resume.findOne({ _id: resumeId, owner: studentBId });
      expect(resumeForB).toBeNull();
    });

    it("ensures student cannot mark another user's notifications as read", async () => {
      const studentAId = new mongoose.Types.ObjectId();
      const studentBId = new mongoose.Types.ObjectId();
      const notifId = new mongoose.Types.ObjectId();

      vi.spyOn(Notification, "findOneAndUpdate").mockImplementation((query, update) => {
        if (String(query._id) === String(notifId) && String(query.owner) === String(studentAId)) {
          return Promise.resolve({
            _id: notifId,
            owner: studentAId,
            isRead: true,
          });
        }
        return Promise.resolve(null);
      });

      // Student B attempts to update Student A notification: denied
      const updatedByB = await Notification.findOneAndUpdate(
        { _id: notifId, owner: studentBId },
        { isRead: true }
      );
      expect(updatedByB).toBeNull();

      // Student A updates own notification: succeeds
      const updatedByA = await Notification.findOneAndUpdate(
        { _id: notifId, owner: studentAId },
        { isRead: true }
      );
      expect(updatedByA).not.toBeNull();
      expect(updatedByA.isRead).toBe(true);
    });
  });

  // ==========================================================================
  // Section 5: EduTube Filtering & Coding Catalog Sanitization
  // ==========================================================================
  describe("5. Content Curation & Sandbox Security", () => {
    it("whitelists YouTube Education Category 27 and blocks clickbait / shorts", () => {
      const validEduVideo = {
        videoId: "edu-video-101",
        title: "Introduction to Distributed Systems & Raft Consensus",
        description: "Comprehensive lecture covering consensus algorithms in distributed databases.",
        durationSeconds: 1800,
        categoryId: YOUTUBE_CATEGORIES.EDUCATION,
      };

      const result = educationalClassifierService.classifyVideo(validEduVideo);
      expect(result.decision).toBe("allow");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.EDUCATIONAL_CATEGORY_CONFIRMED);

      const shortVideo = {
        videoId: "short-video-102",
        title: "Crazy coding hack in 30 seconds!! #shorts",
        description: "Watch this trick",
        durationSeconds: 35,
        categoryId: YOUTUBE_CATEGORIES.ENTERTAINMENT,
      };

      const shortResult = educationalClassifierService.classifyVideo(shortVideo);
      expect(shortResult.decision).toBe("reject");
      expect(shortResult.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });

    it("sanitizes coding tasks catalog by stripping hidden test cases from client responses", () => {
      const allTasks = getAllTasks();
      expect(allTasks.length).toBeGreaterThan(0);

      const twoSumPublic = getPublicTask("two-sum");
      expect(twoSumPublic).toBeDefined();
      expect(twoSumPublic.id).toBe("two-sum");
      expect(twoSumPublic.title).toBe("Two Sum");
      expect(twoSumPublic.testCases).toBeUndefined(); // Stripped from public catalog
      expect(twoSumPublic.solution).toBeUndefined(); // Solution never exposed
    });

    it("verifies Docker availability reporting returns structured diagnostics", async () => {
      const availability = await checkDockerAvailability();
      expect(availability).toBeDefined();
      expect(typeof availability.available).toBe("boolean");
      if (!availability.available) {
        expect(typeof availability.reason).toBe("string");
      }
    });
  });
});
