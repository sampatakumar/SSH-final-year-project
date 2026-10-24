import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Briefcase, TrendingUp, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const BusinessKpiWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("breakeven_margin_of_safety");
  const [inputs, setInputs] = useState<Record<string, any>>({
    fixedCosts: 15000,
    unitSellingPrice: 50,
    unitVariableCost: 20,
    currentSalesUnits: 750,
    marketingSpend: 12000,
    customersAcquired: 150,
    averageOrderValue: 120,
    purchaseFrequency: 2,
    customerLifespanYears: 3,
    caseText: "A high-growth direct-to-consumer sustainable apparel brand with strong customer retention.",
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
      const data = await toolsApi.executeTool("business-kpi", {
        analysisType,
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to calculate business unit economics.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "breakeven_margin_of_safety", label: "Break-Even & Margin of Safety" },
          { id: "cac_ltv_unit_economics", label: "CAC, LTV & Unit Economics Multiple" },
          { id: "swot_structuring", label: "Strategic SWOT Analysis Matrix" },
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
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-foreground">Economic Assumptions</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {analysisType === "breakeven_margin_of_safety" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Periodic Fixed Costs ($) *
                  </label>
                  <input
                    type="number"
                    value={inputs.fixedCosts}
                    onChange={(e) => handleInputChange("fixedCosts", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 15000"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Selling Price / Unit ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.unitSellingPrice}
                      onChange={(e) => handleInputChange("unitSellingPrice", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Variable Cost / Unit ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.unitVariableCost}
                      onChange={(e) => handleInputChange("unitVariableCost", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Current / Target Sales Volume (Units)
                  </label>
                  <input
                    type="number"
                    value={inputs.currentSalesUnits}
                    onChange={(e) => handleInputChange("currentSalesUnits", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 750"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Used to calculate Margin of Safety buffer.
                  </span>
                </div>
              </>
            )}

            {analysisType === "cac_ltv_unit_economics" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Marketing Spend ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.marketingSpend}
                      onChange={(e) => handleInputChange("marketingSpend", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Customers Acquired *
                    </label>
                    <input
                      type="number"
                      value={inputs.customersAcquired}
                      onChange={(e) => handleInputChange("customersAcquired", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">AOV ($) *</label>
                    <input
                      type="number"
                      value={inputs.averageOrderValue}
                      onChange={(e) => handleInputChange("averageOrderValue", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Freq/Yr *</label>
                    <input
                      type="number"
                      value={inputs.purchaseFrequency}
                      onChange={(e) => handleInputChange("purchaseFrequency", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Lifespan (Yrs) *</label>
                    <input
                      type="number"
                      value={inputs.customerLifespanYears}
                      onChange={(e) => handleInputChange("customerLifespanYears", e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {analysisType === "swot_structuring" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Strategic Case Text / Problem Context
                </label>
                <textarea
                  rows={4}
                  value={inputs.caseText}
                  onChange={(e) => handleInputChange("caseText", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Paste business case scenario or company profile..."
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
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Economics...</span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  <span>Analyze Business Model</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Briefcase className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Business Model Assumptions</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter costs and pricing structure to evaluate break-even volumes, safety margins,
                  and LTV:CAC venture multiples.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Governing Financial Formula
                  </div>
                  <code className="text-xs font-mono text-indigo-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {/* Number Results */}
              {result.results && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Key Performance Indicators</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Calculated Model
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.entries(result.results).map(([key, val]) => (
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
              )}

              {/* SWOT Matrix Card */}
              {result.matrix && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-400">Strengths</span>
                    <ul className="list-disc list-inside text-[11px] text-foreground/80 space-y-1">
                      {result.matrix.strengths.map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                    <span className="text-xs font-bold text-rose-400">Weaknesses</span>
                    <ul className="list-disc list-inside text-[11px] text-foreground/80 space-y-1">
                      {result.matrix.weaknesses.map((w: string, i: number) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1.5">
                    <span className="text-xs font-bold text-cyan-400">Opportunities</span>
                    <ul className="list-disc list-inside text-[11px] text-foreground/80 space-y-1">
                      {result.matrix.opportunities.map((o: string, i: number) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <span className="text-xs font-bold text-amber-400">Threats</span>
                    <ul className="list-disc list-inside text-[11px] text-foreground/80 space-y-1">
                      {result.matrix.threats.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Safety Disclaimers */}
              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] leading-relaxed flex items-start gap-2">
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
