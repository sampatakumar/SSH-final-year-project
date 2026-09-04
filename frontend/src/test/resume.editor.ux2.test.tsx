import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ResumeEditor } from "../modules/resume/builder/ResumeEditor";
import { ResumeDesignPanel } from "../modules/resume/builder/ResumeDesignPanel";
import { ResumeFormattingPanel } from "../modules/resume/builder/ResumeFormattingPanel";
import { ResumeSectionsPanel } from "../modules/resume/builder/ResumeSectionsPanel";
import { ResumeStatusBar } from "../modules/resume/builder/ResumeStatusBar";
import { ResumeEditorHeader } from "../modules/resume/builder/ResumeEditorHeader";
import { AiResumeAssistant } from "../modules/resume/ai/AiResumeAssistant";
import { JobTailorPanel } from "../modules/resume/ai/JobTailorPanel";
import { ProjectsSectionEditor } from "../modules/resume/sections/ProjectsSectionEditor";
import { SummarySectionEditor } from "../modules/resume/sections/SummarySectionEditor";

import { createDefaultBuilderConfig, TEMPLATE_REGISTRY } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData, ResumeBuilderConfig } from "../modules/resume/templates/types";
import { calculateAtsReadiness, calculateCompletenessScore } from "../modules/resume/services/resume-scoring.utils";

const mockSampleResumeData: ResumeData = {
  name: "Sampatakumar S V",
  email: "sampatakumar@example.com",
  phone: "+91 9876543210",
  linkedin: "https://linkedin.com/in/sampatakumar",
  github: "https://github.com/sampatakumar",
  website: "https://sampata.dev",
  professionalSummary: "Senior Full Stack Engineer with expertise in building scalable distributed systems and developer tooling.",
  education: [
    {
      school: "Indian Institute of Technology",
      degree: "B.Tech in Computer Science",
      location: "Chennai",
      date: "2024",
      grade: "9.2 CGPA",
    },
  ],
  experience: [
    {
      company: "Tech Corp",
      role: "Lead Engineer",
      location: "Bangalore",
      date: "2024 – Present",
      bullets: ["Architected microservices handling 50k daily active developers."],
    },
  ],
  projects: [
    {
      name: "Smart Skill Hub",
      technologies: "React, TypeScript, Node.js, Docker",
      githubUrl: "https://github.com/sampatakumar/smart-skill-hub",
      demoUrl: "https://smartskillhub.app",
      bullets: ["Engineered 3-zone resume builder with live A4 preview."],
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python"],
    frameworks: ["React", "Node.js", "Express"],
    tools: ["Docker", "Git", "AWS"],
    libraries: ["MongoDB", "PostgreSQL"],
  },
  achievements: [
    {
      title: "Winner of National Hackathon 2024",
      date: "2024",
      bullets: ["1st place among 500+ engineering teams."],
    },
  ],
  config: createDefaultBuilderConfig("ats-classic"),
};

// Mock Auth
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    backendUser: {
      displayName: "Sampatakumar S V",
      email: "sampatakumar@example.com",
      phone: "+91 9876543210",
      about: "Senior Full Stack Engineer with expertise in building scalable systems.",
      targetRole: "Full Stack Developer",
    },
    idToken: "mock-id-token",
    refreshProfile: vi.fn(),
  }),
}));

vi.mock("@/lib/api", () => ({
  apiRequest: vi.fn().mockImplementation((path: string) => {
    if (path === "/projects") {
      return Promise.resolve({
        data: {
          projects: [
            {
              title: "Smart Skill Hub",
              description: "AI-guided developer platform.",
              stack: ["React", "TypeScript", "Node.js"],
              githubUrl: "https://github.com/ssh",
            },
          ],
        },
      });
    }
    return Promise.resolve({ data: {} });
  }),
}));

