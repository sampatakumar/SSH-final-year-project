/**
 * Modular Hybrid Recommendation Pipeline
 *
 * Implements the 7-stage recommendation flow:
 * 1. Student Profile
 * 2. Learning Intent
 * 3. Candidate Retrieval
 * 4. Eligibility Quality Gate (120s minimum duration, Shorts exclusion, verified duration)
 * 5. Feature Extraction
 * 6. Ranking Model (ML with Deterministic Baseline Fallback)
 * 7. Personalized Feed Assembly (grounded explanations)
 */

import { edutubeLearningIntentService } from "../edutube-learning-intent.service.js";
import { edutubeSearchService } from "../edutube-search.service.js";
import { youtubeService } from "../youtube.service.js";
import { edutubeQualityGateService } from "../edutube-quality-gate.service.js";
import { recommendationRankingService } from "./ranking-service.js";
import { recommendationTrainingPipelineService } from "./training-pipeline.service.js";

// 15-minute in-memory cache for personalized recommendations
const RECOMMENDATION_CACHE = new Map();
const RECOMMENDATION_CACHE_TTL_MS = 15 * 60 * 1000;

export class RecommendationPipelineService {
  /**
   * Get cached recommendations if valid.
   */
  getCachedFeed(ownerId) {
    const key = `rec_pipeline:${ownerId.toString()}`;
    const cached = RECOMMENDATION_CACHE.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > RECOMMENDATION_CACHE_TTL_MS) {
      RECOMMENDATION_CACHE.delete(key);
      return null;
    }

