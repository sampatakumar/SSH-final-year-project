/**
 * ============================================================================
 * PHASE 23: AI ACCURACY, EVALUATION & EVIDENCE INTEGRITY TEST SUITE
 * ============================================================================
 *
 * Automated evaluation suite validating AI accuracy, evidence provenance,
 * career intelligence scoring, adaptive progress loops, ATS explainability,
 * and educational classification using the version-controlled synthetic dataset.
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";

import {
  SYNTHETIC_STUDENT_PROFILES,
  SYNTHETIC_EDUTUBE_CANDIDATES,
} from "./fixtures/syntheticEvaluationDataset.js";

import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { buildCareerMentorPlan } from "../src/modules/github/services/githubCareer.service.js";
import {
  analyzeSkillGaps,
  compareRoles,
  resolveRoleBenchmark,
  ROLE_ALIAS_MAP,
} from "../src/modules/gaps/services/skillGap.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { adaptiveLearningPlanService } from "../src/modules/recommendations/services/adaptiveLearningPlan.service.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { adaptiveSkillLoopService, SKILL_PREREQUISITE_GRAPH } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import {
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
} from "../src/modules/resume/services/resumeIntelligence.service.js";
import {
  educationalClassifierService,
  CLASSIFIER_REASON_CODES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";

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

describe("Phase 23: AI Accuracy, Evidence Integrity & Recommendation Evaluation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. SYNTHETIC PROFILES EVALUATION (Profiles 1 - 12)
  // =========================================================================
  describe("1. Synthetic Profiles Evaluation (Profiles 1 - 12)", () => {
    it("Profile 1 (Beginner): identifies sparse coverage and prevents academic hallucination", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.beginner_minimal_evidence;
      const gaps = analyzeSkillGaps(p.evaluatedSkills, p.targetRole);

      expect(gaps.evidenceCoverage).toBe("sparse");
      expect(gaps.roleMatchPercentage).toBe(0);
      expect(gaps.evidenceNotice).toContain("sparse available profile evidence");
      expect(gaps.gaps.length).toBeGreaterThan(0);
      expect(gaps.gaps[0].priority).toBe("Critical");

      const mentorService = new SmartMentorService();
      const prompt = mentorService.buildSystemPrompt({
        user: { name: p.displayName },
        career: { targetRole: p.targetRole, academic: p.academic },
        skills: [],
        skillGaps: gaps.gaps,
        github: { repositoryCount: 0 },
      });
      expect(prompt).toContain("NEVER invent, assume, or fabricate an engineering branch, college, degree, or semester");
    });

    it("Profile 2 (Strong JS): extracts high-confidence evidence with full provenance & limitations", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.strong_javascript_developer;
      const evidence = extractGitHubEvidence({ userId: p.id, githubData: p.github });

      expect(evidence.skills.length).toBeGreaterThan(0);
      const jsSkill = evidence.skills.find((s) => s.canonicalName === "JavaScript");
      expect(jsSkill).toBeDefined();
      expect(jsSkill.confidence).toBeGreaterThanOrEqual(0.75);
      expect(jsSkill.signals.evidenceCategory).toBe("observed_evidence");
      expect(jsSkill.signals.provenance).toBeDefined();
      expect(jsSkill.signals.provenance.source).toBe("github");
      expect(jsSkill.signals.provenance.originalReposCount).toBe(2);
      expect(jsSkill.signals.limitations).toContain("Primary language presence demonstrates usage volume");

      const careerPlan = buildCareerMentorPlan({ githubData: p.github, targetRole: p.targetRole });
      expect(careerPlan.hero.strongestArea).toContain("JavaScript");
      expect(careerPlan.readinessDimensions.find((d) => d.dimension === "Frontend Engineering").status).toBe("Strong");
    });

    it("Profile 3 (Strong Python): verifies backend and containerization signals", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.strong_python_engineer;
      const careerPlan = buildCareerMentorPlan({ githubData: p.github, targetRole: p.targetRole });

      expect(careerPlan.readinessDimensions.find((d) => d.dimension === "Backend Engineering").status).toBe("Developing");
      expect(careerPlan.readinessDimensions.find((d) => d.dimension === "DevOps & Cloud (Docker / CI)").status).toBe("Developing");
      expect(careerPlan.hero.strongestArea).toContain("Backend");
    });

    it("Profile 4 (Incomplete GitHub): guides student to create public code repositories", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.incomplete_github_profile;
      const careerPlan = buildCareerMentorPlan({ githubData: p.github, targetRole: p.targetRole });

      expect(careerPlan.hasInsufficientData).toBe(true);
      expect(careerPlan.hero.strongestArea).toBe("Needs Repository Evidence");
      expect(careerPlan.hero.nextPriority).toContain("Publish your first original code project");
    });

    it("Profile 5 (Private Repos): surfaces sync failure and inaccessible data status", async () => {
      const p = SYNTHETIC_STUDENT_PROFILES.private_inaccessible_repos;

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: p.id, displayName: p.displayName, targetRole: p.targetRole }),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          githubIntegration: { connected: true, syncStatus: "failed", syncError: p.github.syncError },
        }),
      });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      });
      vi.spyOn(Project, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(Resume, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }) });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });

      smartMentorContextService.invalidateContext(p.id);
      const context = await smartMentorContextService.getUnifiedUserContext(p.id);

      expect(context.github.connectionState).toBe("sync_failed");
      expect(context.github.connectionMessage).toContain("latest synchronization failed");
    });

    it("Profile 6 (Resume-GitHub Conflict): detects stack divergence and unsupported claims", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.resume_conflicting_github;
      const careerPlan = buildCareerMentorPlan({
        githubData: p.github,
        resumeData: p.resume,
        targetRole: p.targetRole,
      });

      expect(careerPlan.crossSourceEvidence).toBeDefined();
      expect(careerPlan.crossSourceEvidence.hasConflictingEvidence).toBe(true);
      expect(careerPlan.crossSourceEvidence.unsupportedClaims).toContain("Go");
      expect(careerPlan.crossSourceEvidence.unsupportedClaims).toContain("Rust");
      expect(careerPlan.crossSourceEvidence.conflicts[0].type).toBe("stack_divergence");
    });

    it("Profile 7 (Multi-Role Aspirant): compares roles accurately without cross-user contamination", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.multi_role_aspirant;
      const comparison = compareRoles(p.evaluatedSkills, p.targetRoles);

      expect(comparison.rolesCount).toBe(2);
      expect(comparison.comparedRoles).toContain("Frontend Developer");
      expect(comparison.comparedRoles).toContain("DevOps Engineer");
      expect(comparison.rolesSummary.length).toBe(2);
      expect(Array.isArray(comparison.highLeverageSkills)).toBe(true);
    });

    it("Profile 8 (Benchmark Pending): returns benchmark_pending for uncatalogued emerging roles", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.benchmark_pending_role;
      const gaps = analyzeSkillGaps(p.evaluatedSkills, p.targetRole);

      expect(gaps.benchmarkPending).toBe(true);
      expect(gaps.benchmarkStatus).toBe("unknown_role");
      expect(gaps.roleMatchPercentage).toBeNull();
    });

    it("Profile 9 (Learning vs Competency): video watching does not grant competency", async () => {
      const p = SYNTHETIC_STUDENT_PROFILES.completed_learning_weak_assessment;

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: p.id,
          targetRole: p.targetRole,
          skills: p.evaluatedSkills,
        }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(p.learningActivities) }),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
        }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(p.id, p.targetRole);
      const reactAction = plan.actions.find((a) => a.canonicalName === "React");

      expect(reactAction).toBeDefined();
      expect(reactAction.actionType).toBe("practice_validation");
      expect(reactAction.isDemonstratedCompetency).toBe(false);
      expect(reactAction.reasoning).toContain("Watching lessons provides conceptual understanding, but competency requires empirical proof");
    });

    it("Profile 10 (Failed/Interrupted Coding): handles repeated failures with targeted remediation", async () => {
      const p = SYNTHETIC_STUDENT_PROFILES.failed_interrupted_coding;

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: p.id,
          targetRole: p.targetRole,
          skills: p.evaluatedSkills,
        }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(p.learningActivities) }),
        }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(p.codingSubmissions) }),
        }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(p.id, p.targetRole);
      const nodeAction = plan.actions.find((a) => a.canonicalName === "Node.js");

      expect(nodeAction).toBeDefined();
      expect(nodeAction.actionType).toBe("targeted_remediation");
      expect(nodeAction.isDemonstratedCompetency).toBe(false);
      expect(nodeAction.failureCount).toBeGreaterThanOrEqual(2);
    });

    it("Profile 11 (Sparse Evidence): distinguishes missing evidence from demonstrated weakness", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.sparse_contradictory_evidence;
      const gaps = analyzeSkillGaps(p.evaluatedSkills, p.targetRole);

      expect(gaps.evidenceCoverage).toBe("sparse");
      expect(gaps.evidenceNotice).toContain("reflects evidence coverage rather than definitive lack of competence");
      const missingGap = gaps.gaps.find((g) => g.status === "Missing");
      expect(missingGap.evidenceState).toBe("missing_evidence");
    });

    it("Profile 12 (Stale Cache Mutation): invalidates cache deterministically on profile updates", async () => {
      const p = SYNTHETIC_STUDENT_PROFILES.stale_cache_profile_mutation;

      let currentRole = p.initialRole;
      vi.spyOn(User, "findById").mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue({
          _id: p.id,
          displayName: p.displayName,
          targetRole: currentRole,
        }),
      }));
      vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
      });
      vi.spyOn(Project, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(Resume, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }) });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });

      smartMentorContextService.invalidateContext(p.id);
      const initialContext = await smartMentorContextService.getUnifiedUserContext(p.id);
      expect(initialContext.career.targetRole).toBe("Frontend Developer");

      // Mutate role to Backend Developer
      currentRole = p.updatedRole;
      smartMentorContextService.invalidateContext(p.id);

      const refreshedContext = await smartMentorContextService.getUnifiedUserContext(p.id);
      expect(refreshedContext.career.targetRole).toBe("Backend Developer");
    });
  });

  // =========================================================================
  // 2. MEASURED EVALUATION METRICS (Metrics 1 - 10)
  // =========================================================================
  describe("2. Measured Evaluation Metrics (Metrics 1 - 10)", () => {
    it("Metric 1: Role-Resolution Accuracy = 100% across known aliases and canonical titles", () => {
      const aliasTestCases = Object.entries(ROLE_ALIAS_MAP);
      let passedResolutions = 0;

      for (const [alias, expectedCanonical] of aliasTestCases) {
        const resolved = resolveRoleBenchmark(alias);
        if (resolved && resolved.roleName === expectedCanonical) {
          passedResolutions++;
        }
      }

      const accuracy = (passedResolutions / aliasTestCases.length) * 100;
      expect(accuracy).toBe(100);
    });

    it("Metric 2: Prerequisite Violation Rate = 0.0% in generated roadmaps", async () => {
      const aliceId = new mongoose.Types.ObjectId();
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: aliceId,
          targetRole: "Full Stack Developer",
          skills: [{ skill: "HTML/CSS", score: 40 }],
        }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(aliceId, "Full Stack Developer");
      const actionOrder = plan.actions.map((a) => a.skill);

      let violations = 0;
      for (let i = 0; i < actionOrder.length; i++) {
        const currentSkill = actionOrder[i];
        const prereqs = SKILL_PREREQUISITE_GRAPH[currentSkill]?.prerequisites || [];

        for (const p of prereqs) {
          const prereqIndex = actionOrder.indexOf(p);
          // If prerequisite is also scheduled in the actions, it must appear BEFORE the current skill!
          if (prereqIndex !== -1 && prereqIndex > i) {
            violations++;
          }
        }
      }

      const violationRate = (violations / plan.actions.length) * 100;
      expect(violationRate).toBe(0);
    });

    it("Metric 3: Unsupported Benchmark Assignment Rate = 0.0%", () => {
      const unsupportedRoles = [
        "Aerospace Systems Architect",
        "Quantum Cryptography Engineer",
        "Subsea Robotics Technician",
        "Bioinformatics Genomic Modeler",
      ];

      let falseAssignments = 0;
      for (const r of unsupportedRoles) {
        const result = analyzeSkillGaps([], r);
        if (result.benchmarkStatus === "validated" || result.roleMatchPercentage !== null) {
          falseAssignments++;
        }
      }

      const unsupportedRate = (falseAssignments / unsupportedRoles.length) * 100;
      expect(unsupportedRate).toBe(0);
    });

    it("Metric 4: Evidence-Provenance Completeness = 100%", () => {
      const p = SYNTHETIC_STUDENT_PROFILES.strong_javascript_developer;
      const evidence = extractGitHubEvidence({ userId: p.id, githubData: p.github });

      let completeCount = 0;
      for (const s of evidence.skills) {
        if (
          s.signals?.provenance &&
          s.signals.provenance.source === "github" &&
          Array.isArray(s.signals.provenance.repositories) &&
          typeof s.signals.limitations === "string" &&
          s.signals.evidenceCategory
        ) {
          completeCount++;
        }
      }

      const completeness = (completeCount / evidence.skills.length) * 100;
      expect(completeness).toBe(100);
    });

    it("Metric 5: Stale-Context Error Rate = 0.0%", () => {
      const userId = new mongoose.Types.ObjectId();
      smartMentorContextService.setCachedContext(userId, { test: "cached" });

      expect(smartMentorContextService.getCachedContext(userId)).toBeDefined();
      smartMentorContextService.invalidateContext(userId);
      expect(smartMentorContextService.getCachedContext(userId)).toBeNull();
    });

    it("Metric 6: Duplicate Recommendation Rate = 0.0%", async () => {
      const userId = new mongoose.Types.ObjectId();
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({ owner: userId, skills: [] }),
      });
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });

      const plan = await adaptiveLearningPlanService.generateAdaptivePlan(userId, "Frontend Developer");
      const seenSkills = new Set();
      let duplicates = 0;

      for (const act of plan.actions) {
        if (seenSkills.has(act.canonicalName)) {
          duplicates++;
        }
        seenSkills.add(act.canonicalName);
      }

      expect(duplicates).toBe(0);
    });

    it("Metric 7: Invalid Competency-Update Rate = 0.0% for failed/timed-out tasks and video watching", async () => {
      const userId = new mongoose.Types.ObjectId();
      vi.spyOn(LearningActivityRecord, "findOne").mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
      vi.spyOn(LearningActivityRecord, "countDocuments").mockResolvedValue(0);
      vi.spyOn(LearningActivityRecord, "create").mockImplementation((data) =>
        Promise.resolve({ ...data, _id: new mongoose.Types.ObjectId() })
      );
      vi.spyOn(SkillProfile, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      // 1. Passive video watched -> isDemonstratedCompetency: false
      const videoRecord = await learningOutcomeTrackerService.recordActivity(userId, {
        activityType: "module_completed",
        skill: "React",
      });
      expect(videoRecord.activity.isDemonstratedCompetency).toBe(false);

      // 2. Failed coding execution -> isDemonstratedCompetency: false
      const failedCoding = await learningOutcomeTrackerService.recordActivity(userId, {
        activityType: "coding_failed",
        skill: "React",
      });
      expect(failedCoding.activity.isDemonstratedCompetency).toBe(false);
    });

    it("Metric 8: Cross-User Context Isolation = 100% (Zero cross-user data leakage)", () => {
      const userA = new mongoose.Types.ObjectId("65b0000000000000000000A1");
      const userB = new mongoose.Types.ObjectId("65b0000000000000000000B2");

      smartMentorContextService.setCachedContext(userA, { user: "User A Private Context" });
      smartMentorContextService.setCachedContext(userB, { user: "User B Private Context" });

      const cachedA = smartMentorContextService.getCachedContext(userA);
      const cachedB = smartMentorContextService.getCachedContext(userB);

      expect(cachedA.user).toBe("User A Private Context");
      expect(cachedB.user).toBe("User B Private Context");
      expect(cachedA.user).not.toBe(cachedB.user);
    });

    it("Metric 9: Resume Analysis Consistency = 100% deterministic across repeated calls", () => {
      const resume = {
        name: "Test Developer",
        email: "test@example.com",
        phone: "+1-555-0100",
        professionalSummary: "Experienced engineer building distributed web microservices in Node.js.",
        experience: [
          {
            role: "Software Engineer",
            company: "Tech Corp",
            bullets: ["Engineered RESTful APIs with Redis caching.", "Architected Docker container pipelines."],
          },
        ],
        projects: [
          {
            title: "API Gateway",
            description: "High-throughput reverse proxy handling 50k req/min.",
          },
        ],
        education: [{ degree: "B.Tech in Computer Science" }],
        skills: { languages: ["JavaScript", "Python"], frameworks: ["Express", "React"], tools: ["Docker"] },
      };

      const run1 = calculateAtsReadinessDeterministic(resume);
      const run2 = calculateAtsReadinessDeterministic(resume);

      expect(run1.score).toBe(run2.score);
      expect(run1.label).toBe(run2.label);
      expect(run1.passedCount).toBe(run2.passedCount);
      expect(run1.disclaimer).toBeDefined();

      const qual1 = calculateResumeQualityDeterministic(resume);
      const qual2 = calculateResumeQualityDeterministic(resume);

      expect(qual1.score).toBe(qual2.score);
      expect(qual1.categoryScores).toEqual(qual2.categoryScores);
      expect(qual1.disclaimer).toBeDefined();
    });

    it("Metric 10: EduTube Classification Performance: Precision = 100%, Recall = 100%, F1 = 1.00 on test corpus", () => {
      let truePositives = 0;
      let falsePositives = 0;
      let trueNegatives = 0;
      let falseNegatives = 0;

      for (const item of SYNTHETIC_EDUTUBE_CANDIDATES) {
        const result = educationalClassifierService.classifyVideo(item);
        const actualDecision = result.decision; // "allow" | "reject" | "review"
        const expectedDecision = item.expectedDecision; // "allow" | "reject"

        if (actualDecision === "allow" && expectedDecision === "allow") {
          truePositives++;
        } else if (actualDecision === "allow" && expectedDecision === "reject") {
          falsePositives++;
        } else if (actualDecision === "reject" && expectedDecision === "reject") {
          trueNegatives++;
        } else if (actualDecision === "reject" && expectedDecision === "allow") {
          falseNegatives++;
        }
      }

      const precision = truePositives / (truePositives + falsePositives);
      const recall = truePositives / (truePositives + falseNegatives);
      const f1 = (2 * precision * recall) / (precision + recall);

      expect(precision).toBe(1.0);
      expect(recall).toBe(1.0);
      expect(f1).toBe(1.0);
      expect(falsePositives).toBe(0);
    });
  });
});
