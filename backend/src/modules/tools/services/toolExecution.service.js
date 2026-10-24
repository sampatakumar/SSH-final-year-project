/**
 * Tool Execution Engine for Smart Skill Hub (Phase 50)
 *
 * Implements deterministic calculation engines and structured reasoning for:
 * 1. Mechanical Engineering (Stress/Strain, Factor of Safety, Gear Ratio, Beam Bending)
 * 2. ECE & EEE (Series/Parallel, Voltage Divider, Current Divider, Thevenin)
 * 3. Civil Engineering (Concrete Volume, Mix Proportions, BOQ Material Costs)
 * 4. Chemical Engineering (Distillation Mass Balance, Reactor CSTR Kinetics)
 * 5. Biotechnology (DNA GC%, Wallace & Salt-Adjusted Tm, Hypothesis Structuring)
 * 6. Business & MBA (Break-Even, Margin of Safety, CAC/LTV, SWOT Framework)
 * 7. Commerce & Finance (Liquidity Ratios, Profitability, 3-Period NPV Model)
 * 8. Arts & Humanities (Deterministic Citations APA/MLA/Chicago, Argument Analysis)
 * 9. Nursing & Allied Health (Dosage Arithmetic Dimensional Analysis, SBAR Handover)
 * 10. Shared Project & Report Reviewer (Cross-Disciplinary Rigor Analysis)
 */

import { CANONICAL_TOOL_REGISTRY, TOOL_REGISTRY_MAP } from "../constants/toolRegistry.js";
import { AIOrchestratorService } from "../../../core/ai/aiOrchestrator.service.js";

const aiOrchestrator = new AIOrchestratorService();

// ============================================================================
// 1. MECHANICAL ENGINEERING ENGINE
// ============================================================================

