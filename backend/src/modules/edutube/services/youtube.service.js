/**
 * EduTube YouTube Service
 * Centralized client for YouTube Data API v3.
 * Enforces strict key isolation, timeouts, quota error translation, and parameter whitelisting.
 */

import { env } from "../../../config/env.js";
import { EduTubeError } from "../../../core/errors/ApiError.js";
import {
  sanitizeQuery,
  mapLanguage,
  normalizeSearchItem,
  normalizeVideoDetail,
  SUPPORTED_LANGUAGES,
} from "../utils/youtube.utils.js";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const DEFAULT_TIMEOUT_MS = 10000;

export class YouTubeService {
  constructor(apiKey = null) {
    this.customApiKey = apiKey;
  }

  /**
   * Retrieve active API key safely without exposing it.
   */
  #getApiKey() {
    const key = this.customApiKey !== null ? this.customApiKey : (env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY);
    if (!key || typeof key !== "string" || !key.trim()) {
      throw new EduTubeError(
        500,
        "EduTube YouTube API key is not configured in backend environment."
      );
    }
    return key.trim();
  }

  /**
   * Safe fetch with AbortSignal timeout and sanitized error translation.
   */
  async #request(endpoint, searchParams) {
    const apiKey = this.#getApiKey();
    const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);

    for (const [key, val] of Object.entries(searchParams)) {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.set(key, String(val));
      }
    }

    url.searchParams.set("key", apiKey);

    let response;
    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (err) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        throw new EduTubeError(504, "EduTube video search request timed out.");
      }
      throw new EduTubeError(
        503,
        `EduTube service is temporarily unreachable: ${err.message}`
      );
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      this.#handleApiError(response.status, payload);
    }

    return payload;
  }

  /**
   * Translate YouTube error response into domain-safe EduTubeError without leaking keys or raw stack traces.
   */
  #handleApiError(statusCode, payload) {
    const errorDetails = payload?.error?.errors?.[0] || {};
    const reason = errorDetails.reason || payload?.error?.status || "";
    const rawMessage = payload?.error?.message || "YouTube API request failed.";

    // Quota and Rate Limit Exhaustion
    if (
      statusCode === 429 ||
      reason === "quotaExceeded" ||
      reason === "rateLimitExceeded" ||
      reason === "dailyLimitExceeded" ||
      reason === "userRateLimitExceeded" ||
      rawMessage.toLowerCase().includes("quota")
    ) {
      throw new EduTubeError(
        429,
        "EduTube search is temporarily unavailable due to capacity limits. Please try again shortly."
      );
    }

    // Invalid Request Parameters
    if (statusCode === 400) {
      throw new EduTubeError(
        400,
        `Invalid video search request parameters: ${errorDetails.message || rawMessage}`
      );
    }

    // Authentication / Key Misconfiguration
    if (statusCode === 401 || reason === "keyInvalid" || reason === "unauthorized") {
      throw new EduTubeError(
        500,
        "EduTube configuration authentication error. Please contact administrator."
      );
    }

    // Forbidden / Access Restriction
    if (statusCode === 403) {
      throw new EduTubeError(
        403,
        "Access to YouTube educational resource is forbidden or restricted."
      );
    }

    // Resource Not Found
    if (statusCode === 404) {
      throw new EduTubeError(404, "Requested educational video or resource was not found.");
    }

    // Upstream Google Server Error
    if (statusCode >= 500) {
      throw new EduTubeError(
        502,
        "Upstream video discovery service is temporarily experiencing issues. Please try again later."
      );
    }

    // Generic Fallback
    throw new EduTubeError(
      statusCode,
      "An unexpected error occurred while communicating with video discovery service."
    );
  }

  /**
   * Search YouTube videos with whitelisted educational parameters.
   */
  async searchList(params = {}) {
    const rawQuery = params.q || "";
    const sanitizedQ = sanitizeQuery(rawQuery);

    if (!sanitizedQ) {
      throw new EduTubeError(400, "Search query 'q' parameter cannot be empty.");
    }

    const maxResults = Number.isInteger(params.maxResults)
      ? Math.max(1, Math.min(50, params.maxResults))
      : 10;

    const queryParams = {
      part: "snippet",
      type: "video",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      safeSearch: "moderate",
      q: sanitizedQ,
      maxResults,
    };

    // Pagination
    if (params.pageToken && typeof params.pageToken === "string" && params.pageToken.trim()) {
      queryParams.pageToken = params.pageToken.trim();
    }

    // Language Filtering
    if (params.language) {
      const langCode = mapLanguage(params.language);
      if (langCode) {
        queryParams.relevanceLanguage = langCode;
        if (SUPPORTED_LANGUAGES[params.language.toLowerCase()]?.region) {
          queryParams.regionCode = SUPPORTED_LANGUAGES[params.language.toLowerCase()].region;
        }
      }
    }

    // Explicit Region Code Override
    if (params.regionCode && typeof params.regionCode === "string" && /^[a-z]{2}$/i.test(params.regionCode)) {
      queryParams.regionCode = params.regionCode.toUpperCase();
    }

    // Duration Filter
    if (params.duration) {
      const dur = params.duration.toLowerCase();
      if (["short", "medium", "long"].includes(dur)) {
        queryParams.videoDuration = dur;
      }
    }

    // Sort Ordering
    if (params.sort) {
      const s = params.sort.toLowerCase();
      if (["relevance", "date", "rating", "viewcount", "title"].includes(s)) {
        queryParams.order = s === "viewcount" ? "viewCount" : s;
      }
    }

    const rawData = await this.#request("search", queryParams);

    const items = (rawData.items || [])
      .map(normalizeSearchItem)
      .filter(Boolean);

    return {
      items,
      nextPageToken: rawData.nextPageToken || null,
      prevPageToken: rawData.prevPageToken || null,
      totalResults: rawData.pageInfo?.totalResults || items.length,
      resultsPerPage: rawData.pageInfo?.resultsPerPage || maxResults,
    };
  }

  /**
   * Retrieve full video details from YouTube videos.list.
   */
  async videoList(videoId) {
    if (!videoId || typeof videoId !== "string" || !videoId.trim()) {
      throw new EduTubeError(400, "Valid 'videoId' parameter is required.");
    }

    const cleanId = videoId.trim();

    const rawData = await this.#request("videos", {
      part: "snippet,contentDetails,statistics,status",
      id: cleanId,
    });

    if (!rawData.items || rawData.items.length === 0) {
      throw new EduTubeError(404, `Educational video with ID '${cleanId}' was not found.`);
    }

    const normalized = normalizeVideoDetail(rawData.items[0]);
    if (!normalized) {
      throw new EduTubeError(502, "Failed to parse video metadata from upstream provider.");
    }

    return normalized;
  }
}

export const youtubeService = new YouTubeService();
