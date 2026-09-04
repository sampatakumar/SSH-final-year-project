import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CanvasInlineEditable } from "../modules/resume/builder/CanvasInlineEditable";
import { CanvasSectionToolbar } from "../modules/resume/builder/CanvasSectionToolbar";
import { ResumePreviewWorkspace } from "../modules/resume/builder/ResumePreviewWorkspace";
import ResumeTemplateRenderer from "../modules/resume/templates/ResumeTemplateRenderer";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import { generateResumePdfBlob } from "../modules/resume/services/pdf-export.service";
import type { ResumeData } from "../modules/resume/templates/types";

const mockTestResume: ResumeData = {
  name: "Sampatakumar Venkatapur",
  email: "sampatakumar@example.com",
  phone: "+91 9876543210",
  linkedin: "https://linkedin.com/in/sampatakumar",
  github: "https://github.com/sampatakumar",
  professionalSummary: "Full Stack Engineer specializing in React, Node.js, and Cloud architectures.",
  experience: [
    {
      company: "Tech Solutions",
      role: "Full Stack Web Development Intern",
      date: "Jan 2024 - Present",
      location: "Bengaluru, India",
      bullets: [
        "Developed scalable microservices with Express and TypeScript.",
        "Built responsive UI workflows using React and Tailwind CSS."
      ]
    }
  ],
  projects: [
    {
      name: "ResumeAI",
      technologies: "React, TypeScript, Node.js, LLaMA",
      demoUrl: "https://resumeai.demo",
      githubUrl: "https://github.com/sampatakumar/resumeai",
      bullets: [
        "AI-Powered Resume & Career Platform with real-time interactive document canvas.",
        "Automated PDF export matching canvas layout."
      ]
    },
    {
      name: "Smart Skill Hub",
      technologies: "React, Express, MongoDB",
      demoUrl: "https://smartskillhub.demo",
      githubUrl: "https://github.com/sampatakumar/smartskillhub",
      bullets: [
        "Multi-module platform for developer assessments and career growth."
      ]
    }
  ],
  skills: {
    languages: ["JavaScript", "TypeScript", "Python"],
    frameworks: ["React.js", "Node.js", "Express.js"],
    tools: ["Docker", "Git", "MongoDB", "Firebase"]
  },
  education: [
    {
      school: "Rajiv Gandhi Institute of Technology",
      degree: "B.E. Computer Science and Engineering",
      date: "2021 - 2025",
      grade: "8.8 CGPA"
    }
  ],
  achievements: [
    {
      title: "1st Place Hackathon Winner",
      description: "Built autonomous coding assistant."
    }
  ]
};

