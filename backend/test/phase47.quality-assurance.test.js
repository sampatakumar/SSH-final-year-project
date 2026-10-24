import { describe, it, expect, vi, beforeEach } from "vitest";
import { PRACTICAL_LAB_CATALOG } from "../src/modules/academic/constants/practicalLabCatalog.js";
import {
  evaluateTaskAnswer,
  sanitizeLabForClient,
  practicalLabService,
} from "../src/modules/academic/services/practicalLab.service.js";
import {
  evidenceNormalizationService,
  DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS,
} from "../src/modules/skills/services/evidenceNormalization.service.js";
import { skillGapDiagnosisService } from "../src/modules/skills/services/skillGapDiagnosis.service.js";
import { adaptiveLearningPathwayService } from "../src/modules/recommendations/services/adaptiveLearningPathway.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { ASSESSMENTS_CATALOG } from "../src/modules/academic/constants/assessmentCatalog.js";
import { INITIAL_PROJECT_TEMPLATES } from "../src/modules/academic/constants/projectTemplatesCatalog.js";
import { getBranchCapabilities } from "../src/modules/academic/services/branchCapabilityRegistry.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { PracticalLabAttempt } from "../src/modules/academic/models/practicalLabAttempt.models.js";
import { ApiError } from "../src/core/errors/ApiError.js";

