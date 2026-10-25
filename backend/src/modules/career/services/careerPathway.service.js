import { ApiError } from "../../../core/errors/ApiError.js";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { evidenceNormalizationService } from "../../skills/services/evidenceNormalization.service.js";
import { skillGapDiagnosisService } from "../../skills/services/skillGapDiagnosis.service.js";
import { User } from "../../../core/database/models/user.models.js";
import {
  CAREER_PATHWAY_CATALOG,
  CAREER_PATHWAY_MAP,
  CAREER_DISCIPLINE_FAMILIES,
} from "../constants/careerPathwayCatalog.js";
import { PRACTICAL_LAB_CATALOG } from "../../academic/constants/practicalLabCatalog.js";
import { ASSESSMENTS_CATALOG } from "../../academic/constants/assessmentCatalog.js";
import { INITIAL_PROJECT_TEMPLATES } from "../../academic/constants/projectTemplatesCatalog.js";

// Fast lookup maps for platform activity details
const LAB_MAP = new Map(PRACTICAL_LAB_CATALOG.map((lab) => [lab.labId, lab]));
const ASSESSMENT_MAP = new Map(ASSESSMENTS_CATALOG.map((a) => [a.assessmentId, a]));
const PROJECT_MAP = new Map(INITIAL_PROJECT_TEMPLATES.map((p) => [p.templateId, p]));

