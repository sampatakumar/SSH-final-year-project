import { describe, it, expect } from "vitest";
import { extractResumeEvidence } from "../src/services/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../src/services/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../src/services/adapters/codingEvidenceAdapter.js";
import {
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
  validateSkillEvidence,
} from "../src/services/adapters/contracts/skillEvidenceContract.js";

describe("Skill Evidence Adapters & Contract Validation", () => {
  const dummyUserId = "64f1a2b3c4d5e6f7a8b9c0d1";

  describe("1. Resume Evidence Adapter", () => {
    it("extracts claimed skill evidence from user profile skill buckets", () => {
      const userProfile = {
        skillLanguages: ["javascript", "typescript"],
        skillFrameworks: ["react.js", "nextjs"],
        skillTools: ["docker", "git"],
        skillLibraries: ["redux"],
        projects: [
          {
            title: "Student Portal",
            technologies: ["React", "Node.js"],
            bullets: ["Built responsive frontend with React and TypeScript"],
          },
        ],
      };

      const pkg = extractResumeEvidence({ userId: dummyUserId, userProfile, resumeId: "res_123" });

      expect(pkg.source).toBe(EVIDENCE_SOURCES.RESUME);
      expect(pkg.userId).toBe(dummyUserId);
      expect(pkg.metadata.resumeId).toBe("res_123");

      const reactSkill = pkg.skills.find((s) => s.canonicalName === "React");
      expect(reactSkill).toBeDefined();
      expect(reactSkill.evidenceType).toBe(EVIDENCE_TYPES.CLAIMED);
      expect(reactSkill.category).toBe("Frontend Frameworks & Libraries");
      // Backed by project, so confidence should be higher than base 0.60
      expect(reactSkill.confidence).toBeGreaterThan(0.60);
      expect(reactSkill.confidence).toBeLessThanOrEqual(0.75);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("handles empty / missing resume profile gracefully", () => {
      const pkg = extractResumeEvidence({ userId: dummyUserId, userProfile: {} });
      expect(pkg.source).toBe(EVIDENCE_SOURCES.RESUME);
      expect(pkg.skills).toEqual([]);
      expect(pkg.userId).toBe(dummyUserId);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("throws error when userId is missing", () => {
      expect(() => extractResumeEvidence({ userProfile: {} })).toThrow(/userId/);
    });
  });

  describe("2. GitHub Evidence Adapter", () => {
    it("extracts observed project evidence from GitHub analysis data", () => {
      const githubData = {
        username: "johndoe",
        profile: { publicRepos: 5 },
        repositories: [
          { name: "web-app", language: "TypeScript", stars: 10, sizeKB: 400, fork: false },
          { name: "api-service", language: "JavaScript", stars: 4, sizeKB: 250, fork: false },
          { name: "forked-lib", language: "Go", stars: 0, sizeKB: 50, fork: true },
        ],
        languages: {
          TypeScript: { size: 400000, percentage: 57.1, repoCount: 1 },
          JavaScript: { size: 250000, percentage: 35.7, repoCount: 1 },
          Go: { size: 50000, percentage: 7.2, repoCount: 1 },
        },
        dominantLanguage: "TypeScript",
        aggregateStats: { totalStars: 14 },
      };

      const pkg = extractGitHubEvidence({ userId: dummyUserId, githubData });

      expect(pkg.source).toBe(EVIDENCE_SOURCES.GITHUB);
      expect(pkg.userId).toBe(dummyUserId);
      expect(pkg.metadata.githubUsername).toBe("johndoe");

      const tsSkill = pkg.skills.find((s) => s.canonicalName === "TypeScript");
      expect(tsSkill).toBeDefined();
      expect(tsSkill.evidenceType).toBe(EVIDENCE_TYPES.OBSERVED_PROJECT);
      expect(tsSkill.signals.originalRepoCount).toBe(1);
      expect(tsSkill.confidence).toBeGreaterThanOrEqual(0.70);
      expect(tsSkill.confidence).toBeLessThanOrEqual(0.85);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("handles empty GitHub repositories data gracefully", () => {
      const pkg = extractGitHubEvidence({ userId: dummyUserId, githubData: {} });
      expect(pkg.source).toBe(EVIDENCE_SOURCES.GITHUB);
      expect(pkg.skills).toEqual([]);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("throws error when userId is missing", () => {
      expect(() => extractGitHubEvidence({ githubData: {} })).toThrow(/userId/);
    });
  });

  describe("3. Coding Evidence Adapter", () => {
    it("extracts practical assessment evidence from coding submission records", () => {
      const submissions = [
        {
          taskId: "two-sum",
          title: "Two Sum",
          language: "javascript",
          status: "passed",
          score: 20,
          maxScore: 20,
          passed: 5,
          total: 5,
          executionTimeMs: 38,
          skillsCovered: ["Arrays", "Hash Maps", "Problem Solving"],
        },
        {
          taskId: "array-chunking",
          title: "Array Chunking",
          language: "javascript",
          status: "passed",
          score: 10,
          maxScore: 10,
          passed: 4,
          total: 4,
          executionTimeMs: 25,
          skillsCovered: ["Arrays", "Problem Solving"],
        },
      ];

      const pkg = extractCodingEvidence({ userId: dummyUserId, submissions });

      expect(pkg.source).toBe(EVIDENCE_SOURCES.CODING);
      expect(pkg.userId).toBe(dummyUserId);

      const arraySkill = pkg.skills.find((s) => s.canonicalName === "Arrays");
      expect(arraySkill).toBeDefined();
      expect(arraySkill.evidenceType).toBe(EVIDENCE_TYPES.PRACTICAL_ASSESSMENT);
      expect(arraySkill.signals.problemsSolved).toBe(2);
      expect(arraySkill.signals.passRate).toBe(1);
      // Two distinct passed problems should yield high confidence
      expect(arraySkill.confidence).toBeGreaterThanOrEqual(0.85);
      expect(arraySkill.confidence).toBeLessThanOrEqual(0.95);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("assigns lower confidence when attempted problems failed", () => {
      const submissions = [
        {
          taskId: "two-sum",
          title: "Two Sum",
          status: "failed",
          passed: 1,
          total: 5,
          skillsCovered: ["Hash Maps"],
        },
      ];

      const pkg = extractCodingEvidence({ userId: dummyUserId, submissions });
      const hashMapSkill = pkg.skills.find((s) => s.canonicalName === "Hash Maps");
      expect(hashMapSkill).toBeDefined();
      expect(hashMapSkill.confidence).toBeLessThan(0.50);
      expect(hashMapSkill.signals.problemsSolved).toBe(0);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("handles empty submissions list gracefully", () => {
      const pkg = extractCodingEvidence({ userId: dummyUserId, submissions: [] });
      expect(pkg.source).toBe(EVIDENCE_SOURCES.CODING);
      expect(pkg.skills).toEqual([]);

      const validation = validateSkillEvidence(pkg);
      expect(validation.isValid).toBe(true);
    });

    it("throws error when userId is missing", () => {
      expect(() => extractCodingEvidence({ submissions: [] })).toThrow(/userId/);
    });
  });

  describe("4. Ownership Propagation & Evidence Contract Security", () => {
    it("guarantees ownership matches canonical userId across all adapter outputs", () => {
      const resumePkg = extractResumeEvidence({ userId: dummyUserId, userProfile: { skillLanguages: ["js"] } });
      const githubPkg = extractGitHubEvidence({ userId: dummyUserId, githubData: { dominantLanguage: "JavaScript" } });
      const codingPkg = extractCodingEvidence({
        userId: dummyUserId,
        submissions: [{ taskId: "t1", status: "passed", skillsCovered: ["Arrays"] }],
      });

      expect(resumePkg.userId).toBe(dummyUserId);
      expect(githubPkg.userId).toBe(dummyUserId);
      expect(codingPkg.userId).toBe(dummyUserId);

      expect(resumePkg.contractVersion).toBe("1.0.0");
      expect(githubPkg.contractVersion).toBe("1.0.0");
      expect(codingPkg.contractVersion).toBe("1.0.0");
    });
  });
});
