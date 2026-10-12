import React from "react";
import {
  FolderGit2,
  Star,
  GitFork,
  Eye,
  HardDrive,
  AlertCircle,
  Code2,
  ShieldCheck,
} from "lucide-react";
import type { AggregateGitHubStats } from "../types/github.types";

export interface StatsSummaryProps {
  stats: AggregateGitHubStats;
  totalRepos?: number;
  dominantLanguage?: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  stats,
  totalRepos = 0,
  dominantLanguage = "JavaScript",
}) => {
  const safeTotalRepos = Number.isFinite(totalRepos) ? Math.max(0, Number(totalRepos)) : 0;
  const safeForked = Number.isFinite(stats?.forkedCount) ? Math.max(0, Number(stats.forkedCount)) : 0;
  const safeTotalStars = Number.isFinite(stats?.totalStars) ? Math.max(0, Number(stats.totalStars)) : 0;
  const safeSizeKB = Number.isFinite(stats?.totalSizeKB) ? Math.max(0, Number(stats.totalSizeKB)) : 0;
  const safeForks = Number.isFinite(stats?.totalForks) ? Math.max(0, Number(stats.totalForks)) : 0;
  const safeWatchers = Number.isFinite(stats?.totalWatchers) ? Math.max(0, Number(stats.totalWatchers)) : 0;
  const safeIssues = Number.isFinite(stats?.totalIssues) ? Math.max(0, Number(stats.totalIssues)) : 0;

  const originalRepos = Math.max(0, safeTotalRepos - safeForked);
  const originalityRatio = safeTotalRepos > 0
    ? Math.round((originalRepos / safeTotalRepos) * 100)
    : 0;

  const sizeFormatted = safeSizeKB > 1024
    ? `${(safeSizeKB / 1024).toFixed(1)} MB`
    : `${safeSizeKB} KB`;

  const avgStars = originalRepos > 0
    ? (safeTotalStars / originalRepos).toFixed(1)
    : safeTotalRepos > 0
    ? "0.0 (forked only)"
    : "N/A (0 repos)";

  const cards = [
    {
      title: "Total Repositories",
      value: safeTotalRepos,
      subValue: `${originalRepos} original · ${safeForked} forked`,
      icon: FolderGit2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Stars Earned",
      value: safeTotalStars,
      subValue: `Avg ${avgStars} stars / original repo`,
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Repository Forks",
      value: safeForks,
      subValue: "Community project clones",
      icon: GitFork,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Watchers",
      value: safeWatchers,
      subValue: "Active project subscribers",
      icon: Eye,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Public Code Volume",
      value: sizeFormatted,
      subValue: "Indexed repository bytes",
      icon: HardDrive,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Open Issues Tracked",
      value: safeIssues,
      subValue: "Active tasks & bug reports",
      icon: AlertCircle,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Dominant Technology",
      value: dominantLanguage || "JavaScript",
      subValue: "Primary language stack",
      icon: Code2,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Portfolio Originality",
      value: `${originalityRatio}%`,
      subValue: `${originalRepos} of ${safeTotalRepos} projects owned`,
      icon: ShieldCheck,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-xl bg-card border border-border/50 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-foreground tracking-tight">
                {card.value}
              </div>
              <div className="text-[11px] text-muted-foreground/90 mt-0.5 font-medium">
                {card.subValue}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsSummary;
