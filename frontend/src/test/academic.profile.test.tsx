import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import ProfileDetailsPage from "../pages/ProfileDetailsPage";
import { ProfileApi } from "../modules/profile/services/profile.api";
import { AcademicApi } from "../modules/profile/services/academic.api";
import { toast } from "sonner";

const mockAcademicUser = {
  _id: "user_academic_456",
  email: "student@smartskillhub.com",
  displayName: "Engineering Student",
  targetRole: "Full Stack Developer",
  targetRoles: ["Full Stack Developer"],
  careerInterests: ["Web Systems"],
  academic: {
    degreeSlug: "btech",
    degreeName: "Bachelor of Technology",
    branchSlug: "cse",
    branchName: "Computer Science and Engineering",
    specializationSlug: "ai-ml",
    specializationName: "Artificial Intelligence & Machine Learning",
    stream: "Engineering & Technology",
    currentYear: 3,
    currentSemester: 6,
    institution: "National Institute of Technology",
    academicScheme: "CBCS 2022",
  },
  educationEntries: [],
  skillSections: [],
  experience: [],
  achievements: [],
};

const mockCatalogOptions = {
  degrees: [
    { slug: "btech", name: "Bachelor of Technology", shortName: "B.Tech", stream: "Engineering & Technology" },
    { slug: "mtech", name: "Master of Technology", shortName: "M.Tech", stream: "Engineering & Technology" },
    { slug: "bcom", name: "Bachelor of Commerce", shortName: "B.Com", stream: "Commerce & Management" },
  ],
  branches: [
    {
      slug: "cse",
      name: "Computer Science and Engineering",
      code: "CSE",
      degreeSlugs: ["btech", "mtech"],
      stream: "Engineering & Technology",
      specializations: [
        { slug: "ai-ml", name: "Artificial Intelligence & Machine Learning" },
        { slug: "cloud-devops", name: "Cloud Computing & DevOps" },
      ],
    },
    {
      slug: "ece",
      name: "Electronics and Communication Engineering",
      code: "ECE",
      degreeSlugs: ["btech", "mtech"],
      stream: "Engineering & Technology",
      specializations: [
        { slug: "vlsi", name: "VLSI Design & Verification" },
        { slug: "embedded-iot", name: "Embedded Systems & IoT" },
      ],
    },
    {
      slug: "bcom-gen",
      name: "Commerce & Accounting",
      code: "B.Com",
      degreeSlugs: ["bcom"],
      stream: "Commerce & Management",
      specializations: [
        { slug: "business-analytics", name: "Business Analytics & Financial Modeling" },
      ],
    },
  ],
  careerRoles: [
    { slug: "full-stack-developer", title: "Full-Stack Developer", category: "Software & Computing" },
    { slug: "embedded-systems-engineer", title: "Embedded Systems Engineer", category: "Electronics & Electrical" },
  ],
  streams: ["Engineering & Technology", "Commerce & Management"],
  careerCategories: ["Software & Computing", "Electronics & Electrical"],
  curriculumSchemes: ["CBCS 2022", "CBCS 2018", "NEP 2020", "Autonomous 2023"],
  academicYears: [1, 2, 3, 4],
  semesters: [1, 2, 3, 4, 5, 6, 7, 8],
};

const refreshProfileMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/core/auth", () => ({
  useAuth: () => ({
    user: mockAcademicUser,
    backendUser: mockAcademicUser,
    idToken: "test-token",
    refreshProfile: refreshProfileMock,
    signOutUser: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Academic Profile Frontend Integration Suite", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.clearAllMocks();

    vi.spyOn(ProfileApi, "getProfile").mockResolvedValue(mockAcademicUser as any);
    vi.spyOn(AcademicApi, "getOptions").mockResolvedValue(mockCatalogOptions);
    vi.spyOn(AcademicApi, "getBranchRoles").mockResolvedValue([
      {
        slug: "full-stack-developer",
        title: "Full-Stack Developer",
        category: "Software & Computing",
        mapping: { relationshipType: "primary", relevanceScore: 98 },
      },
    ]);
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ProfileDetailsPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

  it("1. Renders Academic Background card and loads academic metadata from profile", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Academic Background & Specialization")).toBeDefined();
      expect(screen.getByText("Career Pathways & Role Goals")).toBeDefined();
    });

    const institutionInput = screen.getByPlaceholderText("e.g. National Institute of Technology") as HTMLInputElement;
    expect(institutionInput.value).toBe("National Institute of Technology");
  });

  it("2. Populates Degree and Branch options from catalog and supports dependent specializations", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("[CSE] Computer Science and Engineering")).toBeDefined();
    });

    expect(screen.getByText("Artificial Intelligence & Machine Learning")).toBeDefined();
  });

  it("3. Displays Career Pathways and allows adding a new career interest badge", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g. Embedded IoT, FinTech, Robotics")).toBeDefined();
    });

    const interestInput = screen.getByPlaceholderText("e.g. Embedded IoT, FinTech, Robotics");
    const addBtn = screen.getByRole("button", { name: /^add$/i });

    fireEvent.change(interestInput, { target: { value: "Generative AI" } });
    fireEvent.click(addBtn);

    expect(screen.getByText("Generative AI")).toBeDefined();
  });

  it("4. Calls ProfileApi.updateProfile with academic payload and target roles when form changes are saved", async () => {
    const updateProfileSpy = vi.spyOn(ProfileApi, "updateProfile").mockResolvedValue({
      success: true,
      data: { user: mockAcademicUser },
    } as any);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("e.g. National Institute of Technology")).toBeDefined();
    });

    // Modify institution to trigger change detection
    const institutionInput = screen.getByPlaceholderText("e.g. National Institute of Technology");
    fireEvent.change(institutionInput, { target: { value: "Indian Institute of Science" } });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateProfileSpy).toHaveBeenCalled();
    });

    const payload = updateProfileSpy.mock.calls[0][0];
    expect(payload.academic).toBeDefined();
    expect(payload.academic?.degreeSlug).toBe("btech");
    expect(payload.academic?.branchSlug).toBe("cse");
    expect(payload.academic?.institution).toBe("Indian Institute of Science");
    expect(payload.targetRoles).toContain("Full Stack Developer");
    expect(toast.success).toHaveBeenCalledWith("Profile updated successfully");
  });
});
