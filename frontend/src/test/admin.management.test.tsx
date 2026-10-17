import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { AuthContext } from "../core/auth/AuthContext";
import { AdminUserManagement } from "../modules/admin/components/AdminUserManagement";
import { AdminCatalogGovernance } from "../modules/admin/components/AdminCatalogGovernance";
import AdminAnalytics from "../pages/AdminAnalytics";
import { AdminApi } from "../lib/api";
import * as apiModule from "../lib/api";

const mockAdminUsers = [
  {
    _id: "user-1",
    displayName: "Alice Student",
    email: "alice@university.edu",
    role: "student" as const,
    emailVerified: true,
    academic: {
      degreeName: "B.Tech Computer Science",
      branchName: "Computer Science & Engineering",
      institution: "State Tech University",
      currentSemester: 6,
    },
    targetRole: "Full Stack Developer",
    targetRoles: ["Full Stack Developer", "Backend Engineer"],
    onboardingCompletedAt: "2026-09-01T10:00:00.000Z",
    createdAt: "2026-08-15T10:00:00.000Z",
  },
  {
    _id: "user-2",
    displayName: "Bob Faculty",
    email: "bob@university.edu",
    role: "admin" as const,
    emailVerified: true,
    academic: {
      degreeName: "B.Tech Information Technology",
      branchName: "Information Technology",
      institution: "State Tech University",
      currentSemester: 8,
    },
    targetRole: "DevOps Engineer",
    targetRoles: ["DevOps Engineer"],
    onboardingCompletedAt: "2026-08-01T10:00:00.000Z",
    createdAt: "2026-07-20T10:00:00.000Z",
  },
];

const mockCatalogReport = {
  status: "healthy" as const,
  issuesCount: 0,
  totals: {
    degreesCount: 10,
    branchesCount: 29,
    careerRolesCount: 45,
    mappingsCount: 78,
    validatedBenchmarksCount: 30,
    pendingBenchmarksCount: 15,
  },
  orphanDegreeReferences: [],
  invalidMappings: [],
  unmappedRoles: [],
  pendingBenchmarkRoles: [
    {
      slug: "quantum-computing-engineer",
      title: "Quantum Computing Engineer",
      category: "Emerging Tech",
      coreSkillsCount: 6,
    },
  ],
};