export class CareerPathwayService {
  /**
   * List and filter career pathways with branch relevance ranking.
   *
   * @param {object} params
   * @param {string} [params.branch] - Student's academic branch (e.g. 'mech', 'cse', 'civil')
   * @param {string} [params.roleFamily] - Filter by discipline family
   * @param {string} [params.search] - Search text
   * @param {boolean} [params.includeCrossDisciplinary=true] - Whether to show cross-branch mobility options
   * @returns {Array<object>} Filtered and ranked career roles
   */
  getCareerRoles({ branch = null, roleFamily = null, search = null, includeCrossDisciplinary = true } = {}) {
    const normalizedBranch = branch ? branch.trim().toLowerCase() : null;
    const cleanSearch = search ? search.trim().toLowerCase() : null;

    let roles = [...CAREER_PATHWAY_CATALOG];

    // Filter by role family if specified and not 'all'
    if (roleFamily && roleFamily !== "all") {
      roles = roles.filter((r) => r.roleFamily.toLowerCase() === roleFamily.toLowerCase());
    }

    // Filter by search query
    if (cleanSearch) {
      roles = roles.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(cleanSearch);
        const descMatch = r.description.toLowerCase().includes(cleanSearch);
        const familyMatch = r.roleFamily.toLowerCase().includes(cleanSearch);
        const skillMatch = r.coreSkills.some((s) => s.skill.toLowerCase().includes(cleanSearch));
        return titleMatch || descMatch || familyMatch || skillMatch;
      });
    }

    // Rank and enrich with branch relevance
    const enriched = roles.map((role) => {
      let relevanceType = "general";
      let relevanceScore = 50;
      let relevanceRationale = "General career pathway.";

      if (normalizedBranch) {
        const isPrimary = role.branchSlugs.some((b) => b.toLowerCase() === normalizedBranch);
        if (isPrimary) {
          relevanceType = "primary";
          relevanceScore = 95;
          relevanceRationale = `Direct academic alignment with your ${role.disciplineCategory} degree track.`;
        } else if (role.crossDisciplinaryAccessible && includeCrossDisciplinary) {
          relevanceType = "cross_disciplinary";
          relevanceScore = 75;
          relevanceRationale = role.mobilityRationale || "Cross-disciplinary pathway with transferable skill synergy.";
        } else {
          relevanceType = "alternative";
          relevanceScore = 40;
          relevanceRationale = `Specialized pathway typically requiring foundational ${role.disciplineCategory} coursework.`;
        }
      }

      return {
        ...role,
        relevance: {
          type: relevanceType,
          score: relevanceScore,
          rationale: relevanceRationale,
        },
      };
    });

    // Sort: primary branch roles first, cross-disciplinary second, others last
    enriched.sort((a, b) => b.relevance.score - a.relevance.score || a.title.localeCompare(b.title));

    return enriched;
  }

  /**
   * Get single career role with rich platform linkages (labs, assessments, projects).
   *
   * @param {string} roleId - Canonical role ID
   * @returns {object} Full role specification
   */
  getRoleById(roleId) {
    if (!roleId) {
      throw new ApiError(400, "Role ID is required.");
    }

    const cleanId = roleId.trim().toLowerCase();
    const slugId = cleanId.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    let role = CAREER_PATHWAY_MAP.get(cleanId) || CAREER_PATHWAY_MAP.get(slugId);
    if (!role) {
      for (const r of CAREER_PATHWAY_MAP.values()) {
        if (
          r.title.toLowerCase() === cleanId ||
          r.roleId.toLowerCase() === cleanId ||
          r.roleId.toLowerCase() === slugId
        ) {
          role = r;
          break;
        }
      }
    }

    if (!role) {
      throw new ApiError(404, `Career role '${roleId}' not found in canonical catalog.`);
    }

    // Enrich with actual linked platform activities
    const linkedLabs = (role.suggestedLabIds || [])
      .map((id) => LAB_MAP.get(id))
      .filter(Boolean)
      .map((lab) => ({
        labId: lab.labId,
        title: lab.title,
        difficulty: lab.difficulty,
        estimatedMinutes: lab.estimatedMinutes,
        relevantSkills: lab.relevantSkills,
        route: "/dashboard/labs",
      }));

    const linkedAssessments = (role.suggestedAssessmentIds || [])
      .map((id) => ASSESSMENT_MAP.get(id))
      .filter(Boolean)
      .map((a) => ({
        assessmentId: a.assessmentId,
        title: a.title,
        difficulty: a.difficulty,
        durationMinutes: a.durationMinutes,
        relevantSkills: a.relevantSkills,
        route: "/dashboard/assessments",
      }));

    const linkedProjects = (role.suggestedProjectIds || [])
      .map((id) => PROJECT_MAP.get(id))
      .filter(Boolean)
      .map((p) => ({
        templateId: p.templateId,
        title: p.title,
        difficulty: p.difficulty,
        estimatedHours: p.estimatedHours,
        relevantSkills: p.relevantSkills,
        route: "/dashboard/projects",
      }));

    return {
      ...role,
      linkedActivities: {
        labs: linkedLabs,
        assessments: linkedAssessments,
        projects: linkedProjects,
      },
    };
  }

  /**
   * Evaluate student's evidence-based readiness for a target career role.
   *
   * Distinguishes:
   * - Demonstrated required skills (score >= 70%)
   * - Partially demonstrated skills (score 40-69%)
   * - Unassessed skills (NO evidence; NEVER treated as 0%)
   * - Active skill gaps (tested score < 40%)
   * - Stale evidence (older than 60 days)
   * - Conflicting evidence (divergent scores between sources)
   * - Missing prerequisites
   * - Unassessable competencies (clinical, physical, or external licensing)
   *
   * @param {string} ownerId - Student ID
   * @param {string} roleId - Target role ID
   * @param {object} [preloadedEvidence=null] - Optional pre-fetched normalized evidence
   * @returns {Promise<object>} Complete explainable readiness diagnosis
   */
  async evaluateRoleReadiness(ownerId, roleId, preloadedEvidence = null) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to evaluate career readiness.");
    }

    const role = this.getRoleById(roleId);
    const normalizedEvidence = preloadedEvidence || (await evidenceNormalizationService.getNormalizedStudentEvidence(ownerId));
    const evidenceBySkill = normalizedEvidence.normalizedBySkill || {};

    const demonstratedSkills = [];
    const partialSkills = [];
    const unassessedSkills = [];
    const gapSkills = [];
    const staleEvidence = [];
    const conflictingEvidence = [];
    const missingPrerequisites = [];

    const now = Date.now();
    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

    let totalCoreWeights = 0;
    let accumulatedScoreWeight = 0;

    for (const core of role.coreSkills) {
      const canonical = normalizeSkill(core.skill) || core.skill;
      const weight = core.importance === "critical" ? 1.0 : core.importance === "high" ? 0.85 : 0.7;
      totalCoreWeights += weight;

      // Check prerequisite readiness
      const prereqCheck = skillGapDiagnosisService.checkPrerequisites(canonical, evidenceBySkill);
      if (!prereqCheck.isReady) {
        missingPrerequisites.push({
          targetSkill: canonical,
          missing: prereqCheck.missingPrerequisites,
        });
      }

      const evidence = evidenceBySkill[canonical];
      const hasValid = Boolean(
        evidence &&
        evidence.latestEvidence &&
        evidence.latestScore !== null &&
        evidence.hasValidEvidence !== false &&
        evidence.evaluationState !== "invalid_or_malformed"
      );

      if (!hasValid) {
        if (evidence && (evidence.hasInvalidEvidence || evidence.evaluationState === "invalid_or_malformed")) {
          unassessedSkills.push({
            skill: canonical,
            importance: core.importance,
            targetScore: core.targetScore,
            status: "invalid_evidence",
            evaluationState: evidence.evaluationState || "invalid_or_malformed",
            prerequisitesMet: prereqCheck.isReady,
            reason: "Evidence recorded for this skill was malformed or corrupted and excluded from scoring.",
          });
        } else {
          // Unassessed skill: NO evidence recorded yet. Do NOT score as 0!
          unassessedSkills.push({
            skill: canonical,
            importance: core.importance,
            targetScore: core.targetScore,
            status: "unassessed",
            evaluationState: "missing_evidence",
            prerequisitesMet: prereqCheck.isReady,
            reason: "No objective evaluation recorded on platform yet. Does not imply lack of competence.",
          });
        }
        continue;
      }

      const score = evidence.latestScore;
      const evidenceAgeMs = evidence.latestEvidence.timestamp
        ? now - new Date(evidence.latestEvidence.timestamp).getTime()
        : 0;

      // Check for stale evidence (> 60 days old)
      if (evidenceAgeMs > SIXTY_DAYS_MS) {
        staleEvidence.push({
          skill: canonical,
          lastVerifiedDate: evidence.latestEvidence.timestamp,
          daysSinceVerification: Math.round(evidenceAgeMs / (1000 * 60 * 60 * 24)),
          score,
        });
      }

      // Check for conflicting evidence (e.g. highest vs latest difference > 25 points)
      if (evidence.highestEvidence && evidence.latestEvidence && evidence.highestEvidence.percentage - evidence.latestEvidence.percentage > 25) {
        conflictingEvidence.push({
          skill: canonical,
          highestScore: evidence.highestEvidence.percentage,
          latestScore: evidence.latestEvidence.percentage,
          discrepancyDelta: evidence.highestEvidence.percentage - evidence.latestEvidence.percentage,
          latestSource: evidence.latestEvidence.sourceType,
        });
      }

      if (score >= (core.targetScore || 70)) {
        demonstratedSkills.push({
          skill: canonical,
          score,
          targetScore: core.targetScore || 70,
          importance: core.importance,
          sourceType: evidence.latestEvidence.sourceType,
          confidenceWeight: evidence.latestEvidence.confidenceWeight,
          timestamp: evidence.latestEvidence.timestamp,
        });
        accumulatedScoreWeight += weight * (score / 100);
      } else if (score >= 40) {
        partialSkills.push({
          skill: canonical,
          score,
          targetScore: core.targetScore || 70,
          importance: core.importance,
          sourceType: evidence.latestEvidence.sourceType,
          confidenceWeight: evidence.latestEvidence.confidenceWeight,
          timestamp: evidence.latestEvidence.timestamp,
        });
        accumulatedScoreWeight += weight * (score / 100);
      } else {
        gapSkills.push({
          skill: canonical,
          score,
          targetScore: core.targetScore || 70,
          importance: core.importance,
          sourceType: evidence.latestEvidence.sourceType,
          confidenceWeight: evidence.latestEvidence.confidenceWeight,
          timestamp: evidence.latestEvidence.timestamp,
        });
        accumulatedScoreWeight += weight * (score / 100);
      }
    }

    // Deterministic explainable readiness calculation
    const totalCoreCount = role.coreSkills.length;
    const assessedCount = demonstratedSkills.length + partialSkills.length + gapSkills.length;
    const evidenceCoveragePercent = totalCoreCount > 0 ? Math.round((assessedCount / totalCoreCount) * 100) : 0;

    let heuristicReadinessIndex = 0;
    let readinessBand = "Unassessed";

    if (assessedCount > 0 && totalCoreWeights > 0) {
      // 40% based on coverage of core skills, 60% based on weighted score quality
      const coverageRatio = (demonstratedSkills.length + partialSkills.length * 0.5) / totalCoreCount;
      const qualityRatio = accumulatedScoreWeight / totalCoreWeights;
      heuristicReadinessIndex = Math.min(100, Math.max(0, Math.round(coverageRatio * 40 + qualityRatio * 60)));

      if (heuristicReadinessIndex >= 85) readinessBand = "Strong Alignment";
      else if (heuristicReadinessIndex >= 70) readinessBand = "Substantially Evidenced";
      else if (heuristicReadinessIndex >= 45) readinessBand = "Developing Competency";
      else readinessBand = "Early Preparation";
    }

    return {
      roleId: role.roleId,
      roleTitle: role.title,
      roleFamily: role.roleFamily,
      disciplineCategory: role.disciplineCategory,
      heuristicReadinessIndex,
      readinessBand,
      evidenceCoveragePercent,
      counts: {
        totalCoreSkills: totalCoreCount,
        totalRequired: totalCoreCount,
        demonstrated: demonstratedSkills.length,
        partial: partialSkills.length,
        unassessed: unassessedSkills.length,
        gaps: gapSkills.length,
        stale: staleEvidence.length,
      },
      skillsBreakdown: {
        demonstrated: demonstratedSkills,
        partial: partialSkills,
        unassessed: unassessedSkills,
        gaps: gapSkills,
      },
      evidenceQualityNotes: {
        staleEvidence,
        conflictingEvidence,
        missingPrerequisites,
      },
      unassessableCompetencies: role.unassessableCompetencies || [],
      regulatoryNotes: role.regulatoryNotes || null,
      disclaimer: "Internal heuristic readiness index for formative learning guidance only; does NOT represent a statistically validated employment probability, placement guarantee, or hiring prediction.",
    };
  }

  /**
   * Compare two career roles side by side for a student.
   *
   * @param {string} ownerId - Student ID
   * @param {string} roleId1 - First role ID
   * @param {string} roleId2 - Second role ID
   * @returns {Promise<object>} Comprehensive side-by-side comparison
   */
  async compareRoles(ownerId, roleId1, roleId2) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to compare career roles.");
    }
    if (!roleId1 || !roleId2) {
      throw new ApiError(400, "Both roleId1 and roleId2 are required for comparison.");
    }

    const [role1, role2] = [this.getRoleById(roleId1), this.getRoleById(roleId2)];

    // Fetch normalized evidence once for both evaluations
    const normalizedEvidence = await evidenceNormalizationService.getNormalizedStudentEvidence(ownerId);

    const [eval1, eval2] = await Promise.all([
      this.evaluateRoleReadiness(ownerId, roleId1, normalizedEvidence),
      this.evaluateRoleReadiness(ownerId, roleId2, normalizedEvidence),
    ]);

    const role1CoreSkills = new Set(role1.coreSkills.map((s) => normalizeSkill(s.skill) || s.skill));
    const role2CoreSkills = new Set(role2.coreSkills.map((s) => normalizeSkill(s.skill) || s.skill));

    const sharedCoreSkills = [...role1CoreSkills].filter((s) => role2CoreSkills.has(s));
    const role1UniqueCoreSkills = [...role1CoreSkills].filter((s) => !role2CoreSkills.has(s));
    const role2UniqueCoreSkills = [...role2CoreSkills].filter((s) => !role1CoreSkills.has(s));

    // Shared demonstrated competencies
    const demonstrated1Set = new Set(eval1.skillsBreakdown.demonstrated.map((d) => d.skill));
    const demonstrated2Set = new Set(eval2.skillsBreakdown.demonstrated.map((d) => d.skill));
    const sharedDemonstratedSkills = [...demonstrated1Set].filter((s) => demonstrated2Set.has(s));

    const readinessDelta = eval1.heuristicReadinessIndex - eval2.heuristicReadinessIndex;

    let alignmentSummary = "";
    if (Math.abs(readinessDelta) <= 5) {
      alignmentSummary = `You demonstrate comparable foundation (${eval1.heuristicReadinessIndex}% vs ${eval2.heuristicReadinessIndex}%) for both tracks, with ${sharedCoreSkills.length} shared competencies.`;
    } else if (readinessDelta > 5) {
      alignmentSummary = `You currently have stronger demonstrated evidence for ${role1.title} (+${readinessDelta} points) primarily due to more verified artifacts in ${role1UniqueCoreSkills.slice(0, 2).join(", ") || "core areas"}.`;
    } else {
      alignmentSummary = `You currently have stronger demonstrated evidence for ${role2.title} (+${Math.abs(readinessDelta)} points) primarily due to verified evidence in ${role2UniqueCoreSkills.slice(0, 2).join(", ") || "core areas"}.`;
    }

    return {
      role1: {
        roleId: role1.roleId,
        title: role1.title,
        roleFamily: role1.roleFamily,
        disciplineCategory: role1.disciplineCategory,
        readinessIndex: eval1.heuristicReadinessIndex,
        readinessBand: eval1.readinessBand,
        evidenceCoveragePercent: eval1.evidenceCoveragePercent,
        uniqueSkills: role1UniqueCoreSkills,
        regulatoryNotes: role1.regulatoryNotes,
      },
      role2: {
        roleId: role2.roleId,
        title: role2.title,
        roleFamily: role2.roleFamily,
        disciplineCategory: role2.disciplineCategory,
        readinessIndex: eval2.heuristicReadinessIndex,
        readinessBand: eval2.readinessBand,
        evidenceCoveragePercent: eval2.evidenceCoveragePercent,
        uniqueSkills: role2UniqueCoreSkills,
        regulatoryNotes: role2.regulatoryNotes,
      },
      comparison: {
        sharedCoreSkills,
        sharedDemonstratedSkills,
        readinessDelta,
        higherReadinessRoleId: readinessDelta > 0 ? role1.roleId : readinessDelta < 0 ? role2.roleId : "equal",
        alignmentSummary,
      },
    };
  }

  /**
   * Generate prioritized, deduplicated preparation plan connecting to existing SSH activities.
   *
   * @param {string} ownerId - Student ID
   * @param {string} roleId - Target role ID
   * @returns {Promise<object>} Ordered preparation plan
   */
  async generateRolePreparationPlan(ownerId, roleId) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to generate preparation plan.");
    }

    const role = this.getRoleById(roleId);
    const readiness = await this.evaluateRoleReadiness(ownerId, roleId);

    const planSteps = [];
    const seenActivities = new Set();
    let stepCounter = 1;

    // Helper to safely append deduplicated activity step
    const addStep = (step) => {
      const dedupKey = `${step.activityType}:${step.activityId || step.targetSkill}`;
      if (seenActivities.has(dedupKey)) return;
      seenActivities.add(dedupKey);
      planSteps.push({
        stepNumber: stepCounter++,
        ...step,
      });
    };

    // 1. Priority: Address Missing Prerequisites
    for (const prereq of readiness.evidenceQualityNotes.missingPrerequisites) {
      for (const missing of prereq.missing) {
        addStep({
          priority: "Immediate (Foundation)",
          targetSkill: missing,
          evidenceGapType: "prerequisite_missing",
          title: `Build prerequisite competency: ${missing}`,
          rationale: `Required foundation before advancing in ${prereq.targetSkill} for the ${role.title} pathway.`,
          activityType: "learning_module",
          activityId: `prereq-${missing.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          activityTitle: `${missing} Foundations & Key Concepts`,
          destinationRoute: "/dashboard/edutube",
          prerequisiteRequirement: null,
          expectedOutcome: `Establish foundational comprehension verified through checkpoint questions.`,
        });
      }
    }

    // 2. Priority: Remediate Active Skill Gaps (Tested < 40%)
    for (const gap of readiness.skillsBreakdown.gaps) {
      // Find matching lab if available
      const matchingLab = (role.suggestedLabIds || [])
        .map((id) => LAB_MAP.get(id))
        .find((l) => l && l.relevantSkills.some((s) => (normalizeSkill(s) || s) === gap.skill));

      if (matchingLab) {
        addStep({
          priority: "High (Remediation)",
          targetSkill: gap.skill,
          evidenceGapType: "skill_gap",
          title: `Remediate skill gap: ${gap.skill} in Practical Lab`,
          rationale: `Recent score (${gap.score}%) fell below proficiency threshold (${gap.targetScore}%). Hands-on practice required.`,
          activityType: "practical_lab",
          activityId: matchingLab.labId,
          activityTitle: matchingLab.title,
          destinationRoute: "/dashboard/labs",
          prerequisiteRequirement: null,
          expectedOutcome: `Achieve >= 70% on interactive calculation tasks to clear gap.`,
        });
      } else {
        addStep({
          priority: "High (Remediation)",
          targetSkill: gap.skill,
          evidenceGapType: "skill_gap",
          title: `Targeted review: ${gap.skill}`,
          rationale: `Demonstrated score was ${gap.score}%. Review fundamental concepts to remediate gap.`,
          activityType: "edutube_video",
          activityId: `video-remediate-${gap.skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          activityTitle: `${gap.skill} Conceptual Masterclass & Review`,
          destinationRoute: "/dashboard/edutube",
          prerequisiteRequirement: null,
          expectedOutcome: `Improve comprehension prior to reassessment.`,
        });
      }
    }

    // 3. Priority: Verify Unassessed Core Skills via Practical Labs
    for (const labId of role.suggestedLabIds || []) {
      const lab = LAB_MAP.get(labId);
      if (lab) {
        const hasUnassessedSkill = lab.relevantSkills.some((s) =>
          readiness.skillsBreakdown.unassessed.some((u) => u.skill === (normalizeSkill(s) || s))
        );

        if (hasUnassessedSkill) {
          addStep({
            priority: "Recommended (Practice)",
            targetSkill: lab.relevantSkills[0] || "Practical Lab",
            evidenceGapType: "missing_evidence",
            title: `Complete Practical Lab: ${lab.title}`,
            rationale: `Directly evaluates core ${role.disciplineCategory} competencies required for ${role.title}.`,
            activityType: "practical_lab",
            activityId: lab.labId,
            activityTitle: lab.title,
            destinationRoute: "/dashboard/labs",
            prerequisiteRequirement: null,
            expectedOutcome: `Generates server-verified practical lab attempt record (0.90 veracity tier).`,
          });
        }
      }
    }

    // 4. Priority: Validate Knowledge via Assessment Center
    for (const assessId of role.suggestedAssessmentIds || []) {
      const assess = ASSESSMENT_MAP.get(assessId);
      if (assess) {
        addStep({
          priority: "Recommended (Validation)",
          targetSkill: assess.relevantSkills[0] || "Assessment Center",
          evidenceGapType: "missing_evidence",
          title: `Take Standard Assessment: ${assess.title}`,
          rationale: `Validates multi-topic domain mastery and provides objective standardized grading.`,
          activityType: "assessment",
          activityId: assess.assessmentId,
          activityTitle: assess.title,
          destinationRoute: "/dashboard/assessments",
          prerequisiteRequirement: null,
          expectedOutcome: `Generates high-veracity Assessment Center attempt (0.95 tier) across ${assess.relevantSkills.join(", ")}.`,
        });
      }
    }

    // 5. Priority: Build Synthesis Artifact in Project Studio
    for (const templateId of role.suggestedProjectIds || []) {
      const proj = PROJECT_MAP.get(templateId);
      if (proj) {
        addStep({
          priority: "Portfolio Synthesis",
          targetSkill: proj.relevantSkills[0] || "Project Studio",
          evidenceGapType: "missing_evidence",
          title: `Build Milestone Project: ${proj.title}`,
          rationale: `Synthesizes theoretical and practical competencies into an evaluated portfolio deliverable.`,
          activityType: "project_studio",
          activityId: proj.templateId,
          activityTitle: proj.title,
          destinationRoute: "/dashboard/projects",
          prerequisiteRequirement: null,
          expectedOutcome: `Produces structured rubric milestone evaluation (0.85 veracity tier) for your portfolio.`,
        });
      }
    }

    // 6. Priority: Refresh Stale Evidence
    for (const stale of readiness.evidenceQualityNotes.staleEvidence) {
      addStep({
        priority: "Maintenance (Spaced Revision)",
        targetSkill: stale.skill,
        evidenceGapType: "stale_evidence",
        title: `Spaced Revision Refresh: ${stale.skill}`,
        rationale: `Evidence was last verified ${stale.daysSinceVerification} days ago. Complete active retrieval to maintain retention.`,
        activityType: "spaced_revision",
        activityId: `rev-${stale.skill.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        activityTitle: `${stale.skill} Retention Review`,
        destinationRoute: "/dashboard/skills",
        prerequisiteRequirement: null,
        expectedOutcome: `Maintains verified active recall memory streak and updates timestamp.`,
      });
    }

    return {
      roleId: role.roleId,
      roleTitle: role.title,
      readinessBand: readiness.readinessBand,
      heuristicReadinessIndex: readiness.heuristicReadinessIndex,
      totalSteps: planSteps.length,
      plan: planSteps,
      regulatoryNotes: role.regulatoryNotes,
      disclaimer: "Preparation recommendations connect to existing Smart Skill Hub activities. Completing recommendations builds verified evidence but does not constitute a placement guarantee.",
    };
  }
}

export const careerPathwayService = new CareerPathwayService();
export default careerPathwayService;
