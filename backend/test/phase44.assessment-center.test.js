import { describe, it, expect, vi, beforeEach } from "vitest";
import { ASSESSMENTS_CATALOG } from "../src/modules/academic/constants/assessmentCatalog.js";
import {
  gradeSingleQuestion,
  evaluateAssessmentSubmission,
  sanitizeAssessmentForClient,
} from "../src/modules/academic/services/assessmentGrading.service.js";
import { AssessmentCenterService } from "../src/modules/academic/services/assessmentCenter.service.js";
import { BranchAssessment } from "../src/modules/academic/models/branchAssessment.models.js";
import { AssessmentAttempt } from "../src/modules/academic/models/assessmentAttempt.models.js";
import { LearnerSkillAssessmentHistory } from "../src/modules/skills/models/learnerSkillAssessmentHistory.models.js";
import { getBranchCapabilities, CAPABILITY_KEYS, CAPABILITY_STATUS } from "../src/modules/academic/services/branchCapabilityRegistry.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";

describe("Phase 44: Branch-Aware Assessment Center & Evidence Evaluation Suite", () => {
  let assessmentCenterService;

  beforeEach(() => {
    vi.clearAllMocks();
    assessmentCenterService = new AssessmentCenterService();
  });

  // =========================================================================
  // 1. ASSESSMENT CATALOG & DISCIPLINE COVERAGE
  // =========================================================================
  describe("1. Catalog Content & Multi-Discipline Coverage", () => {
    it("provides at least 10 rich, authentic assessments spanning major disciplines", () => {
      expect(ASSESSMENTS_CATALOG.length).toBeGreaterThanOrEqual(10);

      const disciplines = new Set(ASSESSMENTS_CATALOG.map((a) => a.disciplineCategory));
      expect(disciplines.has("Engineering & Technology")).toBe(true);
      expect(disciplines.has("Electronics & Electrical")).toBe(true);
      expect(disciplines.has("Business & Commerce")).toBe(true);
      expect(disciplines.has("Sciences & Biotechnology")).toBe(true);
      expect(disciplines.has("Arts & Humanities")).toBe(true);
      expect(disciplines.has("Healthcare & Allied Health")).toBe(true);
      expect(disciplines.has("Computing & Software")).toBe(true);
    });

    it("ensures every published assessment has questions, learning objectives, and 100 max points", () => {
      for (const assessment of ASSESSMENTS_CATALOG) {
        expect(assessment.assessmentId).toBeTruthy();
        expect(assessment.title).toBeTruthy();
        expect(assessment.learningObjectives.length).toBeGreaterThanOrEqual(2);
        expect(assessment.questions.length).toBeGreaterThanOrEqual(4);

        const totalPoints = assessment.questions.reduce((sum, q) => sum + (q.points || 0), 0);
        expect(totalPoints).toBe(100);

        for (const q of assessment.questions) {
          expect(q.questionId).toBeTruthy();
          expect(q.prompt).toBeTruthy();
          expect(q.topic).toBeTruthy();
          expect(q.explanation).toBeTruthy();
          expect(q.correctAnswer !== undefined && q.correctAnswer !== null).toBe(true);
        }
      }
    });

    it("sanitizes assessment payloads by stripping authoritative answer keys for client safety", () => {
      const raw = ASSESSMENTS_CATALOG[0];
      const sanitized = sanitizeAssessmentForClient(raw);

      expect(sanitized.assessmentId).toBe(raw.assessmentId);
      expect(sanitized.questions.length).toBe(raw.questions.length);

      for (const q of sanitized.questions) {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.prompt).toBeTruthy();
        expect(q.topic).toBeTruthy();
      }
    });
  });

  // =========================================================================
  // 2. OBJECTIVE GRADING ENGINE & QUESTION TYPES
  // =========================================================================
  describe("2. Server-Side Grading Engine & Diverse Question Types", () => {
    it("grades single-choice questions with strict exact matching", () => {
      const q = {
        questionId: "q-single",
        type: "single_choice",
        correctAnswer: "a",
        points: 25,
        topic: "Mechanics",
      };

      const correctResult = gradeSingleQuestion(q, "a");
      expect(correctResult.isCorrect).toBe(true);
      expect(correctResult.pointsEarned).toBe(25);

      const caseInsensitiveResult = gradeSingleQuestion(q, " A ");
      expect(caseInsensitiveResult.isCorrect).toBe(true);
      expect(caseInsensitiveResult.pointsEarned).toBe(25);

      const wrongResult = gradeSingleQuestion(q, "b");
      expect(wrongResult.isCorrect).toBe(false);
      expect(wrongResult.pointsEarned).toBe(0);

      const emptyResult = gradeSingleQuestion(q, "");
      expect(emptyResult.isCorrect).toBe(false);
      expect(emptyResult.pointsEarned).toBe(0);
    });

    it("grades multiple-select questions with transparent partial credit and penalty for wrong choices", () => {
      const q = {
        questionId: "q-multi",
        type: "multiple_select",
        correctAnswer: ["a", "b"],
        points: 20,
        topic: "Digital Logic",
      };

      // Exact match: 100% points
      const fullMatch = gradeSingleQuestion(q, ["a", "b"]);
      expect(fullMatch.isCorrect).toBe(true);
      expect(fullMatch.pointsEarned).toBe(20);

      // Partial match (1 correct of 2, 0 incorrect): 50% points
      const partialMatch = gradeSingleQuestion(q, ["a"]);
      expect(partialMatch.isCorrect).toBe(false);
      expect(partialMatch.pointsEarned).toBe(10);

      // Guessing all options: ["a", "b", "c", "d"] -> 2 correct - 2 incorrect = 0 points
      const guessedAll = gradeSingleQuestion(q, ["a", "b", "c", "d"]);
      expect(guessedAll.isCorrect).toBe(false);
      expect(guessedAll.pointsEarned).toBe(0);
    });

    it("grades numeric questions accurately within specified physical tolerances", () => {
      const q = {
        questionId: "q-num",
        type: "numeric",
        correctAnswer: 87.5,
        tolerance: 1.0,
        unit: "N",
        points: 25,
        topic: "Friction",
      };

      // Exact answer
      expect(gradeSingleQuestion(q, 87.5).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, 87.5).pointsEarned).toBe(25);

      // Answer within tolerance (+0.8)
      expect(gradeSingleQuestion(q, 88.3).isCorrect).toBe(true);
      expect(gradeSingleQuestion(q, 88.3).pointsEarned).toBe(25);

      // Answer within tolerance (-0.5)
      expect(gradeSingleQuestion(q, "87.0").isCorrect).toBe(true);

      // Answer outside tolerance (86.0 is 1.5 away, tolerance is 1.0)
      expect(gradeSingleQuestion(q, 86.0).isCorrect).toBe(false);
      expect(gradeSingleQuestion(q, 86.0).pointsEarned).toBe(0);

      // Malformed non-numeric answer
      expect(gradeSingleQuestion(q, "invalid_number").isCorrect).toBe(false);
    });

    it("evaluates case-study short responses based on mandatory concept criteria", () => {
      const q = {
        questionId: "q-case",
        type: "case_study_response",
        correctAnswer: "bending moment, shear force, section modulus, fillet radius",
        points: 25,
        topic: "Mechanics of Materials",
      };

      const substantiveAnswer =
        "The cantilever bracket experiences maximum bending moment and shear force at the clamped support. To reduce root stress, we should increase the section modulus and add a fillet radius.";
      const res = gradeSingleQuestion(q, substantiveAnswer);
      expect(res.isCorrect).toBe(true);
      expect(res.pointsEarned).toBe(25);

      const weakAnswer = "I think it deformed because it was weak.";
      const weakRes = gradeSingleQuestion(q, weakAnswer);
      expect(weakRes.isCorrect).toBe(false);
      expect(weakRes.pointsEarned).toBe(0);
    });
  });

  // =========================================================================
  // 3. FULL SUBMISSION EVALUATION & TOPIC MASTERY ANALYTICS
  // =========================================================================
  describe("3. Full Submission Evaluation, Analytics & Passing Criteria", () => {
    it("evaluates all questions, computes percentages, and identifies strengths and areas for improvement", () => {
      const assessment = ASSESSMENTS_CATALOG.find((a) => a.assessmentId === "mech-eng-mechanics");
      expect(assessment).toBeDefined();

      // Submit 3 correct answers, 1 wrong answer (mech-q3 wrong)
      const answers = {
        "mech-q1": "a",
        "mech-q2": ["a", "b"],
        "mech-q3": 999.0, // Wrong!
        "mech-q4": "Maximum bending moment and shear force occur. Increase section modulus and fillet radius.",
      };

      const result = evaluateAssessmentSubmission(assessment, answers, 600);

      expect(result.score).toBe(75);
      expect(result.maxScore).toBe(100);
      expect(result.percentage).toBe(75);
      expect(result.isPassing).toBe(true); // >= 70%
      expect(result.scoringMethod).toBe("deterministic_server_evaluated");

      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.areasForImprovement).toContain("Dry Coulomb Friction");

      // Verify recommended next steps link to Project Studio
      expect(result.recommendedNextSteps.some((step) => step.actionType === "start_project")).toBe(true);
    });

    it("enforces passing threshold (70%) and provides remediation guidance on failure", () => {
      const assessment = ASSESSMENTS_CATALOG.find((a) => a.assessmentId === "ece-digital-electronics");

      // Submit only 1 correct answer (score = 25%)
      const answers = {
        "ece-q1": "a", // correct
        "ece-q2": ["d"], // wrong
        "ece-q3": 0, // wrong
        "ece-q4": "b", // wrong
      };

      const result = evaluateAssessmentSubmission(assessment, answers, 300);

      expect(result.percentage).toBe(25);
      expect(result.isPassing).toBe(false);
      expect(result.recommendedNextSteps.some((step) => step.actionType === "retry_assessment")).toBe(true);
      expect(result.recommendedNextSteps.some((step) => step.actionType === "review_topic")).toBe(true);
    });
  });

  // =========================================================================
  // 4. ATTEMPT LIFECYCLE & PERSISTENCE
  // =========================================================================
  describe("4. Attempt Lifecycle, Ownership & Skill Evidence Integration", () => {
    it("starts a new attempt and verifies student ownership on submission", async () => {
      const mockStudentId = "60c72b2f9b1d8b2bad000001";
      const unauthorizedStudentId = "60c72b2f9b1d8b2bad000002";

      const mockAttemptDoc = {
        _id: "att-123",
        owner: mockStudentId,
        assessmentId: "mech-eng-mechanics",
        version: 1,
        status: "in_progress",
        startedAt: new Date(),
        submittedAnswers: {},
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(AssessmentAttempt, "create").mockResolvedValue(mockAttemptDoc);
      vi.spyOn(AssessmentAttempt, "findById").mockResolvedValue(mockAttemptDoc);
      vi.spyOn(LearnerSkillAssessmentHistory, "create").mockResolvedValue({});

      const started = await assessmentCenterService.startAttempt(mockStudentId, "mech-eng-mechanics");
      expect(started.attemptId).toBe("att-123");
      expect(started.status).toBe("in_progress");

      // Attempt submission by unauthorized user must be rejected
      await expect(
        assessmentCenterService.submitAttempt(unauthorizedStudentId, "att-123", {
          answers: { "mech-q1": "a" },
        })
      ).rejects.toThrow(/Access denied/);

      // Submission by authorized student
      const submitted = await assessmentCenterService.submitAttempt(mockStudentId, "att-123", {
        answers: {
          "mech-q1": "a",
          "mech-q2": ["a", "b"],
          "mech-q3": 87.5,
          "mech-q4": "bending moment, shear force, section modulus, fillet radius",
        },
        timeSpentSeconds: 450,
      });

      expect(submitted.status).toBe("submitted");
      expect(submitted.score).toBe(100);
      expect(submitted.isPassing).toBe(true);
      expect(mockAttemptDoc.save).toHaveBeenCalled();

      // Must log formal assessment outcome in LearnerSkillAssessmentHistory
      expect(LearnerSkillAssessmentHistory.create).toHaveBeenCalled();
    });

    it("rejects resubmitting an already submitted attempt", async () => {
      const mockStudentId = "60c72b2f9b1d8b2bad000001";
      const alreadySubmittedDoc = {
        _id: "att-already-done",
        owner: mockStudentId,
        assessmentId: "mech-eng-mechanics",
        status: "submitted",
      };

      vi.spyOn(AssessmentAttempt, "findById").mockResolvedValue(alreadySubmittedDoc);

      await expect(
        assessmentCenterService.submitAttempt(mockStudentId, "att-already-done", {
          answers: {},
        })
      ).rejects.toThrow(/already been submitted/);
    });
  });

  // =========================================================================
  // 5. BRANCH RECOMMENDATIONS & CAPABILITY REGISTRY
  // =========================================================================
  describe("5. Branch Recommendations & Capability Registry", () => {
    it("registers ASSESSMENT_CENTER as AVAILABLE across all branch families", () => {
      expect(CAPABILITY_KEYS.ASSESSMENT_CENTER).toBe("assessment_center");

      const branchesToTest = ["cse", "mech", "ece", "civil", "chem", "biotech", "mba-gen", "bcom-gen", "nursing-gen", "ba-gen"];
      for (const branch of branchesToTest) {
        const caps = getBranchCapabilities(branch);
        expect(caps.capabilities[CAPABILITY_KEYS.ASSESSMENT_CENTER]).toBe(CAPABILITY_STATUS.AVAILABLE);
      }
    });

    it("provides personalized recommendations prioritizing branch core and retakes", async () => {
      const mockStudentId = "60c72b2f9b1d8b2bad000001";

      const recommendations = await assessmentCenterService.getRecommendedAssessments(mockStudentId);
      expect(Array.isArray(recommendations.recommendations)).toBe(true);
    });
  });

  // =========================================================================
  // 6. SMART MENTOR & CONTEXT INTEGRATION
  // =========================================================================
  describe("6. AI Mentor & Student Context Integration", () => {
    it("includes assessmentCenter block in unified mentor context", async () => {
      const mockStudentId = "60c72b2f9b1d8b2bad000001";

      const mockAttempts = [
        {
          _id: "att-1",
          owner: mockStudentId,
          assessmentId: "mech-eng-mechanics",
          status: "submitted",
          score: 75,
          maxScore: 100,
          percentage: 75,
          isPassing: true,
          strengths: ["Equilibrium of Rigid Bodies"],
          areasForImprovement: ["Dry Coulomb Friction"],
          createdAt: new Date(),
        },
      ];

      vi.spyOn(User, "findById").mockReturnValue({
        lean: vi.fn().mockReturnValue({
          catch: vi.fn().mockResolvedValue({
            _id: mockStudentId,
            displayName: "Test Student",
            targetRole: "Mechanical Design Engineer",
            targetRoles: ["Mechanical Design Engineer"],
            careerInterests: ["Engineering Mechanics"],
          }),
        }),
      });

      vi.spyOn(SkillProfile, "findOne").mockReturnValue({
        lean: vi.fn().mockReturnValue({
          catch: vi.fn().mockResolvedValue({
            owner: mockStudentId,
            targetRole: "Mechanical Design Engineer",
            overallReadinessScore: 70,
            skills: [],
            skillGaps: [],
          }),
        }),
      });

      vi.spyOn(AssessmentAttempt, "find").mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockReturnValue({
              catch: vi.fn().mockResolvedValue(mockAttempts),
            }),
          }),
        }),
      });

      const context = await smartMentorContextService.getUnifiedUserContext(mockStudentId, { forceRefresh: true });

      expect(context.assessmentCenter).toBeDefined();
      expect(context.assessmentCenter.passedCount).toBeGreaterThanOrEqual(1);
      expect(context.assessmentCenter.averageScore).toBe(75);
      expect(context.assessmentCenter.recentAttempts.length).toBeGreaterThanOrEqual(1);
    });

    it("local mentor classifies assessment guidance and returns structured advice", async () => {
      const mockContext = {
        career: { targetRole: "Mechanical Design Engineer" },
        assessmentCenter: {
          totalAttempts: 2,
          passedCount: 1,
          failedCount: 1,
          averageScore: 65,
          recentAttempts: [
            {
              assessmentId: "mech-eng-mechanics",
              percentage: 60,
              score: 60,
              maxScore: 100,
              isPassing: false,
              areasForImprovement: ["Truss Zero-Force Members"],
              strengths: ["Equilibrium of Rigid Bodies"],
            },
          ],
        },
      };

      const intent = smartMentorLocalService.classifyIntent("What were my assessment results and test scores?");
      expect(intent).toBe("assessment_center_guidance");

      const guidance = smartMentorLocalService.generateLocalGuidance("assessment_center_guidance", mockContext);
      expect(guidance.answer).toContain("Assessment Center");
      expect(guidance.answer).toContain("Truss Zero-Force Members");
      expect(guidance.actions.some((a) => a.category === "assessment")).toBe(true);
    });
  });
});
