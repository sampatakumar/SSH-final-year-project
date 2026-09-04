import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import {
  adaptMasterProfileToResume,
  mergeProfileWithSavedResume,
  normalizeProjectKey,
  type MasterProfileData,
  type UserProjectItem,
} from "../modules/resume/services/resume-profile-adapter";
import {
  normalizeResumeData,
  dedupeProjectsList,
} from "../modules/resume/services/resume-normalizer";
import ResumeTemplateRenderer from "../modules/resume/templates/ResumeTemplateRenderer";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import { generateResumePdfBlob } from "../modules/resume/services/pdf-export.service";
import type { ResumeData } from "../modules/resume/templates/types";

describe("Resume Layout, Overflow, Bottom Whitespace & Deduplication Tests", () => {
  // Real-world test case data from sampatakumar_venkatapur's_resume.pdf
  const realWorldMasterProfile: MasterProfileData = {
    displayName: "SAMPATAKUMAR VENKATAPUR",
    email: "sampatakumarsv@gmail.com",
    phone: "+91 9380395607",
    about: "Passionate Computer Science student with hands-on experience building full-stack web applications.",
    educationEntries: [
      {
        college: "Rajiv Gandhi Institute of Technology",
        degree: "Bachelor of Engineering",
        specialization: "Computer Science",
        location: "Bangalore, India",
        endDate: "2025",
        grade: "7.0/10 CGPA",
      },
    ],
    experience: [],
    skillSections: [
      {
        title: "Programming Languages",
        skills: ["JavaScript", "Python", "HTML5", "CSS3"],
      },
      {
        title: "Frameworks & Libraries",
        skills: ["React.js", "Next.js", "React Native", "Node.js", "Express.js"],
      },
      {
        title: "Database & Cloud",
        skills: ["MongoDB", "Firebase"],
      },
      {
        title: "Tools & Platforms",
        skills: ["Git", "GitHub", "VS Code", "Postman", "MongoDB Compass"],
      },
    ],
  };

  // Simulating project variants that could cause duplication if unnormalized
  const realWorldUserProjects: UserProjectItem[] = [
      {
        _id: "p1",
        title: "ResumeAI",
        description: "AI-powered resume builder and optimizer with intelligent ATS scoring.",
        stack: ["React.js", "TypeScript", "Node.js", "Express.js", "MongoDB", "Firebase", "LangChain", "Groq", "LLaMA", "Supabase", "Git"],
      },
      {
        _id: "p1_dup",
        title: "ResumeAI — AI Resume Builder & Optimizer",
        description: "AI-powered resume builder and optimizer with intelligent ATS scoring.",
        stack: ["React.js", "TypeScript", "Node.js", "Express.js", "MongoDB"],
      },
      {
        _id: "p2",
        title: "Smart Skill Hub",
        description: "Comprehensive learning and career acceleration platform.",
        stack: ["React.js", "Node.js", "Express.js", "MongoDB", "TailwindCSS"],
      },
      {
        _id: "p2_dup",
        title: "Smart Skill Hub | Career Acceleration Platform",
        description: "Comprehensive learning and career acceleration platform.",
        stack: ["React.js", "Node.js"],
      },
      {
        _id: "p3",
        title: "Agri Store",
        description: "Full-stack agricultural marketplace platform connecting farmers and consumers.",
        stack: ["React.js", "Node.js", "Express.js", "MongoDB"],
      },
    ];

  describe("1. Project Deduplication & Identity Normalization", () => {
    it("normalizes project keys consistently across variants with separators", () => {
      expect(normalizeProjectKey("ResumeAI")).toBe("resumeai");
      expect(normalizeProjectKey("ResumeAI — AI Resume Builder")).toBe("resumeai");
      expect(normalizeProjectKey("ResumeAI - Smart Builder")).toBe("resumeai");
      expect(normalizeProjectKey("Smart Skill Hub | Career Platform")).toBe("smartskillhub");
      expect(normalizeProjectKey("Agri Store: E-Commerce")).toBe("agristore");
    });

    it("deduplicates projects when adapting Master Profile", () => {
      const adapted = adaptMasterProfileToResume(realWorldMasterProfile, realWorldUserProjects);

      expect(adapted.projects?.length).toBe(3);
      const projectTitles = (adapted.projects || []).map((p) => p.name);
      expect(projectTitles).toContain("ResumeAI");
      expect(projectTitles).toContain("Smart Skill Hub");
      expect(projectTitles).toContain("Agri Store");
    });

    it("merges richer details (tech stack, bullets) when deduplicating", () => {
      const adapted = adaptMasterProfileToResume(realWorldMasterProfile, realWorldUserProjects);
      const resumeAiProject = (adapted.projects || []).find(
        (p) => normalizeProjectKey(p.name) === "resumeai"
      );

      expect(resumeAiProject).toBeDefined();
      // Should preserve the longer tech stack
      expect(resumeAiProject?.technologies).toContain("LangChain");
      expect(resumeAiProject?.technologies).toContain("Groq");
    });

    it("deduplicates projects in resume-normalizer dedupeProjectsList", () => {
      const duplicateProjects = [
        { name: "ResumeAI", technologies: "React", bullets: ["B1"] },
        { name: "ResumeAI - Advanced", technologies: "React, Node", bullets: ["B1", "B2"] },
        { name: "Smart Skill Hub", technologies: "MongoDB", bullets: [] },
      ];

      const deduped = dedupeProjectsList(duplicateProjects);
      expect(deduped.length).toBe(2);
      expect(deduped[0].technologies).toContain("Node");
      expect(deduped[0].bullets.length).toBe(2);
    });
  });

  describe("2. No Fabricated Data / Preserving Missing Optional Fields", () => {
    it("does not fabricate GitHub, Portfolio, or metrics if missing in master profile", () => {
      const adapted = adaptMasterProfileToResume(realWorldMasterProfile, realWorldUserProjects);

      expect(adapted.github).toBe("");
      expect(adapted.website).toBe("");
      expect(adapted.name).toBe("SAMPATAKUMAR VENKATAPUR");
      expect(adapted.email).toBe("sampatakumarsv@gmail.com");
      expect(adapted.phone).toBe("+91 9380395607");
    });
  });

  describe("3. Template Rendering & Content Wrapping (No Overflow / Clipping)", () => {
    const templateResumeData: ResumeData = {
      name: "SAMPATAKUMAR VENKATAPUR",
      email: "sampatakumarsv@gmail.com",
      phone: "+91 9380395607",
      linkedin: "",
      github: "",
      website: "",
      professionalSummary: "Passionate Computer Science student with hands-on experience building full-stack web applications.",
      skillSections: [
        {
          title: "Programming Languages",
          skills: ["JavaScript", "Python", "HTML5", "CSS3"],
        },
        {
          title: "Frameworks & Libraries",
          skills: ["React.js", "Next.js", "React Native", "Node.js", "Express.js"],
        },
        {
          title: "Database & Cloud",
          skills: ["MongoDB", "Firebase"],
        },
        {
          title: "Tools & Platforms",
          skills: ["Git", "GitHub", "VS Code", "Postman", "MongoDB Compass"],
        },
      ],
      experience: [],
      education: [
        {
          school: "Rajiv Gandhi Institute of Technology",
          degree: "Bachelor of Engineering in Computer Science",
          location: "Bangalore, India",
          date: "2021 – 2025",
          grade: "7.0/10 CGPA",
        },
      ],
      projects: [
        {
          name: "ResumeAI",
          technologies: "React.js, TypeScript, Node.js, Express.js, MongoDB, Firebase, LangChain, Groq, LLaMA, Supabase, Git",
          bullets: [
            "Developed a full-stack AI-powered platform for creating, analyzing, and tailoring resumes to target job descriptions.",
            "Implemented automated PDF generation with clean ATS-friendly layouts.",
          ],
        },
        {
          name: "Smart Skill Hub",
          technologies: "React.js, Node.js, Express.js, MongoDB, TailwindCSS",
          bullets: [
            "Integrated multiple learning modules including EduTube, Smart Mentor, and Coding Assessment.",
          ],
        },
        {
          name: "Agri Store",
          technologies: "React.js, Node.js, Express.js, MongoDB",
          bullets: [
            "Built secure transaction processing and real-time inventory tracking for farmers.",
          ],
        },
      ],
    };

    const templates = ["ats-classic", "compact", "minimal", "modern-developer", "two-column"] as const;

    templates.forEach((templateId) => {
      it(`renders template '${templateId}' with correct projects and wrapping classes`, () => {
        const config = createDefaultBuilderConfig(templateId);
        const { container } = render(
          <ResumeTemplateRenderer
            data={templateResumeData}
            config={config}
            templateId={templateId}
          />
        );

        // Check project titles appear in document text
        expect(screen.getByText("ResumeAI")).toBeInTheDocument();
        expect(screen.getByText("Smart Skill Hub")).toBeInTheDocument();
        expect(screen.getByText("Agri Store")).toBeInTheDocument();

        // Ensure text-wrapping CSS classes exist on project / content blocks
        const breakWordElements = container.querySelectorAll(".break-words, .overflow-wrap-anywhere, .min-w-0");
        expect(breakWordElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe("4. PDF Generation (A4 Document Geometry & Wrapping)", () => {
    it("generates an A4 PDF blob without throwing errors", async () => {
      const resumeData: ResumeData = {
        name: "SAMPATAKUMAR VENKATAPUR",
        email: "sampatakumarsv@gmail.com",
        phone: "+91 9380395607",
        linkedin: "",
        github: "",
        website: "",
        professionalSummary: "Passionate Computer Science student with hands-on experience building full-stack web applications.",
        skillSections: [
          {
            title: "Core Skills",
            skills: ["JavaScript", "Python", "React.js", "Node.js", "MongoDB", "Firebase", "Git"],
          },
        ],
        experience: [],
        education: [
          {
            school: "Rajiv Gandhi Institute of Technology",
            degree: "BE Computer Science",
            date: "2021 – 2025",
            location: "Bangalore, India",
            grade: "7.0/10",
          },
        ],
        projects: [
          {
            name: "ResumeAI",
            technologies: "React.js, TypeScript, Node.js, Express.js, MongoDB, Firebase, LangChain, Groq, LLaMA, Supabase, Git",
            bullets: [
              "Automated PDF generation with strict A4 coordinate geometry.",
            ],
          },
          {
            name: "Smart Skill Hub",
            technologies: "React.js, Node.js",
            bullets: [],
          },
          {
            name: "Agri Store",
            technologies: "React.js, MongoDB",
            bullets: [],
          },
        ],
      };

      const config = createDefaultBuilderConfig("ats-classic");
      const blob = await generateResumePdfBlob(resumeData, config);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/pdf");
      expect(blob.size).toBeGreaterThan(1000);
    });
  });
});
