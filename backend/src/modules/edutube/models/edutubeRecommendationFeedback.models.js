import mongoose from "mongoose";

const edutubeRecommendationFeedbackSchema = new mongoose.Schema(
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
    action: {
      type: String,
      enum: ["not_interested", "already_know", "more_like_this"],
      required: true,
    },
    topic: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

edutubeRecommendationFeedbackSchema.index({ owner: 1, videoId: 1 });
edutubeRecommendationFeedbackSchema.index({ owner: 1, action: 1 });

export const EduTubeRecommendationFeedback =
  mongoose.models.EduTubeRecommendationFeedback ||
  mongoose.model(
    "EduTubeRecommendationFeedback",
    edutubeRecommendationFeedbackSchema
  );
