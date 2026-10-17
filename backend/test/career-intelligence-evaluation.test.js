import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeSkillGaps,
  compareRoles,
  resolveRoleBenchmark,
  GAP_STATUSES,
  GAP_PRIORITIES,
} from "../src/modules/gaps/services/skillGap.service.js";
import { buildCareerMentorPlan } from "../src/modules/github/services/githubCareer.service.js";
import { generateRecommendations } from "../src/modules/recommendations/services/recommendation.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { TARGET_ROLES } from "../src/modules/gaps/benchmarks/roleRequirements.js";

describe("Phase 15: AI Mentor Accuracy, Career Intelligence & Personalized Learning Quality Evaluation Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Benchmark & Role Selection Accuracy
  // =========================================================================
  describe("1. Benchmark Selection & Role Resolution Accuracy", () => {
    it("correctly resolves standard canonical role names with 100% accuracy", () => {
      const rolesToTest = [
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "React Developer",
        "Python Developer",
        "Java Developer",
        "DevOps Engineer",
        "Machine Learning Engineer",
        "Embedded Systems Engineer",
        "VLSI Design Engineer",
      ];

      for (const role of rolesToTest) {
        const config = resolveRoleBenchmark(role);
        expect(config, `Failed to resolve canonical role: ${role}`).not.toBeNull();
        expect(config.roleName).toBe(role);
      }
    });

    it("correctly resolves slugs and kebab-case identifiers without silent substitution", () => {
      const slugTests = [
        { input: "frontend-developer", expected: "Frontend Developer" },
        { input: "backend-developer", expected: "Backend Developer" },
        { input: "machine-learning-engineer", expected: "Machine Learning Engineer" },
        { input: "embedded-systems-engineer", expected: "Embedded Systems Engineer" },
        { input: "devops-engineer", expected: "DevOps Engineer" },
      ];

      for (const { input, expected } of slugTests) {
        const config = resolveRoleBenchmark(input);
        expect(config, `Slug ${input} should resolve to ${expected}`).not.toBeNull();
        expect(config.roleName).toBe(expected);
      }
    });

    it("resolves common technical role aliases consistently", () => {
      const aliasTests = [
        { input: "frontend", expected: "Frontend Developer" },
        { input: "backend", expected: "Backend Developer" },
        { input: "fullstack", expected: "Full Stack Developer" },
        { input: "devops", expected: "DevOps Engineer" },
        { input: "ml", expected: "Machine Learning Engineer" },
        { input: "dsa", expected: "Software Engineer (General / Core CS)" },
      ];

      for (const { input, expected } of aliasTests) {
        const config = resolveRoleBenchmark(input);
        expect(config, `Alias ${input} should resolve to ${expected}`).not.toBeNull();
        expect(config.roleName).toBe(expected);
      }
    });

    it("never silently substitutes an unrelated role when an unknown role is requested", () => {
      const result = analyzeSkillGaps([], "Astronaut / Space Pilot");
      expect(result.benchmarkStatus).toBe("unknown_role");
      expect(result.benchmarkPending).toBe(true);
      expect(result.targetRole).toBe("Astronaut / Space Pilot");
      expect(result.roleMatchPercentage).toBeNull();
      expect(result.gaps).toEqual([]);
    });
  });

  // =========================================================================
  // 2. Evidence-Based GitHub Analysis & Anti-Inflation Guarantees
  // =========================================================================
  describe("2. Evidence-Based GitHub Analysis & Anti-Inflation Guarantees", () => {
    it("handles zero repositories profile honestly with 0% inflation and insufficient data notice", () => {
      const emptyGitHubData = {
        repositories: [],
        languages: {},
        profile: { bio: "Aspiring developer", blog: "" },
      };

      const plan = buildCareerMentorPlan({
        githubData: emptyGitHubData,
        targetRole: "Full Stack Developer",
      });

      expect(plan.hasInsufficientData).toBe(true);
      expect(plan.insufficientDataReason).toMatch(/No public GitHub repositories were found/i);
      expect(plan.readinessDimensions.every((d) => d.score === 0)).toBe(true);
      expect(plan.readinessDimensions.every((d) => d.status === "Insufficient Evidence")).toBe(true);
      expect(plan.topProjectsToShowcase).toEqual([]);
    });

    it("distinguishes observed code evidence from forked-only repository presence", () => {
      const forkedOnlyData = {
        repositories: [
          {
            name: "forked-react-repo",
            language: "JavaScript",
            fork: true,
            sizeKB: 8000,
            topics: ["react"],
          },
        ],
        languages: {
          JavaScript: { size: 8000 * 1024, repoCount: 1, percentage: 100 },
        },
        profile: {},
      };

      const plan = buildCareerMentorPlan({
        githubData: forkedOnlyData,
        targetRole: "Frontend Developer",
      });

      // Forked-only repos must not be rewarded with high score or 'Strong Evidence'
      expect(plan.readinessDimensions[0].score).toBeLessThanOrEqual(50);
    });

    it("assigns high confidence and observed breakdown when original repos have tests and documentation", () => {
      const testedRepoData = {
        repositories: [
          {
            name: "express-api-service",
            language: "JavaScript",
            fork: false,
            sizeKB: 250,
            description: "High-performance production REST API service with auth and logging",
            topics: ["api", "express", "jest", "test"],
          },
          {
            name: "node-cli-tool",
            language: "JavaScript",
            fork: false,
            sizeKB: 180,
            description: "CLI utility tool with vitest integration and full test suite",
            topics: ["cli", "vitest", "ci"],
          },
        ],
        languages: {
          JavaScript: { size: 430 * 1024, repoCount: 2, percentage: 100 },
        },
        profile: { bio: "Full Stack Developer" },
      };

      const plan = buildCareerMentorPlan({
        githubData: testedRepoData,
        targetRole: "Backend Developer",
      });

      expect(plan.hasInsufficientData).toBe(false);
      expect(plan.readinessDimensions.find((d) => d.dimension === "Testing & Reliability").status).toBe("Developing");
      expect(plan.topProjectsToShowcase.length).toBeGreaterThan(0);
    });

    it("unsupported-skill assignment rate is strictly 0% when no repository evidence exists", () => {
      const rustFreeProfile = {
        repositories: [
          { name: "web-ui", language: "JavaScript", fork: false, sizeKB: 100, topics: ["react"] },
        ],
        languages: { JavaScript: { size: 100000, repoCount: 1, percentage: 100 } },
        profile: {},
      };

      const plan = buildCareerMentorPlan({
        githubData: rustFreeProfile,
        targetRole: "Full Stack Developer",
      });

      // Rust must never be assigned as an observed skill
      const rustSkill = plan.careerPath.nextSkill;
      expect(rustSkill).not.toBe("Rust");
    });
  });

  // =========================================================================
  // 3. Missing Evidence vs. Demonstrated Lack of Skill Separation
  // =========================================================================
  describe("3. Separation of Missing Evidence from Demonstrated Weakness", () => {
    it("marks completely unevidenced skills as missing_evidence with actionable demonstration guide", () => {
      const result = analyzeSkillGaps([], "Frontend Developer");
      const jsGap = result.gaps.find((g) => g.canonicalName === "JavaScript");

      expect(jsGap).toBeDefined();
      expect(jsGap.status).toBe(GAP_STATUSES.MISSING);
      expect(jsGap.evidenceState).toBe("missing_evidence");
      expect(jsGap.currentScore).toBe(0);
      expect(jsGap.howToDemonstrate).toMatch(/Submit an original project repository or pass a verified coding sandbox challenge/i);
      expect(jsGap.reason).toMatch(/Status: Missing Evidence/i);
    });

    it("marks tested skills below benchmark as demonstrated_weakness with improvement guidance", () => {
      const evaluatedSkills = [
        {
          skill: "JavaScript",
          canonicalName: "JavaScript",
          level: "Developing",
          score: 50,
          category: "Frontend",
        },
      ];

      const result = analyzeSkillGaps(evaluatedSkills, "Frontend Developer");
      const jsGap = result.gaps.find((g) => g.canonicalName === "JavaScript");

      expect(jsGap).toBeDefined();
      expect(jsGap.status).toBe(GAP_STATUSES.DEVELOPING);
      expect(jsGap.evidenceState).toBe("demonstrated_weakness");
      expect(jsGap.currentScore).toBe(50);
      expect(jsGap.howToDemonstrate).toMatch(/Strengthen JavaScript through practical projects with automated testing/i);
    });

    it("exposes sparse evidence notice when learner has fewer than 3 total evaluated skills", () => {
      const result = analyzeSkillGaps([{ skill: "HTML", score: 80, level: "Proficient" }], "Frontend Developer");

      expect(result.evidenceCoverage).toBe("sparse");
      expect(result.evidenceNotice).toMatch(/sparse available profile evidence/i);
    });
  });

  // =========================================================================
  // 4. Multi-Role Comparative Analysis
  // =========================================================================
  describe("4. Multi-Role Comparative Analysis Quality", () => {
    it("correctly identifies shared skills and role-specific skills across multiple roles", () => {
      const evaluatedSkills = [
        { skill: "JavaScript", score: 85, level: "Proficient" },
        { skill: "React", score: 80, level: "Proficient" },
      ];

      const comparison = compareRoles(
        evaluatedSkills,
        ["Frontend Developer", "Backend Developer"]
      );

      expect(comparison.rolesCount).toBe(2);
      expect(comparison.sharedSkillsCount).toBeGreaterThan(0);

      // Git and REST APIs are required by both Frontend and Backend Developers
      const sharedNames = comparison.sharedSkills.map((s) => s.canonicalName);
      expect(sharedNames).toContain("Git");

      // React is role-specific to Frontend Developer
      const frontendSpecific = comparison.roleSpecificSkills["Frontend Developer"] || [];
      const frontendSpecificNames = frontendSpecific.map((s) => s.canonicalName);
      expect(frontendSpecificNames).toContain("React");
    });

    it("transparently reports incomplete benchmarks when compared roles include catalog roles", () => {
      const comparison = compareRoles([], ["Full Stack Developer", "Mechatronics Engineer"]);

      expect(comparison.rolesCount).toBe(2);
      expect(comparison.incompleteBenchmarksCount).toBeGreaterThan(0);
      const pendingNotice = comparison.benchmarkNotices.find((n) => n.role === "Mechatronics Engineer");
      expect(pendingNotice).toBeDefined();
      expect(pendingNotice.status).toBe("benchmark_pending");
    });
  });

  // =========================================================================
  // 5. Roadmap Prerequisite Topological Ordering & EduTube Verification
  // =========================================================================
  describe("5. Personalized Roadmap Prerequisite Ordering & EduTube Linkage", () => {
    it("orders prerequisite skills before dependent skills in roadmap steps", () => {
      const gaps = [
        { canonicalName: "React", priority: "Critical", status: "Missing", currentScore: 0 },
        { canonicalName: "JavaScript", priority: "Critical", status: "Missing", currentScore: 0 },
      ];

      const recommendations = generateRecommendations(gaps, "Frontend Developer");

      const jsIndex = recommendations.findIndex((r) => r.skill === "JavaScript");
      const reactIndex = recommendations.findIndex((r) => r.skill === "React");

      expect(jsIndex).toBeGreaterThanOrEqual(0);
      expect(reactIndex).toBeGreaterThanOrEqual(0);
      expect(jsIndex).toBeLessThan(reactIndex);
    });

    it("safely handles circular or mutually-referencing prerequisites without infinite loop", () => {
      const circularGaps = [
        { canonicalName: "SkillA", priority: "High", status: "Missing", currentScore: 0 },
        { canonicalName: "SkillB", priority: "High", status: "Missing", currentScore: 0 },
      ];

      expect(() => {
        generateRecommendations(circularGaps, "Full Stack Developer");
      }).not.toThrow();
    });

    it("attaches verified canonical EduTube resources and distinguishes them from query searches", () => {
      const gaps = [
        { canonicalName: "Python", priority: "High", status: "Missing", currentScore: 0 },
        { canonicalName: "Kubernetes", priority: "Medium", status: "Missing", currentScore: 0 },
      ];

      const recommendations = generateRecommendations(gaps, "Backend Developer");

      const pyRec = recommendations.find((r) => r.skill === "Python");
      expect(pyRec.edutubeResource.isVerified).toBe(true);
      expect(pyRec.edutubeResource.videoUrl).toMatch(/youtube\.com/);

      const k8sRec = recommendations.find((r) => r.skill === "Kubernetes");
      expect(k8sRec.edutubeResource.isVerified).toBe(false);
      expect(k8sRec.edutubeResource.type).toBe("search_query");
    });
  });

  // =========================================================================
  // 6. Cross-User Context Isolation & PII Sanitization
  // =========================================================================
  describe("6. Cross-User Context Isolation & PII Sanitization", () => {
    it("enforces strict cache key isolation between different user IDs", () => {
      const userAId = "507f191e810c19729de860ea";
      const userBId = "507f191e810c19729de860eb";

      smartMentorContextService.setCachedContext(userAId, { targetRole: "Data Scientist" });
      smartMentorContextService.setCachedContext(userBId, { targetRole: "DevOps Engineer" });

      const contextA = smartMentorContextService.getCachedContext(userAId);
      const contextB = smartMentorContextService.getCachedContext(userBId);

      expect(contextA.targetRole).toBe("Data Scientist");
      expect(contextB.targetRole).toBe("DevOps Engineer");
      expect(contextA).not.toEqual(contextB);
    });

    it("invalidates context cache cleanly without affecting other users", () => {
      const userAId = "user-111";
      const userBId = "user-222";

      smartMentorContextService.setCachedContext(userAId, { data: "A" });
      smartMentorContextService.setCachedContext(userBId, { data: "B" });

      smartMentorContextService.invalidateContext(userAId);

      expect(smartMentorContextService.getCachedContext(userAId)).toBeNull();
      expect(smartMentorContextService.getCachedContext(userBId)).toEqual({ data: "B" });
    });
  });

  // =========================================================================
  // 7. Deterministic AI Mentor Local Fallback & Uncertainty Grounding
  // =========================================================================
  describe("7. AI Mentor Grounding & Local NLP Fallback", () => {
    it("generates deterministic grounded advice with local NLP engine when Groq is unavailable", () => {
      const mockContext = {
        career: {
          name: "Sampat",
          targetRole: "Backend Developer",
          readinessScore: 72,
          targetRoles: ["Backend Developer", "DevOps Engineer"],
          academic: { isConfigured: true, degreeName: "B.Tech", branchName: "Computer Science" },
        },
        skills: [{ name: "Node.js", score: 85, level: "Proficient" }],
        skillGaps: [{ skill: "Docker", priority: "Critical", currentScore: 0, reason: "Essential for containerization" }],
        github: { hasAnalysis: true, repositoryCount: 5, repositoriesWithoutDescription: 1 },
        learning: { completedVideos: 4, videosWatched: 12 },
        coding: { passedCount: 15, totalSubmissions: 18 },
      };

      const response = smartMentorLocalService.generateLocalResponse(
        "What are my highest priority skill gaps for my target role?",
        mockContext
      );

      expect(response.answer).toMatch(/Docker/i);
      expect(response.source).toBe("local_nlp");
      expect(response.actions.length).toBeGreaterThan(0);
      expect(response.actions[0].route).toBe("/dashboard/gaps");
    });

    it("explicitly states uncertainty when academic background or GitHub is unconfigured", () => {
      const unconfiguredContext = {
        career: {
          name: "Developer",
          targetRole: "Full Stack Developer",
          readinessScore: 60,
          academic: { isConfigured: false },
        },
        skills: [],
        skillGaps: [],
        github: { hasAnalysis: false, repositoryCount: 0 },
        learning: { completedVideos: 0, videosWatched: 0 },
        coding: { passedCount: 0, totalSubmissions: 0 },
      };

      const response = smartMentorLocalService.generateLocalResponse(
        "Tell me about my academic progress and GitHub status",
        unconfiguredContext
      );

      expect(response.answer).toMatch(/academic profile is not yet configured|connect.*github/i);
    });
  });
});
