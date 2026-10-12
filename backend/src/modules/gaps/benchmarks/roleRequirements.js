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
};
