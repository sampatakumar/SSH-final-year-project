import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Sparkles,
  GraduationCap,
  GitBranch,
  Target,
  FileText,
  Globe,
  Code2,
  Bot,
  TrendingUp,
  Award,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface WeeklyActivityItem {
  day: string;
  date: string;
  count: number;
}

interface SkillItem {
  name: string;
  level: string;
  score: number;
  category: string;
}

interface SkillGapItem {
  skill: string;
  priority: string;
  currentScore: number;
  targetScore: number;
  reason: string;
}

interface RoadmapItem {
  skill: string;
  title: string;
  type: string;
  description: string;
  isCompleted: boolean;
}

interface UserAnalyticsData {
  overview: {
    targetRole: string;
    readinessScore: number | null;
    totalSkills: number;
    learningHours: number;
    githubHealthScore: number | null;
    projectsCount: number;
    resumesCount: number;
    portfoliosCount: number;
    codingSolvedCount: number;
  };
  learning: {
    videosWatched: number;
    completedVideos: number;
    learningHours: number;
    savedCount: number;
    playlistsCount: number;
    weeklyActivity: WeeklyActivityItem[];
    recentVideos: Array<{
      videoId: string;
      title: string;
      channelTitle: string;
      watchedAt: string;
    }>;
  };
  skills: {
    total: number;
    skills: SkillItem[];
    strong: SkillItem[];
    improving: SkillItem[];
    needsAttention: SkillItem[];
  };
  gaps: {
    total: number;
    items: SkillGapItem[];
    highPriority: SkillGapItem[];
    mediumPriority: SkillGapItem[];
    lowPriority: SkillGapItem[];
  };
  roadmap: {
    totalItems: number;
    completedItems: number;
    progressPercent: number;
    items: RoadmapItem[];
  };
  github: {
    connected: boolean;
    username: string;
    repositoryCount: number;
    totalStars: number;
    dominantLanguage: string;
    topLanguages: Array<{ name: string; percentage: number }>;
    descriptionCoverage: number;
    readmeCoverage: number;
    optimizationScore: number | null;
    strengths: string[];
    weaknesses: string[];
  };
  resume: {
    count: number;
    formats: string[];
    recentResumes: Array<{
      id: string;
      title: string;
      format: string;
      updatedAt: string;
    }>;
  };
  portfolio: {
    count: number;
    publishedCount: number;
    items: Array<{
      id: string;
      projectName: string;
      url: string;
      customDomain?: string;
      publishedAt?: string;
    }>;
  };
  coding: {
    totalSubmissions: number;
    attemptedCount: number;
    solvedCount: number;
    successRate: number;
    languages: string[];
  };
  mentor: {
    conversationsCount: number;
    messagesCount: number;
    actionsGenerated: number;
    lastInteractionAt: string | null;
  };
  insights: Array<{
    type: "warning" | "info" | "success" | "gap" | "project";
    text: string;
  }>;
  timeRange: string;
}

