import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PersonalCareerMentor } from "../modules/github/components/PersonalCareerMentor";
import type { PersonalCareerMentorData, GitHubAnalysisData } from "../modules/github/types/github.types";

const mockMentorData: PersonalCareerMentorData = {
  targetRole: "Full Stack Developer",
  hero: {
    targetRole: "Full Stack Developer",
    currentStage: "Frontend-strong developer building toward Full-Stack readiness",
    strongestArea: "React / TypeScript UI Engineering",
    biggestGap: "Backend production & Docker containerization",
    nextPriority: "Build one production-style Node.js/Express + Database system with authentication, tests, and Docker.",
  },
  readinessDimensions: [
    {
      dimension: "Frontend Engineering",
      status: "Strong",
      score: 90,
      evidence: "Observed multiple active React and TypeScript projects.",
    },
    {
      dimension: "Backend Engineering",
      status: "Developing",
      score: 55,
      evidence: "Basic API endpoints observed, microservices depth developing.",
    },
    {
      dimension: "DevOps & Cloud (Docker / CI)",
      status: "Needs Attention",
      score: 30,
      evidence: "No Dockerfiles or GitHub Actions CI workflows detected.",
    },
  ],
  nextActions: [
    {
      order: "01",
      title: "Strengthen Backend Production Engineering",
      priority: "Critical",
      requirements: [
        "Implement robust JWT / session authentication",
        "Design standard RESTful endpoints",
        "Containerize with Docker and Docker Compose",
      ],
      why: "Frontend is strong; balancing with backend depth accelerates full-stack hiring readiness.",
      estimatedHours: 12,
    },
    {
      order: "02",
      title: "Add Automated Unit & Integration Tests",
      priority: "High",
      requirements: ["Write unit tests using Vitest", "Target 70% coverage"],
      why: "Testing evidence is currently under-indexed.",
      estimatedHours: 8,
    },
  ],
  githubImprovementPlan: {
    profile: ["Add clear bio highlighting Full Stack Developer specialization", "Pin top showcase projects"],
    repositories: ["Add topic tags (#docker, #typescript)", "Ensure 1-sentence descriptions on all repos"],
    engineering: ["Add GitHub Actions CI workflow", "Add Dockerfile"],
    activity: ["Maintain steady commit cadence"],
  },
  repositoryActionCenter: [
    {
      repoName: "smart-skill-hub",
      htmlUrl: "https://github.com/alexdev/smart-skill-hub",
      language: "TypeScript",
      isFork: false,
      documentationStatus: "Strong",
      testingStatus: "Detected",
      cicdStatus: "Not Detected",
      readmeStatus: "Present",
      architectureStatus: "Solid",
      actionItems: ["Add GitHub Actions CI & Dockerfile"],
      priority: "High",
    },
  ],
  topProjectsToShowcase: [
    {
      rank: 1,
      repoName: "smart-skill-hub",
      language: "TypeScript",
      stars: 45,
      why: "Demonstrates substantial technical scope and full-stack architecture.",
      whatToImprove: "Add automated CI workflow and architecture diagram.",
      portfolioValue: "High Showcase Value",
    },
  ],
  careerPath: {
    current: "Frontend Developer",
    nextSkill: "Backend Engineering & Docker",
    nextProject: "Production Full-Stack Application",
    nextEvidence: "Automated Tests + GitHub Actions CI + Docker",
    targetRole: "Full Stack Developer",
  },
  weeklyPlan: [
    {
      id: "w-1",
      task: "Add architecture diagram to smart-skill-hub README",
      priority: "High",
      estimatedHours: 2,
      reason: "First impression for engineering reviewers.",
      expectedEvidence: "README documentation",
      completed: false,
    },
  ],
  milestones: {
    days30: { phase: "Foundation & Hygiene", goals: ["Close Docker and REST API gaps"] },
    days60: { phase: "Project Depth & Systems", goals: ["Deploy production full-stack project"] },
    days90: { phase: "Portfolio & Job Readiness", goals: ["Polish portfolio and prepare interviews"] },
  },
  projectCoach: {
    classifiedTiers: {
      showcaseNow: [
        {
          repoName: "smart-skill-hub",
          htmlUrl: "https://github.com/alexdev/smart-skill-hub",
          projectType: "Full Stack Application",
          language: "TypeScript",
          isFork: false,
          isArchived: false,
          stars: 45,
          forks: 5,
          sizeKB: 2500,
          scorecard: {
            documentation: "✓ Good",
            readme: "⚠ Needs Improvement",
            description: "✓ Good",
            screenshots: "❌ Missing",
            liveDemo: "✓ Available",
            tests: "✓ Detected",
            cicd: "❌ Missing",
            license: "✓ MIT",
          },
          recruiterEvaluation: {
            score: 5,
            maxScore: 7,
            checklist: [],
          },
          suggestedDescription: "Full stack application with modern UI",
          missingReadmeSections: [],
          highestImpactImprovements: ["Add visual architecture diagram", "Add CI workflow"],
          specificAdvice: { presentation: "", features: [] },
        },
      ],
      improveNext: [
        {
          repoName: "weather-app",
          htmlUrl: "https://github.com/alexdev/weather-app",
          projectType: "Frontend Application",
          language: "JavaScript",
          isFork: false,
          isArchived: false,
          stars: 8,
          forks: 1,
          sizeKB: 300,
          scorecard: {
            documentation: "⚠ Needs Improvement",
            readme: "❌ Missing",
            description: "❌ Missing",
            screenshots: "❌ Missing",
            liveDemo: "✓ Available",
            tests: "❌ Missing",
            cicd: "❌ Missing",
            license: "❌ Missing",
          },
          recruiterEvaluation: {
            score: 2,
            maxScore: 7,
            checklist: [],
          },
          suggestedDescription: "Responsive weather application built with JavaScript",
          missingReadmeSections: [],
          highestImpactImprovements: ["Add repository description", "Create professional README"],
          specificAdvice: { presentation: "", features: [] },
        },
      ],
      needsWork: [],
      archiveLowPriority: [],
    },
    top5ProjectsToImprove: [
      {
        rank: 1,
        repoName: "weather-app",
        htmlUrl: "https://github.com/alexdev/weather-app",
        projectType: "Frontend Application",
        language: "JavaScript",
        currentQuality: "⚠ Needs Improvement",
        recruiterScore: "2/7",
        missingItems: ["Add repository description", "Create professional README"],
        whyItMatters: "High portfolio potential but currently under-documented.",
        recommendedChanges: ["Add repository description", "Create professional README"],
        priority: "Critical (Start Here)",
        careerValue: "Highest Portfolio Return",
        suggestedDescription: "Responsive weather application built with JavaScript",
        scorecard: {
          documentation: "⚠ Needs Improvement",
          readme: "❌ Missing",
          description: "❌ Missing",
          screenshots: "❌ Missing",
          liveDemo: "✓ Available",
          tests: "❌ Missing",
          cicd: "❌ Missing",
          license: "❌ Missing",
        },
      },
    ],
    startWithProject: {
      repoName: "smart-skill-hub",
      htmlUrl: "https://github.com/alexdev/smart-skill-hub",
      language: "TypeScript",
      projectType: "Full Stack Application",
      whyStartHere: '"smart-skill-hub" has the highest technical scope and potential for your roadmap.',
      top3Actions: ["Add architecture diagram", "Add CI workflow", "Document env vars"],
    },
    summaryStats: {
      totalAudited: 2,
      missingDescriptions: 1,
      missingDemos: 0,
      missingTests: 1,
    },
  },
  generatedAt: new Date().toISOString(),
};

