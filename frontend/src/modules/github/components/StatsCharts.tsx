import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import type { GitHubRepositoryItem } from "../types/github.types";

export interface StatsChartsProps {
  repositories: GitHubRepositoryItem[];
}

export const StatsCharts: React.FC<StatsChartsProps> = ({ repositories = [] }) => {
  // 1. Top Starred Repositories Data
  const topStarredData = [...(repositories || [])]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 7)
    .map((r) => ({
      name: r.name.length > 13 ? r.name.slice(0, 11) + "..." : r.name,
      fullName: r.name,
      stars: r.stars,
      forks: r.forks,
      language: r.language || "Other",
    }));

  // 2. Creation Timeline by Year
  const timelineMap: Record<string, number> = {};
  repositories.forEach((r) => {
    if (r.updatedAt) {
      const year = new Date(r.updatedAt).getFullYear().toString();
      timelineMap[year] = (timelineMap[year] || 0) + 1;
    }
  });

  const timelineData = Object.entries(timelineMap)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
    .map(([year, count]) => ({ year, count }));

  // Fallback default timeline if empty
  if (timelineData.length === 0) {
    const currentYear = new Date().getFullYear().toString();
    timelineData.push({ year: currentYear, count: repositories.length });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Top Starred Repositories Chart */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-amber-500" />
            <h3 className="font-bold text-sm text-foreground">
              Top Starred Projects
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            Community Traction
          </span>
        </div>

        <div className="h-56 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topStarredData}
              margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="name"
                angle={-20}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 10, fill: "currentColor" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "currentColor" }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground p-2.5 rounded-lg border border-border text-xs shadow-md">
                        <div className="font-bold truncate max-w-xs">{item.fullName}</div>
                        <div className="text-amber-500 font-semibold mt-1">
                          ⭐ {item.stars} stars · 🍴 {item.forks} forks
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Stack: {item.language}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="stars" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Repository Annual Timeline */}
      <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="font-bold text-sm text-foreground">
              Repository Activity Growth
            </h3>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            Annual Velocity
          </span>
        </div>

        <div className="h-56 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={timelineData}
              margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
            >
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "currentColor" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "currentColor" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-popover text-popover-foreground p-2.5 rounded-lg border border-border text-xs shadow-md">
                        <div className="font-bold">Year {item.year}</div>
                        <div className="text-emerald-500 font-semibold mt-1">
                          {item.count} active projects updated
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#growthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsCharts;
