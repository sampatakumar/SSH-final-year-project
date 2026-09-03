export type TemplateId =
  | "ats-classic"
  | "modern-developer"
  | "minimal"
  | "two-column"
  | "compact";

export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "achievements"
  | "certifications"
  | "custom";

export interface CustomSectionEntry {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  link?: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomSectionEntry[];
}

export interface Education {
  school: string;
  location: string;
  degree: string;
  date: string;
  grade?: string;
}

export interface Experience {
  company: string;
  location: string;
  role: string;
  date: string;
  bullets: string[];
}

export interface Project {
  name: string;
  technologies: string;
  date?: string;
  githubUrl?: string;
  demoUrl?: string;
  bullets: string[];
}

export interface Achievement {
  title: string;
  date: string;
  bullets: string[];
}

export interface TechnicalSkills {
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  libraries?: string[];
}

export interface SkillSection {
  title: string;
  skills: string[];
}

export interface TypographySettings {
  fontFamily: "Inter" | "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "system-ui";
  bodySize: number; // in pt (e.g. 9.5 to 11.5)
  headingSize: number; // in pt (e.g. 11 to 14)
  lineHeight: number; // (e.g. 1.15 to 1.35)
  sectionGap: number; // in px (e.g. 8 to 20)
  pageMargins: number; // in px (e.g. 24 to 48)
}

export type SpacingPreset = "compact" | "balanced" | "spacious";

export interface ResumeBuilderConfig {
  templateId: TemplateId;
  sectionOrder: string[];
  hiddenSections: string[];
  pageMode: "one-page" | "two-page" | "auto";
  typography: TypographySettings;
  accentColor: string;
  spacingPreset: SpacingPreset;
  customSections: CustomSection[];
}

export interface ResumeData {
  name: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  website?: string;
  professionalSummary?: string;
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
  achievements?: Achievement[];
  skills?: TechnicalSkills;
  skillSections?: SkillSection[];
  customSections?: CustomSection[];
  config?: ResumeBuilderConfig;
}

export interface ResumeTemplateProps {
  data: ResumeData;
  config: ResumeBuilderConfig;
  className?: string;
  isPdfMode?: boolean;
}
