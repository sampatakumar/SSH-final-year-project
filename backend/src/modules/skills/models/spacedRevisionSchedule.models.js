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
    targetId: {
      type: String,
      default: "",
      index: true,
    },
    targetConcept: {
      type: String,
      default: "",
    },
    resourceId: {
      type: String,
      default: "",
    },
    resourceType: {
      type: String,
      enum: ["edutube", "coding_task", "roadmap_milestone", "quiz_checkpoint", "concept_review"],
      default: "concept_review",
    },
    quizId: {
      type: String,
      default: "",
    },
    stage: {
      type: Number,
      default: 1, // Stage 1 (1 day), Stage 2 (3 days), Stage 3 (7 days), Stage 4 (14 days), Stage 5 (30 days)
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
      enum: ["pending", "completed", "skipped", "overdue", "in_progress", "needs_reinforcement"],
      default: "pending",
      index: true,
    },
    lastScore: {
      type: Number,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    consecutiveSuccesses: {
      type: Number,
      default: 0,
    },
    lastReviewedAt: {
      type: Date,
      default: null,
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
    policyVersion: {
      type: String,
      default: "1.0",
    },
    history: [
      {
        reviewedAt: { type: Date, default: Date.now },
        score: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
        previousIntervalDays: { type: Number, default: 1 },
        newIntervalDays: { type: Number, default: 1 },
        answerGiven: { type: String, default: "" },
        idempotencyKey: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

spacedRevisionScheduleSchema.index({ owner: 1, scheduledDate: 1, status: 1 });
spacedRevisionScheduleSchema.index({ owner: 1, canonicalName: 1, status: 1 });
spacedRevisionScheduleSchema.index(
  { owner: 1, targetId: 1 },
  { partialFilterExpression: { targetId: { $type: "string", $gt: "" } } }
);

export const SpacedRevisionSchedule =
  mongoose.models.SpacedRevisionSchedule ||
  mongoose.model("SpacedRevisionSchedule", spacedRevisionScheduleSchema);
