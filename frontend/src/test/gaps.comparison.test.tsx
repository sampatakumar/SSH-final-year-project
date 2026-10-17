import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SkillGapsPage from "../modules/gaps/SkillGapsPage";
import { SmartSkillApi } from "../lib/api";
import { academicApi } from "../modules/profile/services/academic.api";
import * as AuthModule from "../core/auth";

vi.mock("../core/auth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/api", () => ({
  SmartSkillApi: {
    getSkillGaps: vi.fn(),
    compareRoles: vi.fn(),
  },
}));

vi.mock("../modules/profile/services/academic.api", () => ({
  academicApi: {
    getOptions: vi.fn(),
  },
}));

describe("SkillGapsPage — Multi-Role Comparison & EduTube Integration Suite", () => {
  const mockComparisonData = {
    comparedRoles: ["Robotics Engineer", "Embedded Systems Engineer"],
    rolesCount: 2,
    rolesSummary: [
      {
        roleName: "Robotics Engineer",
        targetRole: "Robotics Engineer",
        roleDescription: "Kinematics, dynamics, and ROS 2 systems.",
        benchmarkStatus: "validated",
        benchmarkPending: false,
        roleMatchPercentage: 60,
        totalRequiredSkills: 5,
        metSkillsCount: 3,
        gapsCount: 2,
        topPriorityGap: {
          canonicalName: "Robot Kinematics",
          priority: "Critical",
        },
      },
      {
        roleName: "Embedded Systems Engineer",
        targetRole: "Embedded Systems Engineer",
        roleDescription: "Firmware, microcontrollers, and RTOS.",
        benchmarkStatus: "validated",
        benchmarkPending: false,
        roleMatchPercentage: 40,
        totalRequiredSkills: 6,
        metSkillsCount: 2,
        gapsCount: 4,
        topPriorityGap: {
          canonicalName: "RTOS",
          priority: "High",
        },
      },
    ],
    sharedSkillsCount: 2,
    sharedSkills: [
      {
        skill: "C++",
        canonicalName: "C++",
        rolesRequiring: ["Robotics Engineer", "Embedded Systems Engineer"],
        rolesMet: ["Robotics Engineer", "Embedded Systems Engineer"],
        rolesMissing: [],
      },
      {
        skill: "Microcontrollers",
        canonicalName: "Microcontrollers",
        rolesRequiring: ["Robotics Engineer", "Embedded Systems Engineer"],
        rolesMet: [],
        rolesMissing: ["Robotics Engineer", "Embedded Systems Engineer"],
      },
    ],
    roleSpecificSkillsCount: 2,
    roleSpecificSkills: {
      "Robotics Engineer": [
        { skill: "ROS 2", canonicalName: "ROS 2", rolesRequiring: ["Robotics Engineer"] },
      ],
      "Embedded Systems Engineer": [
        { skill: "UART/SPI/I2C", canonicalName: "UART/SPI/I2C", rolesRequiring: ["Embedded Systems Engineer"] },
      ],
    },
    highLeverageSkillsCount: 1,
    highLeverageSkills: [
      {
        skill: "Python",
        canonicalName: "Python",
        roleCount: 2,
        roles: ["Robotics Engineer", "Embedded Systems Engineer"],
        rolesRequiring: ["Robotics Engineer", "Embedded Systems Engineer"],
        rolesMet: [],
        rolesMissing: ["Robotics Engineer", "Embedded Systems Engineer"],
        currentLevel: "Developing",
        observableEvidence: "Motion planning and hardware telemetry scripts",
        learningRoute: "/dashboard/edutube?search=Python",
      },
    ],
    topCombinedGaps: [
      {
        canonicalName: "Robot Kinematics",
        priority: "Critical",
        reason: "Required for inverse kinematics.",
        affectedRoles: ["Robotics Engineer"],
        learningRoute: "/dashboard/edutube?search=Robot%20Kinematics",
      },
      {
        canonicalName: "RTOS",
        priority: "High",
        reason: "Required for deterministic task scheduling.",
        affectedRoles: ["Embedded Systems Engineer"],
        learningRoute: "/dashboard/edutube?search=RTOS",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    (AuthModule.useAuth as any).mockReturnValue({
      backendUser: {
        _id: "user123",
        targetRole: "Robotics Engineer",
        targetRoles: ["Robotics Engineer", "Embedded Systems Engineer"],
      },
    });

    (academicApi.getOptions as any).mockResolvedValue({
      careerRoles: [
        { slug: "robotics-engineer", title: "Robotics Engineer", category: "Mechanical & Industrial" },
        { slug: "embedded-systems-engineer", title: "Embedded Systems Engineer", category: "Electronics & Electrical" },
        { slug: "iot-developer", title: "IoT Developer", category: "Electronics & Electrical" },
      ],
    });

    (SmartSkillApi.getSkillGaps as any).mockResolvedValue({
      targetRole: "Robotics Engineer",
      roleDescription: "Kinematics, dynamics, and ROS 2 systems.",
      roleMatchPercentage: 60,
      benchmarkStatus: "validated",
      benchmarkPending: false,
      totalRequiredSkills: 5,
      metSkillsCount: 3,
      gapsCount: 2,
      gaps: [
        {
          canonicalName: "Robot Kinematics",
          status: "Missing",
          priority: "Critical",
          requiredLevel: "Proficient",
          observableEvidence: "Forward/inverse kinematics code and DH parameters",
          learningRoute: "/dashboard/edutube?search=Robot%20Kinematics",
        },
      ],
      metSkills: [],
      prerequisites: ["Linear Algebra", "Mechatronics Fundamentals"],
      observableEvidence: ["ROS 2 package repositories on GitHub with launch files"],
    });

    (SmartSkillApi.compareRoles as any).mockResolvedValue(mockComparisonData);
  });

  it("renders single role deep dive with prerequisites, observable evidence, and EduTube links", async () => {
    render(
      <BrowserRouter>
        <SkillGapsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Robotics Engineer")).toBeInTheDocument();
    });

    // Verify prerequisites row
    expect(screen.getByText("Linear Algebra")).toBeInTheDocument();

    // Verify observable evidence standard
    expect(screen.getByText(/Forward\/inverse kinematics code and DH parameters/i)).toBeInTheDocument();

    // Verify EduTube link
    const edutubeLinks = screen.getAllByText(/EduTube/i);
    expect(edutubeLinks.length).toBeGreaterThan(0);
  });

  it("switches to Multi-Role Comparison view and renders readiness breakdown, high-leverage skills, and shared skills", async () => {
    render(
      <BrowserRouter>
        <SkillGapsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Multi-Role Comparison")).toBeInTheDocument();
    });

    // Click on Multi-Role Comparison tab
    fireEvent.click(screen.getByText("Multi-Role Comparison"));

    await waitFor(() => {
      expect(SmartSkillApi.compareRoles).toHaveBeenCalledWith(["Robotics Engineer", "Embedded Systems Engineer"]);
    });

    // Verify readiness breakdown cards
    expect(screen.getByText("Target Role Readiness Breakdown")).toBeInTheDocument();
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();

    // Verify High-Leverage Multi-Role Skills section
    expect(screen.getByText("High-Leverage Multi-Role Skills")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("2 Roles")).toBeInTheDocument();

    // Verify Common Skills across tracks
    expect(screen.getByText(/Common Skills Across Tracks/i)).toBeInTheDocument();
    expect(screen.getByText("C++")).toBeInTheDocument();
    expect(screen.getByText("Microcontrollers")).toBeInTheDocument();

    // Verify Role-Specific Specializations
    expect(screen.getByText("Role-Specific Specializations")).toBeInTheDocument();
    expect(screen.getByText("ROS 2")).toBeInTheDocument();
    expect(screen.getByText("UART/SPI/I2C")).toBeInTheDocument();

    // Verify Combined Prioritized Backlog
    expect(screen.getByText(/Prioritized Cross-Role Action Backlog/i)).toBeInTheDocument();
  });
});
