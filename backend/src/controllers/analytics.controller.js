import { User } from "../core/database/models/user.models.js";
import { UserSettings } from "../modules/settings/models/userSettings.models.js";
import { SkillProfile } from "../modules/skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../modules/github/models/githubAnalysis.models.js";
import { Project } from "../modules/resume/models/project.models.js";
import { Resume } from "../modules/resume/models/resume.models.js";
import { Portfolio } from "../modules/resume/models/portfolio.models.js";
import { CodingSubmission } from "../modules/coding/models/codingSubmission.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
} from "../modules/edutube/models/index.js";
import { SmartMentorConversation } from "../modules/mentor/models/smartMentorConversation.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * GET /api/v1/analytics/me
 * Aggregated User Analytics for the authenticated user
 */
export const getUserAnalytics = asyncHandler(async (req, res) => {
  const ownerId = req.user._id;
  const range = (req.query.range || "30d").toLowerCase();

  // Parallel database fetch for maximum performance
  const [
    user,
    settings,
    skillProfile,
    githubRecord,
    projects,
    resumes,
    portfolios,
    watchHistory,
    progressList,
    savedVideos,
    playlists,
    codingSubs,
    mentorConvo,
  ] = await Promise.all([
    User.findById(ownerId).lean().catch(() => null),
    UserSettings.findOne({ owner: ownerId }).lean().catch(() => null),
    SkillProfile.findOne({ owner: ownerId }).lean().catch(() => null),
    GitHubAnalysis.findOne({ owner: ownerId }).sort({ updatedAt: -1 }).lean().catch(() => null),
    Project.find({ owner: ownerId }).sort({ updatedAt: -1 }).lean().catch(() => []),
    Resume.find({ owner: ownerId }).sort({ updatedAt: -1 }).lean().catch(() => []),
    Portfolio.find({ userId: ownerId }).sort({ updatedAt: -1 }).lean().catch(() => []),
    EduTubeWatchHistory.find({ owner: ownerId }).sort({ watchedAt: -1 }).lean().catch(() => []),
    EduTubeProgress.find({ owner: ownerId }).lean().catch(() => []),
    EduTubeSavedVideo.find({ owner: ownerId }).lean().catch(() => []),
    EduTubePlaylist.find({ owner: ownerId }).lean().catch(() => []),
    CodingSubmission.find({ owner: ownerId }).sort({ submittedAt: -1 }).lean().catch(() => []),
    SmartMentorConversation.findOne({ owner: ownerId }).lean().catch(() => null),
  ]);

  const targetRole = user?.targetRole || skillProfile?.targetRole || "Full Stack Developer";

  // 1. EduTube Calculations
  const completedProgress = progressList.filter((p) => p.completed || p.percentage >= 95);
  let totalDurationSeconds = 0;
  for (const h of watchHistory) {
    totalDurationSeconds += Number(h.positionSeconds || h.durationSeconds || (h.duration?.seconds ? Number(h.duration.seconds) : 0)) || 0;
  }
  const learningHours = Number((totalDurationSeconds / 3600).toFixed(1));

  // 7-day weekly activity breakdown
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const last7Days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayName = dayNames[d.getDay()];
    const count = watchHistory.filter((w) => {
      const watched = new Date(w.watchedAt || w.createdAt);
      return watched >= d && watched < nextD;
    }).length;

    last7Days.push({
      day: dayName,
      date: d.toISOString().split("T")[0],
      count,
    });
  }

  // 2. Skills breakdown
  const evaluatedSkills = (skillProfile?.skills || []).map((s) => ({
    name: s.skill,
    level: s.level || "Limited Evidence",
    score: s.score || 0,
    category: s.category || "General",
    sources: s.sources || [],
  }));

  const strongSkills = evaluatedSkills.filter(
    (s) => s.score >= 70 || s.level === "Proficient" || s.level === "Expert" || s.level === "Strong Evidence"
  );
  const improvingSkills = evaluatedSkills.filter(
    (s) => (s.score >= 40 && s.score < 70) || s.level === "Competent" || s.level === "Developing"
  );
  const needsAttentionSkills = evaluatedSkills.filter(
    (s) => s.score < 40 || s.level === "Beginner" || s.level === "Limited Evidence"
  );

  // 3. Skill Gaps breakdown
  const skillGaps = (skillProfile?.skillGaps || []).map((g) => ({
    skill: g.skill,
    priority: g.priority || "Medium",
    currentScore: g.currentScore || 0,
    targetScore: g.targetScore || 75,
    reason: g.reason || `Essential for ${targetRole}`,
  }));

  const highPriorityGaps = skillGaps.filter((g) => g.priority === "Critical" || g.priority === "High");
  const mediumPriorityGaps = skillGaps.filter((g) => g.priority === "Medium");
  const lowPriorityGaps = skillGaps.filter((g) => g.priority === "Low");

  // 4. Learning Roadmap breakdown
  const recommendations = (skillProfile?.recommendations || []).map((r) => ({
    skill: r.skill,
    title: r.title,
    type: r.type,
    description: r.description,
    isCompleted: Boolean(r.isCompleted),
  }));

  const completedRoadmapItems = recommendations.filter((r) => r.isCompleted).length;
  const totalRoadmapItems = recommendations.length;
  const roadmapProgressPercent =
    totalRoadmapItems > 0 ? Math.round((completedRoadmapItems / totalRoadmapItems) * 100) : 0;

  // 5. GitHub Breakdown
  const isGhConnected = Boolean(settings?.githubIntegration?.connected || githubRecord || user?.githubUrl);
  const repositories = githubRecord?.repositories || [];
  const reposWithDesc = repositories.filter((r) => r.description && r.description.trim().length > 0).length;
  const reposWithReadme = repositories.filter((r) => r.sizeKB >= 10 || (r.description && r.description.length >= 15)).length;

  const descriptionCoverage =
    repositories.length > 0 ? Math.round((reposWithDesc / repositories.length) * 100) : 0;
  const readmeCoverage =
    repositories.length > 0 ? Math.round((reposWithReadme / repositories.length) * 100) : 0;

  const topLanguages = Object.entries(githubRecord?.languages || {})
    .map(([name, val]) => ({
      name,
      percentage: val?.percentage || 0,
      repoCount: val?.repoCount || 0,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // 6. Coding Problem Submissions
  const uniqueAttemptedTasks = new Set(codingSubs.map((s) => s.taskId));
  const passedSubs = codingSubs.filter((s) => s.status === "passed" || s.passed > 0);
  const uniqueSolvedTasks = new Set(passedSubs.map((s) => s.taskId));
  const codingSuccessRate =
    codingSubs.length > 0 ? Math.round((passedSubs.length / codingSubs.length) * 100) : 0;

  // 7. Smart Mentor Breakdown
  const mentorMessages = mentorConvo?.messages || [];
  const mentorActions = mentorMessages.flatMap((m) => m.actions || []);

  // 8. Dynamic Grounded Career Insights
  const insights = [];

  if (githubRecord && descriptionCoverage < 70) {
    insights.push({
      type: "warning",
      text: `Your GitHub description coverage is ${descriptionCoverage}%. Adding descriptions to all public repositories improves portfolio presentation.`,
    });
  } else if (!isGhConnected) {
    insights.push({
      type: "info",
      text: "Connect your GitHub account in Settings to enable automated repository analysis and code quality insights.",
    });
  }

  if (highPriorityGaps.length > 0) {
    insights.push({
      type: "gap",
      text: `${highPriorityGaps[0].skill} is currently your highest-priority skill gap for ${targetRole}.`,
    });
  }

  if (completedProgress.length > 0) {
    insights.push({
      type: "success",
      text: `You have completed ${completedProgress.length} EduTube video modules with ${learningHours}h total learning time.`,
    });
  } else if (watchHistory.length > 0) {
    insights.push({
      type: "info",
      text: "You have active in-progress lessons on EduTube. Completing them will increase your verified skill evidence.",
    });
  }

  if (projects.length > 0) {
    insights.push({
      type: "project",
      text: `You have ${projects.length} project(s) registered in your profile. Ensure they feature live demo links or detailed READMEs.`,
    });
  }

  // 9. Career Readiness Score
  // If skillProfile provides a computed score, use it; otherwise provide a grounded estimation or null
  const readinessScore = skillProfile?.overallReadinessScore ?? (
    evaluatedSkills.length > 0
      ? Math.min(95, Math.round(
          (strongSkills.length * 15 + improvingSkills.length * 8 + (projects.length >= 2 ? 20 : 10) + (resumes.length > 0 ? 15 : 0))
        ))
      : null
  );

  const payload = {
    overview: {
      targetRole,
      readinessScore,
      totalSkills: evaluatedSkills.length || (user?.skillLanguages?.length || 0) + (user?.skillFrameworks?.length || 0),
      learningHours,
      githubHealthScore: githubRecord?.aiInsights?.githubOptimizationScore ?? (repositories.length > 0 ? 70 : null),
      projectsCount: projects.length,
      resumesCount: resumes.length,
      portfoliosCount: portfolios.length,
      codingSolvedCount: uniqueSolvedTasks.size,
    },
    learning: {
      videosWatched: watchHistory.length,
      completedVideos: completedProgress.length,
      learningHours,
      savedCount: savedVideos.length,
      playlistsCount: playlists.length,
      weeklyActivity: last7Days,
      recentVideos: watchHistory.slice(0, 5).map((w) => ({
        videoId: w.videoId,
        title: w.title,
        channelTitle: w.channelTitle,
        thumbnail: w.thumbnail,
        watchedAt: w.watchedAt,
      })),
      continueLearning: progressList
        .filter((p) => !p.completed && p.positionSeconds > 0)
        .slice(0, 3)
        .map((p) => ({
          videoId: p.videoId,
          percentage: p.percentage,
          positionSeconds: p.positionSeconds,
          durationSeconds: p.durationSeconds,
        })),
    },
    skills: {
      total: evaluatedSkills.length,
      skills: evaluatedSkills,
      strong: strongSkills,
      improving: improvingSkills,
      needsAttention: needsAttentionSkills,
      lastEvaluatedAt: skillProfile?.lastEvaluatedAt || null,
    },
    gaps: {
      total: skillGaps.length,
      items: skillGaps,
      highPriority: highPriorityGaps,
      mediumPriority: mediumPriorityGaps,
      lowPriority: lowPriorityGaps,
    },
    roadmap: {
      totalItems: totalRoadmapItems,
      completedItems: completedRoadmapItems,
      progressPercent: roadmapProgressPercent,
      items: recommendations,
    },
    github: {
      connected: isGhConnected,
      username: githubRecord?.githubUsername || user?.githubUrl?.split("/").pop() || "",
      repositoryCount: repositories.length,
      totalStars: githubRecord?.aggregateStats?.totalStars || 0,
      dominantLanguage: githubRecord?.dominantLanguage || "",
      topLanguages,
      descriptionCoverage,
      readmeCoverage,
      optimizationScore: githubRecord?.aiInsights?.githubOptimizationScore ?? null,
      strengths: githubRecord?.aiInsights?.strengths || [],
      weaknesses: githubRecord?.aiInsights?.weaknesses || [],
    },
    resume: {
      count: resumes.length,
      formats: Array.from(new Set(resumes.map((r) => r.format))),
      recentResumes: resumes.slice(0, 5).map((r) => ({
        id: r._id,
        title: r.title,
        format: r.format,
        updatedAt: r.updatedAt,
      })),
    },
    portfolio: {
      count: portfolios.length,
      publishedCount: portfolios.filter((p) => Boolean(p.url)).length,
      items: portfolios.map((p) => ({
        id: p._id,
        projectName: p.projectName,
        url: p.url,
        customDomain: p.customDomain,
        publishedAt: p.publishedAt,
      })),
    },
    coding: {
      totalSubmissions: codingSubs.length,
      attemptedCount: uniqueAttemptedTasks.size,
      solvedCount: uniqueSolvedTasks.size,
      successRate: codingSuccessRate,
      languages: Array.from(new Set(codingSubs.map((s) => s.language))),
      recentSubmissions: codingSubs.slice(0, 5).map((s) => ({
        taskId: s.taskId,
        language: s.language,
        status: s.status,
        submittedAt: s.submittedAt,
      })),
    },
    mentor: {
      conversationsCount: mentorConvo ? 1 : 0,
      messagesCount: mentorMessages.length,
      actionsGenerated: mentorActions.length,
      lastInteractionAt: mentorConvo?.updatedAt || null,
    },
    insights,
    timeRange: range,
  };

  return res.status(200).json(new ApiResponse(200, payload, "User analytics retrieved successfully"));
});
