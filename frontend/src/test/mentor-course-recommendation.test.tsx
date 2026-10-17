import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CourseRecommendationCard } from "../modules/mentor/components/CourseRecommendationCard";
import { CourseComparisonView } from "../modules/mentor/components/CourseComparisonView";
import { LearningPackageView } from "../modules/mentor/components/LearningPackageView";
import { MentorMessage } from "../modules/mentor/components/MentorMessage";
import type {
  CourseRecommendationItem,
  CourseComparisonData,
  LearningPackageData,
  CourseRecommendationsPayload,
  MentorMessageItem,
} from "../modules/mentor/types/smartMentor.types";

const mockCourseItem: CourseRecommendationItem = {
  id: "course-py-1",
  title: "Python for Beginners - Full Course [Programming with Mosh]",
  channelTitle: "Programming with Mosh",
  instructor: "Mosh Hamedani",
  youtubeUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
  edutubeUrl: "/dashboard/edutube?video=kqtD5dpn9C8",
  courseType: "full_course",
  technology: "Python",
  level: "beginner",
  duration: {
    formatted: "6 hours 14 mins",
    seconds: 22440,
    isVerified: true,
  },
  publishedAt: "2023-01-15T00:00:00Z",
  engagement: {
    source: "YouTube Data API v3 & Curated Analysis",
    publicStarRating: "Not provided by YouTube public API",
    ratingNote: "YouTube API does not provide universal public star ratings. Ranking is based on curriculum structure, recency, and verified engagement.",
  },
  topicsCovered: [
    "Variables and Types",
    "Control Flow",
    "Functions and Modules",
    "Object-Oriented Programming (OOP)",
    "File Handling",
  ],
  limitations: [
    "Asynchronous Python (asyncio)",
    "FastAPI/Django web framework integration",
  ],
  whyMatches:
    "Systematically structured beginner-to-advanced curriculum with hands-on practice projects.",
  levelSuitability: "Optimal for beginners building solid syntax and OOP foundations.",
};

const mockComparison: CourseComparisonData = {
  recommendedStartingCourseId: "course-py-1",
  startingRecommendationReason:
    "Provides the cleanest pedagogical structure and pacing for starting Python fundamentals before progressing to OOP.",
  courses: [
    {
      courseId: "course-py-1",
      title: "Python for Beginners - Full Course",
      instructor: "Mosh Hamedani",
      strength: "Systematic conceptual clarity and best starter projects.",
      bestFor: "Beginners wanting rock-solid programming syntax and core logic.",
      tradeOff: "Does not dive deep into async programming or advanced metaclasses.",
      isStartingPick: true,
    },
    {
      courseId: "course-py-2",
      title: "Python OOP & Project Masterclass",
      instructor: "Corey Schafer",
      strength: "Advanced patterns, decorators, generators, and packaging.",
      bestFor: "Developers with syntax knowledge moving to production architecture.",
      tradeOff: "Assumes prior knowledge of basic syntax and variables.",
      isStartingPick: false,
    },
  ],
};

const mockPackage: LearningPackageData = {
  title: "Python Complete Learning Package",
  technology: "Python",
  targetRole: "Backend Engineer",
  prerequisites: [
    "Basic computer literacy and terminal navigation",
    "Text editor or VS Code installed",
  ],
  modules: [
    {
      order: 1,
      title: "Python Syntax, Variables & Control Flow",
      recommendedCourse: {
        title: "Python for Beginners - Full Course",
        youtubeUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
        type: "full_course",
      },
      coreConcepts: ["Variables", "Data Types", "Conditionals", "Loops"],
      handsOnExercises: ["Build a CLI contact book saving JSON data to disk"],
      milestone: "Pass basic Python variables and loop test cases in sandbox",
    },
    {
      order: 2,
      title: "Data Structures & Functions",
      recommendedCourse: {
        title: "Python for Beginners - Full Course",
        youtubeUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
        type: "full_course",
      },
      coreConcepts: ["Lists", "Dicts", "Tuples", "Sets", "Functions", "Scope"],
      handsOnExercises: ["Implement an anagram detector and frequency counter"],
      milestone: "Solve 5 array/hashmap coding problems with passing unit tests",
    },
  ],
  projects: {
    miniProjects: [
      {
        title: "CLI Expense Tracker with CSV export",
        description: "Track monthly expenses, categories, and generate monthly CSV summaries.",
        keySkills: ["File I/O", "Data Parsing", "Exception Handling"],
      },
    ],
    capstoneProject: {
      title: "RESTful API Backend with SQLite & Authentication",
      description: "Build an API service with JWT auth, CRUD endpoints, and Docker containerization.",
      keySkills: ["FastAPI", "SQLite", "JWT Security", "Docker"],
      architectureTip: "Use layered architecture separating routes, services, and repositories.",
    },
  },
  codingChallenges: [
    {
      taskId: "two-sum",
      title: "Two Sum",
      difficulty: "Easy",
      category: "Arrays & Hashing",
    },
    {
      taskId: "valid-anagram",
      title: "Valid Anagram",
      difficulty: "Easy",
      category: "Strings",
    },
  ],
  milestones: [
    "Milestone 1: Complete syntax fundamentals and pass 5 basic coding challenges",
    "Milestone 2: Build CLI expense tracker project",
    "Milestone 3: Finish capstone REST API with test coverage",
  ],
  revisionInterview: {
    keyQuestions: [
      "Explain Python's GIL (Global Interpreter Lock) and how it affects multithreading",
      "Differences between list comprehension and generator expressions",
    ],
    dsaPracticeTopics: ["Array Hashmap lookups", "Two pointers", "Sliding window"],
  },
  nextSteps: [
    {
      step: "Progress to FastAPI for modern microservices",
      route: "/dashboard/roadmap",
      reason: "Industry standard for Python backend roles",
    },
  ],
  masteryNote:
    "Watching progress does not equate to verified skill mastery. Complete hands-on coding challenges and projects to demonstrate mastery.",
};

