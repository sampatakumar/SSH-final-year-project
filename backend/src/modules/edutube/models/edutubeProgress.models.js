import mongoose from "mongoose";

const edutubeProgressSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    videoId: {
      type: String,
      required: true,
      trim: true,
    },
    positionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

edutubeProgressSchema.index({ owner: 1, videoId: 1 }, { unique: true });

export const EduTubeProgress =
  mongoose.models.EduTubeProgress ||
  mongoose.model("EduTubeProgress", edutubeProgressSchema);
