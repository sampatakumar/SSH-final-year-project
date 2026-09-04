import type { ResumeData, ResumeBuilderConfig, TemplateId, Project } from "../templates/types";
import { createDefaultBuilderConfig, DEFAULT_SECTION_ORDER } from "../templates/TemplateRegistry";
import {
  adaptMasterProfileToResume,
  mergeProfileWithSavedResume,
  normalizeProjectKey,
  type MasterProfileData,
  type UserProjectItem,
} from "./resume-profile-adapter";

export { adaptMasterProfileToResume, mergeProfileWithSavedResume, normalizeProjectKey };

export const dedupeProjectsList = (list: any[] = []): Project[] => {
  const seen = new Map<string, Project>();
  for (const p of list) {
    if (!p) continue;
    const rawName = String(p.name || p.title || "").trim();
    const normKey = normalizeProjectKey(rawName);
    if (!rawName || !normKey) continue;

    if (!seen.has(normKey)) {
      seen.set(normKey, {
        name: rawName,
        technologies: Array.isArray(p.technologies) ? p.technologies.join(", ") : String(p.technologies || p.stack || ""),
        githubUrl: String(p.githubUrl || "").trim(),
        demoUrl: String(p.demoUrl || "").trim(),
        bullets: Array.isArray(p.bullets) ? p.bullets : (p.description ? [p.description] : []),
      });
    } else {
      const existing = seen.get(normKey)!;
      const incomingTech = Array.isArray(p.technologies) ? p.technologies.join(", ") : String(p.technologies || p.stack || "");
      if (incomingTech && incomingTech.length > (existing.technologies?.length || 0)) {
        existing.technologies = incomingTech;
      }
      if (!existing.githubUrl && p.githubUrl) existing.githubUrl = String(p.githubUrl).trim();
      if (!existing.demoUrl && p.demoUrl) existing.demoUrl = String(p.demoUrl).trim();
      const incomingBullets = Array.isArray(p.bullets) ? p.bullets : (p.description ? [p.description] : []);
      if (incomingBullets.length > (existing.bullets?.length || 0)) {
        existing.bullets = incomingBullets;
      }
    }
  }
  return Array.from(seen.values());
};

export const normalizeResumeData = (
  raw?: any,
  masterProfile?: MasterProfileData | null,
  userProjects: UserProjectItem[] = []
): ResumeData => {
  if (!raw && masterProfile) {
    return adaptMasterProfileToResume(masterProfile, userProjects);
  }

  if (!raw) {
    return {
      name: "",
      phone: "",
      email: "",
      linkedin: "",
      github: "",
      website: "",
      education: [],
      experience: [],
      projects: [],
      achievements: [],
      skillSections: [],
      skills: { languages: [], frameworks: [], tools: [], libraries: [] },
      customSections: [],
      config: createDefaultBuilderConfig("ats-classic"),
    };
  }

  // Ensure config exists
  const rawConfig = raw.config || raw.builderConfig || {};
  const templateId: TemplateId = rawConfig.templateId || "ats-classic";
  const defaultConfig = createDefaultBuilderConfig(templateId);

  const config: ResumeBuilderConfig = {
    ...defaultConfig,
    ...rawConfig,
    templateId,
    sectionOrder: Array.isArray(rawConfig.sectionOrder) && rawConfig.sectionOrder.length > 0
      ? rawConfig.sectionOrder
      : [...DEFAULT_SECTION_ORDER],
    hiddenSections: Array.isArray(rawConfig.hiddenSections) ? rawConfig.hiddenSections : [],
    customSections: Array.isArray(rawConfig.customSections)
      ? rawConfig.customSections
      : Array.isArray(raw.customSections)
      ? raw.customSections
      : [],
    typography: {
      ...defaultConfig.typography,
      ...(rawConfig.typography || {}),
    },
  };

  const normalized: ResumeData = {
    name: String(raw.name || "").trim(),
    phone: String(raw.phone || "").trim(),
    email: String(raw.email || "").trim(),
    linkedin: String(raw.linkedin || "").trim(),
    github: String(raw.github || "").trim(),
    website: String(raw.website || "").trim(),
    professionalSummary: typeof raw.professionalSummary === "string" ? raw.professionalSummary : undefined,
    education: Array.isArray(raw.education) ? raw.education : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    projects: Array.isArray(raw.projects) ? dedupeProjectsList(raw.projects) : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    skills: raw.skills || { languages: [], frameworks: [], tools: [], libraries: [] },
    skillSections: Array.isArray(raw.skillSections) ? raw.skillSections : [],
    customSections: config.customSections,
    config,
  };

  if (masterProfile) {
    return mergeProfileWithSavedResume(normalized, masterProfile, userProjects);
  }

  return normalized;
};
