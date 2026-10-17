import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { app } from "../src/app.js";
import { User } from "../src/core/database/models/user.models.js";
import { AcademicDegree } from "../src/core/database/models/academicDegree.models.js";
import { AcademicBranch } from "../src/core/database/models/academicBranch.models.js";
import { CareerRole } from "../src/core/database/models/careerRole.models.js";
import { BranchCareerMapping } from "../src/core/database/models/branchCareerMapping.models.js";
import {
  listAdminUsers,
  getAdminUserDetails,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../src/modules/admin/services/adminUser.service.js";
import {
  checkCatalogIntegrity,
  safeDeleteDegree,
  safeDeleteBranch,
  safeDeleteCareerRole,
} from "../src/modules/admin/services/adminCatalog.service.js";

describe("Admin Management, Security & Catalog Governance Suite", () => {
  const adminId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const mockAdminUser = {
    _id: adminId,
    email: "admin@test.com",
    role: "admin",
    displayName: "Lead Admin",
  };
  const mockStudentUser = {
    _id: studentId,
    email: "student@test.com",
    role: "student",
    displayName: "Jane Student",
  };

  // =========================================================================
  // 1. Authorization & Non-Admin Access Denial Tests
  // =========================================================================
  describe("1. Server-Side Administrative Authorization Enforcement", () => {
    it("rejects unauthenticated requests to GET /api/v1/admin/users with 401", async () => {
      const res = await request(app).get("/api/v1/admin/users");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to GET /api/v1/admin/catalog/integrity with 401", async () => {
      const res = await request(app).get("/api/v1/admin/catalog/integrity");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("rejects unauthenticated requests to PATCH /api/v1/admin/users/:userId/role with 401", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${studentId}/role`)
        .send({ role: "admin" });
      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // 2. User Management Service Tests (Pagination, Search, Filtering)
  // =========================================================================
  describe("2. Admin User Listing, Search & Filtering Service", () => {
    it("applies bounded pagination with default page 1 and limit 20", async () => {
      vi.spyOn(User, "countDocuments").mockResolvedValue(45);
      const mockFind = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([mockStudentUser]),
      };
      vi.spyOn(User, "find").mockReturnValue(mockFind);

      const result = await listAdminUsers({ page: "1", limit: "20" });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(45);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.users).toHaveLength(1);
    });

    it("clamps limit between 1 and 50 to prevent unbounded memory consumption", async () => {
      vi.spyOn(User, "countDocuments").mockResolvedValue(100);
      const mockFind = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(User, "find").mockReturnValue(mockFind);

      const result = await listAdminUsers({ limit: "5000" });
      expect(result.pagination.limit).toBe(50);
    });

    it("builds multi-field search conditions for query string", async () => {
      let capturedFilter = null;
      vi.spyOn(User, "countDocuments").mockImplementation(async (filter) => {
        capturedFilter = filter;
        return 1;
      });
      const mockFind = {
        select: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(User, "find").mockReturnValue(mockFind);

      await listAdminUsers({ search: "alice" });

      expect(capturedFilter).toBeDefined();
      expect(capturedFilter.$or).toBeDefined();
      expect(capturedFilter.$or.length).toBe(4);
    });
  });

  // =========================================================================
  // 3. User Details & Privilege Protection Tests
  // =========================================================================
  describe("3. User Details & Privilege Safety Guards", () => {
    it("throws 400 for malformed user ID", async () => {
      await expect(getAdminUserDetails("invalid-id-xyz")).rejects.toThrow(
        "Invalid user identifier format."
      );
    });

    it("throws 404 when user is not found", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        select: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(getAdminUserDetails(new mongoose.Types.ObjectId().toString())).rejects.toThrow(
        "User not found."
      );
    });

    it("prevents administrators from altering their own role (self-demotion protection)", async () => {
      await expect(
        updateAdminUserRole(adminId, adminId, "student")
      ).rejects.toThrow("Administrators cannot alter their own role.");
    });

    it("rejects unsupported roles", async () => {
      await expect(
        updateAdminUserRole(adminId, studentId, "superadmin")
      ).rejects.toThrow('Invalid role. Supported roles are "student" and "admin".');
    });

    it("protects primary system administrator account from modification", async () => {
      const primaryAdminEmail = process.env.ADMIN_EMAIL || "sampatakumarsv@gmail.com";
      const primaryAdminUser = {
        _id: new mongoose.Types.ObjectId(),
        email: primaryAdminEmail,
        role: "admin",
        save: vi.fn(),
      };

      vi.spyOn(User, "findById").mockResolvedValue(primaryAdminUser);

      await expect(
        updateAdminUserRole(adminId, primaryAdminUser._id, "student")
      ).rejects.toThrow("The primary system administrator account cannot be modified.");
    });

    it("allows valid role upgrade from student to admin", async () => {
      const targetUser = {
        _id: studentId,
        email: "student@test.com",
        role: "student",
        displayName: "Jane Student",
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(User, "findById").mockResolvedValue(targetUser);

      const result = await updateAdminUserRole(adminId, studentId, "admin");
      expect(result.role).toBe("admin");
      expect(targetUser.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. Catalog Governance & Referencing Integrity
  // =========================================================================
  describe("4. Academic & Career Catalog Governance", () => {
    it("reports catalog integrity status and flags orphan references", async () => {
      vi.spyOn(AcademicDegree, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ slug: "btech", name: "B.Tech" }]),
      });
      vi.spyOn(AcademicBranch, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { slug: "cse", name: "Computer Science", degreeSlugs: ["btech", "non-existent-degree"] },
        ]),
      });
      vi.spyOn(CareerRole, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { slug: "full-stack-developer", title: "Full Stack Developer", category: "Software" },
          { slug: "novelty-role", title: "Quantum Teleporter", category: "Experimental" },
        ]),
      });
      vi.spyOn(BranchCareerMapping, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { branchSlug: "cse", roleSlug: "full-stack-developer" },
          { branchSlug: "unknown-branch", roleSlug: "full-stack-developer" },
        ]),
      });

      const report = await checkCatalogIntegrity();

      expect(report.status).toBe("attention_needed");
      expect(report.orphanDegreeReferences.length).toBe(1);
      expect(report.orphanDegreeReferences[0].invalidDegreeSlugs).toContain("non-existent-degree");
      expect(report.invalidMappings.length).toBe(1);
      expect(report.pendingBenchmarkRoles.some((r) => r.slug === "novelty-role")).toBe(true);
    });

    it("safely deactivates degree instead of deleting when active references exist", async () => {
      vi.spyOn(AcademicBranch, "countDocuments").mockResolvedValue(3);
      vi.spyOn(User, "countDocuments").mockResolvedValue(12);
      const updateSpy = vi.spyOn(AcademicDegree, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const result = await safeDeleteDegree("btech");

      expect(result.action).toBe("deactivated");
      expect(result.referencedBranchesCount).toBe(3);
      expect(result.referencedUsersCount).toBe(12);
      expect(updateSpy).toHaveBeenCalledWith({ slug: "btech" }, { $set: { isActive: false } });
    });

    it("hard-deletes degree when zero active references exist", async () => {
      vi.spyOn(AcademicBranch, "countDocuments").mockResolvedValue(0);
      vi.spyOn(User, "countDocuments").mockResolvedValue(0);
      const deleteSpy = vi.spyOn(AcademicDegree, "deleteOne").mockResolvedValue({ deletedCount: 1 });

      const result = await safeDeleteDegree("unused-degree");

      expect(result.action).toBe("deleted");
      expect(deleteSpy).toHaveBeenCalledWith({ slug: "unused-degree" });
    });

    it("safely deactivates career role when referenced by active students", async () => {
      vi.spyOn(CareerRole, "findOne").mockResolvedValue({
        slug: "frontend-developer",
        title: "Frontend Developer",
      });
      vi.spyOn(User, "countDocuments").mockResolvedValue(5);
      vi.spyOn(BranchCareerMapping, "countDocuments").mockResolvedValue(2);
      const updateSpy = vi.spyOn(CareerRole, "updateOne").mockResolvedValue({ modifiedCount: 1 });

      const result = await safeDeleteCareerRole("frontend-developer");

      expect(result.action).toBe("deactivated");
      expect(result.referencedUsersCount).toBe(10); // 5 from targetRole + 5 from targetRoles
      expect(updateSpy).toHaveBeenCalledWith(
        { slug: "frontend-developer" },
        { $set: { isActive: false } }
      );
    });

    it("hard-deletes career role when zero student targets exist", async () => {
      vi.spyOn(CareerRole, "findOne").mockResolvedValue({
        slug: "unused-role",
        title: "Unused Role",
      });
      vi.spyOn(User, "countDocuments").mockResolvedValue(0);
      vi.spyOn(BranchCareerMapping, "countDocuments").mockResolvedValue(0);
      const deleteRoleSpy = vi.spyOn(CareerRole, "deleteOne").mockResolvedValue({ deletedCount: 1 });
      const deleteMappingSpy = vi.spyOn(BranchCareerMapping, "deleteMany").mockResolvedValue({ deletedCount: 0 });

      const result = await safeDeleteCareerRole("unused-role");

      expect(result.action).toBe("deleted");
      expect(deleteRoleSpy).toHaveBeenCalledWith({ slug: "unused-role" });
      expect(deleteMappingSpy).toHaveBeenCalledWith({ roleSlug: "unused-role" });
    });
  });
});
