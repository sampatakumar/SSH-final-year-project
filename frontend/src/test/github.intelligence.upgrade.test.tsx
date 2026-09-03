import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import type { GitHubAnalysisData } from "../modules/github/types/github.types";
import { SearchBar } from "../modules/github/components/SearchBar";
import { UserOverview } from "../modules/github/components/UserOverview";
import { StatsSummary } from "../modules/github/components/StatsSummary";
import { LanguageDistribution } from "../modules/github/components/LanguageDistribution";
import { RepoAnalysis } from "../modules/github/components/RepoAnalysis";
import { EngineeringQuality } from "../modules/github/components/EngineeringQuality";
import { ProjectComplexity } from "../modules/github/components/ProjectComplexity";
import { SkillEvidence } from "../modules/github/components/SkillEvidence";
import { AIInsights } from "../modules/github/components/AIInsights";
import { ActivityTimeline } from "../modules/github/components/ActivityTimeline";
import { ExportModal } from "../modules/github/components/ExportModal";

const mockGitHubData: GitHubAnalysisData = {
  username: "alexmorgan",
  profile: {
    name: "Alex Morgan",
    bio: "Senior Full Stack Engineer & Open Source Enthusiast",
    avatarUrl: "https://avatars.githubusercontent.com/u/12345?v=4",
    company: "Acme Corp",
    location: "San Francisco, CA",
    blog: "https://alexmorgan.dev",
    publicRepos: 18,
    followers: 240,
    following: 35,
    createdAt: "2020-03-15T00:00:00Z",
  },
  repositories: [
    {
      name: "smart-skill-hub",
      description: "AI-Powered skill evaluation platform with React and Express",
      htmlUrl: "https://github.com/alexmorgan/smart-skill-hub",
      language: "TypeScript",
      stars: 48,
      forks: 12,
      watchers: 48,
      openIssues: 3,
      sizeKB: 3200,
      archived: false,
      fork: false,
      updatedAt: "2024-08-01T12:00:00Z",
      topics: ["react", "typescript", "fullstack", "docker"],
    },
    {
      name: "go-microservice",
      description: "High throughput gRPC service",
      htmlUrl: "https://github.com/alexmorgan/go-microservice",
      language: "Go",
      stars: 20,
      forks: 4,
      watchers: 20,
      openIssues: 1,
      sizeKB: 1100,
      archived: false,
      fork: false,
      updatedAt: "2024-07-20T10:00:00Z",
      topics: ["microservices", "grpc"],
    },
    {
      name: "archived-legacy-tool",
      description: "Old command line tool",
      htmlUrl: "https://github.com/alexmorgan/archived-legacy-tool",
      language: "Python",
      stars: 5,
      forks: 1,
      watchers: 5,
      openIssues: 0,
      sizeKB: 80,
      archived: true,
      fork: false,
      updatedAt: "2022-01-01T00:00:00Z",
      topics: ["cli"],
    },
    {
      name: "forked-reference-repo",
      description: "Forked library reference",
      htmlUrl: "https://github.com/alexmorgan/forked-reference-repo",
      language: "JavaScript",
      stars: 120,
      forks: 30,
      watchers: 120,
      openIssues: 2,
      sizeKB: 500,
      archived: false,
      fork: true,
      updatedAt: "2023-05-10T00:00:00Z",
      topics: [],
    },
  ],
  languages: {
    TypeScript: { size: 3200000, percentage: 65.5, repoCount: 1 },
    Go: { size: 1100000, percentage: 22.5, repoCount: 1 },
    JavaScript: { size: 500000, percentage: 10.2, repoCount: 1 },
    Python: { size: 80000, percentage: 1.8, repoCount: 1 },
  },
  dominantLanguage: "TypeScript",
  aggregateStats: {
    totalStars: 193,
    totalForks: 47,
    totalWatchers: 193,
    totalIssues: 6,
    totalSizeKB: 4880,
    archivedCount: 1,
    forkedCount: 1,
  },
  engineeringQuality: {
    overallScore: 82,
    grade: "Strong",
    dimensions: {
      documentation: 85,
      testingAndCicd: 75,
      architectureDiversity: 88,
      repositoryHygiene: 80,
    },
    observations: ["Overall quality rated at 82/100 based on 4 repositories."],
    strengths: ["High documentation rate across repositories."],
    improvements: ["Expand automated test suites and CI workflows."],
  },
  projectComplexity: {
    summary: {
      beginnerCount: 1,
      intermediateCount: 1,
      advancedCount: 2,
      advancedRatio: 0.5,
      intermediateRatio: 0.25,
      beginnerRatio: 0.25,
    },
    topComplexProjects: [
      {
        repoName: "smart-skill-hub",
        language: "TypeScript",
        level: "Advanced",
        score: 75,
        reasons: ["Full-stack client/server architecture", "Substantial codebase"],
      },
      {
        repoName: "go-microservice",
        language: "Go",
        level: "Advanced",
        score: 65,
        reasons: ["Distributed/microservice architecture"],
      },
    ],
    classifiedProjects: [],
  },
  aiInsights: {
    summary: "Alex Morgan is a senior full-stack developer with primary expertise in TypeScript and Go.",
    skillAssessment: "Demonstrates strong architectural design with fullstack applications and distributed microservices.",
    strengths: [
      "Proficient in TypeScript, React, and Node.js",
      "Experience engineering scalable backend services in Go",
      "High documentation rate across repositories",
      "Solid community engagement with 190+ stars",
    ],
    weaknesses: [
      "Could incorporate more automated end-to-end testing suites",
      "Some older repositories are unmaintained",
    ],
    portfolioImprovementTips: [
      "Highlight smart-skill-hub and go-microservice as showcase projects",
      "Add interactive live demo links and architecture diagrams",
    ],
    readmeQualityTips: [
      "Include clear setup instructions and environment variables",
    ],
    recommendedTechnologies: [
      "Next.js 15",
      "Kubernetes & Helm",
      "gRPC & Protocol Buffers",
    ],
    careerSuggestions: [
      "Target Senior Full Stack or Distributed Systems Engineer positions",
    ],
    githubOptimizationScore: 88,
  },
  recentEvents: [
    {
      type: "PushEvent",
      repo: { name: "alexmorgan/smart-skill-hub" },
      payload: { commits: [{}, {}] },
      created_at: new Date().toISOString(),
    },
  ],
  analyzedAt: new Date().toISOString(),
};

