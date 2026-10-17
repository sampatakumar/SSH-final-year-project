import { AcademicDegree } from "../../../core/database/models/academicDegree.models.js";
import { AcademicBranch } from "../../../core/database/models/academicBranch.models.js";
import { CareerRole } from "../../../core/database/models/careerRole.models.js";
import { BranchCareerMapping } from "../../../core/database/models/branchCareerMapping.models.js";
import { User } from "../../../core/database/models/user.models.js";
import { ROLE_REQUIREMENTS } from "../../gaps/benchmarks/roleRequirements.js";
import { ApiError } from "../../../core/errors/ApiError.js";

/**
 * Scan academic catalog models for relationship integrity, orphan references, and benchmark readiness.
 */
export async function checkCatalogIntegrity() {
  const [degrees, branches, careerRoles, mappings] = await Promise.all([
    AcademicDegree.find().lean(),
    AcademicBranch.find().lean(),
    CareerRole.find().lean(),
    BranchCareerMapping.find().lean(),
  ]);

  const degreeSlugSet = new Set(degrees.map((d) => d.slug.toLowerCase()));
  const branchSlugSet = new Set(branches.map((b) => b.slug.toLowerCase()));
  const roleSlugSet = new Set(careerRoles.map((r) => r.slug.toLowerCase()));

  // 1. Check for branches referencing non-existent degree slugs
  const orphanDegreeReferences = [];
  for (const branch of branches) {
    const invalidSlugs = (branch.degreeSlugs || []).filter(
      (slug) => !degreeSlugSet.has(slug.toLowerCase())
    );
    if (invalidSlugs.length > 0) {
      orphanDegreeReferences.push({
        branchSlug: branch.slug,
        branchName: branch.name,
        invalidDegreeSlugs: invalidSlugs,
      });
    }
  }

  // 2. Check for mappings referencing non-existent branch or role slugs
  const invalidMappings = [];
  for (const mapping of mappings) {
    const isBranchValid = branchSlugSet.has(mapping.branchSlug.toLowerCase());
    const isRoleValid = roleSlugSet.has(mapping.roleSlug.toLowerCase());
    if (!isBranchValid || !isRoleValid) {
      invalidMappings.push({
        mappingId: mapping._id,
        branchSlug: mapping.branchSlug,
        roleSlug: mapping.roleSlug,
        branchExists: isBranchValid,
        roleExists: isRoleValid,
      });
    }
  }

  // 3. Check benchmark evaluation status for all career roles
  const validatedRoleNames = new Set(
    Object.values(ROLE_REQUIREMENTS).map((c) => c.roleName.toLowerCase())
  );

  const pendingBenchmarkRoles = [];
  const validatedBenchmarkRoles = [];

  for (const role of careerRoles) {
    const isBenchmarkValidated = validatedRoleNames.has(role.title.toLowerCase());
    if (isBenchmarkValidated) {
      validatedBenchmarkRoles.push({ slug: role.slug, title: role.title });
    } else {
      pendingBenchmarkRoles.push({
        slug: role.slug,
        title: role.title,
        category: role.category,
        coreSkillsCount: role.coreSkills?.length || 0,
      });
    }
  }

  // 4. Check for roles with zero branch mappings
  const mappedRoleSlugs = new Set(mappings.map((m) => m.roleSlug.toLowerCase()));
  const unmappedRoles = careerRoles
    .filter((r) => !mappedRoleSlugs.has(r.slug.toLowerCase()))
    .map((r) => ({ slug: r.slug, title: r.title, category: r.category }));

  const issuesCount =
    orphanDegreeReferences.length +
    invalidMappings.length +
    (unmappedRoles.length > 0 ? 1 : 0);

  return {
    status: issuesCount === 0 ? "healthy" : "attention_needed",
    issuesCount,
    totals: {
      degreesCount: degrees.length,
      branchesCount: branches.length,
      careerRolesCount: careerRoles.length,
      mappingsCount: mappings.length,
      validatedBenchmarksCount: validatedBenchmarkRoles.length,
      pendingBenchmarksCount: pendingBenchmarkRoles.length,
    },
    orphanDegreeReferences,
    invalidMappings,
    unmappedRoles,
    pendingBenchmarkRoles,
  };
}

