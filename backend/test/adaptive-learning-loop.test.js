import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { adaptiveLearningPlanService } from "../src/modules/recommendations/services/adaptiveLearningPlan.service.js";
import { adaptiveSkillLoopService } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import { Project } from "../src/modules/resume/models/project.models.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
} from "../src/modules/edutube/models/index.js";

describe("Phase 16: End-to-End Learning Intelligence & Adaptive Recommendations Suite", () => {
  const userA = new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e101");
  const userB = new mongoose.Types.ObjectId("61d5ec49f1b2c8b1f8e4e102");

  beforeEach(() => {
    vi.clearAllMocks();
    smartMentorContextService.invalidateContext(userA);
    smartMentorContextService.invalidateContext(userB);

    vi.spyOn(User, "findById").mockReturnValue({ lean: () => Promise.resolve(null) });
    vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: () => Promise.resolve(null) });
    vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({ sort: () => ({ lean: () => Promise.resolve(null) }) });
    vi.spyOn(Project, "find").mockReturnValue({ limit: () => ({ lean: () => Promise.resolve([]) }) });
    vi.spyOn(Resume, "find").mockReturnValue({ limit: () => ({ lean: () => Promise.resolve([]) }) });
    vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({ sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }) });
    vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: () => Promise.resolve([]) });
    vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: () => ({ lean: () => Promise.resolve([]) }) });
    vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: () => ({ lean: () => Promise.resolve([]) }) });
    vi.spyOn(CodingSubmission, "find").mockReturnValue({
      limit: () => ({ lean: () => Promise.resolve([]) }),
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
    });
    vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
      sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
    });
    vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
      lean: () => Promise.resolve(null),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. End-to-End Context Integration & Evidence Classification", () => {
    it("gathers comprehensive context and isolates data strictly per user", async () => {
      // Mock SkillProfile for userA
      vi.spyOn(SkillProfile, "findOne").mockImplementation((query) => {
        if (query.owner?.toString() === userA.toString()) {
          return {
            lean: () =>
              Promise.resolve({
                owner: userA,
                targetRole: "Full Stack Developer",
                overallReadinessScore: 78,
                skills: [
                  {
                    skill: "React",
                    canonicalName: "React",
                    score: 82,
                    sources: ["coding", "github"],
                    confidence: 0.9,
                  },
                ],
                skillGaps: [
                  {
                    skill: "Docker",
                    canonicalName: "Docker",
                    priority: "High",
                    currentScore: 20,
                    targetScore: 70,
                    evidenceState: "missing_evidence",
                  },
                ],
              }),
          };
        }
        return { lean: () => Promise.resolve(null) };
      });

      const contextA = await smartMentorContextService.getUnifiedUserContext(userA, { forceRefresh: true });
      expect(contextA.career.targetRole).toBe("Full Stack Developer");
      expect(contextA.career.readinessScore).toBe(78);
      expect(contextA.skills[0].name).toBe("React");
      expect(contextA.skills[0].isDirectEvidence).toBe(true);

      // Verify userB gets their own isolated context
      const contextB = await smartMentorContextService.getUnifiedUserContext(userB, { forceRefresh: true });
      expect(contextB.career.readinessScore).toBe(65); // default fallback when no profile
      expect(contextB.skills.length).toBe(0);
    });

    it("handles missing GitHub data, unconfigured academics, and empty activities gracefully", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: () => Promise.resolve(null) });

      const context = await smartMentorContextService.getUnifiedUserContext(userA, { forceRefresh: true });
      expect(context.github.connected).toBe(false);
      expect(context.github.connectionState).toBe("not_connected");
      expect(context.career.academic.isConfigured).toBe(false);
      expect(context.learning.videosWatched).toBe(0);
      expect(context.coding.totalSubmissions).toBe(0);
      expect(Array.isArray(context.insights)).toBe(true);
    });
  });

  describe("2. Learning Outcome Tracking & Competency Boundaries", () => {
    it("distinguishes educational exposure from demonstrated competency", async () => {
      // 1. Video completion -> isDemonstratedCompetency MUST be FALSE
      const createSpy = vi.spyOn(LearningActivityRecord, "create").mockImplementation(async (doc) => ({
        ...doc,
        _id: new mongoose.Types.ObjectId(),
      }));

      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({ lean: () => Promise.resolve(null) });

      const videoResult = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "module_completed",
        skill: "Docker",
        entityId: "vid_123",
        title: "Docker Tutorial for Beginners",
        evidence: {
          details: "Watched 100% of video",
          evidenceSource: "edutube",
          sandboxVerified: false,
        },
      });

      expect(videoResult.activity.isDemonstratedCompetency).toBe(false);
      expect(videoResult.activity.activityType).toBe("module_completed");

      // 2. Coding challenge passed -> isDemonstratedCompetency MUST be TRUE
      vi.spyOn(adaptiveSkillLoopService, "recordAdaptiveAssessmentOutcome").mockResolvedValue({
        skill: "Docker",
        previousScore: 20,
        newScore: 75,
        scoreDelta: 55,
      });

      const codingResult = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "coding_passed",
        skill: "Docker",
        entityId: "task_docker_1",
        title: "Docker Container Task",
        evidence: {
          score: 10,
          maxScore: 10,
          testCasesPassed: 5,
          testCasesTotal: 5,
          evidenceSource: "coding",
          sandboxVerified: true,
        },
      });

      expect(codingResult.activity.isDemonstratedCompetency).toBe(true);
      expect(codingResult.adaptation.reassessmentApplied).toBe(true);
    });

    it("enforces idempotency and prevents duplicate requests from inflating progress", async () => {
      const mockRecord = {
        _id: new mongoose.Types.ObjectId(),
        owner: userA,
        activityType: "module_completed",
        idempotencyKey: "dup_key_999",
        skill: "React",
        isDemonstratedCompetency: false,
      };

      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: () => Promise.resolve(mockRecord),
      });

      const result = await learningOutcomeTrackerService.recordActivity(userA, {
        activityType: "module_completed",
        skill: "React",
        idempotencyKey: "dup_key_999",
      });

      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain("idempotent duplicate");
    });

    it("rejects unauthorized calls without authenticated user identity", async () => {
      await expect(
        learningOutcomeTrackerService.recordActivity(null, {
          activityType: "coding_passed",
          skill: "Docker",
        })
      ).rejects.toThrow(/Authentication required/i);
    });
  });

  describe("3. Adaptive Learning Plan Engine & Prerequisite Ordering", () => {
    it("ensures missing prerequisites strictly precede dependent skills in recommendation plan", async () => {
      // Mock SkillProfile where user has 0 JavaScript foundation, but Docker and React are needed
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: userA,
            targetRole: "Full Stack Developer",
            skills: [],
            skillGaps: [
              { skill: "React", canonicalName: "React", currentScore: 0, targetScore: 75, priority: "High" },
              { skill: "JavaScript", canonicalName: "JavaScript", currentScore: 0, targetScore: 80, priority: "High" },
            ],
          }),
      });

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(userA, "Full Stack Developer");
      expect(plan.actions.length).toBeGreaterThan(0);

      // In the ordered actions, JavaScript MUST precede React because JS is a prerequisite of React!
      const jsIdx = plan.actions.findIndex((a) => a.skill === "JavaScript");
      const reactIdx = plan.actions.findIndex((a) => a.skill === "React");

      expect(jsIdx).toBeGreaterThanOrEqual(0);
      expect(reactIdx).toBeGreaterThanOrEqual(0);
      expect(jsIdx).toBeLessThan(reactIdx);
    });

    it("detects repeated challenge failures and generates targeted remediation recommendations", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: userA,
            targetRole: "Backend Developer",
            skills: [
              { skill: "JavaScript", canonicalName: "JavaScript", score: 80, confidence: 0.9 },
              { skill: "Asynchronous Programming", canonicalName: "Asynchronous Programming", score: 80, confidence: 0.9 },
              { skill: "Node.js", canonicalName: "Node.js", score: 40, confidence: 0.5 },
            ],
          }),
      });

      // 3 recent failed coding challenges for Node.js
      const failureActivities = [
        { canonicalName: "Node.js", activityType: "coding_failed", isDemonstratedCompetency: false },
        { canonicalName: "Node.js", activityType: "coding_failed", isDemonstratedCompetency: false },
        { canonicalName: "Node.js", activityType: "coding_failed", isDemonstratedCompetency: false },
      ];

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve(failureActivities) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(userA, "Backend Developer");
      const nodeAction = plan.actions.find((a) => a.skill === "Node.js");

      expect(nodeAction).toBeDefined();
      expect(nodeAction.actionType).toBe("targeted_remediation");
      expect(nodeAction.priority).toBe("Critical");
      expect(nodeAction.reasoning).toContain("Repeated challenge difficulty detected");
      expect(nodeAction.completionCriteria).toContain("Pass all hidden unit tests");
    });

    it("does not recommend beginner tasks repeatedly when competency is already demonstrated", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: userA,
            targetRole: "Frontend Developer",
            skills: [
              { skill: "React", canonicalName: "React", score: 85, level: "Proficient", confidence: 0.9 },
            ],
          }),
      });

      // Pass activity recorded
      const passedActivity = [
        { canonicalName: "React", activityType: "coding_passed", isDemonstratedCompetency: true },
      ];

      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve(passedActivity) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => Promise.resolve([{ status: "passed", skillsCovered: ["React"] }]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(userA, "Frontend Developer");
      const reactAction = plan.actions.find((a) => a.skill === "React");

      expect(reactAction.actionType).toBe("demonstrated_competency");
      expect(reactAction.isDemonstratedCompetency).toBe(true);
      expect(reactAction.priority).toBe("Low");
      expect(reactAction.practicalAction).toContain("production project");
    });
  });

  describe("4. Multi-Role Comparison & Security Isolation", () => {
    it("compares multi-role progress without overwriting user active target role", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: () =>
          Promise.resolve({
            owner: userA,
            targetRole: "Full Stack Developer",
            overallReadinessScore: 75,
            skills: [{ skill: "React", score: 80 }, { skill: "Node.js", score: 70 }],
          }),
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
      expect(comparison.roles[0].nextAction).toBeDefined();
    });

    it("blocks unauthorized requests for multi-role comparisons and activities", async () => {
      await expect(adaptiveLearningPlanService.compareMultiRolePlans(null)).rejects.toThrow(
        /Authentication required/i
      );
      await expect(learningOutcomeTrackerService.getLearnerActivities(null)).rejects.toThrow(
        /Authentication required/i
      );
    });
  });

  describe("5. AI Mentor Adaptive Coaching & Remediation", () => {
    const mockGroundedContext = {
      career: {
        name: "Sampat",
        targetRole: "Full Stack Developer",
        targetRoles: ["Frontend Developer", "Backend Developer", "Full Stack Developer"],
        readinessScore: 74,
      },
      skills: [{ name: "JavaScript", level: "Proficient", score: 85 }],
      skillGaps: [
        {
          skill: "Docker",
          priority: "Critical",
          currentScore: 25,
          targetScore: 70,
          evidenceState: "missing_evidence",
        },
      ],
      coding: {
        totalSubmissions: 4,
        passedCount: 2,
      },
      learning: {
        videosWatched: 8,
        completedVideos: 3,
      },
      adaptivePlan: {
        currentObjective: "Master Docker containerization and pass sandbox challenge",
        nextAction: {
          skill: "Docker",
          practicalAction: "Create an isolated Dockerfile and test microservices deployment.",
          priority: "Critical",
        },
      },
    };

    it("answers 'What should I learn next?' referencing top gap and adaptive plan", () => {
      const response = smartMentorLocalService.generateLocalResponse(
        "What should I learn next?",
        mockGroundedContext
      );

      expect(response.intent).toBe("next_skill");
      expect(response.answer).toContain("Docker");
      expect(response.actions.length).toBeGreaterThan(0);
      expect(response.actions[0].title).toContain("Docker");
    });

    it("answers 'Why am I weak in Docker?' with evidence breakdown and prerequisite disclosure", () => {
      const response = smartMentorLocalService.generateLocalResponse(
        "Why am I weak in Docker?",
        mockGroundedContext
      );

      expect(response.intent).toBe("why_skill_weak");
      expect(response.answer).toContain("Evidence Breakdown");
      expect(response.answer).toContain("25/100");
      expect(response.answer).toContain("Lack of Direct Evidence");
    });

    it("answers failed coding challenge queries with targeted remediation and diagnostic strategy", () => {
      const response = smartMentorLocalService.generateLocalResponse(
        "I failed this coding challenge. Teach me the missing concept.",
        mockGroundedContext
      );

      expect(response.intent).toBe("failed_challenge_remediation");
      expect(response.answer).toContain("Targeted Remediation");
      expect(response.answer).toContain("Isolate the Failing Test Cases");
      expect(response.actions.some((a) => a.route === "/dashboard/coding")).toBe(true);
    });

    it("guides student from completed video to sandbox challenge, enforcing competency boundary", () => {
      const response = smartMentorLocalService.generateLocalResponse(
        "I completed this module. What should I practice now?",
        mockGroundedContext
      );

      expect(response.intent).toBe("post_module_practice");
      expect(response.answer).toContain("Competency Boundary");
      expect(response.answer).toContain("Coding Sandbox");
      expect(response.actions.some((a) => a.route === "/dashboard/coding")).toBe(true);
    });

    it("compares frontend vs backend progress without conflating roles", () => {
      const response = smartMentorLocalService.generateLocalResponse(
        "Compare my progress for frontend and backend roles",
        mockGroundedContext
      );

      expect(response.intent).toBe("multi_role_comparison");
      expect(response.answer).toContain("Frontend Developer");
      expect(response.answer).toContain("Backend Developer");
      expect(response.actions.some((a) => a.route === "/dashboard/gaps")).toBe(true);
    });

    it("evaluates roadmap milestone readiness honestly", () => {
      const response = smartMentorLocalService.generateLocalResponse(
        "Am I ready for the next roadmap milestone?",
        mockGroundedContext
      );

      expect(response.intent).toBe("milestone_readiness");
      expect(response.answer).toContain("Roadmap Milestone Readiness");
      expect(response.answer).toContain("74/100");
    });
  });
});
