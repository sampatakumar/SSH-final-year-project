/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 37: STUDENT WORKFLOW INTEGRATION & SYNCHRONIZATION
 * ============================================================================
 *
 * Targeted regression testing covering the five Phase 37 features:
 * 1. Feature A: GitHub Analysis to Skill Profile Auto-Sync & Manual Re-Sync
 * 2. Feature B: Persistent Learning Roadmap Milestones in LearningActivityRecord
 * 3. Feature C: Personalized, Persistent Daily Missions & Toggle Endpoint
 * 4. Feature D: Onboarding Branding & Initial Skill Profile Evaluation Seed
 * 5. Feature E: Coding Assessment Multi-Language Selector & Execution Safeguard
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

import { app } from "../src/app.js";
import { User } from "../src/core/database/models/user.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import { getAllTasks, getPublicTask, getRawTask } from "../src/modules/coding/services/taskCatalog.service.js";
import { validateLanguage } from "../src/modules/coding/controllers/coding.controller.js";
import { dashboardIntelligenceService } from "../src/services/dashboard-intelligence.service.js";

describe("Phase 37: Student Workflow Integration & Cross-Module Synchronization", () => {
  const studentAId = new mongoose.Types.ObjectId("65a000000000000000000001");
  const studentBId = new mongoose.Types.ObjectId("65b000000000000000000002");

  const studentA = {
    _id: studentAId,
    firebaseUid: "student_A_uid",
    email: "student_a@example.com",
    displayName: "Student Alpha",
    targetRole: "Full Stack Developer",
    skillLanguages: ["JavaScript", "Python"],
    skillFrameworks: ["React", "Express.js"],
    skillTools: ["Git"],
    skillLibraries: [],
  };

  const studentB = {
    _id: studentBId,
    firebaseUid: "student_B_uid",
    email: "student_b@example.com",
    displayName: "Student Beta",
    targetRole: "DevOps Engineer",
    skillLanguages: ["Python"],
    skillFrameworks: [],
    skillTools: ["Docker"],
    skillLibraries: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. FEATURE A: GitHub Analysis to Skill Profile Synchronization
  // ==========================================================================
  describe("Feature A: GitHub Analysis to Skill Profile Synchronization", () => {
    it("A1: Manual skill sync rejects unauthenticated requests with 401", async () => {
      const res = await request(app).post("/api/v1/github/sync-skills");
      expect(res.status).toBe(401);
    });

    it("A2: Returns 404 when student has no saved GitHub analysis to sync", async () => {
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockResolvedValue(null),
      });

      // Simulating authenticated request by mocking auth middleware or route logic
      const { syncGitHubSkills } = await import("../src/modules/github/controllers/github.controller.js");
      const req = { user: studentA };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await syncGitHubSkills(req, res, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
      expect(err.message).toContain("No analyzed GitHub profile found");
    });

    it("A3: Successfully synchronizes latest GitHub evidence into SkillProfile", async () => {
      const mockAnalysis = {
        owner: studentAId,
        githubUsername: "testdev",
        languages: { JavaScript: { percentage: 80 }, Python: { percentage: 20 } },
        repositories: [{ name: "my-web-app", language: "JavaScript" }],
        updatedAt: new Date(),
      };

      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockAnalysis),
      });

      const skillProfileService = await import("../src/modules/skills/services/skillProfile.service.js");
      vi.spyOn(skillProfileService, "evaluateUserProfile").mockResolvedValue({
        profile: {
          skills: [
            { skill: "JavaScript", score: 75, status: "Proficient" },
            { skill: "Python", score: 60, status: "Competent" },
          ],
          overallReadinessScore: 78,
          lastEvaluatedAt: new Date(),
        },
      });

      const { syncGitHubSkills } = await import("../src/modules/github/controllers/github.controller.js");
      const req = { user: studentA };
      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await syncGitHubSkills(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.synced).toBe(true);
      expect(responsePayload.data.skillsCount).toBe(2);
      expect(responsePayload.data.overallReadinessScore).toBe(78);
    });

    it("A4: Handles missing repository evidence gracefully without inventing fake proficiency", async () => {
      const emptyAnalysis = {
        owner: studentAId,
        githubUsername: "emptydev",
        languages: {},
        repositories: [],
        updatedAt: new Date(),
      };

      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockResolvedValue(emptyAnalysis),
      });

      const skillProfileService = await import("../src/modules/skills/services/skillProfile.service.js");
      vi.spyOn(skillProfileService, "evaluateUserProfile").mockResolvedValue({
        profile: {
          skills: [],
          overallReadinessScore: 0,
          lastEvaluatedAt: new Date(),
        },
      });

      const { syncGitHubSkills } = await import("../src/modules/github/controllers/github.controller.js");
      const req = { user: studentA };
      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await syncGitHubSkills(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.synced).toBe(true);
      expect(responsePayload.data.skillsCount).toBe(0);
      expect(responsePayload.data.overallReadinessScore).toBe(0);
    });

    it("A5: Enforces student isolation — Student B cannot sync Student A's GitHub analysis", async () => {
      // Find query includes { owner: req.user._id }
      const findSpy = vi.spyOn(GitHubAnalysis, "findOne").mockImplementation((query) => {
        if (String(query.owner) === String(studentBId)) {
          return { sort: vi.fn().mockResolvedValue(null) };
        }
        return {
          sort: vi.fn().mockResolvedValue({
            owner: studentAId,
            githubUsername: "studentA",
          }),
        };
      });

      const { syncGitHubSkills } = await import("../src/modules/github/controllers/github.controller.js");
      const req = { user: studentB }; // Student B making request
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      await syncGitHubSkills(req, res, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(404);
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({ owner: studentBId }));
    });
  });

  // ==========================================================================
  // 2. FEATURE B: Persistent Learning Roadmap Milestones
  // ==========================================================================
  describe("Feature B: Persistent Learning Roadmap Milestones", () => {
    it("B1: Roadmap update endpoint rejects unauthenticated access with 401", async () => {
      const res = await request(app)
        .patch("/api/v1/recommendations/item/rec_docker_1")
        .send({ status: "completed" });
      expect(res.status).toBe(401);
    });

    it("B2: Validates recommendation ID and permitted status transitions", async () => {
      const { updateRecommendationStatus } = await import(
        "../src/modules/recommendations/controllers/recommendations.controller.js"
      );

      // Empty recommendation ID
      const reqEmpty = { user: studentA, params: { recommendationId: "   " }, body: { status: "completed" } };
      const nextEmpty = vi.fn();
      await updateRecommendationStatus(reqEmpty, {}, nextEmpty);
      expect(nextEmpty.mock.calls[0][0].statusCode).toBe(400);

      // Invalid status transition
      const reqBadStatus = {
        user: studentA,
        params: { recommendationId: "rec_1" },
        body: { status: "invalid_status" },
      };
      const nextBadStatus = vi.fn();
      await updateRecommendationStatus(reqBadStatus, {}, nextBadStatus);
      expect(nextBadStatus.mock.calls[0][0].statusCode).toBe(400);
      expect(nextBadStatus.mock.calls[0][0].message).toContain("Invalid status");
    });

    it("B3: Persists milestone completion in LearningActivityRecord using idempotencyKey", async () => {
      const { updateRecommendationStatus } = await import(
        "../src/modules/recommendations/controllers/recommendations.controller.js"
      );

      const findOneAndUpdateSpy = vi.spyOn(LearningActivityRecord, "findOneAndUpdate").mockResolvedValue({
        owner: studentAId,
        activityType: "roadmap_milestone",
        entityId: "rec_docker_1",
        status: "completed",
        updatedAt: new Date(),
      });

      const req = {
        user: studentA,
        params: { recommendationId: "rec_docker_1" },
        body: { status: "completed", skill: "Docker", canonicalName: "Docker" },
      };

      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await updateRecommendationStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.isCompleted).toBe(true);
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: studentAId,
          activityType: "roadmap_milestone",
          entityId: "rec_docker_1",
        }),
        expect.objectContaining({
          $set: expect.objectContaining({
            status: "completed",
            skill: "Docker",
          }),
          $setOnInsert: expect.objectContaining({
            idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
          }),
        }),
        expect.any(Object)
      );
    });

    it("B4: Removes or unmarks milestone when status is set to pending", async () => {
      const { updateRecommendationStatus } = await import(
        "../src/modules/recommendations/controllers/recommendations.controller.js"
      );

      const deleteOneSpy = vi.spyOn(LearningActivityRecord, "deleteOne").mockResolvedValue({ deletedCount: 1 });

      const req = {
        user: studentA,
        params: { recommendationId: "rec_docker_1" },
        body: { status: "pending" },
      };

      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await updateRecommendationStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.isCompleted).toBe(false);
      expect(deleteOneSpy).toHaveBeenCalledWith({
        owner: studentAId,
        activityType: "roadmap_milestone",
        entityId: "rec_docker_1",
      });
    });

    it("B5: getRecommendations reloads persisted milestone completion and computes progress count", async () => {
      const { getRecommendations } = await import(
        "../src/modules/recommendations/controllers/recommendations.controller.js"
      );
      const recService = await import(
        "../src/modules/recommendations/services/recommendation.service.js"
      );

      vi.spyOn(recService, "generateUserRecommendations").mockResolvedValue({
        targetRole: "Full Stack Developer",
        recommendations: [
          { recommendationId: "rec_docker_1", skill: "Docker", canonicalName: "Docker", priority: "Critical" },
          { recommendationId: "rec_react_2", skill: "React", canonicalName: "React", priority: "High" },
        ],
      });

      // Mock student A has Docker completed
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { entityId: "rec_docker_1", skill: "Docker", canonicalName: "Docker", status: "completed" },
          ]),
        }),
      });

      const req = { user: studentA, query: {} };
      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await getRecommendations(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.completedCount).toBe(1);
      expect(responsePayload.data.totalCount).toBe(2);
      expect(responsePayload.data.recommendations[0].isCompleted).toBe(true);
      expect(responsePayload.data.recommendations[1].isCompleted).toBe(false);
    });
  });

  // ==========================================================================
  // 3. FEATURE C: Personalized, Persistent Daily Missions
  // ==========================================================================
  describe("Feature C: Personalized, Persistent Daily Missions", () => {
    it("C1: Daily mission toggle endpoint rejects unauthenticated access with 401", async () => {
      const res = await request(app)
        .post("/api/v1/dashboard/missions/mission_1_concept/toggle")
        .send({ completed: true });
      expect(res.status).toBe(401);
    });

    it("C2: Persists mission completion for authenticated student with today idempotencyKey", async () => {
      const { toggleDailyMissionController } = await import(
        "../src/controllers/dashboard.controller.js"
      );

      const findOneAndUpdateSpy = vi.spyOn(LearningActivityRecord, "findOneAndUpdate").mockResolvedValue({
        owner: studentAId,
        activityType: "daily_mission",
        entityId: "mission_1_concept",
        status: "completed",
        updatedAt: new Date(),
      });

      vi.spyOn(LearningActivityRecord, "findOne").mockResolvedValue(null);

      const req = {
        user: studentA,
        params: { id: "mission_1_concept" },
        body: { title: "Study Docker Container Architecture", targetSkill: "Docker", completed: true },
      };

      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await toggleDailyMissionController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.completed).toBe(true);
      expect(responsePayload.data.missionId).toBe("mission_1_concept");

      const todayStr = new Date().toISOString().split("T")[0];
      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: studentAId,
          activityType: "daily_mission",
          entityId: "mission_1_concept",
        }),
        expect.objectContaining({
          $setOnInsert: expect.objectContaining({
            idempotencyKey: `mission_${studentAId}_${todayStr}_mission_1_concept`,
          }),
        }),
        expect.any(Object)
      );
    });

    it("C3: Successfully toggles an existing completed mission back to incomplete", async () => {
      const { toggleDailyMissionController } = await import(
        "../src/controllers/dashboard.controller.js"
      );

      vi.spyOn(LearningActivityRecord, "findOne").mockResolvedValue({
        owner: studentAId,
        activityType: "daily_mission",
        entityId: "mission_1_concept",
      });

      const deleteOneSpy = vi.spyOn(LearningActivityRecord, "deleteOne").mockResolvedValue({ deletedCount: 1 });

      const req = {
        user: studentA,
        params: { id: "mission_1_concept" },
        body: { completed: false },
      };

      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await toggleDailyMissionController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(responsePayload.data.completed).toBe(false);
      expect(deleteOneSpy).toHaveBeenCalled();
    });

    it("C4: Distinguishes personalized missions from fallback missions in intelligence report", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(studentA),
      });

      // Student has an active skill gap for Docker
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: studentAId,
          targetRole: "Full Stack Developer",
          skills: [{ skill: "JavaScript", score: 60 }],
          skillGaps: [{ skill: "Docker", priority: "Critical", status: "Missing" }],
          recommendations: [{ skill: "Docker" }],
        }),
      });

      const { CodingSubmission } = await import("../src/modules/coding/models/codingSubmission.models.js");
      const { LearnerSkillAssessmentHistory } = await import("../src/modules/skills/models/learnerSkillAssessmentHistory.models.js");
      const { SpacedRevisionSchedule } = await import("../src/modules/skills/models/spacedRevisionSchedule.models.js");
      const { EduTubeWatchHistory, EduTubeProgress } = await import("../src/modules/edutube/models/index.js");

      vi.spyOn(CodingSubmission, "find").mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }) });
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }) });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockReturnValue({
            catch: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await dashboardIntelligenceService.getDashboardIntelligence(studentAId);
      expect(result.dailyLearningPlan).toBeDefined();
      expect(result.dailyLearningPlan.length).toBe(3);

      const conceptMission = result.dailyLearningPlan[0];
      expect(conceptMission.isPersonalized).toBe(true);
      expect(conceptMission.targetSkill).toBe("Docker");
      expect(conceptMission.completed).toBe(false);
    });
  });

  // ==========================================================================
  // 4. FEATURE D: Onboarding to Initial Skill Evaluation
  // ==========================================================================
  describe("Feature D: Onboarding to Initial Skill Evaluation", () => {
    it("D1: Seeds initial skill evaluation when student completes onboarding", async () => {
      const mockUser = {
        ...studentA,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

      const skillProfileService = await import("../src/modules/skills/services/skillProfile.service.js");
      const evalSpy = vi.spyOn(skillProfileService, "evaluateUserProfile").mockResolvedValue({
        profile: {
          skills: [{ skill: "React", score: 65 }],
          overallReadinessScore: 65,
        },
      });

      const { updateCurrentUser } = await import("../src/controllers/auth.controller.js");
      const req = {
        user: mockUser,
        body: {
          onboardingCompleted: true,
          targetRole: "Full Stack Developer",
        },
      };

      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await updateCurrentUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.save).toHaveBeenCalled();
      expect(evalSpy).toHaveBeenCalledWith(mockUser);
      expect(responsePayload.data.initialEvaluation.evaluated).toBe(true);
    });

    it("D2: Non-blocking resilience — Evaluation error does not break successful profile persistence", async () => {
      const mockUser = {
        ...studentA,
        save: vi.fn().mockResolvedValue(true),
      };

      const skillProfileService = await import("../src/modules/skills/services/skillProfile.service.js");
      vi.spyOn(skillProfileService, "evaluateUserProfile").mockRejectedValue(
        new Error("External AI Provider Unavailable")
      );

      const { updateCurrentUser } = await import("../src/controllers/auth.controller.js");
      const req = {
        user: mockUser,
        body: {
          onboardingCompleted: true,
        },
      };

      let responsePayload = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((data) => {
          responsePayload = data;
        }),
      };
      const next = vi.fn();

      await updateCurrentUser(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockUser.save).toHaveBeenCalled();
      expect(responsePayload.data.user).toBeDefined();
      expect(responsePayload.data.initialEvaluation).toBeNull();
    });
  });

  // ==========================================================================
  // 5. FEATURE E: Coding Assessment Language Selector & Sandbox Safeguard
  // ==========================================================================
  describe("Feature E: Coding Assessment Language Selector & Sandbox Safeguard", () => {
    it("E1: Rejects unsupported programming languages with 400 error", () => {
      expect(() => validateLanguage("ruby")).toThrow();
      expect(() => validateLanguage("csharp")).toThrow();
      expect(() => validateLanguage("php")).toThrow();

      expect(validateLanguage("javascript")).toBe("javascript");
      expect(validateLanguage("python")).toBe("python");
      expect(validateLanguage("typescript")).toBe("typescript");
    });

    it("E2: Serves valid task catalogs for JavaScript, Python, and TypeScript", () => {
      const jsTasks = getAllTasks("javascript");
      const pyTasks = getAllTasks("python");
      const tsTasks = getAllTasks("typescript");

      expect(jsTasks.length).toBeGreaterThanOrEqual(4);
      expect(pyTasks.length).toBeGreaterThanOrEqual(4);
      expect(tsTasks.length).toBeGreaterThanOrEqual(4);

      // Verify Python specific two-sum starter template
      const pyTwoSum = getPublicTask("two-sum", "python");
      expect(pyTwoSum).toBeDefined();
      expect(pyTwoSum.language).toBe("python");
      expect(pyTwoSum.functionName).toBe("two_sum");
      expect(pyTwoSum.starterCode).toContain("def two_sum");

      // Verify TypeScript specific two-sum starter template
      const tsTwoSum = getPublicTask("two-sum", "typescript");
      expect(tsTwoSum).toBeDefined();
      expect(tsTwoSum.language).toBe("typescript");
      expect(tsTwoSum.functionName).toBe("twoSum");
      expect(tsTwoSum.starterCode).toContain("export function twoSum(nums: number[], target: number): number[]");
    });

    it("E3: Enforces staging execution safeguard without penalizing student score", async () => {
      const { runCodeSample, submitSolution } = await import(
        "../src/modules/coding/controllers/coding.controller.js"
      );

      // Set staging safeguard flag
      const originalFlag = process.env.CODING_EXECUTION_ENABLED;
      process.env.CODING_EXECUTION_ENABLED = "false";

      try {
        const req = {
          body: {
            taskId: "two-sum",
            code: "def two_sum(nums, target):\n    return [0, 1]",
            language: "python",
          },
        };

        let responsePayload = null;
        const res = {
          status: vi.fn().mockReturnThis(),
          json: vi.fn((data) => {
            responsePayload = data;
          }),
        };
        const next = vi.fn();

        await runCodeSample(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(responsePayload.data.status).toBe("system_error");
        expect(responsePayload.data.error).toMatch(/disabled in this staging deployment|Execution sandbox for python is not enabled/);
        expect(responsePayload.data.taskResults.results.length).toBe(0);
      } finally {
        process.env.CODING_EXECUTION_ENABLED = originalFlag;
      }
    });

    it("E4: Unsupported language in runCodeSample returns 400 error", async () => {
      const { runCodeSample } = await import(
        "../src/modules/coding/controllers/coding.controller.js"
      );

      const req = {
        body: {
          code: "puts 'hello'",
          language: "ruby",
        },
      };
      const next = vi.fn();

      await runCodeSample(req, {}, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(400);
      expect(err.message).toContain("Language 'ruby' is not supported");
    });
  });
});
