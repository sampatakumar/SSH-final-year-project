/**
 * Canonical Skill Taxonomy Definitions for Smart Skill Hub.
 * Organizes skills into standardized categories with default metadata.
 */

export const SKILL_CATEGORIES = {
  LANGUAGES: "Programming Languages",
  FRONTEND: "Frontend Frameworks & Libraries",
  BACKEND: "Backend & Server Technologies",
  DATABASES: "Databases & Storage",
  DEVOPS: "DevOps & Infrastructure",
  CORE_CS: "Core Computer Science & Algorithms",
  TESTING: "Testing & Quality Assurance",
  TOOLS: "Developer Tools & Version Control",
};

export const CANONICAL_SKILL_TAXONOMY = {
  // Programming Languages
  "JavaScript": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["web", "frontend", "backend", "scripting"] },
  "TypeScript": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["web", "typed", "frontend", "backend"] },
  "Python": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["backend", "data", "ai", "scripting"] },
  "Java": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["backend", "enterprise", "oop"] },
  "C++": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["systems", "performance", "competitive-programming"] },
  "C": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["systems", "low-level"] },
  "C#": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["backend", "dotnet", "enterprise"] },
  "Go": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["backend", "cloud", "concurrency"] },
  "Rust": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["systems", "memory-safe", "performance"] },
  "PHP": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["backend", "web"] },
  "Ruby": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["backend", "web"] },
  "Kotlin": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["mobile", "android", "backend"] },
  "Swift": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["mobile", "ios"] },
  "SQL": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["database", "querying"] },
  "HTML": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["frontend", "markup"] },
  "CSS": { category: SKILL_CATEGORIES.LANGUAGES, tags: ["frontend", "styling"] },

  // Frontend Frameworks & Libraries
  "React": { category: SKILL_CATEGORIES.FRONTEND, tags: ["ui", "spa", "javascript", "components"] },
  "Next.js": { category: SKILL_CATEGORIES.FRONTEND, tags: ["react", "ssr", "fullstack"] },
  "Vue.js": { category: SKILL_CATEGORIES.FRONTEND, tags: ["ui", "spa", "javascript"] },
  "Angular": { category: SKILL_CATEGORIES.FRONTEND, tags: ["ui", "spa", "typescript", "enterprise"] },
  "Svelte": { category: SKILL_CATEGORIES.FRONTEND, tags: ["ui", "compiler", "javascript"] },
  "Tailwind CSS": { category: SKILL_CATEGORIES.FRONTEND, tags: ["css", "utility", "styling"] },
  "Redux": { category: SKILL_CATEGORIES.FRONTEND, tags: ["state-management", "react"] },
  "React Native": { category: SKILL_CATEGORIES.FRONTEND, tags: ["mobile", "cross-platform", "react"] },
  "Bootstrap": { category: SKILL_CATEGORIES.FRONTEND, tags: ["css", "styling"] },

  // Backend & Server Technologies
  "Node.js": { category: SKILL_CATEGORIES.BACKEND, tags: ["runtime", "javascript", "server"] },
  "Express.js": { category: SKILL_CATEGORIES.BACKEND, tags: ["node", "framework", "rest-api"] },
  "NestJS": { category: SKILL_CATEGORIES.BACKEND, tags: ["node", "typescript", "architecture"] },
  "Django": { category: SKILL_CATEGORIES.BACKEND, tags: ["python", "framework", "fullstack"] },
  "FastAPI": { category: SKILL_CATEGORIES.BACKEND, tags: ["python", "async", "rest-api"] },
  "Flask": { category: SKILL_CATEGORIES.BACKEND, tags: ["python", "microframework"] },
  "Spring Boot": { category: SKILL_CATEGORIES.BACKEND, tags: ["java", "enterprise", "microservices"] },
  "GraphQL": { category: SKILL_CATEGORIES.BACKEND, tags: ["api", "query-language"] },
  "REST APIs": { category: SKILL_CATEGORIES.BACKEND, tags: ["api", "architecture", "http"] },
  "gRPC": { category: SKILL_CATEGORIES.BACKEND, tags: ["microservices", "protobuf", "rpc"] },

  // Databases & Storage
  "MongoDB": { category: SKILL_CATEGORIES.DATABASES, tags: ["nosql", "document", "json"] },
  "PostgreSQL": { category: SKILL_CATEGORIES.DATABASES, tags: ["relational", "sql", "acid"] },
  "MySQL": { category: SKILL_CATEGORIES.DATABASES, tags: ["relational", "sql"] },
  "Redis": { category: SKILL_CATEGORIES.DATABASES, tags: ["in-memory", "cache", "nosql"] },
  "SQLite": { category: SKILL_CATEGORIES.DATABASES, tags: ["embedded", "sql"] },
  "Supabase": { category: SKILL_CATEGORIES.DATABASES, tags: ["baas", "postgres", "storage"] },
  "Firebase Firestore": { category: SKILL_CATEGORIES.DATABASES, tags: ["nosql", "realtime", "baas"] },
  "Prisma": { category: SKILL_CATEGORIES.DATABASES, tags: ["orm", "typescript", "database"] },
  "Mongoose": { category: SKILL_CATEGORIES.DATABASES, tags: ["odm", "mongodb", "nodejs"] },

  // DevOps & Infrastructure
  "Docker": { category: SKILL_CATEGORIES.DEVOPS, tags: ["containers", "virtualization"] },
  "Kubernetes": { category: SKILL_CATEGORIES.DEVOPS, tags: ["orchestration", "containers", "cloud"] },
  "AWS": { category: SKILL_CATEGORIES.DEVOPS, tags: ["cloud", "infrastructure"] },
  "GitHub Actions": { category: SKILL_CATEGORIES.DEVOPS, tags: ["ci-cd", "automation"] },
  "Linux": { category: SKILL_CATEGORIES.DEVOPS, tags: ["os", "sysadmin", "cli"] },
  "CI/CD": { category: SKILL_CATEGORIES.DEVOPS, tags: ["devops", "pipelines", "automation"] },
  "Nginx": { category: SKILL_CATEGORIES.DEVOPS, tags: ["web-server", "reverse-proxy"] },

  // Core Computer Science & Algorithms
  "Data Structures": { category: SKILL_CATEGORIES.CORE_CS, tags: ["algorithms", "foundations"] },
  "Algorithms": { category: SKILL_CATEGORIES.CORE_CS, tags: ["problem-solving", "complexity"] },
  "Arrays": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "fundamentals"] },
  "Hash Maps": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "hashing"] },
  "Strings": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "algorithms"] },
  "Two Pointers": { category: SKILL_CATEGORIES.CORE_CS, tags: ["algorithms", "patterns"] },
  "Stack": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "lifo"] },
  "Queue": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "fifo"] },
  "Trees": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "hierarchy", "recursion"] },
  "Graphs": { category: SKILL_CATEGORIES.CORE_CS, tags: ["data-structures", "networks", "bfs-dfs"] },
  "Dynamic Programming": { category: SKILL_CATEGORIES.CORE_CS, tags: ["algorithms", "optimization"] },
  "Binary Search": { category: SKILL_CATEGORIES.CORE_CS, tags: ["algorithms", "searching"] },
  "Sorting": { category: SKILL_CATEGORIES.CORE_CS, tags: ["algorithms", "ordering"] },
  "Problem Solving": { category: SKILL_CATEGORIES.CORE_CS, tags: ["coding", "logic"] },

  // Developer Tools
  "Git": { category: SKILL_CATEGORIES.TOOLS, tags: ["vcs", "collaboration", "version-control"] },
  "GitHub": { category: SKILL_CATEGORIES.TOOLS, tags: ["vcs", "hosting", "open-source"] },
  "Postman": { category: SKILL_CATEGORIES.TOOLS, tags: ["api-testing", "tools"] },
  "Vite": { category: SKILL_CATEGORIES.TOOLS, tags: ["build-tool", "bundler", "frontend"] },
  "Webpack": { category: SKILL_CATEGORIES.TOOLS, tags: ["bundler", "build-tool"] },

  // Testing
  "Jest": { category: SKILL_CATEGORIES.TESTING, tags: ["unit-testing", "javascript"] },
  "Vitest": { category: SKILL_CATEGORIES.TESTING, tags: ["unit-testing", "vite"] },
  "Playwright": { category: SKILL_CATEGORIES.TESTING, tags: ["e2e-testing", "automation"] },
  "Cypress": { category: SKILL_CATEGORIES.TESTING, tags: ["e2e-testing", "frontend"] },
};
