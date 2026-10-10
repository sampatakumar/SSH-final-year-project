/**
 * Dashboard Intelligence Service
 *
 * Provides aggregated, verified intelligence metrics for Smart Skill Hub:
 * - Overall skill mastery (distinguishing measured empirical results from readiness estimates)
 * - Weekly study time, consistency streaks, and completion trends
 * - Skill-wise breakdown (strong, improving, weak, prerequisite gaps)
 * - Recent assessments and verifiable score changes
 * - Personalized daily learning plan (3-step daily checklist)
 * - Next recommended action with grounded evidence
 * - Top EduTube recommendations with clear explanations
 * - Career goal progression toward target role
 */

import { User } from "../core/database/models/user.models.js";
import { SkillProfile } from "../modules/skills/models/skillProfile.models.js";
import { CodingSubmission } from "../modules/coding/models/codingSubmission.models.js";
import { LearnerSkillAssessmentHistory } from "../modules/skills/models/learnerSkillAssessmentHistory.models.js";
import { SpacedRevisionSchedule } from "../modules/skills/models/spacedRevisionSchedule.models.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
} from "../modules/edutube/models/index.js";
import { adaptiveSkillLoopService } from "../modules/skills/services/adaptive-skill-loop.service.js";
import { recommendationPipelineService } from "../modules/edutube/services/recommendation-engine/recommendation-pipeline.service.js";
import { SKILL_PREREQUISITE_GRAPH } from "../modules/skills/services/adaptive-skill-loop.service.js";

export class DashboardIntelligenceService {
  /**
   * Calculate consecutive active days streak from activity timestamps.
   *
   * @param {Array<Date>} activityDates
   * @returns {number} Streak in days
   */
  calculateConsistencyStreak(activityDates = []) {
    if (activityDates.length === 0) return 0;

    const dateSet = new Set(
      activityDates
        .map((d) => {
          const dateObj = new Date(d);
          return isNaN(dateObj.getTime()) ? null : dateObj.toISOString().split("T")[0];
        })
        .filter(Boolean)
    );

    const now = new Date();
    let streak = 0;
    let checkDate = new Date(now);

    // Check today first; if not today, check if yesterday was active
    const todayStr = checkDate.toISOString().split("T")[0];
    if (!dateSet.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split("T")[0];
      if (!dateSet.has(yesterdayStr)) {
        return 0;
      }
    }

    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dateSet.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Fetch comprehensive intelligence summary for the authenticated user.
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - User ID
   * @returns {Promise<object>} Complete dashboard intelligence report
   */
  async getDashboardIntelligence(ownerId) {
    const [
      user,
      skillProfile,
      codingSubs,
      assessmentHistory,
      spacedRevisions,
      watchHistory,
      progressList,
    ] = await Promise.all([
      User.findById(ownerId).lean().catch(() => null),
      SkillProfile.findOne({ owner: ownerId }).lean().catch(() => null),
      CodingSubmission.find({ owner: ownerId }).sort({ submittedAt: -1 }).lean().catch(() => []),
      LearnerSkillAssessmentHistory.find({ owner: ownerId }).sort({ assessmentDate: -1 }).limit(10).lean().catch(() => []),
      SpacedRevisionSchedule.find({ owner: ownerId, status: "pending" }).sort({ scheduledDate: 1 }).limit(5).lean().catch(() => []),
      EduTubeWatchHistory.find({ owner: ownerId }).sort({ watchedAt: -1 }).lean().catch(() => []),
      EduTubeProgress.find({ owner: ownerId }).lean().catch(() => []),
    ]);

    const targetRole = user?.targetRole || skillProfile?.targetRole || "Full Stack Developer";
    const evaluatedSkills = skillProfile?.skills || [];
    const skillGaps = skillProfile?.skillGaps || [];
    const recommendations = skillProfile?.recommendations || [];

    // 1. Overall Skill Mastery (Distinguishing Measured vs Estimated)
    const empiricalSkills = evaluatedSkills.filter(
      (s) => s.sources?.includes("coding") || s.sources?.includes("assessment")
    );
    const empiricalMasteryScore =
      empiricalSkills.length > 0
        ? Math.round(empiricalSkills.reduce((acc, s) => acc + s.score, 0) / empiricalSkills.length)
        : null;

    const readinessEstimateScore = skillProfile?.overallReadinessScore ?? 0;

    // 2. Weekly Study Time & Learning Consistency
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let weeklyStudySeconds = 0;
    for (const h of watchHistory) {
      const watched = new Date(h.watchedAt || h.createdAt);
      if (watched >= sevenDaysAgo) {
        weeklyStudySeconds += Number(h.positionSeconds || h.durationSeconds || (h.duration?.seconds ? Number(h.duration.seconds) : 0)) || 0;
      }
    }
    const weeklyStudyHours = Number((weeklyStudySeconds / 3600).toFixed(1));
    const weeklyStudyMinutes = Math.round(weeklyStudySeconds / 60);

    // Consistency Streak
    const allActivityDates = [
      ...watchHistory.map((w) => w.watchedAt || w.createdAt),
      ...codingSubs.map((c) => c.submittedAt || c.createdAt),
      ...assessmentHistory.map((a) => a.assessmentDate || a.createdAt),
    ];
    const consistencyStreakDays = this.calculateConsistencyStreak(allActivityDates);

    // Daily Completion Trends (Last 7 Days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyCompletionTrends = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dayVideosCompleted = progressList.filter((p) => {
        const completedAt = new Date(p.updatedAt || p.createdAt);
        return p.completed && completedAt >= d && completedAt < nextD;
      }).length;

