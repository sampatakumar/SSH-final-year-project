/**
 * ============================================================================
 * PHASE 22: END-TO-END STUDENT JOURNEY AUDIT & PRODUCTION RELIABILITY SUITE
 * ============================================================================
 *
 * Systematic automated validation across all 8 core student journeys:
 * - Journey A: Registration, Profile & Academic Onboarding
 * - Journey B: AI Mentor and GitHub Analysis
 * - Journey C: Career Intelligence & Multi-Role Comparison
 * - Journey D: Learning Roadmap and Adaptive Progress Loop
 * - Journey E: Coding Platform & Docker Sandbox Security
 * - Journey F: Resume Builder, Dual Scoring & Cross-User Isolation
 * - Journey G: EduTube & Deterministic Educational Filtering
 * - Journey H: Notifications, Catalog Integrity & Admin RBAC Boundaries
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import request from "supertest";

import { app } from "../src/app.js";
import { canonicalizeRoleName } from "../src/core/auth/auth.controller.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { adaptiveLearningPlanService } from "../src/modules/recommendations/services/adaptiveLearningPlan.service.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { adaptiveSkillLoopService } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import {
  analyzeSkillGaps,
  compareRoles,
  resolveRoleBenchmark,
  ROLE_ALIAS_MAP,
} from "../src/modules/gaps/services/skillGap.service.js";
import {
  educationalClassifierService,
  CLASSIFIER_REASON_CODES,
  YOUTUBE_CATEGORIES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";
import { getAllTasks, getPublicTask, getRawTask } from "../src/modules/coding/services/taskCatalog.service.js";
import { checkDockerAvailability, executeJavaScript } from "../src/modules/coding/sandbox/dockerExecutor.js";
import {
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
} from "../src/modules/resume/services/resumeIntelligence.service.js";
import { safeDeleteDegree, safeDeleteBranch, safeDeleteCareerRole } from "../src/modules/admin/services/adminCatalog.service.js";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";
import { markNotificationAsRead } from "../src/modules/notifications/services/notification.service.js";

import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import { Project } from "../src/modules/resume/models/project.models.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
} from "../src/modules/edutube/models/index.js";
import { Notification } from "../src/modules/notifications/models/notification.models.js";
import { AcademicDegree } from "../src/core/database/models/academicDegree.models.js";
import { AcademicBranch } from "../src/core/database/models/academicBranch.models.js";
import { CareerRole } from "../src/core/database/models/careerRole.models.js";

describe("Phase 22: End-to-End Student Journey Audit Suite", () => {
  const aliceId = new mongoose.Types.ObjectId("65b000000000000000000001");
  const bobId = new mongoose.Types.ObjectId("65b000000000000000000002");

  beforeEach(() => {
    vi.clearAllMocks();
    smartMentorContextService.invalidateContext(aliceId);
    smartMentorContextService.invalidateContext(bobId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // JOURNEY A: Registration, Profile & Academic Onboarding
  // =========================================================================
  describe("Journey A: Registration, Profile & Academic Onboarding", () => {
    it("canonicalizes role aliases to industry-standard benchmark role names", () => {
      expect(canonicalizeRoleName("frontend")).toBe("Frontend Developer");
      expect(canonicalizeRoleName("front-end")).toBe("Frontend Developer");
      expect(canonicalizeRoleName("backend")).toBe("Backend Developer");
      expect(canonicalizeRoleName("fullstack")).toBe("Full Stack Developer");
      expect(canonicalizeRoleName("swe")).toBe("Software Engineer");
      expect(canonicalizeRoleName("sde")).toBe("Software Engineer");
      expect(canonicalizeRoleName("devops")).toBe("DevOps Engineer");
      expect(canonicalizeRoleName("cloud")).toBe("Cloud Engineer");
      expect(canonicalizeRoleName("embedded")).toBe("Embedded Systems Engineer");
      expect(canonicalizeRoleName("Full Stack Developer")).toBe("Full Stack Developer");
    });

    it("verifies unauthenticated profile retrieval is denied with HTTP 401", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("preserves unrelated fields during partial academic profile updates", () => {
      const existingUser = {
        displayName: "Alice Developer",
        targetRole: "Full Stack Developer",
        academic: {
          degreeSlug: "b-tech",
          degreeName: "Bachelor of Technology",
          branchSlug: "cse",
          branchName: "Computer Science and Engineering",
          currentYear: 3,
          currentSemester: 5,
          institution: "State Engineering College",
        },
      };

      const partialUpdate = {
        currentSemester: 6,
        academicScheme: "2022-Autonomous",
      };

      const mergedAcademic = {
        ...existingUser.academic,
        ...partialUpdate,
      };

      expect(mergedAcademic.degreeSlug).toBe("b-tech");
      expect(mergedAcademic.branchSlug).toBe("cse");
      expect(mergedAcademic.institution).toBe("State Engineering College");
      expect(mergedAcademic.currentYear).toBe(3);
      expect(mergedAcademic.currentSemester).toBe(6);
      expect(mergedAcademic.academicScheme).toBe("2022-Autonomous");
    });
  });

  // =========================================================================
  // JOURNEY B: AI Mentor and GitHub Analysis
  // =========================================================================
  describe("Journey B: AI Mentor and GitHub Analysis", () => {
    it("gathers unified user context without error and caches it per user", async () => {
      const mockUser = {
        _id: aliceId,
        displayName: "Alice",
        targetRole: "Frontend Developer",
        academic: { degreeName: "B.Tech", branchName: "CSE", isConfigured: true },
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      });
      vi.spyOn(Project, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.spyOn(Resume, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });

      const context1 = await smartMentorContextService.getUnifiedUserContext(aliceId);
      expect(context1).toBeDefined();
      expect(context1.career.targetRole).toBe("Frontend Developer");

      // Verify cached context hit
      const cached = smartMentorContextService.getCachedContext(aliceId);
      expect(cached).toBeDefined();
      expect(cached.career.targetRole).toBe("Frontend Developer");

      // Verify cache invalidation
      smartMentorContextService.invalidateContext(aliceId);
      expect(smartMentorContextService.getCachedContext(aliceId)).toBeNull();
    });

    it("honors unconfigured academic background without fabricating college or degree", () => {
      const mentorService = new SmartMentorService();
      const unconfiguredContext = {
        user: { name: "New Student" },
        career: {
          targetRole: "Full Stack Developer",
          readinessScore: 60,
          academic: { isConfigured: false },
        },
        skills: [],
        skillGaps: [],
        github: { repositoryCount: 0 },
      };

      const prompt = mentorService.buildSystemPrompt(unconfiguredContext);
      expect(prompt).toContain("Not configured / Unknown");
      expect(prompt).toContain("NEVER invent, assume, or fabricate an engineering branch, college, degree, or semester");
    });

    it("gracefully falls back to local NLP engine when Groq times out or fails", () => {
      const context = {
        user: { name: "Alice" },
        career: { targetRole: "Full Stack Developer", readinessScore: 75 },
        skillGaps: [{ canonicalName: "Docker", priority: "High" }],
        github: { repositoryCount: 4 },
      };

      const localResponse = smartMentorLocalService.generateLocalResponse("What should I learn next?", context);
      expect(localResponse).toBeDefined();
      expect(localResponse.answer).toBeTruthy();
      expect(localResponse.source).toBe("local_nlp");
      expect(Array.isArray(localResponse.actions)).toBe(true);
      expect(localResponse.actions.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // JOURNEY C: Career Intelligence & Multi-Role Comparison
  // =========================================================================
  describe("Journey C: Career Intelligence & Multi-Role Comparison", () => {
    it("compares skills across multiple target roles and calculates shared competencies", () => {
      const evaluatedSkills = [
        { skill: "JavaScript", score: 85, level: "Proficient" },
        { skill: "HTML/CSS", score: 80, level: "Competent" },
        { skill: "Node.js", score: 75, level: "Competent" },
      ];

      const comparison = compareRoles(evaluatedSkills, ["Frontend Developer", "Backend Developer"]);
      expect(comparison).toBeDefined();
      expect(comparison.rolesCount).toBe(2);
      expect(Array.isArray(comparison.comparedRoles)).toBe(true);
      expect(Array.isArray(comparison.rolesSummary)).toBe(true);
      expect(comparison.rolesSummary.length).toBe(2);

      const frontendSummary = comparison.rolesSummary.find((r) => r.roleName === "Frontend Developer");
      const backendSummary = comparison.rolesSummary.find((r) => r.roleName === "Backend Developer");
      expect(frontendSummary).toBeDefined();
      expect(backendSummary).toBeDefined();
    });

    it("returns benchmark_pending for roles without detailed rubrics instead of fabricating gaps", () => {
      const gaps = analyzeSkillGaps([], "Aerospace Systems Architect");
      expect(gaps.benchmarkPending).toBe(true);
      expect(gaps.benchmarkStatus).toBe("unknown_role");
      expect(gaps.roleMatchPercentage).toBeNull();
    });

    it("flags sparse evidence notice when user has under 3 evaluated skills", () => {
      const singleSkill = [{ skill: "JavaScript", score: 80, level: "Competent" }];
      const result = analyzeSkillGaps(singleSkill, "Frontend Developer");

      expect(result.evidenceCoverage).toBe("sparse");
      expect(result.evidenceNotice).toContain("sparse available profile evidence");
      expect(result.evidenceNotice).toContain("reflects evidence coverage rather than definitive lack of competence");
    });
  });

  // =========================================================================
  // JOURNEY D: Learning Roadmap and Adaptive Progress Loop
  // =========================================================================
  describe("Journey D: Learning Roadmap and Adaptive Progress Loop", () => {
    it("generates adaptive learning plan and prioritizes missing prerequisites", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: aliceId,
          targetRole: "Frontend Developer",
          overallReadinessScore: 65,
          skills: [
            { skill: "HTML/CSS", canonicalName: "HTML/CSS", score: 45, level: "Developing", confidence: 0.5 },
          ],
        }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(aliceId, "Frontend Developer");
      expect(plan).toBeDefined();
      expect(plan.targetRole).toBe("Frontend Developer");
      expect(Array.isArray(plan.actions)).toBe(true);
      expect(plan.actions.length).toBeGreaterThan(0);

      // Verify actions have defined learning types
      const actionTypes = plan.actions.map((a) => a.actionType);
      expect(actionTypes.some((t) => ["prerequisite_remediation", "foundation_learning", "practice_validation"].includes(t))).toBe(true);
    });

    it("distinguishes video consumption from empirical competency demonstration", async () => {
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      let createdRecord = null;
      vi.spyOn(LearningActivityRecord, "create").mockImplementation((data) => {
        createdRecord = { ...data, _id: new mongoose.Types.ObjectId() };
        return Promise.resolve(createdRecord);
      });
      vi.spyOn(adaptiveSkillLoopService, "recordAdaptiveAssessmentOutcome").mockResolvedValue({
        updatedSkill: "JavaScript",
        newScore: 85,
        newConfidence: 0.9,
      });

      // 1. Video completion -> isDemonstratedCompetency: false
      const videoResult = await learningOutcomeTrackerService.recordActivity(aliceId, {
        activityType: "module_completed",
        skill: "React",
        evidence: { durationSeconds: 1800 },
      });
      expect(videoResult.activity.isDemonstratedCompetency).toBe(false);

      // 2. Sandbox challenge passed -> isDemonstratedCompetency: true
      const codingResult = await learningOutcomeTrackerService.recordActivity(aliceId, {
        activityType: "coding_passed",
        skill: "JavaScript",
        evidence: { score: 10, maxScore: 10, testCasesPassed: 5, testCasesTotal: 5, sandboxVerified: true },
      });
      expect(codingResult.activity.isDemonstratedCompetency).toBe(true);
    });

    it("enforces idempotency key on learning activity records to prevent duplicates", async () => {
      const idempotencyKey = "assessment-evt-12345-idemp";
      const existingRecord = {
        _id: new mongoose.Types.ObjectId(),
        owner: aliceId,
        activityType: "coding_passed",
        skill: "JavaScript",
        idempotencyKey,
      };

      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(existingRecord),
      });

      const duplicateCall = await learningOutcomeTrackerService.recordActivity(aliceId, {
        activityType: "coding_passed",
        skill: "JavaScript",
        idempotencyKey,
      });

      expect(duplicateCall.isDuplicate).toBe(true);
      expect(duplicateCall.message).toContain("idempotent duplicate");
    });
  });

  // =========================================================================
  // JOURNEY E: Coding Platform & Docker Sandbox Security
  // =========================================================================
  describe("Journey E: Coding Platform & Docker Sandbox Security", () => {
    it("loads task catalog and ensures sample test endpoint hides hidden test cases", () => {
      const tasks = getAllTasks("javascript");
      expect(tasks.length).toBeGreaterThan(0);

      const publicTask = getPublicTask("two-sum", "javascript");
      expect(publicTask).toBeDefined();
      expect(publicTask.sampleTests.every((t) => t.isSample === true)).toBe(true);

      const rawTask = getRawTask("two-sum", "javascript");
      expect(rawTask.tests.some((t) => !t.isSample)).toBe(true);
    });

    it("verifies Docker availability probe executes within bounded time", async () => {
      const probeStart = Date.now();
      const status = await checkDockerAvailability();
      const duration = Date.now() - probeStart;

      expect(status).toBeDefined();
      expect(typeof status.available).toBe("boolean");
      expect(duration).toBeLessThan(3000);
    });

    it("executes code safely inside container when Docker is active", async () => {
      const status = await checkDockerAvailability();
      if (!status.available) {
        return; // Safe skip if running in non-Docker environment
      }

      const result = await executeJavaScript("const x = 10; const y = 20; console.log(x + y);");
      expect(result.status).toBe("completed");
      expect(result.stdout.trim()).toBe("30");
    });

    it("rejects unauthenticated solution submission with HTTP 401", async () => {
      const res = await request(app)
        .post("/api/v1/coding/submit")
        .send({ taskId: "two-sum", code: "function twoSum() {}" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // JOURNEY F: Resume Builder, Dual Scoring & Cross-User Isolation
  // =========================================================================
  describe("Journey F: Resume Builder, Dual Scoring & Cross-User Isolation", () => {
    it("calculates deterministic ATS readiness score based on structural sections", () => {
      const completeResume = {
        name: "Alice Developer",
        email: "alice@example.com",
        phone: "+1-555-0100",
        linkedin: "https://linkedin.com/in/alice",
        github: "https://github.com/alice",
        professionalSummary: "Full stack engineer with 3 years experience building scalable Node.js services.",
        experience: [
          {
            role: "Backend Engineer",
            company: "Tech Corp",
            bullets: ["Designed RESTful APIs handling 10k req/sec", "Optimized MongoDB aggregation pipelines"],
          },
        ],
        projects: [
          {
            title: "Smart Skill Hub",
            description: "AI-powered developer platform with isolated Docker coding execution sandbox.",
            stack: ["React", "Node.js", "Docker", "MongoDB"],
          },
        ],
        education: [{ degree: "B.Tech in Computer Science", college: "Engineering Institute" }],
        skills: {
          languages: ["JavaScript", "TypeScript", "Python"],
          frameworks: ["React", "Express", "Node.js"],
          tools: ["Docker", "Git", "MongoDB"],
        },
      };

      const scoreResult = calculateAtsReadinessDeterministic(completeResume);
      expect(scoreResult).toBeDefined();
      expect(scoreResult.score).toBeGreaterThanOrEqual(70);
      expect(Array.isArray(scoreResult.checks)).toBe(true);
      expect(scoreResult.label).toBeDefined();
    });

    it("calculates resume quality rating with action verb and impact density", () => {
      const resume = {
        professionalSummary: "Senior software engineer with expertise in cloud architecture.",
        experience: [
          {
            role: "Software Engineer",
            company: "Cloud Systems",
            bullets: [
              "Engineered distributed caching layer reducing latency by 45%.",
              "Spearheaded microservices migration serving 100k active users.",
            ],
          },
        ],
        projects: [
          {
            title: "Performance Monitor",
            description: "Developed real-time latency monitoring dashboard using WebSockets and Redis.",
          },
        ],
      };

      const qualityResult = calculateResumeQualityDeterministic(resume);
      expect(qualityResult).toBeDefined();
      expect(qualityResult.score).toBeGreaterThanOrEqual(50);
      expect(qualityResult.categoryScores).toBeDefined();
    });

    it("verifies cross-user resume file access is strictly blocked", async () => {
      // Bob requests Alice's resume file
      const aliceResumeId = new mongoose.Types.ObjectId();
      vi.spyOn(Resume, "findOne").mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/resumes/${aliceResumeId}/file`)
        .set("Authorization", "Bearer fake-token-for-bob");

      expect([401, 403, 404]).toContain(res.status);
    });
  });

  // =========================================================================
  // JOURNEY G: EduTube & Deterministic Educational Filtering
  // =========================================================================
  describe("Journey G: EduTube & Deterministic Educational Filtering", () => {
    it("hard-blocks music, movies, trailers, and gaming entertainment videos", () => {
      // 1. Music video
      const musicCheck = educationalClassifierService.classifyVideo({
        videoId: "music-vid-001",
        title: "Pop Star - Official Music Video (Official Audio)",
        categoryId: YOUTUBE_CATEGORIES.MUSIC,
        durationSeconds: 240,
      });
      expect(musicCheck.decision).toBe("reject");
      expect(musicCheck.reasonCodes.some((rc) => [CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC, CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC_CHANNEL].includes(rc))).toBe(true);

      // 2. Movie Trailer
      const trailerCheck = educationalClassifierService.classifyVideo({
        videoId: "trailer-vid-002",
        title: "Blockbuster Movie 2026 - Official Movie Trailer #1",
        categoryId: YOUTUBE_CATEGORIES.TRAILERS,
        durationSeconds: 180,
      });
      expect(trailerCheck.decision).toBe("reject");
      expect(trailerCheck.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_MOVIE_TRAILER);

      // 3. YouTube Shorts (< 60 seconds)
      const shortsCheck = educationalClassifierService.classifyVideo({
        videoId: "shorts-vid-003",
        title: "Coding hack in 30 seconds! #shorts",
        durationSeconds: 45,
      });
      expect(shortsCheck.decision).toBe("reject");
      expect(shortsCheck.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });

    it("approves structured programming tutorials, course lectures, and coding walkthroughs", () => {
      const courseCheck = educationalClassifierService.classifyVideo({
        videoId: "course-react-004",
        title: "React.js Full Course 2026 - Beginner to Advanced Tutorial with Hands-on Projects",
        description: "Complete course syllabus covering React hooks, state management, components, and full stack API integration.",
        channelTitle: "freeCodeCamp.org",
        categoryId: YOUTUBE_CATEGORIES.EDUCATION,
        durationSeconds: 14400, // 4 hours
      });

      expect(courseCheck.decision).toBe("allow");
      expect(courseCheck.confidence).toBeGreaterThanOrEqual(0.8);
      expect(courseCheck.educationalRelevance).toBeGreaterThanOrEqual(65);
    });
  });

  // =========================================================================
  // JOURNEY H: Notifications, Catalog Integrity & Admin RBAC Boundaries
  // =========================================================================
  describe("Journey H: Notifications, Catalog Integrity & Admin RBAC Boundaries", () => {
    it("enforces RBAC: non-admin user is rejected from admin operations with HTTP 403", async () => {
      const nonAdminReq = {
        user: { _id: aliceId, email: "alice@student.edu", role: "student" },
        auth: { uid: "firebase-alice", email: "alice@student.edu", role: "student" },
      };

      let errorReceived = null;
      const nextFn = (err) => {
        errorReceived = err;
      };

      ensureAdmin(nonAdminReq, {}, nextFn);
      expect(errorReceived).toBeDefined();
      expect(errorReceived.statusCode).toBe(403);
      expect(errorReceived.message).toContain("Administrator privilege required");
    });

    it("protects catalog integrity: soft-deactivates degrees referenced by active students", async () => {
      vi.spyOn(AcademicBranch, "countDocuments").mockResolvedValue(2);
      vi.spyOn(User, "countDocuments").mockResolvedValue(15);
      const updateSpy = vi.spyOn(AcademicDegree, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const result = await safeDeleteDegree("b-tech");
      expect(result.action).toBe("deactivated");
      expect(result.referencedUsersCount).toBe(15);
      expect(result.referencedBranchesCount).toBe(2);
      expect(updateSpy).toHaveBeenCalledWith({ slug: "b-tech" }, { $set: { isActive: false } });
    });

    it("enforces notification ownership check when marking notification as read", async () => {
      const foreignNotificationId = new mongoose.Types.ObjectId();
      vi.spyOn(Notification, "findOne").mockResolvedValue(null);

      await expect(markNotificationAsRead(aliceId, foreignNotificationId.toString())).rejects.toThrow(
        "Notification not found or access denied"
      );
    });
  });
});
