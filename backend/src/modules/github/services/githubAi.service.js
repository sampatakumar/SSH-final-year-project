import { generateJSON, TASK_TIERS } from "../../../services/groq.service.js";
import { GITHUB_PROMPTS } from "../../../core/ai/prompts/github.prompts.js";
import { GitHubProfessionalReviewSchema } from "../../../core/ai/aiContracts.js";

/**
 * Task-specific context builder to minimize prompt tokens and maximize reasoning accuracy.
 */
function buildGitHubReviewContext(data) {
  const { profile = {}, repositories = [], languages = {}, dominantLanguage = "JavaScript", aggregateStats = {} } = data;

  const originalRepos = repositories.filter((r) => !r.fork);
  const topRepos = originalRepos
    .slice(0, 6)
    .map((r) => {
      const parts = [
        `- ${r.name}`,
        `Lang: ${r.language || "N/A"}`,
        `Stars: ${r.stars || 0}`,
        r.description ? `Desc: "${r.description}"` : "Desc: [Missing]",
        r.topics?.length ? `Topics: [${r.topics.slice(0, 4).join(", ")}]` : "Topics: [None]",
        r.homepage ? `Demo: ${r.homepage}` : "Demo: [None]",
      ];
      return parts.join(" | ");
    })
    .join("\n");

  const languageDistribution = Object.entries(languages)
    .slice(0, 5)
    .map(([lang, stat]) => `${lang}: ${stat.percentage || 0}%`)
    .join(", ");

  const missingDescCount = repositories.filter((r) => !r.description).length;
  const missingTopicsCount = repositories.filter((r) => !(r.topics && r.topics.length)).length;

  return [
    `Candidate Profile: ${profile.name || data.username} (@${data.username})`,
    `Bio: ${profile.bio || "None provided"}`,
    `Public Repositories: ${profile.publicRepos || repositories.length} (Original: ${originalRepos.length}, Forks: ${aggregateStats.forkedCount || 0})`,
    `Total Stars: ${aggregateStats.totalStars || 0} | Total Forks: ${aggregateStats.totalForks || 0}`,
    `Dominant Language: ${dominantLanguage}`,
    `Language Distribution: ${languageDistribution || dominantLanguage}`,
    `Hygiene Signals: ${missingDescCount} repos lack descriptions, ${missingTopicsCount} repos lack topic tags.`,
    "",
    "Top Showcase Repositories Evidence:",
    topRepos || "No public repositories available.",
  ].join("\n");
}

/**
 * Generate comprehensive GitHub Professional Developer Review.
 */
export async function generateGitHubInsights(data) {
  const fallback = generateFallbackGitHubInsights(data);
  const context = buildGitHubReviewContext(data);

  const systemPrompt = GITHUB_PROMPTS.PROFESSIONAL_REVIEW.system;
  const userPrompt = `Review this developer's GitHub evidence and return a professional structured review:\n\n${context}\n\nSchema expectations:\n${GITHUB_PROMPTS.PROFESSIONAL_REVIEW.userSchema}`;

  const { data: insights } = await generateJSON({
    systemPrompt,
    userPrompt,
    temperature: 0.25,
    maxTokens: 2000,
    taskTier: TASK_TIERS.HIGH_REASONING,
    fallbackData: fallback,
    schema: GitHubProfessionalReviewSchema,
    feature: "github_professional_review",
  });

  const merged = { ...fallback, ...insights };

  // Ensure compatibility fields for existing UI components
  if (merged.specialization && !merged.summary) {
    merged.summary = `${data.profile?.name || data.username} specializes in ${merged.specialization}. ${merged.technicalStrengths?.[0] || ""}`;
  }
  if (merged.overallScore && !merged.githubOptimizationScore) {
    merged.githubOptimizationScore = merged.overallScore;
  }
  if (merged.recommendations && !merged.portfolioImprovementTips) {
    merged.portfolioImprovementTips = merged.recommendations;
  }

  return merged;
}

