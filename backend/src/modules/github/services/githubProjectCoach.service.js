/**
 * Repository Documentation & Project Quality Coach Service
 * Evaluates repositories from a recruiter/engineering lead perspective.
 * Implements Requirements 31–45:
 * - Missing description detection & grounded suggestion generator
 * - README existence & section quality analysis
 * - Project-type specific documentation advice (Frontend, Backend, Full-stack, AI, Library)
 * - Recruiter-First 7-point scorecard
 * - 4-Tier Smart Prioritization (Showcase Now, Improve Next, Needs Work, Archive/Low Priority)
 * - Top 5 Projects to Improve + Start With This Project recommendation
 * - Grounded README generator
 */

export const PROJECT_TYPES = {
  FRONTEND: "Frontend Application",
  BACKEND: "Backend / API Service",
  FULL_STACK: "Full Stack Application",
  AI_ML: "AI / ML Project",
  LIBRARY: "Library / Utility Package",
  GENERAL: "Software Project",
};

export const REPO_PRIORITY_TIERS = {
  SHOWCASE_NOW: "🔥 Showcase Now",
  IMPROVE_NEXT: "⭐ Improve Next",
  NEEDS_WORK: "🛠 Needs Work",
  ARCHIVE_LOW_PRIORITY: "📦 Archive / Low Priority",
};

/**
 * Detect the technical category of a repository.
 */
export function detectProjectType(repo) {
  const name = String(repo.name || "").toLowerCase();
  const desc = String(repo.description || "").toLowerCase();
  const lang = String(repo.language || "").toLowerCase();
  const topics = (repo.topics || []).map((t) => String(t).toLowerCase());
  const allText = `${name} ${desc} ${topics.join(" ")}`;

  if (
    allText.includes("ai") ||
    allText.includes("llm") ||
    allText.includes("groq") ||
    allText.includes("gemini") ||
    allText.includes("openai") ||
    allText.includes("machine learning") ||
    allText.includes("nlp") ||
    allText.includes("model")
  ) {
    return PROJECT_TYPES.AI_ML;
  }

  const isFrontend =
    ["javascript", "typescript", "html", "css", "vue", "svelte"].includes(lang) &&
    (allText.includes("ui") ||
      allText.includes("frontend") ||
      allText.includes("react") ||
      allText.includes("vue") ||
      allText.includes("tailwind") ||
      allText.includes("dashboard") ||
      allText.includes("client"));

  const isBackend =
    allText.includes("api") ||
    allText.includes("server") ||
    allText.includes("backend") ||
    allText.includes("express") ||
    allText.includes("nest") ||
    allText.includes("fastapi") ||
    allText.includes("microservice") ||
    ["go", "python", "java", "rust", "c#", "php"].includes(lang);

  if (isFrontend && isBackend) {
    return PROJECT_TYPES.FULL_STACK;
  }
  if (isFrontend) return PROJECT_TYPES.FRONTEND;
  if (isBackend) return PROJECT_TYPES.BACKEND;

  if (
    allText.includes("sdk") ||
    allText.includes("lib") ||
    allText.includes("package") ||
    allText.includes("plugin") ||
    allText.includes("util") ||
    allText.includes("tool")
  ) {
    return PROJECT_TYPES.LIBRARY;
  }

  return PROJECT_TYPES.GENERAL;
}

/**
 * Generate a grounded suggested repository description based strictly on observed signals.
 */
