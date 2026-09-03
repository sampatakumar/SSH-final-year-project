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
import { CareerMentorModal } from "../modules/resume/ai/CareerMentorModal";
import { ResumeQualityAssistant } from "../modules/resume/ai/ResumeQualityAssistant";
import { ProjectsSectionEditor } from "../modules/resume/sections/ProjectsSectionEditor";
import { SummarySectionEditor } from "../modules/resume/sections/SummarySectionEditor";

import { createDefaultBuilderConfig, TEMPLATE_REGISTRY } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData, ResumeBuilderConfig } from "../modules/resume/templates/types";

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
          onOpenCareerMentor={vi.fn()}
          onOpenSyncDialog={vi.fn()}
          onExportPdf={vi.fn()}
          isExportingPdf={false}
          isFullScreen={false}
          onToggleFullScreen={vi.fn()}
          activeLeftTab="design"
          onToggleLeftTab={vi.fn()}
        />
      );

      expect(screen.getByText("Principal Architect Resume")).toBeInTheDocument();
      expect(screen.getByText("ATS Classic")).toBeInTheDocument();
      expect(screen.getByText("AI Career Mentor")).toBeInTheDocument();
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

  // 6. Career Mentor Modal
  describe("6. CareerMentorModal", () => {
    it("renders role alignment, career readiness score, strengths, and roadmap button", () => {
      render(
        <CareerMentorModal
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleResumeData}
          targetRole="Full Stack Developer"
          onNavigateToRoadmap={vi.fn()}
        />
      );

      expect(screen.getByText("AI Career Mentor")).toBeInTheDocument();
      expect(screen.getByText(/Career Readiness Score/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified Strengths/i)).toBeInTheDocument();
      expect(screen.getByText(/Growth Opportunities/i)).toBeInTheDocument();
      expect(screen.getByText(/Recommended Career Next Steps/i)).toBeInTheDocument();
      expect(screen.getByText("View Career Roadmap")).toBeInTheDocument();
    });
  });

  // 7. Resume Quality Assistant Modal
  describe("7. ResumeQualityAssistant", () => {
    it("renders ATS audit breakdown and quality checklist", () => {
      render(
        <ResumeQualityAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleResumeData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
        />
      );

      expect(screen.getByText("Smart Skill Hub ATS & Quality Assistant")).toBeInTheDocument();
      expect(screen.getByText(/Quality Audit Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText("Contact Information")).toBeInTheDocument();
      expect(screen.getByText("Technical Skills Matrix")).toBeInTheDocument();
    });
  });

  // 8. Projects Section with GitHub Suggestions
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
    it("renders full-screen 3-zone editor with hero A4 canvas", async () => {
      render(
        <ResumeEditor
          initialResume={mockSampleResumeData}
          onBack={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("ATS Classic")[0]).toBeInTheDocument();
      });

      expect(screen.getByText("Design & Template")).toBeInTheDocument();
      expect(screen.getByText("Formatting & Spacing")).toBeInTheDocument();
      expect(screen.getByText("Contact & Header")).toBeInTheDocument();
      expect(screen.getByText(/ATS Readiness:/i)).toBeInTheDocument();
    });
  });
});
