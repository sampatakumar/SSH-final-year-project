import { analyzeAllRepositories } from "./repository.analyzer.js";

/**
 * Deterministic Engineering Quality Analyzer
 * Evaluates developer portfolio hygiene, documentation, testing signals, and codebase maturity.
 */

export function calculateEngineeringQuality({ profile = {}, repositories = [], aggregateStats = {} }) {
  if (!repositories || repositories.length === 0) {
    return {
      overallScore: 50,
      grade: "Developing",
      dimensions: {
        documentation: 40,
        testingAndCicd: 30,
        architectureDiversity: 40,
        repositoryHygiene: 60,
      },
      observations: ["No public repositories found to analyze."],
      strengths: [],
      improvements: ["Create and publish original projects to build engineering evidence."],
    };
  }

  const analyzedRepos = analyzeAllRepositories(repositories);
  const totalRepos = repositories.length;
  const originalRepos = repositories.filter((r) => !r.fork).length;

  // 1. Documentation Score (descriptions, homepages, topics)
  const reposWithDesc = analyzedRepos.filter((r) => r.hasDescription).length;
  const reposWithTopics = analyzedRepos.filter((r) => r.hasTopics).length;
  const reposWithDemo = analyzedRepos.filter((r) => r.hasHomepage).length;

  const descRatio = reposWithDesc / totalRepos;
  const topicRatio = reposWithTopics / totalRepos;
  const demoRatio = reposWithDemo / totalRepos;

  const documentationScore = Math.min(
    100,
    Math.round(descRatio * 45 + topicRatio * 35 + demoRatio * 20 + (profile.bio ? 5 : 0))
  );

  // 2. Testing & CI/CD Score
  const reposWithTests = analyzedRepos.filter((r) => r.testSignals).length;
  const reposWithCicd = analyzedRepos.filter((r) => r.cicdSignals).length;
  const testingAndCicdScore = Math.min(
    100,
    Math.round(
      Math.min(50, (reposWithTests / Math.max(1, originalRepos)) * 60) +
      Math.min(50, (reposWithCicd / Math.max(1, originalRepos)) * 60) +
      25 // Baseline git awareness
    )
  );

  // 3. Architecture & Tech Diversity Score
  const uniqueLanguages = new Set(repositories.map((r) => r.language).filter(Boolean)).size;
  const fullStackCount = analyzedRepos.filter((r) => r.isFullStack).length;
  const microserviceCount = analyzedRepos.filter((r) => r.isMicroservice).length;

  const architectureScore = Math.min(
    100,
    Math.round(
      Math.min(40, uniqueLanguages * 10) +
      Math.min(35, fullStackCount * 18) +
      Math.min(25, microserviceCount * 15) +
      15
    )
  );

  // 4. Repository Hygiene & Originality Score
  const originalRatio = originalRepos / Math.max(1, totalRepos);
  const archivedCount = aggregateStats.archivedCount || 0;
  const hygieneScore = Math.min(
    100,
    Math.round(
      originalRatio * 60 +
      (totalRepos > 3 ? 20 : 10) +
      (archivedCount <= totalRepos * 0.3 ? 20 : 10)
    )
  );

  // Overall Score (Weighted Average)
  const overallScore = Math.min(
    100,
    Math.round(
      documentationScore * 0.30 +
      testingAndCicdScore * 0.25 +
      architectureScore * 0.25 +
      hygieneScore * 0.20
    )
  );

  let grade = "Proficient";
  if (overallScore >= 85) grade = "Exceptional";
  else if (overallScore >= 72) grade = "Strong";
  else if (overallScore >= 58) grade = "Competent";
  else grade = "Developing";

  // Observations & Actionable Recommendations
  const observations = [];
  const strengths = [];
  const improvements = [];

  if (descRatio >= 0.7) {
    strengths.push("High documentation rate: Most repositories have clear descriptions.");
  } else {
    improvements.push("Add concise, descriptive summaries to unlabeled repositories.");
  }

  if (originalRatio >= 0.6) {
    strengths.push("Strong portfolio ownership: Over 60% of repositories are original projects.");
  } else if (originalRatio < 0.4) {
    improvements.push("Increase the ratio of original standalone projects versus forked references.");
  }

  if (uniqueLanguages >= 3) {
    strengths.push(`Polyglot profile: Active projects spanning ${uniqueLanguages} distinct languages.`);
  }

  if (reposWithCicd > 0 || reposWithTests > 0) {
    strengths.push("Demonstrated engineering practices with testing or deployment automation.");
  } else {
    improvements.push("Incorporate automated CI workflows (e.g. GitHub Actions) or test suites.");
  }

  if (aggregateStats.totalStars >= 5) {
    strengths.push(`Community validation: Accumulated ${aggregateStats.totalStars} stargazers across public work.`);
  }

  observations.push(
    `Overall quality rated at ${overallScore}/100 (${grade}) based on ${totalRepos} public repositories.`
  );

  return {
    overallScore,
    grade,
    dimensions: {
      documentation: Math.max(20, documentationScore),
      testingAndCicd: Math.max(20, testingAndCicdScore),
      architectureDiversity: Math.max(20, architectureScore),
      repositoryHygiene: Math.max(20, hygieneScore),
    },
    observations,
    strengths,
    improvements,
  };
}
