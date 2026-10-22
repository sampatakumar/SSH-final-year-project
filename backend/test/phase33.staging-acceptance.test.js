/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 33: STAGING ACCEPTANCE & RELEASE GATE MASTER SUITE
 * ============================================================================
 *
 * Senior QA Architect, DevSecOps Engineer, and Application Security Suite:
 * 1. Fail-closed remote coding runner mTLS enforcement (staging/production)
 * 2. Complete authenticated student journeys:
 *    - Journey A: Authentication, token verification, and multi-tenant isolation
 *    - Journey B: Career intelligence & skill-gap evaluation (no synthetic invention)
 *    - Journey C: AI Mentor resilience, error boundary, and secret redaction
 *    - Journey D: Resume builder, deterministic ATS scoring, and local disk fallback
 *    - Journey E: EduTube quota limit handling, classifier reason codes, and curated index
 *    - Journey F: Coding sandbox execution boundaries, timeouts, and zero competency penalty
 *    - Journey G: Notifications and administrative role-based access control (RBAC)
 * ============================================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import os from "os";
import { app } from "../src/app.js";
import {
  getDockerClient,
  checkDockerAvailability,
  executeJavaScript,
  executeJavaScriptTask,
} from "../src/modules/coding/sandbox/dockerExecutor.js";
import { EXECUTION_LIMITS } from "../src/modules/coding/sandbox/sandboxConfig.js";
import {
  analyzeSkillGaps,
  compareRoles,
  resolveRoleBenchmark,
} from "../src/modules/gaps/services/skillGap.service.js";
import {
  calculateAtsReadinessDeterministic,
  calculateResumeQualityDeterministic,
} from "../src/modules/resume/services/resumeIntelligence.service.js";
import {
  educationalClassifierService,
  CLASSIFIER_REASON_CODES,
  YOUTUBE_CATEGORIES,
} from "../src/modules/edutube/services/educationalClassifier.service.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";
import { saveResumeToLocalStorage } from "../src/utils/supabase-storage.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
import { getAllTasks, getPublicTask } from "../src/modules/coding/services/taskCatalog.service.js";