describe("GitHub Intelligence Hub & Full Git Reviewer Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. SearchBar Component
  describe("1. SearchBar Component", () => {
    it("submits search when query entered and Analyze clicked", () => {
      const mockSearch = vi.fn();
      render(<SearchBar onSearch={mockSearch} isLoading={false} />);

      const input = screen.getByPlaceholderText(/search github username/i);
      fireEvent.change(input, { target: { value: "torvalds" } });

      const submitBtn = screen.getByRole("button", { name: /analyze/i });
      fireEvent.click(submitBtn);

      expect(mockSearch).toHaveBeenCalledWith("torvalds");
    });

    it("triggers search when popular demo button is clicked", () => {
      const mockSearch = vi.fn();
      render(<SearchBar onSearch={mockSearch} isLoading={false} />);

      const demoBtn = screen.getByRole("button", { name: /@torvalds/i });
      fireEvent.click(demoBtn);

      expect(mockSearch).toHaveBeenCalledWith("torvalds");
    });
  });

  // 2. UserOverview Component
  describe("2. UserOverview Component", () => {
    it("renders profile metadata, tags, and action buttons", () => {
      const mockMentor = vi.fn();
      const mockCompare = vi.fn();
      const mockExport = vi.fn();

      render(
        <UserOverview
          data={mockGitHubData}
          onOpenMentor={mockMentor}
          onOpenCompare={mockCompare}
          onOpenExport={mockExport}
        />
      );

      expect(screen.getByText("Alex Morgan")).toBeInTheDocument();
      expect(screen.getByText("@alexmorgan")).toBeInTheDocument();
      expect(screen.getByText(/Senior Full Stack Engineer/i)).toBeInTheDocument();
      expect(screen.getByText("San Francisco, CA")).toBeInTheDocument();
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();

      // Test Action Buttons
      fireEvent.click(screen.getByRole("button", { name: /career mentor/i }));
      expect(mockMentor).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /compare/i }));
      expect(mockCompare).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /export/i }));
      expect(mockExport).toHaveBeenCalledTimes(1);
    });
  });

  // 3. StatsSummary Component
  describe("3. StatsSummary Component", () => {
    it("renders accurate metric cards and calculations", () => {
      render(
        <StatsSummary
          stats={mockGitHubData.aggregateStats}
          totalRepos={mockGitHubData.profile.publicRepos}
          dominantLanguage={mockGitHubData.dominantLanguage}
        />
      );

      expect(screen.getByText("Total Stars Earned")).toBeInTheDocument();
      expect(screen.getAllByText("193").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Repository Forks")).toBeInTheDocument();
      expect(screen.getByText("Dominant Technology")).toBeInTheDocument();
      expect(screen.getByText("Portfolio Originality")).toBeInTheDocument();
    });
  });

  // 4. LanguageDistribution Component
  describe("4. LanguageDistribution Component", () => {
    it("renders language pills and handles filter clicks", () => {
      const mockSelect = vi.fn();
      render(
        <LanguageDistribution
          languages={mockGitHubData.languages}
          selectedLanguage="ALL"
          onSelectLanguage={mockSelect}
        />
      );

      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("65.5%")).toBeInTheDocument();
      expect(screen.getByText("Go")).toBeInTheDocument();

      fireEvent.click(screen.getByText("TypeScript"));
      expect(mockSelect).toHaveBeenCalledWith("TypeScript");
    });
  });

  // 5. RepoAnalysis Component
  describe("5. RepoAnalysis Component", () => {
    it("filters repositories by search term and hide flags", () => {
      render(
        <RepoAnalysis
          repositories={mockGitHubData.repositories}
          selectedLanguage="ALL"
          onSelectLanguage={vi.fn()}
        />
      );

      expect(screen.getByText("smart-skill-hub")).toBeInTheDocument();
      expect(screen.getByText("go-microservice")).toBeInTheDocument();

      // Filter by search
      const searchInput = screen.getByPlaceholderText(/search projects/i);
      fireEvent.change(searchInput, { target: { value: "microservice" } });

      expect(screen.getByText("go-microservice")).toBeInTheDocument();
      expect(screen.queryByText("smart-skill-hub")).not.toBeInTheDocument();
    });

    it("hides forked and archived repositories when checkboxes are toggled", () => {
      render(
        <RepoAnalysis
          repositories={mockGitHubData.repositories}
          selectedLanguage="ALL"
          onSelectLanguage={vi.fn()}
        />
      );

      const hideForksCheckbox = screen.getByLabelText(/hide forks/i);
      fireEvent.click(hideForksCheckbox);

      expect(screen.queryByText("forked-reference-repo")).not.toBeInTheDocument();
      expect(screen.getByText("smart-skill-hub")).toBeInTheDocument();
    });
  });

  // 6. EngineeringQuality Component
  describe("6. EngineeringQuality Component", () => {
    it("displays deterministic quality score, grade, and dimension meters", () => {
      render(<EngineeringQuality quality={mockGitHubData.engineeringQuality} />);

      expect(screen.getByText("82/100")).toBeInTheDocument();
      expect(screen.getByText("Strong")).toBeInTheDocument();
      expect(screen.getByText("Documentation & Context")).toBeInTheDocument();
      expect(screen.getByText("Testing & CI/CD Signals")).toBeInTheDocument();
      expect(screen.getByText(/High documentation rate/i)).toBeInTheDocument();
    });
  });

  // 7. ProjectComplexity Component
  describe("7. ProjectComplexity Component", () => {
    it("renders complexity breakdown and classified project cards", () => {
      render(<ProjectComplexity complexity={mockGitHubData.projectComplexity} />);

      expect(screen.getByText("2 Advanced")).toBeInTheDocument();
      expect(screen.getByText("1 Intermediate")).toBeInTheDocument();
      expect(screen.getByText("smart-skill-hub")).toBeInTheDocument();
      expect(screen.getByText("go-microservice")).toBeInTheDocument();
      expect(screen.getByText(/Full-stack client\/server architecture/i)).toBeInTheDocument();
    });
  });

  // 8. SkillEvidence Component
  describe("8. SkillEvidence Component", () => {
    it("renders skill evidence confidence meters calibrated to Smart Skill Hub", () => {
      render(<SkillEvidence data={mockGitHubData} />);

      expect(screen.getByText(/Smart Skill Hub Evidence Integration/i)).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Go")).toBeInTheDocument();
    });
  });

  // 9. AIInsights Component
  describe("9. AIInsights Component", () => {
    it("renders structured AI insights, strengths, weaknesses, and markdown export", () => {
      render(
        <AIInsights
          insights={mockGitHubData.aiInsights}
          username={mockGitHubData.username}
        />
      );

      expect(screen.getByText("88/100")).toBeInTheDocument();
      expect(screen.getByText(/Alex Morgan is a senior full-stack developer/i)).toBeInTheDocument();
      expect(screen.getByText(/Proficient in TypeScript, React, and Node.js/i)).toBeInTheDocument();
      expect(screen.getByText(/Next.js 15/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy md/i })).toBeInTheDocument();
    });
  });

  // 10. ActivityTimeline Component
  describe("10. ActivityTimeline Component", () => {
    it("renders event stream with commit counts and relative time", () => {
      render(<ActivityTimeline recentEvents={mockGitHubData.recentEvents} />);

      expect(screen.getByText("alexmorgan/smart-skill-hub")).toBeInTheDocument();
      expect(screen.getByText("Pushed 2 commits")).toBeInTheDocument();
    });
  });

  // 11. ExportModal Component
  describe("11. ExportModal Component", () => {
    it("renders print and download buttons in open modal", () => {
      render(
        <ExportModal
          isOpen={true}
          onClose={vi.fn()}
          analysis={mockGitHubData}
        />
      );

      expect(screen.getByText("Export GitHub Developer Report")).toBeInTheDocument();
      expect(screen.getByText("Print / Save as PDF")).toBeInTheDocument();
      expect(screen.getByText("Download Structured JSON")).toBeInTheDocument();
    });
  });
});
