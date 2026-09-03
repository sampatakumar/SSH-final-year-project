import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartMentorPage } from "../modules/mentor/pages/SmartMentorPage";
import { SmartMentorApi } from "../modules/mentor/services/smartMentor.api";
import { MentorMessage } from "../modules/mentor/components/MentorMessage";
import { MentorActionCard } from "../modules/mentor/components/MentorActionCard";
import type { MentorContextData } from "../modules/mentor/types/smartMentor.types";

const mockContext: MentorContextData = {
  career: {
    name: "Sampat",
    targetRole: "Full Stack Developer",
    headline: "Full Stack Engineer",
    readinessScore: 82,
    education: ["B.Tech in Computer Science"],
    experienceYears: "2 years",
  },
  skills: [
    { name: "React", level: "Proficient", score: 88, category: "Frontend" },
    { name: "Node.js", level: "Proficient", score: 85, category: "Backend" },
  ],
  skillGaps: [
    {
      skill: "Docker",
      priority: "Critical",
      currentScore: 35,
      targetScore: 80,
      reason: "Essential for microservices deployment",
    },
  ],
  roadmap: [],
  github: {
    username: "sampatakumar",
    hasAnalysis: true,
    repositoryCount: 14,
    repositoriesWithoutDescription: 3,
    repositoriesWithoutReadme: 2,
    reposWithoutDescList: ["Repo-A", "Repo-B"],
    reposWithoutReadmeList: ["Repo-X", "Repo-Y"],
    topLanguages: ["TypeScript", "JavaScript"],
    totalStars: 12,
    optimizationScore: 78,
    strengths: ["Strong commit frequency"],
    weaknesses: ["Missing README in 2 repos"],
    readmeQualityTips: [],
    portfolioTips: [],
  },
  learning: {
    videosWatched: 18,
    completedVideos: 6,
    savedCount: 4,
    playlistsCount: 2,
    recentTopics: ["React 19 Hooks", "Node.js Streams"],
    continueLearningTitle: "Docker Full Course",
  },
  projects: [
    {
      name: "Smart Skill Hub",
      description: "AI-powered career hub",
      technologies: ["React", "Node.js"],
      hasGithubUrl: true,
      hasDemoUrl: true,
    },
  ],
  resume: {
    resumeCount: 2,
    hasSummary: true,
    hasExperience: true,
    hasEducation: true,
  },
  coding: {
    totalSubmissions: 25,
    passedCount: 20,
  },
  insights: [
    "⚠️ 3 of your GitHub repositories currently lack descriptions.",
    "📈 Docker is currently your highest-priority skill gap (Critical priority) for Full Stack Developer.",
    "🎓 You have completed 6 lessons and watched 18 video modules on EduTube.",
  ],
  updatedAt: new Date().toISOString(),
};

describe("Smart Mentor Frontend Test Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SmartMentorPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("1. Renders Smart Mentor header, proactive insights banner, and live context signals", async () => {
    vi.spyOn(SmartMentorApi, "getContext").mockResolvedValue(mockContext);
    vi.spyOn(SmartMentorApi, "getHistory").mockResolvedValue([]);

    renderComponent();

    expect(screen.getAllByText("Smart Mentor")[0]).toBeInTheDocument();
    expect(screen.getByText("AI Career Guide")).toBeInTheDocument();

    await waitFor(() => {
      // Proactive observations banner
      expect(screen.getByText("Smart Mentor Live Observations")).toBeInTheDocument();
      expect(
        screen.getByText(/3 of your GitHub repositories currently lack descriptions/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Docker is currently your highest-priority skill gap/i)
      ).toBeInTheDocument();

      // Right Context Panel
      expect(screen.getByText("Live Profile Signals")).toBeInTheDocument();
      expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
      expect(screen.getByText("82%")).toBeInTheDocument();
      expect(screen.getByText("14")).toBeInTheDocument(); // repo count
      expect(screen.getByText("18")).toBeInTheDocument(); // watched
      expect(screen.getByText("6")).toBeInTheDocument(); // completed
    });
  });

  it("2. Renders suggestion prompt chips and user can trigger chat interaction", async () => {
    vi.spyOn(SmartMentorApi, "getContext").mockResolvedValue(mockContext);
    vi.spyOn(SmartMentorApi, "getHistory").mockResolvedValue([]);

    const streamSpy = vi
      .spyOn(SmartMentorApi, "streamChatMessage")
      .mockImplementation(async (msg, callbacks) => {
        callbacks.onStart?.("groq");
        callbacks.onChunk?.("Your GitHub profile shows 14 repositories. You have 3 missing descriptions.");
        callbacks.onDone?.({
          source: "groq",
          summary: "GitHub review complete",
          actions: [
            {
              title: "Add README to Repo-X",
              priority: "high",
              category: "github",
              estimatedMinutes: 30,
              route: "/dashboard/github",
            },
          ],
          references: [],
        });
      });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Review my GitHub profile & repos")).toBeInTheDocument();
    });

    const chip = screen.getByText("Review my GitHub profile & repos");
    fireEvent.click(chip);

    await waitFor(() => {
      expect(streamSpy).toHaveBeenCalledWith(
        "Review my GitHub profile & repos",
        expect.any(Object),
        expect.any(AbortSignal)
      );
      expect(
        screen.getByText(/Your GitHub profile shows 14 repositories/i)
      ).toBeInTheDocument();
      expect(screen.getByText("Add README to Repo-X")).toBeInTheDocument();
    });
  });

  it("3. Renders MentorActionCard and clicking action button initiates navigation", () => {
    render(
      <MemoryRouter>
        <MentorActionCard
          action={{
            title: "Close Docker Skill Gap",
            priority: "critical",
            category: "skills",
            estimatedMinutes: 45,
            route: "/dashboard/gaps",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Close Docker Skill Gap")).toBeInTheDocument();
    expect(screen.getByText("critical")).toBeInTheDocument();
    expect(screen.getByText("45 mins")).toBeInTheDocument();
    expect(screen.getByText("Open Skill Gaps")).toBeInTheDocument();
  });

  it("4. Renders MentorMessage with Local Engine badge when source is local_nlp", () => {
    render(
      <MemoryRouter>
        <MentorMessage
          message={{
            role: "assistant",
            content: "Local fallback response with **grounded** details.",
            source: "local_nlp",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Smart Mentor")).toBeInTheDocument();
    expect(screen.getByText("Local Engine")).toBeInTheDocument();
    expect(screen.getByText(/Local fallback response with/i)).toBeInTheDocument();
  });
});
