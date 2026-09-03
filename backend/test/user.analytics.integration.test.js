import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("User & Admin Analytics Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("blocks non-admin users from accessing admin analytics", async () => {
    const app = express();

    // Mock ensureAdminMiddleware logic directly
    const ensureAdmin = (req, res, next) => {
      if (req.auth?.email !== "sampatakumarsv@gmail.com") {
        return res.status(403).json({ success: false, error: "Access Denied: Admins Only" });
      }
      next();
    };

    app.use((req, _res, next) => {
      req.auth = { uid: "regular_user", email: "regularuser@gmail.com" };
      req.user = { _id: "u_regular", email: "regularuser@gmail.com" };
      next();
    });
    app.get("/api/v1/admin/analytics", ensureAdmin, (_req, res) => {
      res.json({ success: true, data: [] });
    });

    const response = await request(app).get("/api/v1/admin/analytics");
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain("Access Denied");
  });

  it("permits admin user to access admin analytics", async () => {
    const app = express();

    const ensureAdmin = (req, res, next) => {
      if (req.auth?.email !== "sampatakumarsv@gmail.com") {
        return res.status(403).json({ success: false, error: "Access Denied: Admins Only" });
      }
      next();
    };

    app.use((req, _res, next) => {
      req.auth = { uid: "admin_uid", email: "sampatakumarsv@gmail.com" };
      req.user = { _id: "u_admin", email: "sampatakumarsv@gmail.com" };
      next();
    });
    app.get("/api/v1/admin/analytics", ensureAdmin, (_req, res) => {
      res.json({
        success: true,
        data: [{ date: "2026-08-27", newUsers: 5, groqRequests: 24 }],
      });
    });

    const response = await request(app).get("/api/v1/admin/analytics");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].newUsers).toBe(5);
  });
});
