import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { FlaskConical, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const ChemProcessWorkspace: React.FC = () => {
  const [calculationType, setCalculationType] = useState<string>("binary_distillation_balance");
  const [inputs, setInputs] = useState<Record<string, any>>({
    feedRateKgH: 1000,
    feedCompositionX: 0.40,
    distillateCompositionX: 0.90,
    bottomsCompositionX: 0.05,
    targetConversion: 0.80,
    reactionRateConstant: 0.15,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to solve chemical process equations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "binary_distillation_balance", label: "Binary Distillation Split & Recovery" },
          { id: "ideal_cstr_kinetics", label: "Ideal CSTR Reactor Kinetics & Sizing" },
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
                    Feed Light Component Mass Fraction x_F (0.0 - 1.0) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={inputs.feedCompositionX}
                    onChange={(e) => handleInputChange("feedCompositionX", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Distillate x_D *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={inputs.distillateCompositionX}
                      onChange={(e) => handleInputChange("distillateCompositionX", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Bottoms x_B *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
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
                    Volumetric Flow Rate v₀ (L/min or m³/h) *
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
                    Target Fractional Conversion X_A (0.0 - 1.0) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    value={inputs.targetConversion}
                    onChange={(e) => handleInputChange("targetConversion", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Reaction Rate Constant k (min⁻¹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputs.reactionRateConstant}
                    onChange={(e) => handleInputChange("reactionRateConstant", e.target.value)}
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
              className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Solving Mass Balances...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Execute Process Calculation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Card */}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
