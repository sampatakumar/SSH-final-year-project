import { describe, it, expect } from "vitest";
import { analyzeRepository, analyzeAllRepositories } from "../src/modules/github/analyzers/repository.analyzer.js";
import { calculateEngineeringQuality } from "../src/modules/github/analyzers/quality.analyzer.js";
import { classifyRepositoryComplexity, analyzePortfolioComplexity } from "../src/modules/github/analyzers/complexity.analyzer.js";

const sampleRepos = [
  {
    name: "smart-skill-hub",
    description: "AI-Powered skill evaluation platform with React and Express",
    language: "TypeScript",
    topics: ["react", "express", "fullstack", "docker", "vitest", "mongodb"],
    stargazers_count: 24,
    forks_count: 5,
    size: 2400,
    fork: false,
    homepage: "https://smartskillhub.dev",
  },
  {
    name: "fast-microservice",
    description: "High-throughput gRPC microservice in Go",
    language: "Go",
    topics: ["microservices", "grpc", "ci", "github-actions"],
    stargazers_count: 12,
    forks_count: 2,
    size: 800,
    fork: false,
  },
  {
    name: "quick-utility-script",
    description: "Tiny automation script",
    language: "Python",
    topics: [],
    stargazers_count: 0,
    forks_count: 0,
    size: 15,
    fork: false,
  },
  {
    name: "forked-awesome-repo",
    description: "Curated list of dev tools",
    language: "Markdown",
    topics: ["awesome-list"],
    stargazers_count: 1500,
    forks_count: 300,
    size: 500,
    fork: true,
  }
];

describe("GitHub Module Deterministic Analyzers Suite", () => {
  describe("1. Repository Analyzer", () => {
    it("detects documentation, testing, and CI/CD signals from repository metadata", () => {
      const analyzed = analyzeRepository(sampleRepos[0]);
      expect(analyzed.hasDescription).toBe(true);
      expect(analyzed.hasTopics).toBe(true);
      expect(analyzed.hasHomepage).toBe(true);
      expect(analyzed.isFullStack).toBe(true);
      expect(analyzed.testSignals).toBe(true);
      expect(analyzed.cicdSignals).toBe(true);
    });

    it("analyzes microservice and gRPC architecture signals", () => {
      const analyzed = analyzeRepository(sampleRepos[1]);
      expect(analyzed.isMicroservice).toBe(true);
      expect(analyzed.cicdSignals).toBe(true);
    });
  });

  describe("2. Engineering Quality Analyzer", () => {
    it("calculates multi-dimensional quality scores with grade and observations", () => {
      const quality = calculateEngineeringQuality({
        profile: { bio: "Full stack engineer building distributed tools" },
        repositories: sampleRepos,
        aggregateStats: { totalStars: 36, archivedCount: 0 },
      });

      expect(quality.overallScore).toBeGreaterThan(60);
      expect(quality.grade).toBeDefined();
      expect(quality.dimensions.documentation).toBeGreaterThan(50);
      expect(quality.dimensions.repositoryHygiene).toBeGreaterThan(50);
      expect(quality.strengths.length).toBeGreaterThan(0);
      expect(quality.observations[0]).toContain("Overall quality rated");
    });

    it("handles empty repository list safely without NaN or division by zero", () => {
      const quality = calculateEngineeringQuality({ profile: {}, repositories: [], aggregateStats: {} });
      expect(quality.overallScore).toBe(50);
      expect(quality.grade).toBe("Developing");
      expect(quality.observations[0]).toContain("No public repositories");
    });
  });

  describe("3. Project Complexity Analyzer", () => {
    it("classifies fullstack containerized project as Advanced", () => {
      const complexity = classifyRepositoryComplexity(sampleRepos[0]);
      expect(complexity.level).toBe("Advanced");
      expect(complexity.score).toBeGreaterThanOrEqual(60);
      expect(complexity.reasons).toContain("Full-stack client/server architecture");
    });

    it("classifies microservice project as Advanced or Intermediate", () => {
      const complexity = classifyRepositoryComplexity(sampleRepos[1]);
      expect(["Intermediate", "Advanced"]).toContain(complexity.level);
    });

    it("classifies simple script as Beginner", () => {
      const complexity = classifyRepositoryComplexity(sampleRepos[2]);
      expect(complexity.level).toBe("Beginner");
    });

    it("aggregates portfolio complexity distribution", () => {
      const portfolio = analyzePortfolioComplexity(sampleRepos);
      expect(portfolio.summary.advancedCount).toBeGreaterThanOrEqual(1);
      expect(portfolio.summary.beginnerCount).toBeGreaterThanOrEqual(1);
      expect(portfolio.classifiedProjects.length).toBe(4);
    });
  });
});
