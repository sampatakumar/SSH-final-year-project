import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Dna, ShieldCheck, CheckCircle2, AlertTriangle, Layers, BookOpen } from "lucide-react";

export const BiotechResearchWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("dna_gc_melting");
  const [inputs, setInputs] = useState<Record<string, any>>({
    sequenceString: "ATGCGATCGATCGATCGATCG",
    researchQuestion: "Does enzyme overexpression increase secondary metabolite production?",
    independentVariable: "Enzyme Promoter Strength / Induction Level",
    dependentVariable: "Metabolite Concentration (mg/L)",
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
      const data = await toolsApi.executeTool("biotech-research", {
        analysisType,
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to execute biotechnology analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "dna_gc_melting", label: "Oligonucleotide GC% & Melting Temp (Tm)" },
          { id: "research_hypothesis_organizer", label: "Research Hypothesis & Control Organizer" },
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
            <Dna className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-foreground">Biotech Inputs</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {analysisType === "dna_gc_melting" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    DNA Nucleotide Sequence (A, C, G, T) *
                  </label>
                  <textarea
                    rows={4}
                    value={inputs.sequenceString}
                    onChange={(e) => handleInputChange("sequenceString", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono uppercase"
                    placeholder="e.g. ATGCGATCGATCGATCGATCG"
                    required
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Cleaned sequence length: {inputs.sequenceString.replace(/[^a-zA-Z]/g, "").length} nt</span>
                    <span>Supports DNA / RNA primers</span>
                  </div>
                </div>
              </>
            )}

            {analysisType === "research_hypothesis_organizer" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Core Biological Research Question *
                  </label>
                  <input
                    type="text"
                    value={inputs.researchQuestion}
                    onChange={(e) => handleInputChange("researchQuestion", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. Does CRISPR knockout of gene X reduce drug resistance?"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Independent Variable (Manipulated factor) *
                  </label>
                  <input
                    type="text"
                    value={inputs.independentVariable}
                    onChange={(e) => handleInputChange("independentVariable", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. Gene X knockout status"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Dependent Variable (Measured biological outcome) *
                  </label>
                  <input
                    type="text"
                    value={inputs.dependentVariable}
                    onChange={(e) => handleInputChange("dependentVariable", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. IC50 drug sensitivity (μM)"
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
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing Sequence & Bio-logic...</span>
                </>
              ) : (
                <>
                  <Dna className="w-4 h-4" />
                  <span>Execute Biotech Analysis</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <Dna className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Sequence or Research Inputs</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter an oligonucleotide sequence to calculate melting temperatures and molecular weight,
                  or structure formal research hypotheses.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Biophysical Formula
                  </div>
                  <code className="text-xs font-mono text-emerald-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {/* Number Results */}
              {result.results && typeof result.results.gcPercentage !== "undefined" && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center justify-between">
                    <span>Oligonucleotide Properties</span>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Sequence Checked
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">GC Content</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {result.results.gcPercentage}%
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Wallace Tm</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                        {result.results.wallaceMeltingTempC} °C
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Salt-Adjusted Tm</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {typeof result.results.saltAdjustedTmC === "number"
                          ? `${result.results.saltAdjustedTmC} °C`
                          : result.results.saltAdjustedTmC}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] text-muted-foreground">Mol Weight (g/mol)</div>
                      <div className="text-base font-bold text-foreground mt-0.5 font-mono">
                        {result.results.approxMolecularWeightGPerMol}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hypothesis Organizer Results */}
              {result.results?.nullHypothesisH0 && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Null Hypothesis (H₀)
                    </div>
                    <p className="text-xs text-foreground/90 font-mono">
                      {result.results.nullHypothesisH0}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Alternative Hypothesis (H₁)
                    </div>
                    <p className="text-xs text-foreground/90 font-mono">
                      {result.results.alternativeHypothesisH1}
                    </p>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-foreground mb-2">
                      Experimental Controls & Replicates
                    </div>
                    <div className="space-y-1.5">
                      {result.results.recommendedExperimentalControls.map((ctrl: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs text-foreground/80 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{ctrl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-background/80 border border-border/50 text-xs text-muted-foreground">
                    <strong className="text-foreground">Statistical Recommendation:</strong>{" "}
                    {result.results.statisticalTestingRecommendation}
                  </div>
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
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
