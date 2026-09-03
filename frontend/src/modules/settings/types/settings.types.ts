export interface GitHubIntegrationStatus {
  connected: boolean;
  githubUsername?: string;
  githubUserId?: string;
  avatarUrl?: string;
  scopes?: string[];
  lastSyncedAt?: string | null;
  syncStatus?: "idle" | "syncing" | "synced" | "failed";
  syncError?: string;
  repositoriesCount?: number;
}

export interface UserSettingsData {
  owner?: string;
  mentorPreferences: {
    responseStyle: "concise" | "balanced" | "detailed";
    focusAreas: string[];
    contextSources: string[];
    proactiveGuidance: string[];
  };
  eduTubePreferences: {
    personalizedRecommendations: boolean;
    continueLearning: boolean;
    trackHistory: boolean;
    trackProgress: boolean;
    recommendFromGaps: boolean;
    recommendFromRoadmap: boolean;
  };
  notificationPreferences: {
    skillGapAlerts: boolean;
    learningRecommendations: boolean;
    githubAlerts: boolean;
    mentorRecommendations: boolean;
    eduTubeReminders: boolean;
  };
  privacyPreferences: {
    allowProfileContext: boolean;
    allowSkillsContext: boolean;
    allowResumeContext: boolean;
    allowProjectsContext: boolean;
    allowGitHubContext: boolean;
    allowEduTubeContext: boolean;
  };
  appearancePreferences: {
    theme: "dark" | "light" | "system";
    accentColor: string;
  };
  githubIntegration?: GitHubIntegrationStatus;
  updatedAt?: string;
}