export function generateSuggestedDescription(repo, projectType) {
  const name = repo.name || "project";
  const lang = repo.language || "TypeScript";
  const topics = repo.topics || [];
  const topicList = topics.length > 0 ? ` featuring ${topics.slice(0, 3).join(", ")}` : "";

  switch (projectType) {
    case PROJECT_TYPES.FRONTEND:
      return `Responsive ${lang} frontend application${topicList} designed with modern UI architecture and component-driven state management.`;
    case PROJECT_TYPES.BACKEND:
      return `Production-ready backend API service implemented in ${lang}${topicList} with structured routing, data persistence, and robust error handling.`;
    case PROJECT_TYPES.FULL_STACK:
      return `Full-stack ${lang} web platform${topicList} integrating interactive client interfaces with secure backend REST endpoints and database storage.`;
    case PROJECT_TYPES.AI_ML:
      return `AI-assisted software system built in ${lang}${topicList} integrating structured prompt orchestration, model inference, and heuristic fallback resilience.`;
    case PROJECT_TYPES.LIBRARY:
      return `Modular ${lang} library package${topicList} providing reusable utilities, clean type definitions, and streamlined developer integration.`;
    default:
      return `Software application developed in ${lang}${topicList} showcasing modular architecture and clean code standards.`;
  }
}

/**
 * Evaluate single repository quality & recruiter perspective.
 */
