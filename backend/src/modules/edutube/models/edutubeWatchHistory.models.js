import mongoose from "mongoose";

const edutubeWatchHistorySchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    channelTitle: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    positionSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    watchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

edutubeWatchHistorySchema.index({ owner: 1, videoId: 1 }, { unique: true });
edutubeWatchHistorySchema.index({ owner: 1, watchedAt: -1 });

export const EduTubeWatchHistory =
  mongoose.models.EduTubeWatchHistory ||
  mongoose.model("EduTubeWatchHistory", edutubeWatchHistorySchema);
