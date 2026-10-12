import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AiResumeAssistant } from "../modules/resume/ai/AiResumeAssistant";
import { ResumeExtractionReviewDialog } from "../components/resume/ResumeExtractionReviewDialog";
import { ResumeApi } from "../modules/resume/services/resume.api";
import { createDefaultBuilderConfig } from "../modules/resume/templates/TemplateRegistry";
import type { ResumeData } from "../modules/resume/templates/types";

// Mock sample resume data
const mockSampleData: ResumeData = {
  fullName: "Jane Doe",
  email: "jane.doe@example.com",
  phone: "+1 555-0199",
  location: "San Francisco, CA",
  github: "https://github.com/janedoe",
  linkedin: "https://linkedin.com/in/janedoe",
  website: "https://janedoe.dev",
  professionalSummary: "experienced developer looking for a good opportunity to code.",
  education: [
    {
      school: "UC Berkeley",
      location: "Berkeley, CA",
      degree: "B.S. Computer Science",
      date: "2018 - 2022",
    },
  ],
  experience: [
    {
      company: "Acme Corp",
      location: "San Francisco, CA",
      role: "Software Engineer",
      date: "2022 - Present",
      bullets: [
        "helped team build the web portal",
        "wrote python scripts for data migration",
      ],
    },
  ],
  projects: [
    {
      name: "Skill Hub",
      technologies: "React, TypeScript, Node.js",
      githubUrl: "https://github.com/janedoe/skill-hub",
      bullets: [
        "built the backend with express and mongodb",
        "utilized redis caching for fast responses",
      ],
    },
  ],
  skills: {
    languages: ["JavaScript", "TypeScript", "Python"],
    frameworks: ["React", "Node.js", "Express"],
  },
  achievements: [],
  customSections: [],
  config: createDefaultBuilderConfig("ats-classic"),
};

