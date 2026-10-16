import mongoose from "mongoose";
import { AcademicDegree } from "../../../models/academicDegree.models.js";
import { AcademicBranch } from "../../../models/academicBranch.models.js";
import { CareerRole } from "../../../models/careerRole.models.js";
import { BranchCareerMapping } from "../../../models/branchCareerMapping.models.js";
import {
  INITIAL_ACADEMIC_DEGREES,
  INITIAL_ACADEMIC_BRANCHES,
  INITIAL_CAREER_ROLES,
  INITIAL_BRANCH_ROLE_MAPPINGS,
} from "../constants/academicCatalog.js";

export class AcademicCatalogService {
  isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  }

  /**
   * Idempotently seeds degrees, branches, career roles, and branch-role mappings.
   * Uses upsert operations matching by unique slug / compound keys to avoid duplicate records.
   */
  async seedCatalog() {
    if (!this.isDbConnected()) {
      return {
        success: true,
        stats: {
          degrees: INITIAL_ACADEMIC_DEGREES.length,
          branches: INITIAL_ACADEMIC_BRANCHES.length,
          careerRoles: INITIAL_CAREER_ROLES.length,
          mappings: INITIAL_BRANCH_ROLE_MAPPINGS.length,
        },
      };
    }

    let degreesUpserted = 0;
    let branchesUpserted = 0;
    let rolesUpserted = 0;
    let mappingsUpserted = 0;

    // 1. Seed Degrees
    if (INITIAL_ACADEMIC_DEGREES.length > 0) {
      const degreeOps = INITIAL_ACADEMIC_DEGREES.map((deg) => ({
        updateOne: {
          filter: { slug: deg.slug },
          update: {
            $setOnInsert: {
              slug: deg.slug,
            },
            $set: {
              name: deg.name,
              shortName: deg.shortName,
              stream: deg.stream,
              durationYears: deg.durationYears,
              totalSemesters: deg.totalSemesters,
              description: deg.description,
              order: deg.order,
              isActive: true,
            },
          },
          upsert: true,
        },
      }));
      const res = await AcademicDegree.bulkWrite(degreeOps);
      degreesUpserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    // 2. Seed Branches
    if (INITIAL_ACADEMIC_BRANCHES.length > 0) {
      const branchOps = INITIAL_ACADEMIC_BRANCHES.map((b) => ({
        updateOne: {
          filter: { slug: b.slug },
          update: {
            $setOnInsert: {
              slug: b.slug,
            },
            $set: {
              name: b.name,
              code: b.code,
              discipline: b.discipline,
              degreeSlugs: b.degreeSlugs,
              specializations: b.specializations || [],
              aliases: b.aliases || [],
              description: b.description,
              order: b.order,
              isActive: true,
            },
          },
          upsert: true,
        },
      }));
      const res = await AcademicBranch.bulkWrite(branchOps);
      branchesUpserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    // 3. Seed Career Roles
    if (INITIAL_CAREER_ROLES.length > 0) {
      const roleOps = INITIAL_CAREER_ROLES.map((r) => ({
        updateOne: {
          filter: { slug: r.slug },
          update: {
            $setOnInsert: {
              slug: r.slug,
            },
            $set: {
              title: r.title,
              category: r.category,
              categoryLabel: r.categoryLabel,
              description: r.description,
              experienceLevel: r.experienceLevel,
              coreSkills: r.coreSkills || [],
              prerequisiteSkills: r.prerequisiteSkills || [],
              order: r.order,
              isActive: true,
            },
          },
          upsert: true,
        },
      }));
      const res = await CareerRole.bulkWrite(roleOps);
      rolesUpserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    // 4. Seed Branch-to-Role Mappings
    if (INITIAL_BRANCH_ROLE_MAPPINGS.length > 0) {
      const mappingOps = INITIAL_BRANCH_ROLE_MAPPINGS.map((m) => ({
        updateOne: {
          filter: { branchSlug: m.branchSlug, roleSlug: m.roleSlug },
          update: {
            $setOnInsert: {
              branchSlug: m.branchSlug,
              roleSlug: m.roleSlug,
            },
            $set: {
              relationshipType: m.relationshipType || "primary",
              relevanceScore: m.relevanceScore || 80,
              isActive: true,
            },
          },
          upsert: true,
        },
      }));
      const res = await BranchCareerMapping.bulkWrite(mappingOps);
      mappingsUpserted = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    }

    return {
      success: true,
      stats: {
        degrees: degreesUpserted,
        branches: branchesUpserted,
        careerRoles: rolesUpserted,
        mappings: mappingsUpserted,
      },
    };
  }

  /**
   * List degrees optionally filtered by stream.
   */
  async getDegrees({ stream, activeOnly = true } = {}) {
    if (!this.isDbConnected()) {
      return INITIAL_ACADEMIC_DEGREES.filter((deg) => {
        if (stream && deg.stream !== stream) return false;
        return true;
      });
    }

    const filter = {};
    if (activeOnly) filter.isActive = true;
    if (stream) filter.stream = stream;

    const degrees = await AcademicDegree.find(filter).sort({ order: 1, name: 1 }).lean();
    return degrees.length > 0 ? degrees : INITIAL_ACADEMIC_DEGREES;
  }

  /**
   * List branches optionally filtered by degreeSlug, discipline, or stream.
   */
  async getBranches({ degreeSlug, discipline, stream, activeOnly = true } = {}) {
    if (!this.isDbConnected()) {
      return INITIAL_ACADEMIC_BRANCHES.filter((b) => {
        if (degreeSlug && (!b.degreeSlugs || !b.degreeSlugs.includes(degreeSlug.toLowerCase()))) return false;
        if (stream && b.stream !== stream) return false;
        if (discipline && b.stream !== discipline && b.discipline !== discipline) return false;
        return true;
      });
    }

    const filter = {};
    if (activeOnly) filter.isActive = true;
    if (stream) filter.stream = stream;
    if (discipline) filter.discipline = discipline;
    if (degreeSlug) filter.degreeSlugs = degreeSlug.toLowerCase();

    const branches = await AcademicBranch.find(filter).sort({ order: 1, name: 1 }).lean();
    return branches.length > 0 ? branches : INITIAL_ACADEMIC_BRANCHES;
  }

  /**
   * Get single branch by slug or alias.
   */
  async getBranchBySlug(slugOrAlias) {
    if (!slugOrAlias) return null;
    const clean = String(slugOrAlias).trim().toLowerCase();

    if (!this.isDbConnected()) {
      return (
        INITIAL_ACADEMIC_BRANCHES.find(
          (b) =>
            b.slug === clean ||
            (b.code && b.code.toLowerCase() === clean) ||
            (Array.isArray(b.aliases) && b.aliases.some((a) => a.toLowerCase() === clean))
        ) || null
      );
    }

    // 1. Direct slug match
    let branch = await AcademicBranch.findOne({ slug: clean, isActive: true }).lean();
    if (branch) return branch;

    // 2. Exact code match
    branch = await AcademicBranch.findOne({ code: clean.toUpperCase(), isActive: true }).lean();
    if (branch) return branch;

    // 3. Aliases match
    branch = await AcademicBranch.findOne({ aliases: clean, isActive: true }).lean();
    if (branch) return branch;

    // 4. In-memory fallback
    return (
      INITIAL_ACADEMIC_BRANCHES.find(
        (b) =>
          b.slug === clean ||
          (b.code && b.code.toLowerCase() === clean) ||
          (Array.isArray(b.aliases) && b.aliases.some((a) => a.toLowerCase() === clean))
      ) || null
    );
  }

  async findBranchBySlugOrAlias(slugOrAlias) {
    return this.getBranchBySlug(slugOrAlias);
  }

  /**
   * Normalizes a raw string into a known branch slug or returns null.
   */
  async resolveBranchByAlias(rawInput) {
    if (!rawInput || typeof rawInput !== "string") return null;
    const normalized = rawInput.trim().toLowerCase().replace(/[^\w\s-]/g, "");

    const branch = await this.getBranchBySlug(normalized);
    return branch ? branch.slug : null;
  }

  /**
   * List career roles optionally filtered by category.
   */
  async getCareerRoles({ category, activeOnly = true } = {}) {
    if (!this.isDbConnected()) {
      return INITIAL_CAREER_ROLES.filter((r) => {
        if (category && r.category !== category) return false;
        return true;
      });
    }

    const filter = {};
    if (activeOnly) filter.isActive = true;
    if (category) filter.category = category;

    const roles = await CareerRole.find(filter).sort({ order: 1, title: 1 }).lean();
    return roles.length > 0 ? roles : INITIAL_CAREER_ROLES;
  }

  /**
   * Get single career role by slug.
   */
  async getCareerRoleBySlug(slug) {
    if (!slug) return null;
    const clean = String(slug).trim().toLowerCase();

    if (!this.isDbConnected()) {
      return INITIAL_CAREER_ROLES.find((r) => r.slug === clean) || null;
    }

    const role = await CareerRole.findOne({ slug: clean, isActive: true }).lean();
    return role || INITIAL_CAREER_ROLES.find((r) => r.slug === clean) || null;
  }

  /**
   * Get career roles mapped to a branch with relationship metadata.
   */
  async getBranchRoles(branchSlug, { relationshipType, activeOnly = true } = {}) {
    if (!branchSlug) return [];
    const normalizedBranch = branchSlug.toLowerCase();

    if (!this.isDbConnected()) {
      const mappings = INITIAL_BRANCH_ROLE_MAPPINGS.filter(
        (m) =>
          m.branchSlug === normalizedBranch &&
          (!relationshipType || m.relationshipType === relationshipType)
      );

      const roleMap = new Map(INITIAL_CAREER_ROLES.map((r) => [r.slug, r]));
      return mappings
        .map((m) => {
          const role = roleMap.get(m.roleSlug);
          if (!role) return null;
          return {
            ...role,
            mapping: {
              relationshipType: m.relationshipType,
              relevanceScore: m.relevanceScore,
              notes: m.notes,
              recommendedPrerequisites: m.recommendedPrerequisites,
            },
          };
        })
        .filter(Boolean);
    }

    const mappingFilter = { branchSlug: normalizedBranch };
    if (activeOnly) mappingFilter.isActive = true;
    if (relationshipType) mappingFilter.relationshipType = relationshipType;

    const mappings = await BranchCareerMapping.find(mappingFilter)
      .sort({ relevanceScore: -1 })
      .lean();

    if (!mappings.length) {
      // Fall back to constants
      const constMappings = INITIAL_BRANCH_ROLE_MAPPINGS.filter(
        (m) =>
          m.branchSlug === normalizedBranch &&
          (!relationshipType || m.relationshipType === relationshipType)
      );
      const roleMap = new Map(INITIAL_CAREER_ROLES.map((r) => [r.slug, r]));
      return constMappings
        .map((m) => {
          const role = roleMap.get(m.roleSlug);
          if (!role) return null;
          return {
            ...role,
            mapping: {
              relationshipType: m.relationshipType,
              relevanceScore: m.relevanceScore,
              notes: m.notes,
              recommendedPrerequisites: m.recommendedPrerequisites,
            },
          };
        })
        .filter(Boolean);
    }

    const roleSlugs = mappings.map((m) => m.roleSlug);
    const roles = await CareerRole.find({
      slug: { $in: roleSlugs },
      ...(activeOnly ? { isActive: true } : {}),
    }).lean();

    const roleMap = new Map(roles.map((r) => [r.slug, r]));

    return mappings
      .map((m) => {
        const role = roleMap.get(m.roleSlug);
        if (!role) return null;
        return {
          ...role,
          mapping: {
            relationshipType: m.relationshipType,
            relevanceScore: m.relevanceScore,
            notes: m.notes,
            recommendedPrerequisites: m.recommendedPrerequisites,
          },
        };
      })
      .filter(Boolean);
  }

  /**
   * Comprehensive options bundle for frontend forms and selectors.
   * Returns degrees, branches, career roles, and streams in a single payload.
   */
  async getAcademicOptions() {
    if (!this.isDbConnected()) {
      return {
        degrees: INITIAL_ACADEMIC_DEGREES,
        branches: INITIAL_ACADEMIC_BRANCHES,
        careerRoles: INITIAL_CAREER_ROLES,
        streams: Array.from(new Set(INITIAL_ACADEMIC_DEGREES.map((d) => d.stream))).filter(Boolean),
        careerCategories: Array.from(new Set(INITIAL_CAREER_ROLES.map((r) => r.category))).filter(Boolean),
        curriculumSchemes: ["CBCS 2022", "CBCS 2018", "NEP 2020", "Autonomous 2023", "Other"],
        academicYears: [1, 2, 3, 4, 5],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      };
    }

    const degreeCount = await AcademicDegree.countDocuments();
    if (degreeCount === 0) {
      await this.seedCatalog();
    }

    const [degrees, branches, careerRoles] = await Promise.all([
      AcademicDegree.find({ isActive: true }).sort({ order: 1 }).lean(),
      AcademicBranch.find({ isActive: true }).sort({ order: 1 }).lean(),
      CareerRole.find({ isActive: true }).sort({ order: 1 }).lean(),
    ]);

    const activeDegrees = degrees.length > 0 ? degrees : INITIAL_ACADEMIC_DEGREES;
    const activeBranches = branches.length > 0 ? branches : INITIAL_ACADEMIC_BRANCHES;
    const activeRoles = careerRoles.length > 0 ? careerRoles : INITIAL_CAREER_ROLES;

    const streams = Array.from(new Set(activeDegrees.map((d) => d.stream))).filter(Boolean);
    const careerCategories = Array.from(new Set(activeRoles.map((r) => r.category))).filter(Boolean);

    return {
      degrees: activeDegrees,
      branches: activeBranches,
      careerRoles: activeRoles,
      streams,
      careerCategories,
      curriculumSchemes: ["CBCS 2022", "CBCS 2018", "NEP 2020", "Autonomous 2023", "Other"],
      academicYears: [1, 2, 3, 4, 5],
      semesters: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };
  }
}

export const academicCatalogService = new AcademicCatalogService();
