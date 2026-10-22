import { generateUserRecommendations, generateRecommendations } from "../services/recommendation.service.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { RecommendationError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { LearningActivityRecord } from "../../skills/models/learningActivityRecord.models.js";

/**
 * GET /api/v1/recommendations
 * Retrieve prioritized learning & practice recommendations for authenticated user.
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new RecommendationError(401, "Authentication required.");
  }

  const roleOverride = req.query.role || null;
  const result = await generateUserRecommendations(req.user, roleOverride);

  // Fetch student's completed milestones from LearningActivityRecord
  const completedRecords = await LearningActivityRecord.find({
    owner: req.user._id,
    activityType: "roadmap_milestone",
    status: "completed",
  })
    .select("entityId skill canonicalName status updatedAt recordedAt")
    .lean();

  const completedSet = new Set();
  completedRecords.forEach((r) => {
    if (r.entityId) completedSet.add(r.entityId);
    if (r.canonicalName) completedSet.add(r.canonicalName);
    if (r.skill) completedSet.add(r.skill);
  });

  const enrichedRecommendations = (result.recommendations || []).map((rec) => {
    const isCompleted =
      completedSet.has(rec.recommendationId) ||
      completedSet.has(rec.canonicalName) ||
      completedSet.has(rec.skill);
    return {
      ...rec,
      isCompleted,
      actionStatus: isCompleted ? "completed" : rec.actionStatus || "pending",
    };
  });

  const completedCount = enrichedRecommendations.filter((r) => r.isCompleted).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...result,
        recommendations: enrichedRecommendations,
        completedCount,
        totalCount: enrichedRecommendations.length,
      },
      "Learning and practice recommendations"
    )
  );
});

/**
 * GET /api/v1/recommendations/roadmap
 * Return recommendations structured as a learning roadmap grouped by priority/phase.
 */
export const getRecommendationRoadmap = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new RecommendationError(401, "Authentication required.");
  }

  const roleOverride = req.query.role || null;
  const { recommendations, targetRole, gapsSummary } = await generateUserRecommendations(req.user, roleOverride);

  const completedRecords = await LearningActivityRecord.find({
    owner: req.user._id,
    activityType: "roadmap_milestone",
    status: "completed",
  })
    .select("entityId skill canonicalName status updatedAt recordedAt")
    .lean();

  const completedSet = new Set();
  completedRecords.forEach((r) => {
    if (r.entityId) completedSet.add(r.entityId);
    if (r.canonicalName) completedSet.add(r.canonicalName);
    if (r.skill) completedSet.add(r.skill);
  });

  const enrich = (list) =>
    list.map((rec) => {
      const isCompleted =
        completedSet.has(rec.recommendationId) ||
        completedSet.has(rec.canonicalName) ||
        completedSet.has(rec.skill);
      return {
        ...rec,
        isCompleted,
        actionStatus: isCompleted ? "completed" : rec.actionStatus || "pending",
      };
    });

  const phase1 = enrich(recommendations.filter((r) => r.priority === "Critical"));
  const phase2 = enrich(recommendations.filter((r) => r.priority === "High"));
  const phase3 = enrich(recommendations.filter((r) => r.priority === "Medium" || r.priority === "Low"));

  const allEnriched = [...phase1, ...phase2, ...phase3];
  const completedCount = allEnriched.filter((r) => r.isCompleted).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        targetRole,
        gapsSummary,
        completedCount,
        totalCount: allEnriched.length,
        roadmap: [
          { phase: 1, title: "Immediate Core Focus (Critical)", items: phase1 },
          { phase: 2, title: "Secondary Role Requirements (High)", items: phase2 },
          { phase: 3, title: "Recommended Enhancements (Medium & Low)", items: phase3 },
        ],
      },
      "Skill learning roadmap"
    )
  );
});

/**
 * GET /api/v1/recommendations/skill/:skill
 * Get tailored recommendation for a specific named skill.
 */
export const getSkillRecommendation = asyncHandler(async (req, res) => {
  const rawSkill = decodeURIComponent(req.params.skill);
  const canonical = normalizeSkill(rawSkill);

  if (!canonical) {
    throw new RecommendationError(400, `Unknown skill: ${rawSkill}`);
  }

  const dummyGap = [
    {
      skill: canonical,
      canonicalName: canonical,
      priority: "High",
      status: "Weak",
      currentScore: 30,
      requiredLevel: "Proficient",
    },
  ];

  const recommendations = generateRecommendations(dummyGap);

  return res.status(200).json(
    new ApiResponse(200, { recommendation: recommendations[0] || null }, `Recommendation for ${canonical}`)
  );
});

/**
 * PATCH /api/v1/recommendations/item/:recommendationId
 * Update recommendation milestone status (e.g. mark completed or pending).
 */
export const updateRecommendationStatus = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new RecommendationError(401, "Authentication required.");
  }

  const { recommendationId } = req.params;
  if (!recommendationId || typeof recommendationId !== "string" || !recommendationId.trim()) {
    throw new RecommendationError(400, "Valid recommendationId parameter is required.");
  }

  const { status = "completed", skill, canonicalName, title } = req.body || {};
  const validStatuses = ["completed", "pending", "in_progress", "started"];
  if (!validStatuses.includes(status)) {
    throw new RecommendationError(400, `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`);
  }

  let record = null;
  if (status === "pending") {
    // Student unmarked milestone or moved back to pending
    await LearningActivityRecord.deleteOne({
      owner: req.user._id,
      activityType: "roadmap_milestone",
      entityId: recommendationId,
    });
  } else {
    // Upsert milestone record with idempotent key
    record = await LearningActivityRecord.findOneAndUpdate(
      {
        owner: req.user._id,
        activityType: "roadmap_milestone",
        entityId: recommendationId,
      },
      {
        $set: {
          owner: req.user._id,
          activityType: "roadmap_milestone",
          entityId: recommendationId,
          skill: skill || canonicalName || recommendationId,
          canonicalName: canonicalName || skill || recommendationId,
          title: title || `Milestone: ${skill || recommendationId}`,
          status,
          recordedAt: new Date(),
        },
        $setOnInsert: {
          idempotencyKey: `roadmap_${req.user._id}_${recommendationId}`,
          isDemonstratedCompetency: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        recommendationId,
        status,
        isCompleted: status === "completed",
        updatedAt: record?.updatedAt || new Date(),
      },
      "Recommendation status updated"
    )
  );
});