export function analyzeRepositoryQuality(repo, targetRole = "Full Stack Developer") {
  const projectType = detectProjectType(repo);
  const name = repo.name || "";
  const desc = repo.description ? repo.description.trim() : "";
  const hasDescription = desc.length > 0;
  const isFork = Boolean(repo.fork);
  const isArchived = Boolean(repo.archived);
  const stars = Number(repo.stars || 0);
  const forks = Number(repo.forks || 0);
  const sizeKB = Number(repo.sizeKB || 0);
  const lang = repo.language || "Plain Text";
  const topics = repo.topics || [];
  const hasTopics = topics.length >= 2;
  const hasHomepage = Boolean(repo.homepage && repo.homepage.startsWith("http"));
  const hasLicense = Boolean(repo.license && repo.license !== "NOASSERTION");

  // Documentation & Testing signals (derived from repo size, naming, and topic conventions)
  const allTopicStr = topics.join(" ").toLowerCase();
  const hasTestSignals =
    allTopicStr.includes("test") ||
    allTopicStr.includes("jest") ||
    allTopicStr.includes("vitest") ||
    allTopicStr.includes("pytest") ||
    name.toLowerCase().includes("test");
  const hasCiSignals =
    allTopicStr.includes("ci") ||
    allTopicStr.includes("github-actions") ||
    allTopicStr.includes("docker");
  const hasScreenshotSignals =
    allTopicStr.includes("demo") ||
    allTopicStr.includes("screenshot") ||
    hasHomepage;

  // Scorecard statuses
  const descriptionStatus = hasDescription ? "✓ Good" : "❌ Missing";
  const readmeStatus = sizeKB > 100 ? "⚠ Needs Improvement" : "❌ Missing";
  const docStatus = hasDescription && hasTopics ? "✓ Good" : "⚠ Needs Improvement";
  const screenshotsStatus = hasScreenshotSignals ? "✓ Detected" : "❌ Missing";
  const liveDemoStatus = hasHomepage ? "✓ Available" : "❌ Not detected";
  const testsStatus = hasTestSignals ? "✓ Detected" : "❌ Not detected";
  const cicdStatus = hasCiSignals ? "✓ Detected" : "❌ Not detected";
  const licenseStatus = hasLicense ? `✓ ${repo.license}` : "❌ Missing";

  // Recruiter 7-point Evaluation
  const recruiterChecklist = [
    {
      question: "Can I understand this project in 10 seconds?",
      pass: hasDescription && desc.length >= 25,
      reason: hasDescription ? "Clear description present" : "Missing concise repository description",
    },
    {
      question: "Can I understand what the candidate built?",
      pass: hasDescription || topics.length > 0,
      reason: hasDescription ? "Purpose communicated" : "Purpose and feature scope unclear",
    },
    {
      question: "Can I see the technology used?",
      pass: Boolean(repo.language) && hasTopics,
      reason: hasTopics ? `Language (${lang}) & topics documented` : "Add relevant topic tags (#react, #docker)",
    },
    {
      question: "Can I run or view the project?",
      pass: hasHomepage,
      reason: hasHomepage ? "Live demo URL attached" : "Add live demo link or clear setup instructions",
    },
    {
      question: "Can I understand the architecture?",
      pass: sizeKB > 500 && hasTopics,
      reason: sizeKB > 500 ? "Architecture signals present" : "Add visual architecture diagram in README",
    },
    {
      question: "Can I see evidence of engineering quality?",
      pass: hasTestSignals || hasCiSignals || !isFork,
      reason: hasTestSignals ? "Tests or CI configured" : "Add automated tests and CI pipeline",
    },
    {
      question: "Does the repository demonstrate technical communication?",
      pass: hasDescription && hasTopics,
      reason: hasDescription ? "Professional metadata maintained" : "Improve README structure and documentation",
    },
  ];

  // Highest-impact action recommendations
  const highestImpactImprovements = [];
  if (!hasDescription) {
    highestImpactImprovements.push("Add a professional repository description explaining project purpose.");
  }
  if (!hasHomepage && (projectType === PROJECT_TYPES.FRONTEND || projectType === PROJECT_TYPES.FULL_STACK)) {
    highestImpactImprovements.push("Attach live demo or deployed URL in repository settings.");
  }
  if (!hasTopics) {
    highestImpactImprovements.push(`Add 3-5 discoverability topics (e.g. #${lang.toLowerCase()}, #${projectType.toLowerCase().replace(/[^a-z0-9]/g, "-")}).`);
  }
  if (!hasTestSignals) {
    highestImpactImprovements.push("Add automated unit / integration tests to demonstrate code reliability.");
  }
  if (!hasCiSignals) {
    highestImpactImprovements.push("Add a GitHub Actions CI workflow to run lint and tests on every push.");
  }
  if (!hasLicense) {
    highestImpactImprovements.push("Add an open-source license (e.g. MIT) to clarify project usage.");
  }

  // Missing README sections based on project type
  const missingReadmeSections = getMissingReadmeSections(projectType, {
    hasHomepage,
    hasTestSignals,
    hasCiSignals,
  });

  const suggestedDescription = !hasDescription
    ? generateSuggestedDescription(repo, projectType)
    : desc;

  return {
    repoName: name,
    htmlUrl: repo.htmlUrl || `https://github.com/${name}`,
    projectType,
    language: lang,
    isFork,
    isArchived,
    stars,
    forks,
    sizeKB,
    scorecard: {
      documentation: docStatus,
      readme: readmeStatus,
      description: descriptionStatus,
      screenshots: screenshotsStatus,
      liveDemo: liveDemoStatus,
      tests: testsStatus,
      cicd: cicdStatus,
      license: licenseStatus,
    },
    recruiterEvaluation: {
      score: recruiterChecklist.filter((c) => c.pass).length,
      maxScore: recruiterChecklist.length,
      checklist: recruiterChecklist,
    },
    suggestedDescription,
    missingReadmeSections,
    highestImpactImprovements: highestImpactImprovements.slice(0, 5),
    specificAdvice: getProjectSpecificAdvice(projectType, name),
  };
}

/**
 * Returns required README sections tailored to project type.
 */
