import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { getCurrentUser, updateCurrentUser } from "../src/core/auth/auth.controller.js";
import { upsertUserFromFirebase } from "../src/core/auth/auth.service.js";
import { User } from "../src/core/database/models/user.models.js";
import { generateUserProfileSummary } from "../src/modules/resume/controllers/ai.controller.js";
import * as groqModule from "../src/services/groq.service.js";
import { Project } from "../src/modules/resume/models/project.models.js";

describe("Canonical Profile & AI Summary Routes Integration Suite", () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: "507f1f77bcf86cd799439011",
      firebaseUid: "firebase_uid_123",
      displayName: "Sampata Kumar",
      email: "engineer@smartskillhub.com",
      phone: "+91 9876543210",
      about: "Lead Full Stack Engineer specializing in AI and cloud distributed systems.",
      customDomain: "sampata.dev",
      linkedInUrl: "https://linkedin.com/in/sampatakumar",
      githubUrl: "https://github.com/sampatakumar",
      leetCodeId: "sampatakumar_lc",
      geeksForGeeksId: "sampatakumar_gfg",
      targetRole: "Full Stack Engineer",
      educationEntries: [
        {
          degree: "B.Tech",
          specialization: "Computer Science",
          college: "Indian Institute of Technology",
          location: "Chennai, India",
          endDate: "2024",
          grade: "9.4 CGPA",
        },
      ],
      education: ["B.Tech in Computer Science - IIT"],
      skillSections: [
        { title: "Languages", skills: ["TypeScript", "Python", "Go"] },
        { title: "Frameworks", skills: ["React", "Node.js", "Express"] },
      ],
      skillLanguages: ["TypeScript", "Python", "Go"],
      skillFrameworks: ["React", "Node.js", "Express"],
      skillTools: ["Docker", "Git"],
      skillLibraries: [],
      experience: [
        {
          role: "Senior Full Stack Engineer",
          company: "Tech Innovations",
          location: "Bangalore",
          date: "2024 - Present",
          bullets: ["Engineered scalable REST microservices handling 100k daily queries."],
        },
      ],
      achievements: [
        {
          title: "1st Place National Hackathon",
          date: "2024",
          bullets: ["Built real-time AI coding evaluation engine."],
        },
      ],
      save: vi.fn().mockResolvedValue(undefined),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createTestApp = (authenticated = true) => {
    const app = express();
    app.use(express.json());
    if (authenticated) {
      app.use((req, _res, next) => {
        req.auth = { uid: "firebase_uid_123", email: "engineer@smartskillhub.com" };
        req.user = mockUser;
        next();
      });
    }
    app.get("/api/v1/auth/me", getCurrentUser);
    app.patch("/api/v1/auth/me", updateCurrentUser);
    app.post("/api/v1/ai/profile-summary", generateUserProfileSummary);
    return app;
  };

  it("1. GET /api/v1/auth/me: retrieves complete authenticated user profile", async () => {
    const app = createTestApp(true);
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.displayName).toBe("Sampata Kumar");
    expect(res.body.data.user.email).toBe("engineer@smartskillhub.com");
    expect(res.body.data.user.githubUrl).toBe("https://github.com/sampatakumar");
    expect(res.body.data.user.skillSections).toHaveLength(2);
    expect(res.body.data.user.educationEntries).toHaveLength(1);
    expect(res.body.data.user.experience).toHaveLength(1);
  });

  it("2. PATCH /api/v1/auth/me: updates user profile with partial or full payload", async () => {
    const app = createTestApp(true);
    const updatePayload = {
      displayName: "Sampatakumar S V",
      phone: "+91 9999988888",
      about: "Updated AI Architect summary",
      linkedInUrl: "https://linkedin.com/in/updated",
      githubUrl: "https://github.com/updated",
      skillSections: [
        { title: "Core Stack", skills: ["React", "TypeScript", "Node.js", "Docker"] },
      ],
      skillLanguages: ["TypeScript", "JavaScript"],
      experience: [
        {
          role: "Lead Architect",
          company: "Acme Corp",
          location: "Bangalore",
          date: "2024 - Present",
          bullets: ["Led microservices transition.", "Integrated Groq LLM pipelines."],
        },
      ],
    };

    const res = await request(app)
      .patch("/api/v1/auth/me")
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Profile updated successfully");
    expect(mockUser.displayName).toBe("Sampatakumar S V");
    expect(mockUser.about).toBe("Updated AI Architect summary");
    expect(mockUser.githubUrl).toBe("https://github.com/updated");
    expect(mockUser.save).toHaveBeenCalledTimes(1);
  });

  it("3. PATCH /api/v1/auth/me: rejects empty string displayName or displayName < 2 chars with 400 ApiError", async () => {
    const app = createTestApp(true);
    
    // Test A: 1 character
    const resShort = await request(app)
      .patch("/api/v1/auth/me")
      .send({ displayName: "a" });
    expect(resShort.status).toBe(400);

    // Test B: empty string
    const resEmpty = await request(app)
      .patch("/api/v1/auth/me")
      .send({ displayName: "" });
    expect(resEmpty.status).toBe(400);

    expect(mockUser.save).not.toHaveBeenCalled();
  });

  it("4. Firebase sign-in (upsertUserFromFirebase) does NOT overwrite custom edited profile fields", async () => {
    vi.spyOn(User, "findOne").mockResolvedValue(mockUser);

    const tokenPayload = {
      uid: "firebase_uid_123",
      email: "engineer@smartskillhub.com",
      name: "Firebase Default Name",
      picture: "https://firebase.photo.url",
    };

    const syncedUser = await upsertUserFromFirebase(tokenPayload);

    // Custom profile fields MUST remain preserved
    expect(syncedUser.displayName).toBe("Sampata Kumar");
    expect(syncedUser.about).toBe("Lead Full Stack Engineer specializing in AI and cloud distributed systems.");
    expect(syncedUser.githubUrl).toBe("https://github.com/sampatakumar");
    expect(syncedUser.linkedInUrl).toBe("https://linkedin.com/in/sampatakumar");
    expect(syncedUser.save).toHaveBeenCalled();
  });

  it("5. POST /api/v1/ai/profile-summary: generates executive summary grounded in profile data using gpt-oss-120b tier", async () => {
    const app = createTestApp(true);
    vi.spyOn(Project, "find").mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { title: "Smart Skill Hub", description: "AI Platform", stack: ["React", "Node"] },
          ]),
        }),
      }),
    });

    const groqSpy = vi.spyOn(groqModule, "generateProfileSummary").mockResolvedValue(
      "AI Architect with 2+ years of experience engineering scalable microservices with React, TypeScript, and Docker."
    );

    const res = await request(app)
      .post("/api/v1/ai/profile-summary")
      .send({
        skills: ["TypeScript", "React", "Docker"],
        tone: "professional",
        maxWords: 90,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profileSummary).toContain("AI Architect");
    expect(res.body.data.summary).toContain("AI Architect");
    expect(res.body.data.metadata.provider).toBe("groq");
    expect(groqSpy).toHaveBeenCalled();
    expect(groqModule.TASK_CONFIGS.PROFESSIONAL_SUMMARY.taskTier).toBe(groqModule.TASK_TIERS.HIGH_REASONING);
  });
});
