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
  ELECTRONICS: "Electronics & Embedded Systems",
  ELECTRICAL: "Electrical & Power Systems",
  MECHANICAL: "Mechanical, CAD & Robotics",
  CIVIL: "Civil & BIM Architecture",
  FINANCE_BI: "Finance & Business Intelligence",
  BIOTECH: "Biotechnology & Life Sciences",
  CLINICAL: "Clinical & Healthcare Operations",
  ARTS_MEDIA: "Arts, Media & Communication",
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

  // Electronics & Embedded Systems
  "Embedded C": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["embedded", "firmware", "c"] },
  "RTOS": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["embedded", "realtime", "freertos"] },
  "Microcontrollers": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["hardware", "arm", "stm32", "esp32"] },
  "Verilog / SystemVerilog": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["vlsi", "fpga", "hdl", "asic"] },
  "VHDL": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["vlsi", "fpga", "hdl"] },
  "Static Timing Analysis": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["vlsi", "sta", "timing"] },
  "FPGA Prototyping": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["vlsi", "fpga", "hardware"] },
  "MQTT": { category: SKILL_CATEGORIES.ELECTRONICS, tags: ["iot", "protocols", "telemetry"] },

  // Electrical & Power Systems
  "MATLAB / Simulink": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["modeling", "simulation", "control", "power"] },
  "ETAP": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["power-systems", "grid", "load-flow"] },
  "Power Grid Modeling": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["electrical", "power", "grid"] },
  "Relay Coordination": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["protection", "relays", "power"] },
  "Control Systems": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["pid", "feedback", "stability"] },
  "PLC Programming": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["automation", "industrial", "ladder-logic"] },
  "SCADA": { category: SKILL_CATEGORIES.ELECTRICAL, tags: ["industrial", "monitoring", "hmi"] },

  // Mechanical, CAD & Robotics
  "SolidWorks": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["cad", "3d-modeling", "mechanical"] },
  "AutoCAD": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["cad", "drafting", "2d-drawing"] },
  "CATIA": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["cad", "aerospace", "automotive"] },
  "PTC Creo": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["cad", "parametric", "mechanical"] },
  "GD&T": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["tolerancing", "manufacturing", "asme"] },
  "CNC Programming": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["machining", "g-code", "cam"] },
  "ROS 2": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["robotics", "ros", "autonomous-systems"] },
  "Robot Kinematics": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["robotics", "inverse-kinematics", "dynamics"] },
  "SLAM": { category: SKILL_CATEGORIES.MECHANICAL, tags: ["robotics", "navigation", "mapping"] },

  // Civil & BIM Architecture
  "STAAD.Pro": { category: SKILL_CATEGORIES.CIVIL, tags: ["structural", "analysis", "civil"] },
  "ETABS": { category: SKILL_CATEGORIES.CIVIL, tags: ["structural", "buildings", "fem"] },
  "Autodesk Revit": { category: SKILL_CATEGORIES.CIVIL, tags: ["bim", "architecture", "mep", "structure"] },
  "Navisworks": { category: SKILL_CATEGORIES.CIVIL, tags: ["bim", "clash-detection", "coordination"] },
  "BIM Coordination": { category: SKILL_CATEGORIES.CIVIL, tags: ["bim", "lod", "collaboration"] },
  "Civil 3D": { category: SKILL_CATEGORIES.CIVIL, tags: ["infrastructure", "grading", "civil"] },

  // Finance & Business Intelligence
  "Power BI": { category: SKILL_CATEGORIES.FINANCE_BI, tags: ["bi", "analytics", "dax", "dashboards"] },
  "Tableau": { category: SKILL_CATEGORIES.FINANCE_BI, tags: ["bi", "visualization", "dashboards"] },
  "Financial Modeling": { category: SKILL_CATEGORIES.FINANCE_BI, tags: ["finance", "valuation", "forecasting"] },
  "DCF Valuation": { category: SKILL_CATEGORIES.FINANCE_BI, tags: ["corporate-finance", "valuation", "dcf"] },
  "DAX": { category: SKILL_CATEGORIES.FINANCE_BI, tags: ["power-bi", "formulas", "measures"] },

  // Biotechnology & Life Sciences
  "Bioinformatics": { category: SKILL_CATEGORIES.BIOTECH, tags: ["genomics", "computational-biology", "data"] },
  "BLAST": { category: SKILL_CATEGORIES.BIOTECH, tags: ["sequence-alignment", "ncbi", "bioinformatics"] },
  "Molecular Docking": { category: SKILL_CATEGORIES.BIOTECH, tags: ["drug-discovery", "autodock", "proteins"] },
  "Bioprocess Optimization": { category: SKILL_CATEGORIES.BIOTECH, tags: ["fermentation", "scale-up", "bioprocess"] },

  // Clinical & Healthcare Operations
  "Clinical Patient Assessment": { category: SKILL_CATEGORIES.CLINICAL, tags: ["nursing", "vitals", "diagnosis", "healthcare"] },
  "Pharmacology & Drug Administration": { category: SKILL_CATEGORIES.CLINICAL, tags: ["pharmacology", "dosage", "clinical-safety"] },
  "Patient Monitoring & Triage": { category: SKILL_CATEGORIES.CLINICAL, tags: ["icu", "emergency", "triage", "vitals"] },
  "Medical Informatics & EHR": { category: SKILL_CATEGORIES.CLINICAL, tags: ["ehr", "health-records", "hipaa", "informatics"] },

  // Arts, Media & Communication
  "Content Strategy & Copywriting": { category: SKILL_CATEGORIES.ARTS_MEDIA, tags: ["writing", "strategy", "brand", "media"] },
  "Technical Writing": { category: SKILL_CATEGORIES.ARTS_MEDIA, tags: ["documentation", "api-docs", "manuals"] },
  "Public Relations & Corporate Comm": { category: SKILL_CATEGORIES.ARTS_MEDIA, tags: ["pr", "press-releases", "communication"] },
  "Digital Media Production": { category: SKILL_CATEGORIES.ARTS_MEDIA, tags: ["multimedia", "audio-video", "editing"] },
};