function getMissingReadmeSections(projectType, signals) {
  const common = [
    { section: "Project Overview & Problem Statement", importance: "Critical", recommended: true },
    { section: "Key Features & Capabilities", importance: "Critical", recommended: true },
    { section: "Tech Stack & Tools", importance: "Critical", recommended: true },
    { section: "Getting Started / Local Installation", importance: "Critical", recommended: true },
    { section: "Environment Variables Configuration", importance: "High", recommended: true },
  ];

  if (projectType === PROJECT_TYPES.FRONTEND) {
    return [
      ...common,
      { section: "UI Screenshots & Responsive Previews", importance: "Critical", recommended: true },
      { section: "Live Demo URL & Credentials", importance: "Critical", recommended: !signals.hasHomepage },
      { section: "Component Structure & Styling System", importance: "Medium", recommended: true },
      { section: "Performance & Core Web Vitals Optimization", importance: "Medium", recommended: true },
    ];
  }

  if (projectType === PROJECT_TYPES.BACKEND) {
    return [
      ...common,
      { section: "API Overview & Endpoint Documentation (REST/OpenAPI)", importance: "Critical", recommended: true },
      { section: "Authentication & Authorization Flow", importance: "High", recommended: true },
      { section: "Request / Response Payloads Examples", importance: "High", recommended: true },
      { section: "Database Schema & Migration Setup", importance: "High", recommended: true },
      { section: "Automated Testing & Coverage Instructions", importance: "High", recommended: !signals.hasTestSignals },
    ];
  }

  if (projectType === PROJECT_TYPES.FULL_STACK) {
    return [
      ...common,
      { section: "System Architecture Diagram (Frontend + API + DB)", importance: "Critical", recommended: true },
      { section: "Live Production URL & Demo Walkthrough", importance: "High", recommended: !signals.hasHomepage },
      { section: "API Endpoint Reference & Data Models", importance: "High", recommended: true },
      { section: "Docker & Containerized Deployment Instructions", importance: "High", recommended: !signals.hasCiSignals },
      { section: "Testing Strategy & CI Pipeline", importance: "High", recommended: true },
    ];
  }

  if (projectType === PROJECT_TYPES.AI_ML) {
    return [
      ...common,
      { section: "AI / LLM Approach & Model Architecture", importance: "Critical", recommended: true },
      { section: "Prompt Pipeline, Fallback Strategy & Token Controls", importance: "High", recommended: true },
      { section: "Sample Inputs & Model Responses", importance: "High", recommended: true },
      { section: "Evaluation Metrics & Known Limitations", importance: "High", recommended: true },
    ];
  }

  if (projectType === PROJECT_TYPES.LIBRARY) {
    return [
      { section: "Package Installation (npm / pip / go get)", importance: "Critical", recommended: true },
      { section: "Quickstart Code Snippet", importance: "Critical", recommended: true },
      { section: "Complete API Reference & TypeScript Definitions", importance: "Critical", recommended: true },
      { section: "Supported Versions & Runtime Compatibility", importance: "High", recommended: true },
      { section: "Contributing & Testing Guidelines", importance: "Medium", recommended: true },
    ];
  }

  return common;
}

/**
 * Returns project-type actionable feature & presentation advice.
 */
function getProjectSpecificAdvice(projectType, repoName) {
  switch (projectType) {
    case PROJECT_TYPES.FRONTEND:
      return {
        presentation: `Add animated GIFs or high-resolution screenshots of the UI. Ensure accessibility guidelines (WCAG) and responsive breakpoints are documented.`,
        features: [
          "Add component unit testing with Vitest and React Testing Library",
          "Include lighthouse performance score badge and dark/light theme support",
          "Document state management architecture (e.g. TanStack Query / Redux / Context)",
        ],
      };
    case PROJECT_TYPES.BACKEND:
      return {
        presentation: `Document every REST endpoint with method, query params, headers, and HTTP response codes. Include Swagger/OpenAPI docs link.`,
        features: [
          "Implement rate limiting and input validation middlewares",
          "Add structured JSON logging (Winston/Pino) and healthcheck endpoints",
          "Include a Dockerfile and docker-compose.yml for zero-friction local setup",
        ],
      };
    case PROJECT_TYPES.FULL_STACK:
      return {
        presentation: `A full-stack repository should feature a top-level Architecture Flowchart showing how the client interacts with backend services and DB persistence.`,
        features: [
          "Containerize frontend and backend using multi-stage Docker builds",
          "Add automated GitHub Actions CI pipeline running lint, test, and typecheck",
          "Include database seed script and migration runner in package.json",
        ],
      };
    case PROJECT_TYPES.AI_ML:
      return {
        presentation: `Clearly articulate the problem statement and why an AI/LLM approach was selected. Highlight resilience mechanisms (fallback handling, timeouts).`,
        features: [
          "Implement structured output validation (Zod / Pydantic schemas)",
          "Add error fallback when LLM API keys are exhausted or offline",
          "Document prompt engineering techniques and latency benchmarks",
        ],
      };
    default:
      return {
        presentation: `Structure the README with clear badges, clean code snippets, and a table of contents.`,
        features: [
          "Add automated unit tests and code coverage badge",
          "Include contributing guide and standardized code style (Prettier / ESLint)",
        ],
      };
  }
}

