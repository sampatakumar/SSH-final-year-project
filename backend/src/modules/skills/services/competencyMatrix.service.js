import { EduTubeCheckpointAttempt } from "../../edutube/models/edutubeCheckpointAttempt.models.js";
import { EduTubeVideoCheckpoint } from "../../edutube/models/edutubeVideoCheckpoint.models.js";
import { SpacedRevisionSchedule } from "../models/spacedRevisionSchedule.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { LearnerSkillAssessmentHistory } from "../models/learnerSkillAssessmentHistory.models.js";
import { CompetencyBadge } from "../models/competencyBadge.models.js";
import {
  getAllStandardCompetencies,
  getCompetencyForSkill,
  getCompetencyById,
  COMPETENCY_RUBRIC_VERSION,
} from "./competencyTaxonomy.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { issueCompetencyBadge, getUserBadges } from "./badgeIssuance.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";

/**
 * Gather raw evidence from all supported stores for a given student
 */
async function gatherStudentEvidence(userId) {
  const [checkpointAttempts, spacedSchedules, codingSubmissions, assessmentHistories, existingBadges] =
    await Promise.all([
      EduTubeCheckpointAttempt.find({ owner: userId }).sort({ attemptedAt: -1 }).lean(),
      SpacedRevisionSchedule.find({ owner: userId }).sort({ updatedAt: -1 }).lean(),
      CodingSubmission.find({ owner: userId }).sort({ submittedAt: -1 }).lean(),
      LearnerSkillAssessmentHistory.find({ owner: userId }).sort({ assessmentDate: -1 }).lean(),
      getUserBadges(userId),
    ]);

  // For checkpoints, enrich with canonicalSkill if not already stored
  const checkpointIdsNeedingSkill = checkpointAttempts
    .filter((att) => !att.canonicalName && !att.skill)
    .map((att) => att.checkpointId);

  let checkpointDefMap = new Map();
  if (checkpointIdsNeedingSkill.length > 0) {
    const defs = await EduTubeVideoCheckpoint.find({
      checkpointId: { $in: checkpointIdsNeedingSkill },
    }).lean();
    for (const d of defs) {
      checkpointDefMap.set(d.checkpointId, d.canonicalName || normalizeSkill(d.skill));
    }
  }

  // Pre-index existing badges by `${competencyId}:${badgeType}`
  const badgeMap = new Map();
  for (const b of existingBadges) {
    if (b.status === "active") {
      badgeMap.set(`${b.competencyId.toLowerCase()}:${b.badgeType}`, b);
    }
  }

  return {
    checkpointAttempts: checkpointAttempts.map((att) => ({
      ...att,
      resolvedSkill: att.canonicalName || normalizeSkill(att.skill) || checkpointDefMap.get(att.checkpointId) || "",
    })),
    spacedSchedules,
    codingSubmissions,
    assessmentHistories,
    badgeMap,
    existingBadges,
  };
}

/**
 * Synthesize multi-format evidence for a specific competency
 */