export default function UserAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30d");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (range = timeRange, isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await apiRequest<UserAnalyticsData>(`/analytics/me?range=${range}`);
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      toast.error("Failed to load your analytics", {
        description: error instanceof Error ? error.message : "Network error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAnalytics(timeRange);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse pb-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-72 bg-muted/60 rounded-md" />
          </div>
          <div className="h-9 w-32 bg-muted rounded-lg" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border/40 p-5" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-80 rounded-2xl bg-card border border-border/40" />
          <div className="lg:col-span-4 h-80 rounded-2xl bg-card border border-border/40" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <AlertCircle className="w-12 h-12 text-destructive mb-3" />
        <h2 className="text-xl font-bold text-foreground">Could not load analytics</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-5">
          There was an issue fetching your personal career analytics.
        </p>
        <Button onClick={() => fetchAnalytics(timeRange, true)} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  const { overview, learning, skills, gaps, roadmap, github, resume, portfolio, coding, mentor, insights } = data;

  return (
    <div className="flex flex-col gap-8 pb-14 w-full animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-neo-pressed-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              My Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">
            Track your learning, skills, projects, and career growth.
          </p>
        </div>

        {/* Filters & Refresh */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center rounded-xl bg-background border border-border/40 p-1 shadow-neo-pressed-sm text-xs font-semibold">
            {[
              { label: "7D", value: "7d" },
              { label: "30D", value: "30d" },
              { label: "90D", value: "90d" },
              { label: "All", value: "all" },
            ].map((r) => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  timeRange === r.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(timeRange, true)}
            disabled={refreshing}
            className="h-8.5 px-3 rounded-xl border-border/40 shadow-neo-raised-sm"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Top 4 Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Career Readiness */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised backdrop-blur-sm relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Career Readiness
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Award className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {overview.readinessScore !== null ? (
              <div>
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {overview.readinessScore}%
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  Target: <span className="text-foreground font-semibold">{overview.targetRole}</span>
                </p>
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold text-muted-foreground">Not enough data</div>
                <Link
                  to="/dashboard/skills"
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 mt-1"
                >
                  Analyze Skills <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. EduTube Learning */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              EduTube Learning
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <GraduationCap className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">
              {learning.learningHours}h
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {learning.completedVideos} lessons completed • {learning.videosWatched} watched
            </p>
          </CardContent>
        </Card>

        {/* 3. Skill Profile */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Skills Evaluated
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">
              {skills.total}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {skills.strong.length} strong • {skills.improving.length} improving
            </p>
          </CardContent>
        </Card>

        {/* 4. GitHub Health */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              GitHub Profile Health
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <GitBranch className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {github.connected ? (
              <div>
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {github.optimizationScore !== null ? `${github.optimizationScore}%` : `${github.repositoryCount} Repos`}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                  {github.repositoryCount} repositories • {github.totalStars} stars
                </p>
              </div>
            ) : (
              <div>
                <div className="text-sm font-bold text-muted-foreground">Not connected</div>
                <Link
                  to="/dashboard/settings"
                  className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 mt-1"
                >
                  Connect GitHub <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: EduTube Weekly Activity & Career Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EduTube 7-Day Activity Bar Chart */}
        <Card className="lg:col-span-8 border-border/40 bg-card/60 shadow-neo-raised">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                EduTube Weekly Learning Activity
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Video lessons and active learning sessions recorded over the last 7 days.
              </CardDescription>
            </div>
            <Link to="/dashboard/edutube">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                Explore EduTube <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {learning.videosWatched > 0 ? (
              <div className="h-[220px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={learning.weeklyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.15)" />
                    <XAxis
                      dataKey="day"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "12px",
                      }}
                      formatter={(val: number) => [`${val} lesson sessions`, "Activity"]}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <GraduationCap className="w-10 h-10 text-muted-foreground/50 mb-2" />
                <p className="text-sm font-semibold text-foreground">No learning activity recorded yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Watch programming tutorials and full courses in EduTube to track daily learning streaks.
                </p>
                <Link to="/dashboard/edutube">
                  <Button size="sm" className="shadow-neo-raised-sm text-xs font-semibold">
                    Start Learning in EduTube <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Career Insights Panel */}
        <Card className="lg:col-span-4 border-border/40 bg-card/60 shadow-neo-raised flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Career Insights
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Dynamic observations grounded in your profile and activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {insights.length > 0 ? (
              insights.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-background border border-border/30 text-xs text-slate-300 leading-relaxed flex items-start gap-2 shadow-neo-pressed-sm"
                >
                  <span className="shrink-0 text-sm">
                    {item.type === "warning" ? "⚠️" : item.type === "success" ? "✅" : "💡"}
                  </span>
                  <span>{item.text}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Career readiness analysis is building as you complete your profile.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Row 3: Skills & Skill Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Skill Matrix Breakdown */}
        <Card className="lg:col-span-6 border-border/40 bg-card/60 shadow-neo-raised">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Skill Status Breakdown
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Proficiency levels evaluated across resumes, GitHub, and coding.
              </CardDescription>
            </div>
            <Link to="/dashboard/skills">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                View Profile <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {skills.skills.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                {skills.skills.slice(0, 8).map((s) => (
                  <div
                    key={s.name}
                    className="p-2.5 rounded-xl bg-background border border-border/30 flex items-center justify-between shadow-neo-pressed-sm"
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.category}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          s.score >= 70
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : s.score >= 40
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {s.level}
                      </span>
                      <span className="text-xs font-mono font-bold text-muted-foreground w-8 text-right">
                        {s.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-xs font-semibold text-foreground">No evaluated skills yet</p>
                <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                  Upload a resume or connect GitHub to evaluate your skill proficiencies.
                </p>
                <Link to="/dashboard/skills">
                  <Button size="sm" variant="outline" className="text-xs">
                    Evaluate Skills Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skill Gaps Priorities */}
        <Card className="lg:col-span-6 border-border/40 bg-card/60 shadow-neo-raised">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Active Skill Gaps
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Target role requirements prioritized for immediate bridging.
              </CardDescription>
            </div>
            <Link to="/dashboard/gaps">
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                View All Gaps <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {gaps.items.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                {gaps.items.slice(0, 6).map((g) => (
                  <div
                    key={g.skill}
                    className="p-3 rounded-xl bg-background border border-border/30 flex flex-col gap-1.5 shadow-neo-pressed-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{g.skill}</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          g.priority === "Critical" || g.priority === "High"
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : g.priority === "Medium"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                        }`}
                      >
                        {g.priority} Priority
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{g.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">No major skill gaps detected</p>
                <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                  Your skill profile aligns with your target role benchmarks.
                </p>
                <Link to="/dashboard/gaps">
                  <Button size="sm" variant="outline" className="text-xs">
                    Check Benchmarks
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Row 4: GitHub Health, Learning Roadmap & Other Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* GitHub Repository Health */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" /> GitHub Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {github.connected ? (
              <>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">README Coverage</span>
                    <span className="font-bold text-foreground">{github.readmeCoverage}%</span>
                  </div>
                  <Progress value={github.readmeCoverage} className="h-1.5" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Description Coverage</span>
                    <span className="font-bold text-foreground">{github.descriptionCoverage}%</span>
                  </div>
                  <Progress value={github.descriptionCoverage} className="h-1.5" />
                </div>
                <div className="pt-2 border-t border-border/20 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Top Language</span>
                  <span className="font-bold text-primary">{github.dominantLanguage || "N/A"}</span>
                </div>
                <Link to="/dashboard/github" className="block pt-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    Improve GitHub →
                  </Button>
                </Link>
              </>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-muted-foreground mb-3">No GitHub account linked</p>
                <Link to="/dashboard/settings">
                  <Button size="sm" className="w-full text-xs">
                    Connect GitHub →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Roadmap Status */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Learning Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Completion Progress</span>
                <span className="font-bold text-foreground">{roadmap.progressPercent}%</span>
              </div>
              <Progress value={roadmap.progressPercent} className="h-1.5" />
            </div>
            <div className="text-xs text-muted-foreground">
              {roadmap.completedItems} of {roadmap.totalItems} milestones completed
            </div>
            <div className="pt-2 border-t border-border/20">
              <Link to="/dashboard/roadmap">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  {roadmap.totalItems > 0 ? "View Roadmap →" : "Create Roadmap →"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Coding & Smart Mentor Snapshot */}
        <Card className="border-border/40 bg-card/60 shadow-neo-raised flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" /> Coding & Mentor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Coding Problems Solved</span>
              <span className="font-bold text-foreground">{coding.solvedCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Coding Success Rate</span>
              <span className="font-bold text-foreground">{coding.successRate}%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Mentor Actions Generated</span>
              <span className="font-bold text-foreground">{mentor.actionsGenerated}</span>
            </div>
            <div className="pt-2 border-t border-border/20">
              <Link to="/dashboard/mentor">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Open Smart Mentor →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
