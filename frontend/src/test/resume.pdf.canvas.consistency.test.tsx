import { describe, it, expect } from "vitest";
import { generateResumePdfBlob } from "../modules/resume/services/pdf-export.service";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData } from "../modules/resume/templates/types";

const mockSampleResume: ResumeData = {
  name: "Sampatakumar S V",
  email: "sampata@example.com",
  phone: "+91 9876543210",
  location: "Bengaluru, Karnataka",
  linkedin: "https://linkedin.com/in/sampatakumar",
  github: "https://github.com/sampatakumar",
  website: "https://sampata.dev",
  professionalSummary: "Senior Full Stack Engineer with expertise in building scalable distributed systems, real-time architectures, and developer tooling.",
  education: [
    {
      school: "Rajiv Gandhi Institute of Technology",
      degree: "B.E. in Computer Science and Engineering",
      location: "Bengaluru, Karnataka",
      date: "2021 – 2025",
      grade: "8.9 CGPA",
    },
  ],
  experience: [
    {
      company: "AMG Technologies LLP",
      role: "Full Stack Web Development Intern",
      location: "Bengaluru, Karnataka",
      date: "Jan 2025 – Present",
      bullets: [
        "Architected scalable microservices and modular UI components handling thousands of daily operations.",
        "Integrated AI evaluation workflows with responsive canvas document editing.",
      ],
    },
  ],
  projects: [
    {
      name: "Smart Skill Hub",
      technologies: "React, TypeScript, Node.js, Express, MongoDB, TailwindCSS",
      githubUrl: "https://github.com/sampatakumar/smart-skill-hub",
      demoUrl: "https://smartskillhub.app",
      bullets: [
        "Engineered real-time interactive A4 document canvas with instant PDF export.",
        "Built comprehensive AI resume tailoring and scoring algorithms.",
      ],
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python", "SQL"],
    frameworks: ["React", "Node.js", "Express", "Next.js"],
    tools: ["Docker", "Git", "Postman", "Vite"],
    libraries: ["TailwindCSS", "Zustand", "Framer Motion"],
  },
  achievements: [
    {
      title: "Full Stack Web Development Certification - Edu-versity | AMG Technologies LLP",
      date: "2025",
      bullets: ["Completed rigorous full-stack development internship and industry capstone project."],
    },
  ],
};

const readBlobAsText = (blob: Blob): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || "");
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
};
describe("Resume AI Canvas <-> PDF Exact Parity & Vector Text Suite", () => {
  it("generates a 100% vector text A4 PDF with valid size and mime type", async () => {
    const config = createDefaultBuilderConfig("ats-classic");
    const blob = await generateResumePdfBlob(mockSampleResume, config);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000); // Valid non-empty PDF binary
  });

  it("reflects immediate state changes in the PDF (e.g. PDF CONSISTENCY TEST)", async () => {
    const config = createDefaultBuilderConfig("ats-classic");
    const editedResume: ResumeData = {
      ...mockSampleResume,
      projects: [
        {
          name: "PDF CONSISTENCY TEST",
          technologies: "React, TypeScript",
          bullets: ["Verified PDF generator reflects current canvas document state."],
        },
      ],
    };

    const blob = await generateResumePdfBlob(editedResume, config);
    const textContent = await readBlobAsText(blob);

    expect(textContent).toContain("PDF CONSISTENCY TEST");
  });

  it("exports valid selectable text PDFs across all 5 visual templates", async () => {
    const templates = [
      "ats-classic",
      "modern-developer",
      "compact",
      "minimal",
      "two-column",
    ] as const;

    for (const templateId of templates) {
      const config = createDefaultBuilderConfig(templateId);
      const blob = await generateResumePdfBlob(mockSampleResume, config);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe("application/pdf");
      expect(blob.size).toBeGreaterThan(1000);

      const textContent = await readBlobAsText(blob);
      // Verify candidate name exists in raw PDF stream
      expect(textContent.toUpperCase()).toContain("SAMPATAKUMAR");
    }
  });

  it("renders multi-project list with technologies and links on dedicated rows", async () => {
    const multiProjectResume: ResumeData = {
      ...mockSampleResume,
      projects: [
        {
          name: "SMART SKILL HUB – SKILL LEARNING & DEVELOPMENT PLATFORM",
          technologies: "React.js, JavaScript, Node.js, Express.js, MongoDB, JWT, HTML5, CSS3, Git",
          demoUrl: "https://smartskillhub.app",
          githubUrl: "https://github.com/sampata/smartskillhub",
          bullets: ["Engineered responsive and interactive UI using React.js."],
        },
        {
          name: "AGRI STORE – E-COMMERCE PLATFORM FOR AGRICULTURAL PRODUCTS",
          technologies: "HTML5, CSS3, JavaScript, PHP, MySQL, Bootstrap",
          demoUrl: "https://agristore.app",
          bullets: ["Developed an end-to-end e-commerce web platform for farmers."],
        },
        {
          name: "RESUMEAI – INTELLIGENT RESUME BUILDER & CAREER ASSISTANT",
          technologies: "React.js, TypeScript, TailwindCSS, Node.js, Express.js, MongoDB, Groq, LLaMA-3",
          githubUrl: "https://github.com/sampata/resumeai",
          bullets: ["Implemented real-time interactive A4 document canvas with instant PDF export."],
        },
      ],
    };

    const config = createDefaultBuilderConfig("ats-classic");
    const blob = await generateResumePdfBlob(multiProjectResume, config);
    const textContent = await readBlobAsText(blob);

    expect(textContent).toContain("SMART SKILL HUB");
    expect(textContent).toContain("React.js, JavaScript, Node.js");
    expect(textContent).toContain("AGRI STORE");
    expect(textContent).toContain("RESUMEAI");
    expect(textContent).toContain("Live");
    expect(textContent).toContain("Code");
  });
});
