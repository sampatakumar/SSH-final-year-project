import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { Dna, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, FileText, GitCompare, HelpCircle } from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const BiotechResearchWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("dna_gc_melting");
  const [problemStatement, setProblemStatement] = useState<string>(
    "Design forward and reverse primers for PCR amplification of recombinant green fluorescent protein (GFP)."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);

  const [inputs, setInputs] = useState<Record<string, any>>({
    sequenceString: "ATGCGATCGATCGATCGATCG",
    researchQuestion: "Does enzyme overexpression increase secondary metabolite production?",
    independentVariable: "Enzyme Promoter Strength / Induction Level",
    dependentVariable: "Metabolite Concentration (mg/L)",
    paperText: "Abstract: In this investigation, we studied CRISPR-Cas9 editing efficiency in Pichia pastoris. Methodology: Recombinant yeast strains were transformed via electroporation. Findings: We observed a 78% gene disruption rate with 12% off-target indels. Limitations: High cell lethality occurred during electroporation pulse. Conclusions: Cas9 facilitates rapid metabolic pathway engineering.",
    paperSourceA: "Paper A: Smith et al. (2024) reported 85% yield enhancement using pAOX1 promoter under methanol induction in fed-batch culture.",
    paperSourceB: "Paper B: Chen et al. (2025) found only 45% yield with constitutive GAP promoter in continuous chemostat culture.",
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
      const data = await toolsApi.executeTool("biotech-research", {
        analysisType,
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
    } catch (err: any) {
      setError(err.message || "Failed to execute biotechnology analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Biotechnology Research Study Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Biotechnology sequence analysis and experimental design verification.",
        tags: ["Biotechnology", "Bioinformatics", analysisType],
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
          { id: "dna_gc_melting", label: "Oligonucleotide GC% & Melting Temp (Tm)" },
          { id: "hypothesis_experiment_planning", label: "Hypothesis & Experiment Planning" },
          { id: "paper_analysis", label: "Research Paper Analysis" },
          { id: "literature_comparison", label: "Literature & Study Comparison" },
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
            <h3 className="text-sm font-semibold text-foreground">Biotech Inputs & Research Parameters</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {/* Problem Statement & AI Studio Toggle */}
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Investigation Objective / Context
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Design primers for PCR amplification of GFP..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed"
              />
            </div>

            {analysisType === "dna_gc_melting" && (
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
                  <span>Supports DNA primers (10-100 nt)</span>
                </div>
              </div>
            )}

            {(analysisType === "hypothesis_experiment_planning" || analysisType === "research_hypothesis_organizer") && (
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
                    placeholder="e.g. Does enzyme overexpression increase secondary metabolite production?"
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
                    placeholder="e.g. Enzyme Promoter Strength / Induction Level"
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
                    placeholder="e.g. Metabolite Concentration (mg/L)"
                    required
                  />
                </div>
              </>
            )}

            {analysisType === "paper_analysis" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Research Paper Text / Abstract / Methods *
                </label>
                <textarea
                  rows={6}
                  value={inputs.paperText}
                  onChange={(e) => handleInputChange("paperText", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Paste research paper abstract, methodology, and reported findings..."
                  required
                />
              </div>
            )}

            {analysisType === "literature_comparison" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Study A Text / Citation *
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.paperSourceA}
                    onChange={(e) => handleInputChange("paperSourceA", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                    placeholder="Study A methodology and outcomes..."
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Study B Text / Citation *
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.paperSourceB}
                    onChange={(e) => handleInputChange("paperSourceB", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                    placeholder="Study B methodology and outcomes..."
                    required
                  />
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
                  <span>Analyze Sequence & Hypothesis</span>
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
                  structure formal research hypotheses, or analyze peer-reviewed literature.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Biophysical Formula / Protocol Standard
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
                      Sequence Checked & Verified
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
                      {result.results.recommendedExperimentalControls?.map((ctrl: string, idx: number) => (
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
                </div>
              )}

              {/* Paper Analysis Results */}
              {result.results?.researchQuestion && result.results?.methodology && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Extracted Research Question</div>
                    <div className="text-xs text-foreground mt-1 font-medium">{result.results.researchQuestion}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Methodology Overview</div>
                    <div className="text-xs text-foreground mt-1">{result.results.methodology}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] uppercase font-semibold text-emerald-400">Reported Findings</div>
                    <div className="text-xs text-foreground mt-1">{result.results.majorFindings}</div>
                  </div>
                </div>
              )}

              {/* Literature Comparison Results */}
              {result.results?.agreements && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[10px] uppercase font-semibold text-emerald-400">Literature Agreements</div>
                    <div className="text-xs text-foreground mt-1">{result.results.agreements}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] uppercase font-semibold text-amber-400">Methodological Differences</div>
                    <div className="text-xs text-foreground mt-1">{result.results.methodologicalDifferences}</div>
                  </div>
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2">
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
                      objectiveTitle: "Biotechnology Research Objective",
                      formulasTitle: "Analytical & Biophysical Methods",
                      resultsTitle: "Laboratory Findings & Sequence Metrics",
                      discussionTitle: "Biotechnology Discussion & Evidence Appraisal",
                      missingInputsTitle: "Experimental Controls & Protocol Gaps",
                      troubleshootingTitle: "Methodological Recommendations",
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

export default BiotechResearchWorkspace;
