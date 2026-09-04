import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";
import { CanvasInlineEditable } from "../builder/CanvasInlineEditable";
import { CanvasSectionToolbar } from "../builder/CanvasSectionToolbar";

export const CompactTemplate: React.FC<ResumeTemplateProps> = ({
  data,
  config,
  className = "",
  isInteractive = false,
  selectedSection,
  onSelectSection,
  onDirectEdit,
  onSectionAction,
}) => {
  const safeData = data || ({} as Partial<typeof data>);
  const { typography, sectionOrder, hiddenSections, customSections = [], accentColor } = config;

  const fontStyle = {
    fontFamily: typography.fontFamily === "Arial" ? "Arial, sans-serif" : typography.fontFamily,
    fontSize: `${typography.bodySize * 0.95}pt`,
    lineHeight: typography.lineHeight * 0.95,
  };

  const headingStyle = {
    fontSize: `${typography.headingSize * 0.95}pt`,
    color: accentColor,
    borderColor: accentColor,
  };

  const sectionStyle = {
    marginBottom: `${Math.max(6, typography.sectionGap * 0.75)}px`,
  };

  const isHidden = (key: string) => hiddenSections.includes(key);

  const getSectionWrapperClass = (key: string) => {
    if (!isInteractive) return "";
    const isSelected = selectedSection === key;
    return `relative rounded-xs transition-all duration-150 cursor-pointer ${
      isSelected
        ? "ring-1.5 ring-blue-500/70 bg-blue-500/[0.03] p-1 -m-1 z-20"
        : "hover:ring-1 hover:ring-slate-300/60 p-1 -m-1"
    }`;
  };

  const contactItems = [
    safeData.phone ? (
      <CanvasInlineEditable
        key="phone"
        value={safeData.phone}
        onChange={(val) => onDirectEdit?.("phone", val)}
        isInteractive={isInteractive}
        placeholder="Phone"
      />
    ) : null,
    safeData.email ? (
      <CanvasInlineEditable
        key="email"
        value={safeData.email}
        onChange={(val) => onDirectEdit?.("email", val)}
        isInteractive={isInteractive}
        placeholder="Email"
        className="hover:underline"
      />
    ) : null,
    safeData.linkedin ? (
      isInteractive ? (
        <CanvasInlineEditable
          key="linkedin"
          value={safeData.linkedin}
          onChange={(val) => onDirectEdit?.("linkedin", val)}
          isInteractive={isInteractive}
          placeholder="LinkedIn"
        />
      ) : (
        <a href={safeData.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
      )
    ) : null,
    safeData.github ? (
      isInteractive ? (
        <CanvasInlineEditable
          key="github"
          value={safeData.github}
          onChange={(val) => onDirectEdit?.("github", val)}
          isInteractive={isInteractive}
          placeholder="GitHub"
        />
      ) : (
        <a href={safeData.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
      )
    ) : null,
    safeData.website ? (
      isInteractive ? (
        <CanvasInlineEditable
          key="website"
          value={safeData.website}
          onChange={(val) => onDirectEdit?.("website", val)}
          isInteractive={isInteractive}
          placeholder="Portfolio"
        />
      ) : (
        <a href={safeData.website} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a>
      )
    ) : null,
  ].filter(Boolean);

  const renderSection = (key: string) => {
    if (isHidden(key)) return null;

    switch (key) {
      case "summary":
        if (!data.professionalSummary?.trim() && !isInteractive) return null;
        return (
          <section
            key="summary"
            id="canvas-section-summary"
            style={sectionStyle}
            className={getSectionWrapperClass("summary")}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("summary");
              }
            }}
          >
            {isInteractive && selectedSection === "summary" && (
              <CanvasSectionToolbar sectionId="summary" sectionTitle="Summary" onAction={onSectionAction} />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Summary
            </h2>
            <div className="text-slate-800 text-justify break-words text-[0.95em]">
              <CanvasInlineEditable
                value={data.professionalSummary || ""}
                onChange={(val) => onDirectEdit?.("professionalSummary", val)}
                isInteractive={isInteractive}
                multiline
                placeholder="Professional summary..."
                tag="p"
              />
            </div>
          </section>
        );

      case "experience":
        if (!data.experience?.length && !isInteractive) return null;
        return (
          <section
            key="experience"
            id="canvas-section-experience"
            style={sectionStyle}
            className={getSectionWrapperClass("experience")}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("experience");
              }
            }}
          >
            {isInteractive && selectedSection === "experience" && (
              <CanvasSectionToolbar sectionId="experience" sectionTitle="Experience" onAction={onSectionAction} canAddItem />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-1.5">
              {(data.experience || []).map((exp, idx) => (
                <div key={`exp-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900 text-[0.95em]">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.role || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.role`, val)}
                        isInteractive={isInteractive}
                        placeholder="Role"
                      />{" "}
                      <span className="font-normal text-slate-700">@ </span>
                      <CanvasInlineEditable
                        value={exp.company || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.company`, val)}
                        isInteractive={isInteractive}
                        placeholder="Company"
                      />
                    </span>
                    <span className="font-normal text-slate-500 text-[0.88em] shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.date || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.92em]">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={`exp-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={bullet}
                            onChange={(val) => onDirectEdit?.(`experience.${idx}.bullets.${bIdx}`, val)}
                            isInteractive={isInteractive}
                            multiline
                            placeholder="Bullet..."
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "projects":
        if (!data.projects?.length && !isInteractive) return null;
        return (
          <section
            key="projects"
            id="canvas-section-projects"
            style={sectionStyle}
            className={getSectionWrapperClass("projects")}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("projects");
              }
            }}
          >
            {isInteractive && selectedSection === "projects" && (
              <CanvasSectionToolbar sectionId="projects" sectionTitle="Projects" onAction={onSectionAction} canAddItem />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Projects
            </h2>
            <div className="space-y-1.5">
              {(data.projects || []).map((proj, idx) => (
                <div key={`proj-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-2 font-bold text-slate-900 text-[0.95em]">
                    <span className="min-w-0 flex-1">
                      <CanvasInlineEditable
                        value={proj.name || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.name`, val)}
                        isInteractive={isInteractive}
                        placeholder="Project Name"
                      />
                    </span>
                    <div className="flex gap-2 font-normal text-[0.85em] shrink-0 text-right whitespace-nowrap ml-2">
                      {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: accentColor }}>Live</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline text-slate-600">Code</a>}
                    </div>
                  </div>
                  {(proj.technologies || isInteractive) && (
                    <div className="font-normal italic text-[0.85em] text-slate-600 break-words mt-0.5">
                      <CanvasInlineEditable
                        value={proj.technologies || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.technologies`, val)}
                        isInteractive={isInteractive}
                        placeholder="Technologies"
                      />
                    </div>
                  )}
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.92em]">
                      {proj.bullets.map((bullet, bIdx) => (
                        <li key={`proj-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={bullet}
                            onChange={(val) => onDirectEdit?.(`projects.${idx}.bullets.${bIdx}`, val)}
                            isInteractive={isInteractive}
                            multiline
                            placeholder="Bullet..."
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "skills": {
        const skillLines = getRenderableSkillLines(data);
        if (!skillLines.length && !isInteractive) return null;
        return (
          <section
            key="skills"
            id="canvas-section-skills"
            style={sectionStyle}
            className={getSectionWrapperClass("skills")}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("skills");
              }
            }}
          >
            {isInteractive && selectedSection === "skills" && (
              <CanvasSectionToolbar sectionId="skills" sectionTitle="Skills" onAction={onSectionAction} />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Skills
            </h2>
            <div className="space-y-0.5 text-[0.92em]">
              {skillLines.map((line, idx) => (
                <div key={`sk-${idx}`} className="flex flex-wrap items-baseline gap-x-1.5 break-words">
                  {line.label && <span className="font-bold text-slate-900 min-w-[100px] shrink-0">{line.label}:</span>}
                  <span className="flex-1 text-slate-800 break-words">
                    <CanvasInlineEditable
                      value={line.value}
                      onChange={(val) => onDirectEdit?.(`skillLines.${idx}`, val)}
                      isInteractive={isInteractive}
                      placeholder="Skills..."
                    />
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "education":
        if (!data.education?.length && !isInteractive) return null;
        return (
          <section
            key="education"
            id="canvas-section-education"
            style={sectionStyle}
            className={getSectionWrapperClass("education")}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("education");
              }
            }}
          >
            {isInteractive && selectedSection === "education" && (
              <CanvasSectionToolbar sectionId="education" sectionTitle="Education" onAction={onSectionAction} canAddItem />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-1">
              {(data.education || []).map((edu, idx) => (
                <div key={`edu-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900 text-[0.95em]">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={edu.school || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.school`, val)}
                        isInteractive={isInteractive}
                        placeholder="University"
                      />
                    </span>
                    <span className="font-normal text-slate-500 text-[0.88em] shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.date || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Dates"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-x-3 text-slate-700 text-[0.9em]">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={[edu.degree, edu.grade].filter(Boolean).join(" - ") || edu.degree || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.degree`, val)}
                        isInteractive={isInteractive}
                        placeholder="Degree - Grade"
                      />
                    </span>
                    <span className="text-slate-500 text-[0.85em] shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.location || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.location`, val)}
                        isInteractive={isInteractive}
                        placeholder="Location"
                      />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "achievements":
        if (!data.achievements?.length && !isInteractive) return null;
        return (
          <section
            key="achievements"
            id="canvas-section-achievements"
            style={sectionStyle}
            className={getSectionWrapperClass("achievements")}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("achievements");
              }
            }}
          >
            {isInteractive && selectedSection === "achievements" && (
              <CanvasSectionToolbar sectionId="achievements" sectionTitle="Achievements" onAction={onSectionAction} canAddItem />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Achievements & Awards
            </h2>
            <div className="space-y-1">
              {(data.achievements || []).map((ach, idx) => (
                <div key={`ach-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900 text-[0.95em]">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={ach.title || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.title`, val)}
                        isInteractive={isInteractive}
                        placeholder="Achievement"
                      />
                    </span>
                    <span className="font-normal text-slate-500 text-[0.88em] shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={ach.date || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
                  {ach.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.9em]">
                      {ach.bullets.map((b, bIdx) => (
                        <li key={`ach-b-${idx}-${bIdx}`} className="pl-0.5 break-words">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`bg-white text-slate-900 p-6 shadow-sm transition-all duration-150 select-text break-words [overflow-wrap:anywhere] max-w-full relative ${className}`}
      style={fontStyle}
    >
      {/* Header */}
      <header
        id="canvas-section-personal"
        className={`text-center border-b pb-2 mb-2 ${getSectionWrapperClass("header")}`}
        style={{ borderColor: accentColor }}
        onClick={(e) => {
          if (isInteractive) {
            e.stopPropagation();
            onSelectSection?.("header");
          }
        }}
      >
        {isInteractive && selectedSection === "header" && (
          <CanvasSectionToolbar sectionId="header" sectionTitle="Header" onAction={onSectionAction} canMoveUp={false} canMoveDown={false} />
        )}
        <h1 className="font-bold tracking-tight text-xl text-slate-900 uppercase break-words" style={{ color: accentColor }}>
          <CanvasInlineEditable
            value={data.name || ""}
            onChange={(val) => onDirectEdit?.("name", val)}
            isInteractive={isInteractive}
            placeholder="Candidate Name"
          />
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-2 text-[0.88em] text-slate-600 mt-0.5">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>•</span>}
                {item}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* Dynamic Sections */}
      <main>
        {sectionOrder.map((key) => renderSection(key))}
      </main>
    </div>
  );
};

export default CompactTemplate;
