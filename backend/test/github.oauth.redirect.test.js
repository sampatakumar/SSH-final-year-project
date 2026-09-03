import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

describe("GitHub OAuth Redirect & Canonical Callback Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_OAUTH_CALLBACK_URL = "http://localhost:8000/api/v1/auth/github/callback";
    process.env.FRONTEND_URL = "http://localhost:8081";
    process.env.GITHUB_CLIENT_ID = "mock_client_id_123";
    process.env.GITHUB_CLIENT_SECRET = "mock_client_secret_xyz";
  });

  it("1. generateGitHubOAuthUrl outputs decoded redirect_uri strictly matching http://localhost:8000/api/v1/auth/github/callback", async () => {
    const { settingsService } = await import("../src/modules/settings/services/settings.service.js");

    const result = settingsService.generateGitHubOAuthUrl("mock_owner_123", "http://localhost:8000");

    expect(result.authUrl).toContain("https://github.com/login/oauth/authorize");

    const url = new URL(result.authUrl);
    const redirectUri = url.searchParams.get("redirect_uri");

    expect(redirectUri).toBe("http://localhost:8000/api/v1/auth/github/callback");
    expect(url.searchParams.get("scope")).toBe("read:user public_repo");
    expect(url.searchParams.get("allow_signup")).toBe("true");
    expect(url.searchParams.get("state")).toBeTruthy();
  });

  it("2. GET /api/v1/auth/github returns authUrl with redirect_uri to canonical backend callback", async () => {
    const { connectGitHub } = await import("../src/modules/settings/controllers/integrations.controller.js");

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { _id: "mongo_user_777" };
      next();
    });
    app.get("/api/v1/auth/github", connectGitHub);

    const res = await request(app).get("/api/v1/auth/github");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.authUrl).toContain("https://github.com/login/oauth/authorize");

    const parsedUrl = new URL(res.body.data.authUrl);
    expect(parsedUrl.searchParams.get("redirect_uri")).toBe("http://localhost:8000/api/v1/auth/github/callback");
  });

  it("3. GET /api/v1/auth/github/callback exchanges code, links user, and redirects to frontend settings", async () => {
    const { handleGitHubCallback } = await import("../src/modules/settings/controllers/integrations.controller.js");
    const { settingsService } = await import("../src/modules/settings/services/settings.service.js");
    const { UserSettings } = await import("../src/modules/settings/models/userSettings.models.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    // Generate valid state for owner
    const { state } = settingsService.generateGitHubOAuthUrl("owner_user_999", "http://localhost:8000");

    // Mock axios token exchange
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { access_token: "gho_test_token_xyz" },
    });

    // Mock axios user fetch
    vi.spyOn(axios, "get").mockResolvedValue({
      data: {
        id: 1234567,
        login: "sampatakumar",
        avatar_url: "https://avatars.githubusercontent.com/u/1234567",
        html_url: "https://github.com/sampatakumar",
      },
    });

    vi.spyOn(UserSettings, "findOneAndUpdate").mockResolvedValue({});
    vi.spyOn(UserSettings, "findOne").mockResolvedValue({
      githubIntegration: { connected: true, githubUsername: "sampatakumar" },
    });
    vi.spyOn(UserSettings, "updateOne").mockResolvedValue({});
    vi.spyOn(User, "findByIdAndUpdate").mockResolvedValue({});

    const app = express();
    app.get("/api/v1/auth/github/callback", handleGitHubCallback);

    const res = await request(app).get(`/api/v1/auth/github/callback?code=mock_code_123&state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:8081/dashboard/settings?github=connected&username=sampatakumar");
  });

  it("4. Root /github/callback also executes and redirects to frontend", async () => {
    const { app } = await import("../src/app.js");
    const { settingsService } = await import("../src/modules/settings/services/settings.service.js");
    const { UserSettings } = await import("../src/modules/settings/models/userSettings.models.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    const { state } = settingsService.generateGitHubOAuthUrl("owner_user_888", "http://localhost:8000");

    vi.spyOn(axios, "post").mockResolvedValue({
      data: { access_token: "gho_test_token_abc" },
    });
    vi.spyOn(axios, "get").mockResolvedValue({
      data: {
        id: 9876543,
        login: "octocat",
        avatar_url: "https://avatars.githubusercontent.com/u/9876543",
        html_url: "https://github.com/octocat",
      },
    });

    vi.spyOn(UserSettings, "findOneAndUpdate").mockResolvedValue({});
    vi.spyOn(UserSettings, "findOne").mockResolvedValue({
      githubIntegration: { connected: true, githubUsername: "octocat" },
    });
    vi.spyOn(UserSettings, "updateOne").mockResolvedValue({});
    vi.spyOn(User, "findByIdAndUpdate").mockResolvedValue({});

    const res = await request(app).get(`/github/callback?code=mock_code_456&state=${state}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("http://localhost:8081/dashboard/settings?github=connected&username=octocat");
  });

  it("5. Rejects callback with invalid or expired state token with error redirect", async () => {
    const { handleGitHubCallback } = await import("../src/modules/settings/controllers/integrations.controller.js");

    const app = express();
    app.get("/api/v1/auth/github/callback", handleGitHubCallback);

    const res = await request(app).get("/api/v1/auth/github/callback?code=mock_code&state=invalid:state:signature");

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("github_error=");
  });
});
