import mongoose from "mongoose";
import { User } from "../../../core/database/models/user.models.js";
import { Project } from "../../../models/project.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "sampatakumarsv@gmail.com";

/**
 * List users with bounded pagination, multi-field search, and attribute filters.
 */
export async function listAdminUsers(options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(options.limit, 10) || 20), 50);
  const search = typeof options.search === "string" ? options.search.trim() : "";
  const role = options.role ? String(options.role).trim().toLowerCase() : "";
  const branch = options.branch ? String(options.branch).trim().toLowerCase() : "";
  const semester = options.semester ? parseInt(options.semester, 10) : null;
  const status = options.status ? String(options.status).trim().toLowerCase() : "";

  const filter = {};

  // Role filter
  if (role && (role === "student" || role === "admin")) {
    filter.role = role;
  }

  // Branch filter (matches slug or branch name)
  if (branch) {
    filter.$or = [
      { "academic.branchSlug": branch },
      { "academic.branchName": { $regex: branch, $options: "i" } },
    ];
  }

  // Semester filter
  if (semester && semester >= 1 && semester <= 12) {
    filter["academic.currentSemester"] = semester;
  }

  // Status filter (onboarded vs pending, or verified)
  if (status === "onboarded") {
    filter.onboardingCompletedAt = { $ne: null };
  } else if (status === "pending_onboarding") {
    filter.onboardingCompletedAt = null;
  } else if (status === "verified") {
    filter.emailVerified = true;
  } else if (status === "unverified") {
    filter.emailVerified = false;
  }

  // Text search on name, email, headline, institution
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const searchConditions = [
      { displayName: regex },
      { email: regex },
      { headline: regex },
      { "academic.institution": regex },
    ];

    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchConditions }];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select(
        "displayName email role emailVerified photoURL headline academic targetRole targetRoles onboardingCompletedAt createdAt lastLoginAt"
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
    },
  };
}

/**
 * Retrieve comprehensive details for a single user without exposing secrets.
 */
export async function getAdminUserDetails(userId) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user identifier format.");
  }

  const user = await User.findById(userId)
    .select(
      "-firebaseUid -__v"
    )
    .lean();

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Fetch associated activity counts in parallel
  const [projectsCount, submissionsCount, skillProfile] = await Promise.all([
    Project.countDocuments({ owner: userId }).catch(() => 0),
    CodingSubmission.countDocuments({ owner: userId }).catch(() => 0),
    SkillProfile.findOne({ owner: userId })
      .select("overallReadinessScore empiricalMastery testedSkillsCount skills")
      .lean()
      .catch(() => null),
  ]);

  return {
    user,
    stats: {
      projectsCount,
      submissionsCount,
      skillsEvaluated: skillProfile?.skills?.length || 0,
      readinessScore: skillProfile?.overallReadinessScore ?? null,
      empiricalMastery: skillProfile?.empiricalMastery ?? null,
    },
  };
}

/**
 * Update a user's role with privilege escalation and self-demotion guards.
 */
export async function updateAdminUserRole(adminUserId, targetUserId, newRole) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, "Invalid target user identifier.");
  }

  const sanitizedRole = String(newRole || "").trim().toLowerCase();
  if (sanitizedRole !== "student" && sanitizedRole !== "admin") {
    throw new ApiError(400, 'Invalid role. Supported roles are "student" and "admin".');
  }

  // Prevent self-demotion or self-modification
  if (adminUserId && adminUserId.toString() === targetUserId.toString()) {
    throw new ApiError(400, "Administrators cannot alter their own role. Another administrator must make this change.");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found.");
  }

  // Protect the primary configured system admin account from being modified
  if (targetUser.email && targetUser.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    throw new ApiError(403, "The primary system administrator account cannot be modified.");
  }

  targetUser.role = sanitizedRole;
  await targetUser.save();

  return {
    _id: targetUser._id,
    email: targetUser.email,
    displayName: targetUser.displayName,
    role: targetUser.role,
  };
}

/**
 * Safely update user status flags (e.g. emailVerified, onboardingCompletedAt).
 */
export async function updateAdminUserStatus(adminUserId, targetUserId, patch = {}) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, "Invalid target user identifier.");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new ApiError(404, "Target user not found.");
  }

  // Prevent tampering with system admin
  if (targetUser.email && targetUser.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
    throw new ApiError(403, "The primary system administrator account cannot be modified.");
  }

  if (typeof patch.emailVerified === "boolean") {
    targetUser.emailVerified = patch.emailVerified;
  }

  if (typeof patch.onboardingCompleted === "boolean") {
    targetUser.onboardingCompletedAt = patch.onboardingCompleted ? new Date() : null;
  }

  await targetUser.save();

  return {
    _id: targetUser._id,
    email: targetUser.email,
    emailVerified: targetUser.emailVerified,
    onboardingCompletedAt: targetUser.onboardingCompletedAt,
  };
}
