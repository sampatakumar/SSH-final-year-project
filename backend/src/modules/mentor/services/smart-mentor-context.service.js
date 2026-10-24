import mongoose from "mongoose";
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
import { EduTubeCheckpointAttempt } from "../../edutube/models/edutubeCheckpointAttempt.models.js";
import { SpacedRevisionSchedule } from "../../skills/models/spacedRevisionSchedule.models.js";
import { evaluateStudentCompetencyMatrix } from "../../skills/services/competencyMatrix.service.js";
import { getUserBadges } from "../../skills/services/badgeIssuance.service.js";
import { normalizeAcademicProfile } from "../../academic/services/academicNormalization.service.js";
import { getBranchCapabilities } from "../../academic/services/branchCapabilityRegistry.service.js";
import { StudentProject } from "../../academic/models/studentProject.models.js";
import { AssessmentAttempt } from "../../academic/models/assessmentAttempt.models.js";

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

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    const hasCheckpointMock = Boolean(EduTubeCheckpointAttempt.find?.mock);
    const hasSpacedMock = Boolean(SpacedRevisionSchedule.find?.mock);

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
      checkpointAttempts,
      spacedSchedules,
      competencyMatrixResult,
      userBadges,
      studentProjects,
      assessmentAttempts,
    ] = await Promise.all([
      (isDbConnected || User.findById?.mock) ? User.findById(ownerId).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || UserSettings.findOne?.mock) ? UserSettings.findOne({ owner: ownerId }).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || SkillProfile.findOne?.mock) ? SkillProfile.findOne({ owner: ownerId }).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || GitHubAnalysis.findOne?.mock) ? GitHubAnalysis.findOne({ owner: ownerId }).sort({ updatedAt: -1 }).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || Project.find?.mock) ? Project.find({ owner: ownerId }).limit(10).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || Resume.find?.mock) ? Resume.find({ owner: ownerId }).limit(5).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || EduTubeWatchHistory.find?.mock) ? EduTubeWatchHistory.find({ owner: ownerId }).sort({ watchedAt: -1 }).limit(10).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || EduTubeProgress.find?.mock) ? EduTubeProgress.find({ owner: ownerId, completed: true }).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || EduTubeSavedVideo.find?.mock) ? EduTubeSavedVideo.find({ owner: ownerId }).limit(10).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || EduTubePlaylist.find?.mock) ? EduTubePlaylist.find({ owner: ownerId }).limit(10).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || CodingSubmission.find?.mock) ? CodingSubmission.find({ owner: ownerId }).limit(50).lean().catch(() => []) : Promise.resolve([]),
      (isDbConnected || hasCheckpointMock)
        ? EduTubeCheckpointAttempt.find({ owner: ownerId }).sort({ attemptedAt: -1 }).limit(20).lean().catch(() => [])
        : Promise.resolve([]),
      (isDbConnected || hasSpacedMock)
        ? SpacedRevisionSchedule.find({ owner: ownerId }).sort({ scheduledDate: 1 }).limit(20).lean().catch(() => [])
        : Promise.resolve([]),
      isDbConnected
        ? evaluateStudentCompetencyMatrix(ownerId).catch(() => ({ matrix: [], summary: {} }))
        : Promise.resolve({ matrix: [], summary: {} }),
      isDbConnected
        ? getUserBadges(ownerId).catch(() => [])
        : Promise.resolve([]),
      (isDbConnected || StudentProject.find?.mock)
        ? StudentProject.find({ owner: ownerId }).sort({ updatedAt: -1 }).limit(10).lean().catch(() => [])
        : Promise.resolve([]),
      (isDbConnected || AssessmentAttempt.find?.mock)
        ? AssessmentAttempt.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(10).lean().catch(() => [])
        : Promise.resolve([]),
    ]);

    // 1. Career / User Summary
    const targetRole = user?.targetRole || skillProfile?.targetRole || "Full Stack Developer";
    const readinessScore = skillProfile?.overallReadinessScore ?? 65;

    const normalizedAcademic = normalizeAcademicProfile(user?.academic);
    const branchCapabilities = getBranchCapabilities(normalizedAcademic.branchSlug);

    const academic = {
      ...normalizedAcademic,
      disciplineFamily: branchCapabilities.disciplineFamily,
      capabilities: branchCapabilities.capabilities,
    };

    const targetRoles = Array.isArray(user?.targetRoles) && user.targetRoles.length > 0
      ? user.targetRoles
      : [targetRole];

    const careerInterests = Array.isArray(user?.careerInterests)
      ? user.careerInterests
      : [];

    const career = {
      name: user?.displayName || "Student Developer",
      targetRole,
      targetRoles,
      careerInterests,
      academic,
      headline: user?.headline || "",
      readinessScore,
      education: (user?.educationEntries || []).map((e) => `${e.degree || "Degree"} in ${e.specialization || "Engineering"}`),
      experienceYears: user?.experience?.length ? `${user.experience.length} roles recorded` : "Entry Level / Student",
    };

    // 2. Skills & Matrix (Distinguishing Observed Evidence from Inferences)
    const skills = (skillProfile?.skills || []).map((s) => ({
      name: s.skill,
      level: s.level || "Limited Evidence",
      score: s.score || 0,
      category: s.category || "General",
      confidence: s.confidence || (Array.isArray(s.sources) && s.sources.length >= 2 ? "high" : "medium"),
      evidenceSources: s.sources || ["inferred"],
      isDirectEvidence: Boolean(Array.isArray(s.sources) && (s.sources.includes("coding") || s.sources.includes("assessment"))),
    }));

    // 3. Skill Gaps (Distinguishing Missing Evidence from Demonstrated Weakness)
    const skillGaps = (skillProfile?.skillGaps || []).map((g) => ({
      skill: g.skill,
      priority: g.priority || "Medium",
      currentScore: g.currentScore || 0,
      targetScore: g.targetScore || 75,
      evidenceState: g.evidenceState || (g.currentScore === 0 ? "missing_evidence" : "demonstrated_weakness"),
      howToDemonstrate: g.howToDemonstrate || (g.currentScore === 0 ? "Submit original project or pass sandbox coding challenge" : "Add automated tests and production architecture"),
      reason: g.reason || `Essential for ${targetRole}`,
    }));

    // 4. Roadmap & Recommendations
    const roadmap = (skillProfile?.recommendations || []).map((r) => ({
      skill: r.skill,
      title: r.title,
      type: r.type,
      description: r.description,
      isCompleted: Boolean(r.isCompleted),
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
      completedMilestonesCount: completedProgress.length,
      activeRoadmapSteps: (skillProfile?.recommendations || []).filter((r) => !r.isCompleted).length,
      completedRoadmapSteps: (skillProfile?.recommendations || []).filter((r) => r.isCompleted).length,
    };

    // 7. Projects
    const userProjects = projects.map((p) => ({
      name: p.title,
      description: p.description || "",
      technologies: p.stack || [],
      hasGithubUrl: Boolean(p.githubUrl),
      hasDemoUrl: Boolean(p.demoUrl),
    }));

    // 7b. Phase 43: Branch-Aware Project Studio
    const activeStudentProjects = studentProjects.filter((p) =>
      ["in_progress", "submitted", "changes_requested"].includes(p.status)
    );
    const completedStudentProjects = studentProjects.filter((p) => p.status === "completed");

    const projectStudio = {
      totalProjects: studentProjects.length,
      inProgressCount: studentProjects.filter((p) => p.status === "in_progress").length,
      submittedCount: studentProjects.filter((p) => p.status === "submitted").length,
      changesRequestedCount: studentProjects.filter((p) => p.status === "changes_requested").length,
      completedCount: completedStudentProjects.length,
      activeProjects: activeStudentProjects.map((p) => ({
        projectId: p._id,
        templateId: p.templateId,
        title: p.title,
        status: p.status,
        disciplineCategory: p.disciplineCategory,
        progressPercentage: p.progressPercentage || 0,
        completedMilestones: (p.milestoneProgress || []).filter((m) => m.completed).length,
        totalMilestones: (p.milestoneProgress || []).length,
        submittedDeliverables: (p.deliverables || []).length,
        overallScore: p.evaluation?.overallScore ?? null,
      })),
      completedProjects: completedStudentProjects.map((p) => ({
        projectId: p._id,
        templateId: p.templateId,
        title: p.title,
        disciplineCategory: p.disciplineCategory,
        overallScore: p.evaluation?.overallScore ?? null,
        completedAt: p.completedAt,
        relevantSkills: p.relevantSkills || [],
        portfolioVisibility: p.portfolioVisibility,
        syncedToResume: p.syncedToResume,
      })),
    };

    // 8. Assessment Center (Phase 44)
    const submittedAttempts = assessmentAttempts.filter((a) => a.status === "submitted");
    const passedAssessments = submittedAttempts.filter((a) => a.isPassing || a.percentage >= 70);
    const failedAssessments = submittedAttempts.filter((a) => !a.isPassing && a.percentage < 70);

    const assessmentCenter = {
      totalAttempts: assessmentAttempts.length,
      submittedCount: submittedAttempts.length,
      passedCount: passedAssessments.length,
      failedCount: failedAssessments.length,
      averageScore: submittedAttempts.length > 0
        ? Math.round(submittedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / submittedAttempts.length)
        : 0,
      recentAttempts: submittedAttempts.slice(0, 3).map((a) => ({
        attemptId: a._id,
        assessmentId: a.assessmentId,
        score: a.score,
        maxScore: a.maxScore,
        percentage: a.percentage,
        isPassing: a.isPassing,
        strengths: a.strengths || [],
        areasForImprovement: a.areasForImprovement || [],
        submittedAt: a.submittedAt || a.createdAt,
      })),
      retryRecommended: failedAssessments.length > 0 ? failedAssessments[0].assessmentId : null,
    };

    // 9. Resume Signals
    const latestResume = resumes[0] || null;
    const resume = {
      resumeCount: resumes.length,
      hasSummary: Boolean(latestResume?.professionalSummary || user?.about || user?.headline),
      hasExperience: Boolean(
        (latestResume?.experience && latestResume.experience.length > 0) ||
        (user?.experience && user.experience.length > 0)
      ),
      hasEducation: Boolean(
        (latestResume?.education && latestResume.education.length > 0) ||
        (user?.educationEntries && user.educationEntries.length > 0)
      ),
      latestResumeTitle: latestResume?.title || null,
      latestAtsScore: latestResume?.atsScore?.score ?? null,
      latestQualityScore: latestResume?.qualityScore?.score ?? null,
      hasProjects: Boolean(latestResume?.projects && latestResume.projects.length > 0),
    };

    // 9. Coding Problem Submissions
    const passedProblems = codingSubs.filter((s) => s.status === "passed" || s.passed);
    const failedProblems = codingSubs.filter((s) => s.status === "failed");
    const timeoutCount = codingSubs.filter((s) => s.status === "timeout").length;
    const systemErrorCount = codingSubs.filter((s) => s.status === "system_error").length;

    const coding = {
      totalSubmissions: codingSubs.length,
      passedCount: passedProblems.length,
      failedCount: failedProblems.length,
      timeoutCount,
      systemErrorCount,
      passRate: codingSubs.length > 0 ? Math.round((passedProblems.length / codingSubs.length) * 100) : 0,
      verifiedChallenges: passedProblems.map((p) => p.taskId || p.taskTitle).filter(Boolean).slice(0, 5),
    };

    // 10. Phase 40 & 41: Competency Matrix & Verified Badges
    const demonstratedCompetencies = (competencyMatrixResult.matrix || []).filter(
      (m) => m.status === "demonstrated_at_specified_level"
    );
    const incompleteCompetencies = (competencyMatrixResult.matrix || []).filter(
      (m) => m.status === "evidence_incomplete"
    );
    const activeBadges = (userBadges || []).filter((b) => b.status === "active");

    const competencyMatrix = {
      summary: competencyMatrixResult.summary || {
        totalCompetencies: (competencyMatrixResult.matrix || []).length,
        demonstratedCount: demonstratedCompetencies.length,
        incompleteCount: incompleteCompetencies.length,
        notAssessedCount: (competencyMatrixResult.matrix || []).filter((m) => m.status === "not_assessed").length,
        totalBadgesEarned: activeBadges.length,
        rubricVersion: "1.0.0",
      },
      demonstrated: demonstratedCompetencies.map((d) => ({
        competencyId: d.competencyId,
        name: d.name,
        canonicalSkill: d.canonicalSkill,
        roles: d.roles,
        earnedBadges: (d.earnedBadges || []).map((b) => b.badgeType),
      })),
      incomplete: incompleteCompetencies.slice(0, 5).map((inc) => ({
        competencyId: inc.competencyId,
        name: inc.name,
        canonicalSkill: inc.canonicalSkill,
        missingRequirements: inc.missingRequirements,
        recommendedNextAction: inc.recommendedNextAction,
      })),
      earnedBadges: activeBadges.map((b) => ({
        badgeId: b.badgeId,
        badgeType: b.badgeType,
        competencyId: b.competencyId,
        competencyName: b.competencyName,
        issuedAt: b.issuedAt,
        rubricVersion: b.rubricVersion,
      })),
    };

    // 11. Retention Health & Spaced Revision
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    const revisionsDueToday = spacedSchedules.filter(
      (s) => (!s.status || s.status === "pending") && new Date(s.scheduledDate) <= endOfToday
    );
    const maxRetrievalStreak = spacedSchedules.reduce(
      (max, s) => Math.max(max, s.consecutiveSuccesses || s.reviewStreak || s.streak || 0),
      0
    );
    const masteredCards = spacedSchedules.filter((s) => (s.stage || 0) >= 2 || (s.consecutiveSuccesses || 0) >= 2 || (s.reviewStreak || 0) >= 2);

    const retentionHealth = {
      streak: maxRetrievalStreak,
      revisionsDueToday: revisionsDueToday.length,
      schedulesCount: spacedSchedules.length,
      masteredCardsCount: masteredCards.length,
      overdueSkills: revisionsDueToday.map((r) => r.skill).slice(0, 4),
    };

    // 12. Knowledge Checkpoints (EduTube Quizzes)
    const passedCheckpoints = checkpointAttempts.filter((att) => att.isCorrect || (att.score && att.score >= 70));
    const knowledgeCheckpoints = {
      totalAttempts: checkpointAttempts.length,
      passedCount: passedCheckpoints.length,
      recentAttempts: checkpointAttempts.slice(0, 3).map((att) => ({
        checkpointId: att.checkpointId,
        skill: att.skill || att.canonicalName || "Concept",
        isCorrect: att.isCorrect,
        score: att.score,
        attemptedAt: att.attemptedAt,
      })),
    };

    // 13. Evidence Tiers Classification (Empirical Grounding)
    const verifiedSkillNames = new Set([
      ...passedProblems.flatMap((p) => p.skillsCovered || [p.taskId]),
      ...passedCheckpoints.map((c) => c.skill || c.canonicalName),
      ...masteredCards.map((s) => s.skill),
      ...demonstratedCompetencies.map((d) => d.canonicalSkill),
    ].filter(Boolean).map((s) => s.toLowerCase()));

    const evidenceTiers = {
      verified: skills.filter((s) => verifiedSkillNames.has(s.name.toLowerCase())),
      inferred: skills.filter((s) => !verifiedSkillNames.has(s.name.toLowerCase()) && s.score > 0),
      selfReported: careerInterests.map((interest) => ({ name: interest, source: "career_interests" })),
      missing: skillGaps.filter((g) => g.currentScore === 0),
    };

    // 14. Unified Next Actions (Cross-Module Orchestration)
    const unifiedNextActions = [];

    // Priority 1: Due Spaced Revision
    if (revisionsDueToday.length > 0) {
      unifiedNextActions.push({
        id: "action_due_revision",
        title: `Spaced Revision: ${revisionsDueToday[0].skill}`,
        type: "spaced_revision",
        targetSkill: revisionsDueToday[0].skill,
        actionUrl: "/dashboard/skills",
        estimatedMinutes: 10,
        priority: "critical",
        reason: "Scheduled review due today to solidify long-term memory retrieval.",
        evidenceTier: "RETENTION",
        module: "skills",
      });
    }

    // Priority 2: Incomplete Competency or High-Priority Skill Gap Challenge
    if (incompleteCompetencies.length > 0) {
      const inc = incompleteCompetencies[0];
      const targetRoute = inc.recommendedNextAction?.targetModule === "coding"
        ? "/dashboard/coding"
        : inc.recommendedNextAction?.targetModule === "edutube"
        ? "/dashboard/edutube"
        : "/dashboard/skills";

      unifiedNextActions.push({
        id: "action_competency_gap",
        title: inc.recommendedNextAction?.title || `Complete ${inc.canonicalSkill} Requirements`,
        type: inc.recommendedNextAction?.actionType || "competency_criterion",
        targetSkill: inc.canonicalSkill,
        actionUrl: targetRoute,
        estimatedMinutes: 25,
        priority: "high",
        reason: `Qualify for the ${inc.name} competency badge by satisfying remaining criteria.`,
        evidenceTier: "COMPETENCY",
        module: inc.recommendedNextAction?.targetModule || "skills",
      });
    } else if (skillGaps.length > 0) {
      unifiedNextActions.push({
        id: "action_skill_gap",
        title: `Solve ${skillGaps[0].skill} Sandbox Challenge`,
        type: "coding_task",
        targetSkill: skillGaps[0].skill,
        actionUrl: "/dashboard/coding",
        estimatedMinutes: 30,
        priority: "high",
        reason: `Highest priority gap for ${targetRole}. Sandbox test execution establishes verified skill proof.`,
        evidenceTier: "APPLIED",
        module: "coding",
      });
    }

    // Priority 3: Milestone / Resume Badge Import
    if (activeBadges.length > 0) {
      unifiedNextActions.push({
        id: "action_resume_badge",
        title: "Import Verified Badges to Resume",
        type: "resume_enhancement",
        targetSkill: activeBadges[0].competencyName,
        actionUrl: "/dashboard/resumes",
        estimatedMinutes: 5,
        priority: "medium",
        reason: `Add your verified ${activeBadges[0].competencyName} badge to your resume achievements.`,
        evidenceTier: "PORTFOLIO",
        module: "resume",
      });
    } else if (learning.continueLearningTitle) {
      unifiedNextActions.push({
        id: "action_continue_learning",
        title: `Continue: ${learning.continueLearningTitle}`,
        type: "video_lesson",
        targetSkill: targetRole,
        actionUrl: "/dashboard/edutube",
        estimatedMinutes: 20,
        priority: "medium",
        reason: "Resume in-progress video course module on EduTube.",
        evidenceTier: "KNOWLEDGE",
        module: "edutube",
      });
    }

      // Priority 4: Project Studio Milestone / Revision
    if (activeStudentProjects.length > 0) {
      const topActive = activeStudentProjects[0];
      const isChangesRequested = topActive.status === "changes_requested";
      unifiedNextActions.push({
        id: "action_project_studio",
        title: isChangesRequested
          ? `Revise Deliverables: ${topActive.title}`
          : `Continue Project: ${topActive.title}`,
        type: "project_milestone",
        targetSkill: topActive.title,
        actionUrl: "/dashboard/projects",
        estimatedMinutes: 30,
        priority: isChangesRequested ? "high" : "medium",
        reason: isChangesRequested
          ? `Address rubric evaluation feedback to complete ${topActive.title}.`
          : `Submit upcoming milestone deliverables for ${topActive.title}.`,
        evidenceTier: "PROJECT_STUDIO",
        module: "projects",
      });
    }

    // Priority 5: Assessment Center Remediation / Retake (Phase 44)
    if (failedAssessments.length > 0) {
      const topFailed = failedAssessments[0];
      const weakTopic = (topFailed.areasForImprovement && topFailed.areasForImprovement[0]) || "core topics";
      unifiedNextActions.push({
        id: "action_assessment_center_retry",
        title: `Remediate ${weakTopic}: Retry Assessment`,
        type: "assessment_retry",
        targetSkill: weakTopic,
        actionUrl: `/dashboard/assessments`,
        estimatedMinutes: 20,
        priority: "high",
        reason: `Previous attempt scored ${topFailed.percentage}%. Review ${weakTopic} to achieve the 70% passing threshold.`,
        evidenceTier: "ASSESSMENT_CENTER",
        module: "assessments",
      });
    }

    // 15. Proactive Insights (Grounding across all modules)
    const insights = [];

    if (assessmentCenter.passedCount > 0) {
      insights.push(
        `📝 Assessment Center: Demonstrated passing proficiency in ${assessmentCenter.passedCount} discipline assessment(s) (Avg: ${assessmentCenter.averageScore}%).`
      );
    } else if (assessmentCenter.failedCount > 0) {
      insights.push(
        `⚠️ Assessment Center: Recent assessment scored below 70%. Targeted topic remediation is recommended.`
      );
    }

    if (projectStudio.completedCount > 0) {
      insights.push(
        `📁 Project Studio: You have completed ${projectStudio.completedCount} guided project(s) with rubric-assessed evidence.`
      );
    } else if (projectStudio.inProgressCount > 0) {
      const activeProj = projectStudio.activeProjects[0];
      insights.push(
        `🛠️ Project Studio: "${activeProj.title}" is currently active (${activeProj.progressPercentage}% complete).`
      );
    }

    if (activeBadges.length > 0) {
      insights.push(
        `🏅 Verified Credentials: You have earned ${activeBadges.length} Smart Skill Hub competency badge(s): ${activeBadges.map((b) => b.competencyName).slice(0, 2).join(", ")}.`
      );
    }

    if (retentionHealth.revisionsDueToday > 0) {
      insights.push(
        `⏳ Retention Alert: ${retentionHealth.revisionsDueToday} spaced revision review(s) are due today to prevent memory decay.`
      );
    } else if (retentionHealth.streak >= 2) {
      insights.push(
        `🧠 Memory Retention: Strong ${retentionHealth.streak}-review consecutive retrieval streak maintained.`
      );
    }

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
    }

    if (academic.isConfigured) {
      const yearSem = academic.currentYear ? `Year ${academic.currentYear}` : (academic.currentSemester ? `Sem ${academic.currentSemester}` : "");
      const branchDegree = [academic.branchName, academic.degreeName].filter(Boolean).join(", ");
      insights.push(
        `🏛️ Academic Pathway: ${branchDegree}${yearSem ? ` (${yearSem})` : ""}. Guidance is aligned with your verified degree.`
      );
    }

    insights.push(
      `💼 Current Target Role: ${targetRole} • Skill Readiness Score: ${readinessScore}/100.`
    );

    let adaptivePlan = null;
    try {
      if (isDbConnected) {
        const { adaptiveLearningPlanService } = await import("../../recommendations/services/adaptiveLearningPlan.service.js");
        adaptivePlan = await adaptiveLearningPlanService.generateAdaptivePlan(ownerId, targetRole);
      }
    } catch {
      // Non-blocking fallback
    }

    const context = {
      career,
      skills,
      skillGaps,
      roadmap,
      github,
      learning,
      projects: userProjects,
      projectStudio,
      assessmentCenter,
      resume,
      coding,
      competencyMatrix,
      earnedBadges: activeBadges,
      retentionHealth,
      knowledgeCheckpoints,
      evidenceTiers,
      unifiedNextActions: unifiedNextActions.slice(0, 3),
      adaptivePlan: adaptivePlan
        ? {
            currentObjective: adaptivePlan.currentObjective,
            nextAction: adaptivePlan.nextAction,
            verifiedCompetenciesCount: adaptivePlan.verifiedCompetenciesCount,
            pendingActionsCount: adaptivePlan.pendingActionsCount,
          }
        : null,
      insights: insights.slice(0, 5),
      updatedAt: new Date().toISOString(),
    };

    this.setCachedContext(ownerId, context);
    return context;
  }
}

export const smartMentorContextService = new SmartMentorContextService();
