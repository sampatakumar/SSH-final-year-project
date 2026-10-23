import { INITIAL_ACADEMIC_DEGREES, INITIAL_ACADEMIC_BRANCHES } from "../constants/academicCatalog.js";

/**
 * Authoritative alias lookup maps for safe, non-destructive normalization.
 */
const BRANCH_ALIAS_MAP = new Map();
const DEGREE_ALIAS_MAP = new Map();

// Populate branch lookup
for (const branch of INITIAL_ACADEMIC_BRANCHES) {
  BRANCH_ALIAS_MAP.set(branch.slug.toLowerCase(), branch.slug);
  if (branch.code) {
    BRANCH_ALIAS_MAP.set(branch.code.toLowerCase(), branch.slug);
  }
  if (Array.isArray(branch.aliases)) {
    for (const alias of branch.aliases) {
      BRANCH_ALIAS_MAP.set(alias.toLowerCase().trim(), branch.slug);
    }
  }
  BRANCH_ALIAS_MAP.set(branch.name.toLowerCase().trim(), branch.slug);
}

// Additional legacy synonyms for academic branches
const LEGACY_BRANCH_SYNONYMS = {
  "comp sci": "cse",
  "comp-sci": "cse",
  "computer science": "cse",
  "computer engineering": "cse",
  "cs": "cse",
  "b.tech cse": "cse",
  "be cse": "cse",
  "information technology": "it",
  "info tech": "it",
  "it": "it",
  "ai & ml": "aiml",
  "ai/ml": "aiml",
  "artificial intelligence": "aiml",
  "data science": "ds",
  "data analytics": "ds",
  "information science": "ise",
  "is": "ise",
  "electronics": "ece",
  "electronics and communication": "ece",
  "ec": "ece",
  "electrical": "eee",
  "electrical and electronics": "eee",
  "ee": "eee",
  "mechanical": "mech",
  "mechanical engineering": "mech",
  "me": "mech",
  "civil": "civil",
  "civil engineering": "civil",
  "ce": "civil",
  "chemical": "chem",
  "chemical engineering": "chem",
  "che": "chem",
  "biotech": "biotech",
  "biotechnology": "biotech",
  "bio technology": "biotech",
  "bt": "biotech",
  "industrial": "ipe",
  "industrial engineering": "ipe",
  "production engineering": "ipe",
  "ipe": "ipe",
  "business administration": "bba-gen",
  "bba": "bba-gen",
  "b.b.a": "bba-gen",
  "mba": "mba-gen",
  "m.b.a": "mba-gen",
  "commerce": "bcom-gen",
  "bcom": "bcom-gen",
  "b.com": "bcom-gen",
  "mcom": "mcom-gen",
  "m.com": "mcom-gen",
  "bachelor of arts": "ba-gen",
  "ba": "ba-gen",
  "b.a": "ba-gen",
  "master of arts": "ma-gen",
  "ma": "ma-gen",
  "m.a": "ma-gen",
  "nursing": "nursing-gen",
  "bsc nursing": "nursing-gen",
  "b.sc nursing": "nursing-gen",
  "allied health": "allied-health-gen",
  "allied health sciences": "allied-health-gen",
  "ahs": "allied-health-gen",
  "general": "other-gen",
  "other": "other-gen",
};

for (const [key, val] of Object.entries(LEGACY_BRANCH_SYNONYMS)) {
  BRANCH_ALIAS_MAP.set(key.toLowerCase().trim(), val);
}

// Populate degree lookup
for (const deg of INITIAL_ACADEMIC_DEGREES) {
  DEGREE_ALIAS_MAP.set(deg.slug.toLowerCase(), deg.slug);
  DEGREE_ALIAS_MAP.set(deg.shortName.toLowerCase(), deg.slug);
  DEGREE_ALIAS_MAP.set(deg.name.toLowerCase(), deg.slug);
}

const LEGACY_DEGREE_SYNONYMS = {
  "b.tech": "btech",
  "b tech": "btech",
  "b.e": "be",
  "b e": "be",
  "m.tech": "mtech",
  "m tech": "mtech",
  "b.sc cs": "bsc-cs",
  "bsc cs": "bsc-cs",
  "b.sc it": "bsc-it",
  "bsc it": "bsc-it",
  "b.com": "bcom",
  "m.com": "mcom",
  "b.b.a": "bba",
  "m.b.a": "mba",
  "b.a": "ba",
  "m.a": "ma",
  "b.sc nursing": "bsc-nursing",
  "bsc nursing": "bsc-nursing",
  "allied health": "allied-health-degree",
  "diploma": "diploma-eng",
};

for (const [key, val] of Object.entries(LEGACY_DEGREE_SYNONYMS)) {
  DEGREE_ALIAS_MAP.set(key.toLowerCase().trim(), val);
}

/**
 * Normalizes a raw branch string or alias to a canonical branch slug.
 *
 * @param {string} rawBranch - User-provided branch name, slug, or alias
 * @returns {string|null} Canonical branch slug, or cleaned input if unmapped
 */
