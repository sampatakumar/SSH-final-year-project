import mongoose from "mongoose";

const edutubeSavedVideoSchema = new mongoose.Schema(
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
    savedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

edutubeSavedVideoSchema.index({ owner: 1, videoId: 1 }, { unique: true });
edutubeSavedVideoSchema.index({ owner: 1, savedAt: -1 });

export const EduTubeSavedVideo =
  mongoose.models.EduTubeSavedVideo ||
  mongoose.model("EduTubeSavedVideo", edutubeSavedVideoSchema);
