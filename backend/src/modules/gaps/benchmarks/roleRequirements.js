/**
 * Target Role Skill Requirements and Benchmarks.
 * Defines standard industry expectations for various engineering tracks.
 */

export const TARGET_ROLES = {
  FULL_STACK_DEVELOPER: "Full Stack Developer",
  FRONTEND_ENGINEER: "Frontend Engineer",
  BACKEND_NODE_ENGINEER: "Backend Node.js Engineer",
  DATA_STRUCTURES_ALGORITHMS: "Software Engineer (General / Core CS)",
};

export const ROLE_REQUIREMENTS = {
  [TARGET_ROLES.FULL_STACK_DEVELOPER]: {
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

  [TARGET_ROLES.FRONTEND_ENGINEER]: {
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

  [TARGET_ROLES.BACKEND_NODE_ENGINEER]: {
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

  [TARGET_ROLES.DATA_STRUCTURES_ALGORITHMS]: {
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
      { skill: "Trees", importance: "high" },
      { skill: "Graphs", importance: "medium" },
      { skill: "Sorting", importance: "medium" },
    ],
  },
};
