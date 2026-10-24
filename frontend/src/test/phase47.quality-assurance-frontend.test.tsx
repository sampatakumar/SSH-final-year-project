import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PracticalLabsPage } from "../pages/PracticalLabsPage";
import { LabWorkspace } from "../modules/labs/components/LabWorkspace";
import { LabCard } from "../modules/labs/components/LabCard";
import { practicalLabApi } from "../modules/labs/services/practicalLab.api";
import { PracticalLab, PracticalLabAttempt } from "../modules/labs/types/practicalLab.types";

// Mock AuthContext
vi.mock("../core/auth/AuthContext", () => ({
  useAuth: () => ({
    firebaseUser: {
      uid: "test-qa-student-001",
      email: "qa.student@university.edu",
      getIdToken: vi.fn().mockResolvedValue("mock-jwt-token"),
    },
    backendUser: {
      _id: "test-qa-student-001",
      name: "QA Student",
      branch: "civil",
      targetRole: "Structural Design Engineer",
    },
    loading: false,
  }),
}));

const mockCivilLab: PracticalLab = {
  labId: "civil-lab-beam-bending",
  title: "Beam Bending Moment & Shear Stress Analysis Lab",
  description: "Calculate reactions, maximum bending moment, and normal bending stress for simply supported beams.",
  disciplineCategory: "Civil & Environmental",
  branchSlugs: ["civil", "struct"],
  canonicalDisciplines: ["civil"],
  relevantSkills: ["Structural Analysis", "Reinforced Concrete"],
  learningObjectives: [
    "Calculate support reactions Ra and Rb.",
    "Calculate maximum midspan bending moment Mmax.",
  ],
  difficulty: "Intermediate",
  estimatedMinutes: 25,
  labType: "numerical_calculation",
  safetySensitive: true,
  disclaimer: "Strictly educational structural mechanics simulation. Not for actual stamped construction calculations.",
  scenario: {
    context: "A simply supported steel wide-flange beam spans L = 6.0 m subjected to w = 12.0 kN/m and P = 20.0 kN at midspan.",
    assumptions: "Euler-Bernoulli linear elastic beam theory.",
    parameters: {
      length_m: 6.0,
      udl_kN_per_m: 12.0,
      pointLoad_kN: 20.0,
    },
  },
  tasks: [
    {
      taskId: "civ-bm-1",
      prompt: "Calculate support reaction Ra (in kN).",
      type: "numerical",
      unit: "kN",
      points: 50,
      remediationGuidance: "Sum vertical forces and use symmetry: Ra = (w*L)/2 + P/2.",
    },
    {
      taskId: "civ-bm-2",
      prompt: "Calculate maximum bending moment Mmax (in kN*m).",
      type: "numerical",
      unit: "kN*m",
      points: 50,
      remediationGuidance: "Mmax = (w*L^2)/8 + (P*L)/4.",
    },
  ],
  status: "published",
  version: 1,
};

const mockNursingLab: PracticalLab = {
  labId: "nursing-lab-dosage-calculation",
  title: "Weight-Based Pediatric Drug Dosage Verification",
  description: "Verify weight-based pediatric prescription dosages and calculate exact liquid suspension volumes.",
  disciplineCategory: "Nursing & Health Sciences",
  branchSlugs: ["nursing", "health"],
  canonicalDisciplines: ["nursing"],
  relevantSkills: ["Pharmacology & Drug Administration", "Patient Safety"],
  learningObjectives: ["Calculate total daily dosage.", "Calculate volume per single dose."],
  difficulty: "Intermediate",
  estimatedMinutes: 20,
  labType: "numerical_calculation",
  safetySensitive: true,
  disclaimer: "Strictly educational pharmacology math exercise. Independent double-check by a second licensed practitioner is required for all real-world pediatric medication administrations.",
  tasks: [
    {
      taskId: "nurs-ds-1",
      prompt: "Calculate total daily dose (in mg/day).",
      type: "numerical",
      unit: "mg/day",
      points: 50,
    },
    {
      taskId: "nurs-ds-2",
      prompt: "Calculate volume to administer per single dose (in mL).",
      type: "numerical",
      unit: "mL",
      points: 50,
    },
  ],
  status: "published",
  version: 1,
};

