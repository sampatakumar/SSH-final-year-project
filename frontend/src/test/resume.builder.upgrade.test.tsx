import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { normalizeResumeData } from "../modules/resume/services/resume-normalizer";
import { calculateResumeDensity, optimizeConfigForOnePage } from "../modules/resume/preview/resume-density.utils";
import { createDefaultBuilderConfig, TEMPLATE_REGISTRY } from "../modules/resume/templates/TemplateRegistry";
import ResumeTemplateRenderer from "../modules/resume/templates/ResumeTemplateRenderer";
import SectionReorderList from "../modules/resume/builder/SectionReorderList";
import CustomSectionEditor from "../modules/resume/builder/CustomSectionEditor";
import TypographyColorControls from "../modules/resume/builder/TypographyColorControls";
import { generateResumePdfBlob } from "../modules/resume/services/pdf-export.service";
import type { ResumeData, ResumeBuilderConfig } from "../modules/resume/templates/types";

const mockSampleResume: ResumeData = {
  name: "Morgan Freeman",
  email: "morgan@example.com",
  phone: "+1 (555) 123-4567",
  linkedin: "https://linkedin.com/in/morgan",
  github: "https://github.com/morgan",
  professionalSummary: "Senior Full Stack Engineer with 6+ years of experience designing high-throughput distributed systems.",
  education: [
    {
      school: "Stanford University",
      location: "Stanford, CA",
      degree: "B.S. Computer Science",
      date: "2018 - 2022",
      grade: "3.9 GPA"
    }
  ],
  experience: [
    {
      company: "Google",
      location: "Mountain View, CA",
      role: "Software Engineer III",
      date: "2022 - Present",
      bullets: [
        "Architected real-time streaming pipelines processing 50M events daily.",
        "Reduced latency by 40% using optimized caching and gRPC transport."
      ]
    }
  ],
  projects: [
    {
      name: "Smart Skill Hub",
      technologies: "React, TypeScript, Node.js, MongoDB",
      demoUrl: "https://smartskillhub.demo",
      githubUrl: "https://github.com/ssh/smartskillhub",
      bullets: [
        "Engineered sandbox security runner with Docker and resource limits.",
        "Built responsive 5-template resume builder with live A4 preview."
      ]
    }
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Go", "Python"],
    frameworks: ["React", "Express", "Node.js"],
    tools: ["Docker", "Git", "Kubernetes", "AWS"]
  },
  customSections: [
    {
      id: "sec-certs",
      title: "Certifications",
      entries: [
        {
          id: "cert-1",
          title: "AWS Certified Solutions Architect",
          subtitle: "Amazon Web Services",
          date: "2023",
          bullets: ["Scored 920/1000"]
        }
      ]
    }
  ]
};

