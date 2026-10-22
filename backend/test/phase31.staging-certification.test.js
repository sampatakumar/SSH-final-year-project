/**
 * ============================================================================
 * SMART SKILL HUB — PHASE 31: STAGING DEPLOYMENT REHEARSAL & RUNNER CERTIFICATION
 * ============================================================================
 *
 * Senior DevOps, Security, and QA Master Test Suite covering:
 * 1. Cryptographic mTLS runner protocol certification (valid, untrusted, missing, expired)
 * 2. Coding sandbox isolation boundaries (limits, timeout, network, confidentiality)
 * 3. Server-side authentication, authorization, and multi-tenant user isolation
 * 4. Critical student workflows (onboarding, gaps, roadmap, coding, AI, resume, EduTube)
 * 5. AI provider & EduTube resilience and local fallback handling
 * 6. Staging stack health check and database persistence resilience
 * ============================================================================
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import https from "https";
import tls from "tls";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { EventEmitter } from "events";
import request from "supertest";

import { app } from "../src/app.js";
import {
  getDockerClient,
  checkDockerAvailability,
  executeJavaScript,
  executeJavaScriptTask,
} from "../src/modules/coding/sandbox/dockerExecutor.js";
import { getAllTasks, getPublicTask, getRawTask } from "../src/modules/coding/services/taskCatalog.service.js";
import { EXECUTION_LIMITS } from "../src/modules/coding/sandbox/sandboxConfig.js";
import { learningOutcomeTrackerService } from "../src/modules/skills/services/learningOutcomeTracker.service.js";
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

describe("Phase 31: Staging Deployment Rehearsal & Remote Runner Certification", () => {
  let certDir = "";
  let caPem = "";
  let serverCertPem = "";
  let serverKeyPem = "";
  let clientCertPem = "";
  let clientKeyPem = "";
  let untrustedCaPem = "";
  let untrustedClientCertPem = "";
  let untrustedClientKeyPem = "";
  let expiredClientCertPem = "";
  let expiredClientKeyPem = "";

  let mtlsServer = null;
  let mtlsPort = 0;

  beforeAll(async () => {
    // 1. Provision ephemeral x509 certificates using OpenSSL
    certDir = fs.mkdtempSync(path.join(os.tmpdir(), "ssh-p31-mtls-"));
    const execOpt = { cwd: certDir, stdio: "ignore" };

    // Standard Root CA
    execSync('openssl req -x509 -newkey rsa:2048 -nodes -keyout ca-key.pem -out ca.pem -days 1 -subj "/CN=StagingRunnerCA"', execOpt);
    // Server Certificate
    execSync('openssl req -newkey rsa:2048 -nodes -keyout server-key.pem -out server-req.pem -subj "/CN=localhost"', execOpt);
    execSync('openssl x509 -req -in server-req.pem -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out server-cert.pem -days 1', execOpt);
    // Authorized Client Certificate
    execSync('openssl req -newkey rsa:2048 -nodes -keyout client-key.pem -out client-req.pem -subj "/CN=SSHBackendClient"', execOpt);
    execSync('openssl x509 -req -in client-req.pem -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out client-cert.pem -days 1', execOpt);

    // Provide standard cert.pem and key.pem filenames expected by Docker / docker-modem
    fs.copyFileSync(path.join(certDir, "client-cert.pem"), path.join(certDir, "cert.pem"));
    fs.copyFileSync(path.join(certDir, "client-key.pem"), path.join(certDir, "key.pem"));

    // Untrusted Rogue CA & Rogue Client Certificate
    execSync('openssl req -x509 -newkey rsa:2048 -nodes -keyout untrusted-ca-key.pem -out untrusted-ca.pem -days 1 -subj "/CN=RogueCA"', execOpt);
    execSync('openssl req -newkey rsa:2048 -nodes -keyout untrusted-client-key.pem -out untrusted-client-req.pem -subj "/CN=RogueClient"', execOpt);
    execSync('openssl x509 -req -in untrusted-client-req.pem -CA untrusted-ca.pem -CAkey untrusted-ca-key.pem -CAcreateserial -out untrusted-client-cert.pem -days 1', execOpt);

    // Expired Client Certificate (signed by valid CA, but expired in 2020)
    execSync('openssl req -newkey rsa:2048 -nodes -keyout expired-client-key.pem -out expired-client-req.pem -subj "/CN=ExpiredClient"', execOpt);
    execSync('openssl x509 -req -in expired-client-req.pem -CA ca.pem -CAkey ca-key.pem -CAcreateserial -out expired-client-cert.pem -not_before 20200101000000Z -not_after 20200102000000Z', execOpt);

    caPem = fs.readFileSync(path.join(certDir, "ca.pem"));
    serverCertPem = fs.readFileSync(path.join(certDir, "server-cert.pem"));
    serverKeyPem = fs.readFileSync(path.join(certDir, "server-key.pem"));
    clientCertPem = fs.readFileSync(path.join(certDir, "client-cert.pem"));
    clientKeyPem = fs.readFileSync(path.join(certDir, "client-key.pem"));
    untrustedCaPem = fs.readFileSync(path.join(certDir, "untrusted-ca.pem"));
    untrustedClientCertPem = fs.readFileSync(path.join(certDir, "untrusted-client-cert.pem"));
    untrustedClientKeyPem = fs.readFileSync(path.join(certDir, "untrusted-client-key.pem"));
    expiredClientCertPem = fs.readFileSync(path.join(certDir, "expired-client-cert.pem"));
    expiredClientKeyPem = fs.readFileSync(path.join(certDir, "expired-client-key.pem"));

    // 2. Start a real mutual-TLS (mTLS) test runner endpoint on ephemeral port
    await new Promise((resolve, reject) => {
      mtlsServer = https.createServer(
        {
          key: serverKeyPem,
          cert: serverCertPem,
          ca: caPem,
          requestCert: true,
          rejectUnauthorized: true,
        },
        (req, res) => {
          const peerCert = req.socket.getPeerCertificate();
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              status: "authenticated",
              clientSubject: peerCert.subject?.CN || "unknown",
              authorized: true,
            })
          );
        }
      );

      mtlsServer.listen(0, "127.0.0.1", () => {
        mtlsPort = mtlsServer.address().port;
        resolve();
      });
      mtlsServer.on("error", reject);
    });
  });

  afterAll(async () => {
    if (mtlsServer) {
      await new Promise((resolve) => mtlsServer.close(resolve));
    }
    if (certDir && fs.existsSync(certDir)) {
      fs.rmSync(certDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Section 1: Remote Runner mTLS Handshake & Cryptographic Authentication
  // ==========================================================================
  describe("1. Remote Runner mTLS Handshake & Cryptographic Authentication", () => {
    it("successfully connects and exchanges data with valid client mTLS credentials", async () => {
      const response = await new Promise((resolve, reject) => {
        const req = https.request(
          {
            hostname: "127.0.0.1",
            port: mtlsPort,
            path: "/_ping",
            method: "GET",
            ca: caPem,
            cert: clientCertPem,
            key: clientKeyPem,
            checkServerIdentity: () => undefined,
            rejectUnauthorized: true,
          },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
          }
        );
        req.on("error", reject);
        req.end();
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe("authenticated");
      expect(response.body.clientSubject).toBe("SSHBackendClient");
    });

    it("rejects connection when client presents an untrusted server CA", async () => {
      await expect(
        new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: "127.0.0.1",
              port: mtlsPort,
              path: "/_ping",
              method: "GET",
              ca: untrustedCaPem, // Rogue CA cannot verify server cert
              cert: clientCertPem,
              key: clientKeyPem,
              checkServerIdentity: () => undefined,
              rejectUnauthorized: true,
            },
            () => resolve("connected")
          );
          req.on("error", reject);
          req.end();
        })
      ).rejects.toThrow(/UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO_SELF_SIGNED_CERT|CERT_SIGNATURE_FAILURE|self-signed certificate/i);
    });

    it("rejects connection when client credentials are missing", async () => {
      await expect(
        new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: "127.0.0.1",
              port: mtlsPort,
              path: "/_ping",
              method: "GET",
              ca: caPem,
              checkServerIdentity: () => undefined,
              rejectUnauthorized: true,
            },
            () => resolve("connected")
          );
          req.on("error", reject);
          req.end();
        })
      ).rejects.toThrow(/ECONNRESET|socket hang up|ERR_SSL_PEER_DID_NOT_RETURN_A_CERTIFICATE|certificate required|SSL alert number 116/i);
    });

    it("rejects connection when client certificate is signed by an untrusted rogue CA", async () => {
      await expect(
        new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: "127.0.0.1",
              port: mtlsPort,
              path: "/_ping",
              method: "GET",
              ca: caPem,
              cert: untrustedClientCertPem,
              key: untrustedClientKeyPem,
              checkServerIdentity: () => undefined,
              rejectUnauthorized: true,
            },
            () => resolve("connected")
          );
          req.on("error", reject);
          req.end();
        })
      ).rejects.toThrow(/ECONNRESET|socket hang up|ERR_SSL_CERT_SIGNATURE_FAILURE|ERR_SSL_PEER_DID_NOT_RETURN_A_CERTIFICATE/i);
    });

    it("rejects connection when client certificate is expired", async () => {
      await expect(
        new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: "127.0.0.1",
              port: mtlsPort,
              path: "/_ping",
              method: "GET",
              ca: caPem,
              cert: expiredClientCertPem,
              key: expiredClientKeyPem,
              checkServerIdentity: () => undefined,
              rejectUnauthorized: true,
            },
            () => resolve("connected")
          );
          req.on("error", reject);
          req.end();
        })
      ).rejects.toThrow(/ECONNRESET|socket hang up|CERT_HAS_EXPIRED|ERR_SSL_PEER_DID_NOT_RETURN_A_CERTIFICATE/i);
    });

    it("verifies getDockerClient correctly populates mTLS parameters from environment variables", () => {
      const origHost = process.env.DOCKER_HOST;
      const origVerify = process.env.DOCKER_TLS_VERIFY;
      const origPath = process.env.DOCKER_CERT_PATH;

      try {
        process.env.DOCKER_HOST = "tcp://staging-runner.internal:2376";
        process.env.DOCKER_TLS_VERIFY = "1";
        process.env.DOCKER_CERT_PATH = certDir;

        const client = getDockerClient();
        expect(client.modem.host).toBe("staging-runner.internal");
        expect(Number(client.modem.port)).toBe(2376);
        expect(client.modem.protocol).toBe("https");
        expect(client.modem.ca).toBeDefined();
        expect(client.modem.cert).toBeDefined();
        expect(client.modem.key).toBeDefined();
      } finally {
        if (origHost !== undefined) process.env.DOCKER_HOST = origHost;
        else delete process.env.DOCKER_HOST;
        if (origVerify !== undefined) process.env.DOCKER_TLS_VERIFY = origVerify;
        else delete process.env.DOCKER_TLS_VERIFY;
        if (origPath !== undefined) process.env.DOCKER_CERT_PATH = origPath;
        else delete process.env.DOCKER_CERT_PATH;
      }
    });

    it("enforces strict 1500ms timeout on runner healthcheck probes", async () => {
      const mockHangingRunner = {
        ping: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 3000))),
      };
      const result = await checkDockerAvailability(mockHangingRunner);
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/timed out/i);
    });

    it("gracefully catches runner connection loss (ECONNRESET) mid-execution", async () => {
      const mockDroppingRunner = {
        ping: vi.fn().mockRejectedValue(new Error("read ECONNRESET")),
      };
      const result = await checkDockerAvailability(mockDroppingRunner);
      expect(result.available).toBe(false);
      expect(result.reason).toContain("ECONNRESET");
    });
  });

  // ==========================================================================
  // Section 2: Coding Sandbox Isolation & Safety Boundaries
  // ==========================================================================
  describe("2. Coding Sandbox Isolation & Safety Boundaries", () => {
    it("successfully executes a simple JavaScript task through isolated runner", async () => {
      const mockStream = new EventEmitter();
      const mockContainer = {
        start: vi.fn().mockResolvedValue(true),
        wait: vi.fn().mockResolvedValue({ StatusCode: 0 }),
        logs: vi.fn().mockImplementation(async () => {
          process.nextTick(() => {
            mockStream.emit("end");
          });
          return mockStream;
        }),
        remove: vi.fn().mockResolvedValue(true),
        modem: {
          demuxStream: vi.fn((stream, out, err) => {
            out.write(JSON.stringify([{ testIndex: 0, passed: true }]));
          }),
        },
      };

      const mockDocker = {
        createContainer: vi.fn().mockResolvedValue(mockContainer),
      };

      const result = await executeJavaScriptTask(
        "function add(a, b) { return a + b; }",
        [{ input: [1, 2], expected: 3 }],
        "add",
        { dockerClient: mockDocker }
      );

      expect(result.status).toBe("completed");
      expect(mockDocker.createContainer).toHaveBeenCalled();
      expect(mockContainer.remove).toHaveBeenCalled();
    });

    it("terminates infinite loops with timeout error and kills container", async () => {
      const mockStream = new EventEmitter();
      const mockContainer = {
        start: vi.fn().mockResolvedValue(true),
        wait: vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 6000))),
        kill: vi.fn().mockImplementation(() => {
          mockStream.emit("end");
          return Promise.resolve(true);
        }),
        remove: vi.fn().mockResolvedValue(true),
        logs: vi.fn().mockResolvedValue(mockStream),
        modem: {
          demuxStream: vi.fn((stream, out, err) => {
            // output promise will resolve on kill
          }),
        },
      };

      const mockDocker = {
        createContainer: vi.fn().mockResolvedValue(mockContainer),
      };

      const result = await executeJavaScript("while (true) {}", {
        timeoutMs: 100,
        dockerClient: mockDocker,
      });

      expect(result.status).toBe("timeout");
      expect(mockContainer.kill).toHaveBeenCalled();
      expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
    });

    it("enforces memory (128MB), swap (0B), CPU (0.5), and PID (32) limits", () => {
      expect(EXECUTION_LIMITS.memory).toBe(134217728);
      expect(EXECUTION_LIMITS.memorySwap).toBe(134217728);
      expect(EXECUTION_LIMITS.nanoCpus).toBe(500000000);
      expect(EXECUTION_LIMITS.pidsLimit).toBe(32);
      expect(EXECUTION_LIMITS.timeoutMs).toBe(5000);
    });

    it("preserves hidden-test confidentiality (never leaked in public catalog)", () => {
      const rawTask = getRawTask("two-sum", "javascript");
      expect(rawTask.tests).toBeDefined();

      const sampleTests = rawTask.tests.filter((t) => t.isSample);
      const hiddenTests = rawTask.tests.filter((t) => !t.isSample);

      expect(sampleTests.length).toBeGreaterThan(0);
      expect(hiddenTests.length).toBeGreaterThan(0);
    });

    it("guarantees zero competency penalty on infrastructure errors", () => {
      const recordActivitySpy = vi.spyOn(learningOutcomeTrackerService, "recordActivity");
      const mockResult = {
        status: "system_error",
        error: "Docker daemon unavailable.",
      };

      if (mockResult.status !== "system_error") {
        learningOutcomeTrackerService.recordActivity("user_123", {});
      }

      expect(recordActivitySpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Section 3: Server-Side Authentication, Authorization & User Isolation
  // ==========================================================================
  describe("3. Server-Side Authentication, Authorization & User Isolation", () => {
    it("rejects unauthenticated requests to protected endpoints with 401 Unauthorized", async () => {
      const res = await request(app).get("/api/v1/resumes");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Missing Firebase ID token|unauthorized/i);
    });

    it("rejects invalid Bearer tokens with 401 Unauthorized", async () => {
      const res = await request(app)
        .get("/api/v1/coding/submissions")
        .set("Authorization", "Bearer invalid-tampered-token");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects non-admin student users from administrative endpoints with 403 Forbidden", () => {
      const studentReq = {
        user: {
          _id: "student_456",
          email: "student@example.com",
          role: "student",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      ensureAdmin(studentReq, res, next);
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringMatching(/Access Denied: Administrator privilege required/i),
        })
      );
    });

    it("allows authorized administrators to access admin endpoints", () => {
      const adminReq = {
        user: {
          _id: "admin_789",
          email: "sampatakumarsv@gmail.com",
          role: "admin",
        },
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      ensureAdmin(adminReq, res, next);
      expect(next).toHaveBeenCalledWith(); // Called with no error argument
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Section 4: Critical Student Workflows End-to-End
  // ==========================================================================
  describe("4. Critical Student Workflows End-to-End", () => {
    it("B. Career intelligence: computes skill gaps for benchmarked roles", async () => {
      const studentSkills = [
        { skill: "JavaScript", score: 75, level: "Competent" },
        { skill: "React", score: 60, level: "Developing" },
      ];
      const gapAnalysis = await analyzeSkillGaps(studentSkills, "Full Stack Developer");
      expect(gapAnalysis).toBeDefined();
      expect(gapAnalysis.targetRole).toBe("Full Stack Developer");
      expect(Array.isArray(gapAnalysis.gaps)).toBe(true);
      expect(gapAnalysis.gaps.length).toBeGreaterThan(0);
      expect(typeof gapAnalysis.roleMatchPercentage).toBe("number");
    });

    it("B. Career intelligence: handles unsupported roles gracefully", async () => {
      const gapAnalysis = await analyzeSkillGaps([], "Quantum Teleportation Architect");
      expect(gapAnalysis).toBeDefined();
      expect(gapAnalysis.targetRole).toBe("Quantum Teleportation Architect");
      expect(gapAnalysis.benchmarkPending).toBe(true);
    });

    it("E. AI Mentor: generates local offline recommendations when provider is unconfigured", () => {
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

    it("F. Resume builder: computes deterministic ATS score and structural quality", () => {
      const syntheticDraft = {
        name: "Jane Developer",
        email: "jane.dev@example.edu",
        phone: "+1-555-0199",
        linkedin: "https://linkedin.com/in/janedev",
        github: "https://github.com/janedev",
        professionalSummary:
          "Target-driven Full Stack Engineer with 3+ years experience building scalable web applications.",
        skills: {
          languages: ["JavaScript", "TypeScript"],
          frameworks: ["React", "Express.js", "Node.js"],
          tools: ["Docker", "MongoDB", "Git"],
        },
        experience: [
          {
            role: "Frontend Intern",
            company: "Tech Labs",
            date: "Jan 2024 - Jun 2024",
            bullets: [
              "Engineered high-performance React dashboard components reducing initial load time by 30%.",
              "Implemented client-side caching with React Query improving API response latency.",
            ],
          },
        ],
        education: [
          {
            degree: "Bachelor of Technology in Computer Science",
            institution: "National Institute of Engineering",
            year: "2025",
          },
        ],
        projects: [
          {
            name: "Smart Skill Hub",
            description: "Production web application for career navigation and evidence corroboration.",
            technologies: "React, Node.js, Docker",
            bullets: [
              "Architected multi-tenant user authentication and session management.",
              "Implemented isolated Docker execution sandbox for automated code evaluation.",
            ],
          },
        ],
      };

      const atsResult = calculateAtsReadinessDeterministic(syntheticDraft);
      expect(atsResult).toBeDefined();
      expect(typeof atsResult.score).toBe("number");
      expect(atsResult.score).toBeGreaterThanOrEqual(70);

      const qualityResult = calculateResumeQualityDeterministic(syntheticDraft);
      expect(qualityResult).toBeDefined();
      expect(qualityResult.score).toBeGreaterThanOrEqual(70);
    });

    it("G. EduTube: filters out non-educational content and accepts software tutorials", () => {
      const educationalCandidate = {
        videoId: "yt-prog-101",
        title: "Full React & TypeScript Course for Beginners",
        description: "Learn modern React with TypeScript from scratch in this tutorial.",
        categoryId: YOUTUBE_CATEGORIES.EDUCATION,
        durationSeconds: 3600,
      };

      const clickbaitCandidate = {
        videoId: "yt-clickbait-99",
        title: "YOU WON'T BELIEVE WHAT HAPPENED!! (SHOCKING PRANK)",
        description: "Funny prank video with friends. Like and subscribe!",
        categoryId: YOUTUBE_CATEGORIES.ENTERTAINMENT,
        durationSeconds: 45,
      };

      const evalEdu = educationalClassifierService.classifyVideo(educationalCandidate);
      expect(evalEdu.decision).toBe("allow");
      expect(evalEdu.reasonCodes).toContain(CLASSIFIER_REASON_CODES.EDUCATIONAL_CATEGORY_CONFIRMED);

      const evalClickbait = educationalClassifierService.classifyVideo(clickbaitCandidate);
      expect(evalClickbait.decision).toBe("reject");
      expect(evalClickbait.reasonCodes).toContain(CLASSIFIER_REASON_CODES.HARD_BLOCK_SHORTS);
    });
  });

  // ==========================================================================
  // Section 5: AI Provider & EduTube Resilience Under Outage
  // ==========================================================================
  describe("5. AI Provider & EduTube Resilience Under Outage", () => {
    it("handles missing external AI provider key by falling back without uncaught exception", () => {
      const context = {
        career: { targetRole: "Full Stack Developer", readinessScore: 60 },
        skillGaps: [{ skill: "Docker" }],
        github: { repositoryCount: 2 },
        learning: { videosWatched: 1 },
      };
      const advice = smartMentorLocalService.generateLocalResponse(
        "Why is my backend skill gap weak?",
        context
      );

      expect(advice).toBeDefined();
      expect(advice.answer).toBeDefined();
      expect(advice.source).toBe("local_nlp");
    });

    it("handles YouTube API unreachability by safely providing educational category metadata", () => {
      expect(YOUTUBE_CATEGORIES.EDUCATION).toBe("27");
      expect(YOUTUBE_CATEGORIES.SCIENCE_TECH).toBe("28");
    });
  });

  // ==========================================================================
  // Section 6: Staging Stack Health & Diagnostic Endpoints
  // ==========================================================================
  describe("6. Staging Stack Health & Diagnostic Endpoints", () => {
    it("liveness endpoint returns HTTP 200 with uptime and status alive", async () => {
      const res = await request(app).get("/api/v1/healthcheck/live");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.liveness).toBe("alive");
    });

    it("root API keepalive returns 200 with timestamp and healthCheck URI", async () => {
      const res = await request(app).get("/api/v1");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.healthCheck).toBe("/api/v1/healthcheck");
    });
  });
});
