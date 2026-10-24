import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdaptivePathwayView } from "../modules/roadmap/components/AdaptivePathwayView";
import { LearningRoadmapPage } from "../modules/roadmap/LearningRoadmapPage";
import { AdaptivePathwayResponse } from "../modules/roadmap/types/adaptivePathway.types";
import { SmartSkillApi } from "@/lib/api";

const mockPathway: AdaptivePathwayResponse = {
  targetRole: "Mechanical Design Engineer",
  userBranch: "mech",
  cycleStage: "LEARN_REMEDIATE",
  activeActionsCount: 3,
  completedActionsCount: 1,
  totalActionsCount: 4,
  primaryNextStep: {
    actionId: "act_review_engineering_mechanics",
    skill: "Engineering Mechanics",
    actionType: "review_objective",
    title: "Remediate Engineering Mechanics: Statics & Equilibrium",
    whyRecommended: "Previous score was 50% in Assessment Center. Conceptual review needed.",
    supportingEvidence: {
      sourceType: "assessment_attempt",
      assessmentId: "mech-eng-mechanics",
      previousScore: 50,
      areasForImprovement: ["Truss Equilibrium"],
    },
    intendedOutcome: "Attain verified score ≥ 70% on comparable assessment.",
    destination: "/dashboard/assessments?id=mech-eng-mechanics",
    actionLabel: "Review in Assessment Center",
    category: "review",
    priority: "critical",
    estimatedMinutes: 20,
    isCompleted: false,
  },
  actions: [
    {
      actionId: "act_review_engineering_mechanics",
      skill: "Engineering Mechanics",
      actionType: "review_objective",
      title: "Remediate Engineering Mechanics: Statics & Equilibrium",
      whyRecommended: "Previous score was 50% in Assessment Center.",
      supportingEvidence: {
        sourceType: "assessment_attempt",
        assessmentId: "mech-eng-mechanics",
      },
      intendedOutcome: "Attain passing mark of 70%.",
      destination: "/dashboard/assessments?id=mech-eng-mechanics",
      actionLabel: "Review in Assessment Center",
      category: "review",
      priority: "critical",
      estimatedMinutes: 20,
      isCompleted: false,
    },
    {
      actionId: "act_lesson_engineering_mechanics",
      skill: "Engineering Mechanics",
      actionType: "edutube_lesson",
      title: "Watch: Engineering Mechanics: Statics - Full University Lecture Series",
      whyRecommended: "Verified educational series covering vector force resolution.",
      supportingEvidence: {
        sourceType: "verified_catalog",
      },
      intendedOutcome: "Understand force systems and friction coefficients.",
      destination: "https://www.youtube.com/playlist?list=PLB56E342B28B33DCD",
      actionLabel: "Watch on EduTube",
      category: "lesson",
      priority: "high",
      estimatedMinutes: 45,
      isCompleted: false,
    },
    {
      actionId: "act_project_mech_gearbox",
      skill: "SolidWorks",
      actionType: "project_studio",
      title: "Build Project: Speed Reducer Gearbox: 3D CAD Parametric Assembly",
      whyRecommended: "You demonstrated foundational mastery in SolidWorks (85%). Apply competence!",
      supportingEvidence: {
        sourceType: "project_prerequisite",
        skill: "SolidWorks",
        verifiedScore: 85,
      },
      intendedOutcome: "Build genuine portfolio deliverables.",
      destination: "/dashboard/projects?templateId=mech-cad-gearbox-design",
      actionLabel: "Open Project Blueprint",
      category: "project",
      priority: "high",
      estimatedMinutes: 60,
      isCompleted: false,
    },
    {
      actionId: "act_completed_milestone_1",
      skill: "Free Body Diagrams",
      actionType: "practice_activity",
      title: "Practice Free Body Diagram Calculations",
      whyRecommended: "Completed previously.",
      supportingEvidence: { sourceType: "practice" },
      intendedOutcome: "Solve reaction forces.",
      destination: "/dashboard/practice",
      actionLabel: "Completed",
      category: "practice",
      priority: "medium",
      estimatedMinutes: 15,
      isCompleted: true,
    },
  ],
  diagnosis: {
    totalDiagnosed: 3,
    priorityGapsCount: 1,
    masteredSkillsCount: 1,
    unassessedCount: 1,
    priorityGaps: [],
    masteredSkills: [],
    unassessedSkills: [],
    allDiagnosed: [
      {
        skill: "Engineering Mechanics",
        importance: "Academic Core",
        roleWeight: 80,
        targetScore: 70,
        currentStatus: "needs_remediation",
        evidenceStatus: "demonstrated_knowledge",
        latestScore: 50,
        previousScore: null,
        scoreDelta: null,
        hasEvidence: true,
        isPassing: false,
        daysSinceLastEvaluation: 1,
        prerequisites: {
          hasPrerequisites: true,
          isReady: true,
          missingPrerequisites: [],
          difficulty: "Intermediate",
        },
        learningPriorityScore: 68,
        recommendedActionCategory: "reassessment",
        actionRationale: "Score was 50%. Review and reassess.",
        latestEvidenceSource: "assessment_attempt",
        assessmentId: "mech-eng-mechanics",
      },
      {
        skill: "SolidWorks",
        importance: "Critical",
        roleWeight: 100,
        targetScore: 80,
        currentStatus: "demonstrated_mastery",
        evidenceStatus: "demonstrated_knowledge",
        latestScore: 85,
        previousScore: null,
        scoreDelta: null,
        hasEvidence: true,
        isPassing: true,
        daysSinceLastEvaluation: 3,
        prerequisites: {
          hasPrerequisites: false,
          isReady: true,
          missingPrerequisites: [],
          difficulty: "Beginner",
        },
        learningPriorityScore: 42,
        recommendedActionCategory: "project_application",
        actionRationale: "Foundational mastery demonstrated (85%).",
        latestEvidenceSource: "assessment_attempt",
        assessmentId: null,
      },
      {
        skill: "GD&T",
        importance: "Critical",
        roleWeight: 100,
        targetScore: 80,
        currentStatus: "unassessed",
        evidenceStatus: "insufficient_evidence",
        latestScore: null,
        previousScore: null,
        scoreDelta: null,
        hasEvidence: false,
        isPassing: false,
        daysSinceLastEvaluation: null,
        prerequisites: {
          hasPrerequisites: false,
          isReady: true,
          missingPrerequisites: [],
          difficulty: "Intermediate",
        },
        learningPriorityScore: 68,
        recommendedActionCategory: "diagnostic_assessment",
        actionRationale: "No verified evidence. Take diagnostic assessment.",
        latestEvidenceSource: null,
        assessmentId: null,
      },
    ],
  },
  masteryProgression: {
    totalComparisons: 1,
    positiveProgressionCount: 1,
    averageScoreDelta: 25,
    comparisons: [
      {
        skill: "Engineering Mechanics",
        sourceType: "assessment_attempt",
        initialScore: 50,
        initialDate: "2026-10-20T10:00:00.000Z",
        latestScore: 75,
        latestDate: "2026-10-24T12:00:00.000Z",
        scoreDelta: 25,
        isImproved: true,
        interpretation: "Score increased by +25% on comparable assessment. Demonstrated measurable knowledge improvement.",
        isComparable: true,
      },
    ],
    hasDemonstratedImprovement: true,
    evaluatedAt: "2026-10-24T12:00:00.000Z",
  },
  generatedAt: "2026-10-24T12:00:00.000Z",
};

