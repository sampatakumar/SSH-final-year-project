import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

const mockJwtVerify = vi.fn();
const mockUserFindOne = vi.fn();
const mockResumeFind = vi.fn();
const mockResumeFindOne = vi.fn();
const mockGetSignedUrl = vi.fn();
const mockDownloadStorage = vi.fn();

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
    find: (...args) => mockResumeFind(...args),
    findOne: (...args) => mockResumeFindOne(...args)
  }
}));

vi.mock("../src/utils/supabase-storage.js", () => ({
  getSupabaseResumeSignedReadUrl: (...args) => mockGetSignedUrl(...args),
  downloadResumeFromSupabaseStorage: (...args) => mockDownloadStorage(...args),
  resolveSupabaseResumeStorageLocation: (resume) => {
    if (!resume) return { bucketName: "", storagePath: "" };
    if (resume.supabaseStoragePath) {
      return {
        bucketName: resume.supabaseStorageBucket || "resumes",
        storagePath: resume.supabaseStoragePath
      };
    }
    const rawPath = String(resume.filePath || "");
    if (rawPath.startsWith("supabase://")) {
      const trimmed = rawPath.replace("supabase://", "");
      const parts = trimmed.split("/");
      return {
        bucketName: parts[0] || "resumes",
        storagePath: parts.slice(1).join("/")
      };
    }
    return { bucketName: "", storagePath: "" };
  }
}));

