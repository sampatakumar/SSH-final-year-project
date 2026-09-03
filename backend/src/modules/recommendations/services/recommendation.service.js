import { AUTHORITATIVE_DOCS } from "../catalog/documentationCatalog.js";
import { VERIFIED_CODING_TASKS } from "../catalog/taskMappings.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { analyzeUserGaps } from "../../gaps/services/skillGap.service.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { RecommendationError } from "../../../core/errors/ApiError.js";

/**
 * Generate actionable, prioritized learning, practice, and documentation recommendations from skill gaps.
 *
 * @param {Array<object>} gaps - Output from analyzeSkillGaps
 * @param {string} [targetRole="Full Stack Developer"] - Role context
 * @returns {Array<object>} Prioritized recommendation objects
 */
export function generateRecommendations(gaps = [], targetRole = "Full Stack Developer") {
  if (!Array.isArray(gaps)) return [];

  // Filter out any met skills if passed by mistake; only gaps need recommendations
  const activeGaps = gaps.filter((g) => g.status !== "Met Requirement");

  const seenSkills = new Set();
  const recommendations = [];

  for (let i = 0; i < activeGaps.length; i++) {
    const gap = activeGaps[i];
    const canonical = normalizeSkill(gap.canonicalName || gap.skill);
    if (!canonical) continue;

    const key = canonical.toLowerCase();
    if (seenSkills.has(key)) continue;
    seenSkills.add(key);

    const priority = gap.priority || "Medium";
    const status = gap.status || "Missing";
    const currentScore = gap.currentScore || 0;
    const currentLevel = gap.currentLevel || "None";
    const requiredLevel = gap.requiredLevel || "Competent";

    // 1. Coding sandbox task lookup
    const codingTask = VERIFIED_CODING_TASKS[canonical] || null;

    // 2. Official documentation URL lookup
    const docUrl = AUTHORITATIVE_DOCS[canonical] || "https://developer.mozilla.org/";

    // 3. Formulate tailored learning objective, action, and reasoning
    let learningObjective = "";
    let practicalAction = "";
    let reasoning = "";
    let estimatedHours = 5;

    switch (canonical) {
      case "Docker":
        learningObjective = "Understand containerization fundamentals, Dockerfiles, and multi-container orchestration.";
        practicalAction = "Create an isolated Dockerfile for a Node.js Express server and run it on port 8000.";
        reasoning = `Docker is required for ${targetRole}. Current state is "${currentLevel}" (${currentScore}/100) vs required "${requiredLevel}".`;
        estimatedHours = 5;
        break;
      case "REST APIs":
        learningObjective = "Design idempotent RESTful endpoints with proper HTTP status codes, validation, and error envelopes.";
        practicalAction = "Build a CRUD API using Express.js and test boundary error conditions with Postman.";
        reasoning = `REST API design is a core requirement for ${targetRole}.`;
        estimatedHours = 4;
        break;
      case "MongoDB":
        learningObjective = "Master NoSQL document modeling, Mongoose schemas, and efficient index design.";
        practicalAction = "Implement relational-style referencing and aggregation queries in MongoDB.";
        reasoning = `MongoDB is a primary database expectation for ${targetRole}.`;
        estimatedHours = 6;
        break;
      case "React":
        learningObjective = "Learn modern React hooks, state management, component lifecycle, and accessibility.";
        practicalAction = "Build a responsive dashboard component with loading and error states.";
        reasoning = `React is a critical frontend technology for ${targetRole}.`;
        estimatedHours = 8;
        break;
      case "TypeScript":
        learningObjective = "Understand static type definitions, interfaces, generics, and strict compiler configs.";
        practicalAction = "Refactor JavaScript utility functions into strongly-typed TypeScript modules.";
        reasoning = `TypeScript competency is expected for scalable ${targetRole} workflows.`;
        estimatedHours = 5;
        break;
      case "Arrays":
      case "Hash Maps":
      case "Stack":
      case "Data Structures":
      case "Algorithms":
      case "Problem Solving":
        learningObjective = "Master time & space complexity, hash table lookups, and algorithmic problem-solving patterns.";
        practicalAction = codingTask
          ? `Solve the "${codingTask.taskTitle}" challenge in the Smart Skill Hub isolated Docker sandbox.`
          : `Solve 3 algorithmic challenges focusing on ${canonical} with optimal time complexity.`;
        reasoning = `Algorithmic problem solving in ${canonical} provides verifiable practical evidence.`;
        estimatedHours = 4;
        break;
      default:
        learningObjective = `Develop practical core proficiency in ${canonical} tailored for ${targetRole} requirements.`;
        practicalAction = `Build a standalone prototype project or test module demonstrating ${canonical} usage.`;
        reasoning = `${canonical} was identified as a ${priority.toLowerCase()} gap (${status}) for ${targetRole}.`;
        estimatedHours = 5;
    }

    recommendations.push({
      recommendationId: `rec_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${recommendations.length + 1}`,
      skill: canonical,
      canonicalName: canonical,
      category: gap.category || getSkillCategory(canonical),
      priority,
      gapStatus: status,
      currentScore,
      currentLevel,
      targetLevel: requiredLevel,
      targetRole,
      learningObjective,
      practicalAction,
      reasoning,
      platformTaskId: codingTask ? codingTask.taskId : null,
      platformTaskTitle: codingTask ? codingTask.taskTitle : null,
      documentationUrl: docUrl,
      estimatedHours,
      actionStatus: "pending",
    });
  }

  // Ensure deterministic priority sorting: Critical -> High -> Medium -> Low
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  recommendations.sort((a, b) => (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4));

  return recommendations;
}

/**
 * Generate and persist recommendations for authenticated user based on active gaps.
 *
 * @param {object} user - Authenticated user
 * @param {string} [roleOverride] - Optional target role override
 * @returns {Promise<object>} Recommendations report
 */
export async function generateUserRecommendations(user, roleOverride = null) {
  if (!user || !user._id) {
    throw new RecommendationError("Authentication required for recommendations", 401);
  }

  const targetRole = roleOverride || user.targetRole || "Full Stack Developer";
  const gapReport = await analyzeUserGaps(user, targetRole);

  const recommendations = generateRecommendations(gapReport.gaps, targetRole);

  // Persist recommendations to user's SkillProfile
  await SkillProfile.updateOne(
    { owner: user._id },
    {
      $set: {
        recommendations: recommendations.map((r) => ({
          skill: r.skill,
          title: r.practicalAction,
          type: r.platformTaskId ? "coding_practice" : "documentation",
          actionUrl: r.documentationUrl,
          taskId: r.platformTaskId || "",
          description: `${r.learningObjective} Reason: ${r.reasoning}`,
          estimatedMinutes: r.estimatedHours * 60,
          isCompleted: false,
        })),
      },
    }
  );

  return {
    targetRole,
    recommendationsCount: recommendations.length,
    recommendations,
    gapsSummary: {
      totalGaps: gapReport.gapsCount,
      criticalGaps: gapReport.gaps.filter((g) => g.priority === "Critical").length,
      highGaps: gapReport.gaps.filter((g) => g.priority === "High").length,
    },
  };
}