describe("AI Mentor YouTube Course Recommendations & Learning Packages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CourseRecommendationCard Component", () => {
    it("renders course title, instructor, duration, and difficulty badges correctly", () => {
      render(
        <MemoryRouter>
          <CourseRecommendationCard course={mockCourseItem} isStartingPick={true} />
        </MemoryRouter>
      );

      expect(screen.getByText("Python for Beginners - Full Course [Programming with Mosh]")).toBeInTheDocument();
      expect(screen.getByText("Programming with Mosh")).toBeInTheDocument();
      expect(screen.getByText("6 hours 14 mins")).toBeInTheDocument();
      expect(screen.getByText("beginner")).toBeInTheDocument();
      expect(screen.getByText("full course")).toBeInTheDocument();
      expect(screen.getByText("Recommended Starting Course")).toBeInTheDocument();
    });

    it("displays topics covered and identified limitations / missing topics", () => {
      render(
        <MemoryRouter>
          <CourseRecommendationCard course={mockCourseItem} />
        </MemoryRouter>
      );

      expect(screen.getByText("Curriculum Highlights")).toBeInTheDocument();
      expect(screen.getByText("Variables and Types")).toBeInTheDocument();
      expect(screen.getByText("Object-Oriented Programming (OOP)")).toBeInTheDocument();

      expect(screen.getByText(/Identified Limitations:/i)).toBeInTheDocument();
      expect(screen.getByText(/Asynchronous Python \(asyncio\)/i)).toBeInTheDocument();
    });

    it("displays the reason why the course matches and discloses YouTube rating limitation", () => {
      render(
        <MemoryRouter>
          <CourseRecommendationCard course={mockCourseItem} />
        </MemoryRouter>
      );

      expect(
        screen.getByText(
          "Systematically structured beginner-to-advanced curriculum with hands-on practice projects."
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText("Not provided by YouTube public API")
      ).toBeInTheDocument();
    });

    it("renders safe external link with noopener noreferrer to prevent tab-nabbing", () => {
      render(
        <MemoryRouter>
          <CourseRecommendationCard course={mockCourseItem} />
        </MemoryRouter>
      );

      const youtubeLink = screen.getByRole("link", { name: /YouTube/i });
      expect(youtubeLink).toHaveAttribute("href", "https://www.youtube.com/watch?v=kqtD5dpn9C8");
      expect(youtubeLink).toHaveAttribute("target", "_blank");
      expect(youtubeLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("navigates to EduTube player when 'Watch on EduTube' is clicked", () => {
      render(
        <MemoryRouter>
          <CourseRecommendationCard course={mockCourseItem} />
        </MemoryRouter>
      );

      const edutubeLink = screen.getByRole("link", { name: /Watch on EduTube/i });
      expect(edutubeLink).toHaveAttribute("href", "/dashboard/edutube?video=kqtD5dpn9C8");
    });
  });

  describe("CourseComparisonView Component", () => {
    it("renders top pick recommendation and trade-off comparison rows", () => {
      render(
        <CourseComparisonView
          comparison={mockComparison}
        />
      );

      expect(screen.getByText("Curriculum Comparison & Evidence-Based Trade-Offs")).toBeInTheDocument();
      expect(screen.getByText(/Recommended Starting Course:/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Provides the cleanest pedagogical structure and pacing/i)
      ).toBeInTheDocument();

      expect(screen.getByText("Python for Beginners - Full Course")).toBeInTheDocument();
      expect(screen.getByText("Python OOP & Project Masterclass")).toBeInTheDocument();
      expect(screen.getByText(/Systematic conceptual clarity and best starter projects/i)).toBeInTheDocument();
    });
  });

  describe("LearningPackageView Component", () => {
    it("renders 10-point learning package with modules, sandbox challenges, and capstone project", () => {
      render(
        <MemoryRouter>
          <LearningPackageView learningPackage={mockPackage} />
        </MemoryRouter>
      );

      expect(screen.getByText("Python Complete Learning Package")).toBeInTheDocument();
      expect(screen.getByText(/Role: Backend Engineer/i)).toBeInTheDocument();

      // Prerequisites visible by default
      expect(screen.getByText(/Prerequisites:/i)).toBeInTheDocument();
      expect(screen.getByText("Text editor or VS Code installed")).toBeInTheDocument();

      // Open drawer to view full 10-point roadmap
      const openBtn = screen.getByRole("button", { name: /View 10-Point Roadmap/i });
      fireEvent.click(openBtn);

      // Modules
      expect(screen.getByText(/1\. Ordered Learning Modules/i)).toBeInTheDocument();
      expect(screen.getByText(/Python Syntax, Variables & Control Flow/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Structures & Functions/i)).toBeInTheDocument();

      // Capstone Project
      expect(screen.getByText(/2\. Practical Portfolio & Capstone Projects/i)).toBeInTheDocument();
      expect(screen.getByText(/RESTful API Backend with SQLite & Authentication/i)).toBeInTheDocument();

      // Coding Challenges
      expect(screen.getByText(/3\. Sandbox Practice Challenges/i)).toBeInTheDocument();
      expect(screen.getByText("Two Sum")).toBeInTheDocument();
      const sandboxLink = screen.getAllByRole("link", { name: /Solve/i })[0];
      expect(sandboxLink).toHaveAttribute("href", "/dashboard/coding");

      // Interview prep and next steps
      expect(screen.getByText(/4\. Placement & Interview Revision Checklist/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Explain Python's GIL \(Global Interpreter Lock\)/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Progress to FastAPI for modern microservices/i)).toBeInTheDocument();

      // Anti-hallucination / mastery disclosure
      expect(
        screen.getByText(
          /Watching progress does not equate to verified skill mastery. Complete hands-on coding challenges and projects to demonstrate mastery./i
        )
      ).toBeInTheDocument();
    });

    it("allows toggling the roadmap drawer open and closed", () => {
      render(
        <MemoryRouter>
          <LearningPackageView learningPackage={mockPackage} />
        </MemoryRouter>
      );

      expect(screen.queryByText(/1\. Ordered Learning Modules/i)).not.toBeInTheDocument();
      const toggleBtn = screen.getByRole("button", { name: /View 10-Point Roadmap/i });
      fireEvent.click(toggleBtn);

      expect(screen.getByText(/1\. Ordered Learning Modules/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Hide Package/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Hide Package/i }));
      expect(screen.queryByText(/1\. Ordered Learning Modules/i)).not.toBeInTheDocument();
    });
  });

  describe("MentorMessage Integration with Recommendations", () => {
    it("renders course recommendations, comparison, and learning package when present on message", () => {
      const recommendationsPayload: CourseRecommendationsPayload = {
        intent: {
          technologyKey: "python",
          technologyName: "Python",
          level: "beginner",
          objective: "fundamentals",
          preferredLanguage: "English",
          targetRole: "Backend Engineer",
        },
        shortlist: [mockCourseItem],
        recommendedStartingCourseId: "course-py-1",
        comparison: mockComparison,
        learningPackage: mockPackage,
      };

      const messageWithCourses: MentorMessageItem = {
        role: "assistant",
        content: "Here is your curated Python learning package from beginner to advanced.",
        source: "local_nlp",
        courseRecommendations: recommendationsPayload,
        learningPackage: mockPackage,
        createdAt: new Date().toISOString(),
      };

      render(
        <MemoryRouter>
          <MentorMessage message={messageWithCourses} />
        </MemoryRouter>
      );

      // Text content
      expect(
        screen.getByText("Here is your curated Python learning package from beginner to advanced.")
      ).toBeInTheDocument();

      // Recommended course card
      expect(
        screen.getByText("Python for Beginners - Full Course [Programming with Mosh]")
      ).toBeInTheDocument();

      // Comparison view
      expect(screen.getByText("Curriculum Comparison & Evidence-Based Trade-Offs")).toBeInTheDocument();

      // Learning package view
      expect(screen.getByText("Python Complete Learning Package")).toBeInTheDocument();
    });
  });
});
