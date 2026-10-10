import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardHome from "../modules/dashboard/DashboardHome";
import { SmartSkillApi } from "@/lib/api";

vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    backendUser: {
      displayName: "Jane Developer",
      targetRole: "Full Stack Developer",
    },
    firebaseUser: {
      displayName: "Jane Developer",
    },
    authInitialized: true,
  }),
}));

describe("Dashboard Intelligence & Adaptive Learning Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders verified mastery, study consistency, daily learning plan, and EduTube recommendations", async () => {
    const mockProfile = {
      targetRole: "Full Stack Developer",
      overallReadinessScore: 78,
      skills: [
        {
          skill: "Docker",
          canonicalName: "Docker",
          category: "DevOps",
          score: 85,
          level: "Proficient",
          confidence: 0.9,
          sources: ["coding", "resume"],
        },
        {
          skill: "React",
          canonicalName: "React",
          category: "Frontend",
          score: 75,
          level: "Competent",
          confidence: 0.8,
          sources: ["resume", "github"],
        },
      ],
      skillGaps: [
        {
          skill: "Kubernetes",
          canonicalName: "Kubernetes",
          priority: "High",
          currentScore: 30,
          targetScore: 75,
          reason: "Needed for cloud deployments",
        },
      ],
      recommendations: [],
    };

    const mockIntelligence = {
      overview: {
        targetRole: "Full Stack Developer",
        empiricalMastery: {
          score: 85,
          isEmpirical: true,
          testedSkillsCount: 1,
          calculation: "Weighted average score from Docker sandbox test suite.",
        },
        readinessEstimate: {
          score: 78,
          isEstimate: true,
          totalSkillsEvaluated: 2,
          calculation: "Multi-source synthesis across Resume, GitHub, and Sandbox.",
        },
        studyTimeThisWeek: {
          hours: 4.5,
          minutes: 270,
          calculation: "Aggregated verified video playback over 7 rolling days.",
        },
        consistencyStreakDays: 3,
        careerGoalProgress: {
          targetRole: "Full Stack Developer",
          progressPercent: 72,
          metSkillsCount: 2,
          totalRequiredSkillsCount: 3,
        },
      },
      learningConsistency: {
        streakDays: 3,
        weeklyStudyHours: 4.5,
        dailyTrends: [
          { day: "Mon", date: "2026-10-06", videosCompleted: 1, codingSolved: 1 },
          { day: "Tue", date: "2026-10-07", videosCompleted: 2, codingSolved: 0 },
        ],
      },
      skillVisualization: {
        total: 2,
        strongSkills: [{ name: "Docker", score: 85, level: "Proficient" }],
        improvingSkills: [{ name: "React", score: 75, level: "Competent" }],
        weakSkills: [],
        prerequisiteGaps: [
          {
            skill: "Kubernetes",
            priority: "High",
            currentScore: 30,
            targetScore: 75,
            reason: "Needed for cloud deployments",
            blocksTechnologies: ["Helm", "Cloud Orchestration"],
            isPrerequisiteBlocker: true,
          },
        ],
      },
      recentAssessments: [
        {
          skill: "Docker",
          score: 85,
          previousScore: 60,
          scoreDelta: 25,
          assessmentType: "coding_challenge",
          taskId: "docker_express_server",
          testCasesPassed: 10,
          testCasesTotal: 10,
          date: "2026-10-09T10:00:00Z",
        },
      ],
      dailyLearningPlan: [
        {
          id: "m1",
          type: "video_lesson",
          title: "Study Docker Multi-Stage Builds",
          targetSkill: "Docker",
          estimatedMinutes: 20,
          completed: false,
          actionUrl: "/dashboard/edutube",
          explanation: "Reinforces verified container skills.",
        },
      ],
      nextRecommendedAction: {
        title: "Solve Kubernetes Deployment Sandbox Challenge",
        targetSkill: "Kubernetes",
        estimatedMinutes: 25,
        actionUrl: "/dashboard/coding",
        reasoning: "Empirical code execution addresses high-priority gap.",
      },
      topEduTubeRecommendations: [
        {
          videoId: "vid_docker_deep",
          title: "Docker and Containers In-Depth Masterclass",
          channelTitle: "freeCodeCamp.org",
          thumbnail: "https://img.youtube.com/vi/vid_docker_deep/hqdefault.jpg",
          verifiedDurationSeconds: 1800,
          durationFormatted: "30:00",
          educationalScore: 92,
          whyRecommended: ["Addresses your high priority Docker gap", "Passed educational quality gate"],
          qualityGatePassed: true,
        },
      ],
      roadmapSummary: { totalItems: 3, completedItems: 1 },
      generatedAt: "2026-10-10T12:00:00Z",
    };

    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue(mockProfile as any);
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligence as any);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    // Verify Welcome header
    expect(await screen.findByText(/Welcome back, Jane Developer/i)).toBeInTheDocument();

    // Verify Verified Empirical Mastery score card
    expect(screen.getByText(/Verified Mastery/i)).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText(/Empirical Docker Sandbox/i)).toBeInTheDocument();

    // Verify Career Readiness Estimate card
    expect(screen.getByText(/Readiness Estimate/i)).toBeInTheDocument();
    expect(screen.getByText("78")).toBeInTheDocument();

    // Verify Study Time & Streak card
    expect(screen.getByText(/Study Time/i)).toBeInTheDocument();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/3-Day Streak/i)).toBeInTheDocument();

    // Verify Daily Learning Plan
    expect(screen.getByText(/Personalized Daily Learning Plan/i)).toBeInTheDocument();
    expect(screen.getByText(/Study Docker Multi-Stage Builds/i)).toBeInTheDocument();

    // Verify Next Recommended Action
    expect(screen.getByText(/Next Recommended Action/i)).toBeInTheDocument();
    expect(screen.getByText(/Solve Kubernetes Deployment Sandbox Challenge/i)).toBeInTheDocument();

    // Verify EduTube Feed with Quality Gate and duration
    expect(screen.getByText(/EduTube Educational Feed/i)).toBeInTheDocument();
    expect(screen.getByText(/Docker and Containers In-Depth Masterclass/i)).toBeInTheDocument();
    expect(screen.getByText(/30:00/i)).toBeInTheDocument();
    expect(screen.getByText(/Quality Gate Passed/i)).toBeInTheDocument();

    // Verify Recent Empirical Assessments
    expect(screen.getByText(/Recent Empirical Assessments/i)).toBeInTheDocument();
    expect(screen.getByText(/10\/10 test cases passed/i)).toBeInTheDocument();
  });
});