function renderWithAuth(ui: React.ReactElement, authState: any = {}) {
  const defaultAuth = {
    firebaseUser: { email: "admin@university.edu", uid: "uid-admin" },
    backendUser: { _id: "admin-id", email: "admin@university.edu", role: "admin" },
    loading: false,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={{ ...defaultAuth, ...authState }}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
}

describe("Phase 11 Frontend Admin Management & Catalog Governance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Admin User Management View", () => {
    it("renders paginated user list with role badges and academic details", async () => {
      vi.spyOn(AdminApi, "getUsers").mockResolvedValue({
        users: mockAdminUsers,
        pagination: {
          page: 1,
          limit: 15,
          total: 2,
          totalPages: 1,
          hasNextPage: false,
        },
      });

      renderWithAuth(<AdminUserManagement />);

      expect(screen.getByPlaceholderText(/search by name, email/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Alice Student")).toBeInTheDocument();
        expect(screen.getByText("alice@university.edu")).toBeInTheDocument();
        expect(screen.getByText("Bob Faculty")).toBeInTheDocument();
        expect(screen.getByText("Full Stack Developer")).toBeInTheDocument();
        expect(screen.getByText("Computer Science & Engineering")).toBeInTheDocument();
      });
    });

    it("opens user inspection details dialog when 'View' is clicked", async () => {
      vi.spyOn(AdminApi, "getUsers").mockResolvedValue({
        users: mockAdminUsers,
        pagination: { page: 1, limit: 15, total: 2, totalPages: 1, hasNextPage: false },
      });

      vi.spyOn(AdminApi, "getUserDetails").mockResolvedValue({
        user: mockAdminUsers[0] as any,
        stats: {
          projectsCount: 3,
          submissionsCount: 7,
          skillsEvaluated: 12,
          readinessScore: 84,
          empiricalMastery: 79,
        },
      });

      renderWithAuth(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByText("Alice Student")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /User Profile & Activity Details/i })
        ).toBeInTheDocument();
        expect(screen.getAllByText("State Tech University").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Projects")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument(); // projectsCount
        expect(screen.getByText("7")).toBeInTheDocument(); // submissionsCount
      });
    });

    it("prevents self-demotion and primary system admin modification", async () => {
      vi.spyOn(AdminApi, "getUsers").mockResolvedValue({
        users: [
          {
            _id: "admin-id", // Same as current logged in user
            displayName: "Logged Admin",
            email: "admin@university.edu",
            role: "admin",
            emailVerified: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          {
            _id: "primary-admin-id",
            displayName: "Sampat Kumar",
            email: "sampatakumarsv@gmail.com", // DEFAULT_ADMIN_EMAIL
            role: "admin",
            emailVerified: true,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 15, total: 2, totalPages: 1, hasNextPage: false },
      });

      renderWithAuth(<AdminUserManagement />);

      await waitFor(() => {
        expect(screen.getByText("Logged Admin")).toBeInTheDocument();
        expect(screen.getByText("Sampat Kumar")).toBeInTheDocument();
      });

      const roleButtons = screen.getAllByRole("button", { name: /^role$/i });
      // Both buttons must be disabled by privilege guards
      expect(roleButtons[0]).toBeDisabled();
      expect(roleButtons[1]).toBeDisabled();
    });
  });

  describe("2. Academic & Career Catalog Governance View", () => {
    it("renders catalog integrity status, totals, and truthful benchmark coverage", async () => {
      vi.spyOn(AdminApi, "getCatalogIntegrity").mockResolvedValue(mockCatalogReport);

      renderWithAuth(<AdminCatalogGovernance />);

      await waitFor(() => {
        expect(screen.getByText(/Catalog Integrity Status:/i)).toBeInTheDocument();
        expect(screen.getByText("Zero Issues")).toBeInTheDocument();
        expect(screen.getByText("Quantum Computing Engineer")).toBeInTheDocument();
        expect(screen.getByText("Benchmark Pending")).toBeInTheDocument();
        expect(
          screen.getByText(/Core taxonomy evaluated without artificial fallback/i)
        ).toBeInTheDocument();
      });
    });

    it("opens safe catalog removal modal with referential preservation policy", async () => {
      vi.spyOn(AdminApi, "getCatalogIntegrity").mockResolvedValue(mockCatalogReport);

      renderWithAuth(<AdminCatalogGovernance />);

      await waitFor(() => {
        expect(screen.getByText("Quantum Computing Engineer")).toBeInTheDocument();
      });

      const safeRemoveBtn = screen.getByRole("button", { name: /safe remove/i });
      fireEvent.click(safeRemoveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Safe Catalog Record Removal/i)).toBeInTheDocument();
        expect(screen.getByText(/Referential Preservation Policy/i)).toBeInTheDocument();
        expect(screen.getByText(/soft-deactivated/i)).toBeInTheDocument();
      });
    });
  });

  describe("3. Upgraded Admin Analytics Page Tabs Navigation", () => {
    it("renders tabs for System Analytics, User Management, and Catalog", async () => {
      vi.spyOn(apiModule, "apiRequest").mockResolvedValue({
        status: 200,
        data: [
          {
            date: "2026-08-27",
            rateLimitHits: 2,
            groqRequests: 35,
            newUsers: 10,
            portfoliosPublished: 4,
            resumesUploaded: 8,
            apiHits: { "/api/v1/auth/me": 50 },
          },
        ],
        message: "OK",
      } as any);

      renderWithAuth(<AdminAnalytics />);

      await waitFor(() => {
        expect(screen.getByText("Admin Analytics")).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /system analytics/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /user management/i })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: /academic & career catalog/i })).toBeInTheDocument();
      });
    });
  });
});
