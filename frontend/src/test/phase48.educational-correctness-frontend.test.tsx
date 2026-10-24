import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { LabCard } from "../modules/labs/components/LabCard";
import { PracticalLab } from "../modules/labs/types/practicalLab.types";

const mockSafetySensitiveLab: PracticalLab = {
  labId: "nursing-lab-dosage-calculation",
  title: "Weight-Based Pediatric Drug Dosage Verification",
  description: "Verify weight-based pediatric prescription dosages and calculate liquid suspension volumes.",
  disciplineCategory: "Nursing & Health Sciences",
  branchSlugs: ["nursing"],
  canonicalDisciplines: ["nursing"],
  relevantSkills: ["Pharmacology & Drug Administration", "Patient Safety"],
  learningObjectives: ["Calculate total daily dosage", "Calculate volume per dose"],
  difficulty: "Intermediate",
  estimatedMinutes: 20,
  labType: "numerical_calculation",
  safetySensitive: true,
  disclaimer: "Strictly educational pharmacology math exercise. Not for clinical diagnosis.",
  scenario: {
    context: "A pediatric patient weighing 20.0 kg is prescribed Amoxicillin 45 mg/kg/day.",
  },
  tasks: [
    {
      taskId: "nurs-task-1",
      prompt: "Calculate daily dosage in mg",
      type: "numerical",
      points: 50,
      unit: "mg/day",
    },
    {
      taskId: "nurs-task-2",
      prompt: "Calculate liquid volume in mL",
      type: "numerical",
      points: 50,
      unit: "mL",
    },
  ],
  passingCriteria: { minScore: 70, passingPercentage: 70 },
  version: 1,
  status: "published",
};

const mockCivilSafetyLab: PracticalLab = {
  labId: "civil-lab-beam-bending",
  title: "Beam Shear & Maximum Bending Moment Analysis",
  description: "Calculate reactions, shear transitions, and maximum flexural moments for beams.",
  disciplineCategory: "Civil & Infrastructure",
  branchSlugs: ["civil"],
  canonicalDisciplines: ["civil"],
  relevantSkills: ["Structural Analysis", "Reinforced Concrete"],
  learningObjectives: ["Calculate support reactions"],
  difficulty: "Intermediate",
  estimatedMinutes: 25,
  labType: "numerical_calculation",
  safetySensitive: true,
  disclaimer: "Educational structural mechanics simulation.",
  scenario: {
    context: "Simply supported girder L = 6.0 m carries w = 12.0 kN/m and P = 20.0 kN.",
  },
  tasks: [
    {
      taskId: "civ-task-1",
      prompt: "Calculate reaction force Ra",
      type: "numerical",
      points: 50,
      unit: "kN",
    },
  ],
  passingCriteria: { minScore: 70, passingPercentage: 70 },
  version: 1,
  status: "published",
};

const mockRegularLab: PracticalLab = {
  labId: "cse-lab-algo-complexity",
  title: "Algorithmic Complexity & Execution Tracing Lab",
  description: "Analyze loop bounds and evaluate recurrence operations under strict constraints.",
  disciplineCategory: "Computer Science & IT",
  branchSlugs: ["cse"],
  canonicalDisciplines: ["cse"],
  relevantSkills: ["Algorithms", "Data Structures"],
  learningObjectives: ["Calculate loop iterations"],
  difficulty: "Intermediate",
  estimatedMinutes: 25,
  labType: "numerical_calculation",
  scenario: {
    context: "A distributed microservice processes an incoming square matrix.",
  },
  tasks: [],
  passingCriteria: { minScore: 70, passingPercentage: 70 },
  version: 1,
  status: "published",
};

describe("Phase 48: Educational Correctness & Safety Transparency Frontend Suite", () => {
  it("1. Renders safety-sensitive badge for clinical and physical engineering labs", () => {
    const { unmount } = render(
      <MemoryRouter>
        <LabCard lab={mockSafetySensitiveLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );

    const badge = screen.getByText(/safety-sensitive/i);
    expect(badge).toBeInTheDocument();
    unmount();

    render(
      <MemoryRouter>
        <LabCard lab={mockCivilSafetyLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/safety-sensitive/i)).toBeInTheDocument();
  });

  it("2. Non-safety-sensitive labs do not render the safety-sensitive badge", () => {
    render(
      <MemoryRouter>
        <LabCard lab={mockRegularLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );

    const badge = screen.queryByText(/safety-sensitive/i);
    expect(badge).not.toBeInTheDocument();
  });

  it("3. Displays educational task information, estimated time, and difficulty badge", () => {
    render(
      <MemoryRouter>
        <LabCard lab={mockCivilSafetyLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Beam Shear & Maximum Bending Moment Analysis")).toBeInTheDocument();
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
    expect(screen.getByText("25m")).toBeInTheDocument();
  });

  it("4. Calls onSelect callback with labId when launch button is clicked", () => {
    const onSelectMock = vi.fn();

    render(
      <MemoryRouter>
        <LabCard lab={mockSafetySensitiveLab} onSelect={onSelectMock} />
      </MemoryRouter>
    );

    const launchBtn = screen.getByRole("button", { name: /launch lab/i });
    fireEvent.click(launchBtn);
    expect(onSelectMock).toHaveBeenCalledWith("nursing-lab-dosage-calculation");
  });

  it("5. Multi-branch practical activities do not render code terminal or execution dependencies", () => {
    render(
      <MemoryRouter>
        <LabCard lab={mockSafetySensitiveLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/docker/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/terminal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stdin/i)).not.toBeInTheDocument();
  });

  it("6. Displays relevant discipline skills on lab card tags", () => {
    render(
      <MemoryRouter>
        <LabCard lab={mockCivilSafetyLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("Reinforced Concrete")).toBeInTheDocument();
    expect(screen.getByText("Structural Analysis")).toBeInTheDocument();
  });

  it("7. Displays task count badge transparently on lab card footer", () => {
    render(
      <MemoryRouter>
        <LabCard lab={mockSafetySensitiveLab} onSelect={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/2 practical tasks/i)).toBeInTheDocument();
  });
});