function synthesizeEvidenceForCompetency(competency, evidenceData) {
  const canonicalTarget = competency.canonicalSkill.toLowerCase();

  // 1. KNOWLEDGE EVIDENCE (EduTube Checkpoints)
  const relevantAttempts = evidenceData.checkpointAttempts.filter(
    (att) => att.resolvedSkill && att.resolvedSkill.toLowerCase() === canonicalTarget
  );

  // Deduplicate by checkpointId: keep the best attempt per checkpoint to avoid retry inflation
  const bestAttemptByCheckpoint = new Map();
  for (const att of relevantAttempts) {
    const existing = bestAttemptByCheckpoint.get(att.checkpointId);
    const score = att.score !== undefined ? att.score : att.isCorrect ? 100 : 0;
    if (!existing || score > existing.score) {
      bestAttemptByCheckpoint.set(att.checkpointId, {
        checkpointId: att.checkpointId,
        videoId: att.videoId,
        isCorrect: att.isCorrect,
        score,
        attemptedAt: att.attemptedAt,
      });
    }
  }

  const distinctCheckpoints = Array.from(bestAttemptByCheckpoint.values());
  const passedCheckpoints = distinctCheckpoints.filter(
    (cp) => cp.isCorrect || cp.score >= competency.criteria.knowledge.minScore
  );
  const avgKnowledgeScore =
    distinctCheckpoints.length > 0
      ? Math.round(distinctCheckpoints.reduce((sum, c) => sum + c.score, 0) / distinctCheckpoints.length)
      : 0;

  const isKnowledgeSatisfied =
    passedCheckpoints.length >= competency.criteria.knowledge.minCheckpointsPassed &&
    avgKnowledgeScore >= competency.criteria.knowledge.minScore;

  // 2. RETENTION EVIDENCE (Spaced Revision Schedules)
  const relevantSchedules = evidenceData.spacedSchedules.filter((sched) => {
    const schedSkill = (sched.canonicalName || normalizeSkill(sched.skill) || "").toLowerCase();
    return schedSkill === canonicalTarget;
  });

  let maxStage = 0;
  let maxConsecutiveSuccesses = 0;
  let bestScheduleScore = 0;
  let completedReviewsCount = 0;

  for (const s of relevantSchedules) {
    if (s.stage > maxStage) maxStage = s.stage;
    if (s.consecutiveSuccesses > maxConsecutiveSuccesses) {
      maxConsecutiveSuccesses = s.consecutiveSuccesses;
    }
    if (s.lastScore > bestScheduleScore) bestScheduleScore = s.lastScore;
    if (s.status === "completed" || (Array.isArray(s.history) && s.history.length > 0)) {
      completedReviewsCount += 1;
    }
  }

  // Retention criterion: at least Stage 2 or 2 consecutive successes
  const isRetentionSatisfied =
    maxConsecutiveSuccesses >= competency.criteria.retention.minConsecutiveRetrievals ||
    (maxStage >= competency.criteria.retention.minStage && (bestScheduleScore >= 70 || completedReviewsCount >= 2));

  // 3. APPLIED SKILL EVIDENCE (Coding Submissions)
  const relevantCoding = evidenceData.codingSubmissions.filter((sub) => {
    const skills = Array.isArray(sub.skillsCovered) && sub.skillsCovered.length > 0
      ? sub.skillsCovered.map((s) => normalizeSkill(s).toLowerCase())
      : [];
    if (sub.language && normalizeSkill(sub.language).toLowerCase() === canonicalTarget) {
      return true;
    }
    return skills.includes(canonicalTarget);
  });

  // Deduplicate by taskId: only count distinct solved tasks
  const solvedTasks = new Set();
  let totalTestCasesPassed = 0;
  let totalTestCases = 0;

  for (const sub of relevantCoding) {
    totalTestCasesPassed += sub.passed || 0;
    totalTestCases += sub.total || 0;

    // Strict validation: In staging and prod, only mark solved if status is passed and tests passed
    const isPassing =
      sub.status === "passed" &&
      (sub.total === 0 || (sub.passed || 0) === sub.total || (sub.score || 0) >= 80);

    if (isPassing) {
      solvedTasks.add(sub.taskId);
    }
  }

  // Also factor in formal practical assessments from LearnerSkillAssessmentHistory if available
  const relevantFormalAssessments = evidenceData.assessmentHistories.filter((h) => {
    const histSkill = (h.canonicalName || normalizeSkill(h.skill) || "").toLowerCase();
    return histSkill === canonicalTarget && (h.score >= 80 || h.testCasesPassed > 0);
  });

  for (const fa of relevantFormalAssessments) {
    if (fa.taskId) solvedTasks.add(fa.taskId);
    totalTestCasesPassed += fa.testCasesPassed || 0;
    totalTestCases += fa.testCasesTotal || 0;
  }

  const testPassRate = totalTestCases > 0 ? Number((totalTestCasesPassed / totalTestCases).toFixed(2)) : 0;
  const isAppliedSatisfied =
    solvedTasks.size >= competency.criteria.applied.minProblemsSolved &&
    (totalTestCases === 0 || testPassRate >= competency.criteria.applied.minTestCasesPassRate);

  // 4. CAPSTONE INTEGRATION
  const isCapstoneSatisfied = isKnowledgeSatisfied && isRetentionSatisfied && isAppliedSatisfied;

  // Determine Overall Status
  let status = "not_assessed";
  const hasAnyEvidence =
    distinctCheckpoints.length > 0 || relevantSchedules.length > 0 || relevantCoding.length > 0;

  if (isCapstoneSatisfied) {
    status = "capstone_competence";
  } else if (isAppliedSatisfied) {
    status = "applied_verified";
  } else if (isRetentionSatisfied) {
    status = "retention_verified";
  } else if (isKnowledgeSatisfied) {
    status = "knowledge_verified";
  } else if (hasAnyEvidence) {
    status = "insufficient_evidence";
  }

  // Compute Missing Requirements & Recommended Actions
  const missingRequirements = [];
  let recommendedNextAction = {
    actionType: "explore",
    title: `Begin learning ${competency.canonicalSkill}`,
    description: `Complete knowledge checkpoints on EduTube to establish foundational understanding of ${competency.canonicalSkill}.`,
    targetModule: "edutube",
  };

  if (!isKnowledgeSatisfied) {
    missingRequirements.push(
      `Pass at least ${competency.criteria.knowledge.minCheckpointsPassed} EduTube checkpoint quiz with a score ≥ ${competency.criteria.knowledge.minScore}% (Current passed: ${passedCheckpoints.length})`
    );
    recommendedNextAction = {
      actionType: "quiz",
      title: `Complete ${competency.canonicalSkill} Knowledge Checkpoint`,
      description: `Watch an EduTube video on ${competency.canonicalSkill} and pass the interactive checkpoint question.`,
      targetModule: "edutube",
    };
  }

  if (!isAppliedSatisfied) {
    missingRequirements.push(
      `Pass at least ${competency.criteria.applied.minProblemsSolved} practical coding challenge with ≥ ${Math.round(
        competency.criteria.applied.minTestCasesPassRate * 100
      )}% test pass rate (Current solved: ${solvedTasks.size})`
    );
    if (isKnowledgeSatisfied) {
      recommendedNextAction = {
        actionType: "coding",
        title: `Solve ${competency.canonicalSkill} Practical Challenge`,
        description: `Implement and verify your solution in the coding environment to satisfy applied criteria.`,
        targetModule: "coding",
      };
    }
  }

  if (!isRetentionSatisfied) {
    missingRequirements.push(
      `Demonstrate retention with ≥ ${competency.criteria.retention.minConsecutiveRetrievals} consecutive successful spaced revisions or Stage ≥ ${competency.criteria.retention.minStage} (Current streak: ${maxConsecutiveSuccesses})`
    );
    if (isKnowledgeSatisfied && isAppliedSatisfied) {
      recommendedNextAction = {
        actionType: "revision",
        title: `Reinforce ${competency.canonicalSkill} Spaced Retention`,
        description: `Complete your scheduled spaced repetition cards to secure long-term knowledge retention.`,
        targetModule: "spaced-revision",
      };
    }
  }

  if (isCapstoneSatisfied) {
    recommendedNextAction = {
      actionType: "badge",
      title: `Claim Capstone Competency Badge`,
      description: `You have satisfied all knowledge, application, and retention requirements for ${competency.name}.`,
      targetModule: "badges",
    };
  }

  // Determine which badges can be claimed
  const eligibleBadgeTypes = [];
  if (isKnowledgeSatisfied) eligibleBadgeTypes.push("knowledge_specialist");
  if (isAppliedSatisfied) eligibleBadgeTypes.push("applied_practitioner");
  if (isRetentionSatisfied) eligibleBadgeTypes.push("retention_master");
  if (isCapstoneSatisfied) eligibleBadgeTypes.push("capstone_competence");

  // Determine existing badges for this competency
  const earnedBadges = [];
  for (const bType of ["knowledge_specialist", "applied_practitioner", "retention_master", "capstone_competence"]) {
    const b = evidenceData.badgeMap.get(`${competency.competencyId.toLowerCase()}:${bType}`);
    if (b) earnedBadges.push(b);
  }

  return {
    competencyId: competency.competencyId,
    name: competency.name,
    description: competency.description,
    canonicalSkill: competency.canonicalSkill,
    category: competency.category,
    roles: competency.roles,
    rubricVersion: competency.rubricVersion,
    status,
    evidence: {
      knowledge: {
        satisfied: isKnowledgeSatisfied,
        distinctCheckpointsPassed: passedCheckpoints.length,
        totalCheckpointsAttempted: distinctCheckpoints.length,
        averageScore: avgKnowledgeScore,
        passingThreshold: competency.criteria.knowledge.minScore,
        checkpoints: distinctCheckpoints.map((c) => ({
          checkpointId: c.checkpointId,
          score: c.score,
          isCorrect: c.isCorrect,
          attemptedAt: c.attemptedAt,
        })),
      },
      retention: {
        satisfied: isRetentionSatisfied,
        maxStage,
        consecutiveSuccesses: maxConsecutiveSuccesses,
        bestScore: bestScheduleScore,
        schedulesCount: relevantSchedules.length,
      },
      applied: {
        satisfied: isAppliedSatisfied,
        problemsSolvedCount: solvedTasks.size,
        solvedTaskIds: Array.from(solvedTasks),
        totalTestCasesPassed,
        totalTestCases,
        testPassRate,
      },
      capstone: {
        satisfied: isCapstoneSatisfied,
        allPillarsSatisfied: isKnowledgeSatisfied && isRetentionSatisfied && isAppliedSatisfied,
      },
    },
    missingRequirements,
    recommendedNextAction,
    eligibleBadgeTypes,
    earnedBadges,
  };
}

