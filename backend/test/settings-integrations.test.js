import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { SettingsService, encryptToken, decryptToken } from "../src/modules/settings/services/settings.service.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { User } from "../src/core/database/models/user.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import * as ghService from "../src/modules/github/services/github.service.js";

describe("Settings & GitHub Integration Backend Suite", () => {
  const userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
  let settingsService;

  beforeEach(() => {
    settingsService = new SettingsService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Encrypts and decrypts OAuth tokens securely at rest", () => {
    const rawToken = "gho_testToken1234567890abcdef";
    const encrypted = encryptToken(rawToken);

    expect(encrypted).not.toBe(rawToken);
    expect(encrypted).toContain(":");

    const decrypted = decryptToken(encrypted);
    expect(decrypted).toBe(rawToken);
  });

  it("2. Retrieves sanitized user settings without exposing encrypted access tokens", async () => {
    vi.spyOn(UserSettings, "findOne").mockResolvedValue({
      toObject: () => ({
        owner: userId,
        mentorPreferences: { responseStyle: "detailed" },
        githubIntegration: {
          connected: true,
          githubUsername: "octocat",
          accessTokenEncrypted: "iv:secretEncryptedToken",
        },
      }),
    });

    const settings = await settingsService.getSettings(userId);
    expect(settings.mentorPreferences.responseStyle).toBe("detailed");
    expect(settings.githubIntegration.connected).toBe(true);
    expect(settings.githubIntegration.githubUsername).toBe("octocat");
    expect(settings.githubIntegration.accessTokenEncrypted).toBeUndefined();
  });

  it("3. Updates user configuration preferences with ownership isolation", async () => {
    const findUpdateSpy = vi.spyOn(UserSettings, "findOneAndUpdate").mockResolvedValue({
      toObject: () => ({
        owner: userId,
        mentorPreferences: { responseStyle: "concise" },
        notificationPreferences: { skillGapAlerts: false },
      }),
    });

    const res = await settingsService.updateSettings(userId, {
      mentorPreferences: { responseStyle: "concise" },
      notificationPreferences: { skillGapAlerts: false },
    });

    expect(res.mentorPreferences.responseStyle).toBe("concise");
    expect(findUpdateSpy).toHaveBeenCalledWith(
      { owner: userId },
      {
        $set: {
          mentorPreferences: { responseStyle: "concise" },
          notificationPreferences: { skillGapAlerts: false },
        },
      },
      { upsert: true, new: true }
    );
  });

  it("4. Generates GitHub OAuth authorization URL with signed anti-CSRF state token", () => {
    const { authUrl, state } = settingsService.generateGitHubOAuthUrl(userId, "http://localhost:8000");

    expect(authUrl).toContain("https://github.com/login/oauth/authorize");
    expect(authUrl).toContain("client_id=");
    expect(authUrl).toContain("state=");
    expect(state).toContain(userId.toString());

    // Validates that state signature matches
    const validatedOwner = settingsService.validateStateToken(state);
    expect(validatedOwner).toBe(userId.toString());
  });

  it("5. Rejects tampered or expired OAuth state tokens", () => {
    const tamperedState = `${userId}:1234567890:invalidsignaturehex`;
    expect(settingsService.validateStateToken(tamperedState)).toBeNull();

    const expiredTimestamp = Date.now() - 30 * 60 * 1000; // 30 mins ago
    const expiredState = `${userId}:${expiredTimestamp}:anysig`;
    expect(settingsService.validateStateToken(expiredState)).toBeNull();
  });

  it("6. Synchronizes GitHub data into canonical GitHubAnalysis and updates sync state", async () => {
    vi.spyOn(UserSettings, "findOne").mockResolvedValue({
      owner: userId,
      githubIntegration: {
        connected: true,
        githubUsername: "sampatakumar",
        accessTokenEncrypted: encryptToken("gh_token"),
      },
    });

    const updateSpy = vi.spyOn(UserSettings, "updateOne").mockResolvedValue({ modifiedCount: 1 });
    const ghAnalysisSpy = vi.spyOn(GitHubAnalysis, "findOneAndUpdate").mockResolvedValue({});

    vi.spyOn(ghService, "fetchGitHubProfileData").mockResolvedValue({
      profile: { name: "Sampat", publicRepos: 5 },
      repositories: [
        { name: "Repo-1", description: "First repo", language: "TypeScript" },
        { name: "Repo-2", description: "Second repo", language: "JavaScript" },
      ],
      languages: { TypeScript: 60, JavaScript: 40 },
      dominantLanguage: "TypeScript",
      aggregateStats: { totalStars: 10 },
      recentEvents: [],
    });

    const syncRes = await settingsService.syncGitHubData(userId);

    expect(syncRes.synced).toBe(true);
    expect(syncRes.repositoriesCount).toBe(2);
    expect(ghAnalysisSpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalled();
  });

  it("7. Safely disconnects GitHub account and clears tokens", async () => {
    const updateSpy = vi.spyOn(UserSettings, "findOneAndUpdate").mockResolvedValue({
      toObject: () => ({
        owner: userId,
        githubIntegration: {
          connected: false,
          githubUsername: "",
          repositoriesCount: 0,
        },
      }),
    });

    const res = await settingsService.disconnectGitHub(userId);

    expect(res.disconnected).toBe(true);
    expect(res.settings.githubIntegration.connected).toBe(false);
    expect(updateSpy).toHaveBeenCalledWith(
      { owner: userId },
      {
        $set: {
          "githubIntegration.connected": false,
          "githubIntegration.githubUsername": "",
          "githubIntegration.githubUserId": "",
          "githubIntegration.avatarUrl": "",
          "githubIntegration.accessTokenEncrypted": "",
          "githubIntegration.syncStatus": "idle",
          "githubIntegration.syncError": "",
          "githubIntegration.repositoriesCount": 0,
        },
      },
      { new: true }
    );
  });
});
