import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { BiotechResearchWorkspace } from "../modules/tools/components/BiotechResearchWorkspace";
import { BusinessKpiWorkspace } from "../modules/tools/components/BusinessKpiWorkspace";
import { FinanceAccountingWorkspace } from "../modules/tools/components/FinanceAccountingWorkspace";
import { ArtsWritingWorkspace } from "../modules/tools/components/ArtsWritingWorkspace";
import { NursingStudyWorkspace } from "../modules/tools/components/NursingStudyWorkspace";
import { toolsApi } from "../modules/tools/services/tools.api";
import { EngineeringReportDraft } from "../modules/tools/types/tools.types";

vi.mock("../modules/tools/services/tools.api");

const createMockReportDraft = (discipline: string, toolId: string, title: string): EngineeringReportDraft => ({
  reportId: `REP-${toolId.toUpperCase()}-TEST1`,
  title,
  discipline,
  toolId,
  toolDisplayName: `${discipline} Specialized AI Studio`,
  objective: `Investigate and formalize ${discipline.toLowerCase()} methodology and metrics.`,
  problemStatement: `Specialized studio exercise in ${discipline}.`,
  governingEquations: "Domain-specific formal rule or deterministic equation.",
  suppliedInputs: { testInput: 100 },
  calculationSteps: ["Step 1: Parse verified inputs.", "Step 2: Apply domain rules."],
  numericalResults: { metricValue: 42.5 },
  engineeringDiscussion: `Comprehensive evidence-based analysis and academic interpretation for ${discipline}.`,
  applicableTheory: `Fundamental ${discipline} principles.`,
  assumptions: ["Standard academic laboratory or market conditions apply."],
  limitations: ["Educational model simplification for training."],
  missingInputsChecklist: [
    {
      item: "Experimental Replicate Count",
      importance: "RECOMMENDED",
      explanation: "Required for robust statistical power.",
    },
  ],
  troubleshootingAdvice: ["Validate assumptions against independent primary literature."],
  verificationStatus: "VERIFIED_DETERMINISTIC",
  verificationSummary: "Calculations validated via deterministic engine.",
  verifiedClaims: [
    {
      parameter: "metricValue",
      value: 42.5,
      status: "VERIFIED_DETERMINISTIC",
      provenance: "deterministic_calculation_engine",
      verificationMethod: "Exact formula execution",
    },
  ],
  unverifiedClaims: [],
  learningPathwayLinks: [
    {
      id: `${toolId}-lab-core`,
      title: `${discipline} Practical Exploration`,
      type: "PRACTICAL_LAB",
      route: "/academic/labs",
    },
  ],
  safetyNotice: `ACADEMIC STUDY ONLY: Does not replace professional ${discipline.toLowerCase()} certification.`,
  studentNotes: "Studio testing draft.",
  authorName: "Alex Student",
  generatedAt: "2026-10-25T04:00:00.000Z",
  lastEditedAt: null,
  isStudentDraft: true,
});

