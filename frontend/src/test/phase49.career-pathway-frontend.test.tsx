import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { CareerPathwayStudioPage } from "../pages/CareerPathwayStudioPage";
import { careerPathwayApi } from "../modules/career/services/careerPathway.api";
import { AuthContext } from "../core/auth/AuthContext";
import { CareerRole } from "../modules/career/types/careerPathway.types";

const MOCK_ROLES: CareerRole[] = [
  {
    roleId: "mechanical-design-engineer",
    title: "Mechanical Design Engineer",
    roleFamily: "Mechanical & Manufacturing",
    disciplineCategory: "Mechanical Engineering",
    branchSlugs: ["mech", "auto", "aero"],
    crossDisciplinaryAccessible: false,
    transferableSkills: ["Engineering Mechanics"],
    mobilityRationale: "Requires mechanical engineering background.",
    description: "Designs mechanical assemblies and CAD models.",
    experienceLevel: "Entry-Level",
    coreSkills: [
      { skill: "Engineering Mechanics", importance: "critical", minProficiency: "Proficient", targetScore: 80 },
      { skill: "CAD Modeling", importance: "high", minProficiency: "Competent", targetScore: 75 },
    ],
    recommendedSkills: [],
    prerequisiteCompetencies: ["Calculus I"],
    relevantEvidenceTypes: ["practical_lab"],
    portfolioExpectations: ["CAD drawings"],
    unassessableCompetencies: ["Physical CNC milling"],
    regulatoryNotes: "PE licensure required for stamping.",
    suggestedLabIds: ["mech-lab-stress-strain"],
    suggestedAssessmentIds: ["mech-eng-mechanics"],
    suggestedProjectIds: ["mech-cad-gearbox-design"],
    relevance: { type: "primary", score: 95, rationale: "Direct academic alignment" },
  },
  {
    roleId: "frontend-developer",
    title: "Frontend Developer",
    roleFamily: "Software & Computing",
    disciplineCategory: "Computer Science & IT",
    branchSlugs: ["cse", "it"],
    crossDisciplinaryAccessible: true,
    transferableSkills: ["Problem Solving"],
    mobilityRationale: "Accessible from other branches via JavaScript mastery.",
    description: "Builds responsive web applications with React.",
    experienceLevel: "Entry-Level",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient", targetScore: 80 },
      { skill: "React", importance: "critical", minProficiency: "Proficient", targetScore: 80 },
    ],
    recommendedSkills: [],
    prerequisiteCompetencies: ["Variables & Loops"],
    relevantEvidenceTypes: ["practical_lab"],
    portfolioExpectations: ["React application"],
    unassessableCompetencies: ["Field interviews"],
    regulatoryNotes: null,
    suggestedLabIds: ["cse-lab-algo-complexity"],
    suggestedAssessmentIds: ["cse-software-architecture"],
    suggestedProjectIds: ["cse-distributed-microservices-app"],
    relevance: { type: "cross_disciplinary", score: 75, rationale: "Transferable cross-disciplinary pathway" },
  },
];

