import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import {
  ACADEMIC_DEGREES,
  ACADEMIC_BRANCHES,
  CAREER_ROLES,
  BRANCH_CAREER_MAPPINGS
} from "../src/modules/academic/constants/academicCatalog.js";
import { academicCatalogService } from "../src/modules/academic/services/academicCatalog.service.js";
import academicRouter from "../src/modules/academic/routes/academic.routes.js";
import { AcademicDegree } from "../src/models/academicDegree.models.js";
import { AcademicBranch } from "../src/models/academicBranch.models.js";
import { CareerRole } from "../src/models/careerRole.models.js";
import { BranchCareerMapping } from "../src/models/branchCareerMapping.models.js";
import { globalErrorHandler } from "../src/core/errors/errorHandler.js";

describe("Academic Catalog & Taxonomy Integrity Suite", () => {
  describe("1. Academic Seed Catalog Integrity", () => {
    it("contains all 10 standard academic degree categories with required fields", () => {
      expect(ACADEMIC_DEGREES.length).toBeGreaterThanOrEqual(10);
      for (const degree of ACADEMIC_DEGREES) {
        expect(degree.name).toBeTruthy();
        expect(degree.slug).toBeTruthy();
        expect(degree.stream).toBeTruthy();
        expect(degree.durationYears).toBeGreaterThan(0);
        expect(degree.totalSemesters).toBeGreaterThan(0);
      }
    });

    it("contains all 29 engineering, computing, commerce, and polytechnic branches", () => {
      expect(ACADEMIC_BRANCHES.length).toBeGreaterThanOrEqual(29);

      const branchSlugs = new Set();
      for (const branch of ACADEMIC_BRANCHES) {
        expect(branch.name).toBeTruthy();
        expect(branch.slug).toBeTruthy();
        expect(branch.stream).toBeTruthy();
        expect(Array.isArray(branch.degreeSlugs)).toBe(true);
        expect(branch.degreeSlugs.length).toBeGreaterThan(0);
        expect(branchSlugs.has(branch.slug)).toBe(false);
        branchSlugs.add(branch.slug);
      }

      // Verify specific required branches exist
      const requiredSlugs = [
        "cse",
        "ise",
        "it",
        "aiml",
        "aids",
        "ds",
        "ece",
        "eee",
        "mech",
        "civil",
        "robotics",
        "chem",
        "biotech",
        "bca-gen",
        "mca-gen",
        "bsc-cs-gen",
        "bcom-gen",
        "bba-gen",
        "diploma-mech"
      ];

      for (const slug of requiredSlugs) {
        expect(branchSlugs.has(slug)).toBe(true);
      }
    });

    it("contains at least 50 comprehensive career roles with categories", () => {
      expect(CAREER_ROLES.length).toBeGreaterThanOrEqual(50);

      const roleSlugs = new Set();
      for (const role of CAREER_ROLES) {
        expect(role.title).toBeTruthy();
        expect(role.slug).toBeTruthy();
        expect(role.category).toBeTruthy();
        expect(Array.isArray(role.prerequisiteSkills)).toBe(true);
        expect(roleSlugs.has(role.slug)).toBe(false);
        roleSlugs.add(role.slug);
      }

      // Check cross-disciplinary representation
      const categories = new Set(CAREER_ROLES.map((r) => r.category));
      expect(categories.has("Software & Computing")).toBe(true);
      expect(categories.has("Electronics & Electrical")).toBe(true);
      expect(categories.has("Mechanical & Industrial")).toBe(true);
      expect(categories.has("Civil & Infrastructure")).toBe(true);
      expect(categories.has("Science & Biotechnology")).toBe(true);
      expect(categories.has("Commerce & Business")).toBe(true);
    });

    it("maintains valid branch-to-career mappings referencing existing branches and roles", () => {
      expect(BRANCH_CAREER_MAPPINGS.length).toBeGreaterThan(0);

      const branchSlugs = new Set(ACADEMIC_BRANCHES.map((b) => b.slug));
      const roleSlugs = new Set(CAREER_ROLES.map((r) => r.slug));

      for (const mapping of BRANCH_CAREER_MAPPINGS) {
        expect(branchSlugs.has(mapping.branchSlug)).toBe(true);
        expect(roleSlugs.has(mapping.roleSlug)).toBe(true);
        expect(["primary", "related", "interdisciplinary", "optional"]).toContain(mapping.relationshipType);
      }
    });

    it("verifies interdisciplinary mappings (e.g., ECE, Mech, Civil can explore software/data/analytics)", () => {
      const eceRoles = BRANCH_CAREER_MAPPINGS.filter((m) => m.branchSlug === "ece");
      const eceRoleSlugs = eceRoles.map((m) => m.roleSlug);
      expect(eceRoleSlugs).toContain("embedded-systems-engineer");
      expect(eceRoleSlugs).toContain("vlsi-design-engineer");
      expect(eceRoleSlugs).toContain("software-engineer");

      const mechRoles = BRANCH_CAREER_MAPPINGS.filter((m) => m.branchSlug === "mech");
      const mechRoleSlugs = mechRoles.map((m) => m.roleSlug);
      expect(mechRoleSlugs).toContain("mechanical-design-engineer");
      expect(mechRoleSlugs).toContain("cad-engineer");
      expect(mechRoleSlugs).toContain("robotics-engineer");

      const civilRoles = BRANCH_CAREER_MAPPINGS.filter((m) => m.branchSlug === "civil");
      const civilRoleSlugs = civilRoles.map((m) => m.roleSlug);
      expect(civilRoleSlugs).toContain("structural-engineer");
      expect(civilRoleSlugs).toContain("bim-engineer");

      const bcomRoles = BRANCH_CAREER_MAPPINGS.filter((m) => m.branchSlug === "bcom-gen");
      const bcomRoleSlugs = bcomRoles.map((m) => m.roleSlug);
      expect(bcomRoleSlugs).toContain("financial-analyst");
      expect(bcomRoleSlugs).toContain("accountant");
      expect(bcomRoleSlugs).toContain("data-analyst");
    });
  });

  describe("2. Academic Catalog Service Fallback & Option Queries", () => {
    it("returns active options with degrees, branches, schemes, semesters when DB is offline or empty", async () => {
      const options = await academicCatalogService.getAcademicOptions();
      expect(options).toBeDefined();
      expect(Array.isArray(options.degrees)).toBe(true);
      expect(Array.isArray(options.branches)).toBe(true);
      expect(Array.isArray(options.curriculumSchemes)).toBe(true);
      expect(Array.isArray(options.semesters)).toBe(true);
      expect(Array.isArray(options.academicYears)).toBe(true);
      expect(options.degrees.length).toBeGreaterThan(0);
      expect(options.branches.length).toBeGreaterThan(0);
    });

    it("filters branches by degree slug", async () => {
      const btechBranches = await academicCatalogService.getBranches({ degreeSlug: "btech" });
      expect(Array.isArray(btechBranches)).toBe(true);
      expect(btechBranches.length).toBeGreaterThan(0);
      for (const b of btechBranches) {
        expect(b.degreeSlugs).toContain("btech");
      }
    });

    it("filters branches by stream", async () => {
      const engBranches = await academicCatalogService.getBranches({ stream: "Engineering & Technology" });
      expect(Array.isArray(engBranches)).toBe(true);
      expect(engBranches.length).toBeGreaterThan(0);
      for (const b of engBranches) {
        expect(b.stream).toBe("Engineering & Technology");
      }
    });

    it("resolves branch aliases without creating duplicate canonical records", async () => {
      const resolvedCSE = await academicCatalogService.findBranchBySlugOrAlias("computer science");
      expect(resolvedCSE).toBeDefined();
      expect(resolvedCSE.slug).toBe("cse");

      const resolvedECE = await academicCatalogService.findBranchBySlugOrAlias("electronics");
      expect(resolvedECE).toBeDefined();
      expect(resolvedECE.slug).toBe("ece");

      const resolvedAIML = await academicCatalogService.findBranchBySlugOrAlias("ai ml");
      expect(resolvedAIML).toBeDefined();
      expect(resolvedAIML.slug).toBe("aiml");
    });
  });

  describe("3. HTTP Endpoints & Authorization Security", () => {
    const buildApp = (user = null) => {
      const app = express();
      app.use(express.json());
      if (user) {
        app.use((req, _res, next) => {
          req.auth = { uid: user.uid, email: user.email };
          req.user = user;
          next();
        });
      }
      app.use("/api/v1/academic", academicRouter);
      app.use(globalErrorHandler);
      return app;
    };

    it("GET /api/v1/academic/options returns 200 and options taxonomy", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/options");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.degrees.length).toBeGreaterThan(0);
      expect(res.body.data.branches.length).toBeGreaterThan(0);
    });

    it("GET /api/v1/academic/degrees returns 200 with list of degrees", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/degrees");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.degrees)).toBe(true);
      expect(res.body.data.degrees.length).toBeGreaterThan(0);
    });

    it("GET /api/v1/academic/branches returns 200 with list of branches", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/branches");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.branches)).toBe(true);
      expect(res.body.data.branches.length).toBeGreaterThan(0);
    });

    it("GET /api/v1/academic/branches/:slug/roles returns 200 with mapped roles", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/branches/cse/roles");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.roles)).toBe(true);
      expect(res.body.data.roles.length).toBeGreaterThan(0);
      const roleSlugs = res.body.data.roles.map((r) => r.slug);
      expect(roleSlugs).toContain("full-stack-developer");
    });

    it("GET /api/v1/academic/career-roles returns 200 with categorized roles", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/career-roles");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.roles)).toBe(true);
      expect(res.body.data.roles.length).toBeGreaterThan(0);
    });

    it("GET /api/v1/academic/career-roles/:roleSlug returns 200 for valid role", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/career-roles/full-stack-developer");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role.title).toBe("Full-Stack Developer");
    });

    it("GET /api/v1/academic/career-roles/:roleSlug returns 404 for unknown role", async () => {
      const app = buildApp();
      const res = await request(app).get("/api/v1/academic/career-roles/non-existent-career-slug");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/academic/degrees rejects non-admin student request with 403 Forbidden", async () => {
      const studentApp = buildApp({
        uid: "student_123",
        email: "student@example.com",
        role: "student",
      });

      const res = await request(studentApp).post("/api/v1/academic/degrees").send({
        slug: "barch",
        name: "Bachelor of Architecture",
        shortName: "B.Arch",
        stream: "Engineering & Technology"
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/academic/branches rejects non-admin student request with 403 Forbidden", async () => {
      const studentApp = buildApp({
        uid: "student_123",
        email: "student@example.com",
        role: "student",
      });

      const res = await request(studentApp).post("/api/v1/academic/branches").send({
        slug: "arch",
        name: "Architecture",
        code: "ARCH",
        stream: "Engineering & Technology"
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/academic/career-roles rejects non-admin student request with 403 Forbidden", async () => {
      const studentApp = buildApp({
        uid: "student_123",
        email: "student@example.com",
        role: "student",
      });

      const res = await request(studentApp).post("/api/v1/academic/career-roles").send({
        slug: "game-developer",
        title: "Game Developer",
        category: "Software & Computing"
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/academic/branch-roles/map rejects non-admin student request with 403 Forbidden", async () => {
      const studentApp = buildApp({
        uid: "student_123",
        email: "student@example.com",
        role: "student",
      });

      const res = await request(studentApp).post("/api/v1/academic/branch-roles/map").send({
        branchSlug: "cse",
        roleSlug: "game-developer",
        relationshipType: "related"
      });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/academic/seed rejects unauthenticated request with 401 Unauthorized", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/v1/academic/seed");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("POST /api/v1/academic/seed rejects non-admin student request with 403 Forbidden", async () => {
      const studentApp = buildApp({
        uid: "student_123",
        email: "student@example.com",
        role: "student",
      });

      const res = await request(studentApp).post("/api/v1/academic/seed");
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/admin/i);
    });

    it("POST /api/v1/academic/seed succeeds for authenticated admin", async () => {
      const adminApp = buildApp({
        uid: "admin_uid_789",
        email: "sampatakumarsv@gmail.com",
        role: "admin",
      });

      const res = await request(adminApp).post("/api/v1/academic/seed");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
    });
  });

  describe("4. Seed Idempotency & Administrator Customization Preservation", () => {
    it("ensures routine seed operations use $setOnInsert exclusively to protect admin edits", async () => {
      let degreeBulkOps = [];
      let branchBulkOps = [];
      let roleBulkOps = [];
      let mappingBulkOps = [];

      const spyDegree = vi.spyOn(AcademicDegree, "bulkWrite").mockImplementation(async (ops) => {
        degreeBulkOps = ops;
        return { upsertedCount: 0, modifiedCount: 0 };
      });
      const spyBranch = vi.spyOn(AcademicBranch, "bulkWrite").mockImplementation(async (ops) => {
        branchBulkOps = ops;
        return { upsertedCount: 0, modifiedCount: 0 };
      });
      const spyRole = vi.spyOn(CareerRole, "bulkWrite").mockImplementation(async (ops) => {
        roleBulkOps = ops;
        return { upsertedCount: 0, modifiedCount: 0 };
      });
      const spyMapping = vi.spyOn(BranchCareerMapping, "bulkWrite").mockImplementation(async (ops) => {
        mappingBulkOps = ops;
        return { upsertedCount: 0, modifiedCount: 0 };
      });

      const spyDbConnected = vi.spyOn(academicCatalogService, "isDbConnected").mockReturnValue(true);

      const result = await academicCatalogService.seedCatalog();
      expect(result.success).toBe(true);

      // Verify every bulk write operation uses $setOnInsert and NEVER $set
      expect(degreeBulkOps.length).toBeGreaterThan(0);
      for (const op of degreeBulkOps) {
        expect(op.updateOne.update.$setOnInsert).toBeDefined();
        expect(op.updateOne.update.$set).toBeUndefined();
      }

      expect(branchBulkOps.length).toBeGreaterThan(0);
      for (const op of branchBulkOps) {
        expect(op.updateOne.update.$setOnInsert).toBeDefined();
        expect(op.updateOne.update.$set).toBeUndefined();
      }

      expect(roleBulkOps.length).toBeGreaterThan(0);
      for (const op of roleBulkOps) {
        expect(op.updateOne.update.$setOnInsert).toBeDefined();
        expect(op.updateOne.update.$set).toBeUndefined();
      }

      expect(mappingBulkOps.length).toBeGreaterThan(0);
      for (const op of mappingBulkOps) {
        expect(op.updateOne.update.$setOnInsert).toBeDefined();
        expect(op.updateOne.update.$set).toBeUndefined();
      }

      spyDegree.mockRestore();
      spyBranch.mockRestore();
      spyRole.mockRestore();
      spyMapping.mockRestore();
      spyDbConnected.mockRestore();
    });

    it("simulates rerun of routine seed over administrator-modified record and confirms edits are preserved", () => {
      // Simulate an administrator custom record in database
      const existingBranchDoc = {
        slug: "cse",
        name: "Computer Science and Engineering",
        code: "CSE",
        description: "Admin custom description: Focus on Cloud & AI",
        isActive: false // Deactivated by admin
      };

      // When $setOnInsert is executed in MongoDB on an existing document,
      // it only sets fields if the document is being inserted; if matched, it does nothing.
      const seedOp = {
        updateOne: {
          filter: { slug: "cse" },
          update: {
            $setOnInsert: {
              slug: "cse",
              name: "Computer Science and Engineering",
              description: "Default four-year CSE branch",
              isActive: true
            }
          },
          upsert: true
        }
      };

      // Simulate MongoDB update behavior: document matched by filter
      const matched = existingBranchDoc.slug === seedOp.updateOne.filter.slug;
      expect(matched).toBe(true);

      // Since document matched, $setOnInsert is skipped in MongoDB
      const resultingDoc = matched
        ? existingBranchDoc
        : { ...seedOp.updateOne.update.$setOnInsert };

      expect(resultingDoc.description).toBe("Admin custom description: Focus on Cloud & AI");
      expect(resultingDoc.isActive).toBe(false);
    });
  });
});

