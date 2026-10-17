import mongoose from "mongoose";
import { Notification, NOTIFICATION_TYPES } from "../models/notification.models.js";
import { User } from "../../../core/database/models/user.models.js";
import { UserSettings } from "../../settings/models/userSettings.models.js";
import {
  sanitizeNotificationDestination,
  sanitizeNotificationText,
} from "../utils/destinationValidator.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * Creates an in-app notification for a user, respecting global & granular notification preferences
 * and deduplicating based on unique event identifiers.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Learner / recipient ID
 * @param {object} payload - Notification data
 * @param {string} payload.type - Notification type (NOTIFICATION_TYPES)
 * @param {string} payload.title - Notification headline
 * @param {string} payload.message - Notification body
 * @param {string} [payload.destination] - Safe internal application route
 * @param {string} [payload.eventId] - Unique event identifier for deduplication
 * @param {object} [payload.metadata] - Additional contextual data
 * @returns {Promise<object|null>} Created or existing notification, or null if muted by user preferences
 */
export async function createNotification(userId, payload = {}) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const {
    type = NOTIFICATION_TYPES.SYSTEM,
    title,
    message,
    destination = "/dashboard",
    eventId = null,
    metadata = {},
  } = payload;

  if (!title || !message) {
    return null;
  }

  // 1. Verify User Global Notification Preference
  const user = await User.findById(userId).select("notificationsEnabled").lean();
  if (user && user.notificationsEnabled === false) {
    return null; // Student opted out of all notifications
  }

  // 2. Verify Granular Notification Preferences from Settings
  const userSettings = await UserSettings.findOne({ owner: userId })
    .select("notificationPreferences")
    .lean();

  if (userSettings?.notificationPreferences) {
    const prefs = userSettings.notificationPreferences;

    if (type === NOTIFICATION_TYPES.SKILL_GAP && prefs.skillGapAlerts === false) {
      return null;
    }
    if (
      type === NOTIFICATION_TYPES.LEARNING_MILESTONE &&
      prefs.learningRecommendations === false
    ) {
      return null;
    }
    if (type === NOTIFICATION_TYPES.REMINDER && prefs.eduTubeReminders === false) {
      return null;
    }
  }

  // 3. Deduplicate based on eventId if provided
  if (eventId && typeof eventId === "string") {
    const existing = await Notification.findOne({ owner: userId, eventId });
    if (existing) {
      return existing; // Idempotent return without duplicate creation
    }
  }

  // 4. Sanitize Content & Destination
  const cleanTitle = sanitizeNotificationText(title, 200);
  const cleanMessage = sanitizeNotificationText(message, 2000);
  const cleanDestination = sanitizeNotificationDestination(destination);

  if (!cleanTitle || !cleanMessage) {
    return null;
  }

  // 5. Persist Notification Record
  const notification = await Notification.create({
    owner: userId,
    type,
    title: cleanTitle,
    message: cleanMessage,
    destination: cleanDestination,
    isRead: false,
    readAt: null,
    eventId: eventId || null,
    metadata,
  });

  return notification;
}

/**
 * Retrieve paginated notifications for the authenticated user.
 *
 * @param {string|mongoose.Types.ObjectId} userId - User ID
 * @param {object} options - Query pagination and filter options
 * @returns {Promise<object>} Notifications list with pagination meta
 */
export async function getUserNotifications(userId, options = {}) {
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(options.limit, 10) || 20), 50);
  const unreadOnly = options.unreadOnly === true || options.unreadOnly === "true";

  const filter = { owner: userId };
  if (unreadOnly) {
    filter.isRead = false;
  }

  const [total, notifications] = await Promise.all([
    Notification.countDocuments(filter),
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    notifications,
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
 * Get count of unread notifications for authenticated user.
 *
 * @param {string|mongoose.Types.ObjectId} userId - User ID
 * @returns {Promise<number>} Unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  return await Notification.countDocuments({ owner: userId, isRead: false });
}

/**
 * Mark a specific notification as read, enforcing strict user ownership.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
 * @param {string} notificationId - Target notification ObjectId
 * @returns {Promise<object>} Updated notification
 */
export async function markNotificationAsRead(userId, notificationId) {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, "Invalid notification identifier.");
  }

  const notification = await Notification.findOne({
    _id: notificationId,
    owner: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found or access denied.");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
}

/**
 * Mark all unread notifications as read for the authenticated user.
 *
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated user ID
 * @returns {Promise<number>} Number of notifications updated
 */
export async function markAllNotificationsAsRead(userId) {
  const result = await Notification.updateMany(
    { owner: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return result.modifiedCount || 0;
}
