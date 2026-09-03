import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export const MinimalTemplate: React.FC<ResumeTemplateProps> = ({ data, config, className = "" }) => {
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

  const contactItems = [
    data.phone ? <span>{data.phone}</span> : null,
    data.email ? <a href={`mailto:${data.email}`} className="hover:underline">{data.email}</a> : null,
    data.linkedin ? <a href={data.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a> : null,
    data.github ? <a href={data.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a> : null,
    data.website ? <a href={data.website} target="_blank" rel="noreferrer" className="hover:underline">Website</a> : null,
  ].filter(Boolean);

  const renderSection = (key: string) => {
    if (isHidden(key)) return null;

    switch (key) {
      case "summary":
        if (!data.professionalSummary?.trim()) return null;
        return (
          <section key="summary" style={sectionStyle}>
            <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1" style={headingStyle}>
              About
            </h2>
            <p className="text-neutral-800 leading-relaxed">{data.professionalSummary}</p>
          </section>
        );

      case "experience":
        if (!data.experience?.length) return null;
        return (
          <section key="experience" style={sectionStyle}>
            <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1.5" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp, idx) => (
                <div key={`exp-${idx}`}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-neutral-900">{exp.role}</span>
                    <span className="text-neutral-500 text-[0.9em]">{exp.date}</span>
                  </div>
                  <div className="text-neutral-600 text-[0.95em] mb-1">
                    <span>{exp.company}</span>
                    {exp.location && <span>, {exp.location}</span>}
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-neutral-700">
                      {exp.bullets.map((bullet, bIdx) => (
                        <li key={`exp-b-${idx}-${bIdx}`} className="pl-0.5">{bullet}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "projects":
        if (!data.projects?.length) return null;
        return (
          <section key="projects" style={sectionStyle}>
            <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1.5" style={headingStyle}>
              Projects
            </h2>
            <div className="space-y-2.5">
              {data.projects.map((proj, idx) => (
                <div key={`proj-${idx}`}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-neutral-900">
                      {proj.name}
                      {proj.technologies && <span className="font-normal text-neutral-500 text-[0.9em]"> — {proj.technologies}</span>}
                    </span>
                    <span className="flex gap-2 text-[0.85em] text-neutral-500">
                      {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline hover:text-neutral-900">Live</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline hover:text-neutral-900">Source</a>}
                    </span>
                  </div>
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-neutral-700 mt-0.5">
                      {proj.bullets.map((bullet, bIdx) => (
                        <li key={`proj-b-${idx}-${bIdx}`} className="pl-0.5">{bullet}</li>
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
        if (!skillLines.length) return null;
        return (
          <section key="skills" style={sectionStyle}>
            <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1.5" style={headingStyle}>
              Skills
            </h2>
            <div className="space-y-1 text-neutral-800">
              {skillLines.map((line, idx) => (
                <div key={`sk-${idx}`} className="flex">
                  {line.label && <span className="font-medium text-neutral-900 min-w-[120px]">{line.label}:</span>}
                  <span className="flex-1">{line.value ? line.value.replace(/, /g, " · ") : ""}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "education":
        if (!data.education?.length) return null;
        return (
          <section key="education" style={sectionStyle}>
            <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1.5" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-1.5">
              {data.education.map((edu, idx) => (
                <div key={`edu-${idx}`} className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-neutral-900">{edu.school}</span>
                    <span className="text-neutral-600 text-[0.95em]"> — {[edu.degree, edu.grade].filter(Boolean).join(", ")}</span>
                  </div>
                  <span className="text-neutral-500 text-[0.9em]">{edu.date}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case "achievements":
        if (!data.achievements?.length) return null;
        return (
          <section key="achievements" style={sectionStyle}>
            <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1.5" style={headingStyle}>
              Honors
            </h2>
            <div className="space-y-1.5">
              {data.achievements.map((ach, idx) => (
                <div key={`ach-${idx}`}>
                  <div className="flex justify-between">
                    <span className="font-semibold text-neutral-900">{ach.title}</span>
                    <span className="text-neutral-500 text-[0.9em]">{ach.date}</span>
                  </div>
                  {ach.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-neutral-700">
                      {ach.bullets.map((b, bIdx) => (
                        <li key={`ach-b-${idx}-${bIdx}`} className="pl-0.5">{b}</li>
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
              if (isHidden(`custom-${sec.id}`) || !sec.entries?.length) return null;
              return (
                <section key={`custom-${sec.id}`} style={sectionStyle}>
                  <h2 className="font-semibold text-neutral-400 uppercase tracking-widest text-[0.8em] mb-1.5" style={headingStyle}>
                    {sec.title}
                  </h2>
                  <div className="space-y-1.5">
                    {sec.entries.map((entry, idx) => (
                      <div key={`entry-${idx}`}>
                        <div className="flex justify-between">
                          <span className="font-semibold text-neutral-900">{entry.title}</span>
                          <span className="text-neutral-500 text-[0.9em]">{entry.date}</span>
                        </div>
                        {entry.subtitle && <p className="text-neutral-600 text-[0.95em]">{entry.subtitle}</p>}
                        {entry.bullets?.length > 0 && (
                          <ul className="list-disc ml-4 space-y-0.5 text-neutral-700">
                            {entry.bullets.map((b, bIdx) => (
                              <li key={`custom-b-${idx}-${bIdx}`} className="pl-0.5">{b}</li>
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
      className={`bg-white text-neutral-900 p-8 shadow-sm transition-all duration-150 select-text ${className}`}
      style={fontStyle}
    >
      {/* Header */}
      <header className="mb-4">
        <h1 className="font-light tracking-tight text-[24pt] text-neutral-900 mb-1">
          {data.name || "Candidate Name"}
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.85em] text-neutral-500">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                {item}
              </React.Fragment>
            ))}
          </div>
        )}
        <div className="h-[1px] bg-neutral-200 w-full mt-3" />
      </header>

      {/* Main Sections */}
      <main>
        {sectionOrder.map((key) => renderSection(key))}
      </main>
    </div>
  );
};

export default MinimalTemplate;
