import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import { AuthContext } from "../core/auth/AuthContext";
import { ProductPreview } from "../components/landing/ProductPreview";
import { HowItWorks } from "../components/landing/HowItWorks";
import { TestimonialsAndFAQ } from "../components/landing/TestimonialsAndFAQ";

// Mock Auth Context Value Helper
const renderWithAuth = (ui: React.ReactElement, authOverrides = {}) => {
  const defaultAuth = {
    firebaseUser: null,
    mongoUser: null,
    loading: false,
    authInitialized: true,
    signInWithGoogle: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue({}),
    refreshProfile: vi.fn().mockResolvedValue({}),
    ...authOverrides,
  };

  return render(
    <AuthContext.Provider value={defaultAuth as any}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe("Smart Skill Hub Landing Page Suite", () => {
  it("renders the hero headline and brand badge correctly", () => {
    renderWithAuth(<Landing />);

    // Brand and headline
    expect(screen.getAllByText("Smart Skill Hub").length).toBeGreaterThan(0);
    expect(screen.getByText("All-in-One Career Growth Platform")).toBeInTheDocument();
    expect(screen.getByText("Get Hired.")).toBeInTheDocument();
  });

  it("renders the 4 trust indicators in the hero section", () => {
    renderWithAuth(<Landing />);

    expect(screen.getByText("AI-Powered")).toBeInTheDocument();
    expect(screen.getByText("10+ Tools")).toBeInTheDocument();
    expect(screen.getByText("100% Free")).toBeInTheDocument();
    expect(screen.getByText("Secure")).toBeInTheDocument();
  });

  it("renders ProductPreview with realistic metrics and simulated activities", () => {
    render(<ProductPreview />);

    expect(screen.getByText(/Welcome back, Sampata!/i)).toBeInTheDocument();
    expect(screen.getByText("Skills Analyzed")).toBeInTheDocument();
    expect(screen.getByText("Projects Built")).toBeInTheDocument();
    expect(screen.getByText("Learning Hours")).toBeInTheDocument();
    expect(screen.getByText("Mentor Interactions")).toBeInTheDocument();
    expect(screen.getByText("React Query")).toBeInTheDocument();
  });

  it("renders all 10 key features in the feature grid", () => {
    renderWithAuth(<Landing />);

    expect(screen.getAllByText("Smart Mentor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Skill Profile").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Skill Gaps").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Learning Roadmap").length).toBeGreaterThan(0);
    expect(screen.getAllByText("EduTube").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Coding Assessment").length).toBeGreaterThan(0);
    expect(screen.getAllByText("GitHub Intelligence").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Resume AI").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Portfolios").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Analytics").length).toBeGreaterThan(0);
  });

  it("renders HowItWorks 3-step workflow correctly", () => {
    render(<HowItWorks />);

    expect(screen.getByText("1. Create Your Profile")).toBeInTheDocument();
    expect(screen.getByText("2. Get AI Analysis")).toBeInTheDocument();
    expect(screen.getByText("3. Learn, Build & Grow")).toBeInTheDocument();
  });

  it("expands and collapses FAQ accordion items on click", async () => {
    render(<TestimonialsAndFAQ />);

    const faqButton = screen.getByText("Is Smart Skill Hub really free?");
    expect(faqButton).toBeInTheDocument();

    // Initially collapsed
    expect(screen.queryByText(/You can analyze your skills, discover skill gaps/i)).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(faqButton);
    expect(screen.getByText(/You can analyze your skills, discover skill gaps/i)).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(faqButton);
    await waitFor(() => {
      expect(screen.queryByText(/You can analyze your skills, discover skill gaps/i)).not.toBeInTheDocument();
    });
  });

  it("renders testimonials with user ratings and roles", () => {
    render(<TestimonialsAndFAQ />);

    expect(screen.getByText("Ananya R.")).toBeInTheDocument();
    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Rohit S.")).toBeInTheDocument();
    expect(screen.getByText("Neha K.")).toBeInTheDocument();
  });
});
