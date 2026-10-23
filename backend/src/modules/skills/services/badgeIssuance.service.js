import crypto from "crypto";
import { nanoid } from "nanoid";
import { CompetencyBadge } from "../models/competencyBadge.models.js";
import { getCompetencyById } from "./competencyTaxonomy.js";
import { ApiError } from "../../../core/errors/ApiError.js";

const DEFAULT_KEY_ID = "ssh-badge-key-2026-v1";

function getSigningSecret(keyId = DEFAULT_KEY_ID) {
  const secret = process.env.BADGE_SIGNING_SECRET || process.env.JWT_SECRET || "smart-skill-hub-badge-signing-secret-key-v1";
  if (!secret || secret.trim() === "") {
    throw new Error("Badge signing secret is not configured");
  }
  return secret;
}

/**
 * Deterministic JSON serialization for canonical signing payloads
 */
export function serializeCanonicalPayload(data) {
  return JSON.stringify({
    badgeId: String(data.badgeId || "").trim(),
    ownerId: String(data.ownerId || "").trim(),
    competencyId: String(data.competencyId || "").trim(),
    badgeType: String(data.badgeType || "").trim(),
    rubricVersion: String(data.rubricVersion || "1.0.0").trim(),
    issuedAt: new Date(data.issuedAt).toISOString(),
  });
}

/**
 * Generate cryptographic HMAC-SHA256 signature for badge claims
 */
export function generateBadgeSignature(data, secret = getSigningSecret()) {
  const canonicalString = serializeCanonicalPayload(data);
  return crypto.createHmac("sha256", secret).update(canonicalString).digest("hex");
}

/**
 * Constant-time verification of badge signatures against canonical payloads
 */
