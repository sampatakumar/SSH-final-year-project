import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AcademicBackgroundStep, type AcademicState } from "../modules/onboarding/components/AcademicBackgroundStep";
import { academicApi, type AcademicOptionsResponse } from "../modules/profile/services/academic.api";

describe("Phase 10: Academic Onboarding Step Frontend Suite", () => {
  const mockCatalog: AcademicOptionsResponse = {
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
        slug: "mtech",
        name: "Master of Technology",
        shortName: "M.Tech",
        stream: "Engineering",
        durationYears: 2,
        totalSemesters: 4,
      },
    ],
    branches: [
      {
        slug: "cse",
        name: "Computer Science & Engineering",
        code: "CSE",
        degreeSlugs: ["btech", "mtech"],
        stream: "Engineering",
        specializations: [
          { slug: "ai-ml", name: "Artificial Intelligence & Machine Learning" },
          { slug: "data-science", name: "Data Science" },
        ],
      },
      {
        slug: "ece",
        name: "Electronics & Communication Engineering",
        code: "ECE",
        degreeSlugs: ["btech"],
        stream: "Engineering",
        specializations: [
          { slug: "vlsi", name: "VLSI Design" },
        ],
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
        slug: "ai-engineer",
        title: "AI Engineer",
        category: "Artificial Intelligence",
        coreSkills: ["Python", "PyTorch", "Machine Learning"],
      },
      {
        slug: "devops-engineer",
        title: "DevOps Engineer",
        category: "Infrastructure",
        coreSkills: ["Docker", "Kubernetes", "CI/CD"],
      },
    ],
    streams: ["Engineering"],
    careerCategories: ["Software Development", "Artificial Intelligence", "Infrastructure"],
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Loads and renders academic catalog options correctly", async () => {
    vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockCatalog);

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
      expect(screen.getByText(/Academic Background & Career Goals/i)).toBeInTheDocument();
      expect(screen.getByText(/Bachelor of Technology \(B.Tech\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Master of Technology \(M.Tech\)/i)).toBeInTheDocument();
    });
  });

  it("2. Filters academic branches based on selected degree", async () => {
    vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockCatalog);

    // Degree selected: M.Tech (which only includes CSE, not ECE)
    const mtechAcademic: AcademicState = {
      ...initialAcademic,
      degreeSlug: "mtech",
      degreeName: "Master of Technology",
    };

    render(
      <AcademicBackgroundStep
        academic={mtechAcademic}
        setAcademic={vi.fn()}
        targetRoles={[]}
        setTargetRoles={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Computer Science & Engineering \(CSE\)/i)).toBeInTheDocument();
      // ECE has degreeSlugs: ["btech"] only, so it should NOT be in M.Tech branch options
      expect(screen.queryByText(/Electronics & Communication Engineering \(ECE\)/i)).not.toBeInTheDocument();
    });
  });

  it("3. Displays branch-specific specializations when branch is selected", async () => {
    vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockCatalog);

    const cseAcademic: AcademicState = {
      ...initialAcademic,
      degreeSlug: "btech",
      branchSlug: "cse",
      branchName: "Computer Science & Engineering",
    };

    render(
      <AcademicBackgroundStep
        academic={cseAcademic}
        setAcademic={vi.fn()}
        targetRoles={[]}
        setTargetRoles={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Artificial Intelligence & Machine Learning/i)).toBeInTheDocument();
      expect(screen.getByText(/Data Science/i)).toBeInTheDocument();
    });
  });

  it("4. Calls onSkip when clicking 'Skip this step'", async () => {
    vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockCatalog);
    const skipSpy = vi.fn();

    render(
      <AcademicBackgroundStep
        academic={initialAcademic}
        setAcademic={vi.fn()}
        targetRoles={[]}
        setTargetRoles={vi.fn()}
        onSkip={skipSpy}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/skip this step/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/skip this step/i));
    expect(skipSpy).toHaveBeenCalled();
  });

  it("5. Allows multi-select of career goals and toggles roles", async () => {
    vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockCatalog);
    const setTargetRolesSpy = vi.fn();

    render(
      <AcademicBackgroundStep
        academic={initialAcademic}
        setAcademic={vi.fn()}
        targetRoles={["Full Stack Developer"]}
        setTargetRoles={setTargetRolesSpy}
        onSkip={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Selected (1):")).toBeInTheDocument();
      expect(screen.getByText("AI Engineer")).toBeInTheDocument();
    });

    // Clicking "AI Engineer" toggles it
    const aiEngineerButton = screen.getByText("AI Engineer").closest("button");
    fireEvent.click(aiEngineerButton!);

    expect(setTargetRolesSpy).toHaveBeenCalled();
  });

  it("6. Renders error alert and retry button when catalog load fails", async () => {
    const errorSpy = vi.spyOn(academicApi, "getOptions").mockRejectedValue(new Error("Catalog service offline"));

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
      expect(screen.getByText(/catalog service offline/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry catalog/i })).toBeInTheDocument();
    });

    // Clicking retry calls getOptions again
    fireEvent.click(screen.getByRole("button", { name: /retry catalog/i }));
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("7. Restores existing user selections correctly", async () => {
    vi.spyOn(academicApi, "getOptions").mockResolvedValue(mockCatalog);

    const restoredAcademic: AcademicState = {
      degreeSlug: "btech",
      degreeName: "Bachelor of Technology",
      branchSlug: "cse",
      branchName: "Computer Science & Engineering",
      specializationSlug: "ai-ml",
      specializationName: "Artificial Intelligence & Machine Learning",
      currentYear: 3,
      currentSemester: 5,
      institution: "Indian Institute of Technology",
    };

    render(
      <AcademicBackgroundStep
        academic={restoredAcademic}
        setAcademic={vi.fn()}
        targetRoles={["Full Stack Developer", "AI Engineer"]}
        setTargetRoles={vi.fn()}
        onSkip={vi.fn()}
      />
    );

    await waitFor(() => {
      const institutionInput = screen.getByDisplayValue("Indian Institute of Technology");
      expect(institutionInput).toBeInTheDocument();

      const yearSelect = screen.getByLabelText(/current year/i) as HTMLSelectElement;
      expect(yearSelect.value).toBe("3");

      const semSelect = screen.getByLabelText(/current semester/i) as HTMLSelectElement;
      expect(semSelect.value).toBe("5");

      expect(screen.getByText("Selected (2):")).toBeInTheDocument();
    });
  });
});
