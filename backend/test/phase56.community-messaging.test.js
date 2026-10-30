import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  hashGroupPassword,
  verifyGroupPassword,
  checkGroupPasswordRateLimit,
  recordFailedGroupPasswordAttempt,
  clearGroupPasswordFailedAttempts,
  resetAllPasswordRateLimits,
} from "../src/modules/community/utils/passwordSecurity.js";
import {
  sanitizeMessageContent,
  communityMessageService,
} from "../src/modules/community/services/communityMessage.service.js";
import {
  communityGroupService,
} from "../src/modules/community/services/communityGroup.service.js";
import {
  studentDirectoryService,
} from "../src/modules/community/services/studentDirectory.service.js";
import {
  publicProjectDiscoveryService,
} from "../src/modules/community/services/publicProjectDiscovery.service.js";
import {
  CommunityGroup,
  COMMUNITY_GROUP_CATEGORIES,
} from "../src/modules/community/models/communityGroup.models.js";
import { CommunityMembership } from "../src/modules/community/models/communityMembership.models.js";
import { CommunityMessage } from "../src/modules/community/models/communityMessage.models.js";
import {
  CommunityMessageReport,
  REPORT_REASONS,
} from "../src/modules/community/models/communityMessageReport.models.js";
import { CommunityBlock } from "../src/modules/community/models/communityBlock.models.js";
import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import { StudentProject } from "../src/modules/academic/models/studentProject.models.js";
import { CompetencyBadge } from "../src/modules/skills/models/competencyBadge.models.js";

// Mock students
const studentA = {
  _id: new mongoose.Types.ObjectId("65b000000000000000000001"),
  displayName: "Aarav Sharma",
  email: "aarav@campus.edu",
  phone: "+91-9876543210",
  firebaseUid: "firebase_student_a_uid",
  role: "student",
  academic: {
    branchName: "Computer Science and Engineering",
    branchSlug: "cse",
    institution: "National Institute of Technology",
    currentSemester: 6,
  },
  skillLanguages: ["Python", "TypeScript", "C++"],
  skillFrameworks: ["React", "Express"],
  skillTools: ["Git", "Docker"],
  careerInterests: ["Full Stack Engineering"],
  targetRole: "Full Stack Developer",
  headline: "Aspiring Cloud Engineer",
};

const studentB = {
  _id: new mongoose.Types.ObjectId("65b000000000000000000002"),
  displayName: "Diya Patel",
  email: "diya@campus.edu",
  phone: "+91-9876543211",
  firebaseUid: "firebase_student_b_uid",
  role: "student",
  academic: {
    branchName: "Mechanical Engineering",
    branchSlug: "mech",
    institution: "IIT Bombay",
    currentSemester: 4,
  },
  skillLanguages: ["Python", "MATLAB"],
  skillFrameworks: [],
  skillTools: ["SolidWorks", "ANSYS"],
  careerInterests: ["Robotics"],
  targetRole: "Robotics Engineer",
  headline: "Robotics & CAD Enthusiast",
};

