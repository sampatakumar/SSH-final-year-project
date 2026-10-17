import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import {
  MentorCourseRecommendationService,
  mentorCourseRecommendationService,
  CURATED_COURSE_REGISTRY,
} from "../src/modules/mentor/services/mentor-course-recommendation.service.js";
import { edutubeCacheService } from "../src/modules/edutube/services/edutube-cache.service.js";
import { youtubeService } from "../src/modules/edutube/services/youtube.service.js";
import { validateSafeExternalUrl } from "../src/modules/edutube/utils/youtube.utils.js";
import { SmartMentorService } from "../src/modules/mentor/services/smart-mentor.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { SmartMentorConversation } from "../src/modules/mentor/models/smartMentorConversation.models.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";

describe("AI Mentor YouTube Full-Course Recommendations & Learning Packages Suite", () => {
  let service;
  const mockUserId = new mongoose.Types.ObjectId("60d5ec49f1b2c8b1f8e4e1a1");

  const mockContext = {
    career: {
      name: "Sampat",
      targetRole: "Full Stack Developer",
      readinessScore: 72,
    },
    skills: [
      { name: "JavaScript", level: "Proficient", score: 80 },
      { name: "HTML & CSS", level: "Expert", score: 90 },
    ],
    skillGaps: [
      { skill: "React", priority: "Critical", currentScore: 30, targetScore: 75 },
    ],
  };

  beforeEach(() => {
    service = new MentorCourseRecommendationService();
    edutubeCacheService.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Learning Request Understanding & Intent Extraction
  // =========================================================================
  describe("1. Learning Request Understanding & Intent Extraction", () => {
    it("extracts technology, level, and objective for Python beginner-to-advanced request", () => {
      const intent = service.parseLearningIntent(
        "Teach me Python from beginner to advanced",
        mockContext
      );
      expect(intent.technologyKey).toBe("python");
      expect(intent.level).toBe("beginner_to_advanced");
      expect(intent.objective).toBe("full_course");
      expect(intent.targetRole).toBe("Full Stack Developer");
    });

    it("extracts framework-specific request for React.js and placement objective", () => {
      const intent = service.parseLearningIntent(
        "I want to learn React.js for placements",
        mockContext
      );
      expect(intent.technologyKey).toBe("react");
      expect(intent.objective).toBe("interview_preparation");
    });

    it("extracts Java DSA request with DSA objective and course type", () => {
      const intent = service.parseLearningIntent(
        "Give me a full Java DSA course",
        mockContext
      );
      expect(intent.technologyKey).toBe("java_dsa");
      expect(intent.objective).toBe("dsa");
      expect(intent.courseTypePreference).toBe("dsa_course");
    });

    it("extracts Machine Learning beginner request", () => {
      const intent = service.parseLearningIntent(
        "Recommend the best complete course for machine learning",
        mockContext
      );
      expect(intent.technologyKey).toBe("machine_learning");
      expect(intent.objective).toBe("full_course");
    });

    it("detects preferred instruction language when specified", () => {
      const intent = service.parseLearningIntent(
        "Recommend complete Python course in Hindi",
        mockContext
      );
      expect(intent.preferredLanguage).toBe("Hindi");
    });

    it("falls back gracefully to target role and skill gaps when query is general", () => {
      const intent = service.parseLearningIntent("What should I learn?", mockContext);
      expect(intent.technologyKey).toBeDefined();
      expect(intent.needsClarification).toBe(false);
    });
  });

  // =========================================================================
  // 2. Prioritizing Complete Courses & Full Playlists
  // =========================================================================
  describe("2. Course Scoring & Playlist Prioritization", () => {
    it("prioritizes complete playlists and long masterclasses over short clips", () => {
      const intent = {
        technologyName: "JavaScript",
        level: "beginner_to_advanced",
        objective: "full_course",
      };

      const longCourse = {
        title: "JavaScript Full Course for Beginners",
        technology: "JavaScript",
        duration: { seconds: 14400 }, // 4 hours
        isPlaylist: false,
        level: "beginner",
      };

      const shortClip = {
        title: "JavaScript Quick Intro in 5 Minutes",
        technology: "JavaScript",
        duration: { seconds: 300 }, // 5 mins
        isPlaylist: false,
        level: "beginner",
      };

      const playlistCourse = {
        title: "Complete Modern JavaScript Course Playlist",
        technology: "JavaScript",
        duration: { seconds: 28800 },
        isPlaylist: true,
        level: "all_levels",
      };

      const scoreLong = service.scoreCourseCandidate(longCourse, intent);
      const scoreShort = service.scoreCourseCandidate(shortClip, intent);
      const scorePlaylist = service.scoreCourseCandidate(playlistCourse, intent);

      expect(scoreLong.totalScore).toBeGreaterThan(scoreShort.totalScore);
      expect(scorePlaylist.totalScore).toBeGreaterThan(scoreShort.totalScore);
      expect(scorePlaylist.breakdown.courseStructureLength).toBe(20);
    });

    it("produces deterministic ranking consistency for identical candidate sets", () => {
      const candidates = CURATED_COURSE_REGISTRY.javascript;
      const intent = service.parseLearningIntent("complete javascript course", mockContext);

      const score1 = candidates.map((c) => service.scoreCourseCandidate(c, intent).totalScore);
      const score2 = candidates.map((c) => service.scoreCourseCandidate(c, intent).totalScore);

      expect(score1).toEqual(score2);
    });
  });

  // =========================================================================
  // 3. Evidence-Based Ranking & Anti-Hallucination
  // =========================================================================
  describe("3. Evidence-Based Ranking & Anti-Hallucination Guarantees", () => {
    it("never fabricates universal star ratings and explicitly documents lack of public star ratings", async () => {
      const result = await service.getRecommendationsForQuery(
        "Teach me Python from beginner to advanced",
        mockContext
      );

      expect(result.shortlist.length).toBeGreaterThan(0);
      for (const course of result.shortlist) {
        expect(course.engagement.publicStarRating).toContain("Not provided by YouTube public API");
        expect(course.engagement.source).toBe("YouTube Data API v3");
        expect(course.whyMatches).toBeDefined();
        expect(course.limitations).toBeDefined();
      }
    });

    it("identifies course limitations and missing topics honestly", async () => {
      const result = await service.getRecommendationsForQuery(
        "complete javascript course",
        mockContext
      );
      const firstCourse = result.shortlist[0];
      expect(Array.isArray(firstCourse.limitations)).toBe(true);
      expect(firstCourse.limitations.length).toBeGreaterThan(0);
    });

    it("enforces safe canonical external links and blocks malicious URLs", () => {
      expect(validateSafeExternalUrl("https://www.youtube.com/watch?v=PkZNo7MFNFg")).toBe(
        "https://www.youtube.com/watch?v=PkZNo7MFNFg"
      );
      expect(validateSafeExternalUrl("https://youtu.be/PkZNo7MFNFg")).toBe(
        "https://youtu.be/PkZNo7MFNFg"
      );
      expect(validateSafeExternalUrl("javascript:alert(1)")).toBeNull();
      expect(validateSafeExternalUrl("https://evil-phishing.com/watch")).toBeNull();
      expect(validateSafeExternalUrl("data:text/html,hack")).toBeNull();
    });
  });

  // =========================================================================
  // 4. Course Comparison & Starting Recommendation
  // =========================================================================
  describe("4. Course Comparison & Starting Pick", () => {
    it("generates structured comparison with starting recommendation and trade-offs", async () => {
      const result = await service.getRecommendationsForQuery(
        "Recommend complete JavaScript course",
        mockContext
      );

      const comparison = result.comparison;
      expect(comparison).toBeDefined();
      expect(comparison.recommendedStartingCourseId).toBeDefined();
      expect(comparison.startingRecommendationReason).toContain("We recommend starting with");
      expect(comparison.courses.length).toBeGreaterThanOrEqual(2);

      const startingPick = comparison.courses.find((c) => c.isStartingPick);
      expect(startingPick).toBeDefined();
      expect(startingPick.strength).toBeDefined();
      expect(startingPick.tradeOff).toBeDefined();
    });
  });

  // =========================================================================
  // 5. 10-Point Structured Learning Package
  // =========================================================================
  describe("5. 10-Point Learning Package Generation", () => {
    it("generates complete 10-point learning package with modules, projects, and milestones", async () => {
      const result = await service.getRecommendationsForQuery(
        "Teach me Python from beginner to advanced",
        mockContext
      );

      const pkg = result.learningPackage;
      expect(pkg).toBeDefined();
      expect(pkg.technology).toBeDefined();
      expect(pkg.prerequisites.length).toBeGreaterThan(0);
      expect(pkg.modules.length).toBeGreaterThanOrEqual(3);
      expect(pkg.projects.capstoneProject).toBeDefined();
      expect(pkg.projects.capstoneProject.title).toBeDefined();
      expect(pkg.codingChallenges.length).toBeGreaterThan(0);
      expect(pkg.milestones.length).toBeGreaterThan(0);
      expect(pkg.revisionInterview.keyQuestions.length).toBeGreaterThan(0);
      expect(pkg.nextSteps.length).toBeGreaterThan(0);
      expect(pkg.masteryNote).toContain("Distinguish watching from demonstrated mastery");
    });

    it("adapts package by recognizing skills already possessed in user profile", async () => {
      // User already proficient in JavaScript
      const jsResult = await service.getRecommendationsForQuery(
        "complete javascript course",
        mockContext
      );

      const firstModule = jsResult.learningPackage.modules[0];
      // Since mockContext has JavaScript Proficient, Module 1 is flagged as skipped/mastered
      expect(firstModule.isSkippedBasedOnProfile).toBe(true);
    });
  });

  // =========================================================================
  // 6. Resilient YouTube Integration & Cache Handling
  // =========================================================================
  describe("6. Resilient YouTube Integration & Cache Handling", () => {
    it("falls back cleanly to curated registry when YouTube API is offline or throws", async () => {
      vi.spyOn(youtubeService, "searchList").mockRejectedValue(
        new Error("YouTube API quota exceeded (429)")
      );

      const result = await service.getRecommendationsForQuery(
        "Recommend the best complete course for machine learning",
        mockContext
      );

      expect(result.shortlist.length).toBeGreaterThan(0);
      expect(result.shortlist[0].channelTitle).toBeDefined();
      expect(result.shortlist[0].youtubeUrl).toContain("youtube.com");
    });

    it("serves repeated requests from cache to conserve API quota", async () => {
      const spy = vi.spyOn(youtubeService, "searchList").mockResolvedValue({ items: [] });

      await service.getRecommendationsForQuery("learn python", mockContext);
      await service.getRecommendationsForQuery("learn python", mockContext);

      // Second call should hit edutubeCacheService
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // 7. Full Integration with Smart Mentor Chat & Local Fallback
  // =========================================================================
  describe("7. Full Integration with Smart Mentor Chat", () => {
    it("local fallback generates course recommendations and learning package for course queries", () => {
      const localResponse = smartMentorLocalService.generateLocalResponse(
        "Teach me Python from beginner to advanced",
        mockContext
      );

      expect(localResponse.intent).toBe("course_recommendation");
      expect(localResponse.courseRecommendations).toBeDefined();
      expect(localResponse.learningPackage).toBeDefined();
      expect(localResponse.answer).toContain("Top Recommended YouTube Courses");
      expect(localResponse.actions.some((a) => a.category === "edutube")).toBe(true);
      expect(localResponse.actions.some((a) => a.category === "skills")).toBe(true);
    });

    it("saves course recommendations and learning package in conversation memory", async () => {
      const mentorService = new SmartMentorService();
      const mockConv = {
        owner: mockUserId,
        messages: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(SmartMentorConversation, "findOne").mockResolvedValue(mockConv);
      vi.spyOn(smartMentorContextService, "getUnifiedUserContext").mockResolvedValue(mockContext);

      const res = await mentorService.processChatMessage(
        mockUserId,
        "Recommend the best complete JavaScript course"
      );

      expect(res.courseRecommendations).toBeDefined();
      expect(res.learningPackage).toBeDefined();
      expect(mockConv.messages.length).toBe(2);

      const assistantMsg = mockConv.messages[1];
      expect(assistantMsg.courseRecommendations).toBeDefined();
      expect(assistantMsg.learningPackage).toBeDefined();
    });
  });
});