describe("Phase 47: Frontend Quality Assurance & Accessibility Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. LAB CARD & CATALOG INTEGRATION
  // =========================================================================
  describe("1. LabCard & Catalog Browsing", () => {
    it("renders lab details with safety-sensitive indicator and disclaimer badge", () => {
      render(
        <MemoryRouter>
          <LabCard lab={mockCivilLab} onSelect={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText("Beam Bending Moment & Shear Stress Analysis Lab")).toBeInTheDocument();
      expect(screen.getByText("Civil & Environmental")).toBeInTheDocument();
      expect(screen.getByText(/25m/i)).toBeInTheDocument();
      expect(screen.getByText("Intermediate")).toBeInTheDocument();

      // Safety-sensitive badge is rendered
      expect(screen.getByText("Safety-Sensitive")).toBeInTheDocument();

      // Launch button is present
      const launchBtn = screen.getByRole("button", { name: /launch lab/i });
      expect(launchBtn).toBeInTheDocument();
    });

    it("triggers onSelect callback when launch button is clicked", () => {
      const handleSelect = vi.fn();
      render(
        <MemoryRouter>
          <LabCard lab={mockCivilLab} onSelect={handleSelect} />
        </MemoryRouter>
      );

      const launchBtn = screen.getByRole("button", { name: /launch lab/i });
      fireEvent.click(launchBtn);
      expect(handleSelect).toHaveBeenCalledWith(mockCivilLab.labId);
    });
  });

  // =========================================================================
  // 2. INTERACTIVE WORKSPACE & INPUT VALIDATION
  // =========================================================================
  describe("2. LabWorkspace Form & Validation", () => {
    it("displays prominent educational disclaimers on safety-critical activities", () => {
      render(
        <MemoryRouter>
          <LabWorkspace lab={mockNursingLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText("Weight-Based Pediatric Drug Dosage Verification")).toBeInTheDocument();
      expect(screen.getByText(/Educational Model Notice:/i)).toBeInTheDocument();
      expect(screen.getByText(/Independent double-check by a second licensed practitioner/i)).toBeInTheDocument();
    });

    it("prevents empty submission and displays an informative validation error", async () => {
      render(
        <MemoryRouter>
          <LabWorkspace lab={mockCivilLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole("button", { name: /submit for evaluation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Please enter answers for the practical tasks before submitting/i)
        ).toBeInTheDocument();
      });
    });

    it("renders engineering scenario context and parameters cleanly", () => {
      render(
        <MemoryRouter>
          <LabWorkspace lab={mockCivilLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText(/Engineering Scenario & Given Data/i)).toBeInTheDocument();
      expect(screen.getByText(/simply supported steel wide-flange beam/i)).toBeInTheDocument();
      expect(screen.getByText(/Euler-Bernoulli linear elastic beam theory/i)).toBeInTheDocument();
      expect(screen.getByText("length_m")).toBeInTheDocument();
      expect(screen.getByText("6")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. SUBMISSION FLOW & RESULT PRESENTATION
  // =========================================================================
  describe("3. Authoritative Submission & Results Flow", () => {
    it("evaluates answers authoritatively and renders server-calculated score and next actions", async () => {
      const mockResult: PracticalLabAttempt = {
        _id: "attempt_civ_99",
        owner: "test-qa-student-001",
        labId: mockCivilLab.labId,
        labVersion: 1,
        title: mockCivilLab.title,
        disciplineCategory: mockCivilLab.disciplineCategory,
        branchSlugs: ["civil"],
        canonicalDisciplines: ["civil"],
        labType: "numerical_calculation",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        masteryLevel: "Mastered",
        evaluationFeedback: {
          summary: "Outstanding performance! All beam calculations verified within accepted engineering tolerance.",
          passingThreshold: 70,
        },
        taskResults: [
          {
            taskId: "civ-bm-1",
            type: "numerical",
            submittedValue: 46.0,
            isCorrect: true,
            earnedPoints: 50,
            pointsEarned: 50,
            maxPoints: 50,
            acceptedAnswer: 46.0,
            unit: "kN",
            toleranceUsed: 0.02,
            explanation: "Reaction Ra = 46.0 kN.",
            solutionExplanation: "Reaction Ra = 46.0 kN.",
            feedback: "Correct within tolerance.",
          },
          {
            taskId: "civ-bm-2",
            type: "numerical",
            submittedValue: 84.0,
            isCorrect: true,
            earnedPoints: 50,
            pointsEarned: 50,
            maxPoints: 50,
            acceptedAnswer: 84.0,
            unit: "kN*m",
            toleranceUsed: 0.02,
            explanation: "Midspan maximum moment Mmax = 84.0 kN*m.",
            solutionExplanation: "Midspan maximum moment Mmax = 84.0 kN*m.",
            feedback: "Correct within tolerance.",
          },
        ],
        nextActionRecommendations: [
          {
            actionType: "start_project",
            title: "Build Project: Structural Steel Frame Blueprint",
            destination: "/dashboard/projects?templateId=civil-steel-frame",
            description: "Apply your practical competence on an end-to-end design blueprint.",
          },
        ],
        skillsEvaluated: ["Structural Analysis"],
        learningObjectivesEvaluated: ["Calculate support reactions Ra and Rb."],
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(practicalLabApi, "submitLabAttempt").mockResolvedValue(mockResult);

      render(
        <MemoryRouter>
          <LabWorkspace lab={mockCivilLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      // Input task answers
      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "46.0" } });
      fireEvent.change(inputs[1], { target: { value: "84.0" } });

      const submitBtn = screen.getByRole("button", { name: /submit for evaluation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Practical Competence Demonstrated!")).toBeInTheDocument();
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("Mastered")).toBeInTheDocument();
        expect(screen.getByText(/Outstanding performance! All beam calculations verified/i)).toBeInTheDocument();
        expect(screen.getByText("Build Project: Structural Steel Frame Blueprint")).toBeInTheDocument();
      });
    });

    it("displays failed attempt with remediation guidance and retry button", async () => {
      const mockFailResult: PracticalLabAttempt = {
        _id: "attempt_civ_fail",
        owner: "test-qa-student-001",
        labId: mockCivilLab.labId,
        labVersion: 1,
        title: mockCivilLab.title,
        disciplineCategory: mockCivilLab.disciplineCategory,
        branchSlugs: ["civil"],
        canonicalDisciplines: ["civil"],
        labType: "numerical_calculation",
        serverScore: 50,
        maxScore: 100,
        percentage: 50,
        isPassing: false,
        masteryLevel: "Needs Remediation",
        evaluationFeedback: {
          summary: "Attempt scored 50% (passing mark is 70%). Review task step solutions and reattempt.",
          passingThreshold: 70,
        },
        taskResults: [
          {
            taskId: "civ-bm-1",
            type: "numerical",
            submittedValue: 46.0,
            isCorrect: true,
            earnedPoints: 50,
            pointsEarned: 50,
            maxPoints: 50,
            acceptedAnswer: 46.0,
            unit: "kN",
            toleranceUsed: 0.02,
            explanation: "Ra = 46.0 kN.",
            solutionExplanation: "Ra = 46.0 kN.",
            feedback: "Correct.",
          },
          {
            taskId: "civ-bm-2",
            type: "numerical",
            submittedValue: 12.0,
            isCorrect: false,
            earnedPoints: 0,
            pointsEarned: 0,
            maxPoints: 50,
            acceptedAnswer: 84.0,
            unit: "kN*m",
            toleranceUsed: 0.02,
            explanation: "Midspan maximum moment Mmax = 84.0 kN*m.",
            solutionExplanation: "Midspan maximum moment Mmax = 84.0 kN*m.",
            feedback: "Incorrect value 12 outside tolerance range.",
            remediationGuidance: "Mmax = (w*L^2)/8 + (P*L)/4.",
          },
        ],
        nextActionRecommendations: [
          {
            actionType: "review_concept",
            title: "Review Prerequisite Concepts",
            destination: "/dashboard/roadmap",
            description: "Review bending moment diagrams on your adaptive roadmap.",
          },
        ],
        skillsEvaluated: ["Structural Analysis"],
        learningObjectivesEvaluated: [],
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(practicalLabApi, "submitLabAttempt").mockResolvedValue(mockFailResult);

      render(
        <MemoryRouter>
          <LabWorkspace lab={mockCivilLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "46.0" } });
      fireEvent.change(inputs[1], { target: { value: "12.0" } });

      const submitBtn = screen.getByRole("button", { name: /submit for evaluation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText("Attempt Review & Remediation")).toBeInTheDocument();
        expect(screen.getByText("50%")).toBeInTheDocument();
        expect(screen.getByText("Needs Remediation")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /retry lab/i })).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // 4. ACCESSIBILITY & USABILITY CHECKS
  // =========================================================================
  describe("4. Accessibility & Responsive UX Standards", () => {
    it("ensures all interactive task input controls are keyboard accessible and have descriptive values", () => {
      render(
        <MemoryRouter>
          <LabWorkspace lab={mockCivilLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      const numberInputs = screen.getAllByRole("spinbutton");
      expect(numberInputs.length).toBe(2);

      // Verify each input is focusable and allows typing
      numberInputs[0].focus();
      expect(document.activeElement).toBe(numberInputs[0]);

      fireEvent.change(numberInputs[0], { target: { value: "46.0" } });
      expect(numberInputs[0]).toHaveValue(46);
    });

    it("displays textual feedback alongside visual status badges without relying solely on color", async () => {
      const mockResult: PracticalLabAttempt = {
        _id: "att_acc_1",
        owner: "test-qa-student-001",
        labId: mockCivilLab.labId,
        labVersion: 1,
        title: mockCivilLab.title,
        disciplineCategory: mockCivilLab.disciplineCategory,
        branchSlugs: ["civil"],
        canonicalDisciplines: ["civil"],
        labType: "numerical_calculation",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        masteryLevel: "Mastered",
        evaluationFeedback: {
          summary: "All answers verified.",
          passingThreshold: 70,
        },
        taskResults: [
          {
            taskId: "civ-bm-1",
            type: "numerical",
            submittedValue: 46.0,
            isCorrect: true,
            earnedPoints: 50,
            pointsEarned: 50,
            maxPoints: 50,
            acceptedAnswer: 46.0,
            unit: "kN",
            toleranceUsed: 0.02,
            explanation: "Ra = 46 kN.",
            solutionExplanation: "Ra = 46 kN.",
            feedback: "Correct.",
          },
          {
            taskId: "civ-bm-2",
            type: "numerical",
            submittedValue: 84.0,
            isCorrect: true,
            earnedPoints: 50,
            pointsEarned: 50,
            maxPoints: 50,
            acceptedAnswer: 84.0,
            unit: "kN*m",
            toleranceUsed: 0.02,
            explanation: "Mmax = 84 kN*m.",
            solutionExplanation: "Mmax = 84 kN*m.",
            feedback: "Correct.",
          },
        ],
        nextActionRecommendations: [],
        skillsEvaluated: ["Structural Analysis"],
        learningObjectivesEvaluated: [],
        status: "submitted",
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(practicalLabApi, "submitLabAttempt").mockResolvedValue(mockResult);

      render(
        <MemoryRouter>
          <LabWorkspace lab={mockCivilLab} onBack={vi.fn()} />
        </MemoryRouter>
      );

      const inputs = screen.getAllByRole("spinbutton");
      fireEvent.change(inputs[0], { target: { value: "46.0" } });
      fireEvent.change(inputs[1], { target: { value: "84.0" } });
      fireEvent.click(screen.getByRole("button", { name: /submit for evaluation/i }));

      await waitFor(() => {
        // Textual indicator is rendered ("Correct (+50 pts)"), not just a green colored box
        expect(screen.getAllByText(/Correct \(\+50 pts\)/i).length).toBe(2);
      });
    });
  });
});
