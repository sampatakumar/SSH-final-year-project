import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import CommunityPage from "../pages/CommunityPage";
import { communityClient } from "@/core/api/communityClient";

// Mock auth hook
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    backendUser: {
      _id: "user_aarav_01",
      displayName: "Aarav Sharma",
      academic: {
        branchName: "Computer Science and Engineering",
        branchSlug: "cse",
      },
    },
    firebaseUser: {
      displayName: "Aarav Sharma",
    },
    authInitialized: true,
  }),
}));

// Mock community socket
vi.mock("@/core/socket/communitySocket", () => ({
  connectCommunitySocket: vi.fn().mockResolvedValue(null),
  disconnectCommunitySocket: vi.fn(),
  joinGroupRoom: vi.fn(),
  leaveGroupRoom: vi.fn(),
  sendSocketTypingStart: vi.fn(),
  sendSocketTypingStop: vi.fn(),
  subscribeToCommunityEvents: vi.fn().mockReturnValue(() => {}),
}));

// Mock communityClient
vi.mock("@/core/api/communityClient", () => ({
  communityClient: {
    listGroups: vi.fn(),
    getMessages: vi.fn(),
    sendMessage: vi.fn(),
    getStudentDirectory: vi.fn(),
    getPublicProjects: vi.fn(),
    listMembers: vi.fn().mockResolvedValue({ members: [] }),
    joinGroup: vi.fn(),
    deleteMessage: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Phase 56: Student Community, Global Messaging & Collaboration Frontend Suite", () => {
  const mockGroups = [
    {
      _id: "group_global_01",
      name: "Smart Skill Hub — Global Community",
      slug: "smart-skill-hub-global-community",
      description: "Platform-wide student collaboration and discussion lounge.",
      category: "General Discussion",
      visibility: "public" as const,
      isGlobal: true,
      isPasswordProtected: false,
      memberCount: 128,
      rules: ["Be respectful", "Share knowledge"],
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      _id: "group_robotics_02",
      name: "ROS2 & Autonomous Robotics Circle",
      slug: "ros2-autonomous-robotics-circle",
      description: "Working on robotic arms, kinematics, and ROS2 simulation.",
      category: "Engineering",
      visibility: "public" as const,
      isGlobal: false,
      isPasswordProtected: false,
      memberCount: 34,
      rules: ["Include code snippets"],
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  const mockMessages = [
    {
      _id: "msg_001",
      group: "group_global_01",
      sender: {
        _id: "user_diya_02",
        displayName: "Diya Patel",
        academic: {
          branchName: "Mechanical Engineering",
          institution: "IIT Bombay",
        },
      },
      content: "Has anyone set up the new CAD kinematics tools for robotic linkages?",
      messageType: "text" as const,
      attachments: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const mockStudents = [
    {
      _id: "student_kavya_03",
      displayName: "Kavya Reddy",
      headline: "AI Systems Researcher | PyTorch & CUDA",
      about: "Third-year CSE student exploring distributed LLM inference.",
      targetRole: "Machine Learning Engineer",
      careerInterests: ["Deep Learning", "Robotics"],
      academic: {
        degreeName: "B.Tech Computer Science",
        branchName: "Computer Science and Engineering",
        branchSlug: "cse",
        institution: "NIT Warangal",
        currentSemester: 6,
      },
      topSkills: ["Python", "PyTorch", "Transformers", "Docker"],
      publicProjectCount: 3,
      earnedBadgeCount: 5,
    },
  ];

  const mockProjects = [
    {
      _id: "proj_quadcopter_01",
      title: "Autonomous Quadcopter Flight Controller",
      description: "Developing PX4 firmware modules with obstacle avoidance algorithms.",
      branchSlug: "mech",
      roleSlug: "robotics-engineer",
      status: "in_progress",
      openForCollaboration: true,
      neededRoles: ["Firmware Developer", "Control Systems Engineer"],
      neededSkills: ["C++", "ROS2", "PID Tuning"],
      deliverables: [],
      owner: {
        _id: "user_diya_02",
        displayName: "Diya Patel",
        branchName: "Mechanical Engineering",
        institution: "IIT Bombay",
        headline: "Robotics Enthusiast",
      },
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(communityClient.listGroups).mockResolvedValue({
      groups: mockGroups,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    vi.mocked(communityClient.getMessages).mockResolvedValue({
      messages: mockMessages,
      pagination: { page: 1, limit: 50, total: 1, hasMore: false },
    });
  });

  it("1. Renders top navigation tabs and Community header", async () => {
    render(<CommunityPage />);

    expect(screen.getByText("Student Community & Collaboration")).toBeDefined();
    expect(screen.getByText("Chat & Groups")).toBeDefined();
    expect(screen.getByText("Discover Groups")).toBeDefined();
    expect(screen.getByText("Student Directory")).toBeDefined();
    expect(screen.getByText("Project Collaboration")).toBeDefined();
  });

  it("2. Loads and displays group list with Global Community badge", async () => {
    render(<CommunityPage />);

    await waitFor(() => {
      const globalMatches = screen.getAllByText("Smart Skill Hub — Global Community");
      expect(globalMatches.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("ROS2 & Autonomous Robotics Circle")).toBeDefined();
      expect(screen.getAllByText(/Global/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("3. Displays message history with sender branch and content", async () => {
    render(<CommunityPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Has anyone set up the new CAD kinematics tools for robotic linkages?")
      ).toBeDefined();
      expect(screen.getByText("Diya Patel")).toBeDefined();
      expect(screen.getByText("• Mechanical Engineering")).toBeDefined();
    });
  });

  it("4. Sends message through composer input", async () => {
    vi.mocked(communityClient.sendMessage).mockResolvedValue({
      _id: "msg_new_002",
      group: "group_global_01",
      sender: {
        _id: "user_aarav_01",
        displayName: "Aarav Sharma",
        academic: { branchName: "Computer Science and Engineering" },
      },
      content: "Yes! The beam deflection calculator works cleanly.",
      messageType: "text",
      attachments: [],
      createdAt: new Date().toISOString(),
    });

    render(<CommunityPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Smart Skill Hub — Global Community").length).toBeGreaterThanOrEqual(1);
    });

    const input = screen.getByPlaceholderText(/Message #Smart Skill Hub — Global Community.../i);
    fireEvent.change(input, { target: { value: "Yes! The beam deflection calculator works cleanly." } });

    const sendBtn = screen.getByText("Send");
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(communityClient.sendMessage).toHaveBeenCalledWith("group_global_01", {
        content: "Yes! The beam deflection calculator works cleanly.",
        replyTo: null,
      });
    });
  });

  it("5. Navigates to Student Directory and renders verified badges and academic branch", async () => {
    vi.mocked(communityClient.getStudentDirectory).mockResolvedValue({
      students: mockStudents,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    render(<CommunityPage />);

    const studentTab = screen.getByText("Student Directory");
    fireEvent.click(studentTab);

    await waitFor(() => {
      expect(screen.getByText("Student Directory & Peer Discovery")).toBeDefined();
      expect(screen.getByText("Kavya Reddy")).toBeDefined();
      expect(screen.getByText(/NIT Warangal/)).toBeDefined();
      expect(screen.getByText("5 Badges")).toBeDefined();
    });
  });

  it("6. Navigates to Project Collaboration Hub and displays needed roles", async () => {
    vi.mocked(communityClient.getPublicProjects).mockResolvedValue({
      projects: mockProjects,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    render(<CommunityPage />);

    const projectsTab = screen.getByText("Project Collaboration");
    fireEvent.click(projectsTab);

    await waitFor(() => {
      expect(screen.getByText("Project Collaboration Hub")).toBeDefined();
      expect(screen.getByText("Autonomous Quadcopter Flight Controller")).toBeDefined();
      expect(screen.getByText("Teammates Wanted")).toBeDefined();
      expect(screen.getByText("Firmware Developer")).toBeDefined();
      expect(screen.getByText("Control Systems Engineer")).toBeDefined();
    });
  });
});
