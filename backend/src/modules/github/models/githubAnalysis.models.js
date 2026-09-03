import mongoose from "mongoose";

const githubAnalysisSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    githubUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    profile: {
      name: { type: String, default: "" },
      bio: { type: String, default: "" },
      avatarUrl: { type: String, default: "" },
      company: { type: String, default: "" },
      location: { type: String, default: "" },
      blog: { type: String, default: "" },
      publicRepos: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      createdAt: { type: String, default: "" },
    },
    repositories: [
      {
        name: { type: String, required: true },
        description: { type: String, default: "" },
        htmlUrl: { type: String, default: "" },
        language: { type: String, default: "" },
        stars: { type: Number, default: 0 },
        forks: { type: Number, default: 0 },
        watchers: { type: Number, default: 0 },
        openIssues: { type: Number, default: 0 },
        sizeKB: { type: Number, default: 0 },
        archived: { type: Boolean, default: false },
        fork: { type: Boolean, default: false },
        updatedAt: { type: String, default: "" },
      },
    ],
    languages: {
      type: Map,
      of: new mongoose.Schema(
        {
          size: { type: Number, default: 0 },
          percentage: { type: Number, default: 0 },
          repoCount: { type: Number, default: 0 },
        },
        { _id: false }
      ),
      default: {},
    },
    dominantLanguage: {
      type: String,
      default: "JavaScript",
    },
    aggregateStats: {
      totalStars: { type: Number, default: 0 },
      totalForks: { type: Number, default: 0 },
      totalWatchers: { type: Number, default: 0 },
      totalIssues: { type: Number, default: 0 },
      totalSizeKB: { type: Number, default: 0 },
      archivedCount: { type: Number, default: 0 },
      forkedCount: { type: Number, default: 0 },
    },
    recentEvents: {
      type: Array,
      default: [],
    },
    aiInsights: {
      summary: { type: String, default: "" },
      skillAssessment: { type: String, default: "" },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      portfolioImprovementTips: { type: [String], default: [] },
      readmeQualityTips: { type: [String], default: [] },
      recommendedTechnologies: { type: [String], default: [] },
      careerSuggestions: { type: [String], default: [] },
      githubOptimizationScore: { type: Number, default: 0 },
    },
    careerMentor: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

githubAnalysisSchema.index({ owner: 1, githubUsername: 1 });

export const GitHubAnalysis =
  mongoose.models.GitHubAnalysis || mongoose.model("GitHubAnalysis", githubAnalysisSchema);
