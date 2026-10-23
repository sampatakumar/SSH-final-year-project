import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MentorContextPanel } from "../modules/mentor/components/MentorContextPanel";
import { smartMentorApi } from "../modules/mentor/services/smartMentor.api";
import type { MentorContextData } from "../modules/mentor/types/smartMentor.types";

describe("Phase 41: Cross-Module Student Intelligence Frontend Suite", () => {
  const mockContextData: MentorContextData = {
    career: {
      name: "Alex Rivera",
      targetRole: "Full Stack Developer",
      targetRoles: ["Full Stack Developer", "Backend Developer"],
      careerInterests: ["Cloud Architecture"],
      headline: "Full Stack Engineer in Training",
      readinessScore: 78,
      education: [],
      experienceYears: "1",
      academic: {
        degreeName: "Bachelor of Technology",
        branchName: "Computer Science and Engineering",
        currentYear: 4,
        currentSemester: 8,
        institution: "Engineering College",
        isConfigured: true,
      },
    },
    skills: [
      { name: "JavaScript", score: 85, level: "Proficient", category: "Languages" },
      { name: "Docker", score: 70, level: "Proficient", category: "DevOps" },
    ],
    skillGaps: [
      { skill: "Kubernetes", priority: "high", currentScore: 0, targetScore: 70, reason: "Container orchestration gap" },
    ],
    roadmap: [],
    github: {
      username: "alexrivera",
      hasAnalysis: true,
      repositoryCount: 15,
      repositoriesWithoutDescription: 1,
      repositoriesWithoutReadme: 0,
      reposWithoutDescList: [],
      reposWithoutReadmeList: [],
      topLanguages: ["TypeScript", "JavaScript"],
      totalStars: 12,
      optimizationScore: 85,
      strengths: ["Consistent git commits"],
      weaknesses: [],
      readmeQualityTips: [],
      portfolioTips: [],
    },
    learning: {
      videosWatched: 14,
      completedVideos: 8,
      savedCount: 3,
      playlistsCount: 2,
      recentTopics: ["React Architecture", "Docker Compose"],
      continueLearningTitle: "Advanced Node.js Streams",
    },
    projects: [],
    resume: {
      resumeCount: 1,
      hasSummary: true,
      hasExperience: true,
      hasEducation: true,
    },
    coding: {
      totalSubmissions: 15,
      passedCount: 9,
    },
    competencyMatrix: {
      summary: {
        totalCompetencies: 8,
        demonstratedCount: 3,
        evidenceIncompleteCount: 5,
        eligibleBadgesCount: 1,
      },
      demonstrated: [
        {
          canonicalSkill: "JavaScript",
          name: "Modern JavaScript Architecture",
          earnedPoints: 100,
          totalPoints: 100,
          badgeEligible: true,
        },
      ],
      incomplete: [
        {
          canonicalSkill: "Docker",
          name: "Containerization & Isolation",
          earnedPoints: 60,
          totalPoints: 100,
          missingRequirements: ["Pass 1 sandbox challenge"],
        },
      ],
    },
    earnedBadges: [
      {
        badgeId: "badge_js_verified",
        competencyId: "comp_js_core",
        competencyName: "Modern JavaScript Architecture",
        verificationHash: "hash_js_123456",
        issuedAt: "2026-10-22T10:00:00Z",
        status: "active",
      },
    ],
    retentionHealth: {
      totalCards: 18,
      revisionsDueToday: 4,
      streak: 6,
      masteredCards: 11,
    },
    evidenceTiers: {
      verified: [
        { name: "JavaScript", score: 85, level: "Proficient" },
        { name: "Docker", score: 70, level: "Proficient" },
      ],
      inferred: [{ name: "Python", score: 45, level: "Intermediate" }],
      selfReported: [{ name: "Cloud Architecture", source: "career_interests" }],
      missing: [{ skill: "Kubernetes", priority: "high" }],
    },
    unifiedNextActions: [
      {
        id: "action_due_rev",
        title: "Spaced Revision: JavaScript Closures",
        type: "spaced_revision",
        targetSkill: "JavaScript",
        actionUrl: "/dashboard/skills",
        estimatedMinutes: 10,
        priority: "critical",
        reason: "Review due today to halt forgetting curve and lock retrieval in memory.",
        evidenceTier: "RETENTION",
        module: "skills",
      },
    ],
    insights: ["Maintained 6-day retention streak."],
    updatedAt: new Date().toISOString(),
  };

  it("1. Renders verified competency badges in MentorContextPanel", () => {
    render(
      <MentorContextPanel
        context={mockContextData}
        isLoading={false}
        onRefresh={vi.fn()}
        isOpen={true}
      />
    );

    expect(screen.getByText(/Verified Competency Badges \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("Modern JavaScript Architecture")).toBeInTheDocument();
  });

  it("2. Renders memory retention health metrics (due today, streak, mastered)", () => {
    render(
      <MentorContextPanel
        context={mockContextData}
        isLoading={false}
        onRefresh={vi.fn()}
        isOpen={true}
      />
    );

    expect(screen.getByText(/Memory Retention Health/i)).toBeInTheDocument();
    expect(screen.getByText("Due Today")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
    expect(screen.getByText("Mastered")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument(); // 4 due today
    expect(screen.getByText("6")).toBeInTheDocument(); // streak 6
    expect(screen.getByText("11")).toBeInTheDocument(); // 11 mastered
  });

  it("3. Renders evidence quality grounding (verified empirical vs inferred signals)", () => {
    render(
      <MentorContextPanel
        context={mockContextData}
        isLoading={false}
        onRefresh={vi.fn()}
        isOpen={true}
      />
    );

    expect(screen.getByText(/Evidence Quality Grounding/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Empirical:/i)).toBeInTheDocument();
    expect(screen.getByText("2 skills")).toBeInTheDocument(); // 2 verified
    expect(screen.getByText(/Inferred Signals:/i)).toBeInTheDocument();
    expect(screen.getByText("1 skills")).toBeInTheDocument(); // 1 inferred
  });

  it("4. Renders prioritized unified next action card with direct route", () => {
    render(
      <MentorContextPanel
        context={mockContextData}
        isLoading={false}
        onRefresh={vi.fn()}
        isOpen={true}
      />
    );

    expect(screen.getByText(/Prioritized Next Action/i)).toBeInTheDocument();
    expect(screen.getByText("Spaced Revision: JavaScript Closures")).toBeInTheDocument();
    expect(screen.getByText(/Review due today to halt forgetting curve/i)).toBeInTheDocument();
    expect(screen.getByText("Act Now")).toBeInTheDocument();
  });

  it("5. Exposes Phase 41 API methods in smartMentorApi", () => {
    expect(typeof smartMentorApi.getCareerAlignment).toBe("function");
    expect(typeof smartMentorApi.getProgressExplanation).toBe("function");
    expect(typeof smartMentorApi.getUnifiedNextAction).toBe("function");
  });
});
