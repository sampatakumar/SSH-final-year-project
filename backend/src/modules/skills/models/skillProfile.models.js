import mongoose from "mongoose";

const skillItemSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    canonicalName: { type: String, required: true },
    category: { type: String, default: "General" },
    score: { type: Number, min: 0, max: 100, default: 0 },
    level: {
      type: String,
      enum: ["Beginner", "Developing", "Competent", "Proficient", "Expert", "Limited Evidence", "Strong Evidence"],
      default: "Limited Evidence",
    },
    confidence: { type: Number, min: 0, max: 1, default: 0.5 },
    sources: {
      type: [String],
      enum: ["resume", "github", "coding", "assessment"],
      default: [],
    },
    evidence: [
      {
        source: { type: String, required: true },
        evidenceType: { type: String, default: "" },
        details: { type: String, default: "" },
        confidence: { type: Number, default: 0.5 },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    explanation: { type: String, default: "" },
    lastAssessedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const skillGapSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    canonicalName: { type: String, required: true },
    category: { type: String, default: "General" },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium",
    },
    reason: { type: String, default: "" },
    targetScore: { type: Number, default: 75 },
    currentScore: { type: Number, default: 0 },
    missingFrom: { type: [String], default: [] },
  },
  { _id: false }
);

const recommendationItemSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["coding_practice", "documentation", "course", "project_idea"],
      default: "coding_practice",
    },
    actionUrl: { type: String, default: "" },
    taskId: { type: String, default: "" },
    description: { type: String, default: "" },
    estimatedMinutes: { type: Number, default: 30 },
    isCompleted: { type: Boolean, default: false },
  },
  { _id: false }
);

const skillProfileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    targetRole: {
      type: String,
      default: "Full Stack Developer",
    },
    targetRoleLevel: {
      type: String,
      enum: ["Junior", "Mid-Level", "Senior"],
      default: "Junior",
    },
    overallReadinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    skills: {
      type: [skillItemSchema],
      default: [],
    },
    skillGaps: {
      type: [skillGapSchema],
      default: [],
    },
    recommendations: {
      type: [recommendationItemSchema],
      default: [],
    },
    evidenceSummary: {
      resumeEvidenceCount: { type: Number, default: 0 },
      githubReposAnalyzed: { type: Number, default: 0 },
      codingProblemsSolved: { type: Number, default: 0 },
      totalSubmissions: { type: Number, default: 0 },
    },
    evaluationVersion: {
      type: String,
      default: "1.0.0",
    },
    lastEvaluatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const SkillProfile =
  mongoose.models.SkillProfile || mongoose.model("SkillProfile", skillProfileSchema);
