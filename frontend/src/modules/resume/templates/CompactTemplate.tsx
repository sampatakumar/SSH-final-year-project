import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export const CompactTemplate: React.FC<ResumeTemplateProps> = ({ data, config, className = "" }) => {
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

  const contactItems = [
    data.phone ? <span>{data.phone}</span> : null,
    data.email ? <a href={`mailto:${data.email}`} className="hover:underline">{data.email}</a> : null,
    data.linkedin ? <a href={data.linkedin} target="_blank" rel="noreferrer" className="hover:underline">LinkedIn</a> : null,
    data.github ? <a href={data.github} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a> : null,
    data.website ? <a href={data.website} target="_blank" rel="noreferrer" className="hover:underline">Portfolio</a> : null,
  ].filter(Boolean);

  const renderSection = (key: string) => {
    if (isHidden(key)) return null;

    switch (key) {
      case "summary":
        if (!data.professionalSummary?.trim()) return null;
        return (
          <section key="summary" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Summary
            </h2>
            <p className="text-slate-800 text-justify text-[0.95em]">{data.professionalSummary}</p>
          </section>
        );

      case "education":
        if (!data.education?.length) return null;
        return (
          <section key="education" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-1">
              {data.education.map((edu, idx) => (
                <div key={`edu-${idx}`} className="flex justify-between items-baseline text-[0.95em]">
                  <div>
                    <span className="font-bold text-slate-900">{edu.school}</span>
                    <span className="text-slate-700 italic ml-1"> — {[edu.degree, edu.grade].filter(Boolean).join(", ")}</span>
                  </div>
                  <span className="text-slate-600 text-[0.9em]">{edu.date}</span>
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
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Skills
            </h2>
            <div className="space-y-0.5 text-[0.95em]">
              {skillLines.map((line, idx) => (
                <div key={`sk-${idx}`} className="flex">
                  {line.label && <span className="font-bold text-slate-900 min-w-[110px]">{line.label}:</span>}
                  <span className="flex-1 text-slate-800">{line.value}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "projects":
        if (!data.projects?.length) return null;
        return (
          <section key="projects" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Projects
            </h2>
            <div className="space-y-1.5">
              {data.projects.map((proj, idx) => (
                <div key={`proj-${idx}`}>
                  <div className="flex justify-between font-bold text-slate-900 text-[0.95em]">
                    <span>
                      {proj.name}
                      {proj.technologies && <span className="font-normal italic text-[0.9em] text-slate-600"> | {proj.technologies}</span>}
                    </span>
                    <div className="flex gap-2 font-normal text-[0.85em]">
                      {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: accentColor }}>Live</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline text-slate-600">Code</a>}
                    </div>
                  </div>
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.92em]">
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

      case "experience":
        if (!data.experience?.length) return null;
        return (
          <section key="experience" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-1.5">
              {data.experience.map((exp, idx) => (
                <div key={`exp-${idx}`}>
                  <div className="flex justify-between font-bold text-slate-900 text-[0.95em]">
                    <span>{exp.role} <span className="font-normal text-slate-700">@ {exp.company}</span></span>
                    <span className="font-normal text-slate-500 text-[0.88em]">{exp.date}</span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.92em]">
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

      case "achievements":
        if (!data.achievements?.length) return null;
        return (
          <section key="achievements" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
              Achievements & Certifications
            </h2>
            <div className="space-y-1">
              {data.achievements.map((ach, idx) => (
                <div key={`ach-${idx}`} className="flex justify-between text-[0.95em]">
                  <span className="font-bold text-slate-900">{ach.title}</span>
                  <span className="text-slate-500 text-[0.88em]">{ach.date}</span>
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
                  <h2 className="font-bold uppercase tracking-wider border-b pb-[1px] mb-1" style={headingStyle}>
                    {sec.title}
                  </h2>
                  <div className="space-y-1">
                    {sec.entries.map((entry, idx) => (
                      <div key={`entry-${idx}`} className="text-[0.95em]">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{entry.title}</span>
                          <span className="text-slate-500 text-[0.88em] font-normal">{entry.date}</span>
                        </div>
                        {entry.bullets?.length > 0 && (
                          <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.92em]">
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
      className={`bg-white text-slate-900 p-6 shadow-sm transition-all duration-150 select-text ${className}`}
      style={fontStyle}
    >
      {/* Tight Header */}
      <header className="text-center border-b pb-2 mb-2" style={{ borderColor: accentColor }}>
        <h1 className="font-extrabold tracking-tight text-[18pt] uppercase" style={{ color: accentColor }}>
          {data.name || "Candidate Name"}
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0 text-[0.85em] text-slate-700 mt-0.5">
            {contactItems.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>•</span>}
                {item}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* Sections */}
      <main>
        {sectionOrder.map((key) => renderSection(key))}
      </main>
    </div>
  );
};

export default CompactTemplate;
