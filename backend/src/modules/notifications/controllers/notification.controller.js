import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../services/notification.service.js";

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user with pagination and unread filtering.
 */
export const listNotifications = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const { page, limit, unreadOnly } = req.query;
  const data = await getUserNotifications(req.user._id, { page, limit, unreadOnly });

  return res.status(200).json(
    new ApiResponse(200, data, "Notifications retrieved successfully")
  );
});

/**
 * GET /api/v1/notifications/unread-count
 * Retrieve current unread notification badge count.
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const unreadCount = await getUnreadNotificationCount(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Unread notification count")
  );
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read, enforcing user ownership.
 */
export const markAsRead = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const { id } = req.params;
  const notification = await markNotificationAsRead(req.user._id, id);

  return res.status(200).json(
    new ApiResponse(200, { notification }, "Notification marked as read")
  );
});

/**
 * PATCH /api/v1/notifications/mark-all-read
 * Mark all unread notifications as read for current user.
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const modifiedCount = await markAllNotificationsAsRead(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, { modifiedCount }, "All notifications marked as read")
  );
});
