import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import { getCurrentUser, updateCurrentUser } from "../src/core/auth/auth.controller.js";
import { globalErrorHandler } from "../src/core/errors/errorHandler.js";

describe("Academic Student Profile Integration Suite", () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      _id: "user_academic_123",
      firebaseUid: "firebase_student_uid",
      displayName: "Sampata Kumar",
      email: "sampatakumar@smartskillhub.com",
      role: "student",
      phone: "+91 9876543210",
      about: "Engineering student exploring cloud and AI development.",
      targetRole: "Full Stack Developer",
      targetRoles: ["Full Stack Developer"],
      careerInterests: ["Web Development", "Artificial Intelligence"],
      academic: {
        degreeSlug: "btech",
        degreeName: "Bachelor of Technology",
        branchSlug: "cse",
        branchName: "Computer Science and Engineering",
        specializationSlug: "ai-ml",
        specializationName: "Artificial Intelligence & Machine Learning",
        stream: "Engineering & Technology",
        currentYear: 3,
        currentSemester: 6,
        institution: "National Institute of Technology",
        academicScheme: "CBCS 2022"
      },
      educationEntries: [
        {
          degree: "B.Tech",
          specialization: "Computer Science",
          college: "National Institute of Technology",
          location: "Karnataka, India",
          endDate: "2025",
          grade: "9.2 CGPA"
        }
      ],
      education: ["B.Tech Computer Science - NIT"],
      skillSections: [
        { title: "Languages", skills: ["TypeScript", "Python"] },
        { title: "Frameworks", skills: ["React", "Express.js"] }
      ],
      skillLanguages: ["TypeScript", "Python"],
      skillFrameworks: ["React", "Express.js"],
      skillTools: ["Git", "Docker"],
      skillLibraries: [],
      experience: [
        {
          role: "Frontend Engineering Intern",
          company: "CloudTech Labs",
          location: "Bangalore",
          date: "Summer 2024",
          bullets: ["Built responsive dashboard interfaces in React."]
        }
      ],
      achievements: [
        {
          title: "Hackathon Winner",
          date: "2024",
          bullets: ["Top 3 finalist in university tech symposium."]
        }
      ],
      save: vi.fn().mockImplementation(function () {
        return Promise.resolve(this);
      })
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const buildApp = (user = mockUser) => {
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.auth = { uid: user.firebaseUid, email: user.email };
      req.user = user;
      next();
    });
    app.get("/api/v1/auth/me", getCurrentUser);
    app.patch("/api/v1/auth/me", updateCurrentUser);
    app.use(globalErrorHandler);
    return app;
  };

  it("1. GET /api/v1/auth/me: retrieves academic profile alongside legacy education entries", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const user = res.body.data.user;

    expect(user.academic).toBeDefined();
    expect(user.academic.degreeSlug).toBe("btech");
    expect(user.academic.branchSlug).toBe("cse");
    expect(user.academic.specializationSlug).toBe("ai-ml");
    expect(user.academic.currentSemester).toBe(6);
    expect(user.academic.currentYear).toBe(3);
    expect(user.academic.institution).toBe("National Institute of Technology");

    // Legacy fields must be intact
    expect(user.educationEntries).toHaveLength(1);
    expect(user.educationEntries[0].degree).toBe("B.Tech");
    expect(user.targetRole).toBe("Full Stack Developer");
    expect(user.targetRoles).toContain("Full Stack Developer");
  });

  it("2. GET /api/v1/auth/me: legacy profile without academic field remains valid and backwards-compatible", async () => {
    const legacyUser = {
      ...mockUser,
      academic: undefined,
      targetRoles: undefined,
      careerInterests: undefined,
      targetRole: "Backend Developer"
    };

    const app = buildApp(legacyUser);
    const res = await request(app).get("/api/v1/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.displayName).toBe("Sampata Kumar");
    expect(res.body.data.user.targetRole).toBe("Backend Developer");
    expect(res.body.data.user.educationEntries).toHaveLength(1);
  });

  it("3. PATCH /api/v1/auth/me: updates academic fields and syncs targetRoles to legacy targetRole", async () => {
    const app = buildApp();
    const updatePayload = {
      academic: {
        degreeSlug: "be",
        degreeName: "Bachelor of Engineering",
        branchSlug: "ece",
        branchName: "Electronics and Communication Engineering",
        specializationSlug: "embedded-iot",
        specializationName: "Embedded Systems & IoT",
        stream: "Engineering & Technology",
        currentYear: 4,
        currentSemester: 7,
        institution: "RV College of Engineering",
        academicScheme: "NEP 2020"
      },
      targetRoles: ["Embedded Systems Engineer", "Firmware Engineer"],
      careerInterests: ["VLSI", "Robotics", "IoT Automation"]
    };

    const res = await request(app).patch("/api/v1/auth/me").send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.save).toHaveBeenCalled();

    // Verify academic fields were updated
    expect(mockUser.academic.degreeSlug).toBe("be");
    expect(mockUser.academic.branchSlug).toBe("ece");
    expect(mockUser.academic.specializationSlug).toBe("embedded-iot");
    expect(mockUser.academic.currentSemester).toBe(7);
    expect(mockUser.academic.currentYear).toBe(4);
    expect(mockUser.academic.institution).toBe("RV College of Engineering");
    expect(mockUser.academic.academicScheme).toBe("NEP 2020");

    // Verify targetRoles array updated and targetRole automatically synchronized
    expect(mockUser.targetRoles).toEqual(["Embedded Systems Engineer", "Firmware Engineer"]);
    expect(mockUser.targetRole).toBe("Embedded Systems Engineer");
    expect(mockUser.careerInterests).toEqual(["VLSI", "Robotics", "IoT Automation"]);

    // Verify unrelated legacy fields remain preserved
    expect(mockUser.educationEntries).toHaveLength(1);
    expect(mockUser.experience).toHaveLength(1);
    expect(mockUser.achievements).toHaveLength(1);
    expect(mockUser.skillLanguages).toHaveLength(2);
  });

  it("4. PATCH /api/v1/auth/me: gracefully handles partial academic updates without erasing existing subfields", async () => {
    const app = buildApp();
    const partialPayload = {
      academic: {
        currentSemester: 8,
        currentYear: 4
      }
    };

    const res = await request(app).patch("/api/v1/auth/me").send(partialPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Existing academic metadata must be preserved
    expect(mockUser.academic.degreeSlug).toBe("btech");
    expect(mockUser.academic.branchSlug).toBe("cse");
    expect(mockUser.academic.currentSemester).toBe(8);
    expect(mockUser.academic.currentYear).toBe(4);
  });

  it("5. PATCH /api/v1/auth/me: supports non-engineering branches (e.g., B.Com with business analytics)", async () => {
    const app = buildApp();
    const commercePayload = {
      academic: {
        degreeSlug: "bcom",
        degreeName: "Bachelor of Commerce",
        branchSlug: "bcom-gen",
        branchName: "Commerce & Accounting",
        specializationSlug: "business-analytics",
        specializationName: "Business Analytics & Financial Modeling",
        stream: "Commerce & Management",
        currentYear: 2,
        currentSemester: 3,
        institution: "Christ University"
      },
      targetRoles: ["Financial Analyst", "Business Intelligence Analyst"],
      careerInterests: ["Fintech", "Corporate Finance"]
    };

    const res = await request(app).patch("/api/v1/auth/me").send(commercePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.academic.degreeSlug).toBe("bcom");
    expect(mockUser.academic.branchSlug).toBe("bcom-gen");
    expect(mockUser.targetRole).toBe("Financial Analyst");
  });

  it("6. PATCH /api/v1/auth/me: legacy client updating only targetRole synchronizes targetRoles array", async () => {
    const app = buildApp();
    const legacyPayload = {
      targetRole: "DevOps Engineer"
    };

    const res = await request(app).patch("/api/v1/auth/me").send(legacyPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.targetRole).toBe("DevOps Engineer");
    expect(mockUser.targetRoles).toEqual(["DevOps Engineer"]);
  });

  it("7. PATCH /api/v1/auth/me: payload with conflicting targetRole and targetRoles aligns primary role", async () => {
    const app = buildApp();
    const conflictPayload = {
      targetRole: "Machine Learning Engineer",
      targetRoles: ["Frontend Developer", "React Developer"]
    };

    const res = await request(app).patch("/api/v1/auth/me").send(conflictPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.targetRole).toBe("Machine Learning Engineer");
    expect(mockUser.targetRoles).toEqual([
      "Machine Learning Engineer",
      "Frontend Developer",
      "React Developer"
    ]);
  });

  it("8. PATCH /api/v1/auth/me: empty targetRoles array does not wipe career preference", async () => {
    const app = buildApp();
    mockUser.targetRole = "Cloud Architect";
    mockUser.targetRoles = ["Cloud Architect"];

    const emptyArrayPayload = {
      targetRoles: []
    };

    const res = await request(app).patch("/api/v1/auth/me").send(emptyArrayPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.targetRole).toBe("Cloud Architect");
    expect(mockUser.targetRoles).toEqual(["Cloud Architect"]);
  });

  it("9. PATCH /api/v1/auth/me: empty targetRole string does not wipe valid career preference", async () => {
    const app = buildApp();
    mockUser.targetRole = "Site Reliability Engineer";
    mockUser.targetRoles = ["Site Reliability Engineer"];

    const emptyStringPayload = {
      targetRole: "   "
    };

    const res = await request(app).patch("/api/v1/auth/me").send(emptyStringPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.targetRole).toBe("Site Reliability Engineer");
  });

  it("10. PATCH /api/v1/auth/me: supports custom/uncatalogued branch without validation rejection", async () => {
    const app = buildApp();
    const customBranchPayload = {
      academic: {
        degreeSlug: "btech",
        degreeName: "Bachelor of Technology",
        branchSlug: "custom",
        branchName: "Marine Engineering & Naval Architecture",
        stream: "Engineering & Technology",
        currentYear: 3,
        currentSemester: 5,
        institution: "Indian Maritime University"
      }
    };

    const res = await request(app).patch("/api/v1/auth/me").send(customBranchPayload);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUser.academic.branchSlug).toBe("custom");
    expect(mockUser.academic.branchName).toBe("Marine Engineering & Naval Architecture");
    expect(mockUser.academic.institution).toBe("Indian Maritime University");
  });
});
