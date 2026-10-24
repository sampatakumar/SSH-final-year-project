import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Building2, FileSpreadsheet, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const CivilBoqWorkspace: React.FC = () => {
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
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunEstimation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("civil-boq", inputs);
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to calculate BOQ estimation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-border/60 bg-card/60 p-5 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border/40">
            <Building2 className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-semibold text-foreground">Structural Dimensions & Mix Specifications</h3>
          </div>

          <form onSubmit={handleRunEstimation} className="space-y-4">
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
                <option value="rcc_beam">Reinforced Concrete Beam</option>
                <option value="retaining_wall">Basement Retaining Wall</option>
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
                <label className="text-xs font-medium text-foreground block mb-1">Depth/Thick (m) *</label>
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

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Nominal Concrete Mix (Cement : Sand : Aggregate)
              </label>
              <select
                value={inputs.mixRatio}
                onChange={(e) => handleInputChange("mixRatio", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
              >
                <option value="1:1.5:3">1:1.5:3 (M20 Grade - Standard RCC)</option>
                <option value="1:2:4">1:2:4 (M15 Grade - General Foundations)</option>
                <option value="1:1:2">1:1:2 (M25 Grade - Heavy Structural)</option>
                <option value="1:3:6">1:3:6 (M10 Grade - Plain Cement Concrete PCC)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Dry Volume Multiplier
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={inputs.dryVolumeFactor}
                  onChange={(e) => handleInputChange("dryVolumeFactor", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Standard = 1.54</span>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Wastage Allowance (%)
                </label>
                <input
                  type="number"
                  value={inputs.wastagePercent}
                  onChange={(e) => handleInputChange("wastagePercent", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">Standard = 5%</span>
              </div>
            </div>

            <div className="pt-2 border-t border-border/40">
              <div className="text-xs font-semibold text-foreground mb-2">Adjustable Material Unit Rates</div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Cement/Bag ($)</label>
                  <input
                    type="number"
                    value={inputs.unitRateCementBag}
                    onChange={(e) => handleInputChange("unitRateCementBag", e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Sand/m³ ($)</label>
                  <input
                    type="number"
                    value={inputs.unitRateSandM3}
                    onChange={(e) => handleInputChange("unitRateSandM3", e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Agg/m³ ($)</label>
                  <input
                    type="number"
                    value={inputs.unitRateAggregateM3}
                    onChange={(e) => handleInputChange("unitRateAggregateM3", e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs font-mono"
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
              className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculating Quantities...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Calculate Bill of Quantities</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output & BOQ Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Building2 className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Structural Dimensions</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter length, width, thickness, and concrete mix grade to compute exact batch weights,
                  cement bag counts, and material cost breakdown.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {/* Quantities Summary Grid */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                  <span>Calculated Material Quantities</span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Civil Math
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

              {/* Safety Disclaimers */}
              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-[11px] leading-relaxed flex items-start gap-2">
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
