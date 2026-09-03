import React from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, Activity, FileText, Cpu, GitPullRequest } from "lucide-react";
import type { EngineeringQualityData } from "../types/github.types";

export interface EngineeringQualityProps {
  quality?: EngineeringQualityData;
}

export const EngineeringQuality: React.FC<EngineeringQualityProps> = ({ quality }) => {
  if (!quality) return null;

  const { overallScore, grade, dimensions, strengths, improvements } = quality;

  const dimensionCards = [
    {
      title: "Documentation & Context",
      score: dimensions.documentation,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Testing & CI/CD Signals",
      score: dimensions.testingAndCicd,
      icon: Activity,
      color: "text-emerald-500",
    },
    {
      title: "Architecture & Stack Depth",
      score: dimensions.architectureDiversity,
      icon: Cpu,
      color: "text-purple-500",
    },
    {
      title: "Repository Hygiene & Ownership",
      score: dimensions.repositoryHygiene,
      icon: GitPullRequest,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Engineering Quality & Hygiene</h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Deterministic Score:</span>
          <span className="text-sm font-black text-primary font-mono">{overallScore}/100</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            {grade}
          </span>
        </div>
      </div>

      {/* 4 Dimension Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {dimensionCards.map((dim, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <dim.icon className={`h-3.5 w-3.5 ${dim.color}`} />
                <span>{dim.title}</span>
              </div>
              <span className="font-bold font-mono text-muted-foreground">{dim.score}%</span>
            </div>

            <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, dim.score)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Strengths */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Observed Strengths
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {strengths.map((str, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> High-Impact Improvements
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-500 font-bold">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EngineeringQuality;
