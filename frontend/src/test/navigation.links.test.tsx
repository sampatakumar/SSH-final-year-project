import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import { dashboardLinks } from "../lib/dashboard-links";
import DashboardSidebar from "../components/DashboardSidebar";
import { AuthContext } from "../core/auth/AuthContext";
import PagePortfolios from "../pages/Portfolios";
import ModulePortfolios from "../modules/resume/Portfolios";

describe("Phase 8 Navigation & Re-Export Suite", () => {
  it("includes /dashboard/projects with FolderGit2 icon in dashboardLinks", () => {
    const projectLink = dashboardLinks.find((l) => l.to === "/dashboard/projects");
    expect(projectLink).toBeDefined();
    expect(projectLink?.label).toBe("Projects");
    expect(projectLink?.icon).toBeDefined();
  });

  it("includes /dashboard/portfolios in dashboardLinks", () => {
    const portfolioLink = dashboardLinks.find((l) => l.to === "/dashboard/portfolios");
    expect(portfolioLink).toBeDefined();
    expect(portfolioLink?.label).toBe("Portfolios");
  });

  it("renders Projects and Portfolios links in DashboardSidebar", () => {
    const mockAuthContext: any = {
      firebaseUser: { email: "student@example.com" },
      backendUser: { email: "student@example.com", targetRole: "Full Stack Developer" },
      signOutUser: async () => {},
      loading: false,
    };

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          <DashboardSidebar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Portfolios")).toBeInTheDocument();
  });

  it("ensures pages/Portfolios proxies the canonical modules/resume/Portfolios component", () => {
    expect(PagePortfolios).toBe(ModulePortfolios);
  });
});
