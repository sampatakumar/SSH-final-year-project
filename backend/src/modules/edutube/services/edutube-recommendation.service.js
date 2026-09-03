import { edutubeLearningIntentService } from "./edutube-learning-intent.service.js";
import { edutubeSearchService } from "./edutube-search.service.js";
import { rankEducationalVideos } from "./edutube-ranking.service.js";
import { edutubePersistenceService } from "./edutube-persistence.service.js";
import { generateJSON, TASK_TIERS } from "../../../services/groq.service.js";
import {
  EduTubeRecommendationFeedback,
  EduTubeProgress,
  EduTubeWatchHistory,
} from "../models/index.js";
import { ApiError } from "../../../core/errors/ApiError.js";

// 15-minute recommendation cache
const RECOMMENDATION_CACHE = new Map();
const RECOMMENDATION_CACHE_TTL_MS = 15 * 60 * 1000;

export class EduTubeRecommendationService {
  /**
   * Get cached recommendation result if still valid.
   */
  getCachedRecommendations(ownerId) {
    const key = `edutube:recommendations:${ownerId.toString()}`;
    const cached = RECOMMENDATION_CACHE.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > RECOMMENDATION_CACHE_TTL_MS) {
      RECOMMENDATION_CACHE.delete(key);
      return null;
    }

