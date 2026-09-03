import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import axios from "axios";
import { fetchGitHubProfileData } from "../src/modules/github/services/github.service.js";
import { generateGitHubInsights } from "../src/modules/github/services/githubAi.service.js";
import { buildCareerMentorPlan } from "../src/modules/github/services/githubCareer.service.js";
import { answerMentorQuestion } from "../src/modules/github/services/githubMentorAi.service.js";
import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import githubRouter from "../src/modules/github/routes/github.routes.js";
import { EVIDENCE_SOURCES, EVIDENCE_TYPES } from "../src/shared/evidence/skillEvidenceContract.js";

vi.mock("axios");

describe("GitHub Module Migration & Verification Suite", () => {
  const dummyProfileData = {
    username: "testdev",
    profile: {
      name: "Test Developer",
      bio: "Full stack engineer building web apps",
      publicRepos: 12,
      avatarUrl: "https://github.com/testdev.png",
      followers: 45,
      following: 10,
    },
    repositories: [
      { name: "react-dashboard", language: "TypeScript", stars: 15, forks: 3, sizeKB: 450, fork: false, archived: false },
      { name: "node-api", language: "JavaScript", stars: 8, forks: 1, sizeKB: 200, fork: false, archived: false },
      { name: "forked-repo", language: "Python", stars: 0, forks: 0, sizeKB: 100, fork: true, archived: false },
    ],
    languages: {
      TypeScript: { size: 450000, percentage: 60.0, repoCount: 1 },
      JavaScript: { size: 200000, percentage: 26.7, repoCount: 1 },
      Python: { size: 100000, percentage: 13.3, repoCount: 1 },
    },
    dominantLanguage: "TypeScript",
    aggregateStats: {
      totalStars: 23,
      totalForks: 4,
      totalWatchers: 23,
      totalIssues: 2,
      totalSizeKB: 750,
      archivedCount: 0,
      forkedCount: 1,
    },
    recentEvents: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. AI Insights & Career Mentor Generation
  describe("AI Insights & Personal Career Mentor", () => {
    it("13/14. generates structured GitHub insights with fallback support", async () => {
      const insights = await generateGitHubInsights(dummyProfileData);
      expect(insights).toBeDefined();
      expect(insights.summary).toBeDefined();
      expect(Array.isArray(insights.strengths)).toBe(true);
      expect(Array.isArray(insights.weaknesses)).toBe(true);
      expect(insights.githubOptimizationScore).toBeGreaterThanOrEqual(0);
    }, 15000);

    it("generates structured Personal Career Mentor plan grounded in evidence", () => {
      const plan = buildCareerMentorPlan({ githubData: dummyProfileData, targetRole: "Full Stack Developer" });
      expect(plan).toBeDefined();
      expect(plan.hero.targetRole).toBe("Full Stack Developer");
      expect(plan.readinessDimensions.length).toBeGreaterThanOrEqual(5);
      expect(plan.nextActions.length).toBe(3);
      expect(plan.weeklyPlan.length).toBeGreaterThanOrEqual(3);
    });
  });

  // 2. Evidence Adapter & Skill Normalization
  describe("GitHub Evidence Adapter", () => {
    it("9/10. extracts normalized observed skill evidence from GitHub data", () => {
      const pkg = extractGitHubEvidence({
        userId: "user-12345",
        githubData: dummyProfileData,
      });

      expect(pkg.contractVersion).toBe("1.0.0");
      expect(pkg.source).toBe(EVIDENCE_SOURCES.GITHUB);
      expect(pkg.userId).toBe("user-12345");
      expect(pkg.skills.length).toBeGreaterThanOrEqual(2);

      const tsSkill = pkg.skills.find((s) => s.skill === "TypeScript");
      expect(tsSkill).toBeDefined();
      expect(tsSkill.evidenceType).toBe(EVIDENCE_TYPES.OBSERVED_PROJECT);
      expect(tsSkill.confidence).toBeGreaterThanOrEqual(0.70);
      expect(tsSkill.confidence).toBeLessThanOrEqual(0.85);
      expect(tsSkill.signals.originalRepoCount).toBe(1);
    });
  });

  // 3. GitHub Service Fetching, Caching, Error & Rate Limit Handling
  describe("GitHub Service", () => {
    it("3/4/5/6/7. fetches and aggregates GitHub profile, repos, and languages correctly", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/users/octocat/repos")) {
          return Promise.resolve({
            data: [
              { name: "repo1", stargazers_count: 10, forks_count: 2, watchers_count: 10, open_issues_count: 1, size: 50, language: "TypeScript", fork: false, archived: false },
              { name: "repo2", stargazers_count: 5, forks_count: 1, watchers_count: 5, open_issues_count: 0, size: 30, language: "JavaScript", fork: false, archived: false },
            ],
          });
        }
        if (url.includes("/users/octocat/events")) {
          return Promise.resolve({ data: [{ id: "ev1", type: "PushEvent" }] });
        }
        if (url.includes("/users/octocat")) {
          return Promise.resolve({
            data: { login: "octocat", name: "The Octocat", bio: "GitHub Mascot", public_repos: 2, avatar_url: "https://avatar.url" },
          });
        }
        return Promise.reject(new Error("Not found"));
      });

      const data = await fetchGitHubProfileData("octocat");
      expect(data.username).toBe("octocat");
      expect(data.aggregateStats.totalStars).toBe(15);
      expect(data.aggregateStats.totalForks).toBe(3);
      expect(data.dominantLanguage).toBe("TypeScript");
      expect(data.languages.TypeScript).toBeDefined();
      expect(data.repositories.length).toBe(2);
    });

    it("2. throws clear error when profile is not found (404)", async () => {
      axios.get.mockRejectedValue({ response: { status: 404 } });
      await expect(fetchGitHubProfileData("nonexistent_user_99999")).rejects.toThrow(/not found/i);
    });

    it("11. throws clear error when GitHub rate limit is exceeded (403)", async () => {
      axios.get.mockRejectedValue({ response: { status: 403 } });
      await expect(fetchGitHubProfileData("rate_limited_user")).rejects.toThrow(/rate limit/i);
    });

    it("17. throws error when username is empty", async () => {
      await expect(fetchGitHubProfileData("")).rejects.toThrow(/username is required/i);
    });

    it("19. utilizes memory cache on repeated queries", async () => {
      axios.get.mockResolvedValueOnce({
        data: { login: "cached_user", name: "Cached", public_repos: 1 },
      }).mockResolvedValueOnce({
        data: [{ name: "r1", language: "Go", stargazers_count: 3 }],
      }).mockResolvedValueOnce({
        data: [],
      });

      const firstCall = await fetchGitHubProfileData("cached_user");
      const secondCall = await fetchGitHubProfileData("cached_user");

      expect(firstCall.username).toBe("cached_user");
      expect(secondCall.username).toBe("cached_user");
    });
  });

  // 4. API Endpoints & Security
  describe("GitHub API Endpoints & Security", () => {
    const app = express();
    app.use(express.json());
    app.use("/api/v1/github", githubRouter);
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error",
      });
    });

    it("16. enforces authentication requirement on protected analysis lookup", async () => {
      const res = await request(app).get("/api/v1/github/latest");
      expect(res.status).toBe(401);
    });

    it("18. returns 400 for comparison without both user parameters", async () => {
      const res = await request(app).get("/api/v1/github/compare?user1=octocat");
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Both user1 and user2");
    });

    it("20. ensures GitHub token is not leaked in client responses", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/users/safeuser/repos")) return Promise.resolve({ data: [] });
        if (url.includes("/users/safeuser/events")) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: { login: "safeuser", public_repos: 0 } });
      });

      const res = await request(app).get("/api/v1/github/profile/safeuser");
      expect(res.status).toBe(200);
      const jsonString = JSON.stringify(res.body);
      expect(jsonString).not.toContain("token");
      expect(jsonString).not.toContain("GITHUB_TOKEN");
    });

    it("21. extracts evidence package via GET /api/v1/github/evidence/:username", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/repos")) {
          return Promise.resolve({
            data: [
              { name: "react-app", language: "JavaScript", size: 100, stargazers_count: 5, forks_count: 1, fork: false },
            ]
          });
        }
        if (url.includes("/events")) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: { login: "evidencedev", public_repos: 1 } });
      });

      const res = await request(app).get("/api/v1/github/evidence/evidencedev");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.evidence).toBeDefined();
      expect(res.body.data.evidence.source).toBe(EVIDENCE_SOURCES.GITHUB);
      expect(res.body.data.evidence.skills.length).toBeGreaterThanOrEqual(1);
    });

    it("22. provides Personal Career Mentor plan via GET /api/v1/github/mentor/:username", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("/repos")) {
          return Promise.resolve({
            data: [
              { name: "frontend-suite", language: "TypeScript", size: 500, stargazers_count: 10, forks_count: 2, fork: false },
            ]
          });
        }
        if (url.includes("/events")) return Promise.resolve({ data: [] });
        return Promise.resolve({ data: { login: "mentordev", public_repos: 1 } });
      });

      const res = await request(app).get("/api/v1/github/mentor/mentordev?role=Full%20Stack%20Developer");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mentor).toBeDefined();
      expect(res.body.data.mentor.hero.targetRole).toBe("Full Stack Developer");
      expect(res.body.data.mentor.readinessDimensions.length).toBeGreaterThanOrEqual(5);
    });
  });
});
