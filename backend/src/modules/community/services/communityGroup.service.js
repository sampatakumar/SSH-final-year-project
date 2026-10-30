import mongoose from "mongoose";
import { CommunityGroup, COMMUNITY_GROUP_CATEGORIES } from "../models/communityGroup.models.js";
import { CommunityMembership } from "../models/communityMembership.models.js";
import { CommunityMessage } from "../models/communityMessage.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import {
  hashGroupPassword,
  verifyGroupPassword,
  checkGroupPasswordRateLimit,
  recordFailedGroupPasswordAttempt,
  clearGroupPasswordFailedAttempts,
} from "../utils/passwordSecurity.js";

const GLOBAL_GROUP_SLUG = "smart-skill-hub-global-community";

class CommunityGroupService {
  /**
   * Lazily ensures the platform-wide Global Community group exists.
   * @returns {Promise<object>} Global group document
   */
  async ensureGlobalCommunity() {
    let globalGroup = await CommunityGroup.findOne({
      $or: [{ isGlobal: true }, { slug: GLOBAL_GROUP_SLUG }],
    });

    if (!globalGroup) {
      globalGroup = await CommunityGroup.create({
        name: "Smart Skill Hub — Global Community",
        slug: GLOBAL_GROUP_SLUG,
        description:
          "Official campus-wide community for all Smart Skill Hub students across all academic branches and colleges.",
        category: "General Discussion",
        visibility: "public",
        isGlobal: true,
        isPasswordProtected: false,
        rules: [
          "Welcome students from all disciplines and colleges.",
          "Share project ideas, study techniques, and learning achievements.",
          "Maintain academic integrity, mutual respect, and professionalism.",
          "No spam, unsolicited advertisements, or harmful content.",
        ],
        memberCount: 1,
      });
    }

    return globalGroup;
  }

  /**
   * Auto-enrolls a user into the Global Community if they are not already a member.
   * @param {string|mongoose.Types.ObjectId} userId 
   * @returns {Promise<object>} Global membership document
   */
  async ensureGlobalMembership(userId) {
    const globalGroup = await this.ensureGlobalCommunity();
    const existing = await CommunityMembership.findOne({
      group: globalGroup._id,
      user: userId,
    });

    if (existing) {
      if (existing.status !== "active") {
        existing.status = "active";
        await existing.save();
      }
      return existing;
    }

    const membership = await CommunityMembership.create({
      group: globalGroup._id,
      user: userId,
      role: "member",
      status: "active",
    });

    await CommunityGroup.findByIdAndUpdate(globalGroup._id, {
      $inc: { memberCount: 1 },
      lastActivityAt: new Date(),
    });

    return membership;
  }