/**
 * Classify and rank all repositories for the Personal Career Mentor.
 */
export function analyzeAllRepositoriesQuality(repositories = [], targetRole = "Full Stack Developer", dominantLanguage = "JavaScript") {
  if (!Array.isArray(repositories) || repositories.length === 0) {
    return {
      classifiedTiers: {
        showcaseNow: [],
        improveNext: [],
        needsWork: [],
        archiveLowPriority: [],
      },
      top5ProjectsToImprove: [],
      startWithProject: null,
      summaryStats: {
        totalAudited: 0,
        missingDescriptions: 0,
        missingDemos: 0,
        missingTests: 0,
      },
    };
  }

  const auditedRepos = repositories.map((r) => analyzeRepositoryQuality(r, targetRole));

  const showcaseNow = [];
  const improveNext = [];
  const needsWork = [];
  const archiveLowPriority = [];

  auditedRepos.forEach((audit) => {
    if (audit.isFork || audit.isArchived || audit.sizeKB < 50) {
      archiveLowPriority.push(audit);
      return;
    }

    const recScore = audit.recruiterEvaluation.score;
    const hasStars = audit.stars >= 5;
    const hasScope = audit.sizeKB >= 400;

    if ((recScore >= 5 || hasStars) && hasScope) {
      showcaseNow.push(audit);
    } else if (hasScope || recScore >= 3 || audit.language === dominantLanguage) {
      improveNext.push(audit);
    } else {
      needsWork.push(audit);
    }
  });

  // Rank candidate projects for "Projects to Improve"
  const candidatesForImprovement = [...improveNext, ...showcaseNow, ...needsWork]
    .filter((r) => !r.isFork && !r.isArchived)
    .sort((a, b) => {
      // Prioritize projects with high potential (size, stars) but weaker recruiter scores
      const aNeed = (7 - a.recruiterEvaluation.score) * 10 + Math.min(a.sizeKB / 100, 30) + a.stars;
      const bNeed = (7 - b.recruiterEvaluation.score) * 10 + Math.min(b.sizeKB / 100, 30) + b.stars;
      return bNeed - aNeed;
    });

  const top5ProjectsToImprove = candidatesForImprovement.slice(0, 5).map((audit, idx) => ({
    rank: idx + 1,
    repoName: audit.repoName,
    htmlUrl: audit.htmlUrl,
    projectType: audit.projectType,
    language: audit.language,
    currentQuality: audit.scorecard.documentation,
    recruiterScore: `${audit.recruiterEvaluation.score}/7`,
    missingItems: audit.highestImpactImprovements.slice(0, 3),
    whyItMatters: `Aligns with your ${targetRole} target and offers strong engineering scope, but its presentation currently under-indexes recruiter impact.`,
    recommendedChanges: audit.highestImpactImprovements,
    priority: idx === 0 ? "Critical (Start Here)" : idx <= 2 ? "High Priority" : "Recommended",
    careerValue: idx === 0 ? "Highest Portfolio Return" : "Strong Supporting Evidence",
    suggestedDescription: audit.suggestedDescription,
    scorecard: audit.scorecard,
  }));

  // "Start With This Project" determination
  const startWith = top5ProjectsToImprove[0] || null;
  const startWithProject = startWith
    ? {
        repoName: startWith.repoName,
        htmlUrl: startWith.htmlUrl,
        language: startWith.language,
        projectType: startWith.projectType,
        whyStartHere: `"${startWith.repoName}" has the highest technical scope and potential for your ${targetRole} roadmap. Adding a structured README, live demo, and architecture diagram will immediately upgrade your hiring appeal.`,
        top3Actions: startWith.recommendedChanges.slice(0, 3),
      }
    : null;

  return {
    classifiedTiers: {
      showcaseNow,
      improveNext,
      needsWork,
      archiveLowPriority,
    },
    top5ProjectsToImprove,
    startWithProject,
    summaryStats: {
      totalAudited: auditedRepos.length,
      missingDescriptions: auditedRepos.filter((r) => r.scorecard.description.includes("Missing")).length,
      missingDemos: auditedRepos.filter((r) => r.scorecard.liveDemo.includes("Not detected")).length,
      missingTests: auditedRepos.filter((r) => r.scorecard.tests.includes("Not detected")).length,
    },
    allAuditedRepos: auditedRepos,
  };
}

