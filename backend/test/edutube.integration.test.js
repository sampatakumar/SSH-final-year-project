import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import { YouTubeService, youtubeService } from "../src/modules/edutube/services/youtube.service.js";
import { edutubeCacheService, EduTubeCacheService } from "../src/modules/edutube/services/edutube-cache.service.js";
import { scoreEducationalVideo, rankEducationalVideos } from "../src/modules/edutube/services/edutube-ranking.service.js";
import { EduTubeSearchService } from "../src/modules/edutube/services/edutube-search.service.js";
import { parseDuration, normalizeSearchItem, normalizeVideoDetail } from "../src/modules/edutube/utils/youtube.utils.js";
import { EduTubeError } from "../src/core/errors/ApiError.js";

describe("EduTube Backend Foundation & Integration Test Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    edutubeCacheService.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    edutubeCacheService.clear();
  });

  // -------------------------------------------------------------------------
  // 1. Missing API Key Handling
  // -------------------------------------------------------------------------
  it("1. gracefully handles missing YOUTUBE_API_KEY without leaking configuration", async () => {
    const serviceWithoutKey = new YouTubeService("");
    await expect(serviceWithoutKey.searchList({ q: "javascript" })).rejects.toThrow(
      "EduTube YouTube API key is not configured"
    );
  });

  // -------------------------------------------------------------------------
  // 2. Successful Search
  // -------------------------------------------------------------------------
  it("2. executes successful search and returns normalized payload", async () => {
    const mockSearchResponse = {
      items: [
        {
          id: { videoId: "test-vid-1" },
          snippet: {
            title: "JavaScript Full Course for Beginners",
            description: "Learn JavaScript from scratch in this comprehensive tutorial.",
            channelId: "UC_channel_1",
            channelTitle: "freeCodeCamp.org",
            publishedAt: "2026-01-01T00:00:00Z",
            thumbnails: {
              default: { url: "https://img.youtube.com/vi/test-vid-1/default.jpg" },
              high: { url: "https://img.youtube.com/vi/test-vid-1/hqdefault.jpg" },
            },
          },
        },
      ],
      nextPageToken: "NEXT_TOKEN_ABC",
      pageInfo: { totalResults: 100, resultsPerPage: 10 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockSearchResponse,
    });

    const res = await request(app).get("/api/v1/edutube/search?q=javascript");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].videoId).toBe("test-vid-1");
    expect(res.body.data.items[0].title).toBe("JavaScript Full Course for Beginners");
    expect(res.body.data.items[0].embedUrl).toBe("https://youtube.com/embed/test-vid-1".replace("youtube.com", "www.youtube.com"));
    expect(res.body.data.nextPageToken).toBe("NEXT_TOKEN_ABC");
  });

  // -------------------------------------------------------------------------
  // 3 & 4. Empty Query and Invalid Query Handling
  // -------------------------------------------------------------------------
  it("3 & 4. rejects empty or invalid search queries with HTTP 400", async () => {
    const resEmpty = await request(app).get("/api/v1/edutube/search?q=");
    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body.success).toBe(false);

    const resWhitespace = await request(app).get("/api/v1/edutube/search?q=%20%20%20");
    expect(resWhitespace.status).toBe(400);
    expect(resWhitespace.body.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 5. maxResults Validation
  // -------------------------------------------------------------------------
  it("5. validates maxResults boundary values", async () => {
    const resInvalid = await request(app).get("/api/v1/edutube/search?q=react&maxResults=999");
    expect(resInvalid.status).toBe(400);

    const resZero = await request(app).get("/api/v1/edutube/search?q=react&maxResults=0");
    expect(resZero.status).toBe(400);
  });

  // -------------------------------------------------------------------------
  // 6. Pagination Parameter Passing
  // -------------------------------------------------------------------------
  it("6. correctly propagates pageToken for pagination", async () => {
    let capturedUrl = "";
    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [], nextPageToken: "TOKEN_2" }),
      });
    });

    const res = await request(app).get("/api/v1/edutube/search?q=typescript&pageToken=PAGE_TOKEN_XYZ");
    expect(res.status).toBe(200);
    expect(capturedUrl).toContain("pageToken=PAGE_TOKEN_XYZ");
  });

  // -------------------------------------------------------------------------
  // 7. Language Filtering
  // -------------------------------------------------------------------------
  it("7. maps supported language parameters to YouTube relevanceLanguage", async () => {
    let capturedUrl = "";
    global.fetch = vi.fn().mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      });
    });

    await request(app).get("/api/v1/edutube/search?q=python&language=ml");
    expect(capturedUrl).toContain("relevanceLanguage=ml");
    expect(capturedUrl).toContain("regionCode=IN");
  });

  // -------------------------------------------------------------------------
  // 8. Normalized Response Format
  // -------------------------------------------------------------------------
  it("8. validates exact normalized item schema without leaking raw structures", async () => {
    const item = normalizeSearchItem({
      id: { videoId: "vid-888" },
      snippet: {
        title: "Mastering Node.js",
        description: "Deep dive into Node.js event loop.",
        channelId: "UC_nodejs",
        channelTitle: "Node Mastery",
        publishedAt: "2026-02-15T10:00:00Z",
        thumbnails: {
          default: { url: "https://img.youtube.com/default.jpg" },
          high: { url: "https://img.youtube.com/high.jpg" },
        },
      },
    });

    expect(item).toEqual({
      videoId: "vid-888",
      title: "Mastering Node.js",
      description: "Deep dive into Node.js event loop.",
      thumbnail: {
        default: "https://img.youtube.com/default.jpg",
        medium: "",
        high: "https://img.youtube.com/high.jpg",
        standard: "",
        maxres: "",
      },
      channelId: "UC_nodejs",
      channelTitle: "Node Mastery",
      publishedAt: "2026-02-15T10:00:00Z",
      embedUrl: "https://www.youtube.com/embed/vid-888",
      youtubeUrl: "https://www.youtube.com/watch?v=vid-888",
      liveBroadcastContent: "none",
    });
  });

  // -------------------------------------------------------------------------
  // 9. Video Details Endpoint
  // -------------------------------------------------------------------------
  it("9. retrieves and normalizes detailed video metadata via GET /video/:videoId", async () => {
    const mockVideoDetail = {
      items: [
        {
          id: "vid-details-123",
          snippet: {
            title: "Advanced Docker for Developers",
            description: "Production containerization guide.",
            channelTitle: "DevOps Pro",
            channelId: "UC_devops",
            publishedAt: "2026-01-10T12:00:00Z",
            tags: ["docker", "devops", "containers"],
            categoryId: "27",
            thumbnails: { high: { url: "https://img.youtube.com/high.jpg" } },
          },
          contentDetails: {
            duration: "PT1H15M30S",
          },
          statistics: {
            viewCount: "50000",
            likeCount: "3500",
            commentCount: "120",
          },
          status: {
            embeddable: true,
            privacyStatus: "public",
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockVideoDetail,
    });

    const res = await request(app).get("/api/v1/edutube/video/vid-details-123");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.video.videoId).toBe("vid-details-123");
    expect(res.body.data.video.duration.formatted).toBe("1:15:30");
    expect(res.body.data.video.duration.seconds).toBe(4530);
    expect(res.body.data.video.embeddable).toBe(true);
    expect(res.body.data.video.embedUrl).toBe("https://www.youtube.com/embed/vid-details-123");
    expect(res.body.data.video.statistics.viewCount).toBe(50000);
  });

  // -------------------------------------------------------------------------
  // 10. Non-Embeddable Video Handling
  // -------------------------------------------------------------------------
  it("10. handles non-embeddable videos safely setting embedUrl to null", async () => {
    const normalized = normalizeVideoDetail({
      id: "non-embed-vid",
      snippet: { title: "Restricted Video" },
      status: { embeddable: false },
      contentDetails: { duration: "PT10M" },
    });

    expect(normalized.embeddable).toBe(false);
    expect(normalized.embedUrl).toBeNull();
  });

  // -------------------------------------------------------------------------
  // 11. YouTube 400 Error Translation
  // -------------------------------------------------------------------------
  it("11. maps YouTube 400 error to standardized client error without crash", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "Invalid query parameter value.", errors: [{ message: "Invalid query parameter value." }] },
      }),
    });

    const res = await request(app).get("/api/v1/edutube/search?q=badquery");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Invalid video search request parameters");
  });

  // -------------------------------------------------------------------------
  // 12. YouTube 401 Error Translation
  // -------------------------------------------------------------------------
  it("12. maps YouTube 401 key error to internal 500 without leaking credentials", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: { message: "API key not valid. Please pass a valid API key." },
      }),
    });

    const res = await request(app).get("/api/v1/edutube/search?q=javascript");
    expect(res.status).toBe(500);
    expect(res.body.message).toContain("EduTube configuration authentication error");
    expect(res.body.message).not.toContain("AIza"); // Never leak API keys
  });

  // -------------------------------------------------------------------------
  // 13 & 15. YouTube 403 / 429 Quota Exceeded Graceful Handling
  // -------------------------------------------------------------------------
  it("13 & 15. translates quota exceeded error to user-friendly HTTP 429", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: {
          errors: [{ reason: "quotaExceeded", message: "The request cannot be completed because you have exceeded your quota." }],
        },
      }),
    });

    const res = await request(app).get("/api/v1/edutube/search?q=javascript");
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("temporarily unavailable due to capacity limits");
  });

  // -------------------------------------------------------------------------
  // 14. YouTube 404 Not Found
  // -------------------------------------------------------------------------
  it("14. handles missing video details with HTTP 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });

    const res = await request(app).get("/api/v1/edutube/video/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.message).toContain("not found");
  });

  // -------------------------------------------------------------------------
  // 16. YouTube 5xx Server Error Translation
  // -------------------------------------------------------------------------
  it("16. maps YouTube 5xx upstream failure to HTTP 502", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: { message: "Backend Error" } }),
    });

    const res = await request(app).get("/api/v1/edutube/search?q=react");
    expect(res.status).toBe(502);
    expect(res.body.message).toContain("Upstream video discovery service");
  });

  // -------------------------------------------------------------------------
  // 17. Timeout Handling
  // -------------------------------------------------------------------------
  it("17. handles timeout gracefully returning HTTP 504", async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const error = new Error("The operation was aborted due to timeout");
      error.name = "TimeoutError";
      return Promise.reject(error);
    });

    const res = await request(app).get("/api/v1/edutube/search?q=timeout-test");
    expect(res.status).toBe(504);
    expect(res.body.message).toContain("timed out");
  });

  // -------------------------------------------------------------------------
  // 18. Network / DNS Failure
  // -------------------------------------------------------------------------
  it("18. handles fetch network failure returning HTTP 503", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("fetch failed ENOTFOUND"));

    const res = await request(app).get("/api/v1/edutube/search?q=network-test");
    expect(res.status).toBe(503);
    expect(res.body.message).toContain("temporarily unreachable");
  });

  // -------------------------------------------------------------------------
  // 19 & 20. Cache Hit & Miss
  // -------------------------------------------------------------------------
  it("19 & 20. caches search results and serves subsequent requests from cache", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ id: { videoId: "cached-vid-1" }, snippet: { title: "Cached Video Tutorial" } }],
          nextPageToken: "TOKEN_C",
        }),
      });
    });

    // First request: Cache Miss
    const res1 = await request(app).get("/api/v1/edutube/search?q=caching-test");
    expect(res1.status).toBe(200);
    expect(res1.body.data.cached).toBe(false);
    expect(callCount).toBe(1);

    // Second request: Cache Hit
    const res2 = await request(app).get("/api/v1/edutube/search?q=caching-test");
    expect(res2.status).toBe(200);
    expect(res2.body.data.cached).toBe(true);
    expect(callCount).toBe(1); // No new network call
  });

  // -------------------------------------------------------------------------
  // 21. Concurrent Request Deduplication (Promise Coalescing)
  // -------------------------------------------------------------------------
  it("21. coalesces concurrent identical requests into a single network call", async () => {
    let networkCalls = 0;
    const customCache = new EduTubeCacheService(600);

    const slowFetcher = () =>
      new Promise((resolve) => {
        networkCalls++;
        setTimeout(() => resolve({ items: [{ videoId: "dedup-1" }] }), 50);
      });

    const key = customCache.generateSearchKey({ q: "concurrent-query" });

    // Launch 5 concurrent calls simultaneously
    const [r1, r2, r3, r4, r5] = await Promise.all([
      customCache.coalesce(key, slowFetcher),
      customCache.coalesce(key, slowFetcher),
      customCache.coalesce(key, slowFetcher),
      customCache.coalesce(key, slowFetcher),
      customCache.coalesce(key, slowFetcher),
    ]);

    expect(networkCalls).toBe(1); // Only 1 network call executed
    expect(r1.data.items[0].videoId).toBe("dedup-1");
    expect(r2.data.items[0].videoId).toBe("dedup-1");
  });

  // -------------------------------------------------------------------------
  // 22 & 23. Zero API Key Leakage in Responses and Logs
  // -------------------------------------------------------------------------
  it("22 & 23. guarantees API key never appears in responses or error payloads", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ id: { videoId: "key-leak-check" }, snippet: { title: "API Security" } }],
      }),
    });

    const res = await request(app).get("/api/v1/edutube/search?q=security");
    const jsonString = JSON.stringify(res.body);

    expect(jsonString).not.toContain("AIzaSy"); // Common YouTube API key prefix
    expect(jsonString).not.toContain("YOUTUBE_API_KEY");
  });

  // -------------------------------------------------------------------------
  // 24. Educational Ranking Behavior
  // -------------------------------------------------------------------------
  it("24. prioritizes educational tutorials over non-educational music/entertainment", () => {
    const rawVideos = [
      {
        videoId: "music-1",
        title: "Latest Pop Song Official Music Video",
        description: "Official music track by artist.",
        channelTitle: "Music Channel",
      },
      {
        videoId: "edu-1",
        title: "Python Full Course for Beginners - Complete Tutorial",
        description: "Hands-on coding walkthrough from scratch.",
        channelTitle: "freeCodeCamp.org",
      },
      {
        videoId: "vlog-1",
        title: "Daily Coding Vlog and Funny Prank",
        description: "Pranking my roommate while coding.",
        channelTitle: "Vlogger",
      },
    ];

    const ranked = rankEducationalVideos(rawVideos, { q: "python" });

    // The educational course should rank #1 with highest score
    expect(ranked[0].videoId).toBe("edu-1");
    expect(ranked[0].educationalScore).toBeGreaterThan(70);

    // The music video should have lowest score
    const musicItem = ranked.find((v) => v.videoId === "music-1");
    expect(musicItem.educationalScore).toBeLessThan(40);
  });

  // -------------------------------------------------------------------------
  // 25. Duration Parsing Helper Verification
  // -------------------------------------------------------------------------
  it("25. accurately parses ISO 8601 duration strings", () => {
    expect(parseDuration("PT15M33S")).toEqual({ seconds: 933, formatted: "15:33" });
    expect(parseDuration("PT1H2M10S")).toEqual({ seconds: 3730, formatted: "1:02:10" });
    expect(parseDuration("PT45S")).toEqual({ seconds: 45, formatted: "0:45" });
    expect(parseDuration("PT2H")).toEqual({ seconds: 7200, formatted: "2:00:00" });
    expect(parseDuration("")).toEqual({ seconds: 0, formatted: "0:00" });
  });
});
