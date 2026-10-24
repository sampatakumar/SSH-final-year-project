import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { CANONICAL_TOOL_REGISTRY, TOOL_REGISTRY_MAP } from "../src/modules/tools/constants/toolRegistry.js";
import {
  executeMechanicalCalc,
  executeEceCircuits,
  executeCivilBoq,
  executeChemicalProcess,
  executeBiotechResearch,
  executeBusinessKpi,
  executeFinanceAccounting,
  executeArtsWriting,
  executeNursingStudy,
  executeSharedReportReview,
  executeTool,
} from "../src/modules/tools/services/toolExecution.service.js";

describe("Phase 50: Specialized Multi-Branch AI Tool Hub & Functional Tool Set", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. CANONICAL TOOL REGISTRY VALIDATION
  // =========================================================================
  describe("Group 1: Canonical Tool Registry Schema & Multi-Discipline Coverage", () => {
    it("1.1 Catalog supports all 10 academic discipline families plus shared cross-disciplinary tools", () => {
      expect(CANONICAL_TOOL_REGISTRY.length).toBeGreaterThanOrEqual(11);

      const disciplines = new Set(CANONICAL_TOOL_REGISTRY.map((t) => t.academicDiscipline));
      expect(disciplines.has("Computer Science & IT")).toBe(true);
      expect(disciplines.has("Mechanical Engineering")).toBe(true);
      expect(disciplines.has("ECE & EEE")).toBe(true);
      expect(disciplines.has("Civil Engineering")).toBe(true);
      expect(disciplines.has("Chemical Engineering")).toBe(true);
      expect(disciplines.has("Biotechnology")).toBe(true);
      expect(disciplines.has("Business & Management")).toBe(true);
      expect(disciplines.has("Commerce & Finance")).toBe(true);
      expect(disciplines.has("Arts & Humanities")).toBe(true);
      expect(disciplines.has("Nursing & Allied Health")).toBe(true);
      expect(disciplines.has("Cross-Disciplinary / Shared")).toBe(true);
    });

    it("1.2 Every registered tool adheres to canonical schema contract", () => {
      for (const tool of CANONICAL_TOOL_REGISTRY) {
        expect(tool.toolId).toBeTypeOf("string");
        expect(tool.displayName).toBeTypeOf("string");
        expect(tool.shortDescription).toBeTypeOf("string");
        expect(tool.academicDiscipline).toBeTypeOf("string");
        expect(Array.isArray(tool.branchSlugs)).toBe(true);
        expect(tool.branchSlugs.length).toBeGreaterThan(0);
        expect(tool.category).toBeTypeOf("string");
        expect(tool.intendedTask).toBeTypeOf("string");
        expect(["deterministic", "hybrid_ai_deterministic", "ai"]).toContain(tool.executionMode);
        expect(["operational", "limited", "config_required", "planned"]).toContain(tool.status);
        expect(tool.route).toBeTypeOf("string");
        expect(typeof tool.isExternalRoute).toBe("boolean");
        expect(Array.isArray(tool.supportedInputs)).toBe(true);
        expect(tool.supportedInputs.length).toBeGreaterThan(0);
        expect(tool.outputFormat).toBeTypeOf("string");
        expect(tool.version).toBeTypeOf("string");
      }
    });

    it("1.3 Reused CSE tools correctly reference existing platform routes without duplication", () => {
      const resumeTool = TOOL_REGISTRY_MAP.get("cse-resume-ai");
      const codingTool = TOOL_REGISTRY_MAP.get("cse-coding-platform");
      const githubTool = TOOL_REGISTRY_MAP.get("cse-github-reviewer");

      expect(resumeTool).toBeDefined();
      expect(resumeTool.route).toBe("/dashboard/resumes");
      expect(resumeTool.isExternalRoute).toBe(true);

      expect(codingTool).toBeDefined();
      expect(codingTool.route).toBe("/dashboard/coding");
      expect(codingTool.isExternalRoute).toBe(true);

      expect(githubTool).toBeDefined();
      expect(githubTool.route).toBe("/dashboard/github");
      expect(githubTool.isExternalRoute).toBe(true);
    });
  });

  // =========================================================================
  // 2. MECHANICAL ENGINEERING CALCULATION ENGINE
  // =========================================================================
  describe("Group 2: Mechanical Engineering Calculation Engine", () => {
    it("2.1 Deterministically computes stress, strain, and Young's modulus", () => {
      const result = executeMechanicalCalc({
        calculationType: "stress_strain",
        forceN: 50000,
        areaMm2: 250,
        originalLengthMm: 1000,
        changeInLengthMm: 1.0,
      });

      expect(result.calculationType).toBe("stress_strain");
      expect(result.results.stressMpa).toBe(200); // 50000 / 250 = 200 MPa
      expect(result.results.strain).toBe(0.001); // 1 / 1000 = 0.001
      expect(result.results.youngsModulusGpa).toBe(200); // 200 MPa / 0.001 = 200,000 MPa = 200 GPa
      expect(result.calculationSteps.length).toBeGreaterThanOrEqual(2);
      expect(result.safetyNotice).toContain("EDUCATIONAL CALCULATION ONLY");
    });

    it("2.2 Computes factor of safety and classifies structural hazard", () => {
      // Safe case
      const safe = executeMechanicalCalc({
        calculationType: "factor_of_safety",
        yieldStrengthMpa: 300,
        appliedStressMpa: 150,
      });
      expect(safe.results.factorOfSafety).toBe(2.0);
      expect(safe.results.assessment).toBe("STANDARD");

      // Failure case
      const fail = executeMechanicalCalc({
        calculationType: "factor_of_safety",
        yieldStrengthMpa: 250,
        appliedStressMpa: 300,
      });
      expect(fail.results.factorOfSafety).toBeCloseTo(0.833, 2);
      expect(fail.results.assessment).toBe("CRITICAL_FAILURE");
    });

    it("2.3 Computes gear ratio, output RPM, and torque with transmission efficiency", () => {
      const gear = executeMechanicalCalc({
        calculationType: "gear_ratio",
        teethDriving: 20,
        teethDriven: 60,
        inputRpm: 1800,
        inputTorqueNm: 50,
        efficiencyPercent: 95,
      });

      expect(gear.results.gearRatio).toBe(3.0); // 60 / 20 = 3.0
      expect(gear.results.outputRpm).toBe(600); // 1800 / 3 = 600 RPM
      expect(gear.results.outputTorqueNm).toBe(142.5); // 50 * 3 * 0.95 = 142.5 Nm
    });

    it("2.4 Computes Euler-Bernoulli beam bending stress", () => {
      const beam = executeMechanicalCalc({
        calculationType: "beam_bending",
        bendingMomentNm: 500,
        distanceFromNeutralAxisMm: 50,
        momentOfInertiaMm4: 2000000,
      });

      // M = 500 N*m = 500,000 N*mm. sigma = (500000 * 50) / 2000000 = 12.5 MPa
      expect(beam.results.bendingStressMpa).toBe(12.5);
    });

    it("2.5 Rejects invalid or negative inputs with descriptive validation errors", () => {
      expect(() => executeMechanicalCalc({ calculationType: "stress_strain", forceN: -100, areaMm2: 50 })).toThrow(
        "forceN must be a positive number in Newtons (N)."
      );
      expect(() => executeMechanicalCalc({ calculationType: "stress_strain", forceN: 100, areaMm2: 0 })).toThrow(
        "areaMm2 must be a positive non-zero number in mm²."
      );
    });
  });

  // =========================================================================
  // 3. ECE & EEE CIRCUIT ENGINE
  // =========================================================================
  describe("Group 3: ECE & EEE Circuit Analysis Engine", () => {
    it("3.1 Deterministically computes series and parallel equivalent resistances and Ohm's law", () => {
      const series = executeEceCircuits({
        analysisType: "series_parallel",
        networkTopology: "series",
        resistors: "100, 200, 300",
        sourceVoltageV: 12,
      });
      expect(series.results.equivalentResistanceOhms).toBe(600);
      expect(series.results.totalCurrentA).toBe(0.02); // 12 / 600 = 0.02 A
      expect(series.results.totalPowerWatts).toBe(0.24); // 12 * 0.02 = 0.24 W

      const parallel = executeEceCircuits({
        analysisType: "series_parallel",
        networkTopology: "parallel",
        resistors: "100, 100",
        sourceVoltageV: 10,
      });
      expect(parallel.results.equivalentResistanceOhms).toBe(50);
      expect(parallel.results.totalCurrentA).toBe(0.2); // 10 / 50 = 0.2 A
    });

    it("3.2 Computes voltage divider branch potentials", () => {
      const vdiv = executeEceCircuits({
        analysisType: "voltage_divider",
        sourceVoltageV: 10,
        resistors: [1000, 4000],
      });
      expect(vdiv.results.rTotalOhms).toBe(5000);
      expect(vdiv.results.loopCurrentA).toBe(0.002);
      expect(vdiv.results.voltageAcrossR1_V).toBe(2);
      expect(vdiv.results.voltageAcrossR2_V).toBe(8);
    });

    it("3.3 Computes Thévenin equivalent load power and maximum power condition", () => {
      const thev = executeEceCircuits({
        analysisType: "thevenin_equivalent",
        sourceVoltageV: 24,
        resistors: [8],
        loadResistance: 8,
      });
      expect(thev.results.loadCurrentA).toBe(1.5); // 24 / (8+8) = 1.5 A
      expect(thev.results.loadVoltageV).toBe(12); // 1.5 * 8 = 12 V
      expect(thev.results.loadPowerWatts).toBe(18); // 1.5^2 * 8 = 18 W
      expect(thev.results.maxDeliverablePowerWatts).toBe(18);
      expect(thev.results.matchedCondition).toContain("TRUE");
    });
  });

  // =========================================================================
  // 4. CIVIL ENGINEERING BOQ ENGINE
  // =========================================================================
  describe("Group 4: Civil Engineering BOQ Engine", () => {
    it("4.1 Deterministically estimates concrete volume, dry shrinkage volume, and cement bags", () => {
      const boq = executeCivilBoq({
        estimationType: "concrete_slab",
        lengthM: 5,
        widthM: 4,
        thicknessM: 0.15,
        mixRatio: "1:1.5:3",
        dryVolumeFactor: 1.54,
        wastagePercent: 5,
        unitRateCementBag: 400,
        unitRateSandM3: 1500,
        unitRateAggregateM3: 1800,
      });

      // Wet volume = 5 * 4 * 0.15 = 3.0 m³
      expect(boq.results.wetVolumeM3).toBe(3.0);
      // Dry volume = 3.0 * 1.54 * 1.05 = 4.851 m³
      expect(boq.results.dryVolumeM3).toBe(4.851);
      // Cement volume = 4.851 * (1 / 5.5) = 0.882 m³
      // Cement mass = 0.882 * 1440 = 1270.08 kg => 1270.08 / 50 = 25.4 bags => ceil = 26 bags
      expect(boq.results.cementBags).toBe(26);
      expect(boq.billOfQuantities.length).toBe(3);
      expect(boq.results.totalEstimatedMaterialCost).toBeGreaterThan(0);
      expect(boq.safetyNotice).toContain("EDUCATIONAL ESTIMATION ONLY");
    });

    it("4.2 Rejects non-positive structural dimensions", () => {
      expect(() => executeCivilBoq({ lengthM: -5, widthM: 4, thicknessM: 0.15 })).toThrow(
        "lengthM must be a positive number in meters."
      );
    });
  });

  // =========================================================================
  // 5. CHEMICAL ENGINEERING PROCESS ENGINE
  // =========================================================================
  describe("Group 5: Chemical Engineering Process Engine", () => {
    it("5.1 Solves binary distillation material balance with mass conservation", () => {
      const dist = executeChemicalProcess({
        calculationType: "binary_distillation_balance",
        feedRateKgH: 1000,
        feedCompositionX: 0.4,
        distillateCompositionX: 0.9,
        bottomsCompositionX: 0.05,
      });

      // D = 1000 * (0.4 - 0.05) / (0.9 - 0.05) = 1000 * 0.35 / 0.85 = 411.765 kg/h
      expect(dist.results.distillateRateKgH).toBeCloseTo(411.765, 2);
      expect(dist.results.bottomsRateKgH).toBeCloseTo(588.235, 2);
      expect(dist.results.overallBalanceCheck).toContain("VERIFIED");
      expect(dist.safetyNotice).toContain("EDUCATIONAL PROCESS MODEL");
    });

    it("5.2 Sizes an ideal CSTR reactor for first-order reaction kinetics", () => {
      const cstr = executeChemicalProcess({
        calculationType: "ideal_cstr_kinetics",
        feedRateKgH: 100, // volumetric flow rate L/min
        targetConversion: 0.8,
        reactionRateConstant: 0.2,
      });

      // tau = 0.8 / [0.2 * (1 - 0.8)] = 0.8 / 0.04 = 20 minutes
      expect(cstr.results.spaceTimeMinutes).toBe(20);
      expect(cstr.results.requiredReactorVolume).toBe(2000); // 20 min * 100 L/min = 2000 L
    });

    it("5.3 Rejects non-physical thermodynamic fraction configurations", () => {
      expect(() =>
        executeChemicalProcess({
          calculationType: "binary_distillation_balance",
          feedRateKgH: 1000,
          feedCompositionX: 0.8,
          distillateCompositionX: 0.5, // xD < xF is non-physical for top product
          bottomsCompositionX: 0.1,
        })
      ).toThrow("Thermodynamic split requires");
    });
  });

  // =========================================================================
  // 6. BIOTECHNOLOGY & LIFE SCIENCES ENGINE
  // =========================================================================
  describe("Group 6: Biotechnology & Life Sciences Engine", () => {
    it("6.1 Deterministically computes oligonucleotide GC% and Wallace melting temperature", () => {
      const bio = executeBiotechResearch({
        analysisType: "dna_gc_melting",
        sequenceString: "ATGCGATCGATCGATCGATCG", // 21 nt
      });

      expect(bio.sequenceLengthNt).toBe(21);
      expect(bio.results.gcPercentage).toBeGreaterThan(0);
      expect(bio.results.wallaceMeltingTempC).toBeGreaterThan(0);
      expect(bio.results.saltAdjustedTmC).toBeTypeOf("number");
      expect(bio.safetyNotice).toContain("RESEARCH EDUCATION ONLY");
    });

    it("6.2 Generates structured research hypotheses and control recommendations", () => {
      const hyp = executeBiotechResearch({
        analysisType: "research_hypothesis_organizer",
        researchQuestion: "Does CRISPR-Cas9 knockout of gene X reduce drug resistance?",
        independentVariable: "Gene X Knockout Status",
        dependentVariable: "IC50 Drug Sensitivity (μM)",
      });

      expect(hyp.results.nullHypothesisH0).toContain("There is no statistically significant effect");
      expect(hyp.results.alternativeHypothesisH1).toContain("will produce a statistically significant change");
      expect(hyp.results.recommendedExperimentalControls.length).toBeGreaterThanOrEqual(3);
    });
  });

  // =========================================================================
  // 7. BUSINESS & MBA UNIT ECONOMICS ENGINE
  // =========================================================================
  describe("Group 7: Business & MBA Unit Economics Engine", () => {
    it("7.1 Deterministically calculates break-even volume and margin of safety %", () => {
      const be = executeBusinessKpi({
        analysisType: "breakeven_margin_of_safety",
        fixedCosts: 10000,
        unitSellingPrice: 50,
        unitVariableCost: 20,
        currentSalesUnits: 500,
      });

      // CM = 50 - 20 = 30. BE = ceil(10000 / 30) = 334 units.
      expect(be.results.unitContributionMargin).toBe(30);
      expect(be.results.breakEvenUnits).toBe(334);
      expect(be.results.breakEvenRevenue).toBe(16700);
      expect(be.results.marginOfSafetyUnits).toBe(166);
      expect(be.safetyNotice).toContain("ACADEMIC BUSINESS MODEL");
    });

    it("7.2 Evaluates CAC, LTV, and healthy unit economic multiples", () => {
      const cac = executeBusinessKpi({
        analysisType: "cac_ltv_unit_economics",
        marketingSpend: 10000,
        customersAcquired: 100,
        averageOrderValue: 200,
        purchaseFrequency: 2,
        customerLifespanYears: 3,
      });

      // CAC = 10000 / 100 = 100. LTV = 200 * 2 * 3 = 1200. Ratio = 12.0x
      expect(cac.results.customerAcquisitionCost).toBe(100);
      expect(cac.results.customerLifetimeValue).toBe(1200);
      expect(cac.results.ltvToCacRatio).toBe(12.0);
      expect(cac.results.healthAssessment).toBe("UNDER_INVESTING");
    });

    it("7.3 Rejects non-profitable unit pricing where variable cost exceeds selling price", () => {
      expect(() =>
        executeBusinessKpi({
          analysisType: "breakeven_margin_of_safety",
          fixedCosts: 5000,
          unitSellingPrice: 20,
          unitVariableCost: 25,
        })
      ).toThrow("unitSellingPrice must be strictly greater than unitVariableCost");
    });
  });

  // =========================================================================
  // 8. COMMERCE & FINANCE ACCOUNTING ENGINE
  // =========================================================================
  describe("Group 8: Commerce & Finance Accounting Engine", () => {
    it("8.1 Calculates current and quick liquidity ratios", () => {
      const liq = executeFinanceAccounting({
        analysisType: "liquidity_ratios",
        currentAssets: 60000,
        currentLiabilities: 30000,
        inventory: 15000,
      });

      // Current = 60000 / 30000 = 2.0. Quick = (60000 - 15000) / 30000 = 1.5.
      expect(liq.results.currentRatio).toBe(2.0);
      expect(liq.results.quickRatio).toBe(1.5);
      expect(liq.results.netWorkingCapital).toBe(30000);
      expect(liq.results.liquidityStatus).toBe("HEALTHY_LIQUIDITY");
      expect(liq.safetyNotice).toContain("FINANCIAL LEARNING TOOL");
    });

    it("8.2 Computes discounted Net Present Value across multi-period cash flows", () => {
      const npv = executeFinanceAccounting({
        analysisType: "three_period_npv",
        initialOutlay: 100000,
        discountRatePercent: 10,
        cashFlows: "40000, 50000, 60000",
      });

      // Period 1: 40000 / 1.1 = 36363.64
      // Period 2: 50000 / 1.21 = 41322.31
      // Period 3: 60000 / 1.331 = 45078.89
      // Total PV = 122764.84. NPV = 122764.84 - 100000 = +22764.84
      expect(npv.results.netPresentValue).toBeCloseTo(22764.84, 0);
      expect(npv.results.decision).toContain("ACCEPT_PROJECT");
    });
  });

  // =========================================================================
  // 9. ARTS & HUMANITIES CITATION FORMATTER
  // =========================================================================
  describe("Group 9: Arts & Humanities Citation & Writing Studio", () => {
    it("9.1 Formats citations deterministically in APA 7th, MLA 9th, and Chicago styles", () => {
      const apa = executeArtsWriting({
        analysisType: "citation_formatter",
        citationStyle: "APA 7th",
        author: "Foucault, Michel",
        title: "Discipline and Punish",
        year: "1977",
        publisher: "Pantheon Books",
      });
      expect(apa.results.formattedCitation).toBe("Foucault, Michel (1977). *Discipline and Punish*. Pantheon Books.");
      expect(apa.results.inTextParenthetical).toBe("(Foucault, 1977)");

      const mla = executeArtsWriting({
        analysisType: "citation_formatter",
        citationStyle: "MLA 9th",
        author: "Said, Edward",
        title: "Orientalism",
        year: "1978",
        publisher: "Routledge",
      });
      expect(mla.results.formattedCitation).toContain("Said, Edward. *Orientalism*. Routledge, 1978.");
    });
  });

  // =========================================================================
  // 10. NURSING & ALLIED HEALTH CLINICAL STUDY ENGINE
  // =========================================================================
  describe("Group 10: Nursing & Allied Health Clinical Study Engine", () => {
    it("10.1 Deterministically calculates pediatric dosage and single administration volume", () => {
      const dose = executeNursingStudy({
        studyType: "pediatric_dosage_calc",
        patientWeightKg: 20,
        prescribedDosePerKg: 15, // 15 mg/kg/day
        medicationConcentrationMgPerMl: 50, // 50 mg/mL
        dosesPerDay: 3, // TID
      });

      // Daily dose = 20 kg * 15 mg/kg = 300 mg/day
      expect(dose.results.totalDailyDoseMg).toBe(300);
      // Single dose = 300 / 3 = 100 mg
      expect(dose.results.singleDoseMg).toBe(100);
      // Single volume = 100 mg / (50 mg/mL) = 2.0 mL
      expect(dose.results.singleDoseVolumeMl).toBe(2.0);
      expect(dose.results.totalDailyVolumeMl).toBe(6.0);
      expect(dose.safetyNotice).toContain("CRITICAL CLINICAL NOTICE");
      expect(dose.safetyNotice).toContain("FOR EDUCATIONAL PRACTICE ONLY");
    });

    it("10.2 Structures standardized SBAR clinical handover notes", () => {
      const sbar = executeNursingStudy({
        studyType: "sbar_handover_builder",
        situation: "Patient in Room 302 developed acute shortness of breath",
        background: "Post-op Day 2 right total hip arthroplasty",
        assessment: "SpO2 88% on room air, tachycardia HR 118 bpm",
        recommendation: "Request STAT arterial blood gas and urgent chest CT angiography",
      });

      expect(sbar.handoverSheet.S_Situation).toContain("Room 302");
      expect(sbar.handoverSheet.A_Assessment).toContain("SpO2 88%");
      expect(sbar.clinicalChecklist.length).toBeGreaterThanOrEqual(4);
    });
  });

  // =========================================================================
  // 11. SHARED CROSS-DISCIPLINARY REPORT REVIEWER
  // =========================================================================
  describe("Group 11: Shared Cross-Disciplinary Project & Report Reviewer", () => {
    it(
      "11.1 Generates structured, objective report evaluation with identified evidence gaps",
      async () => {
        const review = await executeSharedReportReview({
          reportType: "technical_report",
          academicDiscipline: "Mechanical Engineering",
          title: "Experimental Stress Analysis of 6061-T6 Aluminum Cantilever Beam",
          abstractOrSummary: "Investigation of strain gauge readings under point tip loading.",
          reportText:
            "In this study, a 6061-T6 aluminum cantilever beam was subjected to incremental deadweight loads from 10 N to 100 N. Strain gauges mounted at the fixed boundary recorded longitudinal micro-strains. The theoretical Euler-Bernoulli calculations yielded expected stresses within 4% of measured experimental strain gauge values.",
        });

        expect(review.title).toContain("6061-T6");
        expect(review.review.strengths.length).toBeGreaterThan(0);
        expect(review.review.missingSectionsOrEvidence.length).toBeGreaterThan(0);
        expect(review.review.technicalQuestionsToCheck.length).toBeGreaterThan(0);
        expect(review.safetyNotice).toContain("FORMATIVE ACADEMIC REVIEW");
      },
      25000
    );
  });

  // =========================================================================
  // 12. HTTP API ENDPOINTS TEST (ROUTING, CATALOG, EXECUTION)
  // =========================================================================
  describe("Group 12: Express HTTP API Endpoints", () => {
    it("12.1 GET /api/v1/tools returns tool catalog with branch recommendations", async () => {
      const res = await request(app).get("/api/v1/tools");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tools)).toBe(true);
      expect(res.body.data.tools.length).toBeGreaterThanOrEqual(11);
      expect(res.body.data.availableDisciplines.length).toBeGreaterThanOrEqual(10);
    });

    it("12.2 GET /api/v1/tools?branch=mech filters to mechanical tools and cross-disciplinary shared tools", async () => {
      const res = await request(app).get("/api/v1/tools?branch=mech");
      expect(res.status).toBe(200);
      const tools = res.body.data.tools;
      const toolIds = tools.map((t) => t.toolId);
      expect(toolIds).toContain("mech-calc");
      expect(toolIds).toContain("report-reviewer");
      expect(toolIds).not.toContain("civil-boq");
    });

    it("12.3 GET /api/v1/tools/:toolId returns specific tool definition", async () => {
      const res = await request(app).get("/api/v1/tools/mech-calc");
      expect(res.status).toBe(200);
      expect(res.body.data.tool.displayName).toContain("Mechanical Engineering");
      expect(res.body.data.tool.supportedInputs.length).toBeGreaterThan(0);
    });

    it("12.4 POST /api/v1/tools/:toolId/execute executes calculation and returns structured output", async () => {
      const res = await request(app)
        .post("/api/v1/tools/mech-calc/execute")
        .send({
          inputs: {
            calculationType: "stress_strain",
            forceN: 10000,
            areaMm2: 100,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resultData.results.stressMpa).toBe(100);
      expect(res.body.data.safetyDisclaimers).toBeDefined();
    });

    it("12.5 POST /api/v1/tools/:toolId/execute returns 400 for malformed input", async () => {
      const res = await request(app)
        .post("/api/v1/tools/mech-calc/execute")
        .send({
          inputs: {
            calculationType: "stress_strain",
            forceN: -50,
            areaMm2: 0,
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Execution error");
    });

    it("12.6 Universal dispatch via executeTool service resolves any toolId", async () => {
      const result = await executeTool("civil-boq", {
        estimationType: "concrete_slab",
        lengthM: 2,
        widthM: 2,
        thicknessM: 0.1,
      });

      expect(result.toolId).toBe("civil-boq");
      expect(result.resultData.results.wetVolumeM3).toBe(0.4);
    });
  });
});