/**
 * Evaluate the complete Competency Matrix for a student
 */
export async function evaluateStudentCompetencyMatrix(userId) {
  if (!userId) {
    throw new ApiError(400, "userId is required to evaluate competency matrix");
  }

  const evidenceData = await gatherStudentEvidence(userId);
  const standardCompetencies = getAllStandardCompetencies();

  const matrix = standardCompetencies.map((comp) =>
    synthesizeEvidenceForCompetency(comp, evidenceData)
  );

  const summary = {
    totalCompetencies: matrix.length,
    capstoneVerified: matrix.filter((m) => m.status === "capstone_competence").length,
    appliedVerified: matrix.filter((m) => m.status === "applied_verified" || m.status === "capstone_competence").length,
    knowledgeVerified: matrix.filter((m) => m.evidence.knowledge.satisfied).length,
    retentionVerified: matrix.filter((m) => m.evidence.retention.satisfied).length,
    totalBadgesEarned: evidenceData.existingBadges.filter((b) => b.status === "active").length,
    rubricVersion: COMPETENCY_RUBRIC_VERSION,
    evaluatedAt: new Date().toISOString(),
  };

  return {
    matrix,
    summary,
  };
}

/**
 * Get detailed evidence breakdown for a single competency or skill
 */
export async function getCompetencyEvidenceDetails(userId, competencyIdOrSkill) {
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  let competency = getCompetencyById(competencyIdOrSkill);
  if (!competency) {
    competency = getCompetencyForSkill(competencyIdOrSkill);
  }

  if (!competency) {
    throw new ApiError(404, `Competency not found for ${competencyIdOrSkill}`);
  }

  const evidenceData = await gatherStudentEvidence(userId);
  return synthesizeEvidenceForCompetency(competency, evidenceData);
}

