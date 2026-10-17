import mongoose from "mongoose";

export const NOTIFICATION_TYPES = {
  LEARNING_MILESTONE: "learning_milestone",
  SKILL_GAP: "skill_gap",
  ROADMAP: "roadmap",
  REMINDER: "reminder",
  SYSTEM: "system",
};

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(NOTIFICATION_TYPES),
      default: NOTIFICATION_TYPES.SYSTEM,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    destination: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "/dashboard",
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    eventId: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high performance chronological retrieval and unread filtering
notificationSchema.index({ owner: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ owner: 1, createdAt: -1 });
// Compound index for idempotent event deduplication
notificationSchema.index({ owner: 1, eventId: 1 }, { sparse: true });

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
