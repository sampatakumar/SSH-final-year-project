import React from "react";
import { Check, Loader2, Sparkles, AlertTriangle, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResumeStatusBarProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
  atsScore: number;
  completeness: number;
  estimatedPages: number;
  isOverflowing: boolean;
  onOptimizePage: () => void;
  onOpenQualityAssistant: () => void;
}

export const ResumeStatusBar: React.FC<ResumeStatusBarProps> = ({
  isSaving,
  lastSavedAt,
  atsScore,
  completeness,
  estimatedPages,
  isOverflowing,
  onOptimizePage,
  onOpenQualityAssistant,
}) => {
  return (
    <footer className="h-9 bg-card border-t border-border/50 px-4 flex items-center justify-between text-xs shrink-0 select-none z-10 gap-3">
      {/* Left: Save Status */}
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        {isSaving ? (
          <span className="flex items-center gap-1.5 text-primary font-medium">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving changes...
          </span>
        ) : lastSavedAt ? (
          <span className="flex items-center gap-1 text-emerald-500 font-medium truncate">
            <Check className="h-3.5 w-3.5" /> Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-500 font-medium">
            <Check className="h-3.5 w-3.5" /> All changes saved
          </span>
        )}
      </div>

      {/* Center / Right: Metrics & Quality Trigger */}
      <div className="flex items-center gap-3 shrink-0">
        {/* ATS Score */}
        <button
          type="button"
          onClick={onOpenQualityAssistant}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
          title="Click to view ATS Readiness breakdown"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span className="text-muted-foreground">ATS Readiness:</span>
          <span className="font-bold text-foreground font-mono">{atsScore}/100</span>
        </button>

        <span className="text-border hidden sm:inline">•</span>

        {/* Completeness */}
        <button
          type="button"
          onClick={onOpenQualityAssistant}
          className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-muted transition-colors cursor-pointer"
          title="Click to view completeness breakdown"
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-muted-foreground">Completeness:</span>
          <span className="font-bold text-foreground font-mono">{completeness}%</span>
        </button>

        <span className="text-border hidden sm:inline">•</span>

        {/* Page Count & Overflow Indicator */}
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">
            {estimatedPages === 1 ? "1 Page" : `${estimatedPages} Pages`}
          </span>

          {isOverflowing && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOptimizePage}
              className="h-6 text-[10px] px-2 py-0 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 gap-1 font-bold ml-1"
              title="Automatically adjust line spacing and margins to fit on 1 page"
            >
              <Sparkles className="h-2.5 w-2.5" /> Fit to 1 Page
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};
