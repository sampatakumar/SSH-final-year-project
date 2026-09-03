import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  generateRecommendations,
} from "../src/modules/recommendations/services/recommendation.service.js";
import { AUTHORITATIVE_DOCS } from "../src/modules/recommendations/catalog/documentationCatalog.js";
import { VERIFIED_CODING_TASKS } from "../src/modules/recommendations/catalog/taskMappings.js";
import { analyzeSkillGaps } from "../src/modules/gaps/services/skillGap.service.js";
import { evaluateEvidencePackages } from "../src/modules/skills/services/evaluation.engine.js";
import { extractResumeEvidence } from "../src/modules/resume/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../src/modules/coding/adapters/codingEvidenceAdapter.js";

describe("Step 7: Recommendations Module Verification Suite", () => {
  const dummyUserId = "64f1a2b3c4d5e6f7a8b9c0d1";

  // 1. Priority-Based Recommendations
  describe("Priority-Based Recommendations", () => {
    it("1 & 2 & 3 & 4. generates recommendations respecting Critical, High, Medium, and Low priorities", () => {
      const gaps = [
        { canonicalName: "Docker", priority: "Critical", status: "Missing", currentScore: 0, requiredLevel: "Developing" },
        { canonicalName: "TypeScript", priority: "High", status: "Weak", currentScore: 30, requiredLevel: "Competent" },
        { canonicalName: "Next.js", priority: "Medium", status: "Missing", currentScore: 0, requiredLevel: "Competent" },
        { canonicalName: "Jest", priority: "Low", status: "Missing", currentScore: 0, requiredLevel: "Developing" },
      ];

      const recommendations = generateRecommendations(gaps, "Full Stack Developer");
      expect(recommendations.length).toBe(4);

      // Verify priority ordering: Critical -> High -> Medium -> Low
      expect(recommendations[0].priority).toBe("Critical");
      expect(recommendations[1].priority).toBe("High");
      expect(recommendations[2].priority).toBe("Medium");
      expect(recommendations[3].priority).toBe("Low");

      expect(recommendations[0].skill).toBe("Docker");
      expect(recommendations[0].learningObjective).toContain("containerization");
      expect(recommendations[0].reasoning).toContain("Docker is required for Full Stack Developer");
    });
  });

  // 2. Missing vs Weak Skills & Met Skill Filtering
  describe("Gap Status Handling & Met Skill Filtering", () => {
    it("5 & 6. formulates appropriate actions for both Missing and Weak skills", () => {
      const gaps = [
        { canonicalName: "MongoDB", priority: "High", status: "Missing", currentScore: 0, requiredLevel: "Competent" },
        { canonicalName: "React", priority: "Critical", status: "Weak", currentScore: 35, requiredLevel: "Proficient" },
      ];

      const recommendations = generateRecommendations(gaps);
      const mongoRec = recommendations.find((r) => r.skill === "MongoDB");
      const reactRec = recommendations.find((r) => r.skill === "React");

      expect(mongoRec).toBeDefined();
      expect(mongoRec.gapStatus).toBe("Missing");
      expect(mongoRec.practicalAction).toContain("aggregation queries");

      expect(reactRec).toBeDefined();
      expect(reactRec.gapStatus).toBe("Weak");
      expect(reactRec.currentScore).toBe(35);
    });

    it("7. does not generate unnecessary recommendations for Met Requirement skills", () => {
      const mixedSkills = [
        { canonicalName: "JavaScript", priority: "None", status: "Met Requirement", currentScore: 90 },
        { canonicalName: "Docker", priority: "Critical", status: "Missing", currentScore: 0 },
      ];

      const recommendations = generateRecommendations(mixedSkills);
      expect(recommendations.length).toBe(1);
      expect(recommendations[0].skill).toBe("Docker");
      expect(recommendations.some((r) => r.skill === "JavaScript")).toBe(false);
    });
  });

  // 3. Official Documentation & Coding Task Mappings
  describe("Documentation & Coding Task Catalogs", () => {
    it("8. attaches verified official documentation URLs from the authoritative catalog", () => {
      const gaps = [
        { canonicalName: "React", priority: "High", status: "Missing" },
        { canonicalName: "Node.js", priority: "High", status: "Missing" },
        { canonicalName: "PostgreSQL", priority: "Medium", status: "Missing" },
      ];

      const recommendations = generateRecommendations(gaps);
      expect(recommendations[0].documentationUrl).toBe(AUTHORITATIVE_DOCS["React"]);
      expect(recommendations[1].documentationUrl).toBe(AUTHORITATIVE_DOCS["Node.js"]);
      expect(recommendations[2].documentationUrl).toBe(AUTHORITATIVE_DOCS["PostgreSQL"]);
    });

    it("9 & 10. maps coding skills to verified Sandbox platform tasks and provides safe fallback for non-coding skills", () => {
      const gaps = [
        { canonicalName: "Arrays", priority: "Critical", status: "Missing" },
        { canonicalName: "Stack", priority: "High", status: "Weak" },
        { canonicalName: "Git", priority: "Medium", status: "Missing" },
      ];

      const recommendations = generateRecommendations(gaps);

      const arraysRec = recommendations.find((r) => r.skill === "Arrays");
      expect(arraysRec.platformTaskId).toBe("two-sum");
      expect(arraysRec.platformTaskTitle).toBe("Two Sum");
      expect(arraysRec.practicalAction).toContain("Two Sum");

      const stackRec = recommendations.find((r) => r.skill === "Stack");
      expect(stackRec.platformTaskId).toBe("valid-parentheses");
      expect(stackRec.platformTaskTitle).toBe("Valid Parentheses");

      const gitRec = recommendations.find((r) => r.skill === "Git");
      expect(gitRec.platformTaskId).toBeNull();
      expect(gitRec.platformTaskTitle).toBeNull();
    });
  });

  // 4. Aliases, Deduplication & Edge Cases
  describe("Normalization, Deduplication & Empty Gaps", () => {
    it("11 & 15. normalizes skill aliases and prevents duplicate recommendations", () => {
      const gaps = [
        { canonicalName: "js", priority: "High", status: "Weak" },
        { canonicalName: "JavaScript", priority: "High", status: "Weak" },
        { canonicalName: "react.js", priority: "Critical", status: "Missing" },
        { canonicalName: "React", priority: "Critical", status: "Missing" },
      ];

      const recommendations = generateRecommendations(gaps);
      expect(recommendations.length).toBe(2);
      expect(recommendations.map((r) => r.skill)).toEqual(["React", "JavaScript"]);
    });

    it("14. produces 100% deterministic recommendation ordering across repeated runs", () => {
      const gaps = [
        { canonicalName: "Node.js", priority: "High", status: "Missing" },
        { canonicalName: "Docker", priority: "Critical", status: "Missing" },
        { canonicalName: "TypeScript", priority: "Medium", status: "Weak" },
      ];

      const run1 = generateRecommendations(gaps);
      const run2 = generateRecommendations(gaps);

      expect(run1).toEqual(run2);
      expect(run1[0].skill).toBe("Docker"); // Critical first
    });

    it("19. returns an empty array gracefully when gap list is empty", () => {
      const result = generateRecommendations([]);
      expect(result).toEqual([]);
    });
  });

  // 5. Cross-Module Pipeline: Skill Profile -> Gaps -> Recommendations
  describe("20. End-to-End Skill Profile -> Gaps -> Recommendations Pipeline", () => {
    it("executes the full intelligence pipeline and produces actionable roadmap recommendations", () => {
      // 1. Real Resume adapter output
      const resumePkg = extractResumeEvidence({
        userId: dummyUserId,
        userProfile: {
          skillLanguages: ["JavaScript"],
        },
      });

      // 2. Real Coding adapter output
      const codingPkg = extractCodingEvidence({
        userId: dummyUserId,
        submissions: [
          {
            taskId: "two-sum",
            title: "Two Sum",
            language: "javascript",
            status: "passed",
            score: 20,
            passed: 5,
            total: 5,
            skillsCovered: ["JavaScript", "Arrays"],
          },
        ],
      });

      // 3. Skills Module Evaluation
      const skillEval = evaluateEvidencePackages([resumePkg, codingPkg]);

      // 4. Gaps Module Analysis against Full Stack Developer
      const gapReport = analyzeSkillGaps(skillEval.skills, "Full Stack Developer");
      expect(gapReport.gaps.length).toBeGreaterThan(0);

      // 5. Recommendations Module
      const recommendations = generateRecommendations(gapReport.gaps, "Full Stack Developer");
      expect(recommendations.length).toBeGreaterThan(0);

      // Top recommendation must be a Critical gap (e.g. React, Node.js, REST APIs)
      expect(recommendations[0].priority).toBe("Critical");
      expect(recommendations[0].learningObjective).toBeDefined();
      expect(recommendations[0].documentationUrl).toBeDefined();
    });
  });

  // 6. API Routes & Authentication Security
  describe("16 & 17 & 18. Recommendations API Routes & Security", () => {
    it("17. serves public GET /api/v1/recommendations/skill/:skill endpoint", async () => {
      const res = await request(app).get("/api/v1/recommendations/skill/Docker");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendation.skill).toBe("Docker");
      expect(res.body.data.recommendation.documentationUrl).toBe("https://docs.docker.com/get-started/");
    });

    it("16. rejects unauthenticated GET /api/v1/recommendations with 401", async () => {
      const res = await request(app).get("/api/v1/recommendations");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("16. rejects unauthenticated GET /api/v1/recommendations/roadmap with 401", async () => {
      const res = await request(app).get("/api/v1/recommendations/roadmap");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
