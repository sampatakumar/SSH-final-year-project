import { generateJSON, TASK_TIERS } from "../../../services/groq.service.js";
import { User } from "../../../core/database/models/user.models.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../../github/models/githubAnalysis.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubeRecommendationFeedback,
} from "../models/index.js";

export class EduTubeLearningIntentService {
  /**
   * Gather complete, grounded user context across all Smart Skill Hub sources.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user MongoDB ID
   * @returns {Promise<object>} Clean user learning context
   */
  async gatherUserLearningContext(ownerId) {
    const [
      user,
      skillProfile,
      githubRecord,
      watchHistory,
      completedProgress,
      savedVideos,
      feedbackList,
    ] = await Promise.all([
      User.findById(ownerId).lean(),
      SkillProfile.findOne({ owner: ownerId }).lean(),
      GitHubAnalysis.findOne({ owner: ownerId }).sort({ updatedAt: -1 }).lean(),
      EduTubeWatchHistory.find({ owner: ownerId })
        .sort({ watchedAt: -1 })
        .limit(10)
        .lean(),
      EduTubeProgress.find({ owner: ownerId, completed: true }).lean(),
      EduTubeSavedVideo.find({ owner: ownerId })
        .sort({ savedAt: -1 })
        .limit(10)
        .lean(),
      EduTubeRecommendationFeedback.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
    ]);

    const targetRole =
      user?.targetRole ||
      skillProfile?.targetRole ||
      "Full Stack Developer";

    const topSkills = (skillProfile?.skills || []).map((s) => ({
      skill: s.skill,
      canonicalName: s.canonicalName,
      level: s.level,
      score: s.score,
      category: s.category || "General",
    }));

    const skillGaps = (skillProfile?.skillGaps || []).map((g) => ({
      skill: g.skill,
      canonicalName: g.canonicalName,
      priority: g.priority || "Medium",
      reason: g.reason || "",
      currentScore: g.currentScore || 0,
      targetScore: g.targetScore || 75,
    }));

    const githubLanguages = Object.keys(githubRecord?.languages || {}).slice(0, 5);
    const githubRepos = (githubRecord?.repositories || []).slice(0, 5).map((r) => ({
      name: r.name,
      language: r.language,
      description: r.description || "",
    }));

    const recentHistory = watchHistory.map((h) => ({
      videoId: h.videoId,
      title: h.title,
      channelTitle: h.channelTitle,
      completed: h.completed,
    }));

    const completedVideoIds = completedProgress.map((p) => p.videoId);

    const savedTitles = savedVideos.map((s) => s.title);

    const notInterestedVideos = feedbackList
      .filter((f) => f.action === "not_interested")
      .map((f) => f.videoId);

    const alreadyKnownTopics = feedbackList
      .filter((f) => f.action === "already_know")
      .map((f) => f.topic || f.videoId);

    const boostedTopics = feedbackList
      .filter((f) => f.action === "more_like_this")
      .map((f) => f.topic || f.videoId);

    return {
      targetRole,
      topSkills,
      skillGaps,
      githubLanguages,
      githubRepos,
      recentHistory,
      completedVideoIds,
      savedTitles,
      notInterestedVideos,
      alreadyKnownTopics,
      boostedTopics,
    };
  }