describe("Phase 45: Adaptive Learning Pathways Frontend Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 7-stage learning loop pipeline and highlights active stage", () => {
    render(
      <MemoryRouter>
        <AdaptivePathwayView pathway={mockPathway} onRefresh={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Learning-Improvement Loop Status")).toBeInTheDocument();
    expect(screen.getByText("LEARN REMEDIATE")).toBeInTheDocument();
    expect(screen.getByText("Assess")).toBeInTheDocument();
    expect(screen.getByText("Diagnose")).toBeInTheDocument();
    expect(screen.getByText("Plan")).toBeInTheDocument();
    expect(screen.getByText("Learn / Remediate")).toBeInTheDocument();
    expect(screen.getByText("Practice")).toBeInTheDocument();
    expect(screen.getByText("Reassess")).toBeInTheDocument();
    expect(screen.getByText("Measure Improvement")).toBeInTheDocument();
  });

  it("renders the primary recommended next step hero card with time and outcome", () => {
    render(
      <MemoryRouter>
        <AdaptivePathwayView pathway={mockPathway} onRefresh={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Immediate Recommended Step")).toBeInTheDocument();
    expect(screen.getAllByText("Remediate Engineering Mechanics: Statics & Equilibrium").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("~20 mins")).toBeInTheDocument();
    expect(screen.getByText(/Attain verified score ≥ 70%/)).toBeInTheDocument();

    const ctaLinks = screen.getAllByRole("link", { name: /Review in Assessment Center/i });
    expect(ctaLinks[0]).toHaveAttribute("href", "/dashboard/assessments?id=mech-eng-mechanics");
  });

  it("renders personalized action plan cards with direct links to Assessment Center, EduTube, and Project Studio", () => {
    render(
      <MemoryRouter>
        <AdaptivePathwayView pathway={mockPathway} onRefresh={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Personalized Action Plan")).toBeInTheDocument();
    expect(screen.getByText("Watch: Engineering Mechanics: Statics - Full University Lecture Series")).toBeInTheDocument();
    expect(screen.getByText("Build Project: Speed Reducer Gearbox: 3D CAD Parametric Assembly")).toBeInTheDocument();

    const eduTubeLink = screen.getByRole("link", { name: /Watch on EduTube/i });
    expect(eduTubeLink).toHaveAttribute("href", "https://www.youtube.com/playlist?list=PLB56E342B28B33DCD");

    const projectLink = screen.getByRole("link", { name: /Open Project Blueprint/i });
    expect(projectLink).toHaveAttribute("href", "/dashboard/projects?templateId=mech-cad-gearbox-design");
  });

  it("invokes SmartSkillApi.completePathwayAction when mark as done is clicked", async () => {
    const completeSpy = vi.spyOn(SmartSkillApi, "completePathwayAction").mockResolvedValue({
      success: true,
      actionId: "act_review_engineering_mechanics",
      status: "completed",
    });
    const refreshSpy = vi.fn();

    render(
      <MemoryRouter>
        <AdaptivePathwayView pathway={mockPathway} onRefresh={refreshSpy} />
      </MemoryRouter>
    );

    const markButtons = screen.getAllByRole("button", { name: /Mark as Done|Mark Completed/i });
    fireEvent.click(markButtons[0]);

    await waitFor(() => {
      expect(completeSpy).toHaveBeenCalledWith(
        "act_review_engineering_mechanics",
        expect.objectContaining({
          skill: "Engineering Mechanics",
        })
      );
    });
  });

  it("renders diagnosed academic competencies table with transparent scores and prerequisites", () => {
    render(
      <MemoryRouter>
        <AdaptivePathwayView pathway={mockPathway} onRefresh={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Diagnosed Academic Competencies & Gaps")).toBeInTheDocument();
    expect(screen.getByText("Needs Remediation (< 70%)")).toBeInTheDocument();
    expect(screen.getByText("Mastered (≥ 80%)")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("85%")).toBeInTheDocument();
    expect(screen.getByText("All Met")).toBeInTheDocument();
  });

  it("renders comparable mastery progression history with verified score delta and safeguards", () => {
    render(
      <MemoryRouter>
        <AdaptivePathwayView pathway={mockPathway} onRefresh={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Evidence-Based Mastery Progression")).toBeInTheDocument();
    expect(screen.getByText("+25%")).toBeInTheDocument();
    expect(screen.getByText("50% →")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText(/Score increased by \+25% on comparable assessment/)).toBeInTheDocument();
    expect(screen.getByText(/Integrity Safeguard:/)).toBeInTheDocument();
  });

  it("LearningRoadmapPage renders tab switcher between Adaptive Pathway and Milestone Checklist", async () => {
    vi.spyOn(SmartSkillApi, "getAdaptiveLearningPathway").mockResolvedValue(mockPathway);
    vi.spyOn(SmartSkillApi, "getRecommendations").mockResolvedValue([]);

    render(
      <MemoryRouter>
        <LearningRoadmapPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Adaptive Pathway & Mastery Engine")).toBeInTheDocument();
      expect(screen.getByText("Milestone Checklist")).toBeInTheDocument();
    });

    // Default tab is Adaptive Pathway
    expect(screen.getByText("Learning-Improvement Loop Status")).toBeInTheDocument();

    // Click Milestone Checklist tab
    fireEvent.click(screen.getByText("Milestone Checklist"));

    await waitFor(() => {
      expect(screen.getByText("All Skill Gaps Addressed!")).toBeInTheDocument();
    });
  });
});
