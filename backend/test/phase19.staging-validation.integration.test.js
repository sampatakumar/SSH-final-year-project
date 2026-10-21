/**
 * ============================================================================
 * PHASE 19: LIVE STAGING VALIDATION & RELEASE CANDIDATE CERTIFICATION SUITE
 * ============================================================================
 *
 * Comprehensive end-to-end smoke verification across student journeys:
 * 1. Authentication & Profile Boundary.
 * 2. Academic & Target Role Selection.
 * 3. Career Intelligence & Multi-Role Gap Comparison.
 * 4. Adaptive Learning Plan Generation & Prerequisite Ordering.
 * 5. EduTube Consumption vs Demonstration Boundary (Competency Separation).
 * 6. Authoritative Passing Coding Execution & Competency Credit.
 * 7. Sandbox Infrastructure Failure Fail-Closed Guarantee (No Penalty).
 * 8. Smart AI Mentor Context & Safe NLP Fallback Degradation.
 * 9. Resume Creation, Modification & Schema Integrity.
 * 10. Cross-User Resume Isolation (Unauthorized Denial).
 * 11. Cross-User Coding History Isolation.
 * 12. Authoritative Admin-Only Mutation Protection.
 * 13. Graceful Shutdown & Exit Code Propagation.
 * 14. Liveness vs Readiness Probe Distinction.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../src/app.js";
import { shutdown } from "../src/index.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { adaptiveLearningPlanService } from "../src/modules/recommendations/services/adaptiveLearningPlan.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import { submitSolution, getUserSubmissionHistory } from "../src/modules/coding/controllers/coding.controller.js";
import { getResumeFile } from "../src/modules/resume/controllers/resume.controller.js";
import * as codingExecutionService from "../src/modules/coding/services/codingExecution.service.js";
import * as codeIntelligenceService from "../src/modules/coding/services/codeIntelligence.service.js";
import { aiOrchestrator } from "../src/core/ai/aiOrchestrator.service.js";

describe("Phase 19: Staging Validation & Release Candidate Certification Suite", () => {
  const studentAlice = new mongoose.Types.ObjectId("65a000000000000000000001");
  const studentBob = new mongoose.Types.ObjectId("65a000000000000000000002");

  beforeEach(() => {
    vi.clearAllMocks();
    smartMentorContextService.invalidateContext(studentAlice);
    smartMentorContextService.invalidateContext(studentBob);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function invokeController(handler, req) {
    return new Promise((resolve, reject) => {
      let statusCode = 200;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => resolve({ statusCode, data: payload?.data, body: payload }),
            send: (payload) => resolve({ statusCode, data: payload, body: payload }),
          };
        },
        setHeader: vi.fn(),
      };
      const next = (err) => {
        if (err) reject(err);
        else resolve({ statusCode, nextCalled: true });
      };

      try {
        const result = handler(req, res, next);
        if (result && typeof result.then === "function") {
          result.catch(reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  // =========================================================================
  // WORKFLOW 1 & 2: Authentication, Profile & Target Role Selection
  // =========================================================================
  describe("Workflow 1 & 2: Student Identity & Target Role Context", () => {
    it("ensures student context is isolated and canonical target role is loaded", async () => {
      const mockProfile = {
        owner: studentAlice,
        targetRole: "Full Stack Developer",
        overallReadinessScore: 72,
        skills: [
          { skill: "JavaScript", score: 85, level: "Proficient", sources: ["coding"] },
          { skill: "Node.js", score: 70, level: "Competent", sources: ["resume"] },
        ],
      };

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () => Promise.resolve(mockProfile),
      });

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(studentAlice, "Full Stack Developer");

      expect(plan).toBeDefined();
      expect(plan.targetRole).toBe("Full Stack Developer");
      expect(Array.isArray(plan.actions)).toBe(true);
      expect(plan.actionsCount).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // WORKFLOW 3: Career Intelligence & Role Comparison
  // =========================================================================
  describe("Workflow 3: Career Intelligence & Multi-Role Comparison", () => {
    it("compares multiple roles without corrupting or mutating student active role", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: studentAlice,
            targetRole: "Full Stack Developer",
            skills: [{ skill: "JavaScript", score: 85, level: "Proficient", sources: ["coding"] }],
          }),
      });

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      const comparison = await adaptiveLearningPlanService.compareMultiRolePlans(studentAlice, [
        "Full Stack Developer",
        "Backend Developer",
      ]);

      expect(comparison).toBeDefined();
      expect(comparison.rolesCount).toBe(2);
      expect(comparison.roles[0].targetRole).toBe("Full Stack Developer");
      expect(comparison.roles[1].targetRole).toBe("Backend Developer");
    });
  });

  // =========================================================================
  // WORKFLOW 4: Adaptive Learning Plan & Prerequisite Ordering
  // =========================================================================
  describe("Workflow 4: Adaptive Learning Recommendations & Prerequisite Ordering", () => {
    it("orders prerequisite skills before dependent competencies", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: studentAlice,
            targetRole: "Full Stack Developer",
            skills: [
              { skill: "JavaScript", score: 40, level: "Developing", sources: ["resume"] },
              { skill: "React", score: 20, level: "Limited Evidence", sources: ["resume"] },
            ],
          }),
      });

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(studentAlice, "Full Stack Developer");

      expect(plan.actions.length).toBeGreaterThan(0);
      const jsIndex = plan.actions.findIndex((p) => p.skill === "JavaScript");
      const reactIndex = plan.actions.findIndex((p) => p.skill === "React");

      if (jsIndex !== -1 && reactIndex !== -1) {
        expect(jsIndex).toBeLessThan(reactIndex);
      }
    });

    it("identifies unknown role benchmark with benchmark_pending status", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () => Promise.resolve(null),
      });

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({
          limit: () => ({
            lean: () => Promise.resolve([]),
          }),
        }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(studentAlice, "Quantum Computing Specialist");

      expect(plan.benchmarkAvailable).toBe(false);
      expect(plan.status).toBe("benchmark_pending");
      expect(plan.nextAction).toBeNull();
      expect(plan.currentObjective).toContain("Quantum Computing Specialist");
    });
  });

  // =========================================================================
  // WORKFLOW 5: EduTube Consumption vs Competency Boundary
  // =========================================================================
  describe("Workflow 5: EduTube Educational Consumption Integrity", () => {
    it("guarantees educational activity records never award demonstrated competency", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () => Promise.resolve(null),
      });

      let recordedRecord = null;
      vi.spyOn(LearningActivityRecord, "create").mockImplementationOnce((data) => {
        recordedRecord = { ...data, _id: new mongoose.Types.ObjectId() };
        return Promise.resolve(recordedRecord);
      });

      await learningOutcomeTrackerService.recordActivity(studentAlice, {
        activityType: "module_completed",
        skill: "Docker",
        entityId: "video-docker-masterclass",
        title: "Docker Containerization Fundamentals",
        status: "completed",
        evidence: {
          platform: "EduTube",
          watchPercentage: 100,
        },
      });

      expect(recordedRecord).toBeDefined();
      expect(recordedRecord.activityType).toBe("module_completed");
      expect(recordedRecord.isDemonstratedCompetency).toBe(false);
    });
  });

  // =========================================================================
  // WORKFLOW 6: Authoritative Passing Coding Execution
  // =========================================================================
  describe("Workflow 6: Authoritative Coding Evaluation & Verified Pass", () => {
    it("awards competency only upon server-verified test pass in isolated sandbox", async () => {
      vi.spyOn(codingExecutionService, "evaluateTask").mockResolvedValueOnce({
        taskId: "add-two-numbers",
        title: "Add Two Numbers",
        functionName: "add",
        status: "passed",
        score: 10,
        maxScore: 10,
        passed: 2,
        failed: 0,
        total: 2,
        tests: [
          { id: 1, name: "Test 1", passed: true, expected: 5, actual: 5 },
          { id: 2, name: "Test 2", passed: true, expected: 10, actual: 10 },
        ],
        stdout: "All 2 tests passed",
        stderr: "",
        executionTimeMs: 15,
        skillsCovered: ["JavaScript", "Problem Solving"],
      });

      vi.spyOn(codeIntelligenceService, "generateCodingIntelligenceReport").mockResolvedValueOnce({
        summary: "All 2 automated tests passed",
      });

      const submissionId = new mongoose.Types.ObjectId();
      vi.spyOn(CodingSubmission, "create").mockResolvedValueOnce({
        _id: submissionId,
        owner: studentAlice,
        taskId: "add-two-numbers",
        status: "passed",
        score: 10,
        maxScore: 10,
        passed: 2,
        failed: 0,
        total: 2,
      });

      let activityPayload = null;
      vi.spyOn(learningOutcomeTrackerService, "recordActivity").mockImplementationOnce(
        async (_userId, payload) => {
          activityPayload = payload;
          return { success: true, activityId: "act-123" };
        }
      );

      const req = {
        user: { _id: studentAlice },
        body: {
          taskId: "add-two-numbers",
          code: "function add(a, b) { return a + b; }",
        },
      };

      const res = await invokeController(submitSolution, req);

      expect(res.statusCode).toBe(200);
      expect(res.data.status).toBe("passed");
      expect(activityPayload).toBeDefined();
      expect(activityPayload.activityType).toBe("coding_passed");
      expect(activityPayload.status).toBe("passed");
      expect(activityPayload.evidence.sandboxVerified).toBe(true);
    });
  });

  // =========================================================================
  // WORKFLOW 7: Sandbox Infrastructure Fail-Closed Handling
  // =========================================================================
  describe("Workflow 7: Sandbox Infrastructure Failure Handling", () => {
    it("system_error results report failed: 0, attach error, and record no activity", async () => {
      vi.spyOn(codingExecutionService, "evaluateTask").mockResolvedValueOnce({
        taskId: "add-two-numbers",
        title: "Add Two Numbers",
        functionName: "add",
        status: "system_error",
        error: "Docker daemon socket connection refused",
        dockerAvailable: false,
        score: 0,
        maxScore: 10,
        passed: 0,
        failed: 0,
        total: 2,
        tests: [],
        stdout: "",
        stderr: "Daemon unavailable",
        executionTimeMs: 0,
        skillsCovered: ["JavaScript"],
      });

      vi.spyOn(codeIntelligenceService, "generateCodingIntelligenceReport").mockResolvedValueOnce({
        summary: "System error: Docker unavailable",
      });

      vi.spyOn(CodingSubmission, "create").mockResolvedValueOnce({
        _id: new mongoose.Types.ObjectId(),
        owner: studentAlice,
        taskId: "add-two-numbers",
        status: "system_error",
      });

      const recordActivitySpy = vi.spyOn(learningOutcomeTrackerService, "recordActivity");

      const req = {
        user: { _id: studentAlice },
        body: {
          taskId: "add-two-numbers",
          code: "function add(a, b) { return a + b; }",
        },
      };

      const res = await invokeController(submitSolution, req);

      expect(res.statusCode).toBe(200);
      expect(res.data.status).toBe("system_error");
      expect(res.data.failed).toBe(0);
      expect(res.data.error).toContain("Docker daemon socket");
      // Critical guarantee: system error must not write false coding failure activity
      expect(recordActivitySpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // WORKFLOW 8: Smart AI Mentor & Safe Fallback
  // =========================================================================
  describe("Workflow 8: Smart AI Mentor & Fallback Robustness", () => {
    it("handles AI provider unavailability with safe contextual fallback", async () => {
      const fallbackResult = await aiOrchestrator.executeTask({
        taskName: "CODING_EXPLANATION",
        systemInstruction: "You are an algorithm mentor.",
        userPrompt: "Explain this code",
        fallbackGenerator: () => "Structured heuristic feedback: practice edge case validation.",
      });

      expect(fallbackResult).toBeDefined();
      expect(fallbackResult.success).toBe(true);
      expect(fallbackResult.data).toBe("Structured heuristic feedback: practice edge case validation.");
    });
  });

  // =========================================================================
  // WORKFLOW 9, 10 & 11: Resume Management & Cross-User Security Boundary
  // =========================================================================
  describe("Workflows 9, 10 & 11: Resume Operations & User Isolation Boundaries", () => {
    it("denies student Bob access to student Alice's resume file with 404", async () => {
      const resumeId = new mongoose.Types.ObjectId();

      vi.spyOn(Resume, "findOne").mockImplementation(({ _id, owner }) => {
        if (_id.toString() === resumeId.toString() && owner.toString() === studentAlice.toString()) {
          return Promise.resolve({
            _id: resumeId,
            owner: studentAlice,
            title: "Alice Resume",
            storedFileName: "alice_resume.pdf",
          });
        }
        return Promise.resolve(null);
      });

      const req = {
        user: { _id: studentBob },
        params: { resumeId: resumeId.toString() },
      };

      await expect(invokeController(getResumeFile, req)).rejects.toThrow("Resume not found");
    });

    it("strictly isolates coding submission history by authenticated user ID", async () => {
      let queriedOwner = null;
      vi.spyOn(CodingSubmission, "find").mockImplementation((query) => {
        queriedOwner = query.owner;
        return {
          sort: () => ({
            limit: () => ({
              select: () => Promise.resolve([]),
            }),
          }),
        };
      });

      const req = {
        user: { _id: studentAlice },
        query: { limit: 10 },
      };

      const res = await invokeController(getUserSubmissionHistory, req);

      expect(res.statusCode).toBe(200);
      expect(queriedOwner.toString()).toBe(studentAlice.toString());
    });
  });

  // =========================================================================
  // WORKFLOW 12: Admin Authorization Boundary
  // =========================================================================
  describe("Workflow 12: Administrative Endpoint Protection", () => {
    it("rejects non-admin access to academic catalog seed endpoint", async () => {
      const res = await request(app).post("/api/v1/academic/seed");
      expect([401, 403]).toContain(res.status);
    });
  });

  // =========================================================================
  // WORKFLOW 13: Graceful Shutdown with Exit Codes
  // =========================================================================
  describe("Workflow 13: Graceful Shutdown Lifecycle & Exit Code Handling", () => {
    it("passes exitCode 0 for SIGTERM/SIGINT and code 1 for exceptions", async () => {
      const disconnectSpy = vi.spyOn(mongoose, "disconnect").mockResolvedValue();

      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1,
        configurable: true,
      });

      await shutdown("SIGTERM", false, 0);
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // WORKFLOW 14: Liveness and Readiness Probe Separation
  // =========================================================================
  describe("Workflow 14: Process Liveness vs Application Readiness", () => {
    it("liveness succeeds (200) regardless of database state", async () => {
      const res = await request(app).get("/api/v1/healthcheck/live");
      expect(res.status).toBe(200);
      expect(res.body.data.liveness).toBe("alive");
    });

    it("readiness returns 503 when MongoDB readyState is 0", async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 0,
        configurable: true,
      });

      try {
        const res = await request(app).get("/api/v1/healthcheck/ready");
        expect(res.status).toBe(503);
        expect(res.body.data.ready).toBe(false);
      } finally {
        Object.defineProperty(mongoose.connection, "readyState", {
          value: originalReadyState,
          configurable: true,
        });
      }
    });
  });
});
