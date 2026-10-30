import mongoose from "mongoose";

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate_content",
  "hate_speech",
  "academic_dishonesty",
  "other",
];

const communityMessageReportSchema = new mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityMessage",
      required: true,
      index: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityGroup",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: REPORT_REASONS,
    },
    details: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "action_taken"],
      default: "pending",
      index: true,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from the same user on the same message
communityMessageReportSchema.index(
  { reporter: 1, message: 1 },
  { unique: true }
);

export const CommunityMessageReport =
  mongoose.models.CommunityMessageReport ||
  mongoose.model("CommunityMessageReport", communityMessageReportSchema);
