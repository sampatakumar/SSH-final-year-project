import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  FolderGit2,
  Layers,
  ChevronRight,
  ShieldCheck,
  Code2,
  HelpCircle,
  X,
  Clock,
  Star,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import type {
  GitHubAnalysisData,
  SkillEvidenceItem,
  SkillEvidencePackage,
  SkillEvidenceProps,
} from "../types/github.types";
import { getLanguageColor } from "./LanguageDistribution";
import { apiRequest } from "@/lib/api";

export const SkillEvidence: React.FC<SkillEvidenceProps> = ({
  data,
  username,
  evidencePackage,
  isLoading: initialLoading = false,
  error: initialError = null,
  onRetry,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [fetchedPackage, setFetchedPackage] = useState<SkillEvidencePackage | null>(evidencePackage || null);

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"confidence" | "repos" | "name">("confidence");
  const [selectedSkill, setSelectedSkill] = useState<SkillEvidenceItem | null>(null);

  // Fetch package if username is provided but data is missing
  useEffect(() => {
    if (!data && username && !fetchedPackage && !initialError) {
      const fetchEvidence = async () => {
        try {
          setInternalLoading(true);
          setInternalError(null);
          const res = await apiRequest<{ evidence: SkillEvidencePackage }>(
            `/github/evidence/${encodeURIComponent(username.trim())}`
          );
          if (res.data?.evidence) {
            setFetchedPackage(res.data.evidence);
          }
        } catch (err: any) {
          setInternalError(err.message || "Failed to load skill evidence package.");
        } finally {
          setInternalLoading(false);
        }
      };

      fetchEvidence();
    }
  }, [data, username, fetchedPackage, initialError]);

  const isLoading = initialLoading || internalLoading;
  const error = initialError || internalError;

  // Extract skills from data or package safely
  const skillEntries: SkillEvidenceItem[] = useMemo(() => {
    // 1. If we have a standardized fetched package
    if (fetchedPackage && Array.isArray(fetchedPackage.skills) && fetchedPackage.skills.length > 0) {
      return fetchedPackage.skills.map((item) => {
        let tier: "High Evidence" | "Moderate Evidence" | "Emerging Evidence" = "Moderate Evidence";
        if (item.confidence >= 0.8) tier = "High Evidence";
        else if (item.confidence < 0.74) tier = "Emerging Evidence";

        return {
          ...item,
          tier,
        };
      });
    }

    // 2. If data is provided, derive evidence deterministically
    const languages = data?.languages || {};
    const repositories = Array.isArray(data?.repositories) ? data.repositories : [];

    const entries = Object.entries(languages).map(([name, stat]) => {
      const matchingRepos = repositories.filter(
        (r) => r.language?.toLowerCase() === name.toLowerCase()
      );
      const originalRepos = matchingRepos.filter((r) => !r.fork).length;
      const forkedRepos = matchingRepos.filter((r) => r.fork).length;
      const starsCount = matchingRepos.reduce((acc, r) => acc + (r.stars || 0), 0);
      const repoNames = matchingRepos.map((r) => r.name);
      const projectUrls = matchingRepos.map((r) => r.htmlUrl).filter(Boolean);

      let confidence = 0.7;
      if (originalRepos >= 2) confidence += 0.08;
      if (stat.size > 20000) confidence += 0.05;
      if (starsCount >= 5) confidence += 0.02;
      confidence = Math.min(0.85, Number(confidence.toFixed(2)));

      let tier: "High Evidence" | "Moderate Evidence" | "Emerging Evidence" = "Moderate Evidence";
      if (confidence >= 0.8) tier = "High Evidence";
      else if (confidence < 0.74) tier = "Emerging Evidence";

      const observations: string[] = [];
      if (originalRepos > 0) {
        observations.push(
          `Observed across ${originalRepos} original repository${
            originalRepos > 1 ? "s" : ""
          } (${stat.percentage}% public code share).`
        );
      }
      if (forkedRepos > 0) {
        observations.push(`Referenced in ${forkedRepos} forked reference repository.`);
      }
      if (starsCount > 0) {
        observations.push(`Projects built in ${name} accumulated ${starsCount} community stargazers.`);
      }

      // Detect gaps
      const gaps: string[] = [];
      if (originalRepos < 2) {
        gaps.push("Lacks multi-project repetition (only 1 project detected).");
      }
      if (starsCount === 0) {
        gaps.push("No community verification or stargazers yet.");
      }
      if (stat.size < 20000) {
        gaps.push("Modest code volume (< 20 KB code share).");
      }

      // Recommended tasks
      const recommendedTasks: string[] = [
        `Complete a practical challenge in ${name} in the Coding Sandbox to earn +15 verification points.`,
        `Publish an original fullstack project in ${name} with automated test suite to reach High Evidence (85%).`,
      ];

      return {
        skill: name,
        canonicalName: name,
        category: "Programming Languages",
        evidenceType: "observed_project" as const,
        confidence,
        tier,
        stat,
        repoNames,
        projectUrls,
        signals: {
          repoCount: stat.repoCount || matchingRepos.length,
          originalRepoCount: originalRepos,
          forkedRepoCount: forkedRepos,
          totalBytes: stat.size,
          codePercentage: stat.percentage,
          starsCount,
        },
        observations,
        gaps,
        recommendedTasks,
        lastObservedAt: data?.analyzedAt || new Date().toISOString(),
      };
    });

    return entries;
  }, [data, fetchedPackage]);

  // Filtered & sorted entries
  const filteredSkills = useMemo(() => {
    return skillEntries
      .filter((entry) => {
        if (selectedTier !== "ALL" && entry.tier !== selectedTier) return false;
        if (selectedCategory !== "ALL" && entry.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = entry.skill.toLowerCase().includes(q);
          const matchRepo = entry.repoNames?.some((r) => r.toLowerCase().includes(q));
          if (!matchName && !matchRepo) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "confidence") return b.confidence - a.confidence;
        if (sortBy === "repos") return (b.signals.repoCount || 0) - (a.signals.repoCount || 0);
        if (sortBy === "name") return a.skill.localeCompare(b.skill);
        return 0;
      });
  }, [skillEntries, searchQuery, selectedTier, selectedCategory, sortBy]);

  // High evidence count & average confidence
  const highEvidenceCount = skillEntries.filter((s) => s.tier === "High Evidence").length;
  const avgConfidence = skillEntries.length > 0
    ? Math.round(
        (skillEntries.reduce((acc, s) => acc + s.confidence, 0) / skillEntries.length) * 100
      )
    : 0;

  // Handle retry
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (username) {
      setInternalError(null);
      setInternalLoading(true);
      apiRequest<{ evidence: SkillEvidencePackage }>(
        `/github/evidence/${encodeURIComponent(username.trim())}`
      )
        .then((res) => {
          if (res.data?.evidence) setFetchedPackage(res.data.evidence);
        })
        .catch((err) => setInternalError(err.message || "Failed to load skill evidence"))
        .finally(() => setInternalLoading(false));
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-12 text-center shadow-xs space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground">Extracting Skill Evidence</h3>
          <p className="text-xs text-muted-foreground font-mono">
            Scanning repositories, calculating language byte shares & calibrating confidence scores...
          </p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div className="bg-card rounded-2xl border border-destructive/30 p-8 shadow-xs space-y-4 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-foreground">Unable to Load Skill Evidence</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 transition-all shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry Evidence Extraction
        </button>
      </div>
    );
  }

  // 3. Empty State (no skills detected)
  if (skillEntries.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-8 shadow-xs space-y-4 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Award className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-bold text-sm text-foreground">No Verified Skill Evidence Found</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We could not detect public repository code or recognized programming languages in this GitHub account.
            Push code commits or connect your active development repositories to calibrate your skill profile.
          </p>
        </div>
        {username && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <RefreshCw className="h-3 w-3" /> Re-scan GitHub
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              Smart Skill Hub Evidence Integration (Weighted v1.0.0)
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Traceable, verified technical skills extracted directly from repositories, commit languages, and code bytes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
            GitHub Cap: Max 40 Points
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            {skillEntries.length} Detected Skills
          </span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
          <span className="text-[11px] text-muted-foreground">Total Verified Skills</span>
          <div className="text-lg font-bold text-foreground">{skillEntries.length}</div>
        </div>
        <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
          <span className="text-[11px] text-muted-foreground">High Evidence Skills</span>
          <div className="text-lg font-bold text-emerald-500">{highEvidenceCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
          <span className="text-[11px] text-muted-foreground">Avg Confidence</span>
          <div className="text-lg font-bold text-primary">{avgConfidence}%</div>
        </div>
        <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
          <span className="text-[11px] text-muted-foreground">Calibration Mode</span>
          <div className="text-xs font-semibold text-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Multi-Factor
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills or repos..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border/60 bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="h-8 px-2.5 text-xs rounded-lg border border-border/60 bg-background text-foreground"
        >
          <option value="ALL">All Confidence Tiers</option>
          <option value="High Evidence">High Evidence (≥ 80%)</option>
          <option value="Moderate Evidence">Moderate Evidence (74% - 79%)</option>
          <option value="Emerging Evidence">Emerging Evidence (&lt; 74%)</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="h-8 px-2.5 text-xs rounded-lg border border-border/60 bg-background text-foreground"
        >
          <option value="confidence">Sort by Confidence</option>
          <option value="repos">Sort by Repository Count</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Skill Evidence Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredSkills.map((entry) => (
          <div
            key={entry.skill}
            onClick={() => setSelectedSkill(entry)}
            className="p-3.5 rounded-xl bg-background/60 border border-border/40 hover:border-primary/50 transition-all space-y-2.5 cursor-pointer group shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getLanguageColor(entry.skill) }}
                />
                <span className="group-hover:text-primary transition-colors">{entry.skill}</span>
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  entry.tier === "High Evidence"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : entry.tier === "Moderate Evidence"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                }`}
              >
                {entry.tier}
              </span>
            </div>

            {/* Confidence Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                <span>Confidence Calibration</span>
                <span className="font-bold text-foreground">
                  {Math.round(entry.confidence * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.round(entry.confidence * 100)}%` }}
                />
              </div>
            </div>

            {/* Signals Summary */}
            <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-0.5">
              <span>
                Observed in {entry.signals.repoCount || 1} repo
                {(entry.signals.repoCount || 1) > 1 ? "s" : ""}
                {entry.signals.codePercentage ? ` (${entry.signals.codePercentage}%)` : ""}
              </span>
              <span className="text-primary text-[10px] font-medium flex items-center gap-0.5 group-hover:underline">
                Details <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
          No skills matched the current search and filter criteria.
        </div>
      )}

      {/* Selected Skill Deep Evidence Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-card border border-border/60 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getLanguageColor(selectedSkill.skill) }}
                />
                <h3 className="font-extrabold text-base text-foreground">
                  {selectedSkill.skill} Evidence File
                </h3>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Calibration & Tier */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/60 border border-border/40 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-mono">Calibrated Tier</span>
                <div className="font-bold text-foreground">{selectedSkill.tier}</div>
              </div>
              <div className="text-right space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-mono">Confidence Meter</span>
                <div className="font-bold text-primary text-sm">
                  {Math.round(selectedSkill.confidence * 100)}%
                </div>
              </div>
            </div>

            {/* Traceable Observations */}
            <div className="space-y-2">
              <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Verified Observations
              </span>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {selectedSkill.observations?.map((obs, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-background/40 border border-border/30 text-[11px] leading-relaxed"
                  >
                    • {obs}
                  </div>
                ))}
              </div>
            </div>

            {/* Supporting Repositories */}
            {selectedSkill.repoNames && selectedSkill.repoNames.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <FolderGit2 className="h-3.5 w-3.5 text-primary" /> Supporting Projects
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkill.repoNames.map((repo) => (
                    <span
                      key={repo}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-foreground border border-border/40 font-mono"
                    >
                      {repo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Identified Gaps */}
            {selectedSkill.gaps && selectedSkill.gaps.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> Evidence Gaps
                </span>
                <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1 pl-1">
                  {selectedSkill.gaps.map((gap, idx) => (
                    <li key={idx}>{gap}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Improvement Tasks */}
            {selectedSkill.recommendedTasks && selectedSkill.recommendedTasks.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Recommended Demonstrations
                </span>
                <div className="space-y-1.5 text-[11px] text-foreground">
                  {selectedSkill.recommendedTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 leading-relaxed text-primary-900 dark:text-primary-100"
                    >
                      💡 {task}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedSkill(null)}
                className="px-4 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillEvidence;
