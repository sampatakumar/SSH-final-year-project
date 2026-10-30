import mongoose from "mongoose";
import { CommunityMessage } from "../models/communityMessage.models.js";
import { CommunityGroup } from "../models/communityGroup.models.js";
import { CommunityMembership } from "../models/communityMembership.models.js";
import { CommunityMessageReport, REPORT_REASONS } from "../models/communityMessageReport.models.js";
import { CommunityBlock } from "../models/communityBlock.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { communityGroupService } from "./communityGroup.service.js";

// Message rate-limiting bucket: userId -> timestamp[]
const userMessageRateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 1000; // 10 seconds
const MAX_MESSAGES_PER_WINDOW = 10;

/**
 * Strips potentially dangerous script tags and malicious attributes for safe messaging.
 * @param {string} text 
 * @returns {string} Sanitized text
 */
export const sanitizeMessageContent = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
};

class CommunityMessageService {
  /**
   * Enforces message rate limiting per user.
   * @param {string} userId 
   */
  checkMessageRateLimit(userId) {
    const now = Date.now();
    const timestamps = userMessageRateMap.get(userId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (validTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
      throw new ApiError(
        429,
        "You are sending messages too quickly. Please wait a few seconds."
      );
    }

    validTimestamps.push(now);
    userMessageRateMap.set(userId, validTimestamps);
  }

  /**
   * Sends a message to a community group.
   * @param {string} groupId 
   * @param {object} user - Authenticated sender
   * @param {object} payload - { content, replyTo, messageType, attachments }
   * @returns {Promise<object>} Created message
   */
  async sendMessage(groupId, user, payload) {
    const { content, replyTo = null, messageType = "text", attachments = [] } = payload;

    const group = await CommunityGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    if (group.isArchived) {
      throw new ApiError(400, "Cannot send messages to an archived community group.");
    }

    // Auto-join Global Community if sender is not yet registered in it
    if (group.isGlobal) {
      await communityGroupService.ensureGlobalMembership(user._id);
    } else {
      // Validate active membership for non-global groups
      const membership = await CommunityMembership.findOne({
        group: group._id,
        user: user._id,
        status: "active",
      });

      if (!membership) {
        throw new ApiError(
          403,
          "You must be an active member of this group to send messages."
        );
      }

      if (membership.isMuted) {
        throw new ApiError(
          403,
          "You have been muted in this group and cannot send messages."
        );
      }
    }

    // Sanitize and validate content
    const cleanContent = sanitizeMessageContent(content);
    if (!cleanContent && attachments.length === 0) {
      throw new ApiError(400, "Message cannot be empty.");
    }

    if (cleanContent.length > 4000) {
      throw new ApiError(400, "Message content cannot exceed 4,000 characters.");
    }

    // Check rate limit
    this.checkMessageRateLimit(user._id.toString());

    // Validate attachments
    const validatedAttachments = (Array.isArray(attachments) ? attachments : [])
      .slice(0, 5)
      .map((att) => ({
        url: String(att.url || "").trim(),
        name: String(att.name || "Attachment").trim().slice(0, 150),
        size: Number(att.size) || 0,
        mimeType: String(att.mimeType || "application/octet-stream").slice(0, 50),
      }))
      .filter((att) => att.url.length > 0);

    const message = await CommunityMessage.create({
      group: group._id,
      sender: user._id,
      content: cleanContent,
      messageType,
      attachments: validatedAttachments,
      replyTo: replyTo && mongoose.Types.ObjectId.isValid(replyTo) ? replyTo : null,
      reactions: {},
    });

    // Update group lastActivityAt timestamp
    await CommunityGroup.findByIdAndUpdate(group._id, {
      lastActivityAt: new Date(),
    });

    // Populate sender details for safe broadcast and return
    const populated = await CommunityMessage.findById(message._id)
      .populate("sender", "displayName photoURL headline academic.branchName academic.institution")
      .populate("replyTo", "content sender isDeleted createdAt")
      .lean();

    // Trigger Socket.IO broadcast if socket engine is attached
    if (global.__communitySocketIO) {
      global.__communitySocketIO
        .to(`group:${group._id.toString()}`)
        .emit("new_message", populated);
    }

    return populated;
  }

  /**
   * Retrieves paginated messages for a group, filtering out blocked users.
   * @param {string} groupId 
   * @param {object} user - Authenticated reader
   * @param {object} options - { page, limit, before }
   * @returns {Promise<object>} Paginated messages
   */
  async getMessages(groupId, user, { page = 1, limit = 50, before = null } = {}) {
    const group = await CommunityGroup.findById(groupId);
    if (!group) {
      throw new ApiError(404, "Community group not found.");
    }

    // Validate access for private groups
    if (group.visibility === "private" && user.role !== "admin") {
      const membership = await CommunityMembership.findOne({
        group: group._id,
        user: user._id,
        status: "active",
      });

      if (!membership) {
        throw new ApiError(
          403,
          "Access denied: You must be an active member of this private group to view messages."
        );
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Find users blocked by the caller
    const blockedEntries = await CommunityBlock.find({ blocker: user._id }).lean();
    const blockedUserIds = blockedEntries.map((b) => b.blockedUser);

    const query = {
      group: group._id,
    };

    if (blockedUserIds.length > 0) {
      query.sender = { $nin: blockedUserIds };
    }

    if (before && !isNaN(new Date(before).getTime())) {
      query.createdAt = { $lt: new Date(before) };
    }

    const [messages, total] = await Promise.all([
      CommunityMessage.find(query)
        .populate("sender", "displayName photoURL headline academic.branchName academic.institution")
        .populate("replyTo", "content sender isDeleted createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CommunityMessage.countDocuments(query),
    ]);

    // Reverse to return in chronological order (oldest to newest in page)
    const chronological = messages.reverse();

    return {
      messages: chronological,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        hasMore: total > skip + messages.length,
      },
    };
  }

  /**
   * Soft-deletes a message with sender/moderator permission check.
   * @param {string} messageId 
   * @param {object} user 
   * @returns {Promise<object>} Status
   */
  async deleteMessage(messageId, user) {
    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      throw new ApiError(404, "Message not found.");
    }

    const isSender = message.sender.toString() === user._id.toString();

    let isModerator = false;
    let isOwner = false;

    if (!isSender && user.role !== "admin") {
      const membership = await CommunityMembership.findOne({
        group: message.group,
        user: user._id,
        status: "active",
      });
      isOwner = membership?.role === "owner";
      isModerator = membership?.role === "moderator" || isOwner;
    }

    if (!isSender && !isModerator && user.role !== "admin") {
      throw new ApiError(
        403,
        "You do not have permission to delete this message."
      );
    }

    message.isDeleted = true;
    message.content = "[This message was deleted by the author or a group moderator]";
    message.deletedBy = user._id;
    message.deletedAt = new Date();
    message.attachments = [];
    await message.save();

    // Broadcast deletion via Socket.IO
    if (global.__communitySocketIO) {
      global.__communitySocketIO
        .to(`group:${message.group.toString()}`)
        .emit("message_deleted", {
          messageId: message._id,
          groupId: message.group,
        });
    }

    return { success: true, message: "Message deleted successfully." };
  }

  /**
   * Reports a message for content moderation.
   * @param {string} messageId 
   * @param {object} user 
   * @param {object} reportData - { reason, details }
   * @returns {Promise<object>} Created report
   */
  async reportMessage(messageId, user, { reason, details = "" }) {
    const message = await CommunityMessage.findById(messageId);
    if (!message) {
      throw new ApiError(404, "Message not found.");
    }

    if (!REPORT_REASONS.includes(reason)) {
      throw new ApiError(
        400,
        `Invalid report reason. Allowed reasons: ${REPORT_REASONS.join(", ")}`
      );
    }

    // Check if user already reported this message
    const existing = await CommunityMessageReport.findOne({
      reporter: user._id,
      message: message._id,
    });

    if (existing) {
      return {
        success: true,
        message: "You have already reported this message.",
      };
    }

    const report = await CommunityMessageReport.create({
      message: message._id,
      reporter: user._id,
      group: message.group,
      reason,
      details: String(details || "").trim().slice(0, 1000),
      status: "pending",
    });

    return {
      success: true,
      reportId: report._id,
      message: "Report submitted to community moderators.",
    };
  }

  /**
   * Blocks another user to prevent seeing their messages.
   * @param {object} callerUser 
   * @param {string} targetUserId 
   * @param {string} reason 
   * @returns {Promise<object>} Status
   */
  async blockUser(callerUser, targetUserId, reason = "") {
    if (callerUser._id.toString() === targetUserId.toString()) {
      throw new ApiError(400, "You cannot block yourself.");
    }

    await CommunityBlock.findOneAndUpdate(
      { blocker: callerUser._id, blockedUser: targetUserId },
      { blocker: callerUser._id, blockedUser: targetUserId, reason: String(reason).trim() },
      { upsert: true, new: true }
    );

    return { success: true, message: "User blocked successfully." };
  }

  /**
   * Unblocks a previously blocked user.
   * @param {object} callerUser 
   * @param {string} targetUserId 
   * @returns {Promise<object>} Status
   */
  async unblockUser(callerUser, targetUserId) {
    await CommunityBlock.deleteOne({
      blocker: callerUser._id,
      blockedUser: targetUserId,
    });

    return { success: true, message: "User unblocked successfully." };
  }

  /**
   * Lists users blocked by the caller.
   * @param {object} callerUser 
   * @returns {Promise<object[]>} Blocked users list
   */
  async getBlockedUsers(callerUser) {
    const blocks = await CommunityBlock.find({ blocker: callerUser._id })
      .populate("blockedUser", "displayName photoURL headline academic.branchName")
      .lean();

    return blocks.map((b) => ({
      blockId: b._id,
      user: b.blockedUser,
      createdAt: b.createdAt,
    }));
  }
}

export const communityMessageService = new CommunityMessageService();
