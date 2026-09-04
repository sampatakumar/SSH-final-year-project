import React, { useState } from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";
import { CanvasInlineEditable } from "../builder/CanvasInlineEditable";
import { CanvasSectionToolbar } from "../builder/CanvasSectionToolbar";
import { GripVertical } from "lucide-react";

export const AtsClassicTemplate: React.FC<ResumeTemplateProps> = ({
  data,
  config,
  className = "",
  isInteractive = false,
  selectedSection,
  selectedItemId,
  onSelectSection,
  onDirectEdit,
  onSectionAction,
  onReorderSections,
  onReorderItems,
}) => {
  const safeData = data || ({} as Partial<typeof data>);
  const { typography, sectionOrder, hiddenSections, customSections = [] } = config;

  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [dragOverProjectIdx, setDragOverProjectIdx] = useState<number | null>(null);

  const fontStyle = {
    fontFamily: typography.fontFamily === "Times New Roman" ? "Times New Roman, Times, serif" : typography.fontFamily,
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
        className="text-black hover:underline"
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
          className="text-black hover:underline"
        />
      ) : (
        <a href={safeData.linkedin} target="_blank" rel="noreferrer" className="text-black hover:underline">
          LinkedIn
        </a>
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
          className="text-black hover:underline"
        />
      ) : (
        <a href={safeData.github} target="_blank" rel="noreferrer" className="text-black hover:underline">
          GitHub
        </a>
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
          className="text-black hover:underline"
        />
      ) : (
        <a href={safeData.website} target="_blank" rel="noreferrer" className="text-black hover:underline">
          Portfolio
        </a>
      )
    ) : null,
  ].filter(Boolean);

  const renderSection = (key: string) => {
    if (isHidden(key)) return null;

    const dragProps = isInteractive
      ? {
          draggable: true,
          onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData("application/json", JSON.stringify({ type: "section", sectionId: key }));
            e.dataTransfer.effectAllowed = "move";
          },
          onDragOver: (e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (dragOverSection !== key) setDragOverSection(key);
          },
          onDragLeave: () => {
            if (dragOverSection === key) setDragOverSection(null);
          },
          onDrop: (e: React.DragEvent) => {
            e.preventDefault();
            setDragOverSection(null);
            try {
              const raw = e.dataTransfer.getData("application/json");
              if (raw) {
                const payload = JSON.parse(raw);
                if (payload.type === "section" && payload.sectionId !== key) {
                  onReorderSections?.(payload.sectionId, key);
                }
              }
            } catch {}
          },
        }
      : {};

    const dropGuide = dragOverSection === key ? (
      <div className="h-0.5 bg-primary rounded-full mb-1 animate-pulse transition-all" />
    ) : null;

    switch (key) {
      case "summary":
        if (!data.professionalSummary?.trim() && !isInteractive) return null;
        return (
          <section
            key="summary"
            id="canvas-section-summary"
            style={sectionStyle}
            className={getSectionWrapperClass("summary")}
            {...dragProps}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("summary");
              }
            }}
          >
            {dropGuide}
            {isInteractive && selectedSection === "summary" && (
              <CanvasSectionToolbar
                sectionId="summary"
                sectionTitle="Summary"
                onAction={onSectionAction}
              />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
              <span>Professional Summary</span>
              {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
            </h2>
            <div className="text-justify break-words">
              <CanvasInlineEditable
                value={data.professionalSummary || ""}
                onChange={(val) => onDirectEdit?.("professionalSummary", val)}
                isInteractive={isInteractive}
                multiline
                placeholder="Write your professional summary here..."
                tag="p"
              />
            </div>
          </section>
        );

      case "education":
        if (!data.education?.length && !isInteractive) return null;
        return (
          <section
            key="education"
            id="canvas-section-education"
            style={sectionStyle}
            className={getSectionWrapperClass("education")}
            {...dragProps}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("education");
              }
            }}
          >
            {dropGuide}
            {isInteractive && selectedSection === "education" && (
              <CanvasSectionToolbar
                sectionId="education"
                sectionTitle="Education"
                onAction={onSectionAction}
                canAddItem
              />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
              <span>Education</span>
              {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
            </h2>
            <div className="space-y-1.5">
              {(data.education || []).map((edu, idx) => (
                <div key={`edu-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={edu.school || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.school`, val)}
                        isInteractive={isInteractive}
                        placeholder="University / College"
                      />
                    </span>
                    <span className="shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.location || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.location`, val)}
                        isInteractive={isInteractive}
                        placeholder="Location"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-x-3 italic">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={[edu.degree, edu.grade].filter(Boolean).join(" - ") || edu.degree || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.degree`, val)}
                        isInteractive={isInteractive}
                        placeholder="Degree - Grade"
                      />
                    </span>
                    <span className="shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={edu.date || ""}
                        onChange={(val) => onDirectEdit?.(`education.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="2021 – 2025"
                      />
                    </span>
                  </div>
                </div>
              ))}
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
            {...dragProps}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("experience");
              }
            }}
          >
            {dropGuide}
            {isInteractive && selectedSection === "experience" && (
              <CanvasSectionToolbar
                sectionId="experience"
                sectionTitle="Experience"
                onAction={onSectionAction}
                canAddItem
              />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
              <span>Experience</span>
              {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
            </h2>
            <div className="space-y-2">
              {(data.experience || []).map((exp, idx) => (
                <div key={`exp-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.role || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.role`, val)}
                        isInteractive={isInteractive}
                        placeholder="Job Title / Role"
                      />
                    </span>
                    <span className="shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.date || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Dates"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline gap-x-3 italic mb-0.5">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={exp.company || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.company`, val)}
                        isInteractive={isInteractive}
                        placeholder="Company Name"
                      />
                    </span>
                    <span className="shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={exp.location || ""}
                        onChange={(val) => onDirectEdit?.(`experience.${idx}.location`, val)}
                        isInteractive={isInteractive}
                        placeholder="City, State"
                      />
                    </span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-5 space-y-0.5">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={`exp-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                          <CanvasInlineEditable
                            value={bullet}
                            onChange={(val) => onDirectEdit?.(`experience.${idx}.bullets.${bIdx}`, val)}
                            isInteractive={isInteractive}
                            multiline
                            placeholder="Describe your achievement..."
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
            {...dragProps}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("projects");
              }
            }}
          >
            {dropGuide}
            {isInteractive && selectedSection === "projects" && (
              <CanvasSectionToolbar
                sectionId="projects"
                sectionTitle="Projects"
                onAction={onSectionAction}
                canAddItem
              />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
              <span>Projects</span>
              {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
            </h2>
            <div className="space-y-2">
              {(data.projects || []).map((proj, idx) => {
                const isProjectOver = dragOverProjectIdx === idx;
                return (
                  <div
                    key={`proj-${idx}`}
                    className={`break-words rounded transition-all ${
                      isInteractive ? "hover:bg-slate-50/70 p-1 -m-1" : ""
                    }`}
                    draggable={isInteractive}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      e.dataTransfer.setData("application/json", JSON.stringify({ type: "projectItem", index: idx }));
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onDragOver={(e) => {
                      if (isInteractive) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverProjectIdx !== idx) setDragOverProjectIdx(idx);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverProjectIdx === idx) setDragOverProjectIdx(null);
                    }}
                    onDrop={(e) => {
                      if (isInteractive) {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverProjectIdx(null);
                        try {
                          const raw = e.dataTransfer.getData("application/json");
                          if (raw) {
                            const payload = JSON.parse(raw);
                            if (payload.type === "projectItem" && payload.index !== idx) {
                              onReorderItems?.("projects", payload.index, idx);
                            }
                          }
                        } catch {}
                      }
                    }}
                  >
                    {isProjectOver && <div className="h-0.5 bg-primary rounded-full mb-1 animate-pulse" />}
                    <div className="flex justify-between items-baseline gap-x-3 font-bold">
                      <span className="min-w-0 flex-1 flex items-center gap-1">
                        {isInteractive && <GripVertical className="h-3 w-3 text-slate-400 cursor-grab opacity-40 hover:opacity-100 shrink-0" />}
                        <CanvasInlineEditable
                          value={proj.name || ""}
                          onChange={(val) => onDirectEdit?.(`projects.${idx}.name`, val)}
                          isInteractive={isInteractive}
                          placeholder="Project Name"
                        />
                      </span>
                      <span className="flex gap-2 font-normal text-[0.9em] shrink-0 text-right whitespace-nowrap ml-2">
                        {proj.demoUrl && (
                          <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline">
                            Live
                          </a>
                        )}
                        {proj.githubUrl && (
                          <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline">
                            Code
                          </a>
                        )}
                      </span>
                    </div>
                    {(proj.technologies || isInteractive) && (
                      <div className="font-normal italic text-[0.9em] break-words text-slate-700 mt-0.5">
                        <CanvasInlineEditable
                          value={proj.technologies || ""}
                          onChange={(val) => onDirectEdit?.(`projects.${idx}.technologies`, val)}
                          isInteractive={isInteractive}
                          placeholder="React.js, Node.js, Express.js, MongoDB, etc."
                        />
                      </div>
                    )}
                    {proj.bullets?.length > 0 && (
                      <ul className="list-disc ml-5 space-y-0.5 mt-0.5">
                        {proj.bullets.map((bullet, bIdx) => (
                          <li key={`proj-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                            <CanvasInlineEditable
                              value={bullet}
                              onChange={(val) => onDirectEdit?.(`projects.${idx}.bullets.${bIdx}`, val)}
                              isInteractive={isInteractive}
                              multiline
                              placeholder="Project achievement bullet..."
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
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
            {...dragProps}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("skills");
              }
            }}
          >
            {dropGuide}
            {isInteractive && selectedSection === "skills" && (
              <CanvasSectionToolbar
                sectionId="skills"
                sectionTitle="Technical Skills"
                onAction={onSectionAction}
              />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
              <span>Technical Skills</span>
              {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
            </h2>
            <div className="space-y-1">
              {skillLines.map((line, idx) => (
                <div key={`sk-${idx}`} className="flex flex-wrap items-baseline gap-x-1.5 break-words">
                  {line.label && <span className="font-bold min-w-[120px] shrink-0">{line.label}:</span>}
                  <span className="flex-1 break-words">
                    <CanvasInlineEditable
                      value={line.value}
                      onChange={(val) => onDirectEdit?.(`skillLines.${idx}`, val)}
                      isInteractive={isInteractive}
                      placeholder="Skill list..."
                    />
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "achievements":
        if (!data.achievements?.length && !isInteractive) return null;
        return (
          <section
            key="achievements"
            id="canvas-section-achievements"
            style={sectionStyle}
            className={getSectionWrapperClass("achievements")}
            {...dragProps}
            onClick={(e) => {
              if (isInteractive) {
                e.stopPropagation();
                onSelectSection?.("achievements");
              }
            }}
          >
            {dropGuide}
            {isInteractive && selectedSection === "achievements" && (
              <CanvasSectionToolbar
                sectionId="achievements"
                sectionTitle="Achievements"
                onAction={onSectionAction}
                canAddItem
              />
            )}
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
              <span>Achievements & Awards</span>
              {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
            </h2>
            <div className="space-y-1.5">
              {(data.achievements || []).map((ach, idx) => (
                <div key={`ach-${idx}`} className="break-words">
                  <div className="flex justify-between items-baseline gap-x-3 font-bold">
                    <span className="flex-1 min-w-0">
                      <CanvasInlineEditable
                        value={ach.title || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.title`, val)}
                        isInteractive={isInteractive}
                        placeholder="Achievement Title"
                      />
                    </span>
                    <span className="shrink-0 text-right whitespace-nowrap ml-2">
                      <CanvasInlineEditable
                        value={ach.date || ""}
                        onChange={(val) => onDirectEdit?.(`achievements.${idx}.date`, val)}
                        isInteractive={isInteractive}
                        placeholder="Date"
                      />
                    </span>
                  </div>
                  {ach.bullets?.length > 0 && (
                    <ul className="list-disc ml-5 space-y-0.5">
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
              const isSecOver = dragOverSection === `custom-${sec.id}`;
              return (
                <section
                  key={`custom-${sec.id}`}
                  id={`canvas-section-custom-${sec.id}`}
                  style={sectionStyle}
                  className={getSectionWrapperClass(`custom-${sec.id}`)}
                  {...dragProps}
                  onClick={(e) => {
                    if (isInteractive) {
                      e.stopPropagation();
                      onSelectSection?.(`custom-${sec.id}`);
                    }
                  }}
                >
                  {isSecOver && <div className="h-0.5 bg-primary rounded-full mb-1 animate-pulse" />}
                  {isInteractive && selectedSection === `custom-${sec.id}` && (
                    <CanvasSectionToolbar
                      sectionId={`custom-${sec.id}`}
                      sectionTitle={sec.title}
                      onAction={onSectionAction}
                      canAddItem
                    />
                  )}
                  <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5 flex items-center justify-between" style={headingStyle}>
                    <span>{sec.title}</span>
                    {isInteractive && <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab" />}
                  </h2>
                  <div className="space-y-1.5">
                    {(sec.entries || []).map((entry, idx) => (
                      <div key={`entry-${idx}`} className="break-words">
                        <div className="flex justify-between items-baseline gap-x-3 font-bold">
                          <span className="flex-1 min-w-0">
                            <CanvasInlineEditable
                              value={entry.title || ""}
                              onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.title`, val)}
                              isInteractive={isInteractive}
                              placeholder="Entry Title"
                            />
                          </span>
                          <span className="shrink-0 text-right whitespace-nowrap ml-2">
                            <CanvasInlineEditable
                              value={entry.date || ""}
                              onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.date`, val)}
                              isInteractive={isInteractive}
                              placeholder="Date"
                            />
                          </span>
                        </div>
                        {entry.subtitle && (
                          <p className="italic text-[0.95em] break-words">
                            <CanvasInlineEditable
                              value={entry.subtitle}
                              onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.subtitle`, val)}
                              isInteractive={isInteractive}
                              placeholder="Subtitle"
                            />
                          </p>
                        )}
                        {entry.bullets?.length > 0 && (
                          <ul className="list-disc ml-5 space-y-0.5">
                            {entry.bullets.map((b, bIdx) => (
                              <li key={`custom-b-${idx}-${bIdx}`} className="pl-0.5 break-words">
                                <CanvasInlineEditable
                                  value={b}
                                  onChange={(val) => onDirectEdit?.(`custom.${sec.id}.${idx}.bullets.${bIdx}`, val)}
                                  isInteractive={isInteractive}
                                  multiline
                                  placeholder="Bullet point..."
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
      className={`bg-white text-black p-8 shadow-sm transition-all duration-150 select-text break-words [overflow-wrap:anywhere] max-w-full relative ${className}`}
      style={fontStyle}
    >
      {/* Header */}
      <header
        id="canvas-section-personal"
        className={`text-center border-b border-black pb-3 mb-3 ${getSectionWrapperClass("header")}`}
        onClick={(e) => {
          if (isInteractive) {
            e.stopPropagation();
            onSelectSection?.("header");
          }
        }}
      >
        {isInteractive && selectedSection === "header" && (
          <CanvasSectionToolbar
            sectionId="header"
            sectionTitle="Header"
            onAction={onSectionAction}
            canMoveUp={false}
            canMoveDown={false}
          />
        )}
        <h1 className="font-bold tracking-tight mb-1 text-[20pt] uppercase break-words">
          <CanvasInlineEditable
            value={data.name || ""}
            onChange={(val) => onDirectEdit?.("name", val)}
            isInteractive={isInteractive}
            placeholder="Candidate Name"
            tag="span"
          />
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[0.9em] break-words">
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

export default AtsClassicTemplate;
