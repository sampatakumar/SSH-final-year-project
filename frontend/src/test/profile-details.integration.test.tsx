import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ProfileDetailsPage from "../pages/ProfileDetailsPage";
import { ProfileApi } from "../modules/profile/services/profile.api";
import { toast } from "sonner";

// Stable mock user object
const mockUser = {
  _id: "user_123",
  email: "sampatakumar@smartskillhub.com",
  displayName: "Sampata Kumar",
  phone: "+91 9876543210",
  about: "Lead Full Stack Engineer specializing in AI and cloud systems.",
  customDomain: "sampata.dev",
  linkedInUrl: "https://linkedin.com/in/sampatakumar",
  githubUrl: "https://github.com/sampatakumar",
  leetCodeId: "sampatakumar_lc",
  geeksForGeeksId: "sampatakumar_gfg",
  targetRole: "Full Stack Engineer",
  educationEntries: [
    {
      degree: "B.Tech",
      specialization: "Computer Science",
      college: "Indian Institute of Technology",
      location: "Chennai, India",
      endDate: "2024",
      grade: "9.4 CGPA",
    },
  ],
  education: ["B.Tech in Computer Science - IIT"],
  skillSections: [
    { title: "Languages", skills: ["TypeScript", "Python", "Go"] },
    { title: "Frameworks", skills: ["React", "Node.js", "Express"] },
  ],
  skillLanguages: ["TypeScript", "Python", "Go"],
  experience: [
    {
      role: "Lead Full Stack Engineer",
      company: "Tech Innovations",
      location: "Bangalore",
      date: "2024 - Present",
      bullets: ["Architected microservices handling 100k requests/day."],
    },
  ],
  achievements: [
    {
      title: "1st Place National AI Hackathon",
      date: "Nov 2024",
      bullets: ["Built real-time code evaluation engine."],
    },
  ],
};

const refreshProfileMock = vi.fn().mockResolvedValue(undefined);

