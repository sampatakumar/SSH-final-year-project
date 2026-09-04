import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";
import { CanvasInlineEditable } from "../builder/CanvasInlineEditable";
import { CanvasSectionToolbar } from "../builder/CanvasSectionToolbar";

export const MinimalTemplate: React.FC<ResumeTemplateProps> = ({
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
    fontFamily: typography.fontFamily === "Helvetica" ? "'Helvetica Neue', Helvetica, Arial, sans-serif" : typography.fontFamily,
    fontSize: `${typography.bodySize}pt`,
    lineHeight: typography.lineHeight,
  };

  const headingStyle = {
    fontSize: `${typography.headingSize}pt`,
  };

  const sectionStyle = {
    marginBottom: `${typography.sectionGap}px`,
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
          placeholder="Website"
        />
      ) : (
        <a href={safeData.website} target="_blank" rel="noreferrer" className="hover:underline">Website</a>
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
            <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400 mb-1.5" style={headingStyle}>
              Summary
            </h2>
            <div className="text-slate-800 text-justify break-words">
              <CanvasInlineEditable
                value={data.professionalSummary || ""}
                onChange={(val) => onDirectEdit?.("professionalSummary", val)}
                isInteractive={isInteractive}
                multiline
                placeholder="Summary..."
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
            <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400 mb-1.5" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-3">
              {(data.experience || []).map((exp, idx) => (
                <div key={`exp-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3">
                    <span className="font-medium text-slate-900 flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.role || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.role`, val)}
                        isInteractive={isInteractive}
                        placeholder="Role"
                      />{" "}
                      <span className="text-slate-500 font-normal">at </span>
                      <CanvasInlineEditable
                        value={exp.company || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.company`, val)}
                        isInteractive={isInteractive}
                        placeholder="Company"
                      />
                      {(exp.location || isInteractive) && (
                        <span className="text-slate-500 font-normal text-xs ml-1.5">
                          (
                          <CanvasInlineEditable
                            value={exp.location || ""}
                            onChange={(val) => onDirectEdit?.(`experience.${idx}.location`, val)}
                            isInteractive={isInteractive}
                            placeholder="Location"
                          />
                          )
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.date || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 mt-1 text-slate-700 text-[0.95em]">
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
            <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400 mb-1.5" style={headingStyle}>
              Projects
            </h2>
            <div className="space-y-2.5">
              {(data.projects || []).map((proj, idx) => (
                <div key={`proj-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-medium text-slate-900 flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={proj.name || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.name`, val)}
                        isInteractive={isInteractive}
                        placeholder="Project Name"
                      />
                    </span>
                    <div className="flex gap-2 text-xs text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-900">Live</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline hover:text-slate-900">Code</a>}
                    </div>
                  </div>
                  {(proj.technologies || isInteractive) && (
                    <div className="text-slate-500 font-normal text-xs mt-0.5 break-words">
                      <CanvasInlineEditable
                        value={proj.technologies || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.technologies`, val)}
                        isInteractive={isInteractive}
                        placeholder="Technologies"
                      />
                    </div>
                  )}
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 mt-0.5 text-slate-700 text-[0.95em]">
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
            <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400 mb-1.5" style={headingStyle}>
              Skills
            </h2>
            <div className="space-y-1">
              {skillLines.map((line, idx) => (
                <div key={`sk-${idx}`} className="flex flex-wrap items-baseline gap-2 text-slate-800 break-words">
                  {line.label && <span className="font-medium text-slate-900 text-xs uppercase min-w-[110px] shrink-0">{line.label}</span>}
                  <span className="flex-1 break-words">
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
            <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400 mb-1.5" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-2">
              {(data.education || []).map((edu, idx) => (
                <div key={`edu-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3">
                    <span className="font-medium text-slate-900 flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={edu.school || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.school`, val)}
                        isInteractive={isInteractive}
                        placeholder="School"
                      />
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.date || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Dates"
                      />
                    </span>
                  </div>
                  <div className="text-slate-600 text-[0.95em] flex justify-between items-baseline gap-x-3">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={[edu.degree, edu.grade].filter(Boolean).join(" - ") || edu.degree || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.degree`, val)}
                        isInteractive={isInteractive}
                        placeholder="Degree - Grade"
                      />
                    </span>
                    {(edu.location || isInteractive) && (
                      <span className="text-xs text-slate-400 shrink-0 text-right whitespace-nowrap ml-2">
                        <CanvasInlineEditable
                          value={edu.location || ""}
                          onChange={(val) => onDirectEdit?.(`education.${idx}.location`, val)}
                          isInteractive={isInteractive}
                          placeholder="Location"
                        />
                      </span>
                    )}
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
            <h2 className="font-semibold text-xs uppercase tracking-widest text-slate-400 mb-1.5" style={headingStyle}>
              Achievements & Certifications
            </h2>
            <div className="space-y-1.5 text-xs text-slate-800">
              {(data.achievements || []).map((ach, idx) => (
                <div key={`ach-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-medium text-slate-900">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={ach.title || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.title`, val)}
                        isInteractive={isInteractive}
                        placeholder="Achievement Title"
                      />
                    </span>
                    <span className="text-slate-400 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={ach.date || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
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
      className={`bg-white text-slate-900 p-8 shadow-sm transition-all duration-150 select-text break-words [overflow-wrap:anywhere] max-w-full relative ${className}`}
      style={fontStyle}
    >
      {/* Header */}
      <header
        id="canvas-section-personal"
        className={`mb-6 ${getSectionWrapperClass("header")}`}
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
        <h1 className="font-light tracking-tight text-3xl text-slate-900 uppercase mb-2 break-words">
          <CanvasInlineEditable
            value={data.name || ""}
            onChange={(val) => onDirectEdit?.("name", val)}
            isInteractive={isInteractive}
            placeholder="Candidate Name"
          />
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>{item}</React.Fragment>
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

export default MinimalTemplate;
