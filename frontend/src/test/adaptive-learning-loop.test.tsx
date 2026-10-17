import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MentorContextPanel } from "../modules/mentor/components/MentorContextPanel";
import { SmartSkillApi } from "../lib/api";
import type { MentorContextData } from "../modules/mentor/types/smartMentor.types";

const mockContextWithAdaptivePlan: MentorContextData = {
  career: {
    name: "Sampat",
    targetRole: "Full Stack Developer",
    headline: "Full Stack Engineer",
    readinessScore: 78,
    education: ["B.Tech in Computer Science"],
    experienceYears: "Student",
  },
  skills: [
    { name: "JavaScript", level: "Proficient", score: 85, category: "Core" },
    { name: "React", level: "Proficient", score: 80, category: "Frontend" },
  ],
  skillGaps: [
    {
      skill: "Docker",
      priority: "Critical",
      currentScore: 20,
      targetScore: 75,
      reason: "Essential for microservices deployment",
    },
  ],
  roadmap: [],
  github: {
    username: "sampatakumar",
    connected: true,
    connectionState: "connected",
    hasAnalysis: true,
    repositoryCount: 8,
    repositoriesWithoutDescription: 1,
    repositoriesWithoutReadme: 1,
    reposWithoutDescList: [],
    reposWithoutReadmeList: [],
    topLanguages: ["TypeScript", "JavaScript"],
    totalStars: 5,
    optimizationScore: 75,
    strengths: [],
    weaknesses: [],
    readmeQualityTips: [],
    portfolioTips: [],
  },
  learning: {
    videosWatched: 12,
    completedVideos: 4,
    savedCount: 2,
    playlistsCount: 1,
    recentTopics: ["Docker Containerization"],
    continueLearningTitle: "Docker Tutorial",
  },
  projects: [],
  resume: {
    resumeCount: 1,
    hasSummary: true,
    hasExperience: false,
    hasEducation: true,
  },
  coding: {
    totalSubmissions: 6,
    passedCount: 4,
    passRate: 67,
    verifiedChallenges: ["docker-compose-challenge"],
  },
  adaptivePlan: {
    currentObjective: "Build and containerize a Node.js microservice architecture with verified test cases",
    nextAction: {
      skill: "Docker",
      actionType: "targeted_remediation",
      priority: "Critical",
      reasoning: "Repeated challenge difficulty detected. Target missing Docker isolation concepts.",
      practicalAction: "Run Docker challenge #103 in the sandbox. Write Dockerfile with multi-stage builds.",
      completionCriteria: "Pass all sandbox automated test cases",
      taskRoute: "/dashboard/coding",
    },
    verifiedCompetenciesCount: 3,
    pendingActionsCount: 2,
  },
  insights: [
    "📈 Docker is currently your highest-priority skill gap (Critical priority) for Full Stack Developer.",
  ],
};

describe("Phase 16: Frontend Adaptive Learning Loop & Live Profile Signals Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. MentorContextPanel Adaptive Plan Card Rendering", () => {
    it("renders Adaptive Learning Loop card with objective and next action when open", () => {
      render(
        <MentorContextPanel
          context={mockContextWithAdaptivePlan}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Verify section header exists
      expect(screen.getByText("Adaptive Learning Loop")).toBeInTheDocument();

      // Verify current objective
      expect(
        screen.getByText(/Build and containerize a Node\.js microservice architecture/i)
      ).toBeInTheDocument();

      // Verify next action details
      expect(screen.getAllByText("Critical").length).toBeGreaterThanOrEqual(2);
      expect(
        screen.getByText(/Run Docker challenge #103 in the sandbox/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Criteria: Pass all sandbox automated test cases/i)
      ).toBeInTheDocument();

      // Verify sandbox verification passed count
      expect(screen.getByText(/Verified in Sandbox:/i)).toBeInTheDocument();
      expect(screen.getByText("4 passed")).toBeInTheDocument();
    });

    it("renders fallback objective gracefully when adaptivePlan is absent", () => {
      const contextWithoutPlan: MentorContextData = {
        ...mockContextWithAdaptivePlan,
        adaptivePlan: undefined,
      };

      render(
        <MentorContextPanel
          context={contextWithoutPlan}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Adaptive Learning Loop card falls back to top skill gap
      expect(screen.getByText("Adaptive Learning Loop")).toBeInTheDocument();
      expect(
        screen.getByText("Master Docker fundamentals and pass sandbox challenge")
      ).toBeInTheDocument();
      expect(screen.getByText("Docker")).toBeInTheDocument();
    });

    it("triggers onClose callback when close drawer button is clicked", () => {
      const onCloseSpy = vi.fn();
      render(
        <MentorContextPanel
          context={mockContextWithAdaptivePlan}
          isOpen={true}
          onClose={onCloseSpy}
        />
      );

      const closeBtn = screen.getByLabelText("Close profile signals drawer");
      fireEvent.click(closeBtn);
      expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. SmartSkillApi Learning Loop Contract Integration", () => {
    it("calls getAdaptiveLearningPlan with proper authorization and parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            targetRole: "Full Stack Developer",
            currentObjective: "Pass Docker challenge",
            actions: [],
            verifiedCompetenciesCount: 2,
            pendingActionsCount: 1,
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await SmartSkillApi.getAdaptiveLearningPlan("Full Stack Developer");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/skills/learning-loop/plan?role=Full%20Stack%20Developer"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
      expect(result.targetRole).toBe("Full Stack Developer");
    });

    it("calls recordLearningActivity with activity payload and idempotency key", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            activity: {
              activityType: "coding_passed",
              skill: "Docker",
              isDemonstratedCompetency: true,
            },
          },
        }),
      });
      global.fetch = mockFetch;

      const activityPayload = {
        activityType: "coding_passed",
        skill: "Docker",
        entityId: "challenge_docker_1",
        title: "Docker Challenge 1",
        idempotencyKey: "act_test_key_101",
        evidence: {
          score: 100,
          maxScore: 100,
          testCasesPassed: 5,
          testCasesTotal: 5,
          evidenceSource: "coding",
          sandboxVerified: true,
        },
      };

      const result = await SmartSkillApi.recordLearningActivity(activityPayload);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/skills/learning-loop/activity"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(activityPayload),
        })
      );
      expect(result.activity.isDemonstratedCompetency).toBe(true);
    });

    it("calls compareMultiRolePlans with role parameters", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            rolesCount: 2,
            roles: [
              { targetRole: "Frontend Developer", readinessScore: 80 },
              { targetRole: "Backend Developer", readinessScore: 70 },
            ],
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await SmartSkillApi.compareMultiRolePlans([
        "Frontend Developer",
        "Backend Developer",
      ]);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/skills/learning-loop/compare?roles=Frontend%20Developer%2CBackend%20Developer"),
        expect.any(Object)
      );
      expect(result.rolesCount).toBe(2);
    });
  });
});
