/**
 * EduTube YouTube Utility Functions
 * Sanitization, normalization, duration parsing, and URL helpers for YouTube Data API v3.
 */

/**
 * Maps user-friendly language identifiers to ISO 639-1 relevance language codes.
 */
export const SUPPORTED_LANGUAGES = {
  en: { code: "en", name: "English", region: "US" },
  kn: { code: "kn", name: "Kannada", region: "IN" },
  hi: { code: "hi", name: "Hindi", region: "IN" },
  ml: { code: "ml", name: "Malayalam", region: "IN" },
  ta: { code: "ta", name: "Tamil", region: "IN" },
  te: { code: "te", name: "Telugu", region: "IN" },
};

export const mapLanguage = (lang) => {
  if (!lang || typeof lang !== "string") return undefined;
  const normalized = lang.trim().toLowerCase();
  if (SUPPORTED_LANGUAGES[normalized]) {
    return SUPPORTED_LANGUAGES[normalized].code;
  }
  // If a 2-letter ISO code is provided, accept it if alphanumeric
  if (/^[a-z]{2}$/i.test(normalized)) {
    return normalized;
  }
  return undefined;
};

/**
 * Sanitize search query input.
 */
export const sanitizeQuery = (rawQuery) => {
  if (!rawQuery || typeof rawQuery !== "string") return "";
  return rawQuery
    .replace(/[\x00-\x1F\x7F]/g, "") // remove control characters
    .trim()
    .slice(0, 200);
};

/**
 * Build canonical YouTube embed URL.
 */
export const getEmbedUrl = (videoId) => {
  if (!videoId || typeof videoId !== "string") return "";
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId.trim())}`;
};

/**
 * Build canonical YouTube watch URL.
 */
export const getYoutubeUrl = (videoId) => {
  if (!videoId || typeof videoId !== "string") return "";
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId.trim())}`;
};

/**
 * Parse ISO 8601 duration (e.g., PT1H2M30S, PT15M33S, PT45S) into seconds and human-readable string.
 */
export const parseDuration = (isoDuration) => {
  if (!isoDuration || typeof isoDuration !== "string") {
    return { seconds: 0, formatted: "0:00" };
  }

  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i;
  const match = isoDuration.match(regex);

  if (!match) {
    return { seconds: 0, formatted: "0:00" };
  }

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  let formatted = "";
  if (hours > 0) {
    formatted = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  return {
    seconds: totalSeconds,
    formatted,
  };
};

/**
 * Normalize a search item returned by YouTube Data API v3 search.list.
 */
export const normalizeSearchItem = (rawItem) => {
  if (!rawItem) return null;

  const videoId =
    typeof rawItem.id === "string"
      ? rawItem.id
      : rawItem.id?.videoId || rawItem.id?.playlistId || "";

  if (!videoId) return null;

  const snippet = rawItem.snippet || {};
  const thumbnails = snippet.thumbnails || {};

  return {
    videoId,
    title: snippet.title || "",
    description: snippet.description || "",
    thumbnail: {
      default: thumbnails.default?.url || "",
      medium: thumbnails.medium?.url || "",
      high: thumbnails.high?.url || "",
      standard: thumbnails.standard?.url || "",
      maxres: thumbnails.maxres?.url || "",
    },
    channelId: snippet.channelId || "",
    channelTitle: snippet.channelTitle || "",
    publishedAt: snippet.publishedAt || "",
    embedUrl: getEmbedUrl(videoId),
    youtubeUrl: getYoutubeUrl(videoId),
    liveBroadcastContent: snippet.liveBroadcastContent || "none",
  };
};

/**
 * Normalize detailed video metadata from YouTube Data API v3 videos.list.
 */
export const normalizeVideoDetail = (rawVideo) => {
  if (!rawVideo) return null;

  const videoId = typeof rawVideo.id === "string" ? rawVideo.id : rawVideo.id?.videoId || "";
  if (!videoId) return null;

  const snippet = rawVideo.snippet || {};
  const status = rawVideo.status || {};
  const contentDetails = rawVideo.contentDetails || {};
  const statistics = rawVideo.statistics || {};
  const thumbnails = snippet.thumbnails || {};

  const durationParsed = parseDuration(contentDetails.duration || "");

  const embeddable =
    status.embeddable !== undefined
      ? Boolean(status.embeddable)
      : status.privacyStatus === "public";

  return {
    videoId,
    title: snippet.title || "",
    description: snippet.description || "",
    channel: snippet.channelTitle || "",
    channelId: snippet.channelId || "",
    thumbnails: {
      default: thumbnails.default?.url || "",
      medium: thumbnails.medium?.url || "",
      high: thumbnails.high?.url || "",
      standard: thumbnails.standard?.url || "",
      maxres: thumbnails.maxres?.url || "",
    },
    publishedAt: snippet.publishedAt || "",
    duration: {
      raw: contentDetails.duration || "",
      seconds: durationParsed.seconds,
      formatted: durationParsed.formatted,
    },
    tags: Array.isArray(snippet.tags) ? snippet.tags : [],
    categoryId: snippet.categoryId || "",
    statistics: {
      viewCount: parseInt(statistics.viewCount || "0", 10),
      likeCount: parseInt(statistics.likeCount || "0", 10),
      commentCount: parseInt(statistics.commentCount || "0", 10),
    },
    embeddable,
    liveStatus: snippet.liveBroadcastContent || "none",
    youtubeUrl: getYoutubeUrl(videoId),
    embedUrl: embeddable ? getEmbedUrl(videoId) : null,
  };
};
