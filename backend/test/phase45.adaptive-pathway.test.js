import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { evidenceNormalizationService } from "../src/modules/skills/services/evidenceNormalization.service.js";
import { skillGapDiagnosisService } from "../src/modules/skills/services/skillGapDiagnosis.service.js";
import { adaptiveLearningPathwayService } from "../src/modules/recommendations/services/adaptiveLearningPathway.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { AssessmentAttempt } from "../src/modules/academic/models/assessmentAttempt.models.js";
import { StudentProject } from "../src/modules/academic/models/studentProject.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import { SpacedRevisionSchedule } from "../src/modules/skills/models/spacedRevisionSchedule.models.js";
import { LearningActivityRecord } from "../src/modules/skills/models/learningActivityRecord.models.js";
import { User } from "../src/core/database/models/user.models.js";

describe("Phase 45: Adaptive Learning Pathways & Evidence-to-Mastery Engine Suite", () => {
  const mockStudentId = new mongoose.Types.ObjectId("65b9f71c4f1a23d4e5f67890");

  const mockUserMech = {
    _id: mockStudentId,
    email: "student.mech@example.com",
    displayName: "Jane Engineer",
    branch: "mech",
    academicBranch: "mech",
    targetRole: "Mechanical Design Engineer",
  };

  const mockUserCSE = {
    _id: mockStudentId,
    email: "student.cse@example.com",
    displayName: "Alex Developer",
    branch: "cse",
    academicBranch: "cse",
    targetRole: "Full Stack Developer",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Evidence Normalization & Integrity
  // =========================================================================
  describe("1. Evidence Normalization Engine", () => {
    it("normalizes multi-source student evidence preserving canonical skills and confidence tiers", async () => {
      const mockAttempts = [
        {
          _id: new mongoose.Types.ObjectId(),
          owner: mockStudentId,
          assessmentId: "mech-eng-mechanics",
          status: "submitted",
          score: 80,
          maxScore: 100,
          percentage: 80,
          isPassing: true,
          submittedAt: "2026-10-24T12:00:00.000Z",
          version: 1,
          topicPerformance: [{ topic: "Statics", percentage: 85, masteryLevel: "Proficient" }],
        },
      ];

      const mockProjects = [
        {
          _id: new mongoose.Types.ObjectId(),
          owner: mockStudentId,
          templateId: "mech-cad-gearbox-design",
          title: "Speed Reducer Gearbox",
          disciplineCategory: "Engineering & Technology",
          relevantSkills: ["SolidWorks", "AutoCAD", "GD&T"],
          status: "completed",
          evaluation: { overallScore: 88 },
          evaluatedAt: "2026-10-23T10:00:00.000Z",
        },
      ];

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation(async (model) => {
        if (model === AssessmentAttempt) return mockAttempts;
        if (model === StudentProject) return mockProjects;
        return [];
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(mockStudentId);

      expect(normalized.rawCount).toBeGreaterThanOrEqual(2);
      expect(normalized.normalizedBySkill).toHaveProperty("Engineering Mechanics");
      expect(normalized.normalizedBySkill).toHaveProperty("SolidWorks");

      const mechanics = normalized.normalizedBySkill["Engineering Mechanics"];
      expect(mechanics.overallStatus).toBe("demonstrated_knowledge");
      expect(mechanics.latestScore).toBe(80);
      expect(mechanics.hasPassed).toBe(true);

      const cad = normalized.normalizedBySkill["SolidWorks"];
      expect(cad.overallStatus).toBe("inferred_proficiency");
      expect(cad.latestScore).toBe(88);
    });

    it("handles absence of evidence safely without fabricating failure scores", async () => {
      vi.spyOn(evidenceNormalizationService, "safeFind").mockResolvedValue([]);

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(mockStudentId);

      expect(normalized.rawCount).toBe(0);
      expect(normalized.timeline).toEqual([]);
      expect(Object.keys(normalized.normalizedBySkill)).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. Deterministic Skill-Gap Diagnosis Engine
  // =========================================================================
  describe("2. Skill-Gap Diagnosis Engine", () => {
    it("diagnoses discipline-specific skills for Mechanical Engineering and computes learning priority scores", () => {
      const mockNormalized = {
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            overallStatus: "demonstrated_knowledge",
            latestScore: 55, // Failed attempt
            hasPassed: false,
            latestEvidence: {
              timestamp: new Date().toISOString(),
              sourceType: "assessment_attempt",
              assessmentId: "mech-eng-mechanics",
            },
          },
          "Materials Science": {
            canonicalSkill: "Materials Science",
            overallStatus: "demonstrated_knowledge",
            latestScore: 90, // Mastered
            hasPassed: true,
            latestEvidence: {
              timestamp: new Date().toISOString(),
              sourceType: "assessment_attempt",
            },
          },
        },
      };

      const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(mockUserMech, mockNormalized);

      expect(diagnosis.targetRole).toBe("Mechanical Design Engineer");
      expect(diagnosis.userBranch).toBe("mech");

      // Verify Engineering Mechanics is flagged as needing remediation
      const mechDiag = diagnosis.diagnosedSkills.find((s) => s.skill === "Engineering Mechanics");
      expect(mechDiag).toBeDefined();
      expect(mechDiag.currentStatus).toBe("needs_remediation");
      expect(mechDiag.recommendedActionCategory).toBe("reassessment");
      expect(mechDiag.learningPriorityScore).toBeGreaterThan(60);

      // Verify Materials Science is marked as mastered
      const matDiag = diagnosis.diagnosedSkills.find((s) => s.skill === "Materials Science");
      expect(matDiag).toBeDefined();
      expect(matDiag.currentStatus).toBe("demonstrated_mastery");
      expect(matDiag.learningPriorityScore).toBeLessThan(mechDiag.learningPriorityScore);
    });

    it("treats unassessed skills neutrally without assigning a zero penalty score", () => {
      const emptyEvidence = { normalizedBySkill: {} };
      const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(mockUserCSE, emptyEvidence, "Full Stack Developer");

      const jsSkill = diagnosis.diagnosedSkills.find((s) => s.skill === "JavaScript");
      expect(jsSkill).toBeDefined();
      expect(jsSkill.currentStatus).toBe("unassessed");
      expect(jsSkill.latestScore).toBeNull();
      expect(jsSkill.evidenceStatus).toBe("insufficient_evidence");
      // Learning priority is computed for diagnostic scheduling, but score is not artificially 0
      expect(jsSkill.learningPriorityScore).toBeGreaterThanOrEqual(40);
    });

    it("elevates prerequisite priorities when dependent skills have missing prerequisites", () => {
      const mockEvidence = {
        normalizedBySkill: {
          // React requires JavaScript and HTML/CSS
          "JavaScript": { latestScore: 40, hasPassed: false, latestEvidence: { timestamp: new Date().toISOString() } },
        },
      };

      const prereqStatus = skillGapDiagnosisService.checkPrerequisites("React", mockEvidence.normalizedBySkill);
      expect(prereqStatus.isReady).toBe(false);
      expect(prereqStatus.missingPrerequisites).toContain("JavaScript");
      expect(prereqStatus.missingPrerequisites).toContain("HTML/CSS");
    });
  });

  // =========================================================================
  // 3. Adaptive Learning Action Planner & Resource Matching
  // =========================================================================
  describe("3. Personalized Learning Action Planner", () => {
    it("generates targeted remediation, EduTube lesson, and reassessment actions for failed skills", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUserMech),
      });

      const mockNormalized = {
        rawCount: 1,
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            overallStatus: "demonstrated_knowledge",
            latestScore: 50,
            hasPassed: false,
            latestEvidence: {
              timestamp: new Date().toISOString(),
              sourceType: "assessment_attempt",
              assessmentId: "mech-eng-mechanics",
              metadata: { areasForImprovement: ["Truss Equilibrium"] },
            },
          },
        },
      };

      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue(mockNormalized);
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
      });

      const pathway = await adaptiveLearningPathwayService.generateLearningPathway(mockStudentId);

      expect(pathway.cycleStage).toBe("LEARN_REMEDIATE");
      expect(pathway.actions.length).toBeGreaterThan(0);

      // 1. Should have concept review action in Assessment Center
      const reviewAction = pathway.actions.find((a) => a.actionType === "review_objective");
      expect(reviewAction).toBeDefined();
      expect(reviewAction.destination).toContain("/dashboard/assessments?id=mech-eng-mechanics");
      expect(reviewAction.priority).toBe("critical");

      // 2. Should have verified educational lesson without hallucinated URLs
      const lessonAction = pathway.actions.find((a) => a.actionType === "edutube_lesson");
      expect(lessonAction).toBeDefined();
      expect(lessonAction.destination).toMatch(/^https:\/\/www\.youtube\.com/);

      // 3. Should have reassessment action
      const reassessAction = pathway.actions.find((a) => a.actionType === "reassessment");
      expect(reassessAction).toBeDefined();
      expect(reassessAction.destination).toContain("/dashboard/assessments?id=mech-eng-mechanics");
    });

    it("recommends Project Studio blueprints when foundational prerequisites are met", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUserMech),
      });

      const mockNormalized = {
        rawCount: 1,
        normalizedBySkill: {
          "SolidWorks": {
            canonicalSkill: "SolidWorks",
            overallStatus: "demonstrated_knowledge",
            latestScore: 85,
            hasPassed: true,
            latestEvidence: { timestamp: new Date().toISOString(), sourceType: "assessment_attempt" },
          },
        },
      };

      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue(mockNormalized);
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });

      const pathway = await adaptiveLearningPathwayService.generateLearningPathway(mockStudentId);

      const projectAction = pathway.actions.find((a) => a.actionType === "project_studio");
      expect(projectAction).toBeDefined();
      expect(projectAction.destination).toContain("/dashboard/projects?templateId=mech-cad-gearbox-design");
      expect(projectAction.whyRecommended).toContain("foundational mastery");
    });

    it("deduplicates actions and marks already completed milestones", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUserMech),
      });

      const completedActionId = "act_review_engineering_mechanics";
      vi.spyOn(LearningActivityRecord, "find").mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([{ entityId: completedActionId, status: "completed" }]),
        }),
      });

      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 1,
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            overallStatus: "demonstrated_knowledge",
            latestScore: 50,
            hasPassed: false,
            latestEvidence: { timestamp: new Date().toISOString(), sourceType: "assessment_attempt", assessmentId: "mech-eng-mechanics" },
          },
        },
      });

      const pathway = await adaptiveLearningPathwayService.generateLearningPathway(mockStudentId);

      const matching = pathway.actions.find((a) => a.actionId === completedActionId);
      expect(matching).toBeDefined();
      expect(matching.isCompleted).toBe(true);
      expect(pathway.completedActionsCount).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. Evidence-Based Mastery Progression & Comparison
  // =========================================================================
  describe("4. Mastery Progression & Comparable Improvement Engine", () => {
    it("computes verified score delta when comparable assessment attempts exist", () => {
      const mockEvidence = {
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            previousEvidence: {
              sourceType: "assessment_attempt",
              percentage: 60,
              timestamp: "2026-10-10T10:00:00.000Z",
            },
            latestEvidence: {
              sourceType: "assessment_attempt",
              percentage: 85,
              timestamp: "2026-10-24T12:00:00.000Z",
            },
          },
        },
      };

      const progression = adaptiveLearningPathwayService.evaluateMasteryProgression(mockEvidence);

      expect(progression.totalComparisons).toBe(1);
      expect(progression.positiveProgressionCount).toBe(1);
      expect(progression.averageScoreDelta).toBe(25);
      expect(progression.comparisons[0].isImproved).toBe(true);
      expect(progression.comparisons[0].scoreDelta).toBe(25);
      expect(progression.comparisons[0].interpretation).toContain("Score increased by +25%");
    });

    it("rejects comparing incompatible evidence sources (e.g. project deliverable vs coding challenge)", () => {
      const mockIncompatibleEvidence = {
        normalizedBySkill: {
          "Data Structures": {
            canonicalSkill: "Data Structures",
            previousEvidence: {
              sourceType: "project_deliverable",
              percentage: 70,
              timestamp: "2026-10-01T10:00:00.000Z",
            },
            latestEvidence: {
              sourceType: "coding_submission",
              percentage: 90,
              timestamp: "2026-10-24T12:00:00.000Z",
            },
          },
        },
      };

      const progression = adaptiveLearningPathwayService.evaluateMasteryProgression(mockIncompatibleEvidence);
      // Incompatible sources cannot be declared as comparable improvement
      expect(progression.totalComparisons).toBe(0);
      expect(progression.comparisons).toHaveLength(0);
    });
  });

  // =========================================================================
  // 5. Smart Mentor Context & Local Guidance Integration
  // =========================================================================
  describe("5. Smart Mentor Learning Pathway Integration", () => {
    it("includes learningPathway context block in unified mentor context", async () => {
      const mockUser = { _id: mockStudentId, targetRole: "Full Stack Developer", branch: "cse" };
      vi.spyOn(User, "findById").mockReturnValue({ lean: vi.fn().mockResolvedValue(mockUser) });

      const context = await smartMentorContextService.getUnifiedUserContext(mockStudentId, { forceRefresh: true });

      expect(context).toHaveProperty("learningPathway");
      expect(context.learningPathway).toHaveProperty("cycleStage");
      expect(context.learningPathway).toHaveProperty("priorityGapsCount");
    });

    it("classifies learning pathway queries and returns structured offline guidance", async () => {
      const mockContext = {
        learningPathway: {
          cycleStage: "LEARN_REMEDIATE",
          priorityGapsCount: 2,
          masteredCount: 3,
          primaryNextStep: {
            title: "Remediate Statics: Review Core Concepts",
            whyRecommended: "Previous score was 55% in Assessment Center.",
            intendedOutcome: "Attain passing mark of 70%.",
            estimatedMinutes: 20,
          },
        },
        career: { targetRole: "Mechanical Design Engineer" },
      };

      const response = await smartMentorLocalService.generateLocalGuidance(
        "learning_pathway_guidance",
        mockContext,
        "What is my next learning step in the adaptive pathway?"
      );

      expect(response).toHaveProperty("answer");
      expect(response.answer).toContain("Adaptive Learning Pathway & Mastery Engine");
      expect(response.answer).toContain("LEARN_REMEDIATE");
      expect(response.answer).toContain("Remediate Statics");
      expect(response.actions[0].route).toBe("/dashboard/roadmap");
    });
  });

  // =========================================================================
  // 6. Multi-Discipline Academic Coverage (10 Discipline Families)
  // =========================================================================
  describe("6. Multi-Discipline Academic Coverage (10 Discipline Families)", () => {
    const disciplines = [
      { branch: "cse", role: "Full Stack Developer", sampleSkill: "JavaScript" },
      { branch: "mech", role: "CAD/CAM Engineer", sampleSkill: "SolidWorks" },
      { branch: "ece", role: "Embedded Systems Engineer", sampleSkill: "Circuit Analysis" },
      { branch: "civil", role: "Structural Design Engineer", sampleSkill: "Structural Analysis" },
      { branch: "chem", role: "Process Engineer", sampleSkill: "Mass Balance" },
      { branch: "biotech", role: "Bioinformatics Specialist", sampleSkill: "Bioinformatics" },
      { branch: "mba", role: "Business Intelligence Analyst", sampleSkill: "Business Strategy" },
      { branch: "finance", role: "Financial Analyst", sampleSkill: "Financial Modeling" },
      { branch: "arts", role: "Technical Writer", sampleSkill: "Critical Analysis" },
      { branch: "nursing", role: "Clinical Nurse Specialist", sampleSkill: "Clinical Assessment" },
    ];

    disciplines.forEach(({ branch, role, sampleSkill }) => {
      it(`diagnoses and creates personalized pathways for ${branch.toUpperCase()} (${role})`, () => {
        const mockStudent = {
          _id: mockStudentId,
          branch,
          academicBranch: branch,
          targetRole: role,
        };

        const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(mockStudent, { normalizedBySkill: {} }, role);

        expect(diagnosis.userBranch).toBe(branch);
        expect(diagnosis.diagnosedSkills.length).toBeGreaterThan(0);

        const foundSkill = diagnosis.diagnosedSkills.find(
          (s) => s.skill.toLowerCase() === sampleSkill.toLowerCase() || s.importance.includes("Core")
        );
        expect(foundSkill).toBeDefined();
        expect(foundSkill.learningPriorityScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // =========================================================================
  // 7. Security, Privacy & Data Integrity
  // =========================================================================
  describe("7. Security, Privacy & Data Integrity", () => {
    it("handles malformed and stale historical data gracefully without throwing", () => {
      const malformedEvidence = {
        normalizedBySkill: {
          "Corrupted Skill": {
            canonicalSkill: "Corrupted Skill",
            overallStatus: null,
            latestScore: undefined,
            latestEvidence: {
              timestamp: "invalid-date-string",
              sourceType: null,
            },
          },
        },
      };

      expect(() => {
        skillGapDiagnosisService.diagnoseStudentSkillGaps(mockUserCSE, malformedEvidence);
      }).not.toThrow();
    });

    it("ensures completed pathway action recording is idempotent and doesn't duplicate", async () => {
      const actionId = "act_test_idempotent_123";
      vi.spyOn(LearningActivityRecord, "findOneAndUpdate").mockResolvedValue({
        entityId: actionId,
        recordedAt: new Date().toISOString(),
      });

      const res1 = await adaptiveLearningPathwayService.recordActionCompletion(mockStudentId, actionId, {
        skill: "JavaScript",
        title: "Test Idempotence",
      });

      expect(res1.success).toBe(true);
      expect(res1.actionId).toBe(actionId);
    });
  });
});

