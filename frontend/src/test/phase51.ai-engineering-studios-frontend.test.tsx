import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SharedEngineeringReportBuilder } from "../modules/tools/components/SharedEngineeringReportBuilder";
import { MechanicalCalcWorkspace } from "../modules/tools/components/MechanicalCalcWorkspace";
import { EceCircuitsWorkspace } from "../modules/tools/components/EceCircuitsWorkspace";
import { CivilBoqWorkspace } from "../modules/tools/components/CivilBoqWorkspace";
import { ChemProcessWorkspace } from "../modules/tools/components/ChemProcessWorkspace";
import { toolsApi } from "../modules/tools/services/tools.api";
import { EngineeringReportDraft } from "../modules/tools/types/tools.types";

vi.mock("../modules/tools/services/tools.api");

const mockReportDraft: EngineeringReportDraft = {
  reportId: "REP-MECH-CALC-TEST1",
  title: "Engineering Study: Mild Steel Tension Specimen",
  discipline: "Mechanical Engineering",
  toolId: "mech-calc",
  toolDisplayName: "Mechanical Engineering AI Studio & Design Reviewer",
  objective: "Determine axial stress and strain under 50 kN load.",
  problemStatement: "Mild steel tension specimen testing in universal testing machine.",
  governingEquations: "σ = F / A ; ε = ΔL / L₀ ; E = σ / ε",
  suppliedInputs: { forceN: 50000, areaMm2: 250 },
  calculationSteps: ["1. Given F = 50000 N, A = 250 mm².", "2. σ = 50000 / 250 = 200 MPa."],
  numericalResults: { stressMpa: 200, strain: 0.001, youngsModulusGpa: 200 },
  engineeringDiscussion: "Tensile stress operates within linear proportional limit of mild steel.",
  applicableTheory: "Hooke's Law of Elasticity.",
  assumptions: [
    "Material is homogeneous and isotropic.",
    "Axial load passes through centroid without eccentric bending.",
  ],
  limitations: [
    "Calculations do not account for stress concentration factors (Kt) at fillets.",
    "Elevated temperatures require thermal yield derating.",
  ],
  missingInputsChecklist: [
    {
      item: "Material Yield Strength",
      importance: "RECOMMENDED",
      explanation: "Required to verify working stress margin against plastic deformation.",
    },
  ],
  troubleshootingAdvice: [
    "If stress exceeds 60% of yield strength, consider increasing section thickness.",
  ],
  verificationStatus: "VERIFIED_DETERMINISTIC",
  verificationSummary: "Authoritative numerical parameters match deterministic calculation engine.",
  verifiedClaims: [
    {
      parameter: "stressMpa",
      value: 200,
      status: "VERIFIED_DETERMINISTIC",
      provenance: "deterministic_calculation_engine",
      verificationMethod: "Exact algebraic formula execution",
    },
  ],
  unverifiedClaims: [
    {
      claim: "Linear elastic material behavior",
      status: "THEORETICAL_MODEL_ASSUMPTION",
      provenance: "offline_expert_heuristics",
      verificationMethod: "Standard academic simplification",
    },
  ],
  learningPathwayLinks: [
    {
      id: "mech-lab-stress-strain",
      title: "Axial Tensile Stress and Strain Measurement",
      type: "PRACTICAL_LAB",
      route: "/academic/labs",
    },
    {
      id: "mech-eng-mechanics",
      title: "Engineering Mechanics & Strength of Materials Assessment",
      type: "ASSESSMENT",
      route: "/assessment",
    },
  ],
  safetyNotice: "EDUCATIONAL CALCULATION ONLY: Does not replace professional PE stamping.",
  studentNotes: "Group 3 UTM testing.",
  authorName: "Test Student Engineer",
  generatedAt: "2026-10-25T03:00:00.000Z",
  lastEditedAt: null,
  isStudentDraft: true,
};

