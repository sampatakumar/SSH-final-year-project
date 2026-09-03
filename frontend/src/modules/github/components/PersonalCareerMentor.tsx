import React, { useState } from "react";
import {
  Compass,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Send,
  Loader2,
  Clock,
  Layers,
  Award,
  FolderGit2,
  ShieldCheck,
  Calendar,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Terminal,
  FileCode,
  CheckSquare,
  Square,
  HelpCircle,
  Copy,
  Download,
  Check,
  FileText,
  X,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api";
import type {
  PersonalCareerMentorData,
  MentorQnAResponse,
  GitHubAnalysisData,
  ProjectToImproveItem,
  AuditedRepoQuality,
} from "../types/github.types";

export interface PersonalCareerMentorProps {
  mentorData: PersonalCareerMentorData;
  analysis: GitHubAnalysisData;
  targetRole: string;
  onRoleChange: (newRole: string) => void;
}

const QUICK_PROMPTS = [
  "What should I learn next?",
  "Which project should I improve?",
  "Am I ready for my target role?",
  "How can I improve my GitHub?",
  "What should I add to my resume?",
  "Give me a 30-day plan",
];

export const PersonalCareerMentor: React.FC<PersonalCareerMentorProps> = ({
  mentorData,
  analysis,
  targetRole,
  onRoleChange,
}) => {
  const [questionInput, setQuestionInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [activeQnA, setActiveQnA] = useState<MentorQnAResponse | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Project Coach interactive state
  const [activeTier, setActiveTier] = useState<"showcase" | "improve" | "needsWork" | "archive">("improve");
  const [selectedRepoForReadme, setSelectedRepoForReadme] = useState<string | null>(null);
  const [generatedReadme, setGeneratedReadme] = useState<string | null>(null);
  const [isGeneratingReadme, setIsGeneratingReadme] = useState(false);
  const [copiedReadme, setCopiedReadme] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const toggleTask = (id: string) => {
    setCheckedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAsk = async (queryToAsk: string) => {
    if (!queryToAsk.trim()) return;

    setIsAsking(true);
    try {
      const res = await apiRequest<{ answer: MentorQnAResponse }>("/github/mentor/ask", {
        method: "POST",
        body: {
          username: analysis.username,
          question: queryToAsk.trim(),
          role: targetRole,
          profileData: analysis,
        },
      });

      if (res.data?.answer) {
        setActiveQnA(res.data.answer);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to get mentor guidance");
    } finally {
      setIsAsking(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setQuestionInput(prompt);
    handleAsk(prompt);
  };

  const handleGenerateReadme = async (repoName: string) => {
    setSelectedRepoForReadme(repoName);
    setIsGeneratingReadme(true);
    setGeneratedReadme(null);
    setCopiedReadme(false);
    setCopiedDesc(false);

    try {
      const res = await apiRequest<{
        readmeMarkdown: string;
        suggestedDescription: string;
      }>("/github/mentor/readme", {
        method: "POST",
        body: {
          username: analysis.username,
          repoName,
          role: targetRole,
          profileData: analysis,
        },
      });

      if (res.data?.readmeMarkdown) {
        setGeneratedReadme(res.data.readmeMarkdown);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate README draft");
    } finally {
      setIsGeneratingReadme(false);
    }
  };

  const handleCopyReadme = () => {
    if (!generatedReadme) return;
    navigator.clipboard.writeText(generatedReadme);
    setCopiedReadme(true);
    toast.success("README.md copied to clipboard!");
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  const handleDownloadReadme = (repoName: string) => {
    if (!generatedReadme) return;
    const blob = new Blob([generatedReadme], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repoName}-README.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${repoName}-README.md`);
  };

  const {
    hero,
    readinessDimensions,
    nextActions,
    githubImprovementPlan,
    repositoryActionCenter,
    topProjectsToShowcase,
    careerPath,
    weeklyPlan,
    milestones,
    projectCoach,
  } = mentorData;

  const getDimensionBadge = (status: string) => {
    switch (status) {
      case "Strong":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Developing":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "Limited Evidence":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
  };

  const getScorecardBadge = (statusStr: string) => {
    if (statusStr.includes("✓") || statusStr.includes("Good") || statusStr.includes("Available") || statusStr.includes("Detected")) {
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
    if (statusStr.includes("⚠") || statusStr.includes("Improvement")) {
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
    return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-150">
      {/* 1. MENTOR HERO SECTION */}
      <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl border border-primary/20 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black text-foreground tracking-tight">
                Personal Career Mentor & Project Quality Coach
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Your GitHub repositories, skills, resume, and learning roadmap — evaluated from a recruiter & engineering lead perspective.
            </p>
          </div>

          {/* Target Role Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3.5 w-3.5 text-primary" /> Target Role:
            </span>
            <select
              value={targetRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="h-9 px-3 text-xs font-bold rounded-xl border border-primary/30 bg-background text-foreground shadow-xs cursor-pointer"
            >
              <option value="Full Stack Developer">Full Stack Developer</option>
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="Backend Node.js Engineer">Backend Node.js Engineer</option>
              <option value="Software Engineer (General / Core CS)">Software Engineer (Core CS)</option>
            </select>
          </div>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-background/80 border border-border/50 space-y-1">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Current Position
            </div>
            <div className="text-xs font-bold text-foreground leading-snug">
              {hero.currentStage}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/80 border border-border/50 space-y-1">
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Strongest Area
            </div>
            <div className="text-xs font-bold text-foreground leading-snug">
              {hero.strongestArea}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-background/80 border border-border/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Biggest Gap
            </div>
            <div className="text-xs font-bold text-foreground leading-snug">
              {hero.biggestGap}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
            <div className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Next Priority
            </div>
            <div className="text-xs font-bold text-foreground leading-snug">
              {hero.nextPriority}
            </div>
          </div>
        </div>
      </div>

      {/* 2. "START WITH THIS PROJECT" HIGHEST IMPACT BANNER */}
      {projectCoach?.startWithProject && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-background border-2 border-primary/40 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider">
                ⚡ Start With This Project
              </span>
              <h3 className="font-extrabold text-base text-foreground">
                {projectCoach.startWithProject.repoName}
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/80 text-muted-foreground">
                {projectCoach.startWithProject.language} • {projectCoach.startWithProject.projectType}
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => handleGenerateReadme(projectCoach.startWithProject!.repoName)}
              className="font-bold text-xs h-8 gap-1.5 shadow-sm shrink-0"
            >
              <Sparkles className="h-3.5 w-3.5" /> Improve README
            </Button>
          </div>

          <p className="text-xs text-foreground/90 leading-relaxed font-medium">
            {projectCoach.startWithProject.whyStartHere}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
            {projectCoach.startWithProject.top3Actions.map((action, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-background/90 border border-primary/20 text-foreground font-medium flex items-start gap-1.5"
              >
                <span className="text-primary font-bold">#{idx + 1}</span>
                <span>{action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DEDICATED "PROJECTS TO IMPROVE" DASHBOARD */}
      {projectCoach && (
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">
                  Projects to Improve (Repository Documentation & Quality Coach)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Identifies missing descriptions, missing READMEs, and technical presentation gaps across your repositories.
              </p>
            </div>

            {/* Smart Prioritization Tier Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTier("improve")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTier === "improve"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                ⭐ Improve Next ({projectCoach.classifiedTiers.improveNext.length})
              </button>
              <button
                onClick={() => setActiveTier("showcase")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTier === "showcase"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🔥 Showcase Now ({projectCoach.classifiedTiers.showcaseNow.length})
              </button>
              <button
                onClick={() => setActiveTier("needsWork")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTier === "needsWork"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                🛠 Needs Work ({projectCoach.classifiedTiers.needsWork.length})
              </button>
              <button
                onClick={() => setActiveTier("archive")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTier === "archive"
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                📦 Archive ({projectCoach.classifiedTiers.archiveLowPriority.length})
              </button>
            </div>
          </div>

          {/* Active Tier Repositories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(activeTier === "improve"
              ? projectCoach.classifiedTiers.improveNext
              : activeTier === "showcase"
              ? projectCoach.classifiedTiers.showcaseNow
              : activeTier === "needsWork"
              ? projectCoach.classifiedTiers.needsWork
              : projectCoach.classifiedTiers.archiveLowPriority
            ).map((audit) => (
              <div
                key={audit.repoName}
                className="p-4 rounded-xl bg-background/80 border border-border/50 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <a
                          href={audit.htmlUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-xs text-foreground hover:text-primary transition-colors flex items-center gap-1"
                        >
                          {audit.repoName} <ExternalLink className="h-3 w-3" />
                        </a>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {audit.language}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {audit.projectType}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        audit.recruiterEvaluation.score >= 5
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : audit.recruiterEvaluation.score >= 3
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                      }`}
                    >
                      Recruiter: {audit.recruiterEvaluation.score}/7
                    </span>
                  </div>

                  {/* 8-Point Quality Scorecard */}
                  <div className="grid grid-cols-4 gap-1 text-[10px] pt-1">
                    <div className="p-1 rounded bg-muted/40 text-center">
                      <span className="block text-[9px] text-muted-foreground">Docs</span>
                      <strong className={audit.scorecard.documentation.includes("Good") ? "text-emerald-500" : "text-amber-500"}>
                        {audit.scorecard.documentation}
                      </strong>
                    </div>
                    <div className="p-1 rounded bg-muted/40 text-center">
                      <span className="block text-[9px] text-muted-foreground">README</span>
                      <strong className={audit.scorecard.readme.includes("Missing") ? "text-rose-500" : "text-amber-500"}>
                        {audit.scorecard.readme}
                      </strong>
                    </div>
                    <div className="p-1 rounded bg-muted/40 text-center">
                      <span className="block text-[9px] text-muted-foreground">Desc</span>
                      <strong className={audit.scorecard.description.includes("Good") ? "text-emerald-500" : "text-rose-500"}>
                        {audit.scorecard.description}
                      </strong>
                    </div>
                    <div className="p-1 rounded bg-muted/40 text-center">
                      <span className="block text-[9px] text-muted-foreground">Demo</span>
                      <strong className={audit.scorecard.liveDemo.includes("Available") ? "text-emerald-500" : "text-muted-foreground"}>
                        {audit.scorecard.liveDemo}
                      </strong>
                    </div>
                  </div>

                  {/* Missing Description Notice & Suggested Description */}
                  {audit.scorecard.description.includes("Missing") && (
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1 text-amber-900 dark:text-amber-200">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Missing Repository Description
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Suggested: <em>"{audit.suggestedDescription}"</em>
                      </p>
                    </div>
                  )}

                  {/* Highest-impact improvements list */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Highest-Impact Improvements:
                    </span>
                    <ul className="space-y-1 text-[11px] text-muted-foreground">
                      {audit.highestImpactImprovements.map((imp, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-primary font-bold">•</span>
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Stars: {audit.stars} • Forks: {audit.forks}
                  </span>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateReadme(audit.repoName)}
                    className="text-xs h-7 gap-1 font-semibold"
                  >
                    <Sparkles className="h-3 w-3 text-primary" /> Improve README
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CAREER READINESS DIMENSIONS */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Career Readiness Analysis ({targetRole})
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Evidence-Grounded Dimensions
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readinessDimensions.map((dim, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-foreground">
                  {dim.dimension}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getDimensionBadge(
                    dim.status
                  )}`}
                >
                  {dim.status}
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.max(10, dim.score)}%` }}
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {dim.evidence}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. "WHAT SHOULD I DO NEXT?" PRIORITIZED ACTION PLAN */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              What Should I Do Next? (Prioritized Action Plan)
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Next 30 Days Focus
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {nextActions.map((act) => (
            <div
              key={act.order}
              className="p-4 rounded-xl bg-background/60 border border-border/40 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-primary">
                    {act.order}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      act.priority === "Critical"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : act.priority === "High"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}
                  >
                    Priority: {act.priority}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-foreground">
                  {act.title}
                </h4>

                <ul className="space-y-1.5 text-[11px] text-muted-foreground pt-1">
                  {act.requirements.map((req, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-1.5">
                      <span className="text-primary font-bold">•</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-border/40 text-[11px] space-y-1">
                <div className="text-muted-foreground">
                  <strong className="text-foreground">Why:</strong> {act.why}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" /> Est. {act.estimatedHours} hours
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. GITHUB PROFILE & REPOSITORY IMPROVEMENT CHECKLIST */}
      <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Dedicated GitHub Profile & Repository Improvement Plan
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            Portfolio Hygiene
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Profile */}
          <div className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-2">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" /> Profile Branding
            </h4>
            <ul className="space-y-1.5 text-muted-foreground text-[11px]">
              {githubImprovementPlan.profile.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Repositories */}
          <div className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-2">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <FolderGit2 className="h-3.5 w-3.5 text-blue-500" /> Repositories
            </h4>
            <ul className="space-y-1.5 text-muted-foreground text-[11px]">
              {githubImprovementPlan.repositories.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Engineering */}
          <div className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-2">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" /> Engineering
            </h4>
            <ul className="space-y-1.5 text-muted-foreground text-[11px]">
              {githubImprovementPlan.engineering.map((e, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Activity */}
          <div className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-2">
            <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-purple-500" /> Activity Rhythm
            </h4>
            <ul className="space-y-1.5 text-muted-foreground text-[11px]">
              {githubImprovementPlan.activity.map((a, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-purple-500 font-bold">✓</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 7. REPOSITORY ACTION CENTER & TOP PROJECTS SHOWCASE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repository Action Center */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                Repository Action Center
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Audit Checklist
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            {repositoryActionCenter.map((repo) => (
              <div
                key={repo.repoName}
                className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground truncate max-w-xs">
                    {repo.repoName}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {repo.language}
                  </span>
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="p-1 rounded bg-muted/40 text-muted-foreground">
                    Docs: <strong className="text-foreground">{repo.documentationStatus}</strong>
                  </div>
                  <div className="p-1 rounded bg-muted/40 text-muted-foreground">
                    Tests: <strong className="text-foreground">{repo.testingStatus}</strong>
                  </div>
                  <div className="p-1 rounded bg-muted/40 text-muted-foreground">
                    CI/CD: <strong className="text-foreground">{repo.cicdStatus}</strong>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="text-[11px] text-primary flex flex-wrap gap-1 pt-0.5">
                  {repo.actionItems.map((act, aIdx) => (
                    <span key={aIdx} className="bg-primary/10 px-1.5 py-0.2 rounded">
                      → {act}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 3 Projects to Showcase */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground">
                  Top Projects to Showcase & Improve
                </h3>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                Recruiter Impact
              </span>
            </div>

            <div className="space-y-3">
              {topProjectsToShowcase.map((proj) => (
                <div
                  key={proj.rank}
                  className="p-3.5 rounded-xl bg-background/60 border border-border/40 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-mono text-[10px]">
                        {proj.rank}
                      </span>
                      <span>{proj.repoName}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      {proj.portfolioValue}
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground">
                    <strong>Why:</strong> {proj.why}
                  </div>
                  <div className="text-[11px] text-primary">
                    <strong>Improve:</strong> {proj.whatToImprove}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Career Path Flow */}
          <div className="mt-4 p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Dynamic Career Path
            </h4>
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-foreground">
              <span className="px-2 py-1 rounded bg-muted/80">{careerPath.current}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="px-2 py-1 rounded bg-primary/10 text-primary">{careerPath.nextSkill}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="px-2 py-1 rounded bg-primary/10 text-primary">{careerPath.nextProject}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {careerPath.targetRole}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. WEEKLY CAREER PLAN & 30/60/90 DAY MILESTONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Plan */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                This Week (Practical Action Checklist)
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Actionable
            </span>
          </div>

          <div className="space-y-3">
            {weeklyPlan.map((item) => {
              const isDone = Boolean(checkedTasks[item.id]);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleTask(item.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-1 text-xs ${
                    isDone
                      ? "bg-emerald-500/5 border-emerald-500/30 opacity-70"
                      : "bg-background/60 border-border/40 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      {isDone ? (
                        <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={`font-semibold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.task}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {item.estimatedHours}h
                    </span>
                  </div>

                  <div className="text-[11px] text-muted-foreground pl-6">
                    {item.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 30 / 60 / 90 Day Plan */}
        <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm text-foreground">
                30 / 60 / 90 Day Strategic Plan
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Milestones
            </span>
          </div>

          <div className="space-y-3 text-xs">
            {/* 30 Days */}
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <div className="font-bold text-primary text-xs">
                30 DAYS — {milestones.days30.phase}
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground pl-1">
                {milestones.days30.goals.map((g, i) => (
                  <li key={i}>• {g}</li>
                ))}
              </ul>
            </div>

            {/* 60 Days */}
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <div className="font-bold text-foreground text-xs">
                60 DAYS — {milestones.days60.phase}
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground pl-1">
                {milestones.days60.goals.map((g, i) => (
                  <li key={i}>• {g}</li>
                ))}
              </ul>
            </div>

            {/* 90 Days */}
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <div className="font-bold text-foreground text-xs">
                90 DAYS — {milestones.days90.phase}
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground pl-1">
                {milestones.days90.goals.map((g, i) => (
                  <li key={i}>• {g}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 9. GROUNDED PERSONAL MENTOR Q&A PANEL */}
      <div className="bg-card rounded-2xl border border-primary/30 p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Ask Your Personal Career Mentor
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Grounded in your actual GitHub evidence & skill profile
          </span>
        </div>

        {/* Quick Prompt Pills */}
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              disabled={isAsking}
              className="px-3 py-1.5 rounded-xl bg-background border border-border/60 hover:border-primary hover:bg-primary/5 text-xs text-muted-foreground hover:text-foreground font-medium transition-all"
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Ask Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(questionInput);
          }}
          className="flex gap-2"
        >
          <Input
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder="Ask mentor anything about your career progression (e.g. How can I balance my frontend/backend skills?)..."
            className="text-xs h-10 bg-background/80"
            disabled={isAsking}
          />
          <Button
            type="submit"
            disabled={isAsking || !questionInput.trim()}
            className="h-10 px-5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            {isAsking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" /> Ask
              </>
            )}
          </Button>
        </form>

        {/* Q&A Structured Answer Display */}
        {activeQnA && (
          <div className="p-5 rounded-2xl bg-background/80 border border-primary/20 space-y-4 animate-in fade-in-50 duration-150">
            <div className="text-xs font-bold text-primary flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" /> Mentor Guidance for: "{activeQnA.question}"
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Situation & Evidence */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
                <h5 className="font-bold text-foreground flex items-center gap-1">
                  1. Current Situation
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {activeQnA.currentSituation}
                </p>

                <h5 className="font-bold text-foreground flex items-center gap-1 pt-2">
                  2. Observed Evidence
                </h5>
                <ul className="space-y-1 text-[11px] text-muted-foreground">
                  {activeQnA.evidence?.map((ev, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-primary font-bold">•</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gap & Recommendation */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1.5">
                <h5 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  3. Key Gap
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {activeQnA.gap}
                </p>

                <h5 className="font-bold text-primary flex items-center gap-1 pt-2">
                  4. Recommendation
                </h5>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {activeQnA.recommendation}
                </p>
              </div>
            </div>

            {/* Action & Expected Outcome */}
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
              <h5 className="font-bold text-foreground flex items-center gap-1">
                5. Immediate Action Steps
              </h5>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                {activeQnA.action?.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-primary font-bold">→</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t border-primary/10 text-[11px] text-muted-foreground">
                <strong className="text-foreground">6. Expected Outcome:</strong> {activeQnA.expectedOutcome}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 10. PROJECT README GENERATOR MODAL */}
      {selectedRepoForReadme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2.5">
                <FileCode className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    Grounded README Draft: {selectedRepoForReadme}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Generated from verified repository languages, structure, and {targetRole} standards.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRepoForReadme(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4 text-xs">
              {isGeneratingReadme ? (
                <div className="py-20 text-center space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="font-semibold text-foreground">
                    Synthesizing grounded README markdown for "{selectedRepoForReadme}"...
                  </p>
                </div>
              ) : generatedReadme ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground font-mono">
                      README.md Markdown Preview
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyReadme}
                        className="text-xs h-8 gap-1.5"
                      >
                        {copiedReadme ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedReadme ? "Copied" : "Copy Markdown"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadReadme(selectedRepoForReadme)}
                        className="text-xs h-8 gap-1.5 font-bold"
                      >
                        <Download className="h-3.5 w-3.5" /> Download README.md
                      </Button>
                    </div>
                  </div>

                  <pre className="p-4 rounded-xl bg-background border border-border/50 text-foreground font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {generatedReadme}
                  </pre>
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Could not load README draft. Please try again.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border/40 bg-muted/20 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRepoForReadme(null)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalCareerMentor;
