import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import {
  Wrench,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const MechanicalCalcWorkspace: React.FC = () => {
  const [calculationType, setCalculationType] = useState<string>("stress_strain");
  const [problemStatement, setProblemStatement] = useState<string>(
    "Tensile testing of mild steel specimen under 50 kN axial tensile load."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);
  const [inputs, setInputs] = useState<Record<string, any>>({
    forceN: 50000,
    areaMm2: 250,
    originalLengthMm: 1000,
    changeInLengthMm: 1.0,
    yieldStrengthMpa: 300,
    appliedStressMpa: 150,
    teethDriving: 20,
    teethDriven: 60,
    inputRpm: 1800,
    inputTorqueNm: 50,
    efficiencyPercent: 95,
    bendingMomentNm: 500,
    distanceFromNeutralAxisMm: 50,
    momentOfInertiaMm4: 2000000,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunCalculation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("mech-calc", {
        calculationType,
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
    } catch (err: any) {
      setError(err.message || "Failed to execute mechanical calculation.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Mechanical AI Studio Study Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Axial stress and strain mechanical analysis.",
        tags: ["Mechanical Engineering", "Strength of Materials", calculationType],
        isSaved: !isSaved,
      });
      setIsSaved(res.isSavedToPortfolio);
    } catch (err) {
      console.warn("Failed to toggle portfolio save:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "stress_strain", label: "Stress & Strain Analysis" },
          { id: "factor_of_safety", label: "Factor of Safety (FoS)" },
          { id: "gear_ratio", label: "Gear Train Ratio & Speed" },
          { id: "beam_bending", label: "Euler-Bernoulli Beam Bending" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setCalculationType(tab.id);
              setResult(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              calculationType === tab.id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Calculator className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Verified Input Parameters</h3>
          </div>

          <form onSubmit={handleRunCalculation} className="space-y-4">
            {/* Problem Statement & AI Studio Context */}
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Problem Statement & Context
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Tensile test of mild steel tie rod under 50 kN load..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
              />
            </div>

            {calculationType === "stress_strain" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Axial Load Force (F) in Newtons (N) *
                  </label>
                  <input
                    type="number"
                    value={inputs.forceN}
                    onChange={(e) => handleInputChange("forceN", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 50000"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Axial tensile or compressive load passing through centroid.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Cross-Sectional Area (A) in mm² *
                  </label>
                  <input
                    type="number"
                    value={inputs.areaMm2}
                    onChange={(e) => handleInputChange("areaMm2", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 250"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Transverse area perpendicular to load.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Original Length L₀ (mm)
                    </label>
                    <input
                      type="number"
                      value={inputs.originalLengthMm}
                      onChange={(e) => handleInputChange("originalLengthMm", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Elongation ΔL (mm)
                    </label>
                    <input
                      type="number"
                      value={inputs.changeInLengthMm}
                      onChange={(e) => handleInputChange("changeInLengthMm", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {calculationType === "factor_of_safety" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Material Yield Strength σ_yield (MPa) *
                  </label>
                  <input
                    type="number"
                    value={inputs.yieldStrengthMpa}
                    onChange={(e) => handleInputChange("yieldStrengthMpa", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Applied / Maximum Working Stress σ_applied (MPa) *
                  </label>
                  <input
                    type="number"
                    value={inputs.appliedStressMpa}
                    onChange={(e) => handleInputChange("appliedStressMpa", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
              </>
            )}

            {calculationType === "gear_ratio" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Driving Gear Teeth (N₁) *
                    </label>
                    <input
                      type="number"
                      value={inputs.teethDriving}
                      onChange={(e) => handleInputChange("teethDriving", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Driven Gear Teeth (N₂) *
                    </label>
                    <input
                      type="number"
                      value={inputs.teethDriven}
                      onChange={(e) => handleInputChange("teethDriven", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Input Speed (RPM)
                    </label>
                    <input
                      type="number"
                      value={inputs.inputRpm}
                      onChange={(e) => handleInputChange("inputRpm", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Input Torque (N·m)
                    </label>
                    <input
                      type="number"
                      value={inputs.inputTorqueNm}
                      onChange={(e) => handleInputChange("inputTorqueNm", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Gearbox Efficiency (%)
                  </label>
                  <input
                    type="number"
                    value={inputs.efficiencyPercent}
                    onChange={(e) => handleInputChange("efficiencyPercent", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </>
            )}

            {calculationType === "beam_bending" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Bending Moment M (N·m) *
                  </label>
                  <input
                    type="number"
                    value={inputs.bendingMomentNm}
                    onChange={(e) => handleInputChange("bendingMomentNm", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Fiber Distance from Neutral Axis y (mm) *
                  </label>
                  <input
                    type="number"
                    value={inputs.distanceFromNeutralAxisMm}
                    onChange={(e) => handleInputChange("distanceFromNeutralAxisMm", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Second Moment of Area I (mm⁴) *
                  </label>
                  <input
                    type="number"
                    value={inputs.momentOfInertiaMm4}
                    onChange={(e) => handleInputChange("momentOfInertiaMm4", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
              </>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Computing Formulas...</span>
                </>
              ) : (
                <>
                  <Wrench className="w-4 h-4" />
                  <span>Compute Engineering Calculation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output & Report Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Calculator className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Input Parameters</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Specify the dimensions, forces, or transmission ratios on the left and click Compute.
                  The deterministic engine will calculate step-by-step verified results.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {/* Formula Badge */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                  Theoretical Governing Formula
                </div>
                <code className="text-xs font-mono text-primary font-semibold">
                  {result.formulaUsed}
                </code>
              </div>

              {/* Primary Output Numbers */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Computed Outcomes</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Exact Deterministic Math
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.results || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-background/80 border border-border/50 text-left"
                    >
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{key}</div>
                      <div className="text-base font-bold text-foreground mt-0.5 truncate">
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step by Step Breakdown */}
              {result.calculationSteps && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">Calculation Steps & Derivations</div>
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-border/40 font-mono text-xs text-foreground/90">
                    {result.calculationSteps.map((step: string, idx: number) => (
                      <div key={idx} className="leading-relaxed">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Design Review Checklist */}
              {result.reviewChecklist && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">
                    Mechanical Design Review Checklist
                  </div>
                  <div className="space-y-1.5">
                    {result.reviewChecklist.map((chk: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-between text-xs"
                      >
                        <span className="text-foreground/90">{chk.item}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium ${
                            chk.status === "VERIFIED"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : chk.status === "RECOMMENDED"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Disclaimers */}
              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{result.safetyNotice}</span>
                </div>
              )}

              {/* Shared Engineering Report Builder */}
              {result.reportDraft && (
                <div className="pt-2">
                  <SharedEngineeringReportBuilder
                    reportDraft={result.reportDraft}
                    activityRecordId={activityRecordId}
                    isSavedToPortfolio={isSaved}
                    onSaveToPortfolio={handleTogglePortfolio}
                    onUpdateDraft={(updated) => {
                      setResult((prev: any) => ({ ...prev, reportDraft: updated }));
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
