import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SkillGapsPage from "../modules/gaps/SkillGapsPage";
import { SmartSkillApi } from "../lib/api";
import { academicApi } from "../modules/profile/services/academic.api";
import * as AuthModule from "../core/auth";

// Mock Auth
vi.mock("../core/auth", () => ({
  useAuth: vi.fn(),
}));

// Mock APIs
vi.mock("../lib/api", () => ({
  SmartSkillApi: {
    getSkillGaps: vi.fn(),
  },
}));

vi.mock("../modules/profile/services/academic.api", () => ({
  academicApi: {
    getOptions: vi.fn(),
  },
}));

describe("SkillGapsPage — Multi-Branch Catalog & Pending Benchmark Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (AuthModule.useAuth as any).mockReturnValue({
      backendUser: {
        _id: "user123",
        targetRole: "Robotics Engineer",
        targetRoles: ["Robotics Engineer", "Full Stack Developer"],
      },
    });

    (academicApi.getOptions as any).mockResolvedValue({
      careerRoles: [
        { slug: "robotics-engineer", title: "Robotics Engineer", category: "Mechanical & Industrial" },
        { slug: "full-stack-developer", title: "Full Stack Developer", category: "Software & Computing" },
        { slug: "vlsi-design-engineer", title: "VLSI Design Engineer", category: "Electronics & Electrical" },
      ],
    });

    (SmartSkillApi.getSkillGaps as any).mockImplementation(async (role: string) => {
      if (role === "Robotics Engineer") {
        return {
          targetRole: "Robotics Engineer",
          roleDescription: "Kinematics, dynamics, and automation controls.",
          roleMatchPercentage: 50,
          benchmarkStatus: "benchmark_pending",
          benchmarkPending: true,
          benchmarkNotice: "Detailed proficiency rubric is currently pending for this career track.",
          totalRequiredSkills: 5,
          metSkillsCount: 1,
          gapsCount: 4,
          gaps: [
            {
              canonicalName: "Kinematics & Dynamics",
              status: "Missing",
              priority: "High",
              requiredLevel: "Competent",
              reason: "Required for robotics engineering.",
            },
          ],
          metSkills: [
            {
              canonicalName: "Python / C++",
              status: "Met Requirement",
              priority: "None",
              currentScore: 85,
              currentLevel: "Proficient",
            },
          ],
        };
      }

      if (role === "NonExistentRole") {
        return {
          targetRole: "NonExistentRole",
          roleDescription: "No industry benchmark or catalog definition available.",
          roleMatchPercentage: null,
          benchmarkStatus: "unknown_role",
          benchmarkPending: true,
          benchmarkNotice: "Role is not recognized in standard benchmarks or the academic catalog.",
          totalRequiredSkills: 0,
          metSkillsCount: 0,
          gapsCount: 0,
          gaps: [],
          metSkills: [],
        };
      }

      return {
        targetRole: "Full Stack Developer",
        roleDescription: "Standard full stack engineering requirements.",
        roleMatchPercentage: 70,
        benchmarkStatus: "validated",
        benchmarkPending: false,
        totalRequiredSkills: 10,
        metSkillsCount: 7,
        gapsCount: 3,
        gaps: [
          {
            canonicalName: "Docker",
            status: "Weak / Action Required",
            priority: "High",
            requiredLevel: "Competent",
            currentScore: 30,
            currentLevel: "Limited Evidence",
            reason: "Needs containerization skills.",
          },
        ],
        metSkills: [],
      };
    });
  });

  it("renders with user target role and displays catalog options in dropdown", async () => {
    render(
      <BrowserRouter>
        <SkillGapsPage />
      </BrowserRouter>
    );

    // Initial role from backendUser
    await waitFor(() => {
      expect(screen.getByText("Robotics Engineer")).toBeInTheDocument();
    });

    // Verify benchmark pending banner appears for Robotics Engineer
    expect(screen.getByText("Catalog Core Skills Assessment")).toBeInTheDocument();
    expect(screen.getByText("Rubric Pending")).toBeInTheDocument();

    // Verify Kinematics gap is rendered and zero web gaps appear
    expect(screen.getByText("Kinematics & Dynamics")).toBeInTheDocument();
    expect(screen.queryByText("React")).not.toBeInTheDocument();
  });

  it("displays unrecognized role banner when an unknown role is analyzed", async () => {
    (AuthModule.useAuth as any).mockReturnValue({
      backendUser: {
        _id: "user123",
        targetRole: "NonExistentRole",
        targetRoles: ["NonExistentRole"],
      },
    });

    render(
      <BrowserRouter>
        <SkillGapsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Unrecognized Career Role")).toBeInTheDocument();
    });

    expect(screen.getByText("No Requirements Available")).toBeInTheDocument();
  });
});
