import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import RequireAuth from "../components/RequireAuth";
import { AuthContext, getFriendlyAuthErrorMessage } from "../core/auth/AuthContext";

const createMockAuth = (overrides = {}) => ({
  firebaseUser: {
    uid: "test_user_1",
    email: "developer@smartskillhub.com",
    emailVerified: false,
    providerData: [{ providerId: "password" }],
    getIdToken: vi.fn().mockResolvedValue("jwt_token_123"),
  },
  backendUser: null,
  idToken: "jwt_token_123",
  loading: false,
  authInitialized: true,
  signInWithGoogle: vi.fn().mockResolvedValue({ user: { uid: "g1", emailVerified: true } }),
  signInWithGithub: vi.fn().mockResolvedValue({ user: { uid: "gh1", emailVerified: true } }),
  signInWithEmail: vi.fn().mockResolvedValue({
    user: { uid: "e1", email: "developer@smartskillhub.com", emailVerified: false },
  }),
  registerWithEmail: vi.fn().mockResolvedValue({
    user: { uid: "r1", email: "developer@smartskillhub.com", emailVerified: false },
  }),
  resendVerificationEmail: vi.fn().mockResolvedValue(undefined),
  reloadUser: vi.fn().mockResolvedValue({
    uid: "test_user_1",
    email: "developer@smartskillhub.com",
    emailVerified: false,
  }),
  syncVerifiedUser: vi.fn().mockResolvedValue(undefined),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  linkProvider: vi.fn().mockResolvedValue({ user: { uid: "l1" } }),
  unlinkProvider: vi.fn().mockResolvedValue({ uid: "u1" }),
  signOutUser: vi.fn().mockResolvedValue(undefined),
  refreshProfile: vi.fn().mockResolvedValue(undefined),
  getFriendlyErrorMessage: getFriendlyAuthErrorMessage,
  ...overrides,
});

describe("Email Verification Authentication Flow Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. Registration triggers sendEmailVerification and redirects to /verify-email", async () => {
    const mockAuth = createMockAuth();

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/register"]}>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<div>Verify Email Target</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("Alex Morgan"), {
      target: { value: "Alex Morgan" },
    });
    fireEvent.change(screen.getByPlaceholderText("alex@example.com"), {
      target: { value: "developer@smartskillhub.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), {
      target: { value: "SecurePass123!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
      target: { value: "SecurePass123!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(mockAuth.registerWithEmail).toHaveBeenCalledWith(
        "developer@smartskillhub.com",
        "SecurePass123!",
        "Alex Morgan"
      );
      expect(screen.getByText("Verify Email Target")).toBeInTheDocument();
    });
  });

  it("2. VerifyEmailPage renders target email, waiting status, and resend action with cooldown", async () => {
    const mockAuth = createMockAuth();

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/verify-email"]}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Verify your email")).toBeInTheDocument();
    expect(screen.getByText("developer@smartskillhub.com")).toBeInTheDocument();
    expect(screen.getByText("Waiting for verification...")).toBeInTheDocument();

    // Click Resend verification email
    const resendBtn = screen.getByRole("button", { name: /Resend verification email/i });
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(mockAuth.resendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/Resend available in/i)).toBeInTheDocument();
    });
  });

  it("3. Wrong email flow signs out and routes back to /register", async () => {
    const mockAuth = createMockAuth();

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/verify-email"]}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/register" element={<div>Register Page Destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const wrongEmailBtn = screen.getByText("Correct your email");
    fireEvent.click(wrongEmailBtn);

    await waitFor(() => {
      expect(mockAuth.signOutUser).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Register Page Destination")).toBeInTheDocument();
    });
  });

  it("4. Auto-polling detects emailVerified: true and synchronizes with backend", async () => {
    const mockAuth = createMockAuth({
      reloadUser: vi.fn().mockResolvedValue({
        uid: "test_user_1",
        email: "developer@smartskillhub.com",
        emailVerified: true,
      }),
    });

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/verify-email"]}>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/dashboard" element={<div>Dashboard Destination</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Initial render with verified check or auto-poll resolution
    await waitFor(() => {
      expect(mockAuth.syncVerifiedUser).toHaveBeenCalled();
    });
  });

  it("5. RequireAuth redirects unverified email user away from dashboard to /verify-email", () => {
    const mockAuth = createMockAuth({
      firebaseUser: {
        uid: "unverified_u",
        email: "unverified@example.com",
        emailVerified: false,
        providerData: [{ providerId: "password" }],
      },
    });

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/dashboard/mentor"]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/dashboard/mentor" element={<div>Protected Mentor Page</div>} />
            </Route>
            <Route path="/verify-email" element={<div>Verify Email Gated Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Verify Email Gated Page")).toBeInTheDocument();
  });

  it("6. RequireAuth allows Google/GitHub user directly to dashboard without verify gate", () => {
    const mockAuth = createMockAuth({
      firebaseUser: {
        uid: "google_u",
        email: "googleuser@gmail.com",
        emailVerified: true,
        providerData: [{ providerId: "google.com" }],
      },
      backendUser: { _id: "b1", displayName: "Google Developer", onboardingCompletedAt: "2026-01-01T00:00:00.000Z" },
    });

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<div>Protected Dashboard</div>} />
            </Route>
            <Route path="/verify-email" element={<div>Verify Email Gated Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText("Protected Dashboard")).toBeInTheDocument();
  });

  it("7. Login with unverified email account redirects user to /verify-email", async () => {
    const mockAuth = createMockAuth({
      signInWithEmail: vi.fn().mockResolvedValue({
        user: { uid: "u_unverified", email: "unverified@example.com", emailVerified: false },
      }),
    });

    render(
      <AuthContext.Provider value={mockAuth as any}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<div>Verify Email Target From Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("developer@example.com"), {
      target: { value: "unverified@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "Pass123456!" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockAuth.signInWithEmail).toHaveBeenCalledWith(
        "unverified@example.com",
        "Pass123456!"
      );
      expect(screen.getByText("Verify Email Target From Login")).toBeInTheDocument();
    });
  });
});
