import mongoose from "mongoose";

const edutubeCheckpointAttemptSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkpointId: {
      type: String,
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
      index: true,
    },
    selectedOptionIndex: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    skill: {
      type: String,
      default: "",
    },
    canonicalName: {
      type: String,
      default: "",
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

edutubeCheckpointAttemptSchema.index({ owner: 1, checkpointId: 1, attemptedAt: -1 });
edutubeCheckpointAttemptSchema.index({ owner: 1, videoId: 1 });
edutubeCheckpointAttemptSchema.index(
  { owner: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string", $gt: "" } } }
);

export const EduTubeCheckpointAttempt =
  mongoose.models.EduTubeCheckpointAttempt ||
  mongoose.model("EduTubeCheckpointAttempt", edutubeCheckpointAttemptSchema);
