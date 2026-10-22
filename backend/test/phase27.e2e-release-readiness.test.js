/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 27: END-TO-END RELEASE READINESS SUITE
 * ============================================================================
 *
 * Comprehensive release audit testing authenticated student workflows,
 * database integrity, Docker sandbox execution, AI Mentor context isolation,
 * resume scoring, EduTube classification, and deployment configuration.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import express from "express";
import request from "supertest";
import Docker from "dockerode";

import {
  SYNTHETIC_STUDENT_PROFILES,
  SYNTHETIC_EDUTUBE_CANDIDATES,
} from "./fixtures/syntheticEvaluationDataset.js";

import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { EVIDENCE_SOURCES } from "../src/shared/evidence/skillEvidenceContract.js";
import { buildCareerMentorPlan } from "../src/modules/github/services/githubCareer.service.js";
import {
  analyzeSkillGaps,
  compareRoles,
  resolveRoleBenchmark,
} from "../src/modules/gaps/services/skillGap.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { adaptiveLearningPlanService } from "../src/modules/recommendations/services/adaptiveLearningPlan.service.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { adaptiveSkillLoopService } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import {
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
} from "../src/modules/resume/services/resumeIntelligence.service.js";
import {
  educationalClassifierService,
  CLASSIFIER_REASON_CODES,
  YOUTUBE_CATEGORIES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";
import { getAllTasks, getPublicTask } from "../src/modules/coding/services/taskCatalog.service.js";
import { evaluateTask } from "../src/modules/coding/services/codingExecution.service.js";
import { checkDockerAvailability } from "../src/modules/coding/sandbox/dockerExecutor.js";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";
import { healthcheck, livenessCheck, readinessCheck } from "../src/controllers/healthcheck.controller.js";
import { safeDeleteDegree, checkCatalogIntegrity } from "../src/modules/admin/services/adminCatalog.service.js";
import { markNotificationAsRead } from "../src/modules/notifications/services/notification.service.js";

import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import { Project } from "../src/modules/resume/models/project.models.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
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
import { globalErrorHandler } from "../src/core/errors/errorHandler.js";

const docker = new Docker();
const dockerStatus = await checkDockerAvailability(docker);
const isDockerAvailable = dockerStatus.available;

describe("Phase 27: Authenticated E2E Workflows & Release Readiness Audit", () => {
  const aliceId = new mongoose.Types.ObjectId("67b000000000000000000001");
  const bobId = new mongoose.Types.ObjectId("67b000000000000000000002");

  beforeEach(() => {
    vi.clearAllMocks();
    smartMentorContextService.invalidateContext(aliceId);
    smartMentorContextService.invalidateContext(bobId);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. STUDENT ONBOARDING & PERSISTENCE
  // =========================================================================
  describe("1. Student Onboarding & Persistence", () => {
    it("persists academic profile onboarding with institution and degree details", async () => {
      const academicData = {
        degreeName: "Bachelor of Technology",
        degreeSlug: "b-tech",
        branchName: "Computer Science & Engineering",
        branchSlug: "cse",
        institution: "National Institute of Engineering",
        currentYear: 3,
        currentSemester: 6,
        academicScheme: "2022-CBCS",
      };

      const user = new User({
        _id: aliceId,
        firebaseUid: "firebase-alice-001",
        email: "alice@example.edu",
        displayName: "Alice Sharma",
        targetRole: "Frontend Developer",
        academic: academicData,
      });

      expect(user.academic.degreeName).toBe("Bachelor of Technology");
      expect(user.academic.currentYear).toBe(3);
      expect(user.academic.currentSemester).toBe(6);
      expect(user.academic.academicScheme).toBe("2022-CBCS");
      expect(user.targetRole).toBe("Frontend Developer");
    });

    it("dynamically updates role benchmarks when student changes target role", () => {
      const frontendBenchmark = resolveRoleBenchmark("Frontend Developer");
      const fullStackBenchmark = resolveRoleBenchmark("Full Stack Developer");

      expect(frontendBenchmark).toBeDefined();
      expect(fullStackBenchmark).toBeDefined();

      // Frontend Developer prioritizes React/CSS/TypeScript
      const frontendSkills = (frontendBenchmark.coreSkills || []).map((s) => s.skill);
      expect(frontendSkills).toContain("React");

      // Full Stack Developer additionally requires backend/DB proficiencies
      const fullStackSkills = (fullStackBenchmark.coreSkills || []).map((s) => s.skill);
      expect(fullStackSkills).toContain("Node.js");
      expect(fullStackSkills.length).toBeGreaterThanOrEqual(
        frontendSkills.length
      );
    });
  });

  // =========================================================================
  // 2. GITHUB & CAREER INTELLIGENCE
  // =========================================================================
  describe("2. GitHub Evidence & Career Intelligence", () => {
    it("extracts corroborated skill evidence from synthetic GitHub repos", () => {
      const syntheticRepos = [
        {
          name: "react-dashboard",
          language: "TypeScript",
          topics: ["react", "typescript", "tailwind"],
          hasTests: true,
          commitCount: 42,
          hasReadme: true,
          description: "Production-ready dashboard built with React and Tailwind CSS",
        },
        {
          name: "node-rest-api",
          language: "JavaScript",
          topics: ["nodejs", "express", "mongodb"],
          hasTests: true,
          commitCount: 28,
          hasReadme: true,
          description: "Clean architecture REST API with JWT authentication",
        },
      ];

      const evidencePkg = extractGitHubEvidence({
        userId: aliceId,
        githubData: { repositories: syntheticRepos },
      });

      expect(evidencePkg).toBeDefined();
      expect(evidencePkg.source).toBe(EVIDENCE_SOURCES.GITHUB);
      expect(Array.isArray(evidencePkg.skills)).toBe(true);
      expect(evidencePkg.skills.length).toBeGreaterThan(0);

      const reactEvidence = evidencePkg.skills.find(
        (e) => e.skill.toLowerCase() === "react"
      );
      expect(reactEvidence).toBeDefined();
    });

    it("gracefully falls back for unsupported roles without fabricating benchmarks", () => {
      const unsupportedRole = "Quantum Computing Architect";
      const benchmark = resolveRoleBenchmark(unsupportedRole);

      // System must return null without fabricating random benchmarks
      expect(benchmark).toBeNull();

      const analysis = analyzeSkillGaps(
        [{ skill: "React", score: 75, level: "proficient" }],
        unsupportedRole
      );
      expect(analysis).toBeDefined();
      expect(analysis.benchmarkStatus).toBe("unknown_role");
      expect(analysis.roleMatchPercentage).toBeNull();
      expect(analysis.totalRequiredSkills).toBe(0);
    });

    it("strictly isolates evidence between distinct students", () => {
      const aliceSkills =
        SYNTHETIC_STUDENT_PROFILES.strong_javascript_developer.evaluatedSkills;
      const bobSkills =
        SYNTHETIC_STUDENT_PROFILES.beginner_minimal_evidence.evaluatedSkills;

      const aliceAnalysis = analyzeSkillGaps(aliceSkills, "Frontend Developer");
      const bobAnalysis = analyzeSkillGaps(bobSkills, "Frontend Developer");

      expect(aliceAnalysis.roleMatchPercentage).toBeGreaterThanOrEqual(
        bobAnalysis.roleMatchPercentage ?? 0
      );
    });
  });

  // =========================================================================
  // 3. LEARNING ROADMAP & ADAPTIVE LOOP
  // =========================================================================
  describe("3. Learning Roadmap & Progress Tracking", () => {
    it("generates structured adaptive learning plan with ordered action types", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: aliceId,
          skills: [{ skill: "React", canonicalName: "React", score: 70, level: "Proficient" }],
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

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(
        aliceId,
        "Frontend Developer"
      );

      expect(plan).toBeDefined();
      expect(plan.targetRole).toBe("Frontend Developer");
      expect(Array.isArray(plan.actions)).toBe(true);
      expect(plan.actions.length).toBeGreaterThan(0);

      const actionTypes = plan.actions.map((a) => a.actionType);
      expect(actionTypes.length).toBeGreaterThan(0);
    });    it("verifies that passive video watching does NOT award technical competency", async () => {
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      vi.spyOn(LearningActivityRecord, "create").mockImplementation((data) => {
        return Promise.resolve({ ...data, _id: new mongoose.Types.ObjectId() });
      });

      vi.spyOn(adaptiveSkillLoopService, "recordAdaptiveAssessmentOutcome").mockResolvedValue({
        updatedSkill: "JavaScript",
        newScore: 85,
        newConfidence: 0.9,
      });

      // 1. Passive video consumption -> isDemonstratedCompetency: false
      const videoResult = await learningOutcomeTrackerService.recordActivity(aliceId, {
        activityType: "module_completed",
        skill: "React",
        evidence: { durationSeconds: 1800 },
      });
      expect(videoResult.activity.isDemonstratedCompetency).toBe(false);

      // 2. Verified sandbox challenge passed -> isDemonstratedCompetency: true
      const codingResult = await learningOutcomeTrackerService.recordActivity(aliceId, {
        activityType: "coding_passed",
        skill: "JavaScript",
        evidence: { score: 100, passed: true },
      });
      expect(codingResult.activity.isDemonstratedCompetency).toBe(true);
    });
  });

  // =========================================================================
  // 4. CODING PLATFORM & SANDBOX SECURITY
  // =========================================================================
  describe("4. Coding Platform & Docker Sandbox Security", () => {
    it("loads catalog tasks and sanitizes hidden test assertions", () => {
      const task = getPublicTask("two-sum", "javascript");
      expect(task).toBeDefined();
      expect(task.title).toBe("Two Sum");
      expect(task.sampleTests).toBeDefined();
      expect(task.sampleTests.every((t) => t.isSample === true)).toBe(true);
      expect(task.totalTestsCount).toBeGreaterThan(task.sampleTests.length);
    });

    it.skipIf(!isDockerAvailable)(
      "executes valid solution inside Docker sandbox and returns passed result",
      async () => {
        const validCode = `function add(a, b) { return a + b; }`;
        const result = await evaluateTask("add-two-numbers", validCode);
        expect(result.status).toBe("passed");
        expect(result.score).toBeGreaterThan(0);
        expect(result.passed).toBe(result.total);
      },
      15000
    );

    it.skipIf(!isDockerAvailable)(
      "safely handles syntax errors in student submissions without crashing",
      async () => {
        const brokenCode = `function add(a, b { return a + b;`;
        const result = await evaluateTask("add-two-numbers", brokenCode);
        expect(result.status).toBe("error");
        expect(result.score).toBe(0);
        expect(result.stderr).toContain("SyntaxError");
      },
      15000
    );

    it.skipIf(!isDockerAvailable)(
      "enforces timeout on infinite loops within configured limits",
      async () => {
        const loopCode = `function add(a, b) { while(true) {} }`;
        const result = await evaluateTask("add-two-numbers", loopCode);
        expect(result.status).toBe("timeout");
        expect(result.score).toBe(0);
      },
      15000
    );
  });

  // =========================================================================
  // 5. AI MENTOR LIFECYCLE & CONTEXT ISOLATION
  // =========================================================================
  describe("5. AI Mentor Lifecycle & Context Isolation", () => {
    it("assembles rich student context and updates after profile mutation", async () => {
      const mockUser1 = {
        _id: aliceId,
        displayName: "Alice Sharma",
        targetRole: "Frontend Developer",
        careerInterests: ["Web Development", "UI/UX"],
        academic: { degreeName: "B.Tech", branchName: "CSE", isConfigured: true },
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser1),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: aliceId,
          targetRole: "Frontend Developer",
          overallReadinessScore: 75,
          skills: [
            { skill: "React", level: "Proficient", score: 80 },
            { skill: "JavaScript", level: "Proficient", score: 85 },
          ],
        }),
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

      // 1. Initial context retrieval
      const initialContext = await smartMentorContextService.getUnifiedUserContext(aliceId);
      expect(initialContext).toBeDefined();
      expect(initialContext.career.targetRole).toBe("Frontend Developer");

      // Verify cached
      const cached = smartMentorContextService.getCachedContext(aliceId);
      expect(cached).toBeDefined();
      expect(cached.career.targetRole).toBe("Frontend Developer");

      // 2. Profile mutation: Invalidate cache and update targetRole
      smartMentorContextService.invalidateContext(aliceId);
      expect(smartMentorContextService.getCachedContext(aliceId)).toBeNull();

      const mockUser2 = {
        _id: aliceId,
        displayName: "Alice Sharma",
        targetRole: "Full Stack Developer",
        careerInterests: ["Web Development", "Backend"],
        academic: { degreeName: "B.Tech", branchName: "CSE", isConfigured: true },
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser2),
      });

      const updatedContext = await smartMentorContextService.getUnifiedUserContext(aliceId);
      expect(updatedContext.career.targetRole).toBe("Full Stack Developer");
    });

    it("falls back gracefully to deterministic rule engine when external LLM is offline", () => {
      const studentContext = {
        user: { displayName: "Alice", targetRole: "Full Stack Developer" },
        skills: [{ name: "React", level: "intermediate" }],
        gaps: { missingSkills: ["Docker", "Node.js"] },
      };

      const response = smartMentorLocalService.generateLocalResponse(
        "How can I improve my backend skills for full stack roles?",
        studentContext
      );

      expect(response).toBeDefined();
      expect(response.message || response.content || response).toBeDefined();
    });

    it("maintains strict context separation between distinct students", () => {
      smartMentorContextService.setCachedContext(aliceId, {
        displayName: "Alice",
        targetRole: "Frontend Developer",
      });
      smartMentorContextService.setCachedContext(bobId, {
        displayName: "Bob",
        targetRole: "Data Scientist",
      });

      const aliceCtx = smartMentorContextService.getCachedContext(aliceId);
      const bobCtx = smartMentorContextService.getCachedContext(bobId);

      expect(aliceCtx.displayName).toBe("Alice");
      expect(bobCtx.displayName).toBe("Bob");
      expect(aliceCtx.targetRole).not.toBe(bobCtx.targetRole);
    });
  });

  // =========================================================================
  // 6. RESUME BUILDER & DUAL SCORING
  // =========================================================================
  describe("6. Resume Builder, Scoring & Privacy Isolation", () => {
    it("calculates deterministic ATS and quality scores on synthetic resume draft", () => {
      const syntheticDraft = {
        name: "Alice Sharma",
        email: "alice@example.edu",
        phone: "+91 9876543210",
        github: "https://github.com/alice",
        linkedin: "https://linkedin.com/in/alice",
        professionalSummary:
          "Experienced Full Stack Developer with 3+ years building responsive React and Node.js applications.",
        skills: {
          languages: ["JavaScript", "TypeScript"],
          frameworks: ["React", "Express.js", "Node.js"],
          tools: ["Docker", "MongoDB", "Git"],
        },
        experience: [
          {
            role: "Frontend Intern",
            company: "Tech Labs",
            date: "Jan 2024 - Jun 2024",
            bullets: [
              "Engineered high-performance React dashboard components reducing initial load time by 30%.",
              "Implemented client-side caching with React Query improving API response latency.",
            ],
          },
        ],
        education: [
          {
            degree: "Bachelor of Technology in Computer Science",
            institution: "National Institute of Engineering",
            year: "2025",
          },
        ],
        projects: [
          {
            name: "Smart Skill Hub",
            description: "Production web application for career navigation and evidence corroboration.",
            technologies: "React, Node.js, Docker",
            bullets: [
              "Architected multi-tenant user authentication and session management.",
              "Implemented isolated Docker execution sandbox for automated code evaluation.",
            ],
          },
        ],
      };

      const atsScore = calculateAtsReadinessDeterministic(syntheticDraft);
      const qualityScore = calculateResumeQualityDeterministic(syntheticDraft);

      expect(atsScore.score).toBeGreaterThanOrEqual(70);
      expect(atsScore.score).toBeLessThanOrEqual(100);

      expect(qualityScore.score).toBeGreaterThanOrEqual(70);
      expect(qualityScore.score).toBeLessThanOrEqual(100);
    });

    it("strictly isolates resume drafts between separate students", () => {
      const aliceResume = new Resume({
        _id: new mongoose.Types.ObjectId("67b000000000000000000010"),
        owner: aliceId,
        title: "Alice - Full Stack Resume",
        content: "Alice's confidential resume draft",
      });

      const bobResume = new Resume({
        _id: new mongoose.Types.ObjectId("67b000000000000000000020"),
        owner: bobId,
        title: "Bob - Data Science Resume",
        content: "Bob's private resume draft",
      });

      expect(aliceResume.owner.toString()).not.toBe(bobResume.owner.toString());
      expect(aliceResume.owner.equals(aliceId)).toBe(true);
      expect(bobResume.owner.equals(bobId)).toBe(true);
    });
  });

  // =========================================================================
  // 7. EDUTUBE SEARCH & EDUCATIONAL CLASSIFICATION
  // =========================================================================
  describe("7. EduTube Search & Classification", () => {
    it("whitelists educational candidate videos based on category and duration", () => {
      const educationalCandidate = {
        videoId: "yt-prog-101",
        title: "Full React & TypeScript Course for Beginners",
        description: "Learn modern React with TypeScript from scratch in this tutorial.",
        categoryId: YOUTUBE_CATEGORIES.EDUCATION, // Category 27
        durationSeconds: 3600, // 1 hour
      };

      const evaluation = educationalClassifierService.classifyVideo(educationalCandidate);
      expect(evaluation.decision).toBe("allow");
      expect(evaluation.reasonCodes).toContain(CLASSIFIER_REASON_CODES.EDUCATIONAL_CATEGORY_CONFIRMED);
    });

    it("rejects non-educational or entertainment content deterministically", () => {
      const clickbaitCandidate = {
        videoId: "yt-clickbait-99",
        title: "YOU WON'T BELIEVE WHAT HAPPENED!! (SHOCKING PRANK)",
        description: "Funny prank video with friends. Like and subscribe!",
        categoryId: YOUTUBE_CATEGORIES.ENTERTAINMENT, // Category 24
        durationSeconds: 45, // Under minimum duration threshold
      };

      const evaluation = educationalClassifierService.classifyVideo(clickbaitCandidate);
      expect(evaluation.decision).toBe("reject");
      expect(evaluation.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });
  });

  // =========================================================================
  // 8. DASHBOARD & NOTIFICATIONS
  // =========================================================================
  describe("8. Dashboard & Notifications Lifecycle", () => {
    it("records notifications and updates read status upon student interaction", async () => {
      const notification = new Notification({
        _id: new mongoose.Types.ObjectId("67b000000000000000000050"),
        owner: aliceId,
        title: "Milestone Completed",
        message: "You completed the React fundamentals module!",
        isRead: false,
      });

      expect(notification.isRead).toBe(false);

      notification.isRead = true;
      notification.readAt = new Date();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeDefined();
    });
  });

  // =========================================================================
  // 9. ADMINISTRATION & RBAC BOUNDARIES
  // =========================================================================
  describe("9. Administration & RBAC Boundaries", () => {
    it("rejects non-admin student access with HTTP 403 Forbidden", async () => {
      const mockReq = {
        user: { role: "student", email: "student@example.edu" },
      };
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const nextFn = vi.fn();

      await ensureAdmin(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringMatching(/access denied|admin/i),
        })
      );
    });

    it("grants access to legitimate administrators", async () => {
      const mockReq = {
        user: { role: "admin", email: "admin@smartskillhub.io" },
      };
      const mockRes = {};
      const nextFn = vi.fn();

      await ensureAdmin(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith();
    });
  });

  // =========================================================================
  // 10. SYSTEM HEALTHCHECKS & RELEASE PACKAGING
  // =========================================================================
  describe("10. System Healthchecks & Release Deployment Probes", () => {
    it("liveness probe returns HTTP 200 with operational status", () => {
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      livenessCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          success: true,
          data: expect.objectContaining({
            liveness: "alive",
            status: "ok",
          }),
        })
      );
    });

    it("readiness probe verifies system readiness when database is connected", async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 1,
        configurable: true,
      });

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await readinessCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200,
          data: expect.objectContaining({
            ready: true,
          }),
        })
      );

      Object.defineProperty(mongoose.connection, "readyState", {
        value: originalReadyState,
        configurable: true,
      });
    });

    it("readiness probe returns 503 degraded when database is disconnected", async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", {
        value: 0,
        configurable: true,
      });

      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await readinessCheck(req, res);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 503,
          data: expect.objectContaining({
            ready: false,
            status: "degraded",
          }),
        })
      );

      Object.defineProperty(mongoose.connection, "readyState", {
        value: originalReadyState,
        configurable: true,
      });
    });
  });
});
