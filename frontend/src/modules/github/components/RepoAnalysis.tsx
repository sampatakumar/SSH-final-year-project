import React, { useState, useMemo } from "react";
import {
  FolderGit2,
  Star,
  GitFork,
  Search,
  ExternalLink,
  Filter,
  Eye,
  Archive,
  ArrowUpDown,
  Code,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
  Code2,
  ArrowRight,
  Layers,
  FileCode,
  Bug,
  Wrench,
  BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type { GitHubRepositoryItem, RepositoryDeepAnalysis } from "../types/github.types";
import { getLanguageColor } from "./LanguageDistribution";

export interface RepoAnalysisProps {
  repositories: GitHubRepositoryItem[];
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

export const RepoAnalysis: React.FC<RepoAnalysisProps> = ({
  repositories,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"stars" | "forks" | "updated" | "size">("stars");
  const [hideForks, setHideForks] = useState(false);
  const [hideArchived, setHideArchived] = useState(false);
  const [selectedRepoForAnalysis, setSelectedRepoForAnalysis] = useState<GitHubRepositoryItem | null>(null);

  // Unique languages for dropdown
  const availableLanguages = useMemo(() => {
    const langs = new Set<string>();
    repositories.forEach((r) => {
      if (r.language) langs.add(r.language);
    });
    return Array.from(langs).sort();
  }, [repositories]);

  // Filtered & Sorted repositories
  const filteredRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        if (hideForks && repo.fork) return false;
        if (hideArchived && repo.archived) return false;
        if (selectedLanguage !== "ALL" && repo.language !== selectedLanguage) return false;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = repo.name.toLowerCase().includes(term);
          const matchDesc = repo.description && repo.description.toLowerCase().includes(term);
          const matchTopic = repo.topics && repo.topics.some((t) => t.toLowerCase().includes(term));
          if (!matchName && !matchDesc && !matchTopic) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "stars") return b.stars - a.stars;
        if (sortBy === "forks") return b.forks - a.forks;
        if (sortBy === "size") return b.sizeKB - a.sizeKB;
        if (sortBy === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return 0;
      });
  }, [repositories, searchTerm, selectedLanguage, sortBy, hideForks, hideArchived]);

  // Generate deep analysis for a selected repository
  const deepAnalysis: RepositoryDeepAnalysis | null = useMemo(() => {
    if (!selectedRepoForAnalysis) return null;
    const r = selectedRepoForAnalysis;
    const topics = Array.isArray(r.topics) ? r.topics.map((t) => t.toLowerCase()) : [];
    const nameLower = r.name.toLowerCase();
    const descLower = (r.description || "").toLowerCase();

    const isFullStack =
      topics.some((t) => ["fullstack", "full-stack", "mern", "mean", "nextjs"].includes(t)) ||
      (topics.includes("react") && topics.includes("express")) ||
      (descLower.includes("client") && descLower.includes("server"));

    const isMicroservice =
      topics.some((t) => ["microservices", "grpc", "distributed", "kafka"].includes(t)) ||
      descLower.includes("grpc") ||
      descLower.includes("microservice");

    const hasTests =
      topics.some((t) => ["test", "testing", "jest", "vitest", "pytest", "cypress"].includes(t)) ||
      nameLower.includes("test");

    const hasCicd =
      topics.some((t) => ["ci", "cd", "docker", "devops", "github-actions"].includes(t)) ||
      nameLower.includes("docker");

    const techStack = [
      r.language,
      ...topics.filter((t) => !["fullstack", "beginner", "project"].includes(t)),
    ].filter(Boolean);

    // Purpose summary
    const purpose = r.description
      ? r.description
      : `Software development project constructed in ${r.language || "code"}.`;

    const architectureSummary = isFullStack
      ? "Full-stack multi-tier client/server architecture with isolated frontend UI and backend API services."
      : isMicroservice
      ? "Distributed high-throughput microservice architecture designed for modular decoupled execution."
      : r.sizeKB > 1500
      ? "Substantial monolithic codebase with modular directory structure."
      : "Single-tier focused codebase or utility service.";

    // Strong practices
    const strongPractices = [];
    if (r.description && r.description.length > 20) {
      strongPractices.push({
        practice: "Descriptive Documentation",
        detail: "Repository features a detailed, descriptive overview explaining project purpose.",
        confidence: 0.95,
      });
    }
    if (!r.fork) {
      strongPractices.push({
        practice: "Original Authorship",
        detail: "Original standalone codebase demonstrating self-directed implementation.",
        confidence: 1.0,
      });
    }
    if (topics.length >= 3) {
      strongPractices.push({
        practice: "Discoverability & Taxonomy Hygiene",
        detail: `Curated with ${topics.length} discoverable GitHub topics and architectural tags.`,
        confidence: 0.9,
      });
    }
    if (r.stars >= 5) {
      strongPractices.push({
        practice: "Community Recognition",
        detail: `Validated with ${r.stars} stargazers indicating utility and community trust.`,
        confidence: 0.95,
      });
    }
    if (hasCicd) {
      strongPractices.push({
        practice: "Deployment & Container Hygiene",
        detail: "Demonstrated containerization signals or CI automation tags.",
        confidence: 0.85,
      });
    }

    // Technical weaknesses
    const technicalWeaknesses = [];
    if (!hasTests) {
      technicalWeaknesses.push({
        weakness: "Absence of Automated Test Signals",
        impact: "Reduces confidence in regression prevention and refactoring safety.",
        suggestion: "Add unit and integration tests (e.g. Vitest, Jest, or PyTest) with coverage thresholds.",
      });
    }
    if (!hasCicd) {
      technicalWeaknesses.push({
        weakness: "No CI/CD Pipeline Detected",
        impact: "Manual deployment and testing increase error likelihood during releases.",
        suggestion: "Configure a GitHub Actions workflow (.github/workflows/ci.yml) to lint and test automatically on push.",
      });
    }
    if (r.fork) {
      technicalWeaknesses.push({
        weakness: "Forked Repository",
        impact: "Recruiters and evaluators may not attribute code ownership to candidate without PR evidence.",
        suggestion: "Highlight upstream Pull Requests or build an original standalone reference project.",
      });
    }
    if (!r.description) {
      technicalWeaknesses.push({
        weakness: "Missing Repository Description",
        impact: "Prospective employers cannot quickly discern the problem space or technical stack.",
        suggestion: "Provide a 1-2 sentence summary of problem solved, core tech stack, and live demo link.",
      });
    }

    // Missing production elements
    const missingProductionElements = [];
    if (!hasTests) missingProductionElements.push("Automated unit / integration test suite");
    if (!hasCicd) missingProductionElements.push("Continuous Integration workflow (GitHub Actions)");
    if (!topics.includes("docker")) missingProductionElements.push("Docker containerization (Dockerfile & docker-compose)");
    missingProductionElements.push("Health check endpoint (/health or /api/health)");
    missingProductionElements.push("Environment variable validation & schema protection");

    // Security checks
    const securityVerifications = [
      {
        check: "Environment Secrets Protection",
        severity: "High" as const,
        note: "Verify .env files, API keys, and database connection strings are in .gitignore and never committed to git history.",
      },
      {
        check: "Dependency Vulnerability Audit",
        severity: "Medium" as const,
        note: "Ensure dependencies are pinned and regularly audited with `npm audit` or Dependabot.",
      },
      {
        check: "Input Sanitization & Boundary Validation",
        severity: "Medium" as const,
        note: "Verify incoming request payloads are validated with schemas (e.g., Zod, Joi) to prevent injection.",
      },
    ];

    // Refactoring tasks
    const refactoringTasks = [
      {
        task: "Decouple business logic from route handlers",
        priority: "High" as const,
        expectedBenefit: "Improves testability and isolation of domain services.",
      },
      {
        task: "Standardize API response envelopes and error types",
        priority: "Medium" as const,
        expectedBenefit: "Ensures uniform client handling for success and exception cases.",
      },
      {
        task: "Add structured logging with correlation IDs",
        priority: "Low" as const,
        expectedBenefit: "Enables production traceability and debugging across requests.",
      },
    ];

    // Recommended coding exercises
    const recommendedExercises = [
      {
        title: "REST API Validation & Error Envelope Implementation",
        skill: r.language || "TypeScript",
        link: "/dashboard/coding?taskId=api-validation",
      },
      {
        title: "Docker Multi-Stage Build Optimization",
        skill: "Docker",
        link: "/dashboard/coding?taskId=docker-build",
      },
    ];

    return {
      repoName: r.name,
      htmlUrl: r.htmlUrl,
      language: r.language,
      purpose,
      architectureSummary,
      techStack,
      strongPractices,
      technicalWeaknesses,
      missingProductionElements,
      securityVerifications,
      refactoringTasks,
      recommendedExercises,
    };
  }, [selectedRepoForAnalysis]);

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <FolderGit2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">
            Repository Directory ({filteredRepos.length} of {repositories.length})
          </h3>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-7 px-2 text-xs rounded-lg border border-border/60 bg-background text-foreground"
          >
            <option value="stars">Most Stars</option>
            <option value="forks">Most Forks</option>
            <option value="updated">Recently Updated</option>
            <option value="size">Codebase Size</option>
          </select>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects..."
            className="pl-8 h-8 text-xs bg-background/60"
          />
        </div>

        {/* Language Select */}
        <select
          value={selectedLanguage}
          onChange={(e) => onSelectLanguage(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-lg border border-border/60 bg-background text-foreground"
        >
          <option value="ALL">All Languages</option>
          {availableLanguages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        {/* Hide Forks Checkbox */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-background/60 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={hideForks}
            onChange={(e) => setHideForks(e.target.checked)}
            className="rounded text-primary"
          />
          <span>Hide Forks</span>
        </label>

        {/* Hide Archived Checkbox */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/50 bg-background/60 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <input
            type="checkbox"
            checked={hideArchived}
            onChange={(e) => setHideArchived(e.target.checked)}
            className="rounded text-primary"
          />
          <span>Hide Archived</span>
        </label>
      </div>

      {/* Repositories Cards Grid */}
      <div className="space-y-3 pt-2">
        {filteredRepos.map((repo) => (
          <div
            key={repo.name}
            className="p-4 rounded-xl border border-border/50 bg-background/60 hover:bg-background/90 transition-all space-y-2 group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <a
                  href={repo.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate group-hover:underline"
                >
                  {repo.name}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>

                {repo.fork && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/40 font-mono">
                    Fork
                  </span>
                )}
                {repo.archived && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono flex items-center gap-0.5">
                    <Archive className="h-2.5 w-2.5" /> Archived
                  </span>
                )}
              </div>

              {/* Badges & Actions */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                {repo.language && (
                  <span className="flex items-center gap-1 font-medium">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    />
                    {repo.language}
                  </span>
                )}
                <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {repo.stars}
                </span>
                <span className="flex items-center gap-0.5">
                  <GitFork className="h-3 w-3 text-purple-400" />
                  {repo.forks}
                </span>

                <button
                  onClick={() => setSelectedRepoForAnalysis(repo)}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary/20 transition-all flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Deep Analysis
                </button>
              </div>
            </div>

            {repo.description && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {repo.description}
              </p>
            )}

            {/* Topics & Meta Info */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1">
                {repo.topics?.map((topic) => (
                  <span
                    key={topic}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-mono"
                  >
                    #{topic}
                  </span>
                ))}
              </div>

              <span className="text-[10px] text-muted-foreground font-mono">
                {repo.sizeKB > 1024
                  ? `${(repo.sizeKB / 1024).toFixed(1)} MB`
                  : `${repo.sizeKB} KB`}
              </span>
            </div>
          </div>
        ))}

        {filteredRepos.length === 0 && (
          <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed text-xs text-muted-foreground">
            No repositories matched your filters.
          </div>
        )}
      </div>

      {/* Deep Repository Analysis Modal */}
      {deepAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card border border-border/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                    {deepAnalysis.repoName}
                    <span className="text-xs font-mono font-normal text-muted-foreground">
                      ({deepAnalysis.language || "Multi-language"})
                    </span>
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedRepoForAnalysis(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Purpose & Architecture */}
            <div className="p-4 rounded-xl bg-background/60 border border-border/40 space-y-2 text-xs">
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" /> Architecture & Project Purpose
              </div>
              <p className="text-muted-foreground leading-relaxed">{deepAnalysis.purpose}</p>
              <div className="pt-1 text-[11px] font-mono text-primary/90 bg-primary/5 p-2 rounded-lg border border-primary/20">
                Pattern: {deepAnalysis.architectureSummary}
              </div>
            </div>

            {/* Tech Stack */}
            {deepAnalysis.techStack.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-primary" /> Identified Technology Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {deepAnalysis.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] px-2.5 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/40 font-mono"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strong Engineering Practices */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Strong Engineering Practices
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {deepAnalysis.strongPractices.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-1"
                  >
                    <div className="font-bold text-emerald-400 flex items-center justify-between">
                      <span>{p.practice}</span>
                      <span className="text-[10px] font-mono opacity-80">
                        {Math.round(p.confidence * 100)}% Conf
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{p.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Technical Weaknesses */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-amber-500 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Technical Weaknesses & Gaps
              </span>
              <div className="space-y-2 text-xs">
                {deepAnalysis.technicalWeaknesses.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-1 text-xs"
                  >
                    <div className="font-bold text-amber-400">{w.weakness}</div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{w.impact}</p>
                    <p className="text-[11px] text-primary pt-0.5 leading-relaxed">
                      💡 <b>Recommendation:</b> {w.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Production-Readiness Elements */}
            <div className="space-y-1.5">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-rose-500" /> Missing Production-Readiness Elements
              </span>
              <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1 pl-1">
                {deepAnalysis.missingProductionElements.map((elem, idx) => (
                  <li key={idx}>{elem}</li>
                ))}
              </ul>
            </div>

            {/* Security Verifications */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5 text-orange-500" /> Security Verifications Needed
              </span>
              <div className="space-y-1.5">
                {deepAnalysis.securityVerifications.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-background/50 border border-border/40 text-[11px] flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-foreground">{s.check}</div>
                      <div className="text-muted-foreground leading-relaxed">{s.note}</div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                        s.severity === "High"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {s.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refactoring Tasks */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <Wrench className="h-3.5 w-3.5 text-primary" /> Prioritized Refactoring Tasks
              </span>
              <div className="space-y-1.5">
                {deepAnalysis.refactoringTasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-background/40 border border-border/30 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-foreground">• {task.task}</span>
                      <p className="text-[10px] text-muted-foreground pl-2">{task.expectedBenefit}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {task.priority} Priority
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-border/40">
              <a
                href={deepAnalysis.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                Open in GitHub <ExternalLink className="h-3 w-3" />
              </a>
              <button
                onClick={() => setSelectedRepoForAnalysis(null)}
                className="px-4 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted"
              >
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoAnalysis;
