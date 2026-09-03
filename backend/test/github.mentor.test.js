import { describe, it, expect, vi } from "vitest";
import { buildCareerMentorPlan } from "../src/modules/github/services/githubCareer.service.js";
import { answerMentorQuestion } from "../src/modules/github/services/githubMentorAi.service.js";
import { TARGET_ROLES } from "../src/modules/gaps/benchmarks/roleRequirements.js";

const sampleGithubData = {
  username: "alexdev",
  profile: {
    name: "Alex Developer",
    bio: "Frontend Engineer passionate about React and UI Architecture",
    publicRepos: 14,
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    followers: 80,
    following: 20,
  },
  repositories: [
    {
      name: "modern-react-dashboard",
      description: "Interactive analytics dashboard in React & TypeScript",
      language: "TypeScript",
      stars: 35,
      forks: 8,
      sizeKB: 2500,
      fork: false,
      topics: ["react", "typescript", "tailwindcss", "dashboard"],
    },
    {
      name: "vue-ecommerce-ui",
      description: "Responsive storefront UI with Vue 3 and Pinia",
      language: "JavaScript",
      stars: 18,
      forks: 3,
      sizeKB: 1200,
      fork: false,
      topics: ["vue", "javascript", "pinia"],
    },
    {
      name: "small-api-demo",
      description: "Express demo",
      language: "JavaScript",
      stars: 2,
      forks: 0,
      sizeKB: 80,
      fork: false,
      topics: ["express"],
    },
    {
      name: "forked-awesome-web",
      description: "Curated web dev resources",
      language: "Markdown",
      stars: 450,
      forks: 50,
      sizeKB: 400,
      fork: true,
      topics: [],
    },
  ],
  languages: {
    TypeScript: { size: 2500000, percentage: 65.0, repoCount: 1 },
    JavaScript: { size: 1280000, percentage: 33.0, repoCount: 2 },
    Markdown: { size: 400000, percentage: 2.0, repoCount: 1 },
  },
  dominantLanguage: "TypeScript",
  engineeringQuality: {
    overallScore: 78,
    dimensions: {
      documentation: 80,
      testingAndCicd: 40,
      architectureDiversity: 70,
      repositoryHygiene: 85,
    },
    strengths: ["High documentation consistency"],
    improvements: ["Incorporate automated test suites and CI workflows"],
  },
  projectComplexity: {
    summary: { beginnerCount: 1, intermediateCount: 1, advancedCount: 1 },
    topComplexProjects: [
      { repoName: "modern-react-dashboard", level: "Advanced", score: 70, reasons: ["Integrated UI architecture"] },
    ],
  },
  aggregateStats: {
    totalStars: 505,
    totalForks: 61,
    totalWatchers: 505,
    totalIssues: 4,
    totalSizeKB: 4180,
    archivedCount: 0,
    forkedCount: 1,
  },
};

