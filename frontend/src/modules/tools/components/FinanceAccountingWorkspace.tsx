import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Coins, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Table, FileSpreadsheet, Calculator } from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const FinanceAccountingWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("financial_statement_analysis");
  const [problemStatement, setProblemStatement] = useState<string>(
    "Evaluate working capital liquidity, net profit margins, and 3-year capital budgeting feasibility for expansion project."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);

  const [inputs, setInputs] = useState<Record<string, any>>({
    currentAssets: 120000,
    currentLiabilities: 60000,
    inventory: 30000,
    revenue: 500000,
    grossProfit: 200000,
    netIncome: 75000,
    totalEquity: 250000,
    totalDebt: 100000,
    initialOutlay: 100000,
    cashFlows: "35000, 45000, 55000",
    discountRatePercent: 10,
    transactionDescription: "Company purchases $15,000 worth of computer equipment on credit from vendor.",
    formulaObjective: "Calculate 2-way dynamic XLOOKUP to extract employee bonus by department and performance band.",
    targetDataFormat: "Excel 365 / Google Sheets",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

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
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
    } catch (err: any) {
      setError(err.message || "Failed to calculate financial statement analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Financial Valuation & Accounting Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Financial ratio analysis, DCF valuation, and accounting verification.",
        tags: ["Finance", "Accounting", analysisType],
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
          { id: "financial_statement_analysis", label: "Financial Statement & Ratio Analysis" },
          { id: "three_period_npv", label: "Discounted Cash Flow (NPV Model)" },
          { id: "accounting_tutor", label: "Accounting Tutor & Journal Entries" },
          { id: "excel_formula_coach", label: "Excel Formula & Modeling Coach" },
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
            <h3 className="text-sm font-semibold text-foreground">Financial Statement Items & Parameters</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {/* Problem Statement & AI Studio Toggle */}
            <div className="p-3 rounded-lg border border-teal-500/20 bg-teal-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Financial Analysis Scope / Context
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-teal-500 focus:ring-teal-500 w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Evaluate working capital liquidity and capital budgeting feasibility..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-teal-500 outline-none leading-relaxed"
              />
            </div>

            {analysisType === "financial_statement_analysis" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Current Assets ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.currentAssets}
                      onChange={(e) => handleInputChange("currentAssets", Number(e.target.value))}
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
                      onChange={(e) => handleInputChange("currentLiabilities", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Inventory ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.inventory}
                      onChange={(e) => handleInputChange("inventory", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Revenue ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.revenue}
                      onChange={(e) => handleInputChange("revenue", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Gross Profit ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.grossProfit}
                      onChange={(e) => handleInputChange("grossProfit", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Net Income ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.netIncome}
                      onChange={(e) => handleInputChange("netIncome", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Total Equity ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.totalEquity}
                      onChange={(e) => handleInputChange("totalEquity", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Total Debt ($)
                    </label>
                    <input
                      type="number"
                      value={inputs.totalDebt}
                      onChange={(e) => handleInputChange("totalDebt", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                </div>
              </>
            )}

            {analysisType === "three_period_npv" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Initial Capital Outlay ($) *
                    </label>
                    <input
                      type="number"
                      value={inputs.initialOutlay}
                      onChange={(e) => handleInputChange("initialOutlay", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Discount Rate (%) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.discountRatePercent}
                      onChange={(e) => handleInputChange("discountRatePercent", Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Cash Flows (Comma-separated for Periods 1, 2, 3...) *
                  </label>
                  <input
                    type="text"
                    value={inputs.cashFlows}
                    onChange={(e) => handleInputChange("cashFlows", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    placeholder="e.g. 35000, 45000, 55000"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block">
                    Calculates discounted present values and NPV = Σ PV - Outlay.
                  </span>
                </div>
              </>
            )}

            {analysisType === "accounting_tutor" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Accounting Transaction Description *
                </label>
                <textarea
                  rows={4}
                  value={inputs.transactionDescription}
                  onChange={(e) => handleInputChange("transactionDescription", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="e.g. Company purchases $15,000 worth of computer equipment on credit from vendor..."
                  required
                />
              </div>
            )}

            {analysisType === "excel_formula_coach" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Spreadsheet Task Objective *
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.formulaObjective}
                    onChange={(e) => handleInputChange("formulaObjective", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    placeholder="e.g. Calculate 2-way dynamic XLOOKUP to extract employee bonus..."
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Spreadsheet Environment
                  </label>
                  <select
                    value={inputs.targetDataFormat}
                    onChange={(e) => handleInputChange("targetDataFormat", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                  >
                    <option value="Excel 365 / Google Sheets">Microsoft Excel 365 / Google Sheets</option>
                    <option value="Excel 2016 Legacy">Excel 2016 / 2019 (Legacy functions)</option>
                  </select>
                </div>
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
              className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Financial Equations...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Compute Financial Analysis</span>
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
                <p className="font-semibold text-foreground">Awaiting Financial Statements or Modeling Assumptions</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter balance sheet figures, income statement numbers, or capital expenditure cash flows
                  to compute liquidity, profitability, solvency, DCF valuation, and journal entries.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Governing Financial / Accounting Formula
                  </div>
                  <code className="text-xs font-mono text-teal-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {/* Number Results */}
              {result.results && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Financial Metrics & Ratios</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Deterministic Financial Proof Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {Object.entries(result.results).map(([key, val]) => (
                      <div
                        key={key}
                        className="p-3 rounded-lg bg-background/80 border border-border/50 text-left"
                      >
                        <div className="text-[10px] text-muted-foreground font-mono truncate">{key}</div>
                        <div className="text-sm font-bold text-foreground mt-0.5 truncate font-mono">
                          {String(val)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discounted Cash Flows Schedule */}
              {result.discountedCashFlows && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-teal-400" />
                    <span>Discounted Cash Flow Schedule</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 text-muted-foreground text-[11px] font-medium border-b border-border/60">
                        <tr>
                          <th className="p-2">Period (t)</th>
                          <th className="p-2">Nominal Cash Flow</th>
                          <th className="p-2">Discount Factor</th>
                          <th className="p-2 text-right">Present Value (PV)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {result.discountedCashFlows.map((cf: any) => (
                          <tr key={cf.period} className="hover:bg-muted/20">
                            <td className="p-2 text-muted-foreground">Year {cf.period}</td>
                            <td className="p-2 font-sans font-medium">${cf.cashFlow}</td>
                            <td className="p-2 text-muted-foreground">{cf.discountFactor}</td>
                            <td className="p-2 text-right font-semibold text-foreground">${cf.presentValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Journal Entries Table */}
              {result.journalEntries && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                    <span>General Journal Entry Analysis</span>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 text-muted-foreground text-[11px] font-medium border-b border-border/60">
                        <tr>
                          <th className="p-2">Account Title</th>
                          <th className="p-2">Debit ($)</th>
                          <th className="p-2">Credit ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {result.journalEntries.map((je: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-2 font-sans font-medium">{je.account}</td>
                            <td className="p-2 text-emerald-400">{je.debit ? `$${je.debit}` : "-"}</td>
                            <td className="p-2 text-rose-400">{je.credit ? `$${je.credit}` : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Excel Formula Result */}
              {result.recommendedFormula && (
                <div className="p-3.5 rounded-lg bg-background/80 border border-border/60 space-y-2">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Recommended Spreadsheet Syntax
                  </div>
                  <code className="text-xs font-mono text-teal-400 font-bold block p-2 rounded bg-muted/40">
                    {result.recommendedFormula}
                  </code>
                  {result.formulaExplanation && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.formulaExplanation}
                    </p>
                  )}
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] leading-relaxed flex items-start gap-2">
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
                    sectionTitles={{
                      objectiveTitle: "Financial Valuation & Accounting Objective",
                      formulasTitle: "Governing Financial Models & Accounting Rules",
                      resultsTitle: "Calculated Ratios & Valuation Results",
                      discussionTitle: "Financial Statement & Valuation Analysis",
                      missingInputsTitle: "Audit Disclosures & Incomplete Periods",
                      troubleshootingTitle: "Financial Sensitivity & Modeling Advice",
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

export default FinanceAccountingWorkspace;