export function verifyBadgeSignature(data, signature, secret = getSigningSecret()) {
  if (!signature || typeof signature !== "string") return false;
  try {
    const expected = generateBadgeSignature(data, secret);
    const expectedBuf = Buffer.from(expected, "hex");
    const actualBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

/**
 * Issue a new verifiable competency badge (Idempotent)
 */
export async function issueCompetencyBadge({
  ownerId,
  competencyId,
  badgeType,
  recipientIdentifier = "SSH Verified Learner",
  evidenceSummary = {},
}) {
  if (!ownerId) {
    throw new ApiError(400, "ownerId is required to issue a badge");
  }

  const competency = getCompetencyById(competencyId);
  if (!competency) {
    throw new ApiError(404, `Competency ${competencyId} is not recognized`);
  }

  const validTypes = ["knowledge_specialist", "applied_practitioner", "retention_master", "capstone_competence"];
  if (!validTypes.includes(badgeType)) {
    throw new ApiError(400, `Invalid badgeType ${badgeType}. Allowed: ${validTypes.join(", ")}`);
  }

  // Idempotency check: if an active badge for this user, competency and type already exists, return it
  const existingBadge = await CompetencyBadge.findOne({
    owner: ownerId,
    competencyId: competency.competencyId,
    badgeType,
    status: "active",
  });

  if (existingBadge) {
    return {
      badge: existingBadge,
      isNewlyIssued: false,
    };
  }

  const badgeId = `ssh-badge-${nanoid(16)}`;
  const issuedAt = new Date();
  const rubricVersion = competency.rubricVersion || "1.0.0";

  const signature = generateBadgeSignature({
    badgeId,
    ownerId,
    competencyId: competency.competencyId,
    badgeType,
    rubricVersion,
    issuedAt,
  });

  const newBadge = await CompetencyBadge.create({
    badgeId,
    owner: ownerId,
    recipientIdentifier: recipientIdentifier || "SSH Verified Learner",
    competencyId: competency.competencyId,
    competencyName: competency.name,
    skill: competency.canonicalSkill,
    canonicalSkill: competency.canonicalSkill,
    badgeType,
    rubricVersion,
    status: "active",
    issuedAt,
    signature,
    keyId: DEFAULT_KEY_ID,
    evidenceSummary: {
      evidenceCategories: evidenceSummary.evidenceCategories || [],
      knowledgeScore: evidenceSummary.knowledgeScore || 0,
      knowledgeCheckpointsPassed: evidenceSummary.knowledgeCheckpointsPassed || 0,
      retentionStage: evidenceSummary.retentionStage || 0,
      consecutiveRetrievals: evidenceSummary.consecutiveRetrievals || 0,
      appliedProblemsSolved: evidenceSummary.appliedProblemsSolved || 0,
      appliedTestCasesPassed: evidenceSummary.appliedTestCasesPassed || 0,
      verifiedAt: issuedAt,
    },
    issuer: "Smart Skill Hub Competency Authority",
    criteriaUrl: `/api/v1/skills/competencies/${competency.competencyId}`,
  });

  return {
    badge: newBadge,
    isNewlyIssued: true,
  };
}

/**
 * Publicly verify a badge by ID without exposing private user data
 */
export async function verifyPublicBadge(badgeId) {
  if (!badgeId || typeof badgeId !== "string") {
    throw new ApiError(400, "Valid badgeId is required for verification");
  }

  const badge = await CompetencyBadge.findOne({ badgeId: badgeId.trim() }).lean();
  if (!badge) {
    return {
      exists: false,
      isValid: false,
      isRevoked: false,
      message: "Badge not found",
    };
  }

  const isRevoked = badge.status === "revoked";

  // Check signature
  const isSignatureValid = verifyBadgeSignature(
    {
      badgeId: badge.badgeId,
      ownerId: badge.owner,
      competencyId: badge.competencyId,
      badgeType: badge.badgeType,
      rubricVersion: badge.rubricVersion,
      issuedAt: badge.issuedAt,
    },
    badge.signature
  );

  const isValid = isSignatureValid && !isRevoked;

  // STRICT PRIVACY PROTECTION: Exclude student email, USN, internal MongoDB ID, user profile data
  return {
    exists: true,
    isValid,
    isRevoked,
    revocationReason: isRevoked ? badge.revocationReason : undefined,
    revokedAt: isRevoked ? badge.revokedAt : undefined,
    badge: {
      badgeId: badge.badgeId,
      recipientIdentifier: badge.recipientIdentifier,
      competencyId: badge.competencyId,
      competencyName: badge.competencyName,
      skill: badge.skill,
      canonicalSkill: badge.canonicalSkill,
      badgeType: badge.badgeType,
      rubricVersion: badge.rubricVersion,
      issuedAt: badge.issuedAt,
      issuer: badge.issuer,
      keyId: badge.keyId,
      evidenceSummary: {
        evidenceCategories: badge.evidenceSummary?.evidenceCategories || [],
        knowledgeScore: badge.evidenceSummary?.knowledgeScore || 0,
        knowledgeCheckpointsPassed: badge.evidenceSummary?.knowledgeCheckpointsPassed || 0,
        retentionStage: badge.evidenceSummary?.retentionStage || 0,
        appliedProblemsSolved: badge.evidenceSummary?.appliedProblemsSolved || 0,
        verifiedAt: badge.evidenceSummary?.verifiedAt || badge.issuedAt,
      },
    },
    message: isRevoked
      ? "Badge was revoked by issuing authority"
      : isSignatureValid
      ? "Cryptographically verified by Smart Skill Hub Authority"
      : "Badge signature validation failed or payload tampered",
  };
}

/**
 * Get all badges awarded to a specific student
 */
export async function getUserBadges(ownerId) {
  if (!ownerId) return [];
  return CompetencyBadge.find({ owner: ownerId }).sort({ issuedAt: -1 }).lean();
}

/**
 * Revoke a badge by authorized party
 */
export async function revokeBadge({ badgeId, reason = "Administrative revocation", authorizedUserId }) {
  if (!badgeId) {
    throw new ApiError(400, "badgeId is required");
  }

  const badge = await CompetencyBadge.findOne({ badgeId: badgeId.trim() });
  if (!badge) {
    throw new ApiError(404, "Badge not found");
  }

  badge.status = "revoked";
  badge.revocationReason = reason;
  badge.revokedAt = new Date();
  await badge.save();

  return badge;
}