  /**
   * Derive structured learning intent using Groq openai/gpt-oss-120b.
   *
   * @param {object} context - Grounded user learning context
   * @returns {Promise<object>} Structured learning intent with queries and reasons
   */
  async generateLearningIntent(context) {
    const systemPrompt = `You are the Smart Skill Hub AI Learning Intelligence Engine.
Your mission is to analyze the candidate's actual engineering skill matrix, identified skill gaps, target career role, project/GitHub evidence, and recent watch history to synthesize an optimal, personalized educational video discovery intent.

CRITICAL RULES:
1. Ground every recommendation STRICTLY in the supplied user evidence.
2. NEVER invent user skills, projects, experience, or career goals not provided in the context.
3. NEVER invent courses, URLs, or video IDs. Output search query terms and reasoning only.
4. Focus heavily on closing identified skill gaps and advancing along the target career path.
5. Avoid topics the user has already mastered or marked as 'already known'.
6. Keep reasons concise, factual, and actionable.
7. Return ONLY a valid raw JSON object matching the requested schema. No markdown formatting.`;

    const userPrompt = `Candidate Grounded Evidence:
Target Career Role: "${context.targetRole}"

Current Skills Observed in Profile:
${
  context.topSkills.length > 0
    ? context.topSkills
        .slice(0, 10)
        .map((s) => `- ${s.skill} (${s.level}, score: ${s.score}/100, category: ${s.category})`)
        .join("\n")
    : "- No skills formally recorded yet (default entry level)."
}

Identified Skill Gaps to Close:
${
  context.skillGaps.length > 0
    ? context.skillGaps
        .slice(0, 8)
        .map((g) => `- ${g.skill} [Priority: ${g.priority}] Reason: ${g.reason || "Proficiency gap"}`)
        .join("\n")
    : "- None identified."
}

GitHub Repository & Project Evidence:
- Languages: ${context.githubLanguages.join(", ") || "None"}
- Recent Projects: ${
      context.githubRepos.map((r) => `${r.name} (${r.language})`).join(", ") || "None"
    }

Recent Video Watch History:
${
  context.recentHistory.length > 0
    ? context.recentHistory.map((h) => `- ${h.title}`).join("\n")
    : "- None yet."
}

Topics to Avoid / Already Mastered:
${context.alreadyKnownTopics.join(", ") || "None"}

Boosted Interest Topics:
${context.boostedTopics.join(", ") || "None"}

Task:
Produce a JSON object with:
1. "learningGoals": Array of top 3-4 priority goals targeting skill gaps with YouTube search queries (e.g. "Docker tutorial for beginners", "Kubernetes crash course").
2. "careerTrack": Object with "role" (string), "focusAreas" (string array), and "queries" (string array of 2-3 YouTube search queries for career milestone progression).
3. "projectIdeas": Array of 2-3 project walkthrough tutorial ideas matching their concrete GitHub stack (e.g. "Full Stack MERN dashboard tutorial").
4. "historyNextSteps": Array of 2-3 logical next-step queries continuing from their recent watch history.
5. "avoidTopics": Array of strings to avoid.`;

    const fallbackData = this.buildHeuristicLearningIntent(context);

    try {
      const result = await generateJSON({
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 1800,
        taskTier: TASK_TIERS.HIGH_REASONING,
        fallbackData,
        feature: "edutube_learning_intent",
      });

      const intent = result.data || fallbackData;
      return this.validateAndNormalizeIntent(intent, fallbackData);
    } catch (err) {
      console.warn("[edutube-intent] Groq intent generation failed, using heuristic fallback:", err.message);
      return fallbackData;
    }
  }

