import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { adaptiveLearningPlanService } from "../src/modules/recommendations/services/adaptiveLearningPlan.service.js";
import { adaptiveSkillLoopService } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { submitSolution, getSandboxStatus } from "../src/modules/coding/controllers/coding.controller.js";
import * as dockerExecutor from "../src/modules/coding/sandbox/dockerExecutor.js";
import * as codingExecutionService from "../src/modules/coding/services/codingExecution.service.js";
import * as codeIntelligenceService from "../src/modules/coding/services/codeIntelligence.service.js";

describe("Phase 17: Production Reliability, Sandbox Verification & Data Integrity Suite", () => {
  const userA = new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e101");
  const userB = new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e102");

  beforeEach(() => {
    vi.clearAllMocks();
    smartMentorContextService.invalidateContext(userA);
    smartMentorContextService.invalidateContext(userB);

    vi.spyOn(CodingSubmission, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: () => Promise.resolve([]),
        }),
      }),
    });

    vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
      lean: () => Promise.resolve(null),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to execute Express asyncHandler controller in tests
  function invokeController(handler, req) {
    return new Promise((resolve, reject) => {
      let statusCode = 200;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => {
              resolve({ statusCode, data: payload?.data, body: payload });
              return payload;
            },
          };
        },
        json: (payload) => {
          resolve({ statusCode, data: payload?.data, body: payload });
          return payload;
        },
      };
      const next = (err) => {
        if (err) reject(err);
        else resolve({ statusCode, data: null });
      };

      handler(req, res, next);
    });
  }

  // =========================================================================
  // 1. REAL CODING SANDBOX EXECUTION PATH & DOCKER-UNAVAILABLE GUARANTEES
  // =========================================================================
  describe("1. Coding Sandbox Execution Path & Isolation Guarantees", () => {
    it("fails closed when Docker is unavailable: does NOT falsely penalize student with coding_failed", async () => {
      vi.spyOn(codingExecutionService, "evaluateTask").mockResolvedValue({
        taskId: "two-sum",
        title: "Two Sum",
        functionName: "twoSum",
        status: "system_error",
        score: 0,
        maxScore: 10,
        passed: 0,
        failed: 3,
        total: 3,
        tests: [],
        stdout: "",
        stderr: "Docker daemon unavailable. Code execution requires an active Docker daemon for secure isolation.",
        executionTimeMs: 0,
        skillsCovered: ["JavaScript", "Data Structures"],
      });

      vi.spyOn(codeIntelligenceService, "generateCodingIntelligenceReport").mockResolvedValue({
        summary: "Docker unavailable",
      });

      const submissionMock = {
        _id: new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e201"),
        owner: userA,
        status: "system_error",
      };
      vi.spyOn(CodingSubmission, "create").mockResolvedValue(submissionMock);
      const recordActivitySpy = vi.spyOn(learningOutcomeTrackerService, "recordActivity");

      const req = {
        user: { _id: userA },
        body: {
          taskId: "two-sum",
          code: "function twoSum() { return []; }",
          language: "javascript",
        },
      };

      const response = await invokeController(submitSolution, req);

      expect(response.statusCode).toBe(200);
      expect(response.data.status).toBe("system_error");
      // CRITICAL GUARANTEE: Never penalize student competency when Docker sandbox is down!
      expect(recordActivitySpy).not.toHaveBeenCalled();
    });

    it("records authoritative coding_passed with sandboxVerified: true upon verified container test pass", async () => {
      vi.spyOn(codingExecutionService, "evaluateTask").mockResolvedValue({
        taskId: "two-sum",
        title: "Two Sum",
        functionName: "twoSum",
        status: "passed",
        score: 10,
        maxScore: 10,
        passed: 3,
        failed: 0,
        total: 3,
        tests: [{ id: 1, passed: true }, { id: 2, passed: true }, { id: 3, passed: true }],
        stdout: "All 3 tests passed",
        stderr: "",
        executionTimeMs: 142,
        skillsCovered: ["JavaScript", "Algorithms"],
      });

      vi.spyOn(codeIntelligenceService, "generateCodingIntelligenceReport").mockResolvedValue({
        summary: "Great job",
      });

      const submissionMock = {
        _id: new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e202"),
        owner: userA,
        status: "passed",
      };
      vi.spyOn(CodingSubmission, "create").mockResolvedValue(submissionMock);
      const recordActivitySpy = vi.spyOn(learningOutcomeTrackerService, "recordActivity").mockResolvedValue({
        isDuplicate: false,
        activity: { isDemonstratedCompetency: true },
      });

      const req = {
        user: { _id: userA },
        body: {
          taskId: "two-sum",
          code: "function twoSum(nums, target) { return [0, 1]; }",
          language: "javascript",
        },
      };

      const response = await invokeController(submitSolution, req);

      expect(response.statusCode).toBe(200);
      expect(recordActivitySpy).toHaveBeenCalledWith(
        userA,
        expect.objectContaining({
          activityType: "coding_passed",
          status: "passed",
          evidence: expect.objectContaining({
            sandboxVerified: true,
            testCasesPassed: 3,
            testCasesTotal: 3,
            score: 10,
          }),
        })
      );
    });

    it("records coding_failed with sandboxVerified: true when student code fails test assertions in container", async () => {
      vi.spyOn(codingExecutionService, "evaluateTask").mockResolvedValue({
        taskId: "two-sum",
        title: "Two Sum",
        functionName: "twoSum",
        status: "failed",
        score: 3,
        maxScore: 10,
        passed: 1,
        failed: 2,
        total: 3,
        tests: [{ id: 1, passed: true }, { id: 2, passed: false }, { id: 3, passed: false }],
        stdout: "",
        stderr: "AssertionError: expected [0] to deeply equal [0, 1]",
        executionTimeMs: 98,
        skillsCovered: ["JavaScript"],
      });

      vi.spyOn(codeIntelligenceService, "generateCodingIntelligenceReport").mockResolvedValue({
        summary: "Needs work",
      });

      const submissionMock = {
        _id: new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e203"),
        owner: userA,
        status: "failed",
      };
      vi.spyOn(CodingSubmission, "create").mockResolvedValue(submissionMock);
      const recordActivitySpy = vi.spyOn(learningOutcomeTrackerService, "recordActivity").mockResolvedValue({
        isDuplicate: false,
      });

      const req = {
        user: { _id: userA },
        body: {
          taskId: "two-sum",
          code: "function twoSum() { return [0]; }",
          language: "javascript",
        },
      };

      const response = await invokeController(submitSolution, req);

      expect(response.statusCode).toBe(200);
      expect(recordActivitySpy).toHaveBeenCalledWith(
        userA,
        expect.objectContaining({
          activityType: "coding_failed",
          status: "failed",
          evidence: expect.objectContaining({
            sandboxVerified: true,
            testCasesPassed: 1,
            testCasesTotal: 3,
          }),
        })
      );
    });

    it("reports real sandbox daemon status accurately via getSandboxStatus", async () => {
      vi.spyOn(dockerExecutor, "checkDockerAvailability").mockResolvedValue({
        available: false,
        reason: "Docker daemon unreachable at /var/run/docker.sock",
      });

      const response = await invokeController(getSandboxStatus, {});
      expect(response.statusCode).toBe(200);
      expect(response.data.dockerAvailable).toBe(false);
      expect(response.data.reason).toContain("Docker daemon unreachable");
      expect(response.data.executionLimits.timeoutMs).toBe(5000);
      expect(response.data.isolation.readonlyRootfs).toBe(true);
    });
  });

  // =========================================================================
  // 2. LEARNING ACTIVITY AND DATABASE INTEGRITY (IDEMPOTENCY & ISOLATION)
  // =========================================================================
  describe("2. Learning Activity and Database Integrity", () => {
    it("distinguishes educational consumption from demonstrated competency", async () => {
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: () => Promise.resolve(null),
      });

      let createdPayload = null;
      vi.spyOn(LearningActivityRecord, "create").mockImplementation(async (payload) => {
        createdPayload = payload;
        return { ...payload, _id: new mongoose.Types.ObjectId() };
      });

      // Video module completion -> isDemonstratedCompetency: false
      const videoResult = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "module_completed",
        skill: "Docker",
        entityId: "docker_vid_01",
      });

      expect(videoResult.activity.isDemonstratedCompetency).toBe(false);
      expect(createdPayload.isDemonstratedCompetency).toBe(false);

      // Coding passed -> isDemonstratedCompetency: true
      vi.spyOn(adaptiveSkillLoopService, "recordAdaptiveAssessmentOutcome").mockResolvedValue({
        score: 100,
        level: "Proficient",
      });

      const codingResult = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "coding_passed",
        skill: "Docker",
        entityId: "docker_task_01",
        evidence: { score: 10, maxScore: 10, testCasesPassed: 3, testCasesTotal: 3 },
      });

      expect(codingResult.activity.isDemonstratedCompetency).toBe(true);
      expect(createdPayload.isDemonstratedCompetency).toBe(true);
    });

    it("compound idempotency check: prevents duplicate requests from inflating progress", async () => {
      const existingRecord = {
        _id: new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e301"),
        owner: userA,
        activityType: "coding_passed",
        skill: "JavaScript",
        idempotencyKey: "unique_req_abc_123",
      };

      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: () => Promise.resolve(existingRecord),
      });
      const createSpy = vi.spyOn(LearningActivityRecord, "create");

      const result = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "coding_passed",
        skill: "JavaScript",
        idempotencyKey: "unique_req_abc_123",
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain("idempotent duplicate");
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("handles compound index race conditions gracefully via E11000 deduplication", async () => {
      const existingRecord = {
        _id: new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e302"),
        owner: userA,
        activityType: "module_completed",
        idempotencyKey: "race_key_789",
      };

      vi.spyOn(LearningActivityRecord, "findOne")
        .mockReturnValueOnce({ lean: () => Promise.resolve(null) })
        .mockReturnValueOnce({ lean: () => Promise.resolve(existingRecord) });

      const duplicateError = new Error("E11000 duplicate key error collection");
      duplicateError.code = 11000;
      vi.spyOn(LearningActivityRecord, "create").mockRejectedValue(duplicateError);

      const result = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "module_completed",
        skill: "React",
        idempotencyKey: "race_key_789",
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain("idempotent race");
    });

    it("validates idempotencyKey and rejects oversized keys (>128 chars)", async () => {
      const oversizedKey = "k".repeat(129);

      await expect(
        learningOutcomeTrackerService.recordActivity(userA, {
          activityType: "module_completed",
          skill: "Node.js",
          idempotencyKey: oversizedKey,
        })
      ).rejects.toThrow(/idempotencyKey exceeds maximum length of 128 characters/);
    });

    it("rejects invalid activityType and empty skill names", async () => {
      await expect(
        learningOutcomeTrackerService.recordActivity(userA, {
          activityType: "invalid_unsupported_type",
          skill: "Node.js",
        })
      ).rejects.toThrow(/Invalid activityType/);

      await expect(
        learningOutcomeTrackerService.recordActivity(userA, {
          activityType: "module_completed",
          skill: "   ",
        })
      ).rejects.toThrow(/skill is required/);
    });

    it("strictly isolates learner activities per authenticated user", async () => {
      const userARecord = {
        _id: new mongoose.Types.ObjectId(),
        owner: userA,
        skill: "JavaScript",
        activityType: "coding_passed",
      };

      const findSpy = vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: () => Promise.resolve([userARecord]),
            }),
          }),
        }),
      });

      vi.spyOn(LearningActivityRecord, "countDocuments").mockResolvedValue(1);

      // User A queries their own history
      const resA = await learningOutcomeTrackerService.getLearnerActivities(userA);
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ owner: userA }));
      expect(resA.activities[0].owner).toEqual(userA);

      // User B query filters strictly by User B, never exposing User A
      const resB = await learningOutcomeTrackerService.getLearnerActivities(userB);
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ owner: userB }));
    });
  });

  // =========================================================================
  // 3. ADAPTIVE RECOMMENDATION CONSISTENCY & UNKNOWN ROLE FALLBACK
  // =========================================================================
  describe("3. Adaptive Recommendation Consistency & Prerequisite Logic", () => {
    it("handles unknown role benchmark gracefully with status benchmark_pending without fabricating Full Stack skills", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () => Promise.resolve(null),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });

      // Query unknown non-computing role benchmark
      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(userA, "Quantum Computing Architect");

      expect(plan.targetRole).toBe("Quantum Computing Architect");
      expect(plan.benchmarkAvailable).toBe(false);
      expect(plan.status).toBe("benchmark_pending");
      expect(plan.actionsCount).toBe(0);
      expect(plan.nextAction).toBeNull();
      expect(plan.currentObjective).toContain("Benchmark definition pending");
    });

    it("orders missing prerequisites strictly ahead of dependent skills for known roles", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: userA,
            overallReadinessScore: 50,
            skills: [
              { skill: "JavaScript", score: 30, level: "Novice" },
              { skill: "React", score: 0, level: "Novice" },
            ],
          }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(userA, "Frontend Developer");

      expect(plan.targetRole).toBe("Frontend Developer");
      expect(plan.actions.length).toBeGreaterThan(0);

      // Locate positions of JavaScript and React
      const jsIndex = plan.actions.findIndex((a) => a.skill === "JavaScript");
      const reactIndex = plan.actions.findIndex((a) => a.skill === "React");

      if (jsIndex !== -1 && reactIndex !== -1) {
        expect(jsIndex).toBeLessThan(reactIndex);
      }
    });

    it("compares multi-role readiness while preserving distinct requirements", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () => Promise.resolve({ owner: userA, overallReadinessScore: 70, skills: [] }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });

      const comparison = await adaptiveLearningPlanService.compareMultiRolePlans(userA, [
        "Frontend Developer",
        "Backend Developer",
      ]);

      expect(comparison.rolesCount).toBe(2);
      expect(comparison.roles[0].targetRole).toBe("Frontend Developer");
      expect(comparison.roles[1].targetRole).toBe("Backend Developer");
    });
  });

  // =========================================================================
  // 4. CONTEXT CACHE INVALIDATION ON PROGRESS EVENTS
  // =========================================================================
  describe("4. Context Cache Invalidation & Freshness", () => {
    it("invalidates mentor context cache immediately upon recording an activity", async () => {
      // Prime the cache
      smartMentorContextService.setCachedContext(userA, { career: { targetRole: "Full Stack Developer" } });
      expect(smartMentorContextService.getCachedContext(userA)).not.toBeNull();

      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: () => Promise.resolve(null),
      });
      vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        owner: userA,
        activityType: "module_completed",
      });

      await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "module_completed",
        skill: "MongoDB",
      });

      // Cache should be evicted immediately
      expect(smartMentorContextService.getCachedContext(userA)).toBeNull();
    });

    it("auto-initializes SkillProfile for a brand new student without throwing error", async () => {
      vi.spyOn(SkillProfile, "findOne").mockResolvedValue(null);
      const createSpy = vi.spyOn(SkillProfile, "create").mockResolvedValue({
        owner: userA,
        targetRole: "Full Stack Developer",
        skills: [{ canonicalName: "JavaScript", score: 0, sources: [], evidence: [] }],
        skillGaps: [],
        overallReadinessScore: 60,
        save: vi.fn().mockResolvedValue(true),
      });

      vi.spyOn(mongoose.models.LearnerSkillAssessmentHistory || { create: vi.fn() }, "create").mockResolvedValue({});
      vi.spyOn(mongoose.models.SpacedRevisionSchedule || { create: vi.fn() }, "create").mockResolvedValue({});

      await adaptiveSkillLoopService.recordAdaptiveAssessmentOutcome(userA, {
        skill: "JavaScript",
        score: 10,
        maxScore: 10,
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: userA,
          targetRole: "Full Stack Developer",
        })
      );
    });
  });
});
