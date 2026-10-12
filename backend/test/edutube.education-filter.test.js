/**
 * EduTube Education-Only Filtering & Classification Upgrade Test Suite
 *
 * Verifies strict, deterministic educational filtering:
 * 1. Blocks music videos, songs, official audio, lyric videos, and artist channels.
 * 2. Blocks movie trailers, film clips, scene compilations, and teasers.
 * 3. Blocks YouTube Shorts (<60s, #shorts tag/title, shorts URLs).
 * 4. Blocks comedy, celebrity gossip, entertainment vlogs, and unrelated gameplay.
 * 5. Rejects keyword-stuffed clickbait (entertainment videos with injected educational terms).
 * 6. Allows genuine programming tutorials, CS lectures, mathematics, and science courses.
 * 7. Supports contextual exceptions (music theory / audio engineering, film editing, game dev).
 * 8. Enforces independent classification and HTTP 403 rejection at GET /api/v1/edutube/video/:videoId.
 * 9. Evaluates precision, recall, false-positive rate, and false-negative rate on a labeled benchmark dataset.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  educationalClassifierService,
  EducationalClassifierService,
  CLASSIFIER_VERSION,
  CLASSIFIER_REASON_CODES,
  YOUTUBE_CATEGORIES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";
import { edutubeCacheService } from "../src/modules/edutube/services/edutube-cache.service.js";

describe("EduTube Strict Education-Only Filtering & Classification Suite", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    edutubeCacheService.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    edutubeCacheService.clear();
  });

  // =========================================================================
  // SECTION 1: HARD BLOCKING ENTERTAINMENT & MUSIC VIDEOS
  // =========================================================================
  describe("Section 1: Hard Block Entertainment, Music & Media", () => {
    it("1. blocks official music videos, songs, and lyric videos", () => {
      const musicCases = [
        {
          videoId: "music_1",
          title: "Taylor Swift - Anti-Hero (Official Music Video)",
          description: "Stream the new single now.",
          channelTitle: "TaylorSwiftVEVO",
          categoryId: YOUTUBE_CATEGORIES.MUSIC,
          duration: { seconds: 320 },
        },
        {
          videoId: "music_2",
          title: "The Weeknd - Blinding Lights (Official Audio)",
          description: "Listen to Blinding Lights.",
          channelTitle: "The Weeknd",
          categoryId: YOUTUBE_CATEGORIES.MUSIC,
          duration: { seconds: 200 },
        },
        {
          videoId: "music_3",
          title: "Adele - Easy On Me (Lyric Video)",
          description: "Official lyric video for Easy On Me.",
          channelTitle: "Adele",
          categoryId: YOUTUBE_CATEGORIES.MUSIC,
          duration: { seconds: 215 },
        },
        {
          videoId: "music_4",
          title: "Drake feat. 21 Savage - Rich Flex (Audio)",
          description: "Her Loss album track.",
          channelTitle: "Drake",
          categoryId: YOUTUBE_CATEGORIES.MUSIC,
          duration: { seconds: 240 },
        },
      ];

      for (const item of musicCases) {
        const result = educationalClassifierService.classifyVideo(item);
        expect(result.decision).toBe("reject");
        expect(result.contentType).toBe("music");
        expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_MUSIC);
        expect(result.educationalRelevance).toBeLessThan(30);
      }
    });

    it("2. blocks movie trailers, teasers, and film clips", () => {
      const movieCases = [
        {
          videoId: "trailer_1",
          title: "Marvel Studios' Avengers: Secret Wars | Official Teaser Trailer",
          description: "In theaters May 2027.",
          channelTitle: "Marvel Entertainment",
          categoryId: YOUTUBE_CATEGORIES.FILM_ANIMATION,
          duration: { seconds: 150 },
        },
        {
          videoId: "clip_1",
          title: "The Dark Knight - Hospital Explosion Scene (4K 60FPS)",
          description: "Iconic Joker scene.",
          channelTitle: "MovieClips",
          categoryId: YOUTUBE_CATEGORIES.FILM_ANIMATION,
          duration: { seconds: 280 },
        },
        {
          videoId: "clip_2",
          title: "Oppenheimer - Trinity Test Climax Scene 4K",
          description: "Dramatic countdown sequence.",
          channelTitle: "Universal Pictures",
          categoryId: YOUTUBE_CATEGORIES.ENTERTAINMENT,
          duration: { seconds: 360 },
        },
      ];

      for (const item of movieCases) {
        const result = educationalClassifierService.classifyVideo(item);
        expect(result.decision).toBe("reject");
        expect(["movie_clip", "entertainment"]).toContain(result.contentType);
        expect(result.educationalRelevance).toBeLessThan(30);
      }
    });

    it("3. blocks comedy sketches, celebrity gossip, and prank vlogs", () => {
      const comedyCases = [
        {
          videoId: "prank_1",
          title: "Fake Apple Store Prank in NYC (GONE WRONG)",
          description: "Hilarious prank compilation with friends.",
          channelTitle: "Pranksters Hub",
          categoryId: YOUTUBE_CATEGORIES.COMEDY,
          duration: { seconds: 720 },
        },
        {
          videoId: "gossip_1",
          title: "Hollywood Celebrity Gossip & Red Carpet Drama Breakdown",
          description: "All the trending rumors this week.",
          channelTitle: "PopCulture Buzz",
          categoryId: YOUTUBE_CATEGORIES.ENTERTAINMENT,
          duration: { seconds: 600 },
        },
        {
          videoId: "vlog_1",
          title: "A Day in My Life as an Influencer in LA | Daily Vlog #42",
          description: "Shopping, matcha latte, and morning routine.",
          channelTitle: "Lifestyle Diary",
          categoryId: YOUTUBE_CATEGORIES.PEOPLE_BLOGS,
          duration: { seconds: 900 },
        },
      ];

      for (const item of comedyCases) {
        const result = educationalClassifierService.classifyVideo(item);
        expect(result.decision).toBe("reject");
        expect(result.contentType).toBe("entertainment");
        expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_PRANK_VLOG);
      }
    });

    it("4. blocks unrelated gameplay walkthroughs and esports montages", () => {
      const gameItem = {
        videoId: "game_1",
        title: "Elden Ring Shadow of the Erdtree - Full Gameplay Walkthrough Part 1",
        description: "Let's play Elden Ring with no commentary on PS5.",
        channelTitle: "Gamer Walkthroughs",
        categoryId: YOUTUBE_CATEGORIES.GAMING,
        duration: { seconds: 3600 },
      };

      const result = educationalClassifierService.classifyVideo(gameItem);
      expect(result.decision).toBe("reject");
      expect(result.contentType).toBe("unrelated_gaming");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_UNRELATED_GAMING);
    });
  });

  // =========================================================================
  // SECTION 2: YOUTUBE SHORTS & SHORT-FORM ENTERTAINMENT
  // =========================================================================
  describe("Section 2: YouTube Shorts & Duration Constraints", () => {
    it("5. detects explicit /shorts/ URL and blocks with HARD_BLOCK_SHORTS", () => {
      const shortVideo = {
        videoId: "short_vid_url",
        title: "Quick Python loop",
        youtubeUrl: "https://www.youtube.com/shorts/short_vid_url",
        duration: { seconds: 45 },
      };

      const result = educationalClassifierService.classifyVideo(shortVideo);
      expect(result.decision).toBe("reject");
      expect(result.contentType).toBe("short_form");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });

    it("6. detects #shorts tags and titles", () => {
      const shortByTag = {
        videoId: "short_vid_tag",
        title: "CSS trick you didn't know",
        tags: ["css", "#shorts", "codingtips"],
        duration: { seconds: 55 },
      };

      const result = educationalClassifierService.classifyVideo(shortByTag);
      expect(result.decision).toBe("reject");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });

    it("7. rejects duration strictly below 120s threshold", () => {
      const quickVideo = {
        videoId: "quick_tip",
        title: "Docker container command quick glance",
        duration: { seconds: 110 },
      };

      const result = educationalClassifierService.classifyVideo(quickVideo);
      expect(result.decision).toBe("reject");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_DURATION_BELOW_MINIMUM);
    });
  });

  // =========================================================================
  // SECTION 3: KEYWORD MISUSE & MISLEADING METADATA
  // =========================================================================
  describe("Section 3: Keyword Stuffing & Misleading Metadata", () => {
    it("8. rejects entertainment videos attempting SEO keyword stuffing", () => {
      const deceptiveCases = [
        {
          videoId: "fake_edu_1",
          title: "Taylor Swift Official Music Video (Learn Python Full Course for Beginners)",
          description: "Watch the new pop music video while you learn coding.",
          channelTitle: "TaylorSwiftVEVO",
          categoryId: YOUTUBE_CATEGORIES.MUSIC,
          duration: { seconds: 240 },
        },
        {
          videoId: "fake_edu_2",
          title: "Spider-Man Official Movie Trailer - Harvard CS50 Complete Tutorial 2026",
          description: "Exclusive trailer drop with coding keywords.",
          channelTitle: "Sony Pictures",
          categoryId: YOUTUBE_CATEGORIES.FILM_ANIMATION,
          duration: { seconds: 180 },
        },
        {
          videoId: "fake_edu_3",
          title: "Crazy Public Prank Video (Step by Step Machine Learning Masterclass)",
          description: "Pranking strangers in the mall full course.",
          channelTitle: "Prank Channel",
          categoryId: YOUTUBE_CATEGORIES.COMEDY,
          duration: { seconds: 600 },
        },
      ];

      for (const deceptive of deceptiveCases) {
        const result = educationalClassifierService.classifyVideo(deceptive);
        expect(result.decision).toBe("reject");
        expect(result.contentType).toBe("misleading_metadata");
        expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_KEYWORD_MISUSE);
        expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_CONFLICTING_SIGNALS);
      }
    });
  });

  // =========================================================================
  // SECTION 4: CONTEXTUAL EXCEPTIONS
  // =========================================================================
  describe("Section 4: Contextual Educational Exceptions", () => {
    it("9. allows genuine music theory & acoustic engineering lectures", () => {
      const musicTheoryVideo = {
        videoId: "music_theory_1",
        title: "Music Theory for Beginners - Scales, Chords and Intervals Lecture",
        description: "Comprehensive university music theory breakdown of the circle of fifths.",
        channelTitle: "Music Theory Academy",
        categoryId: YOUTUBE_CATEGORIES.EDUCATION,
        duration: { seconds: 2400 },
      };

      const result = educationalClassifierService.classifyVideo(musicTheoryVideo);
      expect(result.decision).toBe("allow");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.CONTEXTUAL_EXCEPTION_APPROVED);
      expect(result.educationalRelevance).toBeGreaterThanOrEqual(70);
    });

    it("10. allows genuine film editing and 3D animation software courses", () => {
      const filmEditingVideo = {
        videoId: "film_edit_1",
        title: "Premiere Pro Full Course - Complete Video Editing Tutorial for Beginners",
        description: "Learn timeline trimming, keyframing, and color grading in Premiere Pro.",
        channelTitle: "Creative Academy",
        categoryId: YOUTUBE_CATEGORIES.HOWTO_STYLE,
        duration: { seconds: 3600 },
      };

      const result = educationalClassifierService.classifyVideo(filmEditingVideo);
      expect(result.decision).toBe("allow");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.CONTEXTUAL_EXCEPTION_APPROVED);
      expect(result.educationalRelevance).toBeGreaterThanOrEqual(70);
    });

    it("11. allows genuine game engine development in C++ / Unity", () => {
      const gameDevVideo = {
        videoId: "game_dev_1",
        title: "Game Development from Scratch in C++ and OpenGL - Architecture Course",
        description: "Build a custom 3D game engine, rendering pipeline, and entity component system.",
        channelTitle: "Cherno",
        categoryId: YOUTUBE_CATEGORIES.SCIENCE_TECH,
        duration: { seconds: 4800 },
      };

      const result = educationalClassifierService.classifyVideo(gameDevVideo);
      expect(result.decision).toBe("allow");
      expect(result.reasonCodes).toContain(CLASSIFIER_REASON_CODES.CONTEXTUAL_EXCEPTION_APPROVED);
      expect(result.educationalRelevance).toBeGreaterThanOrEqual(70);
    });
  });

  // =========================================================================
  // SECTION 5: GENUINE PROGRAMMING & ACADEMIC COURSES
  // =========================================================================
  describe("Section 5: Genuine Educational & Academic Content", () => {
    it("12. approves verified CS50, MIT OCW, and FreeCodeCamp programming tutorials", () => {
      const educationalLectures = [
        {
          videoId: "cs50_1",
          title: "CS50 2026 - Lecture 3: Algorithms (Full Harvard Course)",
          description: "David J. Malan introduces sorting algorithms, Big-O notation, and recursion.",
          channelTitle: "CS50",
          categoryId: YOUTUBE_CATEGORIES.EDUCATION,
          duration: { seconds: 7200 },
          embeddable: true,
        },
        {
          videoId: "mit_1",
          title: "MIT 18.06 Linear Algebra, Spring 2026 - Lecture 1",
          description: "Gilbert Strang introduces vector spaces and matrix geometry.",
          channelTitle: "MIT OpenCourseWare",
          categoryId: YOUTUBE_CATEGORIES.EDUCATION,
          duration: { seconds: 3000 },
          embeddable: true,
        },
        {
          videoId: "fcc_1",
          title: "Full Stack Web Development with Next.js 15, PostgreSQL & Docker - Full Course",
          description: "Build and deploy production-ready full stack microservice application.",
          channelTitle: "freeCodeCamp.org",
          categoryId: YOUTUBE_CATEGORIES.SCIENCE_TECH,
          duration: { seconds: 14400 },
          embeddable: true,
        },
      ];

      for (const lecture of educationalLectures) {
        const result = educationalClassifierService.classifyVideo(lecture);
        expect(result.decision).toBe("allow");
        expect(result.educationalRelevance).toBeGreaterThanOrEqual(80);
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result.classifierVersion).toBe(CLASSIFIER_VERSION);
      }
    });
  });

  // =========================================================================
  // SECTION 6: API ENTRY POINT ENFORCEMENT & DIRECT PLAYBACK RESTRICTION
  // =========================================================================
  describe("Section 6: API Entry Point Enforcement", () => {
    it("13. rejects direct video details request for blocked music video with HTTP 403", async () => {
      const mockBlockedVideo = {
        items: [
          {
            id: "blocked-music-id",
            snippet: {
              title: "Drake - God's Plan (Official Music Video)",
              description: "Music video.",
              channelTitle: "DrakeVEVO",
              channelId: "UC_drake",
              publishedAt: "2026-01-01T00:00:00Z",
              tags: ["drake", "rap", "music video"],
              categoryId: "10",
              thumbnails: { high: { url: "https://img.youtube.com/thumb.jpg" } },
            },
            contentDetails: { duration: "PT5M30S" },
            statistics: { viewCount: "100000000" },
            status: { embeddable: true, privacyStatus: "public" },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockBlockedVideo,
      });

      const res = await request(app).get("/api/v1/edutube/video/blocked-music-id");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.data.allowed).toBe(false);
      expect(res.body.data.decision).toBe("reject");
      expect(res.body.data.reasonCodes).toContain("HARD_BLOCK_MUSIC");
      expect(res.body.data.classifierVersion).toBe(CLASSIFIER_VERSION);
    });

    it("14. serves approved educational video with HTTP 200 and classification payload", async () => {
      const mockApprovedVideo = {
        items: [
          {
            id: "approved-cs-video",
            snippet: {
              title: "Computer Science 101: Graph Algorithms Tutorial",
              description: "Breadth-first search and Dijkstra's algorithm explained step by step.",
              channelTitle: "freeCodeCamp.org",
              channelId: "UC_fcc",
              publishedAt: "2026-02-01T00:00:00Z",
              tags: ["algorithms", "graphs", "computer science"],
              categoryId: "27",
              thumbnails: { high: { url: "https://img.youtube.com/high.jpg" } },
            },
            contentDetails: { duration: "PT45M0S" },
            statistics: { viewCount: "150000" },
            status: { embeddable: true, privacyStatus: "public" },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApprovedVideo,
      });

      const res = await request(app).get("/api/v1/edutube/video/approved-cs-video");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.allowed).toBe(true);
      expect(res.body.data.video.videoId).toBe("approved-cs-video");
      expect(res.body.data.video.educationalScore).toBeGreaterThanOrEqual(75);
    });

    it("15. records user classification report via POST /api/v1/edutube/report", async () => {
      const res = await request(app)
        .post("/api/v1/edutube/report")
        .send({
          videoId: "test_report_id",
          feedbackType: "false_positive",
          reason: "Legitimate robotics engineering lecture incorrectly blocked",
          notes: "University lecture on forward kinematics",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.acknowledged).toBe(true);
      expect(res.body.data.report.videoId).toBe("test_report_id");
      expect(res.body.data.report.feedbackType).toBe("false_positive");
    });
  });

  // =========================================================================
  // SECTION 7: LABELED BENCHMARK DATASET & STATISTICAL METRICS EVALUATION
  // =========================================================================
  describe("Section 7: Benchmark Dataset & Evaluation Metrics", () => {
    it("16. achieves >=95% precision, >=90% recall, <5% FPR, <5% FNR on labeled dataset", () => {
      // 20 labeled items (10 true educational, 10 true entertainment/shorts)
      const labeledDataset = [
        // Educational (Label: true)
        {
          label: true,
          video: {
            videoId: "eval_edu_1",
            title: "JavaScript Full Course for Beginners",
            description: "Learn JavaScript programming from scratch in this complete course.",
            channelTitle: "freeCodeCamp.org",
            categoryId: "27",
            duration: { seconds: 12000 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_2",
            title: "Python Crash Course - Hands-on Project",
            description: "Fast-paced introduction to Python syntax and data structures.",
            channelTitle: "Programming with Mosh",
            categoryId: "28",
            duration: { seconds: 3600 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_3",
            title: "Calculus 1 - Full University Course on Derivatives & Integrals",
            description: "College level mathematics lecture series.",
            channelTitle: "Khan Academy",
            categoryId: "27",
            duration: { seconds: 7200 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_4",
            title: "System Design Interview: How to Design WhatsApp",
            description: "Distributed messaging architecture, websockets, and Cassandra.",
            channelTitle: "ByteByteGo",
            categoryId: "28",
            duration: { seconds: 1500 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_5",
            title: "Docker and Kubernetes Tutorial for Beginners [FULL COURSE]",
            description: "Containerization, pods, deployments, and cluster setup.",
            channelTitle: "TechWorld with Nana",
            categoryId: "28",
            duration: { seconds: 9000 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_6",
            title: "Data Structures Easy to Advanced Course - Full Tutorial from A to Z",
            description: "Trees, graphs, heaps, dynamic programming explained with animations.",
            channelTitle: "freeCodeCamp",
            categoryId: "27",
            duration: { seconds: 28800 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_7",
            title: "MIT 6.006 Introduction to Algorithms, Fall 2026 - Lecture 1",
            description: "Algorithmic complexity, asymptotic bounds, and peak finding.",
            channelTitle: "MIT OpenCourseWare",
            categoryId: "27",
            duration: { seconds: 3200 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_8",
            title: "React 19 & Next.js 15 Full Tutorial - Build a SaaS Platform",
            description: "Server actions, server components, and responsive UI design.",
            channelTitle: "Traversy Media",
            categoryId: "28",
            duration: { seconds: 5400 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_9",
            title: "Neural Networks from Scratch in Python - Deep Learning Math",
            description: "Backpropagation, gradient descent, and matrix operations.",
            channelTitle: "Sentdex",
            categoryId: "28",
            duration: { seconds: 4200 },
          },
        },
        {
          label: true,
          video: {
            videoId: "eval_edu_10",
            title: "AWS Certified Solutions Architect Associate (SAA-C03) - Full Prep Course",
            description: "Complete preparation for AWS cloud certification exam.",
            channelTitle: "freeCodeCamp.org",
            categoryId: "27",
            duration: { seconds: 36000 },
          },
        },

        // Entertainment / Blocked (Label: false)
        {
          label: false,
          video: {
            videoId: "eval_ent_1",
            title: "Justin Bieber - Peaches ft. Daniel Caesar (Official Music Video)",
            description: "Justice album out now.",
            channelTitle: "JustinBieberVEVO",
            categoryId: "10",
            duration: { seconds: 210 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_2",
            title: "Deadpool & Wolverine | Official Teaser Trailer | In Theaters",
            description: "Marvel Studios blockbuster trailer.",
            channelTitle: "Marvel Entertainment",
            categoryId: "1",
            duration: { seconds: 140 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_3",
            title: "Extreme Hide and Seek in Mega Mansion! (PRANK)",
            description: "Last to be found wins $10,000 challenge.",
            channelTitle: "MrBeast Gaming",
            categoryId: "24",
            duration: { seconds: 900 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_4",
            title: "GTA 6 Gameplay Walkthrough Part 1 - First Impressions",
            description: "Exploring Vice City in 4K 60FPS.",
            channelTitle: "IGN",
            categoryId: "20",
            duration: { seconds: 2400 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_5",
            title: "Celebrity Red Carpet Drama & Fashion Fails Breakdown",
            description: "Gossip and drama from the Oscars afterparty.",
            channelTitle: "Hollywood Buzz",
            categoryId: "24",
            duration: { seconds: 750 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_6",
            title: "Dua Lipa - Levitating (Official Lyric Video)",
            description: "Future Nostalgia lyric video.",
            channelTitle: "Dua Lipa",
            categoryId: "10",
            duration: { seconds: 205 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_7",
            title: "Quick Python tip #shorts",
            description: "One line trick.",
            channelTitle: "Shorts Channel",
            categoryId: "28",
            duration: { seconds: 45 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_8",
            title: "Taylor Swift Lyric Video (Coding Tutorial for Beginners)",
            description: "Fake educational title.",
            channelTitle: "Music Lover",
            categoryId: "10",
            duration: { seconds: 230 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_9",
            title: "Fast & Furious 11 - Car Chase Scene 4K HD",
            description: "High speed action clip.",
            channelTitle: "MovieClips",
            categoryId: "1",
            duration: { seconds: 320 },
          },
        },
        {
          label: false,
          video: {
            videoId: "eval_ent_10",
            title: "Stand Up Comedy Special: Living in NYC Hilarious Moments",
            description: "Full comedy club routine.",
            channelTitle: "Comedy Club",
            categoryId: "23",
            duration: { seconds: 1800 },
          },
        },
      ];

      let truePositives = 0;
      let falsePositives = 0;
      let trueNegatives = 0;
      let falseNegatives = 0;

      for (const { label, video } of labeledDataset) {
        const result = educationalClassifierService.classifyVideo(video);
        const predictedAllowed = result.decision === "allow";

        if (label === true && predictedAllowed === true) {
          truePositives++;
        } else if (label === false && predictedAllowed === true) {
          falsePositives++;
        } else if (label === false && predictedAllowed === false) {
          trueNegatives++;
        } else if (label === true && predictedAllowed === false) {
          falseNegatives++;
        }
      }

      const precision = truePositives / (truePositives + falsePositives);
      const recall = truePositives / (truePositives + falseNegatives);
      const falsePositiveRate = falsePositives / (falsePositives + trueNegatives);
      const falseNegativeRate = falseNegatives / (falseNegatives + truePositives);

      // Assertions
      expect(precision).toBeGreaterThanOrEqual(0.95); // 100% precision
      expect(recall).toBeGreaterThanOrEqual(0.90); // 100% recall
      expect(falsePositiveRate).toBeLessThan(0.05); // 0% FPR
      expect(falseNegativeRate).toBeLessThan(0.05); // 0% FNR
    });
  });
});