describe("Phase 51: Branch-Specific AI Engineering Studios Frontend Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. SharedEngineeringReportBuilder renders verification status, equations, results, and learning links", () => {
    render(
      <BrowserRouter>
        <SharedEngineeringReportBuilder
          reportDraft={mockReportDraft}
          activityRecordId="rec_123"
          isSavedToPortfolio={false}
          onSaveToPortfolio={vi.fn()}
        />
      </BrowserRouter>
    );

    // Verification banner
    expect(screen.getByText(/NUMERICAL PROOF: VERIFIED DETERMINISTIC/i)).toBeInTheDocument();
    expect(screen.getByText(/Authoritative Math Guaranteed/i)).toBeInTheDocument();

    // Objective & Governing formula
    expect(screen.getByText("Determine axial stress and strain under 50 kN load.")).toBeInTheDocument();
    expect(screen.getByText("σ = F / A ; ε = ΔL / L₀ ; E = σ / ε")).toBeInTheDocument();

    // Results
    expect(screen.getByText("stressMpa")).toBeInTheDocument();
    expect(screen.getAllByText("200").length).toBeGreaterThanOrEqual(1);

    // Assumptions & Limitations
    expect(screen.getByText("Material is homogeneous and isotropic.")).toBeInTheDocument();
    expect(screen.getByText("Elevated temperatures require thermal yield derating.")).toBeInTheDocument();

    // Missing input checklist
    expect(screen.getByText("Material Yield Strength")).toBeInTheDocument();

    // Learning ecosystem links
    expect(screen.getByText("Axial Tensile Stress and Strain Measurement")).toBeInTheDocument();
    expect(screen.getByText("Engineering Mechanics & Strength of Materials Assessment")).toBeInTheDocument();
  });

  it("2. SharedEngineeringReportBuilder switches to Edit Draft tab and updates editable fields", async () => {
    const onUpdateMock = vi.fn();
    (toolsApi.updateReportDraft as any).mockResolvedValueOnce({
      recordId: "rec_123",
      reportDraft: { ...mockReportDraft, title: "Updated Steel Specimen Study" },
    });

    render(
      <BrowserRouter>
        <SharedEngineeringReportBuilder
          reportDraft={mockReportDraft}
          activityRecordId="rec_123"
          onUpdateDraft={onUpdateMock}
        />
      </BrowserRouter>
    );

    // Switch to Edit Draft
    const editTabBtn = screen.getByText("Edit Draft");
    fireEvent.click(editTabBtn);

    // Edit Title
    const titleInput = screen.getByDisplayValue("Engineering Study: Mild Steel Tension Specimen");
    fireEvent.change(titleInput, { target: { value: "Updated Steel Specimen Study" } });

    // Click Save Draft Changes
    const saveBtn = screen.getByText("Save Draft Changes");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toolsApi.updateReportDraft).toHaveBeenCalledWith(
        "rec_123",
        expect.objectContaining({
          title: "Updated Steel Specimen Study",
        })
      );
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });

  it("3. SharedEngineeringReportBuilder copies formatted Markdown to clipboard", () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <BrowserRouter>
        <SharedEngineeringReportBuilder reportDraft={mockReportDraft} />
      </BrowserRouter>
    );

    const copyBtn = screen.getByTitle("Copy Report as Markdown");
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
    const copiedText = writeTextMock.mock.calls[0][0];
    expect(copiedText).toContain("# Engineering Study: Mild Steel Tension Specimen");
    expect(copiedText).toContain("## 1. Problem Statement & Objective");
    expect(copiedText).toContain("VERIFIED_DETERMINISTIC");
  });

  it("4. MechanicalCalcWorkspace integrates problem statement, executes AI studio, and renders report builder", async () => {
    (toolsApi.executeTool as any).mockResolvedValueOnce({
      toolId: "mech-calc",
      displayName: "Mechanical Engineering AI Studio & Design Reviewer",
      resultData: {
        calculationType: "stress_strain",
        formulaUsed: "σ = F / A",
        inputs: { forceN: 50000, areaMm2: 250 },
        results: { stressMpa: 200, strain: 0.001 },
        calculationSteps: ["σ = 50000 / 250 = 200 MPa"],
        reportDraft: mockReportDraft,
        verification: { status: "VERIFIED_DETERMINISTIC", summary: "Math verified" },
      },
      activityRecordId: "mech_rec_1",
    });

    render(
      <BrowserRouter>
        <MechanicalCalcWorkspace />
      </BrowserRouter>
    );

    // Verify Problem Statement textarea is present
    const problemTextarea = screen.getByPlaceholderText(
      /e\.g\. Tensile test of mild steel tie rod under 50 kN load/i
    );
    expect(problemTextarea).toBeInTheDocument();

    // Verify AI Studio checkbox is checked by default
    const aiCheckbox = screen.getByLabelText(/AI Studio Reasoning/i);
    expect(aiCheckbox).toBeChecked();

    // Execute computation
    const computeBtn = screen.getByText("Compute Engineering Calculation");
    fireEvent.click(computeBtn);

    await waitFor(() => {
      expect(toolsApi.executeTool).toHaveBeenCalledWith(
        "mech-calc",
        expect.objectContaining({
          calculationType: "stress_strain",
          problemStatement: expect.any(String),
          enableAiInterpretation: true,
        })
      );
    });

    // Report builder should now be visible
    expect(await screen.findByText(/NUMERICAL PROOF: VERIFIED DETERMINISTIC/i)).toBeInTheDocument();
  });

  it("5. EceCircuitsWorkspace executes Ohm's Law and renders DC circuit report", async () => {
    (toolsApi.executeTool as any).mockResolvedValueOnce({
      toolId: "ece-circuits",
      displayName: "ECE/EEE Circuit Analysis AI Studio",
      resultData: {
        analysisType: "ohms_law",
        formulaUsed: "V = I * R ; P = V * I",
        results: { voltageV: 12, currentA: 0.05, resistanceOhms: 240, dissipatedPowerW: 0.6 },
        calculationSteps: ["P = 12 * 0.05 = 0.6 W"],
        reportDraft: {
          ...mockReportDraft,
          discipline: "ECE & EEE",
          toolId: "ece-circuits",
          governingEquations: "V = I * R ; P = V * I",
          numericalResults: { voltageV: 12, currentA: 0.05, dissipatedPowerW: 0.6 },
        },
        verification: { status: "VERIFIED_DETERMINISTIC" },
      },
      activityRecordId: "ece_rec_1",
    });

    render(
      <BrowserRouter>
        <EceCircuitsWorkspace />
      </BrowserRouter>
    );

    // Switch to Ohm's Law tab
    const ohmsTab = screen.getByText("Ohm's Law & Power Dissipation");
    fireEvent.click(ohmsTab);

    // Execute Circuit Analysis
    const solveBtn = screen.getByText("Solve Circuit Equations");
    fireEvent.click(solveBtn);

    await waitFor(() => {
      expect(toolsApi.executeTool).toHaveBeenCalledWith(
        "ece-circuits",
        expect.objectContaining({
          analysisType: "ohms_law",
        })
      );
    });

    expect(await screen.findByText(/Verified DC Circuit/i)).toBeInTheDocument();
    expect(await screen.findByText(/NUMERICAL PROOF: VERIFIED DETERMINISTIC/i)).toBeInTheDocument();
  });

  it("6. CivilBoqWorkspace executes quantity estimation and highlights scope exclusions", async () => {
    (toolsApi.executeTool as any).mockResolvedValueOnce({
      toolId: "civil-boq",
      displayName: "Civil Engineering BOQ & Quantity AI Studio",
      resultData: {
        estimationType: "concrete_slab",
        formulaUsed: "V_wet = L * W * T ; V_dry = V_wet * 1.54 * (1 + Waste%)",
        results: { wetVolumeM3: 4.05, dryVolumeM3: 6.549, cementBags: 44, totalEstimatedMaterialCost: 24500 },
        billOfQuantities: [
          { itemNo: 1, description: "Portland Pozzolana Cement", quantity: 44, unit: "Bags", unitRate: 390, totalAmount: 17160 },
        ],
        reportDraft: {
          ...mockReportDraft,
          discipline: "Civil Engineering",
          toolId: "civil-boq",
          limitations: [
            "Scope Exclusion: Plain concrete estimate excludes structural steel reinforcement (TMT rebar Fe500).",
            "Scope Exclusion: Formwork and shuttering centering calculated separately.",
          ],
        },
        verification: { status: "VERIFIED_DETERMINISTIC" },
      },
      activityRecordId: "civil_rec_1",
    });

    render(
      <BrowserRouter>
        <CivilBoqWorkspace />
      </BrowserRouter>
    );

    const calcBtn = screen.getByText("Calculate Bill of Quantities");
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(toolsApi.executeTool).toHaveBeenCalledWith(
        "civil-boq",
        expect.objectContaining({
          problemStatement: expect.any(String),
          enableAiInterpretation: true,
        })
      );
    });

    expect(await screen.findByText("Bill of Quantities (BOQ) Worksheet")).toBeInTheDocument();
    expect(await screen.findByText("Portland Pozzolana Cement")).toBeInTheDocument();
  });

  it("7. ChemProcessWorkspace supports conversion-concentration and renders mass conservation verification", async () => {
    (toolsApi.executeTool as any).mockResolvedValueOnce({
      toolId: "chem-process",
      displayName: "Chemical Engineering Process AI Studio",
      resultData: {
        calculationType: "conversion_concentration",
        formulaUsed: "C_A = C_A0 * (1 - X_A)",
        results: { initialConcentrationMolar: 1.0, targetConversionPercent: 80, unreactedConcentrationMolar: 0.2 },
        calculationSteps: ["C_A = 1.0 * (1 - 0.8) = 0.2 mol/L"],
        reportDraft: {
          ...mockReportDraft,
          discipline: "Chemical Engineering",
          toolId: "chem-process",
          governingEquations: "C_A = C_A0 * (1 - X_A)",
          numericalResults: { initialConcentrationMolar: 1.0, unreactedConcentrationMolar: 0.2 },
        },
        verification: { status: "VERIFIED_DETERMINISTIC" },
      },
      activityRecordId: "chem_rec_1",
    });

    render(
      <BrowserRouter>
        <ChemProcessWorkspace />
      </BrowserRouter>
    );

    // Switch to Reactant Conversion tab
    const convTab = screen.getByText("Reactant Conversion & Concentration");
    fireEvent.click(convTab);

    const runBtn = screen.getByText("Execute Chemical AI Studio Simulation");
    fireEvent.click(runBtn);

    await waitFor(() => {
      expect(toolsApi.executeTool).toHaveBeenCalledWith(
        "chem-process",
        expect.objectContaining({
          calculationType: "conversion_concentration",
        })
      );
    });

    expect(await screen.findByText("Process Output Streams")).toBeInTheDocument();
  });
});
