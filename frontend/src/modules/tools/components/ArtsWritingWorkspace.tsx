import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import { BookOpen, Copy, Check, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles, Presentation, FileText, CheckCheck } from "lucide-react";
import { SharedEngineeringReportBuilder } from "./SharedEngineeringReportBuilder";

export const ArtsWritingWorkspace: React.FC = () => {
  const [analysisType, setAnalysisType] = useState<string>("citation_formatter");
  const [problemStatement, setProblemStatement] = useState<string>(
    "Critique of algorithmic surveillance systems in secondary education using Foucault's disciplinary panopticism."
  );
  const [enableAiInterpretation, setEnableAiInterpretation] = useState<boolean>(true);

  const [inputs, setInputs] = useState<Record<string, any>>({
    citationStyle: "APA 7th",
    author: "Foucault, Michel",
    title: "Discipline and Punish: The Birth of the Prison",
    year: "1977",
    publisher: "Pantheon Books",
    pages: "195-228",
    doiOrUrl: "https://doi.org/10.1007/978-1-349-16083-9",
    thesisStatement: "Digital surveillance structures in modern learning platforms mirror panoptic architectural disciplines, systematically conditioning student docility.",
    draftText: "Contemporary automated proctoring software creates a persistent psychological awareness of observation.",
    presentationTopic: "The Digital Panopticon: Algorithmic Proctoring and Educational Autonomy",
    presentationDurationMinutes: 15,
    sourceAText: "Source A argues that automated proctoring maintains academic integrity with zero human bias.",
    sourceBText: "Source B demonstrates high false-positive rates for neurodivergent students and severe privacy intrusions.",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
        problemStatement,
        enableAiInterpretation,
        ...inputs,
      });
      setResult(data.resultData);
      setActivityRecordId(data.activityRecordId || null);
      setIsSaved(false);
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

  const handleTogglePortfolio = async () => {
    if (!activityRecordId) return;
    try {
      const res = await toolsApi.togglePortfolioSave(activityRecordId, {
        headline: result?.reportDraft?.title || "Academic Writing & Research Artifact",
        summary:
          result?.reportDraft?.engineeringDiscussion?.slice(0, 200) ||
          "Academic citation formatting, thesis structure, and rhetorical argument analysis.",
        tags: ["Arts & Humanities", "Academic Writing", analysisType],
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
          { id: "citation_formatter", label: "Deterministic Citation Formatter" },
          { id: "argument_thesis_structure", label: "Thesis & Toulmin Argument Critique" },
          { id: "source_criticism", label: "Source Comparison & Critique" },
          { id: "presentation_preparation", label: "Presentation & Slide Pacing" },
          { id: "literature_review_outline", label: "Literature Review Synthesis" },
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
            <h3 className="text-sm font-semibold text-foreground">Bibliographic & Writing Parameters</h3>
          </div>

          <form onSubmit={handleRunAnalysis} className="space-y-4">
            {/* Problem Statement & AI Studio Toggle */}
            <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Essay / Inquest Thesis Topic
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={enableAiInterpretation}
                    onChange={(e) => setEnableAiInterpretation(e.target.checked)}
                    className="rounded border-border text-rose-500 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span>AI Studio Reasoning</span>
                </label>
              </div>
              <textarea
                rows={2}
                value={problemStatement}
                onChange={(e) => setProblemStatement(e.target.value)}
                placeholder="e.g. Critique of algorithmic surveillance in secondary education..."
                className="w-full px-2.5 py-1.5 rounded-md bg-background border border-border text-xs focus:ring-1 focus:ring-rose-500 outline-none leading-relaxed"
              />
            </div>

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
                      Pages / Range
                    </label>
                    <input
                      type="text"
                      value={inputs.pages}
                      onChange={(e) => handleInputChange("pages", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
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

            {(analysisType === "argument_thesis_structure" || analysisType === "essay_thesis_development") && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Thesis Proposition Statement *
                  </label>
                  <textarea
                    rows={3}
                    value={inputs.thesisStatement}
                    onChange={(e) => handleInputChange("thesisStatement", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                    placeholder="Enter central academic thesis proposition..."
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Draft Supporting Evidence / Paragraph
                  </label>
                  <textarea
                    rows={4}
                    value={inputs.draftText}
                    onChange={(e) => handleInputChange("draftText", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none leading-relaxed"
                    placeholder="Paste draft paragraph or argument grounds..."
                  />
                </div>
              </>
            )}

            {analysisType === "source_criticism" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Source A Text *</label>
                  <textarea
                    rows={3}
                    value={inputs.sourceAText}
                    onChange={(e) => handleInputChange("sourceAText", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Source B Text *</label>
                  <textarea
                    rows={3}
                    value={inputs.sourceBText}
                    onChange={(e) => handleInputChange("sourceBText", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    required
                  />
                </div>
              </div>
            )}

            {analysisType === "presentation_preparation" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Presentation Topic *</label>
                  <input
                    type="text"
                    value={inputs.presentationTopic}
                    onChange={(e) => handleInputChange("presentationTopic", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={inputs.presentationDurationMinutes}
                    onChange={(e) => handleInputChange("presentationDurationMinutes", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs font-mono"
                    required
                  />
                </div>
              </div>
            )}

            {analysisType === "literature_review_outline" && (
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Literature Corpus Notes / Synthesis Scope *
                </label>
                <textarea
                  rows={5}
                  value={inputs.draftText}
                  onChange={(e) => handleInputChange("draftText", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs"
                  placeholder="Outline key academic themes and authors to synthesize..."
                  required
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
              className="w-full py-2.5 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating Rhetoric & Style...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Analyze Argument & Format Citation</span>
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
                <p className="font-semibold text-foreground">Awaiting Bibliographic or Thesis Inputs</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Format verified academic citations in APA, MLA, or Chicago style, critique argumentative
                  thesis structures, compare opposing sources, or plan oral presentation slides.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {result.formulaUsed && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60">
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground mb-1">
                    Bibliographic Standard / Rhetorical Model
                  </div>
                  <code className="text-xs font-mono text-rose-400 font-semibold">
                    {result.formulaUsed}
                  </code>
                </div>
              )}

              {/* Formatted Citation Output */}
              {result.formattedCitation && (
                <div className="p-4 rounded-lg bg-background/80 border border-border/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Formatted {inputs.citationStyle} Reference
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(result.formattedCitation)}
                      className="px-2.5 py-1 rounded bg-muted/60 hover:bg-muted text-[11px] text-foreground font-medium flex items-center gap-1.5 transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-serif italic text-foreground/90 pl-3 border-l-2 border-rose-500/40 leading-relaxed">
                    {result.formattedCitation}
                  </p>
                </div>
              )}

              {/* Missing Fields Notice */}
              {result.missingFields?.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Incomplete Citation Disclosures</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-1">
                    {result.missingFields.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Toulmin Argument Analysis */}
              {result.argumentCritique && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Toulmin Argument Model Evaluation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">Thesis Contestability</div>
                      <div className="mt-1 font-medium text-foreground">{result.argumentCritique.contestabilityRating || "Evaluated"}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{result.argumentCritique.contestabilityFeedback}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-background/80 border border-border/50">
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">Rhetorical Fallacies</div>
                      <div className="mt-1 font-medium text-foreground">{result.argumentCritique.fallacyDetected ? "Flags Identified" : "None Detected"}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{result.argumentCritique.fallacyNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Presentation Slide Outline */}
              {result.presentationSlides && (
                <div>
                  <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Presentation className="w-3.5 h-3.5 text-rose-400" />
                    <span>Presentation Slide Structure & Pacing</span>
                  </div>
                  <div className="space-y-2">
                    {result.presentationSlides.map((slide: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg border border-border/50 bg-background/80 text-xs">
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span>Slide {idx + 1}: {slide.title}</span>
                          <span className="text-[10px] font-mono text-rose-400">{slide.pacingMinutes} min</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{slide.keyPoints}</p>
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
                      objectiveTitle: "Research Inquest & Argumentative Thesis",
                      formulasTitle: "Bibliographic Style Standards & Rhetorical Models",
                      resultsTitle: "Formatted Citations & Argument Evaluation",
                      discussionTitle: "Academic Writing Audit & Argumentative Critique",
                      missingInputsTitle: "Bibliographic Gaps & Unsubstantiated Claims",
                      troubleshootingTitle: "Stylistic & Rhetorical Guidance",
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

export default ArtsWritingWorkspace;
