/**
 * EduTube Educational Quality Gate, Modular Hybrid Recommender,
 * and Adaptive Skill Intelligence Verification Test Suite
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  EduTubeQualityGateService,
  QUALITY_GATE_REASONS,
} from "../src/modules/edutube/services/edutube-quality-gate.service.js";
import { RecommendationFeatureExtractor } from "../src/modules/edutube/services/recommendation-engine/feature-extractor.js";
import {
  RecommendationRankingService,
  BASELINE_WEIGHTS,
} from "../src/modules/edutube/services/recommendation-engine/ranking-service.js";
import { RecommendationTrainingPipelineService } from "../src/modules/edutube/services/recommendation-engine/training-pipeline.service.js";
import { AdaptiveSkillLoopService } from "../src/modules/skills/services/adaptive-skill-loop.service.js";
import { DashboardIntelligenceService } from "../src/services/dashboard-intelligence.service.js";

describe("EduTube Upgrade: Educational Quality Gate Suite", () => {
  let qualityGate;

  beforeEach(() => {
    qualityGate = new EduTubeQualityGateService({ minDurationSeconds: 120 });
  });

  it("1. Rejects videos with duration below 120 seconds", () => {
    const shortVideo = {
      videoId: "short_1",
      title: "Quick React Tip",
      duration: { seconds: 119, raw: "PT1M59S" },
      embeddable: true,
    };

    const result = qualityGate.evaluateVideoEligibility(shortVideo);
    expect(result.eligible).toBe(false);
    expect(result.rejectReason).toBe(QUALITY_GATE_REASONS.DURATION_BELOW_MINIMUM);
    expect(result.message).toContain("below required 120s");
  });

  it("2. Rejects videos with missing or unverified duration", () => {
    const unverifiedVideo = {
      videoId: "unverified_1",
      title: "Node.js Tutorial",
      duration: { seconds: 0, raw: "" },
      embeddable: true,
    };

    const result1 = qualityGate.evaluateVideoEligibility(unverifiedVideo);
    expect(result1.eligible).toBe(false);
    expect(result1.rejectReason).toBe(QUALITY_GATE_REASONS.UNVERIFIED_DURATION);

    const noDurationVideo = {
      videoId: "unverified_2",
      title: "CSS Flexbox",
      embeddable: true,
    };
    const result2 = qualityGate.evaluateVideoEligibility(noDurationVideo);
    expect(result2.eligible).toBe(false);
    expect(result2.rejectReason).toBe(QUALITY_GATE_REASONS.UNVERIFIED_DURATION);
  });

  it("3. Excludes YouTube Shorts based on canonical metadata signals", () => {
    // A. URL contains /shorts/
    const shortsByUrl = {
      videoId: "short_url",
      title: "Python in 60 seconds",
      youtubeUrl: "https://www.youtube.com/shorts/short_url",
      duration: { seconds: 150 },
      embeddable: true,
    };
    expect(qualityGate.evaluateVideoEligibility(shortsByUrl).rejectReason).toBe(
      QUALITY_GATE_REASONS.YOUTUBE_SHORTS_EXCLUDED
    );

    // B. Tags contain #shorts
    const shortsByTag = {
      videoId: "short_tag",
      title: "JavaScript array methods",
      tags: ["coding", "#shorts", "tips"],
      duration: { seconds: 130 },
      embeddable: true,
    };
    expect(qualityGate.evaluateVideoEligibility(shortsByTag).rejectReason).toBe(
      QUALITY_GATE_REASONS.YOUTUBE_SHORTS_EXCLUDED
    );

    // C. Duration <= 60 seconds
    const shortsByDuration = {
      videoId: "short_dur",
      title: "Docker trick",
      duration: { seconds: 58 },
      embeddable: true,
    };
    expect(qualityGate.evaluateVideoEligibility(shortsByDuration).rejectReason).toBe(
      QUALITY_GATE_REASONS.YOUTUBE_SHORTS_EXCLUDED
    );
  });

  it("4. Accepts complete tutorials with verified duration >= 120s and high substance", () => {
    const validTutorial = {
      videoId: "valid_tut_1",
      title: "Docker and Kubernetes Full Course for Beginners - Step by Step",
      description: "Learn complete containerization architecture from scratch.",
      channelTitle: "freeCodeCamp.org",
      duration: { seconds: 3600, formatted: "1:00:00" },
      embeddable: true,
      educationalScore: 85,
    };

    const result = qualityGate.evaluateVideoEligibility(validTutorial);
    expect(result.eligible).toBe(true);
    expect(result.rejectReason).toBeNull();
    expect(result.diagnostic.structuredTutorial).toBe(true);
    expect(result.diagnostic.durationSeconds).toBe(3600);
  });

  it("5. Rejects low-substance entertainment clips despite duration", () => {
    const entertainmentVideo = {
      videoId: "prank_1",
      title: "Programmer Prank on Roommate Funny Moments",
      description: "Hilarious prank compilation",
      duration: { seconds: 600 },
      embeddable: true,
    };

    const result = qualityGate.evaluateVideoEligibility(entertainmentVideo);
    expect(result.eligible).toBe(false);
    expect(result.rejectReason).toBe(QUALITY_GATE_REASONS.LOW_SUBSTANCE_ENTERTAINMENT);
  });

  it("6. Centrally respects configurable minimum duration", () => {
    qualityGate.setMinDurationSeconds(300); // 5 minutes
    const fourMinVideo = {
      videoId: "four_min",
      title: "Git Rebase Explained",
      duration: { seconds: 240 },
      embeddable: true,
    };

    const res = qualityGate.evaluateVideoEligibility(fourMinVideo);
    expect(res.eligible).toBe(false);
    expect(res.rejectReason).toBe(QUALITY_GATE_REASONS.DURATION_BELOW_MINIMUM);
    expect(res.message).toContain("300s");
  });

  it("7. Filter candidate batch deduplicates identical videoIds and titles", () => {
    const batch = [
      {
        videoId: "vid_1",
        title: "React Tutorial for Beginners",
        duration: { seconds: 1200 },
        embeddable: true,
      },
      {
        videoId: "vid_1", // Duplicate ID
        title: "React Tutorial for Beginners",
        duration: { seconds: 1200 },
        embeddable: true,
      },
      {
        videoId: "vid_2",
        title: "React Tutorial for Beginners", // Near-identical title
        duration: { seconds: 1200 },
        embeddable: true,
      },
      {
        videoId: "vid_3",
        title: "Node.js Complete Guide",
        duration: { seconds: 1800 },
        embeddable: true,
      },
    ];

    const filtered = qualityGate.filterCandidateBatch(batch);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].videoId).toBe("vid_1");
    expect(filtered[1].videoId).toBe("vid_3");
  });
});

describe("EduTube Upgrade: Modular Hybrid Recommendation Engine & Ranking Suite", () => {
  const extractor = new RecommendationFeatureExtractor();
  const ranker = new RecommendationRankingService();

  const mockUserContext = {
    targetRole: "Full Stack Developer",
    skillGaps: [{ skill: "Docker", priority: "Critical", currentScore: 20 }],
    topSkills: [{ skill: "JavaScript", score: 85, level: "Proficient" }],
    boostedTopics: ["docker", "devops"],
    alreadyKnownTopics: ["html"],
    notInterestedVideos: ["avoid_this_id"],
    completedVideoIds: ["done_1"],
    recentHistory: [{ title: "Express.js REST APIs" }],
  };

  it("8. Feature extractor computes 12 normalized leak-free signals", () => {
    const candidate = {
      videoId: "cand_1",
      title: "Docker Containerization Full Course Step by Step",
      description: "Complete hands-on tutorial for full stack developers",
      channelTitle: "freeCodeCamp.org",
      duration: { seconds: 2400 },
      educationalScore: 90,
    };

    const feats = extractor.extractFeatures(candidate, mockUserContext, 0);

    expect(feats.f_gap_relevance).toBe(1.0); // Critical Docker gap
    expect(feats.f_channel_authority).toBe(1.0); // Recognized proven channel
    expect(feats.f_duration_suitability).toBe(1.0); // 40m tutorial in optimal bracket
    expect(feats.f_structured_substance).toBe(1.0); // Step by step / full course
    expect(feats.f_user_positive_affinity).toBeGreaterThan(0); // Boosted docker topic
    expect(feats.f_inverse_position_bias).toBe(1.0); // Position 0
  });

  it("9. Deterministic baseline ranker scores and sorts candidates rationally", async () => {
    const candidates = [
      {
        videoId: "low_rel",
        title: "Unrelated Cooking Basics",
        duration: { seconds: 600 },
        educationalScore: 50,
      },
      {
        videoId: "high_rel",
        title: "Docker for Full Stack Developers Complete Tutorial",
        channelTitle: "Traversy Media",
        duration: { seconds: 1800 },
        educationalScore: 95,
      },
    ];

    const ranked = await ranker.rankCandidates(candidates, mockUserContext);
    expect(ranked[0].videoId).toBe("high_rel");
    expect(ranked[0].personalizationScore).toBeGreaterThan(ranked[1].personalizationScore);
    expect(ranked[0].rankingSignals).toContain("High priority skill gap match");
  });

  it("10. Machine learning ranker safely falls back to baseline on inference failure", async () => {
    const faultyRanker = new RecommendationRankingService();
    faultyRanker.isMlDeployed = true;
    faultyRanker.activeModel = {
      featureWeights: null, // Forces error inside scoreML
    };

    const candidates = [
      {
        videoId: "test_fb",
        title: "Docker Tutorial",
        duration: { seconds: 600 },
      },
    ];

    const ranked = await faultyRanker.rankCandidates(candidates, mockUserContext);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].fallbackTriggered).toBe(true);
    expect(ranked[0].personalizationScore).toBeGreaterThan(0);
  });
});

describe("EduTube Upgrade: Offline Training & Evaluation Pipeline Suite", () => {
  const trainingService = new RecommendationTrainingPipelineService();

  it("11. Dataset construction applies strict temporal split without future leakage", () => {
    const records = [
      { createdAt: new Date("2026-01-01"), videoId: "v1", action: "impression" },
      { createdAt: new Date("2026-01-05"), videoId: "v2", action: "completed", completionRate: 0.9 },
      { createdAt: new Date("2026-01-10"), videoId: "v3", action: "not_interested" },
      { createdAt: new Date("2026-01-15"), videoId: "v4", action: "save" },
      { createdAt: new Date("2026-01-20"), videoId: "v5", action: "click", completionRate: 0.5 },
      { createdAt: new Date("2026-01-25"), videoId: "v6", action: "completed", completionRate: 0.95 },
      { createdAt: new Date("2026-01-30"), videoId: "v7", action: "impression" },
      { createdAt: new Date("2026-02-05"), videoId: "v8", action: "more_like_this" },
      { createdAt: new Date("2026-02-10"), videoId: "v9", action: "completed", completionRate: 0.85 },
      { createdAt: new Date("2026-02-15"), videoId: "v10", action: "save" },
    ];

    const { trainInstances, holdoutInstances } = trainingService.prepareDatasetWithTemporalSplit(records);

    expect(trainInstances.length).toBe(7); // 70%
    expect(holdoutInstances.length).toBe(3); // 30%

    // Verify temporal separation
    const latestTrain = new Date(trainInstances[trainInstances.length - 1].timestamp).getTime();
    const earliestHoldout = new Date(holdoutInstances[0].timestamp).getTime();
    expect(latestTrain).toBeLessThanOrEqual(earliestHoldout);

    // Verify positive/negative label construction
    expect(trainInstances[1].relevance).toBe(3); // Completed = 3
    expect(trainInstances[2].relevance).toBe(0); // Not interested = 0
    expect(trainInstances[0].relevance).toBe(0.5); // Skipped/impression is NOT negative
  });

  it("12. Correctly calculates NDCG@5 and Precision@5 metrics", () => {
    // Perfect ranking: relevance 3, 3, 2, 1, 0
    const perfectRankings = [
      { relevance: 3 },
      { relevance: 3 },
      { relevance: 2 },
      { relevance: 1 },
      { relevance: 0 },
    ];
    const perfectNDCG = trainingService.calculateNDCG(perfectRankings, 5);
    expect(perfectNDCG).toBe(1.0);

    // Imperfect ranking
    const imperfectRankings = [
      { relevance: 0 },
      { relevance: 1 },
      { relevance: 2 },
      { relevance: 3 },
      { relevance: 3 },
    ];
    const imperfectNDCG = trainingService.calculateNDCG(imperfectRankings, 5);
    expect(imperfectNDCG).toBeLessThan(1.0);
    expect(imperfectNDCG).toBeGreaterThan(0.2);

    // Precision@5 with threshold 1.5 (items with rel >= 2 are relevant: 3 items in top 5)
    const p5 = trainingService.calculatePrecisionAtK(perfectRankings, 5, 1.5);
    expect(p5).toBe(0.6); // 3 / 5 = 0.6
  });
});

describe("Adaptive Skill Improvement Loop & Prerequisite Suite", () => {
  const adaptiveService = new AdaptiveSkillLoopService();

  it("13. Identifies missing prerequisites according to the dependency graph", () => {
    const profileWithJs = [
      { canonicalName: "JavaScript", score: 80 },
    ];

    // Docker requires Linux CLI, Networking Basics, Node.js
    const dockerReadiness = adaptiveService.evaluatePrerequisiteReadiness("Docker", profileWithJs);
    expect(dockerReadiness.isReady).toBe(false);
    expect(dockerReadiness.missingPrerequisites).toContain("Linux CLI");

    // React requires JavaScript, HTML/CSS, DOM API
    const reactWithPartial = adaptiveService.evaluatePrerequisiteReadiness("React", profileWithJs);
    expect(reactWithPartial.missingPrerequisites).toContain("HTML/CSS");

    // Fully satisfied React prerequisites
    const completeFrontendProfile = [
      { canonicalName: "JavaScript", score: 85 },
      { canonicalName: "HTML/CSS", score: 75 },
      { canonicalName: "DOM API", score: 65 },
    ];
    const reactReady = adaptiveService.evaluatePrerequisiteReadiness("React", completeFrontendProfile);
    expect(reactReady.isReady).toBe(true);
    expect(reactReady.missingPrerequisites).toHaveLength(0);
  });
});

describe("Dashboard Intelligence Service Suite", () => {
  const intelService = new DashboardIntelligenceService();

  it("14. Correctly computes learning consistency streak", () => {
    const now = new Date();
    const d0 = new Date(now);
    const d1 = new Date(now);
    d1.setDate(d1.getDate() - 1);
    const d2 = new Date(now);
    d2.setDate(d2.getDate() - 2);

    const activeDates = [d0, d1, d2];
    const streak = intelService.calculateConsistencyStreak(activeDates);
    expect(streak).toBe(3);

    // Empty activity
    expect(intelService.calculateConsistencyStreak([])).toBe(0);
  });
});
