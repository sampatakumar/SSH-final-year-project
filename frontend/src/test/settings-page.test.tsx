import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectedAccountsSection } from "../modules/settings/components/ConnectedAccountsSection";
import { SmartMentorSettingsSection } from "../modules/settings/components/SmartMentorSettingsSection";
import { EduTubeSettingsSection } from "../modules/settings/components/EduTubeSettingsSection";
import { NotificationSettingsSection } from "../modules/settings/components/NotificationSettingsSection";
import { AppearanceSection } from "../modules/settings/components/AppearanceSection";
import { PrivacyDataSection } from "../modules/settings/components/PrivacyDataSection";
import { AccountSection } from "../modules/settings/components/AccountSection";
import ProfileDetailsPage from "../pages/ProfileDetailsPage";

// Constant stable mock user reference
const mockUser = {
  _id: "user_123",
  email: "engineer@smartskillhub.com",
  displayName: "Sampata Kumar",
  targetRole: "Full Stack Engineer",
  about: "Passionate engineer building scalable AI platforms.",
  skillSections: [],
  experience: [],
  achievements: [],
  educationEntries: [],
};

// Mock Auth
vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    user: mockUser,
    idToken: "mock-jwt-token",
    refreshProfile: vi.fn().mockResolvedValue(undefined),
    signOutUser: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: vi.fn(),
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

describe("Settings 2.0 Components & Profile Details Test Suite", () => {
  let queryClient: QueryClient;

  const mockSettingsData = {
    mentorPreferences: {
      responseStyle: "balanced" as const,
      focusAreas: ["career", "github", "skills"],
      contextSources: ["profile", "skills", "github"],
      proactiveGuidance: ["next_actions", "skill_gaps"],
    },
    eduTubePreferences: {
      personalizedRecommendations: true,
      continueLearning: true,
      trackHistory: true,
      trackProgress: true,
      recommendFromGaps: true,
      recommendFromRoadmap: true,
    },
    notificationPreferences: {
      skillGapAlerts: true,
      learningRecommendations: true,
      githubAlerts: true,
      mentorRecommendations: true,
      eduTubeReminders: true,
    },
    privacyPreferences: {
      allowProfileContext: true,
      allowSkillsContext: true,
      allowResumeContext: true,
      allowProjectsContext: true,
      allowGitHubContext: true,
      allowEduTubeContext: true,
    },
    appearancePreferences: {
      theme: "dark" as const,
      accentColor: "purple",
    },
    githubIntegration: {
      connected: true,
      githubUsername: "sampatakumar",
      repositoriesCount: 14,
      lastSyncedAt: new Date().toISOString(),
      syncStatus: "synced" as const,
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it("1. Renders ConnectedAccountsSection with GitHub connection state and sync actions", () => {
    render(
      <ConnectedAccountsSection
        integration={mockSettingsData.githubIntegration}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/Connected Accounts/i)).toBeDefined();
    expect(screen.getByText(/@sampatakumar/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Sync Now/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Disconnect/i })).toBeDefined();
  });

  it("2. Renders SmartMentorSettingsSection and toggles preferences", () => {
    const onChange = vi.fn();
    render(
      <SmartMentorSettingsSection
        preferences={mockSettingsData.mentorPreferences}
        onChange={onChange}
      />
    );

    expect(screen.getByText(/Smart Mentor AI Configuration/i)).toBeDefined();
    expect(screen.getByText("Response Style")).toBeDefined();

    const conciseBtn = screen.getByRole("button", { name: /Concise/i });
    expect(conciseBtn).toBeDefined();
    fireEvent.click(conciseBtn);
    expect(onChange).toHaveBeenCalledWith({ responseStyle: "concise" });
  });

  it("3. Renders EduTubeSettingsSection and NotificationSettingsSection", () => {
    const onChangeEdu = vi.fn();
    const onChangeNotif = vi.fn();

    render(
      <div>
        <EduTubeSettingsSection
          preferences={mockSettingsData.eduTubePreferences}
          onChange={onChangeEdu}
        />
        <NotificationSettingsSection
          preferences={mockSettingsData.notificationPreferences}
          onChange={onChangeNotif}
        />
      </div>
    );

    expect(screen.getByText(/EduTube Learning Preferences/i)).toBeDefined();
    expect(screen.getByText(/AI Personalized Recommendations/i)).toBeDefined();
    expect(screen.getByText(/Notification Preferences/i)).toBeDefined();
    expect(screen.getByText(/Skill Gap Priority Alerts/i)).toBeDefined();
  });

  it("4. Renders AppearanceSection, PrivacyDataSection, and AccountSection", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AppearanceSection
          preferences={mockSettingsData.appearancePreferences}
          onChange={vi.fn()}
        />
        <PrivacyDataSection
          preferences={mockSettingsData.privacyPreferences}
          onChange={vi.fn()}
          onRefreshAll={vi.fn()}
        />
        <AccountSection />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Appearance & Theme/i)).toBeDefined();
    expect(screen.getByText(/Dark Mode/i)).toBeDefined();
    expect(screen.getByText(/Data & Privacy Controls/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Refresh My Data/i })).toBeDefined();
    expect(screen.getByText(/Account & Security/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Sign Out/i })).toBeDefined();
  });

  it("5. Renders Profile Details page with Master Profile editor", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ProfileDetailsPage />
      </QueryClientProvider>
    );

    expect(screen.getByRole("heading", { name: "Profile Details" })).toBeDefined();
    expect(
      screen.getByText(
        /Manage your professional identity, career information, and profile data used across Smart Skill Hub/i
      )
    ).toBeDefined();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Save Changes/i })).toBeDefined();
    });
  });
});
