import { Router } from "express";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notification.controller.js";

const router = Router();

// All notification routes are strictly authenticated
router.use(verifyFirebaseToken);

router.get("/", listNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/mark-all-read", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
