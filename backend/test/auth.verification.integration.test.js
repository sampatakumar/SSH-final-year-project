import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Backend Auth Verification Gating Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unverified password login token with 403 Forbidden", async () => {
    const { firebaseSignIn } = await import("../src/core/auth/auth.controller.js");

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.auth = {
        uid: "firebase_unverified_123",
        email: "unverified@example.com",
        decodedToken: {
          uid: "firebase_unverified_123",
          email: "unverified@example.com",
          email_verified: false,
          firebase: { sign_in_provider: "password" },
        },
      };
      next();
    });
    app.post("/api/v1/auth/firebase/sign-in", firebaseSignIn);
    // error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    });

    const response = await request(app).post("/api/v1/auth/firebase/sign-in");

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain("Email verification required");
  });

  it("accepts verified password login token with 200 OK and creates MongoDB user", async () => {
    const { firebaseSignIn } = await import("../src/core/auth/auth.controller.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    const mockUser = {
      _id: "mongo_user_1",
      firebaseUid: "firebase_verified_123",
      email: "verified@example.com",
      displayName: "Verified User",
      emailVerified: true,
      authProviders: ["password"],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, "findOne").mockResolvedValue(null);
    vi.spyOn(User, "create").mockResolvedValue(mockUser);

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.auth = {
        uid: "firebase_verified_123",
        email: "verified@example.com",
        decodedToken: {
          uid: "firebase_verified_123",
          email: "verified@example.com",
          email_verified: true,
          firebase: { sign_in_provider: "password" },
        },
      };
      next();
    });
    app.post("/api/v1/auth/firebase/sign-in", firebaseSignIn);
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    });

    const response = await request(app).post("/api/v1/auth/firebase/sign-in");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("verified@example.com");
  });

  it("accepts Google social sign-in token immediately with 200 OK", async () => {
    const { firebaseSignIn } = await import("../src/core/auth/auth.controller.js");
    const { User } = await import("../src/core/database/models/user.models.js");

    const mockGoogleUser = {
      _id: "mongo_google_1",
      firebaseUid: "google_uid_999",
      email: "googleuser@gmail.com",
      displayName: "Google User",
      authProviders: ["google.com"],
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, "findOne").mockResolvedValue(mockGoogleUser);

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.auth = {
        uid: "google_uid_999",
        email: "googleuser@gmail.com",
        decodedToken: {
          uid: "google_uid_999",
          email: "googleuser@gmail.com",
          email_verified: true,
          firebase: { sign_in_provider: "google.com" },
        },
      };
      next();
    });
    app.post("/api/v1/auth/firebase/sign-in", firebaseSignIn);
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message });
    });

    const response = await request(app).post("/api/v1/auth/firebase/sign-in");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
