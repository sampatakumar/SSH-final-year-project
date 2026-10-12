/**
 * EduTube Educational Search Service
 * Coordinates caching, deduplication, YouTube API requests,
 * strict educational classification, and relevance ranking.
 */

import { youtubeService } from "./youtube.service.js";
import { edutubeCacheService } from "./edutube-cache.service.js";
import { rankEducationalVideos } from "./edutube-ranking.service.js";
import { educationalClassifierService, CLASSIFIER_VERSION } from "./educationalClassifier.service.js";
import { sanitizeQuery } from "../utils/youtube.utils.js";

class EduTubeSearchService {
  constructor(
    ytService = youtubeService,
    cacheService = edutubeCacheService,
    classifierService = educationalClassifierService
  ) {
    this.youtube = ytService;
    this.cache = cacheService;
    this.classifier = classifierService;
  }

  /**
   * Search educational videos with caching, deduplication, batch enrichment,
   * strict educational filtering, and educational relevance ranking.
   */
  async searchVideos(params = {}) {
    const sanitizedQ = sanitizeQuery(params.q || "");

    const normalizedParams = {
      q: sanitizedQ,
      language: params.language,
      regionCode: params.regionCode,
      pageToken: params.pageToken,
      maxResults: params.maxResults ? parseInt(params.maxResults, 10) : 10,
      level: params.level,
      duration: params.duration,
      sort: params.sort,
      classifierVersion: CLASSIFIER_VERSION,
    };

    const cacheKey = this.cache.generateSearchKey(normalizedParams);

    const { data, fromCache } = await this.cache.coalesce(
      cacheKey,
      async () => {
        // 1. Fetch raw search results from YouTube API
        const searchResult = await this.youtube.searchList(normalizedParams);
        const rawItems = searchResult.items || [];

        // 2. Apply deterministic educational classification filter
        const classificationBatch = this.classifier.filterAndClassifyBatch(rawItems, {
          minDurationSeconds: 120,
        });

        // 3. Apply educational ranking and score calculation to allowed items
        const rankedItems = rankEducationalVideos(classificationBatch.allowed, {
          q: sanitizedQ,
          level: normalizedParams.level,
          language: normalizedParams.language,
        });

        return {
          items: rankedItems,
          nextPageToken: searchResult.nextPageToken,
          prevPageToken: searchResult.prevPageToken,
          totalResults: searchResult.totalResults || rankedItems.length,
          query: sanitizedQ,
          filterSummary: {
            totalScanned: classificationBatch.totalScanned,
            allowedCount: classificationBatch.allowedCount,
            blockedCount: classificationBatch.rejectedCount,
            classifierVersion: CLASSIFIER_VERSION,
          },
        };
      },
      600 // 10 minutes cache TTL
    );

    return {
      ...data,
      cached: fromCache,
    };
  }

  /**
   * Get single video details with caching, embeddability checks, and strict educational classification.
   */
  async getVideoById(videoId) {
    const cleanId = (videoId || "").trim();
    const cacheKey = this.cache.generateVideoKey(cleanId);

    const { data, fromCache } = await this.cache.coalesce(
      cacheKey,
      async () => {
        const video = await this.youtube.videoList(cleanId);
        const classification = this.classifier.classifyVideo(video, {
          minDurationSeconds: 120,
        });

        if (classification.decision !== "allow") {
          return {
            allowed: false,
            decision: classification.decision,
            reasonCodes: classification.reasonCodes,
            matchedSignals: classification.matchedSignals,
            educationalRelevance: classification.educationalRelevance,
            classifierVersion: classification.classifierVersion,
            message: "Video does not meet educational quality standards for EduTube discovery or playback.",
            video,
          };
        }

        return {
          allowed: true,
          decision: "allow",
          educationalRelevance: classification.educationalRelevance,
          classifierVersion: classification.classifierVersion,
          video: {
            ...video,
            classification,
            educationalScore: classification.educationalRelevance,
            educationalSignals: classification.matchedSignals,
          },
        };
      },
      3600 // 1 hour cache TTL for static video details
    );

    return {
      ...data,
      cached: fromCache,
    };
  }
}

export const edutubeSearchService = new EduTubeSearchService();
export { EduTubeSearchService };
