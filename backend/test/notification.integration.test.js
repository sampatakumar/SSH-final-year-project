import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import mongoose from "mongoose";
import { Notification, NOTIFICATION_TYPES } from "../src/modules/notifications/models/notification.models.js";
import { User } from "../src/core/database/models/user.models.js";
import { UserSettings } from "../src/modules/settings/models/userSettings.models.js";
import {
  createNotification,
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../src/modules/notifications/services/notification.service.js";
import {
  sanitizeNotificationDestination,
  sanitizeNotificationText,
} from "../src/modules/notifications/utils/destinationValidator.js";

describe("Phase 10: In-App Notification Center Backend Suite", () => {
  const userIdA = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
  const userIdB = new mongoose.Types.ObjectId("507f1f77bcf86cd799439022");
  const notificationId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439033");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Notification Destination & Text Sanitization", () => {
    it("permits approved internal relative dashboard routes", () => {
      expect(sanitizeNotificationDestination("/dashboard")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("/dashboard/gaps")).toBe("/dashboard/gaps");
      expect(sanitizeNotificationDestination("/dashboard/edutube?search=react")).toBe("/dashboard/edutube?search=react");
      expect(sanitizeNotificationDestination("/dashboard/coding")).toBe("/dashboard/coding");
      expect(sanitizeNotificationDestination("/dashboard/roadmap")).toBe("/dashboard/roadmap");
    });

    it("rejects and neutralizes external domains and protocol-relative URLs", () => {
      expect(sanitizeNotificationDestination("https://malicious-site.com")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("http://attacker.com/steal")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("//attacker.com/evil")).toBe("/dashboard");
    });

    it("rejects javascript:, data:, and HTML payload injections", () => {
      expect(sanitizeNotificationDestination("javascript:alert(document.cookie)")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("data:text/html,<script>evil()</script>")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("<script>alert(1)</script>")).toBe("/dashboard");
      expect(sanitizeNotificationDestination("/dashboard/gaps<script>")).toBe("/dashboard");
    });

    it("strips HTML markup and enforces maximum string lengths", () => {
      const dirty = "<b>Congratulations!</b> You completed <script>alert(1)</script>lesson.";
      expect(sanitizeNotificationText(dirty, 50)).toBe("Congratulations! You completed lesson.");
    });
  });

  describe("2. Notification Creation & User Preferences Enforcement", () => {
    it("creates a notification when user has notifications enabled", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        select: () => ({ lean: async () => ({ notificationsEnabled: true }) }),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        select: () => ({ lean: async () => ({ notificationPreferences: { learningRecommendations: true } }) }),
      });
      vi.spyOn(Notification, "create").mockResolvedValue({
        _id: notificationId,
        owner: userIdA,
        type: NOTIFICATION_TYPES.LEARNING_MILESTONE,
        title: "Milestone Completed",
        message: "You completed EduTube video 101",
        destination: "/dashboard/edutube",
        isRead: false,
      });

      const result = await createNotification(userIdA, {
        type: NOTIFICATION_TYPES.LEARNING_MILESTONE,
        title: "Milestone Completed",
        message: "You completed EduTube video 101",
        destination: "/dashboard/edutube",
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("Milestone Completed");
      expect(result.destination).toBe("/dashboard/edutube");
    });

    it("suppresses notification when user has globally disabled notifications", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        select: () => ({ lean: async () => ({ notificationsEnabled: false }) }),
      });
      const createSpy = vi.spyOn(Notification, "create");

      const result = await createNotification(userIdA, {
        type: NOTIFICATION_TYPES.LEARNING_MILESTONE,
        title: "Muted Milestone",
        message: "This should not be saved",
      });

      expect(result).toBeNull();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("suppresses notification when granular preference (skillGapAlerts) is disabled", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        select: () => ({ lean: async () => ({ notificationsEnabled: true }) }),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        select: () => ({
          lean: async () => ({
            notificationPreferences: { skillGapAlerts: false },
          }),
        }),
      });
      const createSpy = vi.spyOn(Notification, "create");

      const result = await createNotification(userIdA, {
        type: NOTIFICATION_TYPES.SKILL_GAP,
        title: "Gap Benchmark",
        message: "Identified 3 gaps",
      });

      expect(result).toBeNull();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("deduplicates repeated events using eventId idempotency key", async () => {
      vi.spyOn(User, "findById").mockReturnValue({
        select: () => ({ lean: async () => ({ notificationsEnabled: true }) }),
      });
      vi.spyOn(UserSettings, "findOne").mockReturnValue({
        select: () => ({ lean: async () => null }),
      });
      const existingNotification = {
        _id: notificationId,
        owner: userIdA,
        eventId: "edutube_complete_123_abc",
        title: "Existing Lesson",
      };
      vi.spyOn(Notification, "findOne").mockResolvedValue(existingNotification);
      const createSpy = vi.spyOn(Notification, "create");

      const result = await createNotification(userIdA, {
        type: NOTIFICATION_TYPES.LEARNING_MILESTONE,
        title: "Existing Lesson",
        message: "Lesson completed again",
        eventId: "edutube_complete_123_abc",
      });

      expect(result).toBe(existingNotification);
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe("3. Notification Retrieval & Unread Counts", () => {
    it("retrieves paginated notifications for the authenticated user", async () => {
      const mockList = [
        { _id: new mongoose.Types.ObjectId(), title: "Notification 1", isRead: false },
        { _id: new mongoose.Types.ObjectId(), title: "Notification 2", isRead: true },
      ];
      vi.spyOn(Notification, "countDocuments").mockResolvedValue(2);
      vi.spyOn(Notification, "find").mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => mockList,
            }),
          }),
        }),
      });

      const res = await getUserNotifications(userIdA, { page: 1, limit: 10 });
      expect(res.notifications.length).toBe(2);
      expect(res.pagination.total).toBe(2);
      expect(res.pagination.totalPages).toBe(1);
      expect(res.pagination.hasNextPage).toBe(false);
    });

    it("filters to unread notifications when unreadOnly is requested", async () => {
      const countSpy = vi.spyOn(Notification, "countDocuments").mockResolvedValue(1);
      vi.spyOn(Notification, "find").mockReturnValue({
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => [{ _id: notificationId, isRead: false }],
            }),
          }),
        }),
      });

      await getUserNotifications(userIdA, { unreadOnly: true });
      expect(countSpy).toHaveBeenCalledWith({ owner: userIdA, isRead: false });
    });

    it("retrieves unread notification count accurately", async () => {
      vi.spyOn(Notification, "countDocuments").mockResolvedValue(5);
      const count = await getUnreadNotificationCount(userIdA);
      expect(count).toBe(5);
    });
  });

  describe("4. Ownership Security & Mark As Read Operations", () => {
    it("marks a notification as read when owned by authenticated user", async () => {
      const mockDoc = {
        _id: notificationId,
        owner: userIdA,
        isRead: false,
        readAt: null,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(Notification, "findOne").mockResolvedValue(mockDoc);

      const updated = await markNotificationAsRead(userIdA, notificationId.toString());
      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeInstanceOf(Date);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it("denies access and throws 404 when user attempts to read another user's notification", async () => {
      // Notification belongs to userIdB, but requester is userIdA
      vi.spyOn(Notification, "findOne").mockResolvedValue(null);

      await expect(
        markNotificationAsRead(userIdA, notificationId.toString())
      ).rejects.toThrow(/not found or access denied/i);
    });

    it("rejects invalid notification ObjectId formats with 400 Bad Request", async () => {
      await expect(
        markNotificationAsRead(userIdA, "invalid-mongo-id")
      ).rejects.toThrow(/invalid notification identifier/i);
    });

    it("marks all notifications as read for current user only", async () => {
      const updateManySpy = vi.spyOn(Notification, "updateMany").mockResolvedValue({
        modifiedCount: 4,
      });

      const count = await markAllNotificationsAsRead(userIdA);
      expect(count).toBe(4);
      expect(updateManySpy).toHaveBeenCalledWith(
        { owner: userIdA, isRead: false },
        expect.objectContaining({ $set: expect.objectContaining({ isRead: true }) })
      );
    });
  });
});
