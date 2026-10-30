import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { communityGroupService } from "../services/communityGroup.service.js";
import { communityMessageService } from "../services/communityMessage.service.js";
import { studentDirectoryService } from "../services/studentDirectory.service.js";
import { publicProjectDiscoveryService } from "../services/publicProjectDiscovery.service.js";

/**
 * GET /api/v1/community/global
 * Returns the default Global Community group and auto-joins the authenticated user.
 */
export const getGlobalCommunity = asyncHandler(async (req, res) => {
  const globalGroup = await communityGroupService.ensureGlobalCommunity();
  const membership = await communityGroupService.ensureGlobalMembership(req.user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        group: {
          ...globalGroup.toObject(),
          membership: { isMember: true, role: membership.role },
        },
      },
      "Global Community retrieved successfully"
    )
  );
});

/**
 * POST /api/v1/community/groups
 * Creates a new community group.
 */
export const createGroup = asyncHandler(async (req, res) => {
  const group = await communityGroupService.createGroup(req.user, req.body);
  return res.status(201).json(new ApiResponse(201, { group }, "Group created successfully"));
});

/**
 * GET /api/v1/community/groups
 * Lists groups by tab, category, and search criteria.
 */
export const listGroups = asyncHandler(async (req, res) => {
  const result = await communityGroupService.listGroups(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Groups retrieved successfully"));
});

/**
 * GET /api/v1/community/groups/:groupId
 * Returns group details with permission checks.
 */
export const getGroupDetails = asyncHandler(async (req, res) => {
  const group = await communityGroupService.getGroupDetails(req.params.groupId, req.user);
  return res.status(200).json(new ApiResponse(200, { group }, "Group details retrieved"));
});

/**
 * PATCH /api/v1/community/groups/:groupId
 * Updates group information (owner/moderator only).
 */
export const updateGroup = asyncHandler(async (req, res) => {
  const group = await communityGroupService.updateGroup(
    req.params.groupId,
    req.user,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, { group }, "Group updated successfully"));
});

/**
 * DELETE /api/v1/community/groups/:groupId
 * Deletes a community group (owner only).
 */
export const deleteGroup = asyncHandler(async (req, res) => {
  const result = await communityGroupService.deleteGroup(req.params.groupId, req.user);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/community/groups/:groupId/join
 * Joins a public or password-protected private group.
 */
export const joinGroup = asyncHandler(async (req, res) => {
  const result = await communityGroupService.joinGroup(
    req.params.groupId,
    req.user,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/community/groups/:groupId/leave
 * Leaves a community group.
 */
export const leaveGroup = asyncHandler(async (req, res) => {
  const result = await communityGroupService.leaveGroup(req.params.groupId, req.user);
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * GET /api/v1/community/groups/:groupId/members
 * Lists group members with safe profiles.
 */
export const listMembers = asyncHandler(async (req, res) => {
  const result = await communityGroupService.listMembers(
    req.params.groupId,
    req.user,
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Group members retrieved"));
});

/**
 * PATCH /api/v1/community/groups/:groupId/members/:targetUserId
 * Manages membership roles or revokes membership.
 */
export const manageMember = asyncHandler(async (req, res) => {
  const result = await communityGroupService.manageMember(
    req.params.groupId,
    req.user,
    req.params.targetUserId,
    req.body.action
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * GET /api/v1/community/groups/:groupId/messages
 * Retrieves paginated message history.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const result = await communityMessageService.getMessages(
    req.params.groupId,
    req.user,
    req.query
  );
  return res.status(200).json(new ApiResponse(200, result, "Messages retrieved"));
});

/**
 * POST /api/v1/community/groups/:groupId/messages
 * Sends a message to a community group.
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const message = await communityMessageService.sendMessage(
    req.params.groupId,
    req.user,
    req.body
  );
  return res.status(201).json(new ApiResponse(201, { message }, "Message sent successfully"));
});

/**
 * DELETE /api/v1/community/messages/:messageId
 * Deletes a message (author or moderator).
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const result = await communityMessageService.deleteMessage(
    req.params.messageId,
    req.user
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/community/messages/:messageId/report
 * Reports a message for content moderation.
 */
export const reportMessage = asyncHandler(async (req, res) => {
  const result = await communityMessageService.reportMessage(
    req.params.messageId,
    req.user,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * POST /api/v1/community/blocks/:targetUserId
 * Blocks a user from messaging interactions.
 */
export const blockUser = asyncHandler(async (req, res) => {
  const result = await communityMessageService.blockUser(
    req.user,
    req.params.targetUserId,
    req.body.reason
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * DELETE /api/v1/community/blocks/:targetUserId
 * Unblocks a user.
 */
export const unblockUser = asyncHandler(async (req, res) => {
  const result = await communityMessageService.unblockUser(
    req.user,
    req.params.targetUserId
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});

/**
 * GET /api/v1/community/blocks
 * Lists users blocked by the caller.
 */
export const getBlockedUsers = asyncHandler(async (req, res) => {
  const blocked = await communityMessageService.getBlockedUsers(req.user);
  return res.status(200).json(new ApiResponse(200, { blocked }, "Blocked users retrieved"));
});

/**
 * GET /api/v1/community/students
 * Lists public student directory with filters.
 */
export const getStudentDirectory = asyncHandler(async (req, res) => {
  const result = await studentDirectoryService.getStudentDirectory(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Student directory retrieved"));
});

/**
 * GET /api/v1/community/students/:studentId
 * Returns single student's public profile details.
 */
export const getStudentPublicProfile = asyncHandler(async (req, res) => {
  const profile = await studentDirectoryService.getStudentPublicProfile(
    req.params.studentId,
    req.user
  );
  return res.status(200).json(new ApiResponse(200, { profile }, "Student profile retrieved"));
});

/**
 * GET /api/v1/community/projects
 * Lists public and collaborative projects.
 */
export const getPublicProjects = asyncHandler(async (req, res) => {
  const result = await publicProjectDiscoveryService.getPublicProjects(req.user, req.query);
  return res.status(200).json(new ApiResponse(200, result, "Public projects retrieved"));
});

/**
 * PATCH /api/v1/community/projects/:projectId/collaboration
 * Updates collaboration and public visibility for a project.
 */
export const updateProjectCollaboration = asyncHandler(async (req, res) => {
  const result = await publicProjectDiscoveryService.updateProjectCollaboration(
    req.params.projectId,
    req.user,
    req.body
  );
  return res.status(200).json(new ApiResponse(200, result, result.message));
});
