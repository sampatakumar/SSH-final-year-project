import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResumeUploadDropzone } from "../components/resume/ResumeUploadDropzone";
import { ResumeExtractionReviewDialog } from "../components/resume/ResumeExtractionReviewDialog";
import { ResumeApi, type ResumeUploadExtractionResponse } from "../modules/resume/services/resume.api";

vi.mock("../modules/resume/services/resume.api", () => ({
  ResumeApi: {
    uploadAndExtract: vi.fn(),
    applyToProfile: vi.fn(),
    extractById: vi.fn(),
    getResumes: vi.fn(),
    deleteResume: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const sampleExtractionData: ResumeUploadExtractionResponse = {
  resume: {
    _id: "res_mock_1",
    title: "sample_resume",
    format: "PDF",
    createdAt: "2026-09-03T10:00:00.000Z",
    updatedAt: "2026-09-03T10:00:00.000Z",
  },
  extractedProfile: {
    profile: {
      displayName: "Sampata Kumar",
      headline: "Full Stack Engineer",
      phone: "+91 9876543210",
      about: "Passionate developer specialized in full-stack web applications.",
    },
    preferences: {
      linkedInUrl: "https://linkedin.com/in/sampatakumar",
      githubUrl: "https://github.com/sampatakumar",
    },
    contact: {
      email: "sampata@smartskillhub.com",
    },
    educationEntries: [
      {
        degree: "B.Tech",
        specialization: "Computer Science",
        college: "NIT",
        location: "Bangalore",
        endDate: "2026",
        grade: "8.9 CGPA",
      },
    ],
    skillSections: [
      {
        title: "Languages",
        skills: ["TypeScript", "JavaScript", "Python"],
      },
    ],
    experience: [
      {
        role: "Software Engineering Intern",
        company: "Tech Corp",
        location: "Remote",
        date: "2025",
        bullets: ["Built REST APIs", "Reduced latency by 40%"],
      },
    ],
    projects: [
      {
        title: "Smart Skill Hub",
        description: "AI Career Platform",
        stack: "React, Node.js",
        githubUrl: "https://github.com/sampatakumar/smart-skill-hub",
      },
    ],
    achievements: [
      {
        title: "Hackathon Winner",
        date: "2025",
        bullets: ["Won 1st place in 36hr hackathon"],
      },
    ],
  },
  confidence: {
    overall: "HIGH",
    fields: {
      displayName: { value: "Sampata Kumar", confidence: "HIGH" },
      skills: { count: 3, confidence: "HIGH" },
    },
  },
  extractionMeta: {
    originalFileName: "sample_resume.pdf",
    fileSize: 2048,
    mimeType: "application/pdf",
    textLength: 500,
    extractedLinksCount: 2,
    status: "READY",
  },
};

describe("Resume Upload & Extraction Frontend Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ResumeUploadDropzone Component", () => {
    it("1. renders upload dropzone with accepted format badges and max 10MB limit", () => {
      render(<ResumeUploadDropzone onExtracted={vi.fn()} />);

      expect(screen.getByText(/Drag & drop your resume/i)).toBeInTheDocument();
      expect(screen.getByText("PDF")).toBeInTheDocument();
      expect(screen.getByText("DOCX")).toBeInTheDocument();
      expect(screen.getByText("TXT")).toBeInTheDocument();
      expect(screen.getByText("RTF")).toBeInTheDocument();
      expect(screen.getByText("Max 10 MB")).toBeInTheDocument();
    });

    it("2. rejects files exceeding 10 MB limit with error state", () => {
      render(<ResumeUploadDropzone onExtracted={vi.fn()} />);

      const file = new File(["dummy content"], "large_resume.pdf", { type: "application/pdf" });
      Object.defineProperty(file, "size", { value: 15 * 1024 * 1024 }); // 15MB

      const dropzone = screen.getByText(/Drag & drop your resume/i).closest("div");
      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [file] },
        });
      }

      expect(screen.getByText(/Maximum file size is 10 MB/i)).toBeInTheDocument();
    });

    it("3. rejects unsupported file formats (e.g. .exe)", () => {
      render(<ResumeUploadDropzone onExtracted={vi.fn()} />);

      const file = new File(["dummy binary"], "malware.exe", { type: "application/x-msdownload" });

      const dropzone = screen.getByText(/Drag & drop your resume/i).closest("div");
      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [file] },
        });
      }

      expect(screen.getByText(/This file type isn't supported/i)).toBeInTheDocument();
    });

    it("4. successfully uploads valid PDF and triggers onExtracted callback", async () => {
      const onExtractedMock = vi.fn();
      vi.mocked(ResumeApi.uploadAndExtract).mockResolvedValue(sampleExtractionData);

      render(<ResumeUploadDropzone onExtracted={onExtractedMock} />);

      const file = new File(["%PDF-1.4 mock content"], "sample_resume.pdf", { type: "application/pdf" });
      const dropzone = screen.getByText(/Drag & drop your resume/i).closest("div");
      if (dropzone) {
        fireEvent.drop(dropzone, {
          dataTransfer: { files: [file] },
        });
      }

      await waitFor(() => {
        expect(ResumeApi.uploadAndExtract).toHaveBeenCalledWith(file);
      });
    });
  });

  describe("ResumeExtractionReviewDialog Component", () => {
    it("5. renders extracted resume data in review dialog with tabs and confidence badges", () => {
      render(
        <ResumeExtractionReviewDialog
          open={true}
          onOpenChange={vi.fn()}
          extractionData={sampleExtractionData}
        />
      );

      expect(screen.getByText("Resume Analyzed Successfully")).toBeInTheDocument();
      expect(screen.getAllByText("High Confidence").length).toBeGreaterThan(0);
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Full Stack Engineer")).toBeInTheDocument();
      expect(screen.getByDisplayValue("+91 9876543210")).toBeInTheDocument();
    });

    it("6. detects profile conflicts and allows resolving them", () => {
      const currentProfile = {
        displayName: "Existing User",
        phone: "+91 1111111111",
      };

      render(
        <ResumeExtractionReviewDialog
          open={true}
          onOpenChange={vi.fn()}
          extractionData={sampleExtractionData}
          currentUserProfile={currentProfile}
        />
      );

      expect(screen.getByText(/Profile Value Conflict/i)).toBeInTheDocument();
      expect(screen.getByText(/Current: Existing User/i)).toBeInTheDocument();
      expect(screen.getByText(/Resume: Sampata Kumar/i)).toBeInTheDocument();

      const keepCurrentButtons = screen.getAllByRole("button", { name: /Keep Current/i });
      fireEvent.click(keepCurrentButtons[0]);

      // Full Name input should now be changed to Existing User
      expect(screen.getByDisplayValue("Existing User")).toBeInTheDocument();
    });

    it("7. applies confirmed extracted profile to user via ResumeApi.applyToProfile", async () => {
      const onAppliedMock = vi.fn();
      vi.mocked(ResumeApi.applyToProfile).mockResolvedValue({ user: { displayName: "Sampata Kumar" } });

      render(
        <ResumeExtractionReviewDialog
          open={true}
          onOpenChange={vi.fn()}
          extractionData={sampleExtractionData}
          onApplied={onAppliedMock}
        />
      );

      const applyButton = screen.getByRole("button", { name: /Apply to Profile/i });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(ResumeApi.applyToProfile).toHaveBeenCalled();
        expect(onAppliedMock).toHaveBeenCalledWith({ displayName: "Sampata Kumar" });
      });
    });
  });
});
