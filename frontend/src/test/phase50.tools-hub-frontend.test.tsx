import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { ToolHubPage } from "../pages/ToolHubPage";
import { MechanicalCalcWorkspace } from "../modules/tools/components/MechanicalCalcWorkspace";
import { EceCircuitsWorkspace } from "../modules/tools/components/EceCircuitsWorkspace";
import { CivilBoqWorkspace } from "../modules/tools/components/CivilBoqWorkspace";
import { NursingStudyWorkspace } from "../modules/tools/components/NursingStudyWorkspace";
import { SharedReportReviewerWorkspace } from "../modules/tools/components/SharedReportReviewerWorkspace";
import { ToolActivityHistoryDrawer } from "../modules/tools/components/ToolActivityHistoryDrawer";
import { toolsApi } from "../modules/tools/services/tools.api";
import { AuthContext } from "../core/auth/AuthContext";
import { CanonicalTool, ToolCatalogResponse } from "../modules/tools/types/tools.types";

const MOCK_TOOLS: CanonicalTool[] = [
  {
    toolId: "mech-calc",
    displayName: "Mechanical Engineering Calculation & Design Review Assistant",
    shortDescription: "Deterministic stress-strain, factor-of-safety, gear-train ratios, and beam bending.",
    academicDiscipline: "Mechanical Engineering",
    disciplineCategory: "Mechanical Engineering",
    branchSlugs: ["mech", "auto", "aero"],
    category: "Engineering Calculations",
    intendedTask: "Perform verified mechanical strength, safety factor, and transmission ratio calculations.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/mech-calc",
    isExternalRoute: false,
    supportedInputs: [
      { name: "forceN", type: "number", description: "Axial force", required: true, unit: "N" },
      { name: "areaMm2", type: "number", description: "Area", required: true, unit: "mm²" },
    ],
    outputFormat: "structured_engineering_calculation_report",
    safetyDisclaimers: "EDUCATIONAL CALCULATION ONLY",
    limitations: ["Assumes isotropic material."],
    version: "1.0.0",
  },
  {
    toolId: "ece-circuits",
    displayName: "Circuit Analysis Learning Studio",
    shortDescription: "Educational DC circuit solver supporting series/parallel equivalents.",
    academicDiscipline: "ECE & EEE",
    disciplineCategory: "ECE & EEE",
    branchSlugs: ["ece", "eee"],
    category: "Circuit Analysis",
    intendedTask: "Solve DC circuit network properties and equivalent resistances.",
    executionMode: "deterministic",
    status: "operational",
    route: "/dashboard/tools/ece-circuits",
    isExternalRoute: false,
    supportedInputs: [
      { name: "resistors", type: "string", description: "Resistor values", required: true, unit: "Ω" },
    ],
    outputFormat: "circuit_step_by_step_analysis",
    safetyDisclaimers: "EDUCATIONAL DC CIRCUIT MODEL",
    limitations: ["Linear DC only."],
    version: "1.0.0",
  },
  {
    toolId: "report-reviewer",
    displayName: "Shared Project & Report Reviewer",
    shortDescription: "Multi-branch review for technical reports and capstone proposals.",
    academicDiscipline: "Cross-Disciplinary / Shared",
    disciplineCategory: "Cross-Disciplinary / Shared",
    branchSlugs: ["all"],
    category: "Project & Report Review",
    intendedTask: "Produce a structured, objective evaluation of student project reports.",
    executionMode: "hybrid_ai_deterministic",
    status: "operational",
    route: "/dashboard/tools/report-reviewer",
    isExternalRoute: false,
    supportedInputs: [
      { name: "reportText", type: "string", description: "Full report text", required: true },
    ],
    outputFormat: "structured_report_review",
    safetyDisclaimers: "FORMATIVE ACADEMIC REVIEW",
    limitations: ["Evaluates text only."],
    version: "1.0.0",
  },
];

const mockCatalogResponse: ToolCatalogResponse = {
  tools: MOCK_TOOLS,
  total: 3,
  studentBranch: "mech",
  availableCategories: ["Engineering Calculations", "Circuit Analysis", "Project & Report Review"],
  availableDisciplines: ["Mechanical Engineering", "ECE & EEE", "Cross-Disciplinary / Shared"],
};

const mockAuthValue: any = {
  user: { uid: "test-user-123", email: "student@univ.edu" },
  backendUser: {
    _id: "test-user-123",
    email: "student@univ.edu",
    name: "Alex Student",
    academic: { branch: "mech", year: 3 },
  },
  loading: false,
};

