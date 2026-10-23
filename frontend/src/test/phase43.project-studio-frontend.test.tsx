import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProjectCatalogView } from "../modules/projects/components/ProjectCatalogView";
import { ActiveProjectWorkspace } from "../modules/projects/components/ActiveProjectWorkspace";
import { EvidencePortfolioView } from "../modules/projects/components/EvidencePortfolioView";
import { Projects } from "../pages/Projects";
import { ProjectTemplate, StudentProject } from "../modules/projects/types/projectStudio.types";
import { projectStudioApi } from "../modules/projects/services/projectStudio.api";

// Mock useAuth hook
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    user: { _id: "user123", email: "student@example.com", displayName: "Test Student" },
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

describe("Phase 43: Branch-Aware Project Studio & Evidence Portfolio Frontend Suite", () => {
  const mockTemplates: ProjectTemplate[] = [
    {
      templateId: "mech-cad-gearbox-design",
      title: "Speed Reducer Gearbox: 3D CAD Parametric Assembly",
      description: "Design an industrial single-stage helical speed reducer gearbox with complete assembly.",
      branchSlugs: ["mech", "auto", "ipe"],
      disciplineCategory: "Engineering & Technology",
      difficulty: "Intermediate",
      estimatedEffort: "20-25 hours",
      prerequisites: ["Engineering Drawing", "Machine Element Design"],
      learningObjectives: ["Calculate gear module and center distances.", "Build 3D parametric CAD models."],
      milestones: [
        { milestoneId: "m1", title: "Kinematic Calculations", description: "Tooth count and torque.", order: 1, required: true },
        { milestoneId: "m2", title: "3D CAD Modeling", description: "Gears and shafts.", order: 2, required: true },
        { milestoneId: "m3", title: "Assembly & Interference", description: "Mate assembly.", order: 3, required: true },
      ],
      deliverables: [
        { key: "design_calculation_sheet", label: "Stress Calculations", type: "report", required: true },
        { key: "cad_assembly_renderings", label: "3D CAD Assembly Visuals", type: "image", required: true },
        { key: "external_cad_link", label: "Cloud CAD Model Link", type: "link", required: false },
      ],
      rubric: [
        { dimensionKey: "technicalCorrectness", dimensionName: "Technical Correctness", weight: 30, maxScore: 30 },
        { dimensionKey: "deliverablesCompleteness", dimensionName: "Completeness", weight: 40, maxScore: 40 },
        { dimensionKey: "documentation", dimensionName: "Documentation", weight: 30, maxScore: 30 },
      ],
      relevantSkills: ["SolidWorks", "AutoCAD", "GD&T"],
      status: "published",
    },
    {
      templateId: "bcom-financial-statement-audit",
      title: "Corporate Financial Statement Ratio Analysis",
      description: "Comprehensive financial statement analysis evaluating liquidity and profitability.",
      branchSlugs: ["bcom-gen", "mcom-gen"],
      disciplineCategory: "Business & Commerce",
      difficulty: "Beginner",
      estimatedEffort: "15-20 hours",
      prerequisites: ["Corporate Accounting", "Financial Management"],
      learningObjectives: ["Compute liquidity and solvency ratios.", "Conduct DuPont ROE decomposition."],
      milestones: [
        { milestoneId: "m1", title: "Data Extraction", description: "Gather balance sheets.", order: 1, required: true },
        { milestoneId: "m2", title: "Ratio Computation", description: "Calculate margins.", order: 2, required: true },
      ],
      deliverables: [
        { key: "ratio_model_sheet", label: "Financial Ratio Model", type: "data", required: true },
        { key: "audit_summary_report", label: "Executive Audit Summary", type: "report", required: true },
      ],
      rubric: [
        { dimensionKey: "technicalCorrectness", dimensionName: "Technical Correctness", weight: 50, maxScore: 50 },
        { dimensionKey: "documentation", dimensionName: "Documentation", weight: 50, maxScore: 50 },
      ],
      relevantSkills: ["Financial Analysis", "Excel Modeling", "Accounting"],
      status: "published",
    },
  ];

  const mockActiveProject: StudentProject = {
    _id: "proj-1",
    owner: "user123",
    templateId: "mech-cad-gearbox-design",
    title: "Speed Reducer Gearbox: 3D CAD Parametric Assembly",
    description: "Design an industrial single-stage helical speed reducer gearbox.",
    branchSlug: "mech",
    status: "in_progress",
    currentMilestoneIndex: 0,
    progressPercentage: 33,
    milestoneProgress: [
      { milestoneId: "m1", title: "Kinematic Calculations", status: "completed", completed: true, notes: "Formulas applied." },
      { milestoneId: "m2", title: "3D CAD Modeling", status: "in_progress", completed: false, notes: "" },
      { milestoneId: "m3", title: "Assembly & Interference", status: "pending", completed: false, notes: "" },
    ],
    deliverables: [
      { key: "design_calculation_sheet", label: "Stress Calculations", type: "report", content: "Torque 120Nm safety factor 2.4" },
      { key: "cad_assembly_renderings", label: "3D CAD Assembly Visuals", type: "image", content: "" },
      { key: "external_cad_link", label: "Cloud CAD Model Link", type: "link", externalUrl: "https://grabcad.com/gearbox-123" },
    ],
    writtenExplanations: "Preliminary engineering calculations conducted according to AGMA standard.",
    portfolioVisibility: false,
    syncedToResume: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCompletedProject: StudentProject = {
    ...mockActiveProject,
    _id: "proj-completed-1",
    status: "completed",
    progressPercentage: 100,
    completedAt: new Date().toISOString(),
    portfolioVisibility: true,
    syncedToResume: false,
    evaluation: {
      status: "evaluated",
      score: 88,
      maxScore: 100,
      percentScore: 88,
      overallScore: 88,
      passed: true,
      isPassing: true,
      overallFeedback: "Excellent engineering calculations and robust GD&T specifications.",
      feedbackSummary: "Excellent engineering calculations and robust GD&T specifications.",
      provenance: "RUBRIC_EVALUATED",
      rubricFeedback: [
        { dimensionKey: "technicalCorrectness", dimensionName: "Technical Correctness", score: 28, maxScore: 30, feedback: "Sound calculations.", criteriaMet: true },
        { dimensionKey: "deliverablesCompleteness", dimensionName: "Completeness", score: 36, maxScore: 40, feedback: "All deliverables provided.", criteriaMet: true },
        { dimensionKey: "documentation", dimensionName: "Documentation", score: 24, maxScore: 30, feedback: "Well structured.", criteriaMet: true },
      ],
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. PROJECT CATALOG VIEW
  // =========================================================================
  describe("1. ProjectCatalogView Component", () => {
    it("renders blueprints across multiple academic disciplines", () => {
      render(
        <ProjectCatalogView
          templates={mockTemplates}
          loading={false}
          onStartProject={vi.fn()}
          startingTemplateId={null}
        />
      );

      expect(screen.getByText("Speed Reducer Gearbox: 3D CAD Parametric Assembly")).toBeInTheDocument();
      expect(screen.getByText("Corporate Financial Statement Ratio Analysis")).toBeInTheDocument();
      expect(screen.getByText("Engineering & Technology")).toBeInTheDocument();
      expect(screen.getByText("Business & Commerce")).toBeInTheDocument();
    });

    it("filters templates by search term", () => {
      render(
        <ProjectCatalogView
          templates={mockTemplates}
          loading={false}
          onStartProject={vi.fn()}
          startingTemplateId={null}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search guided project blueprints/i);
      fireEvent.change(searchInput, { target: { value: "financial" } });

      expect(screen.queryByText("Speed Reducer Gearbox: 3D CAD Parametric Assembly")).not.toBeInTheDocument();
      expect(screen.getByText("Corporate Financial Statement Ratio Analysis")).toBeInTheDocument();
    });

    it("opens template detail dialog when Inspect Details is clicked", () => {
      render(
        <ProjectCatalogView
          templates={mockTemplates}
          loading={false}
          onStartProject={vi.fn()}
          startingTemplateId={null}
        />
      );

      const inspectButtons = screen.getAllByText(/inspect details/i);
      fireEvent.click(inspectButtons[0]);

      expect(screen.getByText("Learning Objectives")).toBeInTheDocument();
      expect(screen.getByText("Structured Milestones")).toBeInTheDocument();
      expect(screen.getByText("Evidence Deliverables")).toBeInTheDocument();
      expect(screen.getByText("Calculate gear module and center distances.")).toBeInTheDocument();
    });

    it("triggers onStartProject when Start Project is clicked", async () => {
      const mockStart = vi.fn().mockResolvedValue(undefined);
      render(
        <ProjectCatalogView
          templates={mockTemplates}
          loading={false}
          onStartProject={mockStart}
          startingTemplateId={null}
        />
      );

      const startButtons = screen.getAllByText(/start project/i);
      fireEvent.click(startButtons[0]);

      expect(mockStart).toHaveBeenCalledWith("mech-cad-gearbox-design");
    });
  });

  // =========================================================================
  // 2. ACTIVE PROJECT WORKSPACE VIEW
  // =========================================================================
  describe("2. ActiveProjectWorkspace Component", () => {
    it("renders active project milestones, progress bar, and deliverable inputs", () => {
      render(
        <ActiveProjectWorkspace
          project={mockActiveProject}
          template={mockTemplates[0]}
          onUpdateMilestone={vi.fn()}
          onSaveDeliverables={vi.fn()}
          onSubmitProject={vi.fn()}
          onBack={vi.fn()}
          saving={false}
          submitting={false}
        />
      );

      expect(screen.getByText("Speed Reducer Gearbox: 3D CAD Parametric Assembly")).toBeInTheDocument();
      expect(screen.getByText(/Milestone Progress: 1 of 3 Completed/i)).toBeInTheDocument();
      expect(screen.getByText("Kinematic Calculations")).toBeInTheDocument();
      expect(screen.getByText("3D CAD Modeling")).toBeInTheDocument();
      expect(screen.getByText("Overall Technical Summary & Engineering Rationale")).toBeInTheDocument();
    });

    it("triggers onUpdateMilestone when milestone completion button is toggled", () => {
      const mockUpdate = vi.fn().mockResolvedValue(undefined);
      render(
        <ActiveProjectWorkspace
          project={mockActiveProject}
          template={mockTemplates[0]}
          onUpdateMilestone={mockUpdate}
          onSaveDeliverables={vi.fn()}
          onSubmitProject={vi.fn()}
          onBack={vi.fn()}
          saving={false}
          submitting={false}
        />
      );

      // The second milestone button
      const milestoneButtons = screen.getAllByRole("button");
      // Find the button with '2'
      const m2Btn = screen.getByText("2").closest("button");
      if (m2Btn) fireEvent.click(m2Btn);

      expect(mockUpdate).toHaveBeenCalledWith("m2", "completed", "");
    });

    it("triggers onSubmitProject when Submit for Rubric Evaluation is clicked", async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <ActiveProjectWorkspace
          project={mockActiveProject}
          template={mockTemplates[0]}
          onUpdateMilestone={vi.fn()}
          onSaveDeliverables={vi.fn()}
          onSubmitProject={mockSubmit}
          onBack={vi.fn()}
          saving={false}
          submitting={false}
        />
      );

      const submitBtn = screen.getByText(/submit for rubric evaluation/i);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });

    it("renders rubric feedback banner with score breakdown when present", () => {
      render(
        <ActiveProjectWorkspace
          project={mockCompletedProject}
          template={mockTemplates[0]}
          onUpdateMilestone={vi.fn()}
          onSaveDeliverables={vi.fn()}
          onSubmitProject={vi.fn()}
          onBack={vi.fn()}
          saving={false}
          submitting={false}
        />
      );

      expect(screen.getByText(/Rubric Evaluation Passed \(88%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent engineering calculations/i)).toBeInTheDocument();
      expect(screen.getByText("28/30")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. EVIDENCE PORTFOLIO VIEW
  // =========================================================================
  describe("3. EvidencePortfolioView Component", () => {
    it("renders completed projects with rubric pass badges and visibility controls", () => {
      render(
        <EvidencePortfolioView
          completedProjects={[mockCompletedProject]}
          loading={false}
          onToggleVisibility={vi.fn()}
          onSyncToResume={vi.fn()}
          onSelectProjectWorkspace={vi.fn()}
          syncingProjectId={null}
        />
      );

      expect(screen.getByText("Speed Reducer Gearbox: 3D CAD Parametric Assembly")).toBeInTheDocument();
      expect(screen.getByText("88% Rubric Pass")).toBeInTheDocument();
      expect(screen.getByText("Public in Portfolio")).toBeInTheDocument();
    });

    it("toggles portfolio visibility when toggle button is clicked", () => {
      const mockToggle = vi.fn().mockResolvedValue(undefined);
      render(
        <EvidencePortfolioView
          completedProjects={[mockCompletedProject]}
          loading={false}
          onToggleVisibility={mockToggle}
          onSyncToResume={vi.fn()}
          onSelectProjectWorkspace={vi.fn()}
          syncingProjectId={null}
        />
      );

      const toggleBtn = screen.getByText("Make Private");
      fireEvent.click(toggleBtn);

      expect(mockToggle).toHaveBeenCalledWith("proj-completed-1", false);
    });

    it("triggers onSyncToResume when Sync to Resume Showcase is clicked", () => {
      const mockSync = vi.fn().mockResolvedValue(undefined);
      render(
        <EvidencePortfolioView
          completedProjects={[mockCompletedProject]}
          loading={false}
          onToggleVisibility={vi.fn()}
          onSyncToResume={mockSync}
          onSelectProjectWorkspace={vi.fn()}
          syncingProjectId={null}
        />
      );

      const syncBtn = screen.getByText("Sync to Resume Showcase");
      fireEvent.click(syncBtn);

      expect(mockSync).toHaveBeenCalledWith("proj-completed-1");
    });
  });

  // =========================================================================
  // 4. MAIN PROJECTS PAGE TAB SWITCHING & INTEGRATION
  // =========================================================================
  describe("4. Main Projects Page Tabs & Navigation", () => {
    beforeEach(() => {
      vi.spyOn(projectStudioApi, "fetchTemplates").mockResolvedValue({
        templates: mockTemplates,
        total: 2,
      });
      vi.spyOn(projectStudioApi, "fetchMyProjects").mockResolvedValue({
        projects: [mockActiveProject, mockCompletedProject],
        summary: { total: 2, inProgress: 1, completed: 1, changesRequested: 0, submitted: 0 },
      });
    });

    it("renders all four primary tabs: Workspace, Blueprint Catalog, Evidence Portfolio, Resume Showcase", async () => {
      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-workspace")).toBeInTheDocument();
        expect(screen.getByTestId("tab-catalog")).toBeInTheDocument();
        expect(screen.getByTestId("tab-portfolio")).toBeInTheDocument();
        expect(screen.getByTestId("tab-resume")).toBeInTheDocument();
      });
    });

    it("switches to Blueprint Catalog tab when clicked", async () => {
      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-catalog")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("tab-catalog"));

      await waitFor(() => {
        expect(screen.getByText("All Disciplines")).toBeInTheDocument();
        expect(screen.getByText("Speed Reducer Gearbox: 3D CAD Parametric Assembly")).toBeInTheDocument();
      });
    });

    it("switches to Evidence Portfolio tab when clicked", async () => {
      render(<Projects />);

      await waitFor(() => {
        expect(screen.getByTestId("tab-portfolio")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("tab-portfolio"));

      await waitFor(() => {
        expect(screen.getByText("Verified Student Evidence Portfolio")).toBeInTheDocument();
        expect(screen.getByText("88% Rubric Pass")).toBeInTheDocument();
      });
    });
  });
});
