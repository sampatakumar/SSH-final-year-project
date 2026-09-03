import mongoose from "mongoose";

const assessmentSessionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    topic: {
      type: String,
      default: "General"
    },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Mixed"],
      default: "Mixed"
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    taskIds: {
      type: [String],
      default: []
    },
    submissions: [
      {
        taskId: { type: String, required: true },
        submissionId: { type: mongoose.Schema.Types.ObjectId, ref: "CodingSubmission" },
        status: { type: String, default: "unattempted" },
        score: { type: Number, default: 0 },
        maxScore: { type: Number, default: 10 }
      }
    ],
    totalScore: {
      type: Number,
      default: 0
    },
    maxScore: {
      type: Number,
      default: 0
    },
    skillsTested: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const AssessmentSession = mongoose.model("AssessmentSession", assessmentSessionSchema);
