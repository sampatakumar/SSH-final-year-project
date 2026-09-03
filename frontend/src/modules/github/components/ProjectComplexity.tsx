import React from "react";
import { Layers, Sparkles, ExternalLink, ShieldCheck } from "lucide-react";
import type { PortfolioComplexityData } from "../types/github.types";

export interface ProjectComplexityProps {
  complexity?: PortfolioComplexityData;
}

export const ProjectComplexity: React.FC<ProjectComplexityProps> = ({ complexity }) => {
  if (!complexity) return null;

  const { summary, topComplexProjects } = complexity;

  const getLevelBadge = (level: "Beginner" | "Intermediate" | "Advanced") => {
    switch (level) {
      case "Advanced":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "Intermediate":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Project Complexity Distribution</h3>
        </div>

        {/* Breakdown Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 font-medium">
            {summary.advancedCount} Advanced
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 font-medium">
            {summary.intermediateCount} Intermediate
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 border border-slate-500/20 font-medium">
            {summary.beginnerCount} Beginner
          </span>
        </div>
      </div>

      {/* Top Complex Projects Cards */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Top Architecture-Depth Projects
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topComplexProjects.map((proj, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-foreground truncate">
                  {proj.repoName}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${getLevelBadge(
                    proj.level
                  )}`}
                >
                  {proj.level}
                </span>
              </div>

              {/* Identified Reasons */}
              <div className="flex flex-wrap gap-1">
                {proj.reasons.map((r, rIdx) => (
                  <span
                    key={rIdx}
                    className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium"
                  >
                    ✓ {r}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProjectComplexity;
