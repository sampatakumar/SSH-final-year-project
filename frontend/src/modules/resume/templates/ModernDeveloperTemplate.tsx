import React from "react";
import type { ResumeTemplateProps } from "./types";
import { getRenderableSkillLines } from "@/components/resume/skillFormat";
import { Github, Linkedin, Globe, Mail, Phone } from "lucide-react";

export const ModernDeveloperTemplate: React.FC<ResumeTemplateProps> = ({ data, config, className = "" }) => {
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

  const contactItems = [
    data.phone ? { label: data.phone, icon: <Phone className="h-3 w-3" /> } : null,
    data.email ? { label: data.email, href: `mailto:${data.email}`, icon: <Mail className="h-3 w-3" /> } : null,
    data.github ? { label: "GitHub", href: data.github, icon: <Github className="h-3 w-3" /> } : null,
    data.linkedin ? { label: "LinkedIn", href: data.linkedin, icon: <Linkedin className="h-3 w-3" /> } : null,
    data.website ? { label: "Portfolio", href: data.website, icon: <Globe className="h-3 w-3" /> } : null,
  ].filter(Boolean) as Array<{ label: string; href?: string; icon: React.ReactNode }>;

  const renderSection = (key: string) => {
    if (isHidden(key)) return null;

    switch (key) {
      case "summary":
        if (!data.professionalSummary?.trim()) return null;
        return (
          <section key="summary" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2 flex items-center gap-2" style={headingStyle}>
              <span>Summary</span>
            </h2>
            <p className="text-slate-800 text-justify">{data.professionalSummary}</p>
          </section>
        );

      case "experience":
        if (!data.experience?.length) return null;
        return (
          <section key="experience" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
              Experience
            </h2>
            <div className="space-y-3">
              {data.experience.map((exp, idx) => (
                <div key={`exp-${idx}`} className="relative pl-3 border-l-2 border-slate-200">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>{exp.role}</span>
                    <span className="text-[0.9em] font-medium text-slate-600">{exp.date}</span>
                  </div>
                  <div className="flex justify-between text-slate-700 font-medium text-[0.95em] mb-1">
                    <span>{exp.company}</span>
                    <span className="text-slate-500 text-[0.9em]">{exp.location}</span>
                  </div>
                  {exp.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800">
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
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
              Featured Projects
            </h2>
            <div className="space-y-2.5">
              {data.projects.map((proj, idx) => (
                <div key={`proj-${idx}`} className="bg-slate-50/80 p-2.5 rounded border border-slate-200/60">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="flex items-center gap-2">
                      <span>{proj.name}</span>
                      {proj.technologies && (
                        <span className="font-normal text-[0.85em] px-2 py-0.5 bg-white border border-slate-300 rounded-full text-slate-700">
                          {proj.technologies}
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2 font-medium text-[0.85em]">
                      {proj.demoUrl && (
                        <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold" style={{ color: accentColor }}>
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
                  {proj.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 mt-1 text-slate-800">
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
            <h2 className="font-bold text-sm uppercase tracking-wider border-b pb-1 mb-2" style={headingStyle}>
              Technical Skills
            </h2>
            <div className="space-y-1.5">
              {skillLines.map((line, idx) => {
                const skillsArray = line.value ? line.value.split(", ") : [];
                return (
                  <div key={`sk-${idx}`} className="flex flex-wrap items-center gap-1.5">
                    {line.label && (
                      <span className="font-bold text-slate-900 min-w-[130px]">{line.label}:</span>
                    )}
                    <div className="flex flex-wrap gap-1 flex-1">
                      {skillsArray.map((skill, sIdx) => (
                        <span key={`sk-item-${idx}-${sIdx}`} className="px-2 py-0.5 rounded text-[0.9em] font-medium bg-slate-100 text-slate-800 border border-slate-200/80">
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
        if (!data.education?.length) return null;
        return (
          <section key="education" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
              Education
            </h2>
            <div className="space-y-1.5">
              {data.education.map((edu, idx) => (
                <div key={`edu-${idx}`} className="flex justify-between">
                  <div>
                    <span className="font-bold text-slate-900">{edu.school}</span>
                    <span className="text-slate-700 italic ml-2">- {[edu.degree, edu.grade].filter(Boolean).join(", ")}</span>
                  </div>
                  <div className="text-slate-600 text-right">
                    <span>{edu.date}</span>
                    {edu.location && <span className="ml-2 text-slate-400">({edu.location})</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "achievements":
        if (!data.achievements?.length) return null;
        return (
          <section key="achievements" style={sectionStyle}>
            <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
              Achievements & Certifications
            </h2>
            <div className="space-y-1.5">
              {data.achievements.map((ach, idx) => (
                <div key={`ach-${idx}`}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{ach.title}</span>
                    <span className="text-slate-500 font-normal">{ach.date}</span>
                  </div>
                  {ach.bullets?.length > 0 && (
                    <ul className="list-disc ml-4 space-y-0.5 text-slate-800">
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
                  <h2 className="font-bold uppercase tracking-wider border-b-2 pb-1 mb-2" style={headingStyle}>
                    {sec.title}
                  </h2>
                  <div className="space-y-2">
                    {sec.entries.map((entry, idx) => (
                      <div key={`entry-${idx}`}>
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{entry.title}</span>
                          <span className="text-slate-500 font-normal">{entry.date}</span>
                        </div>
                        {entry.subtitle && <p className="italic text-slate-700 text-[0.95em]">{entry.subtitle}</p>}
                        {entry.bullets?.length > 0 && (
                          <ul className="list-disc ml-4 space-y-0.5 text-slate-800">
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
      className={`bg-white text-slate-900 p-8 shadow-sm transition-all duration-150 select-text ${className}`}
      style={fontStyle}
    >
      {/* Developer Header */}
      <header className="border-b-2 pb-3 mb-3" style={{ borderColor: accentColor }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
          <div>
            <h1 className="font-extrabold tracking-tight text-[22pt]" style={{ color: accentColor }}>
              {data.name || "Developer Name"}
            </h1>
            <p className="text-slate-600 font-medium text-[1.1em] mt-0.5">Software Engineer</p>
          </div>
          {contactItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 text-[0.85em] text-slate-700">
              {contactItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  {item.icon}
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="hover:underline text-slate-900 font-medium">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Sections */}
      <main>
        {sectionOrder.map((key) => renderSection(key))}
      </main>
    </div>
  );
};

export default ModernDeveloperTemplate;