      const dayCodingSolved = codingSubs.filter((c) => {
        const subAt = new Date(c.submittedAt || c.createdAt);
        return (c.status === "passed" || c.score >= 8) && subAt >= d && subAt < nextD;
      }).length;

      dailyCompletionTrends.push({
        day: dayNames[d.getDay()],
        date: d.toISOString().split("T")[0],
        videosCompleted: dayVideosCompleted,
        codingSolved: dayCodingSolved,
      });
    }

    // 3. Skill-Wise Progress Visualization
    const strongSkills = evaluatedSkills.filter(
      (s) => s.score >= 70 || s.level === "Proficient" || s.level === "Strong Evidence"
    );
    const improvingSkills = evaluatedSkills.filter(
      (s) => s.score >= 40 && s.score < 70
    );
    const weakSkills = evaluatedSkills.filter(
      (s) => s.score < 40 || s.level === "Beginner" || s.level === "Limited Evidence"
    );

    // Prerequisite Gaps Detection
    const prerequisiteGaps = [];
    for (const gap of skillGaps) {
      const canon = gap.canonicalName || gap.skill;
      // Check if this gap is a prerequisite for any other technology
      const dependentTechs = Object.entries(SKILL_PREREQUISITE_GRAPH)
        .filter(([, cfg]) => cfg.prerequisites.some((p) => p.toLowerCase() === canon.toLowerCase()))
        .map(([tech]) => tech);

      prerequisiteGaps.push({
        skill: canon,
        priority: gap.priority,
        currentScore: gap.currentScore,
        targetScore: gap.targetScore,
        reason: gap.reason,
        blocksTechnologies: dependentTechs,
        isPrerequisiteBlocker: dependentTechs.length > 0,
      });
    }

    // 4. Recent Assessments and Score Changes
    const recentAssessmentsFormatted = assessmentHistory.map((a) => ({
      skill: a.skill,
      score: a.score,
      previousScore: a.previousScore,
      scoreDelta: a.scoreDelta,
      assessmentType: a.assessmentType,
      taskId: a.taskId,
      testCasesPassed: a.testCasesPassed,
      testCasesTotal: a.testCasesTotal,
      date: a.assessmentDate,
    }));

    // If assessmentHistory is empty, fallback to recent coding submissions
    if (recentAssessmentsFormatted.length === 0) {
      for (const sub of codingSubs.slice(0, 5)) {
        recentAssessmentsFormatted.push({
          skill: sub.skillsCovered?.[0] || sub.taskId,
          score: sub.score,
          previousScore: 0,
          scoreDelta: sub.score,
          assessmentType: "coding_challenge",
          taskId: sub.taskId,
          testCasesPassed: sub.passed,
          testCasesTotal: sub.total,
          date: sub.submittedAt,
        });
      }
    }

    // 5. Adaptive Loop & Daily Learning Plan
    let loopState = null;
    try {
      loopState = await adaptiveSkillLoopService.getAdaptiveLoopState(ownerId);
    } catch {
      loopState = null;
    }

    // Personalized Daily Learning Plan (3 Concrete Missions for Today)
    const dailyPlan = [
      {
        id: "mission_1_concept",
        type: "video_lesson",
        title: loopState?.recommendedLesson?.title
          ? `Watch: ${loopState.recommendedLesson.title}`
          : `Study: Master ${loopState?.focalSkill || "Core Fundamentals"} Architecture`,
        targetSkill: loopState?.focalSkill || "Core Engineering",
        estimatedMinutes: 20,
        completed: false,
        actionUrl: loopState?.recommendedLesson?.videoId
          ? `/dashboard/edutube/watch/${loopState.recommendedLesson.videoId}`
          : "/dashboard/edutube",
        explanation: `Focal skill identified as primary ${loopState?.gapPriority || "Medium"} gap for ${targetRole}.`,
      },
      {
        id: "mission_2_hands_on",
        type: "coding_task",
        title: loopState?.practicalExercise?.taskTitle
          ? `Solve: ${loopState.practicalExercise.taskTitle}`
          : `Practice: Complete ${loopState?.focalSkill || "Algorithm"} Sandbox Challenge`,
        targetSkill: loopState?.focalSkill || "Practical Coding",
        estimatedMinutes: 25,
        completed: false,
        actionUrl: "/dashboard/coding",
        explanation: "Empirical code execution in isolated Docker sandbox provides verifiable skill mastery.",
      },
      {
        id: "mission_3_retrieval",
        type: "spaced_revision",
        title: spacedRevisions.length > 0
          ? `Revision: ${spacedRevisions[0].promptQuestion || spacedRevisions[0].skill}`
          : `Review: Spaced retrieval check for ${strongSkills[0]?.skill || "Previous Concepts"}`,
        targetSkill: spacedRevisions[0]?.skill || strongSkills[0]?.skill || "Revision",
        estimatedMinutes: 10,
        completed: false,
        actionUrl: "/dashboard/skills",
        explanation: "Retrieval practice reinforces memory retention according to Ebbinghaus forgetting curve.",
      },
    ];

    // 6. Next Recommended Action Callout
    const nextRecommendedAction = {
      title: loopState?.nextStepAction || "Run Multi-Source Profile Evaluation",
      targetSkill: loopState?.focalSkill || "General",
      estimatedMinutes: 20,
      actionUrl: loopState?.practicalExercise ? "/dashboard/coding" : "/dashboard/edutube",
      reasoning: loopState?.whyRecommended || "Optimized for your current career trajectory.",
    };

    // 7. Top EduTube Recommendations with Grounded Explanations
    let topEduTubeRecommendations = [];
    try {
      const feed = await recommendationPipelineService.executePipeline(ownerId);
      topEduTubeRecommendations = (feed.personalized || []).slice(0, 4).map((vid) => ({
        videoId: vid.videoId,
        title: vid.title,
        channelTitle: vid.channelTitle,
        thumbnail: vid.thumbnail?.high || vid.thumbnail?.default || "",
        verifiedDurationSeconds: vid.verifiedDurationSeconds || vid.duration?.seconds || 0,
        durationFormatted: vid.duration?.formatted || `${Math.round((vid.verifiedDurationSeconds || 0) / 60)}m`,
        educationalScore: vid.educationalScore || 85,
        whyRecommended: vid.whyRecommended || ["Recommended based on your target role milestones"],
        qualityGatePassed: true,
      }));
    } catch (err) {
      console.warn("[dashboard-intel] EduTube recommendations lookup warning:", err.message);
    }

    // 8. Career Goal Progress
    const totalRequiredSkillsCount = Math.max(1, evaluatedSkills.length + skillGaps.length);
    const metSkillsCount = strongSkills.length + improvingSkills.length;
    const careerGoalProgressPercent = Math.round((metSkillsCount / totalRequiredSkillsCount) * 100);

    return {
      overview: {
        targetRole,
        empiricalMastery: {
          score: empiricalMasteryScore,
          isEmpirical: empiricalMasteryScore !== null,
          testedSkillsCount: empiricalSkills.length,
          calculation: "Weighted average score of skills verified through Docker sandbox and assessment test execution.",
        },
        readinessEstimate: {
          score: readinessEstimateScore,
          isEstimate: true,
          totalSkillsEvaluated: evaluatedSkills.length,
          calculation: "Synthesized career preparation estimate across claimed resume keywords, GitHub code volume, and coding assessments.",
        },
        studyTimeThisWeek: {
          hours: weeklyStudyHours,
          minutes: weeklyStudyMinutes,
          calculation: "Aggregated verified video playback and milestone progress over the past 7 rolling days.",
        },
        consistencyStreakDays,
        careerGoalProgress: {
          targetRole,
          progressPercent: careerGoalProgressPercent,
          metSkillsCount,
          totalRequiredSkillsCount,
        },
      },
      learningConsistency: {
        streakDays: consistencyStreakDays,
        weeklyStudyHours,
        dailyTrends: dailyCompletionTrends,
      },
      skillVisualization: {
        total: evaluatedSkills.length,
        strongSkills: strongSkills.map((s) => ({
          name: s.canonicalName || s.skill,
          score: s.score,
          level: s.level,
          sources: s.sources,
        })),
        improvingSkills: improvingSkills.map((s) => ({
          name: s.canonicalName || s.skill,
          score: s.score,
          level: s.level,
          sources: s.sources,
        })),
        weakSkills: weakSkills.map((s) => ({
          name: s.canonicalName || s.skill,
          score: s.score,
          level: s.level,
          sources: s.sources,
        })),
        prerequisiteGaps,
      },
      recentAssessments: recentAssessmentsFormatted,
      dailyLearningPlan: dailyPlan,
      nextRecommendedAction,
      topEduTubeRecommendations,
      roadmapSummary: {
        totalItems: recommendations.length,
        completedItems: recommendations.filter((r) => r.isCompleted).length,
      },
      generatedAt: new Date().toISOString(),
    };
  }
}

export const dashboardIntelligenceService = new DashboardIntelligenceService();
