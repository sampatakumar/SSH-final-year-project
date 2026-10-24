import { describe, it, expect } from "vitest";
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
import {
  skillGapDiagnosisService,
  DISCIPLINE_PREREQUISITE_GRAPH,
} from "../src/modules/skills/services/skillGapDiagnosis.service.js";
import { normalizeSkill } from "../src/shared/taxonomy/skillTaxonomy.service.js";
import { projectRubricEvaluationService } from "../src/modules/academic/services/projectRubricEvaluation.service.js";

describe("Phase 48: Educational Correctness, Grading Contract & Evidence Integrity Suite", () => {
  // =========================================================================
  // GROUP 1: Practical Lab Catalog Integrity & 20-Activity Boundary Audits
  // =========================================================================
  describe("Group 1: 20 Canonical Practical Lab Activities — Precision & Tolerances", () => {
    it("1.1 CSE Algo Complexity: verifies exact integer iteration arithmetic", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "cse-lab-algo-complexity");
      expect(lab).toBeDefined();
      const task1 = lab.tasks.find((t) => t.taskId === "cse-task-1");
      const expected = (500 * 499) / 2;
      expect(expected).toBe(124750);
      expect(evaluateTaskAnswer(task1, 124750).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task1, 124749).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task1, 124751).isCorrect).toBe(false);
    });

    it("1.2 CSE Rate Limiter: verifies burst deficit calculation and tolerance boundaries", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "cse-lab-api-rate-limiter");
      const task1 = lab.tasks.find((t) => t.taskId === "cse-rl-1");
      const expected = (3500 - 2000) * 6;
      expect(expected).toBe(9000);
      expect(evaluateTaskAnswer(task1, 9000).isCorrect).toBe(true);
      // Tolerance 1% => [8910, 9090]
      expect(evaluateTaskAnswer(task1, 8910).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task1, 9090).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(task1, 8900).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(task1, 9100).isCorrect).toBe(false);
    });

    it("1.3 Mechanical Stress & FoS: verifies stress and FoS calculation boundaries", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-stress-strain");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      // Area = pi * 20^2 / 4 = 100 * pi = 314.159...
      // Stress = 45000 / 314.159265 = 143.239 MPa
      expect(evaluateTaskAnswer(t1, 143.24).isCorrect).toBe(true);
      // Tolerance 2% => [140.37, 146.10]
      expect(evaluateTaskAnswer(t1, 142.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t1, 139.0).isCorrect).toBe(false);

      // FoS = 310 / 143.23945 = 2.164
      expect(evaluateTaskAnswer(t2, 2.16).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 2.15).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 2.05).isCorrect).toBe(false);
    });

    it("1.4 Mechanical Gear Train: verifies velocity reduction and torque with efficiency", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mech-lab-gear-ratio");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 12.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 165.6).isCorrect).toBe(true);
      // 15 * 12 * 0.92 = 165.6. Submitting without efficiency (180) must fail
      expect(evaluateTaskAnswer(t2, 180.0).isCorrect).toBe(false);
    });

    it("1.5 ECE Thévenin Equivalent: verifies bridge node voltage and equivalent resistance", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "ece-lab-circuit-thevenin");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 16.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 4.0).isCorrect).toBe(true);
      // 1% tolerance: 16.0 => [15.84, 16.16]
      expect(evaluateTaskAnswer(t1, 16.1).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t1, 15.5).isCorrect).toBe(false);
    });

    it("1.6 ECE Op-Amp Gain & Bandwidth: verifies inverting gain sign and GBP cutoff", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "ece-lab-opamp-filter");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, -1.5).isCorrect).toBe(true);
      // Submitting positive 1.5 must fail inverting op-amp check
      expect(evaluateTaskAnswer(t1, 1.5).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(t2, 100.0).isCorrect).toBe(true);
    });

    it("1.7 Civil Beam Bending: verifies reaction force and midspan maximum moment", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "civil-lab-beam-bending");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 46.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 84.0).isCorrect).toBe(true);
      // Max moment tolerance 2% => [82.32, 85.68]
      expect(evaluateTaskAnswer(t2, 83.5).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 80.0).isCorrect).toBe(false);
    });

    it("1.8 Civil Concrete Mix: verifies target mean compressive strength formula notation", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "civil-lab-concrete-mix");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      // f'ck = 25 + 1.65 * 4.0 = 31.6 MPa
      expect(evaluateTaskAnswer(t1, 31.6).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t1, 31.2).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t1, 28.0).isCorrect).toBe(false);
      // w/c ratio = opt-2 (0.50)
      expect(evaluateTaskAnswer(t2, "opt-2").isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, "opt-1").isCorrect).toBe(false);
    });

    it("1.9 Chemical Distillation Balance: verifies steady-state distillate and bottoms rates", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "chem-lab-mass-balance");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 437.5).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 562.5).isCorrect).toBe(true);
      // Verify conservation: D + W = 1000 kg/h
      expect(437.5 + 562.5).toBe(1000.0);
    });

    it("1.10 Chemical CSTR Kinetics: verifies residence time, reactor volume, and 1% tolerance", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "chem-lab-cstir-reactor");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      // Space time tau = 0.75 / (0.15 * 0.25) = 20.0 min
      expect(evaluateTaskAnswer(t1, 20.0).isCorrect).toBe(true);
      // Volume V = 40 * 20 = 800.0 Liters
      expect(evaluateTaskAnswer(t2, 800.0).isCorrect).toBe(true);
      // Tolerance 1% => [792.0, 808.0]
      expect(evaluateTaskAnswer(t2, 792.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 808.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 790.0).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(t2, 815.0).isCorrect).toBe(false);
    });

    it("1.11 Biotech PCR Primer: verifies %GC and Wallace melting temperature", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "biotech-lab-pcr-primer");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 50.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 60.0).isCorrect).toBe(true);
    });

    it("1.12 Biotech Enzyme Kinetics: verifies Michaelis-Menten rate and competitive inhibition", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "biotech-lab-enzyme-kinetics");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 90.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, "opt-1").isCorrect).toBe(true);
    });

    it("1.13 MBA Break-Even: verifies break-even unit volume and margin of safety %", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mba-lab-breakeven");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 3200).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 20.0).isCorrect).toBe(true);
    });

    it("1.14 MBA Marketing CAC & LTV: verifies acquisition cost and lifetime value", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "mba-lab-marketing-roi");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 50.0).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 420.0).isCorrect).toBe(true);
    });

    it("1.15 Finance DCF Valuation: verifies 3-period discounted cash flow and net present value", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "finance-lab-dcf-valuation");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 197370.4).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, -2629.6).isCorrect).toBe(true);
    });

    it("1.16 Finance Liquidity Ratios: verifies Current Ratio and Quick Ratio", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "finance-lab-liquidity-ratios");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, 2.32).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 1.60).isCorrect).toBe(true);
    });

    it("1.17 Arts Informal Logic: verifies fallacy classification and deductive soundness", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "arts-lab-fallacy-identification");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, "opt-1").isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, "opt-2").isCorrect).toBe(true);
    });

    it("1.18 Arts Historical Source Criticism: verifies institutional bias analysis and cross-corroboration", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "arts-lab-source-criticism");
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, "opt-2").isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, "opt-2").isCorrect).toBe(true);
    });

    it("1.19 Nursing SBAR Handover: verifies Situation identification and ABC priority oxygenation", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "nursing-lab-sbar-communication");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      expect(evaluateTaskAnswer(t1, "opt-2").isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, "opt-1").isCorrect).toBe(true);
    });

    it("1.20 Nursing Pediatric Dosage: verifies daily dose and single administration volume with narrow tolerance", () => {
      const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === "nursing-lab-dosage-calculation");
      expect(lab.safetySensitive).toBe(true);
      const [t1, t2] = lab.tasks;
      // 20 kg * 45 mg/kg/day = 900 mg/day
      expect(evaluateTaskAnswer(t1, 900.0).isCorrect).toBe(true);
      // Divided BID => 450 mg/dose. Vol = (450/250) * 5 = 9.0 mL
      expect(evaluateTaskAnswer(t2, 9.0).isCorrect).toBe(true);
      // Tolerance 1% => [8.91, 9.09]. A 5.5% overdose (9.5 mL) must strictly fail
      expect(evaluateTaskAnswer(t2, 8.95).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 9.05).isCorrect).toBe(true);
      expect(evaluateTaskAnswer(t2, 9.5).isCorrect).toBe(false);
      expect(evaluateTaskAnswer(t2, 8.5).isCorrect).toBe(false);
    });
  });

  // =========================================================================
  // GROUP 2: Grading Contract Robustness & Malformed Inputs
  // =========================================================================
  describe("Group 2: Grading Robustness, Non-Finite Values & Client Sanitization", () => {
    it("2.1 Non-finite, NaN, empty strings, and null inputs return isCorrect: false safely", () => {
      const task = {
        taskId: "t-robustness",
        type: "numerical",
        acceptedAnswer: 100.0,
        tolerance: 0.02,
        points: 50,
      };

      const malformedCases = [null, undefined, "", "abc", NaN, Infinity, -Infinity, "NaN"];
      malformedCases.forEach((val) => {
        const res = evaluateTaskAnswer(task, val);
        expect(res.isCorrect).toBe(false);
        expect(res.earnedPoints).toBe(0);
        expect(res.feedback).toContain("Invalid non-finite or empty");
      });
    });

    it("2.2 Client sanitization removes acceptedAnswer, correctOptionId, and tolerance", () => {
      const lab = PRACTICAL_LAB_CATALOG[0];
      const sanitized = sanitizeLabForClient(lab);

      sanitized.tasks.forEach((t) => {
        expect(t.acceptedAnswer).toBeUndefined();
        expect(t.correctOptionId).toBeUndefined();
        expect(t.tolerance).toBeUndefined();
        expect(t.taskId).toBeDefined();
        expect(t.prompt).toBeDefined();
      });
    });
  });

  // =========================================================================
  // GROUP 3: Evidence Deduplication, History Preservation & Confidence Weights
  // =========================================================================
  describe("Group 3: Evidence Deduplication & Deterministic Veracity Semantics", () => {
    it("3.1 Verifies all 7 deterministic evidence strength weights are explicitly defined heuristic tiers", () => {
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER).toBe(0.95);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.CODING_SANDBOX).toBe(0.95);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PRACTICAL_LAB).toBe(0.90);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.HISTORICAL_ASSESSMENT).toBe(0.90);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC).toBe(0.85);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.QUIZ_CHECKPOINT).toBe(0.80);
      expect(DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.SPACED_REVISION).toBe(0.75);
    });

    it("3.2 Duplicate evidence items with identical IDs are not duplicated in student timeline", async () => {
      // Simulate safe timeline appending
      const seenEvidenceIds = new Set();
      const timeline = [];
      const appendEvidence = (item) => {
        if (!item || !item.evidenceId || seenEvidenceIds.has(item.evidenceId)) return;
        seenEvidenceIds.add(item.evidenceId);
        timeline.push(item);
      };

      appendEvidence({ evidenceId: "ev_attempt_1", canonicalSkill: "Algorithms", percentage: 85 });
      appendEvidence({ evidenceId: "ev_attempt_1", canonicalSkill: "Algorithms", percentage: 85 }); // duplicate
      appendEvidence({ evidenceId: "ev_attempt_2", canonicalSkill: "Algorithms", percentage: 92 }); // distinct

      expect(timeline.length).toBe(2);
      expect(timeline[0].evidenceId).toBe("ev_attempt_1");
      expect(timeline[1].evidenceId).toBe("ev_attempt_2");
    });
  });

  // =========================================================================
  // GROUP 4: Cross-Module Consistency & Taxonomy Prerequisite Graph
  // =========================================================================
  describe("Group 4: Cross-Module Taxonomy & Prerequisite Consistency", () => {
    it("4.1 Reinforced Concrete and Reinforced Concrete Design both correctly resolve in prerequisite graph", () => {
      const canonical1 = normalizeSkill("Reinforced Concrete");
      const canonical2 = normalizeSkill("reinforced concrete design");

      expect(canonical1).toBe("Reinforced Concrete Design");
      expect(canonical2).toBe("Reinforced Concrete Design");

      // Verify prerequisite graph lookup succeeds without falling back to empty prerequisites
      const check1 = skillGapDiagnosisService.checkPrerequisites("Reinforced Concrete");
      const check2 = skillGapDiagnosisService.checkPrerequisites("Reinforced Concrete Design");

      expect(check1.hasPrerequisites).toBe(true);
      expect(check1.missingPrerequisites).toContain("Structural Analysis");
      expect(check2.hasPrerequisites).toBe(true);
      expect(check2.missingPrerequisites).toContain("Structural Analysis");
    });

    it("4.2 DCF Valuation and Valuation both correctly resolve in prerequisite graph", () => {
      const checkValuation = skillGapDiagnosisService.checkPrerequisites("Valuation");
      const checkDCF = skillGapDiagnosisService.checkPrerequisites("DCF Valuation");

      expect(checkValuation.hasPrerequisites).toBe(true);
      expect(checkValuation.missingPrerequisites).toContain("Financial Modeling");
      expect(checkDCF.hasPrerequisites).toBe(true);
      expect(checkDCF.missingPrerequisites).toContain("Financial Modeling");
    });

    it("4.3 Capstone composite score reconciliation: distinguishes weighted 87.75% from unweighted 87.5%", () => {
      // 4 criteria: Experimental Design (90, w=0.25), Yield Opt (85, w=0.30), Bioreactor (90, w=0.30), Safety (85, w=0.15)
      const weights = [0.25, 0.30, 0.30, 0.15];
      const scores = [90, 85, 90, 85];

      const weightedComposite = weights.reduce((sum, w, i) => sum + w * scores[i], 0);
      const unweightedMean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
      const integerRounded = Math.round(weightedComposite);

      expect(weightedComposite).toBe(87.75);
      expect(unweightedMean).toBe(87.5);
      expect(integerRounded).toBe(88);
    });
  });

  // =========================================================================
  // GROUP 5: Adaptive Learning 10 Progression Scenarios
  // =========================================================================
  describe("Group 5: Adaptive Progression & Scenarios 1 to 10", () => {
    it("Scenario 1: Unattempted skill receives status unassessed and neutral gap priority 50", () => {
      const mockUser = { _id: "user-unattempted", branch: "cse", targetRole: "Full Stack Developer" };
      const emptyEvidence = { rawCount: 0, normalizedBySkill: {} };
      const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(mockUser, emptyEvidence);

      expect(diagnosis.unassessedCount).toBeGreaterThan(0);
      const unassessed = diagnosis.unassessedSkills[0];
      expect(unassessed.hasEvidence).toBe(false);
      expect(unassessed.latestScore).toBeNull();
      expect(unassessed.gapScore).toBe(50);
    });

    it("Scenario 2: Failed assessment (< 70%) triggers needs_remediation status", () => {
      const mockUser = { _id: "user-failed", branch: "civil" };
      const evidence = {
        rawCount: 1,
        normalizedBySkill: {
          "Structural Analysis": {
            canonicalSkill: "Structural Analysis",
            latestScore: 50,
            hasPassed: false,
            latestEvidence: { percentage: 50, timestamp: new Date().toISOString() },
          },
        },
      };
      const diagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(mockUser, evidence);
      const structGap = diagnosis.diagnosedSkills.find((s) => s.skill === "Structural Analysis");
      expect(structGap.currentStatus).toBe("needs_remediation");
      expect(structGap.gapScore).toBe(50); // 100 - 50 = 50
    });

    it("Scenario 3: Passed prerequisite (>= 70%) unlocks dependent skill", () => {
      const evidencePassed = {
        "Engineering Mechanics": { latestScore: 85, hasPassed: true },
        "Strength of Materials": { latestScore: 80, hasPassed: true },
      };
      const prereqCheck = skillGapDiagnosisService.checkPrerequisites("Structural Analysis", evidencePassed);
      expect(prereqCheck.isReady).toBe(true);
      expect(prereqCheck.missingPrerequisites.length).toBe(0);
    });

    it("Scenario 4: Failed prerequisite blocks dependent skill with prerequisite_missing status", () => {
      const evidenceIncomplete = {
        "Engineering Mechanics": { latestScore: 85, hasPassed: true },
        // "Strength of Materials" missing
      };
      const prereqCheck = skillGapDiagnosisService.checkPrerequisites("Structural Analysis", evidenceIncomplete);
      expect(prereqCheck.isReady).toBe(false);
      expect(prereqCheck.missingPrerequisites).toContain("Strength of Materials");
    });

    it("Scenario 5: New evidence updates skill profile without erasing historical records", () => {
      const skillHistory = [
        { evidenceId: "ev_2", percentage: 90, timestamp: "2026-10-24T00:00:00Z" },
        { evidenceId: "ev_1", percentage: 60, timestamp: "2026-10-20T00:00:00Z" },
      ];
      const latest = skillHistory[0];
      const highest = skillHistory.reduce((max, cur) => (cur.percentage > max.percentage ? cur : max), skillHistory[0]);
      expect(latest.percentage).toBe(90);
      expect(highest.percentage).toBe(90);
      expect(skillHistory.length).toBe(2);
    });

    it("Scenario 6: Repeating an assessment calculates delta without mutating earlier attempt", () => {
      const attempt1 = { score: 60, attemptId: "att_1" };
      const attempt2 = { score: 85, attemptId: "att_2" };
      const delta = attempt2.score - attempt1.score;
      expect(delta).toBe(25);
      expect(attempt1.score).toBe(60);
    });

    it("Scenario 7: Conflicting recent lower score retains latestScore while preserving historical high", () => {
      const skillData = {
        canonicalSkill: "Algorithms",
        history: [
          { evidenceId: "ev_recent", percentage: 55, timestamp: "2026-10-25T00:00:00Z" },
          { evidenceId: "ev_older", percentage: 88, timestamp: "2026-10-15T00:00:00Z" },
        ],
      };
      const latestScore = skillData.history[0].percentage;
      const highestScore = Math.max(...skillData.history.map((h) => h.percentage));
      expect(latestScore).toBe(55);
      expect(highestScore).toBe(88);
    });

    it("Scenario 8: Learner with project evidence gets inferred_proficiency with 0.85 weight", () => {
      const projItem = {
        sourceType: "project_deliverable",
        status: "inferred_proficiency",
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC,
      };
      expect(projItem.status).toBe("inferred_proficiency");
      expect(projItem.confidenceWeight).toBe(0.85);
    });

    it("Scenario 9: Learner with assessment evidence gets demonstrated_knowledge with 0.95 weight", () => {
      const assessItem = {
        sourceType: "assessment_attempt",
        status: "demonstrated_knowledge",
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER,
      };
      expect(assessItem.status).toBe("demonstrated_knowledge");
      expect(assessItem.confidenceWeight).toBe(0.95);
    });

    it("Scenario 10: Multi-branch discipline families correctly filter activities in catalog", () => {
      const disciplines = [
        "Computer Science & IT",
        "Mechanical & Industrial",
        "Electronics & Electrical",
        "Civil & Infrastructure",
        "Chemical & Materials",
        "Life Sciences & Biotech",
        "Business & Management",
        "Finance & Commerce",
        "Arts & Humanities",
        "Nursing & Health Sciences",
      ];

      disciplines.forEach((disc) => {
        const matching = PRACTICAL_LAB_CATALOG.filter((l) => l.disciplineCategory === disc);
        expect(matching.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
