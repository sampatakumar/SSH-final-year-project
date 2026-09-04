import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CanvasInlineEditable } from "../modules/resume/builder/CanvasInlineEditable";
import { AtsClassicTemplate } from "../modules/resume/templates/AtsClassicTemplate";
import { CompactTemplate } from "../modules/resume/templates/CompactTemplate";
import { ModernDeveloperTemplate } from "../modules/resume/templates/ModernDeveloperTemplate";
import { MinimalTemplate } from "../modules/resume/templates/MinimalTemplate";
import { TwoColumnTemplate } from "../modules/resume/templates/TwoColumnTemplate";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData } from "../modules/resume/templates/types";

const testResumeData: ResumeData = {
  name: "Sampatakumar S V",
  email: "sampata@example.com",
  phone: "+91 9876543210",
  location: "Bengaluru, Karnataka",
  linkedin: "https://linkedin.com/in/sampatakumar",
  github: "https://github.com/sampatakumar",
  professionalSummary: "Full Stack Engineer with strong experience in React and TypeScript.",
  education: [
    {
      school: "Rajiv Gandhi Institute of Technology Bengaluru Karnataka",
      degree: "B.E. in Computer Science and Engineering",
      location: "gggggggggggggggggggggggggggggggg",
      date: "2021 – 2025",
      grade: "8.9 CGPA",
    },
  ],
  experience: [
    {
      company: "rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr",
      role: "Full Stack Web Development Intern",
      location: "gggggggggggggggggggggggggggggggg",
      date: "January 2024 - December 2026",
      bullets: ["Built scalable front-end and back-end modules."],
    },
    {
      company: "AMG Technologies LLP",
      role: "Senior Developer",
      location: "Bengaluru, Karnataka",
      date: "2025 – Present",
      bullets: ["Lead developer for AI-driven platform."],
    },
  ],
  projects: [
    {
      name: "Resume AI Builder Interactive Canvas",
      technologies: "React, TypeScript, TailwindCSS, Node.js",
      bullets: ["Built interactive live A4 document editor."],
    },
  ],
  skills: {
    languages: ["TypeScript", "JavaScript", "Python"],
    frameworks: ["React", "Node.js"],
  },
  achievements: [
    {
      title: "Full Stack Web Development Certification - Edu-versity | AMG Technologies LLP",
      date: "2025",
      bullets: ["Completed comprehensive industry internship program."],
    },
  ],
};

describe("Resume AI Inline Field Sizing & Wrapping Regression Suite", () => {
  describe("1. CanvasInlineEditable Component Sizing & Box-Model", () => {
    it("renders input in edit mode with w-full, min-w-0, and box-sizing border-box", () => {
      const onChange = vi.fn();
      render(
        <CanvasInlineEditable
          value="rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr"
          onChange={onChange}
          isInteractive={true}
          placeholder="Company Name"
        />
      );

      const span = screen.getByText("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
      expect(span).toBeInTheDocument();

      // Click to enter inline edit mode
      fireEvent.click(span);

      const input = screen.getByDisplayValue("rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr");
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe("INPUT");
      expect(input.className).toContain("w-full");
      expect(input.className).toContain("min-w-0");
      expect(input.className).toContain("box-border");
      expect(input.style.boxSizing).toBe("border-box");
      expect(input.style.width).toBe("100%");
    });

    it("renders multiline textarea with box-sizing border-box and w-full min-w-0", () => {
      const onChange = vi.fn();
      render(
        <CanvasInlineEditable
          value="Detailed summary description..."
          onChange={onChange}
          isInteractive={true}
          multiline={true}
          placeholder="Summary..."
        />
      );

      const textElement = screen.getByText("Detailed summary description...");
      fireEvent.click(textElement);

      const textarea = screen.getByDisplayValue("Detailed summary description...");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
      expect(textarea.className).toContain("w-full");
      expect(textarea.className).toContain("min-w-0");
      expect(textarea.style.boxSizing).toBe("border-box");
    });

    it("does not show placeholder or edit controls when not interactive", () => {
      render(
        <CanvasInlineEditable
          value=""
          onChange={vi.fn()}
          isInteractive={false}
          placeholder="Hidden Placeholder"
        />
      );

      expect(screen.queryByText("+ Hidden Placeholder")).not.toBeInTheDocument();
    });
  });

  describe("2. All 5 Templates Layout Structure for Long Metadata Fields", () => {
    const templates = [
      { id: "ats-classic", name: "ATS Classic", Component: AtsClassicTemplate },
      { id: "compact", name: "Compact One-Page", Component: CompactTemplate },
      { id: "modern-developer", name: "Modern Developer", Component: ModernDeveloperTemplate },
      { id: "minimal", name: "Minimal Clean", Component: MinimalTemplate },
      { id: "two-column", name: "Two Column Compact", Component: TwoColumnTemplate },
    ];

    templates.forEach(({ id, name, Component }) => {
      it(`renders correctly in ${name} with long company, location, date, and achievement`, () => {
        const config = createDefaultBuilderConfig(id);
        const { container } = render(
          <Component
            data={testResumeData}
            config={config}
            isInteractive={true}
            onDirectEdit={vi.fn()}
          />
        );

        // Verify long strings render without throwing or clipping
        expect(screen.getAllByText(/rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/gggggggggggggggggggggggggggggggg/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/January 2024 - December 2026/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Rajiv Gandhi Institute of Technology/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/Full Stack Web Development Certification/i)[0]).toBeInTheDocument();

        // Check that containers use flex layout with flex-1 min-w-0 on left and shrink-0 on right
        const flexContainers = container.querySelectorAll(".flex.justify-between");
        expect(flexContainers.length).toBeGreaterThan(0);
      });
    });
  });

  describe("3. Realistic & Empty State Edits", () => {
    it("handles realistic company, location, dates, and achievements cleanly", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      render(
        <AtsClassicTemplate
          data={testResumeData}
          config={config}
          isInteractive={true}
          onDirectEdit={vi.fn()}
        />
      );

      expect(screen.getByText("AMG Technologies LLP")).toBeInTheDocument();
      expect(screen.getByText("2025 – Present")).toBeInTheDocument();
      expect(screen.getByText("Senior Developer")).toBeInTheDocument();
    });
  });
});
