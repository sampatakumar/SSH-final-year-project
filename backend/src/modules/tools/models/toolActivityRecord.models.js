import mongoose from "mongoose";

const toolActivityRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toolId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    toolDisplayName: {
      type: String,
      default: "",
      trim: true,
    },
    toolVersion: {
      type: String,
      default: "1.0.0",
      trim: true,
    },
    academicDiscipline: {
      type: String,
      required: true,
      trim: true,
    },
    inputParameters: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    resultData: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    executionMode: {
      type: String,
      enum: ["deterministic", "hybrid_ai_deterministic", "ai"],
      default: "deterministic",
    },
    status: {
      type: String,
      enum: ["success", "error", "partial"],
      default: "success",
    },
    isSavedToPortfolio: {
      type: Boolean,
      default: false,
      index: true,
    },
    portfolioMetadata: {
      headline: { type: String, default: "" },
      summary: { type: String, default: "" },
      tags: [{ type: String }],
      savedAt: { type: Date, default: null },
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

toolActivityRecordSchema.index({ user: 1, createdAt: -1 });
toolActivityRecordSchema.index({ user: 1, toolId: 1, createdAt: -1 });

export const ToolActivityRecord = mongoose.model(
  "ToolActivityRecord",
  toolActivityRecordSchema
);

export default ToolActivityRecord;
