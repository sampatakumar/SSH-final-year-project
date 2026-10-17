import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";

describe("User & Admin Analytics Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createAdminTestApp = (authContext) => {
    const app = express();
    if (authContext) {
      app.use((req, _res, next) => {
        if (authContext.auth) req.auth = authContext.auth;
        if (authContext.user) req.user = authContext.user;
        next();
      });
    }
    app.get("/api/v1/admin/analytics", ensureAdmin, (_req, res) => {
      res.json({
        success: true,
        data: [{ date: "2026-08-27", newUsers: 5, groqRequests: 24 }],
      });
    });
    // Standard error handler converting ApiError to JSON response
    app.use((err, _req, res, _next) => {
      res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || "Internal Server Error",
      });
    });
    return app;
  };

  it("returns user's personal analytics data via getUserAnalytics", async () => {
    const { getUserAnalytics } = await import("../src/controllers/analytics.controller.js");

    const mockUser = {
      _id: "user_123",
      displayName: "Sampata",
      email: "test@example.com",
      targetRole: "Full Stack Developer",
      skillLanguages: ["JavaScript", "TypeScript"],
      skillFrameworks: ["React", "Node.js"],
    };

    const app = express();
    app.use((req, _res, next) => {
      req.auth = { uid: "firebase_user_123", email: "test@example.com" };
      req.user = mockUser;
      next();
    });
    app.get("/api/v1/analytics/me", getUserAnalytics);

    const response = await request(app).get("/api/v1/analytics/me?range=30d");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("overview");
    expect(response.body.data).toHaveProperty("learning");
    expect(response.body.data).toHaveProperty("skills");
    expect(response.body.data).toHaveProperty("gaps");
    expect(response.body.data).toHaveProperty("roadmap");
    expect(response.body.data).toHaveProperty("github");
    expect(response.body.data).toHaveProperty("coding");
    expect(response.body.data).toHaveProperty("mentor");
    expect(response.body.data).toHaveProperty("insights");
    expect(response.body.data.overview.targetRole).toBe("Full Stack Developer");
    expect(Array.isArray(response.body.data.learning.weeklyActivity)).toBe(true);
    expect(response.body.data.learning.weeklyActivity).toHaveLength(7);
  });

  it("blocks non-admin students with 403 using canonical ensureAdmin", async () => {
    const app = createAdminTestApp({
      auth: { uid: "student_123", email: "student@university.edu" },
      user: { _id: "u_student", role: "student", email: "student@university.edu" },
    });

    const response = await request(app).get("/api/v1/admin/analytics");
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain("Access Denied: Administrator privilege required.");
  });

  it("permits database-backed admin with role admin (any email) using canonical ensureAdmin", async () => {
    const app = createAdminTestApp({
      auth: { uid: "admin_123", email: "custom.admin@university.edu" },
      user: { _id: "u_admin", role: "admin", email: "custom.admin@university.edu" },
    });

    const response = await request(app).get("/api/v1/admin/analytics");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].newUsers).toBe(5);
  });

  it("permits centralized configured admin email using canonical ensureAdmin", async () => {
    const app = createAdminTestApp({
      auth: { uid: "legacy_admin", email: "sampatakumarsv@gmail.com" },
      user: { _id: "u_legacy", email: "sampatakumarsv@gmail.com" },
    });

    const response = await request(app).get("/api/v1/admin/analytics");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data[0].newUsers).toBe(5);
  });

  it("blocks unauthenticated requests lacking credentials with 401", async () => {
    const app = createAdminTestApp(null);

    const response = await request(app).get("/api/v1/admin/analytics");
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain("Missing Firebase ID token");
  });
});