const mockAnalysis: GitHubAnalysisData = {
  username: "alexdev",
  profile: {
    name: "Alex Dev",
    bio: "Frontend Engineer",
    avatarUrl: "https://github.com/alexdev.png",
    company: "Acme",
    location: "SF",
    blog: "https://alex.dev",
    publicRepos: 12,
    followers: 50,
    following: 10,
    createdAt: "2021-01-01T00:00:00Z",
  },
  repositories: [],
  languages: {},
  dominantLanguage: "TypeScript",
  aggregateStats: {
    totalStars: 45,
    totalForks: 5,
    totalWatchers: 45,
    totalIssues: 2,
    totalSizeKB: 2500,
    archivedCount: 0,
    forkedCount: 1,
  },
  analyzedAt: new Date().toISOString(),
};

describe("Personal Career Mentor Component Suite", () => {
  it("renders Hero Section with Target Role, Current Stage, and Next Priority", () => {
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText("Personal Career Mentor & Project Quality Coach")).toBeInTheDocument();
    expect(screen.getByText(/Frontend-strong developer building toward Full-Stack readiness/i)).toBeInTheDocument();
    expect(screen.getByText(/React \/ TypeScript UI Engineering/i)).toBeInTheDocument();
    expect(screen.getByText(/Backend production & Docker containerization/i)).toBeInTheDocument();
  });

  it("handles Target Role dropdown changes", () => {
    const mockRoleChange = vi.fn();
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={mockRoleChange}
      />
    );

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "Frontend Engineer" } });

    expect(mockRoleChange).toHaveBeenCalledWith("Frontend Engineer");
  });

  it("renders Career Readiness dimensions and evidence explanations", () => {
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText("Frontend Engineering")).toBeInTheDocument();
    expect(screen.getAllByText("Strong").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Observed multiple active React and TypeScript projects/i)).toBeInTheDocument();
  });

  it("renders prioritized action plan and weekly checklist toggle", () => {
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText("Strengthen Backend Production Engineering")).toBeInTheDocument();
    expect(screen.getByText("Priority: Critical")).toBeInTheDocument();
    expect(screen.getByText("Add architecture diagram to smart-skill-hub README")).toBeInTheDocument();
  });

  it("renders quick prompt pills in Q&A section", () => {
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText(/What should I learn next\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Which project should I improve\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Am I ready for my target role\?/i)).toBeInTheDocument();
  });

  it("renders 'Start With This Project' banner and highest-impact rationale", () => {
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText(/⚡ Start With This Project/i)).toBeInTheDocument();
    expect(screen.getAllByText("smart-skill-hub").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/highest technical scope/i)).toBeInTheDocument();
  });

  it("renders 'Projects to Improve' dashboard and smart prioritization tabs", () => {
    render(
      <PersonalCareerMentor
        mentorData={mockMentorData}
        analysis={mockAnalysis}
        targetRole="Full Stack Developer"
        onRoleChange={vi.fn()}
      />
    );

    expect(screen.getByText(/Projects to Improve/i)).toBeInTheDocument();
    expect(screen.getByText(/⭐ Improve Next/i)).toBeInTheDocument();
    expect(screen.getByText(/🔥 Showcase Now/i)).toBeInTheDocument();
    expect(screen.getByText(/weather-app/i)).toBeInTheDocument();
    expect(screen.getByText(/Missing Repository Description/i)).toBeInTheDocument();
  });
});