    return { ...cached.data, cached: true };
  }

  /**
   * Store recommendations in cache.
   */
  setCachedRecommendations(ownerId, data) {
    const key = `edutube:recommendations:${ownerId.toString()}`;
    RECOMMENDATION_CACHE.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate recommendations cache for a user.
   */
  invalidateCache(ownerId) {
    const key = `edutube:recommendations:${ownerId.toString()}`;
    RECOMMENDATION_CACHE.delete(key);
  }

  /**
   * Main Personalized Recommendation Pipeline (Phase 3C)
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user MongoDB ID
   * @param {object} options - Options including forceRefresh
   * @returns {Promise<object>} Fully personalized recommendations across 6 distinct learning sections
   */
  async getPersonalizedRecommendations(ownerId, { forceRefresh = false } = {}) {
    if (!forceRefresh) {
      const cached = this.getCachedRecommendations(ownerId);
      if (cached) {
        return cached;
      }
    }

    // 1. Gather grounded user context
    const context = await edutubeLearningIntentService.gatherUserLearningContext(ownerId);

    // 2. Generate structured learning intent (Groq or deterministic fallback)
    const intent = await edutubeLearningIntentService.generateLearningIntent(context);

    // Set of IDs to filter out (completed or dismissed)
    const completedSet = new Set(context.completedVideoIds || []);
    const notInterestedSet = new Set(context.notInterestedVideos || []);
    const seenVideoIds = new Set();

    // 3. Helper to query YouTube candidates and enrich with personalization scores
    const fetchAndEnrichSection = async (queriesWithReason, maxPerSection = 6) => {
      const candidateList = [];

      for (const item of queriesWithReason) {
        if (!item.query?.trim()) continue;

        try {
          const searchRes = await edutubeSearchService.searchVideos({
            q: item.query.trim(),
            maxResults: 6,
          });

          for (const video of searchRes.items || []) {
            if (completedSet.has(video.videoId)) continue;
            if (notInterestedSet.has(video.videoId)) continue;
            if (seenVideoIds.has(video.videoId)) continue;

            seenVideoIds.add(video.videoId);

            // Compute personalization score
            const baseEduScore = video.educationalScore ?? 80;
            const boostMatch = context.boostedTopics.some((t) =>
              video.title.toLowerCase().includes(t.toLowerCase())
            )
              ? 10
              : 0;

            const gapBonus = item.isGap ? 15 : 0;
            const roadmapBonus = item.isRoadmap ? 10 : 0;
            const projectBonus = item.isProject ? 12 : 0;

            const personalizationScore = Math.min(
              100,
              Math.max(
                40,
                Math.round(baseEduScore * 0.5 + 30 + boostMatch + gapBonus + roadmapBonus + projectBonus)
              )
            );

            // Compile grounded reasons
            const whyRecommended = [item.reason];
            if (context.targetRole && !item.isRoadmap) {
              whyRecommended.push(`Aligned with your ${context.targetRole} career goals`);
            }
            if (boostMatch > 0) {
              whyRecommended.push("Based on your positive learning preferences");
            }

            candidateList.push({
              ...video,
              personalizationScore,
              whyRecommended,
              topic: item.topic || item.query,
            });

            if (candidateList.length >= maxPerSection) break;
          }
        } catch (err) {
          console.warn(`[edutube-rec] Candidate search failed for "${item.query}":`, err.message);
        }

        if (candidateList.length >= maxPerSection) break;
      }

      // Sort candidate list by personalizationScore descending
      return candidateList.sort((a, b) => b.personalizationScore - a.personalizationScore);
    };

    // 4. Build Queries for each section

    // Section A: For You (Top Intent Goals + Career)
    const forYouQueries = [
      ...intent.learningGoals.map((g) => ({
        query: g.searchQuery,
        topic: g.topic,
        reason: g.reason,
        isGap: true,
      })),
      ...intent.careerTrack.queries.map((q) => ({
        query: q,
        topic: intent.careerTrack.role,
        reason: `Targeted milestone for ${intent.careerTrack.role}`,
        isRoadmap: true,
      })),
    ];

    // Section B: Close Your Skill Gaps
    const skillGapQueries = context.skillGaps.map((gap) => ({
      query: `${gap.skill} full course tutorial`,
      topic: gap.skill,
      reason: `Addresses your identified ${gap.skill} skill gap (${gap.priority} priority)`,
      isGap: true,
    }));

    // Section C: Your Career Path
    const careerQueries = intent.careerTrack.queries.map((q) => ({
      query: q,
      topic: intent.careerTrack.role,
      reason: `Essential milestone for ${intent.careerTrack.role} path`,
      isRoadmap: true,
    }));

    // Section D: Based On Your Learning (History)
    const historyQueries = intent.historyNextSteps.map((h) => ({
      query: h.searchQuery,
      topic: h.topic,
      reason: h.reason,
    }));

    // Section E: Learn Through Projects
    const projectQueries = intent.projectIdeas.map((p) => ({
      query: p.searchQuery,
      topic: p.title,
      reason: p.reason,
      isProject: true,
    }));

    // Section F: Trending in Your Stack
    const dominantTech = context.githubLanguages[0] || context.topSkills[0]?.skill || "JavaScript";
    const trendingQueries = [
      {
        query: `${dominantTech} best practices 2026 course`,
        topic: dominantTech,
        reason: `Highly rated in ${dominantTech} engineering community`,
      },
    ];

    // 5. Execute parallel section generation
    const [
      personalized,
      skillGaps,
      careerPath,
      basedOnHistory,
      projectLearning,
      trending,
    ] = await Promise.all([
      fetchAndEnrichSection(forYouQueries, 6),
      fetchAndEnrichSection(skillGapQueries, 6),
      fetchAndEnrichSection(careerQueries, 6),
      fetchAndEnrichSection(historyQueries, 6),
      fetchAndEnrichSection(projectQueries, 6),
      fetchAndEnrichSection(trendingQueries, 6),
    ]);

    const result = {
      personalized,
      skillGaps,
      careerPath,
      basedOnHistory,
      projectLearning,
      trending,
      learningContext: {
        targetRole: context.targetRole,
        topSkills: context.topSkills.slice(0, 5),
        skillGaps: context.skillGaps.slice(0, 5),
        completedCount: context.completedVideoIds.length,
        historyCount: context.recentHistory.length,
      },
      generatedAt: new Date().toISOString(),
      cached: false,
    };

    // Cache the assembled recommendations
    this.setCachedRecommendations(ownerId, result);

    return result;
  }

  /**
   * Record user recommendation feedback and invalidate recommendation cache.
   */
  async recordFeedback(ownerId, { videoId, action, topic = "" }) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    if (!["not_interested", "already_know", "more_like_this"].includes(action)) {
      throw new ApiError(400, "Action must be 'not_interested', 'already_know', or 'more_like_this'.");
    }

    const feedback = await EduTubeRecommendationFeedback.create({
      owner: ownerId,
      videoId: videoId.trim(),
      action,
      topic: topic.trim(),
    });

    // Invalidate user recommendation cache
    this.invalidateCache(ownerId);

    return feedback;
  }

  /**
   * Generate an AI-Curated Learning Track (Course Syllabus) with real YouTube videos.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user ID
   * @param {object} payload - { topic, targetRole }
   * @returns {Promise<object>} Structured learning track with real YouTube lesson objects
   */
  async generateLearningTrack(ownerId, { topic, targetRole = "Full Stack Developer" }) {
    if (!topic?.trim()) {
      throw new ApiError(400, "Topic is required to generate a learning track.");
    }

    const cleanTopic = topic.trim();

    // 1. Prompt Groq openai/gpt-oss-120b for 4-6 chronological curriculum steps
    const systemPrompt = `You are the Smart Skill Hub Curriculum Architect.
Generate a structured, chronological 4-6 lesson learning syllabus for a software engineer mastering "${cleanTopic}".
Target Role: "${targetRole}".

CRITICAL RULES:
1. Break down "${cleanTopic}" into progressive milestones (Fundamentals -> Core Architecture -> Practical Implementation -> Production Optimization).
2. For each lesson provide:
   - "lessonTitle": Concise module title (e.g. "Docker Architecture & Image Layers")
   - "searchQuery": Highly specific YouTube search query (e.g. "Docker container architecture explained")
   - "learningObjective": What the engineer will understand after completing this lesson.
3. Return ONLY a valid JSON object. Do not output markdown code blocks.`;

    const userPrompt = `Topic: "${cleanTopic}"
Role: "${targetRole}"
Generate the structured learning track JSON with "trackTitle", "description", and an array of "lessons".`;

    const fallbackLessons = [
      {
        lessonTitle: `${cleanTopic} Fundamentals & Setup`,
        searchQuery: `${cleanTopic} beginner tutorial setup`,
        learningObjective: `Master foundational syntax and core concepts of ${cleanTopic}.`,
      },
      {
        lessonTitle: `${cleanTopic} Core Concepts & Patterns`,
        searchQuery: `${cleanTopic} core concepts crash course`,
        learningObjective: `Understand architecture, common design patterns, and idiomatic practices.`,
      },
      {
        lessonTitle: `Hands-on Project with ${cleanTopic}`,
        searchQuery: `${cleanTopic} project tutorial step by step`,
        learningObjective: `Build and deploy a working application utilizing ${cleanTopic}.`,
      },
      {
        lessonTitle: `${cleanTopic} Production Best Practices & Testing`,
        searchQuery: `${cleanTopic} production best practices advanced`,
        learningObjective: `Learn performance optimization, security, and testing.`,
      },
    ];

    let syllabus;
    try {
      const res = await generateJSON({
        systemPrompt,
        userPrompt,
        temperature: 0.2,
        maxTokens: 1500,
        taskTier: TASK_TIERS.HIGH_REASONING,
        fallbackData: {
          trackTitle: `${cleanTopic} Mastery Track`,
          description: `Comprehensive developer learning curriculum for ${cleanTopic}.`,
          lessons: fallbackLessons,
        },
        feature: "edutube_track_generation",
      });

      syllabus = res.data;
    } catch {
      syllabus = {
        trackTitle: `${cleanTopic} Mastery Track`,
        description: `Comprehensive developer learning curriculum for ${cleanTopic}.`,
        lessons: fallbackLessons,
      };
    }

    const lessonsData = Array.isArray(syllabus.lessons) && syllabus.lessons.length > 0
      ? syllabus.lessons
      : fallbackLessons;

    // 2. Resolve every lesson into an actual, verified YouTube video
    const resolvedLessons = [];
    for (let i = 0; i < lessonsData.length; i++) {
      const lesson = lessonsData[i];
      const query = lesson.searchQuery || `${cleanTopic} ${lesson.lessonTitle} tutorial`;

      try {
        const searchRes = await edutubeSearchService.searchVideos({
          q: query,
          maxResults: 1,
        });

        if (searchRes.items && searchRes.items.length > 0) {
          const video = searchRes.items[0];
          resolvedLessons.push({
            order: i + 1,
            lessonTitle: lesson.lessonTitle,
            learningObjective: lesson.learningObjective,
            videoId: video.videoId,
            title: video.title,
            thumbnail: video.thumbnail?.high || video.thumbnail?.default || "",
            channelTitle: video.channelTitle,
            embedUrl: video.embedUrl,
            youtubeUrl: video.youtubeUrl,
            educationalScore: video.educationalScore || 90,
          });
        }
      } catch (err) {
        console.warn(`[edutube-track] Failed to resolve video for "${query}":`, err.message);
      }
    }

    return {
      trackTitle: syllabus.trackTitle || `${cleanTopic} Mastery Track`,
      description: syllabus.description || `Comprehensive learning track for ${cleanTopic}`,
      targetRole,
      topic: cleanTopic,
      lessons: resolvedLessons,
    };
  }

  /**
   * Convert an AI-generated learning track directly into an EduTube Playlist.
   */
  async saveTrackAsPlaylist(ownerId, { name, description, track }) {
    if (!name?.trim()) {
      throw new ApiError(400, "Playlist name is required.");
    }
    if (!track || !Array.isArray(track.lessons) || track.lessons.length === 0) {
      throw new ApiError(400, "A valid learning track with lessons is required.");
    }

    // 1. Create Playlist
    const playlist = await edutubePersistenceService.createPlaylist(ownerId, {
      name: name.trim(),
      description: description?.trim() || track.description || "",
    });

    // 2. Add all resolved lessons into playlist
    for (const lesson of track.lessons) {
      if (lesson.videoId) {
        await edutubePersistenceService.addVideoToPlaylist(ownerId, playlist._id.toString(), {
          videoId: lesson.videoId,
          title: lesson.title || lesson.lessonTitle,
          thumbnail: lesson.thumbnail,
          channelTitle: lesson.channelTitle,
        }).catch(() => {});
      }
    }

    // 3. Return full playlist details
    return edutubePersistenceService.getPlaylistById(ownerId, playlist._id.toString());
  }
}

export const edutubeRecommendationService = new EduTubeRecommendationService();
