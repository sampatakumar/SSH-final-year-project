import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";
import { CanvasInlineEditable } from "../builder/CanvasInlineEditable";
import { CanvasSectionToolbar } from "../builder/CanvasSectionToolbar";

export const TwoColumnTemplate: React.FC<ResumeTemplateProps> = ({
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
  const { typography, hiddenSections, customSections = [], accentColor } = config;

  const fontStyle = {
    fontFamily: typography.fontFamily === "Inter" ? "'Inter', sans-serif" : typography.fontFamily,
    fontSize: `${typography.bodySize}pt`,
    lineHeight: typography.lineHeight,
  };

  const headingStyle = {
    fontSize: `${typography.headingSize}pt`,
    color: accentColor,
    borderBottomColor: `${accentColor}30`,
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
      <div key="p" className="text-xs">
        📞 <CanvasInlineEditable value={safeData.phone} onChange={(v) => onDirectEdit?.("phone", v)} isInteractive={isInteractive} placeholder="Phone" />
      </div>
    ) : null,
    safeData.email ? (
      <div key="e" className="text-xs">
        ✉️ <CanvasInlineEditable value={safeData.email} onChange={(v) => onDirectEdit?.("email", v)} isInteractive={isInteractive} placeholder="Email" className="hover:underline" />
      </div>
    ) : null,
    safeData.linkedin ? (
      <div key="l" className="text-xs">
        🔗 {isInteractive ? (
          <CanvasInlineEditable value={safeData.linkedin} onChange={(v) => onDirectEdit?.("linkedin", v)} isInteractive={isInteractive} placeholder="LinkedIn" />
        ) : (
          <a href={safeData.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a>
        )}
      </div>
    ) : null,
    safeData.github ? (
      <div key="g" className="text-xs">
        💻 {isInteractive ? (
          <CanvasInlineEditable value={safeData.github} onChange={(v) => onDirectEdit?.("github", v)} isInteractive={isInteractive} placeholder="GitHub" />
        ) : (
          <a href={safeData.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
        )}
      </div>
    ) : null,
    safeData.website ? (
      <div key="w" className="text-xs">
        🌐 {isInteractive ? (
          <CanvasInlineEditable value={safeData.website} onChange={(v) => onDirectEdit?.("website", v)} isInteractive={isInteractive} placeholder="Portfolio" />
        ) : (
          <a href={safeData.website} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a>
        )}
      </div>
    ) : null,
  ].filter(Boolean);

  const skillLines = getRenderableSkillLines(safeData as any);

  return (
    <div
      className={`bg-white text-slate-900 shadow-sm transition-all duration-150 select-text break-words [overflow-wrap:anywhere] max-w-full min-h-[1050px] flex ${className}`}
      style={fontStyle}
    >
      {/* Left Column (Sidebar ~35%) */}
      <aside className="w-[35%] bg-slate-900 text-slate-100 p-6 space-y-6 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div
            id="canvas-section-personal"
            className={getSectionWrapperClass("header")}
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
            <h1 className="font-extrabold text-2xl tracking-tight text-white uppercase break-words">
              <CanvasInlineEditable
                value={data.name || ""}
                onChange={(val) => onDirectEdit?.("name", val)}
                isInteractive={isInteractive}
                placeholder="Name"
              />
            </h1>
          </div>

          {/* Contact Details */}
          {contactItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contact</h2>
              <div className="space-y-1.5 text-slate-300 break-words">{contactItems}</div>
            </div>
          )}

          {/* Skills */}
          {!isHidden("skills") && (skillLines.length > 0 || isInteractive) && (
            <div
              id="canvas-section-skills"
              className={`space-y-2 pt-2 border-t border-slate-700 ${getSectionWrapperClass("skills")}`}
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Technical Skills</h2>
              <div className="space-y-2 text-xs">
                {skillLines.map((line, idx) => (
                  <div key={`sk-${idx}`} className="space-y-0.5">
                    {line.label && <div className="font-semibold text-slate-200">{line.label}</div>}
                    <div className="text-slate-300 break-words">
                      <CanvasInlineEditable
                        value={line.value}
                        onChange={(val) => onDirectEdit?.(`skillLines.${idx}`, val)}
                        isInteractive={isInteractive}
                        placeholder="Skills..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education in Sidebar if configured */}
          {!isHidden("education") && (data.education?.length || isInteractive) && (
            <div
              id="canvas-section-education"
              className={`space-y-2 pt-2 border-t border-slate-700 ${getSectionWrapperClass("education")}`}
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
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Education</h2>
              <div className="space-y-2 text-xs text-slate-300">
                {(data.education || []).map((edu, idx) => (
                  <div key={`edu-${idx}`} className="break-words">
                    <div className="font-semibold text-white">
                      <CanvasInlineEditable
                        value={edu.school || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.school`, val)}
                        isInteractive={isInteractive}
                        placeholder="University"
                      />
                    </div>
                    <div className="text-slate-300">
                      <CanvasInlineEditable
                        value={[edu.degree, edu.grade].filter(Boolean).join(" - ") || edu.degree || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.degree`, val)}
                        isInteractive={isInteractive}
                        placeholder="Degree"
                      />
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      <CanvasInlineEditable
                        value={edu.date || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Right Column (Main ~65%) */}
      <main className="w-[65%] p-7 space-y-5 flex-1">
        {/* Summary */}
        {!isHidden("summary") && (data.professionalSummary?.trim() || isInteractive) && (
          <section
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
            <h2 className="font-bold uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
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
        )}

        {/* Experience */}
        {!isHidden("experience") && (data.experience?.length || isInteractive) && (
          <section
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
            <h2 className="font-bold uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-3">
              {(data.experience || []).map((exp, idx) => (
                <div key={`exp-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold text-slate-900">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.role || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.role`, val)}
                        isInteractive={isInteractive}
                        placeholder="Role"
                      />
                    </span>
                    <span className="text-xs text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.date || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Dates"
                      />
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium text-xs mb-1 flex justify-between items-baseline gap-x-3">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.company || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.company`, val)}
                        isInteractive={isInteractive}
                        placeholder="Company"
                      />
                    </span>
                    {(exp.location || isInteractive) && (
                      <span className="text-slate-500 font-normal shrink-0 text-right whitespace-nowrap ml-2">
                        <CanvasInlineEditable
                          value={exp.location || ""}
                          onChange={(val) => onDirectEdit?.(`experience.${idx}.location`, val)}
                          isInteractive={isInteractive}
                          placeholder="Location"
                        />
                      </span>
                    )}
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-xs">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={`exp-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={b}
                            onChange={(val) => onDirectEdit?.(`experience.${idx}.bullets.${bIdx}`, val)}
                            isInteractive={isInteractive}
                            multiline
                            placeholder="Achievement bullet..."
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {!isHidden("projects") && (data.projects?.length || isInteractive) && (
          <section
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
            <h2 className="font-bold uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
              Projects
            </h2>
            <div className="space-y-2.5">
              {(data.projects || []).map((proj, idx) => (
                <div key={`proj-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-2 font-bold text-slate-900">
                    <span className="min-w-0 flex-1">
                      <CanvasInlineEditable
                        value={proj.name || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.name`, val)}
                        isInteractive={isInteractive}
                        placeholder="Project Name"
                      />
                    </span>
                    <div className="flex gap-2 text-xs font-normal shrink-0 text-right whitespace-nowrap ml-2">
                      {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: accentColor }}>Live</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline text-slate-500">Code</a>}
                    </div>
                  </div>
                  {(proj.technologies || isInteractive) && (
                    <div className="font-normal italic text-xs text-slate-600 mt-0.5 break-words">
                      <CanvasInlineEditable
                        value={proj.technologies || ""}
                        onChange={(val) => onDirectEdit?.(`projects.${idx}.technologies`, val)}
                        isInteractive={isInteractive}
                        placeholder="Technologies"
                      />
                    </div>
                  )}
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 mt-0.5 text-slate-800 text-xs">
                      {proj.bullets.map((b, bIdx) => (
                        <li key={`proj-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={b}
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
        )}

        {/* Achievements */}
        {!isHidden("achievements") && (data.achievements?.length || isInteractive) && (
          <section
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
              Achievements & Certifications
            </h2>
            <div className="space-y-1.5 text-xs text-slate-800">
              {(data.achievements || []).map((ach, idx) => (
                <div key={`ach-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-semibold text-slate-900">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={ach.title || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.title`, val)}
                        isInteractive={isInteractive}
                        placeholder="Title"
                      />
                    </span>
                    <span className="font-normal text-slate-500 shrink-0 text-right whitespace-nowrap ml-2">
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
        )}
      </main>
    </div>
  );
};

export default TwoColumnTemplate;
