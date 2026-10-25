import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

// Mock analytics models before loading app
vi.mock("../src/core/database/models/analytics.models.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    incrementDailyCounter: vi.fn().mockResolvedValue({}),
    logApiHit: vi.fn().mockResolvedValue({}),
  };
});

import { app } from "../src/app.js";
import { CANONICAL_TOOL_REGISTRY, TOOL_REGISTRY_MAP } from "../src/modules/tools/constants/toolRegistry.js";
import { ToolActivityRecord } from "../src/modules/tools/models/toolActivityRecord.models.js";
import { analyzeNucleotideSequence, planHypothesisAndExperiment, executeBiotechStudio } from "../src/modules/tools/services/biotechStudio.service.js";
import { calculateBreakEven, calculateCacLtv, analyzeKpis, executeBusinessStudio } from "../src/modules/tools/services/businessStudio.service.js";
import { calculateFinancialRatios, calculateNpvValuation, tutorAccountingTransaction, coachExcelFormula, executeFinanceStudio } from "../src/modules/tools/services/financeStudio.service.js";
import { formatBibliographicCitation, evaluateThesisAndArgument, buildPresentationOutline, executeArtsWritingStudio } from "../src/modules/tools/services/artsWritingStudio.service.js";
import { calculateDosageArithmetic, explainMedicalTerminology, buildSbarHandover, executeHealthcareStudio } from "../src/modules/tools/services/healthcareStudio.service.js";

// In-memory mock store for ToolActivityRecord
const mockActivityStore = new Map();

vi.spyOn(ToolActivityRecord, "create").mockImplementation(async (doc) => {
  const id = doc._id || new mongoose.Types.ObjectId();
  const record = {
    ...doc,
    _id: id,
    save: async function () {
      mockActivityStore.set(String(id), this);
      return this;
    },
    markModified: () => {},
  };
  mockActivityStore.set(String(id), record);
  return record;
});

vi.spyOn(ToolActivityRecord, "findOne").mockImplementation((query) => {
  const recordId = String(query._id);
  const targetUser = String(query.user);
  const rec = mockActivityStore.get(recordId);
  const matched = rec && String(rec.user) === targetUser ? rec : null;

  return {
    exec: async () => matched,
    then: (resolve) => resolve(matched),
  };
});

// Test user fixtures
const TEST_STUDENT_ID = new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00001");
const OTHER_USER_ID = new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00099");

const mockUser = {
  _id: TEST_STUDENT_ID,
  uid: "test-student-phase52",
  email: "student52@smartskillhub.edu",
  name: "Phase 52 Scholar",
  role: "student",
  academic: { branch: "biotech" },
};

// Mock authentication middleware
vi.mock("../src/core/auth/auth.middleware.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyFirebaseToken: (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.includes("Bearer unauthorized-user-token")) {
        req.user = {
          _id: OTHER_USER_ID,
          uid: "other-user",
          email: "other@smartskillhub.edu",
          role: "student",
        };
        return next();
      }
      req.user = mockUser;
      next();
    },
    optionalFirebaseToken: (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.includes("Bearer unauthorized-user-token")) {
        req.user = {
          _id: OTHER_USER_ID,
          uid: "other-user",
          email: "other@smartskillhub.edu",
          role: "student",
        };
      } else if (authHeader) {
        req.user = mockUser;
      }
      next();
    },
  };
});

