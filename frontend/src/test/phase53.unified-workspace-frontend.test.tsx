import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DashboardHome from "../modules/dashboard/DashboardHome";
import { SmartSkillApi } from "@/lib/api";

vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    backendUser: {
      displayName: "Priya Sharma",
      targetRole: "Mechanical Design Engineer",
      academic: {
        branchSlug: "mech",
        branchName: "Mechanical Engineering",
      },
    },
    firebaseUser: {
      displayName: "Priya Sharma",
    },
    authInitialized: true,
  }),
}));

describe("Phase 53: Unified Intelligence & Personalized Student Workspace Frontend", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockUnifiedWorkspace = {
    questionsAnswered: {
      targetObjective: "Student is preparing for 'Mechanical Design Engineer' in 'Mechanical Engineering'.",
      evidenceSummary: "Ledger tracks 4 total evidence item(s) (1 verified proof, 1 rubric evaluated, 1 formative practice, 1 self-reported).",
      remainingGaps: "Identified 1 priority gap(s) and 1 unassessed required competencies.",
      nextLearningAction: "Recommended next action: 'Launch Beam Deflection Calculator' (specialized_tool, ~25m).",
      careerPathwayAlignment: "Directly aligns with 'Mechanical Design Engineer' (Developing, 65% readiness).",
    },
    studentProfile: {
      studentId: "user_mech_53",
      displayName: "Priya Sharma",
      canonicalDiscipline: "mech",
      branchName: "Mechanical Engineering",
      degreeName: "B.Tech Mechanical Engineering",
      semester: 6,
    },
    learningOverview: {
      academicDiscipline: "Mechanical Engineering",
      targetCareerRole: "Mechanical Design Engineer",
      activeLearningStage: "PRACTICE",
      overallReadinessScore: 65,
      studyStreakDays: 5,
      weeklyStudyHours: 4.5,
    },
    careerReadiness: {
      roleTitle: "Mechanical Design Engineer",
      roleFamily: "Mechanical & Industrial",
      heuristicReadinessIndex: 65,
      readinessBand: "Developing",
      disclaimer: "Internal heuristic readiness index for formative learning guidance only; does NOT represent a statistically validated employment probability, placement guarantee, or hiring prediction.",
    },
    nextBestAction: {
      primaryAction: {
        actionId: "act_mech_1",
        skill: "Finite Element Analysis",
        actionType: "specialized_tool",
        title: "Launch Beam Deflection Calculator",
        whyRecommended: "Highest priority gap for Mechanical Design Engineer.",
        intendedOutcome: "Verify shear and moment diagrams with deterministic calculation checks.",
        destination: "/dashboard/tools/mech-calc",
        actionLabel: "Launch Specialized Studio",
        category: "practice",
        priority: "high",
        estimatedMinutes: 25,
        prerequisiteWarning: "Prerequisite 'Statics' should be refreshed before advanced FEA.",
      },
      secondaryActions: [
        {
          actionId: "act_mech_2",
          skill: "Statics",
          actionType: "diagnostic_assessment",
          title: "Attempt Statics Diagnostic Assessment",
          destination: "/dashboard/assessments?id=mech-assessment-statics-01",
          actionLabel: "Start Assessment",
          estimatedMinutes: 20,
        },
      ],
    },
    evidenceLedger: {
      summary: {
        totalRecords: 4,
        verifiedCount: 1,
        rubricScoredCount: 1,
        formativePracticeCount: 1,
        selfReportedCount: 1,
      },
      skillsDemonstrated: [{ skill: "Statics", latestScore: 85 }],
      skillsInferred: [{ skill: "CAD Modeling", latestScore: 78 }],
      skillsSelfReported: [{ skill: "SolidWorks", latestScore: 50 }],
    },
    activeProjects: [
      {
        projectId: "proj_mech_1",
        title: "Autonomous Drone Chassis Structural Optimization",
        status: "in_progress",
        milestonesCompleted: 2,
        milestonesTotal: 4,
      },
    ],
    portfolioArtifacts: [
      {
        artifactId: "art_mech_1",
        toolId: "mech-calc",
        toolDisplayName: "Mechanical Calculation Studio",
        title: "I-Beam Deflection & Bending Stress Report",
        isShared: true,
      },
    ],
    recentActivity: [
      {
        type: "specialized_tool",
        id: "act_rec_1",
        title: "Mechanical Calculation Studio",
        score: 100,
        isPassing: true,
        timestamp: new Date().toISOString(),
        route: "/dashboard/tools/mech-calc",
      },
    ],
  };

  const mockIntelligenceData = {
    overview: {
      targetRole: "Mechanical Design Engineer",
      empiricalMastery: { score: 85, isEmpirical: true, testedSkillsCount: 1 },
      readinessEstimate: { score: 65, isEstimate: true, totalSkillsEvaluated: 4 },
      studyTimeThisWeek: { hours: 4.5, minutes: 270 },
      consistencyStreakDays: 5,
      careerGoalProgress: { targetRole: "Mechanical Design Engineer", progressPercent: 65, metSkillsCount: 2, totalRequiredSkillsCount: 4 },
      competencyBadges: { count: 1, badges: [{ id: "b1", name: "Engineering Mechanics", issuedAt: new Date().toISOString() }] },
      academic: {
        branchSlug: "mech",
        branchName: "Mechanical Engineering",
        degreeSlug: "btech",
        degreeName: "B.Tech Mechanical Engineering",
        isConfigured: true,
      },
    },
    learningConsistency: { streakDays: 5, weeklyStudyHours: 4.5, dailyTrends: [] },
    skillVisualization: { total: 4, strongSkills: [], improvingSkills: [], weakSkills: [], prerequisiteGaps: [] },
    recentAssessments: [],
    dailyLearningPlan: [],
    nextRecommendedAction: {
      title: "Launch Beam Deflection Calculator",
      targetSkill: "Finite Element Analysis",
      estimatedMinutes: 25,
      actionUrl: "/dashboard/tools/mech-calc",
      reasoning: "Highest priority gap for Mechanical Design Engineer.",
      module: "specialized_tools",
      priority: "high",
    },
    topEduTubeRecommendations: [],
    roadmapSummary: { totalItems: 4, completedItems: 2 },
    telemetry: {
      milestonesCompleted: 2,
      milestonesTotal: 4,
      dailyMissionsCompleted: 1,
      dailyMissionsTotal: 3,
      codingChallengesAttempted: 0,
      codingChallengesSolved: 0,
      recentSkillImprovements: 1,
      persistentSkillGapsCount: 1,
      overallReadinessScore: 65,
      revisionsDueToday: 0,
      upcomingRevisionsCount: 1,
      competencyBadgesCount: 1,
      demonstratedCompetenciesCount: 1,
      isPersonalized: true,
      recommendationSource: "unified_workspace",
      evaluatedAt: new Date().toISOString(),
    },
    unifiedWorkspace: mockUnifiedWorkspace,
    generatedAt: new Date().toISOString(),
  };

  it("1. Renders Personalized Student Workspace banner, discipline badge, and target role", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({ skills: [], skillGaps: [], recommendations: [] });
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligenceData);
    vi.spyOn(SmartSkillApi, "getUnifiedWorkspace").mockResolvedValue(mockUnifiedWorkspace);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Personalized Student Workspace/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Mechanical Engineering/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Mechanical Design Engineer/i).length).toBeGreaterThan(0);
  });

  it("2. Renders Primary Next-Best Learning Action card with deep link and whyRecommended", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({ skills: [], skillGaps: [], recommendations: [] });
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligenceData);
    vi.spyOn(SmartSkillApi, "getUnifiedWorkspace").mockResolvedValue(mockUnifiedWorkspace);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Launch Beam Deflection Calculator/i).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/Highest priority gap for Mechanical Design Engineer/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Prerequisite 'Statics' should be refreshed/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Specialized Studio/i)).toBeInTheDocument();
  });

  it("3. Renders Skill Evidence breakdown across verified, rubric, formative, and self-reported tiers", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({ skills: [], skillGaps: [], recommendations: [] });
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligenceData);
    vi.spyOn(SmartSkillApi, "getUnifiedWorkspace").mockResolvedValue(mockUnifiedWorkspace);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Evidence Ledger Breakdown/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Verified Proof/i)).toBeInTheDocument();
    expect(screen.getByText(/Rubric Scored/i)).toBeInTheDocument();
    expect(screen.getByText(/Formative Practice/i)).toBeInTheDocument();
    expect(screen.getByText(/Self Reported/i)).toBeInTheDocument();
  });

  it("4. Renders Active Projects and shared portfolio artifacts with privacy indicator", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({ skills: [], skillGaps: [], recommendations: [] });
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligenceData);
    vi.spyOn(SmartSkillApi, "getUnifiedWorkspace").mockResolvedValue(mockUnifiedWorkspace);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Autonomous Drone Chassis Structural Optimization/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/I-Beam Deflection & Bending Stress Report/i)).toBeInTheDocument();
    expect(screen.getByText(/Shared/i)).toBeInTheDocument();
  });

  it("5. Opens 5 Core Questions modal with evidence-aware answers when clicked", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({ skills: [], skillGaps: [], recommendations: [] });
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligenceData);
    vi.spyOn(SmartSkillApi, "getUnifiedWorkspace").mockResolvedValue(mockUnifiedWorkspace);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/5 Core Questions/i).length).toBeGreaterThan(0);
    });

    const questionsBtn = screen.getAllByText(/5 Core Questions/i)[0];
    fireEvent.click(questionsBtn);

    expect(screen.getByText(/Five Core Questions Answered/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. What is this student trying to achieve\?/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Student is preparing for 'Mechanical Design Engineer'/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/4\. What is the most useful next learning action\?/i)).toBeInTheDocument();
  });

  it("6. Renders Cross-Module recent activity feed with deep links", async () => {
    vi.spyOn(SmartSkillApi, "getSkillProfile").mockResolvedValue({ skills: [], skillGaps: [], recommendations: [] });
    vi.spyOn(SmartSkillApi, "getDashboardIntelligence").mockResolvedValue(mockIntelligenceData);
    vi.spyOn(SmartSkillApi, "getUnifiedWorkspace").mockResolvedValue(mockUnifiedWorkspace);

    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cross-Module Activity/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Mechanical Calculation Studio/i).length).toBeGreaterThan(0);
  });
});
