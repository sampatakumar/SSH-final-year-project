import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../src/app.js";
import { SpacedRevisionSchedule } from "../src/modules/skills/models/spacedRevisionSchedule.models.js";
import { EduTubeVideoCheckpoint } from "../src/modules/edutube/models/edutubeVideoCheckpoint.models.js";
import { EduTubeCheckpointAttempt } from "../src/modules/edutube/models/edutubeCheckpointAttempt.models.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { spacedRevisionService } from "../src/modules/skills/services/spacedRevision.service.js";
import { edutubeCheckpointService } from "../src/modules/edutube/services/edutube-checkpoint.service.js";

describe("Phase 39: Adaptive Spaced Revision Engine & Interactive EduTube Video Quizzes Suite", () => {
  const studentAId = new mongoose.Types.ObjectId("65b1f9e2a1b2c3d4e5f6a111");
  const studentBId = new mongoose.Types.ObjectId("65b1f9e2a1b2c3d4e5f6a222");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(EduTubeVideoCheckpoint, "findOne").mockReturnValue({
      lean: vi.fn().mockReturnValue({ catch: vi.fn().mockResolvedValue(null) }),
    });
    vi.spyOn(EduTubeCheckpointAttempt, "findOne").mockReturnValue({
      lean: vi.fn().mockReturnValue({ catch: vi.fn().mockResolvedValue(null) }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Feature A & B: Adaptive Spaced Revision Scheduling Policy", () => {
    it("1. Creates a valid revision target with initial Stage 1 interval", async () => {
      const mockSchedule = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        skill: "Docker",
        canonicalName: "Docker",
        targetId: "target_docker",
        stage: 1,
        intervalDays: 1,
        scheduledDate: new Date(),
        status: "pending",
        attemptsCount: 1,
        consecutiveSuccesses: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SpacedRevisionSchedule, "findOne").mockResolvedValue(null);
      vi.spyOn(SpacedRevisionSchedule, "create").mockResolvedValue(mockSchedule);

      const target = await spacedRevisionService.scheduleOrUpdateTarget(studentAId, {
        skill: "Docker",
        targetId: "target_docker",
        targetConcept: "Docker Architecture",
        promptQuestion: "Recall Docker container vs VM isolation principles.",
        isPassed: true,
        lastScore: 90,
      });

      expect(target).toBeDefined();
      expect(target.skill).toBe("Docker");
      expect(target.intervalDays).toBe(1);
      expect(target.status).toBe("pending");
    });

    it("2. Retrieves due revisions within UTC day boundary", async () => {
      const dueSchedule = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        skill: "React",
        canonicalName: "React",
        scheduledDate: new Date(),
        status: "pending",
        stage: 1,
        intervalDays: 1,
      };

      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([dueSchedule]),
          }),
        }),
      });

      const due = await spacedRevisionService.getDueRevisions(studentAId);
      expect(due.length).toBe(1);
      expect(due[0].isDue).toBe(true);
      expect(due[0].computedStatus).toBe("due");
    });

    it("3. Correct answers extend the interval from Stage 1 (1d) to Stage 2 (3d)", async () => {
      const mockSchedule = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        skill: "TypeScript",
        canonicalName: "TypeScript",
        stage: 1,
        intervalDays: 1,
        scheduledDate: new Date(),
        status: "pending",
        consecutiveSuccesses: 1,
        attemptsCount: 1,
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SpacedRevisionSchedule, "findById").mockResolvedValue(mockSchedule);
      vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({});

      const outcome = await spacedRevisionService.recordRevisionAttempt(studentAId, mockSchedule._id, {
        score: 85,
        answerGiven: "TypeScript generics preserve type safety without any.",
      });

      expect(outcome.passed).toBe(true);
      expect(outcome.newIntervalDays).toBe(3); // Advanced from 1d to 3d
      expect(mockSchedule.stage).toBe(2);
      expect(mockSchedule.consecutiveSuccesses).toBe(2);
      expect(mockSchedule.status).toBe("pending");
      expect(mockSchedule.save).toHaveBeenCalled();
    });

    it("4. Incorrect answers shorten interval to 1 day and set status to needs_reinforcement", async () => {
      const mockSchedule = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        skill: "MongoDB",
        canonicalName: "MongoDB",
        stage: 3,
        intervalDays: 7,
        scheduledDate: new Date(),
        status: "pending",
        consecutiveSuccesses: 3,
        attemptsCount: 3,
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SpacedRevisionSchedule, "findById").mockResolvedValue(mockSchedule);

      const outcome = await spacedRevisionService.recordRevisionAttempt(studentAId, mockSchedule._id, {
        score: 40, // Below 70 threshold
        answerGiven: "Unsure about index B-tree balancing.",
      });

      expect(outcome.passed).toBe(false);
      expect(outcome.newIntervalDays).toBe(1); // Reset to 1 day
      expect(mockSchedule.stage).toBe(1);
      expect(mockSchedule.consecutiveSuccesses).toBe(0);
      expect(mockSchedule.status).toBe("needs_reinforcement");
    });

    it("5. Repeated attempt with same idempotency key returns cached outcome without duplicate writes", async () => {
      const existingHistoryEntry = {
        idempotencyKey: "test_idem_key_123",
        score: 95,
        passed: true,
        reviewedAt: new Date(),
      };

      const mockSchedule = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId,
        skill: "Node.js",
        canonicalName: "Node.js",
        intervalDays: 7,
        scheduledDate: new Date(),
        history: [existingHistoryEntry],
        save: vi.fn(),
      };

      vi.spyOn(SpacedRevisionSchedule, "findById").mockResolvedValue(mockSchedule);

      const result = await spacedRevisionService.recordRevisionAttempt(studentAId, mockSchedule._id, {
        score: 95,
        idempotencyKey: "test_idem_key_123",
      });

      expect(result.isDuplicate).toBe(true);
      expect(mockSchedule.save).not.toHaveBeenCalled();
    });

    it("6. Student isolation: Student B cannot review Student A's revision schedule (403)", async () => {
      const mockSchedule = {
        _id: new mongoose.Types.ObjectId(),
        owner: studentAId, // Belongs to Student A
        skill: "Docker",
        canonicalName: "Docker",
      };

      vi.spyOn(SpacedRevisionSchedule, "findById").mockResolvedValue(mockSchedule);

      await expect(
        spacedRevisionService.recordRevisionAttempt(studentBId, mockSchedule._id, {
          score: 80,
        })
      ).rejects.toThrow(/Access forbidden/i);
    });
  });

  describe("Feature C & D: Interactive EduTube Video Checkpoints & Server-Side Security", () => {
    it("7. getCheckpointsForVideo strips correctOptionIndex from questions to prevent cheating", async () => {
      vi.spyOn(EduTubeVideoCheckpoint, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });

      const checkpoints = await edutubeCheckpointService.getCheckpointsForVideo(studentAId, "gAkwW2tuIqE");
      expect(checkpoints.length).toBeGreaterThan(0);

      // Verify correctOptionIndex is NOT present on any returned checkpoint
      for (const cp of checkpoints) {
        expect(cp).not.toHaveProperty("correctOptionIndex");
        expect(cp.question).toBeDefined();
        expect(Array.isArray(cp.options)).toBe(true);
      }
    });

    it("8. submitCheckpointAnswer correctly validates correct answer and schedules spaced revision", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      vi.spyOn(EduTubeCheckpointAttempt, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        isCorrect: true,
      });
      vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({});
      vi.spyOn(SpacedRevisionSchedule, "findOne").mockResolvedValue(null);
      vi.spyOn(SpacedRevisionSchedule, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        scheduledDate: new Date(),
        status: "pending",
      });

      const res = await edutubeCheckpointService.submitCheckpointAnswer(
        studentAId,
        "gAkwW2tuIqE",
        "cp_docker_arch_01",
        { selectedOptionIndex: 0 } // Correct option
      );

      expect(res.isCorrect).toBe(true);
      expect(res.score).toBe(100);
      expect(res.correctOptionIndex).toBe(0);
      expect(res.explanation).toContain("Docker containers virtualize the operating system");
    });

    it("9. submitCheckpointAnswer validates incorrect answer and marks reinforcement", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      vi.spyOn(EduTubeCheckpointAttempt, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        isCorrect: false,
      });
      vi.spyOn(LearningActivityRecord, "create").mockResolvedValue({});
      vi.spyOn(SpacedRevisionSchedule, "findOne").mockResolvedValue(null);
      vi.spyOn(SpacedRevisionSchedule, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        status: "needs_reinforcement",
      });

      const res = await edutubeCheckpointService.submitCheckpointAnswer(
        studentAId,
        "gAkwW2tuIqE",
        "cp_docker_arch_01",
        { selectedOptionIndex: 2 } // Incorrect option
      );

      expect(res.isCorrect).toBe(false);
      expect(res.score).toBe(0);
      expect(res.correctOptionIndex).toBe(0);
    });

    it("10. Rejects invalid selectedOptionIndex with 400 error", async () => {
      await expect(
        edutubeCheckpointService.submitCheckpointAnswer(studentAId, "gAkwW2tuIqE", "cp_docker_arch_01", {
          selectedOptionIndex: 99, // Exceeds 4 options
        })
      ).rejects.toThrow(/exceeds available options/i);
    });

    it("11. Idempotency: repeated checkpoint submission with same idempotencyKey returns existing result", async () => {
      vi.spyOn(EduTubeCheckpointAttempt, "findOne").mockReturnValue({
        lean: vi.fn().mockReturnValue({
          catch: vi.fn().mockResolvedValue({
            isCorrect: true,
            score: 100,
            idempotencyKey: "cp_idem_key_456",
          }),
        }),
      });

      const res = await edutubeCheckpointService.submitCheckpointAnswer(
        studentAId,
        "gAkwW2tuIqE",
        "cp_docker_arch_01",
        { selectedOptionIndex: 0, idempotencyKey: "cp_idem_key_456" }
      );

      expect(res.isDuplicate).toBe(true);
      expect(res.isCorrect).toBe(true);
    });

    it("12. Quiz checkpoint completion does NOT award demonstrated competency (isDemonstratedCompetency remains false)", async () => {
      let createdActivity = null;
      vi.spyOn(LearningActivityRecord, "create").mockImplementation(async (doc) => {
        createdActivity = doc;
        return doc;
      });
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const { learningOutcomeTrackerService } = await import(
        "../src/modules/skills/services/learningOutcomeTracker.service.js"
      );

      await learningOutcomeTrackerService.recordActivity(studentAId, {
        activityType: "quiz_checkpoint",
        skill: "Docker",
        evidence: { score: 100, evidenceSource: "edutube" },
      });

      expect(createdActivity).toBeDefined();
      expect(createdActivity.activityType).toBe("quiz_checkpoint");
      // Critical assertion: Only sandbox coding test passes award demonstrated competency
      expect(createdActivity.isDemonstratedCompetency).toBe(false);
    });
  });

  describe("Feature E & F: Telemetry Integration & HTTP Endpoint Protection", () => {
    it("13. GET /api/v1/skills/spaced-revision/due rejects unauthenticated requests with 401", async () => {
      const res = await request(app).get("/api/v1/skills/spaced-revision/due");
      expect(res.status).toBe(401);
    });

    it("14. POST /api/v1/skills/spaced-revision/:id/review rejects unauthenticated requests with 401", async () => {
      const res = await request(app)
        .post(`/api/v1/skills/spaced-revision/${new mongoose.Types.ObjectId()}/review`)
        .send({ score: 100 });
      expect(res.status).toBe(401);
    });

    it("15. POST /api/v1/edutube/video/:videoId/checkpoints/:checkpointId/submit rejects unauthenticated calls with 401", async () => {
      const res = await request(app)
        .post("/api/v1/edutube/video/gAkwW2tuIqE/checkpoints/cp_docker_arch_01/submit")
        .send({ selectedOptionIndex: 0 });
      expect(res.status).toBe(401);
    });
  });
});
