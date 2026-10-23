import {
  evaluateStudentCompetencyMatrix,
  getCompetencyEvidenceDetails,
  claimEligibleBadge,
  evaluateCapstoneWorkflow,
} from "../services/competencyMatrix.service.js";
import {
  verifyPublicBadge,
  getUserBadges,
  revokeBadge,
} from "../services/badgeIssuance.service.js";
import { getAllStandardCompetencies, getCompetencyById } from "../services/competencyTaxonomy.js";
import { CompetencyBadge } from "../models/competencyBadge.models.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { env } from "../../../config/env.js";

/**
 * GET /api/v1/skills/competencies/matrix
 * Returns the student's evaluated Competency Matrix
 */
export const getCompetencyMatrixController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const result = await evaluateStudentCompetencyMatrix(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "Student competency matrix retrieved successfully")
  );
});

/**
 * GET /api/v1/skills/competencies/taxonomy
 * Returns standard competency taxonomy definitions
 */
export const getCompetencyTaxonomyController = asyncHandler(async (_req, res) => {
  const taxonomy = getAllStandardCompetencies();
  return res.status(200).json(
    new ApiResponse(200, { taxonomy }, "Competency taxonomy retrieved successfully")
  );
});

/**
 * GET /api/v1/skills/competencies/:id/evidence
 * Returns detailed evidence breakdown for a specific competency
 */
export const getCompetencyEvidenceController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const { id } = req.params;
  const details = await getCompetencyEvidenceDetails(req.user._id, id);
  return res.status(200).json(
    new ApiResponse(200, details, "Competency evidence details retrieved successfully")
  );
});

/**
 * GET /api/v1/skills/competencies/:id/capstone
 * Returns capstone evaluation workflow and criteria
 */
export const getCapstoneWorkflowController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const { id } = req.params;
  const result = await evaluateCapstoneWorkflow(req.user._id, id);
  return res.status(200).json(
    new ApiResponse(200, result, "Capstone competency workflow evaluated")
  );
});

/**
 * GET /api/v1/skills/badges/my
 * Returns all competency badges earned by the authenticated student
 */
export const getMyBadgesController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const badges = await getUserBadges(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, { badges }, "Student badges retrieved successfully")
  );
});

/**
 * POST /api/v1/skills/badges/claim
 * Claims and cryptographically signs an eligible competency badge
 */
export const claimBadgeController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const { competencyId, badgeType, recipientIdentifier } = req.body;
  if (!competencyId || !badgeType) {
    throw new ApiError(400, "competencyId and badgeType are required");
  }

  // Use student's preferred display name or fallback
  const recipientName =
    recipientIdentifier ||
    req.user.name ||
    req.user.displayName ||
    "SSH Verified Learner";

  const result = await claimEligibleBadge({
    userId: req.user._id,
    competencyId,
    badgeType,
    recipientIdentifier: recipientName,
  });

  return res.status(result.isNewlyIssued ? 201 : 200).json(
    new ApiResponse(
      result.isNewlyIssued ? 201 : 200,
      result,
      result.isNewlyIssued ? "Badge issued and cryptographically signed successfully" : "Existing active badge retrieved"
    )
  );
});

/**
 * GET /api/v1/badges/verify/:badgeId
 * PUBLIC verification endpoint for third-party verifiers and resume viewers
 * STRICT: Does not disclose private student email, USN, or passwords
 */
export const verifyPublicBadgeController = asyncHandler(async (req, res) => {
  const { badgeId } = req.params;
  const verification = await verifyPublicBadge(badgeId);

  return res.status(200).json(
    new ApiResponse(200, verification, verification.message)
  );
});

/**
 * POST /api/v1/skills/badges/:badgeId/revoke
 * Authorized endpoint to revoke an issued badge
 */
export const revokeBadgeController = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required");
  }

  const { badgeId } = req.params;
  const { reason } = req.body;

  const existingBadge = await CompetencyBadge.findOne({ badgeId });
  if (!existingBadge) {
    throw new ApiError(404, "Badge not found");
  }

  // Authorization check: only badge owner or administrator can revoke
  const isOwner = existingBadge.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin" || req.user.email === env.ADMIN_EMAIL;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to revoke this badge");
  }

  const revoked = await revokeBadge({
    badgeId,
    reason: reason || "Revoked by user request or administrative policy",
    authorizedUserId: req.user._id,
  });

  return res.status(200).json(
    new ApiResponse(200, { badge: revoked }, "Badge successfully revoked")
  );
});
