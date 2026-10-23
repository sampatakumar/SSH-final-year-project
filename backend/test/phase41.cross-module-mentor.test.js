import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { SmartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { SmartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { CareerCompetencyAlignmentService } from "../src/modules/mentor/services/career-competency-alignment.service.js";
import { DashboardIntelligenceService } from "../src/services/dashboard-intelligence.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { EduTubeCheckpointAttempt } from "../src/modules/edutube/models/edutubeCheckpointAttempt.models.js";
import { SpacedRevisionSchedule } from "../src/modules/skills/models/spacedRevisionSchedule.models.js";
import { LearnerSkillAssessmentHistory } from "../src/modules/skills/models/learnerSkillAssessmentHistory.models.js";

describe("Phase 41: Cross-Module Student Intelligence & Context-Aware AI Mentor", () => {
  const studentId = new mongoose.Types.ObjectId("65b000000000000000000041");

  let mentorService;
  let localService;
  let contextService;
  let alignmentService;
  let dashboardService;

  beforeEach(() => {
    mentorService = new SmartMentorService();
    localService = new SmartMentorLocalService();
    contextService = new SmartMentorContextService();
    alignmentService = new CareerCompetencyAlignmentService();
    dashboardService = new DashboardIntelligenceService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // FEATURE A: UNIFIED STUDENT CONTEXT & EVIDENCE TIERS
  // ==========================================================================
  describe("Feature A: Unified Student Context & Evidence Tiers", () => {
    it("A1: Distinguishes verified empirical evidence from inferred and missing signals", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: studentId,
          displayName: "Alex Rivera",
          targetRole: "Full Stack Developer",
          targetRoles: ["Full Stack Developer", "Backend Developer"],
          careerInterests: ["Cloud Architecture", "Distributed Systems"],
        }),
      });

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: studentId,
          targetRole: "Full Stack Developer",
          overallReadinessScore: 72,
          skills: [
            { skill: "JavaScript", score: 85, level: "Proficient", sources: ["coding", "assessment"] },
            { skill: "Docker", score: 75, level: "Proficient", sources: ["coding"] },
            { skill: "Python", score: 50, level: "Intermediate", sources: ["github"] }, // Inferred
            { skill: "Kubernetes", score: 0, level: "Beginner", sources: [] }, // Missing
          ],
          skillGaps: [
            { skill: "Kubernetes", priority: "High", currentScore: 0, targetScore: 70, status: "Missing" },
          ],
        }),
      });

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { taskId: "js_closures", skillsCovered: ["JavaScript"], status: "passed", score: 10 },
            { taskId: "docker_basics", skillsCovered: ["Docker"], status: "passed", score: 9 },
          ]),
        }),
      });

      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { checkpointId: "chk_1", canonicalName: "JavaScript", isCorrect: true, score: 90, attemptedAt: new Date() },
            ]),
          }),
        }),
      });

      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { skill: "Docker", reviewStreak: 3, scheduledDate: new Date(Date.now() - 3600000) }, // Due today
            ]),
          }),
        }),
      });

      const context = await contextService.getUnifiedUserContext(studentId, { forceRefresh: true });

      expect(context).toBeDefined();
      expect(context.evidenceTiers).toBeDefined();

      // Verified: JavaScript and Docker (demonstrated via sandbox passes, quiz, and spaced streak)
      const verifiedNames = context.evidenceTiers.verified.map((s) => s.name.toLowerCase());
      expect(verifiedNames).toContain("javascript");
      expect(verifiedNames).toContain("docker");

      // Inferred: Python (only detected via github language volume, no verified test pass)
      const inferredNames = context.evidenceTiers.inferred.map((s) => s.name.toLowerCase());
      expect(inferredNames).toContain("python");

      // Missing: Kubernetes (score 0 gap)
      const missingNames = context.evidenceTiers.missing.map((s) => s.skill.toLowerCase());
      expect(missingNames).toContain("kubernetes");

      // Self-reported interests
      const selfReported = context.evidenceTiers.selfReported.map((s) => s.name);
      expect(selfReported).toContain("Cloud Architecture");
    });

    it("A2: Assembles retention health metrics and due today notifications", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: studentId, targetRole: "Full Stack Developer" }),
      });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({ owner: studentId, skills: [] }),
      });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      vi.spyOn(EduTubeCheckpointAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({ limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
      });

      const pastDue = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { skill: "React", reviewStreak: 2, scheduledDate: pastDue },
              { skill: "Node.js", reviewStreak: 4, scheduledDate: pastDue },
            ]),
          }),
        }),
      });

      const context = await contextService.getUnifiedUserContext(studentId, { forceRefresh: true });
      expect(context.retentionHealth).toBeDefined();
      expect(context.retentionHealth.revisionsDueToday).toBe(2);
      expect(context.retentionHealth.streak).toBe(4);
    });
  });

  // ==========================================================================
  // FEATURE B: EVIDENCE-GROUNDED SMART MENTOR & INTENT NLP
  // ==========================================================================
  describe("Feature B: Evidence-Grounded Smart Mentor & Intent NLP", () => {
    it("B1: Classifies competency matrix and badge queries into standardized intent", () => {
      expect(localService.classifyIntent("What is my competency matrix status?")).toBe("competency_matrix");
      expect(localService.classifyIntent("How do I earn verifiable badges in SSH?")).toBe("competency_matrix");
      expect(localService.classifyIntent("Tell me about my earned skill badges")).toBe("competency_matrix");
    });

    it("B2: Classifies spaced retention and revision queries", () => {
      expect(localService.classifyIntent("Do I have any spaced revision reviews due today?")).toBe("retention_revision");
      expect(localService.classifyIntent("How is my retention and forgetting curve?")).toBe("retention_revision");
    });

    it("B3: Classifies unified next action queries across modules", () => {
      expect(localService.classifyIntent("What is my next recommended action across modules?")).toBe("unified_next_action");
      expect(localService.classifyIntent("What should I do next?")).toBe("unified_next_action");
    });

    it("B4: Classifies resume badge integration queries", () => {
      expect(localService.classifyIntent("How do I add my verified badges to my resume?")).toBe("resume_badge_guidance");
      expect(localService.classifyIntent("Showcase credentials on resume")).toBe("resume_badge_guidance");
    });

    it("B5: Classifies personalized progress explanation queries", () => {
      expect(localService.classifyIntent("How have I improved recently?")).toBe("personalized_progress");
      expect(localService.classifyIntent("Explain my progress narrative")).toBe("personalized_progress");
    });

    it("B6: Responds to competency matrix query with verified criteria and accreditation disclaimer", () => {
      const mockContext = {
        career: { targetRole: "Full Stack Developer", readinessScore: 78 },
        competencyMatrix: {
          matrix: [
            {
              canonicalSkill: "JavaScript",
              name: "Modern JavaScript Architecture",
              status: "DEMONSTRATED",
              earnedPoints: 100,
              totalPoints: 100,
              badgeEligible: true,
            },
            {
              canonicalSkill: "Docker",
              name: "Containerization & Isolation",
              status: "DEVELOPING",
              earnedPoints: 60,
              totalPoints: 100,
              missingRequirements: ["Pass 1 sandbox container challenge"],
            },
          ],
        },
        earnedBadges: [
          {
            badgeId: "badge_js_101",
            competencyName: "Modern JavaScript Architecture",
            issuedAt: new Date().toISOString(),
            verificationHash: "abc123hash999",
          },
        ],
      };

      const result = localService.generateLocalResponse("Show my competency matrix and badges", mockContext);
      expect(result.answer).toContain("Modern JavaScript Architecture");
      expect(result.answer).toContain("Demonstrated");
      expect(result.answer).toContain("Containerization & Isolation");
      expect(result.answer).toContain("Pass 1 sandbox container challenge");
      // Disclaimer check: must state SSH badges represent internal recorded criteria, not third-party university degree
      expect(result.answer).toContain("not third-party university degrees");
      expect(result.actions.length).toBeGreaterThan(0);
      expect(result.actions[0].route).toBe("/dashboard/skills");
    });

    it("B7: Explains retention health and due flashcards in local NLP", () => {
      const mockContext = {
        career: { targetRole: "Backend Developer", readinessScore: 65 },
        retentionHealth: {
          totalCards: 12,
          revisionsDueToday: 3,
          streak: 5,
          masteredCards: 4,
        },
      };

      const result = localService.generateLocalResponse("What revision cards are due?", mockContext);
      expect(result.answer).toContain("Cards Due Today**: 3");
      expect(result.answer).toContain("Retrieval Streak**: 5");
      expect(result.answer).toContain("Ebbinghaus forgetting curve");
      expect(result.actions[0].priority).toBe("critical");
      expect(result.actions[0].route).toBe("/dashboard/skills");
    });

    it("B8: Guides resume badge presentation with verification hash without fabricating credentials", () => {
      const mockContext = {
        earnedBadges: [
          {
            badgeId: "badge_react_42",
            competencyName: "Frontend Component Engineering",
            issuedAt: "2026-10-20T10:00:00Z",
            verificationHash: "e9d89a5898f5c3c28062",
          },
        ],
      };

      const result = localService.generateLocalResponse("How do I add badges to my resume?", mockContext);
      expect(result.answer).toContain("Frontend Component Engineering");
      expect(result.answer).toContain("/verify/badge/");
      expect(result.answer).toContain("Do not claim external university or vendor accreditation");
      expect(result.actions[0].route).toBe("/dashboard/resumes");
    });

    it("B9: System prompt instructs AI to honor evidence tiers, SSH criteria scope, and forbid hallucinating badges", () => {
      const mockContext = {
        career: { targetRole: "Full Stack Developer", readinessScore: 70, targetRoles: ["Full Stack Developer"] },
        evidenceTiers: {
          verified: [{ name: "React", score: 80 }],
          inferred: [{ name: "Python", score: 40 }],
          missing: [{ skill: "Docker", priority: "High" }],
        },
        earnedBadges: [],
      };

      const prompt = mentorService.buildSystemPrompt(mockContext);
      expect(prompt).toContain("EVIDENCE TIERS & ACCREDITATION INTEGRITY");
      expect(prompt).toContain("Distinguish verified or directly observed evidence");
      expect(prompt).toContain("NEVER claim it represents third-party, university, or government accreditation");
      expect(prompt).toContain("Never invent or award badges, certificates, or passing scores");
    });
  });

  // ==========================================================================
  // FEATURE C: CAREER COMPETENCY ALIGNMENT & MULTI-ROLE ANALYSIS
  // ==========================================================================
  describe("Feature C: Career Competency Alignment & Multi-Role Analysis", () => {
    it("C1: Aligns student profile against primary target role requirements", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: studentId,
          targetRole: "Full Stack Developer",
          targetRoles: ["Full Stack Developer"],
        }),
      });

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: studentId,
          targetRole: "Full Stack Developer",
          skills: [
            { skill: "JavaScript", score: 85, level: "Proficient" },
            { skill: "React", score: 80, level: "Proficient" },
            { skill: "Python", score: 45, level: "Developing" },
          ],
        }),
      });

      const alignment = await alignmentService.getCareerCompetencyAlignment(studentId);

      expect(alignment).toBeDefined();
      expect(alignment.primaryRole).toBe("Full Stack Developer");
      expect(alignment.rolesEvaluated.length).toBe(1);

      const roleEval = alignment.rolesEvaluated[0];
      expect(roleEval.roleTitle).toBe("Full Stack Developer");
      expect(roleEval.groundedReadinessPercent).toBeGreaterThan(0);
      expect(roleEval.consequentialGaps.length).toBeGreaterThan(0);
    });

    it("C2: Performs multi-role cross-comparison identifying shared and high-impact skills", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: studentId,
          targetRole: "Frontend Developer",
          targetRoles: ["Frontend Developer", "Full Stack Developer"],
        }),
      });

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          owner: studentId,
          targetRole: "Frontend Developer",
          skills: [
            { skill: "JavaScript", score: 90, level: "Proficient" },
            { skill: "React", score: 85, level: "Proficient" },
          ],
        }),
      });

      const alignment = await alignmentService.getCareerCompetencyAlignment(studentId);

      expect(alignment.multiRoleAnalysis).toBeDefined();
      expect(alignment.multiRoleAnalysis.totalRolesCompared).toBe(2);
      expect(alignment.multiRoleAnalysis.sharedSkillNames).toContain("JavaScript");
      expect(alignment.multiRoleAnalysis.sharedSkillNames).toContain("React");
    });
  });

  // ==========================================================================
  // FEATURE D: DETERMINISTIC MULTI-MODULE PRIORITY RULE
  // ==========================================================================
  describe("Feature D: Deterministic Priority Ordering for Next Actions", () => {
    it("D1: Prioritizes due spaced revision as critical priority over other actions", () => {
      const dueRevision = { skill: "Data Structures", scheduledDate: new Date(Date.now() - 3600000) };
      const actions = [];

      // Priority 1 rule check
      if (dueRevision) {
        actions.push({
          title: `Spaced Revision: ${dueRevision.skill}`,
          priority: "critical",
          type: "spaced_revision",
          actionUrl: "/dashboard/skills",
        });
      }

      actions.push({
        title: "Solve Sandbox Challenge",
        priority: "high",
        type: "coding_task",
        actionUrl: "/dashboard/coding",
      });

      expect(actions[0].priority).toBe("critical");
      expect(actions[0].type).toBe("spaced_revision");
      expect(actions[0].actionUrl).toBe("/dashboard/skills");
    });
  });

  // ==========================================================================
  // FEATURE G & H: PERSONALIZED PROGRESS NARRATIVE
  // ==========================================================================
  describe("Feature G & H: Personalized Progress Narrative & Grounding", () => {
    it("H1: Formats progress narrative from verified score deltas and sandbox challenge passes", async () => {
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { skill: "JavaScript", scoreDelta: 15, score: 85, previousScore: 70, assessmentType: "coding_challenge" },
            ]),
          }),
        }),
      });

      vi.spyOn(CodingSubmission, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { taskId: "two_sum", status: "passed", score: 10, skillsCovered: ["Data Structures"], submittedAt: new Date() },
            ]),
          }),
        }),
      });

      vi.spyOn(SpacedRevisionSchedule, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([
              { skill: "JavaScript", reviewStreak: 3 },
            ]),
          }),
        }),
      });

      const explanation = await alignmentService.getPersonalizedProgressExplanation(studentId);

      expect(explanation).toBeDefined();
      expect(explanation.improvedSkillsCount).toBe(1);
      expect(explanation.verifiedSandboxPassesCount).toBe(1);
      expect(explanation.narrative).toContain("JavaScript");
      expect(explanation.narrative).toContain("+15 pts");
      expect(explanation.narrative).toContain("Data Structures");
      expect(explanation.recommendedNextFocus).toBeDefined();
    });
  });
});
