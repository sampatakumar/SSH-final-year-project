import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  evaluateEvidencePackages,
  getProficiencyLevel,
  PROFICIENCY_LEVELS,
  EVALUATION_VERSION,
} from "../src/modules/skills/services/evaluation.engine.js";
import { extractResumeEvidence } from "../src/modules/resume/adapters/resumeEvidenceAdapter.js";
import { extractGitHubEvidence } from "../src/modules/github/adapters/githubEvidenceAdapter.js";
import { extractCodingEvidence } from "../src/modules/coding/adapters/codingEvidenceAdapter.js";
import {
  createSkillEvidencePackage,
  validateSkillEvidencePackage,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
} from "../src/shared/evidence/skillEvidenceContract.js";

describe("Phase 3 / Step 5: Skills Module Evaluation Engine & Verification Suite", () => {
  const dummyUserId = "64f1a2b3c4d5e6f7a8b9c0d1";

  // Helper fixture builders
  const createResumePackage = (skillsList) =>
    createSkillEvidencePackage({
      source: EVIDENCE_SOURCES.RESUME,
      userId: dummyUserId,
      skills: skillsList.map((name) => ({
        skill: name,
        canonicalName: name,
        category: "Programming Languages",
        evidenceType: EVIDENCE_TYPES.CLAIMED,
        confidence: 0.65,
        signals: { inSkillsSection: true, inProjects: true, inExperience: false, mentionsCount: 2 },
        observations: [`Claimed ${name} in resume skills and projects`],
      })),
    });

  const createGitHubPackage = (skillsList) =>
    createSkillEvidencePackage({
      source: EVIDENCE_SOURCES.GITHUB,
      userId: dummyUserId,
      skills: skillsList.map((name) => ({
        skill: name,
        canonicalName: name,
        category: "Programming Languages",
        evidenceType: EVIDENCE_TYPES.OBSERVED_PROJECT,
        confidence: 0.80,
        signals: { repoCount: 3, originalRepoCount: 2, totalBytes: 50000, starsCount: 8 },
        observations: [`Observed ${name} in 2 original repos with 50KB code`],
      })),
    });

  const createCodingPackage = (skillsList, isPassed = true) =>
    createSkillEvidencePackage({
      source: EVIDENCE_SOURCES.CODING,
      userId: dummyUserId,
      skills: skillsList.map((name) => ({
        skill: name,
        canonicalName: name,
        category: "Programming Languages",
        evidenceType: EVIDENCE_TYPES.PRACTICAL_ASSESSMENT,
        confidence: isPassed ? 0.90 : 0.40,
        signals: {
          problemsAttempted: 2,
          problemsSolved: isPassed ? 2 : 0,
          passRate: isPassed ? 1.0 : 0.0,
          totalTestCasesPassed: isPassed ? 10 : 2,
          totalTestCases: 10,
        },
        observations: [
          isPassed
            ? `Passed 2/2 coding tasks in ${name}`
            : `Attempted 2 coding tasks in ${name} but test cases failed`,
        ],
      })),
    });

  describe("1. Single-Source & Resume-Only Skill Evaluation", () => {
    it("evaluates resume-only skill respecting the 30 pts ceiling", () => {
      const resumePkg = createResumePackage(["CSS"]);
      const result = evaluateEvidencePackages([resumePkg]);

      const cssSkill = result.skills.find((s) => s.canonicalName === "CSS3");
      expect(cssSkill).toBeDefined();
      expect(cssSkill.sources).toEqual(["resume"]);
      expect(cssSkill.score).toBeGreaterThanOrEqual(20);
      expect(cssSkill.score).toBeLessThanOrEqual(30);
      expect(cssSkill.confidence).toBeLessThanOrEqual(0.65);
      expect(cssSkill.level).toBe(PROFICIENCY_LEVELS.LIMITED_EVIDENCE);
    });
  });

  describe("2. GitHub-Only Skill Evaluation", () => {
    it("evaluates GitHub-only skill respecting the 40 pts ceiling", () => {
      const ghPkg = createGitHubPackage(["Go"]);
      const result = evaluateEvidencePackages([ghPkg]);

      const goSkill = result.skills.find((s) => s.canonicalName === "Go");
      expect(goSkill).toBeDefined();
      expect(goSkill.sources).toEqual(["github"]);
      expect(goSkill.score).toBeGreaterThanOrEqual(22);
      expect(goSkill.score).toBeLessThanOrEqual(40);
      expect(goSkill.confidence).toBeGreaterThanOrEqual(0.60);
    });
  });

  describe("3. Coding-Only Skill Evaluation", () => {
    it("evaluates verified coding-only skill respecting the 45 pts ceiling", () => {
      const codingPkg = createCodingPackage(["Arrays"], true);
      const result = evaluateEvidencePackages([codingPkg]);

      const arraySkill = result.skills.find((s) => s.canonicalName === "Arrays");
      expect(arraySkill).toBeDefined();
      expect(arraySkill.sources).toEqual(["coding"]);
      expect(arraySkill.score).toBeGreaterThanOrEqual(25);
      expect(arraySkill.score).toBeLessThanOrEqual(45);
      expect(arraySkill.confidence).toBeGreaterThanOrEqual(0.70);
    });
  });

  describe("4. 2-Source Multi-Source Synergies", () => {
    it("applies +10 bonus for Resume + GitHub", () => {
      const resume = createResumePackage(["JavaScript"]);
      const gh = createGitHubPackage(["JavaScript"]);
      const result = evaluateEvidencePackages([resume, gh]);

      const js = result.skills.find((s) => s.canonicalName === "JavaScript");
      expect(js.sources.length).toBe(2);
      expect(js.score).toBeGreaterThanOrEqual(60);
      expect(js.confidence).toBe(0.80);
      expect(js.explanation).toContain("Cross-source validation bonus (2 independent sources: +10 pts)");
    });

    it("applies +10 bonus for Resume + Coding", () => {
      const resume = createResumePackage(["JavaScript"]);
      const coding = createCodingPackage(["JavaScript"], true);
      const result = evaluateEvidencePackages([resume, coding]);

      const js = result.skills.find((s) => s.canonicalName === "JavaScript");
      expect(js.sources.length).toBe(2);
      expect(js.score).toBeGreaterThanOrEqual(60);
      expect(js.confidence).toBe(0.80);
    });

    it("applies +10 bonus for GitHub + Coding", () => {
      const gh = createGitHubPackage(["JavaScript"]);
      const coding = createCodingPackage(["JavaScript"], true);
      const result = evaluateEvidencePackages([gh, coding]);

      const js = result.skills.find((s) => s.canonicalName === "JavaScript");
      expect(js.sources.length).toBe(2);
      expect(js.score).toBeGreaterThanOrEqual(65);
      expect(js.confidence).toBe(0.80);
    });
  });

  describe("5. 3-Source Triangulated Synergy", () => {
    it("applies +18 bonus and allows achieving Proficient / Strong Evidence (75-100)", () => {
      const resume = createResumePackage(["JavaScript"]);
      const gh = createGitHubPackage(["JavaScript"]);
      const coding = createCodingPackage(["JavaScript"], true);
      const result = evaluateEvidencePackages([resume, gh, coding]);

      const js = result.skills.find((s) => s.canonicalName === "JavaScript");
      expect(js.sources.length).toBe(3);
      expect(js.score).toBeGreaterThanOrEqual(75);
      expect(js.confidence).toBe(0.92);
      expect(js.level).toMatch(/Proficient|Strong Evidence/);
      expect(js.explanation).toContain("Triangulated validation bonus (Resume + GitHub + Coding: +18 pts)");
    });
  });

  describe("6. Duplicate Evidence Merging", () => {
    it("merges multiple evidence items for the same canonical skill cleanly", () => {
      const resume1 = createResumePackage(["React"]);
      const resume2 = createResumePackage(["React"]);
      const result = evaluateEvidencePackages([resume1, resume2]);

      const react = result.skills.filter((s) => s.canonicalName === "React");
      expect(react.length).toBe(1);
    });
  });

  describe("7. Missing Evidence Handling", () => {
    it("returns 0 points and empty array gracefully without negative penalties", () => {
      const result = evaluateEvidencePackages([]);
      expect(result.skillsCount).toBe(0);
      expect(result.skills).toEqual([]);
      expect(result.overallReadinessScore).toBe(0);
    });
  });

  describe("8. Conflicting Evidence Handling", () => {
    it("handles Resume claim vs Coding assessment failure transparently", () => {
      const resume = createResumePackage(["Hash Maps"]);
      const failedCoding = createCodingPackage(["Hash Maps"], false);
      const result = evaluateEvidencePackages([resume, failedCoding]);

      const hashMap = result.skills.find((s) => s.canonicalName === "Hash Maps");
      expect(hashMap.score).toBeLessThan(60);
      expect(hashMap.explanation).toContain("Attempted 2 practical coding tasks without full test pass");
    });
  });

  describe("9. Skill Alias Normalization", () => {
    it("normalizes 'react.js' and 'react' to canonical 'React'", () => {
      const pkg = createSkillEvidencePackage({
        source: EVIDENCE_SOURCES.RESUME,
        userId: dummyUserId,
        skills: [
          {
            skill: "react.js",
            canonicalName: "React",
            category: "Frontend",
            evidenceType: EVIDENCE_TYPES.CLAIMED,
            confidence: 0.65,
            signals: {},
            observations: [],
          },
        ],
      });

      const result = evaluateEvidencePackages([pkg]);
      expect(result.skills[0].canonicalName).toBe("React");
    });
  });

  describe("10. Deterministic Evaluation Reproducibility", () => {
    it("guarantees 100% identical outputs for identical inputs across runs", () => {
      const resume = createResumePackage(["React", "Node.js", "MongoDB"]);
      const gh = createGitHubPackage(["React", "MongoDB"]);
      const coding = createCodingPackage(["React"], true);

      const run1 = evaluateEvidencePackages([resume, gh, coding]);
      const run2 = evaluateEvidencePackages([resume, gh, coding]);

      expect(run1.skillsCount).toBe(run2.skillsCount);
      expect(run1.overallReadinessScore).toBe(run2.overallReadinessScore);

      for (let i = 0; i < run1.skills.length; i++) {
        expect(run1.skills[i].canonicalName).toBe(run2.skills[i].canonicalName);
        expect(run1.skills[i].score).toBe(run2.skills[i].score);
        expect(run1.skills[i].level).toBe(run2.skills[i].level);
        expect(run1.skills[i].confidence).toBe(run2.skills[i].confidence);
        expect(run1.skills[i].explanation).toBe(run2.skills[i].explanation);
      }
    });
  });

  describe("11. End-to-End Cross-Module Evidence Integration", () => {
    it("consumes real evidence generated by Resume, GitHub, and Coding adapters", () => {
      // 1. Realistic User Profile -> Resume Adapter
      const dummyUser = {
        _id: dummyUserId,
        skillLanguages: ["JavaScript", "TypeScript"],
        skillFrameworks: ["React", "Node.js"],
        projects: [
          { title: "E-Commerce App", technologies: ["JavaScript", "React", "Node.js"] },
        ],
        experience: [
          { role: "Frontend Developer", company: "Acme", bullets: ["Built SPA with React and JavaScript"] },
        ],
      };
      const resumeEvidence = extractResumeEvidence({
        userId: dummyUserId,
        userProfile: dummyUser,
      });
      expect(validateSkillEvidencePackage(resumeEvidence).valid).toBe(true);

      // 2. Realistic GitHub Data -> GitHub Adapter
      const dummyGhData = {
        owner: dummyUserId,
        username: "johndoe",
        languages: {
          JavaScript: { size: 45000, percentage: 80, repoCount: 1 },
          React: { size: 30000, percentage: 20, repoCount: 1 },
        },
        repositories: [
          {
            name: "react-dashboard",
            language: "JavaScript",
            fork: false,
            stars: 5,
            topics: ["react"],
          },
        ],
      };
      const ghEvidence = extractGitHubEvidence({
        userId: dummyUserId,
        githubData: dummyGhData,
      });
      expect(validateSkillEvidencePackage(ghEvidence).valid).toBe(true);

      // 3. Realistic Submissions -> Coding Adapter
      const dummySubmissions = [
        {
          taskId: "two-sum",
          title: "Two Sum",
          language: "javascript",
          status: "passed",
          score: 20,
          passed: 5,
          total: 5,
          executionTimeMs: 40,
          skillsCovered: ["JavaScript", "Arrays", "Hash Maps"],
        },
      ];
      const codingEvidence = extractCodingEvidence({
        userId: dummyUserId,
        submissions: dummySubmissions,
      });
      expect(validateSkillEvidencePackage(codingEvidence).valid).toBe(true);

      // 4. Ingest all three into Skills Evaluation Engine
      const evaluation = evaluateEvidencePackages([resumeEvidence, ghEvidence, codingEvidence]);

      expect(evaluation.skillsCount).toBeGreaterThanOrEqual(4);
      expect(evaluation.overallReadinessScore).toBeGreaterThan(0);

      // JavaScript is present in Resume, GitHub, and Coding
      const jsSkill = evaluation.skills.find((s) => s.canonicalName === "JavaScript");
      expect(jsSkill).toBeDefined();
      expect(jsSkill.sources).toContain("resume");
      expect(jsSkill.sources).toContain("github");
      expect(jsSkill.sources).toContain("coding");
      expect(jsSkill.score).toBeGreaterThanOrEqual(75);
      expect(jsSkill.confidence).toBe(0.92);
      expect(jsSkill.explanation).toContain("Triangulated validation bonus");
    });
  });

  describe("12. API Security & Unauthorized Rejections", () => {
    it("rejects unauthenticated requests to /api/v1/skills/profile with 401", async () => {
      const res = await request(app).get("/api/v1/skills/profile");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to /api/v1/skills/evaluate with 401", async () => {
      const res = await request(app).post("/api/v1/skills/evaluate");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
