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
  totalRepos: number;
  dominantLanguage: string;
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({
  stats,
  totalRepos,
  dominantLanguage,
}) => {
  const originalRepos = Math.max(0, totalRepos - stats.forkedCount);
  const originalityRatio = totalRepos > 0
    ? Math.round((originalRepos / totalRepos) * 100)
    : 100;

  const sizeFormatted = stats.totalSizeKB > 1024
    ? `${(stats.totalSizeKB / 1024).toFixed(1)} MB`
    : `${stats.totalSizeKB} KB`;

  const avgStars = originalRepos > 0
    ? (stats.totalStars / originalRepos).toFixed(1)
    : "0.0";

  const cards = [
    {
      title: "Total Repositories",
      value: totalRepos,
      subValue: `${originalRepos} original · ${stats.forkedCount} forked`,
      icon: FolderGit2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Stars Earned",
      value: stats.totalStars,
      subValue: `Avg ${avgStars} stars / original repo`,
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Repository Forks",
      value: stats.totalForks,
      subValue: "Community project clones",
      icon: GitFork,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Total Watchers",
      value: stats.totalWatchers,
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
      value: stats.totalIssues,
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
      subValue: `${originalRepos} of ${totalRepos} projects owned`,
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
