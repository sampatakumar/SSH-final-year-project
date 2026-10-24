import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { FlaskConical, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const ChemProcessWorkspace: React.FC = () => {
  const [calculationType, setCalculationType] = useState<string>("binary_distillation_balance");
  const [problemStatement, setProblemStatement] = useState<string>(
    "Continuous distillation separation of binary mixture at atmospheric pressure."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);
  const [inputs, setInputs] = useState<Record<string, any>>({
    feedRateKgH: 1000,
    feedCompositionX: 0.40,
    distillateCompositionX: 0.90,
    bottomsCompositionX: 0.05,
    targetConversion: 0.80,
    reactionRateConstant: 0.15,
    initialConcentrationMolar: 1.0,
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
      const data = await toolsApi.executeTool("chem-process", {
        calculationType,
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
    } catch (err: any) {
      setError(err.message || "Failed to solve chemical process equations.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Chemical Process AI Studio Study Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Chemical unit operation mass balance and kinetic sizing.",
        tags: ["Chemical Engineering", "Process", calculationType],
        isSaved: !isSaved,
      });
      setIsSaved(res.isSavedToPortfolio);
    } catch (err) {
      console.warn("Failed to toggle portfolio save:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "binary_distillation_balance", label: "Binary Distillation Split & Recovery" },
          { id: "ideal_cstr_kinetics", label: "Ideal CSTR Reactor Kinetics & Sizing" },
          { id: "conversion_concentration", label: "Reactant Conversion & Concentration" },
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
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <FlaskConical className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-foreground">Process Stream Parameters</h3>
          </div>

          <form onSubmit={handleRunCalculation} className="space-y-4">
            {/* Problem Statement & AI Studio Toggle */}
            <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Process Scenario / Plant Context
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-purple-500 focus:ring-purple-500 w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Continuous binary distillation of ethanol-water mixture..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-purple-500 outline-none leading-relaxed"
              />
            </div>

            {calculationType === "binary_distillation_balance" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Total Feed Mass Flow Rate F (kg/h) *
                  </label>
                  <input
                    type="number"
                    value={inputs.feedRateKgH}
                    onChange={(e) => handleInputChange("feedRateKgH", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Feed Light Component Mass Fraction (xF) [0.0 - 1.0] *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    value={inputs.feedCompositionX}
                    onChange={(e) => handleInputChange("feedCompositionX", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Distillate Overhead (xD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1.0"
                      value={inputs.distillateCompositionX}
                      onChange={(e) => handleInputChange("distillateCompositionX", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Bottoms Residue (xB)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.0"
                      max="0.99"
                      value={inputs.bottomsCompositionX}
                      onChange={(e) => handleInputChange("bottomsCompositionX", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {calculationType === "ideal_cstr_kinetics" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Volumetric Flow Rate v0 (L/min or m³/h) *
                  </label>
                  <input
                    type="number"
                    value={inputs.feedRateKgH}
                    onChange={(e) => handleInputChange("feedRateKgH", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 50"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Target Fractional Conversion XA (0.1 to 0.99) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="0.99"
                    value={inputs.targetConversion}
                    onChange={(e) => handleInputChange("targetConversion", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    1st Order Reaction Rate Constant k (1/min) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.reactionRateConstant}
                    onChange={(e) => handleInputChange("reactionRateConstant", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 0.15"
                    required
                  />
                </div>
              </>
            )}

            {calculationType === "conversion_concentration" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Initial Reactant Concentration CA0 (mol/L) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={inputs.initialConcentrationMolar}
                    onChange={(e) => handleInputChange("initialConcentrationMolar", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 1.0"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Fractional Conversion XA (0.0 to 1.0) *
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.0"
                    max="1.0"
                    value={inputs.targetConversion}
                    onChange={(e) => handleInputChange("targetConversion", e.target.value)}
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
              className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Balances & Reactor Kinetics...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Execute Chemical AI Studio Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <FlaskConical className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Chemical Stream Inputs</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter stream flow rates, compositions, or kinetic constants to solve steady-state
                  conservation balances.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                  Conservation Law / Performance Equation
                </div>
                <code className="text-xs font-mono text-purple-400 font-semibold">
                  {result.formulaUsed}
                </code>
              </div>

              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Process Output Streams</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Mass Conserved
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.results || {}).map(([key, val]) => (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-background/80 border border-border/50 text-left"
                    >
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{key}</div>
                      <div className="text-sm font-bold text-foreground mt-0.5 truncate">
                        {String(val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.calculationSteps && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">Step-by-Step Derivation</div>
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-border/40 font-mono text-xs text-foreground/90">
                    {result.calculationSteps.map((step: string, idx: number) => (
                      <div key={idx} className="leading-relaxed">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] leading-relaxed flex items-start gap-2">
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

export default ChemProcessWorkspace;
