import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import UserAnalyticsPage from "../pages/UserAnalyticsPage";
import AdminAnalytics from "../pages/AdminAnalytics";
import DashboardSidebar from "../components/DashboardSidebar";
import { AuthContext } from "../core/auth/AuthContext";
import * as apiModule from "../lib/api";

const mockUserAnalyticsData = {
  overview: {
    targetRole: "Full Stack Developer",
    readinessScore: 78,
    totalSkills: 24,
    learningHours: 14.5,
    githubHealthScore: 85,
    projectsCount: 4,
    resumesCount: 2,
    portfoliosCount: 1,
    codingSolvedCount: 12,
  },
  learning: {
    videosWatched: 18,
    completedVideos: 6,
    learningHours: 14.5,
    savedCount: 5,
    playlistsCount: 2,
    weeklyActivity: [
      { day: "Mon", date: "2026-08-21", count: 2 },
      { day: "Tue", date: "2026-08-22", count: 4 },
      { day: "Wed", date: "2026-08-23", count: 1 },
      { day: "Thu", date: "2026-08-24", count: 3 },
      { day: "Fri", date: "2026-08-25", count: 5 },
      { day: "Sat", date: "2026-08-26", count: 2 },
      { day: "Sun", date: "2026-08-27", count: 1 },
    ],
    recentVideos: [
      {
        videoId: "v1",
        title: "React 19 Deep Dive",
        channelTitle: "Tech Learning",
        watchedAt: new Date().toISOString(),
      },
    ],
  },
  skills: {
    total: 24,
    skills: [
      { name: "React", level: "Proficient", score: 85, category: "Frontend" },
      { name: "Node.js", level: "Competent", score: 65, category: "Backend" },
    ],
    strong: [{ name: "React", level: "Proficient", score: 85, category: "Frontend" }],
    improving: [{ name: "Node.js", level: "Competent", score: 65, category: "Backend" }],
    needsAttention: [],
  },
  gaps: {
    total: 2,
    items: [
      {
        skill: "Docker",
        priority: "High",
        currentScore: 25,
        targetScore: 75,
        reason: "Required for deployment pipelines",
      },
    ],
    highPriority: [
      {
        skill: "Docker",
        priority: "High",
        currentScore: 25,
        targetScore: 75,
        reason: "Required for deployment pipelines",
      },
    ],
    mediumPriority: [],
    lowPriority: [],
  },
  roadmap: {
    totalItems: 5,
    completedItems: 2,
    progressPercent: 40,
    items: [
      {
        skill: "Docker",
        title: "Containerize MERN Stack",
        type: "coding_practice",
        description: "Hands-on containerization",
        isCompleted: false,
      },
    ],
  },
  github: {
    connected: true,
    username: "sampatakumar",
    repositoryCount: 8,
    totalStars: 15,
    dominantLanguage: "TypeScript",
    topLanguages: [{ name: "TypeScript", percentage: 70 }],
    descriptionCoverage: 88,
    readmeCoverage: 75,
    optimizationScore: 85,
    strengths: ["Clean commits"],
    weaknesses: [],
  },
  resume: {
    count: 2,
    formats: ["PDF"],
    recentResumes: [{ id: "r1", title: "Fullstack Master", format: "PDF", updatedAt: new Date().toISOString() }],
  },
  portfolio: {
    count: 1,
    publishedCount: 1,
    items: [{ id: "p1", projectName: "portfolio-pro", url: "https://portfolio.pages.dev" }],
  },
  coding: {
    totalSubmissions: 20,
    attemptedCount: 15,
    solvedCount: 12,
    successRate: 80,
    languages: ["javascript", "typescript"],
  },
  mentor: {
    conversationsCount: 1,
    messagesCount: 16,
    actionsGenerated: 8,
    lastInteractionAt: new Date().toISOString(),
  },
  insights: [
    {
      type: "gap",
      text: "Docker is currently your highest-priority skill gap for Full Stack Developer.",
    },
  ],
  timeRange: "30d",
};

