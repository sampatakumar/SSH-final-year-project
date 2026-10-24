import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Cpu, Zap, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const EceCircuitsWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("series_parallel");
  const [inputs, setInputs] = useState<Record<string, any>>({
    sourceVoltageV: 12,
    resistors: "100, 220, 470",
    networkTopology: "series",
    loadResistance: 100,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("ece-circuits", {
        analysisType,
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Circuit analysis calculation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "series_parallel", label: "Series & Parallel Equivalent" },
          { id: "voltage_divider", label: "Voltage Divider Rule" },
          { id: "current_divider", label: "Current Divider Rule" },
          { id: "thevenin_equivalent", label: "Thévenin Equivalent & Max Power" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAnalysisType(tab.id);
              setResult(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              analysisType === tab.id
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-foreground">Circuit Parameters</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {analysisType === "series_parallel" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Network Topology
                  </label>
                  <select
                    value={inputs.networkTopology}
                    onChange={(e) => handleInputChange("networkTopology", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="series">Series Network (R_eq = Σ R_i)</option>
                    <option value="parallel">Parallel Network (1/R_eq = Σ 1/R_i)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Resistors in Ohms (Ω) — Comma Separated *
                  </label>
                  <input
                    type="text"
                    value={inputs.resistors}
                    onChange={(e) => handleInputChange("resistors", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 100, 220, 470"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Source DC Voltage (V)
                  </label>
                  <input
                    type="number"
                    value={inputs.sourceVoltageV}
                    onChange={(e) => handleInputChange("sourceVoltageV", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 12"
                  />
                </div>
              </>
            )}

            {analysisType === "voltage_divider" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Input Source Voltage V_in (V) *
                  </label>
                  <input
                    type="number"
                    value={inputs.sourceVoltageV}
                    onChange={(e) => handleInputChange("sourceVoltageV", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Resistors R₁, R₂ (Ω) *
                  </label>
                  <input
                    type="text"
                    value={inputs.resistors}
                    onChange={(e) => handleInputChange("resistors", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 1000, 4000"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Two series resistors where output voltage is taken across R₂.
                  </span>
                </div>
              </>
            )}

            {analysisType === "current_divider" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Total Input Current I_total (A) *
                  </label>
                  <input
                    type="number"
                    value={inputs.sourceVoltageV}
                    onChange={(e) => handleInputChange("sourceVoltageV", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Parallel Branch Resistors R₁, R₂ (Ω) *
                  </label>
                  <input
                    type="text"
                    value={inputs.resistors}
                    onChange={(e) => handleInputChange("resistors", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 10, 20"
                    required
                  />
                </div>
              </>
            )}

            {analysisType === "thevenin_equivalent" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Thévenin Voltage V_th (V) *
                    </label>
                    <input
                      type="number"
                      value={inputs.sourceVoltageV}
                      onChange={(e) => handleInputChange("sourceVoltageV", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Thévenin Resistance R_th (Ω) *
                    </label>
                    <input
                      type="text"
                      value={inputs.resistors}
                      onChange={(e) => handleInputChange("resistors", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      placeholder="e.g. 50"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Connected Load Resistor R_L (Ω) *
                  </label>
                  <input
                    type="number"
                    value={inputs.loadResistance}
                    onChange={(e) => handleInputChange("loadResistance", e.target.value)}
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
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Solving Circuit Network...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>Solve Circuit Equations</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output & Report Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Cpu className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Circuit Values</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter resistor values and source parameters to evaluate equivalent impedance,
                  branch currents, and Thévenin power transfer.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {/* Formula */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                  Circuit Formula
                </div>
                <code className="text-xs font-mono text-cyan-400 font-semibold">
                  {result.formulaUsed}
                </code>
              </div>

              {/* Primary Output Numbers */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Calculated Network Values</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified DC Circuit
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

              {/* Step-by-step reasoning */}
              {result.calculationSteps && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">Step-by-Step Circuit Solution</div>
                  <div className="space-y-1.5 p-3 rounded-lg bg-muted/20 border border-border/40 font-mono text-xs text-foreground/90">
                    {result.calculationSteps.map((step: string, idx: number) => (
                      <div key={idx} className="leading-relaxed">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Disclaimers */}
              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] leading-relaxed flex items-start gap-2">
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
