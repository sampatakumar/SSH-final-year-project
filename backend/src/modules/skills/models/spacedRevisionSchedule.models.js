import mongoose from "mongoose";

const spacedRevisionScheduleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
    },
    canonicalName: {
      type: String,
      required: true,
    },
    stage: {
      type: Number,
      default: 1, // Stage 1 (1 day), Stage 2 (3 days), Stage 3 (7 days), Stage 4 (14 days)
    },
    intervalDays: {
      type: Number,
      default: 1,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped", "overdue"],
      default: "pending",
      index: true,
    },
    lastScore: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    promptQuestion: {
      type: String,
      default: "",
    },
    recommendedExerciseId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

spacedRevisionScheduleSchema.index({ owner: 1, scheduledDate: 1, status: 1 });

export const SpacedRevisionSchedule =
  mongoose.models.SpacedRevisionSchedule ||
  mongoose.model("SpacedRevisionSchedule", spacedRevisionScheduleSchema);
