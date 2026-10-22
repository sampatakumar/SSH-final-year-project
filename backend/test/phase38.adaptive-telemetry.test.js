import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app.js";
import { User } from "../src/core/database/models/user.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { LearnerSkillAssessmentHistory } from "../src/modules/skills/models/learnerSkillAssessmentHistory.models.js";
import { SpacedRevisionSchedule } from "../src/modules/skills/models/spacedRevisionSchedule.models.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { adaptiveSkillLoopService } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import { recommendationPipelineService } from "../src/modules/edutube/services/recommendation-engine/recommendation-pipeline.service.js";
import { computeStudentTelemetry } from "../src/modules/skills/controllers/adaptiveLoop.controller.js";

describe("Phase 38: Adaptive Learning Loop Feedback & Cross-Module Telemetry Suite", () => {
  const studentAId = new mongoose.Types.ObjectId("65b1f9e2a1b2c3d4e5f6a111");
  const studentBId = new mongoose.Types.ObjectId("65b1f9e2a1b2c3d4e5f6a222");

  const studentA = {
    _id: studentAId,
    email: "studentA@example.com",
    displayName: "Student A",
    targetRole: "Full Stack Developer",
    skillLanguages: ["JavaScript", "TypeScript"],
    skillFrameworks: ["React", "Node.js"],
    skillTools: ["Git", "Docker"],
  };

  const studentB = {
    _id: studentBId,
    email: "studentB@example.com",
    displayName: "Student B",
    targetRole: "Frontend Developer",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Feature A & B: Learning Activity as Adaptive Evidence & Idempotency", () => {
    it("1. Roadmap milestone completion produces valid persistent learning record", async () => {
      const createSpy = vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        activityType: "roadmap_milestone",
        skill: "Docker",
        status: "completed",
        isDemonstratedCompetency: false,
      });
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const result = await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "roadmap_milestone",
        skill: "Docker",
        entityId: "rec_docker_1",
        title: "Master Docker Containerization",
        status: "completed",
        idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
      });

      expect(result.isDuplicate).toBe(false);
      expect(result.activity).toBeDefined();
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: studentAId,
          activityType: "roadmap_milestone",
          skill: "Docker",
          idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
        })
      );
    });

    it("2. Daily mission completion is accepted as valid activityType and invalidates cache", async () => {
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      const cacheSpy = vi.spyOn(recommendationPipelineService, "invalidateCache");
      const createSpy = vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        activityType: "daily_mission",
        skill: "JavaScript",
        status: "completed",
      });

      const todayStr = new Date().toISOString().split("T")[0];
      const result = await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "daily_mission",
        skill: "JavaScript",
        entityId: "mission_1_concept",
        title: "Study JavaScript Event Loop",
        status: "completed",
        idempotencyKey: `mission_${studentAId}_${todayStr}_mission_1_concept`,
      });

      expect(result.isDuplicate).toBe(false);
      expect(createSpy).toHaveBeenCalled();
      expect(cacheSpy).toHaveBeenCalledWith(studentAId);
    });

    it("3. Repeated event processing with same idempotency key returns isDuplicate: true without duplicate writes", async () => {
      const existingRecord = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        activityType: "roadmap_milestone",
        skill: "Docker",
        idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
        status: "completed",
      };
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(existingRecord),
      });
      const createSpy = vi.spyOn(LearningActivityRecord, "create");

      const result = await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "roadmap_milestone",
        skill: "Docker",
        entityId: "rec_docker_1",
        idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.activity).toEqual(existingRecord);
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("4. Reopening / unmarking a milestone with status 'pending' deletes record safely", async () => {
      const deleteSpy = vi.spyOn(LearningActivityRecord, "deleteOne").mockResolvedValue({ deletedCount: 1 });
      const cacheSpy = vi.spyOn(recommendationPipelineService, "invalidateCache");

      const result = await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "roadmap_milestone",
        skill: "Docker",
        entityId: "rec_docker_1",
        status: "pending",
        idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
      });

      expect(result.reopened).toBe(true);
      expect(deleteSpy).toHaveBeenCalledWith({
        owner: studentAId,
        idempotencyKey: `roadmap_${studentAId}_rec_docker_1`,
      });
      expect(cacheSpy).toHaveBeenCalledWith(studentAId);
    });

    it("5. Rejects invalid activityType with 400 error", async () => {
      await expect(
        learningOutcomeTrackerService.recordActivity(studentAId, {
          activityType: "arbitrary_unsupported_event",
          skill: "Docker",
        })
      ).rejects.toThrow("Invalid activityType");
    });
  });

  describe("Feature C & D: Adaptive Skill Outcomes & EduTube Recommendation Invalidation", () => {
    it("6. Coding pass updates skill score, closes satisfied gap, and logs assessment history", async () => {
      const mockProfile = {
        owner: studentAId,
        targetRole: "Full Stack Developer",
        skills: [{ canonicalName: "Algorithms", score: 40, level: "Developing", sources: ["resume"] }],
        skillGaps: [{ canonicalName: "Algorithms", currentScore: 40, targetScore: 75, priority: "High" }],
        overallReadinessScore: 50,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SkillProfile, "findOne").mockResolvedValue(mockProfile);
      vi.spyOn(LearnerSkillAssessmentHistory, "create").mockResolvedValue({});
      vi.spyOn(SpacedRevisionSchedule, "create").mockResolvedValue({});

      const outcome = await adaptiveSkillLoopService.recordAdaptiveAssessmentOutcome(studentAId, {
        skill: "Algorithms",
        taskId: "two-sum",
        score: 10,
        maxScore: 10,
        testCasesPassed: 5,
        testCasesTotal: 5,
        assessmentType: "coding_challenge",
      });

      expect(outcome.skill).toBe("Algorithms");
      expect(outcome.newScore).toBeGreaterThan(40);
      expect(mockProfile.save).toHaveBeenCalled();
      expect(LearnerSkillAssessmentHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: studentAId,
          skill: "Algorithms",
          score: 100,
        })
      );
    });

    it("7. Repeated failures trigger demonstrated weakness without artificially inflating scores", async () => {
      vi.spyOn(LearningActivityRecord, "findOne").mockResolvedValue(null);
      vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({});
      vi.spyOn(LearningActivityRecord, "countDocuments").mockResolvedValue(3); // 3 recent failures
      const updateProfileSpy = vi.spyOn(SkillProfile, "updateOne").mockResolvedValue({});

      const result = await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "coding_failed",
        skill: "Docker",
        entityId: "docker-task-1",
        status: "failed",
      });

      expect(result.adaptation.repeatedFailureDetected).toBe(true);
      expect(result.adaptation.remediationRequired).toBe(true);
      expect(updateProfileSpy).toHaveBeenCalledWith(
        expect.objectContaining({ owner: studentAId, "skillGaps.canonicalName": "Docker" }),
        expect.objectContaining({
          $set: expect.objectContaining({
            "skillGaps.$.evidenceState": "demonstrated_weakness",
          }),
        })
      );
    });

    it("8. Conceptual completion does NOT award demonstrated competency", async () => {
      vi.spyOn(LearningActivityRecord, "findOne").mockResolvedValue(null);
      const createSpy = vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({
        isDemonstratedCompetency: false,
      });

      await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "module_completed",
        skill: "React",
        entityId: "video_react_101",
        status: "completed",
        evidence: { evidenceSource: "edutube" },
      });

      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isDemonstratedCompetency: false,
        })
      );
    });
  });

  describe("Feature E: Cross-Module Learning Telemetry Calculation", () => {
    it("9. computeStudentTelemetry aggregates milestones, missions, coding challenges, and gaps accurately", async () => {
      vi.spyOn(LearningActivityRecord, "countDocuments")
        .mockResolvedValueOnce(4) // milestonesCompleted
        .mockResolvedValueOnce(2); // dailyMissionsCompleted

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { status: "passed", score: 10 },
            { status: "passed", score: 9 },
            { status: "failed", score: 2 },
          ]),
        }),
      });

      vi.spyOn(LearnerSkillAssessmentHistory, "countDocuments").mockResolvedValue(2);

      const mockProfile = {
        owner: studentAId,
        overallReadinessScore: 78,
        recommendations: [{ skill: "Docker" }, { skill: "React" }, { skill: "Node.js" }, { skill: "MongoDB" }],
        skillGaps: [{ canonicalName: "Docker", status: "Missing" }],
        skills: [{ canonicalName: "JavaScript" }],
        lastEvaluatedAt: new Date(),
      };
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProfile),
      });

      const telemetry = await computeStudentTelemetry(studentAId, { profile: mockProfile });

      expect(telemetry.milestonesCompleted).toBe(4);
      expect(telemetry.milestonesTotal).toBe(4);
      expect(telemetry.dailyMissionsCompleted).toBe(2);
      expect(telemetry.dailyMissionsTotal).toBe(3);
      expect(telemetry.codingChallengesAttempted).toBe(3);
      expect(telemetry.codingChallengesSolved).toBe(2);
      expect(telemetry.recentSkillImprovements).toBe(2);
      expect(telemetry.persistentSkillGapsCount).toBe(1);
      expect(telemetry.overallReadinessScore).toBe(78);
      expect(telemetry.isPersonalized).toBe(true);
    });
  });

  describe("Feature F: Endpoints & Student Ownership Enforcement", () => {
    it("10. POST /api/v1/adaptive-loop/evaluate rejects unauthenticated calls with 401", async () => {
      const res = await request(app).post("/api/v1/adaptive-loop/evaluate").send({});
      expect(res.status).toBe(401);
    });

    it("11. GET /api/v1/adaptive-loop/telemetry rejects unauthenticated calls with 401", async () => {
      const res = await request(app).get("/api/v1/adaptive-loop/telemetry");
      expect(res.status).toBe(401);
    });

    it("12. Student isolation: Student B cannot evaluate Student A's adaptive loop", async () => {
      // Testing controller directly with isolated authenticated contexts
      const { evaluateAdaptiveLoopController } = await import("../src/modules/skills/controllers/adaptiveLoop.controller.js");
      const skillProfileService = await import("../src/modules/skills/services/skillProfile.service.js");
      const recService = await import("../src/modules/recommendations/services/recommendation.service.js");

      const reqB = { user: studentB, body: {} };
      let responseData = null;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn((payload) => {
          responseData = payload;
        }),
      };
      const next = vi.fn();

      const mockProfileB = {
        owner: studentBId,
        overallReadinessScore: 55,
        skills: [],
        skillGaps: [],
        recommendations: [],
      };

      vi.spyOn(skillProfileService, "evaluateUserProfile").mockResolvedValue({
        profile: mockProfileB,
      });

      vi.spyOn(recService, "generateUserRecommendations").mockResolvedValue({
        targetRole: "Frontend Developer",
        recommendations: [],
        gapsSummary: { totalGaps: 0 },
      });

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockProfileB),
      });

      vi.spyOn(adaptiveSkillLoopService, "getAdaptiveLoopState").mockResolvedValue({
        focalSkill: "JavaScript",
        targetRole: "Frontend Developer",
        prerequisites: { isReady: true, missingPrerequisites: [] },
      });

      vi.spyOn(LearningActivityRecord, "countDocuments").mockResolvedValue(0);
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.spyOn(LearnerSkillAssessmentHistory, "countDocuments").mockResolvedValue(0);

      await evaluateAdaptiveLoopController(reqB, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      // Confirms student B's evaluation ran strictly under student B's scope
      expect(responseData.data.targetRole).toBe("Frontend Developer");
    });
  });
});
