import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";
import { Github, Linkedin, Globe, Mail, Phone } from "lucide-react";
import { CanvasInlineEditable } from "../builder/CanvasInlineEditable";
import { CanvasSectionToolbar } from "../builder/CanvasSectionToolbar";

export const ModernDeveloperTemplate: React.FC<ResumeTemplateProps> = ({
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
    fontFamily: typography.fontFamily === "Inter" ? "'Inter', sans-serif" : typography.fontFamily,
    fontSize: `${typography.bodySize}pt`,
    lineHeight: typography.lineHeight,
  };

  const headingStyle = {
    fontSize: `${typography.headingSize}pt`,
    color: accentColor,
    borderColor: `${accentColor}40`,
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
      <div key="phone" className="flex items-center gap-1">
        <Phone className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
        <CanvasInlineEditable
          value={safeData.phone}
          onChange={(val) => onDirectEdit?.("phone", val)}
          isInteractive={isInteractive}
          placeholder="Phone"
        />
      </div>
    ) : null,
    safeData.email ? (
      <div key="email" className="flex items-center gap-1">
        <Mail className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
        <CanvasInlineEditable
          value={safeData.email}
          onChange={(val) => onDirectEdit?.("email", val)}
          isInteractive={isInteractive}
          placeholder="Email"
          className="hover:underline"
        />
      </div>
    ) : null,
    safeData.github ? (
      <div key="github" className="flex items-center gap-1">
        <Github className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
        {isInteractive ? (
          <CanvasInlineEditable
            value={safeData.github}
            onChange={(val) => onDirectEdit?.("github", val)}
            isInteractive={isInteractive}
            placeholder="GitHub"
            className="hover:underline"
          />
        ) : (
          <a href={safeData.github} target="_blank" rel="noreferrer" className="hover:underline">
            GitHub
          </a>
        )}
      </div>
    ) : null,
    safeData.linkedin ? (
      <div key="linkedin" className="flex items-center gap-1">
        <Linkedin className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
        {isInteractive ? (
          <CanvasInlineEditable
            value={safeData.linkedin}
            onChange={(val) => onDirectEdit?.("linkedin", val)}
            isInteractive={isInteractive}
            placeholder="LinkedIn"
            className="hover:underline"
          />
        ) : (
          <a href={safeData.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
            LinkedIn
          </a>
        )}
      </div>
    ) : null,
    safeData.website ? (
      <div key="website" className="flex items-center gap-1">
        <Globe className="h-3 w-3 shrink-0" style={{ color: accentColor }} />
        {isInteractive ? (
          <CanvasInlineEditable
            value={safeData.website}
            onChange={(val) => onDirectEdit?.("website", val)}
            isInteractive={isInteractive}
            placeholder="Portfolio"
            className="hover:underline"
          />
        ) : (
          <a href={safeData.website} target="_blank" rel="noreferrer" className="hover:underline">
            Portfolio
          </a>
        )}
      </div>
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
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2 flex items-center gap-2" style={headingStyle}>
              <span>Summary</span>
            </h2>
            <div className="text-slate-800 text-justify break-words">
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
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
              Work Experience
            </h2>
            <div className="space-y-3">
              {(data.experience || []).map((exp, idx) => (
                <div key={`exp-${idx}`} className="bg-slate-50/50 p-2.5 rounded-md border border-slate-200/50 break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.role || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.role`, val)}
                        isInteractive={isInteractive}
                        placeholder="Role / Title"
                      />
                    </span>
                    <span className="text-[0.85em] font-normal text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.date || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-x-3 text-slate-700 font-medium text-[0.95em] mb-1">
                    <span className="flex-1 min-w-0" style={{ color: accentColor }}>
                      <CanvasInlineEditable
                        value={exp.company || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.company`, val)}
                        isInteractive={isInteractive}
                        placeholder="Company"
                      />
                    </span>
                    <span className="text-[0.85em] text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.location || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.location`, val)}
                        isInteractive={isInteractive}
                        placeholder="Location"
                      />
                    </span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800">
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
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
              Featured Projects
            </h2>
            <div className="space-y-2.5">
              {(data.projects || []).map((proj, idx) => (
                <div key={`proj-${idx}`} className="bg-slate-50/80 p-2.5 rounded border border-slate-200/60 break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900">
                    <span className="min-w-0 flex-1">
                      <CanvasInlineEditable
                        value={proj.name || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.name`, val)}
                        isInteractive={isInteractive}
                        placeholder="Project Name"
                      />
                    </span>
                    <div className="flex gap-2 font-medium text-[0.85em] shrink-0 text-right whitespace-nowrap ml-2">
                      {proj.demoUrl && (
                        <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="hover:underline font-semibold" style={{ color: accentColor }}>
                          Live Demo ↗
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:underline">
                          GitHub ↗
                        </a>
                      )}
                    </div>
                  </div>
                  {(proj.technologies || isInteractive) && (
                    <div className="mt-1 font-normal text-[0.85em] text-slate-600 break-words">
                      <CanvasInlineEditable
                        value={proj.technologies || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.technologies`, val)}
                        isInteractive={isInteractive}
                        placeholder="Technologies: React.js, TypeScript, etc."
                      />
                    </div>
                  )}
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 mt-1 text-slate-800">
                      {proj.bullets.map((bullet, bIdx) => (
                        <li key={`proj-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={bullet}
                            onChange={(val) => onDirectEdit?.(`projects.${idx}.bullets.${bIdx}`, val)}
                            isInteractive={isInteractive}
                            multiline
                            placeholder="Project bullet..."
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
              <CanvasSectionToolbar sectionId="skills" sectionTitle="Technical Skills" onAction={onSectionAction} />
            )}
            <h2 className="font-bold text-sm uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
              Technical Skills
            </h2>
            <div className="space-y-1.5">
              {skillLines.map((line, idx) => {
                const skillsArray = line.value ? line.value.split(", ") : [];
                return (
                  <div key={`sk-${idx}`} className="flex flex-wrap items-center gap-1.5 break-words">
                    {line.label && (
                      <span className="font-bold text-slate-900 min-w-[130px] shrink-0">{line.label}:</span>
                    )}
                    <div className="flex flex-wrap gap-1 flex-1">
                      {skillsArray.map((skill, sIdx) => (
                        <span key={`sk-tag-${idx}-${sIdx}`} className="text-[0.85em] px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
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
            <h2 className="font-bold uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-2">
              {(data.education || []).map((edu, idx) => (
                <div key={`edu-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={edu.school || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.school`, val)}
                        isInteractive={isInteractive}
                        placeholder="University"
                      />
                    </span>
                    <span className="text-[0.85em] font-normal text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.location || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.location`, val)}
                        isInteractive={isInteractive}
                        placeholder="Location"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-x-3 text-slate-700 text-[0.95em]">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={[edu.degree, edu.grade].filter(Boolean).join(" - ") || edu.degree || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.degree`, val)}
                        isInteractive={isInteractive}
                        placeholder="Degree - Grade"
                      />
                    </span>
                    <span className="text-[0.85em] text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.date || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.date`, val)}
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
            <h2 className="font-bold uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
              Achievements & Awards
            </h2>
            <div className="space-y-2">
              {(data.achievements || []).map((ach, idx) => (
                <div key={`ach-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={ach.title || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.title`, val)}
                        isInteractive={isInteractive}
                        placeholder="Achievement Title"
                      />
                    </span>
                    <span className="text-[0.85em] font-normal text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={ach.date || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
                  {ach.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800">
                      {ach.bullets.map((b, bIdx) => (
                        <li key={`ach-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={b}
                            onChange={(val) => onDirectEdit?.(`achievements.${idx}.bullets.${bIdx}`, val)}
                            isInteractive={isInteractive}
                            multiline
                            placeholder="Description..."
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

      case "custom":
        if (!customSections.length) return null;
        return (
          <React.Fragment key="custom">
            {customSections.map((sec) => {
              if (isHidden(`custom-${sec.id}`) || (!sec.entries?.length && !isInteractive)) return null;
              return (
                <section
                  key={`custom-${sec.id}`}
                  id={`canvas-section-custom-${sec.id}`}
                  style={sectionStyle}
                  className={getSectionWrapperClass(`custom-${sec.id}`)}
                  onClick={(e) => {
                    if (isInteractive) {
                      e.stopPropagation();
                      onSelectSection?.(`custom-${sec.id}`);
                    }
                  }}
                >
                  {isInteractive && selectedSection === `custom-${sec.id}` && (
                    <CanvasSectionToolbar sectionId={`custom-${sec.id}`} sectionTitle={sec.title} onAction={onSectionAction} canAddItem />
                  )}
                  <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
                    {sec.title}
                  </h2>
                  <div className="space-y-2">
                    {(sec.entries || []).map((entry, idx) => (
                      <div key={`entry-${idx}`} className="break-words">
                        <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900">
                          <span className="flex-1 min-w-0">
                            <CanvasInlineEditable
                              value={entry.title || ""}
                              onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.title`, val)}
                              isInteractive={isInteractive}
                              placeholder="Title"
                            />
                          </span>
                          <span className="text-[0.85em] font-normal text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                            <CanvasInlineEditable
                              value={entry.date || ""}
                              onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.date`, val)}
                              isInteractive={isInteractive}
                              placeholder="Date"
                            />
                          </span>
                        </div>
                        {entry.subtitle && (
                          <p className="text-slate-600 text-[0.9em] italic">
                            <CanvasInlineEditable
                              value={entry.subtitle}
                              onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.subtitle`, val)}
                              isInteractive={isInteractive}
                              placeholder="Subtitle"
                            />
                          </p>
                        )}
                        {entry.bullets?.length > 0 && (
                          <ul className="list-disc ml-4 space-y-0.5 text-slate-800">
                            {entry.bullets.map((b, bIdx) => (
                              <li key={`custom-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                                <CanvasInlineEditable
                                  value={b}
                                  onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.bullets.${bIdx}`, val)}
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
            })}
          </React.Fragment>
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
        className={`border-b-2 pb-4 mb-4 ${getSectionWrapperClass("header")}`}
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
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold tracking-tight text-2xl text-slate-900 uppercase break-words" style={{ color: accentColor }}>
              <CanvasInlineEditable
                value={data.name || ""}
                onChange={(val) => onDirectEdit?.("name", val)}
                isInteractive={isInteractive}
                placeholder="Candidate Name"
              />
            </h1>
          </div>
          {contactItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              {contactItems.map((item, idx) => (
                <React.Fragment key={idx}>{item}</React.Fragment>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Dynamic Sections */}
      <main>
        {sectionOrder.map((key) => renderSection(key))}
      </main>
    </div>
  );
};

export default ModernDeveloperTemplate;
