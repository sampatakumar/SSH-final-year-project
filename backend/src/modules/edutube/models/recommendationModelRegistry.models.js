import mongoose from "mongoose";

const recommendationModelRegistrySchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    modelType: {
      type: String,
      enum: ["deterministic_baseline", "gradient_boosted_ranker", "linear_ranker", "hybrid_ensemble"],
      required: true,
      default: "deterministic_baseline",
    },
    status: {
      type: String,
      enum: ["deployed", "candidate", "archived", "rolled_back"],
      required: true,
      default: "candidate",
      index: true,
    },
    featureWeights: {
      type: Map,
      of: Number,
      default: {},
    },
    metrics: {
      ndcgAt5: { type: Number, default: 0 },
      ndcgAt10: { type: Number, default: 0 },
      precisionAt5: { type: Number, default: 0 },
      coverage: { type: Number, default: 0 },
      educationalRelevance: { type: Number, default: 0 },
      avgLearningGain: { type: Number, default: 0 },
    },
    baselineComparison: {
      ndcgGainPercent: { type: Number, default: 0 },
      precisionGainPercent: { type: Number, default: 0 },
      statisticallySignificant: { type: Boolean, default: false },
    },
    trainedOnSamplesCount: {
      type: Number,
      default: 0,
    },
    holdoutEvaluationSamplesCount: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    deployedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const RecommendationModelRegistry =
  mongoose.models.RecommendationModelRegistry ||
  mongoose.model("RecommendationModelRegistry", recommendationModelRegistrySchema);
