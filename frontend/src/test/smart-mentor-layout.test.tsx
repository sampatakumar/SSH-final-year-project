import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartMentorPage } from "../modules/mentor/pages/SmartMentorPage";
import { SmartMentorApi } from "../modules/mentor/services/smartMentor.api";
import DashboardLayout from "../pages/DashboardLayout";
import DashboardSidebar from "../components/DashboardSidebar";
import { AuthContext } from "../core/auth/AuthContext";
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
    reposWithoutDescList: ["Repo-A"],
    reposWithoutReadmeList: ["Repo-X"],
    topLanguages: ["TypeScript"],
    totalStars: 12,
    optimizationScore: 78,
    strengths: ["Strong commit frequency"],
    weaknesses: ["Missing README"],
    readmeQualityTips: [],
    portfolioTips: [],
  },
  learning: {
    videosWatched: 18,
    completedVideos: 6,
    savedCount: 4,
    playlistsCount: 2,
    recentTopics: ["React 19"],
    continueLearningTitle: "Docker Full Course",
  },
  projects: [],
  resume: { resumeCount: 1, hasSummary: true, hasExperience: true, hasEducation: true },
  coding: { totalSubmissions: 10, passedCount: 8 },
  insights: ["Docker is your top skill gap"],
  updatedAt: new Date().toISOString(),
};

const mockAuthContext: any = {
  firebaseUser: { email: "student@example.com" },
  backendUser: { email: "student@example.com", name: "Sampat", targetRole: "Full Stack Developer" },
  signOutUser: async () => {},
  loading: false,
};

describe("Smart Mentor Responsive Layout & Collapsible Sidebars Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();
    vi.spyOn(SmartMentorApi, "getContext").mockResolvedValue(mockContext);
    vi.spyOn(SmartMentorApi, "getHistory").mockResolvedValue([]);
    localStorage.clear();
  });

  it("1. Live Profile Signals drawer is strictly CLOSED BY DEFAULT on initial load", async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SmartMentorPage />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    const toggleBtns = screen.getAllByRole("button", { name: /Profile Signals/i });
    expect(toggleBtns.length).toBeGreaterThanOrEqual(1);
    expect(toggleBtns[0]).toHaveAttribute("aria-expanded", "false");

    const drawer = document.getElementById("live-profile-signals-drawer");
    expect(drawer).toBeInTheDocument();
    expect(drawer?.className).toContain("translate-x-full");
    expect(drawer?.className).toContain("pointer-events-none");
    expect(drawer?.className).not.toContain("translate-x-0");
  });

  it("2. Clicking Profile Signals button opens drawer with smooth translation", async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SmartMentorPage />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    const toggleBtn = screen.getAllByRole("button", { name: /Profile Signals/i })[0];
    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");
    const drawer = document.getElementById("live-profile-signals-drawer");
    expect(drawer?.className).toContain("translate-x-0");
    expect(drawer?.className).toContain("pointer-events-auto");
  });

  it("3. Drawer can be dismissed via Close button and Escape key", async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SmartMentorPage />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    const toggleBtn = screen.getAllByRole("button", { name: /Profile Signals/i })[0];
    fireEvent.click(toggleBtn);

    const closeBtn = screen.getByRole("button", { name: /Close profile signals drawer/i });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);

    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    const drawer = document.getElementById("live-profile-signals-drawer");
    expect(drawer?.className).toContain("translate-x-full");

    // Open again and test Escape key
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("4. DashboardSidebar supports collapsible icon-only rail with aria-expanded", () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <DashboardSidebar isCollapsed={false} onToggleCollapse={onToggle} />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const aside = screen.getByRole("complementary", { name: /Sidebar Navigation/i });
    expect(aside.className).toContain("w-64");

    rerender(
      <AuthContext.Provider value={mockAuthContext}>
        <MemoryRouter>
          <DashboardSidebar isCollapsed={true} onToggleCollapse={onToggle} />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(aside.className).toContain("w-20");
  });

  it("5. DashboardLayout provides collapsible sidebar toggle and custom mentor workspace width", async () => {
    render(
      <AuthContext.Provider value={mockAuthContext}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={["/dashboard/mentor"]}>
            <Routes>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route path="mentor" element={<SmartMentorPage />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>
    );

    const collapseToggleBtns = screen.getAllByRole("button", { name: /Collapse navigation sidebar/i });
    expect(collapseToggleBtns.length).toBeGreaterThanOrEqual(1);
    const collapseToggleBtn = collapseToggleBtns[0];
    expect(collapseToggleBtn).toBeInTheDocument();
    expect(collapseToggleBtn).toHaveAttribute("aria-expanded", "true");

    // Workspace container uses max-w-full for mentor page
    const mainWorkspace = screen.getByRole("main");
    expect(mainWorkspace).toBeInTheDocument();
    const innerContainer = mainWorkspace.firstElementChild?.nextElementSibling;
    expect(innerContainer?.className).toContain("max-w-full");

    // Click collapse toggle
    fireEvent.click(collapseToggleBtn);
    expect(screen.getAllByRole("button", { name: /Expand navigation sidebar/i })[0]).toHaveAttribute("aria-expanded", "false");
  });
});
