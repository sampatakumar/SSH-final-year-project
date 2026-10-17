/**
 * Target Role Skill Requirements and Benchmarks.
 * Defines standard industry expectations for 24 career tracks across web, systems, data, cloud, and AI.
 */

export const TARGET_ROLES = {
  // Original legacy constants for backwards compatibility
  FULL_STACK_DEVELOPER: "Full Stack Developer",
  FRONTEND_ENGINEER: "Frontend Engineer",
  BACKEND_NODE_ENGINEER: "Backend Node.js Engineer",
  DATA_STRUCTURES_ALGORITHMS: "Software Engineer (General / Core CS)",

  // Expanded 24 role catalogue
  FRONTEND_DEVELOPER: "Frontend Developer",
  REACT_DEVELOPER: "React Developer",
  FULL_STACK_DEV: "Full Stack Developer",
  BACKEND_DEVELOPER: "Backend Developer",
  NODE_JS_DEVELOPER: "Node.js Developer",
  PYTHON_DEVELOPER: "Python Developer",
  JAVA_DEVELOPER: "Java Developer",
  SOFTWARE_ENGINEER: "Software Engineer",
  JUNIOR_SOFTWARE_ENGINEER: "Junior Software Engineer",
  MOBILE_APP_DEVELOPER: "Mobile App Developer",
  DEVOPS_ENGINEER: "DevOps Engineer",
  CLOUD_ENGINEER: "Cloud Engineer",
  SITE_RELIABILITY_ENGINEER: "Site Reliability Engineer",
  QA_AUTOMATION_ENGINEER: "QA Automation Engineer",
  SOFTWARE_TEST_ENGINEER: "Software Test Engineer",
  DATA_ANALYST: "Data Analyst",
  DATA_ENGINEER: "Data Engineer",
  MACHINE_LEARNING_ENGINEER: "Machine Learning Engineer",
  AI_APPLICATION_DEVELOPER: "AI Application Developer",
  CYBERSECURITY_ANALYST: "Cybersecurity Analyst",
  DATABASE_DEVELOPER: "Database Developer",
  API_INTEGRATION_DEVELOPER: "API and Integration Developer",
  OPEN_SOURCE_CONTRIBUTOR: "Open Source Contributor",
  TECHNICAL_SUPPORT_ENGINEER: "Technical Support Engineer",

  // Multi-Branch Engineering & Business Tracks
  EMBEDDED_SYSTEMS_ENGINEER: "Embedded Systems Engineer",
  VLSI_DESIGN_ENGINEER: "VLSI Design Engineer",
  IOT_DEVELOPER: "IoT Developer",
  POWER_SYSTEMS_ENGINEER: "Power Systems Engineer",
  CONTROL_SYSTEMS_ENGINEER: "Control Systems Engineer",
  CAD_CAM_ENGINEER: "CAD/CAM Engineer",
  ROBOTICS_ENGINEER: "Robotics Engineer",
  STRUCTURAL_DESIGN_ENGINEER: "Structural Design Engineer",
  BIM_SPECIALIST: "BIM Specialist",
  FINANCIAL_ANALYST: "Financial Analyst",
  BUSINESS_INTELLIGENCE_ANALYST: "Business Intelligence Analyst",
};

