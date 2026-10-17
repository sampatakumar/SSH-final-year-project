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

    // Prerequisites mapping
    const prerequisitesMap = {
      React: ["JavaScript", "HTML", "CSS"],
      "Express.js": ["Node.js", "JavaScript"],
      "REST APIs": ["HTTP Fundamentals", "JavaScript"],
      Docker: ["Linux Basics", "Command Line"],
      TypeScript: ["JavaScript"],
      "Next.js": ["React", "JavaScript"],
      MongoDB: ["JSON / Object Data Modeling"],
      PostgreSQL: ["Relational Database Concepts", "SQL Basics"],
      "CI/CD": ["Git", "Automated Testing"],
      Jest: ["JavaScript"],
      Vitest: ["JavaScript", "TypeScript"],
      "Full Stack Development": ["JavaScript", "React", "Node.js"],
      "Machine Learning": ["Python", "Linear Algebra Basics"],
    };

    const prerequisites = prerequisitesMap[canonical] || ["Basic Programming Fundamentals"];
    const completionCriteria = codingTask
      ? `Successfully execute and pass 100% of test cases for "${codingTask.taskTitle}" in the isolated Docker coding sandbox.`
      : `Build and document an original implementation prototype with error handling and verify against standard tests.`;

    // Verified EduTube link mapping
    const canonicalEdutubeRegistry = {
      Python: { title: "Python for Beginners - Full Course", url: "https://www.youtube.com/watch?v=kqtD5dpn9C8", id: "kqtD5dpn9C8", type: "full_course" },
      JavaScript: { title: "JavaScript Full Course for Beginners", url: "https://www.youtube.com/watch?v=PkZNo7MFNFg", id: "PkZNo7MFNFg", type: "full_course" },
      React: { title: "React 18 / 19 Full Course 2024", url: "https://www.youtube.com/watch?v=bMknfKXIFA8", id: "bMknfKXIFA8", type: "full_course" },
      "Node.js": { title: "Node.js and Express.js Full Course", url: "https://www.youtube.com/watch?v=Oe421EPjeBE", id: "Oe421EPjeBE", type: "full_course" },
      Docker: { title: "Docker Tutorial for Beginners [Full Course]", url: "https://www.youtube.com/watch?v=3c-iBn73dDE", id: "3c-iBn73dDE", type: "full_course" },
      "Data Structures": { title: "Data Structures and Algorithms in Java", url: "https://www.youtube.com/playlist?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ", id: "PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ", type: "complete_playlist" },
    };

    const verifiedMatch = canonicalEdutubeRegistry[canonical] || null;
    const edutubeResource = verifiedMatch
      ? {
          title: verifiedMatch.title,
          edutubeUrl: verifiedMatch.url.includes("playlist")
            ? `/dashboard/edutube?playlist=${encodeURIComponent(verifiedMatch.id)}`
            : `/dashboard/edutube?video=${encodeURIComponent(verifiedMatch.id)}`,
          videoUrl: verifiedMatch.url,
          isVerified: true,
          type: verifiedMatch.type,
        }
      : {
          title: `${canonical} Full Course Tutorial`,
          edutubeUrl: `/dashboard/edutube?search=${encodeURIComponent(canonical)}`,
          videoUrl: null,
          isVerified: false,
          type: "search_query",
        };

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
      prerequisites,
      completionCriteria,
      assessmentMethod: codingTask ? "Deterministic Sandbox Test Suite" : "Evidence-Based Code Artifact Review",
      platformTaskId: codingTask ? codingTask.taskId : null,
      platformTaskTitle: codingTask ? codingTask.taskTitle : null,
      documentationUrl: docUrl,
      edutubeResource,
      edutubeTopicQuery: `${canonical} full course tutorial`,
      estimatedHours,
      estimatedEffortText: `~${estimatedHours} hours (estimated)`,
      actionStatus: "pending",
    });
  }

  // 4. Deterministic Prerequisite & Priority Topological Ordering (Cycle-Safe)
  // If recommendation A is a prerequisite of recommendation B, A MUST precede B.
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };

  // First sort by priority
  recommendations.sort((a, b) => (priorityRank[a.priority] ?? 4) - (priorityRank[b.priority] ?? 4));

  // Build dependency map between active recommendations
  const skillIndexMap = new Map(recommendations.map((r, idx) => [r.skill.toLowerCase(), idx]));
  const adjusted = [...recommendations];

  // Pass over recommendations to reorder prerequisites before dependents within same or higher priority
  for (let pass = 0; pass < adjusted.length; pass++) {
    let swapped = false;
    for (let i = 0; i < adjusted.length; i++) {
      for (let j = i + 1; j < adjusted.length; j++) {
        const itemBefore = adjusted[i];
        const itemAfter = adjusted[j];
        const priorityBefore = priorityRank[itemBefore.priority] ?? 4;
        const priorityAfter = priorityRank[itemAfter.priority] ?? 4;

        // If itemBefore depends on itemAfter and itemAfter is at least as critical, reorder
        if (priorityAfter <= priorityBefore) {
          if (itemBefore.prerequisites && itemBefore.prerequisites.some((p) => p.toLowerCase() === itemAfter.skill.toLowerCase())) {
            // Check for circular dependency before swapping
            const isCircular = itemAfter.prerequisites && itemAfter.prerequisites.some((p) => p.toLowerCase() === itemBefore.skill.toLowerCase());
            if (!isCircular) {
              adjusted[i] = itemAfter;
              adjusted[j] = itemBefore;
              swapped = true;
            }
          }
        }
      }
    }
    if (!swapped) break;
  }

  return adjusted;
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
