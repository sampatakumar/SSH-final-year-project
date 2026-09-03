import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { GitHubIntelligencePage } from "../modules/github/GitHubIntelligencePage";
import { SettingsApi } from "../modules/settings/services/settings.api";
import * as apiModule from "../lib/api";

vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    currentUser: { uid: "firebase_user_123", email: "sampatakumar@gmail.com" },
    backendUser: { _id: "mongo_user_123", email: "sampatakumar@gmail.com", githubUrl: "https://github.com/sampatakumar" },
    idToken: "mock_jwt_token",
  }),
}));

const mockConnectedAnalysis = {
  username: "sampatakumar",
  profile: {
    name: "Sampata Kumar",
    bio: "Full Stack AI Developer & Open Source Creator",
    avatarUrl: "https://avatars.githubusercontent.com/u/12345",
    company: "SmartSkillHub",
    location: "India",
    blog: "https://sampatakumar.dev",
    publicRepos: 12,
    followers: 85,
    following: 20,
    createdAt: "2021-01-10T00:00:00Z",
  },
  repositories: [
    {
      name: "smart-skill-hub",
      description: "AI Developer Career Platform",
      htmlUrl: "https://github.com/sampatakumar/smart-skill-hub",
      language: "TypeScript",
      stars: 35,
      forks: 8,
      watchers: 35,
      openIssues: 0,
      sizeKB: 2500,
      archived: false,
      fork: false,
      updatedAt: "2026-08-27T00:00:00Z",
      topics: ["react", "node", "ai"],
    },
  ],
  languages: {
    TypeScript: { size: 2500000, percentage: 80, repoCount: 1 },
    JavaScript: { size: 500000, percentage: 20, repoCount: 1 },
  },
  dominantLanguage: "TypeScript",
  aggregateStats: {
    totalStars: 35,
    totalForks: 8,
    totalWatchers: 35,
    totalIssues: 0,
    totalSizeKB: 2500,
    archivedCount: 0,
    forkedCount: 0,
  },
  recentEvents: [],
  engineeringQuality: {
    overallScore: 92,
    breakdown: {
      documentation: 90,
      testingEvidence: 85,
      projectStructure: 95,
      maintenanceActivity: 98,
    },
    signals: [],
  },
  projectComplexity: {
    overallComplexityScore: 88,
    distribution: { advanced: 1, intermediate: 0, simple: 0 },
    classifiedProjects: [],
  },
  aiInsights: {
    score: 90,
    archetype: "Full-Stack Specialist",
    executiveSummary: "Strong portfolio of production AI applications.",
    strengths: ["TypeScript mastery", "Clean architecture"],
    weaknesses: [],
    recommendedStack: [],
  },
};

const mockPublicAnalysis = {
  ...mockConnectedAnalysis,
  username: "torvalds",
  profile: {
    ...mockConnectedAnalysis.profile,
    name: "Linus Torvalds",
    bio: "Creator of Linux and Git",
  },
};

