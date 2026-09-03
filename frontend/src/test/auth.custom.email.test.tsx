import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthActionPage from "../pages/AuthActionPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import { AuthContext } from "../core/auth/AuthContext";
import * as firebaseAuthModule from "firebase/auth";

// Mock Firebase Auth SDK functions
vi.mock("firebase/auth", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    applyActionCode: vi.fn(),
    verifyPasswordResetCode: vi.fn(),
    confirmPasswordReset: vi.fn(),
    updateEmail: vi.fn(),
    verifyBeforeUpdateEmail: vi.fn(),
  };
});

describe("Frontend Custom Email Action & Verification Flow Suite", () => {
  let queryClient: QueryClient;
  const mockReloadUser = vi.fn();
  const mockSyncVerifiedUser = vi.fn();
  const mockResendVerificationEmail = vi.fn();
  const mockSignOutUser = vi.fn();

  const mockAuthContextValue = {
    firebaseUser: {
      uid: "user-123",
      email: "developer@smartskillhub.com",
      emailVerified: false,
      displayName: "Ada Lovelace",
      providerData: [{ providerId: "password" }],
    } as any,
    backendUser: null,
    idToken: "mock-id-token",
    loading: false,
    authInitialized: true,
    signInWithGoogle: vi.fn(),
    signInWithGithub: vi.fn(),
    signInWithEmail: vi.fn(),
    registerWithEmail: vi.fn(),
    resendVerificationEmail: mockResendVerificationEmail,
    reloadUser: mockReloadUser,
    syncVerifiedUser: mockSyncVerifiedUser,
    sendPasswordReset: vi.fn(),
    linkProvider: vi.fn(),
    unlinkProvider: vi.fn(),
    signOutUser: mockSignOutUser,
    refreshProfile: vi.fn(),
    getFriendlyErrorMessage: (e: any) => e?.message || "Auth error",
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialRoute: string, customAuth = mockAuthContextValue) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={customAuth as any}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/auth/action" element={<AuthActionPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
              <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Home</div>} />
              <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  // ==========================================
  // SECTION 1: /auth/action (MODE: verifyEmail)
  // ==========================================
  describe("1. /auth/action with mode=verifyEmail", () => {
    it("successfully applies action code and displays email verified state", async () => {
      vi.mocked(firebaseAuthModule.applyActionCode).mockResolvedValueOnce(undefined);

      renderWithRouter("/auth/action?mode=verifyEmail&oobCode=valid_verify_code_123");

      await waitFor(() => {
        expect(firebaseAuthModule.applyActionCode).toHaveBeenCalledWith(
          expect.anything(),
          "valid_verify_code_123"
        );
        expect(screen.getByText("Email Verified")).toBeInTheDocument();
        expect(screen.getByText("Welcome to Smart Skill Hub!")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Continue to Smart Skill Hub/i })).toBeInTheDocument();
      });

      // Clicking continue navigates to /login or /dashboard
      fireEvent.click(screen.getByRole("button", { name: /Continue to Smart Skill Hub/i }));
      expect(await screen.findByTestId("login-page")).toBeInTheDocument();
    });

    it("handles invalid or expired action codes with helpful error UI", async () => {
      const error: any = new Error("Invalid code");
      error.code = "auth/invalid-action-code";
      vi.mocked(firebaseAuthModule.applyActionCode).mockRejectedValueOnce(error);

      renderWithRouter("/auth/action?mode=verifyEmail&oobCode=expired_code");

      await waitFor(() => {
        expect(screen.getByText("Verification Link Issue")).toBeInTheDocument();
        expect(
          screen.getByText(/This verification link is invalid or has already been used/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Request New Verification Email/i })
        ).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // SECTION 2: /auth/action (MODE: resetPassword)
  // ==========================================
  describe("2. /auth/action with mode=resetPassword", () => {
    it("verifies code and renders reset password form, then applies new password", async () => {
      vi.mocked(firebaseAuthModule.verifyPasswordResetCode).mockResolvedValueOnce(
        "developer@smartskillhub.com"
      );
      vi.mocked(firebaseAuthModule.confirmPasswordReset).mockResolvedValueOnce(undefined);

      renderWithRouter("/auth/action?mode=resetPassword&oobCode=valid_reset_code_456");

      // Verify code check
      await waitFor(() => {
        expect(firebaseAuthModule.verifyPasswordResetCode).toHaveBeenCalledWith(
          expect.anything(),
          "valid_reset_code_456"
        );
        expect(screen.getByText("Reset Your Password")).toBeInTheDocument();
        expect(screen.getByText("developer@smartskillhub.com")).toBeInTheDocument();
      });

      // Fill in new password
      const newPassInput = screen.getByPlaceholderText("Minimum 8 characters");
      const confirmPassInput = screen.getByPlaceholderText("Re-enter new password");

      fireEvent.change(newPassInput, { target: { value: "SuperSecret2026!" } });
      fireEvent.change(confirmPassInput, { target: { value: "SuperSecret2026!" } });

      const submitBtn = screen.getByRole("button", { name: /Update Password/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(firebaseAuthModule.confirmPasswordReset).toHaveBeenCalledWith(
          expect.anything(),
          "valid_reset_code_456",
          "SuperSecret2026!"
        );
        expect(screen.getByText("Password Reset Complete!")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Sign In Now/i })).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // SECTION 3: /verify-email PAGE UX & PROGRESS
  // ==========================================
  describe("3. /verify-email Screen & Progression", () => {
    it("renders email address, 'Check Your Inbox' badge, and 3-step progress indicator", async () => {
      renderWithRouter("/verify-email");

      expect(screen.getByText("Check Your Inbox")).toBeInTheDocument();
      expect(screen.getByText("Verify your email")).toBeInTheDocument();
      expect(screen.getByText("developer@smartskillhub.com")).toBeInTheDocument();

      // Progress indicators
      expect(screen.getByText("Onboarding Progress")).toBeInTheDocument();
      expect(screen.getByText("Account")).toBeInTheDocument();
      expect(screen.getByText("Verification")).toBeInTheDocument();
      expect(screen.getByText("SSH Access")).toBeInTheDocument();

      // Action buttons
      expect(
        screen.getByRole("button", { name: /Resend Verification Email/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Change Email/i })).toBeInTheDocument();
    });

    it("triggers resend verification email on button click and enters cooldown", async () => {
      renderWithRouter("/verify-email");

      const resendBtn = screen.getByRole("button", { name: /Resend Verification Email/i });
      fireEvent.click(resendBtn);

      await waitFor(() => {
        expect(mockResendVerificationEmail).toHaveBeenCalledTimes(1);
        expect(screen.getByText(/Resend available in/i)).toBeInTheDocument();
      });
    });

    it("opens Change Email modal and triggers email update without duplicate account", async () => {
      vi.mocked(firebaseAuthModule.verifyBeforeUpdateEmail).mockResolvedValueOnce(undefined);

      renderWithRouter("/verify-email");

      const changeEmailBtn = screen.getByRole("button", { name: /Change Email/i });
      fireEvent.click(changeEmailBtn);

      const input = await screen.findByPlaceholderText("developer@example.com");
      fireEvent.change(input, { target: { value: "corrected@smartskillhub.com" } });

      const submitBtn = screen.getByRole("button", { name: /Update & Send Link/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(firebaseAuthModule.verifyBeforeUpdateEmail).toHaveBeenCalledWith(
          expect.anything(),
          "corrected@smartskillhub.com"
        );
      });
    });
  });
});
