import mongoose from "mongoose";
import { User } from "../../../core/database/models/user.models.js";
import { UserSettings } from "../../settings/models/userSettings.models.js";
import { SkillProfile } from "../models/skillProfile.models.js";
import { evidenceNormalizationService } from "./evidenceNormalization.service.js";
import { careerPathwayService } from "../../career/services/careerPathway.service.js";
import { skillGapDiagnosisService } from "./skillGapDiagnosis.service.js";
import { adaptiveLearningPathwayService } from "../../recommendations/services/adaptiveLearningPathway.service.js";
import { normalizeAcademicProfile } from "../../academic/services/academicNormalization.service.js";
import { getBranchCapabilities } from "../../academic/services/branchCapabilityRegistry.service.js";
import { ToolActivityRecord } from "../../tools/models/toolActivityRecord.models.js";
import { StudentProject } from "../../academic/models/studentProject.models.js";
import { AssessmentAttempt } from "../../academic/models/assessmentAttempt.models.js";
import { PracticalLabAttempt } from "../../academic/models/practicalLabAttempt.models.js";
import { Portfolio } from "../../../models/portfolio.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

// In-memory context cache for performance (5 minutes TTL per user)
const UNIFIED_CONTEXT_CACHE = new Map();
const UNIFIED_CACHE_TTL_MS = 5 * 60 * 1000;

