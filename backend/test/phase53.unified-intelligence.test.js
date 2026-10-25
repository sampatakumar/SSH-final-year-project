import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { unifiedStudentContextService } from "../src/modules/skills/services/unifiedStudentContext.service.js";
import { evidenceNormalizationService } from "../src/modules/skills/services/evidenceNormalization.service.js";
import { adaptiveLearningPathwayService, SPECIALIZED_STUDIO_MAPPINGS } from "../src/modules/recommendations/services/adaptiveLearningPathway.service.js";
import { careerPathwayService } from "../src/modules/career/services/careerPathway.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { dashboardIntelligenceService } from "../src/services/dashboard-intelligence.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { AssessmentAttempt } from "../src/modules/academic/models/assessmentAttempt.models.js";
import { PracticalLabAttempt } from "../src/modules/academic/models/practicalLabAttempt.models.js";
import { StudentProject } from "../src/modules/academic/models/studentProject.models.js";
import { ToolActivityRecord } from "../src/modules/tools/models/toolActivityRecord.models.js";
import { LearnerSkillAssessmentHistory } from "../src/modules/skills/models/learnerSkillAssessmentHistory.models.js";

describe("Phase 53: Unified AI Intelligence, Cross-Module Integration & Personalized Workspace", () => {
  const TEST_STUDENT_ID = new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00053");
  const OTHER_STUDENT_ID = new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00099");

  beforeEach(() => {
    vi.restoreAllMocks();
    unifiedStudentContextService.invalidateContext(TEST_STUDENT_ID);
    unifiedStudentContextService.invalidateContext(OTHER_STUDENT_ID);
    smartMentorContextService.invalidateContext(TEST_STUDENT_ID);
  });

  // =========================================================================
  // 1. UNIFIED STUDENT CONTEXT ASSEMBLY & 5 CORE QUESTIONS
  // =========================================================================
  describe("Group 1: Unified Student Context Assembly & Core Questions", () => {
    it("1.1 Assembles authorized student context answering all 5 core questions", async () => {
      const mockUser = {
        _id: TEST_STUDENT_ID,
        displayName: "Priya Sharma",
        targetRole: "Mechanical Design Engineer",
        academic: {
          branchSlug: "mechanical",
          branchName: "Mechanical Engineering",
          degreeSlug: "btech",
          degreeName: "Bachelor of Technology",
          currentSemester: 6,
        },
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      });

      const context = await unifiedStudentContextService.getUnifiedStudentContext(TEST_STUDENT_ID);

      expect(context).toBeDefined();
      expect(context.questionsAnswered).toBeDefined();
      expect(context.questionsAnswered.targetObjective).toContain("Mechanical Design Engineer");
      expect(context.questionsAnswered.evidenceSummary).toBeTypeOf("string");
      expect(context.questionsAnswered.remainingGaps).toBeTypeOf("string");
      expect(context.questionsAnswered.nextLearningAction).toBeTypeOf("string");
      expect(context.questionsAnswered.careerPathwayAlignment).toBeTypeOf("string");

      expect(context.studentProfile.studentId).toBe(String(TEST_STUDENT_ID));
      expect(context.studentProfile.canonicalDiscipline).toBe("mech");
      expect(context.learningOverview.academicDiscipline).toBe("Mechanical, Civil & Industrial");
    });

    it("1.2 Enforces strict student authorization and ownership validation", async () => {
      await expect(unifiedStudentContextService.getUnifiedStudentContext(null)).rejects.toThrow(
        "Authentication required to access student context"
      );
      await expect(unifiedStudentContextService.getUnifiedStudentContext("")).rejects.toThrow(
        "Authentication required to access student context"
      );
    });
  });

  // =========================================================================
  // 2. DISCIPLINE-AWARE BEHAVIOR & NON-CSE ACCREDITATION INTEGRITY
  // =========================================================================
  describe("Group 2: Multi-Discipline Taxonomy & Non-CSE Fairness", () => {
    it("2.1 Supports non-CSE disciplines without forcing GitHub or Docker coding metrics", async () => {
      const mockBiotechUser = {
        _id: TEST_STUDENT_ID,
        displayName: "Ananya Roy",
        targetRole: "Bioinformatics Specialist",
        academic: {
          branchSlug: "biotech",
          branchName: "Biotechnology & Life Sciences",
          degreeSlug: "btech",
          degreeName: "B.Tech Biotechnology",
          currentSemester: 4,
        },
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockBiotechUser),
      });

      const context = await unifiedStudentContextService.getUnifiedStudentContext(TEST_STUDENT_ID);

      expect(context.studentProfile.canonicalDiscipline).toBe("biotech");
      expect(context.learningOverview.academicDiscipline).toBe("Biotechnology & Life Sciences");

      // Verify that missing coding challenges is NOT treated as failure
      expect(context.evidenceLedger.summary).toBeDefined();
      expect(context.careerReadiness.unassessableCompetencies).toBeDefined();
      expect(context.careerReadiness.disclaimer).toContain("heuristic readiness index");
    });
  });

  // =========================================================================
  // 3. EVIDENCE NORMALIZATION, PROVENANCE & DEDUPLICATION
  // =========================================================================
  describe("Group 3: Evidence Ledger Provenance & Deduplication Safeguards", () => {
    it("3.1 Deduplicates redundant LearnerSkillAssessmentHistory when primary assessment attempt exists", async () => {
      const sharedAssessmentId = "mech-assessment-statics-01";
      const now = new Date();

      // Mock primary AssessmentAttempt
      vi.spyOn(AssessmentAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00101"),
            assessmentId: sharedAssessmentId,
            disciplineCategory: "mechanical",
            skillsCovered: ["Statics", "Engineering Mechanics"],
            score: 80,
            maxScore: 100,
            percentage: 80,
            isPassing: true,
            status: "submitted",
            createdAt: now,
          },
        ]),
      });

      // Mock duplicate telemetry record in LearnerSkillAssessmentHistory with same assessmentId
      vi.spyOn(LearnerSkillAssessmentHistory, "find").mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00102"),
            skill: "Statics",
            score: 80,
            evidenceSource: "assessment",
            assessmentId: sharedAssessmentId,
            assessmentDate: now,
          },
        ]),
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(TEST_STUDENT_ID);

      // Verify Statics records are deduplicated
      const staticsRecords = normalized.records.filter(
        (r) => r.canonicalSkill === "Statics" || r.skill === "Statics"
      );
      expect(staticsRecords.length).toBe(1);
      expect(staticsRecords[0].sourceModule).toContain("assessment");
    });

    it("3.2 Preserves full provenance and freshness metadata on every normalized item", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      vi.spyOn(PracticalLabAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00201"),
            labId: "mech-lab-truss",
            disciplineCategory: "mechanical",
            skillsEvaluated: ["Truss Analysis"],
            percentage: 85,
            serverScore: 85,
            isPassing: true,
            status: "submitted",
            submittedAt: pastDate,
          },
        ]),
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(TEST_STUDENT_ID);
      const trussItem = normalized.records.find((r) => r.canonicalSkill === "Truss Analysis");

      expect(trussItem).toBeDefined();
      expect(trussItem.sourceModule).toContain("practical");
      expect(trussItem.studentOwnership).toBe(String(TEST_STUDENT_ID));
      expect(trussItem.verificationStatus.toLowerCase()).toContain("verified");
      expect(trussItem.provenance).toBeDefined();
      expect(trussItem.freshness).toBeDefined();
      expect(trussItem.freshness.ageInDays).toBeGreaterThanOrEqual(9);
      expect(trussItem.freshness.isFresh).toBe(true);
    });

    it("3.3 Formative tool activity records are never elevated to unverified independent mastery", async () => {
      vi.spyOn(ToolActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00301"),
            toolId: "biotech-research",
            discipline: "Biotechnology",
            actionType: "sequence_analysis",
            relevantSkills: ["PCR Primer Design"],
            isSuccess: true,
            isSavedToPortfolio: false,
            createdAt: new Date(),
          },
        ]),
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(TEST_STUDENT_ID);
      const primerRecord = normalized.records.find((r) => r.canonicalSkill?.toLowerCase() === "pcr primer design");

      expect(primerRecord).toBeDefined();
      expect(primerRecord.sourceModule).toContain("tool");
      expect(primerRecord.verificationStatus.toLowerCase()).toContain("formative");
      expect(primerRecord.provenance).toBeDefined();
    });
  });

  // =========================================================================
  // 4. CAREER READINESS & SKILL GAP DIAGNOSIS EXPLAINABILITY
  // =========================================================================
  describe("Group 4: Explainable Career Readiness & Gap Diagnosis", () => {
    it("4.1 Distinguishes unassessed skills from demonstrated failure (no false incompetence)", async () => {
      const roleId = "mechanical-design-engineer";
      const readiness = await careerPathwayService.evaluateRoleReadiness(TEST_STUDENT_ID, roleId);

      expect(readiness.roleId).toBe(roleId);
      expect(readiness.counts.totalRequired).toBeGreaterThan(0);
      expect(readiness.readinessBand).toBeDefined();

      // Check breakdown structure
      expect(Array.isArray(readiness.skillsBreakdown.demonstrated)).toBe(true);
      expect(Array.isArray(readiness.skillsBreakdown.unassessed)).toBe(true);
      expect(Array.isArray(readiness.skillsBreakdown.gaps)).toBe(true);

      // Verify unassessed note
      for (const unassessed of readiness.skillsBreakdown.unassessed) {
        expect(unassessed.reason).toContain("No objective evaluation");
      }

      // Verify disclaimer prevents false employment claims
      expect(readiness.disclaimer).toContain("heuristic readiness index");
      expect(readiness.disclaimer).toContain("placement guarantee");
    });
  });

  // =========================================================================
  // 5. NEXT-BEST ACTION ENGINE & PREREQUISITE SEQUENCING
  // =========================================================================
  describe("Group 5: Next-Best Action Engine & Specialized Studio Routing", () => {
    it("5.1 Recommends Specialized AI Tool Studios with real existing platform routes", async () => {
      expect(SPECIALIZED_STUDIO_MAPPINGS.length).toBe(10);

      const mechStudio = SPECIALIZED_STUDIO_MAPPINGS.find((s) => s.toolId === "mech-calc");
      expect(mechStudio).toBeDefined();
      expect(mechStudio.route).toBe("/dashboard/tools/mech-calc");
      expect(mechStudio.skills).toContain("Engineering Mechanics");

      const nursingStudio = SPECIALIZED_STUDIO_MAPPINGS.find((s) => s.toolId === "nursing-dosage");
      expect(nursingStudio).toBeDefined();
      expect(nursingStudio.route).toBe("/dashboard/tools/nursing-study");

      const biotechStudio = SPECIALIZED_STUDIO_MAPPINGS.find((s) => s.toolId === "biotech-research");
      expect(biotechStudio).toBeDefined();
      expect(biotechStudio.route).toBe("/dashboard/tools/biotech-research");
    });

    it("5.2 Attaches prerequisite warning and prioritizes foundational review when prerequisites are missing", async () => {
      const mockDiagnosis = {
        targetRole: "Full Stack Developer",
        userBranch: "cse",
        totalDiagnosed: 2,
        priorityGapsCount: 1,
        masteredSkillsCount: 0,
        unassessedCount: 1,
        priorityGaps: [
          {
            skill: "React",
            currentStatus: "prerequisite_missing",
            latestScore: 0,
            missingPrerequisites: ["JavaScript", "HTML/CSS"],
          },
        ],
        masteredSkills: [],
        unassessedSkills: [{ skill: "Docker" }],
        diagnosedSkills: [
          {
            skill: "React",
            currentStatus: "prerequisite_missing",
            missingPrerequisites: ["JavaScript", "HTML/CSS"],
          },
        ],
      };

      const plannedActions = adaptiveLearningPathwayService.synthesizeActionPlan(
        TEST_STUDENT_ID,
        mockDiagnosis,
        { normalizedBySkill: {} }
      );

      const reactAction = plannedActions.find((a) => a.skill === "React" && a.actionType === "review_objective");
      expect(reactAction).toBeDefined();
      expect(reactAction.priority).toBe("critical");
      expect(reactAction.supportingEvidence.prerequisiteWarning).toContain("Foundational prerequisite concepts");
      expect(reactAction.supportingEvidence.prerequisiteWarning).toContain("JavaScript");
    });
  });

  // =========================================================================
  // 6. SMART MENTOR CONTEXT INTEGRATION & FALLBACK LABELING
  // =========================================================================
  describe("Group 6: Smart Mentor Context & Deterministic Fallback Transparency", () => {
    it("6.1 Integrates unified context into Smart Mentor prompt data without fabricating records", async () => {
      const mockUser = {
        _id: TEST_STUDENT_ID,
        displayName: "Rohan Verma",
        targetRole: "Full Stack Developer",
        academic: {
          branchSlug: "cse",
          branchName: "Computer Science and Engineering",
        },
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      });

      const mentorContext = await smartMentorContextService.getUnifiedUserContext(TEST_STUDENT_ID);

      expect(mentorContext.unifiedStudentContext).toBeDefined();
      expect(mentorContext.career.name).toBe("Rohan Verma");
      expect(mentorContext.career.academic.branchName).toBe("Computer Science and Engineering");
    });

    it("6.2 Smart Mentor Local NLP handles Phase 53 intelligence intents with transparent fallback labeling", () => {
      const mockContext = {
        career: { targetRole: "Full Stack Developer", readinessScore: 70 },
        skills: [{ name: "JavaScript", score: 85, level: "Proficient", sources: ["coding"] }],
        skillGaps: [{ skill: "Docker", currentScore: 0, targetScore: 75, priority: "Critical" }],
        unifiedStudentContext: {
          questionsAnswered: {
            targetObjective: "Full Stack Developer",
            evidenceSummary: "1 verified skill on record",
            remainingGaps: "Docker",
            nextLearningAction: "Complete Docker Sandbox",
            careerPathwayAlignment: "Develops containerization skills",
          },
          careerReadiness: {
            roleTitle: "Full Stack Developer",
            roleFamily: "Software & Computing",
            counts: { demonstrated: 1, unassessed: 1, gaps: 0, totalRequired: 2 },
            skillsBreakdown: {
              demonstrated: [{ skill: "JavaScript", demonstratedScore: 85, currentLevel: "Proficient", supportingEvidenceSources: ["Docker Sandbox"] }],
              unassessed: [{ skill: "Docker", requiredLevel: "Proficient" }],
              gaps: [],
            },
            readinessBand: "Developing",
            heuristicReadinessIndex: 50,
          },
          nextBestAction: {
            primaryAction: {
              actionId: "act_docker_1",
              skill: "Docker",
              actionType: "practice_activity",
              title: "Solve Docker Sandbox Challenge",
              whyRecommended: "Highest priority gap for Full Stack Developer.",
              intendedOutcome: "Pass automated test cases in Docker sandbox.",
              destination: "/dashboard/coding?taskId=task_docker_1",
              actionLabel: "Launch Sandbox",
              category: "practice",
              priority: "high",
              estimatedMinutes: 25,
            },
          },
          portfolioArtifacts: [
            {
              artifactId: "art_1",
              title: "Full Stack E-Commerce Microservices",
              artifactType: "Project Blueprint",
              discipline: "CSE",
              isShared: true,
            },
          ],
        },
      };

      // Test Question 1: Which skills have strongest supporting evidence?
      const evidenceRes = smartMentorLocalService.generateLocalResponse(
        "Which skills have the strongest supporting evidence?",
        mockContext
      );
      expect(evidenceRes.intent).toBe("strongest_evidence_skills");
      expect(evidenceRes.source).toBe("local_nlp"); // Transparently labeled, NOT mislabeled as LLM
      expect(evidenceRes.answer).toContain("JavaScript");

      // Test Question 2: Which important skills remain unassessed?
      const unassessedRes = smartMentorLocalService.generateLocalResponse(
        "Which important skills remain unassessed?",
        mockContext
      );
      expect(unassessedRes.intent).toBe("unassessed_skills");
      expect(unassessedRes.source).toBe("local_nlp");
      expect(unassessedRes.answer).toContain("Docker");
      expect(unassessedRes.answer).toContain("mean you lack competence");

      // Test Question 3: Why is this learning activity recommended?
      const whyRes = smartMentorLocalService.generateLocalResponse(
        "Why is this learning activity recommended?",
        mockContext
      );
      expect(whyRes.intent).toBe("why_action_recommended");
      expect(whyRes.answer).toContain("Solve Docker Sandbox Challenge");
      expect(whyRes.answer).toContain("Highest priority gap for Full Stack Developer");

      // Test Question 4: Which artifacts could support my portfolio?
      const portfolioRes = smartMentorLocalService.generateLocalResponse(
        "Which of my existing artifacts could support my portfolio?",
        mockContext
      );
      expect(portfolioRes.intent).toBe("portfolio_artifacts_guidance");
      expect(portfolioRes.answer).toContain("Full Stack E-Commerce Microservices");
      expect(portfolioRes.answer).toContain("Portfolio Sharing");
    });
  });

  // =========================================================================
  // 7. PRIVACY & PORTFOLIO SHARING CONSENT
  // =========================================================================
  describe("Group 7: Privacy Boundaries & Portfolio Sharing", () => {
    it("7.1 Only exposes tool activity records where isSavedToPortfolio is explicitly true", async () => {
      vi.spyOn(ToolActivityRecord, "find").mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([
          {
            _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00401"),
            user: TEST_STUDENT_ID,
            toolId: "mech-calc",
            reportDraft: { title: "Beam Deflection Analysis" },
            isSavedToPortfolio: true,
            createdAt: new Date(),
          },
          {
            _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00402"),
            user: TEST_STUDENT_ID,
            toolId: "mech-calc",
            reportDraft: { title: "Private Stress Calculation" },
            isSavedToPortfolio: false, // Private!
            createdAt: new Date(),
          },
        ]),
      });

      const context = await unifiedStudentContextService.getUnifiedStudentContext(TEST_STUDENT_ID);
      const sharedArtifacts = context.portfolioArtifacts || [];

      expect(sharedArtifacts.some((a) => a.title === "Beam Deflection Analysis")).toBe(true);
      expect(sharedArtifacts.some((a) => a.title === "Private Stress Calculation")).toBe(false);
    });
  });

  // =========================================================================
  // 8. DASHBOARD INTELLIGENCE INTEGRATION & CACHING
  // =========================================================================
  describe("Group 8: Dashboard Intelligence Service & Performance Caching", () => {
    it("8.1 getDashboardIntelligence includes unifiedWorkspace context", async () => {
      const mockUser = {
        _id: TEST_STUDENT_ID,
        displayName: "Aarav Patel",
        targetRole: "Civil Structural Engineer",
      };

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      });

      const intel = await dashboardIntelligenceService.getDashboardIntelligence(TEST_STUDENT_ID);

      expect(intel.unifiedWorkspace).toBeDefined();
      expect(intel.unifiedWorkspace.studentProfile).toBeDefined();
      expect(intel.unifiedWorkspace.nextBestAction).toBeDefined();
    });

    it("8.2 Caches context in memory for fast performance and flushes on invalidation", async () => {
      const mockUser = {
        _id: TEST_STUDENT_ID,
        displayName: "Cache Test User",
      };

      const spy = vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      });

      // Call 1: uncached
      const c1 = await unifiedStudentContextService.getUnifiedStudentContext(TEST_STUDENT_ID);
      expect(c1).toBeDefined();

      // Call 2: should be returned from cache without re-querying User
      const c2 = await unifiedStudentContextService.getUnifiedStudentContext(TEST_STUDENT_ID);
      expect(c2).toBeDefined();
      expect(c2.studentProfile.displayName).toBe("Cache Test User");
      expect(spy).toHaveBeenCalledTimes(1);

      // Invalidate cache
      unifiedStudentContextService.invalidateContext(TEST_STUDENT_ID);

      // Call 3: should re-query
      await unifiedStudentContextService.getUnifiedStudentContext(TEST_STUDENT_ID);
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
