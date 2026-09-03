import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  analyzeSkillGaps,
  GAP_STATUSES,
  GAP_PRIORITIES,
} from "../src/modules/gaps/services/skillGap.service.js";
import {
  TARGET_ROLES,
  ROLE_REQUIREMENTS,
} from "../src/modules/gaps/benchmarks/roleRequirements.js";
import { evaluateEvidencePackages } from "../src/modules/skills/services/evaluation.engine.js";
import { extractResumeEvidence } from "../src/modules/resume/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../src/modules/coding/adapters/codingEvidenceAdapter.js";

describe("Step 6: Gap Analysis Module Verification Suite", () => {
  const dummyUserId = "64f1a2b3c4d5e6f7a8b9c0d1";

  // 1. Valid Target Role & Gap Detection
  describe("Role Benchmarking & Gap Detection", () => {
    it("1. analyzes skill gaps against valid target role (Full Stack Developer)", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient", category: "Languages" },
        { canonicalName: "React", score: 80, level: "Proficient", category: "Frontend" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.targetRole).toBe("Full Stack Developer");
      expect(result.totalRequiredSkills).toBeGreaterThanOrEqual(10);
      expect(result.metSkillsCount).toBe(2);
      expect(result.gapsCount).toBeGreaterThan(0);
    });

    it("2. falls back safely or handles invalid target role without crashing", () => {
      const evaluatedSkills = [{ canonicalName: "JavaScript", score: 80, level: "Proficient" }];
      const result = analyzeSkillGaps(evaluatedSkills, "NonExistentRole123");
      expect(result).toBeDefined();
      expect(result.targetRole).toBe("Full Stack Developer");
    });
  });

  // 2. Missing vs Weak Skill Classification
  describe("Missing vs Weak Skill Classification", () => {
    it("3. correctly classifies completely undetected skills as Missing", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      const missingNode = result.gaps.find((g) => g.canonicalName === "Node.js");

      expect(missingNode).toBeDefined();
      expect(missingNode.status).toBe(GAP_STATUSES.MISSING);
      expect(missingNode.currentScore).toBe(0);
      expect(missingNode.currentLevel).toBe("None");
    });

    it("4. correctly classifies sub-benchmark skills as Weak / Action Required", () => {
      const evaluatedSkills = [
        { canonicalName: "Docker", score: 25, level: "Limited Evidence" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      const weakDocker = result.gaps.find((g) => g.canonicalName === "Docker");

      expect(weakDocker).toBeDefined();
      expect(weakDocker.status).toBe(GAP_STATUSES.WEAK);
      expect(weakDocker.currentScore).toBe(25);
      expect(weakDocker.currentLevel).toBe("Limited Evidence");
    });

    it("5 & 6 & 7. correctly classifies skills meeting or exceeding benchmark as Met Requirement", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 95, level: "Strong Evidence" }, // Above
        { canonicalName: "React", score: 75, level: "Proficient" },           // Exactly at
        { canonicalName: "TypeScript", score: 65, level: "Competent" },        // Exactly at
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.metSkills.some((s) => s.canonicalName === "JavaScript")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "React")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "TypeScript")).toBe(true);
      expect(result.gaps.some((g) => g.canonicalName === "JavaScript")).toBe(false);
    });
  });

  // 3. Priority Calculation & Multiple Gaps
  describe("Priority Hierarchy & Multiple Gaps", () => {
    it("8 & 9 & 10. calculates critical, high, medium, and low priorities and sorts them deterministically", () => {
      const evaluatedSkills = [
        { canonicalName: "TypeScript", score: 25, level: "Limited Evidence" },
        { canonicalName: "Docker", score: 25, level: "Limited Evidence" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.gaps.length).toBeGreaterThan(5);

      // Verify sorting: Critical -> High -> Medium -> Low
      const priorities = result.gaps.map((g) => g.priority);
      const priorityOrder = {
        [GAP_PRIORITIES.CRITICAL]: 0,
        [GAP_PRIORITIES.HIGH]: 1,
        [GAP_PRIORITIES.MEDIUM]: 2,
        [GAP_PRIORITIES.LOW]: 3,
      };

      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(priorityOrder[priorities[i + 1]]);
      }
    });
  });

  // 4. Canonical Skill Normalization & Aliases
  describe("Taxonomy Normalization in Gap Engine", () => {
    it("11 & 12. normalizes alias inputs ('js', 'react.js') to canonical role requirement matches", () => {
      const evaluatedSkills = [
        { canonicalName: "js", score: 85, level: "Proficient" },
        { canonicalName: "react.js", score: 80, level: "Proficient" },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      expect(result.metSkills.some((s) => s.canonicalName === "JavaScript")).toBe(true);
      expect(result.metSkills.some((s) => s.canonicalName === "React")).toBe(true);
    });
  });

  // 5. Edge Cases & Missing Skill Profile
  describe("Edge Cases & Empty Profile", () => {
    it("13 & 14. handles empty evaluated skills array by marking all role skills as missing", () => {
      const result = analyzeSkillGaps([], TARGET_ROLES.FRONTEND_ENGINEER);
      expect(result.roleMatchPercentage).toBe(0);
      expect(result.metSkillsCount).toBe(0);
      expect(result.gapsCount).toBe(result.totalRequiredSkills);
      expect(result.gaps.every((g) => g.status === GAP_STATUSES.MISSING)).toBe(true);
    });
  });

  // 6. Determinism & Benchmark Regression
  describe("Determinism & Benchmark Regression", () => {
    it("18. produces 100% identical gap analyses across repeated executions", () => {
      const evaluatedSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient" },
        { canonicalName: "React", score: 70, level: "Competent" },
      ];

      const run1 = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);
      const run2 = analyzeSkillGaps(evaluatedSkills, TARGET_ROLES.FULL_STACK_DEVELOPER);

      expect(run1.roleMatchPercentage).toBe(run2.roleMatchPercentage);
      expect(run1.gapsCount).toBe(run2.gapsCount);
      expect(run1.metSkillsCount).toBe(run2.metSkillsCount);
      expect(run1.gaps).toEqual(run2.gaps);
    });

    it("19. verifies benchmark requirements exist for all 4 supported target roles", () => {
      const supportedRoles = Object.values(TARGET_ROLES);
      expect(supportedRoles.length).toBe(4);

      for (const role of supportedRoles) {
        const config = ROLE_REQUIREMENTS[role];
        expect(config).toBeDefined();
        expect(config.roleName).toBe(role);
        expect(config.coreSkills.length).toBeGreaterThanOrEqual(5);
        expect(Array.isArray(config.recommendedSkills)).toBe(true);
      }
    });
  });

  // 7. End-to-End Pipeline: Real Evidence -> Skill Evaluation -> Gap Analysis
  describe("20. End-to-End Cross-Module Integration Pipeline", () => {
    it("consumes real Skill Profile from Skills module and computes accurate gaps", () => {
      // 1. Real Resume adapter output
      const resumePkg = extractResumeEvidence({
        userId: dummyUserId,
        userProfile: {
          skillLanguages: ["JavaScript", "TypeScript"],
          skillFrameworks: ["React"],
        },
      });

      // 2. Real GitHub adapter output
      const ghPkg = extractGitHubEvidence({
        userId: dummyUserId,
        githubData: {
          languages: { JavaScript: { size: 45000, percentage: 80, repoCount: 1 } },
          repositories: [{ name: "my-app", language: "JavaScript", fork: false, stars: 2 }],
        },
      });

      // 3. Real Coding adapter output
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

      // 4. Skills Module Evaluation
      const skillEvaluation = evaluateEvidencePackages([resumePkg, ghPkg, codingPkg]);
      expect(skillEvaluation.skillsCount).toBeGreaterThanOrEqual(3);

      // 5. Gaps Module Analysis
      const gapReport = analyzeSkillGaps(skillEvaluation.skills, TARGET_ROLES.FULL_STACK_DEVELOPER);

      expect(gapReport.targetRole).toBe("Full Stack Developer");
      expect(gapReport.metSkillsCount).toBeGreaterThanOrEqual(1); // JavaScript met
      expect(gapReport.gapsCount).toBeGreaterThan(0); // Node.js, MongoDB, REST APIs missing

      const jsMet = gapReport.metSkills.find((s) => s.canonicalName === "JavaScript");
      expect(jsMet).toBeDefined();
      expect(jsMet.currentScore).toBeGreaterThanOrEqual(75);

      const nodeGap = gapReport.gaps.find((g) => g.canonicalName === "Node.js");
      expect(nodeGap).toBeDefined();
      expect(nodeGap.status).toBe(GAP_STATUSES.MISSING);
    });
  });

  // 8. API Routes & Authentication
  describe("15 & 16 & 17. Gap Analysis API Routes & Security", () => {
    it("serves public GET /api/v1/gaps/roles endpoint", async () => {
      const res = await request(app).get("/api/v1/gaps/roles");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.roles)).toBe(true);
      expect(res.body.data.roles.length).toBe(4);
    });

    it("15. rejects unauthenticated GET /api/v1/gaps with 401", async () => {
      const res = await request(app).get("/api/v1/gaps");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("15. rejects unauthenticated POST /api/v1/gaps/analyze with 401", async () => {
      const res = await request(app).post("/api/v1/gaps/analyze").send({
        targetRole: "Full Stack Developer",
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