describe("Personal Career Mentor Suite", () => {
  describe("1. Deterministic Career Plan Generation", () => {
    it("generates evidence-grounded hero summary and positions frontend-heavy profile", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      expect(plan.hero.targetRole).toBe("Full Stack Developer");
      expect(plan.hero.strongestArea).toContain("TypeScript");
      expect(plan.hero.biggestGap).toBeDefined();
      expect(plan.hero.nextPriority).toBeDefined();
      expect(plan.hero.currentStage).toContain("Frontend-strong developer");
    });

    it("dynamically adapts mentor advice when switching to Frontend Engineer target role", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FRONTEND_ENGINEER,
      });

      expect(plan.hero.targetRole).toBe("Frontend Engineer");
      expect(plan.hero.strongestArea).toContain("UI Development");
      expect(plan.careerPath.targetRole).toBe("Frontend Engineer");
    });

    it("evaluates evidence-based career readiness dimensions with explanations", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      expect(plan.readinessDimensions.length).toBeGreaterThanOrEqual(5);

      const frontendDim = plan.readinessDimensions.find((d) => d.dimension === "Frontend Engineering");
      expect(frontendDim?.status).toBe("Strong");
      expect(frontendDim?.evidence).toContain("TypeScript");

      const devopsDim = plan.readinessDimensions.find((d) => d.dimension.includes("DevOps"));
      expect(devopsDim?.status).toBe("Needs Attention");
    });

    it("generates prioritized 3-step action plan and 30/60/90-day plan", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      expect(plan.nextActions.length).toBe(3);
      expect(plan.nextActions[0].priority).toBe("Critical");
      expect(plan.nextActions[0].requirements.length).toBeGreaterThanOrEqual(3);

      expect(plan.milestones.days30.goals.length).toBeGreaterThanOrEqual(2);
      expect(plan.milestones.days60.goals.length).toBeGreaterThanOrEqual(2);
      expect(plan.milestones.days90.goals.length).toBeGreaterThanOrEqual(2);
    });

    it("populates repository action center with concrete checklist items", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      expect(plan.repositoryActionCenter.length).toBeGreaterThanOrEqual(3);
      const dashboardRepo = plan.repositoryActionCenter.find((r) => r.repoName === "modern-react-dashboard");
      expect(dashboardRepo?.documentationStatus).toBe("Strong");
      expect(dashboardRepo?.testingStatus).toBeDefined();
    });

    it("ranks top showcase projects based on depth and portfolio value", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      expect(plan.topProjectsToShowcase.length).toBeGreaterThanOrEqual(1);
      expect(plan.topProjectsToShowcase[0].repoName).toBe("modern-react-dashboard");
      expect(plan.topProjectsToShowcase[0].portfolioValue).toBe("High Showcase Value");
    });
  });

  describe("2. Grounded Mentor Q&A", () => {
    it("answers 'What should I learn next?' using grounded 6-part framework", async () => {
      const answer = await answerMentorQuestion({
        question: "What should I learn next?",
        githubData: sampleGithubData,
        targetRole: "Full Stack Developer",
      });

      expect(answer.question).toBe("What should I learn next?");
      expect(answer.currentSituation).toBeDefined();
      expect(answer.evidence.length).toBeGreaterThanOrEqual(1);
      expect(answer.gap).toBeDefined();
      expect(answer.recommendation).toBeDefined();
      expect(answer.action.length).toBeGreaterThanOrEqual(1);
      expect(answer.expectedOutcome).toBeDefined();
    }, 15000);
  });

  describe("3. Repository Documentation & Project Quality Coach", () => {
    it("detects missing description and generates grounded suggested description", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      expect(plan.projectCoach).toBeDefined();
      expect(plan.projectCoach.top5ProjectsToImprove.length).toBeGreaterThanOrEqual(2);

      const top1 = plan.projectCoach.top5ProjectsToImprove[0];
      expect(top1.suggestedDescription).toBeDefined();
      expect(top1.scorecard).toBeDefined();
      expect(top1.scorecard.description).toBeDefined();
    });

    it("evaluates 4-tier smart prioritization (Showcase Now, Improve Next, Needs Work, Archive)", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      const tiers = plan.projectCoach.classifiedTiers;
      expect(tiers.showcaseNow.length).toBeGreaterThanOrEqual(1);
      expect(tiers.archiveLowPriority.some((r) => r.repoName === "forked-awesome-web")).toBe(true);
    });

    it("identifies 'Start With This Project' with highest-impact rationale", () => {
      const plan = buildCareerMentorPlan({
        githubData: sampleGithubData,
        targetRole: TARGET_ROLES.FULL_STACK_DEVELOPER,
      });

      const startWith = plan.projectCoach.startWithProject;
      expect(startWith).toBeDefined();
      expect(startWith.repoName).toBeDefined();
      expect(startWith.whyStartHere).toContain("highest technical scope");
      expect(startWith.top3Actions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