// Mock Auth
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    user: mockUser,
    backendUser: mockUser,
    idToken: "mock-jwt-token",
    refreshProfile: refreshProfileMock,
    signOutUser: vi.fn(),
  }),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Profile Details Integration Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.spyOn(ProfileApi, "getProfile").mockResolvedValue(mockUser);
  });

  it("1. Loads and populates existing master profile data into all fields", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileDetailsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for initial profile load to finish
    await waitFor(() => {
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeDefined();
    });

    // Personal Details
    expect(screen.getByDisplayValue("+91 9876543210")).toBeDefined();
    expect(screen.getByDisplayValue("sampatakumar@smartskillhub.com")).toBeDefined();
    expect(screen.getByDisplayValue("Lead Full Stack Engineer specializing in AI and cloud systems.")).toBeDefined();

    // External Profiles
    expect(screen.getByDisplayValue("sampata.dev")).toBeDefined();
    expect(screen.getByDisplayValue("https://linkedin.com/in/sampatakumar")).toBeDefined();
    expect(screen.getByDisplayValue("https://github.com/sampatakumar")).toBeDefined();
    expect(screen.getByDisplayValue("sampatakumar_lc")).toBeDefined();
    expect(screen.getByDisplayValue("sampatakumar_gfg")).toBeDefined();

    // Skills Matrix
    expect(screen.getByDisplayValue("Languages")).toBeDefined();
    expect(screen.getByDisplayValue("TypeScript")).toBeDefined();
    expect(screen.getByDisplayValue("Python")).toBeDefined();

    // Work Experience
    expect(screen.getByDisplayValue("Lead Full Stack Engineer")).toBeDefined();
    expect(screen.getByDisplayValue("Tech Innovations")).toBeDefined();

    // Education
    expect(screen.getByDisplayValue("B.Tech")).toBeDefined();
    expect(screen.getByDisplayValue("Indian Institute of Technology")).toBeDefined();

    // Achievements
    expect(screen.getByDisplayValue("1st Place National AI Hackathon")).toBeDefined();
  });

  it("2. Blocks submission and shows error if Full Name is empty or less than 2 characters", async () => {
    const updateSpy = vi.spyOn(ProfileApi, "updateProfile");

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileDetailsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeDefined();
    });

    const nameInput = screen.getByDisplayValue("Sampata Kumar");
    
    // Set to 1 character
    fireEvent.change(nameInput, { target: { value: "A" } });
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    expect(toast.error).toHaveBeenCalledWith("Full Name must contain at least 2 characters.");
    expect(updateSpy).not.toHaveBeenCalled();

    // Set to empty
    fireEvent.change(nameInput, { target: { value: "   " } });
    fireEvent.click(saveBtn);

    expect(toast.error).toHaveBeenCalledWith("Full Name is required.");
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it("3. Calls ProfileApi.updateProfile (PATCH /api/v1/auth/me) when Save Changes is clicked and invokes refreshProfile", async () => {
    const updateSpy = vi.spyOn(ProfileApi, "updateProfile").mockResolvedValue({
      ...mockUser,
      displayName: "Sampata Kumar Updated",
      phone: "+91 9999988888",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileDetailsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeDefined();
    });

    // Modify full name
    const nameInput = screen.getByDisplayValue("Sampata Kumar");
    fireEvent.change(nameInput, { target: { value: "Sampata Kumar Updated" } });

    // Click Save Changes
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          displayName: "Sampata Kumar Updated",
          phone: "+91 9876543210",
          about: "Lead Full Stack Engineer specializing in AI and cloud systems.",
          customDomain: "sampata.dev",
          linkedInUrl: "https://linkedin.com/in/sampatakumar",
          githubUrl: "https://github.com/sampatakumar",
        })
      );
      expect(refreshProfileMock).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
    });
  });

  it("4. Calls ProfileApi.generateProfileSummary (POST /api/v1/ai/profile-summary) and ONLY updates summary without erasing other fields", async () => {
    const summarySpy = vi.spyOn(ProfileApi, "generateProfileSummary").mockResolvedValue({
      profileSummary: "Generated AI Executive Summary for Full Stack Engineer.",
      summary: "Generated AI Executive Summary for Full Stack Engineer.",
      metadata: { provider: "groq", model: "openai/gpt-oss-120b" },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileDetailsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeDefined();
    });

    // Modify phone locally before auto-generating summary
    const phoneInput = screen.getByDisplayValue("+91 9876543210");
    fireEvent.change(phoneInput, { target: { value: "+91 9555544444" } });

    // Click Auto-Generate
    const autoGenBtn = screen.getByRole("button", { name: /Auto-Generate/i });
    fireEvent.click(autoGenBtn);

    await waitFor(() => {
      expect(summarySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          tone: "professional",
          maxWords: 90,
        })
      );
      // Summary is updated
      expect(screen.getByDisplayValue("Generated AI Executive Summary for Full Stack Engineer.")).toBeDefined();
      // Other unsaved user inputs are NOT wiped out
      expect(screen.getByDisplayValue("+91 9555544444")).toBeDefined();
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeDefined();
      expect(screen.getByDisplayValue("sampata.dev")).toBeDefined();
      expect(toast.success).toHaveBeenCalledWith("Professional summary generated successfully!");
    });
  });

  it("5. Displays friendly error toast if save fails and preserves unsaved form state", async () => {
    vi.spyOn(ProfileApi, "updateProfile").mockRejectedValue(new Error("Network timeout"));

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileDetailsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Sampata Kumar")).toBeDefined();
    });

    // Modify phone to trigger diff
    const phoneInput = screen.getByDisplayValue("+91 9876543210");
    fireEvent.change(phoneInput, { target: { value: "+91 9111122222" } });

    // Click Save Changes
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network timeout");
      // Value is preserved in input
      expect(screen.getByDisplayValue("+91 9111122222")).toBeDefined();
    });
  });
});
