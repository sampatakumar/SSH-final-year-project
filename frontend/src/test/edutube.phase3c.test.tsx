import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { PersonalizedFeed } from "../modules/edutube/components/PersonalizedFeed";
import { RecommendationCard } from "../modules/edutube/components/RecommendationCard";
import { LearningTrackDialog } from "../modules/edutube/components/LearningTrackDialog";
import { EduTubeApi } from "../modules/edutube/services/edutube.api";
import type { PersonalizedRecommendation, PersonalizedFeedData } from "../modules/edutube/types/edutube.types";

const mockVideoRec: PersonalizedRecommendation = {
  videoId: "dQw4w9WgXcQ",
  title: "Mastering Docker Containers for Full Stack Developers",
  description: "Complete hands-on guide to containerization",
  channelId: "UC123",
  channelTitle: "DevOps Academy",
  publishedAt: "2026-01-01T00:00:00Z",
  thumbnail: { default: "https://example.com/thumb.jpg" },
  embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  educationalScore: 95,
  personalizationScore: 92,
  whyRecommended: [
    "Addresses your Docker skill gap (Critical priority)",
    "Aligned with your Full Stack Developer career path",
  ],
  topic: "Docker",
};

const mockFeedData: PersonalizedFeedData = {
  personalized: [mockVideoRec],
  skillGaps: [
    {
      ...mockVideoRec,
      videoId: "v_gap_1",
      title: "Docker Zero to Hero Crash Course",
      whyRecommended: ["Addresses your Docker skill gap"],
    },
  ],
  careerPath: [
    {
      ...mockVideoRec,
      videoId: "v_career_1",
      title: "Full Stack System Architecture Mastery",
      whyRecommended: ["Essential milestone for Full Stack Developer path"],
    },
  ],
  basedOnHistory: [
    {
      ...mockVideoRec,
      videoId: "v_hist_1",
      title: "React State Management Advanced Deep Dive",
      whyRecommended: ["Builds on your recent React lessons"],
    },
  ],
  projectLearning: [
    {
      ...mockVideoRec,
      videoId: "v_proj_1",
      title: "Build a Full Stack MERN Microservice",
      whyRecommended: ["Connects to your GitHub repository stack"],
    },
  ],
  trending: [
    {
      ...mockVideoRec,
      videoId: "v_trend_1",
      title: "JavaScript Best Practices in 2026",
      whyRecommended: ["Highly rated in JavaScript engineering community"],
    },
  ],
  learningContext: {
    targetRole: "Full Stack Developer",
    topSkills: [{ skill: "React", level: "Proficient", score: 85 }],
    skillGaps: [{ skill: "Docker", priority: "Critical" }],
    completedCount: 2,
    historyCount: 3,
  },
  generatedAt: "2026-08-25T12:00:00Z",
  cached: false,
};

