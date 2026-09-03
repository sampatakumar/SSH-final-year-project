import type { ResumeData, Education, Experience, Project, Achievement, SkillSection } from "../templates/types";
import { createDefaultBuilderConfig } from "../templates/TemplateRegistry";

/**
 * Master Profile Schema Interface (matches backend User model & SettingsPage)
 */
export interface MasterProfileData {
  displayName?: string;
  email?: string;
  phone?: string;
  about?: string;
  headline?: string;
  customDomain?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  leetCodeId?: string;
  geeksForGeeksId?: string;
  targetRole?: string;
  education?: string[];
  educationEntries?: Array<{
    degree?: string;
    specialization?: string;
    college?: string;
    location?: string;
    endDate?: string;
    grade?: string;
  }>;
  experience?: Array<{
    role?: string;
    company?: string;
    location?: string;
    date?: string;
    bullets?: string[];
  }>;
  skillSections?: Array<{
    title?: string;
    skills?: string[];
  }>;
  skillLanguages?: string[];
  skillFrameworks?: string[];
  skillTools?: string[];
  skillLibraries?: string[];
  achievements?: Array<{
    title?: string;
    date?: string;
    bullets?: string[];
  }>;
}

export interface UserProjectItem {
  _id?: string;
  title: string;
  description?: string;
  stack?: string[];
  date?: string;
  githubUrl?: string;
  demoUrl?: string;
}

/**
 * Convert Master Profile & Projects into a canonical Normalized Resume Data object.
 * Does not invent data. Safe against null/undefined fields.
 */
export function adaptMasterProfileToResume(
  profile: MasterProfileData | null | undefined,
  userProjects: UserProjectItem[] = [],
  templateId = "ats-classic"
): ResumeData {
  if (!profile) {
    return {
      name: "",
      phone: "",
      email: "",
      linkedin: "",
      github: "",
      website: "",
      professionalSummary: "",
      education: [],
      experience: [],
      projects: [],
      achievements: [],
      skills: { languages: [], frameworks: [], tools: [], libraries: [] },
      skillSections: [],
      customSections: [],
      config: createDefaultBuilderConfig(templateId as any),
    };
  }

  // 1. Personal Information Mapping
  const name = String(profile.displayName || "").trim();
  const email = String(profile.email || "").trim();
  const phone = String(profile.phone || "").trim();
  const linkedin = String(profile.linkedInUrl || "").trim();
  const github = String(profile.githubUrl || "").trim();
  const website = String(profile.customDomain || "").trim();

  // 2. Professional Summary Mapping
  const professionalSummary = String(profile.about || profile.headline || "").trim();

  // 3. Education Mapping
  let education: Education[] = [];
  if (Array.isArray(profile.educationEntries) && profile.educationEntries.length > 0) {
    education = profile.educationEntries
      .map((entry) => {
        const school = String(entry.college || "").trim();
        const degree = entry.degree
          ? (entry.specialization ? `${entry.degree} in ${entry.specialization}` : entry.degree)
          : (entry.specialization || "");
        const location = String(entry.location || "").trim();
        const date = String(entry.endDate || "").trim();
        const grade = String(entry.grade || "").trim();

        return { school, degree, location, date, grade };
      })
      .filter((e) => e.school || e.degree);
  } else if (Array.isArray(profile.education) && profile.education.length > 0) {
    // Parse summary lines (e.g. "B.Tech | CS | MIT | Cambridge | 2024 | 3.9 GPA")
    education = profile.education.map((line) => {
      const parts = String(line).split("|").map((p) => p.trim());
      return {
        degree: parts[0] || "",
        school: parts[2] || parts[1] || "University",
        location: parts[3] || "",
        date: parts[4] || "",
        grade: parts[5] || "",
      };
    });
  }

  // 4. Experience Mapping
  const experience: Experience[] = Array.isArray(profile.experience)
    ? profile.experience
        .map((exp) => ({
          company: String(exp.company || "").trim(),
          role: String(exp.role || "").trim(),
          location: String(exp.location || "").trim(),
          date: String(exp.date || "").trim(),
          bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
            ? exp.bullets.map((b) => String(b).trim()).filter(Boolean)
            : [""],
        }))
        .filter((exp) => exp.company || exp.role)
    : [];

  // 5. Projects Mapping (from User Projects collection)
  const projects: Project[] = Array.isArray(userProjects)
    ? userProjects
        .map((proj) => {
          const technologies = Array.isArray(proj.stack) ? proj.stack.join(", ") : "";
          const bullets = proj.description
            ? [proj.description.trim()]
            : ["Built scalable application with modular components and clean architecture."];

          return {
            name: String(proj.title || "").trim(),
            technologies,
            githubUrl: String(proj.githubUrl || "").trim(),
            demoUrl: String(proj.demoUrl || "").trim(),
            bullets,
          };
        })
        .filter((p) => p.name)
    : [];

  // 6. Skills Mapping
  const skillLanguages = Array.isArray(profile.skillLanguages) ? profile.skillLanguages : [];
  const skillFrameworks = Array.isArray(profile.skillFrameworks) ? profile.skillFrameworks : [];
  const skillTools = Array.isArray(profile.skillTools) ? profile.skillTools : [];
  const skillLibraries = Array.isArray(profile.skillLibraries) ? profile.skillLibraries : [];

  const rawSkillSections = Array.isArray(profile.skillSections) ? profile.skillSections : [];
  const skillSections: SkillSection[] = rawSkillSections
    .map((sec) => ({
      title: String(sec.title || "").trim(),
      skills: Array.isArray(sec.skills) ? sec.skills.map((s) => String(s).trim()).filter(Boolean) : [],
    }))
    .filter((sec) => sec.title && sec.skills.length > 0);

  // If categorized buckets are empty, populate them from skillSections
  let categorizedSkills = {
    languages: [...skillLanguages],
    frameworks: [...skillFrameworks],
    tools: [...skillTools],
    libraries: [...skillLibraries],
  };

  if (
    categorizedSkills.languages.length === 0 &&
    categorizedSkills.frameworks.length === 0 &&
    categorizedSkills.tools.length === 0 &&
    skillSections.length > 0
  ) {
    skillSections.forEach((sec) => {
      const titleLower = sec.title.toLowerCase();
      if (titleLower.includes("language")) {
        categorizedSkills.languages.push(...sec.skills);
      } else if (titleLower.includes("framework") || titleLower.includes("technical") || titleLower.includes("frontend") || titleLower.includes("backend")) {
        categorizedSkills.frameworks.push(...sec.skills);
      } else if (titleLower.includes("tool") || titleLower.includes("devops") || titleLower.includes("platform")) {
        categorizedSkills.tools.push(...sec.skills);
      } else {
        categorizedSkills.libraries.push(...sec.skills);
      }
    });

    // Deduplicate
    categorizedSkills = {
      languages: Array.from(new Set(categorizedSkills.languages)),
      frameworks: Array.from(new Set(categorizedSkills.frameworks)),
      tools: Array.from(new Set(categorizedSkills.tools)),
      libraries: Array.from(new Set(categorizedSkills.libraries)),
    };
  }

  // 7. Achievements Mapping
  const achievements: Achievement[] = Array.isArray(profile.achievements)
    ? profile.achievements
        .map((ach) => ({
          title: String(ach.title || "").trim(),
          date: String(ach.date || "").trim(),
          bullets: Array.isArray(ach.bullets) && ach.bullets.length > 0
            ? ach.bullets.map((b) => String(b).trim()).filter(Boolean)
            : [],
        }))
        .filter((a) => a.title)
    : [];

  return {
    name,
    phone,
    email,
    linkedin,
    github,
    website,
    professionalSummary,
    education,
    experience,
    projects,
    achievements,
    skills: categorizedSkills,
    skillSections,
    customSections: [],
    config: createDefaultBuilderConfig(templateId as any),
  };
}

