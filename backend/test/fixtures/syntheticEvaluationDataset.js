/**
 * ============================================================================
 * PHASE 23: SYNTHETIC EVALUATION DATASET
 * ============================================================================
 *
 * Version-controlled, synthetic benchmark dataset containing 12 representative
 * student profiles and expected evaluation properties across Smart Skill Hub:
 * - AI Mentor context quality
 * - GitHub skill evidence & provenance
 * - Career intelligence & multi-role scoring
 * - Learning roadmap recommendations & prerequisite ordering
 * - Adaptive progress evaluation & competency gates
 * - Resume ATS estimation & heuristic explainability
 * - EduTube educational classification
 *
 * NOTE: All records use synthetic identities, fake handles, and mocked data.
 * No real student personal data or production credentials are included.
 * ============================================================================
 */

import mongoose from "mongoose";

export const SYNTHETIC_STUDENT_PROFILES = {
  // 1. Beginner with little/no coding evidence
  beginner_minimal_evidence: {
    id: new mongoose.Types.ObjectId("65b000000000000000000010"),
    displayName: "Sam Beginner",
    email: "sam.beginner@synthetic.edu",
    targetRole: "Full Stack Developer",
    academic: {
      degreeName: "",
      branchName: "",
      isConfigured: false,
    },
    github: {
      username: "sam-beginner-dev",
      connected: false,
      repositories: [],
      languages: {},
    },
    resume: null,
    evaluatedSkills: [],
    learningActivities: [],
    codingSubmissions: [],
    expectedProperties: {
      benchmarkStatus: "validated",
      evidenceCoverage: "sparse",
      roleMatchPercentage: 0,
      hasDirectEvidence: false,
      shouldDiscloseSparseNotice: true,
      shouldBlockFabricatedCollege: true,
      topGapPriority: "Critical",
    },
  },

  // 2. Student with strong JavaScript & Frontend evidence
  strong_javascript_developer: {
    id: new mongoose.Types.ObjectId("65b000000000000000000020"),
    displayName: "Maya Frontend",
    email: "maya.frontend@synthetic.edu",
    targetRole: "Frontend Developer",
    academic: {
      degreeName: "Bachelor of Technology",
      branchName: "Computer Science and Engineering",
      currentYear: 4,
      currentSemester: 8,
      isConfigured: true,
    },
    github: {
      username: "maya-frontend-lead",
      connected: true,
      dominantLanguage: "JavaScript",
      repositories: [
        {
          name: "react-design-system",
          language: "JavaScript",
          fork: false,
          stars: 12,
          size: 45000,
          description: "Production design system with comprehensive Vitest suite",
          topics: ["react", "javascript", "vitest", "tailwind", "ui"],
        },
        {
          name: "nextjs-ecommerce-app",
          language: "TypeScript",
          fork: false,
          stars: 8,
          size: 60000,
          description: "Full-featured online store with server actions and responsive layout",
          topics: ["nextjs", "typescript", "react", "testing"],
        },
        {
          name: "portfolio-v3",
          language: "JavaScript",
          fork: false,
          stars: 4,
          size: 15000,
          description: "Personal portfolio website with dark mode and micro-interactions",
          topics: ["javascript", "css3", "html5"],
        },
      ],
      languages: {
        JavaScript: { size: 60000, percentage: 65, repoCount: 2 },
        TypeScript: { size: 30000, percentage: 35, repoCount: 1 },
      },
      aggregateStats: { totalStars: 24, totalForks: 5 },
    },
    evaluatedSkills: [
      { skill: "JavaScript", score: 85, level: "Proficient", confidence: 0.85, sources: ["github", "coding"] },
      { skill: "HTML/CSS", score: 80, level: "Competent", confidence: 0.80, sources: ["github"] },
      { skill: "React", score: 78, level: "Competent", confidence: 0.80, sources: ["github"] },
    ],
    learningActivities: [
      { activityType: "coding_passed", skill: "JavaScript", isDemonstratedCompetency: true },
    ],
    codingSubmissions: [
      { taskId: "two-sum", status: "passed", skillsCovered: ["JavaScript", "Data Structures"] },
    ],
    expectedProperties: {
      benchmarkStatus: "validated",
      evidenceCoverage: "moderate",
      roleMatchPercentage: 75,
      isFrontendHeavy: true,
      hasDirectEvidence: true,
      primarySkillProven: "JavaScript",
    },
  },

  // 3. Student with strong Python & Backend evidence
  strong_python_engineer: {
    id: new mongoose.Types.ObjectId("65b000000000000000000030"),
    displayName: "Liam Python",
    email: "liam.python@synthetic.edu",
    targetRole: "Backend Developer",
    academic: {
      degreeName: "Bachelor of Engineering",
      branchName: "Information Science",
      currentYear: 3,
      currentSemester: 6,
      isConfigured: true,
    },
    github: {
      username: "liam-backend-py",
      connected: true,
      dominantLanguage: "Python",
      repositories: [
        {
          name: "fastapi-microservice",
          language: "Python",
          fork: false,
          stars: 15,
          size: 55000,
          description: "Async RESTful microservice with PostgreSQL connection pooling and Docker",
          topics: ["python", "fastapi", "docker", "postgresql", "pytest"],
        },
        {
          name: "distributed-task-worker",
          language: "Python",
          fork: false,
          stars: 10,
          size: 40000,
          description: "Celery and Redis task queue processing background asynchronous pipelines",
          topics: ["python", "redis", "docker", "ci"],
        },
      ],
      languages: {
        Python: { size: 95000, percentage: 90, repoCount: 2 },
      },
      aggregateStats: { totalStars: 25, totalForks: 4 },
    },
    evaluatedSkills: [
      { skill: "Python", score: 88, level: "Proficient", confidence: 0.90, sources: ["github", "coding"] },
      { skill: "Docker", score: 72, level: "Competent", confidence: 0.75, sources: ["github"] },
      { skill: "REST APIs", score: 80, level: "Competent", confidence: 0.85, sources: ["github"] },
    ],
    learningActivities: [
      { activityType: "coding_passed", skill: "Python", isDemonstratedCompetency: true },
    ],
    expectedProperties: {
      benchmarkStatus: "validated",
      evidenceCoverage: "moderate",
      hasBackendSignals: true,
      hasDockerEvidence: true,
    },
  },

  // 4. Student with an incomplete GitHub profile
  incomplete_github_profile: {
    id: new mongoose.Types.ObjectId("65b000000000000000000040"),
    displayName: "Alex Blank",
    email: "alex.blank@synthetic.edu",
    targetRole: "Full Stack Developer",
    github: {
      username: "alex-blank-repos",
      connected: true,
      repositories: [],
      languages: {},
      profile: { publicRepos: 0 },
    },
    expectedProperties: {
      connectionState: "connected_zero_repos",
      engineeringQualityScore: 0,
      shouldGuideToAddRepositories: true,
    },
  },

  // 5. Student with private or inaccessible repositories
  private_inaccessible_repos: {
    id: new mongoose.Types.ObjectId("65b000000000000000000050"),
    displayName: "Elena Private",
    email: "elena.priv@synthetic.edu",
    targetRole: "Full Stack Developer",
    github: {
      username: "elena-all-private",
      connected: true,
      syncStatus: "failed",
      syncError: "Repositories are private or access token lacks repo scope",
      repositories: [],
    },
    expectedProperties: {
      connectionState: "sync_failed",
      shouldSurfaceSyncAlert: true,
      evidenceCategory: "unavailable_data",
    },
  },

  // 6. Student with a resume that conflicts with available repository evidence
  resume_conflicting_github: {
    id: new mongoose.Types.ObjectId("65b000000000000000000060"),
    displayName: "Jordan Claims",
    email: "jordan.claims@synthetic.edu",
    targetRole: "Full Stack Developer",
    resume: {
      title: "Senior Cloud & Go Systems Architect",
      professionalSummary: "Expert Go engineer with 5 years experience building Kubernetes operators.",
      skills: {
        languages: ["Go", "Rust", "C++"],
        frameworks: ["Kubernetes", "gRPC"],
        tools: ["Docker", "Terraform"],
      },
    },
    github: {
      username: "jordan-frontend-only",
      connected: true,
      dominantLanguage: "HTML",
      repositories: [
        {
          name: "simple-html-page",
          language: "HTML",
          fork: true,
          stars: 0,
          size: 1200,
          description: "Forked static webpage template",
          topics: ["html"],
        },
      ],
      languages: {
        HTML: { size: 1200, percentage: 100, repoCount: 1 },
      },
    },
    expectedProperties: {
      hasConflictingEvidence: true,
      unsupportedResumeClaims: ["Go", "Rust", "Kubernetes"],
      observedLanguageIsForkOnly: true,
    },
  },

  // 7. Student targeting multiple career roles
  multi_role_aspirant: {
    id: new mongoose.Types.ObjectId("65b000000000000000000070"),
    displayName: "Casey CrossRole",
    email: "casey.multi@synthetic.edu",
    targetRole: "Frontend Developer",
    targetRoles: ["Frontend Developer", "DevOps Engineer"],
    evaluatedSkills: [
      { skill: "JavaScript", score: 75, level: "Competent" },
      { skill: "Docker", score: 70, level: "Competent" },
      { skill: "Linux CLI", score: 65, level: "Competent" },
    ],
    expectedProperties: {
      comparedRolesCount: 2,
      sharedCompetenciesIdentified: true,
      highLeverageOverlapSkills: ["Docker", "Linux CLI"],
    },
  },

  // 8. Student selecting a role with benchmark_pending status
  benchmark_pending_role: {
    id: new mongoose.Types.ObjectId("65b000000000000000000080"),
    displayName: "Robin Quantum",
    email: "robin.quantum@synthetic.edu",
    targetRole: "Quantum Computing Systems Engineer",
    evaluatedSkills: [
      { skill: "Python", score: 80, level: "Competent" },
      { skill: "Linear Algebra", score: 85, level: "Proficient" },
    ],
    expectedProperties: {
      benchmarkStatus: "unknown_role",
      benchmarkPending: true,
      roleMatchPercentage: null,
      shouldNotFabricateScores: true,
    },
  },

  // 9. Student with completed learning activities but weak assessment evidence
  completed_learning_weak_assessment: {
    id: new mongoose.Types.ObjectId("65b000000000000000000090"),
    displayName: "Taylor Watcher",
    email: "taylor.watcher@synthetic.edu",
    targetRole: "Frontend Developer",
    evaluatedSkills: [
      { skill: "JavaScript", score: 75, level: "Competent", confidence: 0.8 },
      { skill: "HTML/CSS", score: 70, level: "Competent", confidence: 0.8 },
      { skill: "DOM API", score: 65, level: "Competent", confidence: 0.7 },
      { skill: "React", score: 35, level: "Developing", confidence: 0.4 },
    ],
    learningActivities: [
      { activityType: "module_completed", skill: "React", isDemonstratedCompetency: false },
      { activityType: "module_completed", skill: "React", isDemonstratedCompetency: false },
    ],
    codingSubmissions: [],
    expectedProperties: {
      demonstratedCompetency: false,
      recommendedNextActionType: "practice_validation",
      shouldRequireSandboxTest: true,
    },
  },

  // 10. Student with failed or interrupted coding executions
  failed_interrupted_coding: {
    id: new mongoose.Types.ObjectId("65b0000000000000000000A0"),
    displayName: "Morgan Retry",
    email: "morgan.retry@synthetic.edu",
    targetRole: "Backend Developer",
    evaluatedSkills: [
      { skill: "JavaScript", score: 75, level: "Competent", confidence: 0.8 },
      { skill: "Asynchronous Programming", score: 70, level: "Competent", confidence: 0.8 },
      { skill: "Node.js", score: 40, level: "Developing" },
    ],
    codingSubmissions: [
      { taskId: "node-api-server", status: "timeout", executionTimeMs: 5000 },
      { taskId: "node-api-server", status: "system_error", executionTimeMs: 120 },
      { taskId: "node-api-server", status: "failed", failed: 3, total: 5 },
    ],
    learningActivities: [
      { activityType: "coding_failed", skill: "Node.js", isDemonstratedCompetency: false },
      { activityType: "coding_failed", skill: "Node.js", isDemonstratedCompetency: false },
    ],
    expectedProperties: {
      repeatedFailureDetected: true,
      remediationRequired: true,
      competencyAwarded: false,
      actionType: "targeted_remediation",
    },
  },

  // 11. Student with sparse or contradictory evidence
  sparse_contradictory_evidence: {
    id: new mongoose.Types.ObjectId("65b0000000000000000000B0"),
    displayName: "Drew Sparse",
    email: "drew.sparse@synthetic.edu",
    targetRole: "DevOps Engineer",
    evaluatedSkills: [
      { skill: "Docker", score: 20, level: "Limited Evidence", confidence: 0.25 },
    ],
    expectedProperties: {
      evidenceCoverage: "sparse",
      evidenceNoticeIncludesSparse: true,
      doesNotImplyIncompetence: true,
    },
  },

  // 12. Student whose profile changes after recommendations have been cached
  stale_cache_profile_mutation: {
    id: new mongoose.Types.ObjectId("65b0000000000000000000C0"),
    displayName: "Avery Mutating",
    email: "avery.mutating@synthetic.edu",
    initialRole: "Frontend Developer",
    updatedRole: "Backend Developer",
    expectedProperties: {
      cacheInvalidatedAfterMutation: true,
      postMutationTargetRole: "Backend Developer",
    },
  },
};

