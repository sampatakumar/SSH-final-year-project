import mongoose from "mongoose";

const learningActivityRecordSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        "course_selected",
        "module_started",
        "module_completed",
        "coding_attempted",
        "coding_passed",
        "coding_failed",
        "project_milestone",
        "skill_reassessed",
        "roadmap_milestone",
      ],
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      index: true,
    },
    canonicalName: {
      type: String,
      required: true,
    },
    targetRole: {
      type: String,
      default: "Full Stack Developer",
    },
    entityId: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    // Distinct competency flag: Educational exposure (video watch / task check) is FALSE.
    // Only verified sandbox test passes or authenticated benchmarks are TRUE.
    isDemonstratedCompetency: {
      type: Boolean,
      default: false,
      index: true,
    },
    evidence: {
      score: { type: Number, default: 0 },
      maxScore: { type: Number, default: 0 },
      testCasesPassed: { type: Number, default: 0 },
      testCasesTotal: { type: Number, default: 0 },
      executionTimeMs: { type: Number, default: 0 },
      details: { type: String, default: "" },
      evidenceSource: {
        type: String,
        enum: ["coding", "assessment", "edutube", "project", "github", "manual"],
        default: "coding",
      },
      sandboxVerified: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ["started", "in_progress", "completed", "passed", "failed"],
      default: "completed",
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance per-user isolation and chronological queries
learningActivityRecordSchema.index({ owner: 1, recordedAt: -1 });
learningActivityRecordSchema.index({ owner: 1, canonicalName: 1, recordedAt: -1 });
learningActivityRecordSchema.index({ owner: 1, activityType: 1, recordedAt: -1 });
learningActivityRecordSchema.index(
  { owner: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export const LearningActivityRecord =
  mongoose.models.LearningActivityRecord ||
  mongoose.model("LearningActivityRecord", learningActivityRecordSchema);