export function resolveCanonicalBranchSlug(rawBranch) {
  if (!rawBranch || typeof rawBranch !== "string") return null;
  const clean = rawBranch.trim().toLowerCase().replace(/[^\w\s-]/g, "");
  if (BRANCH_ALIAS_MAP.has(clean)) {
    return BRANCH_ALIAS_MAP.get(clean);
  }
  const cleanRaw = rawBranch.trim().toLowerCase();
  if (BRANCH_ALIAS_MAP.has(cleanRaw)) {
    return BRANCH_ALIAS_MAP.get(cleanRaw);
  }
  return null;
}

/**
 * Normalizes a raw degree string or alias to a canonical degree slug.
 *
 * @param {string} rawDegree - User-provided degree name, slug, or alias
 * @returns {string|null} Canonical degree slug, or null if unknown
 */
export function resolveCanonicalDegreeSlug(rawDegree) {
  if (!rawDegree || typeof rawDegree !== "string") return null;
  const clean = rawDegree.trim().toLowerCase().replace(/[^\w\s-]/g, "");
  if (DEGREE_ALIAS_MAP.has(clean)) {
    return DEGREE_ALIAS_MAP.get(clean);
  }
  const cleanRaw = rawDegree.trim().toLowerCase();
  if (DEGREE_ALIAS_MAP.has(cleanRaw)) {
    return DEGREE_ALIAS_MAP.get(cleanRaw);
  }
  return null;
}

/**
 * Normalizes an academic profile object safely and idempotently.
 * Never throws. Never forces unconfigured records into CSE.
 *
 * @param {object} rawAcademic - Profile subdocument or input payload
 * @returns {object} Standardized, canonical academic profile
 */
export function normalizeAcademicProfile(rawAcademic) {
  if (!rawAcademic || typeof rawAcademic !== "object") {
    return {
      degreeSlug: "",
      degreeName: "",
      branchSlug: "",
      branchName: "",
      specializationSlug: "",
      specializationName: "",
      stream: "",
      currentYear: null,
      currentSemester: null,
      graduationYear: null,
      institution: "",
      academicScheme: "",
      isConfigured: false,
    };
  }

  const raw = typeof rawAcademic.toObject === "function" ? rawAcademic.toObject() : rawAcademic;

  // 1. Resolve branch
  let branchSlug = (raw.branchSlug || "").trim().toLowerCase();
  const canonicalBranchSlug = resolveCanonicalBranchSlug(branchSlug || raw.branchName);
  if (canonicalBranchSlug) {
    branchSlug = canonicalBranchSlug;
  }

  let branchName = (raw.branchName || "").trim();
  const catalogBranch = INITIAL_ACADEMIC_BRANCHES.find((b) => b.slug === branchSlug);
  if (catalogBranch) {
    if (!branchName) branchName = catalogBranch.name;
  }

  // 2. Resolve degree
  let degreeSlug = (raw.degreeSlug || "").trim().toLowerCase();
  const canonicalDegreeSlug = resolveCanonicalDegreeSlug(degreeSlug || raw.degreeName);
  if (canonicalDegreeSlug) {
    degreeSlug = canonicalDegreeSlug;
  }

  let degreeName = (raw.degreeName || "").trim();
  const catalogDegree = INITIAL_ACADEMIC_DEGREES.find((d) => d.slug === degreeSlug);
  if (catalogDegree) {
    if (!degreeName) degreeName = catalogDegree.name;
  }

  // 3. Resolve stream
  let stream = (raw.stream || "").trim();
  if (!stream && catalogBranch?.stream) {
    stream = catalogBranch.stream;
  } else if (!stream && catalogDegree?.stream) {
    stream = catalogDegree.stream;
  }

  // 4. Resolve specializations
  const specializationSlug = (raw.specializationSlug || "").trim().toLowerCase();
  let specializationName = (raw.specializationName || "").trim();
  if (catalogBranch && specializationSlug && !specializationName) {
    const spec = (catalogBranch.specializations || []).find((s) => s.slug === specializationSlug);
    if (spec) specializationName = spec.name;
  }

  // 5. Numeric validations
  const parseNum = (val, min, max) => {
    if (val === null || val === undefined || val === "") return null;
    const n = Number(val);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
  };

  const currentYear = parseNum(raw.currentYear, 1, 6);
  const currentSemester = parseNum(raw.currentSemester, 1, 12);
  const graduationYear = parseNum(raw.graduationYear, 1950, 2100);

  const institution = (raw.institution || "").trim();
  const academicScheme = (raw.academicScheme || "").trim();

  const isConfigured = Boolean(
    degreeSlug || branchSlug || degreeName || branchName || institution
  );

  return {
    degreeSlug,
    degreeName,
    branchSlug,
    branchName,
    specializationSlug,
    specializationName,
    stream,
    currentYear,
    currentSemester,
    graduationYear,
    institution,
    academicScheme,
    isConfigured,
  };
}
