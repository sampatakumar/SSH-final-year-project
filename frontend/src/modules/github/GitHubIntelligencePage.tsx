import React, { useState, useEffect } from "react";
import { useAuth } from "@/core/auth";
import { apiRequest } from "@/lib/api";
import { SettingsApi } from "@/modules/settings/services/settings.api";
import type { GitHubIntegrationStatus } from "@/modules/settings/types/settings.types";
import { toast } from "sonner";
import {
  Code2,
  FolderGit2,
  Sparkles,
  BarChart3,
  Layers,
  Award,
  Activity,
  ShieldCheck,
  Compass,
  GitCompare,
  Download,
  GitBranch,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import type { GitHubAnalysisData, PersonalCareerMentorData } from "./types/github.types";
import { SearchBar } from "./components/SearchBar";
import { UserOverview } from "./components/UserOverview";
import { StatsSummary } from "./components/StatsSummary";
import { StatsCharts } from "./components/StatsCharts";
import { LanguageDistribution } from "./components/LanguageDistribution";
import { RepoAnalysis } from "./components/RepoAnalysis";
import { EngineeringQuality } from "./components/EngineeringQuality";
import { ProjectComplexity } from "./components/ProjectComplexity";
import { SkillEvidence } from "./components/SkillEvidence";
import { AIInsights } from "./components/AIInsights";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { PersonalCareerMentor } from "./components/PersonalCareerMentor";
import { CompareProfiles } from "./components/CompareProfiles";
import { ExportModal } from "./components/ExportModal";

export const GitHubIntelligencePage: React.FC = () => {
  const { backendUser, idToken } = useAuth();
  const [integration, setIntegration] = useState<GitHubIntegrationStatus | null>(null);
  const [isCheckingIntegration, setIsCheckingIntegration] = useState(true);
  const [isConnectingGh, setIsConnectingGh] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [activeUsername, setActiveUsername] = useState<string>("");
  const [isViewingPublic, setIsViewingPublic] = useState(false);

  const [analysis, setAnalysis] = useState<GitHubAnalysisData | null>(null);
  const [mentorData, setMentorData] = useState<PersonalCareerMentorData | null>(null);
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Filter state for language
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");

  // Modals state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "repos" | "quality" | "evidence" | "insights" | "mentor"
  >("overview");

  // 1. Initial Resolution of Connected GitHub Account
  useEffect(() => {
    const resolveGitHubAccount = async () => {
      try {
        setIsCheckingIntegration(true);
        const status = await SettingsApi.getGitHubStatus();
        setIntegration(status);

        if (status?.connected && status.githubUsername) {
          setActiveUsername(status.githubUsername);
          setIsViewingPublic(false);
          await loadAnalysis(status.githubUsername, targetRole);
        } else {
          // Not connected: do not auto-load analysis or demo account
          setAnalysis(null);
          if (backendUser?.githubUrl) {
            const match = backendUser.githubUrl.match(/github\.com\/([A-Za-z0-9_.-]+)/);
            if (match && match[1]) {
              setActiveUsername(match[1]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load GitHub integration status:", err);
      } finally {
        setIsCheckingIntegration(false);
      }
    };

    resolveGitHubAccount();
  }, [backendUser?._id, backendUser?.githubUrl]);

  const loadAnalysis = async (userToFetch: string, roleToUse = targetRole) => {
    if (!userToFetch.trim()) return;

    try {
      setIsLoadingAnalysis(true);
      const res = await apiRequest<GitHubAnalysisData>(`/github/profile/${encodeURIComponent(userToFetch.trim())}`, {
        token: idToken || undefined,
      });

      if (res.data) {
        setAnalysis(res.data);
        setSelectedLanguage("ALL");

        // Fetch AI insights if missing
        if (!res.data.aiInsights) {
          try {
            const insightsRes = await apiRequest<{ insights: any }>("/github/ai/insights", {
              method: "POST",
              token: idToken || undefined,
              body: {
                username: res.data.username,
                profileData: res.data,
              },
            });
            if (insightsRes.data?.insights) {
              setAnalysis((prev) => (prev ? { ...prev, aiInsights: insightsRes.data.insights } : prev));
            }
          } catch {
            // Fallback handled
          }
        }

        // Fetch Personal Career Mentor Plan
        try {
          const mentorRes = await apiRequest<{ mentor: PersonalCareerMentorData }>(
            `/github/mentor/${encodeURIComponent(res.data.username)}?role=${encodeURIComponent(roleToUse)}`,
            {
              token: idToken || undefined,
            }
          );
          if (mentorRes.data?.mentor) {
            setMentorData(mentorRes.data.mentor);
          }
        } catch {
          // Fallback handled
        }
      }
    } catch (err: any) {
      toast.error(err.message || `Failed to analyze GitHub profile for @${userToFetch}`);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleSearch = (username: string) => {
    const clean = username.trim().replace(/^@/, "");
    if (!clean) return;

    const isConnectedUser = integration?.connected && integration.githubUsername?.toLowerCase() === clean.toLowerCase();
    setIsViewingPublic(!isConnectedUser);
    setActiveUsername(clean);
    loadAnalysis(clean, targetRole);
  };

  const handleBackToMyGitHub = () => {
    if (integration?.connected && integration.githubUsername) {
      setActiveUsername(integration.githubUsername);
      setIsViewingPublic(false);
      loadAnalysis(integration.githubUsername, targetRole);
    }
  };

  const handleConnectGitHub = async () => {
    setIsConnectingGh(true);
    try {
      const { authUrl } = await SettingsApi.getGitHubConnectUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate GitHub OAuth flow.");
      setIsConnectingGh(false);
    }
  };

  const handleSyncNow = async () => {
    if (!integration?.connected || !integration.githubUsername) return;

    setIsSyncing(true);
    try {
      const res = await SettingsApi.syncGitHub();
      toast.success(`Synchronized ${res.repositoriesCount} repositories for @${res.username}!`);
      // Update integration state with fresh timestamp and count
      setIntegration((prev) => (prev ? {
        ...prev,
        repositoriesCount: res.repositoriesCount,
        lastSyncedAt: String(res.lastSyncedAt),
        syncStatus: "synced",
      } : prev));

      // Reload analysis
      await loadAnalysis(integration.githubUsername, targetRole);
    } catch (err: any) {
      toast.error(err.message || "Failed to sync GitHub data.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    setTargetRole(newRole);
    if (!analysis) return;

    try {
      const mentorRes = await apiRequest<{ mentor: PersonalCareerMentorData }>(
        `/github/mentor/${encodeURIComponent(analysis.username)}?role=${encodeURIComponent(newRole)}`,
        {
          token: idToken || undefined,
        }
      );
      if (mentorRes.data?.mentor) {
        setMentorData(mentorRes.data.mentor);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update mentor role guidance");
    }
  };

  const isConnectedAccount = Boolean(
    integration?.connected &&
    integration.githubUsername?.toLowerCase() === analysis?.username?.toLowerCase()
  );

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-150">
      {/* Page Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              GitHub Intelligence & Career Mentor
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deep repository analytics, code volume metrics, engineering quality signals & personalized career mentor.
          </p>
        </div>

        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoadingAnalysis}
          initialValue={activeUsername}
        />
      </div>

      {/* Public Profile View Notification Banner */}
      {isViewingPublic && integration?.connected && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-400" />
            <span>
              Viewing public profile: <strong className="text-white font-mono">@{analysis?.username || activeUsername}</strong>
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBackToMyGitHub}
            className="h-7 text-xs font-semibold gap-1.5 border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-500/20"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to My GitHub (@{integration.githubUsername})
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingAnalysis && (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground font-mono">
            Analyzing repositories, calculating engineering quality signals & generating career insights...
          </p>
        </div>
      )}

      {/* Not Connected Empty State */}
      {!isLoadingAnalysis && !analysis && !isCheckingIntegration && (
        <div className="p-8 sm:p-12 rounded-2xl bg-card/60 border border-border/50 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-sm">
            <GitBranch className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl font-bold text-foreground">
              Connect GitHub to unlock GitHub Intelligence
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your GitHub account to enable automated code metrics, README documentation hygiene, architecture complexity signals, and grounded Smart Mentor career context.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left max-w-xl mx-auto pt-2 text-xs">
            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <FolderGit2 className="h-3.5 w-3.5 text-primary" /> Repository Analytics
              </span>
              <p className="text-[11px] text-muted-foreground">Audit commits, language distribution, and star trends.</p>
            </div>

            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Engineering Quality
              </span>
              <p className="text-[11px] text-muted-foreground">README checks, documentation completeness, and project complexity.</p>
            </div>

            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-primary" /> Skill Evidence
              </span>
              <p className="text-[11px] text-muted-foreground">Extract verifiable code evidence for your master developer profile.</p>
            </div>

            <div className="p-3 rounded-xl bg-background/60 border border-border/40 space-y-1">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-primary" /> Smart Mentor Context
              </span>
              <p className="text-[11px] text-muted-foreground">Let your AI mentor offer grounded repository and career advice.</p>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleConnectGitHub}
              disabled={isConnectingGh}
              className="h-10 px-6 font-bold bg-primary text-primary-foreground shadow-sm hover:brightness-105"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              {isConnectingGh ? "Connecting..." : "Connect GitHub"}
            </Button>
          </div>
        </div>
      )}

      {/* Main Analysis Dashboard */}
      {!isLoadingAnalysis && analysis && (
        <div className="space-y-6">
          {/* 1. User Profile Overview Hero */}
          <UserOverview
            data={analysis}
            isConnected={isConnectedAccount}
            isSyncing={isSyncing}
            lastSyncedAt={integration?.lastSyncedAt}
            onSync={handleSyncNow}
            onOpenMentor={() => setActiveTab("mentor")}
            onOpenCompare={() => setIsCompareOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
          />

          {/* Navigation View Tabs */}
          <div className="flex items-center gap-1.5 border-b border-border/40 pb-2 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "overview"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> Overview & Charts
            </button>

            <button
              onClick={() => setActiveTab("mentor")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "mentor"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-primary hover:bg-primary/10"
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-primary" /> Personal Mentor
            </button>

            <button
              onClick={() => setActiveTab("repos")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "repos"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FolderGit2 className="h-3.5 w-3.5" /> Repositories ({analysis.repositories.length})
            </button>

            <button
              onClick={() => setActiveTab("quality")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "quality"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Engineering Quality
            </button>

            <button
              onClick={() => setActiveTab("evidence")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "evidence"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Award className="h-3.5 w-3.5" /> Skill Evidence
            </button>

            <button
              onClick={() => setActiveTab("insights")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === "insights"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> AI Review
            </button>
          </div>

          {/* Tab 1: Overview & Charts */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <StatsSummary stats={analysis.aggregateStats} />
              <StatsCharts repositories={analysis.repositories || []} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LanguageDistribution
                  languages={analysis.languages}
                  dominantLanguage={analysis.dominantLanguage}
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={setSelectedLanguage}
                />
                <ActivityTimeline events={analysis.recentEvents} />
              </div>
            </div>
          )}

          {/* Tab 2: Personal Career Mentor */}
          {activeTab === "mentor" && (
            <PersonalCareerMentor
              mentorData={mentorData}
              username={analysis.username}
              targetRole={targetRole}
              onRoleChange={handleRoleChange}
            />
          )}

          {/* Tab 3: Repositories */}
          {activeTab === "repos" && (
            <RepoAnalysis
              repositories={analysis.repositories}
              selectedLanguage={selectedLanguage}
              onSelectLanguage={setSelectedLanguage}
            />
          )}

          {/* Tab 4: Engineering Quality */}
          {activeTab === "quality" && (
            <div className="space-y-6">
              <EngineeringQuality quality={analysis.engineeringQuality} />
              <ProjectComplexity complexity={analysis.projectComplexity} />
            </div>
          )}

          {/* Tab 5: Skill Evidence */}
          {activeTab === "evidence" && (
            <SkillEvidence username={analysis.username} />
          )}

          {/* Tab 6: AI Review */}
          {activeTab === "insights" && (
            <AIInsights insights={analysis.aiInsights} />
          )}
        </div>
      )}

      {/* Compare Modal */}
      {isCompareOpen && (
        <CompareProfiles
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          initialUser1={analysis?.username || ""}
        />
      )}

      {/* Export Modal */}
      {isExportOpen && analysis && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          analysisData={analysis}
        />
      )}
    </div>
  );
};

export default GitHubIntelligencePage;