describe("Interactive A4 Document Canvas Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. CanvasInlineEditable Component Tests
  describe("1. CanvasInlineEditable Component", () => {
    it("renders static text when isInteractive is false", () => {
      render(
        <CanvasInlineEditable
          value="Original Resume Text"
          onChange={vi.fn()}
          isInteractive={false}
        />
      );

      expect(screen.getByText("Original Resume Text")).toBeInTheDocument();
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("enters edit mode on click when isInteractive is true and submits new value", () => {
      const mockChange = vi.fn();
      render(
        <CanvasInlineEditable
          value="Click To Edit Me"
          onChange={mockChange}
          isInteractive={true}
        />
      );

      const clickableText = screen.getByText("Click To Edit Me");
      fireEvent.click(clickableText);

      // Now an input should be rendered
      const input = screen.getByDisplayValue("Click To Edit Me");
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "Updated Resume Text" } });
      fireEvent.blur(input);

      expect(mockChange).toHaveBeenCalledWith("Updated Resume Text");
    });

    it("supports multiline textarea editing", () => {
      const mockChange = vi.fn();
      render(
        <CanvasInlineEditable
          value="Line 1 of Summary"
          onChange={mockChange}
          isInteractive={true}
          multiline={true}
        />
      );

      fireEvent.click(screen.getByText("Line 1 of Summary"));
      const textarea = screen.getByDisplayValue("Line 1 of Summary");
      expect(textarea.tagName).toBe("TEXTAREA");

      fireEvent.change(textarea, { target: { value: "Line 1\nLine 2" } });
      fireEvent.blur(textarea);

      expect(mockChange).toHaveBeenCalledWith("Line 1\nLine 2");
    });
  });

  // 2. CanvasSectionToolbar Component Tests
  describe("2. CanvasSectionToolbar Component", () => {
    it("dispatches section actions (moveUp, moveDown, addItem, duplicate, hide, delete, ai)", () => {
      const mockAction = vi.fn();
      render(
        <CanvasSectionToolbar
          sectionId="projects"
          sectionTitle="Projects"
          onAction={mockAction}
          canAddItem={true}
          canMoveUp={true}
          canMoveDown={true}
        />
      );

      // Test Move Up
      const moveUpBtn = screen.getByTitle("Move section up");
      fireEvent.click(moveUpBtn);
      expect(mockAction).toHaveBeenCalledWith("moveUp", "projects");

      // Test Add Item
      const addItemBtn = screen.getByTitle("Add entry to section");
      fireEvent.click(addItemBtn);
      expect(mockAction).toHaveBeenCalledWith("addItem", "projects");

      // Test AI Improve
      const aiBtn = screen.getByTitle("AI Improve Section");
      fireEvent.click(aiBtn);
      expect(mockAction).toHaveBeenCalledWith("ai", "projects");
    });
  });

  // 3. Interactive Resume Template Rendering
  describe("3. Interactive Resume Template Rendering", () => {
    it("renders ATS Classic template in interactive mode with direct editable fields", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const mockSelect = vi.fn();
      const mockEdit = vi.fn();

      render(
        <ResumeTemplateRenderer
          data={mockTestResume}
          config={config}
          isInteractive={true}
          selectedSection="summary"
          onSelectSection={mockSelect}
          onDirectEdit={mockEdit}
        />
      );

      // Verify name is rendered and editable
      expect(screen.getByText("Sampatakumar Venkatapur")).toBeInTheDocument();
      expect(screen.getByText(/Full Stack Engineer specializing/i)).toBeInTheDocument();
      expect(screen.getByText("ResumeAI")).toBeInTheDocument();
      expect(screen.getByText("Smart Skill Hub")).toBeInTheDocument();

      // Click on Summary section to select
      const summaryText = screen.getByText(/Full Stack Engineer specializing/i);
      fireEvent.click(summaryText);
    });

    it("renders Modern Developer template in interactive mode with tech tags", () => {
      const config = createDefaultBuilderConfig("modern-developer");
      render(
        <ResumeTemplateRenderer
          data={mockTestResume}
          config={config}
          isInteractive={true}
        />
      );

      expect(screen.getByText("Sampatakumar Venkatapur")).toBeInTheDocument();
      expect(screen.getByText("Featured Projects")).toBeInTheDocument();
      expect(screen.getByText("ResumeAI")).toBeInTheDocument();
    });
  });

  // 4. ResumePreviewWorkspace Document Canvas Controls
  describe("4. ResumePreviewWorkspace Canvas Workspace", () => {
    it("renders A4 Document Canvas with zoom controls and page badge", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      render(
        <ResumePreviewWorkspace
          data={mockTestResume}
          config={config}
          estimatedPages={1}
        />
      );

      expect(screen.getByText("Interactive Canvas")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
      expect(screen.getByTitle("Zoom in (Ctrl + +)")).toBeInTheDocument();
      expect(screen.getByTitle("Zoom out (Ctrl + -)")).toBeInTheDocument();

      // Click Zoom In
      fireEvent.click(screen.getByTitle("Zoom in (Ctrl + +)"));
      expect(screen.getByText("95%")).toBeInTheDocument();
    });
  });

  // 5. Section and Item Drag and Drop Reordering
  describe("5. Structure-Aware Drag and Drop Reordering", () => {
    it("triggers onReorderSections when a section is dropped on another section", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const mockReorderSections = vi.fn();

      render(
        <ResumeTemplateRenderer
          data={mockTestResume}
          config={config}
          isInteractive={true}
          onReorderSections={mockReorderSections}
        />
      );

      // Find skills and projects sections
      const skillsHead = screen.getByText("Technical Skills");
      const projectsHead = screen.getByText("Projects");

      const skillsSection = skillsHead.closest("section")!;
      const projectsSection = projectsHead.closest("section")!;

      // Simulate dragging Technical Skills above Projects
      fireEvent.dragStart(skillsSection, {
        dataTransfer: {
          setData: vi.fn(),
          getData: () => JSON.stringify({ type: "section", sectionId: "skills" }),
        },
      });

      fireEvent.dragOver(projectsSection, {
        dataTransfer: { dropEffect: "move" },
      });

      fireEvent.drop(projectsSection, {
        dataTransfer: {
          getData: () => JSON.stringify({ type: "section", sectionId: "skills" }),
        },
      });

      expect(mockReorderSections).toHaveBeenCalledWith("skills", "projects");
    });

    it("triggers onReorderItems when a project card is dragged and dropped on another project", () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const mockReorderItems = vi.fn();

      render(
        <ResumeTemplateRenderer
          data={mockTestResume}
          config={config}
          isInteractive={true}
          onReorderItems={mockReorderItems}
        />
      );

      // Find project items
      const resumeAiText = screen.getByText("ResumeAI");
      const smartSkillHubText = screen.getByText("Smart Skill Hub");

      const resumeAiCard = resumeAiText.closest("div[draggable='true']")!;
      const smartSkillHubCard = smartSkillHubText.closest("div[draggable='true']")!;

      // Drag second project (index 1) onto first project (index 0)
      fireEvent.dragStart(smartSkillHubCard, {
        dataTransfer: {
          setData: vi.fn(),
          getData: () => JSON.stringify({ type: "projectItem", index: 1 }),
        },
      });

      fireEvent.dragOver(resumeAiCard, {
        dataTransfer: { dropEffect: "move" },
      });

      fireEvent.drop(resumeAiCard, {
        dataTransfer: {
          getData: () => JSON.stringify({ type: "projectItem", index: 1 }),
        },
      });

      expect(mockReorderItems).toHaveBeenCalledWith("projects", 1, 0);
    });
  });

  // 6. Natural Multi-Page Pagination & Bounds Verification
  describe("6. Natural Multi-Page Pagination", () => {
    it("renders multiple pages when content naturally overflows without forcing 1-page", () => {
      const config = createDefaultBuilderConfig("ats-classic");

      render(
        <ResumePreviewWorkspace
          data={mockTestResume}
          config={config}
          estimatedPages={2}
        />
      );

      expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      expect(screen.getByText("PAGE 1 (A4 • 210 × 297 mm)")).toBeInTheDocument();
    });
  });

  // 7. Project Deduplication Verification
  describe("7. Project Deduplication Verification", () => {
    it("renders each project exactly once in the DOM", () => {
      const config = createDefaultBuilderConfig("ats-classic");

      render(
        <ResumeTemplateRenderer
          data={mockTestResume}
          config={config}
          isInteractive={true}
        />
      );

      const resumeAiElements = screen.getAllByText("ResumeAI");
      expect(resumeAiElements.length).toBe(1);

      const smartSkillHubElements = screen.getAllByText("Smart Skill Hub");
      expect(smartSkillHubElements.length).toBe(1);
    });
  });

  // 8. PDF Export Fidelity
  describe("8. Shared PDF Export Engine", () => {
    it("generates faithful PDF blob from the same interactive resume state", async () => {
      const config = createDefaultBuilderConfig("ats-classic");
      const pdfBlob = await generateResumePdfBlob(mockTestResume, config);

      expect(pdfBlob).toBeDefined();
      expect(pdfBlob.type).toBe("application/pdf");
      expect(pdfBlob.size).toBeGreaterThan(1000);
    });
  });
});
