import mongoose from "mongoose";

const userSettingsSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    mentorPreferences: {
      responseStyle: {
        type: String,
        enum: ["concise", "balanced", "detailed"],
        default: "balanced",
      },
      focusAreas: {
        type: [String],
        default: ["career", "github", "projects", "resume", "skills", "learning", "interview"],
      },
      contextSources: {
        type: [String],
        default: ["profile", "skills", "github", "resume", "projects", "edutube", "learning"],
      },
      proactiveGuidance: {
        type: [String],
        default: [
          "next_actions",
          "skill_gaps",
          "learning_resources",
          "github_improvements",
          "project_improvements",
        ],
      },
    },
    eduTubePreferences: {
      personalizedRecommendations: { type: Boolean, default: true },
      continueLearning: { type: Boolean, default: true },
      trackHistory: { type: Boolean, default: true },
      trackProgress: { type: Boolean, default: true },
      recommendFromGaps: { type: Boolean, default: true },
      recommendFromRoadmap: { type: Boolean, default: true },
    },
    notificationPreferences: {
      skillGapAlerts: { type: Boolean, default: true },
      learningRecommendations: { type: Boolean, default: true },
      githubAlerts: { type: Boolean, default: true },
      mentorRecommendations: { type: Boolean, default: true },
      eduTubeReminders: { type: Boolean, default: true },
    },
    privacyPreferences: {
      allowProfileContext: { type: Boolean, default: true },
      allowSkillsContext: { type: Boolean, default: true },
      allowResumeContext: { type: Boolean, default: true },
      allowProjectsContext: { type: Boolean, default: true },
      allowGitHubContext: { type: Boolean, default: true },
      allowEduTubeContext: { type: Boolean, default: true },
    },
    appearancePreferences: {
      theme: {
        type: String,
        enum: ["dark", "light", "system"],
        default: "dark",
      },
      accentColor: { type: String, default: "purple" },
    },
    githubIntegration: {
      connected: { type: Boolean, default: false },
      githubUsername: { type: String, trim: true, default: "" },
      githubUserId: { type: String, trim: true, default: "" },
      avatarUrl: { type: String, trim: true, default: "" },
      accessTokenEncrypted: { type: String, default: "" },
      scopes: { type: [String], default: ["read:user", "public_repo"] },
      lastSyncedAt: { type: Date, default: null },
      syncStatus: {
        type: String,
        enum: ["idle", "syncing", "synced", "failed"],
        default: "idle",
      },
      syncError: { type: String, default: "" },
      repositoriesCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export const UserSettings =
  mongoose.models.UserSettings ||
  mongoose.model("UserSettings", userSettingsSchema);
