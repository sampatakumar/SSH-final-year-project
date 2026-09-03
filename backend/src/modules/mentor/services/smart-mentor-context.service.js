import { User } from "../../../core/database/models/user.models.js";
import { UserSettings } from "../../settings/models/userSettings.models.js";
import { SkillProfile } from "../../skills/models/skillProfile.models.js";
import { GitHubAnalysis } from "../../github/models/githubAnalysis.models.js";
import { Project } from "../../resume/models/project.models.js";
import { Resume } from "../../resume/models/resume.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
} from "../../edutube/models/index.js";

// 10-minute in-memory context cache
const CONTEXT_CACHE = new Map();
const CONTEXT_CACHE_TTL_MS = 10 * 60 * 1000;

export class SmartMentorContextService {
  /**
   * Get cached context if valid
   */
  getCachedContext(ownerId) {
    const key = `mentorContext:${ownerId.toString()}`;
    const cached = CONTEXT_CACHE.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > CONTEXT_CACHE_TTL_MS) {
      CONTEXT_CACHE.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set context in cache
   */
  setCachedContext(ownerId, data) {
    const key = `mentorContext:${ownerId.toString()}`;
    CONTEXT_CACHE.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate context cache for a user
   */
  invalidateContext(ownerId) {
    const key = `mentorContext:${ownerId.toString()}`;
    CONTEXT_CACHE.delete(key);
  }

  /**
   * Gather compact, grounded user context across all Smart Skill Hub sources.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated user MongoDB ID
   * @param {object} options - { forceRefresh }
   * @returns {Promise<object>} Compact normalized context
   */
  async getUnifiedUserContext(ownerId, { forceRefresh = false } = {}) {
    if (!forceRefresh) {
      const cached = this.getCachedContext(ownerId);
      if (cached) return cached;
    }

    const [
      user,
      settings,
      skillProfile,
      githubRecord,
      projects,
      resumes,
      watchHistory,
      completedProgress,
      savedVideos,
      playlists,
      codingSubs,
    ] = await Promise.all([
      User.findById(ownerId).lean().catch(() => null),
      UserSettings.findOne({ owner: ownerId }).lean().catch(() => null),
      SkillProfile.findOne({ owner: ownerId }).lean().catch(() => null),
      GitHubAnalysis.findOne({ owner: ownerId }).sort({ updatedAt: -1 }).lean().catch(() => null),
      Project.find({ owner: ownerId }).limit(10).lean().catch(() => []),
      Resume.find({ owner: ownerId }).limit(5).lean().catch(() => []),
      EduTubeWatchHistory.find({ owner: ownerId }).sort({ watchedAt: -1 }).limit(10).lean().catch(() => []),
      EduTubeProgress.find({ owner: ownerId, completed: true }).lean().catch(() => []),
      EduTubeSavedVideo.find({ owner: ownerId }).limit(10).lean().catch(() => []),
      EduTubePlaylist.find({ owner: ownerId }).limit(10).lean().catch(() => []),
      CodingSubmission.find({ owner: ownerId }).limit(50).lean().catch(() => []),
    ]);

    // 1. Career / User Summary
    const targetRole = user?.targetRole || skillProfile?.targetRole || "Full Stack Developer";
    const readinessScore = skillProfile?.overallReadinessScore ?? 65;

    const career = {
      name: user?.displayName || user?.email?.split("@")[0] || "Developer",
      targetRole,
      headline: user?.headline || "",
      readinessScore,
      education: (user?.educationEntries || []).map((e) => `${e.degree || "Degree"} in ${e.specialization || "Engineering"}`),
      experienceYears: user?.experience?.length ? `${user.experience.length} roles recorded` : "Entry Level / Student",
    };

    // 2. Skills & Matrix
    const skills = (skillProfile?.skills || []).map((s) => ({
      name: s.skill,
      level: s.level || "Limited Evidence",
      score: s.score || 0,
      category: s.category || "General",
    }));

    // 3. Skill Gaps
    const skillGaps = (skillProfile?.skillGaps || []).map((g) => ({
      skill: g.skill,
      priority: g.priority || "Medium",
      currentScore: g.currentScore || 0,
      targetScore: g.targetScore || 75,
      reason: g.reason || `Essential for ${targetRole}`,
    }));

    // 4. Roadmap & Recommendations
    const roadmap = (skillProfile?.recommendations || []).map((r) => ({
      skill: r.skill,
      title: r.title,
      type: r.type,
      description: r.description,
    }));

    // 5. GitHub Connection & Intelligence
    const isGhConnected = Boolean(
      settings?.githubIntegration?.connected || githubRecord || user?.githubUrl
    );
    const syncStatus = settings?.githubIntegration?.syncStatus || (githubRecord ? "synced" : "idle");
    const syncError = settings?.githubIntegration?.syncError || "";

    const repositories = githubRecord?.repositories || [];
    const reposWithoutDescription = repositories.filter((r) => !r.description || !r.description.trim());
    const reposWithoutReadme = repositories.filter((r) => {
      return r.sizeKB < 10 && (!r.description || r.description.length < 15);
    });

    const topLanguages = Object.keys(githubRecord?.languages || {}).slice(0, 5);

    let connectionState = "not_connected";
    let connectionMessage = "GitHub isn't connected yet. Connect GitHub in Settings to let me analyze your repositories.";

    if (isGhConnected) {
      if (syncStatus === "failed") {
        connectionState = "sync_failed";
        connectionMessage = "GitHub is connected, but the latest synchronization failed. Try Sync Now in Settings.";
      } else if (repositories.length === 0 && !githubRecord) {
        connectionState = "connected_zero_repos";
        connectionMessage = "GitHub is connected, but no repository data has been synchronized yet. Try Sync Now in Settings.";
      } else {
        connectionState = "connected";
        connectionMessage = "GitHub is connected and your latest repository data is available.";
      }
    }

    const github = {
      username:
        settings?.githubIntegration?.githubUsername ||
        githubRecord?.githubUsername ||
        user?.githubUrl?.split("/").pop() ||
        "",
      connected: isGhConnected,
      connectionState,
      connectionMessage,
      syncStatus,
      syncError,
      hasAnalysis: Boolean(githubRecord),
      repositoryCount: repositories.length,
      repositoriesWithoutDescription: reposWithoutDescription.length,
      repositoriesWithoutReadme: reposWithoutReadme.length,
      reposWithoutDescList: reposWithoutDescription.slice(0, 5).map((r) => r.name),
      reposWithoutReadmeList: reposWithoutReadme.slice(0, 5).map((r) => r.name),
      topLanguages: topLanguages.length > 0 ? topLanguages : [githubRecord?.dominantLanguage || "JavaScript"],
      totalStars: githubRecord?.aggregateStats?.totalStars || 0,
      optimizationScore: githubRecord?.aiInsights?.githubOptimizationScore || (repositories.length > 0 ? 70 : 0),
      strengths: githubRecord?.aiInsights?.strengths || [],
      weaknesses: githubRecord?.aiInsights?.weaknesses || [],
      readmeQualityTips: githubRecord?.aiInsights?.readmeQualityTips || [],
      portfolioTips: githubRecord?.aiInsights?.portfolioImprovementTips || [],
    };

    // 6. EduTube Learning Activity
    const learning = {
      videosWatched: watchHistory.length,
      completedVideos: completedProgress.length,
      savedCount: savedVideos.length,
      playlistsCount: playlists.length,
      recentTopics: watchHistory.slice(0, 4).map((h) => h.title),
      continueLearningTitle: watchHistory.find((h) => !h.completed)?.title || null,
    };

    // 7. Projects
    const userProjects = projects.map((p) => ({
      name: p.title,
      description: p.description || "",
      technologies: p.stack || [],
      hasGithubUrl: Boolean(p.githubUrl),
      hasDemoUrl: Boolean(p.demoUrl),
    }));

    // 8. Resume Signals
    const resume = {
      resumeCount: resumes.length,
      hasSummary: Boolean(user?.about || user?.headline),
      hasExperience: Boolean(user?.experience && user.experience.length > 0),
      hasEducation: Boolean(user?.educationEntries && user.educationEntries.length > 0),
    };

    // 9. Coding Problem Submissions
    const passedProblems = codingSubs.filter((s) => s.status === "passed" || s.passed);
    const coding = {
      totalSubmissions: codingSubs.length,
      passedCount: passedProblems.length,
    };

    // 10. Proactive Insights (2-4 grounded dynamic observations)
    const insights = [];

    if (github.hasAnalysis && github.repositoriesWithoutDescription > 0) {
      insights.push(
        `⚠️ ${github.repositoriesWithoutDescription} of your GitHub repositories currently lack descriptions.`
      );
    } else if (!github.hasAnalysis) {
      insights.push("💡 Connect and analyze your GitHub profile to unlock repository-level code guidance.");
    }

    if (skillGaps.length > 0) {
      const topGap = skillGaps[0];
      insights.push(
        `📈 ${topGap.skill} is currently your highest-priority skill gap (${topGap.priority} priority) for ${targetRole}.`
      );
    }

    if (learning.completedVideos > 0) {
      insights.push(
        `🎓 You have completed ${learning.completedVideos} lessons and watched ${learning.videosWatched} video modules on EduTube.`
      );
    } else if (learning.videosWatched > 0) {
      insights.push(
        `▶️ You have active in-progress lessons on EduTube. Consistency will accelerate your roadmap.`
      );
    }

    insights.push(
      `💼 Current Target Role: ${targetRole} • Skill Readiness Score: ${readinessScore}/100.`
    );

    const context = {
      career,
      skills,
      skillGaps,
      roadmap,
      github,
      learning,
      projects: userProjects,
      resume,
      coding,
      insights: insights.slice(0, 4),
      updatedAt: new Date().toISOString(),
    };

    this.setCachedContext(ownerId, context);
    return context;
  }
}

export const smartMentorContextService = new SmartMentorContextService();
