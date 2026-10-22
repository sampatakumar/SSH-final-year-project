import { SkillProfile } from "../models/skillProfile.models.js";
import { LearningActivityRecord } from "../models/learningActivityRecord.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { LearnerSkillAssessmentHistory } from "../models/learnerSkillAssessmentHistory.models.js";
import { adaptiveSkillLoopService } from "../services/adaptive-skill-loop.service.js";
import { evaluateUserProfile } from "../services/skillProfile.service.js";
import { generateUserRecommendations } from "../../recommendations/services/recommendation.service.js";
import { recommendationPipelineService } from "../../edutube/services/recommendation-engine/recommendation-pipeline.service.js";
import { smartMentorContextService } from "../../mentor/services/smart-mentor-context.service.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * Compute cross-module learning telemetry metrics for authenticated student.
 *
 * @param {string|mongoose.Types.ObjectId} ownerId
 * @param {object} [options]
 * @returns {Promise<object>} Telemetry metrics
 */
export async function computeStudentTelemetry(ownerId, { targetRole = "Full Stack Developer", profile = null } = {}) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    milestonesCompletedCount,
    todayMissionsCompletedCount,
    codingSubs,
    assessmentImprovements,
    persistedProfile,
  ] = await Promise.all([
    LearningActivityRecord.countDocuments({
      owner: ownerId,
      activityType: "roadmap_milestone",
      status: "completed",
    }),
    LearningActivityRecord.countDocuments({
      owner: ownerId,
      activityType: "daily_mission",
      status: "completed",
      recordedAt: { $gte: startOfDay },
    }),
    CodingSubmission.find({ owner: ownerId }).select("status score").lean(),
    LearnerSkillAssessmentHistory.countDocuments({
      owner: ownerId,
      scoreDelta: { $gt: 0 },
    }),
    profile ? Promise.resolve(profile) : SkillProfile.findOne({ owner: ownerId }).lean(),
  ]);

  const codingAttempts = codingSubs.length;
  const codingSolved = codingSubs.filter((c) => c.status === "passed" || c.score >= 8).length;
  const currentProfile = persistedProfile || profile;

  const totalMilestones = currentProfile?.recommendations?.length || 0;
  const activeGapsCount = (currentProfile?.skillGaps || []).filter(
    (g) => g.status !== "Met Requirement"
  ).length;

  return {
    milestonesCompleted: milestonesCompletedCount,
    milestonesTotal: Math.max(milestonesCompletedCount, totalMilestones),
    dailyMissionsCompleted: todayMissionsCompletedCount,
    dailyMissionsTotal: 3,
    codingChallengesAttempted: codingAttempts,
    codingChallengesSolved: codingSolved,
    recentSkillImprovements: assessmentImprovements,
    persistentSkillGapsCount: activeGapsCount,
    overallReadinessScore: currentProfile?.overallReadinessScore ?? 60,
    isPersonalized: activeGapsCount > 0 || (currentProfile?.skills || []).length > 0,
    recommendationSource: activeGapsCount > 0 ? "adaptive_loop" : "foundational_fallback",
    evaluatedAt: currentProfile?.lastEvaluatedAt || new Date().toISOString(),
  };
}

/**
 * POST /api/v1/adaptive-loop/evaluate
 * Trigger on-demand adaptive evaluation connecting persisted evidence to updated readiness,
 * refreshed recommendations, and learning loop state.
 */
export const evaluateAdaptiveLoopController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required for adaptive evaluation.");
  }

  const ownerId = req.user._id;
  const targetRole = req.body?.targetRole || req.query?.targetRole || req.user.targetRole || "Full Stack Developer";

  // 1. Re-evaluate multi-source skill profile safely
  let evaluationResult = null;
  let evaluationWarning = null;
  try {
    evaluationResult = await evaluateUserProfile(req.user);
  } catch (err) {
    evaluationWarning = err.message || "Skill profile re-evaluation warning";
    // Non-blocking: continue with existing persisted profile
  }

  // 2. Invalidate recommendation and mentor context caches to ensure fresh state
  try {
    recommendationPipelineService.invalidateCache(ownerId);
  } catch {}
  try {
    smartMentorContextService.invalidateContext(ownerId);
  } catch {}

  // 3. Compute continuous adaptive skill-development loop state
  const loopState = await adaptiveSkillLoopService.getAdaptiveLoopState(ownerId);

  // 4. Regenerate and persist outcome-driven recommendations
  const recommendationReport = await generateUserRecommendations(req.user, targetRole);

  // 5. Gather updated SkillProfile
  const profile = evaluationResult?.profile || (await SkillProfile.findOne({ owner: ownerId }).lean());

  // 6. Compute cross-module telemetry
  const telemetry = await computeStudentTelemetry(ownerId, { targetRole, profile });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        evaluatedAt: telemetry.evaluatedAt,
        targetRole,
        overallReadinessScore: profile?.overallReadinessScore ?? telemetry.overallReadinessScore,
        focalSkill: loopState.focalSkill,
        loopState,
        recommendations: recommendationReport.recommendations || [],
        telemetry,
        evaluationWarning,
      },
      "Adaptive learning evaluation completed successfully"
    )
  );
});

/**
 * GET /api/v1/adaptive-loop/state
 * Retrieve current continuous adaptive loop status, focal skill, and next action.
 */
export const getAdaptiveLoopStateController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const loopState = await adaptiveSkillLoopService.getAdaptiveLoopState(req.user._id);

  return res.status(200).json(
    new ApiResponse(200, loopState, "Adaptive skill development loop state")
  );
});

/**
 * GET /api/v1/adaptive-loop/telemetry
 * Retrieve cross-module learning telemetry for authenticated student.
 */
export const getAdaptiveTelemetryController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  const targetRole = req.query?.role || req.user.targetRole || "Full Stack Developer";
  const telemetry = await computeStudentTelemetry(req.user._id, { targetRole });

  return res.status(200).json(
    new ApiResponse(200, telemetry, "Cross-module learning telemetry retrieved")
  );
});
