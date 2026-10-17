import React from "react";
import { GitCompare, Award, Check, AlertCircle, ArrowRight } from "lucide-react";
import type { CourseComparisonData } from "../types/smartMentor.types";

interface CourseComparisonViewProps {
  comparison: CourseComparisonData;
}

export const CourseComparisonView: React.FC<CourseComparisonViewProps> = ({ comparison }) => {
  if (!comparison || !comparison.courses || comparison.courses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl p-4 bg-muted/30 border border-border/40 space-y-3 text-left">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
          <GitCompare className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Curriculum Comparison & Evidence-Based Trade-Offs
          </h4>
          <p className="text-[11px] text-muted-foreground font-medium">
            Comparing verified course structures, practical exercises, and interview relevance
          </p>
        </div>
      </div>

      {/* Starting Pick Highlight */}
      {comparison.startingRecommendationReason && (
        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground flex items-start gap-2">
          <Award className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-primary block text-[11px] uppercase tracking-wider">
              Recommended Starting Course:
            </span>
            <p className="text-xs leading-relaxed text-foreground/90 font-medium">
              {comparison.startingRecommendationReason}
            </p>
          </div>
        </div>
      )}

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
        {comparison.courses.map((c) => (
          <div
            key={c.courseId}
            className={`p-3 rounded-xl border text-xs space-y-2 flex flex-col justify-between ${
              c.isStartingPick
                ? "bg-background border-primary/40 shadow-neo-raised-sm"
                : "bg-background/60 border-border/30"
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-foreground text-xs line-clamp-1">{c.title}</span>
                {c.isStartingPick && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-primary text-primary-foreground shrink-0">
                    Top Pick
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground block font-medium">
                by {c.instructor}
              </span>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex items-start gap-1 text-emerald-400">
                  <Check className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground font-semibold">Strength: </strong>
                    {c.strength}
                  </span>
                </div>

                <div className="flex items-start gap-1 text-primary">
                  <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-foreground font-semibold">Best For: </strong>
                    {c.bestFor}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border/20 flex items-start gap-1 text-[10px] text-muted-foreground">
              <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-amber-400/80" />
              <span>
                <strong className="text-foreground/80 font-semibold">Trade-off: </strong>
                {c.tradeOff}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
