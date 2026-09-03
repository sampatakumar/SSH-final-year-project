import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export interface DensityAnalysis {
  estimatedLines: number;
  pageCapacity: number;
  fillRatio: number; // 0.0 to 2.0+
  estimatedPages: number;
  status: "underfilled" | "balanced" | "overflowing";
  warnings: string[];
  suggestions: string[];
}

const BASE_PAGE_LINE_CAPACITY = 50;

export const calculateResumeDensity = (
  data: ResumeData,
  config: ResumeBuilderConfig
): DensityAnalysis => {
  const isHidden = (key: string) => config.hiddenSections?.includes(key);

  let lines = 4; // Header, name, contact info

  if (!isHidden("summary") && data.professionalSummary?.trim()) {
    lines += Math.ceil(data.professionalSummary.length / 90) + 2; // Summary title + content
  }

  if (!isHidden("education") && data.education?.length) {
    lines += 2 + data.education.length * 2.5;
  }

  if (!isHidden("experience") && data.experience?.length) {
    const totalExpBullets = data.experience.reduce((sum, e) => sum + (e.bullets?.length || 0), 0);
    lines += 2 + data.experience.length * 2 + totalExpBullets * 1.2;
  }

  if (!isHidden("projects") && data.projects?.length) {
    const totalProjBullets = data.projects.reduce((sum, p) => sum + (p.bullets?.length || 0), 0);
    lines += 2 + data.projects.length * 1.8 + totalProjBullets * 1.1;
  }

  if (!isHidden("skills")) {
    const skillLines = getRenderableSkillLines(data);
    if (skillLines.length > 0) {
      lines += 2 + skillLines.length * 1.2;
    }
  }

  if (!isHidden("achievements") && data.achievements?.length) {
    const totalAchBullets = data.achievements.reduce((sum, a) => sum + (a.bullets?.length || 0), 0);
    lines += 2 + data.achievements.length * 1.5 + totalAchBullets;
  }

  if (!isHidden("custom") && config.customSections?.length) {
    config.customSections.forEach((sec) => {
      if (!isHidden(`custom-${sec.id}`) && sec.entries?.length) {
        lines += 2 + sec.entries.length * 2;
      }
    });
  }

  // Adjust for font size, line height, and section gap factors
  const fontScaling = config.typography?.bodySize ? config.typography.bodySize / 10 : 1;
  const lineGapScaling = config.typography?.lineHeight ? config.typography.lineHeight / 1.2 : 1;
  const sectionGapScaling = config.typography?.sectionGap ? 1 + (config.typography.sectionGap - 12) * 0.015 : 1;

  const adjustedLines = Math.round(lines * fontScaling * lineGapScaling * sectionGapScaling);
  const fillRatio = Math.max(0.1, adjustedLines / BASE_PAGE_LINE_CAPACITY);
  const estimatedPages = fillRatio <= 1.05 ? 1 : Math.ceil(fillRatio);

  const warnings: string[] = [];
  const suggestions: string[] = [];
  let status: "underfilled" | "balanced" | "overflowing" = "balanced";

  if (fillRatio < 0.7) {
    status = "underfilled";
    warnings.push("Large unused whitespace detected on the page.");
    suggestions.push("Add a strong Professional Summary, detailed project bullets, or coursework to fill the page.");
  } else if (fillRatio > 1.05 && fillRatio < 1.4) {
    status = "overflowing";
    warnings.push("Content slightly spills onto a 2nd page with sparse lines.");
    suggestions.push("Click 'Optimize for 1 Page' to fit cleanly on one sheet without deleting content.");
  } else if (fillRatio >= 1.4 && fillRatio < 1.8) {
    status = "overflowing";
    warnings.push("Resume is between 1 and 2 pages.");
    suggestions.push("Either trim secondary details for a clean 1-page resume or expand experiences for a full 2-page format.");
  }

  return {
    estimatedLines: adjustedLines,
    pageCapacity: BASE_PAGE_LINE_CAPACITY,
    fillRatio: Number(fillRatio.toFixed(2)),
    estimatedPages,
    status,
    warnings,
    suggestions
  };
};

export const optimizeConfigForOnePage = (
  data: ResumeData,
  currentConfig: ResumeBuilderConfig
): ResumeBuilderConfig => {
  const currentDensity = calculateResumeDensity(data, currentConfig);

  if (currentDensity.fillRatio <= 1.0) {
    return currentConfig;
  }

  // Calculate needed scaling
  const overflow = currentDensity.fillRatio; // e.g. 1.25

  let nextSectionGap = Math.min(
    currentConfig.typography.sectionGap,
    Math.max(6, Math.round(currentConfig.typography.sectionGap / overflow))
  );
  let nextLineHeight = Math.min(
    currentConfig.typography.lineHeight,
    Math.max(1.12, Number((currentConfig.typography.lineHeight / overflow).toFixed(2)))
  );
  let nextBodySize = Math.min(
    currentConfig.typography.bodySize,
    Math.max(9.0, Number((currentConfig.typography.bodySize / overflow).toFixed(1)))
  );
  let nextPageMargins = Math.min(
    currentConfig.typography.pageMargins,
    Math.max(20, Math.round(currentConfig.typography.pageMargins * 0.85))
  );

  // If still overflowing slightly, tighten further
  if (overflow > 1.3) {
    nextSectionGap = Math.max(6, nextSectionGap - 2);
    nextBodySize = Math.max(9.0, nextBodySize - 0.3);
  }

  return {
    ...currentConfig,
    spacingPreset: "compact",
    pageMode: "one-page",
    typography: {
      ...currentConfig.typography,
      sectionGap: nextSectionGap,
      lineHeight: nextLineHeight,
      bodySize: nextBodySize,
      headingSize: Math.max(10.5, nextBodySize + 1.5),
      pageMargins: nextPageMargins
    }
  };
};