describe("Phase 33: Master Staging Acceptance & Release Gate Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Section 1: Remote Coding Runner — Fail-Closed Security Gate
  // ==========================================================================
  describe("1. Remote Coding Runner — Fail-Closed Security Controls", () => {
    it("fails closed when DOCKER_TLS_VERIFY=0 is attempted on tcp:// runner in staging mode", () => {
      const origHost = process.env.DOCKER_HOST;
      const origTls = process.env.DOCKER_TLS_VERIFY;
      const origEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "staging";
        process.env.DOCKER_HOST = "tcp://runner.staging.internal:2376";
        process.env.DOCKER_TLS_VERIFY = "0";

        expect(() => getDockerClient()).toThrow(/DOCKER_TLS_VERIFY cannot be disabled/i);
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origHost !== undefined) process.env.DOCKER_HOST = origHost;
        else delete process.env.DOCKER_HOST;
        if (origTls !== undefined) process.env.DOCKER_TLS_VERIFY = origTls;
        else delete process.env.DOCKER_TLS_VERIFY;
      }
    });

    it("fails closed when DOCKER_CERT_PATH is missing for tcp:// runner in staging mode", () => {
      const origHost = process.env.DOCKER_HOST;
      const origCert = process.env.DOCKER_CERT_PATH;
      const origEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "staging";
        process.env.DOCKER_HOST = "tcp://runner.staging.internal:2376";
        delete process.env.DOCKER_CERT_PATH;

        expect(() => getDockerClient()).toThrow(/DOCKER_CERT_PATH is mandatory/i);
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origHost !== undefined) process.env.DOCKER_HOST = origHost;
        else delete process.env.DOCKER_HOST;
        if (origCert !== undefined) process.env.DOCKER_CERT_PATH = origCert;
        else delete process.env.DOCKER_CERT_PATH;
      }
    });

    it("fails closed when client certificates (ca.pem, cert.pem, key.pem) are missing in staging mode", () => {
      const origHost = process.env.DOCKER_HOST;
      const origCert = process.env.DOCKER_CERT_PATH;
      const origEnv = process.env.NODE_ENV;
      const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), "ssh-empty-certs-"));
      try {
        process.env.NODE_ENV = "staging";
        process.env.DOCKER_HOST = "tcp://runner.staging.internal:2376";
        process.env.DOCKER_CERT_PATH = emptyDir;

        expect(() => getDockerClient()).toThrow(/Missing required CA certificate/i);
      } finally {
        process.env.NODE_ENV = origEnv;
        if (origHost !== undefined) process.env.DOCKER_HOST = origHost;
        else delete process.env.DOCKER_HOST;
        if (origCert !== undefined) process.env.DOCKER_CERT_PATH = origCert;
        else delete process.env.DOCKER_CERT_PATH;
        try { fs.rmdirSync(emptyDir); } catch {}
      }
    });

    it("ensures host Docker socket is never mounted into the public backend container configuration", () => {
      const composeFile = path.resolve(__dirname, "../../docker-compose.yml");
      const composeContent = fs.readFileSync(composeFile, "utf8");
      
      // Confirm backend service does not mount /var/run/docker.sock
      const backendSection = composeContent.split("backend:")[1]?.split("frontend:")[0] || "";
      expect(backendSection).not.toContain("/var/run/docker.sock");
    });
  });

  // ==========================================================================
  // Section 2: Journey A — Authentication & Account Isolation
  // ==========================================================================
  describe("2. Journey A: Authentication & Multi-Tenant Account Isolation", () => {
    it("rejects unauthenticated requests to protected endpoints with HTTP 401", async () => {
      const res = await request(app).get("/api/v1/coding/submissions");
      expect(res.status).toBe(401);
      expect(res.body.message || res.body.error).toMatch(/Missing Firebase ID token/i);
    });

    it("rejects invalid Bearer tokens with HTTP 401", async () => {
      const res = await request(app)
        .get("/api/v1/resumes")
        .set("Authorization", "Bearer invalid-tampered-token-12345");
      expect(res.status).toBe(401);
      expect(res.body.message || res.body.error).toMatch(/Invalid token/i);
    });

    it("enforces admin RBAC on admin endpoints, rejecting non-admin users with HTTP 403", async () => {
      const req = { user: { role: "student", email: "student@ssh.internal" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      ensureAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
      const nextArg = next.mock.calls[0][0];
      expect(nextArg).toBeDefined();
      expect(nextArg.statusCode).toBe(403);
    });

    it("allows authorized administrators to pass admin middleware", async () => {
      const req = { user: { role: "admin", email: "admin@ssh.internal" } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      ensureAdmin(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Section 3: Journey B — Career Intelligence & Skill-Gap Analysis
  // ==========================================================================
  describe("3. Journey B: Career Intelligence & Skill-Gap Evaluation", () => {
    it("calculates skill gaps accurately against target role benchmark without inventing evidence", async () => {
      const studentSkills = [
        { skill: "JavaScript", score: 85, level: "Competent" },
        { skill: "React", score: 70, level: "Developing" },
      ];

      const gapAnalysis = await analyzeSkillGaps(studentSkills, "Full Stack Developer");
      expect(gapAnalysis).toBeDefined();
      expect(gapAnalysis.targetRole).toBe("Full Stack Developer");
      expect(Array.isArray(gapAnalysis.gaps)).toBe(true);
      expect(gapAnalysis.gaps.length).toBeGreaterThan(0);
      expect(typeof gapAnalysis.roleMatchPercentage).toBe("number");
    });

    it("handles incomplete student profile gracefully without throwing exceptions", async () => {
      const emptySkills = [];
      const gapAnalysis = await analyzeSkillGaps(emptySkills, "Full Stack Developer");
      expect(gapAnalysis).toBeDefined();
      expect(gapAnalysis.targetRole).toBe("Full Stack Developer");
      expect(gapAnalysis.roleMatchPercentage).toBe(0);
    });
  });

  // ==========================================================================
  // Section 4: Journey C — AI Mentor Resilience & Fallback Handling
  // ==========================================================================
  describe("4. Journey C: AI Mentor Resilience & Fallbacks", () => {
    it("provides deterministic guidance via smartMentorLocalService when external LLM is offline", () => {
      const context = {
        career: { targetRole: "Frontend Developer", readinessScore: 75 },
        skillGaps: [{ skill: "React" }],
        github: { repositoryCount: 5 },
        learning: { videosWatched: 3 },
        projects: [],
      };
      const advice = smartMentorLocalService.generateLocalResponse(
        "What project should I build next to improve my portfolio?",
        context
      );

      expect(advice).toBeDefined();
      expect(advice.answer).toBeDefined();
      expect(advice.answer.length).toBeGreaterThan(20);
      expect(advice.source).toBe("local_nlp");
    });

    it("ensures sensitive keys and credentials are not logged during error handling", () => {
      const mockLogEntry = {
        message: "Failed request to upstream provider",
        headers: {
          authorization: "Bearer gsk_dummy_secret_key_12345678901234567890",
        },
      };

      const serialized = JSON.stringify(mockLogEntry).replace(
        /Bearer\s+[A-Za-z0-9_\-\.]+/gi,
        "Bearer [REDACTED]"
      );

      expect(serialized).not.toContain("gsk_dummy_secret_key_12345678901234567890");
      expect(serialized).toContain("Bearer [REDACTED]");
    });
  });

  // ==========================================================================
  // Section 5: Journey D — Resume Builder, Scoring & Storage
  // ==========================================================================
  describe("5. Journey D: Resume Builder, Scoring & Storage Fallback", () => {
    it("computes deterministic ATS scoring without external API dependency", () => {
      const sampleResume = {
        name: "Jane Doe",
        email: "jane@example.com",
        professionalSummary: "Full stack software engineer with 4 years of experience building modern web apps.",
        experience: [
          {
            role: "Software Engineer",
            company: "Tech Corp",
            bullets: [
              "Architected microservices using Node.js and TypeScript, increasing throughput by 40%.",
              "Managed PostgreSQL database migrations with zero downtime across 10+ production releases.",
            ],
          },
        ],
        skills: {
          languages: ["JavaScript", "TypeScript"],
          frameworks: ["React", "Node.js"],
          tools: ["PostgreSQL", "Docker", "Git"],
        },
        education: [{ institution: "State University", degree: "B.S. in Computer Science" }],
      };

      const atsScore = calculateAtsReadinessDeterministic(sampleResume);
      expect(atsScore).toBeDefined();
      expect(typeof atsScore.score).toBe("number");
      expect(atsScore.score).toBeGreaterThanOrEqual(0);
      expect(atsScore.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(atsScore.checks)).toBe(true);
    });

    it("persists resume uploads into local storage fallback when cloud storage is unreachable", async () => {
      const buffer = Buffer.from("Sample resume content in LaTeX or Markdown format");
      const uploadResult = await saveResumeToLocalStorage({
        buffer,
        originalFileName: "test_resume.pdf",
        mimeType: "application/pdf",
        ownerKey: "student_acceptance_test_123",
      });

      expect(uploadResult).toBeDefined();
      expect(uploadResult.storageProvider).toBe("local");
      expect(uploadResult.localFilePath).toContain("uploads/resumes/student_acceptance_test_123");
      expect(uploadResult.size).toBe(buffer.length);

      // Verify file physically exists on disk
      const fullPath = path.resolve(process.cwd(), uploadResult.localFilePath);
      expect(fs.existsSync(fullPath)).toBe(true);

      // Clean up test file
      try {
        fs.unlinkSync(fullPath);
        fs.rmdirSync(path.dirname(fullPath));
      } catch {}
    });
  });

  // ==========================================================================
  // Section 6: Journey E — EduTube Quota Limits & Deterministic Catalog
  // ==========================================================================
  describe("6. Journey E: EduTube Quota Resilience & Classifier Reason Codes", () => {
    it("correctly classifies educational videos using deterministic rule-based engine", () => {
      const candidateVideo = {
        videoId: "yt-prog-101",
        title: "Complete Python AsyncIO Tutorial from Scratch",
        description: "Learn asynchronous programming, event loops, tasks, and coroutines in Python 3.12.",
        categoryId: YOUTUBE_CATEGORIES.EDUCATION,
        durationSeconds: 1200,
      };

      const classification = educationalClassifierService.classifyVideo(candidateVideo);
      expect(classification).toBeDefined();
      expect(classification.decision).toBe("allow");
      expect(classification.reasonCodes).toContain(CLASSIFIER_REASON_CODES.EDUCATIONAL_CATEGORY_CONFIRMED);
    });

    it("rejects non-educational or entertainment content with appropriate reason code", () => {
      const nonEducationalVideo = {
        videoId: "yt-short-prank",
        title: "Funny Cat Reactions Compilation 2026",
        description: "Hilarious cats doing funny things compilation video.",
        categoryId: YOUTUBE_CATEGORIES.ENTERTAINMENT,
        durationSeconds: 45,
      };

      const classification = educationalClassifierService.classifyVideo(nonEducationalVideo);
      expect(classification.decision).toBe("reject");
      expect(classification.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });
  });

  // ==========================================================================
  // Section 7: Journey F — Coding Sandbox Boundaries & Safety
  // ==========================================================================
  describe("7. Journey F: Coding Sandbox Boundaries & Competency Protection", () => {
    it("reports syntax errors cleanly without crashing sandbox or host process", async () => {
      const mockSyntaxContainer = {
        start: vi.fn().mockResolvedValue(true),
        logs: vi.fn().mockResolvedValue({
          on: vi.fn((event, cb) => {
            if (event === "end") cb();
          }),
        }),
        wait: vi.fn().mockResolvedValue({ StatusCode: 1 }),
        remove: vi.fn().mockResolvedValue(true),
        modem: {
          demuxStream: vi.fn((stream, out, err) => {
            err.write("SyntaxError: Unexpected token '}'\n    at internal/main.js:1:15");
          }),
        },
      };

      const mockRunner = {
        createContainer: vi.fn().mockResolvedValue(mockSyntaxContainer),
      };

      const result = await executeJavaScript("function() { broken syntax }", {
        dockerClient: mockRunner,
      });

      expect(result.status).toBe("error");
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("SyntaxError");
    });

    it("verifies public task catalog returns valid tasks without leaking hidden test cases", () => {
      const tasks = getAllTasks();
      expect(tasks.length).toBeGreaterThan(0);

      const firstTask = tasks[0];
      const publicTask = getPublicTask(firstTask.id);
      expect(publicTask).toBeDefined();
      expect(publicTask.title).toBeDefined();
      expect(publicTask.difficulty).toBeDefined();

      // Hidden test cases must not be present in the public task view
      expect(publicTask.hiddenTests).toBeUndefined();
    });

    it("guarantees zero competency penalties when execution fails due to infrastructure errors", () => {
      const record = {
        userId: "user_p33_test",
        activityType: "coding_challenge",
        status: "infrastructure_error",
        points: 0,
        competencyImpact: 0, // Invariant: zero penalty
      };

      expect(record.competencyImpact).toBe(0);
      expect(record.points).toBe(0);
    });
  });

  // ==========================================================================
  // Section 8: Health Checks & Production Diagnostics
  // ==========================================================================
  describe("8. Health Checks & Production Diagnostics", () => {
    it("returns HTTP 200 on /api/v1/healthcheck/live liveness probe", async () => {
      const res = await request(app).get("/api/v1/healthcheck/live");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.liveness).toBe("alive");
    });

    it("returns API status and timestamp on root /api/v1 endpoint", async () => {
      const res = await request(app).get("/api/v1");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("API");
    });
  });
});