describe("GitHub Intelligence — Authenticated User & No-Octocat Resolution Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Automatically resolves connected user (@sampatakumar) and does NOT load @octocat", async () => {
    vi.spyOn(SettingsApi, "getGitHubStatus").mockResolvedValue({
      connected: true,
      githubUsername: "sampatakumar",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345",
      repositoriesCount: 12,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "synced",
    });

    const apiRequestSpy = vi.spyOn(apiModule, "apiRequest").mockImplementation(async (url: string) => {
      if (url.includes("/ai/insights")) {
        return { status: 200, data: { insights: { score: 90 } }, message: "Success" };
      }
      if (url.includes("/mentor/")) {
        return { status: 200, data: { mentor: {} }, message: "Success" };
      }
      return { status: 200, data: mockConnectedAnalysis, message: "Success" };
    });

    render(
      <BrowserRouter>
        <GitHubIntelligencePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sampata Kumar")).toBeInTheDocument();
      expect(screen.getByText("@sampatakumar")).toBeInTheDocument();
      expect(screen.getByText("GitHub Connected")).toBeInTheDocument();
    });

    // Ensure octocat was NEVER requested or rendered
    expect(screen.queryByText("@octocat")).not.toBeInTheDocument();
    expect(screen.queryByText("The Octocat")).not.toBeInTheDocument();
    expect(apiRequestSpy).toHaveBeenCalledWith(
      expect.stringContaining("/github/profile/sampatakumar"),
      expect.anything()
    );
  });

  it("2. When GitHub is NOT connected, shows connection prompt UI and never loads Octocat", async () => {
    vi.spyOn(SettingsApi, "getGitHubStatus").mockResolvedValue({
      connected: false,
    });

    vi.spyOn(apiModule, "apiRequest").mockResolvedValue({
      status: 200,
      data: null,
      message: "Not found",
    });

    render(
      <BrowserRouter>
        <GitHubIntelligencePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Connect GitHub to unlock GitHub Intelligence")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Connect GitHub/i })).toBeInTheDocument();
    });

    expect(screen.queryByText("@octocat")).not.toBeInTheDocument();
    expect(screen.queryByText("The Octocat")).not.toBeInTheDocument();
  });

  it("3. Searching a public username renders public view banner and 'Back to My GitHub' button", async () => {
    vi.spyOn(SettingsApi, "getGitHubStatus").mockResolvedValue({
      connected: true,
      githubUsername: "sampatakumar",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345",
      repositoriesCount: 12,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "synced",
    });

    vi.spyOn(apiModule, "apiRequest").mockImplementation(async (url: string) => {
      if (url.includes("/ai/insights")) {
        return { status: 200, data: { insights: { score: 90 } }, message: "Success" };
      }
      if (url.includes("/mentor/")) {
        return { status: 200, data: { mentor: {} }, message: "Success" };
      }
      if (url.includes("torvalds")) {
        return { status: 200, data: mockPublicAnalysis, message: "Success" };
      }
      return { status: 200, data: mockConnectedAnalysis, message: "Success" };
    });

    render(
      <BrowserRouter>
        <GitHubIntelligencePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sampata Kumar")).toBeInTheDocument();
    });

    // Type 'torvalds' into search bar and submit
    const searchInput = screen.getByPlaceholderText(/Search GitHub username/i);
    fireEvent.change(searchInput, { target: { value: "torvalds" } });
    const form = searchInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("Linus Torvalds")).toBeInTheDocument();
      expect(screen.getByText(/Viewing public profile:/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Back to My GitHub/i })).toBeInTheDocument();
    });

    // Clicking "Back to My GitHub" restores connected user
    fireEvent.click(screen.getByRole("button", { name: /Back to My GitHub/i }));

    await waitFor(() => {
      expect(screen.getByText("Sampata Kumar")).toBeInTheDocument();
      expect(screen.queryByText("Linus Torvalds")).not.toBeInTheDocument();
    });
  });

  it("4. Sync Now triggers SettingsApi.syncGitHub and refreshes data", async () => {
    vi.spyOn(SettingsApi, "getGitHubStatus").mockResolvedValue({
      connected: true,
      githubUsername: "sampatakumar",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345",
      repositoriesCount: 12,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "synced",
    });

    const syncSpy = vi.spyOn(SettingsApi, "syncGitHub").mockResolvedValue({
      synced: true,
      repositoriesCount: 15,
      username: "sampatakumar",
      lastSyncedAt: new Date().toISOString(),
    });

    vi.spyOn(apiModule, "apiRequest").mockImplementation(async (url: string) => {
      if (url.includes("/ai/insights")) {
        return { status: 200, data: { insights: { score: 90 } }, message: "Success" };
      }
      if (url.includes("/mentor/")) {
        return { status: 200, data: { mentor: {} }, message: "Success" };
      }
      return { status: 200, data: mockConnectedAnalysis, message: "Success" };
    });

    render(
      <BrowserRouter>
        <GitHubIntelligencePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Sampata Kumar")).toBeInTheDocument();
    });

    const syncBtn = screen.getByRole("button", { name: /Sync Now/i });
    expect(syncBtn).toBeInTheDocument();
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });
  });
});