  /**
   * Creates a new public or private community group.
   * @param {object} user - Authenticated user
   * @param {object} groupData - Creation payload
   * @returns {Promise<object>} Created group
   */
  async createGroup(user, groupData) {
    const {
      name,
      description = "",
      category = "General Discussion",
      visibility = "public",
      password = null,
      rules = [],
      image = "",
    } = groupData;

    if (!name || name.trim().length < 2) {
      throw new ApiError(400, "Group name must be at least 2 characters long.");
    }

    if (name.trim().length > 100) {
      throw new ApiError(400, "Group name cannot exceed 100 characters.");
    }

    if (!COMMUNITY_GROUP_CATEGORIES.includes(category)) {
      throw new ApiError(
        400,
        `Invalid category. Allowed categories: ${COMMUNITY_GROUP_CATEGORIES.join(", ")}`
      );
    }

    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug || "group"}-${uniqueSuffix}`;

    const isPrivate = visibility === "private";
    let isPasswordProtected = false;
    let passwordHash = null;

    if (isPrivate && password) {
      if (typeof password !== "string" || password.length < 4) {
        throw new ApiError(
          400,
          "Private group password must be at least 4 characters."
        );
      }
      isPasswordProtected = true;
      passwordHash = hashGroupPassword(password);
    }

    const group = await CommunityGroup.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      category,
      visibility: isPrivate ? "private" : "public",
      isGlobal: false,
      isPasswordProtected,
      passwordHash,
      owner: user._id,
      moderators: [user._id],
      memberCount: 1,
      image: image.trim(),
      rules:
        rules.length > 0
          ? rules
          : [
              "Be respectful and supportive to all group members.",
              "Collaborate constructively on coursework and technical projects.",
            ],
      lastActivityAt: new Date(),
    });

    // Auto-create owner membership
    await CommunityMembership.create({
      group: group._id,
      user: user._id,
      role: "owner",
      status: "active",
    });

    // Strip password hash before returning
    const safeGroup = group.toObject();
    delete safeGroup.passwordHash;

    return {
      ...safeGroup,
      membership: { isMember: true, role: "owner" },
    };
  }

  /**
   * Lists community groups based on user access, categories, and search filters.
   * @param {object} user - Authenticated user
   * @param {object} query - Filter parameters
   * @returns {Promise<object>} Paginated group list
   */
  async listGroups(user, { category, search, tab = "all", page = 1, limit = 20 } = {}) {
    await this.ensureGlobalCommunity();

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Fetch user memberships to determine access to private groups
    const userMemberships = await CommunityMembership.find({
      user: user._id,
      status: "active",
    }).lean();

    const memberGroupIds = userMemberships.map((m) => m.group.toString());
    const memberRoleMap = new Map(
      userMemberships.map((m) => [m.group.toString(), m.role])
    );

    const filter = { isArchived: false };

    if (category && category !== "All") {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (tab === "my") {
      // Only groups user is a member of
      filter._id = { $in: memberGroupIds };
    } else if (tab === "discover") {
      // Only public groups, preferably not joined yet
      filter.visibility = "public";
      filter._id = { $nin: memberGroupIds };
    } else {
      // tab === "all": Public groups OR private groups the user is a member of
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { visibility: "public" },
          { _id: { $in: memberGroupIds } },
        ],
      });
    }

    const [groups, total] = await Promise.all([
      CommunityGroup.find(filter)
        .populate("owner", "displayName photoURL academic")
        .sort({ isGlobal: -1, lastActivityAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CommunityGroup.countDocuments(filter),
    ]);

    const items = groups.map((g) => {
      delete g.passwordHash;
      const isMember = memberGroupIds.includes(g._id.toString());
      return {
        ...g,
        membership: {
          isMember,
          role: isMember ? memberRoleMap.get(g._id.toString()) : null,
        },
      };
    });

    return {
      groups: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Retrieves group details and verifies access permissions for private groups.
   * @param {string} groupId 
   * @param {object} user 
   * @returns {Promise<object>} Group details with caller membership
   */
  async getGroupDetails(groupId, user) {
    await this.ensureGlobalCommunity();

    let group = null;
    if (mongoose.Types.ObjectId.isValid(groupId)) {
      group = await CommunityGroup.findById(groupId)
        .populate("owner", "displayName photoURL academic")
        .populate("moderators", "displayName photoURL academic")
        .lean();
    } else if (groupId === "global" || groupId === GLOBAL_GROUP_SLUG) {
      group = await CommunityGroup.findOne({ isGlobal: true })
        .populate("owner", "displayName photoURL academic")
        .populate("moderators", "displayName photoURL academic")
        .lean();
    }

    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    const membership = await CommunityMembership.findOne({
      group: group._id,
      user: user._id,
      status: "active",
    }).lean();

    // Check access for private groups
    if (group.visibility === "private" && !membership && user.role !== "admin") {
      throw new ApiError(
        403,
        "Access denied: This is a private group. You must enter the group password or be invited to view details."
      );
    }

    delete group.passwordHash;

    return {
      ...group,
      membership: {
        isMember: Boolean(membership),
        role: membership ? membership.role : null,
        joinedAt: membership ? membership.joinedAt : null,
      },
    };
  }

  /**
   * Joins a public or private community group.
   * @param {string} groupId 
   * @param {object} user 
   * @param {{ password?: string }} options 
   * @returns {Promise<object>} Resulting membership
   */
  async joinGroup(groupId, user, { password = null } = {}) {
    const group = await CommunityGroup.findById(groupId).select("+passwordHash");
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    const existing = await CommunityMembership.findOne({
      group: group._id,
      user: user._id,
    });

    if (existing) {
      if (existing.status === "active") {
        return {
          membership: existing,
          alreadyMember: true,
          message: "You are already a member of this group.",
        };
      }
      if (existing.status === "banned") {
        throw new ApiError(403, "You have been banned from this group.");
      }
    }

    // Handle private group password authentication
    if (group.visibility === "private") {
      if (group.isPasswordProtected) {
        if (!password) {
          throw new ApiError(
            400,
            "Password required: This private group requires a password to join."
          );
        }

        const rateCheck = checkGroupPasswordRateLimit(user._id.toString(), group._id.toString());
        if (!rateCheck.allowed) {
          throw new ApiError(429, rateCheck.reason);
        }

        const isValid = verifyGroupPassword(password, group.passwordHash);
        if (!isValid) {
          const attemptResult = recordFailedGroupPasswordAttempt(
            user._id.toString(),
            group._id.toString()
          );
          if (attemptResult.isLocked) {
            throw new ApiError(
              429,
              "Too many failed password attempts. Access temporarily locked for 15 minutes."
            );
          }
          throw new ApiError(
            401,
            `Incorrect group password. ${attemptResult.remainingAttempts} attempts remaining before temporary lockout.`
          );
        }

        clearGroupPasswordFailedAttempts(user._id.toString(), group._id.toString());
      } else {
        throw new ApiError(
          403,
          "Private group without a password requires an explicit owner invitation."
        );
      }
    }

    let membership = existing;
    if (membership) {
      membership.status = "active";
      membership.joinedAt = new Date();
      await membership.save();
    } else {
      membership = await CommunityMembership.create({
        group: group._id,
        user: user._id,
        role: "member",
        status: "active",
      });
    }

    await CommunityGroup.findByIdAndUpdate(group._id, {
      $inc: { memberCount: 1 },
      lastActivityAt: new Date(),
    });

    return {
      membership,
      alreadyMember: false,
      message: `Successfully joined ${group.name}`,
    };
  }

  /**
   * Leaves a community group.
   * @param {string} groupId 
   * @param {object} user 
   * @returns {Promise<object>} Status
   */
  async leaveGroup(groupId, user) {
    const group = await CommunityGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    if (group.isGlobal) {
      throw new ApiError(400, "You cannot leave the platform-wide Global Community.");
    }

    const membership = await CommunityMembership.findOne({
      group: group._id,
      user: user._id,
      status: "active",
    });

    if (!membership) {
      throw new ApiError(400, "You are not an active member of this group.");
    }

    if (membership.role === "owner") {
      throw new ApiError(
        400,
        "Group owner cannot leave. Transfer ownership to another member first or delete the group."
      );
    }

    await CommunityMembership.deleteOne({ _id: membership._id });

    await CommunityGroup.findByIdAndUpdate(group._id, {
      $inc: { memberCount: -1 },
      $pull: { moderators: user._id },
    });

    return { success: true, message: `Successfully left ${group.name}` };
  }

  /**
   * Updates group information (description, image, rules, password).
   * @param {string} groupId 
   * @param {object} user 
   * @param {object} updates 
   * @returns {Promise<object>} Updated group
   */
  async updateGroup(groupId, user, updates) {
    const group = await CommunityGroup.findById(groupId).select("+passwordHash");
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    const membership = await CommunityMembership.findOne({
      group: group._id,
      user: user._id,
      status: "active",
    });

    const isOwner = membership?.role === "owner" || user.role === "admin";
    const isModerator = membership?.role === "moderator" || isOwner;

    if (!isModerator) {
      throw new ApiError(403, "Only group owners or moderators can edit group details.");
    }

    if (updates.description !== undefined) {
      group.description = String(updates.description || "").trim().slice(0, 2000);
    }
    if (updates.image !== undefined) {
      group.image = String(updates.image || "").trim();
    }
    if (Array.isArray(updates.rules)) {
      group.rules = updates.rules.map((r) => String(r).trim()).filter(Boolean);
    }
    if (updates.category && COMMUNITY_GROUP_CATEGORIES.includes(updates.category)) {
      group.category = updates.category;
    }

    // Only owner can alter password, visibility, or name
    if (isOwner) {
      if (updates.name && updates.name.trim().length >= 2) {
        group.name = updates.name.trim().slice(0, 100);
      }
      if (updates.visibility && ["public", "private"].includes(updates.visibility)) {
        group.visibility = updates.visibility;
        if (group.visibility === "public") {
          group.isPasswordProtected = false;
          group.passwordHash = null;
        }
      }
      if (updates.password !== undefined) {
        if (updates.password === null || updates.password === "") {
          group.isPasswordProtected = false;
          group.passwordHash = null;
        } else if (typeof updates.password === "string" && updates.password.length >= 4) {
          group.isPasswordProtected = true;
          group.passwordHash = hashGroupPassword(updates.password);
        } else {
          throw new ApiError(400, "Password must be at least 4 characters long.");
        }
      }
    }

    await group.save();

    const safeGroup = group.toObject();
    delete safeGroup.passwordHash;
    return safeGroup;
  }

  /**
   * Deletes a community group and associated records (owner only).
   * @param {string} groupId 
   * @param {object} user 
   * @returns {Promise<object>} Status
   */
  async deleteGroup(groupId, user) {
    const group = await CommunityGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    if (group.isGlobal) {
      throw new ApiError(400, "The platform Global Community cannot be deleted.");
    }

    const membership = await CommunityMembership.findOne({
      group: group._id,
      user: user._id,
      status: "active",
    });

    if (membership?.role !== "owner" && user.role !== "admin") {
      throw new ApiError(403, "Only the group owner can delete this group.");
    }

    await Promise.all([
      CommunityGroup.deleteOne({ _id: group._id }),
      CommunityMembership.deleteMany({ group: group._id }),
      CommunityMessage.deleteMany({ group: group._id }),
    ]);

    return { success: true, message: `Group '${group.name}' has been permanently deleted.` };
  }

  /**
   * Manages membership roles (moderator, revoke, ownership transfer).
   * @param {string} groupId 
   * @param {object} callerUser 
   * @param {string} targetUserId 
   * @param {string} action - "assign_moderator" | "remove_moderator" | "revoke_membership" | "transfer_ownership"
   * @returns {Promise<object>} Resulting status
   */
  async manageMember(groupId, callerUser, targetUserId, action) {
    const group = await CommunityGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    const callerMembership = await CommunityMembership.findOne({
      group: group._id,
      user: callerUser._id,
      status: "active",
    });

    const isCallerOwner = callerMembership?.role === "owner" || callerUser.role === "admin";
    const isCallerMod = callerMembership?.role === "moderator" || isCallerOwner;

    if (!isCallerMod) {
      throw new ApiError(403, "You do not have permission to manage members in this group.");
    }

    const targetMembership = await CommunityMembership.findOne({
      group: group._id,
      user: targetUserId,
      status: "active",
    });

    if (!targetMembership) {
      throw new ApiError(404, "Target user is not an active member of this group.");
    }

    if (action === "transfer_ownership") {
      if (!isCallerOwner) {
        throw new ApiError(403, "Only the current group owner can transfer ownership.");
      }
      callerMembership.role = "moderator";
      await callerMembership.save();

      targetMembership.role = "owner";
      await targetMembership.save();

      group.owner = targetUserId;
      if (!group.moderators.includes(targetUserId)) {
        group.moderators.push(targetUserId);
      }
      await group.save();

      return {
        success: true,
        message: "Group ownership successfully transferred.",
      };
    }

    if (action === "assign_moderator") {
      if (!isCallerOwner) {
        throw new ApiError(403, "Only the group owner can assign moderators.");
      }
      targetMembership.role = "moderator";
      await targetMembership.save();

      await CommunityGroup.findByIdAndUpdate(group._id, {
        $addToSet: { moderators: targetUserId },
      });

      return { success: true, message: "Member promoted to moderator." };
    }

    if (action === "remove_moderator") {
      if (!isCallerOwner) {
        throw new ApiError(403, "Only the group owner can remove moderators.");
      }
      targetMembership.role = "member";
      await targetMembership.save();

      await CommunityGroup.findByIdAndUpdate(group._id, {
        $pull: { moderators: targetUserId },
      });

      return { success: true, message: "Moderator role removed." };
    }

    if (action === "revoke_membership") {
      if (targetMembership.role === "owner") {
        throw new ApiError(400, "Cannot revoke membership of the group owner.");
      }
      if (targetMembership.role === "moderator" && !isCallerOwner) {
        throw new ApiError(403, "Only the group owner can revoke a moderator's membership.");
      }

      targetMembership.status = "revoked";
      await targetMembership.save();

      await CommunityGroup.findByIdAndUpdate(group._id, {
        $inc: { memberCount: -1 },
        $pull: { moderators: targetUserId },
      });

      return { success: true, message: "Member access has been revoked." };
    }

    throw new ApiError(400, `Unknown management action '${action}'.`);
  }

  /**
   * Lists group members with safe public profiles.
   * @param {string} groupId 
   * @param {object} user 
   * @param {object} pagination 
   * @returns {Promise<object>} Member list
   */
  async listMembers(groupId, user, { page = 1, limit = 50 } = {}) {
    const group = await CommunityGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    const callerMembership = await CommunityMembership.findOne({
      group: group._id,
      user: user._id,
      status: "active",
    });

    if (group.visibility === "private" && !callerMembership && user.role !== "admin") {
      throw new ApiError(403, "Access denied: Private group member lists are restricted to members.");
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [members, total] = await Promise.all([
      CommunityMembership.find({ group: group._id, status: "active" })
        .populate("user", "displayName photoURL headline academic.branchName academic.institution")
        .sort({ role: 1, joinedAt: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CommunityMembership.countDocuments({ group: group._id, status: "active" }),
    ]);

    const items = members
      .filter((m) => m.user)
      .map((m) => ({
        membershipId: m._id,
        user: {
          _id: m.user._id,
          displayName: m.user.displayName || "Student",
          photoURL: m.user.photoURL || null,
          headline: m.user.headline || "",
          branchName: m.user.academic?.branchName || "Engineering",
          institution: m.user.academic?.institution || "Smart Skill Hub",
        },
        role: m.role,
        joinedAt: m.joinedAt,
      }));

    return {
      members: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}

export const communityGroupService = new CommunityGroupService();