/**
 * Claim an eligible badge for a competency
 */
export async function claimEligibleBadge({
  userId,
  competencyId,
  badgeType,
  recipientIdentifier = "SSH Verified Learner",
}) {
  if (!userId) {
    throw new ApiError(400, "userId is required");
  }

  // 1. Evaluate competency to ensure server-side authoritative eligibility
  const competencyDetails = await getCompetencyEvidenceDetails(userId, competencyId);

  if (!competencyDetails.eligibleBadgeTypes.includes(badgeType)) {
    throw new ApiError(
      400,
      `Student is not yet eligible for badge '${badgeType}'. Requirements: ${competencyDetails.missingRequirements.join(
        "; "
      )}`
    );
  }

  // 2. Build summary of validated evidence for inclusion in the signed badge
  const evidenceSummary = {
    evidenceCategories: [],
    knowledgeScore: competencyDetails.evidence.knowledge.averageScore,
    knowledgeCheckpointsPassed: competencyDetails.evidence.knowledge.distinctCheckpointsPassed,
    retentionStage: competencyDetails.evidence.retention.maxStage,
    consecutiveRetrievals: competencyDetails.evidence.retention.consecutiveSuccesses,
    appliedProblemsSolved: competencyDetails.evidence.applied.problemsSolvedCount,
    appliedTestCasesPassed: competencyDetails.evidence.applied.totalTestCasesPassed,
  };

  if (competencyDetails.evidence.knowledge.satisfied) {
    evidenceSummary.evidenceCategories.push("knowledge");
  }
  if (competencyDetails.evidence.retention.satisfied) {
    evidenceSummary.evidenceCategories.push("retention");
  }
  if (competencyDetails.evidence.applied.satisfied) {
    evidenceSummary.evidenceCategories.push("applied");
  }

  // 3. Issue verifiable badge via cryptographic signature service
  const result = await issueCompetencyBadge({
    ownerId: userId,
    competencyId: competencyDetails.competencyId,
    badgeType,
    recipientIdentifier,
    evidenceSummary,
  });

  return result;
}

/**
 * Evaluate and claim capstone verification workflow
 */
export async function evaluateCapstoneWorkflow(userId, competencyIdOrSkill) {
  const details = await getCompetencyEvidenceDetails(userId, competencyIdOrSkill);

  const isComplete = details.evidence.capstone.satisfied;
  return {
    competencyId: details.competencyId,
    name: details.name,
    canonicalSkill: details.canonicalSkill,
    isComplete,
    missingRequirements: details.missingRequirements,
    evidenceBreakdown: details.evidence,
    isEligibleForCapstoneBadge: details.eligibleBadgeTypes.includes("capstone_competence"),
  };
}
