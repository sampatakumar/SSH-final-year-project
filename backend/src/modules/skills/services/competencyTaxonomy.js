import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { CANONICAL_SKILL_TAXONOMY } from "../../../shared/taxonomy/skillTaxonomy.js";

export const COMPETENCY_RUBRIC_VERSION = "1.0.0";

export const BASE_COMPETENCY_DEFINITIONS = [
  {
    competencyId: "comp-javascript",
    name: "JavaScript Core & Modern ES6+",
    description: "Demonstrated proficiency in JavaScript asynchronous control, object paradigms, closures, and ES6+ features.",
    canonicalSkill: "JavaScript",
    category: "Programming Languages",
    roles: ["Frontend Developer", "Backend Developer", "Full Stack Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-python",
    name: "Python Core & Scripting Fundamentals",
    description: "Validated execution of idiomatic Python, data structures, and algorithmic logic under isolated testing.",
    canonicalSkill: "Python",
    category: "Programming Languages",
    roles: ["Backend Developer", "Data Scientist", "AI Engineer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-react",
    name: "React Component Architecture & State",
    description: "Practical component lifecycle, hooks, reactive state flow, and user interface synthesis.",
    canonicalSkill: "React",
    category: "Frontend Frameworks",
    roles: ["Frontend Developer", "Full Stack Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-nodejs",
    name: "Node.js Server Runtime & Asynchronous APIs",
    description: "Applied backend server development, HTTP event loop mechanics, middleware patterns, and API architecture.",
    canonicalSkill: "Node.js",
    category: "Backend Frameworks",
    roles: ["Backend Developer", "Full Stack Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-docker",
    name: "Docker Containerization & Environment Isolation",
    description: "Container virtualization, reproducible deployment packaging, and multi-stage build workflows.",
    canonicalSkill: "Docker",
    category: "DevOps & Cloud",
    roles: ["DevOps Engineer", "Cloud Engineer", "Backend Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-data-structures",
    name: "Algorithms & Core Data Structures",
    description: "Algorithmic problem-solving, computational complexity analysis, arrays, hash maps, and pointer traversal.",
    canonicalSkill: "Data Structures",
    category: "Computer Science Core",
    roles: ["Software Engineer", "Full Stack Developer", "Backend Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-mongodb",
    name: "MongoDB Document Data Modeling",
    description: "NoSQL schema indexing, aggregation pipelines, document integrity, and persistence queries.",
    canonicalSkill: "MongoDB",
    category: "Databases",
    roles: ["Backend Developer", "Full Stack Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
  {
    competencyId: "comp-typescript",
    name: "TypeScript Type Systems & Static Safety",
    description: "Generic type constraints, strict compiler safety, interface contracts, and typed module boundaries.",
    canonicalSkill: "TypeScript",
    category: "Programming Languages",
    roles: ["Frontend Developer", "Full Stack Developer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  },
];

/**
 * Build a lookup map of base competencies by canonical skill name (case-insensitive) and ID
 */
const competencyMapBySkill = new Map();
const competencyMapById = new Map();

for (const def of BASE_COMPETENCY_DEFINITIONS) {
  competencyMapBySkill.set(def.canonicalSkill.toLowerCase(), def);
  competencyMapById.set(def.competencyId.toLowerCase(), def);
}

/**
 * Get competency definition for any canonical or raw skill
 */
export function getCompetencyForSkill(rawSkill) {
  const canonical = normalizeSkill(rawSkill);
  if (!canonical) return null;

  const key = canonical.toLowerCase();
  if (competencyMapBySkill.has(key)) {
    return competencyMapBySkill.get(key);
  }

  // Generate dynamic competency definition for any known canonical skill
  const slug = canonical.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    competencyId: `comp-${slug}`,
    name: `${canonical} Competency`,
    description: `Demonstrated technical capability and verified understanding of ${canonical}.`,
    canonicalSkill: canonical,
    category: getSkillCategory(canonical),
    roles: ["Software Engineer"],
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    criteria: {
      knowledge: { minScore: 70, minCheckpointsPassed: 1 },
      retention: { minStage: 2, minConsecutiveRetrievals: 2 },
      applied: { minProblemsSolved: 1, minTestCasesPassRate: 0.8 },
      capstone: { requiresKnowledge: true, requiresRetention: true, requiresApplied: true },
    },
  };
}

/**
 * Get competency definition by ID
 */
export function getCompetencyById(competencyId) {
  if (!competencyId || typeof competencyId !== "string") return null;
  const key = competencyId.toLowerCase();
  if (competencyMapById.has(key)) {
    return competencyMapById.get(key);
  }

  // Parse dynamically generated IDs (e.g. comp-docker -> Docker)
  if (key.startsWith("comp-")) {
    const rawName = key.replace(/^comp-/, "").replace(/-/g, " ");
    return getCompetencyForSkill(rawName);
  }
  return null;
}

/**
 * List all standard competencies
 */
export function getAllStandardCompetencies() {
  return [...BASE_COMPETENCY_DEFINITIONS];
}