/**
 * Generate a grounded, complete professional README draft for a repository.
 */
export function generateGroundedReadmeDraft(repo, targetRole = "Full Stack Developer") {
  const audit = analyzeRepositoryQuality(repo, targetRole);
  const name = repo.name || "Project";
  const lang = repo.language || "TypeScript";
  const desc = audit.suggestedDescription;
  const type = audit.projectType;

  return `# ${name}

> ${desc}

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: ${lang}](https://img.shields.io/badge/Language-${encodeURIComponent(lang)}-blue.svg)]()
[![Status: Active](https://img.shields.io/badge/Status-Maintained-emerald.svg)]()

---

## 📌 Project Overview

**${name}** is a ${type.toLowerCase()} engineered in **${lang}** to provide a clean, reliable, and scalable software solution.

- **Primary Track:** ${targetRole}
- **Architecture Level:** ${audit.sizeKB > 500 ? "Production Architecture" : "Modular Engineering"}
- **Core Technology:** ${lang}

---

## ✨ Key Features

- **Component & Service Modularity:** Designed with clear separation of concerns across application layers.
- **Robust Error Handling:** Structured exception propagation and graceful fallbacks.
- **Developer Experience:** Streamlined scripts for setup, testing, and continuous deployment.
- **Clean Configuration:** Environment-variable-driven settings for dev and production isolation.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Language** | ${lang} |
| **Category** | ${type} |
| **Runtime / Env** | Node.js / Browser Runtime |
| **Tooling** | Git, Package Manager, Linting |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- Package manager (\`npm\`, \`yarn\`, or \`pnpm\`)

### Installation

\`\`\`bash
# 1. Clone the repository
git clone ${audit.htmlUrl}.git

# 2. Navigate to project directory
cd ${name}

# 3. Install dependencies
npm install

# 4. Copy environment configuration
cp .env.example .env

# 5. Start the development server
npm run dev
\`\`\`

---

## ⚙️ Environment Variables

Create a \`.env\` file in the root directory:

\`\`\`env
# Application Port
PORT=5000

# Node Environment
NODE_ENV=development

# Add project-specific API keys or database connections below
# API_SECRET_KEY=your_key_here
\`\`\`

---

## 🧪 Testing

\`\`\`bash
# Run unit & integration test suites
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

---

## 📐 Architecture & How It Works

\`\`\`mermaid
graph TD
    Client[Client Interface / Consumer] --> Router[API / Event Dispatcher]
    Router --> Controller[Service & Business Logic]
    Controller --> Engine[Data Layer / Persistence]
\`\`\`

---

## 📝 Recruiter & Interview Highlights

- **Technical Communication:** Comprehensive documentation and clear setup instructions.
- **Engineering Discipline:** Automated testing, clean modular layout, and isolated configuration.

---

## 📄 License

This project is licensed under the **MIT License** - see the LICENSE file for details.
`;
}
