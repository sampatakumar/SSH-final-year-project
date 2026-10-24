import React, { useState } from "react";
import { toolsApi } from "../services/tools.api";
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export const SharedReportReviewerWorkspace: React.FC = () => {
  const [inputs, setInputs] = useState<Record<string, any>>({
    reportType: "technical_report",
    academicDiscipline: "Mechanical Engineering",
    title: "Experimental Stress Analysis of 6061-T6 Aluminum Cantilever Beam",
    abstractOrSummary:
      "Investigation of strain gauge readings under point tip loading compared against theoretical Euler-Bernoulli calculations.",
    reportText:
      "In this laboratory investigation, a 6061-T6 aluminum cantilever beam (Length = 500 mm, Width = 25 mm, Thickness = 6 mm) was clamped horizontally in a rigid test fixture. Incremental deadweight point loads ranging from 10 N to 100 N were applied at the free end. Precision electrical resistance strain gauges bonded 50 mm from the fixed boundary recorded longitudinal micro-strains. Calculated theoretical bending stresses were compared against measured experimental strain values, demonstrating consistency within a 4.2% error margin. Potential experimental errors include fixture compliance and slight gauge misalignment.",
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, val: any) => {
    setInputs((prev) => ({ ...prev, [field]: val }));
  };

  const handleRunReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await toolsApi.executeTool("report-reviewer", inputs);
      setResult(data.resultData);
    } catch (err: any) {
      setError(err.message || "Failed to generate report review.");
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
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Document Submission Details</h3>
          </div>

          <form onSubmit={handleRunReview} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Document Type *
                </label>
                <select
                  value={inputs.reportType}
                  onChange={(e) => handleInputChange("reportType", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="technical_report">Technical Report</option>
                  <option value="lab_report">Laboratory Report</option>
                  <option value="capstone_proposal">Capstone Project Proposal</option>
                  <option value="business_case">Business Case Analysis</option>
                  <option value="research_paper">Academic Research Paper</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Academic Discipline *
                </label>
                <select
                  value={inputs.academicDiscipline}
                  onChange={(e) => handleInputChange("academicDiscipline", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="Computer Science & IT">CSE & IT</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="ECE & EEE">ECE & EEE</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                  <option value="Biotechnology">Biotechnology</option>
                  <option value="Business & Management">Business / MBA</option>
                  <option value="Commerce & Finance">Commerce / Finance</option>
                  <option value="Arts & Humanities">Arts & Humanities</option>
                  <option value="Nursing & Allied Health">Nursing & Allied Health</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Project / Report Title *
              </label>
              <input
                type="text"
                value={inputs.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Executive Abstract / Summary
              </label>
              <textarea
                rows={2}
                value={inputs.abstractOrSummary}
                onChange={(e) => handleInputChange("abstractOrSummary", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none"
                placeholder="Brief summary of findings..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                Report Content / Body Paragraphs *
              </label>
              <textarea
                rows={6}
                value={inputs.reportText}
                onChange={(e) => handleInputChange("reportText", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs focus:ring-1 focus:ring-primary outline-none font-sans"
                placeholder="Paste report text (methodology, results, discussion)..."
                required
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Minimum 50 characters required. Supports all academic disciplines.
              </span>
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
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Reviewing Academic Depth & Rigor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Multi-Branch Formative Review</span>
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
                <p className="font-semibold text-foreground">Awaiting Report Submission</p>
                <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-sm">
                  Submit technical papers, capstone proposals, or lab writeups across any academic discipline
                  to receive structured feedback on strengths, missing evidence, and technical gaps.
                </p>
              </div>
            </div>
          )}

          {result && result.review && (
            <div className="rounded-xl border border-border/80 bg-card/70 p-6 backdrop-blur-md space-y-5 animate-in fade-in duration-200">
              {/* Executive Assessment */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Reviewer Executive Summary
                </span>
                <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                  {result.review.summary}
                </p>
              </div>

              {/* Strengths */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Identified Strengths & Rigor</span>
                </div>
                <div className="space-y-1.5">
                  {result.review.strengths.map((str: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs text-foreground/80"
                    >
                      • {str}
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Sections / Evidence Gaps */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Missing Evidence & Structural Gaps</span>
                </div>
                <div className="space-y-1.5">
                  {result.review.missingSectionsOrEvidence.map((gap: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90"
                    >
                      • {gap}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Questions to Check */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5 text-cyan-400">
                  <HelpCircle className="w-4 h-4" />
                  <span>Technical & Methodological Questions to Address</span>
                </div>
                <div className="space-y-1.5">
                  {result.review.technicalQuestionsToCheck.map((q: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs text-foreground/80"
                    >
                      • {q}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Improvements */}
              <div>
                <div className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5 text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>Actionable Improvements for Next Revision</span>
                </div>
                <div className="space-y-1.5">
                  {result.review.actionableImprovements.map((imp: string, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg border border-border/40 bg-muted/20 text-xs text-foreground/80"
                    >
                      • {imp}
                    </div>
                  ))}
                </div>
              </div>

              {result.safetyNotice && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60 text-muted-foreground text-[11px] leading-relaxed flex items-start gap-2">
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
