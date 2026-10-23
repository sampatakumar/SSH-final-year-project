import { academicCatalogService } from "../services/academicCatalog.service.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { AcademicDegree } from "../../../models/academicDegree.models.js";
import { AcademicBranch } from "../../../models/academicBranch.models.js";
import { CareerRole } from "../../../models/careerRole.models.js";
import { BranchCareerMapping } from "../../../models/branchCareerMapping.models.js";
import { z } from "zod";

export const getAcademicOptionsController = asyncHandler(async (_req, res) => {
  const options = await academicCatalogService.getAcademicOptions();
  return res.status(200).json(
    new ApiResponse(200, options, "Academic catalog options retrieved successfully")
  );
});

export const getDegreesController = asyncHandler(async (req, res) => {
  const { stream } = req.query;
  const degrees = await academicCatalogService.getDegrees({
    stream: typeof stream === "string" ? stream : undefined,
  });
  return res.status(200).json(
    new ApiResponse(200, { degrees }, "Academic degrees retrieved successfully")
  );
});

export const getBranchesController = asyncHandler(async (req, res) => {
  const { degreeSlug, stream } = req.query;
  const branches = await academicCatalogService.getBranches({
    degreeSlug: typeof degreeSlug === "string" ? degreeSlug : undefined,
    stream: typeof stream === "string" ? stream : undefined,
  });
  return res.status(200).json(
    new ApiResponse(200, { branches }, "Academic branches retrieved successfully")
  );
});

export const getBranchRolesController = asyncHandler(async (req, res) => {
  const { branchSlug } = req.params;
  const { relationshipType } = req.query;

  const roles = await academicCatalogService.getBranchRoles(branchSlug, {
    relationshipType: typeof relationshipType === "string" ? relationshipType : undefined,
  });

  return res.status(200).json(
    new ApiResponse(200, { branchSlug, roles }, "Branch career roles retrieved successfully")
  );
});

export const getBranchCapabilitiesController = asyncHandler(async (req, res) => {
  const { branchSlug } = req.params;
  const capabilities = academicCatalogService.getBranchCapabilities(branchSlug);
  return res.status(200).json(
    new ApiResponse(200, capabilities, `Capabilities for branch '${branchSlug}' retrieved successfully`)
  );
});

export const getCareerRolesController = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const roles = await academicCatalogService.getCareerRoles({
    category: typeof category === "string" ? category : undefined,
  });
  return res.status(200).json(
    new ApiResponse(200, { roles }, "Career roles retrieved successfully")
  );
});

export const getCareerRoleBySlugController = asyncHandler(async (req, res) => {
  const { roleSlug } = req.params;
  const role = await academicCatalogService.getCareerRoleBySlug(roleSlug);
  if (!role) {
    throw new ApiError(404, `Career role '${roleSlug}' not found`);
  }
  return res.status(200).json(
    new ApiResponse(200, { role }, "Career role details retrieved successfully")
  );
});

// Admin Controllers
export const seedAcademicCatalogController = asyncHandler(async (_req, res) => {
  const result = await academicCatalogService.seedCatalog();
  return res.status(200).json(
    new ApiResponse(200, result, "Academic catalog seeded idempotently")
  );
});

const upsertDegreeSchema = z.object({
  slug: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  shortName: z.string().min(1).max(50),
  stream: z.enum([
    "Engineering & Technology",
    "Computing & Science",
    "Commerce & Management",
    "Diploma & Polytechnic",
    "Other",
  ]),
  durationYears: z.number().int().min(1).max(10).optional().default(4),
  totalSemesters: z.number().int().min(1).max(20).optional().default(8),
  description: z.string().max(1000).optional().default(""),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export const upsertDegreeController = asyncHandler(async (req, res) => {
  const parsed = upsertDegreeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid degree payload", parsed.error.issues);
  }

  const degree = await AcademicDegree.findOneAndUpdate(
    { slug: parsed.data.slug.toLowerCase().trim() },
    { $set: parsed.data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, { degree }, "Degree saved successfully")
  );
});

const upsertBranchSchema = z.object({
  slug: z.string().min(2).max(50),
  name: z.string().min(2).max(200),
  code: z.string().min(1).max(20),
  degreeSlugs: z.array(z.string()).optional().default([]),
  stream: z.string().min(2).max(100),
  description: z.string().max(1000).optional().default(""),
  aliases: z.array(z.string()).optional().default([]),
  specializations: z
    .array(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional().default(""),
      })
    )
    .optional()
    .default([]),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export const upsertBranchController = asyncHandler(async (req, res) => {
  const parsed = upsertBranchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid branch payload", parsed.error.issues);
  }

  const branch = await AcademicBranch.findOneAndUpdate(
    { slug: parsed.data.slug.toLowerCase().trim() },
    { $set: parsed.data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, { branch }, "Branch saved successfully")
  );
});

const upsertCareerRoleSchema = z.object({
  slug: z.string().min(2).max(100),
  title: z.string().min(2).max(200),
  category: z.enum([
    "Software & Computing",
    "Electronics & Electrical",
    "Mechanical & Industrial",
    "Civil & Infrastructure",
    "Science & Biotechnology",
    "Commerce & Business",
    "Other",
  ]),
  description: z.string().max(2000).optional().default(""),
  experienceLevel: z
    .enum(["Entry-Level", "Mid-Level", "Senior", "All Levels"])
    .optional()
    .default("Entry-Level"),
  coreSkills: z.array(z.string()).optional().default([]),
  prerequisiteSkills: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export const upsertCareerRoleController = asyncHandler(async (req, res) => {
  const parsed = upsertCareerRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid career role payload", parsed.error.issues);
  }

  const role = await CareerRole.findOneAndUpdate(
    { slug: parsed.data.slug.toLowerCase().trim() },
    { $set: parsed.data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, { role }, "Career role saved successfully")
  );
});

const mapBranchRoleSchema = z.object({
  branchSlug: z.string().min(1),
  roleSlug: z.string().min(1),
  relationshipType: z.enum(["primary", "related", "interdisciplinary", "optional"]),
  relevanceScore: z.number().min(0).max(100).optional().default(80),
  notes: z.string().optional().default(""),
  recommendedPrerequisites: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const upsertBranchRoleMappingController = asyncHandler(async (req, res) => {
  const parsed = mapBranchRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "Invalid mapping payload", parsed.error.issues);
  }

  const mapping = await BranchCareerMapping.findOneAndUpdate(
    {
      branchSlug: parsed.data.branchSlug.toLowerCase().trim(),
      roleSlug: parsed.data.roleSlug.toLowerCase().trim(),
    },
    { $set: parsed.data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, { mapping }, "Branch-role mapping saved successfully")
  );
});
