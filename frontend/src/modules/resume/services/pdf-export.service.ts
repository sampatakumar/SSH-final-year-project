import jsPDF from "jspdf";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export const generateResumePdfBlob = async (
  data: ResumeData,
  config: ResumeBuilderConfig
): Promise<Blob> => {
  const isAtsClassic = config.templateId === "ats-classic";
  const isCompact = config.templateId === "compact";
  const isMinimal = config.templateId === "minimal";

  const doc = new jsPDF({
    unit: "pt",
    format: "a4", // 595.28 x 841.89 pt
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margins = config.typography?.pageMargins || (isCompact ? 24 : 36);
  const left = margins;
  const contentWidth = pageWidth - margins * 2;
  const centerX = pageWidth / 2;

  const fontMultiplier = isCompact ? 0.95 : 1.0;
  const bodyFontSize = (config.typography?.bodySize || 10) * fontMultiplier;
  const headingFontSize = (config.typography?.headingSize || 12) * fontMultiplier;
  const lineHeight = Math.round(bodyFontSize * (config.typography?.lineHeight || 1.25));
  const sectionGap = (config.typography?.sectionGap || 12) * (isCompact ? 0.75 : 1);

  // Map font family
  let pdfFont = "helvetica";
  if (config.typography?.fontFamily === "Times New Roman" || isAtsClassic) {
    pdfFont = "times";
  }

  let y = margins;

  const ensureY = (requiredSpace = 20) => {
    if (y + requiredSpace > pageHeight - margins) {
      doc.addPage();
      y = margins;
    }
  };

  const writeLine = (text: string, x = left, lh = lineHeight) => {
    ensureY(lh);
    doc.text(text, x, y);
    y += lh;
  };

  const writeWrapped = (text: string, x = left, w = contentWidth, lh = lineHeight) => {
    const lines = doc.splitTextToSize(text, w);
    lines.forEach((l: string) => {
      ensureY(lh);
      doc.text(l, x, y);
      y += lh;
    });
  };

  const writeSectionHeading = (title: string) => {
    y += Math.round(sectionGap * 0.6);
    ensureY(24);
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(headingFontSize);

    // Accent color
    if (!isAtsClassic && config.accentColor) {
      const hex = config.accentColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      doc.setTextColor(r, g, b);
    } else {
      doc.setTextColor(0, 0, 0);
    }

    doc.text(title.toUpperCase(), left, y);
    y += 5;
    ensureY(10);

    doc.setLineWidth(isMinimal ? 0.4 : 0.8);
    if (!isAtsClassic && config.accentColor) {
      const hex = config.accentColor.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      doc.setDrawColor(r, g, b);
    } else {
      doc.setDrawColor(0, 0, 0);
    }

    doc.line(left, y, left + contentWidth, y);
    y += 9;

    // Reset styles
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(bodyFontSize);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
  };

  // Header / Name
  doc.setFont(pdfFont, isMinimal ? "normal" : "bold");
  doc.setFontSize(isCompact ? 18 : 22);

  if (!isAtsClassic && config.accentColor) {
    const hex = config.accentColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    doc.setTextColor(r, g, b);
  }

  ensureY(30);
  doc.text(data.name || "Candidate Name", isMinimal ? left : centerX, y, {
    align: isMinimal ? "left" : "center",
  });
  y += isCompact ? 18 : 22;

  // Contact Info Line
  doc.setFont(pdfFont, "normal");
  doc.setFontSize(bodyFontSize * 0.92);
  doc.setTextColor(isMinimal ? 100 : 0, isMinimal ? 100 : 0, isMinimal ? 100 : 0);

  const contactItems = [
    data.phone,
    data.email,
    data.linkedin ? "LinkedIn" : null,
    data.github ? "GitHub" : null,
    data.website ? "Portfolio" : null,
  ].filter(Boolean) as string[];

  if (contactItems.length > 0) {
    const contactText = contactItems.join("  •  ");
    ensureY(lineHeight);
    doc.text(contactText, isMinimal ? left : centerX, y, {
      align: isMinimal ? "left" : "center",
    });
    y += lineHeight + (isCompact ? 2 : 4);
  }

  // Render Sections in specified order
  const isHidden = (key: string) => config.hiddenSections?.includes(key);

  config.sectionOrder.forEach((key) => {
    if (isHidden(key)) return;

    if (key === "summary" && data.professionalSummary?.trim()) {
      writeSectionHeading("Professional Summary");
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(bodyFontSize);
      writeWrapped(data.professionalSummary, left, contentWidth, lineHeight);
    }

    if (key === "experience" && data.experience?.length) {
      writeSectionHeading("Experience");
      data.experience.forEach((exp) => {
        ensureY(lineHeight * 2);
        doc.setFont(pdfFont, "bold");
        doc.text(exp.role || "", left, y);
        if (exp.date) {
          doc.setFont(pdfFont, "normal");
          doc.text(exp.date, left + contentWidth, y, { align: "right" });
        }
        y += lineHeight;

        doc.setFont(pdfFont, "italic");
        doc.text(exp.company || "", left, y);
        if (exp.location) {
          doc.text(exp.location, left + contentWidth, y, { align: "right" });
        }
        y += lineHeight;

        doc.setFont(pdfFont, "normal");
        if (exp.bullets?.length) {
          exp.bullets.forEach((b) => {
            writeWrapped(`•  ${b}`, left + 10, contentWidth - 10, lineHeight);
          });
        }
        y += 3;
      });
    }

    if (key === "projects" && data.projects?.length) {
      writeSectionHeading("Projects");
      data.projects.forEach((proj) => {
        ensureY(lineHeight * 2);
        doc.setFont(pdfFont, "bold");
        const titleLine = proj.name + (proj.technologies ? ` | ${proj.technologies}` : "");
        doc.text(titleLine, left, y);
        y += lineHeight;

        doc.setFont(pdfFont, "normal");
        if (proj.bullets?.length) {
          proj.bullets.forEach((b) => {
            writeWrapped(`•  ${b}`, left + 10, contentWidth - 10, lineHeight);
          });
        }
        y += 3;
      });
    }

    if (key === "skills") {
      const skillLines = getRenderableSkillLines(data);
      if (skillLines.length > 0) {
        writeSectionHeading("Technical Skills");
        doc.setFont(pdfFont, "normal");
        skillLines.forEach((sl) => {
          ensureY(lineHeight);
          doc.setFont(pdfFont, "bold");
          const label = sl.label ? `${sl.label}: ` : "";
          if (label) {
            doc.text(label, left, y);
          }
          const labelWidth = label ? doc.getTextWidth(label) : 0;
          doc.setFont(pdfFont, "normal");
          doc.text(sl.value || "", left + labelWidth + (label ? 4 : 0), y);
          y += lineHeight;
        });
      }
    }

    if (key === "education" && data.education?.length) {
      writeSectionHeading("Education");
      data.education.forEach((edu) => {
        ensureY(lineHeight * 2);
        doc.setFont(pdfFont, "bold");
        doc.text(edu.school || "", left, y);
        if (edu.location) {
          doc.setFont(pdfFont, "normal");
          doc.text(edu.location, left + contentWidth, y, { align: "right" });
        }
        y += lineHeight;

        doc.setFont(pdfFont, "italic");
        doc.text([edu.degree, edu.grade].filter(Boolean).join(" - "), left, y);
        if (edu.date) {
          doc.text(edu.date, left + contentWidth, y, { align: "right" });
        }
        y += lineHeight + 2;
      });
    }

    if (key === "achievements" && data.achievements?.length) {
      writeSectionHeading("Achievements");
      data.achievements.forEach((ach) => {
        ensureY(lineHeight);
        doc.setFont(pdfFont, "bold");
        doc.text(ach.title, left, y);
        if (ach.date) {
          doc.setFont(pdfFont, "normal");
          doc.text(ach.date, left + contentWidth, y, { align: "right" });
        }
        y += lineHeight;

        doc.setFont(pdfFont, "normal");
        if (ach.bullets?.length) {
          ach.bullets.forEach((b) => {
            writeWrapped(`•  ${b}`, left + 10, contentWidth - 10, lineHeight);
          });
        }
      });
    }

    if (key === "custom" && config.customSections?.length) {
      config.customSections.forEach((sec) => {
        if (isHidden(`custom-${sec.id}`) || !sec.entries?.length) return;
        writeSectionHeading(sec.title);
        sec.entries.forEach((entry) => {
          ensureY(lineHeight);
          doc.setFont(pdfFont, "bold");
          doc.text(entry.title, left, y);
          if (entry.date) {
            doc.setFont(pdfFont, "normal");
            doc.text(entry.date, left + contentWidth, y, { align: "right" });
          }
          y += lineHeight;

          if (entry.subtitle) {
            doc.setFont(pdfFont, "italic");
            doc.text(entry.subtitle, left, y);
            y += lineHeight;
          }

          doc.setFont(pdfFont, "normal");
          if (entry.bullets?.length) {
            entry.bullets.forEach((b) => {
              if (b.trim()) {
                writeWrapped(`•  ${b}`, left + 10, contentWidth - 10, lineHeight);
              }
            });
          }
          y += 2;
        });
      });
    }
  });

  return doc.output("blob");
};
