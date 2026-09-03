import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Wand2,
  Layers,
  ArrowRight,
  Info,
  Check,
  Sliders,
} from "lucide-react";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import { calculateAtsReadiness, calculateCompletenessScore } from "../services/resume-scoring.utils";
import { calculateResumeDensity, optimizeConfigForOnePage } from "../preview/resume-density.utils";
import { toast } from "sonner";

export interface AiResumeAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  config: ResumeBuilderConfig;
  onSelectSection: (secId: string) => void;
  onUpdateConfig?: (newConfig: ResumeBuilderConfig) => void;
  onUpdateResume?: (patch: Partial<ResumeData>) => void;
}

export const AiResumeAssistant: React.FC<AiResumeAssistantProps> = ({
  open,
  onOpenChange,
  data,
  config,
  onSelectSection,
  onUpdateConfig,
  onUpdateResume,
}) => {
  const [activeTab, setActiveTab] = useState<"ats" | "completeness" | "density" | "content">("ats");

  const atsReport = calculateAtsReadiness(data, config);
  const completenessReport = calculateCompletenessScore(data);
  const density = calculateResumeDensity(data, config);

  const handleOptimizeSpacing = () => {
    if (onUpdateConfig) {
      const optimized = optimizeConfigForOnePage(data, config);
      onUpdateConfig(optimized);
      toast.success("Spacing optimized for 1 page!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                AI Resume Assistant
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Grounded optimization, ATS readiness heuristics, and document health analysis
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Buttons */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/40 text-xs mt-2">
          <button
            type="button"
            onClick={() => setActiveTab("ats")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "ats" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> ATS Readiness ({atsReport.score})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completeness")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "completeness" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Completeness ({completenessReport.score}%)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("density")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "density" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-amber-500" /> Page Density
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("content")}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "content" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
            }`}
          >
            <Wand2 className="h-3.5 w-3.5 text-primary" /> Content Quality
          </button>
        </div>

        {/* TAB 1: ATS Readiness */}
        {activeTab === "ats" && (
          <div className="space-y-4 pt-2">
            {/* Score Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  ATS Readiness Heuristic
                </div>
                <div className="text-2xl font-black text-foreground font-mono flex items-baseline gap-1">
                  {atsReport.score} <span className="text-xs text-muted-foreground font-normal">/ 100</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Status: <strong className="text-primary">{atsReport.label}</strong> • Evaluated on parser-safe standards
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                  {atsReport.passedCount} of {atsReport.totalCount} checks passed
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Evaluation Breakdown
              </span>

              <div className="space-y-2">
                {atsReport.checks.map((chk) => (
                  <div
                    key={chk.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      chk.passed ? "bg-background border-border/60" : "bg-amber-500/5 border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {chk.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-foreground">{chk.title}</div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          {chk.explanation}
                        </div>
                      </div>
                    </div>

                    {!chk.passed && chk.fixSection && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          onSelectSection(chk.fixSection!);
                        }}
                        className="h-6 text-[10px] px-2 font-semibold bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 shrink-0"
                      >
                        Edit Section
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Completeness */}
        {activeTab === "completeness" && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Student-Aware Completeness
                </div>
                <div className="text-2xl font-black text-foreground font-mono flex items-baseline gap-1">
                  {completenessReport.score}%
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {completenessReport.summaryText}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {completenessReport.completedCount} of {completenessReport.items.length} items complete
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Section Audit Items
              </span>

              <div className="space-y-2">
                {completenessReport.items.map((item) => (
                  <div
                    key={item.key}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      item.completed ? "bg-background border-border/60" : "bg-muted/40 border-border/60"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-bold text-foreground">{item.label}</div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          {item.hint}
                        </div>
                      </div>
                    </div>

                    {!item.completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onOpenChange(false);
                          onSelectSection(item.sectionId);
                        }}
                        className="h-6 text-[10px] px-2 font-semibold bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 shrink-0"
                      >
                        Add {item.label}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Page Density */}
        {activeTab === "density" && (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-border/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Page Layout & Fill Heuristic
                </div>
                <div className="text-2xl font-black text-foreground font-mono">
                  {density.estimatedPages === 1 ? "1 Page" : `${density.estimatedPages} Pages`}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Estimated Lines: {density.estimatedLines} • Fill Capacity: {Math.round(density.fillRatio * 100)}%
                </p>
              </div>

              {density.status === "overflowing" && onUpdateConfig && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOptimizeSpacing}
                  className="h-8 text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-semibold"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-amber-400" /> Optimize 1 Page
                </Button>
              )}
            </div>

            {/* Warnings & Suggestions */}
            <div className="space-y-3">
              {density.warnings.map((w, i) => (
                <div key={i} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground">{w}</div>
                    {density.suggestions[i] && (
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Suggestion: {density.suggestions[i]}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {density.warnings.length === 0 && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Resume density is well balanced and readable!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Content Quality */}
        {activeTab === "content" && (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1">
              <div className="font-bold text-primary flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" /> Zero Hallucination Grounding Rule
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                AI Resume Assistant is strictly grounded in your verified profile facts, skills matrix, and project evidence. It will never fabricate fake metrics, revenue numbers, or unverified claims.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Actionable Next Steps
              </span>

              <div className="space-y-2">
                <div className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-foreground">Enhance Professional Summary</div>
                    <div className="text-[11px] text-muted-foreground">
                      Generate 4 tone variants (Technical, Concise, ATS, Professional).
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onSelectSection("summary");
                    }}
                    className="h-7 text-xs"
                  >
                    Open Summary
                  </Button>
                </div>

                <div className="p-3 rounded-xl border border-border/60 bg-background flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-foreground">Action Verbs on Projects</div>
                    <div className="text-[11px] text-muted-foreground">
                      Begin each bullet point with strong engineering action verbs.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onOpenChange(false);
                      onSelectSection("projects");
                    }}
                    className="h-7 text-xs"
                  >
                    Open Projects
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AiResumeAssistant;
