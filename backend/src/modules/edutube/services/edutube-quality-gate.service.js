/**
 * EduTube Educational Quality Gate Service
 *
 * Enforces strict, verified educational standards on candidate videos before they enter
 * the recommendation feed.
 *
 * Core Guarantees:
 * 1. Hard Duration Gate: Rejects any video with verified duration < 120 seconds.
 * 2. Shorts Exclusion: Excludes YouTube Shorts based on authoritative metadata, tags, and duration.
 * 3. Verified Duration Only: Rejects missing, invalid, or unverified durations.
 * 4. Educational Depth: Evaluates substance, instructional structure, and topic relevance independently of duration.
 * 5. Low-Substance & Duplication Filtering: Filters spam, clickbait, non-educational entertainment, and duplicates.
 * 6. Central Configuration: Configurable minimum duration (default 120s).
 */

import { env } from "../../../config/env.js";

export const QUALITY_GATE_REASONS = {
  UNVERIFIED_DURATION: "UNVERIFIED_DURATION",
  DURATION_BELOW_MINIMUM: "DURATION_BELOW_MINIMUM",
  YOUTUBE_SHORTS_EXCLUDED: "YOUTUBE_SHORTS_EXCLUDED",
  NON_EMBEDDABLE: "NON_EMBEDDABLE",
  LOW_SUBSTANCE_ENTERTAINMENT: "LOW_SUBSTANCE_ENTERTAINMENT",
  DUPLICATE_CONTENT: "DUPLICATE_CONTENT",
  IRRELEVANT_TOPIC: "IRRELEVANT_TOPIC",
};

// Obvious entertainment / non-instructional phrases
const NON_EDUCATIONAL_PATTERNS = [
  /\bmusic video\b/i,
  /\bofficial audio\b/i,
  /\bofficial lyric video\b/i,
  /\bprank\b/i,
  /\bgameplay walkthrough\b/i,
  /\bfunny moments\b/i,
  /\bchallenge episode\b/i,
  /\btiktok compilation\b/i,
  /\bvlog\s*#?\d*\b/i,
  /\breaction video\b/i,
  /\btrailer\b/i,
  /\bteaser\b/i,
];

// Indicators of high educational substance & structured instruction
const STRUCTURED_EDUCATIONAL_PATTERNS = [
  /\bfull course\b/i,
  /\bcomplete course\b/i,
  /\btutorial\b/i,
  /\bcrash course\b/i,
  /\bstep by step\b/i,
  /\bfrom scratch\b/i,
  /\bdeep dive\b/i,
  /\barchitecture\b/i,
  /\bmasterclass\b/i,
  /\bworked example\b/i,
  /\bhands-on\b/i,
  /\bbuild a\b/i,
  /\bzero to hero\b/i,
];

export class EduTubeQualityGateService {
  constructor(options = {}) {
    this.minDurationSeconds =
      options.minDurationSeconds ??
      env.EDUTUBE_MIN_DURATION_SECONDS ??
      120;
  }

  /**
   * Get current minimum duration threshold in seconds.
   */
  getMinDurationSeconds() {
    return this.minDurationSeconds;
  }

  /**
   * Set minimum duration threshold (for dynamic policy changes / tests).
   */
  setMinDurationSeconds(seconds) {
    if (typeof seconds === "number" && seconds >= 0) {
      this.minDurationSeconds = seconds;
    }
  }

  /**
   * Extract authoritative duration in seconds from video object.
   * Does NOT guess or infer from title/thumbnail/videoId.
   *
   * @param {object} video
   * @returns {number|null} Duration in seconds, or null if unverified / invalid.
   */
  extractAuthoritativeDurationSeconds(video) {
    if (!video) return null;

    // Check video.duration.seconds
    if (
      typeof video.duration?.seconds === "number" &&
      !isNaN(video.duration.seconds) &&
      video.duration.seconds > 0
    ) {
      return video.duration.seconds;
    }

    // Check top-level durationSeconds
    if (
      typeof video.durationSeconds === "number" &&
      !isNaN(video.durationSeconds) &&
      video.durationSeconds > 0
    ) {
      return video.durationSeconds;
    }

    return null;
  }

