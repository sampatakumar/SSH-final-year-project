import type { TemplateId, ResumeBuilderConfig, SpacingPreset, TypographySettings } from "./types";

export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  bestFor: string;
  badge?: string;
  atsScore: "100% ATS Safe" | "High ATS Compatibility" | "Standard ATS";
  defaultFont: TypographySettings["fontFamily"];
}

export const ACCENT_COLOR_PALETTE = [
  { label: "Indigo (Brand)", value: "#6366F1" },
  { label: "Slate / Monochrome", value: "#111827" },
  { label: "Sky Blue", value: "#0284C7" },
  { label: "Emerald Green", value: "#059669" },
  { label: "Amber Warm", value: "#D97706" },
  { label: "Rose Crimson", value: "#E11D48" },
];

export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateMetadata> = {
  "ats-classic": {
    id: "ats-classic",
    name: "ATS Classic",
    category: "Standard",
    description: "Monochrome single-column layout with clean rule dividers. Optimized for maximum ATS parser parsing accuracy.",
    bestFor: "Enterprise & High-Volume Job Applications",
    badge: "Most Popular",
    atsScore: "100% ATS Safe",
    defaultFont: "Times New Roman"
  },
  "modern-developer": {
    id: "modern-developer",
    name: "Modern Developer",
    category: "Tech",
    description: "Developer-focused design featuring technology tag pills, GitHub/LinkedIn links, and subtle accent accents.",
    bestFor: "Software Engineers, Full-Stack & DevOps",
    badge: "Tech Choice",
    atsScore: "High ATS Compatibility",
    defaultFont: "Inter"
  },
  "minimal": {
    id: "minimal",
    name: "Minimal Clean",
    category: "Modern",
    description: "Airy, elegant layout with strong typography balance, generous margins, and subtle divider rules.",
    bestFor: "Frontend Designers, Product Managers & Tech Leads",
    atsScore: "High ATS Compatibility",
    defaultFont: "Helvetica"
  },
  "two-column": {
    id: "two-column",
    name: "Two Column Compact",
    category: "Compact",
    description: "Split layout with skills and education on the left sidebar, and experience and projects on the main canvas.",
    bestFor: "Mid-to-Senior Engineers with Broad Skillsets",
    atsScore: "Standard ATS",
    defaultFont: "Inter"
  },
  "compact": {
    id: "compact",
    name: "Compact One-Page",
    category: "Student/Fresher",
    description: "High information density layout designed to prevent trailing whitespace and fit seamlessly onto one page.",
    bestFor: "Students, Freshers & Early-Career Developers",
    badge: "1-Page Fit",
    atsScore: "100% ATS Safe",
    defaultFont: "Arial"
  }
};

export const SPACING_PRESETS: Record<SpacingPreset, Partial<TypographySettings>> = {
  compact: {
    bodySize: 9.5,
    headingSize: 11,
    lineHeight: 1.15,
    sectionGap: 8,
    pageMargins: 24
  },
  balanced: {
    bodySize: 10,
    headingSize: 12,
    lineHeight: 1.25,
    sectionGap: 12,
    pageMargins: 32
  },
  spacious: {
    bodySize: 10.5,
    headingSize: 13,
    lineHeight: 1.35,
    sectionGap: 16,
    pageMargins: 40
  }
};

export const DEFAULT_SECTION_ORDER = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "achievements",
  "custom"
];

export const createDefaultBuilderConfig = (templateId: TemplateId = "ats-classic"): ResumeBuilderConfig => {
  const meta = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY["ats-classic"];
  return {
    templateId,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    hiddenSections: [],
    pageMode: "one-page",
    typography: {
      fontFamily: meta.defaultFont,
      bodySize: 10,
      headingSize: 12,
      lineHeight: 1.22,
      sectionGap: 12,
      pageMargins: 32
    },
    accentColor: templateId === "ats-classic" ? "#111827" : "#6366F1",
    spacingPreset: "balanced",
    customSections: []
  };
};
