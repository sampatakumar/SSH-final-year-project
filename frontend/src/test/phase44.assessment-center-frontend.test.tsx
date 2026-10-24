import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AssessmentCatalogView } from "../modules/assessments/components/AssessmentCatalogView";
import { ActiveAssessmentWorkspace } from "../modules/assessments/components/ActiveAssessmentWorkspace";
import { AssessmentResultsView } from "../modules/assessments/components/AssessmentResultsView";
import { AssessmentHistoryView } from "../modules/assessments/components/AssessmentHistoryView";
import { AssessmentCenterPage } from "../pages/AssessmentCenterPage";
import {
  BranchAssessment,
  AssessmentAttempt,
  RecommendedAssessmentItem,
} from "../modules/assessments/types/assessmentCenter.types";
import { assessmentCenterApi } from "../modules/assessments/services/assessmentCenter.api";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// Mock useAuth hook
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    user: { _id: "user123", email: "student@example.com", branch: "mech" },
    idToken: "mock-id-token",
    loading: false,
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Phase 44: Branch-Aware Assessment Center Frontend Suite", () => {
  const mockAssessments: BranchAssessment[] = [
    {
      assessmentId: "mech-mechanics-materials-01",
      title: "Engineering Mechanics & Structural Material Properties",
      description: "Evaluate core concepts in statics, stress-strain behavior, and yield criteria.",
      branchSlugs: ["mech", "auto", "aero"],
      disciplineCategory: "Engineering & Technology",
      difficulty: "Intermediate",
      estimatedDuration: "25 mins",
      assessmentType: "mixed",
      learningObjectives: [
        "Calculate normal stress and identify Hooke's law limits.",
        "Differentiate Tresca and von Mises failure criteria.",
      ],
      prerequisites: ["Engineering Physics", "Calculus I"],
      passingCriteria: { minScore: 70, passingPercentage: 70 },
      recommendedProjectIds: ["mech-cad-gearbox-design"],
      relevantSkills: ["Stress Analysis", "Statics", "Materials Selection"],
      status: "published",
      questions: [
        {
          questionId: "q1",
          type: "single_choice",
          prompt: "A mild steel rod of cross-sectional area 200 mm² carries a tensile load of 40 kN. What is the nominal normal stress?",
          options: [
            { optionId: "opt_a", text: "100 MPa" },
            { optionId: "opt_b", text: "200 MPa" },
            { optionId: "opt_c", text: "400 MPa" },
            { optionId: "opt_d", text: "80 MPa" },
          ],
          points: 25,
          topic: "Stress & Strain",
          explanation: "Normal stress σ = P / A = 40,000 N / 200 mm² = 200 N/mm² = 200 MPa.",
          remediationGuidance: "Review axial normal stress formula σ = P/A and unit conversion from kN and mm² to MPa.",
        },
        {
          questionId: "q2",
          type: "multiple_select",
          prompt: "Select ALL mechanisms that contribute to strengthening metallic alloys:",
          options: [
            { optionId: "opt_a", text: "Grain boundary refinement (Hall-Petch relationship)" },
            { optionId: "opt_b", text: "Solid solution strengthening" },
            { optionId: "opt_c", text: "Precipitation / age hardening" },
            { optionId: "opt_d", text: "Complete grain growth at recrystallization temperature" },
          ],
          points: 25,
          topic: "Material Science",
          explanation: "Grain growth softens metals rather than strengthening them.",
          remediationGuidance: "Review Chapter 7 on dislocation mechanics and strengthening mechanisms in metals.",
        },
        {
          questionId: "q3",
          type: "numeric",
          prompt: "A cylindrical steel pressure vessel with inner diameter 500 mm and wall thickness 5 mm operates at internal pressure 2 MPa. Calculate hoop stress in MPa.",
          points: 25,
          topic: "Pressure Vessels",
          tolerance: 2,
          unit: "MPa",
          explanation: "Thin-walled cylinder hoop stress σ_h = P * d / (2 * t) = (2 * 500) / (2 * 5) = 100 MPa.",
          remediationGuidance: "Review Barlow's / thin cylinder formula σ_hoop = P*d/(2*t).",
        },
        {
          questionId: "q4",
          type: "case_study_response",
          prompt: "Analyze the root cause and formulate engineering recommendations for shaft fatigue failure.",
          caseStudyContext: "A high-speed blower drive shaft manufactured from AISI 4140 steel failed after 3,000 operating hours at a keyway transition.",
          rubricCriteria: [
            "Identifies stress concentration at keyway radius",
            "Identifies cyclic bending/torsional fatigue",
            "Proposes generous fillet radius and surface shot peening",
          ],
          points: 25,
          topic: "Failure Analysis",
          explanation: "Keyway root radii introduce stress concentration factors Kt > 2.5.",
          remediationGuidance: "Study Peterson's Stress Concentration Factors for shaft keyways.",
        },
      ],
    },
    {
      assessmentId: "ece-circuits-signals-01",
      title: "Electronic Circuits & Signal Analysis",
      description: "Assess circuit analysis theorems, operational amplifiers, and frequency response.",
      branchSlugs: ["ece", "eee"],
      disciplineCategory: "Electronics & Electrical",
      difficulty: "Beginner",
      estimatedDuration: "20 mins",
      assessmentType: "objective_quiz",
      learningObjectives: ["Apply Thevenin's theorem.", "Analyze ideal inverting op-amp circuits."],
      prerequisites: ["Circuit Theory"],
      passingCriteria: { minScore: 70, passingPercentage: 70 },
      relevantSkills: ["Circuit Analysis", "Op-Amps"],
      status: "published",
      questions: [
        {
          questionId: "q1",
          type: "single_choice",
          prompt: "In an ideal inverting op-amp circuit with Rin = 10 kΩ and Rf = 100 kΩ, what is the closed-loop voltage gain?",
          options: [
            { optionId: "opt_a", text: "-10" },
            { optionId: "opt_b", text: "+10" },
            { optionId: "opt_c", text: "-11" },
            { optionId: "opt_d", text: "+100" },
          ],
          points: 50,
          topic: "Operational Amplifiers",
        },
      ],
    },
  ];

  const mockRecommendations: RecommendedAssessmentItem[] = [
    {
      reason: "branch_core",
      reasonLabel: "Core Academic Requirement",
      assessment: mockAssessments[0],
      priority: 1,
    },
  ];

  const mockAttempt: AssessmentAttempt = {
    _id: "attempt_101",
    owner: "user123",
    assessmentId: "mech-mechanics-materials-01",
    version: 1,
    status: "submitted",
    startedAt: "2026-10-24T10:00:00.000Z",
    submittedAt: "2026-10-24T10:18:00.000Z",
    timeSpentSeconds: 1080,
    submittedAnswers: {
      q1: "opt_b",
      q2: ["opt_a", "opt_b", "opt_c"],
      q3: 100,
      q4: "Keyway stress concentration led to fatigue cracking.",
    },
    score: 100,
    maxScore: 100,
    percentage: 100,
    isPassing: true,
    scoringMethod: "Authoritative server-side answer-key & partial credit formula",
    strengths: ["Strong mastery in Stress & Strain", "Accurate Pressure Vessels calculation"],
    areasForImprovement: [],
    topicPerformance: [
      {
        topic: "Stress & Strain",
        questionsCount: 1,
        correctCount: 1,
        score: 25,
        maxScore: 25,
        percentage: 100,
        masteryLevel: "Proficient",
      },
      {
        topic: "Material Science",
        questionsCount: 1,
        correctCount: 1,
        score: 25,
        maxScore: 25,
        percentage: 100,
        masteryLevel: "Proficient",
      },
    ],
    questionResults: [
      {
        questionId: "q1",
        type: "single_choice",
        prompt: "A mild steel rod of cross-sectional area 200 mm² carries a tensile load of 40 kN.",
        submittedAnswer: "opt_b",
        isCorrect: true,
        pointsEarned: 25,
        maxPoints: 25,
        explanation: "Normal stress σ = P / A = 200 MPa.",
        remediationGuidance: "Review axial normal stress formula σ = P/A.",
        topic: "Stress & Strain",
      },
    ],
    recommendedNextSteps: [
      {
        actionType: "start_project",
        title: "Speed Reducer Gearbox: 3D CAD Parametric Assembly",
        description: "Apply your solid mechanics expertise to design an industrial speed reducer gearbox.",
        linkUrl: "/dashboard/projects?templateId=mech-cad-gearbox-design",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. Assessment Catalog View Tests
  // ==========================================
  describe("AssessmentCatalogView Component", () => {
    it("renders assessment cards with titles and duration", () => {
      render(
        <AssessmentCatalogView
          assessments={mockAssessments}
          recommendations={[]}
          userBranch="mech"
          onStartAssessment={vi.fn()}
        />
      );

      expect(
        screen.getByText("Engineering Mechanics & Structural Material Properties")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Electronic Circuits & Signal Analysis")
      ).toBeInTheDocument();
      expect(screen.getByText("25 mins")).toBeInTheDocument();
      expect(screen.getByText("4 Questions")).toBeInTheDocument();
    });

    it("displays personalized branch recommendations banner", () => {
      render(
        <AssessmentCatalogView
          assessments={mockAssessments}
          recommendations={mockRecommendations}
          userBranch="mech"
          onStartAssessment={vi.fn()}
        />
      );

      expect(screen.getByText("Recommended for Your Pathway")).toBeInTheDocument();
      expect(screen.getByText("Core Academic Requirement")).toBeInTheDocument();
    });

    it("filters assessments when searching by keyword", () => {
      render(
        <AssessmentCatalogView
          assessments={mockAssessments}
          recommendations={[]}
          onStartAssessment={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText("Search assessments, topics, or skills...");
      fireEvent.change(searchInput, { target: { value: "circuits" } });

      expect(screen.getByText("Electronic Circuits & Signal Analysis")).toBeInTheDocument();
      expect(
        screen.queryByText("Engineering Mechanics & Structural Material Properties")
      ).not.toBeInTheDocument();
    });

    it("filters assessments by discipline category button", () => {
      render(
        <AssessmentCatalogView
          assessments={mockAssessments}
          recommendations={[]}
          onStartAssessment={vi.fn()}
        />
      );

      const categoryBtns = screen.getAllByText("Electronics & Electrical");
      fireEvent.click(categoryBtns[0]);

      expect(screen.getByText("Electronic Circuits & Signal Analysis")).toBeInTheDocument();
      expect(
        screen.queryByText("Engineering Mechanics & Structural Material Properties")
      ).not.toBeInTheDocument();
    });

    it("triggers onStartAssessment when clicking Start Assessment", () => {
      const handleStart = vi.fn();
      render(
        <AssessmentCatalogView
          assessments={mockAssessments}
          recommendations={[]}
          onStartAssessment={handleStart}
        />
      );

      const startBtns = screen.getAllByText(/Start Assessment/i);
      fireEvent.click(startBtns[0]);

      expect(handleStart).toHaveBeenCalledWith("mech-mechanics-materials-01");
    });

    it("opens and views linked Project Studio blueprint modal", () => {
      render(
        <AssessmentCatalogView
          assessments={mockAssessments}
          recommendations={[]}
          onStartAssessment={vi.fn()}
        />
      );

      const blueprintBtns = screen.getAllByText("View Blueprint");
      fireEvent.click(blueprintBtns[0]);

      expect(screen.getByText("Question Format Breakdown")).toBeInTheDocument();
      expect(screen.getByText("Recommended Prerequisites")).toBeInTheDocument();
    });
  });

  // ==========================================
  // 2. Active Assessment Workspace Tests
  // ==========================================
  describe("ActiveAssessmentWorkspace Component", () => {
    it("renders question prompt, options, live timer, and question stepper", () => {
      render(
        <ActiveAssessmentWorkspace
          assessment={mockAssessments[0]}
          attemptId="attempt_101"
          onSubmitAttempt={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByTestId("question-step-0")).toBeInTheDocument();
      expect(screen.getByText(/A mild steel rod of cross-sectional area 200 mm²/)).toBeInTheDocument();
      expect(screen.getByText("200 MPa")).toBeInTheDocument();
    });

    it("handles single-choice answer selection and navigates to next question", () => {
      render(
        <ActiveAssessmentWorkspace
          assessment={mockAssessments[0]}
          attemptId="attempt_101"
          onSubmitAttempt={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const optionB = screen.getByText("200 MPa");
      fireEvent.click(optionB);

      const nextBtn = screen.getByText(/Next/i);
      fireEvent.click(nextBtn);

      expect(screen.getByText(/Select ALL mechanisms that contribute to strengthening/)).toBeInTheDocument();
    });

    it("handles multiple-select checkbox toggling for multi-select questions", () => {
      render(
        <ActiveAssessmentWorkspace
          assessment={mockAssessments[0]}
          attemptId="attempt_101"
          onSubmitAttempt={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Navigate to Q2 (multiple_select) via button 2
      fireEvent.click(screen.getByTestId("question-step-1"));

      const optA = screen.getByText("Solid solution strengthening");
      fireEvent.click(optA);

      expect(screen.getByText(/Select all that apply/i)).toBeInTheDocument();
    });

    it("handles numeric input and tolerance unit display", () => {
      render(
        <ActiveAssessmentWorkspace
          assessment={mockAssessments[0]}
          attemptId="attempt_101"
          onSubmitAttempt={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Navigate to Q3 (numeric) via button 3
      fireEvent.click(screen.getByTestId("question-step-2"));

      expect(screen.getByText(/Calculation tolerance: ±2 MPa/i)).toBeInTheDocument();
      const numInput = screen.getByPlaceholderText("Enter numeric value...");
      fireEvent.change(numInput, { target: { value: "100" } });
      expect(numInput).toHaveValue(100);
    });

    it("opens submission confirmation dialog and submits answers", () => {
      const handleSubmit = vi.fn();
      render(
        <ActiveAssessmentWorkspace
          assessment={mockAssessments[0]}
          attemptId="attempt_101"
          onSubmitAttempt={handleSubmit}
          onCancel={vi.fn()}
        />
      );

      // Answer Q1
      fireEvent.click(screen.getByText("200 MPa"));

      // Navigate to Q4 (last question)
      fireEvent.click(screen.getByTestId("question-step-3"));

      // Click Submit Assessment
      const submitBtn = screen.getByText("Submit Assessment");
      fireEvent.click(submitBtn);

      expect(screen.getByText("Confirm Assessment Submission")).toBeInTheDocument();

      // Confirm final submission
      const confirmBtn = screen.getByText("Confirm & Submit");
      fireEvent.click(confirmBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ q1: "opt_b" }),
        expect.any(Number)
      );
    });
  });

  // ==========================================
  // 3. Assessment Results View Tests
  // ==========================================
  describe("AssessmentResultsView Component", () => {
    it("renders score hero, pass badge, and percentage accurately", () => {
      render(
        <AssessmentResultsView
          attempt={mockAttempt}
          assessment={mockAssessments[0]}
          onRetry={vi.fn()}
          onBackToCatalog={vi.fn()}
        />
      );

      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("Passed Threshold (≥70%)")).toBeInTheDocument();
      expect(screen.getByText(/Strong mastery in Stress & Strain/)).toBeInTheDocument();
    });

    it("displays topic mastery levels with proficient status", () => {
      render(
        <AssessmentResultsView
          attempt={mockAttempt}
          assessment={mockAssessments[0]}
          onRetry={vi.fn()}
          onBackToCatalog={vi.fn()}
        />
      );

      expect(screen.getByText("Topic-Level Mastery Analysis")).toBeInTheDocument();
      expect(screen.getByText("Stress & Strain")).toBeInTheDocument();
      expect(screen.getByText("Material Science")).toBeInTheDocument();
      expect(screen.getAllByText("Proficient").length).toBeGreaterThan(0);
    });

    it("renders detailed question review and explanations", () => {
      render(
        <AssessmentResultsView
          attempt={mockAttempt}
          assessment={mockAssessments[0]}
          onRetry={vi.fn()}
          onBackToCatalog={vi.fn()}
        />
      );

      expect(screen.getByText("Detailed Question Review & Explanations")).toBeInTheDocument();
      expect(screen.getByText(/Normal stress σ = P \/ A = 200 MPa/)).toBeInTheDocument();
    });

    it("triggers retry callback when Retake Assessment is clicked", () => {
      const handleRetry = vi.fn();
      render(
        <AssessmentResultsView
          attempt={mockAttempt}
          assessment={mockAssessments[0]}
          onRetry={handleRetry}
          onBackToCatalog={vi.fn()}
        />
      );

      const retryBtn = screen.getByText("Retake Assessment");
      fireEvent.click(retryBtn);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================
  // 4. Assessment History View Tests
  // ==========================================
  describe("AssessmentHistoryView Component", () => {
    it("renders empty state when no attempts exist", () => {
      const handleExplore = vi.fn();
      render(
        <AssessmentHistoryView
          attempts={[]}
          onSelectAttempt={vi.fn()}
          onStartAssessment={vi.fn()}
          onExploreCatalog={handleExplore}
        />
      );

      expect(screen.getByTestId("empty-history-state")).toBeInTheDocument();
      expect(screen.getByText("No Assessment History Found")).toBeInTheDocument();

      const exploreBtn = screen.getByTestId("explore-catalog-btn");
      fireEvent.click(exploreBtn);
      expect(handleExplore).toHaveBeenCalledTimes(1);
    });

    it("renders attempt records with pass rate and review buttons", () => {
      const handleSelect = vi.fn();
      const handleRetake = vi.fn();
      render(
        <AssessmentHistoryView
          attempts={[mockAttempt]}
          onSelectAttempt={handleSelect}
          onStartAssessment={handleRetake}
          onExploreCatalog={vi.fn()}
        />
      );

      expect(screen.getByTestId("assessment-history-view")).toBeInTheDocument();
      expect(screen.getByText("Total Attempts")).toBeInTheDocument();
      expect(screen.getByText("Pass Rate")).toBeInTheDocument();
      expect(screen.getAllByText("100%").length).toBeGreaterThanOrEqual(1);

      const reviewBtn = screen.getByTestId("review-btn-attempt_101");
      fireEvent.click(reviewBtn);
      expect(handleSelect).toHaveBeenCalledWith("attempt_101");

      const retakeBtn = screen.getByTestId("retake-btn-mech-mechanics-materials-01");
      fireEvent.click(retakeBtn);
      expect(handleRetake).toHaveBeenCalledWith("mech-mechanics-materials-01");
    });
  });

  // ==========================================
  // 5. Container AssessmentCenterPage Integration Tests
  // ==========================================
  describe("AssessmentCenterPage Container", () => {
    beforeEach(() => {
      vi.spyOn(assessmentCenterApi, "fetchAssessments").mockResolvedValue({
        assessments: mockAssessments,
        total: 2,
      });
      vi.spyOn(assessmentCenterApi, "fetchRecommendations").mockResolvedValue({
        recommendations: mockRecommendations,
        branchSlug: "mech",
        totalAttempts: 1,
      });
      vi.spyOn(assessmentCenterApi, "fetchMyAttempts").mockResolvedValue({
        attempts: [mockAttempt],
        total: 1,
      });
    });

    it("renders container page with tabs and loads assessments", async () => {
      render(<AssessmentCenterPage />);

      expect(screen.getByTestId("assessment-center-page")).toBeInTheDocument();
      expect(screen.getByText("Discipline Assessment Center")).toBeInTheDocument();
      expect(screen.getByTestId("tab-catalog")).toBeInTheDocument();
      expect(screen.getByTestId("tab-history")).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getAllByText("Engineering Mechanics & Structural Material Properties").length
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it("switches to Attempt History tab and displays attempts", async () => {
      render(<AssessmentCenterPage />);

      await waitFor(() => {
        expect(
          screen.getAllByText("Engineering Mechanics & Structural Material Properties").length
        ).toBeGreaterThanOrEqual(1);
      });

      const historyTab = screen.getByTestId("tab-history");
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByTestId("assessment-history-view")).toBeInTheDocument();
      });
    });

    it("navigates to Project Studio when clicking header button", async () => {
      render(<AssessmentCenterPage />);

      const navBtn = screen.getByTestId("nav-project-studio-btn");
      fireEvent.click(navBtn);

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/projects");
    });
  });
});