export const ROLE_REQUIREMENTS = {
  // 1. Frontend Developer / Frontend Engineer
  "Frontend Developer": {
    roleName: "Frontend Developer",
    description: "Specializes in building responsive, accessible, high-performance web user interfaces.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "HTML", importance: "critical", minProficiency: "Proficient" },
      { skill: "CSS", importance: "critical", minProficiency: "Proficient" },
      { skill: "React", importance: "critical", minProficiency: "Proficient" },
      { skill: "Tailwind CSS", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Next.js", importance: "high", minProficiency: "Competent" },
      { skill: "Vite", importance: "medium", minProficiency: "Competent" },
      { skill: "Vitest", importance: "medium", minProficiency: "Developing" },
      { skill: "Redux", importance: "medium", minProficiency: "Developing" },
    ],
  },

  "Frontend Engineer": {
    roleName: "Frontend Engineer",
    description: "Specializes in building responsive, accessible, high-performance user interfaces and SPAs.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "React", importance: "critical", minProficiency: "Proficient" },
      { skill: "HTML", importance: "critical", minProficiency: "Proficient" },
      { skill: "CSS", importance: "critical", minProficiency: "Proficient" },
      { skill: "Tailwind CSS", importance: "high", minProficiency: "Competent" },
      { skill: "Redux", importance: "medium", minProficiency: "Developing" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Vite", importance: "medium", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Next.js", importance: "high" },
      { skill: "REST APIs", importance: "high" },
      { skill: "Vitest", importance: "medium" },
      { skill: "Playwright", importance: "low" },
    ],
  },

  // 2. React Developer
  "React Developer": {
    roleName: "React Developer",
    description: "Focuses on building rich single-page applications and component architectures with React.",
    coreSkills: [
      { skill: "React", importance: "critical", minProficiency: "Proficient" },
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "HTML", importance: "critical", minProficiency: "Proficient" },
      { skill: "CSS", importance: "high", minProficiency: "Competent" },
      { skill: "Tailwind CSS", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Next.js", importance: "high", minProficiency: "Competent" },
      { skill: "Redux", importance: "medium", minProficiency: "Developing" },
      { skill: "Jest", importance: "medium", minProficiency: "Developing" },
    ],
  },

  // 3. Full Stack Developer
  "Full Stack Developer": {
    roleName: "Full Stack Developer",
    description: "Builds complete web applications with modern frontend frameworks, backend APIs, and database persistence.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "React", importance: "critical", minProficiency: "Proficient" },
      { skill: "Node.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "Express.js", importance: "high", minProficiency: "Competent" },
      { skill: "MongoDB", importance: "high", minProficiency: "Competent" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "high", minProficiency: "Competent" },
      { skill: "Docker", importance: "medium", minProficiency: "Developing" },
    ],
    recommendedSkills: [
      { skill: "Next.js", importance: "medium" },
      { skill: "PostgreSQL", importance: "medium" },
      { skill: "Tailwind CSS", importance: "medium" },
      { skill: "CI/CD", importance: "medium" },
      { skill: "Jest", importance: "low" },
    ],
  },

  // 4. Backend Developer
  "Backend Developer": {
    roleName: "Backend Developer",
    description: "Architects scalable server-side systems, data storage, and resilient APIs.",
    coreSkills: [
      { skill: "Node.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "Express.js", importance: "high", minProficiency: "Competent" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "PostgreSQL", importance: "high", minProficiency: "Competent" },
      { skill: "MongoDB", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Docker", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Redis", importance: "high" },
      { skill: "TypeScript", importance: "high" },
      { skill: "CI/CD", importance: "medium" },
    ],
  },

  // 5. Node.js Developer / Backend Node.js Engineer
  "Node.js Developer": {
    roleName: "Node.js Developer",
    description: "Builds high-performance server-side microservices, event-driven backends, and APIs with Node.js.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "Node.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "Express.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "MongoDB", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Docker", importance: "high" },
      { skill: "PostgreSQL", importance: "high" },
      { skill: "Redis", importance: "medium" },
    ],
  },

  "Backend Node.js Engineer": {
    roleName: "Backend Node.js Engineer",
    description: "Designs robust backend architectures, distributed services, databases, and secure APIs.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Proficient" },
      { skill: "Node.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "Express.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "MongoDB", importance: "high", minProficiency: "Proficient" },
      { skill: "PostgreSQL", importance: "high", minProficiency: "Competent" },
      { skill: "Docker", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Redis", importance: "high" },
      { skill: "GraphQL", importance: "medium" },
      { skill: "CI/CD", importance: "medium" },
      { skill: "Linux", importance: "medium" },
      { skill: "Nginx", importance: "low" },
    ],
  },

  // 6. Python Developer
  "Python Developer": {
    roleName: "Python Developer",
    description: "Develops scalable backend services, automated scripts, and data workflows using Python.",
    coreSkills: [
      { skill: "Python", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "PostgreSQL", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Docker", importance: "high" },
      { skill: "Linux", importance: "medium" },
      { skill: "Redis", importance: "medium" },
    ],
  },

  // 7. Java Developer
  "Java Developer": {
    roleName: "Java Developer",
    description: "Builds enterprise-grade backends, object-oriented systems, and microservices with Java.",
    coreSkills: [
      { skill: "Java", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "PostgreSQL", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Docker", importance: "high" },
      { skill: "Algorithms", importance: "high" },
      { skill: "CI/CD", importance: "medium" },
    ],
  },

  // 8. Software Engineer
  "Software Engineer": {
    roleName: "Software Engineer",
    description: "Applies software engineering principles to design, implement, test, and maintain robust codebases.",
    coreSkills: [
      { skill: "Data Structures", importance: "critical", minProficiency: "Proficient" },
      { skill: "Algorithms", importance: "critical", minProficiency: "Proficient" },
      { skill: "Problem Solving", importance: "critical", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "JavaScript", importance: "high", minProficiency: "Competent" },
      { skill: "REST APIs", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "TypeScript", importance: "high" },
      { skill: "Docker", importance: "medium" },
      { skill: "CI/CD", importance: "medium" },
    ],
  },

  "Software Engineer (General / Core CS)": {
    roleName: "Software Engineer (General / Core CS)",
    description: "Demonstrates strong foundational problem solving, algorithmic thinking, and computational efficiency.",
    coreSkills: [
      { skill: "Problem Solving", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "critical", minProficiency: "Proficient" },
      { skill: "Algorithms", importance: "critical", minProficiency: "Proficient" },
      { skill: "Arrays", importance: "critical", minProficiency: "Proficient" },
      { skill: "Hash Maps", importance: "critical", minProficiency: "Proficient" },
      { skill: "Strings", importance: "high", minProficiency: "Proficient" },
      { skill: "Two Pointers", importance: "high", minProficiency: "Competent" },
      { skill: "Stack", importance: "high", minProficiency: "Competent" },
      { skill: "JavaScript", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Dynamic Programming", importance: "high" },
      { skill: "Binary Search", importance: "high" },
      { skill: "Git", importance: "medium" },
    ],
  },

  // 9. Junior Software Engineer
  "Junior Software Engineer": {
    roleName: "Junior Software Engineer",
    description: "Early-career developer with solid foundational programming, git workflow, and web development basics.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Competent" },
      { skill: "Data Structures", importance: "high", minProficiency: "Developing" },
      { skill: "HTML", importance: "high", minProficiency: "Competent" },
      { skill: "CSS", importance: "high", minProficiency: "Competent" },
      { skill: "Problem Solving", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "React", importance: "high" },
      { skill: "Node.js", importance: "medium" },
      { skill: "REST APIs", importance: "medium" },
    ],
  },

  // 10. Mobile App Developer
  "Mobile App Developer": {
    roleName: "Mobile App Developer",
    description: "Builds cross-platform or native mobile applications with modern UI and API integration.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "React", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Redux", importance: "high" },
      { skill: "Tailwind CSS", importance: "medium" },
    ],
  },

  // 11. DevOps Engineer
  "DevOps Engineer": {
    roleName: "DevOps Engineer",
    description: "Automates software delivery pipelines, container platforms, and infrastructure reliability.",
    coreSkills: [
      { skill: "Docker", importance: "critical", minProficiency: "Proficient" },
      { skill: "CI/CD", importance: "critical", minProficiency: "Proficient" },
      { skill: "Linux", importance: "critical", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Python", importance: "high" },
      { skill: "Nginx", importance: "high" },
      { skill: "Node.js", importance: "medium" },
    ],
  },

  // 12. Cloud Engineer
  "Cloud Engineer": {
    roleName: "Cloud Engineer",
    description: "Deploys, manages, and automates scalable cloud infrastructure and serverless workloads.",
    coreSkills: [
      { skill: "Docker", importance: "critical", minProficiency: "Proficient" },
      { skill: "Linux", importance: "critical", minProficiency: "Proficient" },
      { skill: "CI/CD", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Python", importance: "high" },
      { skill: "PostgreSQL", importance: "medium" },
      { skill: "Node.js", importance: "medium" },
    ],
  },

  // 13. Site Reliability Engineer
  "Site Reliability Engineer": {
    roleName: "Site Reliability Engineer",
    description: "Ensures uptime, observability, latency management, and automated resilience for distributed systems.",
    coreSkills: [
      { skill: "Linux", importance: "critical", minProficiency: "Proficient" },
      { skill: "Docker", importance: "critical", minProficiency: "Proficient" },
      { skill: "CI/CD", importance: "high", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Python", importance: "high" },
      { skill: "Redis", importance: "high" },
      { skill: "PostgreSQL", importance: "medium" },
    ],
  },

  // 14. QA Automation Engineer
  "QA Automation Engineer": {
    roleName: "QA Automation Engineer",
    description: "Develops automated test suites, end-to-end testing scripts, and quality gates.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "high", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Jest", importance: "critical" },
      { skill: "Vitest", importance: "critical" },
      { skill: "CI/CD", importance: "high" },
      { skill: "Python", importance: "medium" },
    ],
  },

  // 15. Software Test Engineer
  "Software Test Engineer": {
    roleName: "Software Test Engineer",
    description: "Specializes in unit, integration, boundary, and regression testing across software components.",
    coreSkills: [
      { skill: "JavaScript", importance: "critical", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "high", minProficiency: "Competent" },
      { skill: "Problem Solving", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Jest", importance: "high" },
      { skill: "TypeScript", importance: "medium" },
      { skill: "Python", importance: "medium" },
    ],
  },

  // 16. Data Analyst
  "Data Analyst": {
    roleName: "Data Analyst",
    description: "Extracts business insights, constructs queries, and creates visualizations from relational and warehouse data.",
    coreSkills: [
      { skill: "PostgreSQL", importance: "critical", minProficiency: "Proficient" },
      { skill: "Python", importance: "critical", minProficiency: "Proficient" },
      { skill: "Problem Solving", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "MongoDB", importance: "medium" },
      { skill: "JavaScript", importance: "medium" },
    ],
  },

  // 17. Data Engineer
  "Data Engineer": {
    roleName: "Data Engineer",
    description: "Designs robust data pipelines, ETL systems, data warehouses, and persistence streaming layers.",
    coreSkills: [
      { skill: "Python", importance: "critical", minProficiency: "Proficient" },
      { skill: "PostgreSQL", importance: "critical", minProficiency: "Proficient" },
      { skill: "Docker", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "Redis", importance: "high" },
      { skill: "MongoDB", importance: "medium" },
      { skill: "Linux", importance: "medium" },
    ],
  },

  // 18. Machine Learning Engineer
  "Machine Learning Engineer": {
    roleName: "Machine Learning Engineer",
    description: "Develops and deploys ML models, training pipelines, and algorithmic scoring engines.",
    coreSkills: [
      { skill: "Python", importance: "critical", minProficiency: "Proficient" },
      { skill: "Algorithms", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "high", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "Docker", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "PostgreSQL", importance: "medium" },
      { skill: "REST APIs", importance: "high" },
    ],
  },

  // 19. AI Application Developer
  "AI Application Developer": {
    roleName: "AI Application Developer",
    description: "Integrates Large Language Models, embeddings, AI agents, and fullstack apps into intelligent user experiences.",
    coreSkills: [
      { skill: "TypeScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "Python", importance: "high", minProficiency: "Competent" },
      { skill: "React", importance: "critical", minProficiency: "Proficient" },
      { skill: "Node.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "MongoDB", importance: "high" },
      { skill: "Docker", importance: "medium" },
      { skill: "Next.js", importance: "high" },
    ],
  },

  // 20. Cybersecurity Analyst
  "Cybersecurity Analyst": {
    roleName: "Cybersecurity Analyst",
    description: "Evaluates security configurations, vulnerability assessments, secret isolation, and defensive architecture.",
    coreSkills: [
      { skill: "Linux", importance: "critical", minProficiency: "Proficient" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "high", minProficiency: "Competent" },
      { skill: "Problem Solving", importance: "high", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Python", importance: "high" },
      { skill: "Docker", importance: "high" },
      { skill: "Node.js", importance: "medium" },
    ],
  },

  // 21. Database Developer
  "Database Developer": {
    roleName: "Database Developer",
    description: "Specializes in relational and NoSQL database modeling, query tuning, indexing, and data integrity.",
    coreSkills: [
      { skill: "PostgreSQL", importance: "critical", minProficiency: "Proficient" },
      { skill: "MongoDB", importance: "critical", minProficiency: "Proficient" },
      { skill: "Data Structures", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "Redis", importance: "high" },
      { skill: "Node.js", importance: "medium" },
      { skill: "Python", importance: "medium" },
    ],
  },

  // 22. API and Integration Developer
  "API and Integration Developer": {
    roleName: "API and Integration Developer",
    description: "Designs robust REST and GraphQL APIs, external system connectors, webhooks, and third-party integrations.",
    coreSkills: [
      { skill: "REST APIs", importance: "critical", minProficiency: "Proficient" },
      { skill: "Node.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "Express.js", importance: "critical", minProficiency: "Proficient" },
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
    ],
    recommendedSkills: [
      { skill: "MongoDB", importance: "high" },
      { skill: "PostgreSQL", importance: "high" },
      { skill: "Docker", importance: "medium" },
    ],
  },

  // 23. Open Source Contributor
  "Open Source Contributor": {
    roleName: "Open Source Contributor",
    description: "Collaborates in public codebases, submitting clean pull requests, writing documentation, and maintaining hygiene.",
    coreSkills: [
      { skill: "Git", importance: "critical", minProficiency: "Proficient" },
      { skill: "JavaScript", importance: "critical", minProficiency: "Proficient" },
      { skill: "TypeScript", importance: "high", minProficiency: "Competent" },
      { skill: "Problem Solving", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "React", importance: "high" },
      { skill: "Node.js", importance: "high" },
      { skill: "CI/CD", importance: "medium" },
    ],
  },

  // 24. Technical Support Engineer
  "Technical Support Engineer": {
    roleName: "Technical Support Engineer",
    description: "Diagnoses customer technical issues, triages software bugs, investigates logs, and guides integration.",
    coreSkills: [
      { skill: "Problem Solving", importance: "critical", minProficiency: "Proficient" },
      { skill: "REST APIs", importance: "high", minProficiency: "Competent" },
      { skill: "JavaScript", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "high", minProficiency: "Competent" },
    ],
    recommendedSkills: [
      { skill: "HTML", importance: "medium" },
      { skill: "CSS", importance: "medium" },
      { skill: "Linux", importance: "medium" },
    ],
  },

  // 25. Embedded Systems Engineer (Electronics)
  "Embedded Systems Engineer": {
    roleName: "Embedded Systems Engineer",
    category: "Electronics & Electrical",
    description: "Develops low-level firmware, real-time operating system (RTOS) tasks, hardware driver interfaces, and microcontroller firmware.",
    coreSkills: [
      { skill: "Embedded C", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "github", "coding"], observableEvidence: "Microcontroller firmware code with peripheral drivers and interrupt service routines" },
      { skill: "C++", importance: "high", minProficiency: "Competent", evidenceType: ["project", "github", "coding"], observableEvidence: "Object-oriented embedded drivers, classes, and hardware abstraction layers (HAL)" },
      { skill: "Microcontrollers", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "hardware"], observableEvidence: "Hardware projects built on STM32, ESP32, or ARM Cortex microcontrollers" },
      { skill: "RTOS", importance: "high", minProficiency: "Competent", evidenceType: ["project", "github"], observableEvidence: "FreeRTOS tasks, priority scheduling, queues, semaphores, and inter-task communication" },
      { skill: "UART/SPI/I2C", importance: "high", minProficiency: "Competent", evidenceType: ["project", "hardware"], observableEvidence: "Logic analyzer traces, sensor register read/write protocols, and serial telemetry" },
      { skill: "Hardware Debugging", importance: "high", minProficiency: "Competent", evidenceType: ["project", "lab"], observableEvidence: "Oscilloscope and JTAG/SWD in-circuit debugging session logs and pin diagnostics" },
    ],
    recommendedSkills: [
      { skill: "Git", importance: "high", minProficiency: "Competent" },
      { skill: "Linux", importance: "medium", minProficiency: "Competent" },
      { skill: "Device Drivers", importance: "medium", minProficiency: "Developing" },
      { skill: "PCB Design", importance: "medium", minProficiency: "Developing" },
    ],
    prerequisites: ["Digital Electronics", "Computer Architecture", "Circuit Theory"],
    observableEvidence: [
      "Microcontroller firmware repositories (STM32, ESP32, ARM) with register-level code or RTOS tasks",
      "Peripheral interfacing code (I2C/SPI sensor readouts, UART communication)",
      "Documented hardware projects with schematics, pinouts, and breadboard/PCB implementation",
    ],
  },

  // 26. VLSI Design Engineer (Electronics)
  "VLSI Design Engineer": {
    roleName: "VLSI Design Engineer",
    category: "Electronics & Electrical",
    description: "Designs and verifies digital circuits, ASIC blocks, and FPGA architectures using Hardware Description Languages.",
    coreSkills: [
      { skill: "Verilog / SystemVerilog", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "github"], observableEvidence: "Synthesizable RTL module repositories with self-checking simulation testbenches" },
      { skill: "VHDL", importance: "high", minProficiency: "Competent", evidenceType: ["project", "github"], observableEvidence: "VHDL entity and structural architecture implementations with automated test vectors" },
      { skill: "Digital Logic Design", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "coursework"], observableEvidence: "Combinational and synchronous finite state machine (FSM) state diagrams and schematics" },
      { skill: "Static Timing Analysis", importance: "high", minProficiency: "Competent", evidenceType: ["project", "eda"], observableEvidence: "Synopsys Design Constraints (.sdc) and setup/hold timing slack violation reports" },
      { skill: "FPGA Prototyping", importance: "high", minProficiency: "Competent", evidenceType: ["project", "hardware"], observableEvidence: "Bitstream generation and hardware pin mapping on Xilinx Vivado or Intel Quartus" },
    ],
    recommendedSkills: [
      { skill: "Linux", importance: "high", minProficiency: "Competent" },
      { skill: "Python", importance: "medium", minProficiency: "Competent" },
      { skill: "Git", importance: "high", minProficiency: "Competent" },
      { skill: "TCL Scripting", importance: "medium", minProficiency: "Developing" },
    ],
    prerequisites: ["Semiconductor Physics", "Boolean Algebra", "Computer Organization"],
    observableEvidence: [
      "Verilog or SystemVerilog synthesizable RTL repositories with comprehensive testbenches",
      "Simulation waveform snapshots and timing closure constraint files (.sdc)",
      "FPGA implementation projects (Xilinx Vivado, Intel Quartus) with resource utilization reports",
    ],
  },

  // 27. IoT Developer (Electronics)
  "IoT Developer": {
    roleName: "IoT Developer",
    category: "Electronics & Electrical",
    description: "Builds connected edge devices, wireless telemetry streaming pipelines, and cloud sensor integrations.",
    coreSkills: [
      { skill: "Embedded C", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "github"], observableEvidence: "Firmware code integrating sensor acquisition and low-power telemetry sleep cycles" },
      { skill: "MQTT", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "github"], observableEvidence: "Pub/Sub message payloads, QoS level configurations, and secure TLS broker connectivity" },
      { skill: "Python", importance: "high", minProficiency: "Competent", evidenceType: ["project", "github"], observableEvidence: "Backend ingestion scripts, edge gateway services, or cloud API integrations" },
      { skill: "Microcontrollers", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "hardware"], observableEvidence: "ESP32/ESP8266 or ARM-based wireless sensor node prototypes and schematics" },
      { skill: "REST APIs", importance: "high", minProficiency: "Competent", evidenceType: ["project", "api"], observableEvidence: "Documented HTTP endpoints for device registration, telemetry logs, and OTA firmware updates" },
    ],
    recommendedSkills: [
      { skill: "Node.js", importance: "medium", minProficiency: "Competent" },
      { skill: "AWS", importance: "medium", minProficiency: "Developing" },
      { skill: "Git", importance: "high", minProficiency: "Competent" },
      { skill: "Docker", importance: "medium", minProficiency: "Developing" },
    ],
    prerequisites: ["Computer Networks", "Basic Electronics", "Linux Fundamentals"],
    observableEvidence: [
      "End-to-end IoT projects with edge sensors publishing telemetry to an MQTT broker or cloud dashboard",
      "Hardware wiring diagrams, firmware code, and API integration documentation",
      "Demonstrated power management or wireless protocol integration (Wi-Fi, BLE, LoRa)",
    ],
  },

  // 28. Power Systems Engineer (Electrical)
  "Power Systems Engineer": {
    roleName: "Power Systems Engineer",
    category: "Electronics & Electrical",
    description: "Simulates electrical grid networks, load flow calculations, transmission stability, and protection relay schemes.",
    coreSkills: [
      { skill: "MATLAB / Simulink", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "simulation"], observableEvidence: "Simulink dynamic power flow, generator swing equations, and inverter model simulations" },
      { skill: "ETAP", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "simulation"], observableEvidence: "Load flow, short circuit, and motor acceleration studies in ETAP software" },
      { skill: "Power Grid Modeling", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "case-study"], observableEvidence: "Transmission line parameter calculations and single-line network diagram models" },
      { skill: "Relay Coordination", importance: "high", minProficiency: "Competent", evidenceType: ["project", "case-study"], observableEvidence: "Overcurrent and distance relay time-current characteristic (TCC) coordination curves" },
      { skill: "Fault Analysis", importance: "high", minProficiency: "Competent", evidenceType: ["project", "case-study"], observableEvidence: "Symmetrical and unsymmetrical LG/LL/LLG fault current calculation reports" },
    ],
    recommendedSkills: [
      { skill: "AutoCAD Electrical", importance: "high", minProficiency: "Competent" },
      { skill: "Python", importance: "medium", minProficiency: "Developing" },
      { skill: "Control Systems", importance: "medium", minProficiency: "Competent" },
    ],
    prerequisites: ["Electrical Machines", "Power Transmission & Distribution", "Network Theory"],
    observableEvidence: [
      "Simulink transmission network models or ETAP load flow and short-circuit simulation studies",
      "Protection coordination curves and single-line diagram (SLD) portfolio documentation",
      "Renewable generation or microgrid stability analysis reports",
    ],
  },

  // 29. Control Systems Engineer (Electrical)
  "Control Systems Engineer": {
    roleName: "Control Systems Engineer",
    category: "Electronics & Electrical",
    description: "Designs closed-loop feedback controllers, dynamic system models, observers, and industrial automation algorithms.",
    coreSkills: [
      { skill: "MATLAB / Simulink", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "simulation"], observableEvidence: "Feedback control loop simulations, root locus, and frequency response Bode plot analysis" },
      { skill: "Control Systems", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "simulation"], observableEvidence: "PID controller tuning, gain/phase stability margins, and state-space matrix models" },
      { skill: "System Identification", importance: "high", minProficiency: "Competent", evidenceType: ["project", "case-study"], observableEvidence: "Transfer function estimation from experimental input-output step response data" },
      { skill: "Python", importance: "high", minProficiency: "Competent", evidenceType: ["project", "coding"], observableEvidence: "Python control library scripts for automated system simulation and plotting" },
      { skill: "PLC Programming", importance: "medium", minProficiency: "Competent", evidenceType: ["project", "lab"], observableEvidence: "Ladder logic programs with timers, counters, state sequences, and interlocks" },
    ],
    recommendedSkills: [
      { skill: "C++", importance: "medium", minProficiency: "Competent" },
      { skill: "SCADA", importance: "medium", minProficiency: "Developing" },
      { skill: "Sensors & Actuators", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "medium", minProficiency: "Competent" },
    ],
    prerequisites: ["Differential Equations", "Laplace & Z-Transforms", "Linear Algebra"],
    observableEvidence: [
      "Simulink PID, state-feedback, or LQR controller models with step response and Bode plot analysis",
      "Hardware-in-the-loop (HIL) or inverted pendulum/motor speed controller implementation code",
      "PLC ladder logic projects or system tuning lab writeups",
    ],
  },

  // 30. CAD/CAM Engineer (Mechanical)
  "CAD/CAM Engineer": {
    roleName: "CAD/CAM Engineer",
    category: "Mechanical & Industrial",
    description: "Develops 3D parametric mechanical components, assembly drawings, GD&T tolerancing, and CNC toolpaths.",
    coreSkills: [
      { skill: "SolidWorks", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "cad"], observableEvidence: "Fully defined 3D parametric part models and multi-body assembly portfolios" },
      { skill: "AutoCAD", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "cad"], observableEvidence: "2D engineering layout drawings with title blocks, layers, and dimension styles" },
      { skill: "GD&T", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "drawings"], observableEvidence: "Drawings applying ASME Y14.5 datum feature references, runout, and position tolerances" },
      { skill: "CNC Programming", importance: "high", minProficiency: "Competent", evidenceType: ["project", "cam"], observableEvidence: "Toolpath simulations and verified G-code/M-code programs for CNC milling/turning" },
      { skill: "Machine Element Design", importance: "high", minProficiency: "Competent", evidenceType: ["project", "calculations"], observableEvidence: "Shaft, bearing, gear, and fastener stress, deflection, and fatigue calculations" },
    ],
    recommendedSkills: [
      { skill: "PTC Creo", importance: "medium", minProficiency: "Competent" },
      { skill: "CATIA", importance: "medium", minProficiency: "Competent" },
      { skill: "FEA Simulation", importance: "medium", minProficiency: "Developing" },
      { skill: "DFM / DFA", importance: "high", minProficiency: "Competent" },
    ],
    prerequisites: ["Engineering Drawing", "Manufacturing Technology", "Strength of Materials"],
    observableEvidence: [
      "Portfolio of multi-component 3D assemblies with exploded views and bill of materials (BOM)",
      "2D engineering manufacturing drawings with ASME Y14.5 GD&T datum feature callouts",
      "CAM simulation recordings and verified G-code output files for milling or turning",
    ],
  },

  // 31. Robotics Engineer (Mechanical & Mechatronics)
  "Robotics Engineer": {
    roleName: "Robotics Engineer",
    category: "Mechanical & Industrial",
    description: "Integrates robot kinematics, dynamic motion planning, sensor fusion, computer vision, and ROS 2 middleware.",
    coreSkills: [
      { skill: "ROS 2", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "github", "simulation"], observableEvidence: "ROS 2 package repositories on GitHub with publisher/subscriber nodes, services, and launch files" },
      { skill: "Python", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "github", "coding"], observableEvidence: "Motion planning, telemetry scripts, robot kinematics algorithms, and computer vision modules" },
      { skill: "C++", importance: "high", minProficiency: "Competent", evidenceType: ["project", "github", "coding"], observableEvidence: "Real-time robotics nodes, fast kinematics solvers, and motor driver abstractions" },
      { skill: "Robot Kinematics", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "calculations"], observableEvidence: "Forward and inverse kinematics implementations with DH parameters and Jacobian matrices" },
      { skill: "Sensors & Actuators", importance: "high", minProficiency: "Competent", evidenceType: ["project", "hardware"], observableEvidence: "IMU, lidar, ultrasonic sensor fusion, and servo/stepper actuator driver circuits" },
    ],
    recommendedSkills: [
      { skill: "SLAM", importance: "high", minProficiency: "Developing" },
      { skill: "Linux", importance: "high", minProficiency: "Competent" },
      { skill: "Gazebo Simulation", importance: "medium", minProficiency: "Competent" },
      { skill: "Git", importance: "high", minProficiency: "Competent" },
    ],
    prerequisites: ["Linear Algebra", "Mechatronics Fundamentals", "Calculus & Dynamics"],
    observableEvidence: [
      "ROS 2 package repositories on GitHub with launch files, URDF robot models, and nodes",
      "Gazebo or Webots navigation/manipulation simulation demo videos",
      "Demonstrated forward/inverse kinematics code or mobile robot navigation pipeline",
    ],
  },

  // 32. Structural Design Engineer (Civil)
  "Structural Design Engineer": {
    roleName: "Structural Design Engineer",
    category: "Civil & Infrastructure",
    description: "Calculates building structural stability, reinforced concrete and steel designs, seismic loads, and code compliance.",
    coreSkills: [
      { skill: "STAAD.Pro", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "calculations"], observableEvidence: "Space frame 3D structural models with dead, live, wind, and seismic load combinations" },
      { skill: "ETABS", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "calculations"], observableEvidence: "Multi-story reinforced concrete building response spectrum and dynamic modal analysis" },
      { skill: "Reinforced Concrete Design", importance: "critical", minProficiency: "Proficient", evidenceType: ["project", "drawings"], observableEvidence: "Detailed structural drawings showing beam, column, and slab rebar scheduling adhering to IS 456/ACI 318" },
      { skill: "Steel Structure Design", importance: "high", minProficiency: "Competent", evidenceType: ["project", "drawings"], observableEvidence: "Steel truss, portal frame, and welded/bolted connection design calculation reports" },
      { skill: "AutoCAD", importance: "high", minProficiency: "Competent", evidenceType: ["drawings"], observableEvidence: "Structural drafting plans, structural sections, and foundation detail sheets" },
    ],
    recommendedSkills: [
      { skill: "Seismic Analysis", importance: "high", minProficiency: "Competent" },
      { skill: "Foundation Design", importance: "high", minProficiency: "Competent" },
      { skill: "Excel Modeling", importance: "high", minProficiency: "Competent" },
    ],
    prerequisites: ["Strength of Materials", "Structural Analysis", "Soil Mechanics"],
    observableEvidence: [
      "ETABS or STAAD.Pro multi-story building models with shear and moment envelope results",
      "Structural detailing drawings showing beam, column, and slab rebar scheduling",
      "Hand or spreadsheet verification calculations adhering to IS 456, IS 800, or ACI codes",
    ],
  },

  // 33. BIM Specialist (Civil & Architecture)
  "BIM Specialist": {
    roleName: "BIM Specialist",
    category: "Civil & Infrastructure",
    description: "Coordinates multidisciplinary building information models, clash detection, LOD standards, and construction coordination.",
    coreSkills: [
      { skill: "Autodesk Revit", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "bim"], observableEvidence: "Parametric BIM models with custom families, shared parameters, and project worksets" },
      { skill: "Navisworks", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "bim"], observableEvidence: "Navisworks clash detection resolution reports with prioritized issue logs" },
      { skill: "BIM Coordination", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "reports"], observableEvidence: "Federated architectural, structural, and MEP coordination workflows with LOD 300+ models" },
      { skill: "AutoCAD", importance: "high", minProficiency: "Competent", evidenceType: ["drawings"], observableEvidence: "Construction detail drawings exported and aligned with BIM deliverables" },
      { skill: "Clash Detection", importance: "high", minProficiency: "Competent", evidenceType: ["reports"], observableEvidence: "Hard and soft clash detection matrices and issue clearance audit trails" },
    ],
    recommendedSkills: [
      { skill: "LOD Standards", importance: "high", minProficiency: "Competent" },
      { skill: "Construction Documentation", importance: "high", minProficiency: "Competent" },
      { skill: "Dynamo / Python", importance: "medium", minProficiency: "Developing" },
    ],
    prerequisites: ["Building Construction Practices", "Architectural Drawing Fundamentals"],
    observableEvidence: [
      "Federated multi-disciplinary Revit project models (Architecture, Structure, MEP)",
      "Navisworks clash detection resolution reports with prioritized issue logs",
      "Coordinated construction sheets extracted from 3D models with schedules and quantities",
    ],
  },

  // 34. Financial Analyst (Finance & Business)
  "Financial Analyst": {
    roleName: "Financial Analyst",
    category: "Commerce & Business",
    description: "Performs corporate financial modeling, DCF company valuations, statement forecasting, and capital budgeting.",
    coreSkills: [
      { skill: "Financial Modeling", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "models"], observableEvidence: "Dynamic 3-statement integrated financial forecast models in Excel with scenario toggles" },
      { skill: "Advanced Excel", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "models"], observableEvidence: "Complex dynamic workbooks using INDEX/MATCH, XLOOKUP, dynamic arrays, and macros" },
      { skill: "DCF Valuation", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "reports"], observableEvidence: "Discounted Cash Flow (DCF) company valuation writeups with WACC calculations and sensitivity tables" },
      { skill: "Financial Statement Analysis", importance: "critical", minProficiency: "Proficient", evidenceType: ["reports"], observableEvidence: "Ratio analysis reports dissecting historical liquidity, solvency, operating cycle, and profitability" },
      { skill: "Corporate Finance", importance: "high", minProficiency: "Competent", evidenceType: ["coursework", "analysis"], observableEvidence: "Capital budgeting proposals evaluating project NPV, IRR, payback period, and hurdle rates" },
    ],
    recommendedSkills: [
      { skill: "Power BI", importance: "high", minProficiency: "Competent" },
      { skill: "SQL", importance: "medium", minProficiency: "Competent" },
      { skill: "Python", importance: "medium", minProficiency: "Developing" },
      { skill: "Ratio Analysis", importance: "high", minProficiency: "Competent" },
    ],
    prerequisites: ["Accounting Principles", "Corporate Finance Fundamentals", "Business Statistics"],
    observableEvidence: [
      "Dynamic 3-statement integrated financial forecast models in Excel with scenario toggles",
      "Discounted Cash Flow (DCF) company valuation writeups with sensitivity tables",
      "Executive financial presentation decks summarizing margin, liquidity, and return metrics",
    ],
  },

  // 35. Business Intelligence Analyst (Data & Business)
  "Business Intelligence Analyst": {
    roleName: "Business Intelligence Analyst",
    category: "Commerce & Business",
    description: "Builds executive visual dashboards, star schema data models, DAX measures, and self-service analytics pipelines.",
    coreSkills: [
      { skill: "Power BI", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "dashboards"], observableEvidence: "Interactive executive dashboards with drill-through pages, bookmarks, and slicers" },
      { skill: "SQL", importance: "critical", minProficiency: "Proficient", evidenceType: ["github", "coding", "queries"], observableEvidence: "Complex analytical queries with CTEs, window functions, and subqueries" },
      { skill: "Data Modeling", importance: "critical", minProficiency: "Proficient", evidenceType: ["portfolio", "dashboards"], observableEvidence: "Star and snowflake schema dimensional data models with relationship cardinality" },
      { skill: "DAX", importance: "high", minProficiency: "Competent", evidenceType: ["portfolio", "dashboards"], observableEvidence: "Calculated columns and advanced DAX measures utilizing CALCULATE, FILTER, and time intelligence" },
      { skill: "Data Cleaning", importance: "high", minProficiency: "Competent", evidenceType: ["portfolio", "github"], observableEvidence: "Power Query or Python data transformation pipelines resolving missing data and schema drift" },
    ],
    recommendedSkills: [
      { skill: "Tableau", importance: "high", minProficiency: "Competent" },
      { skill: "Python", importance: "high", minProficiency: "Competent" },
      { skill: "Excel", importance: "high", minProficiency: "Competent" },
      { skill: "Git", importance: "medium", minProficiency: "Competent" },
    ],
    prerequisites: ["Database Concepts", "Descriptive Statistics", "Business Metrics"],
    observableEvidence: [
      "Interactive Power BI (.pbix) or Tableau Public interactive dashboards with drill-downs",
      "SQL scripts showcasing complex joins, window functions, and dimensional aggregation",
      "Case study documentation explaining business KPIs and dashboard user workflow",
    ],
  },
};

// Seamless Canonical Aliases for Multi-Branch Roles
ROLE_REQUIREMENTS["CAD Engineer"] = ROLE_REQUIREMENTS["CAD/CAM Engineer"];
ROLE_REQUIREMENTS["Structural Engineer"] = ROLE_REQUIREMENTS["Structural Design Engineer"];
ROLE_REQUIREMENTS["BIM Engineer"] = ROLE_REQUIREMENTS["BIM Specialist"];
ROLE_REQUIREMENTS["Embedded Systems & IoT Engineer"] = ROLE_REQUIREMENTS["Embedded Systems Engineer"];