describe("Resume AI Intelligence Upgrade Frontend Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Live Resume AI Copilot Chat Interface", () => {
    it("renders Copilot tab with draft context badge and prompt chips", () => {
      render(
        <AiResumeAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
        />
      );

      // Verify title & Live Draft badge
      expect(screen.getByText("AI Resume Assistant")).toBeInTheDocument();
      expect(screen.getByText("Live Draft Copilot")).toBeInTheDocument();

      // Verify quick prompt chips
      expect(screen.getByText("Review my current resume")).toBeInTheDocument();
      expect(screen.getByText("Find grammar and spelling mistakes")).toBeInTheDocument();
      expect(screen.getByText("Strengthen project bullets with metrics")).toBeInTheDocument();
    });

    it("sends query to ResumeApi.chatWithCopilot and displays assistant reply", async () => {
      const mockChatResponse = {
        success: true,
        data: {
          reply: "Your resume has solid project foundations! Consider capitalizing initial bullets and quantifying impact.",
          groundedFactsUsed: ["React", "TypeScript", "UC Berkeley"],
          modelUsed: "groq-llama-3.3-70b-versatile",
          groundingConfidence: 0.95,
        },
      };

      vi.spyOn(ResumeApi, "chatWithCopilot").mockResolvedValue(mockChatResponse as any);

      render(
        <AiResumeAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/Ask anything about your resume/i);
      fireEvent.change(input, { target: { value: "How can I improve my project bullets?" } });

      const sendButton = screen.getByRole("button", { name: "" }); // icon button next to input
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(ResumeApi.chatWithCopilot).toHaveBeenCalledWith(
          mockSampleData,
          "How can I improve my project bullets?",
          expect.any(Array),
          undefined
        );
      });

      expect(
        await screen.findByText(/Your resume has solid project foundations!/i)
      ).toBeInTheDocument();
    });
  });

  describe("2. Writing & Grammar Review with Safe Application", () => {
    it("fetches language review and displays issues with original vs proposed diffs", async () => {
      const mockReviewResponse = {
        success: true,
        data: {
          issueCount: 2,
          issues: [
            {
              id: "lang-1",
              category: "LOWERCASE_BULLET",
              severity: "medium",
              section: "experience",
              originalText: "helped team build the web portal",
              proposedCorrection: "Helped team build the web portal",
              explanation: "Capitalize the first letter of bullet points for executive polish.",
              safeToApply: true,
            },
            {
              id: "lang-2",
              category: "WEAK_ACTION_VERB",
              severity: "medium",
              section: "summary",
              originalText: "experienced developer looking for a good opportunity to code.",
              proposedCorrection: "Experienced developer passionate about building high-performance systems.",
              explanation: "Replace generic statement with focused career goals.",
              safeToApply: true,
            },
          ],
        },
      };

      vi.spyOn(ResumeApi, "reviewLanguage").mockResolvedValue(mockReviewResponse as any);

      const onUpdateResume = vi.fn();

      render(
        <AiResumeAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
          onUpdateResume={onUpdateResume}
        />
      );

      // Switch to Writing & Grammar tab
      const grammarTab = screen.getByRole("button", { name: /Writing & Grammar/i });
      fireEvent.click(grammarTab);

      await waitFor(() => {
        expect(ResumeApi.reviewLanguage).toHaveBeenCalledWith(mockSampleData);
      });

      expect(await screen.findByText("helped team build the web portal")).toBeInTheDocument();
      expect(screen.getByText("Helped team build the web portal")).toBeInTheDocument();

      // Click "Apply Fix" on the first issue
      const applyButtons = screen.getAllByRole("button", { name: /Apply Fix/i });
      fireEvent.click(applyButtons[0]);

      expect(onUpdateResume).toHaveBeenCalledWith(
        expect.objectContaining({
          experience: expect.arrayContaining([
            expect.objectContaining({
              bullets: expect.arrayContaining(["Helped team build the web portal"]),
            }),
          ]),
        })
      );
    });
  });

  describe("3. Dual Scoring Rubric Tab", () => {
    it("renders dual scores (Quality Rating 0-100 & ATS Readiness 0-100) with category breakdowns", async () => {
      const mockScoreResponse = {
        success: true,
        data: {
          quality: {
            overallScore: 82,
            rubricVersion: "quality-v2.0-deterministic",
            categories: {
              writingQuality: { score: 16, maxScore: 20 },
              technicalSpecificity: { score: 18, maxScore: 20 },
              impactAndActionVerbs: { score: 14, maxScore: 20 },
              sectionOrganization: { score: 18, maxScore: 20 },
              completeness: { score: 16, maxScore: 20 },
            },
          },
          ats: {
            overallScore: 88,
            label: "HIGH_READINESS",
            rubricVersion: "ats-v2.0-deterministic",
            passedCount: 8,
            totalCount: 9,
          },
          recommendations: [
            {
              priority: 1,
              category: "impact",
              section: "experience",
              recommendation: "Quantify work accomplishments with measurable metrics",
              explanation: "Include percentages or volume metrics.",
            },
          ],
        },
      };

      vi.spyOn(ResumeApi, "evaluateScores").mockResolvedValue(mockScoreResponse as any);

      render(
        <AiResumeAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
        />
      );

      const scoresTab = screen.getByRole("button", { name: /Dual Scoring/i });
      fireEvent.click(scoresTab);

      await waitFor(() => {
        expect(ResumeApi.evaluateScores).toHaveBeenCalledWith(mockSampleData, undefined);
      });

      expect(await screen.findByText("Resume Quality Rating")).toBeInTheDocument();
      expect(screen.getAllByText("82")[0]).toBeInTheDocument();
      expect(screen.getAllByText("ATS Readiness Score")[0]).toBeInTheDocument();
      expect(screen.getAllByText("88")[0]).toBeInTheDocument();
      expect(screen.getByText(/Quantify work accomplishments with measurable metrics/i)).toBeInTheDocument();
    });
  });

  describe("4. Target Role & Job Description Analysis", () => {
    it("allows entering role and JD and displays matched vs missing skills", async () => {
      const mockRoleResponse = {
        success: true,
        data: {
          targetRole: "Full-Stack Developer",
          matchPercentage: 75,
          requiredSkillsMatched: ["react", "typescript"],
          missingRequiredSkills: ["docker", "kubernetes"],
          summary: "Strong frontend alignment with backend potential.",
        },
      };

      vi.spyOn(ResumeApi, "analyzeRole").mockResolvedValue(mockRoleResponse as any);

      render(
        <AiResumeAssistant
          open={true}
          onOpenChange={vi.fn()}
          data={mockSampleData}
          config={createDefaultBuilderConfig("ats-classic")}
          onSelectSection={vi.fn()}
        />
      );

      const roleTab = screen.getByRole("button", { name: /Target Role & JD/i });
      fireEvent.click(roleTab);

      const roleInput = screen.getByPlaceholderText(/e.g. Full-Stack Developer/i);
      fireEvent.change(roleInput, { target: { value: "Full-Stack Developer" } });

      const analyzeBtn = screen.getByRole("button", { name: /Analyze Match Against Resume/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(ResumeApi.analyzeRole).toHaveBeenCalledWith(
          mockSampleData,
          "Full-Stack Developer",
          ""
        );
      });

      expect(await screen.findByText("75%")).toBeInTheDocument();
      expect(screen.getByText("docker")).toBeInTheDocument();
      expect(screen.getByText("kubernetes")).toBeInTheDocument();
    });
  });

  describe("5. Uploaded Resume Review Dialog Integration", () => {
    it("renders AI Quality & ATS Audit tab and executes audit upon request", async () => {
      const mockExtractionData: any = {
        extractedProfile: {
          profile: { displayName: "Alex Smith", email: "alex@example.com" },
          educationEntries: [],
          skillSections: [],
          experience: [],
          projects: [],
          achievements: [],
        },
        confidence: { overall: "HIGH" },
        extractionMeta: { originalFileName: "Alex_Resume.pdf" },
      };

      const mockAuditResponse = {
        success: true,
        data: {
          qualityRating: { overallScore: 80, rubricVersion: "quality-v2.0-deterministic" },
          atsReadiness: { overallScore: 85, label: "HIGH_READINESS" },
          languageReview: { issues: [] },
        },
      };

      vi.spyOn(ResumeApi, "analyzeUploaded").mockResolvedValue(mockAuditResponse as any);

      render(
        <ResumeExtractionReviewDialog
          open={true}
          onOpenChange={vi.fn()}
          extractionData={mockExtractionData}
        />
      );

      // Verify AI Audit tab is listed
      const auditTab = screen.getByRole("button", { name: /AI Quality & ATS Audit/i });
      expect(auditTab).toBeInTheDocument();
      fireEvent.click(auditTab);

      // Click "Run AI Audit"
      const runAuditBtn = screen.getByRole("button", { name: /Run AI Audit/i });
      fireEvent.click(runAuditBtn);

      await waitFor(() => {
        expect(ResumeApi.analyzeUploaded).toHaveBeenCalledWith({ extractionData: mockExtractionData });
      });

      expect(await screen.findByText(/80 \/ 100/i)).toBeInTheDocument();
      expect(screen.getByText(/85 \/ 100/i)).toBeInTheDocument();
    });
  });
});