/**
 * Safe deletion of a degree: prevents hard-deletion if referenced by branches or users.
 */
export async function safeDeleteDegree(slug) {
  if (!slug || typeof slug !== "string") {
    throw new ApiError(400, "Degree slug is required.");
  }
  const cleanSlug = slug.toLowerCase().trim();

  const [referencedBranchesCount, referencedUsersCount] = await Promise.all([
    AcademicBranch.countDocuments({ degreeSlugs: cleanSlug }),
    User.countDocuments({ "academic.degreeSlug": cleanSlug }),
  ]);

  if (referencedBranchesCount > 0 || referencedUsersCount > 0) {
    // Soft deactivate to maintain referential integrity
    await AcademicDegree.updateOne({ slug: cleanSlug }, { $set: { isActive: false } });
    return {
      success: true,
      action: "deactivated",
      message: `Degree "${cleanSlug}" is referenced by ${referencedBranchesCount} branch(es) and ${referencedUsersCount} student(s). Marked inactive to preserve historical records.`,
      referencedBranchesCount,
      referencedUsersCount,
    };
  }

  const result = await AcademicDegree.deleteOne({ slug: cleanSlug });
  return {
    success: true,
    action: "deleted",
    message: `Degree "${cleanSlug}" deleted successfully.`,
    deletedCount: result.deletedCount,
  };
}

/**
 * Safe deletion of a branch: prevents hard-deletion if referenced by students or mappings.
 */
export async function safeDeleteBranch(slug) {
  if (!slug || typeof slug !== "string") {
    throw new ApiError(400, "Branch slug is required.");
  }
  const cleanSlug = slug.toLowerCase().trim();

  const [referencedUsersCount, mappingsCount] = await Promise.all([
    User.countDocuments({ "academic.branchSlug": cleanSlug }),
    BranchCareerMapping.countDocuments({ branchSlug: cleanSlug }),
  ]);

  if (referencedUsersCount > 0 || mappingsCount > 0) {
    // Soft deactivate
    await AcademicBranch.updateOne({ slug: cleanSlug }, { $set: { isActive: false } });
    return {
      success: true,
      action: "deactivated",
      message: `Branch "${cleanSlug}" is referenced by ${referencedUsersCount} student(s) and ${mappingsCount} role mapping(s). Marked inactive to preserve historical profiles.`,
      referencedUsersCount,
      mappingsCount,
    };
  }

  const result = await AcademicBranch.deleteOne({ slug: cleanSlug });
  return {
    success: true,
    action: "deleted",
    message: `Branch "${cleanSlug}" deleted successfully.`,
    deletedCount: result.deletedCount,
  };
}

/**
 * Safe deletion of a career role: prevents deletion if selected as target role by active students.
 */
export async function safeDeleteCareerRole(slug) {
  if (!slug || typeof slug !== "string") {
    throw new ApiError(400, "Role slug is required.");
  }
  const cleanSlug = slug.toLowerCase().trim();
  const role = await CareerRole.findOne({ slug: cleanSlug });
  if (!role) {
    throw new ApiError(404, "Career role not found.");
  }

  const [referencedTargetRoleCount, referencedTargetRolesCount, mappingsCount] = await Promise.all([
    User.countDocuments({ targetRole: role.title }),
    User.countDocuments({ targetRoles: role.title }),
    BranchCareerMapping.countDocuments({ roleSlug: cleanSlug }),
  ]);

  const totalUserReferences = referencedTargetRoleCount + referencedTargetRolesCount;

  if (totalUserReferences > 0) {
    await CareerRole.updateOne({ slug: cleanSlug }, { $set: { isActive: false } });
    return {
      success: true,
      action: "deactivated",
      message: `Role "${role.title}" is selected as career target by ${totalUserReferences} student(s). Marked inactive to protect learner goals.`,
      referencedUsersCount: totalUserReferences,
    };
  }

  // Delete role and associated branch mappings
  const [roleRes] = await Promise.all([
    CareerRole.deleteOne({ slug: cleanSlug }),
    BranchCareerMapping.deleteMany({ roleSlug: cleanSlug }),
  ]);

  return {
    success: true,
    action: "deleted",
    message: `Career role "${role.title}" and its ${mappingsCount} branch mapping(s) deleted successfully.`,
    deletedCount: roleRes.deletedCount,
  };
}