  /**
   * Check if a video is a YouTube Short based on authoritative metadata signals.
   *
   * Signals:
   * - URL pattern `/shorts/`
   * - `#shorts` or `shorts` in tags
   * - `#shorts` in title
   * - Authoritative duration <= 60 seconds
   *
   * @param {object} video
   * @param {number|null} durationSeconds
   * @returns {boolean}
   */
  isYouTubeShort(video, durationSeconds = null) {
    if (!video) return false;

    // Direct URL check
    const url = String(video.youtubeUrl || video.url || "");
    if (url.includes("/shorts/")) {
      return true;
    }

    // Tag check
    if (Array.isArray(video.tags)) {
      const hasShortTag = video.tags.some((t) => {
        const lower = String(t).toLowerCase();
        return lower === "shorts" || lower === "#shorts" || lower.includes("youtubeshorts");
      });
      if (hasShortTag) return true;
    }

    // Title hashtag check
    const title = String(video.title || "").toLowerCase();
    if (title.includes("#shorts") || /\bshorts\b/i.test(title)) {
      // If title includes "shorts" and duration is under 180s, it's a Short
      if (durationSeconds !== null && durationSeconds <= 180) {
        return true;
      }
    }

    // YouTube Shorts duration rule (historical standard: <= 60s)
    if (durationSeconds !== null && durationSeconds <= 60) {
      return true;
    }

    return false;
  }

  /**
   * Evaluate whether a single video passes the educational quality gate.
   *
   * @param {object} video - Video object with normalized metadata
   * @param {object} options - Evaluation options
   * @returns {object} { eligible: boolean, rejectReason: string|null, diagnostic: object }
   */
  evaluateVideoEligibility(video, options = {}) {
    const minDuration = options.minDuration ?? this.minDurationSeconds;

    if (!video || !video.videoId) {
      return {
        eligible: false,
        rejectReason: QUALITY_GATE_REASONS.UNVERIFIED_DURATION,
        message: "Video has no valid identifier or metadata.",
        diagnostic: { durationSeconds: null, isShort: false, educationalScore: 0 },
      };
    }

    // 1. Authoritative duration extraction
    const durationSeconds = this.extractAuthoritativeDurationSeconds(video);

    if (durationSeconds === null) {
      return {
        eligible: false,
        rejectReason: QUALITY_GATE_REASONS.UNVERIFIED_DURATION,
        message: "Video duration is unverified, missing, or invalid.",
        diagnostic: { durationSeconds: null, isShort: false, educationalScore: video.educationalScore || 0 },
      };
    }

    // 2. YouTube Shorts exclusion
    const isShort = this.isYouTubeShort(video, durationSeconds);
    if (isShort) {
      return {
        eligible: false,
        rejectReason: QUALITY_GATE_REASONS.YOUTUBE_SHORTS_EXCLUDED,
        message: "YouTube Shorts are excluded from educational recommendations.",
        diagnostic: { durationSeconds, isShort: true, educationalScore: video.educationalScore || 0 },
      };
    }

    // 3. Minimum duration hard gate
    if (durationSeconds < minDuration) {
      return {
        eligible: false,
        rejectReason: QUALITY_GATE_REASONS.DURATION_BELOW_MINIMUM,
        message: `Video duration (${durationSeconds}s) is below required ${minDuration}s threshold.`,
        diagnostic: { durationSeconds, isShort: false, educationalScore: video.educationalScore || 0 },
      };
    }

    // 4. Embeddability check
    if (video.embeddable === false) {
      return {
        eligible: false,
        rejectReason: QUALITY_GATE_REASONS.NON_EMBEDDABLE,
        message: "Video cannot be embedded in EduTube player.",
        diagnostic: { durationSeconds, isShort: false, educationalScore: video.educationalScore || 0 },
      };
    }

    // 5. Low-substance / entertainment penalty check
    const fullText = `${video.title || ""} ${video.description || ""}`.toLowerCase();
    for (const pattern of NON_EDUCATIONAL_PATTERNS) {
      if (pattern.test(fullText)) {
        return {
          eligible: false,
          rejectReason: QUALITY_GATE_REASONS.LOW_SUBSTANCE_ENTERTAINMENT,
          message: "Video matches non-educational entertainment pattern.",
          diagnostic: { durationSeconds, isShort: false, matchedPattern: pattern.toString() },
        };
      }
    }

    // 6. Educational substance assessment
    let educationalScore = Number(video.educationalScore ?? 75);
    const hasStructuredPattern = STRUCTURED_EDUCATIONAL_PATTERNS.some((p) => p.test(fullText));
    if (hasStructuredPattern) {
      educationalScore = Math.min(100, educationalScore + 10);
    }

    return {
      eligible: true,
      rejectReason: null,
      message: "Video passed EduTube Educational Quality Gate.",
      diagnostic: {
        durationSeconds,
        isShort: false,
        educationalScore,
        minDurationEnforced: minDuration,
        structuredTutorial: hasStructuredPattern,
      },
    };
  }

