import mongoose from "mongoose";

const edutubeVideoNoteSchema = new mongoose.Schema(
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
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    timestampSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

edutubeVideoNoteSchema.index({ owner: 1, videoId: 1, timestampSeconds: 1 });
edutubeVideoNoteSchema.index({ owner: 1, createdAt: -1 });

export const EduTubeVideoNote =
  mongoose.models.EduTubeVideoNote ||
  mongoose.model("EduTubeVideoNote", edutubeVideoNoteSchema);
