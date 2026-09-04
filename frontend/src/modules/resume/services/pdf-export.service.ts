import jsPDF from "jspdf";
import React from "react";
import { createRoot } from "react-dom/client";
import ResumeTemplateRenderer from "../templates/ResumeTemplateRenderer";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

/**
 * High-Fidelity Vector & Print PDF Engine (v7)
 *
 * ARCHITECTURAL REQUIREMENTS:
 * 1. REAL PDF TEXT: All text is 100% selectable, copyable, and searchable (Ctrl+F).
 * 2. REAL PDF HYPERLINK ANNOTATIONS: Clickable links for Email, Phone, LinkedIn, GitHub, Portfolio, Live, Code.
 * 3. ZERO RASTERIZATION: No html2canvas, no PNG/JPEG images, no canvas screenshots.
 * 4. SINGLE SOURCE OF TRUTH: Uses the same React template DOM in non-interactive print mode.
 */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0,
  ];
}

/**
 * 1. Browser Native High-Fidelity Print Engine:
 * Renders the exact React template DOM in a hidden iframe and invokes the browser print engine ("Save as PDF").
 * This creates a 100% vector, 100% selectable, 100% link-annotated PDF directly from the rendered HTML/CSS.
 */
export const printResumeViaBrowser = async (
  data: ResumeData,
  config: ResumeBuilderConfig,
  title: string = "Resume"
): Promise<void> => {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  return new Promise<void>((resolve, reject) => {
    try {
      let iframe = document.getElementById("resume-print-frame") as HTMLIFrameElement | null;
      if (iframe) {
        iframe.remove();
      }

      iframe = document.createElement("iframe");
      iframe.id = "resume-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        resolve();
        return;
      }

      const headContent: string[] = [];
      document.querySelectorAll("link[rel='stylesheet'], style").forEach((el) => {
        headContent.push(el.outerHTML);
      });

      const pageMargin = config.typography?.pageMargins || 32;

      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>${(title || "Resume").replace(/[^\w\s-]/g, "")}</title>
            ${headContent.join("\n")}
            <style>
              @page {
                size: A4 portrait;
                margin: 0;
              }
              *, *::before, *::after {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                width: 210mm !important;
              }
              #print-root {
                width: 794px !important;
                min-height: 1123px !important;
                padding: ${pageMargin}px !important;
                margin: 0 auto !important;
                background: #ffffff !important;
              }
              #print-root header,
              #print-root #canvas-section-personal,
              #print-root [id^="canvas-section-"] {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              #print-root aside {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
              }
              a {
                color: inherit !important;
                text-decoration: underline !important;
              }
            </style>
          </head>
          <body>
            <div id="print-root"></div>
          </body>
        </html>
      `);
      doc.close();

      const printRoot = doc.getElementById("print-root");
      if (!printRoot) {
        iframe.contentWindow?.print();
        resolve();
        return;
      }

      const root = createRoot(printRoot);
      root.render(
        React.createElement(ResumeTemplateRenderer, {
          data,
          config,
          isInteractive: false,
        })
      );

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 250);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * 2. Pure Vector PDF Generator (Blob Export & Storage):
 * Generates an A4 vector PDF with genuine text objects and PDF hyperlink annotations.
 * Never rasterizes. Never embeds images for pages.
 */
export const generateResumePdfBlob = async (
  data: ResumeData,
  config: ResumeBuilderConfig
): Promise<Blob> => {
  const safeData = data || ({} as Partial<typeof data>);
  const {
    templateId = "ats-classic",
    typography = {
      fontFamily: "Times New Roman",
      bodySize: 10,
      headingSize: 12,
      lineHeight: 1.35,
      sectionGap: 14,
      pageMargins: 32,
    },
    sectionOrder = ["summary", "experience", "projects", "education", "skills", "achievements"],
    hiddenSections = [],
    customSections = [],
    accentColor = "#0f766e",
  } = config;

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const ptPerPx = pageWidth / 794;

  const marginPx = typography.pageMargins || 32;
  const marginPt = marginPx * ptPerPx;
  const leftX = marginPt;
  const rightX = pageWidth - marginPt;
  const contentWidth = rightX - leftX;

  const bodySize = typography.bodySize || 10;
  const headSize = typography.headingSize || 12;
  const lineHeightMult = typography.lineHeight || 1.35;
  const bodyLH = bodySize * lineHeightMult;
  const secGap = Math.max(8, (typography.sectionGap || 14) * ptPerPx);

  let ff = "times";
  const fam = (typography.fontFamily || "").toLowerCase();
  if (fam.includes("times") || fam.includes("serif") || fam.includes("georgia") || fam.includes("merriweather")) {
    ff = "times";
  } else if (fam.includes("courier") || fam.includes("mono")) {
    ff = "courier";
  } else {
    ff = "helvetica";
  }

  const [acR, acG, acB] = hexToRgb(accentColor || "#0f766e");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  let cy = marginPt;

  const need = (h: number) => {
    if (cy + h > pageHeight - marginPt) {
      doc.addPage();
      cy = marginPt;
      if (templateId === "two-column") drawSidebarBg();
    }
  };

  const drawSidebarBg = () => {
    const sw = pageWidth * 0.35;
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, sw, pageHeight, "F");
  };

  const splitText = (text: string, maxW: number): string[] => {
    if (!text) return [];
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean) return [];
    return doc.splitTextToSize(clean, maxW);
  };

  const renderHeading = (title: string) => {
    need(headSize + 14);
    doc.setFont(ff, "bold");
    doc.setFontSize(headSize);

    if (templateId === "modern-developer") {
      doc.setTextColor(acR, acG, acB);
    } else if (templateId === "minimal") {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(headSize * 0.95);
    } else {
      doc.setTextColor(0, 0, 0);
    }

    doc.text(title.toUpperCase(), leftX, cy + headSize * 0.85);
    cy += headSize + 2;

    if (templateId !== "minimal") {
      doc.setLineWidth(0.75);
      if (templateId === "modern-developer" || templateId === "compact") {
        doc.setDrawColor(acR, acG, acB);
      } else {
        doc.setDrawColor(0, 0, 0);
      }
      doc.line(leftX, cy, rightX, cy);
      cy += 5;
    } else {
      cy += 2;
    }
  };

  const isHidden = (k: string) => hiddenSections.includes(k);

  // ─────────────────────────────────────────────────────────────────────────
  // SINGLE-COLUMN TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────
  if (templateId !== "two-column") {
    // ── HEADER ────────────────────────────────────────────────────────────
    if (templateId === "ats-classic") {
      doc.setFont(ff, "bold");
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      need(28);
      const nameText = safeData.name?.toUpperCase() || "CANDIDATE NAME";
      const nameW = doc.getTextWidth(nameText);
      doc.text(nameText, (pageWidth - nameW) / 2, cy + 16);
      cy += 22;

      const contactPieces: Array<{ text: string; url?: string }> = [
        safeData.phone ? { text: safeData.phone, url: `tel:${safeData.phone}` } : null,
        safeData.email ? { text: safeData.email, url: `mailto:${safeData.email}` } : null,
        safeData.linkedin ? { text: "LinkedIn", url: safeData.linkedin } : null,
        safeData.github ? { text: "GitHub", url: safeData.github } : null,
        safeData.website ? { text: "Portfolio", url: safeData.website } : null,
      ].filter(Boolean) as any;

      if (contactPieces.length > 0) {
        doc.setFont(ff, "normal");
        doc.setFontSize(bodySize * 0.9);
        doc.setTextColor(0, 0, 0);
        need(16);

        const sep = "  •  ";
        const sepW = doc.getTextWidth(sep);
        const fullStr = contactPieces.map((p) => p.text).join(sep);
        const totalW = doc.getTextWidth(fullStr);

        if (totalW <= contentWidth) {
          let startX = (pageWidth - totalW) / 2;
          const lineY = cy + 7;
          contactPieces.forEach((piece, idx) => {
            doc.text(piece.text, startX, lineY);
            const pieceW = doc.getTextWidth(piece.text);
            if (piece.url) {
              doc.link(startX, lineY - bodySize * 0.75, pieceW, bodySize, { url: piece.url });
            }
            startX += pieceW;
            if (idx < contactPieces.length - 1) {
              doc.text(sep, startX, lineY);
              startX += sepW;
            }
          });
          cy += 14;
        } else {
          const contactLines = splitText(fullStr, contentWidth);
          contactLines.forEach((cl: string) => {
            need(bodyLH);
            const clW = doc.getTextWidth(cl);
            doc.text(cl, (pageWidth - clW) / 2, cy + bodySize * 0.85);
            cy += bodyLH;
          });
        }
      }

      cy += 2;
      doc.setLineWidth(0.75);
      doc.setDrawColor(0, 0, 0);
      doc.line(leftX, cy, rightX, cy);
      cy += secGap;

    } else if (templateId === "modern-developer") {
      doc.setFont(ff, "bold");
      doc.setFontSize(19);
      doc.setTextColor(acR, acG, acB);
      need(28);
      const nameText = safeData.name?.toUpperCase() || "CANDIDATE NAME";
      doc.text(nameText, leftX, cy + 15);

      const mdContacts: Array<{ text: string; url?: string }> = [
        safeData.email ? { text: safeData.email, url: `mailto:${safeData.email}` } : null,
        safeData.phone ? { text: safeData.phone, url: `tel:${safeData.phone}` } : null,
        safeData.linkedin ? { text: "LinkedIn", url: safeData.linkedin } : null,
        safeData.github ? { text: "GitHub", url: safeData.github } : null,
      ].filter(Boolean) as any;

      if (mdContacts.length > 0) {
        doc.setFont(ff, "normal");
        doc.setFontSize(bodySize * 0.88);
        doc.setTextColor(71, 85, 105);
        const contactStr = mdContacts.map((c) => c.text).join(" | ");
        const csW = doc.getTextWidth(contactStr);
        const nameW = doc.getTextWidth(nameText);

        if (csW + nameW + 16 < contentWidth) {
          doc.text(contactStr, rightX - csW, cy + 15);
        } else {
          cy += 16;
          doc.text(contactStr, leftX, cy + 12);
        }
      }
      cy += 20;
      doc.setLineWidth(1.5);
      doc.setDrawColor(acR, acG, acB);
      doc.line(leftX, cy, rightX, cy);
      cy += secGap;

    } else if (templateId === "compact") {
      doc.setFont(ff, "bold");
      doc.setFontSize(16);
      doc.setTextColor(acR, acG, acB);
      need(22);
      const nameText = safeData.name?.toUpperCase() || "CANDIDATE NAME";
      const nameW = doc.getTextWidth(nameText);
      doc.text(nameText, (pageWidth - nameW) / 2, cy + 13);
      cy += 16;

      const cpContacts = [
        safeData.phone ? safeData.phone : null,
        safeData.email ? safeData.email : null,
        safeData.linkedin ? "LinkedIn" : null,
        safeData.github ? "GitHub" : null,
      ].filter(Boolean).join(" • ");

      if (cpContacts) {
        doc.setFont(ff, "normal");
        doc.setFontSize(bodySize * 0.88);
        doc.setTextColor(71, 85, 105);
        const cpW = doc.getTextWidth(cpContacts);
        doc.text(cpContacts, (pageWidth - cpW) / 2, cy + 8);
        cy += 12;
      }
      cy += 2;
      doc.setLineWidth(0.75);
      doc.setDrawColor(acR, acG, acB);
      doc.line(leftX, cy, rightX, cy);
      cy += secGap;

    } else if (templateId === "minimal") {
      doc.setFont(ff, "bold");
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42);
      need(26);
      const nameText = safeData.name?.toUpperCase() || "CANDIDATE NAME";
      doc.text(nameText, leftX, cy + 14);
      cy += 18;

      const mnContacts = [
        safeData.phone ? safeData.phone : null,
        safeData.email ? safeData.email : null,
        safeData.linkedin ? "LinkedIn" : null,
        safeData.github ? "GitHub" : null,
      ].filter(Boolean).join("   |   ");

      if (mnContacts) {
        doc.setFont(ff, "normal");
        doc.setFontSize(bodySize * 0.88);
        doc.setTextColor(100, 116, 139);
        const lines = splitText(mnContacts, contentWidth);
        lines.forEach((l: string) => {
          doc.text(l, leftX, cy + 8);
          cy += bodyLH;
        });
        cy += 2;
      }
      cy += secGap;
    }

    // ── SECTION ORDER ──────────────────────────────────────────────────────
    sectionOrder.forEach((sectionKey) => {
      if (isHidden(sectionKey)) return;

      switch (sectionKey) {
        case "summary": {
          if (!safeData.professionalSummary?.trim()) return;
          renderHeading("Professional Summary");
          doc.setFont(ff, "normal");
          doc.setFontSize(bodySize);
          doc.setTextColor(15, 23, 42);

          const lines = splitText(safeData.professionalSummary, contentWidth);
          lines.forEach((line: string) => {
            need(bodyLH);
            doc.text(line, leftX, cy + bodySize * 0.85);
            cy += bodyLH;
          });
          cy += secGap;
          break;
        }

        case "experience": {
          if (!safeData.experience?.length) return;
          renderHeading("Experience");

          safeData.experience.forEach((exp) => {
            if (!exp.company && !exp.role && !exp.bullets?.length) return;
            need(bodyLH * 2 + 10);

            doc.setFont(ff, "bold");
            doc.setFontSize(bodySize);
            doc.setTextColor(0, 0, 0);

            const roleStr = (exp.role || "").trim();
            const dateStr = (exp.date || "").trim();
            const dateW = dateStr ? doc.getTextWidth(dateStr) : 0;
            const maxRoleW = contentWidth - dateW - 12;

            const roleLines = splitText(roleStr, maxRoleW);
            doc.text(roleLines[0] || "", leftX, cy + bodySize * 0.85);
            if (dateStr) doc.text(dateStr, rightX - dateW, cy + bodySize * 0.85);
            cy += bodyLH;

            for (let i = 1; i < roleLines.length; i++) {
              need(bodyLH);
              doc.text(roleLines[i], leftX, cy + bodySize * 0.85);
              cy += bodyLH;
            }

            doc.setFont(ff, "italic");
            doc.setFontSize(bodySize);
            doc.setTextColor(30, 41, 59);

            const compStr = (exp.company || "").trim();
            const locStr = (exp.location || "").trim();
            const locW = locStr ? doc.getTextWidth(locStr) : 0;
            const maxCompW = contentWidth - locW - 12;

            if (compStr || locStr) {
              need(bodyLH);
              const compLines = splitText(compStr, maxCompW);
              doc.text(compLines[0] || "", leftX, cy + bodySize * 0.85);
              if (locStr) doc.text(locStr, rightX - locW, cy + bodySize * 0.85);
              cy += bodyLH;

              for (let i = 1; i < compLines.length; i++) {
                need(bodyLH);
                doc.text(compLines[i], leftX, cy + bodySize * 0.85);
                cy += bodyLH;
              }
            }

            if (exp.bullets?.length) {
              doc.setFont(ff, "normal");
              doc.setFontSize(bodySize);
              doc.setTextColor(15, 23, 42);

              exp.bullets.forEach((bullet) => {
                if (!bullet?.trim()) return;
                const bLines = splitText(bullet, contentWidth - 14);
                bLines.forEach((bLine: string, bIdx: number) => {
                  need(bodyLH);
                  if (bIdx === 0) doc.text("•", leftX + 4, cy + bodySize * 0.85);
                  doc.text(bLine, leftX + 13, cy + bodySize * 0.85);
                  cy += bodyLH;
                });
              });
            }
            cy += 4;
          });

          cy += secGap - 4;
          break;
        }

        case "projects": {
          if (!safeData.projects?.length) return;
          renderHeading("Projects");

          safeData.projects.forEach((proj) => {
            if (!proj.name && !proj.technologies && !proj.bullets?.length) return;
            need(bodyLH * 2 + 8);

            doc.setFont(ff, "bold");
            doc.setFontSize(bodySize);
            doc.setTextColor(0, 0, 0);

            const hasDemo = Boolean(proj.demoUrl);
            const hasCode = Boolean(proj.githubUrl);
            let linksW = 0;
            const linkGap = 10;
            if (hasDemo) linksW += doc.getTextWidth("Live");
            if (hasDemo && hasCode) linksW += linkGap;
            if (hasCode) linksW += doc.getTextWidth("Code");

            const maxTitleW = contentWidth - (linksW > 0 ? linksW + 12 : 0);
            const nameStr = (proj.name || "Project").trim();
            const titleLines = splitText(nameStr, maxTitleW);

            doc.text(titleLines[0] || "", leftX, cy + bodySize * 0.85);

            if (linksW > 0) {
              doc.setFont(ff, "normal");
              doc.setFontSize(bodySize * 0.9);
              doc.setTextColor(0, 0, 0);
              let linkX = rightX - linksW;
              const linkY = cy + bodySize * 0.85;

              if (hasDemo) {
                const liveW = doc.getTextWidth("Live");
                doc.text("Live", linkX, linkY);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.line(linkX, linkY + 1.2, linkX + liveW, linkY + 1.2);
                doc.link(linkX, linkY - bodySize * 0.75, liveW, bodySize, { url: proj.demoUrl });
                linkX += liveW + linkGap;
              }

              if (hasCode) {
                const codeW = doc.getTextWidth("Code");
                doc.text("Code", linkX, linkY);
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.5);
                doc.line(linkX, linkY + 1.2, linkX + codeW, linkY + 1.2);
                doc.link(linkX, linkY - bodySize * 0.75, codeW, bodySize, { url: proj.githubUrl });
              }

              doc.setFont(ff, "bold");
              doc.setFontSize(bodySize);
              doc.setTextColor(0, 0, 0);
            }

            cy += bodyLH;

            for (let i = 1; i < titleLines.length; i++) {
              need(bodyLH);
              doc.text(titleLines[i], leftX, cy + bodySize * 0.85);
              cy += bodyLH;
            }

            if (proj.technologies?.trim()) {
              need(bodyLH);
              doc.setFont(ff, "italic");
              doc.setFontSize(bodySize * 0.9);
              doc.setTextColor(51, 65, 85);

              const techLines = splitText(proj.technologies.trim(), contentWidth);
              techLines.forEach((tl: string) => {
                need(bodyLH * 0.95);
                doc.text(tl, leftX, cy + bodySize * 0.8);
                cy += bodyLH * 0.95;
              });
            }

            if (proj.bullets?.length) {
              doc.setFont(ff, "normal");
              doc.setFontSize(bodySize);
              doc.setTextColor(15, 23, 42);

              proj.bullets.forEach((bullet) => {
                if (!bullet?.trim()) return;
                const bLines = splitText(bullet, contentWidth - 14);
                bLines.forEach((bLine: string, bIdx: number) => {
                  need(bodyLH);
                  if (bIdx === 0) doc.text("•", leftX + 4, cy + bodySize * 0.85);
                  doc.text(bLine, leftX + 13, cy + bodySize * 0.85);
                  cy += bodyLH;
                });
              });
            }
            cy += 4;
          });

          cy += secGap - 4;
          break;
        }

        case "education": {
          if (!safeData.education?.length) return;
          renderHeading("Education");

          safeData.education.forEach((edu) => {
            if (!edu.school && !edu.degree) return;
            need(bodyLH * 2 + 6);

            doc.setFont(ff, "bold");
            doc.setFontSize(bodySize);
            doc.setTextColor(0, 0, 0);

            const schoolStr = (edu.school || "").trim();
            const locStr = (edu.location || "").trim();
            const locW = locStr ? doc.getTextWidth(locStr) : 0;
            const maxSchoolW = contentWidth - locW - 12;

            const schoolLines = splitText(schoolStr, maxSchoolW);
            doc.text(schoolLines[0] || "", leftX, cy + bodySize * 0.85);
            if (locStr) doc.text(locStr, rightX - locW, cy + bodySize * 0.85);
            cy += bodyLH;

            for (let i = 1; i < schoolLines.length; i++) {
              need(bodyLH);
              doc.text(schoolLines[i], leftX, cy + bodySize * 0.85);
              cy += bodyLH;
            }

            doc.setFont(ff, "italic");
            doc.setFontSize(bodySize);
            doc.setTextColor(30, 41, 59);

            const degPieces = [edu.degree, edu.grade].filter(Boolean);
            const degStr = degPieces.join(" - ");
            const dateStr = (edu.date || "").trim();
            const dateW = dateStr ? doc.getTextWidth(dateStr) : 0;
            const maxDegW = contentWidth - dateW - 12;

            if (degStr || dateStr) {
              need(bodyLH);
              const degLines = splitText(degStr, maxDegW);
              doc.text(degLines[0] || "", leftX, cy + bodySize * 0.85);
              if (dateStr) doc.text(dateStr, rightX - dateW, cy + bodySize * 0.85);
              cy += bodyLH;

              for (let i = 1; i < degLines.length; i++) {
                need(bodyLH);
                doc.text(degLines[i], leftX, cy + bodySize * 0.85);
                cy += bodyLH;
              }
            }

            if (edu.bullets?.length) {
              doc.setFont(ff, "normal");
              doc.setFontSize(bodySize);
              doc.setTextColor(15, 23, 42);

              edu.bullets.forEach((bullet) => {
                if (!bullet?.trim()) return;
                const bLines = splitText(bullet, contentWidth - 14);
                bLines.forEach((bLine: string, bIdx: number) => {
                  need(bodyLH);
                  if (bIdx === 0) doc.text("•", leftX + 4, cy + bodySize * 0.85);
                  doc.text(bLine, leftX + 13, cy + bodySize * 0.85);
                  cy += bodyLH;
                });
              });
            }
            cy += 4;
          });

          cy += secGap - 4;
          break;
        }

        case "skills": {
          const skillLines = getRenderableSkillLines(safeData as any);
          if (!skillLines.length) return;
          renderHeading("Technical Skills");

          skillLines.forEach((line) => {
            need(bodyLH);
            doc.setFont(ff, "bold");
            doc.setFontSize(bodySize);
            doc.setTextColor(0, 0, 0);

            const catLabel = line.label ? `${line.label}: ` : "";
            const catW = catLabel ? doc.getTextWidth(catLabel) : 0;

            const fullLineStr = `${catLabel}${line.value}`;
            const wrappedLines = splitText(fullLineStr, contentWidth);

            wrappedLines.forEach((wl: string, wIdx: number) => {
              need(bodyLH);
              if (wIdx === 0 && catLabel) {
                doc.setFont(ff, "bold");
                doc.text(catLabel, leftX, cy + bodySize * 0.85);

                const valuesPart = wl.substring(catLabel.length);
                if (valuesPart) {
                  doc.setFont(ff, "normal");
                  doc.setTextColor(15, 23, 42);
                  doc.text(valuesPart, leftX + catW, cy + bodySize * 0.85);
                }
              } else {
                doc.setFont(ff, "normal");
                doc.setTextColor(15, 23, 42);
                doc.text(wl, leftX + (catLabel ? 8 : 0), cy + bodySize * 0.85);
              }
              cy += bodyLH * 0.96;
            });
          });

          cy += secGap - 2;
          break;
        }

        case "achievements": {
          if (!safeData.achievements?.length) return;
          renderHeading("Achievements & Awards");

          safeData.achievements.forEach((ach) => {
            if (!ach.title && !ach.bullets?.length) return;
            need(bodyLH + 4);

            doc.setFont(ff, "bold");
            doc.setFontSize(bodySize);
            doc.setTextColor(0, 0, 0);

            const titleStr = (ach.title || "").trim();
            const dateStr = (ach.date || "").trim();
            const dateW = dateStr ? doc.getTextWidth(dateStr) : 0;
            const maxTitleW = contentWidth - dateW - 12;

            const titleLines = splitText(titleStr, maxTitleW);
            doc.text(titleLines[0] || "", leftX, cy + bodySize * 0.85);
            if (dateStr) doc.text(dateStr, rightX - dateW, cy + bodySize * 0.85);
            cy += bodyLH;

            for (let i = 1; i < titleLines.length; i++) {
              need(bodyLH);
              doc.text(titleLines[i], leftX, cy + bodySize * 0.85);
              cy += bodyLH;
            }

            if (ach.bullets?.length) {
              doc.setFont(ff, "normal");
              doc.setFontSize(bodySize);
              doc.setTextColor(15, 23, 42);

              ach.bullets.forEach((bullet) => {
                if (!bullet?.trim()) return;
                const bLines = splitText(bullet, contentWidth - 14);
                bLines.forEach((bLine: string, bIdx: number) => {
                  need(bodyLH);
                  if (bIdx === 0) doc.text("•", leftX + 4, cy + bodySize * 0.85);
                  doc.text(bLine, leftX + 13, cy + bodySize * 0.85);
                  cy += bodyLH;
                });
              });
            }
            cy += 3;
          });

          cy += secGap - 3;
          break;
        }

        default: {
          const customSec = customSections.find((cs) => cs.id === sectionKey);
          if (!customSec || !customSec.items?.length) return;

          renderHeading(customSec.title || "Custom Section");

          customSec.items.forEach((item) => {
            need(bodyLH + 4);

            doc.setFont(ff, "bold");
            doc.setFontSize(bodySize);
            doc.setTextColor(0, 0, 0);

            const itemTitle = (item.title || "").trim();
            const itemDate = (item.date || "").trim();
            const dateW = itemDate ? doc.getTextWidth(itemDate) : 0;

            if (itemTitle || itemDate) {
              const lines = splitText(itemTitle, contentWidth - dateW - 12);
              doc.text(lines[0] || "", leftX, cy + bodySize * 0.85);
              if (itemDate) doc.text(itemDate, rightX - dateW, cy + bodySize * 0.85);
              cy += bodyLH;

              for (let i = 1; i < lines.length; i++) {
                need(bodyLH);
                doc.text(lines[i], leftX, cy + bodySize * 0.85);
                cy += bodyLH;
              }
            }

            if (item.subtitle) {
              need(bodyLH);
              doc.setFont(ff, "italic");
              doc.setFontSize(bodySize * 0.9);
              doc.setTextColor(51, 65, 85);
              const subLines = splitText(item.subtitle, contentWidth);
              subLines.forEach((sl: string) => {
                doc.text(sl, leftX, cy + bodySize * 0.8);
                cy += bodyLH * 0.9;
              });
            }

            if (item.bullets?.length) {
              doc.setFont(ff, "normal");
              doc.setFontSize(bodySize);
              doc.setTextColor(15, 23, 42);

              item.bullets.forEach((bullet) => {
                if (!bullet?.trim()) return;
                const bLines = splitText(bullet, contentWidth - 14);
                bLines.forEach((bLine: string, bIdx: number) => {
                  need(bodyLH);
                  if (bIdx === 0) doc.text("•", leftX + 4, cy + bodySize * 0.85);
                  doc.text(bLine, leftX + 13, cy + bodySize * 0.85);
                  cy += bodyLH;
                });
              });
            }
            cy += 3;
          });

          cy += secGap - 3;
          break;
        }
      }
    });
  } else {
    // ─────────────────────────────────────────────────────────────────────────
    // TWO-COLUMN TEMPLATE
    // ─────────────────────────────────────────────────────────────────────────
    const sidebarW = pageWidth * 0.35;
    const sideMargin = marginPt * 0.8;
    const sidebarContentW = sidebarW - sideMargin * 2;
    const mainX = sidebarW + marginPt;
    const mainContentW = pageWidth - mainX - marginPt;

    drawSidebarBg();
    let sideY = marginPt + 10;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    const sName = safeData.name?.toUpperCase() || "CANDIDATE NAME";
    const sNameLines = splitText(sName, sidebarContentW);
    sNameLines.forEach((l) => {
      doc.text(l, sideMargin, sideY + 14);
      sideY += 20;
    });
    sideY += 8;

    const sbContacts: Array<{ label: string; text: string; url?: string }> = [
      safeData.email ? { label: "Email", text: safeData.email, url: `mailto:${safeData.email}` } : null,
      safeData.phone ? { label: "Phone", text: safeData.phone, url: `tel:${safeData.phone}` } : null,
      safeData.linkedin ? { label: "LinkedIn", text: "LinkedIn Profile", url: safeData.linkedin } : null,
      safeData.github ? { label: "GitHub", text: "GitHub Profile", url: safeData.github } : null,
      safeData.website ? { label: "Portfolio", text: "Portfolio", url: safeData.website } : null,
    ].filter(Boolean) as any;

    if (sbContacts.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("CONTACT", sideMargin, sideY + 8);
      sideY += 14;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize * 0.85);
      doc.setTextColor(226, 232, 240);

      sbContacts.forEach((sc) => {
        const cLines = splitText(sc.text, sidebarContentW);
        cLines.forEach((cl) => {
          doc.text(cl, sideMargin, sideY + 8);
          if (sc.url) {
            const clW = doc.getTextWidth(cl);
            doc.link(sideMargin, sideY + 8 - bodySize * 0.75, clW, bodySize, { url: sc.url });
          }
          sideY += bodyLH * 0.9;
        });
        sideY += 2;
      });
      sideY += 12;
    }

    const skillLines = getRenderableSkillLines(safeData as any);
    if (skillLines.length > 0 && !isHidden("skills")) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text("SKILLS", sideMargin, sideY + 8);
      sideY += 14;

      skillLines.forEach((sl) => {
        const catName = sl.label || (sl as any).category || "Skills";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(bodySize * 0.85);
        doc.setTextColor(203, 213, 225);
        doc.text(catName, sideMargin, sideY + 8);
        sideY += bodyLH * 0.88;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(bodySize * 0.8);
        doc.setTextColor(148, 163, 184);
        const slLines = splitText(sl.value, sidebarContentW);
        slLines.forEach((sll) => {
          doc.text(sll, sideMargin, sideY + 7);
          sideY += bodyLH * 0.85;
        });
        sideY += 4;
      });
    }

    cy = marginPt + 10;
    const renderMainHeading = (title: string) => {
      need(headSize + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(headSize);
      doc.setTextColor(acR, acG, acB);
      doc.text(title.toUpperCase(), mainX, cy + headSize * 0.85);
      cy += headSize + 2;
      doc.setLineWidth(1);
      doc.setDrawColor(acR, acG, acB);
      doc.line(mainX, cy, rightX, cy);
      cy += 6;
    };

    if (safeData.professionalSummary?.trim() && !isHidden("summary")) {
      renderMainHeading("Professional Summary");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(bodySize);
      doc.setTextColor(15, 23, 42);
      const sumLines = splitText(safeData.professionalSummary, mainContentW);
      sumLines.forEach((sl) => {
        need(bodyLH);
        doc.text(sl, mainX, cy + bodySize * 0.85);
        cy += bodyLH;
      });
      cy += secGap;
    }
  }

  return doc.output("blob");
};