describe("Phase 50: Specialized Tool Hub Frontend Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Tool Hub Page renders discipline family tabs, search bar, and tool cards", async () => {
    vi.spyOn(toolsApi, "getToolCatalog").mockResolvedValue(mockCatalogResponse);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <ToolHubPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText("Multi-Branch Academic Tool Hub")).toBeInTheDocument();
    expect(screen.getByText("Discipline-Specific AI & Analytical Workspaces")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Mechanical Engineering Calculation & Design Review Assistant")).toBeInTheDocument();
      expect(screen.getByText("Circuit Analysis Learning Studio")).toBeInTheDocument();
      expect(screen.getByText("Shared Project & Report Reviewer")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Search by tool name, task, or formula...")).toBeInTheDocument();
  });

  it("2. ToolCard identifies recommended tools for the logged-in student's branch", async () => {
    vi.spyOn(toolsApi, "getToolCatalog").mockResolvedValue(mockCatalogResponse);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <ToolHubPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Mechanical Engineering Calculation & Design Review Assistant")).toBeInTheDocument();
    });

    expect(screen.getByText("Recommended")).toBeInTheDocument();
  });

  it("3. MechanicalCalcWorkspace executes stress-strain calculation and renders results", async () => {
    vi.spyOn(toolsApi, "executeTool").mockResolvedValue({
      toolId: "mech-calc",
      displayName: "Mechanical Calc",
      version: "1.0.0",
      academicDiscipline: "Mechanical Engineering",
      executionMode: "deterministic",
      resultData: {
        calculationType: "stress_strain",
        formulaUsed: "σ = F / A",
        results: { stressMpa: 200, strain: 0.001, youngsModulusGpa: 200 },
        calculationSteps: ["1. Normal Stress σ = 200 MPa", "2. Young's Modulus E = 200 GPa"],
        reviewChecklist: [{ item: "Check yield strength margin", status: "RECOMMENDED" }],
        safetyNotice: "EDUCATIONAL CALCULATION ONLY",
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <MechanicalCalcWorkspace />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const computeBtn = screen.getByText("Compute Engineering Calculation");
    fireEvent.click(computeBtn);

    await waitFor(() => {
      expect(screen.getByText("σ = F / A")).toBeInTheDocument();
      expect(screen.getAllByText("200").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("1. Normal Stress σ = 200 MPa")).toBeInTheDocument();
      expect(screen.getByText("EDUCATIONAL CALCULATION ONLY")).toBeInTheDocument();
    });
  });

  it("4. EceCircuitsWorkspace executes DC circuit analysis and displays equivalent resistance", async () => {
    vi.spyOn(toolsApi, "executeTool").mockResolvedValue({
      toolId: "ece-circuits",
      displayName: "Circuit Studio",
      version: "1.0.0",
      academicDiscipline: "ECE & EEE",
      executionMode: "deterministic",
      resultData: {
        analysisType: "series_parallel",
        formulaUsed: "R_eq = R₁ + R₂ + ... + R_n",
        results: { equivalentResistanceOhms: 600, totalCurrentA: 0.02, totalPowerWatts: 0.24 },
        calculationSteps: ["1. R_eq = 600 Ω", "2. Total Current = 0.02 A"],
        safetyNotice: "EDUCATIONAL DC CIRCUIT MODEL",
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <EceCircuitsWorkspace />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const solveBtn = screen.getByText("Solve Circuit Equations");
    fireEvent.click(solveBtn);

    await waitFor(() => {
      expect(screen.getByText("R_eq = R₁ + R₂ + ... + R_n")).toBeInTheDocument();
      expect(screen.getByText("600")).toBeInTheDocument();
      expect(screen.getByText("1. R_eq = 600 Ω")).toBeInTheDocument();
    });
  });

  it("5. CivilBoqWorkspace calculates concrete volume and renders BOQ worksheet table", async () => {
    vi.spyOn(toolsApi, "executeTool").mockResolvedValue({
      toolId: "civil-boq",
      displayName: "Civil BOQ",
      version: "1.0.0",
      academicDiscipline: "Civil Engineering",
      executionMode: "deterministic",
      resultData: {
        estimationType: "concrete_slab",
        results: { wetVolumeM3: 3.0, dryVolumeM3: 4.851, cementBags: 26, totalEstimatedMaterialCost: 15400 },
        billOfQuantities: [
          { itemNo: 1, description: "Portland Cement (50kg bags)", quantity: 26, unit: "Bags", unitRate: 390, totalAmount: 10140 },
          { itemNo: 2, description: "Zone II Sand", quantity: 1.32, unit: "m³", unitRate: 1450, totalAmount: 1914 },
        ],
        safetyNotice: "EDUCATIONAL ESTIMATION ONLY",
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <CivilBoqWorkspace />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const calcBtn = screen.getByText("Calculate Bill of Quantities");
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText("3 m³")).toBeInTheDocument();
      expect(screen.getByText("26 Bags")).toBeInTheDocument();
      expect(screen.getByText("Portland Cement (50kg bags)")).toBeInTheDocument();
      expect(screen.getByText("$10140")).toBeInTheDocument();
    });
  });

  it("6. NursingStudyWorkspace enforces prominent educational disclaimer and calculates dosage volume", async () => {
    vi.spyOn(toolsApi, "executeTool").mockResolvedValue({
      toolId: "nursing-study",
      displayName: "Nursing Study",
      version: "1.0.0",
      academicDiscipline: "Nursing & Allied Health",
      executionMode: "deterministic",
      resultData: {
        studyType: "pediatric_dosage_calc",
        formulaUsed: "Total Daily = Weight * Dose Rate",
        results: { totalDailyDoseMg: 270, singleDoseMg: 90, singleDoseVolumeMl: 1.8, dosingFrequencyText: "Three times daily (q8h)" },
        calculationSteps: ["1. Daily Dose = 270 mg", "2. Single volume = 1.8 mL"],
        safetyNotice: "CRITICAL CLINICAL NOTICE: FOR EDUCATIONAL PRACTICE ONLY.",
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <NursingStudyWorkspace />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText(/ACADEMIC CLINICAL PRACTICE ONLY/)).toBeInTheDocument();

    const calcBtn = screen.getByText("Calculate Study Exercise");
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText("270 mg")).toBeInTheDocument();
      expect(screen.getByText("1.8 mL")).toBeInTheDocument();
      expect(screen.getByText("Three times daily (q8h)")).toBeInTheDocument();
    });
  });

  it("7. SharedReportReviewerWorkspace generates formative feedback with strengths and evidence gaps", async () => {
    vi.spyOn(toolsApi, "executeTool").mockResolvedValue({
      toolId: "report-reviewer",
      displayName: "Report Reviewer",
      version: "1.0.0",
      academicDiscipline: "Cross-Disciplinary / Shared",
      executionMode: "hybrid_ai_deterministic",
      resultData: {
        title: "Test Report",
        review: {
          summary: "Comprehensive experimental testing analysis.",
          strengths: ["Clear objective", "Robust methodology"],
          missingSectionsOrEvidence: ["Missing error propagation calculations"],
          technicalQuestionsToCheck: ["How was gauge factor calibrated?"],
          actionableImprovements: ["Add uncertainty bounds to Table 1"],
        },
        safetyNotice: "FORMATIVE ACADEMIC REVIEW",
      },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <SharedReportReviewerWorkspace />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const reviewBtn = screen.getByText("Generate Multi-Branch Formative Review");
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText("Comprehensive experimental testing analysis.")).toBeInTheDocument();
      expect(screen.getByText("• Clear objective")).toBeInTheDocument();
      expect(screen.getByText("• Missing error propagation calculations")).toBeInTheDocument();
      expect(screen.getByText("• How was gauge factor calibrated?")).toBeInTheDocument();
    });
  });

  it("8. ToolActivityHistoryDrawer displays student activity log and toggles portfolio sharing", async () => {
    vi.spyOn(toolsApi, "getMyToolActivity").mockResolvedValue({
      records: [
        {
          _id: "rec-1",
          toolId: "mech-calc",
          toolDisplayName: "Mechanical Engineering Calc",
          toolVersion: "1.0.0",
          academicDiscipline: "Mechanical Engineering",
          inputParameters: {},
          resultData: {},
          executionMode: "deterministic",
          status: "success",
          isSavedToPortfolio: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    });

    const toggleSpy = vi.spyOn(toolsApi, "togglePortfolioSave").mockResolvedValue({
      recordId: "rec-1",
      isSavedToPortfolio: true,
      portfolioMetadata: { headline: "Saved", summary: "Summary", tags: [] },
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockAuthValue}>
          <ToolActivityHistoryDrawer isOpen={true} onClose={() => {}} />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Mechanical Engineering Calc")).toBeInTheDocument();
    });

    const bookmarkBtn = screen.getByTitle("Save to Portfolio");
    fireEvent.click(bookmarkBtn);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith("rec-1", expect.objectContaining({ isSaved: true }));
    });
  });
});
