import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  User,
  Bot,
  GraduationCap,
  Bell,
  Palette,
  ShieldCheck,
  GitBranch,
  Save,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SettingsApi } from "../modules/settings/services/settings.api";
import { ConnectedAccountsSection } from "../modules/settings/components/ConnectedAccountsSection";
import { SmartMentorSettingsSection } from "../modules/settings/components/SmartMentorSettingsSection";
import { EduTubeSettingsSection } from "../modules/settings/components/EduTubeSettingsSection";
import { NotificationSettingsSection } from "../modules/settings/components/NotificationSettingsSection";
import { AppearanceSection } from "../modules/settings/components/AppearanceSection";
import { PrivacyDataSection } from "../modules/settings/components/PrivacyDataSection";
import { AccountSection } from "../modules/settings/components/AccountSection";
import type { UserSettingsData } from "../modules/settings/types/settings.types";

const DEFAULT_SETTINGS: UserSettingsData = {
  mentorPreferences: {
    responseStyle: "balanced",
    focusAreas: ["career", "github", "projects", "resume", "skills", "learning", "interview"],
    contextSources: ["profile", "skills", "github", "resume", "projects", "edutube", "learning"],
    proactiveGuidance: [
      "next_actions",
      "skill_gaps",
      "learning_resources",
      "github_improvements",
      "project_improvements",
    ],
  },
  eduTubePreferences: {
    personalizedRecommendations: true,
    continueLearning: true,
    trackHistory: true,
    trackProgress: true,
    recommendFromGaps: true,
    recommendFromRoadmap: true,
  },
  notificationPreferences: {
    skillGapAlerts: true,
    learningRecommendations: true,
    githubAlerts: true,
    mentorRecommendations: true,
    eduTubeReminders: true,
  },
  privacyPreferences: {
    allowProfileContext: true,
    allowSkillsContext: true,
    allowResumeContext: true,
    allowProjectsContext: true,
    allowGitHubContext: true,
    allowEduTubeContext: true,
  },
  appearancePreferences: {
    theme: "dark",
    accentColor: "purple",
  },
};

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"general" | "ai" | "privacy">("general");

  // Local settings draft state
  const [localSettings, setLocalSettings] = useState<UserSettingsData>(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch settings from API
  const { data: serverSettings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => SettingsApi.getSettings(),
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (serverSettings) {
      setLocalSettings(serverSettings);
      setHasChanges(false);
    }
  }, [serverSettings]);

  // Handle GitHub OAuth callback notifications in URL on mount
  useEffect(() => {
    const ghStatus = searchParams.get("github");
    const ghUser = searchParams.get("username");
    const ghError = searchParams.get("github_error");

    if (!ghStatus && !ghError) return;

    if (ghStatus === "connected") {
      toast.success(`GitHub connected successfully for @${ghUser || "developer"}!`);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["mentor"] });
      const next = new URLSearchParams(searchParams);
      next.delete("github");
      next.delete("username");
      setSearchParams(next, { replace: true });
    } else if (ghError) {
      toast.error(`GitHub Connection Error: ${ghError}`);
      const next = new URLSearchParams(searchParams);
      next.delete("github_error");
      setSearchParams(next, { replace: true });
    }
  }, []);

  // Mutation to save settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: (updated: Partial<UserSettingsData>) => SettingsApi.updateSettings(updated),
    onSuccess: (saved) => {
      setLocalSettings(saved);
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["mentor"] });
      toast.success("Settings saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update settings.");
    },
  });

  const handleUpdateMentor = (patch: Partial<UserSettingsData["mentorPreferences"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      mentorPreferences: { ...prev.mentorPreferences, ...patch },
    }));
    setHasChanges(true);
  };

  const handleUpdateEduTube = (patch: Partial<UserSettingsData["eduTubePreferences"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      eduTubePreferences: { ...prev.eduTubePreferences, ...patch },
    }));
    setHasChanges(true);
  };

  const handleUpdateNotifications = (
    patch: Partial<UserSettingsData["notificationPreferences"]>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      notificationPreferences: { ...prev.notificationPreferences, ...patch },
    }));
    setHasChanges(true);
  };

  const handleUpdateAppearance = (
    patch: Partial<UserSettingsData["appearancePreferences"]>
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      appearancePreferences: { ...prev.appearancePreferences, ...patch },
    }));
    setHasChanges(true);
  };

  const handleUpdatePrivacy = (patch: Partial<UserSettingsData["privacyPreferences"]>) => {
    setLocalSettings((prev) => ({
      ...prev,
      privacyPreferences: { ...prev.privacyPreferences, ...patch },
    }));
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    saveSettings(localSettings);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["settings"] });
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in-50 duration-150">
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary border border-primary/30 flex items-center justify-center shadow-neo-raised shrink-0">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                Settings
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                Preferences
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Configure your Smart Skill Hub account, integrations, AI behavior, learning preferences, privacy, and appearance.
            </p>
          </div>
        </div>

        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="text-xs font-bold gap-2 h-9 px-5 rounded-xl bg-primary text-primary-foreground shadow-neo-raised hover:brightness-105 active:scale-95 animate-in fade-in duration-200"
          >
            <Save className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </Button>
        )}
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-surface/90 border border-border/50 rounded-2xl w-fit shadow-neo-raised-sm flex-wrap">
        <Button
          size="sm"
          variant={activeTab === "general" ? "default" : "ghost"}
          onClick={() => setActiveTab("general")}
          className={`text-xs font-bold gap-1.5 rounded-xl h-8 px-4 transition-all ${
            activeTab === "general"
              ? "shadow-neo-raised"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>General</span>
        </Button>

        <Button
          size="sm"
          variant={activeTab === "ai" ? "default" : "ghost"}
          onClick={() => setActiveTab("ai")}
          className={`text-xs font-bold gap-1.5 rounded-xl h-8 px-4 transition-all ${
            activeTab === "ai"
              ? "shadow-neo-raised"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          <span>AI & Learning</span>
        </Button>

        <Button
          size="sm"
          variant={activeTab === "privacy" ? "default" : "ghost"}
          onClick={() => setActiveTab("privacy")}
          className={`text-xs font-bold gap-1.5 rounded-xl h-8 px-4 transition-all ${
            activeTab === "privacy"
              ? "shadow-neo-raised"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Data & Privacy</span>
        </Button>
      </div>

      {/* Tab Panels */}
      {activeTab === "general" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <ConnectedAccountsSection
            integration={localSettings.githubIntegration}
            onRefresh={handleRefresh}
          />
          <NotificationSettingsSection
            preferences={localSettings.notificationPreferences}
            onChange={handleUpdateNotifications}
          />
          <AppearanceSection
            preferences={localSettings.appearancePreferences}
            onChange={handleUpdateAppearance}
          />
          <AccountSection />
        </div>
      )}

      {activeTab === "ai" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <SmartMentorSettingsSection
            preferences={localSettings.mentorPreferences}
            onChange={handleUpdateMentor}
          />
          <EduTubeSettingsSection
            preferences={localSettings.eduTubePreferences}
            onChange={handleUpdateEduTube}
          />
        </div>
      )}

      {activeTab === "privacy" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <PrivacyDataSection
            preferences={localSettings.privacyPreferences}
            onChange={handleUpdatePrivacy}
            onRefreshAll={handleRefresh}
          />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;