const renderWithProviders = (ui: React.ReactNode) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("EduTube Phase 3C: Personalized AI Learning Engine Frontend Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Renders RecommendationCard with Personalization score and whyRecommended dropdown", async () => {
    vi.spyOn(EduTubeApi, "isVideoSaved").mockResolvedValue({ isSaved: false });
    const onWatch = vi.fn();

    renderWithProviders(<RecommendationCard video={mockVideoRec} onWatch={onWatch} />);

    expect(screen.getByText(/Mastering Docker Containers/i)).toBeInTheDocument();
    expect(screen.getByText(/92% Match/i)).toBeInTheDocument();
    expect(screen.getByText(/EduScore 95/i)).toBeInTheDocument();

    // Expand why recommended
    const whyButton = screen.getByText(/Why recommended for you\?/i);
    fireEvent.click(whyButton);

    expect(
      screen.getByText(/Addresses your Docker skill gap \(Critical priority\)/i)
    ).toBeInTheDocument();

    // Click watch
    const watchButton = screen.getByRole("button", { name: /Watch/i });
    fireEvent.click(watchButton);
    expect(onWatch).toHaveBeenCalledWith(mockVideoRec.videoId);
  });

  it("2. Submits recommendation feedback when clicking feedback buttons", async () => {
    vi.spyOn(EduTubeApi, "isVideoSaved").mockResolvedValue({ isSaved: false });
    const submitSpy = vi.spyOn(EduTubeApi, "submitRecommendationFeedback").mockResolvedValue({ feedback: {} });

    renderWithProviders(<RecommendationCard video={mockVideoRec} onWatch={vi.fn()} />);

    const moreLikeThisBtn = screen.getByTitle(/More like this/i);
    fireEvent.click(moreLikeThisBtn);

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith({
        videoId: mockVideoRec.videoId,
        action: "more_like_this",
        topic: mockVideoRec.topic,
      });
    });
  });

  it("3. Renders all 6 PersonalizedFeed sections when feed data loads", async () => {
    vi.spyOn(EduTubeApi, "getPersonalizedRecommendations").mockResolvedValue(mockFeedData);
    vi.spyOn(EduTubeApi, "isVideoSaved").mockResolvedValue({ isSaved: false });

    renderWithProviders(<PersonalizedFeed onWatch={vi.fn()} />);

    expect(await screen.findByText("Your Personalized Learning Feed")).toBeInTheDocument();
    expect(await screen.findByText("AI Personalized")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Recommended For You", level: 3 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Close Your Skill Gaps", level: 3 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /Your Career Path/i, level: 3 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Based On Your Learning", level: 3 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Learn Through Projects", level: 3 })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Trending In Your Stack", level: 3 })).toBeInTheDocument();
  });

  it("4. Generates AI Learning Track and allows saving as a playlist", async () => {
    const mockTrack = {
      trackTitle: "Docker & Kubernetes Mastery",
      description: "Complete track",
      targetRole: "Full Stack Developer",
      topic: "Docker",
      lessons: [
        {
          order: 1,
          lessonTitle: "1. Docker Basics",
          learningObjective: "Understand containers",
          videoId: "vid_d1",
          title: "Docker Tutorial",
          thumbnail: "https://example.com/thumb.jpg",
          channelTitle: "DevOps",
          embedUrl: "https://youtube.com/embed/vid_d1",
          youtubeUrl: "https://youtube.com/watch?v=vid_d1",
          educationalScore: 92,
        },
      ],
    };

    const genSpy = vi.spyOn(EduTubeApi, "generateLearningTrack").mockResolvedValue({ track: mockTrack });
    const saveSpy = vi.spyOn(EduTubeApi, "saveTrackAsPlaylist").mockResolvedValue({
      playlist: {
        _id: "pl_123",
        name: "Docker Mastery",
        description: "",
        videos: [],
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    });

    renderWithProviders(<LearningTrackDialog targetRole="Full Stack Developer" />);

    // Open dialog
    const openBtn = screen.getByRole("button", { name: /Generate AI Track/i });
    fireEvent.click(openBtn);

    expect(screen.getByText(/AI Learning Track Architect/i)).toBeInTheDocument();

    // Input topic and generate
    const input = screen.getByPlaceholderText(/E.g. Docker & Kubernetes/i);
    fireEvent.change(input, { target: { value: "Docker" } });

    const buildBtn = screen.getByRole("button", { name: /Build Track/i });
    fireEvent.click(buildBtn);

    await waitFor(() => {
      expect(genSpy).toHaveBeenCalledWith({
        topic: "Docker",
        targetRole: "Full Stack Developer",
      });
      expect(screen.getByText(/Docker & Kubernetes Mastery/i)).toBeInTheDocument();
      expect(screen.getByText(/1\. Docker Basics/i)).toBeInTheDocument();
    });

    // Save as playlist
    const savePlaylistBtn = screen.getByRole("button", { name: /Save as Playlist/i });
    fireEvent.click(savePlaylistBtn);

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalled();
    });
  });
});