const renderWithAuth = (ui: React.ReactElement, authOverrides = {}) => {
  const defaultAuth = {
    firebaseUser: { uid: "u1", email: "user@example.com", displayName: "Regular User" },
    backendUser: { _id: "u1", email: "user@example.com", displayName: "Regular User" },
    loading: false,
    authInitialized: true,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    signOutUser: vi.fn(),
    refreshProfile: vi.fn(),
    ...authOverrides,
  };

  return render(
    <AuthContext.Provider value={defaultAuth as any}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe("Analytics Navigation & Split Dashboard Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders My Analytics page with personal developer metrics", async () => {
    vi.spyOn(apiModule, "apiRequest").mockResolvedValue({
      status: 200,
      data: mockUserAnalyticsData,
      message: "OK",
    } as any);

    renderWithAuth(<UserAnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText("My Analytics")).toBeInTheDocument();
      expect(screen.getByText(/Track your learning, skills, projects, and career growth/i)).toBeInTheDocument();
    });

    // Check top overview metric values
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("14.5h")).toBeInTheDocument();
    expect(screen.getByText("24")).toBeInTheDocument();

    // Check EduTube section
    expect(screen.getByText("EduTube Weekly Learning Activity")).toBeInTheDocument();

    // Check skill and gap info
    expect(screen.getByText("Skill Status Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("High Priority")).toBeInTheDocument();

    // Check insights
    expect(screen.getByText(/Docker is currently your highest-priority skill gap/i)).toBeInTheDocument();
  });

  it("shows Access Denied for regular non-admin user on AdminAnalytics page", async () => {
    renderWithAuth(<AdminAnalytics />, {
      firebaseUser: { email: "regular@gmail.com" },
      backendUser: { email: "regular@gmail.com" },
    });

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText(/You do not have administrative privileges/i)).toBeInTheDocument();
  });

  it("renders Admin Analytics for admin user", async () => {
    vi.spyOn(apiModule, "apiRequest").mockResolvedValue({
      status: 200,
      data: [
        {
          date: "2026-08-27",
          rateLimitHits: 2,
          groqRequests: 35,
          newUsers: 10,
          portfoliosPublished: 4,
          resumesUploaded: 8,
          apiHits: { "/api/v1/auth/me": 50 },
        },
      ],
      message: "OK",
    } as any);

    renderWithAuth(<AdminAnalytics />, {
      firebaseUser: { email: "sampatakumarsv@gmail.com" },
      backendUser: { email: "sampatakumarsv@gmail.com" },
    });

    await waitFor(() => {
      expect(screen.getByText("Admin Analytics")).toBeInTheDocument();
      expect(screen.getByText("ADMIN ONLY")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // New Users
      expect(screen.getByText("35")).toBeInTheDocument(); // AI Requests
    });
  });

  it("renders DashboardSidebar with ONE user analytics link and NO duplicate analytics for regular user", () => {
    renderWithAuth(<DashboardSidebar />, {
      firebaseUser: { email: "regular@example.com" },
      backendUser: { email: "regular@example.com" },
    });

    // Exactly one "My Analytics" link
    const myAnalyticsLinks = screen.getAllByText("My Analytics");
    expect(myAnalyticsLinks).toHaveLength(1);

    // No Admin Analytics link for regular user
    expect(screen.queryByText("Admin Analytics")).not.toBeInTheDocument();
  });

  it("renders DashboardSidebar with Admin Analytics link for admin user", () => {
    renderWithAuth(<DashboardSidebar />, {
      firebaseUser: { email: "sampatakumarsv@gmail.com" },
      backendUser: { email: "sampatakumarsv@gmail.com" },
    });

    expect(screen.getByText("My Analytics")).toBeInTheDocument();
    expect(screen.getByText("Admin Analytics")).toBeInTheDocument();
    expect(screen.getByText("Administrator")).toBeInTheDocument();
  });
});