export class UnifiedStudentContextService {
  /**
   * Check cache for existing authorized student context
   */
  getCachedContext(ownerId) {
    const key = `unifiedContext:${ownerId.toString()}`;
    const cached = UNIFIED_CONTEXT_CACHE.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > UNIFIED_CACHE_TTL_MS) {
      UNIFIED_CONTEXT_CACHE.delete(key);
      return null;
    }
    return cached.data;
  }

  /**
   * Store context in cache
   */
  setCachedContext(ownerId, data) {
    const key = `unifiedContext:${ownerId.toString()}`;
    UNIFIED_CONTEXT_CACHE.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate cache on new activity completion
   */
  invalidateContext(ownerId) {
    if (!ownerId) return;
    const key = `unifiedContext:${ownerId.toString()}`;
    UNIFIED_CONTEXT_CACHE.delete(key);
  }

  /**
   * Helper to execute safe DB query
   */
  async safeFind(model, filter, sort = {}, limit = 20) {
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (model?.find?.mock || isDbConnected) {
      try {
        let query = model.find(filter);
        if (typeof query?.sort === "function") query = query.sort(sort);
        if (typeof query?.limit === "function") query = query.limit(limit);
        if (typeof query?.lean === "function") return await query.lean();
        return await query;
      } catch {
        return [];
      }
    }
    return [];
  }

  /**
   * Assemble a unified, evidence-aware student context answering the 5 core architectural questions:
   * 1. What is this student trying to achieve?
   * 2. What evidence do we actually have about their current skills?
   * 3. Which important gaps remain?
   * 4. What is the most useful next learning action?
   * 5. How does that action support the student's chosen career pathway?
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Authenticated student ID
   * @param {object} [options] - Options { forceRefresh, targetRoleOverride }
   * @returns {Promise<object>} Complete, privacy-scoped, evidence-grounded student context
   */
  async getUnifiedStudentContext(ownerId, { forceRefresh = false, targetRoleOverride = null } = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to access student context.");
    }

    const ownerIdStr = ownerId.toString();

    if (!forceRefresh) {
      const cached = this.getCachedContext(ownerId);
      if (cached) return cached;
    }

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);

    // Parallel fetch of core user profile, settings, and activity records
    const [
      user,
      settings,
      skillProfile,
      normalizedEvidence,
      recentToolActivities,
      recentProjects,
      recentAssessments,
      recentLabs,
      userPortfolios,
    ] = await Promise.all([
      (isDbConnected || User.findById?.mock) ? User.findById(ownerId).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || UserSettings.findOne?.mock) ? UserSettings.findOne({ owner: ownerId }).lean().catch(() => null) : Promise.resolve(null),
      (isDbConnected || SkillProfile.findOne?.mock) ? SkillProfile.findOne({ owner: ownerId }).lean().catch(() => null) : Promise.resolve(null),
      evidenceNormalizationService.getNormalizedStudentEvidence(ownerId),
      this.safeFind(ToolActivityRecord, { user: ownerId }, { createdAt: -1 }, 10),
      this.safeFind(StudentProject, { owner: ownerId }, { updatedAt: -1 }, 5),
      this.safeFind(AssessmentAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 5),
      this.safeFind(PracticalLabAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 5),
      this.safeFind(Portfolio, { userId: ownerId }, { updatedAt: -1 }, 5),
    ]);

    // 1. QUESTION 1: What is this student trying to achieve?
    const normalizedAcademic = normalizeAcademicProfile(user?.academic);
    const branchCapabilities = getBranchCapabilities(normalizedAcademic.branchSlug);
    const academicDiscipline = branchCapabilities.disciplineFamily || "Cross-Disciplinary / Shared";

    const targetRole =
      targetRoleOverride ||
      user?.targetRole ||
      skillProfile?.targetRole ||
      (academicDiscipline.includes("Mechanical") ? "Mechanical Design Engineer"
        : academicDiscipline.includes("Civil") ? "Structural Design Engineer"
        : academicDiscipline.includes("Electronics") ? "Embedded Systems Engineer"
        : academicDiscipline.includes("Biotechnology") ? "Biotechnology Research Analyst"
        : academicDiscipline.includes("Business") ? "Business Intelligence Analyst"
        : academicDiscipline.includes("Finance") ? "Financial Analyst"
        : academicDiscipline.includes("Nursing") ? "Clinical Nurse Specialist"
        : academicDiscipline.includes("Arts") ? "Technical Research Writer"
        : "Full Stack Developer");

    let careerPathwayData = null;
    try {
      careerPathwayData = await careerPathwayService.evaluateRoleReadiness(ownerId, targetRole, normalizedEvidence);
    } catch {
      // Fallback if target role is custom or not in static catalog
      careerPathwayData = {
        roleId: targetRole.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        roleTitle: targetRole,
        heuristicReadinessIndex: 0,
        readinessBand: "Unassessed",
        skillsBreakdown: { demonstrated: [], partial: [], unassessed: [], gaps: [] },
        unassessableCompetencies: [],
        disclaimer: "Internal heuristic readiness index for formative learning guidance only; does NOT represent a statistically validated employment probability, placement guarantee, or hiring prediction.",
      };
    }

    // 2. QUESTION 2: What evidence do we actually have about their current skills?
    const evidenceBySkill = normalizedEvidence.normalizedBySkill || {};
    const evidenceTimeline = normalizedEvidence.timeline || [];

    // Categorize evidence by veracity tier
    const verifiedEvidence = [];
    const rubricEvidence = [];
    const formativeEvidence = [];
    const selfReportedEvidence = [];

    for (const item of evidenceTimeline) {
      if (item.status === "demonstrated_knowledge" || item.verificationStatus === "VERIFIED_DETERMINISTIC" || item.verificationStatus === "VERIFIED_OBJECTIVE") {
        verifiedEvidence.push(item);
      } else if (item.status === "inferred_proficiency" || item.verificationStatus === "RUBRIC_EVALUATED") {
        rubricEvidence.push(item);
      } else if (item.status === "formative_practice") {
        formativeEvidence.push(item);
      } else {
        selfReportedEvidence.push(item);
      }
    }

    // Recently improved skills (scoreDelta > 0 on comparable evidence)
    const recentlyImprovedSkills = Object.values(evidenceBySkill)
      .filter((s) => s.scoreDelta !== null && s.scoreDelta > 0)
      .map((s) => ({
        skill: s.canonicalSkill,
        currentScore: s.latestScore,
        previousScore: s.previousScore,
        scoreDelta: s.scoreDelta,
        evidenceType: s.latestEvidence?.evidenceType,
        sourceModule: s.latestEvidence?.sourceModule,
      }));

    // 3. QUESTION 3: Which important gaps remain?
    const skillDiagnosis = skillGapDiagnosisService.diagnoseStudentSkillGaps(user, normalizedEvidence, targetRole);
    const activeGaps = skillDiagnosis.priorityGaps || [];
    const unassessedSkills = skillDiagnosis.unassessedSkills || [];

    // 4 & 5. QUESTIONS 4 & 5: What is the most useful next learning action and how does it support their career pathway?
    let adaptivePlan = null;
    try {
      adaptivePlan = await adaptiveLearningPathwayService.generateLearningPathway(ownerId, targetRole, user);
    } catch {
      adaptivePlan = { primaryNextStep: null, actions: [] };
    }

    // Project Studio Deliverables & Portfolio Showcase Progress
    const activeProjects = recentProjects.map((p) => ({
      projectId: p._id,
      title: p.title,
      templateId: p.templateId,
      status: p.status,
      milestonesCompleted: (p.milestonesProgress || []).filter((m) => m.isCompleted).length,
      milestonesTotal: (p.milestonesProgress || []).length,
      evaluation: p.evaluation || null,
      updatedAt: p.updatedAt,
    }));

    // Explicitly shared portfolio artifacts (combining ToolActivityRecords and Portfolio entries)
    const sharedToolArtifacts = recentToolActivities
      .filter((t) => t.isSavedToPortfolio)
      .map((t) => ({
        artifactId: t._id,
        type: "tool_activity_artifact",
        toolId: t.toolId,
        toolDisplayName: t.toolDisplayName || t.toolId,
        title: t.portfolioMetadata?.headline || t.reportDraft?.title || t.headline || "Specialized Studio Artifact",
        headline: t.portfolioMetadata?.headline || t.reportDraft?.title || t.headline || "Specialized Studio Artifact",
        summary: t.portfolioMetadata?.summary || t.problemStatement || "",
        tags: t.portfolioMetadata?.tags || [],
        savedAt: t.portfolioMetadata?.savedAt || t.createdAt,
        verificationStatus: t.verificationStatus,
        isShared: true,
      }));

    // Recent Activity chronological feed (Assessments, Labs, Tools, Projects)
    const recentActivityFeed = [
      ...recentAssessments.map((a) => ({
        type: "assessment",
        id: a._id,
        title: a.assessmentId,
        score: a.percentage,
        isPassing: a.isPassing,
        timestamp: a.submittedAt || a.createdAt,
        route: `/dashboard/assessments?id=${a.assessmentId}`,
      })),
      ...recentLabs.map((l) => ({
        type: "practical_lab",
        id: l._id,
        title: l.labId,
        score: l.percentage,
        isPassing: l.isPassing,
        timestamp: l.submittedAt || l.createdAt,
        route: `/dashboard/labs`,
      })),
      ...recentToolActivities.map((t) => ({
        type: "specialized_tool",
        id: t._id,
        title: t.toolDisplayName || t.toolId,
        score: t.verificationStatus === "VERIFIED_DETERMINISTIC" ? 100 : 75,
        isPassing: t.status === "success",
        timestamp: t.createdAt,
        route: `/dashboard/tools/${t.toolId}`,
      })),
      ...recentProjects.map((p) => ({
        type: "project_milestone",
        id: p._id,
        title: p.title,
        score: p.evaluation?.overallScore ?? 80,
        isPassing: p.status === "completed",
        timestamp: p.updatedAt,
        route: `/dashboard/projects`,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    const primaryAction = adaptivePlan.primaryNextStep || null;
    const secondaryActions = (adaptivePlan.actions || []).filter((a) => a !== primaryAction).slice(0, 4);

    const questionsAnswered = {
      targetObjective: `Student is preparing for '${targetRole}' in '${academicDiscipline}'.`,
      evidenceSummary: `Ledger tracks ${evidenceTimeline.length} total evidence item(s) (${verifiedEvidence.length} verified proof, ${rubricEvidence.length} rubric evaluated, ${formativeEvidence.length} formative practice, ${selfReportedEvidence.length} self-reported).`,
      remainingGaps: `Identified ${activeGaps.length} priority gap(s) and ${unassessedSkills.length} unassessed required competencies.`,
      nextLearningAction: primaryAction ? `Recommended next action: '${primaryAction.title}' (${primaryAction.actionType}, ~${primaryAction.estimatedMinutes}m).` : "All immediate milestone actions complete.",
      careerPathwayAlignment: `Directly aligns with '${careerPathwayData.roleTitle || targetRole}' (${careerPathwayData.readinessBand || "Developing"}, ${careerPathwayData.heuristicReadinessIndex || 0}% readiness).`,
    };

    const studentProfile = {
      studentId: ownerIdStr,
      displayName: user?.displayName || user?.name || "Student",
      email: user?.email,
      canonicalDiscipline: normalizedAcademic.branchSlug,
      branchName: normalizedAcademic.branchName,
      degreeName: normalizedAcademic.degreeName,
      semester: normalizedAcademic.currentSemester || null,
    };

    const learningOverview = {
      academicDiscipline,
      targetCareerRole: targetRole,
      activeLearningStage: adaptivePlan.cycleStage || "ASSESS",
      overallReadinessScore: careerPathwayData.heuristicReadinessIndex || 0,
      studyStreakDays: 0,
      weeklyStudyHours: 0,
    };

    const context = {
      questionsAnswered,
      studentProfile,
      learningOverview,
      careerReadiness: careerPathwayData,
      evidenceLedger: {
        summary: {
          totalRecords: evidenceTimeline.length,
          verifiedCount: verifiedEvidence.length,
          rubricScoredCount: rubricEvidence.length,
          formativePracticeCount: formativeEvidence.length,
          selfReportedCount: selfReportedEvidence.length,
          inferredCount: rubricEvidence.length,
        },
        records: evidenceTimeline,
        recentlyImprovedSkills,
        skillsDemonstrated: Object.values(evidenceBySkill)
          .filter((s) => s.overallStatus === "demonstrated_knowledge")
          .map((s) => ({ skill: s.canonicalSkill, latestScore: s.latestScore })),
        skillsInferred: Object.values(evidenceBySkill)
          .filter((s) => s.overallStatus === "inferred_proficiency")
          .map((s) => ({ skill: s.canonicalSkill, latestScore: s.latestScore })),
        skillsSelfReported: Object.values(evidenceBySkill)
          .filter((s) => s.overallStatus === "self_reported")
          .map((s) => ({ skill: s.canonicalSkill, latestScore: s.latestScore })),
      },
      skillGapAnalysis: {
        totalDiagnosed: (skillDiagnosis.diagnosedSkills || []).length,
        priorityGapsCount: activeGaps.length,
        masteredSkillsCount: (skillDiagnosis.masteredSkills || []).length,
        unassessedCount: unassessedSkills.length,
        priorityGaps: activeGaps,
        masteredSkills: skillDiagnosis.masteredSkills || [],
        unassessedSkills,
      },
      nextBestAction: {
        primaryAction,
        secondaryActions,
        primary: primaryAction,
        secondary: secondaryActions,
        cycleStage: adaptivePlan.cycleStage,
      },
      activeProjects,
      portfolioArtifacts: sharedToolArtifacts,
      recentActivity: recentActivityFeed,
      // Backwards-compatible aliases
      student: studentProfile,
      goalsAndPathway: {
        targetRole,
        academicDiscipline,
        readinessIndex: careerPathwayData.heuristicReadinessIndex,
        readinessBand: careerPathwayData.readinessBand,
        evidenceCoveragePercent: careerPathwayData.evidenceCoveragePercent || 0,
        coreSkillsCount: careerPathwayData.counts?.totalCoreSkills || 0,
        demonstratedCount: careerPathwayData.counts?.demonstrated || 0,
        unassessedCount: careerPathwayData.counts?.unassessed || 0,
        gapsCount: careerPathwayData.counts?.gaps || 0,
      },
      skillGaps: {
        activeGapsCount: activeGaps.length,
        priorityGaps: activeGaps.slice(0, 5),
        unassessedSkills: unassessedSkills.slice(0, 5),
      },
      projectAndPortfolio: {
        activeProjects,
        sharedArtifacts: sharedToolArtifacts,
        publishedPortfoliosCount: userPortfolios.length,
      },
      generatedAt: new Date().toISOString(),
    };

    this.setCachedContext(ownerId, context);
    return context;
  }
}

export const unifiedStudentContextService = new UnifiedStudentContextService();
export default unifiedStudentContextService;
