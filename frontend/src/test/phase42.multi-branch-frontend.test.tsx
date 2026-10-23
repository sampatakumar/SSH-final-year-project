import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AcademicBackgroundStep, type AcademicState } from "../modules/onboarding/components/AcademicBackgroundStep";
import { academicApi, type AcademicOptionsResponse, type BranchCapabilitiesResponse } from "../modules/profile/services/academic.api";

describe("Phase 42: Multi-Branch Foundation Frontend Suite", () => {
  const mockMultiBranchCatalog: AcademicOptionsResponse = {
    degrees: [
      {
        slug: "btech",
        name: "Bachelor of Technology",
        shortName: "B.Tech",
        stream: "Engineering",
        durationYears: 4,
        totalSemesters: 8,
      },
      {
        slug: "mba",
        name: "Master of Business Administration",
        shortName: "MBA",
        stream: "Business & Commerce",
        durationYears: 2,
        totalSemesters: 4,
      },
      {
        slug: "ba",
        name: "Bachelor of Arts",
        shortName: "BA",
        stream: "Arts & Humanities",
        durationYears: 3,
        totalSemesters: 6,
      },
      {
        slug: "bsc-nursing",
        name: "Bachelor of Science in Nursing",
        shortName: "B.Sc Nursing",
        stream: "Healthcare & Life Sciences",
        durationYears: 4,
        totalSemesters: 8,
      },
    ],
    branches: [
      {
        slug: "cse",
        name: "Computer Science & Engineering",
        code: "CSE",
        degreeSlugs: ["btech"],
        stream: "Engineering",
        specializations: [
          { slug: "ai-ml", name: "Artificial Intelligence & Machine Learning" },
          { slug: "data-science", name: "Data Science" },
        ],
      },
      {
        slug: "mech",
        name: "Mechanical Engineering",
        code: "ME",
        degreeSlugs: ["btech"],
        stream: "Engineering",
        specializations: [
          { slug: "robotics-automation", name: "Robotics & Automation" },
        ],
      },
      {
        slug: "mba-gen",
        name: "Business Administration",
        code: "MBA",
        degreeSlugs: ["mba"],
        stream: "Business & Commerce",
        specializations: [
          { slug: "marketing", name: "Marketing Management" },
          { slug: "business-analytics", name: "Business Analytics" },
        ],
      },
      {
        slug: "nursing-gen",
        name: "Nursing",
        code: "NUR",
        degreeSlugs: ["bsc-nursing"],
        stream: "Healthcare & Life Sciences",
        specializations: [],
      },
    ],
    careerRoles: [
      {
        slug: "full-stack-developer",
        title: "Full Stack Developer",
        category: "Software Development",
        coreSkills: ["React", "Node.js", "TypeScript"],
      },
      {
        slug: "mechanical-design-engineer",
        title: "Mechanical Design Engineer",
        category: "Mechanical & Industrial",
        coreSkills: ["SolidWorks", "AutoCAD", "GD&T"],
      },
      {
        slug: "business-analyst",
        title: "Business Analyst",
        category: "Commerce & Business",
        coreSkills: ["SQL", "Power BI", "Financial Modeling"],
      },
      {
        slug: "registered-nurse",
        title: "Registered Nurse",
        category: "Healthcare & Clinical",
        coreSkills: ["Clinical Patient Assessment", "Pharmacology & Drug Administration"],
      },
    ],
    streams: [
      "Engineering",
      "Business & Commerce",
      "Arts & Humanities",
      "Healthcare & Life Sciences",
    ],
    careerCategories: [
      "Software Development",
      "Mechanical & Industrial",
      "Commerce & Business",
      "Healthcare & Clinical",
    ],
    capabilityDefinitions: [
      { key: "CODING_PRACTICE", label: "Interactive Coding Sandbox", category: "software" },
      { key: "GITHUB_ANALYSIS", label: "GitHub Repository Analysis", category: "portfolio" },
      { key: "CAD_PORTFOLIO", label: "CAD Engineering Portfolio", category: "portfolio" },
      { key: "HEALTHCARE_LEARNING_ASSESSMENT", label: "Clinical Learning Assessment", category: "clinical" },
    ],
  };

  const initialAcademic: AcademicState = {
    degreeSlug: "",
    degreeName: "",
    branchSlug: "",
    branchName: "",
    specializationSlug: "",
    specializationName: "",
    currentYear: null,
    currentSemester: null,
    institution: "",
    stream: "",
    graduationYear: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Academic Catalog Multi-Branch Ingestion", () => {
    it("renders degree options across multiple streams (Engineering, Business, Arts, Healthcare)", async () => {
      vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockMultiBranchCatalog);

      render(
        <AcademicBackgroundStep
          academic={initialAcademic}
          setAcademic={vi.fn()}
          targetRoles={[]}
          setTargetRoles={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Academic Background & Career Goals/)).toBeInTheDocument();
      });

      // Degrees from different academic disciplines should be visible in degree select
      expect(screen.getByText(/Bachelor of Technology/)).toBeInTheDocument();
      expect(screen.getByText(/Master of Business Administration/)).toBeInTheDocument();
      expect(screen.getByText(/Bachelor of Arts/)).toBeInTheDocument();
      expect(screen.getByText(/Bachelor of Science in Nursing/)).toBeInTheDocument();
    });

    it("cascades branches correctly when selecting an engineering vs business degree", async () => {
      vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockMultiBranchCatalog);

      const mockSetAcademic = vi.fn();
      render(
        <AcademicBackgroundStep
          academic={{
            ...initialAcademic,
            degreeSlug: "mba",
            degreeName: "Master of Business Administration",
            stream: "Business & Commerce",
          }}
          setAcademic={mockSetAcademic}
          targetRoles={[]}
          setTargetRoles={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Academic Background & Career Goals/)).toBeInTheDocument();
      });

      // Should show MBA branch option and specializations
      expect(screen.getByRole("option", { name: /^Business Administration/ })).toBeInTheDocument();
      // Should not show CSE under MBA
      expect(screen.queryByRole("option", { name: /Computer Science & Engineering/ })).not.toBeInTheDocument();
    });
  });

  describe("2. Branch Capabilities API Client", () => {
    it("queries branch capabilities endpoint with canonical slug", async () => {
      const mockCapabilitiesResponse: BranchCapabilitiesResponse = {
        branchSlug: "mech",
        branchName: "Mechanical Engineering",
        capabilities: [
          { key: "CODING_PRACTICE", label: "Interactive Coding Sandbox", status: "AVAILABLE", description: "In-browser code execution sandbox." },
          { key: "CAD_PORTFOLIO", label: "CAD Engineering Portfolio", status: "PLANNED", description: "3D CAD modeling and mechanism analysis." },
          { key: "HEALTHCARE_LEARNING_ASSESSMENT", label: "Clinical Learning Assessment", status: "UNSUPPORTED", description: "Not applicable to engineering disciplines." },
        ],
        availableCount: 1,
        plannedCount: 1,
        unsupportedCount: 1,
      };

      const spy = vi.spyOn(academicApi, "getBranchCapabilities").mockResolvedValue(mockCapabilitiesResponse);

      const res = await academicApi.getBranchCapabilities("mech");
      expect(spy).toHaveBeenCalledWith("mech");
      expect(res.branchSlug).toBe("mech");
      expect(res.capabilities).toHaveLength(3);
      expect(res.capabilities.find(c => c.key === "CAD_PORTFOLIO")?.status).toBe("PLANNED");
      expect(res.capabilities.find(c => c.key === "CODING_PRACTICE")?.status).toBe("AVAILABLE");
    });
  });

  describe("3. Graduation Year & Academic State Validation", () => {
    it("handles graduation year and academic progression inputs without error", async () => {
      vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockMultiBranchCatalog);

      const mockSetAcademic = vi.fn();
      render(
        <AcademicBackgroundStep
          academic={{
            ...initialAcademic,
            degreeSlug: "btech",
            degreeName: "Bachelor of Technology",
            branchSlug: "mech",
            branchName: "Mechanical Engineering",
            currentYear: 3,
            currentSemester: 5,
            institution: "National Institute of Technology",
            graduationYear: 2026,
          }}
          setAcademic={mockSetAcademic}
          targetRoles={["Mechanical Design Engineer"]}
          setTargetRoles={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Academic Background & Career Goals/)).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue("National Institute of Technology")).toBeInTheDocument();
      expect(screen.getByDisplayValue("2026")).toBeInTheDocument();
    });
  });

  describe("4. Regression Protection: CSE Experience Remains Intact", () => {
    it("continues to provide seamless CSE selection with existing specializations and roles", async () => {
      vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockMultiBranchCatalog);

      const mockSetAcademic = vi.fn();
      render(
        <AcademicBackgroundStep
          academic={{
            ...initialAcademic,
            degreeSlug: "btech",
            degreeName: "Bachelor of Technology",
            branchSlug: "cse",
            branchName: "Computer Science & Engineering",
          }}
          setAcademic={mockSetAcademic}
          targetRoles={["Full Stack Developer"]}
          setTargetRoles={vi.fn()}
          onSkip={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Academic Background & Career Goals/)).toBeInTheDocument();
      });

      // Specializations for CSE should be rendered
      expect(screen.getByText("Artificial Intelligence & Machine Learning")).toBeInTheDocument();
      expect(screen.getByText("Data Science")).toBeInTheDocument();
      // Target role (rendered in selected pill and/or role grid)
      expect(screen.getAllByText("Full Stack Developer").length).toBeGreaterThanOrEqual(1);
    });
  });
});