function generateFallbackGitHubInsights(data) {
  const { profile = {}, repositories = [], dominantLanguage = "JavaScript", aggregateStats = {} } = data;
  const originalRepos = repositories.filter((r) => !r.fork);
  const avgStars = originalRepos.length > 0 ? (aggregateStats.totalStars / originalRepos.length).toFixed(1) : "0";

  const overallScore = Math.min(
    95,
    Math.max(50, 60 + (profile.bio ? 10 : 0) + (aggregateStats.totalStars > 5 ? 15 : 5) + (profile.avatarUrl ? 10 : 0))
  );

  return {
    overallScore,
    githubOptimizationScore: overallScore,
    specialization: `Full Stack Engineer (${dominantLanguage})`,
    summary: `${profile.name || data.username} is a developer with primary expertise in ${dominantLanguage}. Their profile features ${profile.publicRepos || repositories.length} repositories with ${aggregateStats.totalStars || 0} total stars across public projects.`,
    skillAssessment: `Demonstrates active project creation in ${dominantLanguage}. Portfolio features ${aggregateStats.forkedCount || 0} forked repositories and ${originalRepos.length} original projects with an average of ${avgStars} stars per project.`,
    technicalStrengths: [
      `Strong focus on ${dominantLanguage} development`,
      "Consistent project updates and versioning",
      "Diverse repository distribution across multiple topics",
      "Good balance of public repositories and fork exploration",
    ],
    strengths: [
      `Strong focus on ${dominantLanguage} development`,
      "Consistent project updates and versioning",
      "Diverse repository distribution across multiple topics",
    ],
    engineeringQuality: [
      "Modular separation across frontend and backend services",
      "Standard package manifest dependency management",
      repositories.some((r) => !r.description) ? "Some repositories lack structured technical descriptions" : "Clean repository hygiene",
    ],
    documentationQuality: [
      "README files provide basic project context",
      "Could expand architecture diagrams and environment variable documentation",
    ],
    projectQuality: [
      "Demonstrates practical implementation of core domain concepts",
      "Showcase projects could benefit from attached live deployment URLs",
    ],
    careerOpportunities: [
      `${dominantLanguage} Software Engineer`,
      "Full Stack Web Developer",
    ],
    weaknesses: [
      repositories.some((r) => !r.description) ? "Several repositories lack descriptions and documentation tags" : "Could expand automated test coverage",
      (aggregateStats.totalStars || 0) < 10 ? "Low star count; project visibility and community outreach can be enhanced" : "Some older projects remain inactive",
      (aggregateStats.forkedCount || 0) > (profile.publicRepos || 1) * 0.4 ? "High ratio of forked repos compared to original core projects" : "Consider pinning top showcase repositories",
    ],
    recommendations: [
      "Create visual header banners and architecture diagrams in top repository README files.",
      "Pin your top 4 best-maintained projects to your GitHub profile showcase.",
      "Add live demo URLs, automated GitHub Actions workflows, and license badges to every repository.",
    ],
    portfolioImprovementTips: [
      "Create visual header banners and architecture diagrams in top repository README files.",
      "Pin your top 4 best-maintained projects to your GitHub profile showcase.",
      "Add live demo URLs, automated GitHub Actions workflows, and license badges to every repository.",
    ],
    readmeQualityTips: [
      "Include a quick-start guide, prerequisite list, and screenshot preview in project READMEs.",
      "Document environmental variables and setup steps clearly for prospective contributors.",
    ],
    recommendedTechnologies: [
      dominantLanguage === "TypeScript" || dominantLanguage === "JavaScript" ? "Next.js & Tailwind CSS" : "TypeScript & React",
      "Docker & Container Orchestration",
      "GitHub Actions (CI/CD Pipelines)",
    ],
    careerSuggestions: [
      "Highlight top open-source projects prominently on your resume.",
      "Publish technical write-ups or post project breakdown articles on Dev.to or Medium.",
    ],
  };
}
