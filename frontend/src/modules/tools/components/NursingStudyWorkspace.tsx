import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Stethoscope, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const NursingStudyWorkspace: React.FC = () => {
  const [studyType, setStudyType] = useState<string>("pediatric_dosage_calc");
  const [inputs, setInputs] = useState<Record<string, any>>({
    patientWeightKg: 18,
    prescribedDosePerKg: 15,
    medicationConcentrationMgPerMl: 50,
    dosesPerDay: 3,
    situation: "Patient in Room 412 has experienced an acute drop in oxygen saturation to 88%.",
    background: "62-year-old admitted yesterday with Community-Acquired Pneumonia; history of COPD.",
    assessment: "Tachycardic at 112 bpm, tachypneic at 26 breaths/min with bilateral lower lobe crackles.",
    recommendation: "Requesting urgent physician bedside review and order for supplemental O2 via nasal cannula.",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("nursing-study", {
        studyType,
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to execute clinical study calculation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Educational Notice */}
      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-rose-200">ACADEMIC CLINICAL PRACTICE ONLY:</strong> This tool is
          designed strictly for student training and dosage arithmetic practice. It must never be used
          for real patient dosing, triage decisions, or actual hospital prescribing.
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "pediatric_dosage_calc", label: "Pediatric & Adult Dosage Arithmetic" },
          { id: "sbar_handover_builder", label: "Standardized SBAR Clinical Handover Sheet" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStudyType(tab.id);
              setResult(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              studyType === tab.id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Stethoscope className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-foreground">Clinical Practice Parameters</h3>
          </div>

          <form onSubmit={handleRunStudy} className="space-y-4">
            {studyType === "pediatric_dosage_calc" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Patient Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={inputs.patientWeightKg}
                      onChange={(e) => handleInputChange("patientWeightKg", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Prescribed Dose (mg/kg/day) *
                    </label>
                    <input
                      type="number"
                      value={inputs.prescribedDosePerKg}
                      onChange={(e) => handleInputChange("prescribedDosePerKg", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Stock Concentration (mg/mL) *
                    </label>
                    <input
                      type="number"
                      value={inputs.medicationConcentrationMgPerMl}
                      onChange={(e) => handleInputChange("medicationConcentrationMgPerMl", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Doses Per Day (Frequency) *
                    </label>
                    <select
                      value={inputs.dosesPerDay}
                      onChange={(e) => handleInputChange("dosesPerDay", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    >
                      <option value={1}>Once Daily (q24h)</option>
                      <option value={2}>Twice Daily (q12h)</option>
                      <option value={3}>Three Times Daily (q8h)</option>
                      <option value={4}>Four Times Daily (q6h)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {studyType === "sbar_handover_builder" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Situation (S) *
                  </label>
                  <input
                    type="text"
                    value={inputs.situation}
                    onChange={(e) => handleInputChange("situation", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Background (B) *
                  </label>
                  <input
                    type="text"
                    value={inputs.background}
                    onChange={(e) => handleInputChange("background", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Assessment (A) *
                  </label>
                  <input
                    type="text"
                    value={inputs.assessment}
                    onChange={(e) => handleInputChange("assessment", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Recommendation (R) *
                  </label>
                  <input
                    type="text"
                    value={inputs.recommendation}
                    onChange={(e) => handleInputChange("recommendation", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
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
              className="w-full py-2.5 px-4 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Dimensional Math...</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>Calculate Study Exercise</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Stethoscope className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Clinical Practice Parameters</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter patient weight and prescribed dosage rate to practice dimensional analysis,
                  unit conversions, and SBAR communication protocols.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Dimensional Analysis Formula
                  </div>
                  <code className="text-xs font-mono text-pink-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {result.results && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Dosage Arithmetic Results</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Calculated Practice Case
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Total Daily Dose</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {result.results.totalDailyDoseMg} mg
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Single Dose (mg)</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {result.results.singleDoseMg} mg
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                      <div className="text-[10px] text-pink-400 font-semibold">Volume per Dose (mL)</div>
                      <div className="text-base font-bold text-pink-400 mt-0.5 font-mono">
                        {result.results.singleDoseVolumeMl} mL
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Frequency</div>
                      <div className="text-xs font-bold text-foreground mt-0.5">
                        {result.results.dosingFrequencyText}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step-by-Step Dimensional Analysis */}
              {result.calculationSteps && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">
                    Dimensional Analysis Verification
                  </div>
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-border/40 font-mono text-xs text-foreground/90">
                    {result.calculationSteps.map((step: string, idx: number) => (
                      <div key={idx} className="leading-relaxed">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SBAR Handover Sheet */}
              {result.handoverSheet && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-foreground">Standardized SBAR Handover Sheet</div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2 text-xs">
                    <div>
                      <strong className="text-pink-400 font-mono">S (Situation):</strong>{" "}
                      <span className="text-foreground/90">{result.handoverSheet.S_Situation}</span>
                    </div>
                    <div>
                      <strong className="text-pink-400 font-mono">B (Background):</strong>{" "}
                      <span className="text-foreground/90">{result.handoverSheet.B_Background}</span>
                    </div>
                    <div>
                      <strong className="text-pink-400 font-mono">A (Assessment):</strong>{" "}
                      <span className="text-foreground/90">{result.handoverSheet.A_Assessment}</span>
                    </div>
                    <div>
                      <strong className="text-pink-400 font-mono">R (Recommendation):</strong>{" "}
                      <span className="text-foreground/90">{result.handoverSheet.R_Recommendation}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{result.safetyNotice}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