describe("Phase 52: Specialized AI Studios Frontend Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Biotechnology & Research Studio (BiotechResearchWorkspace)", () => {
    it("renders with objective context, AI studio toggle, and executes sequence analysis", async () => {
      const mockDraft = createMockReportDraft("Biotechnology", "biotech-research", "Biotechnology Primer Design Study");
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "biotech-research",
        displayName: "Biotechnology & Life Sciences Research Assistant",
        resultData: {
          analysisType: "dna_gc_melting",
          formulaUsed: "Wallace Rule: Tm = 2*(A+T) + 4*(G+C)",
          results: {
            gcPercentage: 52.4,
            wallaceMeltingTempC: 64,
            saltAdjustedTmC: 58.2,
            approxMolecularWeightGPerMol: 6490.2,
          },
          reportDraft: mockDraft,
          safetyNotice: "ACADEMIC LIFE SCIENCES STUDY ONLY",
        },
        activityRecordId: "biotech_rec_1",
      });

      render(
        <BrowserRouter>
          <BiotechResearchWorkspace />
        </BrowserRouter>
      );

      // Verify header and AI Studio toggle
      expect(screen.getByText("Biotech Inputs & Research Parameters")).toBeInTheDocument();
      const aiToggle = screen.getByLabelText(/AI Studio Reasoning/i);
      expect(aiToggle).toBeChecked();

      // Submit form
      const submitBtn = screen.getByText("Analyze Sequence & Hypothesis");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toolsApi.executeTool).toHaveBeenCalledWith(
          "biotech-research",
          expect.objectContaining({
            analysisType: "dna_gc_melting",
            enableAiInterpretation: true,
          })
        );
      });

      // Verify outputs
      expect(await screen.findByText(/Wallace Rule: Tm = 2\*\(A\+T\) \+ 4\*\(G\+C\)/i)).toBeInTheDocument();
      expect(screen.getByText("52.4%")).toBeInTheDocument();
      expect(screen.getByText("64 °C")).toBeInTheDocument();

      // Verify custom section titles in SharedEngineeringReportBuilder
      expect(screen.getByText("Biotechnology Research Objective")).toBeInTheDocument();
      expect(screen.getByText("Analytical & Biophysical Methods")).toBeInTheDocument();
      expect(screen.getByText("Laboratory Findings & Sequence Metrics")).toBeInTheDocument();
      expect(screen.getByText("Biotechnology Discussion & Evidence Appraisal")).toBeInTheDocument();
    });

    it("switches to Hypothesis & Experiment Planning tab and allows input", () => {
      render(
        <BrowserRouter>
          <BiotechResearchWorkspace />
        </BrowserRouter>
      );

      const hypothesisTab = screen.getByText("Hypothesis & Experiment Planning");
      fireEvent.click(hypothesisTab);

      expect(screen.getByText(/Core Biological Research Question \*/i)).toBeInTheDocument();
      expect(screen.getByText(/Independent Variable \(Manipulated factor\) \*/i)).toBeInTheDocument();
      expect(screen.getByText(/Dependent Variable \(Measured biological outcome\) \*/i)).toBeInTheDocument();
    });
  });

  describe("2. Business Intelligence Studio (BusinessKpiWorkspace)", () => {
    it("renders with business context, executes break-even analysis, and renders custom report builder", async () => {
      const mockDraft = createMockReportDraft("Business", "business-kpi", "DTC Apparel Unit Economics Model");
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "business-kpi",
        displayName: "Business Intelligence, KPI & Financial Modeling Studio",
        resultData: {
          analysisType: "breakeven_margin_of_safety",
          formulaUsed: "Break-Even Units = Fixed Costs / (Price - Variable Cost)",
          results: {
            breakEvenUnits: 500,
            contributionMarginPerUnit: 30,
            marginOfSafetyPercentage: 33.3,
          },
          reportDraft: mockDraft,
          safetyNotice: "EDUCATIONAL FINANCIAL MODEL ONLY",
        },
        activityRecordId: "biz_rec_1",
      });

      render(
        <BrowserRouter>
          <BusinessKpiWorkspace />
        </BrowserRouter>
      );

      expect(screen.getByText("Economic & Strategic Assumptions")).toBeInTheDocument();
      const submitBtn = screen.getByText("Calculate Unit Economics & Metrics");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toolsApi.executeTool).toHaveBeenCalledWith(
          "business-kpi",
          expect.objectContaining({
            analysisType: "breakeven_margin_of_safety",
            enableAiInterpretation: true,
          })
        );
      });

      expect(await screen.findByText(/Break-Even Units = Fixed Costs \/ \(Price - Variable Cost\)/i)).toBeInTheDocument();
      expect(screen.getByText("500")).toBeInTheDocument();
      expect(screen.getByText("33.3")).toBeInTheDocument();

      // Custom report builder titles
      expect(screen.getByText("Business Strategy & Economic Objective")).toBeInTheDocument();
      expect(screen.getByText("Financial & Unit Economics Models")).toBeInTheDocument();
      expect(screen.getByText("Business KPIs & Projection Metrics")).toBeInTheDocument();
      expect(screen.getByText("Strategic Analysis & Managerial Recommendations")).toBeInTheDocument();
    });

    it("switches to SWOT & PESTLE Strategic Matrix tab", () => {
      render(
        <BrowserRouter>
          <BusinessKpiWorkspace />
        </BrowserRouter>
      );

      const swotTab = screen.getByText("SWOT & PESTLE Strategic Matrix");
      fireEvent.click(swotTab);

      expect(screen.getByText(/Strategic Case Text \/ Problem Context \*/i)).toBeInTheDocument();
    });
  });

  describe("3. Finance & Accounting Studio (FinanceAccountingWorkspace)", () => {
    it("renders financial scope, calculates ratios, and renders custom report builder", async () => {
      const mockDraft = createMockReportDraft("Finance", "finance-accounting", "Financial Statement Ratio Audit");
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "finance-accounting",
        displayName: "Accounting & Financial Statement Analysis Lab",
        resultData: {
          analysisType: "financial_statement_analysis",
          formulaUsed: "Current Ratio = Current Assets / Current Liabilities",
          results: {
            currentRatio: 2.0,
            quickRatio: 1.5,
            grossMarginPercent: 40.0,
            debtToEquityRatio: 0.4,
          },
          reportDraft: mockDraft,
          safetyNotice: "EDUCATIONAL FINANCIAL RATIO MODEL ONLY",
        },
        activityRecordId: "fin_rec_1",
      });

      render(
        <BrowserRouter>
          <FinanceAccountingWorkspace />
        </BrowserRouter>
      );

      expect(screen.getByText("Financial Statement Items & Parameters")).toBeInTheDocument();
      const submitBtn = screen.getByText("Compute Financial Analysis");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toolsApi.executeTool).toHaveBeenCalledWith(
          "finance-accounting",
          expect.objectContaining({
            analysisType: "financial_statement_analysis",
            enableAiInterpretation: true,
          })
        );
      });

      expect(await screen.findByText(/Current Ratio = Current Assets \/ Current Liabilities/i)).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1.5")).toBeInTheDocument();

      // Custom report builder titles
      expect(screen.getByText("Financial Valuation & Accounting Objective")).toBeInTheDocument();
      expect(screen.getByText("Governing Financial Models & Accounting Rules")).toBeInTheDocument();
      expect(screen.getByText("Calculated Ratios & Valuation Results")).toBeInTheDocument();
      expect(screen.getByText("Financial Statement & Valuation Analysis")).toBeInTheDocument();
    });

    it("switches to Accounting Tutor tab and displays transaction input", () => {
      render(
        <BrowserRouter>
          <FinanceAccountingWorkspace />
        </BrowserRouter>
      );

      const tutorTab = screen.getByText("Accounting Tutor & Journal Entries");
      fireEvent.click(tutorTab);

      expect(screen.getByText(/Accounting Transaction Description \*/i)).toBeInTheDocument();
    });
  });

  describe("4. Research & Writing Studio (ArtsWritingWorkspace)", () => {
    it("renders bibliographic input, formats citation, and renders custom report builder", async () => {
      const mockDraft = createMockReportDraft("Arts & Humanities", "arts-writing", "Panoptic Surveillance Essay Critique");
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "arts-writing",
        displayName: "Academic Writing, Citation & Rhetorical Argument Assistant",
        resultData: {
          analysisType: "citation_formatter",
          formulaUsed: "APA 7th Reference: Author (Year). Title. Publisher. DOI",
          formattedCitation: "Foucault, M. (1977). Discipline and Punish: The Birth of the Prison. Pantheon Books. https://doi.org/10.1007/978-1-349-16083-9",
          missingFields: [],
          reportDraft: mockDraft,
          safetyNotice: "ACADEMIC WRITING COACH ONLY",
        },
        activityRecordId: "arts_rec_1",
      });

      render(
        <BrowserRouter>
          <ArtsWritingWorkspace />
        </BrowserRouter>
      );

      expect(screen.getByText("Bibliographic & Writing Parameters")).toBeInTheDocument();
      const submitBtn = screen.getByText("Analyze Argument & Format Citation");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toolsApi.executeTool).toHaveBeenCalledWith(
          "arts-writing",
          expect.objectContaining({
            analysisType: "citation_formatter",
            citationStyle: "APA 7th",
          })
        );
      });

      expect(await screen.findByText(/Foucault, M\. \(1977\)\. Discipline and Punish/i)).toBeInTheDocument();
      expect(screen.getByText("Copy Citation")).toBeInTheDocument();

      // Custom report builder titles
      expect(screen.getByText("Research Inquest & Argumentative Thesis")).toBeInTheDocument();
      expect(screen.getByText("Bibliographic Style Standards & Rhetorical Models")).toBeInTheDocument();
      expect(screen.getByText("Formatted Citations & Argument Evaluation")).toBeInTheDocument();
      expect(screen.getByText("Academic Writing Audit & Argumentative Critique")).toBeInTheDocument();
    });

    it("switches to Thesis & Toulmin Argument Critique tab", () => {
      render(
        <BrowserRouter>
          <ArtsWritingWorkspace />
        </BrowserRouter>
      );

      const argumentTab = screen.getByText("Thesis & Toulmin Argument Critique");
      fireEvent.click(argumentTab);

      expect(screen.getByText(/Thesis Proposition Statement \*/i)).toBeInTheDocument();
      expect(screen.getByText(/Draft Supporting Evidence \/ Paragraph/i)).toBeInTheDocument();
    });
  });

  describe("5. Healthcare Learning Studio (NursingStudyWorkspace)", () => {
    it("prominently displays educational safety notice, executes dosage arithmetic, and renders SBAR", async () => {
      const mockDraft = createMockReportDraft("Nursing & Healthcare", "nursing-study", "Pediatric Amoxicillin Dosage Verification");
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "nursing-study",
        displayName: "Clinical Nursing, Dosage Arithmetic & SBAR Communication Lab",
        resultData: {
          studyType: "pediatric_dosage_calc",
          formulaUsed: "Dimensional Analysis: (Weight * Dose) / (Concentration * DosesPerDay)",
          results: {
            singleDoseMg: 90,
            volumeMlPerDose: 1.8,
            totalDailyDoseMg: 270,
          },
          dimensionalAnalysisSteps: [
            "Step 1: Total daily dose = 18 kg * 15 mg/kg = 270 mg/day",
            "Step 2: Single dose = 270 mg / 3 = 90 mg/dose",
            "Step 3: Admin volume = 90 mg / 50 mg/mL = 1.8 mL",
          ],
          reportDraft: mockDraft,
          safetyNotice: "ACADEMIC CLINICAL PRACTICE ONLY: Strictly educational.",
        },
        activityRecordId: "nursing_rec_1",
      });

      render(
        <BrowserRouter>
          <NursingStudyWorkspace />
        </BrowserRouter>
      );

      // Verify prominent non-negotiable educational banner
      expect(screen.getByText(/ACADEMIC CLINICAL PRACTICE ONLY:/i)).toBeInTheDocument();

      const submitBtn = screen.getByText("Verify Dosage & SBAR Handover");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(toolsApi.executeTool).toHaveBeenCalledWith(
          "nursing-study",
          expect.objectContaining({
            studyType: "pediatric_dosage_calc",
            enableAiInterpretation: true,
          })
        );
      });

      expect(await screen.findByText("90 mg")).toBeInTheDocument();
      expect(screen.getByText("1.8 mL")).toBeInTheDocument();
      expect(screen.getByText("270 mg")).toBeInTheDocument();
      expect(screen.getByText(/Total daily dose = 18 kg \* 15 mg\/kg = 270 mg\/day/i)).toBeInTheDocument();

      // Custom report builder titles
      expect(screen.getByText("Clinical Learning Objective & Case Context")).toBeInTheDocument();
      expect(screen.getByText("Dimensional Analysis & Clinical Standards")).toBeInTheDocument();
      expect(screen.getByText("Verified Dosage Arithmetic & SBAR Handover")).toBeInTheDocument();
      expect(screen.getByText("Clinical Study & Patient Safety Analysis")).toBeInTheDocument();
    });

    it("displays ISMP dangerous abbreviation alert when evaluating 'q.d.'", async () => {
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "nursing-study",
        displayName: "Clinical Nursing Lab",
        resultData: {
          studyType: "medical_terminology",
          isDangerousAbbreviation: true,
          prohibitedAbbreviationDetails: {
            preferredTerm: "Daily or once daily",
            rationale: "Mistaken for QID (four times daily) or q.o.d. (every other day).",
          },
          results: {
            term: "q.d.",
            prohibited: true,
          },
          safetyNotice: "ACADEMIC CLINICAL PRACTICE ONLY",
        },
        activityRecordId: "nursing_rec_2",
      });

      render(
        <BrowserRouter>
          <NursingStudyWorkspace />
        </BrowserRouter>
      );

      const termTab = screen.getByText("Medical Terminology & ISMP Flags");
      fireEvent.click(termTab);

      const submitBtn = screen.getByText("Verify Dosage & SBAR Handover");
      fireEvent.click(submitBtn);

      expect(await screen.findByText(/ISMP 'DO NOT USE' DANGEROUS ABBREVIATION DETECTED/i)).toBeInTheDocument();
      expect(screen.getByText(/Daily or once daily/i)).toBeInTheDocument();
    });
  });

  describe("6. Explicit Portfolio Sharing Consent", () => {
    it("toggles portfolio save with explicit user consent", async () => {
      const mockDraft = createMockReportDraft("Biotechnology", "biotech-research", "Portfolio Test Study");
      (toolsApi.executeTool as any).mockResolvedValueOnce({
        toolId: "biotech-research",
        displayName: "Biotech Studio",
        resultData: {
          analysisType: "dna_gc_melting",
          results: { gcPercentage: 50 },
          reportDraft: mockDraft,
        },
        activityRecordId: "biotech_portfolio_test",
      });

      (toolsApi.togglePortfolioSave as any).mockResolvedValueOnce({
        recordId: "biotech_portfolio_test",
        isSavedToPortfolio: true,
        message: "Activity artifact added to portfolio showcase.",
      });

      render(
        <BrowserRouter>
          <BiotechResearchWorkspace />
        </BrowserRouter>
      );

      const submitBtn = screen.getByText("Analyze Sequence & Hypothesis");
      fireEvent.click(submitBtn);

      // Wait for SharedEngineeringReportBuilder to appear
      const portfolioBtn = await screen.findByText(/Save to Portfolio/i);
      fireEvent.click(portfolioBtn);

      await waitFor(() => {
        expect(toolsApi.togglePortfolioSave).toHaveBeenCalledWith(
          "biotech_portfolio_test",
          expect.objectContaining({
            headline: "Portfolio Test Study",
            isSaved: true,
          })
        );
      });
    });
  });
});
