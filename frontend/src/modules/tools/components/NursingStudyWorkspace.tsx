import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Stethoscope, ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, Activity, FileSpreadsheet, HeartPulse } from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const NursingStudyWorkspace: React.FC = () => {
  const [studyType, setStudyType] = useState<string>("pediatric_dosage_calc");
  const [problemStatement, setProblemStatement] = useState<string>(
    "Pediatric clinical dosage verification for amoxicillin oral suspension and SBAR bedside handover communication."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);

  const [inputs, setInputs] = useState<Record<string, any>>({
    patientWeightKg: 18,
    prescribedDosePerKg: 15,
    medicationConcentrationMgPerMl: 50,
    dosesPerDay: 3,
    situation: "Patient in Room 412 has experienced an acute drop in oxygen saturation to 88% on room air.",
    background: "62-year-old admitted yesterday with Community-Acquired Pneumonia; history of COPD and hypertension.",
    assessment: "Tachycardic at 112 bpm, tachypneic at 26 breaths/min with bilateral lower lobe coarse crackles.",
    recommendation: "Requesting urgent physician bedside review, order for supplemental O2 via nasal cannula, and arterial blood gas.",
    medicalTermOrAbbreviation: "q.d.",
    caseVignette: "Fictional academic scenario: A 7-year-old child presents with sudden onset wheezing and urticaria 20 minutes after peanut ingestion.",
    studentClinicalDecision: "Administer intramuscular epinephrine (1:1000) into anterolateral thigh immediately and call rapid response.",
    physiologicalSystem: "Cardiovascular baroreceptor reflex loop during orthostatic hypotension.",
    healthcarePaperAbstract: "Clinical trial assessing early mobilization in postoperative knee arthroplasty patients.",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

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
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
    } catch (err: any) {
      setError(err.message || "Failed to execute clinical study calculation.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Nursing & Healthcare Clinical Study Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Dosage calculation proof, SBAR handover, and clinical judgment practice.",
        tags: ["Nursing & Healthcare", "Clinical Calculations", studyType],
        isSaved: !isSaved,
      });
      setIsSaved(res.isSavedToPortfolio);
    } catch (err) {
      console.warn("Failed to toggle portfolio save:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prominent Educational Notice */}
      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
        <div className="leading-relaxed">
          <strong className="text-rose-200">ACADEMIC CLINICAL PRACTICE ONLY:</strong> This tool is
          designed strictly for student training, dimensional dosage practice, and simulated SBAR handover.
          It must never be used for real patient dosing, triage decisions, or actual hospital prescribing.
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "pediatric_dosage_calc", label: "Pediatric & Adult Dosage Arithmetic" },
          { id: "sbar_handover_builder", label: "Standardized SBAR Handover Sheet" },
          { id: "medical_terminology", label: "Medical Terminology & ISMP Flags" },
          { id: "educational_case_study", label: "Educational Case Study (CJMM)" },
          { id: "anatomy_physiology_explainer", label: "Anatomy & Physiology Loops" },
          { id: "healthcare_research_summary", label: "Healthcare Research Appraisal" },
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
            {/* Problem Statement & AI Studio Toggle */}
            <div className="p-3 rounded-lg border border-pink-500/20 bg-pink-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Clinical Scenario / Patient Context
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-pink-500 focus:ring-pink-500 w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Pediatric clinical dosage verification for amoxicillin..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-pink-500 outline-none leading-relaxed"
              />
            </div>

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
                      onChange={(e) => handleInputChange("patientWeightKg", Number(e.target.value))}
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
                      step="0.5"
                      value={inputs.prescribedDosePerKg}
                      onChange={(e) => handleInputChange("prescribedDosePerKg", Number(e.target.value))}
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
                      step="0.5"
                      value={inputs.medicationConcentrationMgPerMl}
                      onChange={(e) => handleInputChange("medicationConcentrationMgPerMl", Number(e.target.value))}
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
                  <textarea
                    rows={2}
                    value={inputs.situation}
                    onChange={(e) => handleInputChange("situation", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Patient name, room number, acute problem..."
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Background (B) *
                  </label>
                  <textarea
                    rows={2}
                    value={inputs.background}
                    onChange={(e) => handleInputChange("background", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Admission diagnosis, medical history, baseline..."
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Assessment (A) *
                  </label>
                  <textarea
                    rows={2}
                    value={inputs.assessment}
                    onChange={(e) => handleInputChange("assessment", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Vital signs, clinical findings, clinical impression..."
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Recommendation (R) *
                  </label>
                  <textarea
                    rows={2}
                    value={inputs.recommendation}
                    onChange={(e) => handleInputChange("recommendation", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Requested tests, interventions, doctor review..."
                    required
                  />
                </div>
              </>
            )}

            {studyType === "medical_terminology" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Medical Term or Abbreviation (e.g. q.d., U, bradycardia, dyspnea) *
                </label>
                <input
                  type="text"
                  value={inputs.medicalTermOrAbbreviation}
                  onChange={(e) => handleInputChange("medicalTermOrAbbreviation", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                  placeholder="e.g. q.d. or dyspnea"
                  required
                />
                <span className="text-[10px] text-muted-foreground mt-1 block">
                  Checks ISMP 'Do Not Use' dangerous abbreviation list and decomposes prefixes/suffixes.
                </span>
              </div>
            )}

            {studyType === "educational_case_study" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Fictional Clinical Case Vignette *
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.caseVignette}
                    onChange={(e) => handleInputChange("caseVignette", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Student Clinical Decision / Priority Action *
                  </label>
                  <textarea
                    rows={2}
                    value={inputs.studentClinicalDecision}
                    onChange={(e) => handleInputChange("studentClinicalDecision", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {studyType === "anatomy_physiology_explainer" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Physiological System / Homeostatic Mechanism *
                </label>
                <input
                  type="text"
                  value={inputs.physiologicalSystem}
                  onChange={(e) => handleInputChange("physiologicalSystem", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                  required
                />
              </div>
            )}

            {studyType === "healthcare_research_summary" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Healthcare Study Text / Abstract *
                </label>
                <textarea
                  rows={5}
                  value={inputs.healthcarePaperAbstract}
                  onChange={(e) => handleInputChange("healthcarePaperAbstract", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                  required
                />
              </div>
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
                  <span>Verifying Dosage & Handover...</span>
                </>
              ) : (
                <>
                  <Stethoscope className="w-4 h-4" />
                  <span>Verify Dosage & SBAR Handover</span>
                  <span className="sr-only">Calculate Study Exercise</span>
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
                  Enter pediatric dosage figures for dimensional analysis validation, draft SBAR handover
                  sheets, evaluate dangerous clinical abbreviations, or practice clinical judgment models.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Standard Nursing Arithmetic / Clinical Framework
                  </div>
                  <code className="text-xs font-mono text-pink-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {/* ISMP Danger Alert */}
              {result.isDangerousAbbreviation && (
                <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-2 text-rose-200">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>ISMP 'DO NOT USE' DANGEROUS ABBREVIATION DETECTED</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Standard Replacement:</strong> {result.prohibitedAbbreviationDetails?.preferredTerm || "Write out explicitly in full."}
                  </p>
                  <p className="text-[11px] text-rose-300/80">
                    {result.prohibitedAbbreviationDetails?.rationale}
                  </p>
                </div>
              )}

              {/* Dosage Calculation Results */}
              {result.results && (typeof result.results.volumeMlPerDose !== "undefined" || typeof result.results.singleDoseVolumeMl !== "undefined") && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Dosage Arithmetic Verification</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Dimensional Math Checked
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Dose / Admin (mg)</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {result.results.singleDoseMg} mg
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                      <div className="text-[10px] text-pink-400 font-semibold">Admin Volume / Dose</div>
                      <div className="text-base font-bold text-pink-400 mt-0.5 font-mono">
                        {result.results.volumeMlPerDose ?? result.results.singleDoseVolumeMl} mL
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Total Daily Dose</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {result.results.totalDailyDoseMg} mg
                      </div>
                    </div>
                  </div>

                  {result.results.dosingFrequencyText && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-background/80 border border-border/50 text-xs">
                      <span className="text-[10px] text-muted-foreground block">Dosing Frequency</span>
                      <span className="font-semibold text-foreground">{result.results.dosingFrequencyText}</span>
                    </div>
                  )}

                  {result.dimensionalAnalysisSteps && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-border/50">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground mb-1.5">
                        Dimensional Analysis Verification Proof
                      </div>
                      <ol className="list-decimal list-inside text-xs font-mono space-y-1 text-foreground/80">
                        {result.dimensionalAnalysisSteps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* SBAR Formatted Card */}
              {result.sbar && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-pink-400" />
                    <span>Structured SBAR Clinical Handover</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 text-xs">
                    <strong className="text-pink-400 block mb-0.5">S — Situation</strong>
                    <p className="text-foreground/90">{result.sbar.situation}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 text-xs">
                    <strong className="text-pink-400 block mb-0.5">B — Background</strong>
                    <p className="text-foreground/90">{result.sbar.background}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 text-xs">
                    <strong className="text-pink-400 block mb-0.5">A — Assessment</strong>
                    <p className="text-foreground/90">{result.sbar.assessment}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background/80 border border-border/50 text-xs">
                    <strong className="text-pink-400 block mb-0.5">R — Recommendation</strong>
                    <p className="text-foreground/90">{result.sbar.recommendation}</p>
                  </div>
                </div>
              )}

              {/* Case Study Feedback */}
              {result.caseAnalysis && (
                <div className="p-3.5 rounded-lg bg-background/80 border border-border/60 space-y-2">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-pink-400" />
                    <span>Clinical Judgment Measurement Model (CJMM) Feedback</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.caseAnalysis.clinicalReasoning}
                  </p>
                </div>
              )}

              {/* Non-negotiable Clinical Disclaimer */}
              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
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
                    sectionTitles={{
                      objectiveTitle: "Clinical Learning Objective & Case Context",
                      formulasTitle: "Dimensional Analysis & Clinical Standards",
                      resultsTitle: "Verified Dosage Arithmetic & SBAR Handover",
                      discussionTitle: "Clinical Study & Patient Safety Analysis",
                      missingInputsTitle: "Missing Clinical Vitals & Assessment Gaps",
                      troubleshootingTitle: "Safe Administration & Monitoring Practices",
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

export default NursingStudyWorkspace;
