import mongoose from "mongoose";

const questionResultSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      default: "",
    },
    submittedAnswer: {
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
    explanation: {
      type: String,
      default: "",
    },
    remediationGuidance: {
      type: String,
      default: "",
    },
    topic: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const topicPerformanceSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    questionsCount: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    masteryLevel: {
      type: String,
      enum: ["Proficient", "Competent", "Needs Improvement"],
      default: "Needs Improvement",
    },
  },
  { _id: false }
);

const recommendedNextStepSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["review_topic", "retry_assessment", "start_project", "explore_resources"],
      default: "review_topic",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    linkUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assessmentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "abandoned"],
      default: "in_progress",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    submittedAnswers: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    maxScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    isPassing: {
      type: Boolean,
      default: false,
    },
    questionResults: {
      type: [questionResultSchema],
      default: [],
    },
    topicPerformance: {
      type: [topicPerformanceSchema],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    areasForImprovement: {
      type: [String],
      default: [],
    },
    recommendedNextSteps: {
      type: [recommendedNextStepSchema],
      default: [],
    },
    scoringMethod: {
      type: String,
      default: "deterministic_server_evaluated",
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ owner: 1, assessmentId: 1, createdAt: -1 });

export const AssessmentAttempt =
  mongoose.models.AssessmentAttempt ||
  mongoose.model("AssessmentAttempt", assessmentAttemptSchema);
