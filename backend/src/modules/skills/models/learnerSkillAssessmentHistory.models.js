import mongoose from "mongoose";

const learnerSkillAssessmentHistorySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    assessmentType: {
      type: String,
      enum: ["coding_challenge", "formative_quiz", "project_review", "spaced_retrieval", "evidence_reevaluation"],
      default: "coding_challenge",
    },
    taskId: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    previousScore: {
      type: Number,
      default: 0,
    },
    scoreDelta: {
      type: Number,
      default: 0,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    testCasesTotal: {
      type: Number,
      default: 0,
    },
    evidenceSource: {
      type: String,
      enum: ["coding", "assessment", "github", "resume"],
      default: "coding",
    },
    assessmentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

learnerSkillAssessmentHistorySchema.index({ owner: 1, canonicalName: 1, assessmentDate: -1 });

export const LearnerSkillAssessmentHistory =
  mongoose.models.LearnerSkillAssessmentHistory ||
  mongoose.model("LearnerSkillAssessmentHistory", learnerSkillAssessmentHistorySchema);
