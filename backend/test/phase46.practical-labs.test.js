import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { PRACTICAL_LAB_CATALOG } from "../src/modules/academic/constants/practicalLabCatalog.js";
import {
  practicalLabService,
  sanitizeLabForClient,
  evaluateTaskAnswer,
} from "../src/modules/academic/services/practicalLab.service.js";
import { PracticalLabAttempt } from "../src/modules/academic/models/practicalLabAttempt.models.js";
import { evidenceNormalizationService } from "../src/modules/skills/services/evidenceNormalization.service.js";
import { adaptiveLearningPathwayService } from "../src/modules/recommendations/services/adaptiveLearningPathway.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";

describe("Phase 46: Branch-Aware Practical Learning Labs & Interactive Practice Framework", () => {
  const mockStudentId = new mongoose.Types.ObjectId("65b9f71c4f1a23d4e5f67890");
  const otherStudentId = new mongoose.Types.ObjectId("65b9f71c4f1a23d4e5f67891");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. LAB CATALOG & DISCIPLINE COVERAGE
  // =========================================================================
  describe("1. Lab Catalog & 10-Discipline Starter Activity Coverage", () => {
    it("provides at least 20 high-quality starter activities spanning 10 academic disciplines (>=2 per family)", () => {
      expect(PRACTICAL_LAB_CATALOG.length).toBeGreaterThanOrEqual(20);

      const requiredDisciplines = [
        "Computer Science & IT",
        "Mechanical & Industrial",
        "Electronics & Electrical",
        "Civil & Infrastructure",
        "Chemical & Materials",
        "Life Sciences & Biotech",
        "Business & Management",
        "Finance & Commerce",
        "Arts & Humanities",
        "Nursing & Health Sciences",
      ];

      const disciplineCounts = {};
      for (const lab of PRACTICAL_LAB_CATALOG) {
        disciplineCounts[lab.disciplineCategory] = (disciplineCounts[lab.disciplineCategory] || 0) + 1;
      }

      for (const disc of requiredDisciplines) {
        expect(disciplineCounts[disc]).toBeDefined();
        expect(disciplineCounts[disc]).toBeGreaterThanOrEqual(2);
      }
    });

    it("ensures all published labs have valid identifiers, skills, objectives, 100 max points, and educational disclaimers", () => {
      for (const lab of PRACTICAL_LAB_CATALOG) {
        expect(lab.labId).toBeTruthy();
        expect(lab.title).toBeTruthy();
        expect(lab.version).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(lab.canonicalDisciplines)).toBe(true);
        expect(lab.canonicalDisciplines.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(lab.relevantSkills)).toBe(true);
        expect(lab.relevantSkills.length).toBeGreaterThanOrEqual(1);
        expect(Array.isArray(lab.learningObjectives)).toBe(true);
        expect(lab.learningObjectives.length).toBeGreaterThanOrEqual(2);
        expect(Array.isArray(lab.tasks)).toBe(true);
        expect(lab.tasks.length).toBeGreaterThanOrEqual(2);

        const totalPoints = lab.tasks.reduce((sum, t) => sum + (t.points || 0), 0);
        expect(totalPoints).toBe(100);

        expect(lab.disclaimer).toBeTruthy();
      }
    });

    it("distinguishes implemented activities from unsupported simulation engines", () => {
      // Mechanical labs disclaim operational CAD / structural approval
      const mechLab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-stress-strain");
      expect(mechLab).toBeDefined();
      expect(mechLab.disclaimer).toContain("Educational stress calculation");

      // ECE lab disclaims live hardware emulation
      const eceLab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "ece-lab-circuit-thevenin");
      expect(eceLab).toBeDefined();
      expect(eceLab.disclaimer).toContain("Educational circuit analysis model");

      // Nursing lab disclaims clinical diagnostic or treatment instructions
      const nursingLab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "nursing-lab-sbar-communication");
      expect(nursingLab).toBeDefined();
      expect(nursingLab.disclaimer).toContain("Does not constitute medical diagnosis");
    });
  });

  // =========================================================================
  // 2. ANSWER KEY SANITIZATION & CLIENT PROTECTION
  // =========================================================================
  describe("2. Answer Key Sanitization & Catalog Filtering", () => {
    it("strips acceptedAnswer and correctOptionId when sanitizing labs for client", () => {
      const rawLab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-stress-strain");
      expect(rawLab).toBeDefined();
      expect(rawLab.tasks[0].acceptedAnswer).toBeDefined();

      const sanitized = sanitizeLabForClient(rawLab);
      expect(sanitized.labId).toBe(rawLab.labId);
      expect(sanitized.title).toBe(rawLab.title);
      expect(sanitized.tasks[0].acceptedAnswer).toBeUndefined();
      expect(sanitized.tasks[0].tolerance).toBeUndefined();
    });

    it("filters catalog accurately by branchSlug and difficulty", async () => {
      const civilLabs = await practicalLabService.getLabCatalog({ branch: "civil" });
      expect(civilLabs.labs.length).toBeGreaterThanOrEqual(2);
      for (const lab of civilLabs.labs) {
        expect(lab.canonicalDisciplines).toContain("civil");
        expect(lab.tasks[0].acceptedAnswer).toBeUndefined();
      }

      const beginnerLabs = await practicalLabService.getLabCatalog({ difficulty: "beginner" });
      for (const lab of beginnerLabs.labs) {
        expect(lab.difficulty.toLowerCase()).toBe("beginner");
      }
    });

    it("searches catalog by query string", async () => {
      const searchRes = await practicalLabService.getLabCatalog({ search: "thevenin" });
      expect(searchRes.labs.length).toBeGreaterThanOrEqual(1);
      expect(searchRes.labs[0].labId).toBe("ece-lab-circuit-thevenin");
    });
  });

  // =========================================================================
  // 3. DETERMINISTIC EVALUATION: NUMERICAL TOLERANCE & NON-FINITE INPUTS
  // =========================================================================
  describe("3. Deterministic Evaluation Engine: Numerical & Scenario Tasks", () => {
    const numericTask = {
      taskId: "task-test-num",
      taskType: "numerical_calculation",
      points: 50,
      acceptedAnswer: 250,
      tolerance: 0.02, // 2%
      expectedUnit: "MPa",
      explanation: "Stress = Force / Area = 50000 / 0.0002 = 250 MPa.",
    };

    it("accepts exact numerical answer within specified tolerance range", () => {
      // 250 exact
      const resultExact = evaluateTaskAnswer(numericTask, 250);
      expect(resultExact.isCorrect).toBe(true);
      expect(resultExact.earnedPoints).toBe(50);
      expect(resultExact.solutionExplanation).toContain("250 MPa");

      // 253 is within 2% (250 * 0.02 = 5 -> [245, 255])
      const resultNear = evaluateTaskAnswer(numericTask, 253);
      expect(resultNear.isCorrect).toBe(true);
      expect(resultNear.earnedPoints).toBe(50);

      // 260 is outside 2%
      const resultOut = evaluateTaskAnswer(numericTask, 260);
      expect(resultOut.isCorrect).toBe(false);
      expect(resultOut.earnedPoints).toBe(0);
    });

    it("rejects non-finite, NaN, and malformed inputs with 0 points", () => {
      const resultNaN = evaluateTaskAnswer(numericTask, NaN);
      expect(resultNaN.isCorrect).toBe(false);
      expect(resultNaN.earnedPoints).toBe(0);
      expect(resultNaN.feedback).toContain("Invalid non-finite or empty numeric input");

      const resultInf = evaluateTaskAnswer(numericTask, Infinity);
      expect(resultInf.isCorrect).toBe(false);
      expect(resultInf.earnedPoints).toBe(0);

      const resultStr = evaluateTaskAnswer(numericTask, "gibberish");
      expect(resultStr.isCorrect).toBe(false);
      expect(resultStr.earnedPoints).toBe(0);

      const resultNull = evaluateTaskAnswer(numericTask, null);
      expect(resultNull.isCorrect).toBe(false);
      expect(resultNull.earnedPoints).toBe(0);
    });

    it("evaluates scenario_decision and multiple_choice tasks with deterministic option matching", () => {
      const scenarioTask = {
        taskId: "task-scenario-test",
        taskType: "scenario_decision",
        points: 50,
        correctOptionId: "opt-b",
        explanation: "Option B provides the highest margin of safety under dynamic cyclic loading.",
      };

      const resultCorrect = evaluateTaskAnswer(scenarioTask, "opt-b");
      expect(resultCorrect.isCorrect).toBe(true);
      expect(resultCorrect.earnedPoints).toBe(50);

      const resultIncorrect = evaluateTaskAnswer(scenarioTask, "opt-a");
      expect(resultIncorrect.isCorrect).toBe(false);
      expect(resultIncorrect.earnedPoints).toBe(0);
    });
  });

  // =========================================================================
  // 4. ATTEMPT LIFECYCLE, SUBMISSION & PERSISTENCE
  // =========================================================================
  describe("4. Attempt Submission Lifecycle & Database Persistence", () => {
    it("evaluates and stores a complete passing lab submission", async () => {
      const mockSavedAttempt = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockStudentId,
        labId: "mech-lab-stress-strain",
        labVersion: 1,
        disciplineCategory: "Mechanical & Industrial",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        masteryLevel: "Proficient",
        status: "submitted",
        skillsEvaluated: ["Engineering Mechanics", "Statics", "Materials Science"],
        submittedAt: new Date(),
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(PracticalLabAttempt.prototype, "save").mockImplementation(function () {
        this._id = mockSavedAttempt._id;
        return Promise.resolve(this);
      });

      const submissionPayload = {
        submittedAnswers: {
          "mech-ss-1": 143.24,
          "mech-ss-2": 2.16,
        },
        startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      };

      const result = await practicalLabService.submitLabAttempt(
        mockStudentId,
        "mech-lab-stress-strain",
        submissionPayload
      );

      expect(result.labId).toBe("mech-lab-stress-strain");
      expect(result.serverScore).toBe(100);
      expect(result.percentage).toBe(100);
      expect(result.isPassing).toBe(true);
      expect(result.taskResults.length).toBe(2);
      expect(result.taskResults[0].isCorrect).toBe(true);
      expect(result.taskResults[1].isCorrect).toBe(true);
      expect(result.nextActionRecommendations.length).toBeGreaterThan(0);
    });

    it("evaluates a failing attempt (<70%) and generates review recommendations", async () => {
      vi.spyOn(PracticalLabAttempt.prototype, "save").mockImplementation(function () {
        this._id = new mongoose.Types.ObjectId();
        return Promise.resolve(this);
      });

      const submissionPayload = {
        submittedAnswers: {
          "mech-ss-1": 999, // Incorrect
          "mech-ss-2": 999, // Incorrect
        },
      };

      const result = await practicalLabService.submitLabAttempt(
        mockStudentId,
        "mech-lab-stress-strain",
        submissionPayload
      );

      expect(result.serverScore).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.isPassing).toBe(false);
      expect(result.masteryLevel).toBe("Needs Remediation");

      const summaryText = typeof result.evaluationFeedback === "string"
        ? result.evaluationFeedback
        : result.evaluationFeedback?.summary;
      expect(summaryText).toContain("passing mark is 70%");

      const retryRec = result.nextActionRecommendations.find(
        (r) => r.actionType === "retry_lab" || r.type === "retry_lab"
      );
      expect(retryRec).toBeDefined();
    });

    it("enforces ownership: prevents unauthorized cross-student attempt retrieval", async () => {
      const mockAttemptDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockStudentId, // Belongs to mockStudentId
        labId: "mech-lab-stress-strain",
        serverScore: 100,
      };

      vi.spyOn(PracticalLabAttempt, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockAttemptDoc),
      });

      // Authorized owner succeeds
      const ownAttempt = await practicalLabService.getAttemptById(mockStudentId, mockAttemptDoc._id);
      expect(ownAttempt._id).toEqual(mockAttemptDoc._id);

      // Other student is forbidden (403)
      await expect(
        practicalLabService.getAttemptById(otherStudentId, mockAttemptDoc._id)
      ).rejects.toThrow("You are not authorized to view this lab attempt.");
    });
  });

  // =========================================================================
  // 5. EVIDENCE NORMALIZATION INTEGRATION (PHASE 45)
  // =========================================================================
  describe("5. Evidence Normalization & Timeline Integration", () => {
    it("normalizes practical lab attempts as sourceType practical_lab with 0.90 confidence", async () => {
      const mockLabAttempt = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockStudentId,
        labId: "ece-lab-circuit-thevenin",
        labVersion: 1,
        disciplineCategory: "Electronics & Electrical",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        skillsEvaluated: ["Circuit Analysis", "Electric Circuits"],
        masteryLevel: "Proficient",
        status: "submitted",
        submittedAt: new Date("2026-10-24T15:00:00.000Z"),
        taskResults: [{ taskId: "t1" }, { taskId: "t2" }],
      };

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation((model) => {
        if (model.modelName === "PracticalLabAttempt") {
          return Promise.resolve([mockLabAttempt]);
        }
        return Promise.resolve([]);
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(mockStudentId);

      expect(normalized.rawCount).toBeGreaterThanOrEqual(1);
      expect(normalized.timeline.length).toBeGreaterThanOrEqual(1);

      const labEvidence = normalized.timeline.find((e) => e.sourceType === "practical_lab");
      expect(labEvidence).toBeDefined();
      expect(labEvidence.confidence).toBe(0.90);
      expect(labEvidence.isPassing).toBe(true);
      expect(labEvidence.percentage).toBe(100);
      expect(labEvidence.labId).toBe("ece-lab-circuit-thevenin");
    });
  });

  // =========================================================================
  // 6. ADAPTIVE LEARNING PATHWAY RECOMMENDATIONS
  // =========================================================================
  describe("6. Adaptive Learning Pathway Integration", () => {
    it("recommends practical labs for diagnosed gaps matching published lab skills", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStudentId,
          branch: "mech",
          academicBranch: "mech",
          targetRole: "Mechanical Design Engineer",
        }),
      });

      // Mock evidence showing weak performance in Stress Analysis
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 1,
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            history: [{ percentage: 50, isPassing: false, timestamp: new Date().toISOString() }],
            latestEvidence: { percentage: 50, isPassing: false, timestamp: new Date().toISOString() },
            highestEvidence: { percentage: 50, isPassing: false },
            overallStatus: "unverified",
          },
        },
        timeline: [],
      });

      const pathway = await adaptiveLearningPathwayService.generateLearningPathway(
        mockStudentId,
        "Mechanical Design Engineer"
      );

      expect(pathway).toBeDefined();
      expect(Array.isArray(pathway.actions)).toBe(true);

      const practicalLabAction = pathway.actions.find((a) => a.actionType === "practical_lab");
      expect(practicalLabAction).toBeDefined();
      expect(practicalLabAction.destination).toContain("/dashboard/labs?labId=");
      expect(practicalLabAction.actionLabel).toBe("Launch Practical Lab");
    });
  });

  // =========================================================================
  // 7. SMART MENTOR CONTEXT & DETERMINISTIC OFFLINE NLP FALLBACK
  // =========================================================================
  describe("7. Smart Mentor Grounding & Local NLP Fallback", () => {
    it("classifies practical lab queries into practical_lab_guidance intent", () => {
      const intent1 = smartMentorLocalService.classifyIntent("What are practical labs and how do I do them?");
      expect(intent1).toBe("practical_lab_guidance");

      const intent2 = smartMentorLocalService.classifyIntent("Explain my recent lab attempt score");
      expect(intent2).toBe("practical_lab_guidance");

      const intent3 = smartMentorLocalService.classifyIntent("I want to do a calculation exercise for my branch");
      expect(intent3).toBe("practical_lab_guidance");
    });

    it("generates grounded practical lab guidance when attempts exist in context", () => {
      const mockContext = {
        career: { targetRole: "Mechanical Design Engineer" },
        practicalLabs: {
          totalAttempts: 1,
          submittedCount: 1,
          passedCount: 1,
          failedCount: 0,
          averageScore: 100,
          recentAttempts: [
            {
              labId: "mech-lab-stress-strain",
              disciplineCategory: "Mechanical & Industrial",
              serverScore: 100,
              maxScore: 100,
              percentage: 100,
              isPassing: true,
              skillsEvaluated: ["Engineering Mechanics", "Statics", "Materials Science"],
              feedbackSummary: "All engineering calculations verified accurate.",
            },
          ],
        },
      };

      const guidance = smartMentorLocalService.generateLocalGuidance(
        "practical_lab_guidance",
        mockContext,
        "How did I do on my practical lab?"
      );

      expect(guidance.answer).toContain("mech-lab-stress-strain");
      expect(guidance.answer).toContain("100%");
      expect(guidance.answer).toContain("PASSED");
      expect(guidance.summary).toContain("Latest practical lab attempt scored 100%");
      expect(guidance.actions.some((a) => a.category === "labs")).toBe(true);
    });

    it("provides introductory practical labs overview when student has zero attempts", () => {
      const mockContext = {
        career: { targetRole: "Electrical Engineer" },
        practicalLabs: {
          totalAttempts: 0,
          recentAttempts: [],
        },
      };

      const guidance = smartMentorLocalService.generateLocalGuidance(
        "practical_lab_guidance",
        mockContext,
        "Tell me about practical labs"
      );

      expect(guidance.answer).toContain("Welcome to Practical Learning Labs");
      expect(guidance.answer).toContain("Multi-Discipline Starter Labs");
      expect(guidance.actions[0].route).toBe("/dashboard/labs");
    });
  });

  // =========================================================================
  // 8. SECURITY & SANDBOX CONTROLS
  // =========================================================================
  describe("8. Security, Answer Protection & Sandbox Preservation", () => {
    it("ensures coding sandbox execution remains disabled in environment", () => {
      expect(process.env.CODING_EXECUTION_ENABLED).toBe("false");
    });

    it("does not expose private answer keys in catalog or detail APIs", async () => {
      const labDetail = await practicalLabService.getLabById("mech-lab-stress-strain");
      expect(labDetail).toBeDefined();

      for (const task of labDetail.tasks) {
        expect(task.acceptedAnswer).toBeUndefined();
        expect(task.correctOptionId).toBeUndefined();
      }
    });

    it("throws a 404 ApiError when requesting an unsupported non-existent lab", async () => {
      await expect(
        practicalLabService.getLabById("non-existent-quantum-simulator")
      ).rejects.toThrow("Practical lab non-existent-quantum-simulator not found");
    });
  });
});
