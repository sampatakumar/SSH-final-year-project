import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";

export const TwoColumnTemplate: React.FC<ResumeTemplateProps> = ({ data, config, className = "" }) => {
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

  const contactItems = [
    data.phone ? <div key="p">📞 {data.phone}</div> : null,
    data.email ? <div key="e"><a href={`mailto:${data.email}`} className="hover:underline">✉️ {data.email}</a></div> : null,
    data.linkedin ? <div key="l"><a href={data.linkedin} target="_blank" rel="noreferrer" className="hover:underline">🔗 LinkedIn</a></div> : null,
    data.github ? <div key="g"><a href={data.github} target="_blank" rel="noreferrer" className="hover:underline">💻 GitHub</a></div> : null,
    data.website ? <div key="w"><a href={data.website} target="_blank" rel="noreferrer" className="hover:underline">🌐 Portfolio</a></div> : null,
  ].filter(Boolean);

  const skillLines = getRenderableSkillLines(data);

  return (
    <div
      className={`bg-white text-slate-900 p-6 shadow-sm transition-all duration-150 select-text ${className}`}
      style={fontStyle}
    >
      {/* Top Banner Header */}
      <header className="border-b pb-3 mb-4" style={{ borderColor: `${accentColor}30` }}>
        <h1 className="font-extrabold text-[22pt] tracking-tight" style={{ color: accentColor }}>
          {data.name || "Candidate Name"}
        </h1>
      </header>

      {/* Grid Layout (Left Sidebar + Right Main) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Sidebar (4 of 12 columns ~ 33%) */}
        <aside className="md:col-span-4 space-y-4 pr-2 border-r-0 md:border-r border-slate-200">
          {/* Contact Details */}
          {contactItems.length > 0 && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.9em] border-b pb-1 mb-2" style={headingStyle}>
                Contact
              </h2>
              <div className="space-y-1 text-[0.88em] text-slate-700 break-all">
                {contactItems}
              </div>
            </section>
          )}

          {/* Technical Skills */}
          {!isHidden("skills") && skillLines.length > 0 && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.9em] border-b pb-1 mb-2" style={headingStyle}>
                Skills
              </h2>
              <div className="space-y-2">
                {skillLines.map((line, idx) => {
                  const skillsArray = line.value ? line.value.split(", ") : [];
                  return (
                    <div key={`sk-${idx}`}>
                      {line.label && <div className="font-semibold text-slate-900 text-[0.9em]">{line.label}</div>}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {skillsArray.map((s, sIdx) => (
                          <span key={`s-${idx}-${sIdx}`} className="px-1.5 py-0.5 bg-slate-100 rounded text-[0.85em] text-slate-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Education */}
          {!isHidden("education") && data.education && data.education.length > 0 && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.9em] border-b pb-1 mb-2" style={headingStyle}>
                Education
              </h2>
              <div className="space-y-2.5">
                {data.education.map((edu, idx) => (
                  <div key={`edu-${idx}`} className="text-[0.9em]">
                    <div className="font-bold text-slate-900">{edu.school}</div>
                    <div className="text-slate-700 italic">{[edu.degree, edu.grade].filter(Boolean).join(" - ")}</div>
                    <div className="text-slate-500 text-[0.85em]">{edu.date}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Right Main Content (8 of 12 columns ~ 67%) */}
        <main className="md:col-span-8 space-y-4">
          {/* Summary */}
          {!isHidden("summary") && data.professionalSummary?.trim() && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.95em] border-b pb-1 mb-2" style={headingStyle}>
                Profile
              </h2>
              <p className="text-slate-800 text-justify text-[0.95em]">{data.professionalSummary}</p>
            </section>
          )}

          {/* Experience */}
          {!isHidden("experience") && data.experience && data.experience.length > 0 && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.95em] border-b pb-1 mb-2" style={headingStyle}>
                Experience
              </h2>
              <div className="space-y-3">
                {data.experience.map((exp, idx) => (
                  <div key={`exp-${idx}`}>
                    <div className="flex justify-between font-bold text-slate-900 text-[0.95em]">
                      <span>{exp.role}</span>
                      <span className="font-normal text-slate-500 text-[0.88em]">{exp.date}</span>
                    </div>
                    <div className="text-slate-700 italic text-[0.9em] mb-1">
                      {exp.company}{exp.location ? ` — ${exp.location}` : ""}
                    </div>
                    {exp.bullets?.length > 0 && (
                      <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.9em]">
                        {exp.bullets.map((b, bIdx) => (
                          <li key={`exp-b-${idx}-${bIdx}`} className="pl-0.5">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {!isHidden("projects") && data.projects && data.projects.length > 0 && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.95em] border-b pb-1 mb-2" style={headingStyle}>
                Projects
              </h2>
              <div className="space-y-2.5">
                {data.projects.map((proj, idx) => (
                  <div key={`proj-${idx}`}>
                    <div className="flex justify-between font-bold text-slate-900 text-[0.95em]">
                      <span>{proj.name}</span>
                      <div className="flex gap-2 text-[0.85em] font-normal">
                        {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="underline font-semibold" style={{ color: accentColor }}>Live</a>}
                        {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="underline text-slate-600">Code</a>}
                      </div>
                    </div>
                    {proj.technologies && (
                      <div className="text-slate-500 text-[0.85em] italic">{proj.technologies}</div>
                    )}
                    {proj.bullets?.length > 0 && (
                      <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.9em] mt-0.5">
                        {proj.bullets.map((b, bIdx) => (
                          <li key={`proj-b-${idx}-${bIdx}`} className="pl-0.5">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Achievements */}
          {!isHidden("achievements") && data.achievements && data.achievements.length > 0 && (
            <section style={sectionStyle}>
              <h2 className="font-bold uppercase tracking-wider text-[0.95em] border-b pb-1 mb-2" style={headingStyle}>
                Achievements
              </h2>
              <div className="space-y-1.5">
                {data.achievements.map((ach, idx) => (
                  <div key={`ach-${idx}`}>
                    <div className="flex justify-between font-bold text-slate-900 text-[0.9em]">
                      <span>{ach.title}</span>
                      <span className="font-normal text-slate-500 text-[0.85em]">{ach.date}</span>
                    </div>
                    {ach.bullets?.length > 0 && (
                      <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.9em]">
                        {ach.bullets.map((b, bIdx) => (
                          <li key={`ach-b-${idx}-${bIdx}`} className="pl-0.5">{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Custom Sections */}
          {!isHidden("custom") && customSections.length > 0 && (
            <React.Fragment>
              {customSections.map((sec) => {
                if (isHidden(`custom-${sec.id}`) || !sec.entries?.length) return null;
                return (
                  <section key={`custom-${sec.id}`} style={sectionStyle}>
                    <h2 className="font-bold uppercase tracking-wider text-[0.95em] border-b pb-1 mb-2" style={headingStyle}>
                      {sec.title}
                    </h2>
                    <div className="space-y-1.5">
                      {sec.entries.map((entry, idx) => (
                        <div key={`entry-${idx}`}>
                          <div className="flex justify-between font-bold text-slate-900 text-[0.9em]">
                            <span>{entry.title}</span>
                            <span className="font-normal text-slate-500 text-[0.85em]">{entry.date}</span>
                          </div>
                          {entry.subtitle && <p className="text-slate-600 text-[0.85em] italic">{entry.subtitle}</p>}
                          {entry.bullets?.length > 0 && (
                            <ul className="list-disc ml-4 space-y-0.5 text-slate-800 text-[0.9em]">
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
          )}
        </main>
      </div>
    </div>
  );
};

export default TwoColumnTemplate;
