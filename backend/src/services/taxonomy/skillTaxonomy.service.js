import { SKILL_ALIASES } from "../../constants/skillAliases.js";
import { CANONICAL_SKILL_TAXONOMY, SKILL_CATEGORIES } from "../../constants/skillTaxonomy.js";

/**
 * Clean and standardize raw string before dictionary lookup.
 */
function cleanRawString(str) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/^[\s\-_.,/]+|[\s\-_.,/]+$/g, "") // trim edge punctuation
    .replace(/\s+/g, " "); // collapse whitespace
}

/**
 * Format unknown skill nicely (title casing words).
 */
function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalize any raw skill string into its Canonical Skill Name.
 * Handles aliases, case differences, and formatting.
 *
 * @param {string} rawSkill - The raw skill string (e.g. "react.js", "NODEJS", "c++")
 * @returns {string} The canonical skill name (e.g. "React", "Node.js", "C++")
 */
export function normalizeSkill(rawSkill) {
  const cleaned = cleanRawString(rawSkill);
  if (!cleaned) return "";

  // 1. Direct alias match (case-insensitive)
  if (SKILL_ALIASES[cleaned]) {
    return SKILL_ALIASES[cleaned];
  }

  // 2. Canonical taxonomy exact key match (case-insensitive check)
  for (const canonicalKey of Object.keys(CANONICAL_SKILL_TAXONOMY)) {
    if (canonicalKey.toLowerCase() === cleaned) {
      return canonicalKey;
    }
  }

  // 3. Punctuation stripped match (e.g. "node-js" -> "nodejs" -> "Node.js")
  const stripped = cleaned.replace(/[\s\-_.]/g, "");
  if (SKILL_ALIASES[stripped]) {
    return SKILL_ALIASES[stripped];
  }

  // 4. Return title-cased fallback if unknown
  return toTitleCase(cleaned);
}

/**
 * Get category for a given canonical skill name.
 *
 * @param {string} canonicalName
 * @returns {string}
 */
export function getSkillCategory(canonicalName) {
  const normalized = normalizeSkill(canonicalName);
  if (CANONICAL_SKILL_TAXONOMY[normalized]) {
    return CANONICAL_SKILL_TAXONOMY[normalized].category;
  }
  return "Other Technical Skills";
}

/**
 * Get full taxonomy metadata for a canonical skill.
 *
 * @param {string} canonicalName
 * @returns {object}
 */
export function getSkillMetadata(canonicalName) {
  const normalized = normalizeSkill(canonicalName);
  const entry = CANONICAL_SKILL_TAXONOMY[normalized];

  return {
    canonicalName: normalized,
    category: entry?.category || "Other Technical Skills",
    tags: entry?.tags || [],
    isKnown: Boolean(entry)
  };
}

/**
 * Normalize an array of raw skill strings, deduplicate them, and return canonical names.
 *
 * @param {string[]} rawSkills
 * @returns {string[]}
 */
export function normalizeSkillList(rawSkills) {
  if (!Array.isArray(rawSkills)) return [];

  const uniqueMap = new Map();

  for (const raw of rawSkills) {
    const canonical = normalizeSkill(raw);
    if (canonical && !uniqueMap.has(canonical.toLowerCase())) {
      uniqueMap.set(canonical.toLowerCase(), canonical);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Check if a skill is in the canonical taxonomy.
 *
 * @param {string} skillName
 * @returns {boolean}
 */
export function isKnownSkill(skillName) {
  const canonical = normalizeSkill(skillName);
  return Boolean(CANONICAL_SKILL_TAXONOMY[canonical]);
}
