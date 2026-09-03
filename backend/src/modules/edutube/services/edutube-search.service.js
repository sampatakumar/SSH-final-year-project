/**
 * EduTube Educational Search Service
 * Coordinates caching, deduplication, YouTube API requests, and educational relevance ranking.
 */

import { youtubeService } from "./youtube.service.js";
import { edutubeCacheService } from "./edutube-cache.service.js";
import { rankEducationalVideos } from "./edutube-ranking.service.js";
import { sanitizeQuery } from "../utils/youtube.utils.js";

class EduTubeSearchService {
  constructor(ytService = youtubeService, cacheService = edutubeCacheService) {
    this.youtube = ytService;
    this.cache = cacheService;
  }

  /**
   * Search educational videos with caching, deduplication, and educational relevance ranking.
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
    };

    const cacheKey = this.cache.generateSearchKey(normalizedParams);

    const { data, fromCache } = await this.cache.coalesce(
      cacheKey,
      async () => {
        // Fetch raw search results from YouTube API
        const searchResult = await this.youtube.searchList(normalizedParams);

        // Apply educational ranking and score calculation
        const rankedItems = rankEducationalVideos(searchResult.items, {
          q: sanitizedQ,
          level: normalizedParams.level,
          language: normalizedParams.language,
        });

        return {
          items: rankedItems,
          nextPageToken: searchResult.nextPageToken,
          prevPageToken: searchResult.prevPageToken,
          totalResults: searchResult.totalResults,
          query: sanitizedQ,
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
   * Get single video details with caching and embeddability checks.
   */
  async getVideoById(videoId) {
    const cleanId = (videoId || "").trim();
    const cacheKey = this.cache.generateVideoKey(cleanId);

    const { data, fromCache } = await this.cache.coalesce(
      cacheKey,
      async () => {
        return await this.youtube.videoList(cleanId);
      },
      3600 // 1 hour cache TTL for static video details
    );

    return {
      video: data,
      cached: fromCache,
    };
  }
}

export const edutubeSearchService = new EduTubeSearchService();
export { EduTubeSearchService };
