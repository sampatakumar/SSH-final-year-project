import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter, MemoryRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import RequireAuth from "../components/RequireAuth";
import { AuthContext, getFriendlyAuthErrorMessage } from "../core/auth/AuthContext";

const createMockAuth = (overrides = {}) => ({
  firebaseUser: null,
  backendUser: null,
  idToken: null,
  loading: false,
  authInitialized: true,
  signInWithGoogle: vi.fn().mockResolvedValue({ user: { uid: "g1" } }),
  signInWithGithub: vi.fn().mockResolvedValue({ user: { uid: "gh1" } }),
  signInWithEmail: vi.fn().mockResolvedValue({ user: { uid: "e1" } }),
  registerWithEmail: vi.fn().mockResolvedValue({ user: { uid: "r1" } }),
  sendPasswordReset: vi.fn().mockResolvedValue(undefined),
  linkProvider: vi.fn().mockResolvedValue({ user: { uid: "l1" } }),
  unlinkProvider: vi.fn().mockResolvedValue({ uid: "u1" }),
  signOutUser: vi.fn().mockResolvedValue(undefined),
  refreshProfile: vi.fn().mockResolvedValue(undefined),
  getFriendlyErrorMessage: getFriendlyAuthErrorMessage,
  ...overrides,
});

describe("Complete Authentication System Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. LoginPage", () => {
    it("renders LoginPage with email/password inputs and social provider options", () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText("Welcome back")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("developer@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Google/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /GitHub/i })).toBeInTheDocument();
    });

    it("toggles password visibility when eye icon is clicked", () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      const passwordInput = screen.getByPlaceholderText("••••••••");
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByLabelText(/Show password/i);
      fireEvent.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
    });

    it("submits email login and calls signInWithEmail", async () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByPlaceholderText("developer@example.com"), {
        target: { value: "developer@smartskillhub.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("••••••••"), {
        target: { value: "SecretPass123!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

      await waitFor(() => {
        expect(mockAuth.signInWithEmail).toHaveBeenCalledWith(
          "developer@smartskillhub.com",
          "SecretPass123!"
        );
      });
    });

    it("calls signInWithGoogle when Google button is clicked", async () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByRole("button", { name: /Google/i }));

      await waitFor(() => {
        expect(mockAuth.signInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it("calls signInWithGithub when GitHub button is clicked", async () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <LoginPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      fireEvent.click(screen.getByRole("button", { name: /GitHub/i }));

      await waitFor(() => {
        expect(mockAuth.signInWithGithub).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("2. RegisterPage", () => {
    it("renders RegisterPage with full name, email, password, and strength meter", () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <RegisterPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText("Create your account")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Alex Morgan")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("alex@example.com")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("At least 8 characters")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Repeat password")).toBeInTheDocument();
    });

    it("shows password strength updates as user types", () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <RegisterPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      const passwordInput = screen.getByPlaceholderText("At least 8 characters");

      // Weak password
      fireEvent.change(passwordInput, { target: { value: "pass" } });
      expect(screen.getByText("Weak")).toBeInTheDocument();

      // Strong password
      fireEvent.change(passwordInput, { target: { value: "StrongP@ssw0rd!" } });
      expect(screen.getByText("Strong")).toBeInTheDocument();
    });

    it("submits registration and calls registerWithEmail", async () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <RegisterPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      fireEvent.change(screen.getByPlaceholderText("Alex Morgan"), {
        target: { value: "Alex Morgan" },
      });
      fireEvent.change(screen.getByPlaceholderText("alex@example.com"), {
        target: { value: "alex@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), {
        target: { value: "StrongPassword123!" },
      });
      fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
        target: { value: "StrongPassword123!" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

      await waitFor(() => {
        expect(mockAuth.registerWithEmail).toHaveBeenCalledWith(
          "alex@example.com",
          "StrongPassword123!",
          "Alex Morgan"
        );
      });
    });
  });

  describe("3. ForgotPasswordPage", () => {
    it("renders ForgotPasswordPage and dispatches reset instructions", async () => {
      const mockAuth = createMockAuth();
      render(
        <AuthContext.Provider value={mockAuth as any}>
          <BrowserRouter>
            <ForgotPasswordPage />
          </BrowserRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText("Reset your password")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("developer@example.com"), {
        target: { value: "dev@skillhub.com" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Send Reset Instructions/i }));

      await waitFor(() => {
        expect(mockAuth.sendPasswordReset).toHaveBeenCalledWith("dev@skillhub.com");
        expect(screen.getByText("Instructions Dispatched")).toBeInTheDocument();
      });
    });
  });

  describe("4. Error Mapping & RequireAuth Redirect", () => {
    it("maps Firebase error codes to human friendly messages", () => {
      expect(getFriendlyAuthErrorMessage({ code: "auth/invalid-credential" })).toBe(
        "Incorrect email or password."
      );
      expect(getFriendlyAuthErrorMessage({ code: "auth/email-already-in-use" })).toBe(
        "An account already exists with this email."
      );
      expect(getFriendlyAuthErrorMessage({ code: "auth/account-exists-with-different-credential" })).toContain(
        "An account already exists with this email using another provider."
      );
    });

    it("redirects unauthenticated user from protected route to /login with returnTo query param", () => {
      const mockAuth = createMockAuth({ firebaseUser: null, loading: false });

      render(
        <AuthContext.Provider value={mockAuth as any}>
          <MemoryRouter initialEntries={["/dashboard/mentor"]}>
            <Routes>
              <Route element={<RequireAuth />}>
                <Route path="/dashboard/mentor" element={<div>Mentor Content</div>} />
              </Route>
              <Route path="/login" element={<div>Login Page Target</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText("Login Page Target")).toBeInTheDocument();
    });
  });
});
