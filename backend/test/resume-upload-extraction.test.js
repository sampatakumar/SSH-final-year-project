import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

const mockJwtVerify = vi.fn();
const mockUserFindOne = vi.fn();
const mockResumeCreate = vi.fn();
const mockResumeFindOne = vi.fn();
const mockResumeFindOneAndDelete = vi.fn();
const mockParseResumeWithLLM = vi.fn();

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: (...args) => mockJwtVerify(...args)
  }
}));

vi.mock("../src/core/database/models/user.models.js", () => ({
  User: {
    findOne: (...args) => mockUserFindOne(...args)
  }
}));

vi.mock("../src/modules/resume/models/resume.models.js", () => ({
  Resume: {
    create: (...args) => mockResumeCreate(...args),
    findOne: (...args) => mockResumeFindOne(...args),
    findOneAndDelete: (...args) => mockResumeFindOneAndDelete(...args)
  }
}));

vi.mock("../src/modules/resume/models/project.models.js", () => ({
  Project: {
    findOne: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation((payload) => Promise.resolve({ _id: "proj_123", ...payload }))
  }
}));

vi.mock("../src/utils/supabase-storage.js", () => ({
  uploadResumeToSupabaseStorage: vi.fn().mockResolvedValue({
    bucketName: "resumes",
    storagePath: "test_user_123/sample_resume.pdf",
    fileName: "sample_resume.pdf",
    filePath: "supabase://resumes/test_user_123/sample_resume.pdf",
    size: 1024
  }),
  deleteResumeFromSupabaseStorage: vi.fn().mockResolvedValue(true),
  getSupabaseResumeSignedReadUrl: vi.fn().mockResolvedValue({
    url: "https://signed.supabase.co/resume.pdf",
    expiresAt: Date.now() + 3600000
  }),
  resolveSupabaseResumeStorageLocation: () => ({ bucketName: "resumes", storagePath: "test_user_123/sample_resume.pdf" })
}));

vi.mock("../src/modules/resume/services/groq.service.js", () => ({
  parseResumeWithLLM: (...args) => mockParseResumeWithLLM(...args),
  checkGroqHealth: vi.fn().mockResolvedValue({ ok: true })
}));