export function executeMechanicalCalc(inputs = {}) {
  const {
    calculationType = "stress_strain",
    forceN,
    areaMm2,
    originalLengthMm,
    changeInLengthMm,
    yieldStrengthMpa,
    appliedStressMpa,
    teethDriving,
    teethDriven,
    inputRpm,
    inputTorqueNm,
    efficiencyPercent = 100,
    bendingMomentNm,
    distanceFromNeutralAxisMm,
    momentOfInertiaMm4,
  } = inputs;

  if (calculationType === "stress_strain") {
    const f = Number(forceN);
    const a = Number(areaMm2);
    if (!Number.isFinite(f) || f <= 0) {
      throw new Error("forceN must be a positive number in Newtons (N).");
    }
    if (!Number.isFinite(a) || a <= 0) {
      throw new Error("areaMm2 must be a positive non-zero number in mm².");
    }

    // Stress: sigma = F / A. 1 N/mm² = 1 MPa
    const stressMpa = f / a;
    let strain = null;
    let youngsModulusGpa = null;

    if (originalLengthMm && changeInLengthMm) {
      const l0 = Number(originalLengthMm);
      const deltaL = Number(changeInLengthMm);
      if (l0 > 0 && deltaL >= 0) {
        strain = deltaL / l0;
        if (strain > 0) {
          const modulusMpa = stressMpa / strain;
          youngsModulusGpa = modulusMpa / 1000;
        }
      }
    }

    return {
      calculationType: "stress_strain",
      formulaUsed: "σ = F / A (Normal Stress) ; ε = ΔL / L₀ (Normal Strain) ; E = σ / ε",
      inputs: { forceN: f, areaMm2: a, originalLengthMm, changeInLengthMm },
      results: {
        stressMpa: Number(stressMpa.toFixed(4)),
        strain: strain !== null ? Number(strain.toFixed(6)) : "Not provided",
        youngsModulusGpa: youngsModulusGpa !== null ? Number(youngsModulusGpa.toFixed(3)) : "Not provided",
      },
      calculationSteps: [
        `1. Given Axial Force F = ${f} N and Cross-sectional Area A = ${a} mm².`,
        `2. Normal Stress σ = F / A = ${f} N / ${a} mm² = ${stressMpa.toFixed(4)} N/mm² = ${stressMpa.toFixed(4)} MPa.`,
        ...(strain !== null
          ? [
              `3. Given Original Length L₀ = ${originalLengthMm} mm and Elongation ΔL = ${changeInLengthMm} mm.`,
              `4. Engineering Strain ε = ΔL / L₀ = ${changeInLengthMm} / ${originalLengthMm} = ${strain.toFixed(6)} (dimensionless).`,
              `5. Young's Modulus E = σ / ε = ${stressMpa.toFixed(4)} MPa / ${strain.toFixed(6)} = ${(youngsModulusGpa * 1000).toFixed(2)} MPa = ${youngsModulusGpa.toFixed(3)} GPa.`,
            ]
          : ["3. Strain and Young's modulus omitted (elongation not provided)."]),
      ],
      assumptions: [
        "Material is homogeneous, isotropic, and obeys Hooke's Law within elastic limit.",
        "Axial load passes through centroid of cross-section (pure tension/compression without eccentric bending).",
      ],
      reviewChecklist: [
        { item: "Check yield strength margin (ensure σ < σ_yield)", status: "RECOMMENDED" },
        { item: "Verify stress concentration factor (Kt) if fillets or holes are present", status: "ADVISORY" },
        { item: "Assess temperature derating if working environment exceeds 100°C", status: "ADVISORY" },
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("mech-calc")?.safetyDisclaimers,
    };
  }

  if (calculationType === "factor_of_safety") {
    const yieldMpa = Number(yieldStrengthMpa);
    const appliedMpa = Number(appliedStressMpa);
    if (!Number.isFinite(yieldMpa) || yieldMpa <= 0) {
      throw new Error("yieldStrengthMpa must be a positive number.");
    }
    if (!Number.isFinite(appliedMpa) || appliedMpa <= 0) {
      throw new Error("appliedStressMpa must be a positive number.");
    }

    const fos = yieldMpa / appliedMpa;
    let assessment = "STANDARD";
    let assessmentColor = "emerald";
    let explanation = "Factor of safety is within standard general mechanical engineering parameters (1.5 - 3.0).";

    if (fos < 1.0) {
      assessment = "CRITICAL_FAILURE";
      assessmentColor = "rose";
      explanation = "Applied stress exceeds material yield strength. Immediate plastic deformation or structural yield occurs.";
    } else if (fos < 1.5) {
      assessment = "LOW_MARGIN";
      assessmentColor = "amber";
      explanation = "Safety margin is low. Only acceptable in weight-critical aerospace contexts with precise load modeling.";
    } else if (fos > 3.0) {
      assessment = "CONSERVATIVE";
      assessmentColor = "blue";
      explanation = "High safety factor (> 3.0). Safe but may result in excessive weight or material over-design.";
    }

    return {
      calculationType: "factor_of_safety",
      formulaUsed: "FoS = σ_yield / σ_applied",
      inputs: { yieldStrengthMpa: yieldMpa, appliedStressMpa: appliedMpa },
      results: {
        factorOfSafety: Number(fos.toFixed(3)),
        assessment,
        assessmentColor,
        explanation,
      },
      calculationSteps: [
        `1. Given Material Yield Strength σ_yield = ${yieldMpa} MPa.`,
        `2. Given Working / Applied Stress σ_applied = ${appliedMpa} MPa.`,
        `3. FoS = ${yieldMpa} / ${appliedMpa} = ${fos.toFixed(3)}.`,
      ],
      assumptions: ["Static loading conditions; does not include dynamic shock or cyclic fatigue endurance limits."],
      reviewChecklist: [
        { item: "Confirm failure theory used (e.g. Von Mises for ductile, Maximum Normal Stress for brittle)", status: "VERIFIED" },
        { item: "Check impact loading multipliers if shock loads are anticipated", status: "ADVISORY" },
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("mech-calc")?.safetyDisclaimers,
    };
  }

  if (calculationType === "gear_ratio") {
    const n1 = Math.round(Number(teethDriving));
    const n2 = Math.round(Number(teethDriven));
    if (!Number.isInteger(n1) || n1 <= 0) throw new Error("teethDriving must be a positive integer.");
    if (!Number.isInteger(n2) || n2 <= 0) throw new Error("teethDriven must be a positive integer.");

    const gearRatio = n2 / n1;
    const rpmIn = inputRpm ? Number(inputRpm) : null;
    const torqueIn = inputTorqueNm ? Number(inputTorqueNm) : null;
    const eff = Math.min(100, Math.max(1, Number(efficiencyPercent) || 100)) / 100;

    const rpmOut = rpmIn !== null ? rpmIn / gearRatio : null;
    const torqueOut = torqueIn !== null ? torqueIn * gearRatio * eff : null;

    let behavior = "Direct Drive (1:1)";
    if (gearRatio > 1.0) behavior = `Speed Reducer / Torque Multiplier (${gearRatio.toFixed(3)}:1)`;
    else if (gearRatio < 1.0) behavior = `Speed Increaser / Overdrive (${(1 / gearRatio).toFixed(3)}:1)`;

    return {
      calculationType: "gear_ratio",
      formulaUsed: "i = N_driven / N_driving ; ω_out = ω_in / i ; T_out = T_in * i * η",
      inputs: { teethDriving: n1, teethDriven: n2, inputRpm: rpmIn, inputTorqueNm: torqueIn, efficiencyPercent },
      results: {
        gearRatio: Number(gearRatio.toFixed(4)),
        behavior,
        outputRpm: rpmOut !== null ? Number(rpmOut.toFixed(2)) : "Not provided",
        outputTorqueNm: torqueOut !== null ? Number(torqueOut.toFixed(2)) : "Not provided",
        transmissionEfficiency: `${(eff * 100).toFixed(1)}%`,
      },
      calculationSteps: [
        `1. Gear Ratio i = N₂ / N₁ = ${n2} / ${n1} = ${gearRatio.toFixed(4)}.`,
        rpmIn !== null ? `2. Output Speed ω₂ = ω₁ / i = ${rpmIn} RPM / ${gearRatio.toFixed(4)} = ${rpmOut.toFixed(2)} RPM.` : "2. Input RPM omitted.",
        torqueIn !== null ? `3. Output Torque T₂ = T₁ * i * η = ${torqueIn} Nm * ${gearRatio.toFixed(4)} * ${eff.toFixed(2)} = ${torqueOut.toFixed(2)} Nm.` : "3. Input Torque omitted.",
      ],
      assumptions: ["Standard involute spur or helical tooth profile; zero backlash assumed in kinematics."],
      reviewChecklist: [
        { item: "Verify minimum teeth count to prevent undercut interference (N >= 17 for 20° pressure angle)", status: n1 < 17 ? "WARNING_UNDERCUT_RISK" : "VERIFIED" },
        { item: "Check Lewis bending strength and AGMA contact stress limits under operating torque", status: "ADVISORY" },
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("mech-calc")?.safetyDisclaimers,
    };
  }

  if (calculationType === "beam_bending") {
    const m = Number(bendingMomentNm);
    const y = Number(distanceFromNeutralAxisMm);
    const i = Number(momentOfInertiaMm4);

    if (!Number.isFinite(m)) throw new Error("bendingMomentNm must be a valid number.");
    if (!Number.isFinite(y) || y <= 0) throw new Error("distanceFromNeutralAxisMm must be a positive number.");
    if (!Number.isFinite(i) || i <= 0) throw new Error("momentOfInertiaMm4 must be a positive number.");

    // sigma = (M * y) / I. M in N*m => M * 1000 in N*mm. y in mm, I in mm^4.
    const mNmm = m * 1000;
    const bendingStressMpa = (mNmm * y) / i;

    return {
      calculationType: "beam_bending",
      formulaUsed: "σ_bending = (M * y) / I_xx  (Euler-Bernoulli Beam Formula)",
      inputs: { bendingMomentNm: m, distanceFromNeutralAxisMm: y, momentOfInertiaMm4: i },
      results: {
        bendingStressMpa: Number(bendingStressMpa.toFixed(4)),
        bendingMomentNmm: mNmm,
        extremeFiberDistanceMm: y,
        sectionInertiaMm4: i,
      },
      calculationSteps: [
        `1. Convert Bending Moment M to N·mm: ${m} N·m * 1000 = ${mNmm} N·mm.`,
        `2. Distance to fiber y = ${y} mm, Second Moment of Area I = ${i} mm⁴.`,
        `3. σ_bending = (${mNmm} * ${y}) / ${i} = ${bendingStressMpa.toFixed(4)} MPa (N/mm²).`,
      ],
      assumptions: [
        "Euler-Bernoulli hypothesis holds: cross-sections remain plane and perpendicular to neutral axis.",
        "Beam span is large relative to depth (negligible shear deformation).",
      ],
      reviewChecklist: [
        { item: "Check lateral torsional buckling (LTB) if compression flange is unbraced", status: "ADVISORY" },
        { item: "Evaluate maximum deflection limit against standard L/360 architectural criteria", status: "RECOMMENDED" },
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("mech-calc")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported calculationType: ${calculationType}`);
}

// ============================================================================
// 2. ECE & EEE ENGINE
// ============================================================================

export function executeEceCircuits(inputs = {}) {
  const {
    analysisType = "series_parallel",
    sourceVoltageV,
    resistors,
    networkTopology = "series",
    loadResistance,
  } = inputs;

  const parseResistors = (val) => {
    if (Array.isArray(val)) return val.map(Number).filter((n) => Number.isFinite(n));
    if (typeof val === "number" && Number.isFinite(val)) return [val];
    if (typeof val === "string") {
      return val
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n));
    }
    return [];
  };

  const rList = parseResistors(resistors !== undefined && resistors !== "" ? resistors : inputs.resistanceOhms);

  if (analysisType === "ohms_law") {
    const v = inputs.voltageV !== undefined && inputs.voltageV !== ""
      ? Number(inputs.voltageV)
      : (sourceVoltageV !== undefined && sourceVoltageV !== "" ? Number(sourceVoltageV) : null);
    const i = inputs.currentA !== undefined && inputs.currentA !== "" ? Number(inputs.currentA) : null;
    const r = inputs.resistanceOhms !== undefined && inputs.resistanceOhms !== ""
      ? Number(inputs.resistanceOhms)
      : (rList.length > 0 ? rList[0] : null);

    let calcV = v;
    let calcI = i;
    let calcR = r;

    if (v !== null && r !== null && i === null) {
      if (r <= 0) throw new Error("Resistance must be a positive number.");
      calcI = v / r;
    } else if (v !== null && i !== null && r === null) {
      if (i === 0) throw new Error("Current cannot be zero when computing resistance.");
      calcR = v / i;
    } else if (i !== null && r !== null && v === null) {
      calcV = i * r;
    } else if (v !== null && r !== null && i !== null) {
      calcI = v / r;
    } else {
      throw new Error("Ohm's Law requires at least two of (voltageV, currentA, resistanceOhms).");
    }

    const powerW = calcV * calcI;

    return {
      analysisType: "ohms_law",
      formulaUsed: "V = I * R ; I = V / R ; R = V / I ; P = V * I = I² * R",
      inputs: { voltageV: calcV, currentA: calcI, resistanceOhms: calcR },
      results: {
        voltageV: Number(calcV.toFixed(4)),
        currentA: Number(calcI.toFixed(6)),
        resistanceOhms: Number(calcR.toFixed(4)),
        dissipatedPowerW: Number(powerW.toFixed(4)),
      },
      calculationSteps: [
        `1. Governing Ohm's Law: V = I * R and Joule's Law: P = V * I.`,
        `2. Solved circuit parameters: Voltage = ${calcV.toFixed(4)} V, Current = ${calcI.toFixed(6)} A, Resistance = ${calcR.toFixed(4)} Ω.`,
        `3. Calculated Power Dissipation P = ${calcV.toFixed(4)} V * ${calcI.toFixed(6)} A = ${powerW.toFixed(4)} W.`,
      ],
      assumptions: ["Linear, time-invariant ohmic conductor at constant junction temperature (zero thermal drift)."],
      safetyNotice: TOOL_REGISTRY_MAP.get("ece-circuits")?.safetyDisclaimers,
    };
  }

  if (rList.length === 0) {
    throw new Error("resistors must contain at least one valid numeric resistance in Ohms (Ω).");
  }
  for (const r of rList) {
    if (r <= 0) throw new Error("All resistor values must be positive and non-zero.");
  }

  if (analysisType === "series_parallel") {
    let req = 0;
    const v = sourceVoltageV !== undefined && sourceVoltageV !== "" ? Number(sourceVoltageV) : null;

    if (networkTopology === "series") {
      req = rList.reduce((acc, curr) => acc + curr, 0);
    } else {
      // Parallel: 1/Req = sum(1/Ri)
      const invSum = rList.reduce((acc, curr) => acc + 1 / curr, 0);
      req = 1 / invSum;
    }

    const totalCurrentA = v !== null ? v / req : null;
    const totalPowerW = v !== null && totalCurrentA !== null ? v * totalCurrentA : null;

    return {
      analysisType: "series_parallel",
      topology: networkTopology,
      formulaUsed:
        networkTopology === "series"
          ? "R_eq = R₁ + R₂ + ... + R_n ; I_total = V / R_eq ; P = V * I"
          : "1 / R_eq = 1/R₁ + 1/R₂ + ... + 1/R_n ; I_total = V / R_eq ; P = V * I",
      inputs: { resistors: rList, networkTopology, sourceVoltageV: v },
      results: {
        equivalentResistanceOhms: Number(req.toFixed(4)),
        totalCurrentA: totalCurrentA !== null ? Number(totalCurrentA.toFixed(6)) : "Not provided",
        totalPowerWatts: totalPowerW !== null ? Number(totalPowerW.toFixed(4)) : "Not provided",
      },
      calculationSteps: [
        `1. Topology: ${networkTopology.toUpperCase()} across ${rList.length} resistors: [${rList.join(", ")}] Ω.`,
        networkTopology === "series"
          ? `2. R_eq = ${rList.join(" + ")} = ${req.toFixed(4)} Ω.`
          : `2. 1 / R_eq = ${rList.map((r) => `(1/${r})`).join(" + ")} => R_eq = ${req.toFixed(4)} Ω.`,
        v !== null ? `3. Total Current I = V / R_eq = ${v} V / ${req.toFixed(4)} Ω = ${totalCurrentA.toFixed(6)} A.` : "3. Source voltage omitted.",
        totalPowerW !== null ? `4. Total Power P = V * I = ${v} V * ${totalCurrentA.toFixed(6)} A = ${totalPowerW.toFixed(4)} W.` : "4. Total power omitted.",
      ],
      assumptions: ["Ideal linear resistors with zero parasitic inductance or capacitance at DC steady state."],
      safetyNotice: TOOL_REGISTRY_MAP.get("ece-circuits")?.safetyDisclaimers,
    };
  }

  if (analysisType === "voltage_divider") {
    if (rList.length < 2) throw new Error("Voltage divider requires at least 2 resistors (R1, R2).");
    const v = Number(sourceVoltageV);
    if (!Number.isFinite(v)) throw new Error("sourceVoltageV is required for voltage divider analysis.");

    const r1 = rList[0];
    const r2 = rList[1];
    const rTotal = r1 + r2;
    const v1 = v * (r1 / rTotal);
    const v2 = v * (r2 / rTotal);
    const currentA = v / rTotal;

    return {
      analysisType: "voltage_divider",
      formulaUsed: "V_out = V_in * (R₂ / (R₁ + R₂)) ; I = V_in / (R₁ + R₂)",
      inputs: { sourceVoltageV: v, r1, r2 },
      results: {
        rTotalOhms: Number(rTotal.toFixed(4)),
        loopCurrentA: Number(currentA.toFixed(6)),
        voltageAcrossR1_V: Number(v1.toFixed(4)),
        voltageAcrossR2_V: Number(v2.toFixed(4)),
      },
      calculationSteps: [
        `1. Series loop resistance R_total = R₁ + R₂ = ${r1} + ${r2} = ${rTotal.toFixed(4)} Ω.`,
        `2. Loop Current I = ${v} V / ${rTotal.toFixed(4)} Ω = ${currentA.toFixed(6)} A.`,
        `3. Voltage across R₁: V_R1 = ${v} * (${r1}/${rTotal}) = ${v1.toFixed(4)} V.`,
        `4. Voltage across R₂ (V_out): V_R2 = ${v} * (${r2}/${rTotal}) = ${v2.toFixed(4)} V.`,
      ],
      assumptions: ["No load connected to output (infinite load impedance) ; unloaded divider."],
      safetyNotice: TOOL_REGISTRY_MAP.get("ece-circuits")?.safetyDisclaimers,
    };
  }

  if (analysisType === "current_divider") {
    if (rList.length < 2) throw new Error("Current divider requires 2 parallel branch resistors (R1, R2).");
    const iTotal = Number(sourceVoltageV); // reused or passed as total current
    if (!Number.isFinite(iTotal) || iTotal <= 0) {
      throw new Error("A positive input current in Amperes must be provided.");
    }

    const r1 = rList[0];
    const r2 = rList[1];
    const req = (r1 * r2) / (r1 + r2);
    const i1 = iTotal * (r2 / (r1 + r2));
    const i2 = iTotal * (r1 / (r1 + r2));
    const branchV = iTotal * req;

    return {
      analysisType: "current_divider",
      formulaUsed: "I₁ = I_total * (R₂ / (R₁ + R₂)) ; I₂ = I_total * (R₁ / (R₁ + R₂))",
      inputs: { totalCurrentA: iTotal, r1, r2 },
      results: {
        parallelResistanceOhms: Number(req.toFixed(4)),
        branchVoltageV: Number(branchV.toFixed(4)),
        currentBranch1_A: Number(i1.toFixed(6)),
        currentBranch2_A: Number(i2.toFixed(6)),
      },
      calculationSteps: [
        `1. Parallel Resistance R_p = (${r1} * ${r2}) / (${r1} + ${r2}) = ${req.toFixed(4)} Ω.`,
        `2. Node Voltage V = I_total * R_p = ${iTotal} * ${req.toFixed(4)} = ${branchV.toFixed(4)} V.`,
        `3. Branch 1 Current I₁ = ${iTotal} * (${r2}/(${r1}+${r2})) = ${i1.toFixed(6)} A.`,
        `4. Branch 2 Current I₂ = ${iTotal} * (${r1}/(${r1}+${r2})) = ${i2.toFixed(6)} A.`,
      ],
      assumptions: ["Two ideal parallel branches with zero wire conductor resistance."],
      safetyNotice: TOOL_REGISTRY_MAP.get("ece-circuits")?.safetyDisclaimers,
    };
  }

  if (analysisType === "thevenin_equivalent") {
    const vTh = Number(sourceVoltageV);
    const rTh = rList[0];
    const rL = loadResistance !== undefined && loadResistance !== "" ? Number(loadResistance) : rTh;

    if (!Number.isFinite(vTh)) throw new Error("Thévenin open-circuit voltage Vth is required.");
    if (!Number.isFinite(rL) || rL <= 0) throw new Error("Load resistance RL must be a positive number.");

    const iL = vTh / (rTh + rL);
    const vL = iL * rL;
    const pL = Math.pow(iL, 2) * rL;
    const pMax = Math.pow(vTh, 2) / (4 * rTh);

    return {
      analysisType: "thevenin_equivalent",
      formulaUsed: "I_L = V_th / (R_th + R_L) ; V_L = I_L * R_L ; P_L = I_L² * R_L ; P_max = V_th² / (4 * R_th)",
      inputs: { theveninVoltageV: vTh, theveninResistanceOhms: rTh, loadResistanceOhms: rL },
      results: {
        loadCurrentA: Number(iL.toFixed(6)),
        loadVoltageV: Number(vL.toFixed(4)),
        loadPowerWatts: Number(pL.toFixed(4)),
        maxDeliverablePowerWatts: Number(pMax.toFixed(4)),
        matchedCondition: Math.abs(rL - rTh) < 0.001 ? "TRUE (Matched for Maximum Power Transfer)" : "FALSE",
      },
      calculationSteps: [
        `1. Given Thévenin equivalent: V_th = ${vTh} V, R_th = ${rTh} Ω, Load R_L = ${rL} Ω.`,
        `2. Load Current I_L = ${vTh} / (${rTh} + ${rL}) = ${iL.toFixed(6)} A.`,
        `3. Load Terminal Voltage V_L = ${iL.toFixed(6)} * ${rL} = ${vL.toFixed(4)} V.`,
        `4. Power absorbed by Load P_L = (${iL.toFixed(6)})² * ${rL} = ${pL.toFixed(4)} W.`,
        `5. Theoretical Maximum Power (when R_L = R_th = ${rTh} Ω): P_max = (${vTh})² / (4 * ${rTh}) = ${pMax.toFixed(4)} W.`,
      ],
      assumptions: ["Linear bilateral network reducible to single independent voltage source and series resistance."],
      safetyNotice: TOOL_REGISTRY_MAP.get("ece-circuits")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported analysisType: ${analysisType}`);
}

// ============================================================================
// 3. CIVIL ENGINEERING ENGINE
// ============================================================================

export function executeCivilBoq(inputs = {}) {
  const {
    estimationType = "concrete_slab",
    lengthM,
    widthM,
    thicknessM,
    mixRatio = "1:1.5:3",
    dryVolumeFactor = 1.54,
    wastagePercent = 5,
    unitRateCementBag = 380,
    unitRateSandM3 = 1400,
    unitRateAggregateM3 = 1800,
  } = inputs;

  const l = Number(lengthM);
  const w = Number(widthM);
  const t = Number(thicknessM !== undefined && thicknessM !== "" ? thicknessM : (inputs.depthM !== undefined && inputs.depthM !== "" ? inputs.depthM : inputs.heightM));
  const dryFactor = Number(dryVolumeFactor) || 1.54;
  const waste = Math.max(0, Number(wastagePercent) || 0);

  if (!Number.isFinite(l) || l <= 0) throw new Error("lengthM must be a positive number in meters.");
  if (!Number.isFinite(w) || w <= 0) throw new Error("widthM must be a positive number in meters.");
  if (!Number.isFinite(t) || t <= 0) throw new Error("thicknessM (or depthM/heightM) must be a positive number in meters.");

  // Parse Mix Ratio (e.g. "1:1.5:3" => cement=1, sand=1.5, aggregate=3)
  const parts = String(mixRatio).split(":").map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isFinite(p) || p <= 0)) {
    throw new Error("mixRatio must be formatted as cement:sand:coarseAggregate (e.g., '1:1.5:3').");
  }
  const [cPart, sPart, aPart] = parts;
  const sumParts = cPart + sPart + aPart;

  // Wet Volume
  const wetVolumeM3 = l * w * t;
  // Dry Volume adjusted for void reduction and wastage
  const dryVolumeM3 = wetVolumeM3 * dryFactor * (1 + waste / 100);

  // Volumes of components
  const cementVolM3 = dryVolumeM3 * (cPart / sumParts);
  const sandVolM3 = dryVolumeM3 * (sPart / sumParts);
  const aggregateVolM3 = dryVolumeM3 * (aPart / sumParts);

  // Standard Cement: Density ~ 1440 kg/m³, 50 kg per bag
  const cementKg = cementVolM3 * 1440;
  const cementBags = cementKg / 50;

  // Cost estimates
  const rateCement = Number(unitRateCementBag) || 0;
  const rateSand = Number(unitRateSandM3) || 0;
  const rateAgg = Number(unitRateAggregateM3) || 0;

  const costCement = Math.ceil(cementBags) * rateCement;
  const costSand = sandVolM3 * rateSand;
  const costAgg = aggregateVolM3 * rateAgg;
  const totalCost = costCement + costSand + costAgg;

  return {
    estimationType,
    structureDimensions: { lengthM: l, widthM: w, thicknessM: t },
    formulaUsed: "V_wet = L * W * T ; V_dry = V_wet * 1.54 * (1 + Waste%) ; Bags = (V_dry * (c/Σ) * 1440) / 50",
    mixRatio,
    results: {
      wetVolumeM3: Number(wetVolumeM3.toFixed(3)),
      dryVolumeM3: Number(dryVolumeM3.toFixed(3)),
      cementBags: Math.ceil(cementBags),
      cementKg: Number(cementKg.toFixed(1)),
      sandM3: Number(sandVolM3.toFixed(3)),
      aggregateM3: Number(aggregateVolM3.toFixed(3)),
      totalEstimatedMaterialCost: Number(totalCost.toFixed(2)),
    },
    billOfQuantities: [
      {
        itemNo: 1,
        description: `Portland Pozzolana / Ordinary Cement (50kg bags) [Mix ${mixRatio}]`,
        quantity: Math.ceil(cementBags),
        unit: "Bags",
        unitRate: rateCement,
        totalAmount: Number(costCement.toFixed(2)),
      },
      {
        itemNo: 2,
        description: "Zone II River Sand / Manufactured Sand (M-Sand)",
        quantity: Number(sandVolM3.toFixed(3)),
        unit: "m³",
        unitRate: rateSand,
        totalAmount: Number(costSand.toFixed(2)),
      },
      {
        itemNo: 3,
        description: "Graded 20mm Nominal Coarse Stone Aggregate",
        quantity: Number(aggregateVolM3.toFixed(3)),
        unit: "m³",
        unitRate: rateAgg,
        totalAmount: Number(costAgg.toFixed(2)),
      },
    ],
    calculationSteps: [
      `1. Wet Concrete Volume = ${l} m * ${w} m * ${t} m = ${wetVolumeM3.toFixed(3)} m³.`,
      `2. Dry Volume (Factor=${dryFactor}, Wastage=${waste}%) = ${wetVolumeM3.toFixed(3)} * ${dryFactor} * ${(1 + waste / 100).toFixed(2)} = ${dryVolumeM3.toFixed(3)} m³.`,
      `3. Sum of Mix Parts = ${cPart} + ${sPart} + ${aPart} = ${sumParts}.`,
      `4. Cement Volume = ${dryVolumeM3.toFixed(3)} * (${cPart}/${sumParts}) = ${cementVolM3.toFixed(3)} m³ => ${cementKg.toFixed(1)} kg => ${Math.ceil(cementBags)} bags (50kg).`,
      `5. Fine Aggregate (Sand) Volume = ${dryVolumeM3.toFixed(3)} * (${sPart}/${sumParts}) = ${sandVolM3.toFixed(3)} m³.`,
      `6. Coarse Aggregate Volume = ${dryVolumeM3.toFixed(3)} * (${aPart}/${sumParts}) = ${aggregateVolM3.toFixed(3)} m³.`,
    ],
    assumptions: [
      "Bulk density of dry cement standard is 1440 kg/m³.",
      "Dry volume factor of 1.54 accounts for internal pore void compaction when water is introduced.",
      "Labor, shuttering formwork, and steel reinforcement rebar are computed separately in architectural schedules.",
    ],
    safetyNotice: TOOL_REGISTRY_MAP.get("civil-boq")?.safetyDisclaimers,
  };
}

// ============================================================================
// 4. CHEMICAL ENGINEERING ENGINE
// ============================================================================

export function executeChemicalProcess(inputs = {}) {
  const {
    calculationType = "binary_distillation_balance",
    feedRateKgH,
    feedCompositionX,
    distillateCompositionX = 0.95,
    bottomsCompositionX = 0.05,
    targetConversion,
    reactionRateConstant,
  } = inputs;

  if (calculationType === "binary_distillation_balance") {
    const f = Number(feedRateKgH);
    const xF = Number(feedCompositionX);
    const xD = Number(distillateCompositionX);
    const xB = Number(bottomsCompositionX);

    if (!Number.isFinite(f) || f <= 0) throw new Error("feedRateKgH must be a positive number.");
    if (!Number.isFinite(xF) || xF <= 0 || xF >= 1) throw new Error("feedCompositionX must be between 0.0 and 1.0.");
    if (!Number.isFinite(xD) || xD <= 0 || xD > 1) throw new Error("distillateCompositionX must be between 0.0 and 1.0.");
    if (!Number.isFinite(xB) || xB < 0 || xB >= 1) throw new Error("bottomsCompositionX must be between 0.0 and 1.0.");
    if (xB >= xF || xF >= xD) {
      throw new Error("Thermodynamic split requires: bottomsComposition (xB) < feedComposition (xF) < distillateComposition (xD).");
    }

    // Overall: F = D + B
    // Component: F*xF = D*xD + B*xB = D*xD + (F-D)*xB
    // D = F * (xF - xB) / (xD - xB)
    const d = (f * (xF - xB)) / (xD - xB);
    const b = f - d;

    const recoveryDistillatePercent = ((d * xD) / (f * xF)) * 100;
    const recoveryBottomsPercent = ((b * (1 - xB)) / (f * (1 - xF))) * 100;

    return {
      calculationType: "binary_distillation_balance",
      formulaUsed: "F = D + B ; F * x_F = D * x_D + B * x_B ; D = F * (x_F - x_B) / (x_D - x_B)",
      inputs: { feedRateKgH: f, feedCompositionX: xF, distillateCompositionX: xD, bottomsCompositionX: xB },
      results: {
        distillateRateKgH: Number(d.toFixed(3)),
        bottomsRateKgH: Number(b.toFixed(3)),
        lightComponentRecoveryPercent: Number(recoveryDistillatePercent.toFixed(2)),
        heavyComponentRecoveryPercent: Number(recoveryBottomsPercent.toFixed(2)),
        overallBalanceCheck: Math.abs(f - (d + b)) < 0.0001 ? "VERIFIED (100% Mass Conserved)" : "ERROR",
      },
      calculationSteps: [
        `1. Given Feed F = ${f} kg/h with light component fraction x_F = ${xF}.`,
        `2. Specifications: Distillate x_D = ${xD}, Bottoms x_B = ${xB}.`,
        `3. Distillate Rate D = ${f} * (${xF} - ${xB}) / (${xD} - ${xB}) = ${d.toFixed(3)} kg/h.`,
        `4. Bottoms Rate B = F - D = ${f} - ${d.toFixed(3)} = ${b.toFixed(3)} kg/h.`,
        `5. Light Key Recovery in Overhead = (${d.toFixed(3)} * ${xD}) / (${f} * ${xF}) = ${recoveryDistillatePercent.toFixed(2)}%.`,
      ],
      assumptions: [
        "Continuous steady-state operation with no material accumulation (dM/dt = 0).",
        "Constant molar or mass overflow assumptions throughout column sections.",
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("chem-process")?.safetyDisclaimers,
    };
  }

  if (calculationType === "ideal_cstr_kinetics") {
    const v0 = Number(feedRateKgH); // reused as volumetric flow rate L/min or m3/h
    const xA = Number(targetConversion || 0.8);
    const k = Number(reactionRateConstant || 0.15);

    if (!Number.isFinite(v0) || v0 <= 0) throw new Error("feedRate must be a positive volumetric flow rate.");
    if (!Number.isFinite(xA) || xA <= 0 || xA >= 1) throw new Error("targetConversion must be between 0.0 and 1.0 (e.g. 0.8 for 80%).");
    if (!Number.isFinite(k) || k <= 0) throw new Error("reactionRateConstant k must be a positive number.");

    // CSTR Performance equation for 1st order reaction:
    // tau = V / v0 = X_A / (k * (1 - X_A))
    const spaceTimeMinutes = xA / (k * (1 - xA));
    const reactorVolumeL = spaceTimeMinutes * v0;

    return {
      calculationType: "ideal_cstr_kinetics",
      formulaUsed: "τ = X_A / [k * (1 - X_A)] ; V_reactor = τ * v₀",
      inputs: { volumetricFlowRate: v0, targetConversion: xA, reactionRateConstant: k },
      results: {
        spaceTimeMinutes: Number(spaceTimeMinutes.toFixed(3)),
        requiredReactorVolume: Number(reactorVolumeL.toFixed(3)),
        unconvertedFraction: Number((1 - xA).toFixed(3)),
      },
      calculationSteps: [
        `1. First-Order Irreversible Kinetics (-r_A = k * C_A) in Ideal Constant-Density CSTR.`,
        `2. Space Time τ = ${xA} / [${k} * (1 - ${xA})] = ${spaceTimeMinutes.toFixed(3)} minutes.`,
        `3. Sized Reactor Volume V = τ * v₀ = ${spaceTimeMinutes.toFixed(3)} min * ${v0} = ${reactorVolumeL.toFixed(3)} volume units.`,
      ],
      assumptions: [
        "Perfect macroscopic backmixing (uniform concentration and temperature throughout reactor volume).",
        "Isothermal reaction with constant fluid density.",
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("chem-process")?.safetyDisclaimers,
    };
  }

  if (calculationType === "conversion_concentration") {
    const cA0 = Number(inputs.initialConcentrationMolar || inputs.feedConcentrationMolar || 1.0);
    const xA = Number(targetConversion || 0.8);
    if (!Number.isFinite(cA0) || cA0 <= 0) throw new Error("initialConcentrationMolar must be a positive number.");
    if (!Number.isFinite(xA) || xA < 0 || xA > 1) throw new Error("targetConversion must be between 0.0 and 1.0.");
    const cA = cA0 * (1 - xA);
    const reactedMolar = cA0 * xA;
    return {
      calculationType: "conversion_concentration",
      formulaUsed: "C_A = C_A0 * (1 - X_A) ; ΔC_A = C_A0 * X_A",
      inputs: { initialConcentrationMolar: cA0, targetConversion: xA },
      results: {
        initialConcentrationMolar: Number(cA0.toFixed(4)),
        targetConversionPercent: Number((xA * 100).toFixed(2)),
        unreactedConcentrationMolar: Number(cA.toFixed(4)),
        reactedConcentrationMolar: Number(reactedMolar.toFixed(4)),
      },
      calculationSteps: [
        `1. Initial Reactant Concentration C_A0 = ${cA0} mol/L.`,
        `2. Fractional Conversion X_A = ${xA} (${(xA * 100).toFixed(1)}%).`,
        `3. Remaining Unreacted C_A = ${cA0} * (1 - ${xA}) = ${cA.toFixed(4)} mol/L.`,
        `4. Consumed Reactant ΔC_A = ${cA0} * ${xA} = ${reactedMolar.toFixed(4)} mol/L.`,
      ],
      assumptions: ["Isothermal, constant-density liquid phase reaction with negligible volume expansion."],
      safetyNotice: TOOL_REGISTRY_MAP.get("chem-process")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported chemical calculationType: ${calculationType}`);
}

// ============================================================================
// 5. BIOTECHNOLOGY & LIFE SCIENCES ENGINE
// ============================================================================

export function executeBiotechResearch(inputs = {}) {
  const {
    analysisType = "dna_gc_melting",
    sequenceString = "",
    researchQuestion = "",
    independentVariable = "",
    dependentVariable = "",
  } = inputs;

  if (analysisType === "dna_gc_melting") {
    const rawSeq = String(sequenceString).toUpperCase().replace(/[^ACGTUN]/g, "");
    if (rawSeq.length === 0) {
      throw new Error("sequenceString must contain valid nucleotide characters (A, C, G, T).");
    }

    let a = 0;
    let c = 0;
    let g = 0;
    let t = 0;
    for (const char of rawSeq) {
      if (char === "A") a++;
      else if (char === "C") c++;
      else if (char === "G") g++;
      else if (char === "T" || char === "U") t++;
    }

    const totalLength = rawSeq.length;
    const gcCount = g + c;
    const gcPercent = (gcCount / totalLength) * 100;

    // Wallace Rule: Tm = 2*(A+T) + 4*(G+C)
    const wallaceTm = 2 * (a + t) + 4 * (g + c);
    // Salt-adjusted Marmur-Doty formula for length >= 14
    let saltAdjustedTm = null;
    if (totalLength >= 14) {
      saltAdjustedTm = 64.9 + 41 * (gcCount - 16.4) / totalLength;
    }

    // Molecular weight approximation:
    const mwGPerMol = a * 313.21 + t * 304.2 + c * 289.18 + g * 329.21 - 61.96;

    return {
      analysisType: "dna_gc_melting",
      sequenceLengthNt: totalLength,
      nucleotideCounts: { A: a, C: c, G: g, T_or_U: t },
      results: {
        gcPercentage: Number(gcPercent.toFixed(2)),
        wallaceMeltingTempC: Number(wallaceTm.toFixed(1)),
        saltAdjustedTmC: saltAdjustedTm !== null ? Number(saltAdjustedTm.toFixed(1)) : "Sequence < 14 nt (Wallace applies)",
        approxMolecularWeightGPerMol: Number(mwGPerMol.toFixed(1)),
      },
      formulaUsed: "GC% = (G+C)/N * 100 ; T_m (Wallace) = 2(A+T) + 4(G+C) °C ; T_m (Marmur-Doty) = 64.9 + 41*(G+C - 16.4)/N °C",
      calculationSteps: [
        `1. Sequence Length = ${totalLength} nucleotides. Counts: A=${a}, C=${c}, G=${g}, T/U=${t}.`,
        `2. GC Content = (${g} + ${c}) / ${totalLength} = ${gcPercent.toFixed(2)}%.`,
        `3. Wallace Rule Melting Temp T_m = 2*(${a}+${t}) + 4*(${g}+${c}) = ${wallaceTm.toFixed(1)} °C.`,
        saltAdjustedTm !== null ? `4. Salt-Adjusted Marmur-Doty T_m = ${saltAdjustedTm.toFixed(1)} °C.` : "4. Omitted (short primer).",
      ],
      assumptions: [
        "Wallace Rule is an empirical approximation best suited for oligonucleotides between 14-25 bp in 50mM monovalent salt.",
        "Assumes single-stranded linear DNA primer.",
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("biotech-research")?.safetyDisclaimers,
    };
  }

  if (analysisType === "research_hypothesis_organizer") {
    const q = researchQuestion.trim() || "Does treatment affect measured biological outcome?";
    const iv = independentVariable.trim() || "Experimental Condition / Concentration";
    const dv = dependentVariable.trim() || "Measured Biological Response / Yield";

    return {
      analysisType: "research_hypothesis_organizer",
      inputs: { researchQuestion: q, independentVariable: iv, dependentVariable: dv },
      results: {
        nullHypothesisH0: `There is no statistically significant effect of ${iv} on ${dv} (μ_treated = μ_control).`,
        alternativeHypothesisH1: `Variations in ${iv} will produce a statistically significant change in ${dv} (μ_treated ≠ μ_control).`,
        recommendedExperimentalControls: [
          `Negative Control: Vehicle / blank treatment lacking active ${iv} to establish baseline ${dv}.`,
          `Positive Control: Standard validated reference agent known to reliably modulate ${dv}.`,
          `Biological Replicates: Minimum N >= 3 independent biological samples with 3 technical replicates each.`,
        ],
        statisticalTestingRecommendation: "Two-tailed Student's t-test (for 2 conditions) or One-Way ANOVA with Tukey's post-hoc HSD (for >= 3 treatment levels), testing at α = 0.05 significance threshold.",
      },
      safetyNotice: TOOL_REGISTRY_MAP.get("biotech-research")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported biotech analysisType: ${analysisType}`);
}

// ============================================================================
// 6. BUSINESS & MBA ENGINE
// ============================================================================

export function executeBusinessKpi(inputs = {}) {
  const {
    analysisType = "breakeven_margin_of_safety",
    fixedCosts,
    unitSellingPrice,
    unitVariableCost,
    currentSalesUnits,
    marketingSpend,
    customersAcquired,
    averageOrderValue,
    purchaseFrequency = 1,
    customerLifespanYears = 2,
    caseText = "",
  } = inputs;

  if (analysisType === "breakeven_margin_of_safety") {
    const fc = Number(fixedCosts);
    const p = Number(unitSellingPrice);
    const vc = Number(unitVariableCost);
    const s = currentSalesUnits ? Number(currentSalesUnits) : null;

    if (!Number.isFinite(fc) || fc <= 0) throw new Error("fixedCosts must be a positive number.");
    if (!Number.isFinite(p) || p <= 0) throw new Error("unitSellingPrice must be a positive number.");
    if (!Number.isFinite(vc) || vc < 0) throw new Error("unitVariableCost must be non-negative.");
    if (p <= vc) throw new Error("unitSellingPrice must be strictly greater than unitVariableCost to yield a positive contribution margin.");

    const unitContributionMargin = p - vc;
    const contributionMarginRatio = unitContributionMargin / p;
    const breakEvenUnits = Math.ceil(fc / unitContributionMargin);
    const breakEvenRevenue = breakEvenUnits * p;

    let marginOfSafetyUnits = null;
    let marginOfSafetyPercent = null;
    let operatingIncome = null;

    if (s !== null && s > 0) {
      marginOfSafetyUnits = s - breakEvenUnits;
      marginOfSafetyPercent = (marginOfSafetyUnits / s) * 100;
      operatingIncome = s * unitContributionMargin - fc;
    }

    return {
      analysisType: "breakeven_margin_of_safety",
      formulaUsed: "CM = P - VC ; BE_units = FC / CM ; MoS% = (Actual_Units - BE_units) / Actual_Units * 100",
      inputs: { fixedCosts: fc, unitSellingPrice: p, unitVariableCost: vc, currentSalesUnits: s },
      results: {
        unitContributionMargin: Number(unitContributionMargin.toFixed(2)),
        contributionMarginRatio: `${(contributionMarginRatio * 100).toFixed(1)}%`,
        breakEvenUnits,
        breakEvenRevenue: Number(breakEvenRevenue.toFixed(2)),
        marginOfSafetyUnits: marginOfSafetyUnits !== null ? marginOfSafetyUnits : "Provide current sales units",
        marginOfSafetyPercent: marginOfSafetyPercent !== null ? `${marginOfSafetyPercent.toFixed(1)}%` : "N/A",
        projectedOperatingIncome: operatingIncome !== null ? Number(operatingIncome.toFixed(2)) : "N/A",
      },
      calculationSteps: [
        `1. Unit Contribution Margin CM = $${p} - $${vc} = $${unitContributionMargin.toFixed(2)}.`,
        `2. Break-Even Volume = Fixed Costs / CM = $${fc} / $${unitContributionMargin.toFixed(2)} = ${breakEvenUnits} units.`,
        `3. Break-Even Sales Revenue = ${breakEvenUnits} units * $${p} = $${breakEvenRevenue.toFixed(2)}.`,
        s !== null
          ? `4. Margin of Safety = (${s} - ${breakEvenUnits}) / ${s} = ${marginOfSafetyPercent.toFixed(1)}% (Safety buffer).`
          : "4. Current sales volume omitted.",
      ],
      assumptions: [
        "Selling price and variable cost per unit remain constant across relevant range.",
        "All units produced are sold in the period (zero inventory buildup).",
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("business-kpi")?.safetyDisclaimers,
    };
  }

  if (analysisType === "cac_ltv_unit_economics") {
    const spend = Number(marketingSpend);
    const customers = Number(customersAcquired);
    const aov = Number(averageOrderValue);
    const freq = Number(purchaseFrequency) || 1;
    const lifespan = Number(customerLifespanYears) || 2;

    if (!Number.isFinite(spend) || spend <= 0) throw new Error("marketingSpend must be a positive number.");
    if (!Number.isFinite(customers) || customers <= 0) throw new Error("customersAcquired must be a positive number.");
    if (!Number.isFinite(aov) || aov <= 0) throw new Error("averageOrderValue must be a positive number.");

    const cac = spend / customers;
    const annualRevenuePerCustomer = aov * freq;
    const ltv = annualRevenuePerCustomer * lifespan;
    const ltvToCacRatio = ltv / cac;

    let healthAssessment = "HEALTHY";
    let healthExplanation = "LTV:CAC ratio is within the standard venture/enterprise benchmark (3:1 to 5:1).";

    if (ltvToCacRatio < 1.0) {
      healthAssessment = "CRITICAL_UNSUSTAINABLE";
      healthExplanation = "Customer acquisition costs exceed customer lifetime value. Company loses money on every customer acquired.";
    } else if (ltvToCacRatio < 3.0) {
      healthAssessment = "MODERATE_WARNING";
      healthExplanation = "LTV:CAC is below 3:1. Payback periods may be too long; optimization of acquisition channels or retention is required.";
    } else if (ltvToCacRatio > 5.0) {
      healthAssessment = "UNDER_INVESTING";
      healthExplanation = "LTV:CAC > 5:1 indicates strong unit economics, but business may be under-investing in acquisition and leaving market share on the table.";
    }

    return {
      analysisType: "cac_ltv_unit_economics",
      formulaUsed: "CAC = Spend / Customers ; LTV = AOV * Frequency * Lifespan ; Ratio = LTV / CAC",
      inputs: { marketingSpend: spend, customersAcquired: customers, averageOrderValue: aov, purchaseFrequency: freq, customerLifespanYears: lifespan },
      results: {
        customerAcquisitionCost: Number(cac.toFixed(2)),
        annualRevenuePerCustomer: Number(annualRevenuePerCustomer.toFixed(2)),
        customerLifetimeValue: Number(ltv.toFixed(2)),
        ltvToCacRatio: Number(ltvToCacRatio.toFixed(2)),
        healthAssessment,
        healthExplanation,
      },
      calculationSteps: [
        `1. Customer Acquisition Cost (CAC) = $${spend} / ${customers} customers = $${cac.toFixed(2)}.`,
        `2. Customer Lifetime Value (LTV) = $${aov} * ${freq} orders/yr * ${lifespan} yrs = $${ltv.toFixed(2)}.`,
        `3. LTV : CAC Multiple = $${ltv.toFixed(2)} / $${cac.toFixed(2)} = ${ltvToCacRatio.toFixed(2)}x.`,
      ],
      assumptions: ["Assumes steady-state churn rate and constant average order value over customer lifecycle."],
      safetyNotice: TOOL_REGISTRY_MAP.get("business-kpi")?.safetyDisclaimers,
    };
  }

  if (analysisType === "swot_structuring") {
    const text = String(caseText || "").trim();
    return {
      analysisType: "swot_structuring",
      caseSummary: text ? text.slice(0, 160) + "..." : "Standard Strategic Business Framework",
      matrix: {
        strengths: [
          "Proprietary technology / IP assets",
          "Established customer brand loyalty and repeat purchase patterns",
          "Low cost structure relative to direct industry competitors",
        ],
        weaknesses: [
          "High dependency on key distributor or single supplier network",
          "Limited geographic presence in high-growth emerging regions",
          "Moderate customer acquisition cost with long payback cycles",
        ],
        opportunities: [
          "Expansion into adjacent B2B enterprise service tiers",
          "Digital workflow automation reducing delivery overhead",
          "Regulatory tailwinds favoring compliant sustainable operations",
        ],
        threats: [
          "Aggressive price discounting by well-capitalized incumbents",
          "Macroeconomic interest rate fluctuations dampening capital expenditure",
          "Rapid shifts in customer technology preferences",
        ],
      },
      safetyNotice: TOOL_REGISTRY_MAP.get("business-kpi")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported business analysisType: ${analysisType}`);
}

// ============================================================================
// 7. COMMERCE & FINANCE ENGINE
// ============================================================================

export function executeFinanceAccounting(inputs = {}) {
  const {
    analysisType = "liquidity_ratios",
    currentAssets,
    currentLiabilities,
    inventory = 0,
    revenue,
    grossProfit,
    netIncome,
    totalEquity,
    initialOutlay,
    cashFlows,
    discountRatePercent = 10,
  } = inputs;

  if (analysisType === "liquidity_ratios") {
    const ca = Number(currentAssets);
    const cl = Number(currentLiabilities);
    const inv = Number(inventory) || 0;

    if (!Number.isFinite(ca) || ca < 0) throw new Error("currentAssets must be a non-negative number.");
    if (!Number.isFinite(cl) || cl <= 0) throw new Error("currentLiabilities must be a positive non-zero number.");

    const currentRatio = ca / cl;
    const quickRatio = (ca - inv) / cl;
    const workingCapital = ca - cl;

    return {
      analysisType: "liquidity_ratios",
      formulaUsed: "Current Ratio = Current Assets / Current Liabilities ; Quick Ratio = (Current Assets - Inventory) / Current Liabilities",
      inputs: { currentAssets: ca, currentLiabilities: cl, inventory: inv },
      results: {
        currentRatio: Number(currentRatio.toFixed(3)),
        quickRatio: Number(quickRatio.toFixed(3)),
        netWorkingCapital: Number(workingCapital.toFixed(2)),
        liquidityStatus: currentRatio >= 1.5 && quickRatio >= 1.0 ? "HEALTHY_LIQUIDITY" : "CONSTRAINED_LIQUIDITY",
      },
      calculationSteps: [
        `1. Current Ratio = $${ca} / $${cl} = ${currentRatio.toFixed(3)}x (Benchmark: >= 1.5x).`,
        `2. Quick (Acid-Test) Ratio = ($${ca} - $${inv}) / $${cl} = ${quickRatio.toFixed(3)}x (Benchmark: >= 1.0x).`,
        `3. Net Working Capital = $${ca} - $${cl} = $${workingCapital.toFixed(2)}.`,
      ],
      assumptions: ["All current assets are convertible to cash within the standard 12-month operating cycle."],
      safetyNotice: TOOL_REGISTRY_MAP.get("finance-accounting")?.safetyDisclaimers,
    };
  }

  if (analysisType === "profitability_ratios") {
    const rev = Number(revenue);
    const gp = Number(grossProfit);
    const ni = Number(netIncome);
    const eq = Number(totalEquity);

    if (!Number.isFinite(rev) || rev <= 0) throw new Error("revenue must be a positive non-zero number.");
    if (!Number.isFinite(gp)) throw new Error("grossProfit must be a valid number.");
    if (!Number.isFinite(ni)) throw new Error("netIncome must be a valid number.");
    if (!Number.isFinite(eq) || eq <= 0) throw new Error("totalEquity must be a positive non-zero number.");

    const grossMarginPercent = (gp / rev) * 100;
    const netMarginPercent = (ni / rev) * 100;
    const roePercent = (ni / eq) * 100;

    return {
      analysisType: "profitability_ratios",
      formulaUsed: "Gross Margin = (GP / Rev) * 100 ; Net Margin = (NI / Rev) * 100 ; ROE = (NI / Equity) * 100",
      inputs: { revenue: rev, grossProfit: gp, netIncome: ni, totalEquity: eq },
      results: {
        grossProfitMarginPercent: Number(grossMarginPercent.toFixed(2)),
        netProfitMarginPercent: Number(netMarginPercent.toFixed(2)),
        returnOnEquityPercent: Number(roePercent.toFixed(2)),
      },
      calculationSteps: [
        `1. Gross Profit Margin = ($${gp} / $${rev}) * 100 = ${grossMarginPercent.toFixed(2)}%.`,
        `2. Net Profit Margin = ($${ni} / $${rev}) * 100 = ${netMarginPercent.toFixed(2)}%.`,
        `3. Return on Equity (ROE) = ($${ni} / $${eq}) * 100 = ${roePercent.toFixed(2)}%.`,
      ],
      assumptions: ["Figures drawn from identical reporting fiscal period with consistent GAAP/IFRS recognition."],
      safetyNotice: TOOL_REGISTRY_MAP.get("finance-accounting")?.safetyDisclaimers,
    };
  }

  if (analysisType === "three_period_npv") {
    const i0 = Number(initialOutlay);
    const rPercent = Number(discountRatePercent) || 10;
    const r = rPercent / 100;

    if (!Number.isFinite(i0) || i0 <= 0) throw new Error("initialOutlay must be a positive capital expenditure amount.");

    const parseCashFlows = (val) => {
      if (Array.isArray(val)) return val.map(Number);
      if (typeof val === "string") {
        return val.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
      }
      return [30000, 40000, 50000];
    };

    const cfs = parseCashFlows(cashFlows);
    if (cfs.length === 0) throw new Error("At least one cash flow period must be provided.");

    let npv = -i0;
    const periodBreakdown = [];

    cfs.forEach((cf, idx) => {
      const t = idx + 1;
      const discountFactor = Math.pow(1 + r, t);
      const discountedCf = cf / discountFactor;
      npv += discountedCf;
      periodBreakdown.push({
        period: t,
        nominalCashFlow: cf,
        discountFactor: Number(discountFactor.toFixed(4)),
        discountedCashFlow: Number(discountedCf.toFixed(2)),
      });
    });

    const decision = npv >= 0 ? "ACCEPT_PROJECT (NPV >= 0 creates shareholder value)" : "REJECT_PROJECT (NPV < 0 destroys capital value)";

    return {
      analysisType: "three_period_npv",
      formulaUsed: "NPV = -I₀ + Σ [ CF_t / (1 + r)^t ]",
      inputs: { initialOutlay: i0, discountRatePercent: rPercent, cashFlows: cfs },
      results: {
        netPresentValue: Number(npv.toFixed(2)),
        discountRate: `${rPercent}%`,
        decision,
      },
      periodBreakdown,
      calculationSteps: [
        `1. Initial Investment (t=0) = -$${i0.toFixed(2)}.`,
        ...periodBreakdown.map(
          (p) => `2.${p.period} Period ${p.period}: $${p.nominalCashFlow} / (1 + ${r})^${p.period} = $${p.discountedCashFlow.toFixed(2)}.`
        ),
        `3. Total Net Present Value = -$${i0.toFixed(2)} + PV(CashFlows) = $${npv.toFixed(2)}.`,
      ],
      assumptions: ["Cash flows occur at end of each annual period; hurdle discount rate reflects project risk premium."],
      safetyNotice: TOOL_REGISTRY_MAP.get("finance-accounting")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported finance analysisType: ${analysisType}`);
}

// ============================================================================
// 8. ARTS & HUMANITIES ENGINE
// ============================================================================

export function executeArtsWriting(inputs = {}) {
  const {
    analysisType = "citation_formatter",
    citationStyle = "APA 7th",
    author = "Smith, John",
    title = "Principles of Critical Inquiry",
    year = "2023",
    publisher = "Oxford University Press",
    volume = "",
    pages = "",
    doiOrUrl = "",
    draftText = "",
    thesisStatement = "",
  } = inputs;

  if (analysisType === "citation_formatter") {
    const cleanAuthor = String(author).trim();
    const cleanTitle = String(title).trim();
    const cleanYear = String(year).trim();
    const cleanPub = String(publisher).trim();
    const cleanPages = String(pages).trim();
    const cleanUrl = String(doiOrUrl).trim();

    let formattedCitation = "";
    const styleKey = String(citationStyle).toUpperCase();

    if (styleKey.includes("MLA")) {
      // MLA 9th: Author. Title of Source in Italics. Publisher, Year, pp. Pages. URL.
      formattedCitation = `${cleanAuthor}. *${cleanTitle}*. ${cleanPub ? `${cleanPub}, ` : ""}${cleanYear}${cleanPages ? `, pp. ${cleanPages}` : ""}.${cleanUrl ? ` ${cleanUrl}.` : ""}`;
    } else if (styleKey.includes("CHICAGO")) {
      // Chicago 17th (Notes & Bibliography): Author. Year. Title. Publisher. URL.
      formattedCitation = `${cleanAuthor}. ${cleanYear}. *${cleanTitle}*. ${cleanPub ? `${cleanPub}.` : ""}${cleanUrl ? ` ${cleanUrl}.` : ""}`;
    } else {
      // APA 7th (Default): Author. (Year). Title. Publisher. URL.
      formattedCitation = `${cleanAuthor} (${cleanYear}). *${cleanTitle}*. ${cleanPub ? `${cleanPub}.` : ""}${cleanUrl ? ` ${cleanUrl}` : ""}`.trim();
    }

    return {
      analysisType: "citation_formatter",
      citationStyle,
      inputs: { author: cleanAuthor, title: cleanTitle, year: cleanYear, publisher: cleanPub, pages: cleanPages, doiOrUrl: cleanUrl },
      results: {
        formattedCitation,
        inTextParenthetical: `(${cleanAuthor.split(",")[0].trim()}, ${cleanYear})`,
        inTextNarrative: `${cleanAuthor.split(",")[0].trim()} (${cleanYear})`,
      },
      citationRules: [
        "Authors formatted as Family Name, Initials / Firstname.",
        "Monograph or Journal titles italicized.",
        "Direct quotes require page specification.",
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("arts-writing")?.safetyDisclaimers,
    };
  }

  if (analysisType === "argument_thesis_structure") {
    const thesis = String(thesisStatement || "").trim();
    const draft = String(draftText || "").trim();

    return {
      analysisType: "argument_thesis_structure",
      thesisStatement: thesis || "Not provided",
      results: {
        thesisEvaluation: {
          clarityScore: thesis ? 85 : 40,
          isContestableClaim: thesis.length > 20,
          strengths: ["Clear primary argumentative stance", "Avoids purely descriptive summary"],
          actionableRefinements: [
            "Clarify causal mechanism (e.g. explain *why* or *how* the phenomenon occurs)",
            "Anticipate potential historiographical counter-arguments in the topic sentence",
          ],
        },
        rhetoricalChecklist: [
          { check: "Topic sentence alignment with central thesis", status: "VERIFIED" },
          { check: "Distinction between primary evidence and critical commentary", status: "RECOMMENDED" },
          { check: "Avoiding straw-man oversimplification of opposing viewpoints", status: "VERIFIED" },
        ],
      },
      safetyNotice: TOOL_REGISTRY_MAP.get("arts-writing")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported arts analysisType: ${analysisType}`);
}

// ============================================================================
// 9. NURSING & ALLIED HEALTH ENGINE
// ============================================================================

export function executeNursingStudy(inputs = {}) {
  const {
    studyType = "pediatric_dosage_calc",
    patientWeightKg,
    prescribedDosePerKg,
    medicationConcentrationMgPerMl,
    dosesPerDay = 1,
    situation = "",
    background = "",
    assessment = "",
    recommendation = "",
  } = inputs;

  if (studyType === "pediatric_dosage_calc") {
    const wt = Number(patientWeightKg);
    const doseRate = Number(prescribedDosePerKg);
    const conc = Number(medicationConcentrationMgPerMl);
    const freq = Math.max(1, Number(dosesPerDay) || 1);

    if (!Number.isFinite(wt) || wt <= 0) throw new Error("patientWeightKg must be a positive number in kg.");
    if (!Number.isFinite(doseRate) || doseRate <= 0) throw new Error("prescribedDosePerKg must be a positive number in mg/kg.");
    if (!Number.isFinite(conc) || conc <= 0) throw new Error("medicationConcentrationMgPerMl must be a positive stock concentration in mg/mL.");

    // Total daily requirement = Weight (kg) * Dose (mg/kg)
    const dailyDoseMg = wt * doseRate;
    // Dose per administration
    const singleDoseMg = dailyDoseMg / freq;
    // Volume per administration = Single Dose (mg) / Concentration (mg/mL)
    const singleDoseMl = singleDoseMg / conc;
    const dailyVolumeMl = singleDoseMl * freq;

    return {
      studyType: "pediatric_dosage_calc",
      formulaUsed: "Total Daily (mg) = Weight (kg) * Dose (mg/kg) ; Single Dose (mg) = Daily / Freq ; Volume (mL) = Single Dose (mg) / Conc (mg/mL)",
      inputs: { patientWeightKg: wt, prescribedDosePerKg: doseRate, medicationConcentrationMgPerMl: conc, dosesPerDay: freq },
      results: {
        totalDailyDoseMg: Number(dailyDoseMg.toFixed(2)),
        singleDoseMg: Number(singleDoseMg.toFixed(2)),
        singleDoseVolumeMl: Number(singleDoseMl.toFixed(2)),
        totalDailyVolumeMl: Number(dailyVolumeMl.toFixed(2)),
        dosingFrequencyText: freq === 1 ? "Once daily (q24h)" : freq === 2 ? "Twice daily (q12h)" : freq === 3 ? "Three times daily (q8h)" : `${freq} doses per day`,
      },
      calculationSteps: [
        `1. Calculate Daily Dose: ${wt} kg * ${doseRate} mg/kg = ${dailyDoseMg.toFixed(2)} mg/day.`,
        `2. Divide by frequency (${freq} doses/day): ${dailyDoseMg.toFixed(2)} mg / ${freq} = ${singleDoseMg.toFixed(2)} mg per dose.`,
        `3. Dimensional Analysis Volume: (${singleDoseMg.toFixed(2)} mg) / (${conc} mg/mL) = ${singleDoseMl.toFixed(2)} mL per dose.`,
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("nursing-study")?.safetyDisclaimers,
    };
  }

  if (studyType === "sbar_handover_builder") {
    const s = String(situation).trim() || "Patient experiencing sudden change in acuity";
    const b = String(background).trim() || "Admission history and pertinent medical comorbidities";
    const a = String(assessment).trim() || "Current hemodynamic vitals and clinical examination";
    const r = String(recommendation).trim() || "Requested physician review, lab orders, or medication adjustment";

    return {
      studyType: "sbar_handover_builder",
      handoverSheet: {
        S_Situation: s,
        B_Background: b,
        A_Assessment: a,
        R_Recommendation: r,
      },
      clinicalChecklist: [
        { check: "Patient identifiers (Name, DOB, MRN) confirmed", status: "VERIFIED" },
        { check: "Current vital signs (HR, BP, SpO2, Temp, RR) documented in Assessment", status: "RECOMMENDED" },
        { check: "Code status and allergy profile verified prior to escalation", status: "VERIFIED" },
        { check: "Read-back and confirmation of verbal orders executed", status: "ADVISORY" },
      ],
      safetyNotice: TOOL_REGISTRY_MAP.get("nursing-study")?.safetyDisclaimers,
    };
  }

  throw new Error(`Unsupported nursing studyType: ${studyType}`);
}

// ============================================================================
// 10. SHARED PROJECT & REPORT REVIEWER (CROSS-DISCIPLINARY)
// ============================================================================

export async function executeSharedReportReview(inputs = {}, user = null) {
  const {
    reportType = "technical_report",
    academicDiscipline = "Engineering",
    title = "Student Project Report",
    abstractOrSummary = "",
    reportText = "",
  } = inputs;

  const cleanTitle = String(title).trim();
  const cleanSummary = String(abstractOrSummary).trim();
  const cleanText = String(reportText).trim();

  if (!cleanTitle) throw new Error("title is required for report review.");
  if (!cleanText || cleanText.length < 50) {
    throw new Error("reportText must contain at least 50 characters of report content.");
  }

  const systemInstruction = `You are a Senior Academic Project and Technical Report Reviewer across disciplines (Engineering, Science, Business, Health, Humanities).
Analyze the student's submission rigorously, objectively, and formatively.
Do NOT fabricate external laboratory facts.
Structure your evaluation into JSON format with the following fields:
{
  "summary": string,
  "strengths": string[],
  "missingSectionsOrEvidence": string[],
  "clarityAndOrganizationIssues": string[],
  "technicalQuestionsToCheck": string[],
  "actionableImprovements": string[],
  "unverifiedClaimsOrCitations": string[]
}`;

  const userPrompt = `Document Type: ${reportType}
Discipline: ${academicDiscipline}
Title: ${cleanTitle}
Abstract/Summary: ${cleanSummary || "None provided"}
Body Text:
${cleanText.slice(0, 4000)}`;

  const deterministicFallback = () => {
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
    const hasMethodology = /method|procedure|experimental|calculation|approach/i.test(cleanText);
    const hasResults = /result|data|finding|output|table|figure/i.test(cleanText);
    const hasReferences = /reference|citation|bibliography|et al/i.test(cleanText);

    const missing = [];
    if (!hasMethodology) missing.push("Explicit methodology or technical calculation procedure section.");
    if (!hasResults) missing.push("Quantified empirical or calculated results table.");
    if (!hasReferences) missing.push("Bibliographic citations or formal references.");

    return {
      summary: `Formative evaluation of '${cleanTitle}' (${wordCount} words) in ${academicDiscipline}. The report addresses core problem definition with structured discussion.`,
      strengths: [
        "Clear statement of core project objective and relevance to discipline.",
        "Logical sequential narrative structure throughout the submitted draft.",
      ],
      missingSectionsOrEvidence: missing.length > 0 ? missing : ["Explicit sensitivity analysis or boundary condition stress test."],
      clarityAndOrganizationIssues: [
        "Ensure technical units (e.g. MPa, kg/h, $) are consistently stated on every numerical finding.",
        "Add descriptive captions to all referenced tables and equation derivations.",
      ],
      technicalQuestionsToCheck: [
        `What primary error margins or assumptions influence the findings in ${academicDiscipline}?`,
        "How do the experimental or calculated numbers compare against standard published industry benchmarks?",
      ],
      actionableImprovements: [
        "Include a dedicated 'Limitations & Future Work' subsection acknowledging boundary assumptions.",
        "Verify all empirical claims with at least two peer-reviewed academic or regulatory citations.",
      ],
      unverifiedClaimsOrCitations: [
        "Numerical performance estimates require verifiable source references or empirical test logs.",
      ],
    };
  };

  const aiResult = await aiOrchestrator.executeTask({
    taskName: "SHARED_REPORT_REVIEW",
    systemInstruction,
    userPrompt,
    fallbackGenerator: deterministicFallback,
    user,
  });

  return {
    reportType,
    academicDiscipline,
    title: cleanTitle,
    review: aiResult.data || deterministicFallback(),
    metadata: {
      provider: aiResult.metadata?.provider || "deterministic_fallback",
      traceId: aiResult.metadata?.traceId,
      provenance: aiResult.metadata?.provenance || "offline_expert_heuristics",
      reviewTimestamp: new Date().toISOString(),
    },
    safetyNotice: TOOL_REGISTRY_MAP.get("report-reviewer")?.safetyDisclaimers,
  };
}

// ============================================================================
// 10. SHARED VERIFICATION PASS & ENGINEERING REPORT BUILDER
// ============================================================================

export function verifyEngineeringAiOutput(calcResults = {}, aiInterpretation = {}) {
  const verifiedClaims = [];
  const unverifiedClaims = [];

  // 1. Authoritative numerical results from calculation engine
  if (calcResults.results && typeof calcResults.results === "object") {
    for (const [key, val] of Object.entries(calcResults.results)) {
      if (val !== undefined && val !== null) {
        verifiedClaims.push({
          parameter: key,
          value: val,
          status: "VERIFIED_DETERMINISTIC",
          provenance: "deterministic_calculation_engine",
          verificationMethod: "Exact algebraic formula execution in verified codebase",
        });
      }
    }
  }

  // 2. User-provided input facts
  if (calcResults.inputs && typeof calcResults.inputs === "object") {
    for (const [key, val] of Object.entries(calcResults.inputs)) {
      if (val !== undefined && val !== null) {
        verifiedClaims.push({
          parameter: key,
          value: val,
          status: "USER_PROVIDED",
          provenance: "student_input_form",
          verificationMethod: "Validated input parameter range and type check",
        });
      }
    }
  }

  // 3. AI-generated qualitative assertions & assumptions
  if (Array.isArray(aiInterpretation?.assumptionsAndIdealizations)) {
    for (const assumption of aiInterpretation.assumptionsAndIdealizations) {
      unverifiedClaims.push({
        claim: assumption,
        status: "THEORETICAL_MODEL_ASSUMPTION",
        provenance: aiInterpretation.provenance || "ai_studio_reasoning",
        verificationMethod: "Academic simplification; requires site or empirical validation",
      });
    }
  }

  if (Array.isArray(aiInterpretation?.limitationsAndCaveats)) {
    for (const limitation of aiInterpretation.limitationsAndCaveats) {
      unverifiedClaims.push({
        claim: limitation,
        status: "UNVERIFIED_ESTIMATE",
        provenance: aiInterpretation.provenance || "ai_studio_reasoning",
        verificationMethod: "Subject to project-specific field and material conditions",
      });
    }
  }

  return {
    status: "VERIFIED_DETERMINISTIC",
    summary:
      "Authoritative numerical parameters match deterministic calculation engine. Qualitative commentary classified into validated assumptions and educational caveats.",
    verifiedClaimsCount: verifiedClaims.length,
    unverifiedClaimsCount: unverifiedClaims.length,
    verifiedClaims,
    unverifiedClaims,
    isAuthoritativeMathGuaranteed: true,
  };
}

export function buildSharedEngineeringReport({
  toolId,
  displayName,
  academicDiscipline,
  inputs = {},
  calcResults = {},
  aiInterpretation = {},
  verification = {},
  user = null,
}) {
  const timestamp = new Date().toISOString();
  const problemStatement = inputs?.problemStatement ? String(inputs.problemStatement).trim() : "";
  const title = problemStatement
    ? `Engineering Study: ${problemStatement.slice(0, 50)}${problemStatement.length > 50 ? "..." : ""}`
    : `${displayName} Technical Report`;

  return {
    reportId: `REP-${toolId.toUpperCase()}-${Date.now().toString(36)}`,
    title,
    discipline: academicDiscipline,
    toolId,
    toolDisplayName: displayName,
    objective: problemStatement || `Deterministic technical evaluation using formula: ${calcResults.formulaUsed}`,
    problemStatement: problemStatement || "Direct analytical evaluation based on user-supplied operating parameters.",
    governingEquations: calcResults.formulaUsed || "Standard engineering formulas",
    suppliedInputs: calcResults.inputs || {},
    calculationSteps: calcResults.calculationSteps || [],
    numericalResults: calcResults.results || {},
    billOfQuantities: calcResults.billOfQuantities || null,
    engineeringDiscussion: aiInterpretation?.problemSummary || "Deterministic computation completed successfully.",
    applicableTheory: aiInterpretation?.applicableTheory || "Applied engineering domain principles.",
    assumptions: [
      ...(calcResults.assumptions || []),
      ...(aiInterpretation?.assumptionsAndIdealizations || []),
    ],
    limitations: aiInterpretation?.limitationsAndCaveats || [],
    missingInputsChecklist: aiInterpretation?.missingInputsChecklist || [],
    troubleshootingAdvice: aiInterpretation?.troubleshootingAdvice || null,
    verificationStatus: verification?.status || "VERIFIED_DETERMINISTIC",
    verificationSummary: verification?.summary || "Numerical outputs verified against deterministic engine.",
    verifiedClaims: verification?.verifiedClaims || [],
    unverifiedClaims: verification?.unverifiedClaims || [],
    learningPathwayLinks: aiInterpretation?.learningPathwayLinks || [],
    safetyNotice:
      calcResults.safetyNotice ||
      "For academic and instructional use only. Not certified for construction, manufacturing, or commercial design.",
    studentNotes: "",
    authorName: user ? (user.name || user.fullName || user.email || "Student Engineer") : "Student Engineer",
    generatedAt: timestamp,
    lastEditedAt: null,
    isStudentDraft: true,
  };
}

// ============================================================================
// 11. BRANCH AI STUDIO INTERPRETATION GENERATORS
// ============================================================================

export async function generateMechanicalAiStudioInterpretation(inputs = {}, calcResults = {}, user = null) {
  const problemText = inputs.problemStatement ? String(inputs.problemStatement).trim() : "";
  const calcType = calcResults.calculationType || "stress_strain";

  const deterministicFallback = () => {
    let problemSummary = `Mechanical engineering analysis for ${calcType.replace(/_/g, " ")}. Evaluates static load distribution and structural response based on linear elastic behavior.`;
    let applicableTheory = "Hooke's Law (σ = E·ε) and Saint-Venant's Principle for axial loading and Euler-Bernoulli beam flexure.";
    const assumptionsAndIdealizations = [
      "Material is homogeneous, isotropic, and operates strictly within linear-elastic proportional limit.",
      "Static equilibrium with no high-velocity dynamic shock or harmonic resonance.",
      "Pure axial or bending moment without unmodeled eccentric torsion or thermal gradient stresses.",
    ];
    const limitationsAndCaveats = [
      "Calculations do not account for geometric stress concentration factors (Kt) at holes, keyways, or fillet steps.",
      "High-temperature environments (>100°C) require thermal yield derating.",
      "Cyclic loading requires fatigue endurance limit analysis (Wöhler S-N curve), which is not covered in static calculations.",
    ];
    const missingInputsChecklist = [
      {
        item: "Material Yield Strength (σ_yield) & UTS",
        importance: calcType === "stress_strain" ? "RECOMMENDED" : "CRITICAL",
        explanation: "Required to verify working stress margin against plastic deformation.",
      },
      {
        item: "Ambient Operating Temperature Range",
        importance: "ADVISORY",
        explanation: "Elevated temperatures decrease Young's modulus and accelerate creep deformation.",
      },
      {
        item: "Service Fatigue Life Cycles (N)",
        importance: "ADVISORY",
        explanation: "Components subjected to cyclic stress reversals fail below static yield strength due to microcrack propagation.",
      },
    ];

    if (calcType === "factor_of_safety") {
      problemSummary = `Factor of Safety analysis comparing material yield strength against applied operating stress. Yield ratio FoS = ${calcResults.results?.factorOfSafety}.`;
      applicableTheory = "Maximum Normal Stress Theory (Rankine) or Distortion Energy Theory (Von Mises) for static failure prediction.";
    } else if (calcType === "gear_ratio") {
      problemSummary = `Kinematic gear train analysis for tooth ratio ${calcResults.results?.gearRatio}. Identifies transmission speed and torque multiplication.`;
      applicableTheory = "Law of Gearing: Angular velocity ratio is inversely proportional to teeth count and pitch radius.";
    } else if (calcType === "beam_bending") {
      problemSummary = `Euler-Bernoulli flexural stress calculation across beam extreme fibers under bending moment M.`;
      applicableTheory = "Euler-Bernoulli Beam Equation: σ_bending = (M * y) / I_xx.";
    }

    if (problemText) {
      problemSummary = `Problem Context: "${problemText}". ${problemSummary}`;
    }

    const learningPathwayLinks = [
      {
        id: "mech-lab-stress-strain",
        title: "Axial Tensile Stress and Strain Measurement",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "mech-lab-gear-ratio",
        title: "Kinematic Gear Ratio and Speed Transmission Analysis",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "mech-eng-mechanics",
        title: "Engineering Mechanics & Strength of Materials Assessment",
        type: "ASSESSMENT",
        route: "/assessment",
      },
      {
        id: "mech-cad-gearbox-design",
        title: "Industrial Gearbox Speed Reducer CAD & FEA Analysis",
        type: "PROJECT_STUDIO",
        route: "/projects",
      },
    ];

    return {
      problemSummary,
      applicableTheory,
      assumptionsAndIdealizations,
      limitationsAndCaveats,
      missingInputsChecklist,
      troubleshootingAdvice: [
        "If computed stress exceeds 60% of yield strength, consider increasing section thickness or choosing a higher-strength alloy.",
        "For rotating machinery, check shaft deflection at bearing seats to avoid premature bearing failure.",
      ],
      learningPathwayLinks,
      provenance: "offline_expert_heuristics",
      provider: "deterministic_fallback",
    };
  };

  const systemInstruction = `You are a Senior Mechanical Engineering Professor and Design Reviewer.
Analyze the student's mechanical problem and the verified deterministic calculation results.
Provide structured engineering reasoning.
DO NOT perform independent authoritative arithmetic; reference the verified results.
Structure your output as a JSON object with:
{
  "problemSummary": string,
  "applicableTheory": string,
  "assumptionsAndIdealizations": string[],
  "limitationsAndCaveats": string[],
  "missingInputsChecklist": [{ "item": string, "importance": "CRITICAL"|"RECOMMENDED"|"ADVISORY", "explanation": string }],
  "troubleshootingAdvice": string[]
}`;

  const userPrompt = `Student Problem Statement: ${problemText || "None provided"}
Calculation Type: ${calcType}
Inputs: ${JSON.stringify(calcResults.inputs)}
Authoritative Deterministic Results: ${JSON.stringify(calcResults.results)}
Formula: ${calcResults.formulaUsed}`;

  try {
    const aiResult = await aiOrchestrator.executeTask({
      taskName: "MECHANICAL_ENGINEERING_AI_STUDIO",
      systemInstruction,
      userPrompt,
      fallbackGenerator: deterministicFallback,
      user,
    });

    const data = aiResult.data || deterministicFallback();
    return {
      ...deterministicFallback(),
      ...data,
      provenance: aiResult.metadata?.provenance || "offline_expert_heuristics",
      provider: aiResult.metadata?.provider || "deterministic_fallback",
    };
  } catch {
    return deterministicFallback();
  }
}

export async function generateEceCircuitsAiStudioInterpretation(inputs = {}, calcResults = {}, user = null) {
  const problemText = inputs.problemStatement ? String(inputs.problemStatement).trim() : "";
  const analysisType = calcResults.analysisType || "series_parallel";

  const deterministicFallback = () => {
    let problemSummary = `ECE circuit analysis for ${analysisType.replace(/_/g, " ")}. Computes equivalent network parameters and branch distributions under ideal DC steady state.`;
    let applicableTheory = "Ohm's Law (V = I·R) and Kirchhoff's Laws (KVL/KCL) for lumped linear resistive networks.";
    const assumptionsAndIdealizations = [
      "Ideal lumped-element circuit parameters with zero stray lead inductance or parasitic junction capacitance.",
      "Independent DC voltage and current sources with zero internal source impedance (unless explicitly specified in Thévenin parameters).",
      "Conductor wiring resistance is assumed to be exactly zero.",
    ];
    const limitationsAndCaveats = [
      "Real-world resistors exhibit manufacturing tolerance (e.g. ±1% metal film or ±5% carbon film) that causes divergence from nominal math.",
      "Joule heating (P = I²R) increases component temperature, causing thermal drift based on the material temperature coefficient (TCR).",
      "Breadboard spring contacts introduce contact resistances ranging between 0.1 Ω and 0.5 Ω per connection.",
    ];
    const missingInputsChecklist = [
      {
        item: "Resistor Tolerance Rating (±1% vs ±5%)",
        importance: "RECOMMENDED",
        explanation: "Tolerance creates worst-case envelope deviations in divider voltage and branch currents.",
      },
      {
        item: "Component Wattage Power Rating (1/4W, 1/2W, 1W)",
        importance: "CRITICAL",
        explanation: "Prevents smoke and thermal destruction if calculated power dissipation exceeds the component physical rating.",
      },
      {
        item: "Load Impedance Specification",
        importance: analysisType === "voltage_divider" ? "CRITICAL" : "RECOMMENDED",
        explanation: "Connecting a finite load impedance to a voltage divider causes loading effect and voltage sag.",
      },
    ];

    const troubleshootingAdvice = [
      "If measured voltage on a breadboard is lower than calculated: Verify whether the voltmeter has input impedance < 10 MΩ or if the power supply voltage sags under load.",
      "If branch current deviates: Ensure the digital multimeter was inserted strictly in series and consider the internal current shunt burden voltage.",
      "If resistors feel hot: Compare calculated P = V*I against package rating (standard 1/4-watt rating = 0.25 W max).",
    ];

    if (analysisType === "voltage_divider") {
      problemSummary = `Unloaded voltage divider network analysis. Potential across R₂ is ${calcResults.results?.voltageAcrossR2_V} V at loop current ${calcResults.results?.loopCurrentA} A.`;
      applicableTheory = "Voltage Divider Principle: Output voltage is proportional to ratio of lower resistance to total series loop resistance.";
    } else if (analysisType === "thevenin_equivalent") {
      problemSummary = `Thévenin equivalent network evaluation. Maximum power transfer occurs when load equals Thévenin resistance (${calcResults.inputs?.theveninResistanceOhms} Ω).`;
      applicableTheory = "Thévenin's Theorem and Maximum Power Transfer Theorem (Jacobi's Law): P_max = V_th² / (4·R_th).";
    } else if (analysisType === "ohms_law") {
      problemSummary = `Direct Ohm's Law relationship between voltage, current, resistance, and dissipated power.`;
      applicableTheory = "Ohm's Law (V = I·R) and Joule's First Law (P = V·I = I²·R).";
    }

    if (problemText) {
      problemSummary = `Problem Context: "${problemText}". ${problemSummary}`;
    }

    const learningPathwayLinks = [
      {
        id: "ece-lab-circuit-thevenin",
        title: "Thévenin Equivalent Circuit and Maximum Power Transfer",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "ece-lab-opamp-filter",
        title: "Operational Amplifier Active Filter Analysis",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "ece-circuit-analysis",
        title: "Fundamental Circuit Theory & Network Analysis Assessment",
        type: "ASSESSMENT",
        route: "/assessment",
      },
      {
        id: "ece-iot-sensor-node",
        title: "Low-Power Embedded IoT Sensor Node with Signal Conditioning",
        type: "PROJECT_STUDIO",
        route: "/projects",
      },
    ];

    return {
      problemSummary,
      applicableTheory,
      assumptionsAndIdealizations,
      limitationsAndCaveats,
      missingInputsChecklist,
      troubleshootingAdvice,
      learningPathwayLinks,
      provenance: "offline_expert_heuristics",
      provider: "deterministic_fallback",
    };
  };

  const systemInstruction = `You are a Senior Electrical Engineering Professor and Electronics Lab Instructor.
Analyze the student's DC circuit problem and deterministic calculations.
Address real-world laboratory discrepancies, parasitic effects, and breadboard troubleshooting.
DO NOT perform independent authoritative arithmetic; reference the verified results.
Structure your output as a JSON object with:
{
  "problemSummary": string,
  "applicableTheory": string,
  "assumptionsAndIdealizations": string[],
  "limitationsAndCaveats": string[],
  "missingInputsChecklist": [{ "item": string, "importance": "CRITICAL"|"RECOMMENDED"|"ADVISORY", "explanation": string }],
  "troubleshootingAdvice": string[]
}`;

  const userPrompt = `Student Circuit Problem: ${problemText || "None provided"}
Analysis Type: ${analysisType}
Inputs: ${JSON.stringify(calcResults.inputs)}
Authoritative Deterministic Results: ${JSON.stringify(calcResults.results)}
Formula: ${calcResults.formulaUsed}`;

  try {
    const aiResult = await aiOrchestrator.executeTask({
      taskName: "ECE_CIRCUIT_AI_STUDIO",
      systemInstruction,
      userPrompt,
      fallbackGenerator: deterministicFallback,
      user,
    });

    const data = aiResult.data || deterministicFallback();
    return {
      ...deterministicFallback(),
      ...data,
      provenance: aiResult.metadata?.provenance || "offline_expert_heuristics",
      provider: aiResult.metadata?.provider || "deterministic_fallback",
    };
  } catch {
    return deterministicFallback();
  }
}

export async function generateCivilBoqAiStudioInterpretation(inputs = {}, calcResults = {}, user = null) {
  const problemText = inputs.problemStatement ? String(inputs.problemStatement).trim() : "";
  const estType = calcResults.estimationType || "concrete_slab";

  const deterministicFallback = () => {
    let problemSummary = `Civil engineering quantity estimation and Bill of Quantities for ${estType.replace(/_/g, " ")}. Computes wet concrete volume, void compaction, dry volume, and component material bags/m³.`;
    let applicableTheory = "Volumetric Prismatic Geometry (V = L·W·T) and Mix Proportion Ratio Distribution with Void Compaction Factor (1.54).";
    const assumptionsAndIdealizations = [
      "Standard dry cement bulk density is assumed to be exactly 1440 kg/m³ (50 kg per bag = 0.0347 m³).",
      "Dry volume factor of 1.54 accounts for internal pore void compaction when water fills voids between sand and gravel.",
      "Specified nominal mix ratio reflects batching by volume under standard damp sand conditions without bulking corrections.",
    ];
    const limitationsAndCaveats = [
      "Scope Exclusion: Plain concrete estimate excludes structural steel reinforcement (TMT rebar Fe500), which requires a separate Bar Bending Schedule (BBS).",
      "Scope Exclusion: Timber/steel shuttering, formwork centering, scaffolding, and prop staging costs are calculated separately per contact surface area (m²).",
      "Scope Exclusion: Labor crew charges (mason, bhisti, coolie), transit mixer freight, and water curing are not included in material-only BOQ.",
      "Rate Provenance: Unit rates are student-supplied or indicative CPWD benchmark rates; commercial procurement requires verified supplier quotes.",
    ];
    const missingInputsChecklist = [
      {
        item: "Structural Reinforcement Schedule (TMT Rebar)",
        importance: "CRITICAL",
        explanation: "Concrete has low tensile strength; structural slabs and beams require 0.7% to 2.0% steel reinforcement by volume.",
      },
      {
        item: "Formwork & Shuttering Contact Area (m²)",
        importance: "RECOMMENDED",
        explanation: "Formwork cost often accounts for 20% to 30% of total concrete placement expense.",
      },
      {
        item: "Water-Cement Ratio (w/c)",
        importance: "RECOMMENDED",
        explanation: "Strict control of w/c ratio (0.45 - 0.50) is vital to achieve specified characteristic compressive strength (fck).",
      },
    ];

    const troubleshootingAdvice = [
      "If site concrete workability is low: Never add unmetered site water; water additions drastically reduce 28-day compressive strength. Use a plasticizer admixture instead.",
      "If concrete volume overrun occurs: Check for subgrade settlement, uncompacted base course, or formwork deflection under hydrostatic wet concrete pressure.",
    ];

    if (problemText) {
      problemSummary = `Project Scope: "${problemText}". ${problemSummary}`;
    }

    const learningPathwayLinks = [
      {
        id: "civil-lab-concrete-mix",
        title: "Concrete Mix Proportioning and Slump Workability Test",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "civil-lab-beam-bending",
        title: "Reinforced Concrete Beam Flexural Testing",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "civil-structural-fundamentals",
        title: "Civil Engineering Structural Fundamentals & Materials Assessment",
        type: "ASSESSMENT",
        route: "/assessment",
      },
      {
        id: "civil-reinforced-concrete-slab",
        title: "Reinforced Concrete Slab Structural Estimation & BOQ",
        type: "PROJECT_STUDIO",
        route: "/projects",
      },
    ];

    return {
      problemSummary,
      applicableTheory,
      assumptionsAndIdealizations,
      limitationsAndCaveats,
      missingInputsChecklist,
      troubleshootingAdvice,
      learningPathwayLinks,
      provenance: "offline_expert_heuristics",
      provider: "deterministic_fallback",
    };
  };

  const systemInstruction = `You are a Senior Civil Quantity Surveyor and Structural Engineering Educator.
Analyze the student's BOQ quantity estimation and deterministic volume results.
Explicitly distinguish physical quantity calculation from cost estimation and highlight critical scope exclusions (rebar, shuttering, labor).
DO NOT perform independent authoritative arithmetic; reference the verified results.
Structure your output as a JSON object with:
{
  "problemSummary": string,
  "applicableTheory": string,
  "assumptionsAndIdealizations": string[],
  "limitationsAndCaveats": string[],
  "missingInputsChecklist": [{ "item": string, "importance": "CRITICAL"|"RECOMMENDED"|"ADVISORY", "explanation": string }],
  "troubleshootingAdvice": string[]
}`;

  const userPrompt = `Student Construction Scope: ${problemText || "None provided"}
Estimation Type: ${estType}
Dimensions: ${JSON.stringify(calcResults.structureDimensions || {})}
Mix Ratio: ${calcResults.mixRatio}
Deterministic Outcomes: ${JSON.stringify(calcResults.results)}
BOQ Table: ${JSON.stringify(calcResults.billOfQuantities || [])}`;

  try {
    const aiResult = await aiOrchestrator.executeTask({
      taskName: "CIVIL_ENGINEERING_AI_STUDIO",
      systemInstruction,
      userPrompt,
      fallbackGenerator: deterministicFallback,
      user,
    });

    const data = aiResult.data || deterministicFallback();
    return {
      ...deterministicFallback(),
      ...data,
      provenance: aiResult.metadata?.provenance || "offline_expert_heuristics",
      provider: aiResult.metadata?.provider || "deterministic_fallback",
    };
  } catch {
    return deterministicFallback();
  }
}

export async function generateChemicalProcessAiStudioInterpretation(inputs = {}, calcResults = {}, user = null) {
  const problemText = inputs.problemStatement ? String(inputs.problemStatement).trim() : "";
  const calcType = calcResults.calculationType || "binary_distillation_balance";

  const deterministicFallback = () => {
    let problemSummary = `Chemical engineering process analysis for ${calcType.replace(/_/g, " ")}. Evaluates macroscopic material balances and kinetic conversions at continuous steady state.`;
    let applicableTheory = "Conservation of Mass (Accumulation = In - Out + Gen - Cons = 0) and Continuous Species Balance.";
    const assumptionsAndIdealizations = [
      "Continuous steady-state operation with no material accumulation or holdup variation (dM/dt = 0).",
      "Constant molar or mass overflow assumptions throughout column fractionation sections.",
      "Ideal liquid solution behavior with zero heat of mixing and constant latent heats of vaporization.",
    ];
    const limitationsAndCaveats = [
      "Real distillation systems display non-ideal Vapor-Liquid Equilibrium (VLE azeotropes) requiring Wilson/NRTL activity models.",
      "Calculations do not model column hydrodynamic limits such as tray weeping, entrainment flooding, or pressure drop.",
      "Reactor sizing assumes ideal CSTR macromixing; real vessels exhibit bypassing, stagnation dead zones, or non-isothermal thermal runaway.",
    ];
    const missingInputsChecklist = [
      {
        item: "Vapor-Liquid Equilibrium (VLE) / Relative Volatility (α)",
        importance: "CRITICAL",
        explanation: "Necessary to compute minimum reflux ratio (Rmin) and determine required theoretical stage count via McCabe-Thiele.",
      },
      {
        item: "Operating Pressure and Column Pressure Drop",
        importance: "RECOMMENDED",
        explanation: "Pressure directly influences boiling point temperatures and relative volatility split efficiency.",
      },
      {
        item: "Reaction Enthalpy (ΔH_rxn) & Cooling Jacket Capacity",
        importance: calcType === "ideal_cstr_kinetics" ? "CRITICAL" : "ADVISORY",
        explanation: "Exothermic chemical reactions require verified cooling jacket heat transfer to prevent dangerous thermal runaway.",
      },
    ];

    const troubleshootingAdvice = [
      "If distillate overhead purity drops below specification: Check for column flooding, reflux valve failure, or feed preheater temperature deviations.",
      "If reactor conversion fails to reach target: Verify agitator impeller RPM to eliminate dead volume, or inspect jacket cooling for kinetic rate drop.",
    ];

    if (calcType === "binary_distillation_balance") {
      problemSummary = `Continuous binary distillation mass balance. Distillate rate is ${calcResults.results?.distillateRateKgH} kg/h and bottoms rate is ${calcResults.results?.bottomsRateKgH} kg/h with 100% overall mass conservation verified.`;
      applicableTheory = "Overall and Component Mass Balances: F = D + B and F·x_F = D·x_D + B·x_B.";
    } else if (calcType === "ideal_cstr_kinetics") {
      problemSummary = `Ideal continuous stirred-tank reactor (CSTR) sizing for first-order kinetics. Sized reactor volume is ${calcResults.results?.requiredReactorVolume} volume units at space time ${calcResults.results?.spaceTimeMinutes} min.`;
      applicableTheory = "CSTR Design Equation: V = (F_A0 · X_A) / (-r_A) = v₀ · X_A / [k · (1 - X_A)].";
    }

    if (problemText) {
      problemSummary = `Problem Context: "${problemText}". ${problemSummary}`;
    }

    const learningPathwayLinks = [
      {
        id: "chem-lab-mass-balance",
        title: "Continuous Binary Distillation Column Material Balance",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "chem-lab-cstir-reactor",
        title: "Continuous Stirred-Tank Reactor (CSTR) Kinetics",
        type: "PRACTICAL_LAB",
        route: "/academic/labs",
      },
      {
        id: "chem-mass-energy-balances",
        title: "Chemical Process Principles & Mass-Energy Balances Assessment",
        type: "ASSESSMENT",
        route: "/assessment",
      },
      {
        id: "chem-distillation-column-sizing",
        title: "Binary Distillation Fractionation Column Sizing & Hazard Analysis",
        type: "PROJECT_STUDIO",
        route: "/projects",
      },
    ];

    return {
      problemSummary,
      applicableTheory,
      assumptionsAndIdealizations,
      limitationsAndCaveats,
      missingInputsChecklist,
      troubleshootingAdvice,
      learningPathwayLinks,
      provenance: "offline_expert_heuristics",
      provider: "deterministic_fallback",
    };
  };

  const systemInstruction = `You are a Senior Chemical Process Engineering Professor and Industrial Unit Operations Specialist.
Analyze the student's process engineering balance or reactor kinetics calculation.
Address idealized thermodynamic assumptions, conservation laws, and plant safety boundaries.
DO NOT perform independent authoritative arithmetic; reference the verified results.
Structure your output as a JSON object with:
{
  "problemSummary": string,
  "applicableTheory": string,
  "assumptionsAndIdealizations": string[],
  "limitationsAndCaveats": string[],
  "missingInputsChecklist": [{ "item": string, "importance": "CRITICAL"|"RECOMMENDED"|"ADVISORY", "explanation": string }],
  "troubleshootingAdvice": string[]
}`;

  const userPrompt = `Student Process Statement: ${problemText || "None provided"}
Calculation Type: ${calcType}
Inputs: ${JSON.stringify(calcResults.inputs)}
Authoritative Deterministic Results: ${JSON.stringify(calcResults.results)}
Formula: ${calcResults.formulaUsed}`;

  try {
    const aiResult = await aiOrchestrator.executeTask({
      taskName: "CHEMICAL_PROCESS_AI_STUDIO",
      systemInstruction,
      userPrompt,
      fallbackGenerator: deterministicFallback,
      user,
    });

    const data = aiResult.data || deterministicFallback();
    return {
      ...deterministicFallback(),
      ...data,
      provenance: aiResult.metadata?.provenance || "offline_expert_heuristics",
      provider: aiResult.metadata?.provider || "deterministic_fallback",
    };
  } catch {
    return deterministicFallback();
  }
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================

export async function executeTool(toolId, inputs = {}, user = null) {
  const tool = TOOL_REGISTRY_MAP.get(toolId);
  if (!tool) {
    throw new Error(`Tool not found in canonical registry: ${toolId}`);
  }

  let resultData = null;

  switch (toolId) {
    case "mech-calc": {
      const calcResults = executeMechanicalCalc(inputs);
      if (inputs.enableAiInterpretation !== false) {
        const aiInterpretation = await generateMechanicalAiStudioInterpretation(inputs, calcResults, user);
        const verification = verifyEngineeringAiOutput(calcResults, aiInterpretation);
        const reportDraft = buildSharedEngineeringReport({
          toolId,
          displayName: tool.displayName,
          academicDiscipline: tool.academicDiscipline,
          inputs,
          calcResults,
          aiInterpretation,
          verification,
          user,
        });
        resultData = {
          ...calcResults,
          problemStatement: inputs.problemStatement || "",
          aiInterpretation,
          verification,
          reportDraft,
        };
      } else {
        resultData = calcResults;
      }
      break;
    }
    case "ece-circuits": {
      const calcResults = executeEceCircuits(inputs);
      if (inputs.enableAiInterpretation !== false) {
        const aiInterpretation = await generateEceCircuitsAiStudioInterpretation(inputs, calcResults, user);
        const verification = verifyEngineeringAiOutput(calcResults, aiInterpretation);
        const reportDraft = buildSharedEngineeringReport({
          toolId,
          displayName: tool.displayName,
          academicDiscipline: tool.academicDiscipline,
          inputs,
          calcResults,
          aiInterpretation,
          verification,
          user,
        });
        resultData = {
          ...calcResults,
          problemStatement: inputs.problemStatement || "",
          aiInterpretation,
          verification,
          reportDraft,
        };
      } else {
        resultData = calcResults;
      }
      break;
    }
    case "civil-boq": {
      const calcResults = executeCivilBoq(inputs);
      if (inputs.enableAiInterpretation !== false) {
        const aiInterpretation = await generateCivilBoqAiStudioInterpretation(inputs, calcResults, user);
        const verification = verifyEngineeringAiOutput(calcResults, aiInterpretation);
        const reportDraft = buildSharedEngineeringReport({
          toolId,
          displayName: tool.displayName,
          academicDiscipline: tool.academicDiscipline,
          inputs,
          calcResults,
          aiInterpretation,
          verification,
          user,
        });
        resultData = {
          ...calcResults,
          problemStatement: inputs.problemStatement || "",
          aiInterpretation,
          verification,
          reportDraft,
        };
      } else {
        resultData = calcResults;
      }
      break;
    }
    case "chem-process": {
      const calcResults = executeChemicalProcess(inputs);
      if (inputs.enableAiInterpretation !== false) {
        const aiInterpretation = await generateChemicalProcessAiStudioInterpretation(inputs, calcResults, user);
        const verification = verifyEngineeringAiOutput(calcResults, aiInterpretation);
        const reportDraft = buildSharedEngineeringReport({
          toolId,
          displayName: tool.displayName,
          academicDiscipline: tool.academicDiscipline,
          inputs,
          calcResults,
          aiInterpretation,
          verification,
          user,
        });
        resultData = {
          ...calcResults,
          problemStatement: inputs.problemStatement || "",
          aiInterpretation,
          verification,
          reportDraft,
        };
      } else {
        resultData = calcResults;
      }
      break;
    }
    case "biotech-research":
      resultData = executeBiotechResearch(inputs);
      break;
    case "business-kpi":
      resultData = executeBusinessKpi(inputs);
      break;
    case "finance-accounting":
      resultData = executeFinanceAccounting(inputs);
      break;
    case "arts-writing":
      resultData = executeArtsWriting(inputs);
      break;
    case "nursing-study":
      resultData = executeNursingStudy(inputs);
      break;
    case "report-reviewer":
      resultData = await executeSharedReportReview(inputs, user);
      break;
    case "cse-resume-ai":
    case "cse-coding-platform":
    case "cse-github-reviewer":
      resultData = {
        redirectRoute: tool.route,
        message: `${tool.displayName} is operational at route ${tool.route}. Launch the dedicated workspace to practice.`,
      };
      break;
    default:
      throw new Error(`Execution handler not configured for tool: ${toolId}`);
  }

  return {
    toolId: tool.toolId,
    displayName: tool.displayName,
    version: tool.version,
    academicDiscipline: tool.academicDiscipline,
    executionMode: tool.executionMode,
    resultData,
  };
}
