import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SpacedRevisionWidget from "../modules/skills/components/SpacedRevisionWidget";
import VideoPlayer from "../modules/edutube/components/VideoPlayer";
import VideoCheckpointsList from "../modules/edutube/components/VideoCheckpointsList";
import { SmartSkillApi } from "../lib/api";
import { EduTubeApi } from "../modules/edutube/services/edutube.api";

// Mock Sonner Toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe("Phase 39: Frontend Spaced Revision & Interactive Video Checkpoints Suite", () => {
  let queryClient: QueryClient;

  const mockDueItems = [
    {
      _id: "rev_1",
      targetId: "target_docker_arch",
      skill: "Docker",
      canonicalName: "Docker",
      targetConcept: "Container vs VM Isolation",
      promptQuestion: "Explain the difference between namespace isolation and hypervisor virtualization.",
      status: "pending",
      stage: 1,
      intervalDays: 1,
      scheduledDate: new Date().toISOString(),
      attemptsCount: 1,
      consecutiveSuccesses: 1,
      lastScore: 90,
      resourceType: "video",
      resourceId: "gAkwW2tuIqE",
    },
    {
      _id: "rev_2",
      targetId: "target_react_hooks",
      skill: "React",
      canonicalName: "React",
      targetConcept: "useEffect Dependencies",
      promptQuestion: "What happens when an object reference is passed directly into useEffect dependencies without useMemo?",
      status: "needs_reinforcement",
      stage: 1,
      intervalDays: 1,
      scheduledDate: new Date().toISOString(),
      attemptsCount: 2,
      consecutiveSuccesses: 0,
      lastScore: 40,
    },
  ];

  const mockUpcomingItems = [
    {
      _id: "rev_3",
      targetId: "target_ts_generics",
      skill: "TypeScript",
      canonicalName: "TypeScript",
      targetConcept: "Generic Constraints",
      promptQuestion: "How do you constrain a generic type parameter T to have an id property?",
      status: "pending",
      stage: 2,
      intervalDays: 3,
      scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      attemptsCount: 2,
      consecutiveSuccesses: 2,
      lastScore: 100,
    },
  ];

  const mockCheckpoints = [
    {
      checkpointId: "cp_docker_01",
      videoId: "gAkwW2tuIqE",
      timestampSeconds: 60,
      question: "How do Docker containers share resources with the host OS?",
      options: [
        "Containers run separate guest kernels via hypervisors",
        "Containers share the host OS kernel and use cgroups and namespaces for isolation",
        "Containers emulate host CPU hardware instructions",
        "Containers require virtual disk images with full OS installations",
      ],
      conceptKey: "Docker Isolation",
      skill: "Docker",
      canonicalName: "Docker",
      difficulty: "beginner",
    },
    {
      checkpointId: "cp_docker_02",
      videoId: "gAkwW2tuIqE",
      timestampSeconds: 180,
      question: "What is the primary function of Linux cgroups in Docker?",
      options: [
        "Encrypt network packets between containers",
        "Limit, account for, and isolate resource usage (CPU, memory, disk I/O)",
        "Provide domain name resolution for containers",
        "Compile Dockerfiles into machine binaries",
      ],
      conceptKey: "Linux cgroups",
      skill: "Docker",
      canonicalName: "Docker",
      difficulty: "intermediate",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.spyOn(EduTubeApi, "getProgress").mockResolvedValue(null as any);
    vi.spyOn(EduTubeApi, "recordHistory").mockResolvedValue({} as any);
    vi.spyOn(EduTubeApi, "saveProgress").mockResolvedValue({} as any);
  });

  describe("Feature A & B: SpacedRevisionWidget", () => {
    it("1. Renders due and upcoming revision queue items with status badges", async () => {
      vi.spyOn(SmartSkillApi, "getRevisionQueue").mockResolvedValue({
        due: mockDueItems,
        upcoming: mockUpcomingItems,
        stats: {
          dueTodayCount: 2,
          upcomingCount: 1,
          needsReinforcementCount: 1,
          totalScheduled: 3,
        },
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SpacedRevisionWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Adaptive Spaced Revision")).toBeInTheDocument();
      });

      expect(screen.getByText(/Container vs VM Isolation/)).toBeInTheDocument();
      expect(screen.getByText(/useEffect Dependencies/)).toBeInTheDocument();
      expect(screen.getByText("Needs Reinforcement")).toBeInTheDocument();

      // Switch to Upcoming tab
      const upcomingTab = screen.getByRole("button", { name: /Upcoming/i });
      fireEvent.click(upcomingTab);

      await waitFor(() => {
        expect(screen.getByText(/Generic Constraints/i)).toBeDefined();
      });
    });

    it("2. Practice retrieval flow: self-evaluating a prompt records attempt and shows next interval", async () => {
      vi.spyOn(SmartSkillApi, "getRevisionQueue").mockResolvedValue({
        due: mockDueItems,
        upcoming: mockUpcomingItems,
        stats: {
          dueTodayCount: 2,
          upcomingCount: 1,
          needsReinforcementCount: 1,
          totalScheduled: 3,
        },
      } as any);

      const reviewSpy = vi.spyOn(SmartSkillApi, "reviewRevisionAttempt").mockResolvedValue({
        item: {
          ...mockDueItems[0],
          stage: 2,
          intervalDays: 3,
          consecutiveSuccesses: 2,
          status: "pending",
        },
        passed: true,
        newIntervalDays: 3,
        rationale: "Correct answer extends retrieval interval to 3 days",
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SpacedRevisionWidget />
          </BrowserRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Container vs VM Isolation/i)).toBeDefined();
      });

      // Click "Practice Retrieval" on the first item
      const practiceButtons = screen.getAllByRole("button", { name: /Practice Retrieval/i });
      fireEvent.click(practiceButtons[0]);

      // Verify question is visible in active modal
      await waitFor(() => {
        expect(screen.getByText(/Explain the difference between namespace isolation/i)).toBeDefined();
      });

      // Select rating "Good - Solid Recall" (score 85)
      const goodRatingBtn = screen.getByRole("button", { name: /Good - Solid Recall/i });
      fireEvent.click(goodRatingBtn);

      // Click "Complete Retrieval"
      const completeBtn = screen.getByRole("button", { name: /Complete Retrieval/i });
      fireEvent.click(completeBtn);

      await waitFor(() => {
        expect(reviewSpy).toHaveBeenCalledWith("rev_1", expect.objectContaining({
          score: 85,
        }));
      });
    });
  });

  describe("Feature C & D: Interactive Video Player Checkpoints", () => {
    it("3. Detects checkpoint at target timestamp and presents interactive quiz overlay", async () => {
      vi.spyOn(SmartSkillApi, "getVideoCheckpoints").mockResolvedValue(mockCheckpoints as any);

      render(
        <QueryClientProvider client={queryClient}>
          <VideoPlayer
            videoId="gAkwW2tuIqE"
            title="Docker Crash Course"
            onBack={() => {}}
            seekToSeconds={60}
          />
        </QueryClientProvider>
      );

      // Timeline badge shows 2 checkpoints
      await waitFor(() => {
        expect(screen.getByText(/Interactive Checkpoints \(2\):/i)).toBeDefined();
      });

      // Checkpoint overlay appears at timestamp 60
      await waitFor(() => {
        expect(screen.getByText(/Docker Concept Check/i)).toBeDefined();
        expect(screen.getByText("How do Docker containers share resources with the host OS?")).toBeDefined();
      });
    });

    it("4. Submitting checkpoint answer displays immediate correctness feedback and allows resuming playback", async () => {
      vi.spyOn(SmartSkillApi, "getVideoCheckpoints").mockResolvedValue(mockCheckpoints as any);
      const submitSpy = vi.spyOn(SmartSkillApi, "submitVideoCheckpoint").mockResolvedValue({
        isCorrect: true,
        explanation: "Containers share the host Linux kernel directly via namespaces.",
        correctOptionIndex: 1,
        selectedOptionIndex: 1,
        consecutiveSuccesses: 1,
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
      } as any);

      render(
        <QueryClientProvider client={queryClient}>
          <VideoPlayer
            videoId="gAkwW2tuIqE"
            title="Docker Crash Course"
            onBack={() => {}}
            seekToSeconds={60}
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("How do Docker containers share resources with the host OS?")).toBeDefined();
      });

      // Select option 1 (index 1: "Containers share the host OS kernel...")
      const optionBtn = screen.getByText(/Containers share the host OS kernel and use cgroups/i);
      fireEvent.click(optionBtn);

      // Submit answer
      const submitBtn = screen.getByRole("button", { name: /Submit Answer/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith("gAkwW2tuIqE", "cp_docker_01", expect.objectContaining({
          selectedOptionIndex: 1,
        }));
        expect(screen.getByText("Correct! Spaced Revision schedule updated.")).toBeDefined();
        expect(screen.getByText(/Containers share the host Linux kernel directly/i)).toBeDefined();
      });

      // Click "Resume Playback"
      const resumeBtn = screen.getByRole("button", { name: /Resume Playback/i });
      fireEvent.click(resumeBtn);

      // Checkpoint overlay closes
      await waitFor(() => {
        expect(screen.queryByText(/Docker Concept Check/i)).toBeNull();
      });
    });
  });

  describe("Feature E & F: VideoCheckpointsList", () => {
    it("5. Lists checkpoints with jump-to-seek and expandable practice questions", async () => {
      vi.spyOn(SmartSkillApi, "getVideoCheckpoints").mockResolvedValue(mockCheckpoints as any);
      const onSeekMock = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <VideoCheckpointsList
            videoId="gAkwW2tuIqE"
            onSeekTo={onSeekMock}
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Interactive Checkpoints (2)")).toBeDefined();
        expect(screen.getByText("1:00")).toBeDefined();
        expect(screen.getByText("3:00")).toBeDefined();
      });

      // Click "Jump to video timestamp" button on the first checkpoint
      const jumpButtons = screen.getAllByTitle(/Jump to video timestamp/i);
      fireEvent.click(jumpButtons[0]);

      expect(onSeekMock).toHaveBeenCalledWith(60);

      // Click the checkpoint header to expand
      const checkpointItem = screen.getByText("How do Docker containers share resources with the host OS?");
      fireEvent.click(checkpointItem);

      await waitFor(() => {
        expect(screen.getByText(/Containers share the host OS kernel and use cgroups/i)).toBeDefined();
        expect(screen.getByRole("button", { name: /Check Answer/i })).toBeDefined();
      });
    });
  });
});