describe("Phase 47: Multi-Branch Quality Assurance & End-to-End Integration Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SECTION 1: INDEPENDENT NUMERICAL CALCULATION VALIDATION (All 20 Labs)
  // =========================================================================
  describe("Group 1: Independent Numerical Calculation Validation & Tolerances", () => {
    it("1.1 CSE algo complexity: verifies N(N-1)/2 for N=500 matches 124,750 comparisons", () => {
      const N = 500;
      const independentComparisons = (N * (N - 1)) / 2;
      expect(independentComparisons).toBe(124750);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "cse-lab-algo-complexity");
      const task = lab.tasks[0];
      expect(task.acceptedAnswer).toBe(124750);

      const evalResult = evaluateTaskAnswer(task, "124750");
      expect(evalResult.isCorrect).toBe(true);
      expect(evalResult.pointsEarned).toBe(task.points);
    });

    it("1.2 CSE rate limiter: verifies burst deficit (3500 - 2000) * 6s matches 9,000 tokens", () => {
      const peakRate = 3500;
      const capacityRate = 2000;
      const durationSeconds = 6;
      const independentDeficit = (peakRate - capacityRate) * durationSeconds;
      expect(independentDeficit).toBe(9000);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "cse-lab-api-rate-limiter");
      const task = lab.tasks[0];
      expect(task.acceptedAnswer).toBe(9000);

      const evalResult = evaluateTaskAnswer(task, 9000);
      expect(evalResult.isCorrect).toBe(true);
    });

    it("1.3 Mechanical stress & FoS: verifies tensile stress 143.24 MPa and FoS 2.16", () => {
      const loadN = 45000; // 45 kN
      const diameterMm = 20;
      const areaMm2 = (Math.PI * Math.pow(diameterMm, 2)) / 4;
      const independentStressMpa = loadN / areaMm2; // ~143.23945 MPa
      const roundedStress = parseFloat(independentStressMpa.toFixed(2));
      expect(roundedStress).toBe(143.24);

      const yieldStrengthMpa = 310;
      const independentFos = parseFloat((yieldStrengthMpa / independentStressMpa).toFixed(2));
      expect(independentFos).toBe(2.16);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-stress-strain");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 143.24).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 2.16).isCorrect).toBe(true);
    });

    it("1.4 Mechanical gear train: verifies ratio 12.0 and output torque 165.6 N*m", () => {
      const stage1Ratio = 54 / 18; // 3.0
      const stage2Ratio = 80 / 20; // 4.0
      const independentRatio = stage1Ratio * stage2Ratio;
      expect(independentRatio).toBe(12.0);

      const inputTorque = 15.0; // N*m
      const efficiency = 0.92;
      const independentOutputTorque = inputTorque * independentRatio * efficiency;
      expect(independentOutputTorque).toBe(165.6);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-gear-ratio");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 12.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 165.6).isCorrect).toBe(true);
    });

    it("1.5 ECE Thévenin circuit: verifies Vth = 16.0 V and Rth = 4.0 ohms", () => {
      const Vs = 24.0;
      const R1 = 6.0;
      const R2 = 12.0;
      const independentVth = Vs * (R2 / (R1 + R2));
      const independentRth = (R1 * R2) / (R1 + R2);
      expect(independentVth).toBe(16.0);
      expect(independentRth).toBe(4.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "ece-lab-circuit-thevenin");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 16.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 4.0).isCorrect).toBe(true);
    });

    it("1.6 ECE Op-Amp & bandwidth: verifies Vout = -1.5 V and cutoff fc = 100.0 kHz", () => {
      const Rf = 100.0; // kOhms
      const Rin = 10.0; // kOhms
      const Vin = 0.15; // V
      const gain = -(Rf / Rin); // -10.0
      const independentVout = gain * Vin;
      expect(independentVout).toBe(-1.5);

      const gbwpKhz = 1000.0; // 1.0 MHz = 1000 kHz
      const closedLoopGainMag = Math.abs(gain);
      const independentFc = gbwpKhz / closedLoopGainMag;
      expect(independentFc).toBe(100.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "ece-lab-opamp-filter");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, -1.5).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 100.0).isCorrect).toBe(true);
    });

    it("1.7 Civil beam bending: verifies reaction Ra = 46.0 kN and Mmax = 84.0 kN*m", () => {
      const L = 6.0; // m
      const w = 12.0; // kN/m
      const P = 20.0; // kN
      const independentReaction = (w * L) / 2 + P / 2;
      expect(independentReaction).toBe(46.0);

      const independentMmax = (w * Math.pow(L, 2)) / 8 + (P * L) / 4;
      expect(independentMmax).toBe(84.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "civil-lab-beam-bending");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 46.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 84.0).isCorrect).toBe(true);
    });

    it("1.8 Civil concrete mix: verifies f'ck = 31.6 MPa and w/c = 0.50 (opt-2)", () => {
      const fck = 25.0;
      const s = 4.0;
      const independentFckTarget = fck + 1.65 * s;
      expect(independentFckTarget).toBe(31.6);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "civil-lab-concrete-mix");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 31.6).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, "opt-2").isCorrect).toBe(true);
    });

    it("1.9 Chemical mass balance: verifies distillate D = 437.5 kg/h and bottoms W = 562.5 kg/h", () => {
      const F = 1000.0;
      const zF = 0.40;
      const xD = 0.85;
      const xW = 0.05;
      const independentD = (F * (zF - xW)) / (xD - xW);
      const roundedD = parseFloat(independentD.toFixed(1));
      const independentW = F - roundedD;
      expect(roundedD).toBe(437.5);
      expect(independentW).toBe(562.5);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "chem-lab-mass-balance");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 437.5).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 562.5).isCorrect).toBe(true);
    });

    it("1.10 Chemical CSTR kinetics: verifies space time tau = 20.0 min and volume V = 800.0 L", () => {
      const XA = 0.75;
      const k = 0.15; // min^-1
      const independentTau = XA / (k * (1 - XA));
      expect(independentTau).toBe(20.0);

      const v0 = 40.0; // L/min
      const independentV = v0 * independentTau;
      expect(independentV).toBe(800.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "chem-lab-cstir-reactor");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 20.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 800.0).isCorrect).toBe(true);
    });

    it("1.11 Biotech PCR primer: verifies %GC = 50.0% and Wallace Tm = 60.0 C", () => {
      const seq = "GACCTAGCTAGGCTACCAAT";
      const totalLen = seq.length;
      expect(totalLen).toBe(20);

      const gCount = (seq.match(/G/g) || []).length;
      const cCount = (seq.match(/C/g) || []).length;
      const aCount = (seq.match(/A/g) || []).length;
      const tCount = (seq.match(/T/g) || []).length;

      const independentGcPercent = ((gCount + cCount) / totalLen) * 100;
      expect(independentGcPercent).toBe(50.0);

      const independentTm = 2 * (aCount + tCount) + 4 * (gCount + cCount);
      expect(independentTm).toBe(60.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "biotech-lab-pcr-primer");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 50.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 60.0).isCorrect).toBe(true);
    });

    it("1.12 Biotech Michaelis-Menten: verifies reaction rate v0 = 90.0 umol/(L*min)", () => {
      const Vmax = 120.0;
      const S = 15.0;
      const Km = 5.0;
      const independentV0 = (Vmax * S) / (Km + S);
      expect(independentV0).toBe(90.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "biotech-lab-enzyme-kinetics");
      const task1 = lab.tasks[0];
      expect(evaluateTaskAnswer(task1, 90.0).isCorrect).toBe(true);
    });

    it("1.13 MBA break-even & margin of safety: verifies Qbe = 3200 units and MoS = 20.0%", () => {
      const FC = 480000;
      const P = 200;
      const V = 50;
      const CM = P - V; // 150
      const independentQbe = FC / CM;
      expect(independentQbe).toBe(3200);

      const actualQ = 4000;
      const independentMos = ((actualQ - independentQbe) / actualQ) * 100;
      expect(independentMos).toBe(20.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mba-lab-breakeven");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 3200).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 20.0).isCorrect).toBe(true);
    });

    it("1.14 MBA marketing CAC & LTV: verifies CAC = $50.0 and LTV = $420.0", () => {
      const spend = 150000;
      const customers = 3000;
      const independentCac = spend / customers;
      expect(independentCac).toBe(50.0);

      const arpu = 120.0;
      const lifespanMonths = 3.5;
      const independentLtv = arpu * lifespanMonths;
      expect(independentLtv).toBe(420.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mba-lab-marketing-roi");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 50.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 420.0).isCorrect).toBe(true);
    });

    it("1.15 Finance DCF valuation: verifies PV = $197,370.4 and NPV = -$2,629.6", () => {
      const r = 0.10;
      const cf1 = 70000 / Math.pow(1 + r, 1);
      const cf2 = 80000 / Math.pow(1 + r, 2);
      const cf3 = 90000 / Math.pow(1 + r, 3);
      const independentPv = parseFloat((cf1 + cf2 + cf3).toFixed(1));
      expect(independentPv).toBe(197370.4);

      const initialOutlay = 200000;
      const independentNpv = parseFloat((independentPv - initialOutlay).toFixed(1));
      expect(independentNpv).toBe(-2629.6);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "finance-lab-dcf-valuation");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 197370.4).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, -2629.6).isCorrect).toBe(true);
    });

    it("1.16 Finance liquidity ratios: verifies CR = 2.32 and QR = 1.60", () => {
      const currentAssets = 120000 + 80000 + 200000 + 180000; // 580,000
      const currentLiabilities = 150000 + 100000; // 250,000
      const independentCr = parseFloat((currentAssets / currentLiabilities).toFixed(2));
      expect(independentCr).toBe(2.32);

      const inventory = 180000;
      const quickAssets = currentAssets - inventory; // 400,000
      const independentQr = parseFloat((quickAssets / currentLiabilities).toFixed(2));
      expect(independentQr).toBe(1.60);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "finance-lab-liquidity-ratios");
      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 2.32).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 1.60).isCorrect).toBe(true);
    });

    it("1.17 Boundary and malformed inputs are safely graded without throwing", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-stress-strain");
      const task = lab.tasks[0];

      // Non-finite strings, NaN, Infinity, negative values
      expect(evaluateTaskAnswer(task, "abc").isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task, NaN).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task, Infinity).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task, -Infinity).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task, null).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task, "").isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task, -143.24).isCorrect).toBe(false);
    });
  });

  // =========================================================================
  // SECTION 2: SAFETY-SENSITIVE EDUCATIONAL ACTIVITIES
  // =========================================================================
  describe("Group 2: Safety-Sensitive Educational Activities", () => {
    it("2.1 Nursing dosage: independently verifies pediatric dose and oral suspension volume", () => {
      const patientWeightKg = 20.0;
      const prescribedRateMgPerKgDay = 45.0;
      const independentDailyDoseMg = patientWeightKg * prescribedRateMgPerKgDay;
      expect(independentDailyDoseMg).toBe(900.0);

      const dosesPerDay = 2; // q12h
      const singleDoseMg = independentDailyDoseMg / dosesPerDay; // 450.0 mg
      const concentrationMg = 250.0;
      const concentrationMl = 5.0;
      const concentrationMgPerMl = concentrationMg / concentrationMl; // 50.0 mg/mL
      const independentVolumeMl = singleDoseMg / concentrationMgPerMl;
      expect(independentVolumeMl).toBe(9.0);

      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "nursing-lab-dosage-calculation");
      expect(lab.safetySensitive).toBe(true);
      expect(lab.disclaimer).toBeDefined();
      expect(lab.disclaimer).toMatch(/educational/i);

      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, 900.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, 9.0).isCorrect).toBe(true);

      // Rejects clinical zero or negative doses
      expect(evaluateTaskAnswer(task1, -900.0).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task2, 0).isCorrect).toBe(false);
    });

    it("2.2 Nursing SBAR scenario: verifies standardized clinical escalation", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "nursing-lab-sbar-communication");
      expect(lab.safetySensitive).toBe(true);
      expect(lab.disclaimer).toMatch(/educational/i);

      const task1 = lab.tasks[0];
      const task2 = lab.tasks[1];

      expect(evaluateTaskAnswer(task1, "opt-2").isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task2, "opt-1").isCorrect).toBe(true);
    });

    it("2.3 Engineering safety: structural and electrical models contain explicit educational disclaimers", () => {
      const structural = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "civil-lab-beam-bending");
      const ece = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "ece-lab-circuit-thevenin");

      expect(structural.disclaimer).toBeDefined();
      expect(ece.disclaimer).toBeDefined();
    });
  });

  // =========================================================================
  // SECTION 3: EVIDENCE CONFIDENCE AND SKILL SCORING AUDIT
  // =========================================================================
  describe("Group 3: Evidence Confidence, Normalization & Scoring Rigor", () => {
    it("3.1 Deterministic evidence-strength weights are explicitly defined heuristic tiers", () => {
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS).toBeDefined();
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER).toBe(0.95);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.CODING_SANDBOX).toBe(0.95);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PRACTICAL_LAB).toBe(0.90);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC).toBe(0.85);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.QUIZ_CHECKPOINT).toBe(0.80);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.SPACED_REVISION).toBe(0.75);
    });

    it("3.2 Deduplication: identical skills evaluated in a single attempt are not duplicated in timeline", async () => {
      const mockOwner = "student_dedup_001";
      const mockAttempt = {
        _id: "attempt_dup_1",
        owner: mockOwner,
        labId: "cse-lab-algo-complexity",
        status: "submitted",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        skillsEvaluated: ["Algorithms", "Algorithms", "Time Complexity"], // duplicate "Algorithms"
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation((model) => {
        if (model.modelName === "PracticalLabAttempt") return Promise.resolve([mockAttempt]);
        return Promise.resolve([]);
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(mockOwner);
      const algoEvidence = normalized.timeline.filter((e) => e.canonicalSkill === "Algorithms");
      expect(algoEvidence.length).toBe(1); // Exactly 1, duplicate prevented!
    });

    it("3.3 Veracity tier vs passing outcome: completed attempt with score < 70 retains score and isPassing=false", async () => {
      const mockOwner = "student_failed_lab_002";
      const mockFailedAttempt = {
        _id: "attempt_fail_1",
        owner: mockOwner,
        labId: "mech-lab-stress-strain",
        status: "submitted",
        serverScore: 40,
        maxScore: 100,
        percentage: 40,
        isPassing: false,
        skillsEvaluated: ["Strength of Materials"],
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation((model) => {
        if (model.modelName === "PracticalLabAttempt") return Promise.resolve([mockFailedAttempt]);
        return Promise.resolve([]);
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(mockOwner);
      const skillData = normalized.normalizedBySkill["Strength of Materials"];
      expect(skillData.latestScore).toBe(40);
      expect(skillData.hasPassed).toBe(false);

      // Skill gap diagnosis marks it as needs_remediation, NOT competent or mastered
      const user = { academicBranch: "mech", targetRole: "Mechanical Design Engineer" };
      const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(user, normalized);
      const diagnosed = diagnosis.diagnosedSkills.find((s) => s.skill === "Strength of Materials");
      expect(diagnosed.currentStatus).toBe("needs_remediation");
    });
  });

  // =========================================================================
  // SECTION 4: END-TO-END STUDENT JOURNEY SCENARIOS (A - E)
  // =========================================================================
  describe("Group 4: End-to-End Student Journeys", () => {
    // -----------------------------------------------------------------------
    // SCENARIO A: Student with Demonstrated Learning Gap
    // -----------------------------------------------------------------------
    it("Scenario A: Full learning loop from gap diagnosis to lab practice and mentor update", async () => {
      const studentId = "student_scenario_a_001";
      const user = {
        _id: studentId,
        academicBranch: "civil",
        branch: "civil",
        targetRole: "Structural Design Engineer",
      };

      User.findById = vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(user),
      });

      // 1. Initial failed assessment attempt in Structural Analysis (score 45%)
      const initialAssessment = {
        _id: "assess_civil_01",
        owner: studentId,
        assessmentId: "civil-structural-fundamentals",
        status: "submitted",
        score: 45,
        maxScore: 100,
        percentage: 45,
        isPassing: false,
        strengths: ["Load definitions"],
        areasForImprovement: ["Bending moment calculations midspan"],
        submittedAt: new Date(Date.now() - 3600000).toISOString(),
      };

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation((model) => {
        if (model.modelName === "AssessmentAttempt") return Promise.resolve([initialAssessment]);
        return Promise.resolve([]);
      });

      // 2. Normalization & Diagnosis identify remediation need
      const normalizedBefore = await evidenceNormalizationService.getNormalizedStudentEvidence(studentId);
      const diagnosisBefore = skillGapDiagnosisService.diagnoseStudentSkillGaps(user, normalizedBefore);
      const gap = diagnosisBefore.priorityGaps.find((g) => g.skill === "Structural Analysis");
      expect(gap).toBeDefined();
      expect(gap.currentStatus).toBe("needs_remediation");

      // 3. Adaptive Pathway recommends relevant Practical Lab
      const pathwayBefore = await adaptiveLearningPathwayService.generateLearningPathway(studentId, "Structural Design Engineer");
      const labAction = pathwayBefore.actions.find((a) => a.actionType === "practical_lab");
      expect(labAction).toBeDefined();
      expect(labAction.supportingEvidence.labId).toBe("civil-lab-beam-bending");

      // 4. Student completes Practical Lab with 100% passing score
      const labAttempt = {
        _id: "lab_civil_01",
        owner: studentId,
        labId: "civil-lab-beam-bending",
        status: "submitted",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        skillsEvaluated: ["Structural Analysis"],
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation((model) => {
        if (model.modelName === "AssessmentAttempt") return Promise.resolve([initialAssessment]);
        if (model.modelName === "PracticalLabAttempt") return Promise.resolve([labAttempt]);
        return Promise.resolve([]);
      });

      PracticalLabAttempt.find = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            lean: vi.fn().mockResolvedValue([labAttempt]),
          }),
        }),
      });

      // 5. Updated evidence reflects new practical lab attempt
      const normalizedAfter = await evidenceNormalizationService.getNormalizedStudentEvidence(studentId);
      const skillAfter = normalizedAfter.normalizedBySkill["Structural Analysis"];
      expect(skillAfter.latestEvidence.sourceType).toBe("practical_lab");
      expect(skillAfter.latestScore).toBe(100);
      expect(skillAfter.hasPassed).toBe(true);

      // 6. Smart Mentor context acknowledges the practical lab achievement
      const mentorContext = await smartMentorContextService.getUnifiedUserContext(studentId, { forceRefresh: true });
      expect(mentorContext.practicalLabs.passedCount).toBe(1);
      expect(mentorContext.insights.some((i) => i.includes("Practical Labs"))).toBe(true);
    });

    // -----------------------------------------------------------------------
    // SCENARIO B: Student with Insufficient Evidence
    // -----------------------------------------------------------------------
    it("Scenario B: Unassessed skills are not penalized as 0% failure", async () => {
      const studentId = "student_scenario_b_002";
      const user = {
        _id: studentId,
        academicBranch: "ece",
        branch: "ece",
        targetRole: "Embedded Hardware Engineer",
      };

      // Empty evidence profile
      vi.spyOn(evidenceNormalizationService, "safeFind").mockResolvedValue([]);

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(studentId);
      expect(normalized.rawCount).toBe(0);

      const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(user, normalized);
      expect(diagnosis.unassessedCount).toBeGreaterThan(0);

      // Verify unassessed skill has latestScore === null (NOT 0) and status === "unassessed"
      const unassessedItem = diagnosis.diagnosedSkills.find((s) => s.currentStatus === "unassessed");
      expect(unassessedItem).toBeDefined();
      expect(unassessedItem.latestScore).toBeNull();
      expect(unassessedItem.currentStatus).toBe("unassessed");
      expect(unassessedItem.recommendedActionCategory).toBe("diagnostic_assessment");

      // Cycle stage advises diagnostic assessment, not remediation
      const cycleStage = adaptiveLearningPathwayService.determineCycleStage(normalized, diagnosis);
      expect(cycleStage).toBe("ASSESS");
    });

    // -----------------------------------------------------------------------
    // SCENARIO C: Student Demonstrates Measurable Improvement Delta
    // -----------------------------------------------------------------------
    it("Scenario C: Reassessment delta is correctly calculated without rewriting history", async () => {
      const studentId = "student_scenario_c_003";

      const attempt1 = {
        _id: "attempt_hist_1",
        owner: studentId,
        labId: "biotech-lab-pcr-primer",
        status: "submitted",
        serverScore: 50,
        maxScore: 100,
        percentage: 50,
        isPassing: false,
        skillsEvaluated: ["Molecular Biology"],
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
      };

      const attempt2 = {
        _id: "attempt_hist_2",
        owner: studentId,
        labId: "biotech-lab-pcr-primer",
        status: "submitted",
        serverScore: 100,
        maxScore: 100,
        percentage: 100,
        isPassing: true,
        skillsEvaluated: ["Molecular Biology"],
        submittedAt: new Date().toISOString(),
      };

      vi.spyOn(evidenceNormalizationService, "safeFind").mockImplementation((model) => {
        if (model.modelName === "PracticalLabAttempt") return Promise.resolve([attempt2, attempt1]);
        return Promise.resolve([]);
      });

      const normalized = await evidenceNormalizationService.getNormalizedStudentEvidence(studentId);
      const skillData = normalized.normalizedBySkill["Molecular Biology"];

      expect(skillData.history.length).toBe(2);
      expect(skillData.latestScore).toBe(100);
      expect(skillData.previousScore).toBe(50);
      expect(skillData.scoreDelta).toBe(50); // +50% improvement!

      // Progression evaluator confirms positive empirical progression
      const progression = adaptiveLearningPathwayService.evaluateMasteryProgression(normalized);
      expect(progression.hasDemonstratedImprovement).toBe(true);
      expect(progression.comparisons[0].scoreDelta).toBe(50);
      expect(progression.comparisons[0].isComparable).toBe(true);
      expect(progression.comparisons[0].interpretation).toContain("Demonstrated measurable knowledge improvement");
    });

    // -----------------------------------------------------------------------
    // SCENARIO D: Multi-Branch Discipline Coverage (All 10 Families)
    // -----------------------------------------------------------------------
    it("Scenario D: All 10 canonical discipline families have valid catalog activities and filters", async () => {
      const expectedBranches = [
        "cse",
        "mech",
        "ece",
        "civil",
        "chem",
        "biotech",
        "mba",
        "finance",
        "arts",
        "nursing",
      ];

      for (const branch of expectedBranches) {
        const { labs } = await practicalLabService.getLabCatalog({ branch });
        expect(labs.length).toBeGreaterThan(0);

        // Every lab for this branch belongs to the requested discipline
        labs.forEach((lab) => {
          const branches = (lab.canonicalDisciplines || lab.branchSlugs || []).map((b) => b.toLowerCase());
          expect(branches).toContain(branch);
          expect(lab.title).toBeDefined();
          expect(lab.tasks.length).toBeGreaterThan(0);
        });
      }
    });

    // -----------------------------------------------------------------------
    // SCENARIO E: Ownership, Authorization & Data Integrity
    // -----------------------------------------------------------------------
    it("Scenario E.1: Cross-student attempt access is strictly rejected with 403 Forbidden", async () => {
      const studentA = "student_authorized_owner";
      const studentB = "student_attacker_unauthorized";
      const mockAttemptId = "attempt_secret_999";

      const attemptInDb = {
        _id: mockAttemptId,
        owner: studentA,
        labId: "cse-lab-algo-complexity",
        percentage: 100,
      };

      // Mock DB findById
      const mockFindById = vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(attemptInDb),
      });

      const { PracticalLabAttempt } = await import("../src/modules/academic/models/practicalLabAttempt.models.js");
      PracticalLabAttempt.findById = mockFindById;

      // Student A can access their own attempt
      const authorizedAttempt = await practicalLabService.getAttemptById(studentA, mockAttemptId);
      expect(authorizedAttempt._id).toBe(mockAttemptId);

      // Student B attempting to access Student A's attempt throws 403
      await expect(practicalLabService.getAttemptById(studentB, mockAttemptId)).rejects.toThrowError(
        "You are not authorized to view this lab attempt."
      );
    });

    it("Scenario E.2: Client-side catalog sanitization strips accepted answers and tolerances", () => {
      const originalLab = PRACTICAL_LAB_CATALOG[0];
      expect(originalLab.tasks[0].acceptedAnswer).toBeDefined();

      const sanitized = sanitizeLabForClient(originalLab);
      sanitized.tasks.forEach((task) => {
        expect(task.acceptedAnswer).toBeUndefined();
        expect(task.correctOptionId).toBeUndefined();
        expect(task.tolerance).toBeUndefined();
      });
    });

    it("Scenario E.3: Server grading ignores client-supplied scores and computes authoritatively", async () => {
      const studentId = "student_authoritative_grader";
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-gear-ratio");

      // Client attempts to cheat by passing pre-computed high score or fake results
      const submissionPayload = {
        submittedAnswers: [
          { taskId: lab.tasks[0].taskId, value: "12.0" }, // Correct: 50 pts
          { taskId: lab.tasks[1].taskId, value: "99999" }, // Incorrect: 0 pts
        ],
        clientClaimedScore: 100, // Should be ignored
        isPassing: true, // Should be ignored
      };

      const result = await practicalLabService.submitLabAttempt(studentId, lab.labId, submissionPayload);
      // Expected server evaluation: 50 / 100 = 50%, isPassing = false
      expect(result.serverScore).toBe(50);
      expect(result.maxScore).toBe(100);
      expect(result.percentage).toBe(50);
      expect(result.isPassing).toBe(false);
      expect(result.masteryLevel).toBe("Needs Remediation");
    });

    it("Scenario E.4: Non-existent lab submission throws 404", async () => {
      await expect(
        practicalLabService.submitLabAttempt("user_123", "non-existent-lab-404", { submittedAnswers: [] })
      ).rejects.toThrowError("not found");
    });
  });
});
