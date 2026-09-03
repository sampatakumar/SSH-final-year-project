import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import {
  createSkillEvidencePackage,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
} from "../../../shared/evidence/skillEvidenceContract.js";

/**
 * Extract normalized skill evidence from Resume / User profile.
 *
 * @param {object} params
 * @param {string|object} params.userId - Canonical user identity
 * @param {object} params.userProfile - User document or parsed resume object
 * @param {string} [params.resumeId] - Optional resume identifier
 * @returns {object} Validated SkillEvidencePackage
 */
export function extractResumeEvidence({ userId, userProfile = {}, resumeId = null }) {
  if (!userId) {
    throw new Error("extractResumeEvidence requires a valid userId");
  }

  const skillSignalsMap = new Map();

  const recordSkill = (rawSkill, sourceContext, detail = "") => {
    if (!rawSkill || typeof rawSkill !== "string") return;

    const canonical = normalizeSkill(rawSkill);
    if (!canonical) return;

    const key = canonical.toLowerCase();
    if (!skillSignalsMap.has(key)) {
      skillSignalsMap.set(key, {
        skill: canonical,
        canonicalName: canonical,
        category: getSkillCategory(canonical),
        mentionsCount: 0,
        inSkillsSection: false,
        inProjects: false,
        inExperience: false,
        observations: [],
        details: [],
      });
    }

    const entry = skillSignalsMap.get(key);
    entry.mentionsCount += 1;

    if (sourceContext === "skills_section") {
      entry.inSkillsSection = true;
      entry.observations.push(`Listed in user profile skills section under ${detail || "Technical Skills"}`);
    } else if (sourceContext === "project") {
      entry.inProjects = true;
      entry.observations.push(`Referenced in project experience: "${detail}"`);
    } else if (sourceContext === "experience") {
      entry.inExperience = true;
      entry.observations.push(`Referenced in professional work experience: "${detail}"`);
    }
  };

  // 1. Process explicit skill buckets from User / Resume profile
  const languages = userProfile.skillLanguages || [];
  const frameworks = userProfile.skillFrameworks || [];
  const tools = userProfile.skillTools || [];
  const libraries = userProfile.skillLibraries || [];
  const sections = userProfile.skillSections || [];

  languages.forEach((s) => recordSkill(s, "skills_section", "Programming Languages"));
  frameworks.forEach((s) => recordSkill(s, "skills_section", "Frameworks"));
  tools.forEach((s) => recordSkill(s, "skills_section", "Developer Tools"));
  libraries.forEach((s) => recordSkill(s, "skills_section", "Libraries"));

  sections.forEach((section) => {
    const title = section.title || "Custom Skill Section";
    (section.skills || []).forEach((s) => recordSkill(s, "skills_section", title));
  });

  // 2. Scan projects for skill mentions
  const projects = userProfile.projects || [];
  projects.forEach((proj) => {
    const projTitle = proj.title || proj.name || "Project";
    const bullets = Array.isArray(proj.bullets) ? proj.bullets : [];
    const techStack = Array.isArray(proj.technologies) ? proj.technologies : [];

    techStack.forEach((t) => recordSkill(t, "project", projTitle));

    bullets.forEach((bullet) => {
      if (typeof bullet === "string") {
        for (const word of bullet.split(/[\s,();/]+/)) {
          if (word.length > 2) {
            const canonical = normalizeSkill(word);
            if (canonical && skillSignalsMap.has(canonical.toLowerCase())) {
              const entry = skillSignalsMap.get(canonical.toLowerCase());
              if (!entry.inProjects) {
                entry.inProjects = true;
                entry.observations.push(`Applied in project context: "${projTitle}"`);
              }
            }
          }
        }
      }
    });
  });

  // 3. Scan experience bullets for skill mentions
  const experiences = userProfile.experience || [];
  experiences.forEach((exp) => {
    const roleCompany = `${exp.role || "Role"} at ${exp.company || "Company"}`.trim();
    const bullets = Array.isArray(exp.bullets) ? exp.bullets : [];

    bullets.forEach((bullet) => {
      if (typeof bullet === "string") {
        for (const word of bullet.split(/[\s,();/]+/)) {
          if (word.length > 2) {
            const canonical = normalizeSkill(word);
            if (canonical && skillSignalsMap.has(canonical.toLowerCase())) {
              const entry = skillSignalsMap.get(canonical.toLowerCase());
              if (!entry.inExperience) {
                entry.inExperience = true;
                entry.observations.push(`Applied in work role: "${roleCompany}"`);
              }
            }
          }
        }
      }
    });
  });

  // 4. Construct normalized skill evidence items with calibrated confidence
  const skills = Array.from(skillSignalsMap.values()).map((entry) => {
    let confidence = 0.60;
    if (entry.inProjects) confidence += 0.08;
    if (entry.inExperience) confidence += 0.07;
    confidence = Math.min(0.75, Number(confidence.toFixed(2)));

    const uniqueObservations = Array.from(new Set(entry.observations)).slice(0, 5);

    return {
      skill: entry.canonicalName,
      canonicalName: entry.canonicalName,
      category: entry.category,
      evidenceType: EVIDENCE_TYPES.CLAIMED,
      confidence,
      signals: {
        inSkillsSection: entry.inSkillsSection,
        inProjects: entry.inProjects,
        inExperience: entry.inExperience,
        mentionsCount: entry.mentionsCount,
      },
      observations: uniqueObservations.length > 0 ? uniqueObservations : ["Claimed in resume skills section."],
    };
  });

  return createSkillEvidencePackage({
    source: EVIDENCE_SOURCES.RESUME,
    userId,
    skills,
    metadata: {
      resumeId: resumeId || null,
      skillsCount: skills.length,
      hasProjects: projects.length > 0,
      hasExperience: experiences.length > 0,
    },
  });
}
