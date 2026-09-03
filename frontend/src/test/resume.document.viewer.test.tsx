import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { resolveResumeViewerUrl } from "../lib/api";
import { ResumeDocumentViewer } from "../components/resume/ResumeDocumentViewer";

// Mock URL createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:http://localhost:8081/mock-blob-uuid");
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe("Resume Document Viewer & Storage Contract Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. resolves HTTPS signed URLs directly", () => {
    const resume = {
      _id: "res_123",
      filePath: "https://project.supabase.co/storage/v1/object/sign/resumes/my_resume.pdf?token=abc"
    };

    const url = resolveResumeViewerUrl(resume);
    expect(url).toBe("https://project.supabase.co/storage/v1/object/sign/resumes/my_resume.pdf?token=abc");
    expect(url.startsWith("https://")).toBe(true);
  });

  it("2. resolves internal supabase:// storage scheme to backend file proxy route", () => {
    const resume = {
      _id: "res_456",
      filePath: "supabase://resumes/user_123/170000-uuid-resume.pdf"
    };

    const url = resolveResumeViewerUrl(resume);
    expect(url).toContain("/api/v1/resumes/res_456/file");
    expect(url.startsWith("supabase://")).toBe(false);
  });

  it("3. handles missing or empty filePath by resolving to backend file endpoint", () => {
    const resume = {
      _id: "res_789",
      filePath: ""
    };

    const url = resolveResumeViewerUrl(resume);
    expect(url).toContain("/api/v1/resumes/res_789/file");
  });

  it("4. successfully fetches PDF blob and creates object URL for iframe", async () => {
    const mockBlob = new Blob(["%PDF-1.4 mock pdf data"], { type: "application/pdf" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    const resume = {
      _id: "res_100",
      title: "Senior Engineer Resume",
      format: "PDF",
      filePath: "/api/v1/resumes/res_100/file",
    };

    render(<ResumeDocumentViewer resume={resume} />);

    await waitFor(() => {
      const iframe = screen.getByTitle("Senior Engineer Resume");
      expect(iframe).toBeInTheDocument();
      expect(iframe.getAttribute("src")).toBe("blob:http://localhost:8081/mock-blob-uuid");
    });

    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
  });

  it("5. revokes object URL on unmount to prevent memory leaks", async () => {
    const mockBlob = new Blob(["%PDF-1.4 mock pdf data"], { type: "application/pdf" });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    const resume = {
      _id: "res_101",
      title: "Clean Lifecycle Resume",
      format: "PDF",
      filePath: "https://example.supabase.co/signed/resume.pdf",
    };

    const { unmount } = render(<ResumeDocumentViewer resume={resume} />);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    unmount();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:http://localhost:8081/mock-blob-uuid");
  });

  it("6. renders graceful fallback error state with Retry when storage is unreachable", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      blob: async () => new Blob([]),
    });

    const resume = {
      _id: "res_102",
      title: "Unavailable Storage Resume",
      format: "PDF",
      content: "John Doe - Software Engineer Experience...",
      filePath: "/api/v1/resumes/res_102/file",
    };

    render(<ResumeDocumentViewer resume={resume} />);

    await waitFor(() => {
      expect(screen.getByText("Unable to preview this document")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view extracted text/i })).toBeInTheDocument();
    });
  });
});