    // Revalidate cached feed against quality gate policy
    const validated = edutubeQualityGateService.validateCachedFeed(cached.data);
    return { ...validated, cached: true };
  }

  /**
   * Store feed in cache.
   */
  setCachedFeed(ownerId, data) {
    const key = `rec_pipeline:${ownerId.toString()}`;
    RECOMMENDATION_CACHE.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache for a user.
   */
  invalidateCache(ownerId) {
    const key = `rec_pipeline:${ownerId.toString()}`;
    RECOMMENDATION_CACHE.delete(key);
  }

  /**
   * Fetch candidates for a specific search query, enrich with authoritative YouTube metadata
   * (duration, contentDetails, embeddability), and filter through the Quality Gate.
   *
   * @param {string} query - YouTube search query
   * @param {number} maxResults - Max raw search results
   * @returns {Promise<Array<object>>} Eligible, verified candidate videos
   */
  async retrieveAndFilterCandidates(query, maxResults = 8) {
    if (!query?.trim()) return [];

    try {
      // 1. Candidate Retrieval from Search
      const searchRes = await edutubeSearchService.searchVideos({
        q: query.trim(),
        maxResults,
      });

      const rawItems = searchRes.items || [];
      if (rawItems.length === 0) return [];

      // 2. Extract video IDs needing authoritative duration
      const idsNeedingDetails = rawItems
        .filter((item) => !item.duration?.seconds && !item.verifiedDurationSeconds)
        .map((item) => item.videoId);

      let detailsMap = new Map();
      if (idsNeedingDetails.length > 0) {
        try {
          const detailedList = await youtubeService.videosListBatch(idsNeedingDetails);
          for (const d of detailedList) {
            if (d.videoId) detailsMap.set(d.videoId, d);
          }
        } catch (batchErr) {
          console.warn(`[rec-pipeline] Batch details lookup warning: ${batchErr.message}`);
        }
      }

      // Merge authoritative details into candidate items
      const enrichedCandidates = rawItems.map((item) => {
        const detail = detailsMap.get(item.videoId);
        if (detail) {
          return {
            ...item,
            ...detail,
            duration: detail.duration || item.duration,
            embeddable: detail.embeddable !== undefined ? detail.embeddable : item.embeddable,
          };
        }
        return item;
      });

      // 3. Eligibility Quality Gate Filtering (>= 120s, no Shorts, valid metadata)
      const eligible = edutubeQualityGateService.filterCandidateBatch(enrichedCandidates);
      return eligible;
    } catch (err) {
      console.warn(`[rec-pipeline] Retrieve and filter error for query "${query}":`, err.message);
      return [];
    }
  }

  /**
   * Execute the full 7-stage recommendation pipeline.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated learner ID
   * @param {object} options - Options ({ forceRefresh: boolean })
   * @returns {Promise<object>} Fully assembled, ranked, quality-gate verified recommendation feed
   */
  async executePipeline(ownerId, { forceRefresh = false } = {}) {
    if (!forceRefresh) {
      const cached = this.getCachedFeed(ownerId);
      if (cached) return cached;
    }

    // Stage 1: Student Profile Extraction
    const userContext = await edutubeLearningIntentService.gatherUserLearningContext(ownerId);

    // Stage 2: Learning Intent Synthesis (Groq with Heuristic Fallback)
    const intent = await edutubeLearningIntentService.generateLearningIntent(userContext);

    // Stage 3 & 4: Candidate Retrieval & Quality Gate Filtering across sections
    const completedSet = new Set(userContext.completedVideoIds || []);
    const notInterestedSet = new Set(userContext.notInterestedVideos || []);
    const seenVideoIds = new Set();

    const fetchSection = async (queryList, maxItems = 6) => {
      const sectionPool = [];

      for (const item of queryList) {
        if (!item.query?.trim()) continue;
        if (sectionPool.length >= maxItems) break;

        const candidates = await this.retrieveAndFilterCandidates(item.query, 6);

        for (const cand of candidates) {
          if (completedSet.has(cand.videoId)) continue;
          if (notInterestedSet.has(cand.videoId)) continue;
          if (seenVideoIds.has(cand.videoId)) continue;

          seenVideoIds.add(cand.videoId);

          // Attach section metadata
          const whyRecommended = [item.reason];
          if (userContext.targetRole && !item.isRoadmap) {
            whyRecommended.push(`Aligned with ${userContext.targetRole} milestones`);
          }
          if (cand.qualityGatePassed) {
            whyRecommended.push("Passed educational quality gate (120s+ verified)");
          }

          sectionPool.push({
            ...cand,
            whyRecommended,
            topic: item.topic || item.query,
            queryReason: item.reason,
          });

          if (sectionPool.length >= maxItems) break;
        }
      }

      // Stage 5 & 6: Feature Extraction & Ranking Model
      const ranked = await recommendationRankingService.rankCandidates(
        sectionPool,
        userContext
      );

      return ranked.slice(0, maxItems);
    };

    // Build targeted query sets for 6 distinct educational sections
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

    const skillGapQueries = userContext.skillGaps.map((gap) => ({
      query: `${gap.skill} complete tutorial course`,
      topic: gap.skill,
      reason: `Addresses your demonstrated ${gap.skill} skill gap (${gap.priority} priority)`,
      isGap: true,
    }));

    const careerQueries = intent.careerTrack.queries.map((q) => ({
      query: q,
      topic: intent.careerTrack.role,
      reason: `Essential milestone for ${intent.careerTrack.role} path`,
      isRoadmap: true,
    }));

    const historyQueries = intent.historyNextSteps.map((h) => ({
      query: h.searchQuery,
      topic: h.topic,
      reason: h.reason,
    }));

    const projectQueries = intent.projectIdeas.map((p) => ({
      query: p.searchQuery,
      topic: p.title,
      reason: p.reason,
      isProject: true,
    }));

    const dominantTech =
      userContext.githubLanguages[0] ||
      userContext.topSkills[0]?.skill ||
      "JavaScript";
    const trendingQueries = [
      {
        query: `${dominantTech} architecture best practices 2026 course`,
        topic: dominantTech,
        reason: `High educational signal in ${dominantTech} engineering`,
      },
    ];

    // Execute parallel section ranking
    const [
      personalized,
      skillGaps,
      careerPath,
      basedOnHistory,
      projectLearning,
      trending,
    ] = await Promise.all([
      fetchSection(forYouQueries, 6),
      fetchSection(skillGapQueries, 6),
      fetchSection(careerQueries, 6),
      fetchSection(historyQueries, 6),
      fetchSection(projectQueries, 6),
      fetchSection(trendingQueries, 6),
    ]);

    // Stage 7: Assemble Feed with Model Metadata
    const feed = {
      personalized,
      skillGaps,
      careerPath,
      basedOnHistory,
      projectLearning,
      trending,
      learningContext: {
        targetRole: userContext.targetRole,
        topSkills: userContext.topSkills.slice(0, 5),
        skillGaps: userContext.skillGaps.slice(0, 5),
        completedCount: userContext.completedVideoIds.length,
        historyCount: userContext.recentHistory.length,
      },
      qualityGatePolicy: {
        minDurationSeconds: edutubeQualityGateService.getMinDurationSeconds(),
        shortsExcluded: true,
        verifiedDurationOnly: true,
      },
      rankingMetadata: {
        activeModelVersion: recommendationRankingService.activeModelVersion,
        isMlDeployed: recommendationRankingService.isMlDeployed,
        generatedAt: new Date().toISOString(),
      },
      cached: false,
    };

    // Cache feed
    this.setCachedFeed(ownerId, feed);

    // Stage 8: Asynchronously log exposure impressions
    const impressionBatch = [];
    const logSection = (items, sectionName) => {
      items.forEach((item, pos) => {
        impressionBatch.push({
          owner: ownerId,
          videoId: item.videoId,
          position: pos,
          section: sectionName,
          queryTopic: item.topic || "",
          featuresSnapshot: item.featuresSnapshot || {},
          modelVersion: item.rankedByModelVersion || "baseline_v1",
          action: "impression",
        });
      });
    };

    logSection(personalized, "forYou");
    logSection(skillGaps, "skillGaps");
    logSection(careerPath, "careerPath");
    logSection(basedOnHistory, "history");
    logSection(projectLearning, "projects");

    recommendationTrainingPipelineService
      .logImpressionBatch(impressionBatch)
      .catch(() => {});

    return feed;
  }
}

export const recommendationPipelineService = new RecommendationPipelineService();
