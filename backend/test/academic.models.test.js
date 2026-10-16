import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { AcademicDegree } from "../src/models/academicDegree.models.js";
import { AcademicBranch } from "../src/models/academicBranch.models.js";
import { CareerRole } from "../src/models/careerRole.models.js";
import { BranchCareerMapping } from "../src/models/branchCareerMapping.models.js";
import { User } from "../src/models/user.models.js";

describe("Phase 1: Academic Data-Model Foundation Suite", () => {
  describe("1. AcademicDegree Model", () => {
    it("instantiates an AcademicDegree with valid fields and defaults", () => {
      const degree = new AcademicDegree({
        slug: "btech",
        name: "Bachelor of Technology",
        shortName: "B.Tech",
        stream: "Engineering & Technology",
        durationYears: 4,
        totalSemesters: 8,
        description: "Four-year undergraduate engineering degree."
      });

      expect(degree.slug).toBe("btech");
      expect(degree.name).toBe("Bachelor of Technology");
      expect(degree.shortName).toBe("B.Tech");
      expect(degree.stream).toBe("Engineering & Technology");
      expect(degree.durationYears).toBe(4);
      expect(degree.totalSemesters).toBe(8);
      expect(degree.isActive).toBe(true);
      expect(degree.order).toBe(0);
    });

    it("fails validation when required fields are missing", () => {
      const invalidDegree = new AcademicDegree({});
      const err = invalidDegree.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.slug).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.shortName).toBeDefined();
    });

    it("rejects invalid stream values", () => {
      const invalidStreamDegree = new AcademicDegree({
        slug: "invalid-deg",
        name: "Invalid Program",
        shortName: "IP",
        stream: "NonExistentStream"
      });
      const err = invalidStreamDegree.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.stream).toBeDefined();
    });
  });

  describe("2. AcademicBranch Model", () => {
    it("instantiates an AcademicBranch with multi-degree associations and embedded specializations", () => {
      const branch = new AcademicBranch({
        slug: "cse",
        name: "Computer Science and Engineering",
        code: "CSE",
        stream: "Engineering & Technology",
        discipline: "Computer Science",
        degreeSlugs: ["btech", "be", "mtech"],
        aliases: ["cs", "comp sci"],
        specializations: [
          {
            slug: "ai-ml",
            name: "Artificial Intelligence & Machine Learning",
            description: "Advanced ML models and algorithms"
          },
          {
            slug: "cloud-devops",
            name: "Cloud & DevOps",
            description: "Scalable cloud infrastructure"
          }
        ]
      });

      expect(branch.slug).toBe("cse");
      expect(branch.name).toBe("Computer Science and Engineering");
      expect(branch.code).toBe("CSE");
      expect(branch.degreeSlugs).toContain("btech");
      expect(branch.degreeSlugs).toContain("be");
      expect(branch.degreeSlugs).toContain("mtech");
      expect(branch.aliases).toContain("cs");
      expect(branch.specializations).toHaveLength(2);
      expect(branch.specializations[0].slug).toBe("ai-ml");
      expect(branch.specializations[0].isActive).toBe(true);
      expect(branch.isActive).toBe(true);
    });

    it("validates required branch fields", () => {
      const invalidBranch = new AcademicBranch({});
      const err = invalidBranch.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.slug).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.code).toBeDefined();
      expect(err.errors.stream).toBeDefined();
    });
  });

  describe("3. CareerRole Model", () => {
    it("instantiates a CareerRole with category and skills", () => {
      const role = new CareerRole({
        slug: "vlsi-design-engineer",
        title: "VLSI Design Engineer",
        category: "Electronics & Electrical",
        categoryLabel: "Electronics & Hardware Systems",
        description: "Specializes in digital circuit and FPGA design.",
        experienceLevel: "Entry-Level",
        coreSkills: ["Verilog", "VHDL", "Digital Electronics"],
        prerequisiteSkills: ["C Programming", "Semiconductor Physics"]
      });

      expect(role.slug).toBe("vlsi-design-engineer");
      expect(role.title).toBe("VLSI Design Engineer");
      expect(role.category).toBe("Electronics & Electrical");
      expect(role.categoryLabel).toBe("Electronics & Hardware Systems");
      expect(role.coreSkills).toContain("Verilog");
      expect(role.prerequisiteSkills).toContain("C Programming");
      expect(role.isActive).toBe(true);
    });

    it("rejects unknown category values", () => {
      const invalidCategoryRole = new CareerRole({
        slug: "bad-role",
        title: "Bad Role",
        category: "Astronomy & Stargazing"
      });
      const err = invalidCategoryRole.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.category).toBeDefined();
    });
  });

  describe("4. BranchCareerMapping Model", () => {
    it("instantiates a BranchCareerMapping with relevance and relationship type", () => {
      const mapping = new BranchCareerMapping({
        branchSlug: "ece",
        roleSlug: "embedded-systems-engineer",
        relationshipType: "primary",
        relevanceScore: 95,
        recommendedPrerequisites: ["Microcontrollers", "Embedded C"]
      });

      expect(mapping.branchSlug).toBe("ece");
      expect(mapping.roleSlug).toBe("embedded-systems-engineer");
      expect(mapping.relationshipType).toBe("primary");
      expect(mapping.relevanceScore).toBe(95);
      expect(mapping.recommendedPrerequisites).toContain("Embedded C");
      expect(mapping.isActive).toBe(true);
    });

    it("enforces relationshipType enum values", () => {
      const invalidMapping = new BranchCareerMapping({
        branchSlug: "ece",
        roleSlug: "embedded-systems-engineer",
        relationshipType: "unsupported_type"
      });
      const err = invalidMapping.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.relationshipType).toBeDefined();
    });

    it("verifies compound index definition on branchSlug and roleSlug", () => {
      const indexes = BranchCareerMapping.schema.indexes();
      const compoundIndex = indexes.find(
        ([fields, options]) =>
          fields.branchSlug === 1 && fields.roleSlug === 1 && options?.unique === true
      );
      expect(compoundIndex).toBeDefined();
    });
  });

  describe("5. User Academic Model Extensions", () => {
    it("instantiates User with default targetRoles array aligned with targetRole", () => {
      const user = new User({
        firebaseUid: "user_test_fb_123",
        email: "student@example.com"
      });

      expect(user.targetRole).toBe("Full Stack Developer");
      expect(user.targetRoles).toEqual(["Full Stack Developer"]);
      expect(user.careerInterests).toEqual([]);
      expect(user.academic).toBeDefined();
      expect(user.academic.degreeSlug).toBe("");
      expect(user.academic.currentYear).toBeNull();
      expect(user.academic.currentSemester).toBeNull();
    });

    it("preserves academic data independently without altering educationEntries", () => {
      const user = new User({
        firebaseUid: "user_test_fb_456",
        email: "student2@example.com",
        academic: {
          degreeSlug: "btech",
          degreeName: "Bachelor of Technology",
          branchSlug: "mech",
          branchName: "Mechanical Engineering",
          currentYear: 2,
          currentSemester: 4,
          institution: "College of Engineering"
        },
        educationEntries: [
          {
            degree: "Diploma",
            specialization: "Automobile",
            college: "State Polytechnic",
            endDate: "2023",
            grade: "88%"
          }
        ]
      });

      expect(user.academic.degreeSlug).toBe("btech");
      expect(user.academic.branchName).toBe("Mechanical Engineering");
      expect(user.educationEntries).toHaveLength(1);
      expect(user.educationEntries[0].degree).toBe("Diploma");
      expect(user.educationEntries[0].specialization).toBe("Automobile");
    });
  });
});
