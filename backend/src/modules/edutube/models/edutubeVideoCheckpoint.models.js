import mongoose from "mongoose";

const edutubeVideoCheckpointSchema = new mongoose.Schema(
  {
    checkpointId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    videoId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestampSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: [(v) => Array.isArray(v) && v.length >= 2, "At least 2 options required"],
    },
    correctOptionIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: "",
    },
    conceptKey: {
      type: String,
      default: "",
    },
    skill: {
      type: String,
      required: true,
      index: true,
    },
    canonicalName: {
      type: String,
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
    },
    isAuthoritative: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

edutubeVideoCheckpointSchema.index({ videoId: 1, timestampSeconds: 1 });

export const EduTubeVideoCheckpoint =
  mongoose.models.EduTubeVideoCheckpoint ||
  mongoose.model("EduTubeVideoCheckpoint", edutubeVideoCheckpointSchema);
