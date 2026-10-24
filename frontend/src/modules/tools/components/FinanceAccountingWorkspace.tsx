import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Coins, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const FinanceAccountingWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("liquidity_ratios");
  const [inputs, setInputs] = useState<Record<string, any>>({
    currentAssets: 120000,
    currentLiabilities: 60000,
    inventory: 30000,
    revenue: 500000,
    grossProfit: 200000,
    netIncome: 75000,
    totalEquity: 250000,
    initialOutlay: 100000,
    cashFlows: "35000, 45000, 55000",
    discountRatePercent: 10,
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
      const data = await toolsApi.executeTool("finance-accounting", {
        analysisType,
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to calculate financial statement ratios.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "liquidity_ratios", label: "Liquidity Analysis (Current & Quick)" },
          { id: "profitability_ratios", label: "Profitability & ROE Analysis" },
          { id: "three_period_npv", label: "Discounted Cash Flow (NPV Model)" },
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
            <Coins className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-semibold text-foreground">Financial Statement Items</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {analysisType === "liquidity_ratios" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Current Assets ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.currentAssets}
                      onChange={(e) => handleInputChange("currentAssets", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Current Liabilities ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.currentLiabilities}
                      onChange={(e) => handleInputChange("currentLiabilities", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Inventory Value ($)
                  </label>
                  <input
                    type="number"
                    value={inputs.inventory}
                    onChange={(e) => handleInputChange("inventory", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Subtracted from current assets for the Quick (Acid-Test) Ratio.
                  </span>
                </div>
              </>
            )}

            {analysisType === "profitability_ratios" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Operating Revenue ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.revenue}
                      onChange={(e) => handleInputChange("revenue", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Gross Profit ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.grossProfit}
                      onChange={(e) => handleInputChange("grossProfit", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Net Income ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.netIncome}
                      onChange={(e) => handleInputChange("netIncome", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Total Shareholder Equity ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.totalEquity}
                      onChange={(e) => handleInputChange("totalEquity", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {analysisType === "three_period_npv" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Initial Capital Outlay I₀ ($) *
                  </label>
                  <input
                    type="number"
                    value={inputs.initialOutlay}
                    onChange={(e) => handleInputChange("initialOutlay", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Future Annual Cash Flows ($) — Comma Separated *
                  </label>
                  <input
                    type="text"
                    value={inputs.cashFlows}
                    onChange={(e) => handleInputChange("cashFlows", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 35000, 45000, 55000"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Annual Discount Rate / Hurdle Rate (%) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={inputs.discountRatePercent}
                    onChange={(e) => handleInputChange("discountRatePercent", e.target.value)}
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
              className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Ratios & DCF...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  <span>Calculate Financial Metrics</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Coins className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Accounting Data</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter balance sheet figures or projected cash flows to evaluate working capital
                  liquidity and Net Present Value.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Accounting Ratio Formula
                  </div>
                  <code className="text-xs font-mono text-teal-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {/* Ratios Grid */}
              {result.results && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Computed Financial Metrics</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Audited Math
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

              {/* NPV Period Breakdown */}
              {result.periodBreakdown && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">Discounted Cash Flow Table</div>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 text-muted-foreground text-[11px]">
                        <tr>
                          <th className="p-2">Period (t)</th>
                          <th className="p-2">Nominal Cash Flow</th>
                          <th className="p-2">Discount Factor</th>
                          <th className="p-2 text-right">Present Value (PV)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {result.periodBreakdown.map((p: any) => (
                          <tr key={p.period} className="hover:bg-muted/20">
                            <td className="p-2">Year {p.period}</td>
                            <td className="p-2">${p.nominalCashFlow}</td>
                            <td className="p-2">{p.discountFactor}</td>
                            <td className="p-2 text-right font-semibold text-foreground">
                              ${p.discountedCashFlow}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] leading-relaxed flex items-start gap-2">
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
