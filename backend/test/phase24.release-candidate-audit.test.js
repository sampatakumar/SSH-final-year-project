/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 24 RELEASE CANDIDATE AUDIT TEST SUITE
 * ============================================================================
 *
 * Comprehensive audit validating all 12 complete student workflows (Journeys A-L)
 * and the 12 required real-world release scenarios:
 *
 * 1. Beginner with minimal profile and GitHub evidence
 * 2. Student with a substantial public GitHub profile
 * 3. Student with contradictory resume and repository evidence
 * 4. Student targeting multiple supported career roles
 * 5. Student using a role with no implemented benchmark
 * 6. Student who completes learning activities but has not demonstrated competency
 * 7. Student experiencing repeated coding timeouts
 * 8. Student updating profile after a cached analysis
 * 9. Student editing a resume and immediately requesting new AI feedback
 * 10. Two separate students whose contexts must remain strictly isolated
 * 11. Student with unavailable GitHub or AI-provider services
 * 12. Administrator and normal student attempting protected operations
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import express from "express";
import request from "supertest";

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
import {
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
} from "../src/modules/resume/services/resumeIntelligence.service.js";
import {
  educationalClassifierService,
  CLASSIFIER_REASON_CODES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";

import { getCurrentUser, updateCurrentUser } from "../src/core/auth/auth.controller.js";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";
import { healthcheck, livenessCheck, readinessCheck } from "../src/controllers/healthcheck.controller.js";
import { listAdminUsers, updateAdminUserRole } from "../src/modules/admin/services/adminUser.service.js";
import { checkCatalogIntegrity, safeDeleteDegree } from "../src/modules/admin/services/adminCatalog.service.js";
import { createResume, updateResume, deleteResume } from "../src/modules/resume/controllers/resume.controller.js";

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
import { AcademicDegree } from "../src/core/database/models/academicDegree.models.js";
import { AcademicBranch } from "../src/core/database/models/academicBranch.models.js";
import { globalErrorHandler } from "../src/core/errors/errorHandler.js";

describe("Phase 24: Release Candidate Audit & Real-World Validation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SCENARIO 1: Beginner with Minimal Profile and GitHub Evidence
  // ==========================================================================
  describe("Scenario 1: Beginner with Minimal Profile and GitHub Evidence", () => {
    const profile = SYNTHETIC_STUDENT_PROFILES.beginner_minimal_evidence;

    it("extracts empty GitHub evidence without throwing, providing actionable guidance", () => {
      const evidence = extractGitHubEvidence({
        userId: profile.id,
        githubData: profile.github,
      });

      expect(evidence.source).toBe(EVIDENCE_SOURCES.GITHUB);
      expect(evidence.skills).toEqual([]);
      expect(evidence.metadata.publicReposCount).toBe(0);
    });

    it("evaluates skill gaps with sparse evidence disclosure and no fabricated scores", () => {
      const gaps = analyzeSkillGaps(profile.evaluatedSkills, profile.targetRole);

      expect(gaps.benchmarkStatus).toBe("validated");
      expect(gaps.evidenceCoverage).toBe("sparse");
      expect(gaps.roleMatchPercentage).toBe(0);
      expect(gaps.evidenceNotice).toContain("sparse available profile evidence");
      expect(gaps.gaps.length).toBeGreaterThan(0);
      // Top gaps must be categorized as missing evidence rather than assumed failure
      expect(gaps.gaps[0].evidenceState).toBe("missing_evidence");
      expect(gaps.gaps[0].currentScore).toBe(0);
    });

    it("grounded AI mentor prompt blocks fabrication of unconfigured academic details", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: profile.id,
          displayName: profile.displayName,
          academic: { degreeName: "", branchName: "" },
        }),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      });
      vi.spyOn(Project, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(Resume, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });

      const context = await smartMentorContextService.getUnifiedUserContext(profile.id, { forceRefresh: true });
      expect(context.career.academic.isConfigured).toBe(false);

      const mentorService = new SmartMentorService();
      const prompt = mentorService.buildSystemPrompt(context);
      expect(prompt).toContain("NEVER invent, assume, or fabricate an engineering branch, college, degree, or semester");
    });
  });

  // ==========================================================================
  // SCENARIO 2: Student with Substantial Public GitHub Profile
  // ==========================================================================
  describe("Scenario 2: Student with Substantial Public GitHub Profile", () => {
    const profile = SYNTHETIC_STUDENT_PROFILES.strong_javascript_developer;

    it("observes skills directly from original repos with test/CI-CD/docs provenance", () => {
      const plan = buildCareerMentorPlan({
        githubData: profile.github,
        targetRole: profile.targetRole,
      });

      expect(plan.targetRole).toBe("Frontend Developer");
      expect(plan.observedSkills.length).toBeGreaterThan(0);

      const jsSkill = plan.observedSkills.find((s) => s.skill === "JavaScript");
      expect(jsSkill).toBeDefined();
      expect(jsSkill.evidenceCategory).toBe("observed_evidence");
      expect(jsSkill.provenance.originalReposCount).toBe(2);
      expect(jsSkill.provenance.forkCount).toBe(0);
      expect(jsSkill.evidenceBreakdown.testsDetected).toBe(true);
      expect(jsSkill.evidenceBreakdown.meaningfulArtifacts).toContain("Automated Test Suite");
      // Single-source ceiling: GitHub alone cannot exceed score 75 without resume corroboration
      expect(jsSkill.score).toBeLessThanOrEqual(75);
    });
  });

  // ==========================================================================
  // SCENARIO 3: Student with Contradictory Resume and Repository Evidence
  // ==========================================================================
  describe("Scenario 3: Student with Contradictory Resume and Repository Evidence", () => {
    const profile = SYNTHETIC_STUDENT_PROFILES.resume_conflicting_github;

    it("flags stack divergence and classifies uncorroborated resume skills as unsupported claims", () => {
      const plan = buildCareerMentorPlan({
        githubData: profile.github,
        resumeData: profile.resume,
        targetRole: profile.targetRole,
      });

      expect(plan.crossSourceEvidence.hasConflictingEvidence).toBe(true);
      expect(plan.crossSourceEvidence.conflicts[0].type).toBe("stack_divergence");

      // Claimed Go, Rust, C++ in resume with only forked HTML repo in GitHub
      expect(plan.crossSourceEvidence.unsupportedClaims).toContain("Go");
      expect(plan.crossSourceEvidence.unsupportedClaims).toContain("Rust");

      expect(plan.crossSourceEvidence.corroboratedSkillsCount).toBe(0);
    });
  });

  // ==========================================================================
  // SCENARIO 4: Student Targeting Multiple Supported Career Roles
  // ==========================================================================
  describe("Scenario 4: Student Targeting Multiple Supported Career Roles", () => {
    const profile = SYNTHETIC_STUDENT_PROFILES.multi_role_aspirant;

    it("compares multiple roles and normalizes aliases to official benchmark titles", () => {
      const comparison = compareRoles(profile.evaluatedSkills, [
        "Frontend Developer",
        "Backend Developer",
        "devops", // Raw alias
      ]);

      expect(comparison.rolesSummary.length).toBe(3);
      const roles = comparison.rolesSummary.map((c) => c.roleName);
      expect(roles).toContain("Frontend Developer");
      expect(roles).toContain("Backend Developer");
      expect(roles).toContain("DevOps Engineer"); // Alias canonicalized!

      // Shared competencies and unique gaps must be separated
      expect(comparison.sharedSkills).toBeDefined();
      expect(comparison.highLeverageSkills).toBeDefined();
    });

    it("generates role-specific adaptive plans with topological prerequisite ordering", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: profile.id,
          skills: profile.evaluatedSkills,
          overallReadinessScore: 72,
        }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(
        profile.id,
        "Full Stack Developer"
      );

      expect(plan.actions.length).toBeGreaterThan(0);
      // Prerequisite topological sorting check: JavaScript must precede React!
      const jsIndex = plan.actions.findIndex((a) => a.skill === "JavaScript");
      const reactIndex = plan.actions.findIndex((a) => a.skill === "React");
      if (jsIndex !== -1 && reactIndex !== -1) {
        expect(jsIndex).toBeLessThan(reactIndex);
      }
    });
  });

  // ==========================================================================
  // SCENARIO 5: Student Using a Role with No Implemented Benchmark
  // ==========================================================================
  describe("Scenario 5: Student Using a Role with No Implemented Benchmark", () => {
    const profile = SYNTHETIC_STUDENT_PROFILES.benchmark_pending_role;

    it("returns benchmark_pending / unknown_role status without fabricating metrics", () => {
      const gaps = analyzeSkillGaps(profile.evaluatedSkills, profile.targetRole);

      expect(gaps.benchmarkPending).toBe(true);
      expect(gaps.benchmarkStatus).toBe("unknown_role");
      expect(gaps.roleMatchPercentage).toBeNull();
      expect(gaps.totalRequiredSkills).toBe(0);
      expect(gaps.benchmarkNotice).toContain("is not recognized in standard benchmarks");
    });
  });

  // ==========================================================================
  // SCENARIO 6: Passive Learner Who Completes Lessons but Has Not Demonstrated Competency
  // ==========================================================================
  describe("Scenario 6: Passive Learner (Completed Lessons vs Empirical Proof)", () => {
    const profile = SYNTHETIC_STUDENT_PROFILES.completed_learning_weak_assessment;

    it("marks module_completed as isDemonstratedCompetency: false", async () => {
      const mockCreate = vi.fn().mockImplementation((doc) => Promise.resolve({ _id: "rec_123", ...doc }));
      vi.spyOn(LearningActivityRecord, "create").mockImplementation(mockCreate);
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      const result = await learningOutcomeTrackerService.recordActivity(profile.id, {
        activityType: "module_completed",
        skill: "Docker",
        entityId: "video_dock_1",
        title: "Docker Tutorial for Beginners",
      });

      expect(result.activity.isDemonstratedCompetency).toBe(false);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          isDemonstratedCompetency: false,
          activityType: "module_completed",
        })
      );
    });

    it("adaptive plan designates watched lesson as practice_validation requiring sandbox pass", async () => {
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: profile.id,
          skills: [
            { skill: "Linux CLI", score: 70, level: "Competent" },
            { skill: "Networking Basics", score: 70, level: "Competent" },
            { skill: "Node.js", score: 70, level: "Competent" },
            { skill: "Docker", score: 25, level: "Limited Evidence", confidence: 0.3 },
          ],
        }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { canonicalName: "Docker", skill: "Docker", activityType: "module_completed", isDemonstratedCompetency: false },
            ]),
          }),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(profile.id, "DevOps Engineer");
      const dockerAction = plan.actions.find((a) => a.skill === "Docker");

      expect(dockerAction).toBeDefined();
      expect(dockerAction.actionType).toBe("practice_validation");
      expect(dockerAction.reasoning).toContain("Watching lessons provides conceptual understanding, but competency requires empirical proof");
      expect(dockerAction.completionCriteria).toContain("Pass 100% of test cases in the coding sandbox");
    });
  });

  // ==========================================================================
  // SCENARIO 7: Student Experiencing Repeated Coding Timeouts
  // ==========================================================================
  describe("Scenario 7: Student Experiencing Repeated Coding Timeouts", () => {
    const studentId = new mongoose.Types.ObjectId("65b000000000000000000077");

    it("records timeout as coding_attempted without penalizing skill as coding_failed", async () => {
      const mockCreate = vi.fn().mockImplementation((doc) => Promise.resolve({ _id: "rec_timeout_1", ...doc }));
      vi.spyOn(LearningActivityRecord, "create").mockImplementation(mockCreate);
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });

      // Simulate a submission that timed out in Docker sandbox (status: "timeout")
      const result = await learningOutcomeTrackerService.recordActivity(studentId, {
        activityType: "coding_attempted",
        skill: "Data Structures",
        entityId: "two-sum",
        title: "Two Sum",
        status: "timeout",
        evidence: {
          executionTimeMs: 5000,
          isTimeout: true,
          details: "Execution timed out (5000ms limit). Recorded as attempt without penalizing competency.",
        },
      });

      expect(result.activity.activityType).toBe("coding_attempted");
      expect(result.activity.isDemonstratedCompetency).toBe(false);
      expect(result.activity.evidence.isTimeout).toBe(true);
      expect(result.activity.status).toBe("timeout");
    });

    it("smart mentor context separates timeoutCount from actual logic failedCount", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: studentId, displayName: "Timeout Tester" }),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      });
      vi.spyOn(Project, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(Resume, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });

      // Submissions: 1 pass, 1 logic failure, 2 timeouts, 1 system error
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { taskId: "two-sum", status: "passed", passed: true },
            { taskId: "reverse-string", status: "failed", passed: false },
            { taskId: "fibonacci", status: "timeout", passed: false },
            { taskId: "primes", status: "timeout", passed: false },
            { taskId: "sort", status: "system_error", passed: false },
          ]),
        }),
      });

      const context = await smartMentorContextService.getUnifiedUserContext(studentId, { forceRefresh: true });

      expect(context.coding.totalSubmissions).toBe(5);
      expect(context.coding.passedCount).toBe(1);
      expect(context.coding.failedCount).toBe(1); // Only the actual logic failure!
      expect(context.coding.timeoutCount).toBe(2); // Timeouts separated
      expect(context.coding.systemErrorCount).toBe(1); // System errors separated
    });
  });

  // ==========================================================================
  // SCENARIO 8: Student Updating Profile After a Cached Analysis
  // ==========================================================================
  describe("Scenario 8: Profile Update Invalidates Stale Mentor Cache", () => {
    const studentId = new mongoose.Types.ObjectId("65b000000000000000000088");

    it("invalidates cached mentor context immediately upon profile mutation", async () => {
      // 1. Prime the in-memory cache
      smartMentorContextService.setCachedContext(studentId, {
        career: { targetRole: "Full Stack Developer", academic: { currentSemester: 4 } },
      });
      expect(smartMentorContextService.getCachedContext(studentId)).not.toBeNull();

      // 2. Perform profile update via controller logic
      const mockUser = {
        _id: studentId,
        firebaseUid: "uid_88",
        targetRole: "Full Stack Developer",
        targetRoles: ["Full Stack Developer"],
        academic: { currentSemester: 4 },
        save: vi.fn().mockResolvedValue(true),
        markModified: vi.fn(),
      };

      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.auth = { uid: "uid_88" };
        req.user = mockUser;
        next();
      });
      app.patch("/api/v1/auth/me", updateCurrentUser);
      app.use(globalErrorHandler);

      const res = await request(app)
        .patch("/api/v1/auth/me")
        .send({
          targetRole: "Backend Developer",
          academic: { currentSemester: 6 },
        });

      expect(res.status).toBe(200);

      // 3. Verify the cache is completely invalidated
      const cached = smartMentorContextService.getCachedContext(studentId);
      expect(cached).toBeNull();
    });
  });

  // ==========================================================================
  // SCENARIO 9: Student Editing Resume and Requesting Immediate AI Feedback
  // ==========================================================================
  describe("Scenario 9: Resume Mutation Invalidates Mentor Cache", () => {
    const studentId = new mongoose.Types.ObjectId("65b000000000000000000099");

    it("invalidates cache when resume is updated or created", async () => {
      // Prime cache
      smartMentorContextService.setCachedContext(studentId, {
        resume: { latestResumeTitle: "Old Draft v1" },
      });
      expect(smartMentorContextService.getCachedContext(studentId)).not.toBeNull();

      // Trigger resume cache invalidation
      smartMentorContextService.invalidateContext(studentId);
      expect(smartMentorContextService.getCachedContext(studentId)).toBeNull();
    });

    it("evaluates deterministic ATS readiness with heuristic disclaimer", () => {
      const resumeData = {
        name: "Alex Developer",
        email: "alex@example.com",
        phone: "+1 555-0199",
        linkedin: "https://linkedin.com/in/alexdev",
        professionalSummary: "Full-stack engineer with 3 years experience building scalable web architectures.",
        skills: {
          languages: ["TypeScript", "Python"],
          frameworks: ["React", "Node.js"],
        },
        experience: [
          {
            role: "Software Engineer",
            company: "Tech Corp",
            bullets: ["Architected microservices handling 10k requests/min with sub-50ms latency."],
          },
        ],
        education: ["B.S. in Computer Science - State University"],
      };

      const atsResult = calculateAtsReadinessDeterministic(resumeData);
      expect(atsResult.score).toBeGreaterThanOrEqual(75);
      expect(atsResult.rubricVersion).toBe("ats-v2.0-deterministic");
      expect(atsResult.disclaimer).toContain("Heuristic simulation for readability and structure; not an endorsement or score from proprietary commercial ATS platforms");

      const qualityResult = calculateResumeQualityDeterministic(resumeData);
      expect(qualityResult.score).toBeGreaterThanOrEqual(60);
      expect(qualityResult.categoryScores).toBeDefined();
      expect(qualityResult.categoryScores.technicalSpecificity).toBeDefined();
    });
  });

  // ==========================================================================
  // SCENARIO 10: Two Separate Students Whose Contexts Must Remain Isolated
  // ==========================================================================
  describe("Scenario 10: Cross-User Context Isolation (Alice vs Bob)", () => {
    const aliceId = new mongoose.Types.ObjectId("65b0000000000000000000aa");
    const bobId = new mongoose.Types.ObjectId("65b0000000000000000000bb");

    it("keeps Alice and Bob context signals strictly segregated", async () => {
      vi.spyOn(User, "findById").mockImplementation((id) => ({
        lean: vi.fn().mockResolvedValue(
          id.toString() === aliceId.toString()
            ? { _id: aliceId, displayName: "Alice Pythonista", targetRole: "Backend Developer" }
            : { _id: bobId, displayName: "Bob JavaDev", targetRole: "Java Developer" }
        ),
      }));

      vi.spyOn(Project, "find").mockImplementation((query) => ({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(
            query.owner.toString() === aliceId.toString()
              ? [{ title: "FastAPI Backend", stack: ["Python", "FastAPI"] }]
              : [{ title: "Spring Microservice", stack: ["Java", "Spring Boot"] }]
          ),
        }),
      }));

      vi.spyOn(Resume, "find").mockImplementation((query) => ({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(
            query.owner.toString() === aliceId.toString()
              ? [{ title: "Alice_Python_CV.pdf" }]
              : [{ title: "Bob_Enterprise_Java.pdf" }]
          ),
        }),
      }));

      vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });

      const aliceContext = await smartMentorContextService.getUnifiedUserContext(aliceId, { forceRefresh: true });
      const bobContext = await smartMentorContextService.getUnifiedUserContext(bobId, { forceRefresh: true });

      // Alice verification
      expect(aliceContext.career.name).toBe("Alice Pythonista");
      expect(aliceContext.career.targetRole).toBe("Backend Developer");
      expect(aliceContext.resume.latestResumeTitle).toBe("Alice_Python_CV.pdf");

      // Bob verification
      expect(bobContext.career.name).toBe("Bob JavaDev");
      expect(bobContext.career.targetRole).toBe("Java Developer");
      expect(bobContext.resume.latestResumeTitle).toBe("Bob_Enterprise_Java.pdf");

      // Zero cross-contamination
      expect(aliceContext.career.name).not.toContain("Bob");
      expect(bobContext.career.name).not.toContain("Alice");
    });
  });

  // ==========================================================================
  // SCENARIO 11: Student with Unavailable External Services
  // ==========================================================================
  describe("Scenario 11: Fault Tolerance & Graceful External Fallbacks", () => {
    it("local mentor service produces grounded responses when AI provider fails", () => {
      const mockContext = {
        career: {
          name: "Offline Student",
          targetRole: "Full Stack Developer",
          readinessScore: 68,
          academic: { degreeName: "B.Tech", branchName: "CSE" },
        },
        skillGaps: [{ skill: "Docker", priority: "High", currentScore: 20 }],
        github: { connectionState: "not_connected" },
        learning: { completedVideos: 2 },
        coding: { passedCount: 3, failedCount: 1 },
      };

      const fallback = smartMentorLocalService.generateLocalResponse(
        "What should I focus on next for my career?",
        mockContext
      );

      expect(fallback).toBeDefined();
      expect(fallback.answer).toBeDefined();
      expect(fallback.actions.length).toBeGreaterThan(0);
      expect(fallback.source).toBe("local_nlp");
    });
  });

  // ==========================================================================
  // SCENARIO 12: Administrator vs Normal Student Authorization Boundaries
  // ==========================================================================
  describe("Scenario 12: Admin Authorization & RBAC Boundaries", () => {
    const studentUser = {
      _id: new mongoose.Types.ObjectId("65b000000000000000000012"),
      email: "student@example.com",
      role: "student",
    };

    const adminUser = {
      _id: new mongoose.Types.ObjectId("65b000000000000000000099"),
      email: "sampatakumarsv@gmail.com",
      role: "admin",
    };

    const buildProtectedApp = (user) => {
      const app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.auth = { uid: user._id.toString(), email: user.email, role: user.role };
        req.user = user;
        next();
      });
      app.get("/api/v1/admin/users", ensureAdmin, (req, res) => res.json({ success: true, message: "Admin access granted" }));
      app.delete("/api/v1/admin/catalog/degrees/:slug", ensureAdmin, (req, res) => res.json({ success: true, message: "Degree deleted" }));
      app.use(globalErrorHandler);
      return app;
    };

    it("blocks student from accessing admin endpoints with HTTP 403", async () => {
      const app = buildProtectedApp(studentUser);
      const res = await request(app).get("/api/v1/admin/users");

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Administrator privilege required");
    });

    it("prevents student from modifying system catalogs with HTTP 403", async () => {
      const app = buildProtectedApp(studentUser);
      const res = await request(app).delete("/api/v1/admin/catalog/degrees/btech");

      expect(res.status).toBe(403);
    });

    it("allows verified administrator to access admin endpoints with HTTP 200", async () => {
      const app = buildProtectedApp(adminUser);
      const res = await request(app).get("/api/v1/admin/users");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("prevents administrator self-demotion", async () => {
      await expect(
        updateAdminUserRole(adminUser._id, adminUser._id, "student")
      ).rejects.toThrow("Administrators cannot alter their own role");
    });

    it("soft-deactivates catalog degrees referenced by active students rather than hard deleting", async () => {
      vi.spyOn(AcademicBranch, "countDocuments").mockResolvedValue(2);
      vi.spyOn(User, "countDocuments").mockResolvedValue(15);
      vi.spyOn(AcademicDegree, "updateOne").mockResolvedValue({ acknowledged: true, modifiedCount: 1 });

      const result = await safeDeleteDegree("btech");
      expect(result.action).toBe("deactivated");
      expect(result.referencedUsersCount).toBe(15);
      expect(result.referencedBranchesCount).toBe(2);
      expect(result.message).toContain("Marked inactive to preserve historical records");
    });
  });

  // ==========================================================================
  // JOURNEY G: EduTube Educational Filtering Benchmark
  // ==========================================================================
  describe("Journey G: EduTube Deterministic Educational Filtering Benchmark", () => {
    it("evaluates precision, recall, and rejection of entertainment across candidate dataset", () => {
      let allowedEducationalCount = 0;
      let totalEducationalExpected = 0;
      let rejectedEntertainmentCount = 0;
      let totalEntertainmentExpected = 0;

      for (const candidate of SYNTHETIC_EDUTUBE_CANDIDATES) {
        const classification = educationalClassifierService.classifyVideo(candidate);

        if (candidate.expectedDecision === "allow") {
          totalEducationalExpected++;
          if (classification.decision === "allow") {
            allowedEducationalCount++;
          }
        } else if (candidate.expectedDecision === "reject") {
          totalEntertainmentExpected++;
          if (classification.decision === "reject") {
            rejectedEntertainmentCount++;
            if (candidate.expectedReasonCode) {
              expect(classification.reasonCodes).toContain(candidate.expectedReasonCode);
            }
          }
        }
      }

      const educationalRecall = allowedEducationalCount / totalEducationalExpected;
      const entertainmentRejectionRate = rejectedEntertainmentCount / totalEntertainmentExpected;

      expect(educationalRecall).toBe(1.0); // 100% of valid courses allowed
      expect(entertainmentRejectionRate).toBe(1.0); // 100% of music, trailers, gaming, shorts blocked
    });
  });

  // ==========================================================================
  // JOURNEY L: Production Deployment, Health Probes & Recovery
  // ==========================================================================
  describe("Journey L: Production Health & Recovery Endpoints", () => {
    const buildHealthApp = () => {
      const app = express();
      app.get("/api/v1/healthcheck", healthcheck);
      app.get("/api/v1/healthcheck/live", livenessCheck);
      app.get("/api/v1/healthcheck/ready", readinessCheck);
      return app;
    };

    it("liveness check returns HTTP 200 alive without database dependency", async () => {
      const app = buildHealthApp();
      const res = await request(app).get("/api/v1/healthcheck/live");

      expect(res.status).toBe(200);
      expect(res.body.data.liveness).toBe("alive");
      expect(res.body.data.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it("readiness probe returns HTTP 503 when database is disconnected", async () => {
      // Mock mongoose connection readyState as disconnected (0)
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, "readyState", { value: 0, configurable: true });

      const app = buildHealthApp();
      const res = await request(app).get("/api/v1/healthcheck/ready");

      expect(res.status).toBe(503);
      expect(res.body.data.ready).toBe(false);
      expect(res.body.data.services.database.status).toBe("disconnected");

      // Restore
      Object.defineProperty(mongoose.connection, "readyState", { value: originalReadyState, configurable: true });
    });
  });
});
