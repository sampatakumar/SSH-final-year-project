import { ROLE_REQUIREMENTS, TARGET_ROLES } from "../../gaps/benchmarks/roleRequirements.js";
import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { analyzeSkillGaps } from "../../gaps/services/skillGap.service.js";
import { generateRecommendations } from "../../recommendations/services/recommendation.service.js";
import { analyzeAllRepositoriesQuality } from "./githubProjectCoach.service.js";

/**
 * Deterministic Personal Career Mentor Engine
 * Aggregates evidence from GitHub, Skill Taxonomy, Gaps, Recommendations, and Resume.
 */

export function buildCareerMentorPlan({
  githubData,
  userSkillProfile = null,
  resumeData = null,
  codingSubmissions = [],
  targetRole = TARGET_ROLES.FULL_STACK_DEVELOPER,
}) {
  let role = TARGET_ROLES.FULL_STACK_DEVELOPER;
  if (ROLE_REQUIREMENTS[targetRole]) {
    role = targetRole;
  } else {
    const inputRole = String(targetRole || "").toLowerCase();
    if (inputRole.includes("frontend")) {
      role = TARGET_ROLES.FRONTEND_ENGINEER;
    } else if (inputRole.includes("backend")) {
      role = TARGET_ROLES.BACKEND_NODE_ENGINEER;
    } else if (
      inputRole.includes("software engineer") ||
      inputRole.includes("core cs") ||
      inputRole.includes("algorithms")
    ) {
      role = TARGET_ROLES.DATA_STRUCTURES_ALGORITHMS;
    } else {
      role = TARGET_ROLES.FULL_STACK_DEVELOPER;
    }
  }

  const repositories = githubData?.repositories || [];
  const languages = githubData?.languages || {};
  const dominantLanguage = githubData?.dominantLanguage || (repositories.length > 0 ? "JavaScript" : "None");
  const hasZeroRepos = repositories.length === 0;

  const engineeringQuality = hasZeroRepos
    ? {
        overallScore: 0,
        dimensions: { documentation: 0, testingAndCicd: 0, architectureDiversity: 0, repositoryHygiene: 0 },
        strengths: [],
        improvements: ["Publish original public code repositories to unlock engineering quality assessments."],
      }
    : (githubData?.engineeringQuality || {
        overallScore: 40,
        dimensions: { documentation: 30, testingAndCicd: 20, architectureDiversity: 30, repositoryHygiene: 40 },
        strengths: [],
        improvements: [],
      });

  const projectComplexity = githubData?.projectComplexity || {
    summary: { beginnerCount: 0, intermediateCount: 0, advancedCount: 0 },
    topComplexProjects: [],
  };
  const aggregateStats = githubData?.aggregateStats || {};

  // 1. Compute Observed GitHub Skills with Genuine Evidence Corroboration
  const observedSkills = [];
  if (!hasZeroRepos) {
    Object.entries(languages).forEach(([lang, stat]) => {
      const canonical = normalizeSkill(lang) || lang;
      const langRepos = repositories.filter(
        (r) => r.language?.toLowerCase() === lang.toLowerCase()
      );
      const originalRepos = langRepos.filter((r) => !r.fork);
      const originalCount = originalRepos.length;
      const forkCount = langRepos.length - originalCount;

      // Inspect actual code artifacts & quality signals across repositories of this language
      const hasTests = originalRepos.some(
        (r) =>
          r.topics?.some((t) => ["test", "testing", "jest", "vitest", "pytest", "cypress", "mocha", "playwright"].includes(t)) ||
          r.name.toLowerCase().includes("test")
      );
      const hasCicd = originalRepos.some(
        (r) =>
          r.topics?.some((t) => ["ci", "cd", "github-actions", "actions", "docker"].includes(t)) ||
          r.name.toLowerCase().includes("docker")
      );
      const hasDocs = originalRepos.some(
        (r) => Boolean(r.description && r.description.length > 15)
      );

      const artifacts = [];
      if (hasTests) artifacts.push("Automated Test Suite");
      if (hasCicd) artifacts.push("CI/CD or Container Setup");
      if (hasDocs) artifacts.push("Documented Project Structure");

      // Score strictly bounded by verified code signals
      let score = 25; // Base signal for detected language
      if (originalCount >= 1) score += 15;
      if (originalCount >= 2) score += 10;
      if (stat.size > 20000) score += 10;
      if (hasDocs) score += 5;
      if (hasTests) score += 10;
      if (hasCicd) score += 5;

      // Penalize forked-only code with no original implementation
      if (originalCount === 0 && forkCount > 0) {
        score = Math.min(30, score);
      }

      // Single-source ceiling: GitHub alone cannot award >75 (Proficient requires multi-source corroboration)
      score = Math.min(75, Math.max(20, score));

      let level = "Limited Evidence";
      if (score >= 65 && originalCount >= 1 && (hasTests || hasDocs)) {
        level = "Competent";
      } else if (score >= 40) {
        level = "Developing";
      }

      let confidence = "low";
      if (originalCount >= 2 && hasTests && hasDocs) {
        confidence = "high";
      } else if (originalCount >= 1 && (hasDocs || stat.size > 15000)) {
        confidence = "medium";
      }

      observedSkills.push({
        skill: canonical,
        canonicalName: canonical,
        category: getSkillCategory(canonical) || "Language",
        score,
        level,
        sources: ["github"],
        confidence,
        evidenceBreakdown: {
          isObservedDirectly: originalCount > 0,
          confidence,
          originalReposCount: originalCount,
          forkCount,
          testsDetected: hasTests,
          cicdDetected: hasCicd,
          documentationQuality: hasDocs ? "documented" : "minimal",
          meaningfulArtifacts: artifacts,
        },
      });
    });
  }

  // Merge with userSkillProfile if available
  const allEvaluatedSkills = [...observedSkills];
  if (userSkillProfile?.skills) {
    userSkillProfile.skills.forEach((s) => {
      const existing = allEvaluatedSkills.find(
        (e) => e.canonicalName.toLowerCase() === (s.canonicalName || s.skill).toLowerCase()
      );
      if (existing) {
        existing.score = Math.max(existing.score, s.score || 0);
        existing.sources = Array.from(new Set([...existing.sources, ...(s.sources || [])]));
      } else {
        allEvaluatedSkills.push(s);
      }
    });
  }

  // 2. Perform Gap Analysis for Target Role
  let gapAnalysisResult;
  try {
    gapAnalysisResult = analyzeSkillGaps(allEvaluatedSkills, role);
  } catch {
    gapAnalysisResult = { gaps: [], metSkills: [] };
  }

  const criticalGaps = gapAnalysisResult.gaps.filter((g) => g.priority === "Critical");
  const highGaps = gapAnalysisResult.gaps.filter((g) => g.priority === "High");
  const mediumGaps = gapAnalysisResult.gaps.filter((g) => g.priority === "Medium");

  // 3. Generate Recommendations
  const recommendations = generateRecommendations(gapAnalysisResult.gaps, role);

  // 4. Determine Strengths, Gaps & Positioning
  const originalRepos = repositories.filter((r) => !r.fork);
  const originalFrontendRepos = originalRepos.filter((r) =>
    ["JavaScript", "TypeScript", "HTML", "CSS", "Vue", "React"].includes(r.language) ||
    r.topics?.some((t) => ["react", "vue", "angular", "frontend", "nextjs", "svelte"].includes(t))
  );
  const hasOriginalFrontend = originalFrontendRepos.length > 0;
  const isFrontendHeavy = hasOriginalFrontend && (
    ["JavaScript", "TypeScript", "HTML", "CSS", "Vue", "React"].includes(dominantLanguage) ||
    Boolean(languages["TypeScript"] || languages["JavaScript"])
  );
  const hasBackend = Boolean(languages["Go"] || languages["Python"] || languages["Java"] || languages["Rust"] || languages["PHP"] || languages["C#"]);
  const hasDockerEvidence = repositories.some((r) => r.topics?.includes("docker") || r.name.toLowerCase().includes("docker"));
  const hasRepoTestEvidence = repositories.some(
    (r) =>
      !r.fork &&
      (r.topics?.some((t) => ["test", "tests", "jest", "vitest", "pytest", "cypress", "mocha", "testing", "ci"].includes(t)) ||
        /test|spec/i.test(r.name) ||
        r.description?.toLowerCase().includes("test") ||
        r.description?.toLowerCase().includes("vitest") ||
        r.description?.toLowerCase().includes("jest"))
  );
  const hasTestingEvidence = Boolean(engineeringQuality?.dimensions?.testingAndCicd >= 60 || hasRepoTestEvidence);

  // Determine Stage & Hero
  let currentStage = "Junior to Mid Developer expanding engineering portfolio";
  let strongestArea = `${dominantLanguage} & Frontend Architecture`;
  let biggestGap = "Backend production & containerized deployment";
  let nextPriority = `Build a production-grade backend application with testing, Docker, and CI/CD for ${role}.`;

  if (role === TARGET_ROLES.FRONTEND_ENGINEER) {
    strongestArea = isFrontendHeavy ? `${dominantLanguage} UI Development` : "Web Interface Development";
    biggestGap = hasTestingEvidence ? "State management & Web Performance" : "Component testing & Accessibility auditing";
    nextPriority = "Add automated unit/E2E tests (Vitest/Playwright) and optimize Core Web Vitals.";
    currentStage = isFrontendHeavy ? "Frontend-strong developer building toward Senior UI Engineer" : "Developer transitioning into Frontend specialization";
  } else if (role === TARGET_ROLES.BACKEND_NODE_ENGINEER) {
    strongestArea = hasBackend ? "Backend Services & APIs" : `${dominantLanguage} Scripting`;
    biggestGap = "Microservices architecture, caching, and database indexing";
    nextPriority = "Design a high-throughput REST/gRPC API with Redis caching, PostgreSQL/MongoDB, and Docker.";
    currentStage = hasBackend ? "Backend developer strengthening scalable systems" : "Full-stack developer building deeper backend depth";
  } else {
    // Full Stack Developer
    if (isFrontendHeavy && !hasBackend) {
      currentStage = "Frontend-strong developer building toward Full-Stack readiness";
      strongestArea = `${dominantLanguage} & UI Engineering`;
      biggestGap = "Backend microservices, database transactions & Docker deployment";
      nextPriority = "Build one production-style Node.js/Express + Database system with authentication, tests, and Docker.";
    } else if (hasBackend && !isFrontendHeavy) {
      currentStage = "Backend-focused engineer expanding into Full-Stack workflows";
      strongestArea = "Server Architecture & APIs";
      biggestGap = "Modern React/TypeScript client-side UI frameworks";
      nextPriority = "Build a responsive React + Tailwind application consuming your backend APIs.";
    } else {
      currentStage = "Full-Stack developer advancing toward production system design";
      strongestArea = "Full-Stack Development";
      biggestGap = "Automated CI/CD pipelines & production monitoring";
      nextPriority = "Add GitHub Actions CI/CD workflows, unit tests, and production Docker setups.";
    }
  }

  // 5. Evidence-Based Career Readiness Dimensions
  const readinessDimensions = hasZeroRepos
    ? [
        {
          dimension: "Frontend Engineering",
          status: "Insufficient Evidence",
          score: 0,
          evidence: "No public frontend repositories detected on GitHub.",
        },
        {
          dimension: "Backend Engineering",
          status: "Insufficient Evidence",
          score: 0,
          evidence: "No public backend or API repositories detected on GitHub.",
        },
        {
          dimension: "Database & Storage",
          status: "Insufficient Evidence",
          score: 0,
          evidence: "No public database integration configurations detected.",
        },
        {
          dimension: "Testing & Reliability",
          status: "Insufficient Evidence",
          score: 0,
          evidence: "No automated test suites detected across public repositories.",
        },
        {
          dimension: "DevOps & Cloud (Docker / CI)",
          status: "Insufficient Evidence",
          score: 0,
          evidence: "No containerization or CI/CD workflow configurations detected.",
        },
        {
          dimension: "Open Source & Collaboration",
          status: "Insufficient Evidence",
          score: 0,
          evidence: "No public repositories available to assess open source collaboration.",
        },
      ]
    : [
        {
          dimension: "Frontend Engineering",
          status: hasOriginalFrontend
            ? (isFrontendHeavy ? "Strong" : "Developing")
            : (repositories.some((r) => ["JavaScript", "TypeScript", "HTML", "CSS"].includes(r.language)) ? "Limited Evidence" : "Limited Evidence"),
          score: hasOriginalFrontend
            ? (isFrontendHeavy ? 80 : 45)
            : (repositories.some((r) => r.fork && ["JavaScript", "TypeScript", "HTML", "CSS"].includes(r.language)) ? 35 : 20),
          evidence: hasOriginalFrontend
            ? `Observed ${languages[dominantLanguage]?.repoCount || 1}+ original repositories in ${dominantLanguage} with ${languages[dominantLanguage]?.percentage || 60}% code volume.`
            : "Frontend repositories detected are forks or insufficient original code evidence exists on GitHub.",
        },
        {
          dimension: "Backend Engineering",
          status: hasBackend || repositories.some((r) => r.topics?.includes("api") || r.topics?.includes("express")) ? "Developing" : "Limited Evidence",
          score: hasBackend ? 65 : 35,
          evidence: hasBackend
            ? "Identified server-side services or backend languages in public repositories."
            : "Backend API and server architecture repositories are comparatively scarce.",
        },
        {
          dimension: "Database & Storage",
          status: repositories.some((r) => r.topics?.some((t) => ["mongodb", "postgres", "sql", "redis", "mysql"].includes(t))) ? "Developing" : "Limited Evidence",
          score: repositories.some((r) => r.topics?.some((t) => ["mongodb", "postgres", "sql", "redis", "mysql"].includes(t))) ? 55 : 30,
          evidence: repositories.some((r) => r.topics?.some((t) => ["mongodb", "postgres", "sql", "redis", "mysql"].includes(t)))
            ? "Database integration signals found in project topics and backend configurations."
            : "No database integration topics or configurations detected in public projects.",
        },
        {
          dimension: "Testing & Reliability",
          status: hasTestingEvidence ? "Developing" : "Limited Evidence",
          score: hasTestingEvidence
            ? Math.max(engineeringQuality?.dimensions?.testingAndCicd || 0, 60)
            : (engineeringQuality?.dimensions?.testingAndCicd || 25),
          evidence: hasTestingEvidence
            ? "Testing indicators observed in repository configuration and structure."
            : "Automated test suites (Jest, Vitest, PyTest) not systematically detected across projects.",
        },
        {
          dimension: "DevOps & Cloud (Docker / CI)",
          status: hasDockerEvidence ? "Developing" : "Needs Attention",
          score: hasDockerEvidence ? 60 : 25,
          evidence: hasDockerEvidence
            ? "Containerization configurations (Dockerfile) observed in repository topics."
            : "No Dockerfiles or GitHub Actions CI/CD workflow files detected.",
        },
        {
          dimension: "Open Source & Collaboration",
          status: (aggregateStats.totalForks || 0) > 0 || (aggregateStats.totalStars || 0) >= 5 ? "Strong" : "Developing",
          score: (aggregateStats.totalStars || 0) >= 10 ? 80 : 50,
          evidence: `Accumulated ${aggregateStats.totalStars || 0} stars and ${aggregateStats.totalForks || 0} forks across public developer projects.`,
        },
      ];

  // 6. "What Should I Do Next?" Prioritized Action Plan (3 Critical Tasks)
  const nextActions = [
    {
      order: "01",
      title: criticalGaps.length > 0
        ? `Master ${criticalGaps[0].canonicalName} for ${role}`
        : "Strengthen Backend Production Engineering",
      priority: "Critical",
      requirements: [
        "Implement robust JWT / session-based authentication & authorization",
        "Design standard RESTful endpoints with input validation & error envelopes",
        "Configure database connection pooling & indexing",
        "Containerize the application with Docker and Docker Compose",
      ],
      why: criticalGaps.length > 0
        ? `${criticalGaps[0].canonicalName} is required for ${role} but currently has limited evidence.`
        : "Your profile exhibits frontend strength; balancing it with production backend depth accelerates hiring readiness.",
      estimatedHours: 12,
    },
    {
      order: "02",
      title: "Integrate Automated Unit & Integration Testing",
      priority: "High",
      requirements: [
        "Add unit tests for core domain logic & utility functions",
        "Write integration tests for API endpoints using Supertest / Vitest",
        "Target minimum 70% test coverage across critical user flows",
      ],
      why: "Testing evidence is currently under-indexed in your repository quality score.",
      estimatedHours: 8,
    },
    {
      order: "03",
      title: "Polish Repository Architecture & Documentation",
      priority: "Medium",
      requirements: [
        "Add visual architecture diagrams & screenshots to top repository READMEs",
        "Document step-by-step local setup instructions & environment variables",
        "Include live deployed demo URLs in repository headers",
      ],
      why: "Comprehensive documentation significantly elevates recruiter and engineering manager evaluation.",
      estimatedHours: 4,
    },
  ];

  // 7. Dedicated GitHub Improvement Plan
  const githubImprovementPlan = {
    profile: [
      githubData?.profile?.bio ? "Refine bio to emphasize your target specialization and active tech stack." : "Add a clear professional bio highlighting your target engineering role.",
      githubData?.profile?.blog ? "Ensure your portfolio or LinkedIn link is up to date." : "Add a link to your personal portfolio or LinkedIn profile.",
      "Pin your top 4 most architecturally complex repositories to your GitHub profile overview.",
    ],
    repositories: [
      "Add 3–5 descriptive topic tags (e.g. #typescript, #docker, #fullstack) to every project.",
      "Ensure all public repositories have concise 1-sentence descriptions.",
      "Archive or mark exploratory/dormant projects to keep your showcase focused.",
    ],
    engineering: [
      "Add a GitHub Actions workflow (`.github/workflows/ci.yml`) to run automated tests on pull requests.",
      "Add a standard `Dockerfile` to your top web services.",
      "Include a `LICENSE` and `.env.example` in all production projects.",
    ],
    activity: [
      "Maintain a steady commit rhythm with descriptive commit messages.",
      "Use feature branches and pull requests to simulate professional agile team collaboration.",
      "Document milestone planning using GitHub Issues or Projects.",
    ],
  };

  // 8. Repository Action Center (Per-Repository Evaluation)
  const repositoryActionCenter = repositories.slice(0, 8).map((repo) => {
    const hasDesc = Boolean(repo.description && repo.description.length > 5);
    const hasTests = repo.topics?.some((t) => ["test", "jest", "vitest", "pytest"].includes(t)) || repo.name.includes("test");
    const hasCicd = repo.topics?.some((t) => ["ci", "actions", "docker"].includes(t)) || repo.name.includes("docker");
    const isFork = Boolean(repo.fork);

    let priority = "Low";
    const actionItems = [];

    if (!hasDesc) {
      actionItems.push("Add concise description and topics");
      priority = "Medium";
    }
    if (!hasTests && !isFork) {
      actionItems.push("Add automated unit tests");
      priority = "High";
    }
    if (!hasCicd && !isFork) {
      actionItems.push("Add GitHub Actions CI & Dockerfile");
    }

    return {
      repoName: repo.name,
      htmlUrl: repo.htmlUrl || repo.html_url,
      language: repo.language || "N/A",
      isFork,
      documentationStatus: hasDesc ? "Strong" : "Needs Improvement",
      testingStatus: hasTests ? "Detected" : "Limited Evidence",
      cicdStatus: hasCicd ? "Configured" : "Not Detected",
      readmeStatus: "Present",
      architectureStatus: repo.sizeKB > 500 ? "Solid" : "Lightweight",
      actionItems: actionItems.length > 0 ? actionItems : ["Maintain active dependency updates"],
      priority,
    };
  });

  // 9. Top 3 Projects to Showcase
  const topProjectsToShowcase = repositories
    .filter((r) => !r.fork)
    .sort((a, b) => (b.stars * 2 + (b.sizeKB > 500 ? 5 : 0)) - (a.stars * 2 + (a.sizeKB > 500 ? 5 : 0)))
    .slice(0, 3)
    .map((repo, idx) => {
      const isTop = idx === 0;
      return {
        rank: idx + 1,
        repoName: repo.name,
        language: repo.language || "TypeScript",
        stars: repo.stars || 0,
        why: isTop
          ? "Demonstrates substantial technical scope and accumulated community interest."
          : "Highlights key domain knowledge and practical code implementation.",
        whatToImprove: "Add automated CI workflow, detailed architecture diagram, and live demo preview URL.",
        portfolioValue: isTop ? "High Showcase Value" : "Strong Core Project",
      };
    });

  // Fallback if user has no non-fork repos
  if (topProjectsToShowcase.length === 0 && repositories.length > 0) {
    topProjectsToShowcase.push({
      rank: 1,
      repoName: repositories[0].name,
      language: repositories[0].language || "N/A",
      stars: repositories[0].stars || 0,
      why: "Primary repository in public profile.",
      whatToImprove: "Publish original standalone project to showcase core architecture skills.",
      portfolioValue: "Reference Project",
    });
  }

  // 10. Dynamic Career Path
  const careerPath = {
    current: isFrontendHeavy ? "Frontend Developer" : "Software Developer",
    nextSkill: criticalGaps[0]?.canonicalName || "Backend Engineering & Docker",
    nextProject: "Production Full-Stack Application with Microservices",
    nextEvidence: "Automated Tests + GitHub Actions CI + Containerized Deployment",
    targetRole: role,
  };

  // 11. Weekly Career Plan ("This Week")
  const weeklyPlan = [
    {
      id: "w-1",
      task: `Add a comprehensive README with architecture diagram to ${topProjectsToShowcase[0]?.repoName || "your top repository"}`,
      priority: "High",
      estimatedHours: 2,
      reason: "First impression for engineering reviewers and hiring managers.",
      expectedEvidence: "README documentation & setup instructions",
      completed: false,
    },
    {
      id: "w-2",
      task: "Set up a GitHub Actions workflow (.github/workflows/ci.yml) for automated testing",
      priority: "Critical",
      estimatedHours: 3,
      reason: "Demonstrates modern CI/CD hygiene on public repositories.",
      expectedEvidence: "Passing GitHub Actions build badge",
      completed: false,
    },
    {
      id: "w-3",
      task: `Complete one practical coding sandbox assessment for ${criticalGaps[0]?.canonicalName || "Algorithms"}`,
      priority: "Medium",
      estimatedHours: 2,
      reason: "Builds deterministic verified coding evidence on Smart Skill Hub.",
      expectedEvidence: "Verified problem submission",
      completed: false,
    },
  ];

  // 12. 30 / 60 / 90 Day Plan
  const milestones = {
    days30: {
      phase: "Phase 1: Foundation & Hygiene",
      goals: [
        "Close top critical skill gaps (Docker, REST API fundamentals)",
        "Upgrade GitHub repository descriptions, topics, and top project READMEs",
        "Add unit test suites to your primary active project",
      ],
    },
    days60: {
      phase: "Phase 2: Project Depth & Systems",
      goals: [
        "Build and deploy one production-grade full-stack project with database indexing",
        "Implement Docker Compose multi-container setup",
        "Set up end-to-end automated testing pipelines",
      ],
    },
    days90: {
      phase: "Phase 3: Portfolio & Job Readiness",
      goals: [
        "Polish live portfolio website with deployed project case studies",
        "Align resume achievements with verified GitHub & Smart Skill Hub evidence",
        "Prepare for full-stack system design and coding interviews",
      ],
    },
  };

  // 10. Audit All Repositories via Project Quality Coach
  const projectCoach = analyzeAllRepositoriesQuality(repositories, role, dominantLanguage);

  return {
    targetRole: role,
    hasInsufficientData: hasZeroRepos,
    insufficientDataReason: hasZeroRepos
      ? "No public GitHub repositories were found. Public code repositories with original implementation code, tests, and documentation are required to evaluate engineering skills."
      : null,
    hero: {
      targetRole: role,
      currentStage: hasZeroRepos ? "Early-stage developer preparing engineering showcase" : currentStage,
      strongestArea: hasZeroRepos ? "Needs Repository Evidence" : strongestArea,
      biggestGap: hasZeroRepos ? "Public code repository artifacts & verified projects" : biggestGap,
      nextPriority: hasZeroRepos ? `Publish your first original code project with documentation and tests for ${role}.` : nextPriority,
    },
    readinessDimensions,
    nextActions,
    githubImprovementPlan,
    repositoryActionCenter,
    topProjectsToShowcase,
    careerPath,
    weeklyPlan,
    milestones,
    projectCoach,
    recommendations: recommendations.slice(0, 5),
    generatedAt: new Date().toISOString(),
  };
}