describe("Resume Upload, Multi-Format Extraction, & Profile Merge Suite", () => {
  let mockUserInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserInstance = {
      _id: "64f1a2b3c4d5e6f7a8b9c0d1",
      firebaseUid: "firebase_user_123",
      email: "candidate@smartskillhub.com",
      displayName: "Initial User",
      headline: "Student",
      phone: "1234567890",
      about: "About initial user",
      educationEntries: [],
      skillSections: [],
      experience: [],
      achievements: [],
      save: vi.fn().mockResolvedValue(true),
      toObject: function () {
        return { ...this };
      }
    };

    mockJwtVerify.mockImplementation((token, _getKey, _opts, callback) => {
      if (token === "valid-user-token") {
        callback(null, { sub: "firebase_user_123", email: "candidate@smartskillhub.com" });
      } else {
        callback(new Error("Invalid token"));
      }
    });

    mockUserFindOne.mockResolvedValue(mockUserInstance);

    mockResumeCreate.mockImplementation((data) =>
      Promise.resolve({
        _id: "res_abc_123",
        ...data,
        toObject: () => ({ _id: "res_abc_123", ...data })
      })
    );

    mockParseResumeWithLLM.mockResolvedValue(
      JSON.stringify({
        profile: {
          displayName: "Sampata Kumar",
          headline: "Full Stack Engineer",
          phone: "+91 9876543210",
          about: "Passionate developer specialized in React and Node.js microservices."
        },
        preferences: {
          linkedInUrl: "https://linkedin.com/in/sampatakumar",
          githubUrl: "https://github.com/sampatakumar"
        },
        contact: {
          email: "sampata@smartskillhub.com"
        },
        educationEntries: [
          {
            degree: "B.Tech",
            specialization: "Computer Science",
            college: "National Institute of Technology",
            location: "Bangalore",
            endDate: "2026",
            grade: "8.9 CGPA"
          }
        ],
        skillSections: [
          {
            title: "Languages",
            skills: ["JavaScript", "TypeScript", "Python"]
          },
          {
            title: "Frameworks & Tools",
            skills: ["React", "Express", "MongoDB", "Docker"]
          }
        ],
        experience: [
          {
            role: "Software Engineering Intern",
            company: "Tech Corp",
            location: "Remote",
            date: "Jan 2025 - Jun 2025",
            bullets: ["Built high-throughput API gateway", "Reduced query latency by 40%"]
          }
        ],
        projects: [
          {
            title: "Smart Skill Hub",
            description: "Autonomous full-stack AI career platform",
            stack: "React, Node.js, MongoDB, Docker",
            date: "2026",
            githubUrl: "https://github.com/sampatakumar/smart-skill-hub",
            demoUrl: "https://smartskillhub.com"
          }
        ],
        achievements: [
          {
            title: "1st Place University Hackathon",
            date: "2025",
            bullets: ["Developed real-time collaboration tool in 36 hours"]
          }
        ]
      })
    );
  });

  it("1. rejects unauthenticated POST /api/v1/resumes/upload with 401", async () => {
    const res = await request(app)
      .post("/api/v1/resumes/upload")
      .attach("resumeFile", Buffer.from("%PDF-1.4 mock content"), "resume.pdf");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("2. uploads and extracts TXT resume with structured profile data and confidence", async () => {
    const txtContent = Buffer.from(
      "Sampata Kumar\nsampata@smartskillhub.com\n+91 9876543210\nFull Stack Engineer\nSkills: React, Node.js, MongoDB\nhttps://github.com/sampatakumar"
    );

    const res = await request(app)
      .post("/api/v1/resumes/upload")
      .set("Authorization", "Bearer valid-user-token")
      .attach("resumeFile", txtContent, "resume.txt");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.extractedProfile.profile.displayName).toBe("Sampata Kumar");
    expect(res.body.data.extractedProfile.contact.email).toBe("sampata@smartskillhub.com");
    expect(res.body.data.confidence.overall).toBeDefined();
    expect(res.body.data.extractionMeta.status).toBe("READY");
  });

  it("3. uploads and extracts RTF resume cleanly by stripping RTF markup", async () => {
    const rtfContent = Buffer.from(
      "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Courier;}}\n\\f0\\fs24 Sampata Kumar\\par sampata@smartskillhub.com\\par Skills: React, Docker}"
    );

    const res = await request(app)
      .post("/api/v1/resumes/upload")
      .set("Authorization", "Bearer valid-user-token")
      .attach("resumeFile", rtfContent, "resume.rtf");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.extractedProfile.profile.displayName).toBe("Sampata Kumar");
  });

  it("4. rejects malformed PDF with invalid file signature", async () => {
    const badPdf = Buffer.from("NOT_A_REAL_PDF_HEADER_JUST_RANDOM_TEXT");

    const res = await request(app)
      .post("/api/v1/resumes/upload")
      .set("Authorization", "Bearer valid-user-token")
      .attach("resumeFile", badPdf, "corrupt.pdf");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/signature|malformed/i);
  });

  it("5. rejects unsupported file types (e.g. .exe or .html)", async () => {
    const exeContent = Buffer.from("MZ binary executable content");

    const res = await request(app)
      .post("/api/v1/resumes/upload")
      .set("Authorization", "Bearer valid-user-token")
      .attach("resumeFile", exeContent, "malware.exe");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("6. re-extracts an existing uploaded resume with POST /api/v1/resumes/:resumeId/extract", async () => {
    mockResumeFindOne.mockResolvedValue({
      _id: "res_abc_123",
      owner: "64f1a2b3c4d5e6f7a8b9c0d1",
      content: "Sampata Kumar\nFull Stack Developer\nsampata@smartskillhub.com\nSkills: React, Node.js"
    });

    const res = await request(app)
      .post("/api/v1/resumes/res_abc_123/extract")
      .set("Authorization", "Bearer valid-user-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.extractedProfile.profile.displayName).toBe("Sampata Kumar");
  });

  it("7. applies confirmed extracted profile to user in MongoDB via POST /api/v1/resumes/apply-profile", async () => {
    const applyPayload = {
      profile: {
        displayName: "Sampata Kumar",
        headline: "Full Stack Engineer",
        phone: "+91 9876543210",
        about: "Experienced full-stack engineer"
      },
      preferences: {
        linkedInUrl: "https://linkedin.com/in/sampatakumar",
        githubUrl: "https://github.com/sampatakumar"
      },
      educationEntries: [
        {
          degree: "B.Tech",
          specialization: "Computer Science",
          college: "NIT",
          endDate: "2026",
          grade: "8.9"
        }
      ],
      skillSections: [
        {
          title: "Technical",
          skills: ["React", "Node.js", "TypeScript"]
        }
      ],
      experience: [
        {
          role: "Intern",
          company: "Tech Corp",
          location: "Remote",
          date: "2025",
          bullets: ["Built microservices"]
        }
      ],
      projects: [
        {
          title: "Smart Skill Hub",
          description: "AI Career platform",
          stack: ["React", "Node.js"]
        }
      ]
    };

    const res = await request(app)
      .post("/api/v1/resumes/apply-profile")
      .set("Authorization", "Bearer valid-user-token")
      .send(applyPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockUserInstance.save).toHaveBeenCalled();
    expect(mockUserInstance.displayName).toBe("Sampata Kumar");
    expect(mockUserInstance.headline).toBe("Full Stack Engineer");
  });

  it("8. deletes uploaded resume without deleting user profile data", async () => {
    mockResumeFindOneAndDelete.mockResolvedValue({
      _id: "res_abc_123",
      owner: "64f1a2b3c4d5e6f7a8b9c0d1",
      supabaseStoragePath: "firebase_user_123/resume.pdf"
    });

    const res = await request(app)
      .delete("/api/v1/resumes/res_abc_123")
      .set("Authorization", "Bearer valid-user-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resumeId).toBe("res_abc_123");
    // User profile in DB is untouched
    expect(mockUserInstance.displayName).toBe("Initial User");
  });
});
