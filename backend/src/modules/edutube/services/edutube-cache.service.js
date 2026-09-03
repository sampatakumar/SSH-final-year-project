/**
 * EduTube In-Memory Caching & Request Deduplication Service
 * Provides TTL-based caching and in-flight promise coalescing to protect YouTube Data API v3 quota.
 */

class EduTubeCacheService {
  constructor(defaultTTLSeconds = 600) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.cache = new Map();
    this.inFlightRequests = new Map();
  }

  /**
   * Build a deterministic cache key for search queries.
   */
  generateSearchKey(params = {}) {
    const q = (params.q || "").trim().toLowerCase();
    const language = (params.language || "all").trim().toLowerCase();
    const regionCode = (params.regionCode || "all").trim().toLowerCase();
    const level = (params.level || "all").trim().toLowerCase();
    const duration = (params.duration || "all").trim().toLowerCase();
    const sort = (params.sort || "relevance").trim().toLowerCase();
    const pageToken = (params.pageToken || "").trim();
    const maxResults = params.maxResults || 10;

    return `edutube:search:${q}:${language}:${regionCode}:${level}:${duration}:${sort}:${pageToken}:${maxResults}`;
  }

  /**
   * Build a deterministic cache key for video metadata.
   */
  generateVideoKey(videoId) {
    const id = (videoId || "").trim();
    return `edutube:video:${id}`;
  }

  /**
   * Get value from cache if present and unexpired.
   */
  get(key) {
    if (!key) return null;
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache with optional custom TTL.
   */
  set(key, value, ttlSeconds) {
    if (!key || value === undefined) return;

    const ttlMs = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      cachedAt: Date.now(),
    });

    // Prune expired entries periodically if map grows large
    if (this.cache.size > 2000) {
      this.prune();
    }
  }

  /**
   * Check if cache has a valid unexpired key.
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete entry from cache.
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear entire cache and pending in-flight promises.
   */
  clear() {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Remove expired keys to keep memory bounded.
   */
  prune() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Coalesce concurrent identical fetch requests into a single promise.
   * If cached, returns immediately without invoking fetcherFn.
   * If request is already in-flight, returns the existing Promise.
   * Otherwise executes fetcherFn, caches the result, and returns.
   */
  async coalesce(key, fetcherFn, ttlSeconds) {
    // 1. Check cache
    const cached = this.get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }

    // 2. Check if identical request is currently in-flight
    if (this.inFlightRequests.has(key)) {
      const inFlightPromise = this.inFlightRequests.get(key);
      const result = await inFlightPromise;
      return { data: result, fromCache: false, deduplicated: true };
    }

    // 3. Execute fetcherFn and store in-flight promise
    const fetchPromise = (async () => {
      try {
        const freshData = await fetcherFn();
        if (freshData !== undefined && freshData !== null) {
          this.set(key, freshData, ttlSeconds);
        }
        return freshData;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    const result = await fetchPromise;
    return { data: result, fromCache: false, deduplicated: false };
  }

  /**
   * Return telemetry and size metrics for cache diagnosis.
   */
  getStats() {
    return {
      size: this.cache.size,
      inFlightCount: this.inFlightRequests.size,
    };
  }
}

export const edutubeCacheService = new EduTubeCacheService(600);
export { EduTubeCacheService };
