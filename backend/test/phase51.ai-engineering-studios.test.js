import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../src/app.js";
import { CANONICAL_TOOL_REGISTRY, TOOL_REGISTRY_MAP } from "../src/modules/tools/constants/toolRegistry.js";
import {
  executeTool,
  executeMechanicalCalc,
  executeEceCircuits,
  executeCivilBoq,
  executeChemicalProcess,
  verifyEngineeringAiOutput,
  buildSharedEngineeringReport,
} from "../src/modules/tools/services/toolExecution.service.js";
import { ToolActivityRecord } from "../src/modules/tools/models/toolActivityRecord.models.js";

// Mock analytics to prevent Mongoose connection buffering timeouts
vi.mock("../src/core/database/models/analytics.models.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    incrementDailyCounter: vi.fn(),
    logApiHit: vi.fn(),
  };
});

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

// Mock Firebase token verification for testing
vi.mock("../src/core/auth/auth.middleware.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    verifyFirebaseToken: (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer test-token-")) {
        const role = authHeader.replace("Bearer test-token-", "");
        req.user = {
          _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00001"),
          email: "student.engineer@test.com",
          name: "Test Student Engineer",
          role: role || "student",
          academic: { branch: "mechanical", semester: 6 },
        };
        return next();
      }
      if (authHeader === "Bearer unauthorized-user-token") {
        req.user = {
          _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00099"),
          email: "other.student@test.com",
          name: "Other Student",
          role: "student",
          academic: { branch: "computer_science", semester: 4 },
        };
        return next();
      }
      return res.status(401).json({ success: false, message: "Unauthorized" });
    },
    optionalFirebaseToken: (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer test-token-")) {
        req.user = {
          _id: new mongoose.Types.ObjectId("64b8f0f0f0f0f0f0f0f00001"),
          email: "student.engineer@test.com",
          name: "Test Student Engineer",
          role: "student",
          academic: { branch: "mechanical", semester: 6 },
        };
      }
      next();
    },
  };
});

