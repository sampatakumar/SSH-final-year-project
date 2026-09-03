import mongoose from "mongoose";

const codingSubmissionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      default: "javascript",
      enum: ["javascript", "python", "typescript", "java", "cpp"],
    },
    code: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["passed", "failed", "runtime_error", "timeout", "system_error"],
      required: true,
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 10,
    },
    passed: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    executionTimeMs: {
      type: Number,
      default: 0,
    },
    skillsCovered: {
      type: [String],
      default: [],
    },
    tests: [
      {
        id: { type: mongoose.Schema.Types.Mixed },
        name: { type: String, default: "" },
        passed: { type: Boolean, default: false },
        isSample: { type: Boolean, default: false },
        executionTimeMs: { type: Number, default: 0 },
        error: { type: String },
      },
    ],
    stdout: {
      type: String,
      default: "",
    },
    stderr: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

codingSubmissionSchema.index({ owner: 1, taskId: 1, status: 1 });

export const CodingSubmission =
  mongoose.models.CodingSubmission || mongoose.model("CodingSubmission", codingSubmissionSchema);
