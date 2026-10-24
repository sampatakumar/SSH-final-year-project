import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Building2, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const CivilBoqWorkspace: React.FC = () => {
  const [problemStatement, setProblemStatement] = useState<string>(
    "Residential building ground floor RCC slab concrete estimation with M20 nominal mix."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);
  const [inputs, setInputs] = useState<Record<string, any>>({
    estimationType: "concrete_slab",
    lengthM: 6.0,
    widthM: 4.5,
    thicknessM: 0.15,
    mixRatio: "1:1.5:3",
    dryVolumeFactor: 1.54,
    wastagePercent: 5,
    unitRateCementBag: 390,
    unitRateSandM3: 1450,
    unitRateAggregateM3: 1850,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunEstimation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("civil-boq", {
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
    } catch (err: any) {
      setError(err.message || "Failed to calculate BOQ estimation.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Civil Engineering BOQ Study Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Concrete volume and BOQ material estimation.",
        tags: ["Civil Engineering", "BOQ", inputs.estimationType],
        isSaved: !isSaved,
      });
      setIsSaved(res.isSavedToPortfolio);
    } catch (err) {
      console.warn("Failed to toggle portfolio save:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Building2 className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-foreground">Structural Dimensions & Project Scope</h3>
          </div>

          <form onSubmit={handleRunEstimation} className="space-y-4">
            {/* Problem Statement & AI Studio Toggle */}
            <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Project Scope / Site Description
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-orange-500 focus:ring-orange-500 w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Ground floor slab casting for residential unit in zone II..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-orange-500 outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Structural Component Element
              </label>
              <select
                value={inputs.estimationType}
                onChange={(e) => handleInputChange("estimationType", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="concrete_slab">RCC Floor / Roof Slab</option>
                <option value="isolated_footing">Isolated Foundation Footing</option>
                <option value="concrete_beam">Reinforced Concrete Beam</option>
                <option value="concrete_column">Reinforced Concrete Column</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Length (m) *</label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.lengthM}
                  onChange={(e) => handleInputChange("lengthM", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Width (m) *</label>
                <input
                  type="number"
                  step="0.05"
                  value={inputs.widthM}
                  onChange={(e) => handleInputChange("widthM", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Thickness / Depth (m) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.thicknessM}
                  onChange={(e) => handleInputChange("thicknessM", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Concrete Mix Ratio (C:S:A)
                </label>
                <select
                  value={inputs.mixRatio}
                  onChange={(e) => handleInputChange("mixRatio", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="1:1.5:3">M20 (1 : 1.5 : 3) Standard RCC</option>
                  <option value="1:1:2">M25 (1 : 1 : 2) Heavy Structural</option>
                  <option value="1:2:4">M15 (1 : 2 : 4) General Mass Concrete</option>
                  <option value="1:3:6">M10 (1 : 3 : 6) Plain Foundation PCC</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Wastage & Spillage (%)
                </label>
                <input
                  type="number"
                  value={inputs.wastagePercent}
                  onChange={(e) => handleInputChange("wastagePercent", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  placeholder="5"
                />
              </div>
            </div>

            {/* User Rates */}
            <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                User-Supplied Unit Rates (Editable Provenance)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Cement ($/bag)</label>
                  <input
                    type="number"
                    value={inputs.unitRateCementBag}
                    onChange={(e) => handleInputChange("unitRateCementBag", e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Sand ($/m³)</label>
                  <input
                    type="number"
                    value={inputs.unitRateSandM3}
                    onChange={(e) => handleInputChange("unitRateSandM3", e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-0.5">Aggregate ($/m³)</label>
                  <input
                    type="number"
                    value={inputs.unitRateAggregateM3}
                    onChange={(e) => handleInputChange("unitRateAggregateM3", e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-background border border-border text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Computing Quantities & Generating BOQ...</span>
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4" />
                  <span>Calculate Bill of Quantities</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output & BOQ Report Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Building2 className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Structure Dimensions</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Specify component dimensions and mix ratios on the left to compute wet/dry volume,
                  component materials, and the Bill of Quantities schedule.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {/* Formula & Method */}
              <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                  Volumetric & Dry Factor Mathematical Formula
                </div>
                <code className="text-xs font-mono text-orange-400 font-semibold">
                  {result.formulaUsed}
                </code>
              </div>

              {/* Primary Material Outputs */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Computed Material Quantities</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Exact Prismatic Volumetric Math
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                    <div className="text-[10px] text-muted-foreground">Wet Volume</div>
                    <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                      {result.results.wetVolumeM3} m³
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                    <div className="text-[10px] text-muted-foreground">Dry Volume (+5%)</div>
                    <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                      {result.results.dryVolumeM3} m³
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="text-[10px] text-orange-400 font-semibold">Cement Bags (50kg)</div>
                    <div className="text-base font-bold text-orange-400 mt-0.5 font-mono">
                      {result.results.cementBags} Bags
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                    <div className="text-[10px] text-muted-foreground">Estimated Cost</div>
                    <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                      ${result.results.totalEstimatedMaterialCost}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOQ Worksheet Table */}
              {result.billOfQuantities && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2">
                    Bill of Quantities (BOQ) Worksheet
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/60">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-muted/40 text-muted-foreground text-[11px] font-medium border-b border-border/60">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">Material Description</th>
                          <th className="p-2.5">Quantity</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5">Rate ($)</th>
                          <th className="p-2.5 text-right">Amount ($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                        {result.billOfQuantities.map((item: any) => (
                          <tr key={item.itemNo} className="hover:bg-muted/20">
                            <td className="p-2.5 text-muted-foreground">{item.itemNo}</td>
                            <td className="p-2.5 font-sans text-foreground/90 font-medium">
                              {item.description}
                            </td>
                            <td className="p-2.5">{item.quantity}</td>
                            <td className="p-2.5 text-muted-foreground">{item.unit}</td>
                            <td className="p-2.5">${item.unitRate}</td>
                            <td className="p-2.5 text-right font-semibold text-foreground">
                              ${item.totalAmount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30 font-semibold text-xs border-t border-border">
                        <tr>
                          <td colSpan={5} className="p-2.5 text-right font-sans">
                            Grand Total Material Cost:
                          </td>
                          <td className="p-2.5 text-right font-mono text-emerald-400">
                            ${result.results.totalEstimatedMaterialCost}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Safety Disclaimers */}
              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] leading-relaxed flex items-start gap-2">
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

export default CivilBoqWorkspace;
