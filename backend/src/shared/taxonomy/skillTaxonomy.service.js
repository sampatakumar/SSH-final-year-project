import { SKILL_ALIASES } from "./skillAliases.js";
import { CANONICAL_SKILL_TAXONOMY, SKILL_CATEGORIES } from "./skillTaxonomy.js";

function cleanRawString(str) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/^[\s\-_.,/]+|[\s\-_.,/]+$/g, "")
    .replace(/\s+/g, " ");
}

function toTitleCase(str) {
  if (!str) return "";
  return str
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeSkill(rawSkill) {
  const cleaned = cleanRawString(rawSkill);
  if (!cleaned) return "";

  if (SKILL_ALIASES[cleaned]) {
    return SKILL_ALIASES[cleaned];
  }

  for (const canonicalKey of Object.keys(CANONICAL_SKILL_TAXONOMY)) {
    if (canonicalKey.toLowerCase() === cleaned) {
      return canonicalKey;
    }
  }

  const stripped = cleaned.replace(/[\s\-_.]/g, "");
  if (SKILL_ALIASES[stripped]) {
    return SKILL_ALIASES[stripped];
  }

  return toTitleCase(cleaned);
}

export function getSkillCategory(canonicalName) {
  const normalized = normalizeSkill(canonicalName);
  if (CANONICAL_SKILL_TAXONOMY[normalized]) {
    return CANONICAL_SKILL_TAXONOMY[normalized].category;
  }
  return "Other Technical Skills";
}

export function getSkillMetadata(canonicalName) {
  const normalized = normalizeSkill(canonicalName);
  const entry = CANONICAL_SKILL_TAXONOMY[normalized];

  return {
    canonicalName: normalized,
    category: entry?.category || "Other Technical Skills",
    tags: entry?.tags || [],
    isKnown: Boolean(entry),
  };
}

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

export function isKnownSkill(skillName) {
  const canonical = normalizeSkill(skillName);
  return Boolean(CANONICAL_SKILL_TAXONOMY[canonical]);
}

export class SkillTaxonomyService {
  static normalizeSkill(rawSkill) {
    const canonical = normalizeSkill(rawSkill);
    if (!canonical) return null;
    return {
      canonicalName: canonical,
      category: getSkillCategory(canonical),
      isCustom: !isKnownSkill(canonical),
    };
  }

  static normalizeSkillList(rawSkills) {
    return normalizeSkillList(rawSkills).map((c) => ({
      canonicalName: c,
      category: getSkillCategory(c),
      isCustom: !isKnownSkill(c),
    }));
  }
}