  /**
   * Deterministic fallback learning intent when AI is offline or unavailable.
   */
  buildHeuristicLearningIntent(context) {
    const role = context.targetRole || "Full Stack Developer";
    const learningGoals = [];

    if (context.skillGaps.length > 0) {
      for (const gap of context.skillGaps.slice(0, 3)) {
        learningGoals.push({
          topic: gap.skill,
          searchQuery: `${gap.skill} tutorial course`,
          reason: `Matches your identified ${gap.skill} skill gap (${gap.priority} priority)`,
          priority: gap.priority.toLowerCase(),
          level: gap.currentScore < 40 ? "beginner" : "intermediate",
        });
      }
    } else {
      learningGoals.push({
        topic: "JavaScript & Modern Web",
        searchQuery: "JavaScript modern web development course",
        reason: `Foundational learning track for ${role}`,
        priority: "high",
        level: "beginner",
      });
    }

    const careerTrack = {
      role,
      focusAreas: context.skillGaps.slice(0, 3).map((g) => g.skill),
      queries: [
        `${role} complete course roadmap`,
        `${role} practical projects architecture`,
      ],
    };

    const projectIdeas = [];
    if (context.githubLanguages.length > 0) {
      const stack = context.githubLanguages.slice(0, 2).join(" ");
      projectIdeas.push({
        title: `${stack} Full Stack Project`,
        searchQuery: `${stack} project tutorial step by step`,
        reason: `Connects to technologies in your GitHub repositories (${context.githubLanguages.join(", ")})`,
      });
    } else {
      projectIdeas.push({
        title: "Full Stack Web Application",
        searchQuery: "Full stack web application project tutorial",
        reason: `Recommended hands-on project for ${role}`,
      });
    }

    const historyNextSteps = [];
    if (context.recentHistory.length > 0) {
      const lastWatched = context.recentHistory[0].title;
      historyNextSteps.push({
        topic: "Next lesson",
        searchQuery: `${lastWatched} next steps advanced`,
        reason: `Builds directly on your recent lesson "${lastWatched}"`,
      });
    }

    return {
      learningGoals,
      careerTrack,
      projectIdeas,
      historyNextSteps,
      avoidTopics: context.alreadyKnownTopics || [],
    };
  }

  /**
   * Validate and sanitize returned intent structure.
   */
  validateAndNormalizeIntent(intent, fallback) {
    if (!intent || typeof intent !== "object") {
      return fallback;
    }

    const learningGoals = Array.isArray(intent.learningGoals) && intent.learningGoals.length > 0
      ? intent.learningGoals.map((g) => ({
          topic: String(g.topic || "Engineering Skill").trim(),
          searchQuery: String(g.searchQuery || `${g.topic} tutorial`).trim(),
          reason: String(g.reason || "Recommended for your skill profile").trim(),
          priority: String(g.priority || "medium").toLowerCase(),
          level: String(g.level || "all").toLowerCase(),
        }))
      : fallback.learningGoals;

    const careerTrack = {
      role: String(intent.careerTrack?.role || fallback.careerTrack.role).trim(),
      focusAreas: Array.isArray(intent.careerTrack?.focusAreas)
        ? intent.careerTrack.focusAreas.map((f) => String(f).trim())
        : fallback.careerTrack.focusAreas,
      queries: Array.isArray(intent.careerTrack?.queries) && intent.careerTrack.queries.length > 0
        ? intent.careerTrack.queries.map((q) => String(q).trim())
        : fallback.careerTrack.queries,
    };

    const projectIdeas = Array.isArray(intent.projectIdeas) && intent.projectIdeas.length > 0
      ? intent.projectIdeas.map((p) => ({
          title: String(p.title || "Project Walkthrough").trim(),
          searchQuery: String(p.searchQuery || `${p.title} project tutorial`).trim(),
          reason: String(p.reason || "Project recommended based on your stack").trim(),
        }))
      : fallback.projectIdeas;

    const historyNextSteps = Array.isArray(intent.historyNextSteps) && intent.historyNextSteps.length > 0
      ? intent.historyNextSteps.map((h) => ({
          topic: String(h.topic || "Advanced Lesson").trim(),
          searchQuery: String(h.searchQuery || `${h.topic} tutorial`).trim(),
          reason: String(h.reason || "Continues your recent watch history").trim(),
        }))
      : fallback.historyNextSteps;

    const avoidTopics = Array.isArray(intent.avoidTopics)
      ? intent.avoidTopics.map((a) => String(a).toLowerCase().trim())
      : [];

    return {
      learningGoals,
      careerTrack,
      projectIdeas,
      historyNextSteps,
      avoidTopics,
    };
  }
}

export const edutubeLearningIntentService = new EduTubeLearningIntentService();