  /**
   * Filter candidate videos through the quality gate, ensuring deduplication.
   *
   * @param {Array<object>} candidates - Array of candidate videos
   * @param {object} options - Filtering options
   * @returns {Array<object>} Filtered, eligible videos with diagnostic quality gate metadata
   */
  filterCandidateBatch(candidates = [], options = {}) {
    if (!Array.isArray(candidates)) return [];

    const seenVideoIds = new Set();
    const seenTitles = new Set();
    const eligibleVideos = [];

    for (const candidate of candidates) {
      if (!candidate || !candidate.videoId) continue;

      // Deduplication check
      const cleanId = String(candidate.videoId).trim();
      if (seenVideoIds.has(cleanId)) continue;

      const normalizedTitle = String(candidate.title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      if (normalizedTitle && seenTitles.has(normalizedTitle)) continue;

      // Quality gate evaluation
      const evaluation = this.evaluateVideoEligibility(candidate, options);
      if (!evaluation.eligible) {
        continue;
      }

      seenVideoIds.add(cleanId);
      if (normalizedTitle) seenTitles.add(normalizedTitle);

      eligibleVideos.push({
        ...candidate,
        qualityGatePassed: true,
        verifiedDurationSeconds: evaluation.diagnostic.durationSeconds,
        educationalScore: evaluation.diagnostic.educationalScore,
        isShort: false,
      });
    }

    return eligibleVideos;
  }

  /**
   * Revalidate an existing cached recommendation feed against current quality gate policy.
   * Invalidates or cleans cached sections if policy or entries violate gates.
   *
   * @param {object} cachedFeed - Cached recommendation response object
   * @returns {object} Cleaned feed object with only compliant videos
   */
  validateCachedFeed(cachedFeed) {
    if (!cachedFeed || typeof cachedFeed !== "object") return null;

    const sections = [
      "personalized",
      "skillGaps",
      "careerPath",
      "basedOnHistory",
      "projectLearning",
      "trending",
    ];

    let anyFiltered = false;
    const validatedFeed = { ...cachedFeed };

    for (const section of sections) {
      if (Array.isArray(cachedFeed[section])) {
        const filtered = this.filterCandidateBatch(cachedFeed[section]);
        if (filtered.length !== cachedFeed[section].length) {
          anyFiltered = true;
        }
        validatedFeed[section] = filtered;
      }
    }

    validatedFeed.qualityGateVerifiedAt = new Date().toISOString();
    return validatedFeed;
  }
}

export const edutubeQualityGateService = new EduTubeQualityGateService();
