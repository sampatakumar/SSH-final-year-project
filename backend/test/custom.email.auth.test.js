import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";
import {
  getVerificationEmailTemplate,
  getPasswordResetEmailTemplate,
  escapeHtml,
} from "../src/services/email/email.templates.js";
import { emailService } from "../src/services/email/email.service.js";
import { firebaseAdmin } from "../src/config/firebaseAdmin.js";

describe("Smart Skill Hub Custom Email Auth System", () => {
  beforeEach(() => {
    emailService.clearSentEmails();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // SECTION 1: TEMPLATE GENERATION & XSS SANITIZATION
  // ==========================================
  describe("1. Email Template Generation & Security", () => {
    it("escapes malicious user-controlled input in HTML templates", () => {
      const maliciousName = '<script>alert("XSS")</script>';
      const safe = escapeHtml(maliciousName);
      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
    });

    it("generates custom verification email with Smart Skill Hub branding", () => {
      const template = getVerificationEmailTemplate({
        firstName: "Ada",
        verificationLink: "https://smartskillhub.com/auth/action?mode=verifyEmail&oobCode=12345",
      });

      expect(template.subject).toBe("Verify your Smart Skill Hub account");
      expect(template.html).toContain("SMART SKILL HUB");
      expect(template.html).toContain("ACCOUNT VERIFICATION");
      expect(template.html).toContain("Ada");
      expect(template.html).toContain("VERIFY EMAIL");
      expect(template.html).toContain("https://smartskillhub.com/auth/action?mode=verifyEmail&amp;oobCode=12345");
      expect(template.text).toContain("https://smartskillhub.com/auth/action?mode=verifyEmail&oobCode=12345");
    });

    it("generates custom password reset email with security notice", () => {
      const template = getPasswordResetEmailTemplate({
        firstName: "Linus",
        resetLink: "https://smartskillhub.com/auth/action?mode=resetPassword&oobCode=67890",
      });

      expect(template.subject).toBe("Reset your Smart Skill Hub password");
      expect(template.html).toContain("SMART SKILL HUB");
      expect(template.html).toContain("SECURITY REQUEST");
      expect(template.html).toContain("Linus");
      expect(template.html).toContain("RESET PASSWORD");
      expect(template.html).toContain("https://smartskillhub.com/auth/action?mode=resetPassword&amp;oobCode=67890");
      expect(template.text).toContain("https://smartskillhub.com/auth/action?mode=resetPassword&oobCode=67890");
    });
  });

  // ==========================================
  // SECTION 2: EMAIL SERVICE ABSTRACTION
  // ==========================================
  describe("2. Dedicated Email Service", () => {
    it("records sent emails in log buffer during development/test mode", async () => {
      const result = await emailService.sendEmail({
        to: "test@example.com",
        subject: "Hello Developer",
        html: "<p>Welcome to Smart Skill Hub</p>",
        text: "Welcome to Smart Skill Hub",
      });

      expect(result.success).toBe(true);
      const sent = emailService.getSentEmails();
      expect(sent.length).toBe(1);
      expect(sent[0].to).toBe("test@example.com");
      expect(sent[0].subject).toBe("Hello Developer");
    });
  });

  // ==========================================
  // SECTION 3: SEND VERIFICATION EMAIL ENDPOINT
  // ==========================================
  describe("3. POST /api/v1/auth/send-verification-email", () => {
    it("rejects unauthenticated requests with 401", async () => {
      const res = await request(app).post("/api/v1/auth/send-verification-email");
      expect(res.status).toBe(401);
    });

    it("verifies template copy contains exact requested text", () => {
      const template = getVerificationEmailTemplate({
        firstName: "Grace",
        verificationLink: "https://smartskillhub.com/auth/action?mode=verifyEmail&oobCode=grace_123",
      });

      expect(template.html).toContain("Your account is almost ready.");
      expect(template.html).toContain("Verify your email address to unlock your personalized learning journey");
      expect(template.html).toContain("If you did not create a Smart Skill Hub account, you can safely ignore this email.");
      expect(template.html).toContain("AI-powered developer growth platform");
    });
  });

  // ==========================================
  // SECTION 4: SEND PASSWORD RESET ENDPOINT
  // ==========================================
  describe("4. POST /api/v1/auth/send-password-reset", () => {
    it("rejects request missing email with 400", async () => {
      const res = await request(app)
        .post("/api/v1/auth/send-password-reset")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("rejects invalid email formatting with 400", async () => {
      const res = await request(app)
        .post("/api/v1/auth/send-password-reset")
        .send({ email: "invalid-email-format" });
      expect(res.status).toBe(400);
    });

    it("generates Firebase Admin reset link and sends email for valid user", async () => {
      const mockGetUserByEmail = vi.spyOn(firebaseAdmin.auth(), "getUserByEmail").mockResolvedValue({
        uid: "user-123",
        email: "developer@smartskillhub.com",
        displayName: "Ada Lovelace",
      });

      const mockGenerateResetLink = vi.spyOn(firebaseAdmin.auth(), "generatePasswordResetLink").mockResolvedValue(
        "http://localhost:8081/auth/action?mode=resetPassword&oobCode=mock_reset_code_123"
      );

      const res = await request(app)
        .post("/api/v1/auth/send-password-reset")
        .send({ email: "developer@smartskillhub.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("If an account exists");

      expect(mockGetUserByEmail).toHaveBeenCalledWith("developer@smartskillhub.com");
      expect(mockGenerateResetLink).toHaveBeenCalledWith(
        "developer@smartskillhub.com",
        expect.objectContaining({ handleCodeInApp: true })
      );

      const sentEmails = emailService.getSentEmails();
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0].to).toBe("developer@smartskillhub.com");
      expect(sentEmails[0].subject).toBe("Reset your Smart Skill Hub password");
      expect(sentEmails[0].html).toContain("Ada");
      expect(sentEmails[0].html).toContain("mock_reset_code_123");
    });

    it("protects against account enumeration when email is not found in Firebase", async () => {
      const notFoundError = new Error("User not found");
      notFoundError.code = "auth/user-not-found";

      vi.spyOn(firebaseAdmin.auth(), "getUserByEmail").mockRejectedValue(notFoundError);

      const res = await request(app)
        .post("/api/v1/auth/send-password-reset")
        .send({ email: "nonexistent@smartskillhub.com" });

      // Must return 200 generic message so attacker cannot enumerate emails
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("If an account exists");

      // No email was sent
      const sentEmails = emailService.getSentEmails();
      expect(sentEmails.length).toBe(0);
    });
  });
});