describe("Phase 56: Student Community, Global Messaging & Collaboration Audit Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAllPasswordRateLimits();
  });

  // =========================================================================
  // 1. PASSWORD CRYPTOGRAPHY & SECURITY
  // =========================================================================
  describe("Group 1: Private Group Password Security & Cryptography", () => {
    it("1.1 Securely hashes password using scrypt with random salt (salt:derivedKey format)", () => {
      const password = "CampusSecret2026!";
      const hash = hashGroupPassword(password);

      expect(typeof hash).toBe("string");
      const parts = hash.split(":");
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBe(32); // 16 bytes = 32 hex chars
      expect(parts[1].length).toBe(128); // 64 bytes = 128 hex chars
    });

    it("1.2 Constant-time comparison verifies correct passwords and rejects incorrect ones", () => {
      const password = "MyGroupPassword123";
      const hash = hashGroupPassword(password);

      expect(verifyGroupPassword(password, hash)).toBe(true);
      expect(verifyGroupPassword("WrongPassword", hash)).toBe(false);
      expect(verifyGroupPassword("", hash)).toBe(false);
      expect(verifyGroupPassword(null, hash)).toBe(false);
      expect(verifyGroupPassword(password, "malformed_hash")).toBe(false);
    });

    it("1.3 Two identical plain passwords produce different salt hashes (rainbow table immunity)", () => {
      const hash1 = hashGroupPassword("SamePassword99");
      const hash2 = hashGroupPassword("SamePassword99");
      expect(hash1).not.toBe(hash2);
      expect(verifyGroupPassword("SamePassword99", hash1)).toBe(true);
      expect(verifyGroupPassword("SamePassword99", hash2)).toBe(true);
    });

    it("1.4 Enforces brute-force lockout after 5 consecutive failed password attempts", () => {
      const userId = "user123";
      const groupId = "group456";

      expect(checkGroupPasswordRateLimit(userId, groupId).allowed).toBe(true);

      for (let i = 1; i <= 4; i++) {
        const result = recordFailedGroupPasswordAttempt(userId, groupId);
        expect(result.isLocked).toBe(false);
        expect(result.remainingAttempts).toBe(5 - i);
      }

      // 5th attempt triggers lockout
      const lockResult = recordFailedGroupPasswordAttempt(userId, groupId);
      expect(lockResult.isLocked).toBe(true);
      expect(lockResult.remainingAttempts).toBe(0);

      const rateCheck = checkGroupPasswordRateLimit(userId, groupId);
      expect(rateCheck.allowed).toBe(false);
      expect(rateCheck.reason).toContain("Too many failed password attempts");

      // Successful password entry clears lock
      clearGroupPasswordFailedAttempts(userId, groupId);
      expect(checkGroupPasswordRateLimit(userId, groupId).allowed).toBe(true);
    });
  });

  // =========================================================================
  // 2. INPUT SANITIZATION & MESSAGE CONTENT SAFETY
  // =========================================================================
  describe("Group 2: Input Sanitization & XSS Neutralization", () => {
    it("2.1 Strips script tags, javascript: uris, and inline event handlers from messages", () => {
      const dirty = "<script>alert('xss')</script>Hello <img src=x onerror=alert(1)>world! javascript:void(0)";
      const clean = sanitizeMessageContent(dirty);
      expect(clean).not.toContain("<script>");
      expect(clean).not.toContain("onerror=");
      expect(clean).not.toContain("javascript:");
      expect(clean).toContain("Hello");
      expect(clean).toContain("world!");
    });

    it("2.2 Allows normal mathematical and code-formatting characters without corruption", () => {
      const codeSnippet = "if (a < b && b > 0) { return a * b; }";
      const clean = sanitizeMessageContent(codeSnippet);
      expect(clean).toBe(codeSnippet);
    });
  });

  // =========================================================================
  // 3. COMMUNITY CATEGORIES & REPORT REASONS INTEGRITY
  // =========================================================================
  describe("Group 3: Community Taxonomy & Moderation Categories", () => {
    it("3.1 Supports all 10 required academic and technical group categories", () => {
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Programming");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Web Development");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("AI and Machine Learning");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Competitive Programming");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Engineering");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Academics");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Business and Finance");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Project Collaboration");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("Placement Preparation");
      expect(COMMUNITY_GROUP_CATEGORIES).toContain("General Discussion");
    });

    it("3.2 Supports standard moderation reporting reasons", () => {
      expect(REPORT_REASONS).toContain("spam");
      expect(REPORT_REASONS).toContain("harassment");
      expect(REPORT_REASONS).toContain("inappropriate_content");
      expect(REPORT_REASONS).toContain("hate_speech");
      expect(REPORT_REASONS).toContain("academic_dishonesty");
      expect(REPORT_REASONS).toContain("other");
    });
  });

  // =========================================================================
  // 4. COMMUNITY GROUP SERVICE OPERATIONS
  // =========================================================================
  describe("Group 4: Community Group Operations & Membership Integrity", () => {
    it("4.1 ensureGlobalCommunity creates or returns the platform Global Community", async () => {
      const mockGlobalDoc = {
        _id: new mongoose.Types.ObjectId(),
        name: "Smart Skill Hub — Global Community",
        isGlobal: true,
        visibility: "public",
        memberCount: 42,
      };

      vi.spyOn(CommunityGroup, "findOne").mockResolvedValue(mockGlobalDoc);

      const globalGroup = await communityGroupService.ensureGlobalCommunity();
      expect(globalGroup.name).toBe("Smart Skill Hub — Global Community");
      expect(globalGroup.isGlobal).toBe(true);
      expect(globalGroup.visibility).toBe("public");
    });

    it("4.2 createGroup creates public groups and assigns creator as owner", async () => {
      const mockCreatedGroup = {
        _id: new mongoose.Types.ObjectId(),
        name: "Full Stack Innovators",
        slug: "full-stack-innovators-abc123",
        category: "Web Development",
        visibility: "public",
        owner: studentA._id,
        memberCount: 1,
        toObject: () => ({
          _id: new mongoose.Types.ObjectId(),
          name: "Full Stack Innovators",
          slug: "full-stack-innovators-abc123",
          category: "Web Development",
          visibility: "public",
          owner: studentA._id,
        }),
      };

      vi.spyOn(CommunityGroup, "create").mockResolvedValue(mockCreatedGroup);
      vi.spyOn(CommunityMembership, "create").mockResolvedValue({
        group: mockCreatedGroup._id,
        user: studentA._id,
        role: "owner",
        status: "active",
      });

      const group = await communityGroupService.createGroup(studentA, {
        name: "Full Stack Innovators",
        description: "Building modern scalable applications.",
        category: "Web Development",
        visibility: "public",
      });

      expect(group.name).toBe("Full Stack Innovators");
      expect(group.membership.role).toBe("owner");
      expect(group.membership.isMember).toBe(true);
      expect(group.passwordHash).toBeUndefined();
    });

    it("4.3 createGroup creates private password-protected groups without leaking password hash", async () => {
      const rawPassword = "GroupPassword2026!";
      const hash = hashGroupPassword(rawPassword);

      const mockPrivateGroup = {
        _id: new mongoose.Types.ObjectId(),
        name: "Algorithmic Research Lab",
        category: "Programming",
        visibility: "private",
        isPasswordProtected: true,
        passwordHash: hash,
        toObject: () => ({
          _id: new mongoose.Types.ObjectId(),
          name: "Algorithmic Research Lab",
          category: "Programming",
          visibility: "private",
          isPasswordProtected: true,
          passwordHash: hash,
        }),
      };

      vi.spyOn(CommunityGroup, "create").mockResolvedValue(mockPrivateGroup);
      vi.spyOn(CommunityMembership, "create").mockResolvedValue({
        role: "owner",
        status: "active",
      });

      const group = await communityGroupService.createGroup(studentA, {
        name: "Algorithmic Research Lab",
        category: "Programming",
        visibility: "private",
        password: rawPassword,
      });

      expect(group.visibility).toBe("private");
      expect(group.isPasswordProtected).toBe(true);
      expect(group.passwordHash).toBeUndefined(); // Never returned
    });

    it("4.4 joinGroup rejects incorrect private group passwords and admits correct ones", async () => {
      const password = "TargetPassword123";
      const hash = hashGroupPassword(password);
      const groupId = new mongoose.Types.ObjectId();

      const mockGroupWithPass = {
        _id: groupId,
        name: "Private CAD Squad",
        visibility: "private",
        isPasswordProtected: true,
        passwordHash: hash,
      };

      vi.spyOn(CommunityGroup, "findById").mockReturnValue({
        select: vi.fn().mockResolvedValue(mockGroupWithPass),
      });

      vi.spyOn(CommunityMembership, "findOne").mockResolvedValue(null);
      vi.spyOn(CommunityMembership, "create").mockResolvedValue({
        group: groupId,
        user: studentB._id,
        role: "member",
        status: "active",
      });
      vi.spyOn(CommunityGroup, "findByIdAndUpdate").mockResolvedValue({});

      // 1. Missing password
      await expect(
        communityGroupService.joinGroup(groupId.toString(), studentB, { password: null })
      ).rejects.toThrow(/Password required/i);

      // 2. Incorrect password
      await expect(
        communityGroupService.joinGroup(groupId.toString(), studentB, { password: "WrongPass" })
      ).rejects.toThrow(/Incorrect group password/i);

      // 3. Correct password
      const joinResult = await communityGroupService.joinGroup(groupId.toString(), studentB, {
        password: "TargetPassword123",
      });

      expect(joinResult.alreadyMember).toBe(false);
      expect(joinResult.membership.role).toBe("member");
    });

    it("4.5 joinGroup is idempotent and prevents duplicate memberships", async () => {
      const groupId = new mongoose.Types.ObjectId();
      const existingMembership = {
        _id: new mongoose.Types.ObjectId(),
        group: groupId,
        user: studentA._id,
        status: "active",
        role: "owner",
      };

      vi.spyOn(CommunityGroup, "findById").mockReturnValue({
        select: vi.fn().mockResolvedValue({ _id: groupId, visibility: "public" }),
      });
      vi.spyOn(CommunityMembership, "findOne").mockResolvedValue(existingMembership);

      const res = await communityGroupService.joinGroup(groupId.toString(), studentA);
      expect(res.alreadyMember).toBe(true);
      expect(res.message).toContain("already a member");
    });

    it("4.6 leaveGroup prevents group owner from leaving without transferring ownership", async () => {
      const groupId = new mongoose.Types.ObjectId();
      vi.spyOn(CommunityGroup, "findById").mockResolvedValue({
        _id: groupId,
        isGlobal: false,
      });

      vi.spyOn(CommunityMembership, "findOne").mockResolvedValue({
        group: groupId,
        user: studentA._id,
        role: "owner",
        status: "active",
      });

      await expect(
        communityGroupService.leaveGroup(groupId.toString(), studentA)
      ).rejects.toThrow(/Group owner cannot leave/i);
    });

    it("4.7 manageMember enforces owner-only permissions for moderator assignment and transfer", async () => {
      const groupId = new mongoose.Types.ObjectId();
      const groupDoc = {
        _id: groupId,
        owner: studentA._id,
        moderators: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(CommunityGroup, "findById").mockResolvedValue(groupDoc);

      // Student B is regular member attempting to assign moderator -> rejects 403
      vi.spyOn(CommunityMembership, "findOne")
        .mockResolvedValueOnce({ group: groupId, user: studentB._id, role: "member", status: "active" });

      await expect(
        communityGroupService.manageMember(
          groupId.toString(),
          studentB,
          studentA._id.toString(),
          "assign_moderator"
        )
      ).rejects.toThrow(/do not have permission/i);

      // Student A (owner) assigns Student B as moderator -> success
      const callerOwnerMembership = {
        group: groupId,
        user: studentA._id,
        role: "owner",
        status: "active",
        save: vi.fn().mockResolvedValue(true),
      };

      const targetMembership = {
        group: groupId,
        user: studentB._id,
        role: "member",
        status: "active",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(CommunityMembership, "findOne")
        .mockResolvedValueOnce(callerOwnerMembership)
        .mockResolvedValueOnce(targetMembership);
      vi.spyOn(CommunityGroup, "findByIdAndUpdate").mockResolvedValue({});

      const result = await communityGroupService.manageMember(
        groupId.toString(),
        studentA,
        studentB._id.toString(),
        "assign_moderator"
      );
      expect(result.success).toBe(true);
      expect(targetMembership.role).toBe("moderator");
    });
  });

  // =========================================================================
  // 5. COMMUNITY MESSAGE SERVICE & MODERATION
  // =========================================================================
  describe("Group 5: Community Message Lifecycle & Safety", () => {
    it("5.1 sendMessage validates non-empty sanitized content and persists message", async () => {
      const groupId = new mongoose.Types.ObjectId();
      const group = { _id: groupId, isGlobal: false, isArchived: false };

      vi.spyOn(CommunityGroup, "findById").mockResolvedValue(group);
      vi.spyOn(CommunityMembership, "findOne").mockResolvedValue({
        group: groupId,
        user: studentA._id,
        status: "active",
      });

      const mockSaved = {
        _id: new mongoose.Types.ObjectId(),
        group: groupId,
        sender: studentA,
        content: "What are the key differences between BFS and DFS?",
      };

      vi.spyOn(CommunityMessage, "create").mockResolvedValue(mockSaved);
      vi.spyOn(CommunityGroup, "findByIdAndUpdate").mockResolvedValue({});
      vi.spyOn(CommunityMessage, "findById").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockSaved),
      });

      const message = await communityMessageService.sendMessage(groupId.toString(), studentA, {
        content: "What are the key differences between BFS and DFS?",
      });

      expect(message.content).toContain("BFS and DFS");
    });

    it("5.2 sendMessage rejects non-members from sending messages to non-global groups", async () => {
      const groupId = new mongoose.Types.ObjectId();
      vi.spyOn(CommunityGroup, "findById").mockResolvedValue({
        _id: groupId,
        isGlobal: false,
        isArchived: false,
      });

      vi.spyOn(CommunityMembership, "findOne").mockResolvedValue(null);

      await expect(
        communityMessageService.sendMessage(groupId.toString(), studentB, {
          content: "Unauthorized attempt",
        })
      ).rejects.toThrow(/You must be an active member/i);
    });

    it("5.3 getMessages rejects unauthorized access to private groups", async () => {
      const groupId = new mongoose.Types.ObjectId();
      vi.spyOn(CommunityGroup, "findById").mockResolvedValue({
        _id: groupId,
        visibility: "private",
      });

      vi.spyOn(CommunityMembership, "findOne").mockResolvedValue(null);

      await expect(
        communityMessageService.getMessages(groupId.toString(), studentB)
      ).rejects.toThrow(/Access denied/i);
    });

    it("5.4 deleteMessage allows author or moderator to delete and soft-deletes content", async () => {
      const messageId = new mongoose.Types.ObjectId();
      const groupId = new mongoose.Types.ObjectId();

      const messageDoc = {
        _id: messageId,
        group: groupId,
        sender: studentA._id,
        isDeleted: false,
        content: "Mistake message",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(CommunityMessage, "findById").mockResolvedValue(messageDoc);

      const delResult = await communityMessageService.deleteMessage(
        messageId.toString(),
        studentA
      );

      expect(delResult.success).toBe(true);
      expect(messageDoc.isDeleted).toBe(true);
      expect(messageDoc.content).toContain("deleted");
    });

    it("5.5 reportMessage records legitimate reports and handles duplicates idempotently", async () => {
      const messageId = new mongoose.Types.ObjectId();
      const groupId = new mongoose.Types.ObjectId();

      vi.spyOn(CommunityMessage, "findById").mockResolvedValue({
        _id: messageId,
        group: groupId,
      });

      vi.spyOn(CommunityMessageReport, "findOne").mockResolvedValue(null);
      vi.spyOn(CommunityMessageReport, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        reason: "spam",
      });

      const reportRes = await communityMessageService.reportMessage(
        messageId.toString(),
        studentB,
        { reason: "spam", details: "Spam link observed" }
      );

      expect(reportRes.success).toBe(true);
      expect(reportRes.message).toContain("Report submitted");
    });

    it("5.6 blockUser prevents students from blocking themselves and records blocks", async () => {
      await expect(
        communityMessageService.blockUser(studentA, studentA._id.toString())
      ).rejects.toThrow(/cannot block yourself/i);

      vi.spyOn(CommunityBlock, "findOneAndUpdate").mockResolvedValue({});

      const blockRes = await communityMessageService.blockUser(
        studentA,
        studentB._id.toString(),
        "Harassment"
      );
      expect(blockRes.success).toBe(true);
    });
  });

  // =========================================================================
  // 6. STUDENT DIRECTORY & STRICT PRIVACY ISOLATION
  // =========================================================================
  describe("Group 6: Student Directory & Privacy Isolation", () => {
    it("6.1 getStudentDirectory strictly filters out private email, phone, and firebaseUid", async () => {
      vi.spyOn(UserSettings, "find").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      });

      vi.spyOn(User, "find").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([studentA, studentB]),
      });

      vi.spyOn(User, "countDocuments").mockResolvedValue(2);
      vi.spyOn(StudentProject, "aggregate").mockResolvedValue([]);
      vi.spyOn(CompetencyBadge, "aggregate").mockResolvedValue([]);

      const result = await studentDirectoryService.getStudentDirectory(studentA);
      expect(result.students.length).toBe(2);

      for (const student of result.students) {
        expect(student.email).toBeUndefined();
        expect(student.phone).toBeUndefined();
        expect(student.firebaseUid).toBeUndefined();
        expect(student.displayName).toBeDefined();
        expect(student.academic).toBeDefined();
        expect(Array.isArray(student.topSkills)).toBe(true);
      }
    });

    it("6.2 getStudentPublicProfile enforces privacy when student disables profile visibility", async () => {
      const privateUserId = new mongoose.Types.ObjectId();

      vi.spyOn(User, "findById").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue({ _id: privateUserId, displayName: "Incognito" }),
      });

      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          privacyPreferences: { allowProfileContext: false },
        }),
      });

      await expect(
        studentDirectoryService.getStudentPublicProfile(privateUserId.toString(), studentA)
      ).rejects.toThrow(/designated their profile as private/i);
    });
  });

  // =========================================================================
  // 7. PUBLIC PROJECT DISCOVERY & COLLABORATION HUB
  // =========================================================================
  describe("Group 7: Public Project Discovery & Collaboration Hub", () => {
    it("7.1 getPublicProjects lists collaborative projects across disciplines without leaking private ones", async () => {
      const mockProjects = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: "Autonomous Quadcopter Flight Controller",
          description: "ROS2 and PX4 autopilot integration for precision landing.",
          branchSlug: "mech",
          roleSlug: "robotics-engineer",
          status: "in_progress",
          openForCollaboration: true,
          neededRoles: ["Firmware Developer", "Control Systems Engineer"],
          neededSkills: ["C++", "ROS2", "PID Tuning"],
          deliverables: [],
          owner: studentB,
          updatedAt: new Date(),
        },
      ];

      vi.spyOn(StudentProject, "find").mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockProjects),
      });

      vi.spyOn(StudentProject, "countDocuments").mockResolvedValue(1);

      const result = await publicProjectDiscoveryService.getPublicProjects(studentA, {
        openForCollaboration: true,
      });

      expect(result.projects.length).toBe(1);
      const project = result.projects[0];
      expect(project.openForCollaboration).toBe(true);
      expect(project.neededRoles).toContain("Firmware Developer");
      expect(project.owner.displayName).toBe("Diya Patel");
    });

    it("7.2 updateProjectCollaboration updates needed roles and collaboration description for owner", async () => {
      const projectId = new mongoose.Types.ObjectId();
      const projectDoc = {
        _id: projectId,
        owner: studentA._id,
        isPublic: false,
        openForCollaboration: false,
        neededRoles: [],
        neededSkills: [],
        collaborationDescription: "",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);

      const updated = await publicProjectDiscoveryService.updateProjectCollaboration(
        projectId.toString(),
        studentA,
        {
          openForCollaboration: true,
          neededRoles: ["Frontend Designer", "DevOps Engineer"],
          neededSkills: ["TailwindCSS", "Kubernetes"],
          collaborationDescription: "Looking for teammates to scale our microservices.",
        }
      );

      expect(updated.openForCollaboration).toBe(true);
      expect(updated.isPublic).toBe(true);
      expect(updated.neededRoles).toContain("Frontend Designer");
      expect(updated.collaborationDescription).toContain("microservices");
    });

    it("7.3 updateProjectCollaboration rejects non-owner from altering collaboration settings", async () => {
      const projectId = new mongoose.Types.ObjectId();
      vi.spyOn(StudentProject, "findById").mockResolvedValue({
        _id: projectId,
        owner: studentA._id,
      });

      await expect(
        publicProjectDiscoveryService.updateProjectCollaboration(
          projectId.toString(),
          studentB, // Student B is not the owner
          { openForCollaboration: true }
        )
      ).rejects.toThrow(/Only the project owner can update/i);
    });
  });
});
