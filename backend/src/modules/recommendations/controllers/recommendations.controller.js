import { generateUserRecommendations, generateRecommendations } from "../services/recommendation.service.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { RecommendationError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * GET /api/v1/recommendations
 * Retrieve prioritized learning & practice recommendations for authenticated user.
 */
export const getRecommendations = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new RecommendationError("Authentication required.", 401);
  }

  const roleOverride = req.query.role || null;
  const result = await generateUserRecommendations(req.user, roleOverride);

  return res.status(200).json(
    new ApiResponse(200, result, "Learning and practice recommendations")
  );
});

/**
 * GET /api/v1/recommendations/roadmap
 * Return recommendations structured as a learning roadmap grouped by priority/phase.
 */
export const getRecommendationRoadmap = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new RecommendationError("Authentication required.", 401);
  }

  const roleOverride = req.query.role || null;
  const { recommendations, targetRole, gapsSummary } = await generateUserRecommendations(req.user, roleOverride);

  const phase1 = recommendations.filter((r) => r.priority === "Critical");
  const phase2 = recommendations.filter((r) => r.priority === "High");
  const phase3 = recommendations.filter((r) => r.priority === "Medium" || r.priority === "Low");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        targetRole,
        gapsSummary,
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
    throw new RecommendationError(`Unknown skill: ${rawSkill}`, 400);
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