/**
 * Merge Master Profile data into an existing ResumeData snapshot without overwriting
 * user-customized non-empty fields.
 */
export function mergeProfileWithSavedResume(
  savedResume: Partial<ResumeData> | null | undefined,
  masterProfile: MasterProfileData | null | undefined,
  userProjects: UserProjectItem[] = []
): ResumeData {
  const profileResume = adaptMasterProfileToResume(
    masterProfile,
    userProjects,
    savedResume?.config?.templateId || "ats-classic"
  );

  if (!savedResume) {
    return profileResume;
  }

  // Preserved configuration (template, sectionOrder, typography, colors, customSections)
  const mergedConfig = {
    ...profileResume.config!,
    ...(savedResume.config || {}),
  };

  return {
    name: (savedResume.name && savedResume.name.trim()) || profileResume.name,
    phone: (savedResume.phone && savedResume.phone.trim()) || profileResume.phone,
    email: (savedResume.email && savedResume.email.trim()) || profileResume.email,
    linkedin: (savedResume.linkedin && savedResume.linkedin.trim()) || profileResume.linkedin,
    github: (savedResume.github && savedResume.github.trim()) || profileResume.github,
    website: (savedResume.website && savedResume.website.trim()) || profileResume.website,
    professionalSummary:
      typeof savedResume.professionalSummary === "string" && savedResume.professionalSummary.trim()
        ? savedResume.professionalSummary
        : profileResume.professionalSummary,
    education:
      Array.isArray(savedResume.education) && savedResume.education.length > 0
        ? savedResume.education
        : profileResume.education,
    experience:
      Array.isArray(savedResume.experience) && savedResume.experience.length > 0
        ? savedResume.experience
        : profileResume.experience,
    projects:
      Array.isArray(savedResume.projects) && savedResume.projects.length > 0
        ? savedResume.projects
        : profileResume.projects,
    achievements:
      Array.isArray(savedResume.achievements) && savedResume.achievements.length > 0
        ? savedResume.achievements
        : profileResume.achievements,
    skills:
      savedResume.skills &&
      (savedResume.skills.languages?.length ||
        savedResume.skills.frameworks?.length ||
        savedResume.skills.tools?.length ||
        savedResume.skills.libraries?.length)
        ? savedResume.skills
        : profileResume.skills,
    skillSections:
      Array.isArray(savedResume.skillSections) && savedResume.skillSections.length > 0
        ? savedResume.skillSections
        : profileResume.skillSections,
    customSections:
      Array.isArray(savedResume.customSections) && savedResume.customSections.length > 0
        ? savedResume.customSections
        : mergedConfig.customSections || [],
    config: mergedConfig,
  };
}
