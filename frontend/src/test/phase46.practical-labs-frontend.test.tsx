import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { LabCard } from "../modules/labs/components/LabCard";
import { LabWorkspace } from "../modules/labs/components/LabWorkspace";
import { LabHistoryView } from "../modules/labs/components/LabHistoryView";
import { PracticalLabsPage } from "../pages/PracticalLabsPage";
import {
  PracticalLab,
  PracticalLabAttempt,
} from "../modules/labs/types/practicalLab.types";
import { practicalLabApi } from "../modules/labs/services/practicalLab.api";

// Mock useAuth
vi.mock("../core/auth/AuthContext", () => ({
  useAuth: () => ({
    firebaseUser: {
      email: "engineer.student@example.com",
      getIdToken: () => Promise.resolve("mock-id-token"),
    },
    backendUser: {
      displayName: "Jane Engineer",
      email: "engineer.student@example.com",
      branch: "mech",
    },
  }),
}));

describe("Phase 46: Branch-Aware Practical Labs Frontend Suite", () => {
  const mockLabMech: PracticalLab = {
    labId: "mech-lab-stress-strain",
    title: "Tensile Stress, Strain & Factor of Safety Lab",
    description: "Calculate normal tensile stress, elastic elongation, and factor of safety.",
    disciplineCategory: "Mechanical & Industrial",
    canonicalDisciplines: ["mech", "auto"],
    branchSlugs: ["mech", "auto"],
    relevantSkills: ["Engineering Mechanics", "Statics", "Materials Science"],
    learningObjectives: [
      "Calculate normal stress in a circular bar under uniaxial tensile load.",
      "Determine Factor of Safety against material yield strength.",
    ],
    difficulty: "Intermediate",
    estimatedMinutes: 25,
    labType: "numerical_calculation",
    scenario: {
      context: "A cylindrical suspension tie-rod fabricated from AISI 1045 steel is subjected to an axial tensile force P = 45 kN.",
      assumptions: "Pure uniaxial tension; linear elastic regime.",
      parameters: {
        loadP_kN: 45,
        diameter_mm: 20,
        yieldStrength_MPa: 310,
      },
    },
    tasks: [
      {
        taskId: "mech-ss-1",
        prompt: "Calculate the normal tensile stress sigma (in MPa) in the rod: sigma = P / A.",
        type: "numerical",
        unit: "MPa",
        roundingDecimals: 2,
        points: 50,
      },
      {
        taskId: "mech-ss-2",
        prompt: "Calculate the Factor of Safety (n) against yield: n = Sy / sigma.",
        type: "numerical",
        unit: "ratio",
        roundingDecimals: 2,
        points: 50,
      },
    ],
    disclaimer: "Educational stress calculation under idealized uniaxial conditions.",
    passingCriteria: { minScore: 70, passingPercentage: 70 },
    version: 1,
    status: "published",
  };

  const mockLabCSE: PracticalLab = {
    labId: "cse-lab-algo-complexity",
    title: "Algorithmic Complexity & Execution Tracing Lab",
    description: "Analyze loop bounds and evaluate asymptotic Big-O growth.",
    disciplineCategory: "Computer Science & IT",
    canonicalDisciplines: ["cse", "it"],
    branchSlugs: ["cse", "it"],
    relevantSkills: ["Algorithms", "Data Structures", "Time Complexity"],
    learningObjectives: [
      "Calculate exact comparison iterations for nested matrix loops.",
      "Evaluate cache vs tree trade-offs.",
    ],
    difficulty: "Beginner",
    estimatedMinutes: 20,
    labType: "numerical_calculation",
    scenario: {
      context: "A distributed microservice processes an incoming square matrix of size N = 500.",
    },
    tasks: [
      {
        taskId: "cse-task-1",
        prompt: "Calculate exact iterations executed by triangular nested loop: N*(N-1)/2.",
        type: "numerical",
        points: 50,
      },
      {
        taskId: "cse-task-2",
        prompt: "Select the optimal collection for O(1) expected time key lookups.",
        type: "multiple_choice",
        points: 50,
        options: [
          { optionId: "opt-hash", label: "Hash Table (O(1) expected)" },
          { optionId: "opt-array", label: "Unsorted Array (O(N))" },
        ],
      },
    ],
    disclaimer: "Educational complexity model under idealized execution.",
    version: 1,
    status: "published",
  };

  const mockPassingAttempt: PracticalLabAttempt = {
    _id: "attempt-12345",
    owner: "user-mech-01",
    labId: "mech-lab-stress-strain",
    labVersion: 1,
    title: "Tensile Stress, Strain & Factor of Safety Lab",
    disciplineCategory: "Mechanical & Industrial",
    labType: "numerical_calculation",
    serverScore: 100,
    maxScore: 100,
    percentage: 100,
    isPassing: true,
    masteryLevel: "Mastered",
    evaluationFeedback: {
      summary: "Successfully completed with verified score of 100%. Practical competence demonstrated.",
      passingThreshold: 70,
    },
    taskResults: [
      {
        taskId: "mech-ss-1",
        submittedValue: 143.24,
        isCorrect: true,
        pointsEarned: 50,
        maxPoints: 50,
        acceptedAnswer: 143.24,
        unit: "MPa",
        solutionExplanation: "Area = 314.16 mm^2. Stress = 45,000 / 314.16 = 143.24 MPa.",
      },
      {
        taskId: "mech-ss-2",
        submittedValue: 2.16,
        isCorrect: true,
        pointsEarned: 50,
        maxPoints: 50,
        acceptedAnswer: 2.16,
        unit: "ratio",
        solutionExplanation: "Factor of safety = 310 / 143.24 = 2.16.",
      },
    ],
    skillsEvaluated: ["Engineering Mechanics", "Statics"],
    learningObjectivesEvaluated: ["Calculate normal stress in a circular bar."],
    nextActionRecommendations: [
      {
        actionType: "explore_assessment",
        title: "Take Formal Discipline Assessment",
        destination: "/dashboard/assessments?id=mech-eng-mechanics",
        description: "Validate your comprehensive domain knowledge in Assessment Center.",
      },
      {
        actionType: "start_project",
        title: "Build Project Studio Blueprint",
        destination: "/dashboard/projects?templateId=mech-cad-gearbox-design",
        description: "Apply your practical competence on an end-to-end portfolio project.",
      },
    ],
    status: "submitted",
    submittedAt: "2026-10-24T18:00:00.000Z",
    durationMinutes: 18,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. LAB CARD COMPONENT TESTS
  // =========================================================================
  describe("1. LabCard Component", () => {
    it("renders title, discipline category, difficulty, duration, and skills", () => {
      const handleSelect = vi.fn();
      render(<LabCard lab={mockLabMech} onSelect={handleSelect} />);

      expect(screen.getByText("Tensile Stress, Strain & Factor of Safety Lab")).toBeInTheDocument();
      expect(screen.getByText("Mechanical & Industrial")).toBeInTheDocument();
      expect(screen.getByText("Intermediate")).toBeInTheDocument();
      expect(screen.getByText("25m")).toBeInTheDocument();
      expect(screen.getByText("Engineering Mechanics")).toBeInTheDocument();
      expect(screen.getByText("Statics")).toBeInTheDocument();
      expect(screen.getByText("2 Practical Tasks")).toBeInTheDocument();
    });

    it("triggers onSelect callback when clicking Launch Lab", () => {
      const handleSelect = vi.fn();
      render(<LabCard lab={mockLabMech} onSelect={handleSelect} />);

      const launchBtn = screen.getByRole("button", { name: /Launch Lab/i });
      fireEvent.click(launchBtn);

      expect(handleSelect).toHaveBeenCalledWith("mech-lab-stress-strain");
    });
  });

  // =========================================================================
  // 2. INTERACTIVE WORKSPACE & SUBMISSION
  // =========================================================================
  describe("2. LabWorkspace Component", () => {
    it("renders scenario parameters, task prompts, and input fields", () => {
      const handleBack = vi.fn();
      render(
        <BrowserRouter>
          <LabWorkspace lab={mockLabMech} onBack={handleBack} />
        </BrowserRouter>
      );

      expect(screen.getByText("Tensile Stress, Strain & Factor of Safety Lab")).toBeInTheDocument();
      expect(screen.getByText(/Engineering Scenario & Given Data/i)).toBeInTheDocument();
      expect(screen.getByText(/loadP_kN/i)).toBeInTheDocument();
      expect(screen.getByText("45")).toBeInTheDocument();

      expect(screen.getByText(/Calculate the normal tensile stress sigma/i)).toBeInTheDocument();
      expect(screen.getByText(/Calculate the Factor of Safety/i)).toBeInTheDocument();
      expect(screen.getAllByText("MPa").length).toBeGreaterThanOrEqual(1);
    });

    it("prevents submission and displays warning if no inputs are entered", async () => {
      const handleBack = vi.fn();
      render(
        <BrowserRouter>
          <LabWorkspace lab={mockLabMech} onBack={handleBack} />
        </BrowserRouter>
      );

      const submitBtn = screen.getByRole("button", { name: /Submit for Evaluation/i });
      fireEvent.click(submitBtn);

      expect(
        await screen.findByText("Please enter answers for the practical tasks before submitting.")
      ).toBeInTheDocument();
    });

    it("submits answers to API and renders authoritative server scoring and solutions", async () => {
      vi.spyOn(practicalLabApi, "submitLabAttempt").mockResolvedValue(mockPassingAttempt);

      const handleBack = vi.fn();
      const handleCompleted = vi.fn();

      render(
        <BrowserRouter>
          <LabWorkspace
            lab={mockLabMech}
            onBack={handleBack}
            onAttemptCompleted={handleCompleted}
          />
        </BrowserRouter>
      );

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs.length).toBe(2);

      fireEvent.change(inputs[0], { target: { value: "143.24" } });
      fireEvent.change(inputs[1], { target: { value: "2.16" } });

      const submitBtn = screen.getByRole("button", { name: /Submit for Evaluation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(practicalLabApi.submitLabAttempt).toHaveBeenCalledWith(
          "mech-lab-stress-strain",
          expect.objectContaining({
            submittedAnswers: {
              "mech-ss-1": "143.24",
              "mech-ss-2": "2.16",
            },
          }),
          undefined
        );
      });

      // Verify server results banner
      expect(await screen.findByText("Practical Competence Demonstrated!")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("Mastered")).toBeInTheDocument();

      // Verify solutions and recommendations
      expect(screen.getAllByText(/Solution & Engineering Rationale/i).length).toBe(2);
      expect(screen.getByText("Take Formal Discipline Assessment")).toBeInTheDocument();
      expect(screen.getByText("Build Project Studio Blueprint")).toBeInTheDocument();

      expect(handleCompleted).toHaveBeenCalledWith(mockPassingAttempt);
    });
  });

  // =========================================================================
  // 3. ATTEMPT HISTORY VIEW
  // =========================================================================
  describe("3. LabHistoryView Component", () => {
    it("renders past attempts with scores, percentages, and mastery badges", () => {
      const handleExplore = vi.fn();
      render(
        <LabHistoryView
          attempts={[mockPassingAttempt]}
          onExploreLabs={handleExplore}
        />
      );

      expect(screen.getByText("Tensile Stress, Strain & Factor of Safety Lab")).toBeInTheDocument();
      expect(screen.getByText("Mechanical & Industrial")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
      expect(screen.getByText("Mastered")).toBeInTheDocument();
    });

    it("renders empty state when student has no attempts", () => {
      const handleExplore = vi.fn();
      render(<LabHistoryView attempts={[]} onExploreLabs={handleExplore} />);

      expect(screen.getByText("No Practical Lab Attempts Yet")).toBeInTheDocument();
      const exploreBtn = screen.getByRole("button", { name: /Explore Available Labs/i });
      fireEvent.click(exploreBtn);
      expect(handleExplore).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. MAIN PRACTICAL LABS PAGE
  // =========================================================================
  describe("4. PracticalLabsPage Orchestration", () => {
    it("loads and displays multi-discipline catalog and filters", async () => {
      vi.spyOn(practicalLabApi, "fetchLabCatalog").mockResolvedValue({
        labs: [mockLabMech, mockLabCSE],
        total: 2,
      });
      vi.spyOn(practicalLabApi, "fetchUserLabHistory").mockResolvedValue([mockPassingAttempt]);

      render(
        <BrowserRouter>
          <PracticalLabsPage />
        </BrowserRouter>
      );

      expect(screen.getByText("Branch-Aware Practical Labs")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Tensile Stress, Strain & Factor of Safety Lab")).toBeInTheDocument();
        expect(screen.getByText("Algorithmic Complexity & Execution Tracing Lab")).toBeInTheDocument();
      });

      // Filter buttons
      expect(screen.getByText("CSE / IT")).toBeInTheDocument();
      expect(screen.getByText("Mechanical")).toBeInTheDocument();
      expect(screen.getByText("Civil")).toBeInTheDocument();
      expect(screen.getByText("Chemical")).toBeInTheDocument();
      expect(screen.getByText("Nursing / Health")).toBeInTheDocument();
    });

    it("switches to My Attempts tab", async () => {
      vi.spyOn(practicalLabApi, "fetchLabCatalog").mockResolvedValue({
        labs: [mockLabMech],
        total: 1,
      });
      vi.spyOn(practicalLabApi, "fetchUserLabHistory").mockResolvedValue([mockPassingAttempt]);

      render(
        <BrowserRouter>
          <PracticalLabsPage />
        </BrowserRouter>
      );

      const attemptsTab = await screen.findByRole("button", { name: /My Attempts/i });
      fireEvent.click(attemptsTab);

      expect(await screen.findByText("Mastered")).toBeInTheDocument();
    });
  });
});
