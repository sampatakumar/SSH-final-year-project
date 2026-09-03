import { analyzeRepository } from "./repository.analyzer.js";

/**
 * Deterministic Project Complexity Analyzer
 * Classifies repositories into Beginner, Intermediate, and Advanced tiers.
 */

export function classifyRepositoryComplexity(repo) {
  const analyzed = analyzeRepository(repo);
  const sizeKB = analyzed.sizeKB;
  const topicsCount = analyzed.topics.length;
  const isFork = Boolean(repo.fork);
  const stars = analyzed.stars;

  let score = 0;
  const reasons = [];

  // Code volume
  if (sizeKB > 5000) {
    score += 30;
    reasons.push("Substantial codebase (> 5MB)");
  } else if (sizeKB > 300) {
    score += 20;
    reasons.push("Standard multi-file application structure");
  } else if (sizeKB > 40) {
    score += 10;
  } else {
    reasons.push("Lightweight script or demo");
  }

  // Technology & Topic variety
  if (topicsCount >= 4) {
    score += 25;
    reasons.push(`${topicsCount} integrated technology topics`);
  } else if (topicsCount >= 2) {
    score += 15;
  }

  // Architecture Signals
  if (analyzed.isFullStack) {
    score += 30;
    reasons.push("Full-stack client/server architecture");
  }
  if (analyzed.isMicroservice) {
    score += 30;
    reasons.push("Distributed/microservice architecture");
  }
  if (analyzed.cicdSignals) {
    score += 20;
    reasons.push("CI/CD or containerized deployment setup");
  }
  if (analyzed.testSignals) {
    score += 15;
    reasons.push("Automated testing suites configured");
  }

  // Stargazers / External adoption
  if (stars >= 10) {
    score += 15;
    reasons.push("Significant community interest");
  }

  let level = "Beginner";
  if (score >= 60) {
    level = "Advanced";
  } else if (score >= 25) {
    level = "Intermediate";
  }

  return {
    repoName: repo.name,
    htmlUrl: repo.htmlUrl || repo.html_url,
    language: repo.language || "N/A",
    level,
    score,
    reasons: reasons.length > 0 ? reasons : ["Single-purpose utility"],
    isFork,
    stars,
  };
}

export function analyzePortfolioComplexity(repositories = []) {
  const classified = repositories.map(classifyRepositoryComplexity);

  const beginner = classified.filter((c) => c.level === "Beginner");
  const intermediate = classified.filter((c) => c.level === "Intermediate");
  const advanced = classified.filter((c) => c.level === "Advanced");

  const total = Math.max(1, classified.length);

  return {
    summary: {
      beginnerCount: beginner.length,
      intermediateCount: intermediate.length,
      advancedCount: advanced.length,
      advancedRatio: Number((advanced.length / total).toFixed(2)),
      intermediateRatio: Number((intermediate.length / total).toFixed(2)),
      beginnerRatio: Number((beginner.length / total).toFixed(2)),
    },
    topComplexProjects: [...classified].sort((a, b) => b.score - a.score).slice(0, 5),
    classifiedProjects: classified,
  };
}
