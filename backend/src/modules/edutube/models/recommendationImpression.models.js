import mongoose from "mongoose";

const recommendationImpressionSchema = new mongoose.Schema(
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
      index: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    section: {
      type: String,
      enum: ["forYou", "skillGaps", "careerPath", "history", "projects", "trending", "dashboard", "other"],
      default: "forYou",
    },
    queryTopic: {
      type: String,
      default: "",
    },
    featuresSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    modelVersion: {
      type: String,
      default: "baseline_v1",
      index: true,
    },
    action: {
      type: String,
      enum: [
        "impression",
        "click",
        "skip",
        "save",
        "completed",
        "not_interested",
        "more_like_this",
        "already_know",
      ],
      default: "impression",
      index: true,
    },
    watchDurationSeconds: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    postAssessmentScoreGain: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

recommendationImpressionSchema.index({ owner: 1, videoId: 1, action: 1 });
recommendationImpressionSchema.index({ timestamp: -1, modelVersion: 1 });

export const RecommendationImpression =
  mongoose.models.RecommendationImpression ||
  mongoose.model("RecommendationImpression", recommendationImpressionSchema);
