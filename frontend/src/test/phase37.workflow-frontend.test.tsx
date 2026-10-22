import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { UserOverview } from "../modules/github/components/UserOverview";
import type { GitHubAnalysisData } from "../modules/github/types/github.types";

// Mock Monaco Editor for CodingAssessmentPage
vi.mock("@monaco-editor/react", () => ({
  default: ({ language, value, onChange }: any) => (
    <textarea
      data-testid="monaco-editor"
      data-language={language}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

// Mock Auth Context
vi.mock("../core/auth/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "test-user-123", email: "student@example.com", displayName: "Test Student" },
    loading: false,
  }),
}));

describe("Phase 37 Frontend Workflow Integration", () => {
  describe("Feature A: GitHub Analysis to Skill Profile - UserOverview Component", () => {
    const mockData: any = {
      profile: {
        username: "testdev",
        name: "Test Developer",
        avatarUrl: "https://example.com/avatar.png",
        bio: "Full Stack Engineer",
        location: "San Francisco",
        company: "Acme",
        blog: "https://testdev.io",
        createdAt: "2021-01-15T00:00:00Z",
        publicRepos: 12,
        followers: 45,
        following: 20,
      },
      aggregateStats: {
        totalStars: 15,
        totalForks: 4,
        totalIssues: 2,
        totalPRs: 5,
        totalCommits: 230,
        primaryLanguage: "TypeScript",
      },
      languages: [
        { name: "TypeScript", percentage: 70, bytes: 70000, color: "#3178c6" },
        { name: "Python", percentage: 30, bytes: 30000, color: "#3572A5" },
      ],
      skillSync: {
        synced: true,
        lastSyncedAt: new Date().toISOString(),
        skillsCount: 2,
      },
    };

    it("renders 'Skill Profile Synced' badge when skillSync.synced is true and isConnected is true", () => {
      render(
        <UserOverview
          data={mockData}
          isConnected={true}
          onSyncSkills={vi.fn()}
          onOpenCompare={vi.fn()}
          onOpenExport={vi.fn()}
        />
      );
      expect(screen.getByText(/Skill Profile Synced/i)).toBeDefined();
    });

    it("renders 'Sync Skill Profile' button and triggers onSyncSkills on click", () => {
      const handleSync = vi.fn();
      render(
        <UserOverview
          data={mockData}
          isConnected={true}
          onSyncSkills={handleSync}
          isSyncingSkills={false}
          onOpenCompare={vi.fn()}
          onOpenExport={vi.fn()}
        />
      );
      const syncBtn = screen.getByRole("button", { name: /Sync Skill Profile/i });
      expect(syncBtn).toBeDefined();

      fireEvent.click(syncBtn);
      expect(handleSync).toHaveBeenCalledTimes(1);
    });

    it("shows 'Syncing Skills...' when isSyncingSkills is true", () => {
      render(
        <UserOverview
          data={mockData}
          isConnected={true}
          onSyncSkills={vi.fn()}
          isSyncingSkills={true}
          onOpenCompare={vi.fn()}
          onOpenExport={vi.fn()}
        />
      );
      expect(screen.getByText(/Syncing Skills\.\.\./i)).toBeDefined();
    });
  });

  describe("Feature D: Onboarding Branding Check", () => {
    it("ensures Onboarding Flow source file does not contain 'Welcome to ResumeAI' and uses 'Smart Skill Hub'", async () => {
      // Direct source string check to guarantee no regressions in branding
      const fs = await import("fs");
      const path = await import("path");
      const onboardingPath = path.resolve(__dirname, "../pages/OnboardingFlow.tsx");
      const content = fs.readFileSync(onboardingPath, "utf-8");

      expect(content).not.toContain("Welcome to ResumeAI");
      expect(content).toContain("Welcome to Smart Skill Hub!");
    });
  });

  describe("Feature E: Coding Assessment Language Selector & Templates", () => {
    it("renders CodingAssessmentPage with JavaScript, Python, and TypeScript options", async () => {
      const CodingAssessmentPage = (await import("../modules/coding/CodingAssessmentPage")).default;
      const { SmartSkillApi } = await import("../lib/api");

      vi.spyOn(SmartSkillApi, "getCodingTasks").mockResolvedValue([
        { id: "two-sum", title: "Two Sum", difficulty: "Easy", category: "Algorithms", points: 100 },
      ]);
      vi.spyOn(SmartSkillApi, "getTaskDetail").mockResolvedValue({
        id: "two-sum",
        title: "Two Sum",
        difficulty: "Easy",
        category: "Algorithms",
        points: 100,
        description: "Find two numbers.",
        examples: [],
        sampleTests: [],
        starterTemplates: {
          javascript: "function twoSum(nums, target) {}",
          python: "def two_sum(nums, target):",
          typescript: "function twoSum(nums: number[], target: number): number[] {}",
        },
      });
      vi.spyOn(SmartSkillApi, "getSandboxStatus").mockResolvedValue({ dockerAvailable: true });

      render(
        <BrowserRouter>
          <CodingAssessmentPage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "JavaScript" })).toBeDefined();
        expect(screen.getByRole("button", { name: "Python" })).toBeDefined();
        expect(screen.getByRole("button", { name: "TypeScript" })).toBeDefined();
      });

      // Switch to Python
      const pythonBtn = screen.getByRole("button", { name: "Python" });
      fireEvent.click(pythonBtn);

      await waitFor(() => {
        const editor = screen.getByTestId("monaco-editor");
        expect(editor.getAttribute("data-language")).toBe("python");
      });

      // Switch to TypeScript
      const tsBtn = screen.getByRole("button", { name: "TypeScript" });
      fireEvent.click(tsBtn);

      await waitFor(() => {
        const editor = screen.getByTestId("monaco-editor");
        expect(editor.getAttribute("data-language")).toBe("typescript");
      });
    });
  });

  describe("Feature B: Persistent Learning Roadmap Milestones API", () => {
    it("updateRoadmapMilestoneStatus sends PATCH request with correct recommendation ID and status", async () => {
      const { SmartSkillApi } = await import("../lib/api");
      const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { recommendationId: "rec_123", status: "completed", isCompleted: true },
        }),
      } as any);

      const result = await SmartSkillApi.updateRoadmapMilestoneStatus("rec_123", "completed", {
        skill: "Docker",
      });

      expect(result.isCompleted).toBe(true);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/recommendations/item/rec_123"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "completed", skill: "Docker" }),
        })
      );
    });
  });
});

