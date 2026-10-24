import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { BookOpen, Copy, Check, ShieldCheck, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

export const ArtsWritingWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("citation_formatter");
  const [inputs, setInputs] = useState<Record<string, any>>({
    citationStyle: "APA 7th",
    author: "Foucault, Michel",
    title: "Discipline and Punish: The Birth of the Prison",
    year: "1977",
    publisher: "Pantheon Books",
    pages: "195-228",
    doiOrUrl: "https://doi.org/10.1007/978-1-349-16083-9",
    thesisStatement: "Digital surveillance structures in modern learning platforms mirror panoptic architectural disciplines.",
    draftText: "",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("arts-writing", {
        analysisType,
        ...inputs,
      });
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to process academic writing analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-muted/40 border border-border/60">
        {[
          { id: "citation_formatter", label: "Deterministic Citation Generator (APA / MLA / Chicago)" },
          { id: "argument_thesis_structure", label: "Thesis & Argumentative Structure Critique" },
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
            <BookOpen className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-foreground">Bibliographic Details</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {analysisType === "citation_formatter" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Citation Style Standard
                  </label>
                  <select
                    value={inputs.citationStyle}
                    onChange={(e) => handleInputChange("citationStyle", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="APA 7th">APA 7th Edition (Author, Year, Title)</option>
                    <option value="MLA 9th">MLA 9th Edition (Author, Title, Publisher, Year)</option>
                    <option value="Chicago 17th">Chicago 17th Edition (Author-Date / Notes)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Author(s) (Last, First) *
                    </label>
                    <input
                      type="text"
                      value={inputs.author}
                      onChange={(e) => handleInputChange("author", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Publication Year *
                    </label>
                    <input
                      type="text"
                      value={inputs.year}
                      onChange={(e) => handleInputChange("year", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Book / Article Title *
                  </label>
                  <input
                    type="text"
                    value={inputs.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Publisher / Journal
                    </label>
                    <input
                      type="text"
                      value={inputs.publisher}
                      onChange={(e) => handleInputChange("publisher", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      Page Range (pp.)
                    </label>
                    <input
                      type="text"
                      value={inputs.pages}
                      onChange={(e) => handleInputChange("pages", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    DOI or Permanent URL
                  </label>
                  <input
                    type="text"
                    value={inputs.doiOrUrl}
                    onChange={(e) => handleInputChange("doiOrUrl", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </>
            )}

            {analysisType === "argument_thesis_structure" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Central Thesis Statement *
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.thesisStatement}
                    onChange={(e) => handleInputChange("thesisStatement", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Enter argumentative claim..."
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
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Formatting Citation...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Generate Formatted Citation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Card */}
        <div className="lg:col-span-7 space-y-4">
          {!result && (
            <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-8 text-center text-muted-foreground text-xs space-y-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-foreground">Awaiting Bibliographic Metadata</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Enter author, title, and publisher to compile an exact, verified academic citation
                  in APA 7th, MLA 9th, or Chicago 17th format.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.results?.formattedCitation && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Formatted {result.citationStyle} Reference
                    </span>
                    <button
                      onClick={() => handleCopyCitation(result.results.formattedCitation)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted hover:bg-muted/80 text-[11px] text-foreground transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="p-3 rounded bg-background border border-border/50 text-xs font-serif leading-relaxed text-foreground">
                    {result.results.formattedCitation.replace(/\*/g, "")}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/40 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">In-Text Parenthetical: </span>
                      <code className="text-rose-400 font-mono font-semibold">
                        {result.results.inTextParenthetical}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">In-Text Narrative: </span>
                      <code className="text-rose-400 font-mono font-semibold">
                        {result.results.inTextNarrative}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Thesis evaluation */}
              {result.results?.thesisEvaluation && (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                    <div className="text-xs font-semibold text-foreground mb-1">Thesis Evaluation</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Clarity Score:</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {result.results.thesisEvaluation.clarityScore} / 100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {result.results.thesisEvaluation.actionableRefinements.map((ref: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs text-foreground/80 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{ref}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] leading-relaxed flex items-start gap-2">
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
