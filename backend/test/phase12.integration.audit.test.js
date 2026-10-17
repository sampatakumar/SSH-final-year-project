import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import express from "express";

import { app } from "../src/app.js";
import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { SkillProfile } from "../src/modules/skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../src/modules/github/models/githubAnalysis.models.js";
import { Resume } from "../src/modules/resume/models/resume.models.js";
import { Project } from "../src/modules/resume/models/project.models.js";
import { Notification } from "../src/modules/notifications/models/notification.models.js";
import { CodingSubmission } from "../src/modules/coding/models/codingSubmission.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
} from "../src/modules/edutube/models/index.js";
import { upsertUserFromFirebase } from "../src/core/auth/auth.service.js";
import { ensureAdmin } from "../src/core/middleware/admin.middleware.js";
import { listAdminUsers } from "../src/modules/admin/services/adminUser.service.js";
import {
  sanitizeNotificationDestination,
  sanitizeNotificationText,
} from "../src/modules/notifications/utils/destinationValidator.js";
import {
  analyzeSkillGaps,
  compareRoles,
  findCatalogRoleDefinition,
} from "../src/modules/gaps/services/skillGap.service.js";
import { TARGET_ROLES } from "../src/modules/gaps/benchmarks/roleRequirements.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";

describe("Phase 12: Full-System Integration, Security Audit & Release Readiness Suite", () => {
  const userAId = new mongoose.Types.ObjectId("65a000000000000000000001");
  const userBId = new mongoose.Types.ObjectId("65a000000000000000000002");
  const adminId = new mongoose.Types.ObjectId("65a000000000000000000003");

  const mockUserA = {
    _id: userAId,
    firebaseUid: "firebase_uid_user_a",
    email: "user.a@example.com",
    displayName: "Student User A",
    role: "student",
    emailVerified: true,
    academic: {
      degreeName: "Bachelor of Technology",
      degreeSlug: "b-tech",
      branchName: "Computer Science and Engineering",
      branchSlug: "cse",
      currentYear: 3,
      currentSemester: 6,
      institution: "State Engineering University",
    },
    targetRole: "Full Stack Developer",
    targetRoles: ["Full Stack Developer", "Backend Engineer"],
    save: vi.fn().mockResolvedValue(undefined),
  };

  const mockUserB = {
    _id: userBId,
    firebaseUid: "firebase_uid_user_b",
    email: "user.b@example.com",
    displayName: "Student User B",
    role: "student",
    emailVerified: true,
    save: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Authentication & Privilege Escalation Immunity
  // =========================================================================
  describe("1. Authentication & Privilege Escalation Defense", () => {
    it("rejects unauthenticated requests to protected endpoints with 401", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("prevents privilege escalation when student attempts to patch role or emailVerified", async () => {
      const { updateCurrentUser } = await import("../src/core/auth/auth.controller.js");

      const userDoc = {
        ...mockUserA,
        role: "student",
        emailVerified: true,
        save: vi.fn().mockResolvedValue(undefined),
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, _res, next) => {
        req.auth = { uid: userDoc.firebaseUid, email: userDoc.email };
        req.user = userDoc;
        next();
      });
      testApp.patch("/api/v1/auth/profile", updateCurrentUser);

      // Malicious payload attempting to elevate privileges
      const res = await request(testApp)
        .patch("/api/v1/auth/profile")
        .send({
          displayName: "Upgraded Student",
          role: "admin",
          emailVerified: true,
          arbitraryInjectionField: "exploit",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // The role MUST remain student; updateProfileSchema strips unallowed keys
      expect(userDoc.role).toBe("student");
      expect(userDoc.displayName).toBe("Upgraded Student");
      expect(userDoc.save).toHaveBeenCalledTimes(1);
    });

    it("enforces dual targetRole and targetRoles compatibility without dropping data", async () => {
      const { updateCurrentUser } = await import("../src/core/auth/auth.controller.js");

      const userDoc = {
        ...mockUserA,
        targetRole: "Frontend Developer",
        targetRoles: ["Frontend Developer"],
        save: vi.fn().mockResolvedValue(undefined),
      };

      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, _res, next) => {
        req.auth = { uid: userDoc.firebaseUid };
        req.user = userDoc;
        next();
      });
      testApp.patch("/api/v1/auth/profile", updateCurrentUser);

      const res = await request(testApp)
        .patch("/api/v1/auth/profile")
        .send({
          targetRole: "Full Stack Developer",
          targetRoles: ["Full Stack Developer", "DevOps Engineer", "Cloud Architect"],
        });

      expect(res.status).toBe(200);
      expect(userDoc.targetRole).toBe("Full Stack Developer");
      expect(userDoc.targetRoles).toEqual(["Full Stack Developer", "DevOps Engineer", "Cloud Architect"]);
      expect(userDoc.save).toHaveBeenCalledTimes(1);
    });

    it("blocks account pre-hijacking by refusing email-based account linking when email is unverified", async () => {
      vi.spyOn(User, "findOne")
        .mockResolvedValueOnce(null) // Search by UID returns null
        .mockResolvedValueOnce({ _id: userAId, email: "victim@example.com", firebaseUid: "victim_uid" }); // Search by email

      vi.spyOn(User, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        firebaseUid: "attacker_uid",
        email: "victim@example.com",
        emailVerified: false,
      });

      // Attacker token claiming victim's email without verification
      const unverifiedToken = {
        uid: "attacker_uid",
        email: "victim@example.com",
        email_verified: false,
      };

      const result = await upsertUserFromFirebase(unverifiedToken);
      // It should create a new unlinked user rather than mutating victim's account
      expect(result.firebaseUid).toBe("attacker_uid");
      expect(result.emailVerified).toBe(false);
    });

    it("rejects admin email match if email is not verified in ensureAdmin middleware", async () => {
      const nextFn = vi.fn();
      const req = {
        auth: { email: "sampatakumarsv@gmail.com", decodedToken: { email_verified: false } },
        user: { email: "sampatakumarsv@gmail.com", role: "student", emailVerified: false },
      };
      const res = {};

      ensureAdmin(req, res, nextFn);

      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: expect.stringContaining("Administrator privilege required"),
        })
      );
    });
  });

  // =========================================================================
  // 2. Broken Object-Level Authorization (BOLA / IDOR) Cross-User Denial
  // =========================================================================
  describe("2. Broken Object-Level Authorization (BOLA / IDOR) Cross-User Isolation", () => {
    it("denies User B from retrieving User A's resume (returns 404 to avoid enumeration)", async () => {
      const resumeAId = new mongoose.Types.ObjectId("65b000000000000000000001");

      // Mock Resume.findOne returning null because owner filter { owner: userB._id } does not match
      vi.spyOn(Resume, "findOne").mockImplementation(({ _id, owner }) => {
        if (String(_id) === String(resumeAId) && String(owner) === String(userAId)) {
          return Promise.resolve({ _id: resumeAId, owner: userAId, title: "User A Resume" });
        }
        return Promise.resolve(null);
      });

      const { getResumeFile } = await import("../src/modules/resume/controllers/resume.controller.js");
      const testApp = express();
      testApp.use((req, _res, next) => {
        req.user = mockUserB; // User B attempting to view User A's resume
        next();
      });
      testApp.get("/api/v1/resumes/:resumeId/file", getResumeFile);

      const res = await request(testApp).get(`/api/v1/resumes/${resumeAId}/file`);
      expect(res.status).toBe(404);
    });

    it("denies User B from modifying User A's project (returns 404)", async () => {
      const projectAId = new mongoose.Types.ObjectId("65c000000000000000000001");

      // findOneAndUpdate with owner check returns null for User B
      vi.spyOn(Project, "findOneAndUpdate").mockImplementation((filter) => {
        if (String(filter._id) === String(projectAId) && String(filter.owner) === String(userAId)) {
          return Promise.resolve({ _id: projectAId, owner: userAId });
        }
        return Promise.resolve(null);
      });

      const { updateProject } = await import("../src/modules/resume/controllers/project.controller.js");
      const testApp = express();
      testApp.use(express.json());
      testApp.use((req, _res, next) => {
        req.user = mockUserB; // User B attempting to edit User A's project
        next();
      });
      testApp.put("/api/v1/projects/:projectId", updateProject);

      const res = await request(testApp)
        .put(`/api/v1/projects/${projectAId}`)
        .send({
          title: "Malicious Edit",
          description: "Attempting unauthorized modification of another student's project description.",
        });

      expect(res.status).toBe(404);
    });

    it("denies User B from marking User A's notifications as read", async () => {
      const notifAId = new mongoose.Types.ObjectId("65d000000000000000000001");

      vi.spyOn(Notification, "findOne").mockImplementation(({ _id, owner }) => {
        if (String(_id) === String(notifAId) && String(owner) === String(userAId)) {
          return Promise.resolve({ _id: notifAId, owner: userAId, isRead: false, save: vi.fn() });
        }
        return Promise.resolve(null);
      });

      const { markNotificationAsRead } = await import(
        "../src/modules/notifications/services/notification.service.js"
      );

      await expect(markNotificationAsRead(userBId, notifAId.toString())).rejects.toThrow(
        "Notification not found or access denied"
      );
    });
  });

  // =========================================================================
  // 3. ReDoS and Injection Resistance
  // =========================================================================
  describe("3. ReDoS & Input Sanitization Resistance", () => {
    it("handles malicious regex metacharacters in admin user search safely without crashing", async () => {
      let executedFilter = null;
      vi.spyOn(User, "countDocuments").mockImplementation(async (filter) => {
        executedFilter = filter;
        return 0;
      });
      const mockFind = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(User, "find").mockReturnValue(mockFind);

      // ReDoS pattern with repeating groups and unescaped quantifiers
      const dangerousPayload = "((((a+)+)+)+)$[.*+?^${}()|[\\]\\]";
      const result = await listAdminUsers({ search: dangerousPayload, branch: dangerousPayload });

      expect(result).toBeDefined();
      expect(result.users).toEqual([]);
      expect(executedFilter).toBeDefined();
    });

    it("neutralizes open redirect and XSS payloads in notification destinations", () => {
      // Must fall back to safe /dashboard
      expect(sanitizeNotificationDestination("https://evil-phishing.com/login")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("//evil-phishing.com/bypass")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("javascript:alert(document.domain)")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("vbscript:msgbox(1)")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("data:text/html,<script>alert(1)</script>")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("/dashboard/admin<img src=x onerror=alert(1)>")).toBe("/dashboard");

      // Legitimate dashboard deep links are preserved
      expect(sanitizeNotificationDestination("/dashboard/coding")).toBe("/dashboard/coding");
      expect(sanitizeNotificationDestination("/dashboard/gaps?role=DevOps")).toBe("/dashboard/gaps?role=DevOps");
    });

    it("sanitizes notification message text and enforces maximum length", () => {
      const injectionText = "<script>alert('xss')</script><b>Milestone Reached!</b>";
      const sanitized = sanitizeNotificationText(injectionText, 100);
      expect(sanitized).toBe("Milestone Reached!");
      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain("script");
    });
  });

  // =========================================================================
  // 4. Career Intelligence & Multi-Role Comparison Verification
  // =========================================================================
  describe("4. Career Intelligence & Multi-Role Benchmark Verification", () => {
    it("performs multi-role comparison across multiple benchmarks without fabricating data", () => {
      const studentSkills = [
        { canonicalName: "JavaScript", score: 85, level: "Proficient", category: "Languages" },
        { canonicalName: "Node.js", score: 80, level: "Proficient", category: "Backend" },
        { canonicalName: "Git", score: 75, level: "Competent", category: "Tools" },
      ];

      const roles = [TARGET_ROLES.FULL_STACK_DEVELOPER, TARGET_ROLES.BACKEND_DEVELOPER];
      const comparison = compareRoles(studentSkills, roles);

      expect(comparison).toBeDefined();
      expect(comparison.rolesCount).toBe(2);
      expect(comparison.rolesSummary).toHaveLength(2);

      const fsRole = comparison.rolesSummary.find((c) => c.targetRole === TARGET_ROLES.FULL_STACK_DEVELOPER);
      const beRole = comparison.rolesSummary.find((c) => c.targetRole === TARGET_ROLES.BACKEND_DEVELOPER);

      expect(fsRole).toBeDefined();
      expect(beRole).toBeDefined();
      expect(fsRole.benchmarkPending).toBe(false);
      expect(beRole.benchmarkPending).toBe(false);
      expect(fsRole.totalRequiredSkills).toBeGreaterThan(0);
      expect(beRole.totalRequiredSkills).toBeGreaterThan(0);
    });

    it("retrieves catalog role definition gracefully and handles nonexistent roles without error", () => {
      const validRole = findCatalogRoleDefinition("Full Stack Developer");
      expect(validRole).toBeDefined();
      expect(validRole.title).toBe("Full-Stack Developer");

      const invalidRole = findCatalogRoleDefinition("NonExistentRole999");
      expect(invalidRole).toBeNull();
    });

    it("constructs AI Mentor unified context with academic details and dual target roles", async () => {
      vi.spyOn(User, "findById").mockReturnValue({ lean: async () => mockUserA });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({ lean: async () => null });
      vi.spyOn(SkillProfile, "findOne").mockReturnValue({ lean: async () => null });
      vi.spyOn(GitHubAnalysis, "findOne").mockReturnValue({ sort: () => ({ lean: async () => null }) });
      vi.spyOn(Project, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
      vi.spyOn(Resume, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
      vi.spyOn(EduTubeWatchHistory, "find").mockReturnValue({
        sort: () => ({ limit: () => ({ lean: async () => [] }) }),
      });
      vi.spyOn(EduTubeProgress, "find").mockReturnValue({ lean: async () => [] });
      vi.spyOn(EduTubeSavedVideo, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
      vi.spyOn(EduTubePlaylist, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });
      vi.spyOn(CodingSubmission, "find").mockReturnValue({ limit: () => ({ lean: async () => [] }) });

      const context = await smartMentorContextService.getUnifiedUserContext(userAId, {
        forceRefresh: true,
      });

      expect(context).toBeDefined();
      expect(context.career.targetRole).toBe("Full Stack Developer");
      expect(context.career.targetRoles).toEqual(["Full Stack Developer", "Backend Engineer"]);
      expect(context.career.academic.degreeName).toBe("Bachelor of Technology");
      expect(context.career.academic.branchName).toBe("Computer Science and Engineering");
      expect(context.career.academic.isConfigured).toBe(true);
    });
  });

  // =========================================================================
  // 5. Coding Sandbox Status & Isolation Verification
  // =========================================================================
  describe("5. Coding Sandbox Status & Security Boundary", () => {
    it("returns accurate status and strict sandbox configuration parameters", async () => {
      const res = await request(app).get("/api/v1/coding/sandbox/status");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      const { executionLimits, isolation, supportedLanguages } = res.body.data;

      // Verify documented execution constraints
      expect(executionLimits.memory).toBe("128MB");
      expect(executionLimits.timeoutMs).toBe(5000);
      expect(executionLimits.maxConcurrentContainers).toBe(4);

      // Verify security containment flags
      expect(isolation.networkDisabled).toBe(true);
      expect(isolation.readonlyRootfs).toBe(true);
      expect(isolation.tmpfsMounted).toBe(true);
      expect(isolation.capDrop).toEqual(["ALL"]);
      expect(isolation.securityOpt).toContain("no-new-privileges:true");
      expect(isolation.nonRootUser).toBe("node");

      expect(supportedLanguages).toContain("javascript");
    });
  });
});
