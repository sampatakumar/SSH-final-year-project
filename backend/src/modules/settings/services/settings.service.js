import crypto from "crypto";
import axios from "axios";
import { UserSettings } from "../models/userSettings.models.js";
import { User } from "../../../core/database/models/user.models.js";
import { GitHubAnalysis } from "../../github/models/githubAnalysis.models.js";
import { fetchGitHubProfileData } from "../../github/services/github.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.APP_SECRET || process.env.SESSION_SECRET || "ssh_secret_key_32_bytes_default_sec")
  .digest(); // 32-byte buffer
const IV_LENGTH = 16;

/**
 * Encrypt sensitive OAuth tokens at rest
 */
export function encryptToken(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt OAuth token when communicating with GitHub API
 */
export function decryptToken(text) {
  if (!text || !text.includes(":")) return "";
  try {
    const [ivHex, encryptedText] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

export class SettingsService {
  /**
   * Get or initialize settings for a user
   */
  async getSettings(ownerId) {
    let settings = await UserSettings.findOne({ owner: ownerId });
    if (!settings) {
      // Check if user has a legacy githubUrl and auto-link initial state
      const user = await User.findById(ownerId).lean().catch(() => null);
      let initialGhUser = "";
      if (user?.githubUrl) {
        const match = user.githubUrl.match(/github\.com\/([A-Za-z0-9_.-]+)/);
        if (match) initialGhUser = match[1];
      }

      settings = await UserSettings.create({
        owner: ownerId,
        githubIntegration: {
          connected: Boolean(initialGhUser),
          githubUsername: initialGhUser,
        },
      });
    }

    return this.sanitizeSettings(settings);
  }

  /**
   * Update partial user settings
   */
  async updateSettings(ownerId, updates = {}) {
    const allowedKeys = [
      "mentorPreferences",
      "eduTubePreferences",
      "notificationPreferences",
      "privacyPreferences",
      "appearancePreferences",
    ];

    const patch = {};
    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        patch[key] = updates[key];
      }
    }

    const settings = await UserSettings.findOneAndUpdate(
      { owner: ownerId },
      { $set: patch },
      { upsert: true, new: true }
    );

    return this.sanitizeSettings(settings);
  }

  /**
   * Sanitizes UserSettings removing secret tokens before sending to client
   */
  sanitizeSettings(settingsDoc) {
    const raw = settingsDoc.toObject ? settingsDoc.toObject() : { ...settingsDoc };
    if (raw.githubIntegration) {
      const { accessTokenEncrypted, ...safeGh } = raw.githubIntegration;
      raw.githubIntegration = safeGh;
    }
    return raw;
  }

  /**
   * Generate GitHub OAuth connect URL with secure HMAC signed state token
   */
  generateGitHubOAuthUrl(ownerId, hostUrl) {
    const clientId = process.env.GITHUB_CLIENT_ID || "ssh_gh_client_id_placeholder";
    let callbackUrl = process.env.GITHUB_OAUTH_CALLBACK_URL || process.env.GITHUB_CALLBACK_URL;
    if (!callbackUrl) {
      const base = hostUrl || "http://localhost:8000";
      callbackUrl = base.includes("onrender.com")
        ? `${base}/github/callback`
        : `${base}/api/v1/auth/github/callback`;
    }

    // Create state: ownerId:timestamp:signature
    const timestamp = Date.now();
    const payload = `${ownerId}:${timestamp}`;
    const signature = crypto
      .createHmac("sha256", ENCRYPTION_KEY)
      .update(payload)
      .digest("hex");
    const state = `${payload}:${signature}`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: "read:user public_repo",
      state,
      allow_signup: "true",
    });

    return {
      authUrl: `https://github.com/login/oauth/authorize?${params.toString()}`,
      state,
      redirectUri: callbackUrl,
    };
  }

  /**
   * Validate state token from OAuth callback
   */
  validateStateToken(state) {
    if (!state || typeof state !== "string") return null;
    const parts = state.split(":");
    if (parts.length !== 3) return null;

    const [ownerId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    // State expires in 15 minutes
    if (Date.now() - timestamp > 15 * 60 * 1000) return null;

    const payload = `${ownerId}:${timestampStr}`;
    const expectedSig = crypto
      .createHmac("sha256", ENCRYPTION_KEY)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSig) return null;

    return ownerId;
  }

  /**
   * Exchange code for token & synchronize GitHub data
   */
  async handleGitHubCallback(code, state) {
    const ownerId = this.validateStateToken(state);
    if (!ownerId) {
      throw new ApiError(400, "Invalid or expired OAuth state parameter.");
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ApiError(500, "GitHub OAuth credentials are not configured in backend environment.");
    }

    // Exchange authorization code for access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      },
      {
        headers: { Accept: "application/json" },
        timeout: 10000,
      }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      const errorMsg = tokenRes.data?.error_description || tokenRes.data?.error || "Failed to obtain access token";
      throw new ApiError(400, `GitHub OAuth error: ${errorMsg}`);
    }

    // Fetch user details from GitHub
    const userProfileRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "SmartSkillHub-App",
        Accept: "application/vnd.github.v3+json",
      },
      timeout: 10000,
    });

    const ghUser = userProfileRes.data;
    const encryptedToken = encryptToken(accessToken);

    // Update settings record
    let settings = await UserSettings.findOneAndUpdate(
      { owner: ownerId },
      {
        $set: {
          "githubIntegration.connected": true,
          "githubIntegration.githubUsername": ghUser.login,
          "githubIntegration.githubUserId": String(ghUser.id),
          "githubIntegration.avatarUrl": ghUser.avatar_url || "",
          "githubIntegration.accessTokenEncrypted": encryptedToken,
          "githubIntegration.syncStatus": "syncing",
          "githubIntegration.syncError": "",
        },
      },
      { upsert: true, new: true }
    );

    // Also link githubUrl on User model if empty
    await User.findByIdAndUpdate(ownerId, {
      $set: {
        githubUrl: ghUser.html_url || `https://github.com/${ghUser.login}`,
      },
    });

    // Trigger canonical synchronization in background or synchronously
    try {
      await this.syncGitHubData(ownerId, accessToken);
    } catch (syncErr) {
      console.warn("Initial GitHub sync warning:", syncErr.message);
    }

    return { ownerId, username: ghUser.login };
  }

  /**
   * Synchronize GitHub Profile, Repositories, and Intelligence Signals
   */
  async syncGitHubData(ownerId, explicitToken = null) {
    const settings = await UserSettings.findOne({ owner: ownerId });
    if (!settings?.githubIntegration?.connected) {
      throw new ApiError(400, "GitHub is not connected.");
    }

    const username = settings.githubIntegration.githubUsername;
    if (!username) {
      throw new ApiError(400, "GitHub username not found in settings.");
    }

    // Set status to syncing
    await UserSettings.updateOne(
      { owner: ownerId },
      { $set: { "githubIntegration.syncStatus": "syncing", "githubIntegration.syncError": "" } }
    );

    try {
      const token = explicitToken || decryptToken(settings.githubIntegration.accessTokenEncrypted);
      const profileData = await fetchGitHubProfileData(username);

      // Save into canonical GitHubAnalysis model
      await GitHubAnalysis.findOneAndUpdate(
        { owner: ownerId, githubUsername: username.toLowerCase() },
        {
          owner: ownerId,
          githubUsername: username.toLowerCase(),
          profile: profileData.profile,
          repositories: profileData.repositories,
          languages: profileData.languages,
          dominantLanguage: profileData.dominantLanguage,
          aggregateStats: profileData.aggregateStats,
          recentEvents: profileData.recentEvents,
          analyzedAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Update UserSettings with synced state
      const repoCount = profileData.repositories?.length || 0;
      await UserSettings.updateOne(
        { owner: ownerId },
        {
          $set: {
            "githubIntegration.syncStatus": "synced",
            "githubIntegration.lastSyncedAt": new Date(),
            "githubIntegration.repositoriesCount": repoCount,
            "githubIntegration.syncError": "",
          },
        }
      );

      return {
        synced: true,
        repositoriesCount: repoCount,
        username,
        lastSyncedAt: new Date(),
      };
    } catch (err) {
      const errMsg = err.message || "Failed to synchronize GitHub data";
      await UserSettings.updateOne(
        { owner: ownerId },
        {
          $set: {
            "githubIntegration.syncStatus": "failed",
            "githubIntegration.syncError": errMsg,
          },
        }
      );
      throw new ApiError(500, `GitHub Sync Failed: ${errMsg}`);
    }
  }

  /**
   * Disconnect GitHub Account and clear stored credentials
   */
  async disconnectGitHub(ownerId) {
    const settings = await UserSettings.findOneAndUpdate(
      { owner: ownerId },
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

    return { disconnected: true, settings: this.sanitizeSettings(settings) };
  }
}

export const settingsService = new SettingsService();
