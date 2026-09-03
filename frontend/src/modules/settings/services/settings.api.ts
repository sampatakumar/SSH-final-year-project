import { apiRequest } from "@/lib/api";
import type {
  UserSettingsData,
  GitHubIntegrationStatus,
} from "../types/settings.types";

export const SettingsApi = {
  /**
   * Fetch current user settings
   */
  getSettings: async (): Promise<UserSettingsData> => {
    const res = await apiRequest<{ settings: UserSettingsData }>("/settings");
    return res.data.settings;
  },

  /**
   * Update user settings preferences
   */
  updateSettings: async (
    updates: Partial<UserSettingsData>
  ): Promise<UserSettingsData> => {
    const res = await apiRequest<{ settings: UserSettingsData }>("/settings", {
      method: "PATCH",
      body: updates,
    });
    return res.data.settings;
  },

  /**
   * Fetch GitHub integration status
   */
  getGitHubStatus: async (): Promise<GitHubIntegrationStatus> => {
    const res = await apiRequest<{ integration: GitHubIntegrationStatus }>(
      "/integrations/github"
    );
    return res.data.integration;
  },

  /**
   * Request GitHub OAuth authorization URL
   */
  getGitHubConnectUrl: async (): Promise<{ authUrl: string; state: string }> => {
    const res = await apiRequest<{ authUrl: string; state: string }>(
      "/integrations/github/connect"
    );
    return res.data;
  },

  /**
   * Manually trigger GitHub synchronization
   */
  syncGitHub: async (): Promise<{
    synced: boolean;
    repositoriesCount: number;
    username: string;
    lastSyncedAt: string;
  }> => {
    const res = await apiRequest<{
      synced: boolean;
      repositoriesCount: number;
      username: string;
      lastSyncedAt: string;
    }>("/integrations/github/sync", {
      method: "POST",
    });
    return res.data;
  },

  /**
   * Disconnect GitHub integration
   */
  disconnectGitHub: async (): Promise<{
    disconnected: boolean;
    settings: UserSettingsData;
  }> => {
    const res = await apiRequest<{
      disconnected: boolean;
      settings: UserSettingsData;
    }>("/integrations/github", {
      method: "DELETE",
    });
    return res.data;
  },
};
