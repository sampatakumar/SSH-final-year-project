import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button, Card, Badge, ProgressBar, EmptyState, StatCard } from "../core/components";

describe("Core UI Components Suite", () => {
  it("renders Button component with primary styling", () => {
    render(<Button variant="primary">Click Me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain("ssh-btn-primary");
  });

  it("renders Card component with elevated styles", () => {
    const { container } = render(<Card elevated>Card Content</Card>);
    expect(container.firstChild).toHaveClass("ssh-card-elevated");
  });

  it("renders Badge component with success variant", () => {
    render(<Badge variant="success">Verified</Badge>);
    const badge = screen.getByText("Verified");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("ssh-badge-success");
  });

  it("renders ProgressBar with correct aria attributes", () => {
    render(<ProgressBar value={75} max={100} showLabel />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders EmptyState component with action trigger", () => {
    let actionTriggered = false;
    render(
      <EmptyState
        title="No Skills Evaluated"
        description="Connect your resume or GitHub to evaluate skills."
        actionText="Evaluate Now"
        onAction={() => {
          actionTriggered = true;
        }}
      />
    );
    expect(screen.getByText("No Skills Evaluated")).toBeInTheDocument();
    const actionBtn = screen.getByRole("button", { name: /evaluate now/i });
    actionBtn.click();
    expect(actionTriggered).toBe(true);
  });

  it("renders StatCard with title and formatted value", () => {
    render(<StatCard title="Total Skills" value={42} subtitle="Across 3 sources" />);
    expect(screen.getByText("Total Skills")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Across 3 sources")).toBeInTheDocument();
  });
});