describe("Phase 52: Specialized AI Studios Test Suite", () => {
  beforeEach(() => {
    mockActivityStore.clear();
  });

  // =========================================================================
  // 1. CANONICAL REGISTRY AUDIT
  // =========================================================================
  describe("Group 1: Canonical Registry Specifications", () => {
    it("1.1 Confirms all 5 Phase 52 studios are registered with version 2.0.0 and hybrid_ai_deterministic", () => {
      const studioIds = [
        "biotech-research",
        "business-kpi",
        "finance-accounting",
        "arts-writing",
        "nursing-study",
      ];

      for (const id of studioIds) {
        const tool = TOOL_REGISTRY_MAP.get(id);
        expect(tool, `Tool ${id} should exist`).toBeDefined();
        expect(tool.version).toBe("2.0.0");
        expect(tool.executionMode).toBe("hybrid_ai_deterministic");
        expect(tool.safetyDisclaimers).toBeDefined();
        expect(tool.safetyDisclaimers.length).toBeGreaterThan(20);
        expect(tool.limitations).toBeInstanceOf(Array);
        expect(tool.limitations.length).toBeGreaterThan(0);
      }
    });

    it("1.2 Confirms correct discipline categorization and route mapping", () => {
      expect(TOOL_REGISTRY_MAP.get("biotech-research").academicDiscipline).toBe("Biotechnology");
      expect(TOOL_REGISTRY_MAP.get("business-kpi").academicDiscipline).toBe("Business & Management");
      expect(TOOL_REGISTRY_MAP.get("finance-accounting").academicDiscipline).toBe("Commerce & Finance");
      expect(TOOL_REGISTRY_MAP.get("arts-writing").academicDiscipline).toBe("Arts & Humanities");
      expect(TOOL_REGISTRY_MAP.get("nursing-study").academicDiscipline).toBe("Nursing & Allied Health");
    });
  });

  // =========================================================================
  // 2. BIOTECHNOLOGY AI STUDIO ENGINE
  // =========================================================================
  describe("Group 2: Biotechnology AI Studio Engine", () => {
    it("2.1 Rejects invalid sequence characters and handles ambiguous nucleotides", () => {
      // Rejects numbers or symbols
      expect(() => analyzeNucleotideSequence("ATGC123$$")).toThrow(/Invalid sequence characters detected/);

      // Rejects empty sequence
      expect(() => analyzeNucleotideSequence("")).toThrow(/sequenceString is required/);

      // Successfully handles valid sequence with ambiguous N
      const res = analyzeNucleotideSequence("ATGCGATCGATCGATC NNN");
      expect(res.results.sequenceLengthNt).toBe(16);
      expect(res.results.ambiguousBasesCount).toBe(3);
    });

    it("2.2 Calculates exact Wallace Tm, Marmur-Doty Tm, GC%, and MW", () => {
      // Sequence: ATGCGATCGATCGATC (16 nt: A=4, T=4, G=4, C=4)
      const res = analyzeNucleotideSequence("ATGCGATCGATCGATC");
      expect(res.results.sequenceLengthNt).toBe(16);
      expect(res.results.gcPercentage).toBe(50.0);
      // Wallace: 2*(4+4) + 4*(4+4) = 16 + 32 = 48 °C
      expect(res.results.wallaceMeltingTempC).toBe(48.0);
      // Marmur-Doty: 64.9 + 41*(8 - 16.4)/16 = 64.9 + 41*(-8.4)/16 = 64.9 - 21.525 = 43.375 -> 43.4 °C
      expect(res.results.marmurDotyMeltingTempC).toBe(43.4);
      expect(res.results.recommendedAnnealingTempC).toBe(45.0); // max(48-5, 45) = 45
    });

    it("2.3 Formulates testable null/alternative hypotheses and positive/negative controls", () => {
      const res = planHypothesisAndExperiment({
        researchQuestion: "Does CRISPR-Cas9 knockdown of gene X reduce cell migration?",
        independentVariable: "CRISPR-Cas9 Gene X sgRNA",
        dependentVariable: "Wound-healing migration distance (micrometers)",
      });

      expect(res.results.nullHypothesisH0).toContain("There is no statistically significant effect");
      expect(res.results.alternativeHypothesisH1).toContain("will produce a statistically significant change");
      expect(res.results.positiveControl).toBeDefined();
      expect(res.results.negativeControl).toContain("Vehicle / solvent blank");
      expect(res.results.potentialConfounders.length).toBeGreaterThan(0);
    });

    it("2.4 Executes full Biotech Studio workflow with report draft and genuine learning links", async () => {
      const res = await executeBiotechStudio(
        {
          analysisType: "dna_gc_melting",
          sequenceString: "CGCGCGCGATATATAT",
          problemStatement: "PCR amplification primer for 16S rRNA gene region",
        },
        mockUser
      );

      expect(res.results.gcPercentage).toBe(50.0);
      expect(res.reportDraft).toBeDefined();
      expect(res.reportDraft.title).toContain("PCR amplification primer");
      expect(res.reportDraft.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "biotech-lab-pcr-primer")).toBe(true);
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "bio-molecular-genetics")).toBe(true);
      expect(res.reportDraft.safetyNotice).toContain("RESEARCH EDUCATION ONLY");
    }, 25000);
  });

  // =========================================================================
  // 3. BUSINESS INTELLIGENCE AI STUDIO ENGINE
  // =========================================================================
  describe("Group 3: Business Intelligence AI Studio Engine", () => {
    it("3.1 Deterministically computes break-even volume, revenue, and margin of safety %", () => {
      const res = calculateBreakEven({
        fixedCosts: 100000,
        unitSellingPrice: 50,
        unitVariableCost: 30,
        currentSalesUnits: 6000,
      });

      // CM = 50 - 30 = 20
      expect(res.results.contributionMarginPerUnit).toBe(20);
      // CMR = 20 / 50 = 40%
      expect(res.results.contributionMarginRatioPercent).toBe(40);
      // Break-even units = 100,000 / 20 = 5000 units
      expect(res.results.breakEvenUnits).toBe(5000);
      // Break-even revenue = 5000 * 50 = 250,000
      expect(res.results.breakEvenRevenue).toBe(250000);
      // Margin of Safety Units = 6000 - 5000 = 1000 units
      expect(res.results.marginOfSafetyUnits).toBe(1000);
      // Margin of Safety % = 1000 / 6000 = 16.67%
      expect(res.results.marginOfSafetyPercent).toBe(16.67);
      // Operating Profit = (6000 * 20) - 100,000 = 20,000
      expect(res.results.projectedOperatingProfit).toBe(20000);
    });

    it("3.2 Rejects contradictory economics where price is less than or equal to variable cost", () => {
      expect(() =>
        calculateBreakEven({
          fixedCosts: 50000,
          unitSellingPrice: 20,
          unitVariableCost: 25,
        })
      ).toThrow(/Contradictory economics/);

      expect(() =>
        calculateBreakEven({
          fixedCosts: -1000,
          unitSellingPrice: 50,
          unitVariableCost: 20,
        })
      ).toThrow(/fixedCosts must be a non-negative number/);
    });

    it("3.3 Computes CAC, LTV, and LTV/CAC ratio with health status evaluation", () => {
      const res = calculateCacLtv({
        marketingSpend: 30000,
        customersAcquired: 100,
        averageOrderValue: 200,
        purchaseFrequency: 4,
        customerLifespanYears: 3,
        grossMarginPercent: 70,
      });

      // CAC = 30000 / 100 = 300
      expect(res.results.customerAcquisitionCostCac).toBe(300);
      // Annual revenue = 200 * 4 = 800
      expect(res.results.annualRevenuePerCustomer).toBe(800);
      // LTV = 800 * 3 * 0.7 = 1680
      expect(res.results.customerLifetimeValueLtv).toBe(1680);
      // LTV / CAC = 1680 / 300 = 5.6x
      expect(res.results.ltvCacRatio).toBe(5.6);
      expect(res.results.unitEconomicsHealth).toContain("HEALTHY");
    });

    it("3.4 Computes KPI variance % and goal attainment %", () => {
      const res = analyzeKpis({
        kpiName: "Monthly Recurring Revenue (MRR)",
        baselineValue: 40000,
        currentValue: 50000,
        targetValue: 60000,
      });

      // Variance = (50000 - 40000)/40000 * 100 = 25%
      expect(res.results.variancePercent).toBe(25.0);
      // Attainment = 50000 / 60000 * 100 = 83.33%
      expect(res.results.attainmentPercent).toBe(83.33);
      expect(res.results.trendStatus).toBe("GROWING / POSITIVE");
    });

    it("3.5 Executes full Business Studio workflow with report draft and genuine learning links", async () => {
      const res = await executeBusinessStudio(
        {
          analysisType: "breakeven_margin_of_safety",
          fixedCosts: 80000,
          unitSellingPrice: 100,
          unitVariableCost: 60,
          currentSalesUnits: 2500,
          problemStatement: "Q3 expansion feasibility for enterprise B2B SaaS product line",
        },
        mockUser
      );

      expect(res.results.breakEvenUnits).toBe(2000);
      expect(res.reportDraft.title).toContain("Q3 expansion feasibility");
      expect(res.reportDraft.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "mba-lab-breakeven")).toBe(true);
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "mgmt-business-analysis")).toBe(true);
      expect(res.reportDraft.safetyNotice).toContain("ACADEMIC BUSINESS MODEL");
    }, 25000);
  });

  // =========================================================================
  // 4. FINANCE & ACCOUNTING PRACTICE AI STUDIO ENGINE
  // =========================================================================
  describe("Group 4: Finance & Accounting Practice AI Studio Engine", () => {
    it("4.1 Accurately calculates liquidity, profitability, and solvency ratios", () => {
      const res = calculateFinancialRatios({
        currentAssets: 200000,
        currentLiabilities: 100000,
        inventory: 40000,
        revenue: 500000,
        grossProfit: 200000,
        netIncome: 50000,
        totalEquity: 250000,
        totalAssets: 400000,
        totalDebt: 150000,
      });

      // Working capital = 200,000 - 100,000 = 100,000
      expect(res.results.workingCapital).toBe(100000);
      // Current ratio = 200,000 / 100,000 = 2.0x
      expect(res.results.currentRatio).toBe(2.0);
      // Quick ratio = (200,000 - 40,000) / 100,000 = 1.6x
      expect(res.results.quickRatio).toBe(1.6);
      // Gross margin = 200,000 / 500,000 = 40%
      expect(res.results.grossMarginPercent).toBe(40.0);
      // Net margin = 50,000 / 500,000 = 10%
      expect(res.results.netMarginPercent).toBe(10.0);
      // ROE = 50,000 / 250,000 = 20%
      expect(res.results.returnOnEquityPercent).toBe(20.0);
      // Debt to Equity = 150,000 / 250,000 = 0.6x
      expect(res.results.debtToEquityRatio).toBe(0.6);
    });

    it("4.2 Gracefully handles division by zero on liquidity and solvency ratios", () => {
      const res = calculateFinancialRatios({
        currentAssets: 50000,
        currentLiabilities: 0,
        totalEquity: 0,
        netIncome: 10000,
      });

      expect(res.results.currentRatio).toContain("N/A (Zero Liabilities)");
      expect(res.results.returnOnEquityPercent).toContain("N/A (Zero Equity)");
    });

    it("4.3 Models 3-period NPV with discount factor schedule and interest rate sensitivity", () => {
      const res = calculateNpvValuation({
        initialOutlay: 100000,
        cashFlows: "40000, 50000, 60000",
        discountRatePercent: 10,
      });

      // Period 1 PV = 40,000 / 1.10 = 36,363.64
      // Period 2 PV = 50,000 / 1.21 = 41,322.31
      // Period 3 PV = 60,000 / 1.331 = 45,078.89
      // Total PV = 122,764.84
      // NPV = 122,764.84 - 100,000 = 22,764.84
      expect(res.results.netPresentValue).toBe(22764.84);
      expect(res.results.investmentDecision).toContain("ACCEPT");
      expect(res.results.discountFactorSchedule).toHaveLength(3);
      expect(res.results.sensitivityAnalysis.lowerRateMinus2Pct.npv).toBeGreaterThan(res.results.netPresentValue);
      expect(res.results.sensitivityAnalysis.higherRatePlus2Pct.npv).toBeLessThan(res.results.netPresentValue);
    });

    it("4.4 Tutors accounting transactions and explains debits and credits", () => {
      const res = tutorAccountingTransaction({
        transactionDescription: "Paid office rent expense of $3,500 in cash",
      });

      expect(res.results.debitEntry.account).toContain("Operating Expense");
      expect(res.results.creditEntry.account).toContain("Cash");
      expect(res.results.accountingEquationImpact).toContain("Assets decrease");
    });

    it("4.5 Excel formula coach generates verified formulas with syntax and error traps", () => {
      const res = coachExcelFormula({
        formulaTask: "Calculate monthly payment on a 5-year loan of $25,000 at 6% annual rate",
      });

      expect(res.results.recommendedFormula).toContain("=PMT");
      expect(res.results.syntaxBreakdown).toContain("PMT(rate, nper, pv");
      expect(res.results.commonErrorTraps.some((e) => e.includes("#NUM!"))).toBe(true);
    });

    it("4.6 Executes full Finance Studio workflow with report draft and genuine learning links", async () => {
      const res = await executeFinanceStudio(
        {
          analysisType: "three_period_npv",
          initialOutlay: 150000,
          cashFlows: "60000, 70000, 80000",
          discountRatePercent: 12,
          problemStatement: "Capital equipment acquisition NPV appraisal for manufacturing line",
        },
        mockUser
      );

      expect(res.reportDraft.title).toContain("Capital equipment acquisition");
      expect(res.reportDraft.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "finance-lab-dcf-valuation")).toBe(true);
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "fin-accounting-fundamentals")).toBe(true);
      expect(res.reportDraft.safetyNotice).toContain("FINANCIAL LEARNING TOOL");
    }, 25000);
  });

  // =========================================================================
  // 5. RESEARCH WRITING & CRITICAL ANALYSIS AI STUDIO ENGINE
  // =========================================================================
  describe("Group 5: Research Writing & Critical Analysis AI Studio Engine", () => {
    it("5.1 Formats APA 7th, MLA 9th, and Chicago 17th citations deterministically", () => {
      const apaRes = formatBibliographicCitation({
        citationStyle: "APA 7th",
        author: "Kahneman, D.",
        title: "Thinking, Fast and Slow",
        year: "2011",
        publisher: "Farrar, Straus and Giroux",
      });

      expect(apaRes.results.isComplete).toBe(true);
      expect(apaRes.results.formattedBibliographyEntry).toContain("Kahneman, D. (2011). *Thinking, Fast and Slow*. Farrar, Straus and Giroux");
      expect(apaRes.results.inTextParentheticalCitation).toContain("(Kahneman, 2011)");

      const mlaRes = formatBibliographicCitation({
        citationStyle: "MLA 9th",
        author: "Austen, Jane",
        title: "Pride and Prejudice",
        year: "1813",
        publisher: "T. Egerton",
      });

      expect(mlaRes.results.formattedBibliographyEntry).toContain("Austen, Jane. *Pride and Prejudice*. T. Egerton, 1813");
    });

    it("5.2 Identifies incomplete bibliographic metadata without inventing missing fields", () => {
      const incompleteRes = formatBibliographicCitation({
        citationStyle: "APA 7th",
        title: "Some Online Blog Article Without Author or Year",
      });

      expect(incompleteRes.results.isComplete).toBe(false);
      expect(incompleteRes.results.missingFields).toContain("Author / Organization");
      expect(incompleteRes.results.missingFields).toContain("Publication Year / Date");
      expect(incompleteRes.results.missingFields).toContain("Publisher or Academic Journal");
      expect(incompleteRes.results.completenessStatus).toContain("INCOMPLETE");
      expect(incompleteRes.results.formattedBibliographyEntry).toContain("[Author Missing]");
    });

    it("5.3 Evaluates thesis statement contestability and detects rhetorical fallacies", () => {
      const weakRes = evaluateThesisAndArgument({
        thesisStatement: "Technology is very important in society today.",
      });
      expect(weakRes.results.thesisContestabilityRating).toContain("WEAK / DESCRIPTIVE");

      const strongRes = evaluateThesisAndArgument({
        thesisStatement:
          "Although automated algorithms improve diagnostic triage speed, their uncurated deployment introduces demographic racial bias because underlying training data lacks minority representation.",
      });
      expect(strongRes.results.thesisContestabilityRating).toContain("STRONG / CONTESTABLE");
      expect(strongRes.results.potentialLogicalFallaciesToCheck).toBeInstanceOf(Array);
      expect(strongRes.results.toulminArgumentComponents.warrant).toBeDefined();
    });

    it("5.4 Builds presentation outline with slide timing pacing (~2 min/slide)", () => {
      const presRes = buildPresentationOutline({
        researchTopic: "Historiographical Analysis of the Printing Press in Reformation Europe",
        targetDurationMinutes: 12,
      });

      expect(presRes.results.recommendedSlideCount).toBe(6); // 12 / 2 = 6
      expect(presRes.results.slideOutline).toHaveLength(6);
      expect(presRes.results.slideOutline[0].title).toContain("Title & Hook");
      expect(presRes.results.slideOutline[2].title).toContain("Core Thesis");
    });

    it("5.5 Executes full Arts Writing Studio workflow with report draft and genuine learning links", async () => {
      const res = await executeArtsWritingStudio(
        {
          analysisType: "citation_formatter",
          citationStyle: "APA 7th",
          author: "Habermas, J.",
          title: "The Structural Transformation of the Public Sphere",
          year: "1989",
          publisher: "MIT Press",
          problemStatement: "Critical literature citation for democratic media theory seminar paper",
        },
        mockUser
      );

      expect(res.results.isComplete).toBe(true);
      expect(res.reportDraft.title).toContain("Critical literature citation");
      expect(res.reportDraft.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "arts-lab-fallacy-identification")).toBe(true);
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "arts-critical-reasoning")).toBe(true);
      expect(res.reportDraft.safetyNotice).toContain("ACADEMIC WRITING ASSISTANT");
    }, 25000);
  });

  // =========================================================================
  // 6. HEALTHCARE CLINICAL PRACTICE & DOSAGE AI STUDIO ENGINE
  // =========================================================================
  describe("Group 6: Healthcare Clinical Practice & Dosage AI Studio Engine", () => {
    it("6.1 Accurately calculates pediatric weight-based medication dosage with dimensional proof", () => {
      // Patient weight 16 kg, 15 mg/kg, stock concentration 50 mg/mL, q8h (3 doses/day)
      const res = calculateDosageArithmetic({
        patientWeightKg: 16,
        prescribedDosePerKg: 15,
        medicationConcentrationMgPerMl: 50,
        dosesPerDay: 3,
      });

      // Single dose = 16 * 15 = 240 mg
      expect(res.results.singleDoseMg).toBe(240.0);
      // Single dose volume = 240 / 50 = 4.8 mL
      expect(res.results.singleDoseVolumeMl).toBe(4.8);
      // Daily total dose = 240 * 3 = 720 mg
      expect(res.results.dailyTotalDoseMg).toBe(720.0);
      // Daily total volume = 4.8 * 3 = 14.4 mL
      expect(res.results.dailyTotalVolumeMl).toBe(14.4);
      expect(res.results.dimensionalAnalysisProof).toContain("4.80 mL per dose");
    });

    it("6.2 Rejects non-positive or physiologically implausible weights", () => {
      expect(() =>
        calculateDosageArithmetic({
          patientWeightKg: -5,
          prescribedDosePerKg: 10,
          medicationConcentrationMgPerMl: 20,
        })
      ).toThrow(/patientWeightKg must be a positive number/);

      expect(() =>
        calculateDosageArithmetic({
          patientWeightKg: 450, // Implausible outlier
          prescribedDosePerKg: 10,
          medicationConcentrationMgPerMl: 20,
        })
      ).toThrow(/outside plausible human physiological ranges/);
    });

    it("6.3 Decodes medical terminology and flags dangerous abbreviations from ISMP 'Do Not Use' list", () => {
      // Valid term
      const tachyRes = explainMedicalTerminology({ termOrAbbreviation: "tachycardia" });
      expect(tachyRes.results.etymology.prefix).toContain("tachy-");
      expect(tachyRes.results.isDangerousAbbreviation).toBe(false);

      // Dangerous abbreviation: 'QD'
      const qdRes = explainMedicalTerminology({ termOrAbbreviation: "QD" });
      expect(qdRes.results.isDangerousAbbreviation).toBe(true);
      expect(qdRes.results.dangerousAbbreviationAlert).toContain("ISMP 'DO NOT USE' LIST");

      // Dangerous abbreviation: 'U'
      const uRes = explainMedicalTerminology({ termOrAbbreviation: "U" });
      expect(uRes.results.isDangerousAbbreviation).toBe(true);
      expect(uRes.results.dangerousAbbreviationAlert).toContain("Unit");
    });

    it("6.4 Validates SBAR handover completeness and highlights missing critical patient data", () => {
      const partialSbar = buildSbarHandover({
        situation: "Patient John Doe in Room 402 experiencing acute shortness of breath",
        recommendation: "Requesting immediate physician bedside evaluation",
        // Background and Assessment omitted
      });

      expect(partialSbar.results.completenessScore).toBe("2 / 4 Sections Provided");
      expect(partialSbar.results.missingHandoverItems.some((i) => i.includes("Background"))).toBe(true);
      expect(partialSbar.results.missingHandoverItems.some((i) => i.includes("Assessment"))).toBe(true);
      expect(partialSbar.results.sbarContent.background).toContain("[MISSING:");
    });

    it("6.5 Executes full Healthcare Studio workflow with non-negotiable safety notice and genuine learning links", async () => {
      const res = await executeHealthcareStudio(
        {
          studyType: "pediatric_dosage_calc",
          patientWeightKg: 20,
          prescribedDosePerKg: 10,
          medicationConcentrationMgPerMl: 25,
          dosesPerDay: 2,
          problemStatement: "Amoxicillin oral suspension dosage verification for pediatric otitis media",
        },
        mockUser
      );

      expect(res.results.singleDoseMg).toBe(200.0);
      expect(res.results.singleDoseVolumeMl).toBe(8.0);
      expect(res.reportDraft.title).toContain("Amoxicillin oral suspension");
      expect(res.reportDraft.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "nursing-lab-dosage-calculation")).toBe(true);
      expect(res.reportDraft.learningPathwayLinks.some((l) => l.id === "health-clinical-pharmacology")).toBe(true);
      // Non-negotiable safety boundary check
      expect(res.reportDraft.safetyNotice).toContain("CRITICAL CLINICAL NOTICE: FOR EDUCATIONAL PRACTICE ONLY");
      expect(res.reportDraft.safetyNotice).toContain("Must NOT be used for live patient dosing");
    }, 25000);
  });

  // =========================================================================
  // 7. EXPRESS HTTP API ENDPOINTS & ACTIVITY PERSISTENCE
  // =========================================================================
  describe("Group 7: Express HTTP API Endpoints", () => {
    it("7.1 POST /api/v1/tools/:toolId/execute returns reportDraft and verification on success for Biotech Studio", async () => {
      const response = await request(app)
        .post("/api/v1/tools/biotech-research/execute")
        .set("Authorization", "Bearer valid-student-token")
        .send({
          analysisType: "dna_gc_melting",
          sequenceString: "ATGCATGCATGCATGC",
          problemStatement: "Sequencing primer check for cloning plasmid",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.resultData.results.gcPercentage).toBe(50.0);
      expect(response.body.data.resultData.reportDraft).toBeDefined();
      expect(response.body.data.activityRecordId).toBeDefined();
    });

    it("7.2 POST /api/v1/tools/:toolId/execute returns reportDraft and verification on success for Healthcare Studio", async () => {
      const response = await request(app)
        .post("/api/v1/tools/nursing-study/execute")
        .set("Authorization", "Bearer valid-student-token")
        .send({
          studyType: "pediatric_dosage_calc",
          patientWeightKg: 12,
          prescribedDosePerKg: 25,
          medicationConcentrationMgPerMl: 50,
          problemStatement: "Pediatric antibiotic dosing scenario",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.resultData.results.singleDoseMg).toBe(300.0);
      expect(response.body.data.resultData.results.singleDoseVolumeMl).toBe(6.0);
      expect(response.body.data.safetyDisclaimers).toContain("CRITICAL CLINICAL NOTICE");
    });

    it("7.3 PUT /api/v1/tools/history/:recordId/report updates student report draft with ownership check", async () => {
      const execRes = await request(app)
        .post("/api/v1/tools/business-kpi/execute")
        .set("Authorization", "Bearer valid-student-token")
        .send({
          analysisType: "breakeven_margin_of_safety",
          fixedCosts: 50000,
          unitSellingPrice: 40,
          unitVariableCost: 15,
          problemStatement: "Unit economics draft review",
        });

      const recordId = execRes.body.data.activityRecordId;
      expect(recordId).toBeDefined();

      const updateRes = await request(app)
        .put(`/api/v1/tools/history/${recordId}/report`)
        .set("Authorization", "Bearer valid-student-token")
        .send({
          reportDraft: {
            title: "Revised Executive Business Report: Q4 Breakeven Target",
            studentNotes: "Adjusted break-even volume reflects revised marketing spend.",
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.reportDraft.title).toBe("Revised Executive Business Report: Q4 Breakeven Target");
      expect(updateRes.body.data.reportDraft.studentNotes).toBe("Adjusted break-even volume reflects revised marketing spend.");
    });

    it("7.4 PUT /api/v1/tools/history/:recordId/report rejects unauthorized user update", async () => {
      const execRes = await request(app)
        .post("/api/v1/tools/finance-accounting/execute")
        .set("Authorization", "Bearer valid-student-token")
        .send({
          analysisType: "liquidity_ratios",
          currentAssets: 100000,
          currentLiabilities: 50000,
        });

      const recordId = execRes.body.data.activityRecordId;
      expect(recordId).toBeDefined();

      const unauthorizedRes = await request(app)
        .put(`/api/v1/tools/history/${recordId}/report`)
        .set("Authorization", "Bearer unauthorized-user-token")
        .send({
          reportDraft: {
            title: "Tampered Financial Report",
          },
        });

      expect(unauthorizedRes.status).toBe(404);
      expect(unauthorizedRes.body.success).toBe(false);
    });
  });
});