/**
 * Synthetic YouTube / EduTube candidate dataset for classifier evaluation.
 */
export const SYNTHETIC_EDUTUBE_CANDIDATES = [
  // 1. Genuine Full Programming Course (Category 27, Verified Channel)
  {
    videoId: "synth-course-01",
    title: "TypeScript Full Course for Beginners 2026 - Master Interfaces, Generics & Node.js APIs",
    description: "Complete course syllabus teaching modern TypeScript from scratch with hands-on exercises and unit tests.",
    channelTitle: "freeCodeCamp.org",
    categoryId: "27", // Education
    durationSeconds: 14400, // 4 hours
    embeddable: true,
    expectedDecision: "allow",
    expectedCategory: "programming_tutorial",
    type: "genuine_educational",
  },
  // 2. Academic Lecture (University format)
  {
    videoId: "synth-lecture-02",
    title: "MIT 6.006 Introduction to Algorithms - Lecture 1: Algorithmic Thinking, Peak Finding",
    description: "Official MIT OpenCourseWare lecture recording on asymptotic analysis and divide-and-conquer algorithms.",
    channelTitle: "MIT OpenCourseWare",
    categoryId: "27",
    durationSeconds: 3200,
    embeddable: true,
    expectedDecision: "allow",
    expectedCategory: "academic_lecture",
    type: "genuine_educational",
  },
  // 3. Official Music Video (Category 10)
  {
    videoId: "synth-music-03",
    title: "Pop Superstar - Summer Hit [Official Music Video] (feat. Rapper)",
    description: "Stream the new single worldwide. Produced by HitMaker Records.",
    channelTitle: "PopStar VEVO",
    categoryId: "10", // Music
    durationSeconds: 220,
    embeddable: true,
    expectedDecision: "reject",
    expectedReason: "HARD_BLOCK_MUSIC",
    type: "entertainment",
  },
  // 4. Movie Trailer (Category 44)
  {
    videoId: "synth-trailer-04",
    title: "Galactic Odyssey 2 - Official Teaser Trailer #1 (2026 Movie)",
    description: "In cinemas worldwide July 2026. Watch the full movie trailer now.",
    channelTitle: "Universal Studios Trailers",
    categoryId: "44", // Trailers
    durationSeconds: 155,
    embeddable: true,
    expectedDecision: "reject",
    expectedReason: "HARD_BLOCK_MOVIE_TRAILER",
    type: "entertainment",
  },
  // 5. YouTube Shorts (< 60s)
  {
    videoId: "synth-shorts-05",
    title: "Crazy CSS animation trick in 25 seconds! #shorts",
    description: "Check out this quick trick for your web apps! #coding #shorts",
    channelTitle: "QuickCodingHacks",
    categoryId: "28",
    durationSeconds: 25,
    embeddable: true,
    expectedDecision: "reject",
    expectedReason: "HARD_BLOCK_SHORTS",
    type: "short_form",
  },
  // 6. Long but non-educational video (Gaming walkthrough / Let's play)
  {
    videoId: "synth-gaming-06",
    title: "Elden Ring 100% Full Gameplay Walkthrough Part 12 - No Commentary (4K 60FPS)",
    description: "Complete gameplay walkthrough covering all secret bosses and weapons.",
    channelTitle: "GamerProWalkthroughs",
    categoryId: "20", // Gaming
    durationSeconds: 7200, // 2 hours
    embeddable: true,
    expectedDecision: "reject",
    expectedReason: "HARD_BLOCK_UNRELATED_GAMING",
    type: "gaming",
  },
  // 7. Video with ambiguous title containing injected educational keywords
  {
    videoId: "synth-ambiguous-07",
    title: "Learning how to survive 100 days in Minecraft hardcore! (Tutorial & Guide)",
    description: "Can we survive? Watch our funny challenge episode where everything goes wrong!",
    channelTitle: "FunnyGamingChallenges",
    categoryId: "20",
    durationSeconds: 1800,
    embeddable: true,
    expectedDecision: "reject",
    type: "ambiguous_clickbait",
  },
  // 8. Missing duration metadata (< minimum duration default fallback)
  {
    videoId: "synth-duration-08",
    title: "Quick React snippet demo",
    description: "Quick demo video with 45s duration",
    channelTitle: "DevSnippets",
    categoryId: "28",
    durationSeconds: 45,
    embeddable: true,
    expectedDecision: "reject",
    expectedReason: "HARD_BLOCK_SHORTS",
    type: "below_minimum_duration",
  },
];
