/**
 * Deterministic Repository Analyzer
 * Analyzes repository signals for documentation, testing, CI/CD, and architecture.
 */

export function analyzeRepository(repo) {
  const name = String(repo.name || "").toLowerCase();
  const description = String(repo.description || "").trim();
  const topics = Array.isArray(repo.topics) ? repo.topics.map((t) => String(t).toLowerCase()) : [];
  const language = String(repo.language || "").toLowerCase();
  const sizeKB = Number(repo.sizeKB || repo.size || 0);

  // Documentation signals
  const hasDescription = Boolean(description && description.length > 5);
  const hasTopics = topics.length > 0;
  const hasHomepage = Boolean(repo.homepage && String(repo.homepage).trim() !== "");

  // Testing & CI/CD signals (inferred from topics, names, and configs)
  const testSignals = [
    topics.some((t) => ["test", "testing", "jest", "vitest", "pytest", "cypress", "mocha", "playwright"].includes(t)),
    name.includes("test") || name.includes("benchmark"),
  ].filter(Boolean).length;

  const cicdSignals = [
    topics.some((t) => ["ci", "cd", "github-actions", "actions", "docker", "kubernetes", "devops", "k8s"].includes(t)),
    name.includes("docker") || name.includes("infra") || name.includes("deploy"),
  ].filter(Boolean).length;

  // Architecture signals
  const isFullStack = topics.some((t) => ["fullstack", "mern", "mean", "nextjs", "full-stack"].includes(t)) ||
    (topics.includes("react") && topics.includes("express")) ||
    (topics.includes("frontend") && topics.includes("backend"));

  const isMicroservice = topics.some((t) => ["microservices", "grpc", "distributed", "kafka", "rabbitmq"].includes(t));

  return {
    name: repo.name,
    hasDescription,
    hasTopics,
    hasHomepage,
    testSignals: testSignals > 0,
    cicdSignals: cicdSignals > 0,
    isFullStack,
    isMicroservice,
    topics,
    sizeKB,
    stars: repo.stars || repo.stargazers_count || 0,
    forks: repo.forks || repo.forks_count || 0,
  };
}

export function analyzeAllRepositories(repositories = []) {
  return repositories.map(analyzeRepository);
}