describe("Phase 51: Branch-Specific AI Engineering Studios Test Suite", () => {

  // ==========================================================================
  // GROUP 1: Canonical Registry Upgrades & Studio Metadata
  // ==========================================================================
  describe("Group 1: Canonical Tool Registry Upgrades (v2.0.0)", () => {
    const studioToolIds = ["mech-calc", "ece-circuits", "civil-boq", "chem-process"];

    it("1.1 Upgrades all 4 engineering workspaces to v2.0.0 with hybrid AI execution mode", () => {
      for (const id of studioToolIds) {
        const tool = TOOL_REGISTRY_MAP.get(id);
        expect(tool).toBeDefined();
        expect(tool.version).toBe("2.0.0");
        expect(tool.executionMode).toBe("hybrid_ai_deterministic");
        expect(tool.outputFormat).toBe("ai_assisted_engineering_study_report");
        expect(tool.status).toBe("operational");
      }
    });

    it("1.2 Validates that all 4 studios specify problemStatement and enableAiInterpretation in supportedInputs", () => {
      for (const id of studioToolIds) {
        const tool = TOOL_REGISTRY_MAP.get(id);
        const inputNames = tool.supportedInputs.map((i) => i.name);
        expect(inputNames).toContain("problemStatement");
        expect(inputNames).toContain("enableAiInterpretation");
      }
    });

    it("1.3 Ensures safety disclaimers and explicit limitations are registered for all studios", () => {
      for (const id of studioToolIds) {
        const tool = TOOL_REGISTRY_MAP.get(id);
        expect(tool.safetyDisclaimers).toBeTruthy();
        expect(tool.safetyDisclaimers.toUpperCase()).toContain("EDUCATIONAL");
        expect(Array.isArray(tool.limitations)).toBe(true);
        expect(tool.limitations.length).toBeGreaterThan(0);
      }
    });
  });

  // ==========================================================================
  // GROUP 2: Mechanical Engineering AI Studio
  // ==========================================================================
  describe("Group 2: Mechanical Engineering AI Studio Engine", () => {
    it("2.1 Deterministically computes stress, strain, FoS, and beam bending without AI", () => {
      const stressResult = executeMechanicalCalc({
        calculationType: "stress_strain",
        forceN: 60000,
        areaMm2: 300,
        originalLengthMm: 1200,
        changeInLengthMm: 1.2,
      });
      expect(stressResult.results.stressMpa).toBe(200);
      expect(stressResult.results.strain).toBe(0.001);
      expect(stressResult.results.youngsModulusGpa).toBe(200);

      const beamResult = executeMechanicalCalc({
        calculationType: "beam_bending",
        bendingMomentNm: 1000,
        distanceFromNeutralAxisMm: 40,
        momentOfInertiaMm4: 1000000,
      });
      expect(beamResult.results.bendingStressMpa).toBe(40);
    });

    it("2.2 Executes full AI Studio workflow with verification pass and report draft", async () => {
      const output = await executeTool("mech-calc", {
        calculationType: "stress_strain",
        forceN: 50000,
        areaMm2: 250,
        problemStatement: "Mild steel tie rod subjected to 50 kN axial tensile load in crane truss.",
        enableAiInterpretation: true,
      });

      expect(output.toolId).toBe("mech-calc");
      expect(output.executionMode).toBe("hybrid_ai_deterministic");
      expect(output.resultData.results.stressMpa).toBe(200);

      // AI interpretation assertions
      const interpretation = output.resultData.aiInterpretation;
      expect(interpretation).toBeDefined();
      expect(interpretation.problemSummary).toContain("Mild steel tie rod");
      expect(interpretation.applicableTheory).toContain("Hooke's Law");
      expect(Array.isArray(interpretation.assumptionsAndIdealizations)).toBe(true);
      expect(Array.isArray(interpretation.missingInputsChecklist)).toBe(true);

      // Numerical verification pass
      const verification = output.resultData.verification;
      expect(verification).toBeDefined();
      expect(verification.status).toBe("VERIFIED_DETERMINISTIC");
      expect(verification.isAuthoritativeMathGuaranteed).toBe(true);
      expect(verification.verifiedClaimsCount).toBeGreaterThan(0);

      // Report draft assertions
      const draft = output.resultData.reportDraft;
      expect(draft).toBeDefined();
      expect(draft.discipline).toBe("Mechanical Engineering");
      expect(draft.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
      expect(draft.learningPathwayLinks.some((l) => l.id === "mech-lab-stress-strain")).toBe(true);
    }, 25000);
  });

  // ==========================================================================
  // GROUP 3: ECE/EEE Circuit AI Studio
  // ==========================================================================
  describe("Group 3: ECE/EEE Circuit AI Studio Engine", () => {
    it("3.1 Deterministically solves Ohm's Law and dissipated power", () => {
      const ohmResult = executeEceCircuits({
        analysisType: "ohms_law",
        voltageV: 12,
        resistanceOhms: 240,
      });
      expect(ohmResult.results.voltageV).toBe(12);
      expect(ohmResult.results.currentA).toBe(0.05);
      expect(ohmResult.results.resistanceOhms).toBe(240);
      expect(ohmResult.results.dissipatedPowerW).toBe(0.6);
      expect(ohmResult.formulaUsed).toContain("V = I * R");
    });

    it("3.2 Solves voltage divider and provides real-world breadboard discrepancy troubleshooting", async () => {
      const output = await executeTool("ece-circuits", {
        analysisType: "voltage_divider",
        sourceVoltageV: 10,
        resistors: "1000, 2000",
        problemStatement: "Breadboard voltage divider testing with 10V DC supply and DMM loading.",
        enableAiInterpretation: true,
      });

      expect(output.resultData.results.voltageAcrossR2_V).toBe(6.6667);
      expect(output.resultData.verification.status).toBe("VERIFIED_DETERMINISTIC");

      const interpretation = output.resultData.aiInterpretation;
      expect(interpretation.troubleshootingAdvice).toBeDefined();
      expect(interpretation.troubleshootingAdvice.length).toBeGreaterThan(0);
      expect(interpretation.missingInputsChecklist.some((m) => m.item.includes("Tolerance"))).toBe(true);
      expect(output.resultData.reportDraft.learningPathwayLinks.some((l) => l.id === "ece-lab-circuit-thevenin")).toBe(
        true
      );
    });
  });

  // ==========================================================================
  // GROUP 4: Civil Engineering AI Studio
  // ==========================================================================
  describe("Group 4: Civil Engineering AI Studio Engine", () => {
    it("4.1 Deterministically estimates concrete volume, dry volume factor, and cement bags", () => {
      const boq = executeCivilBoq({
        estimationType: "concrete_slab",
        lengthM: 5,
        widthM: 4,
        thicknessM: 0.15,
        mixRatio: "1:1.5:3",
        dryVolumeFactor: 1.54,
        wastagePercent: 5,
      });

      // Wet volume = 5 * 4 * 0.15 = 3.0 m3
      expect(boq.results.wetVolumeM3).toBe(3.0);
      // Dry volume = 3.0 * 1.54 * 1.05 = 4.851 m3
      expect(boq.results.dryVolumeM3).toBe(4.851);
      expect(boq.results.cementBags).toBeGreaterThan(0);
      expect(Array.isArray(boq.billOfQuantities)).toBe(true);
    });

    it("4.2 Generates BOQ draft report highlighting scope exclusions (rebar, formwork, labor)", async () => {
      const output = await executeTool("civil-boq", {
        estimationType: "concrete_slab",
        lengthM: 6,
        widthM: 4,
        thicknessM: 0.12,
        problemStatement: "Ground floor slab quantity estimation for residential dwelling unit.",
        enableAiInterpretation: true,
      });

      expect(output.resultData.verification.status).toBe("VERIFIED_DETERMINISTIC");
      const interpretation = output.resultData.aiInterpretation;
      expect(interpretation.limitationsAndCaveats.some((l) => l.toLowerCase().includes("rebar"))).toBe(true);
      expect(interpretation.limitationsAndCaveats.some((l) => l.toLowerCase().includes("shuttering"))).toBe(true);
      expect(output.resultData.reportDraft.learningPathwayLinks.some((l) => l.id === "civil-lab-concrete-mix")).toBe(
        true
      );
    });
  });

  // ==========================================================================
  // GROUP 5: Chemical Engineering AI Studio
  // ==========================================================================
  describe("Group 5: Chemical Engineering AI Studio Engine", () => {
    it("5.1 Solves binary distillation mass balance and verifies 100% mass conservation", () => {
      const balance = executeChemicalProcess({
        calculationType: "binary_distillation_balance",
        feedRateKgH: 1000,
        feedCompositionX: 0.4,
        distillateCompositionX: 0.9,
        bottomsCompositionX: 0.05,
      });

      expect(balance.results.distillateRateKgH).toBe(411.765);
      expect(balance.results.bottomsRateKgH).toBe(588.235);
      expect(balance.results.overallBalanceCheck).toContain("VERIFIED");
    });

    it("5.2 Solves conversion-concentration workflow deterministically", () => {
      const conv = executeChemicalProcess({
        calculationType: "conversion_concentration",
        initialConcentrationMolar: 2.0,
        targetConversion: 0.75,
      });

      expect(conv.results.initialConcentrationMolar).toBe(2.0);
      expect(conv.results.unreactedConcentrationMolar).toBe(0.5);
      expect(conv.results.reactedConcentrationMolar).toBe(1.5);
    });

    it("5.3 Generates Chemical AI Studio report highlighting VLE non-ideality and safety boundaries", async () => {
      const output = await executeTool("chem-process", {
        calculationType: "ideal_cstr_kinetics",
        feedRateKgH: 100,
        targetConversion: 0.8,
        reactionRateConstant: 0.2,
        problemStatement: "Continuous stirred-tank reactor sizing for first-order liquid phase isomerism.",
        enableAiInterpretation: true,
      });

      expect(output.resultData.verification.status).toBe("VERIFIED_DETERMINISTIC");
      const draft = output.resultData.reportDraft;
      expect(draft.discipline).toBe("Chemical Engineering");
      expect(draft.missingInputsChecklist.some((m) => m.item.includes("Reaction Enthalpy"))).toBe(true);
      expect(draft.learningPathwayLinks.some((l) => l.id === "chem-lab-cstir-reactor")).toBe(true);
    });
  });

  // ==========================================================================
  // GROUP 6: Shared Verification & Engineering Report Builder
  // ==========================================================================
  describe("Group 6: Verification & Report Builder Infrastructure", () => {
    it("6.1 verifyEngineeringAiOutput correctly tags numerical claims and assumptions", () => {
      const mockCalc = {
        inputs: { forceN: 10000, areaMm2: 100 },
        results: { stressMpa: 100 },
      };
      const mockAi = {
        assumptionsAndIdealizations: ["Linear elastic material behavior"],
        limitationsAndCaveats: ["No stress concentration factor modeled"],
        provenance: "offline_expert_heuristics",
      };

      const verification = verifyEngineeringAiOutput(mockCalc, mockAi);
      expect(verification.status).toBe("VERIFIED_DETERMINISTIC");
      expect(verification.isAuthoritativeMathGuaranteed).toBe(true);
      expect(verification.verifiedClaims.some((c) => c.status === "VERIFIED_DETERMINISTIC")).toBe(true);
      expect(verification.verifiedClaims.some((c) => c.status === "USER_PROVIDED")).toBe(true);
      expect(verification.unverifiedClaims.some((c) => c.status === "THEORETICAL_MODEL_ASSUMPTION")).toBe(true);
    });

    it("6.2 buildSharedEngineeringReport builds comprehensive draft report structure", () => {
      const report = buildSharedEngineeringReport({
        toolId: "mech-calc",
        displayName: "Mechanical Engineering AI Studio",
        academicDiscipline: "Mechanical Engineering",
        inputs: { problemStatement: "Test shaft torsional review", forceN: 5000 },
        calcResults: {
          formulaUsed: "σ = F / A",
          inputs: { forceN: 5000 },
          results: { stressMpa: 50 },
          calculationSteps: ["Step 1", "Step 2"],
          assumptions: ["Standard static"],
        },
        aiInterpretation: {
          problemSummary: "Shaft under tension",
          applicableTheory: "Hooke's Law",
          assumptionsAndIdealizations: ["Homogeneous material"],
          limitationsAndCaveats: ["No Kt"],
          missingInputsChecklist: [{ item: "Yield strength", importance: "CRITICAL", explanation: "For FoS" }],
          learningPathwayLinks: [{ id: "mech-lab-stress-strain", title: "Tensile Lab", type: "PRACTICAL_LAB", route: "/labs" }],
        },
        verification: { status: "VERIFIED_DETERMINISTIC", summary: "Exact math verified" },
        user: { name: "Aarav Sharma" },
      });

      expect(report.reportId).toMatch(/^REP-MECH-CALC-/);
      expect(report.authorName).toBe("Aarav Sharma");
      expect(report.title).toContain("Test shaft torsional review");
      expect(report.isStudentDraft).toBe(true);
      expect(report.verificationStatus).toBe("VERIFIED_DETERMINISTIC");
    });
  });

  // ==========================================================================
  // GROUP 7: Express HTTP Endpoints & Report Draft Updating
  // ==========================================================================
  describe("Group 7: Express HTTP API Endpoints", () => {
    it("7.1 POST /api/v1/tools/:toolId/execute returns reportDraft and verification on success", async () => {
      const res = await request(app)
        .post("/api/v1/tools/mech-calc/execute")
        .set("Authorization", "Bearer test-token-student")
        .send({
          calculationType: "stress_strain",
          forceN: 40000,
          areaMm2: 200,
          problemStatement: "Cantilever anchor pin axial tensile check.",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.resultData.reportDraft).toBeDefined();
      expect(res.body.data.resultData.verification.status).toBe("VERIFIED_DETERMINISTIC");
      expect(res.body.data.activityRecordId).toBeTruthy();
    }, 25000);

    it("7.2 PUT /api/v1/tools/history/:recordId/report updates student report draft with ownership check", async () => {
      // 1. Create activity record
      const postRes = await request(app)
        .post("/api/v1/tools/ece-circuits/execute")
        .set("Authorization", "Bearer test-token-student")
        .send({
          analysisType: "voltage_divider",
          sourceVoltageV: 12,
          resistors: "100, 200",
          problemStatement: "Voltage divider experiment initial draft.",
        });

      expect(postRes.status).toBe(200);
      const recordId = postRes.body.data.activityRecordId;
      expect(recordId).toBeTruthy();

      // 2. Student edits report draft
      const updateRes = await request(app)
        .put(`/api/v1/tools/history/${recordId}/report`)
        .set("Authorization", "Bearer test-token-student")
        .send({
          reportDraft: {
            title: "Customized Laboratory Study: Breadboard Divider",
            objective: "Empirically cross-check 12V divider against DMM input impedance loading.",
            engineeringDiscussion: "Observed voltage matched within 1.2% of calculated ideal potential.",
            studentNotes: "Bench 4, verified with Keithley 2100 DMM.",
          },
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.reportDraft.title).toBe("Customized Laboratory Study: Breadboard Divider");
      expect(updateRes.body.data.reportDraft.studentNotes).toBe("Bench 4, verified with Keithley 2100 DMM.");
      expect(updateRes.body.data.reportDraft.lastEditedAt).toBeTruthy();
    }, 25000);

    it("7.3 PUT /api/v1/tools/history/:recordId/report rejects unauthorized user update", async () => {
      // 1. Create record as student 1
      const postRes = await request(app)
        .post("/api/v1/tools/mech-calc/execute")
        .set("Authorization", "Bearer test-token-student")
        .send({
          calculationType: "factor_of_safety",
          yieldStrengthMpa: 350,
          appliedStressMpa: 175,
        });

      expect(postRes.status).toBe(200);
      const recordId = postRes.body.data.activityRecordId;
      expect(recordId).toBeTruthy();

      // 2. Attempt update as student 2 (unauthorized-user-token)
      const attackRes = await request(app)
        .put(`/api/v1/tools/history/${recordId}/report`)
        .set("Authorization", "Bearer unauthorized-user-token")
        .send({
          reportDraft: { title: "Malicious Tampered Title" },
        });

      expect(attackRes.status).toBe(404);
      const msg = attackRes.body?.message || attackRes.body?.error || attackRes.text || "";
      expect(msg).toContain("not found or access denied");
    }, 25000);

    it("7.4 POST /api/v1/tools/:toolId/execute respects enableAiInterpretation=false", async () => {
      const res = await request(app)
        .post("/api/v1/tools/mech-calc/execute")
        .send({
          calculationType: "stress_strain",
          forceN: 20000,
          areaMm2: 100,
          enableAiInterpretation: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.resultData.results.stressMpa).toBe(200);
      expect(res.body.data.resultData.aiInterpretation).toBeUndefined();
      expect(res.body.data.resultData.reportDraft).toBeUndefined();
    });
  });
});