const mockAuthContext: any = {
  firebaseUser: { email: "student@example.com" },
  backendUser: {
    email: "student@example.com",
    academic: { branch: "mech", degree: "btech" },
  },
  signOutUser: async () => {},
  loading: false,
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe("Phase 49: Career Pathway Studio Frontend Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("49.1 Renders the Career Pathway Studio hero heading and branch badge", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: MOCK_ROLES,
      branch: "mech",
      total: 2,
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    expect(screen.getByText("Multi-Branch Career Pathway Studio")).toBeInTheDocument();
    expect(screen.getByText("Evidence-Based Career Pathways")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mechanical Design Engineer")).toBeInTheDocument();
      expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    });
  });

  it("49.2 Displays discipline tabs and triggers filtering when a tab is clicked", async () => {
    const getRolesSpy = vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: [MOCK_ROLES[0]],
      branch: "mech",
      total: 1,
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Mechanical Design Engineer")).toBeInTheDocument();
    });

    // Click on Mechanical tab
    const mechTab = screen.getByRole("button", { name: "Mechanical" });
    fireEvent.click(mechTab);

    await waitFor(() => {
      expect(getRolesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          roleFamily: "Mechanical & Manufacturing",
        })
      );
    });
  });

  it("49.3 Displays Degree Match and Cross-Discipline badges appropriately", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: MOCK_ROLES,
      branch: "mech",
      total: 2,
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Degree Match")).toBeInTheDocument();
      expect(screen.getByText("Cross-Discipline Bridge")).toBeInTheDocument();
    });
  });

  it("49.4 Inspecting a role triggers the RoleDetailModal with requirements", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: MOCK_ROLES,
      branch: "mech",
      total: 2,
    });

    vi.spyOn(careerPathwayApi, "evaluateRoleReadiness").mockResolvedValue({
      roleId: "mechanical-design-engineer",
      roleTitle: "Mechanical Design Engineer",
      roleFamily: "Mechanical & Manufacturing",
      disciplineCategory: "Mechanical Engineering",
      heuristicReadinessIndex: 75,
      readinessBand: "Substantially Evidenced",
      evidenceCoveragePercent: 80,
      counts: { totalCoreSkills: 2, demonstrated: 1, partial: 1, unassessed: 0, gaps: 0, stale: 0 },
      skillsBreakdown: {
        demonstrated: [{ skill: "Engineering Mechanics", score: 85, targetScore: 80, importance: "critical", sourceType: "practical_lab", confidenceWeight: 0.9, timestamp: "" }],
        partial: [],
        unassessed: [],
        gaps: [],
      },
      evidenceQualityNotes: { staleEvidence: [], conflictingEvidence: [], missingPrerequisites: [] },
      unassessableCompetencies: ["Physical CNC milling"],
      regulatoryNotes: "PE licensure required for stamping.",
      disclaimer: "Internal heuristic readiness index for formative learning guidance only.",
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Mechanical Design Engineer")).toBeInTheDocument();
    });

    const inspectButtons = screen.getAllByRole("button", { name: /Inspect Track/i });
    fireEvent.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Requirements & Competencies/i })).toBeInTheDocument();
      expect(screen.getByText("PE licensure required for stamping.")).toBeInTheDocument();
    });
  });

  it("49.5 Selecting two roles enables side-by-side comparison action bar", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: MOCK_ROLES,
      branch: "mech",
      total: 2,
    });

    vi.spyOn(careerPathwayApi, "compareRoles").mockResolvedValue({
      role1: {
        roleId: "mechanical-design-engineer",
        title: "Mechanical Design Engineer",
        roleFamily: "Mechanical & Manufacturing",
        disciplineCategory: "Mechanical Engineering",
        readinessIndex: 75,
        readinessBand: "Substantially Evidenced",
        evidenceCoveragePercent: 80,
        uniqueSkills: ["CAD Modeling"],
        regulatoryNotes: "PE licensure required.",
      },
      role2: {
        roleId: "frontend-developer",
        title: "Frontend Developer",
        roleFamily: "Software & Computing",
        disciplineCategory: "Computer Science & IT",
        readinessIndex: 60,
        readinessBand: "Developing Competency",
        evidenceCoveragePercent: 50,
        uniqueSkills: ["React"],
        regulatoryNotes: null,
      },
      comparison: {
        sharedCoreSkills: ["Problem Solving"],
        sharedDemonstratedSkills: [],
        readinessDelta: 15,
        higherReadinessRoleId: "mechanical-design-engineer",
        alignmentSummary: "You currently have stronger demonstrated evidence for Mechanical Design Engineer.",
      },
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Mechanical Design Engineer")).toBeInTheDocument();
    });

    const compareButtons = screen.getAllByRole("button", { name: /Compare/i });
    fireEvent.click(compareButtons[0]); // select role 1
    fireEvent.click(compareButtons[1]); // select role 2

    await waitFor(() => {
      expect(screen.getByText("2 of 2 tracks selected for comparison")).toBeInTheDocument();
      const compareNowBtn = screen.getByRole("button", { name: /Compare Side-by-Side/i });
      expect(compareNowBtn).toBeEnabled();
      fireEvent.click(compareNowBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Side-by-Side Career Pathway Comparison")).toBeInTheDocument();
      expect(screen.getByText(/You currently have stronger demonstrated evidence for Mechanical Design Engineer/i)).toBeInTheDocument();
    });
  });

  it("49.6 Clicking Prep Plan opens PreparationPlanModal with actionable platform links", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: MOCK_ROLES,
      branch: "mech",
      total: 2,
    });

    vi.spyOn(careerPathwayApi, "getPreparationPlan").mockResolvedValue({
      roleId: "mechanical-design-engineer",
      roleTitle: "Mechanical Design Engineer",
      readinessBand: "Substantially Evidenced",
      heuristicReadinessIndex: 75,
      totalSteps: 2,
      plan: [
        {
          stepNumber: 1,
          priority: "High (Remediation)",
          targetSkill: "Engineering Mechanics",
          evidenceGapType: "skill_gap",
          title: "Complete Stress-Strain Practical Lab",
          rationale: "Core requirement for structural evaluation.",
          activityType: "practical_lab",
          activityId: "mech-lab-stress-strain",
          activityTitle: "Stress-Strain Analysis Lab",
          destinationRoute: "/dashboard/labs?labId=mech-lab-stress-strain",
          prerequisiteRequirement: null,
          expectedOutcome: "Server-verified practical lab score >= 70%.",
        },
      ],
      regulatoryNotes: "PE licensure required.",
      disclaimer: "Completing recommendations builds verified evidence.",
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Mechanical Design Engineer")).toBeInTheDocument();
    });

    const prepPlanButtons = screen.getAllByRole("button", { name: /Prep Plan/i });
    fireEvent.click(prepPlanButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Complete Stress-Strain Practical Lab")).toBeInTheDocument();
      expect(screen.getByText(/Core requirement for structural evaluation/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Launch/i })).toHaveAttribute(
        "href",
        "/dashboard/labs?labId=mech-lab-stress-strain"
      );
    });
  });

  it("49.7 Displays graceful empty state when no roles match criteria", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockResolvedValue({
      roles: [],
      branch: "mech",
      total: 0,
    });

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("No Career Pathways Found")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Reset All Filters/i })).toBeInTheDocument();
    });
  });

  it("49.8 Displays error state when API fails with retry button", async () => {
    vi.spyOn(careerPathwayApi, "getCareerRoles").mockRejectedValue(
      new Error("Network connectivity issue")
    );

    renderWithProviders(<CareerPathwayStudioPage />);

    await waitFor(() => {
      expect(screen.getByText("Network connectivity issue")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
    });
  });
});
