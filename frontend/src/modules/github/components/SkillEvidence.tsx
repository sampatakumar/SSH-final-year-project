import React from "react";
import { Award, CheckCircle, ExternalLink, Sparkles, TrendingUp } from "lucide-react";
import type { GitHubAnalysisData } from "../types/github.types";
import { getLanguageColor } from "./LanguageDistribution";

export interface SkillEvidenceProps {
  data: GitHubAnalysisData;
}

export const SkillEvidence: React.FC<SkillEvidenceProps> = ({ data }) => {
  const { languages, repositories } = data;

  // Extract skills from languages & topic tags
  const skillEntries = Object.entries(languages).map(([name, stat]) => {
    const originalRepos = repositories.filter(
      (r) => !r.fork && r.language?.toLowerCase() === name.toLowerCase()
    ).length;

    let confidence = 0.70;
    if (originalRepos >= 2) confidence += 0.08;
    if (stat.size > 20000) confidence += 0.05;
    confidence = Math.min(0.85, Number(confidence.toFixed(2)));

    let tier: "High Evidence" | "Moderate Evidence" | "Emerging Evidence" = "Moderate Evidence";
    if (confidence >= 0.80) tier = "High Evidence";
    else if (confidence < 0.74) tier = "Emerging Evidence";

    return {
      name,
      stat,
      originalRepos,
      confidence,
      tier,
    };
  });

  if (skillEntries.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">
            Smart Skill Hub Evidence Integration (Weighted v1.0.0)
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          GitHub Cap: Max 40 Points
        </span>
      </div>

      {/* Skill Evidence Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {skillEntries.map((entry) => (
          <div
            key={entry.name}
            className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getLanguageColor(entry.name) }}
                />
                {entry.name}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  entry.tier === "High Evidence"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                }`}
              >
                {entry.tier}
              </span>
            </div>

            {/* Confidence Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Confidence Calibration</span>
                <span>{Math.round(entry.confidence * 100)}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round(entry.confidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Signals */}
            <div className="text-[10px] text-muted-foreground pt-0.5">
              Observed across {entry.stat.repoCount} repo{entry.stat.repoCount > 1 ? "s" : ""} ({entry.stat.percentage}% public code share)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillEvidence;