describe("Resume Editor UX 2.0 Master Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Header Component
  describe("1. ResumeEditorHeader", () => {
    it("renders title, template badge, and action triggers", () => {
      render(
        <ResumeEditorHeader
          resumeTitle="Principal Architect Resume"
          onChangeTitle={vi.fn()}
          templateName="ATS Classic"
          onBack={vi.fn()}
          onOpenAiAssistant={vi.fn()}
          onOpenTailor={vi.fn()}
          onSaveAsVersion={vi.fn()}
          onExportPdf={vi.fn()}
          isExportingPdf={false}
          isFullScreen={false}
          onToggleFullScreen={vi.fn()}
        />
      );

      expect(screen.getByText("Principal Architect Resume")).toBeInTheDocument();
      expect(screen.getByText("ATS Classic")).toBeInTheDocument();
      expect(screen.getByText("AI Resume Assistant")).toBeInTheDocument();
      expect(screen.getByText("Tailor for Job")).toBeInTheDocument();
      expect(screen.getByText("Export PDF")).toBeInTheDocument();
    });
  });

  // 2. Design Panel & Visual Templates
  describe("2. ResumeDesignPanel", () => {
    it("renders color presets and all 5 visual template thumbnails", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const onUpdate = vi.fn();

      render(<ResumeDesignPanel config={config} onUpdateConfig={onUpdate} />);

      expect(screen.getByText(/Theme & Accent Color/i)).toBeInTheDocument();
      expect(screen.getByText(/ATS Templates/i)).toBeInTheDocument();

      // Check all 5 templates exist
      expect(screen.getAllByText("ATS Classic")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Modern Developer")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Minimal Clean")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Two Column Compact")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Compact One-Page")[0]).toBeInTheDocument();
    });

    it("triggers template change on thumbnail click", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const onUpdate = vi.fn();

      render(<ResumeDesignPanel config={config} onUpdateConfig={onUpdate} />);

      fireEvent.click(screen.getAllByText("Modern Developer")[0]);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ templateId: "modern-developer" })
      );
    });
  });

  // 3. Formatting Panel
  describe("3. ResumeFormattingPanel", () => {
    it("renders typography settings and spacing presets", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const onUpdate = vi.fn();

      render(<ResumeFormattingPanel config={config} onUpdateConfig={onUpdate} />);

      expect(screen.getByText(/Density Presets/i)).toBeInTheDocument();
      expect(screen.getByText(/Target Page Fit/i)).toBeInTheDocument();
      expect(screen.getByText(/Font Family & Scale/i)).toBeInTheDocument();
      expect(screen.getByText("compact")).toBeInTheDocument();
      expect(screen.getByText("balanced")).toBeInTheDocument();
      expect(screen.getByText("spacious")).toBeInTheDocument();
    });

    it("triggers density preset updates", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const onUpdate = vi.fn();

      render(<ResumeFormattingPanel config={config} onUpdateConfig={onUpdate} />);

      fireEvent.click(screen.getByText("compact"));
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ spacingPreset: "compact" })
      );
    });
  });

  // 4. Sections Navigation Panel
  describe("4. ResumeSectionsPanel", () => {
    it("renders persistent section list with entry counts and reorder buttons", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const onUpdate = vi.fn();
      const onSelect = vi.fn();

      render(
        <ResumeSectionsPanel
          config={config}
          onUpdateConfig={onUpdate}
          activeSection="personal"
          onSelectSection={onSelect}
          sectionCounts={{
            personal: 1,
            summary: 1,
            experience: 2,
            projects: 3,
            education: 1,
            skills: 8,
            achievements: 1,
          }}
        />
      );

      expect(screen.getByText("Contact & Header")).toBeInTheDocument();
      expect(screen.getByText("Professional Summary")).toBeInTheDocument();
      expect(screen.getByText("Work Experience")).toBeInTheDocument();
      expect(screen.getByText("Technical Projects")).toBeInTheDocument();
    });
  });

  // 5. Status Bar Component
  describe("5. ResumeStatusBar", () => {
    it("displays ATS Readiness, completeness, page count, and save status", () => {
      render(
        <ResumeStatusBar
          isSaving={false}
          lastSavedAt={new Date()}
          atsScore={92}
          completeness={96}
          estimatedPages={1}
          isOverflowing={false}
          onOptimizePage={vi.fn()}
          onOpenQualityAssistant={vi.fn()}
        />
      );

      expect(screen.getByText(/ATS Readiness:/i)).toBeInTheDocument();
      expect(screen.getByText("92/100")).toBeInTheDocument();
      expect(screen.getByText("96%")).toBeInTheDocument();
      expect(screen.getByText("1 Page")).toBeInTheDocument();
    });
  });

  // 6. AI Resume Assistant Modal
  describe("6. AiResumeAssistant", () => {
    it("renders ATS readiness heuristic, student completeness, and quality guidance", () => {
      render(
        <AiResumeAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleResumeData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
        />
      );

      expect(screen.getByText("AI Resume Assistant")).toBeInTheDocument();
      expect(screen.getAllByText(/ATS Readiness/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Completeness/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Page Density/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Content Quality/i)[0]).toBeInTheDocument();
    });
  });

  // 7. JobTailorPanel
  describe("7. JobTailorPanel", () => {
    it("renders job description input and performs keyword extraction", () => {
      render(<JobTailorPanel data={mockSampleResumeData} />);

      expect(screen.getByText(/Tailor for Job Description/i)).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/Paste job description/i);
      expect(textarea).toBeInTheDocument();

      fireEvent.change(textarea, {
        target: {
          value: "We are hiring a Senior React and TypeScript Engineer with Docker experience.",
        },
      });

      fireEvent.click(screen.getByRole("button", { name: /Analyze & Match/i }));

      expect(screen.getByText(/Keyword Match Index/i)).toBeInTheDocument();
      expect(screen.getByText("react")).toBeInTheDocument();
      expect(screen.getByText("typescript")).toBeInTheDocument();
      expect(screen.getByText("docker")).toBeInTheDocument();
    });
  });

  // 8. Projects Section with GitHub Suggestions & Deduplication
  describe("8. ProjectsSectionEditor with GitHub Intelligence", () => {
    it("displays Suggested from GitHub Intelligence banner and adds repo on click", () => {
      const onChange = vi.fn();
      render(
        <ProjectsSectionEditor
          projects={mockSampleResumeData.projects || []}
          onChange={onChange}
          availableGitHubProjects={[
            {
              title: "New AI Engine",
              stack: ["Python", "FastAPI"],
              description: "High-throughput LLM inference gateway.",
            },
          ]}
          idToken="test-token"
        />
      );

      expect(screen.getByText(/Suggested from GitHub Intelligence/i)).toBeInTheDocument();
      expect(screen.getByText("New AI Engine")).toBeInTheDocument();

      fireEvent.click(screen.getByText("New AI Engine"));
      expect(onChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "New AI Engine" }),
        ])
      );
    });
  });

  // 9. Full Workspace Integration
  describe("9. ResumeEditor Main Workspace Integration", () => {
    it("renders full-screen 3-zone editor with hero A4 canvas and contextual tabs", async () => {
      render(
        <ResumeEditor
          initialResume={mockSampleResumeData}
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("ATS Classic")[0]).toBeInTheDocument();
      });

      expect(screen.getByText("Contact & Header")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Design/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /AI Health/i })[0]).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /Tailor/i })[0]).toBeInTheDocument();
      expect(screen.getByText(/ATS Readiness:/i)).toBeInTheDocument();

      // Verify A4 page element is mounted with exact top-left containing block alignment (no left overhang)
      const a4Page = document.getElementById("resume-a4-page-1");
      expect(a4Page).toBeInTheDocument();
      expect(a4Page?.style.position).toBe("absolute");
      expect(a4Page?.style.left).toBe("0px");
      expect(a4Page?.style.top).toBe("0px");
      expect(a4Page?.style.transformOrigin).toBe("top left");
    });

    it("supports collapsing and expanding left and right panels", async () => {
      render(
        <ResumeEditor
          initialResume={mockSampleResumeData}
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("ATS Classic")[0]).toBeInTheDocument();
      });

      // Collapse left panel
      const collapseLeftBtn = screen.getByTitle(/Collapse Sections panel/i);
      expect(collapseLeftBtn).toBeInTheDocument();
      fireEvent.click(collapseLeftBtn);

      // Expand left button should appear
      const expandLeftBtn = screen.getByTitle(/Expand Sections panel/i);
      expect(expandLeftBtn).toBeInTheDocument();
      fireEvent.click(expandLeftBtn);
      expect(screen.getByText("Contact & Header")).toBeInTheDocument();
    });
  });
});


