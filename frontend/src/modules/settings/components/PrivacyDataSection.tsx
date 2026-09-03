import React, { useState } from "react";
import { ShieldCheck, Database, RefreshCw, Trash2, GitBranch, CheckCircle2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SmartMentorApi } from "@/modules/mentor/services/smartMentor.api";
import { SettingsApi } from "../services/settings.api";
import type { UserSettingsData } from "../types/settings.types";

interface PrivacyDataSectionProps {
  preferences: UserSettingsData["privacyPreferences"];
  onChange: (patch: Partial<UserSettingsData["privacyPreferences"]>) => void;
  onRefreshAll: () => void;
}

export const PrivacyDataSection: React.FC<PrivacyDataSectionProps> = ({
  preferences,
  onChange,
  onRefreshAll,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearingMentor, setIsClearingMentor] = useState(false);

  const toggleKey = (key: keyof UserSettingsData["privacyPreferences"]) => {
    onChange({ [key]: !preferences[key] });
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await SmartMentorApi.refreshContext();
      toast.success("Synchronized signals refreshed across all Smart Skill Hub modules.");
      onRefreshAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh data.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClearMentorHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your Smart Mentor conversation history?")) {
      return;
    }

    setIsClearingMentor(true);
    try {
      await SmartMentorApi.clearHistory();
      toast.success("Smart Mentor chat history cleared.");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear history.");
    } finally {
      setIsClearingMentor(false);
    }
  };

  const DATA_SOURCES: Array<{
    key: keyof UserSettingsData["privacyPreferences"];
    title: string;
    description: string;
  }> = [
    {
      key: "allowProfileContext",
      title: "Master Profile & Contact Info",
      description: "Target role, education, experience, and professional summary.",
    },
    {
      key: "allowSkillsContext",
      title: "Skill Profile & Matrix",
      description: "Extracted competencies, proficiency levels, and skill gap scores.",
    },
    {
      key: "allowGitHubContext",
      title: "GitHub Repository Signals",
      description: "Public repositories, commit history, language distribution, and README status.",
    },
    {
      key: "allowEduTubeContext",
      title: "EduTube Video History",
      description: "Watched educational lessons, saved videos, and curriculum tracks.",
    },
    {
      key: "allowProjectsContext",
      title: "Project Showcase Data",
      description: "Project stacks, live deployments, and code repositories.",
    },
    {
      key: "allowResumeContext",
      title: "ResumeAI Artifacts",
      description: "Stored resume files, generated bullets, and ATS match analyses.",
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-surface/90 border border-border/50 shadow-neo-raised space-y-6">
      <div>
        <h3 className="text-base font-black text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Data & Privacy Controls
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Review which data signals Smart Skill Hub is permitted to synthesize for AI guidance and roadmaps.
        </p>
      </div>

      {/* Data Sources Table / Cards */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
          Active Context Grounding Permissions
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DATA_SOURCES.map((source) => {
            const enabled = Boolean(preferences[source.key]);
            return (
              <div
                key={source.key}
                onClick={() => toggleKey(source.key)}
                className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-surface border border-border/40 hover:border-primary/40 cursor-pointer shadow-neo-raised-sm transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-foreground">{source.title}</p>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        enabled
                          ? "bg-success/10 text-success border-success/30"
                          : "bg-muted text-muted-foreground border-border/40"
                      }`}
                    >
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {source.description}
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => {}}
                  className="rounded border-border/60 text-primary focus:ring-primary h-4 w-4 mt-0.5 bg-background shrink-0 pointer-events-none"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Maintenance Actions */}
      <div className="pt-4 border-t border-border/30 space-y-3">
        <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
          Data Maintenance
        </label>

        <div className="flex flex-wrap gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="text-xs font-bold gap-2 h-9 px-4 rounded-xl border-border/60 hover:border-primary/40 shadow-neo-raised-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh My Data"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleClearMentorHistory}
            disabled={isClearingMentor}
            className="text-xs font-bold gap-2 h-9 px-4 rounded-xl border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/40 shadow-neo-raised-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Smart Mentor History</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
