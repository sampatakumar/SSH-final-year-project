import mongoose from "mongoose";

const playlistVideoSchema = new mongoose.Schema(
  {
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
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const edutubePlaylistSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    videos: [playlistVideoSchema],
  },
  {
    timestamps: true,
  }
);

edutubePlaylistSchema.index({ owner: 1, createdAt: -1 });

export const EduTubePlaylist =
  mongoose.models.EduTubePlaylist ||
  mongoose.model("EduTubePlaylist", edutubePlaylistSchema);