describe("Resume API & Route Integration Suite", () => {
  const userA = {
    _id: "64f1a2b3c4d5e6f7a8b9c0d1",
    firebaseUid: "firebase_user_a_123",
    email: "usera@example.com",
    name: "User A",
    targetRole: "Full Stack Developer",
  };

  const userB = {
    _id: "64f1a2b3c4d5e6f7a8b9c0d2",
    firebaseUid: "firebase_user_b_456",
    email: "userb@example.com",
    name: "User B",
    targetRole: "Backend Node.js Engineer",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockJwtVerify.mockImplementation((token, _getKey, _opts, callback) => {
      if (token === "valid-user-a-token") {
        callback(null, { sub: "firebase_user_a_123", email: "usera@example.com" });
      } else if (token === "valid-user-b-token") {
        callback(null, { sub: "firebase_user_b_456", email: "userb@example.com" });
      } else {
        callback(new Error("Invalid token"));
      }
    });

    mockUserFindOne.mockImplementation(({ firebaseUid }) => {
      if (firebaseUid === "firebase_user_a_123") return Promise.resolve(userA);
      if (firebaseUid === "firebase_user_b_456") return Promise.resolve(userB);
      return Promise.resolve(null);
    });
  });

  it("1. rejects unauthenticated GET /api/v1/resumes with 401", async () => {
    const res = await request(app).get("/api/v1/resumes");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("2. returns HTTP 200 with empty array for authenticated user with 0 resumes", async () => {
    mockResumeFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([])
    });

    const res = await request(app)
      .get("/api/v1/resumes")
      .set("Authorization", "Bearer valid-user-a-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resumes).toEqual([]);
    expect(mockResumeFind).toHaveBeenCalledWith({ owner: userA._id });
  });

  it("3. returns HTTP 200 with resumes owned by the authenticated user", async () => {
    const fakeResume = {
      _id: "res_1",
      owner: userA._id,
      title: "User A Resume",
      format: "PDF",
      content: "Experienced Full Stack Engineer",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toObject: () => ({
        _id: "res_1",
        owner: userA._id,
        title: "User A Resume",
        format: "PDF",
        content: "Experienced Full Stack Engineer",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    };

    mockResumeFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([fakeResume])
    });

    const res = await request(app)
      .get("/api/v1/resumes")
      .set("Authorization", "Bearer valid-user-a-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resumes.length).toBe(1);
    expect(res.body.data.resumes[0].title).toBe("User A Resume");
    expect(mockResumeFind).toHaveBeenCalledWith({ owner: userA._id });
  });

  it("4. strictly enforces ownership isolation in find query", async () => {
    mockResumeFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([])
    });

    const resB = await request(app)
      .get("/api/v1/resumes")
      .set("Authorization", "Bearer valid-user-b-token");

    expect(resB.status).toBe(200);
    expect(resB.body.data.resumes.length).toBe(0);
    expect(mockResumeFind).toHaveBeenCalledWith({ owner: userB._id });
  });

  it("5. handles remote Supabase storage signed URL failures without 500 error and never returns supabase:// scheme", async () => {
    mockGetSignedUrl.mockRejectedValue(new Error("Supabase DNS timeout"));

    const resumeWithRemote = {
      _id: "res_remote_1",
      owner: userA._id,
      title: "Remote Storage Resume",
      format: "PDF",
      supabaseStoragePath: "firebase_user_a_123/remote_resume.pdf",
      supabaseStorageBucket: "resumes-test",
      filePath: "supabase://resumes-test/firebase_user_a_123/remote_resume.pdf",
      toObject: () => ({
        _id: "res_remote_1",
        owner: userA._id,
        title: "Remote Storage Resume",
        format: "PDF",
        supabaseStoragePath: "firebase_user_a_123/remote_resume.pdf",
        supabaseStorageBucket: "resumes-test",
        filePath: "supabase://resumes-test/firebase_user_a_123/remote_resume.pdf",
      })
    };

    mockResumeFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([resumeWithRemote])
    });

    const res = await request(app)
      .get("/api/v1/resumes")
      .set("Authorization", "Bearer valid-user-a-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.resumes.length).toBe(1);
    expect(res.body.data.resumes[0].title).toBe("Remote Storage Resume");
    // Ensure raw supabase:// scheme is never exposed
    expect(res.body.data.resumes[0].filePath).toBe("/api/v1/resumes/res_remote_1/file");
    expect(res.body.data.resumes[0].filePath.startsWith("supabase://")).toBe(false);
  });

  it("6. rejects unauthenticated GET /api/v1/resumes/:resumeId/file with 401", async () => {
    const res = await request(app).get("/api/v1/resumes/res_remote_1/file");
    expect(res.status).toBe(401);
  });

  it("7. returns 404 for GET /api/v1/resumes/:resumeId/file when requested by wrong user", async () => {
    mockResumeFindOne.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/v1/resumes/res_remote_1/file")
      .set("Authorization", "Bearer valid-user-b-token");

    expect(res.status).toBe(404);
    expect(mockResumeFindOne).toHaveBeenCalledWith({ _id: "res_remote_1", owner: userB._id });
  });

  it("8. successfully streams PDF file for authenticated owner when storage is available", async () => {
    const resumeDoc = {
      _id: "res_remote_1",
      owner: userA._id,
      title: "My Resume",
      format: "PDF",
      storedFileName: "my_resume.pdf",
      supabaseStoragePath: "firebase_user_a_123/my_resume.pdf",
      supabaseStorageBucket: "resumes",
      toObject: () => ({ ...resumeDoc })
    };

    mockResumeFindOne.mockResolvedValue(resumeDoc);
    mockDownloadStorage.mockResolvedValue({
      buffer: Buffer.from("%PDF-1.4 Mock PDF Content"),
      contentType: "application/pdf"
    });

    const res = await request(app)
      .get("/api/v1/resumes/res_remote_1/file")
      .set("Authorization", "Bearer valid-user-a-token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/pdf");
    expect(res.headers["content-disposition"]).toContain("inline");
    expect(res.body.toString()).toContain("%PDF-1.4 Mock PDF Content");
  });

  it("9. returns controlled 502 when Supabase Storage is unreachable during file download", async () => {
    const resumeDoc = {
      _id: "res_remote_1",
      owner: userA._id,
      title: "My Resume",
      format: "PDF",
      storedFileName: "my_resume.pdf",
      supabaseStoragePath: "firebase_user_a_123/my_resume.pdf",
      supabaseStorageBucket: "resumes",
      toObject: () => ({ ...resumeDoc })
    };

    mockResumeFindOne.mockResolvedValue(resumeDoc);
    mockDownloadStorage.mockRejectedValue(new Error("Supabase Storage Unavailable"));

    const res = await request(app)
      .get("/api/v1/resumes/res_remote_1/file")
      .set("Authorization", "Bearer valid-user-a-token");

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Failed to read resume file from Supabase Storage");
  });
});