describe("Resume Builder UX & Template Upgrade Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Template Registry & Switching
  describe("1. Template Registry & Rendering", () => {
    it("provides 5 registered templates with complete metadata and ATS scores", () => {
      const templateIds = Object.keys(TEMPLATE_REGISTRY);
      expect(templateIds).toContain("ats-classic");
      expect(templateIds).toContain("modern-developer");
      expect(templateIds).toContain("minimal");
      expect(templateIds).toContain("two-column");
      expect(templateIds).toContain("compact");
      expect(templateIds.length).toBe(5);

      expect(TEMPLATE_REGISTRY["ats-classic"].atsScore).toBe("100% ATS Safe");
      expect(TEMPLATE_REGISTRY["compact"].badge).toBe("1-Page Fit");
    });

    it("renders ATS Classic template with high-contrast monochrome layout", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const { container } = render(
        <ResumeTemplateRenderer data={mockSampleResume} config={config} />
      );

      expect(screen.getByText("Morgan Freeman")).toBeInTheDocument();
      expect(screen.getByText(/Professional Summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Senior Full Stack Engineer/i)).toBeInTheDocument();
      expect(screen.getByText("Google")).toBeInTheDocument();
      expect(screen.getByText("Stanford University")).toBeInTheDocument();
    });

    it("renders Modern Developer template with tech tags and links", () => {
      const config = createDefaultBuilderConfig("modern-developer");
      render(<ResumeTemplateRenderer data={mockSampleResume} config={config} />);

      expect(screen.getByText("Morgan Freeman")).toBeInTheDocument();
      expect(screen.getByText("Featured Projects")).toBeInTheDocument();
      expect(screen.getByText("Smart Skill Hub")).toBeInTheDocument();
    });

    it("renders Minimal template with clean layout", () => {
      const config = createDefaultBuilderConfig("minimal");
      render(<ResumeTemplateRenderer data={mockSampleResume} config={config} />);

      expect(screen.getByText("Morgan Freeman")).toBeInTheDocument();
      expect(screen.getByText("Summary")).toBeInTheDocument();
    });

    it("renders Two Column template with sidebar and main content", () => {
      const config = createDefaultBuilderConfig("two-column");
      render(<ResumeTemplateRenderer data={mockSampleResume} config={config} />);

      expect(screen.getByText("Morgan Freeman")).toBeInTheDocument();
      expect(screen.getByText("Contact")).toBeInTheDocument();
      expect(screen.getByText("Summary")).toBeInTheDocument();
    });

    it("renders Compact template with streamlined 1-page structure", () => {
      const config = createDefaultBuilderConfig("compact");
      render(<ResumeTemplateRenderer data={mockSampleResume} config={config} />);

      expect(screen.getByText("Morgan Freeman")).toBeInTheDocument();
      expect(screen.getByText("Summary")).toBeInTheDocument();
    });
  });

  // 2. Section Ordering & Controls
  describe("2. Section Ordering & Visibility Controls", () => {
    it("reorders sections when Move Up and Move Down are clicked", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const mockUpdate = vi.fn();

      render(
        <SectionReorderList
          config={config}
          activeSection="summary"
          onSelectSection={vi.fn()}
          onUpdateConfig={mockUpdate}
          onAddCustomSection={vi.fn()}
        />
      );

      // Click move down on first reorderable section (summary at index 0)
      const moveDownButtons = screen.getAllByRole("button", { name: /move .* down/i });
      fireEvent.click(moveDownButtons[0]);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updatedConfig = mockUpdate.mock.calls[0][0];
      expect(updatedConfig.sectionOrder[0]).toBe("experience");
      expect(updatedConfig.sectionOrder[1]).toBe("summary");
    });

    it("toggles section visibility in hiddenSections list", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const mockUpdate = vi.fn();

      render(
        <SectionReorderList
          config={config}
          activeSection="summary"
          onSelectSection={vi.fn()}
          onUpdateConfig={mockUpdate}
          onAddCustomSection={vi.fn()}
        />
      );

      const hideButtons = screen.getAllByRole("button", { name: /hide .*/i });
      fireEvent.click(hideButtons[0]);

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      const updatedConfig = mockUpdate.mock.calls[0][0];
      expect(updatedConfig.hiddenSections).toContain("summary");
    });
  });

  // 3. Custom Sections Management
  describe("3. Custom Sections Management", () => {
    it("adds custom section with title and entries", () => {
      const mockChange = vi.fn();
      render(<CustomSectionEditor customSections={[]} onChange={mockChange} />);

      const certsPreset = screen.getByRole("button", { name: /certifications/i });
      fireEvent.click(certsPreset);

      expect(mockChange).toHaveBeenCalledTimes(1);
      const created = mockChange.mock.calls[0][0];
      expect(created.length).toBe(1);
      expect(created[0].title).toBe("Certifications");
    });

    it("updates entries inside custom section", () => {
      const customSections = [
        {
          id: "sec-1",
          title: "Publications",
          entries: [{ id: "ent-1", title: "", subtitle: "", date: "", bullets: [""] }]
        }
      ];
      const mockChange = vi.fn();

      render(<CustomSectionEditor customSections={customSections} onChange={mockChange} />);

      const input = screen.getByPlaceholderText("Title / Certificate / Award name");
      fireEvent.change(input, { target: { value: "Deep Learning Research Paper" } });

      expect(mockChange).toHaveBeenCalled();
      const updated = mockChange.mock.calls[0][0];
      expect(updated[0].entries[0].title).toBe("Deep Learning Research Paper");
    });
  });

  // 4. Resume Density Engine & 1-Page Optimizer
  describe("4. Resume Density Engine & 1-Page Optimizer", () => {
    it("calculates accurate fill ratio and estimated page count", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const density = calculateResumeDensity(mockSampleResume, config);

      expect(density.fillRatio).toBeGreaterThan(0.5);
      expect(density.estimatedPages).toBe(1);
      expect(density.status).toBeDefined();
    });

    it("safely tightens typography and spacing when optimizing for 1 page", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      config.typography.sectionGap = 18;
      config.typography.lineHeight = 1.35;
      config.typography.bodySize = 11;

      const largeResume: ResumeData = {
        ...mockSampleResume,
        experience: [
          ...mockSampleResume.experience!,
          {
            company: "Meta",
            role: "Frontend Engineer",
            date: "2020 - 2022",
            location: "Menlo Park, CA",
            bullets: ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4"]
          },
          {
            company: "Amazon",
            role: "SDE I",
            date: "2018 - 2020",
            location: "Seattle, WA",
            bullets: ["Bullet 1", "Bullet 2", "Bullet 3"]
          }
        ]
      };

      const optimized = optimizeConfigForOnePage(largeResume, config);
      expect(optimized.spacingPreset).toBe("compact");
      expect(optimized.typography.sectionGap).toBeLessThan(18);
      expect(optimized.typography.lineHeight).toBeLessThan(1.35);
      expect(optimized.typography.bodySize).toBeLessThanOrEqual(10.5);
    });
  });

  // 5. PDF Generation Parity
  describe("5. PDF Export Service", () => {
    it("generates a valid binary PDF blob across all 5 templates", async () => {
      for (const tmpl of ["ats-classic", "modern-developer", "minimal", "two-column", "compact"] as const) {
        const config = createDefaultBuilderConfig(tmpl);
        const blob = await generateResumePdfBlob(mockSampleResume, config);
        expect(blob).toBeDefined();
        expect(blob.type).toBe("application/pdf");
        expect(blob.size).toBeGreaterThan(500);
      }
    });
  });

  // 6. Backward Compatibility & Normalization
  describe("6. Backward Compatibility & Normalization", () => {
    it("safely normalizes legacy resumes missing configuration metadata", () => {
      const legacyResume = {
        name: "Legacy User",
        email: "legacy@example.com",
        content: "Raw extracted text without config",
      };

      const normalized = normalizeResumeData(legacyResume);
      expect(normalized.name).toBe("Legacy User");
      expect(normalized.config).toBeDefined();
      expect(normalized.config?.templateId).toBe("ats-classic");
      expect(normalized.config?.sectionOrder.length).toBeGreaterThan(0);
      expect(normalized.config?.typography.fontFamily).toBeDefined();
      expect(normalized.education).toEqual([]);
      expect(normalized.experience).toEqual([]);
    });

    it("handles null / undefined resume payload gracefully", () => {
      const normalized = normalizeResumeData(null);
      expect(normalized.name).toBe("");
      expect(normalized.config).toBeDefined();
      expect(normalized.config?.templateId).toBe("ats-classic");
    });
  });
});
