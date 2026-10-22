import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardHome from "../modules/dashboard/DashboardHome";
import { SmartSkillApi } from "../lib/api";

// Mock Auth
vi.mock("../core/auth", () => ({
  useAuth: () => ({
    firebaseUser: { uid: "test-student-1", email: "student@example.com", displayName: "Ada Lovelace" },
    backendUser: { _id: "test-student-1", name: "Ada Lovelace", targetRole: "Full Stack Developer" },
    loading: false,
  }),
}));

// Mock Sonner Toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Phase 38: Frontend Adaptive Learning Telemetry & Synchronization Suite", () => {
  const mockTelemetry = {
    milestonesCompleted: 5,
    milestonesTotal: 8,
    dailyMissionsCompleted: 2,
    dailyMissionsTotal: 3,
    codingChallengesAttempted: 6,
    codingChallengesSolved: 4,
    recentSkillImprovements: 3,
    persistentSkillGapsCount: 2,
    overallReadinessScore: 74,
    isPersonalized: true,
    recommendationSource: "adaptive_loop",
    evaluatedAt: new Date().toISOString(),
  };

  const mockDashboardData: any = {
    overview: {
      targetRole: "Full Stack Developer",
      empiricalMastery: { score: 80, isEmpirical: true, testedSkillsCount: 3, calculation: "..." },
      readinessEstimate: { score: 74, isEstimate: true, totalSkillsEvaluated: 5, calculation: "..." },
      studyTimeThisWeek: { hours: 4.5, minutes: 270, calculation: "..." },
      consistencyStreakDays: 3,
      careerGoalProgress: { targetRole: "Full Stack Developer", progressPercent: 65, metSkillsCount: 3, totalRequiredSkillsCount: 5 },
    },
    learningConsistency: { streakDays: 3, weeklyStudyHours: 4.5, dailyTrends: [] },
    skillVisualization: { total: 5, strongSkills: [], improvingSkills: [], weakSkills: [], prerequisiteGaps: [] },
    recentAssessments: [],
    dailyLearningPlan: [
      { id: "mission_1_concept", type: "video_lesson", title: "Study Docker", completed: true, isPersonalized: true },
      { id: "mission_2_hands_on", type: "coding_task", title: "Solve Two Sum", completed: true, isPersonalized: true },
      { id: "mission_3_retrieval", type: "spaced_revision", title: "Revision Quiz", completed: false, isPersonalized: true },
    ],
    nextRecommendedAction: { title: "Solve Container Challenge", targetSkill: "Docker", estimatedMinutes: 20, actionUrl: "/dashboard/coding", reasoning: "..." },
    topEduTubeRecommendations: [],
    roadmapSummary: { totalItems: 8, completedItems: 5 },
    telemetry: mockTelemetry,
    generatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Renders the Adaptive Learning Telemetry ribbon with live metrics", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({
      _id: "profile_1",
      owner: "test-student-1",
      targetRole: "Full Stack Developer",
      overallReadinessScore: 74,
      skills: [],
      skillGaps: [],
    } as any);

    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockDashboardData);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Adaptive Learning Telemetry")).toBeDefined();
      expect(screen.getByText("Personalized Active")).toBeDefined();
      expect(screen.getByText("5 / 8")).toBeDefined(); // Milestones
      expect(screen.getByText("2 / 3")).toBeDefined(); // Daily Missions
      expect(screen.getByText("4 / 6")).toBeDefined(); // Coding Solved / Attempted
    });
  });

  it("2. 'Sync Adaptive Loop' button calls evaluateAdaptiveLoop and refreshes dashboard intelligence", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({
      _id: "profile_1",
      owner: "test-student-1",
      targetRole: "Full Stack Developer",
      overallReadinessScore: 74,
      skills: [],
      skillGaps: [],
    } as any);

    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockDashboardData);

    const evaluateSpy = vi.spyOn(SmartSkillApi, "evaluateAdaptiveLoop").mockResolvedValue({
      evaluatedAt: new Date().toISOString(),
      targetRole: "Full Stack Developer",
      overallReadinessScore: 78,
      focalSkill: "Docker",
      loopState: {},
      recommendations: [],
      telemetry: { ...mockTelemetry, overallReadinessScore: 78 },
    });

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sync Adaptive Loop/i })).toBeDefined();
    });

    const syncBtn = screen.getByRole("button", { name: /Sync Adaptive Loop/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(evaluateSpy).toHaveBeenCalledTimes(1);
    });
  });

  it("3. SmartSkillApi.getAdaptiveTelemetry sends GET request to /adaptive-loop/telemetry", async () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockTelemetry,
      }),
    } as any);

    const telemetry = await SmartSkillApi.getAdaptiveTelemetry("Full Stack Developer");

    expect(telemetry.milestonesCompleted).toBe(5);
    expect(telemetry.codingChallengesSolved).toBe(4);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/adaptive-loop/telemetry?role=Full%20Stack%20Developer"),
      expect.any(Object)
    );
  });
});
