import mongoose from "mongoose";

const submittedTaskAnswerSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    unit: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const taskResultSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["numerical", "multiple_choice", "structured_reasoning", "tradeoff_analysis"],
      default: "numerical",
    },
    submittedValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
    pointsEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    maxPoints: {
      type: Number,
      required: true,
      default: 10,
    },
    acceptedAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    unit: {
      type: String,
      default: "",
    },
    toleranceUsed: {
      type: Number,
      default: null,
    },
    explanation: {
      type: String,
      default: "",
    },
    remediationGuidance: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const nextActionRecommendationSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["review_concept", "retry_lab", "explore_assessment", "start_project", "mentor_discussion"],
      default: "review_concept",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const practicalLabAttemptSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    labId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    labVersion: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    disciplineCategory: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    branchSlugs: {
      type: [String],
      default: [],
      index: true,
    },
    labType: {
      type: String,
      enum: ["numerical_calculation", "scenario_decision", "structured_reasoning", "data_interpretation"],
      default: "numerical_calculation",
    },
    submittedAnswers: [submittedTaskAnswerSchema],
    taskResults: [taskResultSchema],
    serverScore: {
      type: Number,
      required: true,
      default: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      default: 100,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    isPassing: {
      type: Boolean,
      required: true,
      default: false,
    },
    masteryLevel: {
      type: String,
      enum: ["Mastered", "Competent", "Needs Remediation"],
      default: "Needs Remediation",
    },
    evaluationFeedback: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    skillsEvaluated: {
      type: [String],
      default: [],
      index: true,
    },
    learningObjectivesEvaluated: {
      type: [String],
      default: [],
    },
    nextActionRecommendations: [nextActionRecommendationSchema],
    status: {
      type: String,
      enum: ["in_progress", "submitted", "abandoned"],
      default: "submitted",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for user attempts and lab history queries
practicalLabAttemptSchema.index({ owner: 1, labId: 1, submittedAt: -1 });
practicalLabAttemptSchema.index({ owner: 1, status: 1, submittedAt: -1 });

export const PracticalLabAttempt =
  mongoose.models.PracticalLabAttempt ||
  mongoose.model("PracticalLabAttempt", practicalLabAttemptSchema);

export default PracticalLabAttempt;
