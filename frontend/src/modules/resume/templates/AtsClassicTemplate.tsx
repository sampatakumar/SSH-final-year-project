import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export const AtsClassicTemplate: React.FC<ResumeTemplateProps> = ({ data, config, className = "" }) => {
  const { typography, sectionOrder, hiddenSections, customSections = [] } = config;
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

  const contactItems = [
    data.phone ? <span>{data.phone}</span> : null,
    data.email ? <a href={`mailto:${data.email}`} className="text-black hover:underline">{data.email}</a> : null,
    data.linkedin ? <a href={data.linkedin} target="_blank" rel="noreferrer" className="text-black hover:underline">LinkedIn</a> : null,
    data.github ? <a href={data.github} target="_blank" rel="noreferrer" className="text-black hover:underline">GitHub</a> : null,
    data.website ? <a href={data.website} target="_blank" rel="noreferrer" className="text-black hover:underline">Portfolio</a> : null,
  ].filter(Boolean);

  const renderSection = (key: string) => {
    if (isHidden(key)) return null;

    switch (key) {
      case "summary":
        if (!data.professionalSummary?.trim()) return null;
        return (
          <section key="summary" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
              Professional Summary
            </h2>
            <p className="text-justify">{data.professionalSummary}</p>
          </section>
        );

      case "education":
        if (!data.education?.length) return null;
        return (
          <section key="education" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-1.5">
              {data.education.map((edu, idx) => (
                <div key={`edu-${idx}`}>
                  <div className="flex justify-between font-bold">
                    <span>{edu.school}</span>
                    <span>{edu.location}</span>
                  </div>
                  <div className="flex justify-between italic">
                    <span>{[edu.degree, edu.grade].filter(Boolean).join(" - ")}</span>
                    <span>{edu.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "experience":
        if (!data.experience?.length) return null;
        return (
          <section key="experience" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-2">
              {data.experience.map((exp, idx) => (
                <div key={`exp-${idx}`}>
                  <div className="flex justify-between font-bold">
                    <span>{exp.role}</span>
                    <span>{exp.date}</span>
                  </div>
                  <div className="flex justify-between italic mb-0.5">
                    <span>{exp.company}</span>
                    <span>{exp.location}</span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-5 space-y-0.5">
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
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
              Projects
            </h2>
            <div className="space-y-2">
              {data.projects.map((proj, idx) => (
                <div key={`proj-${idx}`}>
                  <div className="flex justify-between font-bold">
                    <span>
                      {proj.name}
                      {proj.technologies && <span className="font-normal italic text-[0.9em]"> | {proj.technologies}</span>}
                    </span>
                    <span className="flex gap-2 font-normal text-[0.9em]">
                      {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline">Live</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline">Code</a>}
                    </span>
                  </div>
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-5 space-y-0.5 mt-0.5">
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
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
              Technical Skills
            </h2>
            <div className="space-y-1">
              {skillLines.map((line, idx) => (
                <div key={`sk-${idx}`} className="flex">
                  {line.label && <span className="font-bold min-w-[120px]">{line.label}:</span>}
                  <span className="flex-1">{line.value}</span>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "achievements":
        if (!data.achievements?.length) return null;
        return (
          <section key="achievements" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
              Achievements & Awards
            </h2>
            <div className="space-y-1.5">
              {data.achievements.map((ach, idx) => (
                <div key={`ach-${idx}`}>
                  <div className="flex justify-between font-bold">
                    <span>{ach.title}</span>
                    <span>{ach.date}</span>
                  </div>
                  {ach.bullets?.length > 0 && (
                    <ul className="list-disc ml-5 space-y-0.5">
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
                  <h2 className="font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5" style={headingStyle}>
                    {sec.title}
                  </h2>
                  <div className="space-y-1.5">
                    {sec.entries.map((entry, idx) => (
                      <div key={`entry-${idx}`}>
                        <div className="flex justify-between font-bold">
                          <span>{entry.title}</span>
                          <span>{entry.date}</span>
                        </div>
                        {entry.subtitle && <p className="italic text-[0.95em]">{entry.subtitle}</p>}
                        {entry.bullets?.length > 0 && (
                          <ul className="list-disc ml-5 space-y-0.5">
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
      className={`bg-white text-black p-8 shadow-sm transition-all duration-150 select-text ${className}`}
      style={fontStyle}
    >
      {/* Header */}
      <header className="text-center border-b border-black pb-3 mb-3">
        <h1 className="font-bold tracking-tight mb-1 text-[20pt] uppercase">
          {data.name || "Candidate Name"}
        </h1>
        {contactItems.length > 0 && (
          <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-0.5 text-[0.9em]">
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
