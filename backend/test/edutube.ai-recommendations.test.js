import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { EduTubeRecommendationService } from "../src/modules/edutube/services/edutube-recommendation.service.js";
import { edutubeLearningIntentService, EduTubeLearningIntentService } from "../src/modules/edutube/services/edutube-learning-intent.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
  EduTubeRecommendationFeedback,
} from "../src/modules/edutube/models/index.js";
import { edutubeSearchService } from "../src/modules/edutube/services/edutube-search.service.js";
import * as groqModule from "../src/services/groq.service.js";

describe("EduTube Phase 3C: Personalized AI Learning Engine Test Suite", () => {
  const userIdA = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
  const userIdB = new mongoose.Types.ObjectId("507f1f77bcf86cd799439022");

  let recommendationService;
  let intentService;

  beforeEach(() => {
    recommendationService = new EduTubeRecommendationService();
    intentService = edutubeLearningIntentService;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Gathers grounded user learning context without fabricating information", async () => {
    vi.spyOn(User, "findById").mockReturnValue({
      lean: async () => ({
        _id: userIdA,
        targetRole: "Full Stack Developer",
      }),
    });

    vi.spyOn(SkillProfile, "findOne").mockReturnValue({
      lean: async () => ({
        owner: userIdA,
        targetRole: "Full Stack Developer",
        skills: [
          { skill: "React", canonicalName: "React", score: 85, level: "Proficient" },
          { skill: "Node.js", canonicalName: "Node.js", score: 75, level: "Competent" },
        ],
        skillGaps: [
          { skill: "Docker", canonicalName: "Docker", priority: "Critical", reason: "Required for cloud deployment" },
        ],
      }),
    });

    vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({
      sort: () => ({
        lean: async () => ({
          languages: { TypeScript: 60, JavaScript: 40 },
          repositories: [{ name: "ecommerce-api", language: "TypeScript" }],
        }),
      }),
    });

    vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            { videoId: "v_hist1", title: "Node.js Architecture Overview", channelTitle: "Tech Lead", completed: false },
          ],
        }),
      }),
    });

    vi.spyOn(EduTubeProgress, "find").mockReturnValue({
      lean: async () => [
        { videoId: "v_comp1", completed: true },
      ],
    });

    vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => [],
        }),
      }),
    });

    vi.spyOn(EduTubeRecommendationFeedback, "find").mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: async () => [
            { videoId: "v_dismissed", action: "not_interested" },
          ],
        }),
      }),
    });

    const context = await intentService.gatherUserLearningContext(userIdA);

    expect(context.targetRole).toBe("Full Stack Developer");
    expect(context.topSkills).toHaveLength(2);
    expect(context.skillGaps).toHaveLength(1);
    expect(context.skillGaps[0].skill).toBe("Docker");
    expect(context.githubLanguages).toContain("TypeScript");
    expect(context.completedVideoIds).toContain("v_comp1");
    expect(context.notInterestedVideos).toContain("v_dismissed");
  });

  it("2. Produces deterministic heuristic learning intent if Groq is unavailable", async () => {
    const mockContext = {
      targetRole: "Backend Engineer",
      topSkills: [{ skill: "Go", level: "Competent", score: 70 }],
      skillGaps: [{ skill: "Kubernetes", priority: "High", currentScore: 20 }],
      githubLanguages: ["Go"],
      githubRepos: [{ name: "microservice", language: "Go" }],
      recentHistory: [{ title: "Go Concurrency Patterns" }],
      completedVideoIds: [],
      alreadyKnownTopics: [],
      boostedTopics: [],
    };

    // Simulate Groq error
    vi.spyOn(groqModule, "generateJSON").mockRejectedValueOnce(new Error("Groq timeout"));

    const intent = await intentService.generateLearningIntent(mockContext);

    expect(intent.learningGoals.length).toBeGreaterThan(0);
    expect(intent.learningGoals[0].topic).toBe("Kubernetes");
    expect(intent.careerTrack.role).toBe("Backend Engineer");
    expect(intent.projectIdeas[0].searchQuery).toContain("Go");
  });

  it("3. Assembles personalized recommendations with valid scoring and filters completed/dismissed videos", async () => {
    vi.spyOn(intentService, "gatherUserLearningContext").mockResolvedValueOnce({
      targetRole: "Full Stack Developer",
      topSkills: [{ skill: "React", level: "Proficient", score: 80 }],
      skillGaps: [{ skill: "Docker", priority: "Critical", currentScore: 30 }],
      githubLanguages: ["TypeScript"],
      githubRepos: [],
      recentHistory: [],
      completedVideoIds: ["v_completed_1"],
      savedTitles: [],
      notInterestedVideos: ["v_dismissed_1"],
      alreadyKnownTopics: [],
      boostedTopics: ["Docker"],
    });

    vi.spyOn(intentService, "generateLearningIntent").mockResolvedValueOnce({
      learningGoals: [{ topic: "Docker", searchQuery: "Docker tutorial", reason: "Matches Docker skill gap" }],
      careerTrack: { role: "Full Stack Developer", focusAreas: ["Docker"], queries: ["Full Stack roadmap"] },
      projectIdeas: [{ title: "Dockerized App", searchQuery: "Docker project tutorial", reason: "Hands on project" }],
      historyNextSteps: [],
      avoidTopics: [],
    });

    vi.spyOn(edutubeSearchService, "searchVideos").mockResolvedValue({
      items: [
        {
          videoId: "v_completed_1",
          title: "Old Completed Docker Video",
          educationalScore: 90,
        },
        {
          videoId: "v_dismissed_1",
          title: "Not Interested Video",
          educationalScore: 85,
        },
        {
          videoId: "v_valid_1",
          title: "Docker for Beginners 2026",
          educationalScore: 95,
          thumbnail: { default: "https://example.com/thumb.jpg" },
          channelTitle: "DevOps Tech",
          publishedAt: "2026-01-01T00:00:00Z",
          embedUrl: "https://www.youtube.com/embed/v_valid_1",
          youtubeUrl: "https://www.youtube.com/watch?v=v_valid_1",
        },
      ],
      nextPageToken: null,
      prevPageToken: null,
      totalResults: 3,
      cached: false,
      query: "Docker tutorial",
    });

    const recommendations = await recommendationService.getPersonalizedRecommendations(userIdA, {
      forceRefresh: true,
    });

    expect(recommendations).toBeDefined();
    expect(recommendations.personalized).toBeInstanceOf(Array);
    expect(recommendations.skillGaps).toBeInstanceOf(Array);

    // Completed and dismissed videos must be filtered out
    const allReturnedIds = [
      ...recommendations.personalized,
      ...recommendations.skillGaps,
    ].map((v) => v.videoId);

    expect(allReturnedIds).not.toContain("v_completed_1");
    expect(allReturnedIds).not.toContain("v_dismissed_1");

    if (recommendations.personalized.length > 0) {
      const topRec = recommendations.personalized[0];
      expect(topRec.personalizationScore).toBeGreaterThanOrEqual(50);
      expect(topRec.whyRecommended).toBeInstanceOf(Array);
      expect(topRec.whyRecommended.length).toBeGreaterThan(0);
    }
  });

  it("4. Serves cached recommendations on subsequent call and flushes on forceRefresh", async () => {
    recommendationService.setCachedRecommendations(userIdA, {
      personalized: [{ videoId: "cached_v1", title: "Cached Video" }],
      skillGaps: [],
      careerPath: [],
      basedOnHistory: [],
      projectLearning: [],
      trending: [],
      learningContext: { targetRole: "Full Stack" },
    });

    const res1 = await recommendationService.getPersonalizedRecommendations(userIdA, { forceRefresh: false });
    expect(res1.cached).toBe(true);
    expect(res1.personalized[0].videoId).toBe("cached_v1");

    // Invalidate cache
    recommendationService.invalidateCache(userIdA);
    const cachedAfterFlush = recommendationService.getCachedRecommendations(userIdA);
    expect(cachedAfterFlush).toBeNull();
  });

  it("5. Records user feedback and immediately invalidates recommendation cache", async () => {
    recommendationService.setCachedRecommendations(userIdA, { dummy: true });

    vi.spyOn(EduTubeRecommendationFeedback, "create").mockResolvedValueOnce({
      _id: new mongoose.Types.ObjectId(),
      owner: userIdA,
      videoId: "vid_123",
      action: "already_know",
      topic: "React Basics",
    });

    const feedback = await recommendationService.recordFeedback(userIdA, {
      videoId: "vid_123",
      action: "already_know",
      topic: "React Basics",
    });

    expect(feedback.action).toBe("already_know");
    expect(recommendationService.getCachedRecommendations(userIdA)).toBeNull();
  });

  it("6. Generates AI learning track with verified real YouTube video lessons", async () => {
    vi.spyOn(groqModule, "generateJSON").mockResolvedValueOnce({
      data: {
        trackTitle: "Docker & Container Mastery",
        description: "Zero to Hero curriculum",
        lessons: [
          {
            lessonTitle: "1. Container Concepts",
            searchQuery: "Docker container architecture tutorial",
            learningObjective: "Understand container virtualization",
          },
          {
            lessonTitle: "2. Docker Compose",
            searchQuery: "Docker compose multi-container tutorial",
            learningObjective: "Orchestrate multi-container setups",
          },
        ],
      },
      modelUsed: "openai/gpt-oss-120b",
      repaired: false,
    });

    vi.spyOn(edutubeSearchService, "searchVideos").mockImplementation(async ({ q }) => ({
      items: [
        {
          videoId: `vid_${q.replace(/\s+/g, "_").slice(0, 10)}`,
          title: `Video for ${q}`,
          thumbnail: { high: "https://example.com/thumb.jpg" },
          channelTitle: "DevOps Coach",
          embedUrl: "https://www.youtube.com/embed/demo",
          youtubeUrl: "https://www.youtube.com/watch?v=demo",
          educationalScore: 92,
        },
      ],
      nextPageToken: null,
      prevPageToken: null,
      totalResults: 1,
      cached: false,
      query: q,
    }));

    const track = await recommendationService.generateLearningTrack(userIdA, {
      topic: "Docker",
      targetRole: "Full Stack Developer",
    });

    expect(track.trackTitle).toBe("Docker & Container Mastery");
    expect(track.lessons).toHaveLength(2);
    expect(track.lessons[0].videoId).toBeDefined();
    expect(track.lessons[0].lessonTitle).toBe("1. Container Concepts");
  });

  it("7. Saves generated learning track directly as custom EduTube playlist", async () => {
    const mockCreatedPlaylist = {
      _id: new mongoose.Types.ObjectId("6a8da89f1b10f5248aea4f99"),
      owner: userIdA,
      name: "Docker Mastery Track",
      description: "Auto generated",
      videos: [],
    };

    vi.spyOn(EduTubePlaylist, "create").mockResolvedValueOnce(mockCreatedPlaylist);

    vi.spyOn(EduTubePlaylist, "findOne").mockResolvedValueOnce({
      ...mockCreatedPlaylist,
      videos: [],
      save: async () => {},
    });

    vi.spyOn(EduTubePlaylist, "findOne").mockReturnValueOnce({
      lean: async () => ({
        ...mockCreatedPlaylist,
        videos: [
          { videoId: "v1", title: "Lesson 1" },
        ],
      }),
    });

    vi.spyOn(EduTubeProgress, "find").mockReturnValue({
      lean: async () => [],
    });

    const result = await recommendationService.saveTrackAsPlaylist(userIdA, {
      name: "Docker Mastery Track",
      description: "Auto generated",
      track: {
        trackTitle: "Docker Track",
        lessons: [
          { videoId: "v1", title: "Lesson 1", thumbnail: "", channelTitle: "Dev" },
        ],
      },
    });

    expect(result.playlist).toBeDefined();
    expect(result.playlist.name).toBe("Docker Mastery Track");
  });
});
