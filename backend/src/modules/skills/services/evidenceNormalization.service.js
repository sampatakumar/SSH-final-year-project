import mongoose from "mongoose";
import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { AssessmentAttempt } from "../../academic/models/assessmentAttempt.models.js";
import { PracticalLabAttempt } from "../../academic/models/practicalLabAttempt.models.js";
import { StudentProject } from "../../academic/models/studentProject.models.js";
import { CodingSubmission } from "../../coding/models/codingSubmission.models.js";
import { SpacedRevisionSchedule } from "../models/spacedRevisionSchedule.models.js";
import { EduTubeCheckpointAttempt } from "../../edutube/models/edutubeCheckpointAttempt.models.js";
import { LearnerSkillAssessmentHistory } from "../models/learnerSkillAssessmentHistory.models.js";
import { ToolActivityRecord } from "../../tools/models/toolActivityRecord.models.js";
import { GitHubAnalysis } from "../../github/models/githubAnalysis.models.js";
import { Resume } from "../../resume/models/resume.models.js";
import { ASSESSMENTS_CATALOG } from "../../academic/constants/assessmentCatalog.js";

// Map assessmentId to relevant canonical skills for fast lookup
const ASSESSMENT_SKILLS_MAP = new Map();
ASSESSMENTS_CATALOG.forEach((a) => {
  if (a.assessmentId && a.relevantSkills) {
    ASSESSMENT_SKILLS_MAP.set(a.assessmentId, a.relevantSkills);
  }
});

// Map specialized tool IDs to core academic skills
const TOOL_SKILLS_MAP = {
  "biotech-research": ["Molecular Biology", "Bioinformatics", "PCR"],
  "business-kpi": ["Business Strategy", "Financial Modeling", "Strategic Planning"],
  "finance-accounting": ["Accounting", "DCF Valuation", "Financial Modeling"],
  "arts-writing": ["Critical Analysis", "Historical Research", "Academic Writing"],
  "nursing-study": ["Clinical Assessment", "Pharmacology & Drug Administration", "Patient Safety"],
  "mech-calc": ["Engineering Mechanics", "Machine Element Design", "Statics"],
  "civil-boq": ["Structural Analysis", "Reinforced Concrete", "AutoCAD"],
  "ece-circuits": ["Circuit Analysis", "Digital Electronics", "Thevenin Theorem"],
  "chem-process": ["Mass Balance", "Thermodynamics", "Process Engineering"],
  "report-reviewer": ["Critical Analysis", "Technical Writing"],
};

/**
 * Deterministic Heuristic Evidence-Strength Weights (0.0 to 1.0)
 *
 * IMPORTANT METHODOLOGICAL DEFINITION:
 * These values represent deterministic heuristic ranking weights characterizing
 * the verification rigor and objective evaluation veracity of different evidence sources.
 * They are NOT statistically calibrated Bayesian or frequentist probabilities.
 *
 * Veracity Tiers:
 * - 0.95: Objective automated grading (Assessment Center, Docker sandbox execution)
 * - 0.90: Authoritative server-evaluated interactive calculations (Practical Labs, Verified Tool Proofs, Historical records)
 * - 0.85: Structured rubric-based milestone evaluation (Project Studio Deliverables)
 * - 0.80: Formative checkpoint quiz evaluations & formative studio tool practice
 * - 0.75: Spaced retrieval practice recall repetitions & observed public GitHub repository code
 * - 0.50: Self-reported claims from student resumes
 */
export const DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS = Object.freeze({
  ASSESSMENT_CENTER: 0.95,
  CODING_SANDBOX: 0.95,
  PRACTICAL_LAB: 0.90,
  HISTORICAL_ASSESSMENT: 0.90,
  TOOL_DETERMINISTIC_PROOF: 0.90,
  PROJECT_STUDIO_RUBRIC: 0.85,
  QUIZ_CHECKPOINT: 0.80,
  TOOL_ACTIVITY_FORMATIVE: 0.80,
  SPACED_REVISION: 0.75,
  GITHUB_VERIFIED_CODE: 0.75,
  RESUME_CLAIM: 0.50,
});

export class EvidenceNormalizationService {
  /**
   * Safe DB query helper ensuring non-connected Mongoose calls in offline tests do not hang
   */
  async safeFind(model, filter, sort = {}, limit = 50) {
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (model?.find?.mock || isDbConnected) {
      try {
        let query = model.find(filter);
        if (typeof query?.sort === "function") query = query.sort(sort);
        if (typeof query?.limit === "function") query = query.limit(limit);
        if (typeof query?.lean === "function") return await query.lean();
        return await query;
      } catch (err) {
        return [];
      }
    }
    return [];
  }

  /**
   * Fetch and normalize all available learning evidence for an authenticated student
   *
   * @param {string|mongoose.Types.ObjectId} ownerId - Student ID
   * @returns {Promise<object>} Normalized evidence by skill and chronological list
   */
  async getNormalizedStudentEvidence(ownerId) {
    if (!ownerId) {
      return { rawCount: 0, normalizedBySkill: {}, timeline: [] };
    }

    const now = Date.now();
    const ownerIdStr = ownerId.toString();

    const [
      assessmentAttempts,
      studentProjects,
      codingSubmissions,
      spacedRevisions,
      checkpointAttempts,
      historyRecords,
      practicalLabAttempts,
      toolActivityRecords,
      githubRecords,
      resumeRecords,
    ] = await Promise.all([
      this.safeFind(AssessmentAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 50),
      this.safeFind(StudentProject, { owner: ownerId }, { updatedAt: -1 }, 30),
      this.safeFind(CodingSubmission, { owner: ownerId }, { submittedAt: -1 }, 50),
      this.safeFind(SpacedRevisionSchedule, { owner: ownerId }, { updatedAt: -1 }, 30),
      this.safeFind(EduTubeCheckpointAttempt, { owner: ownerId }, { attemptedAt: -1 }, 30),
      this.safeFind(LearnerSkillAssessmentHistory, { owner: ownerId }, { assessmentDate: -1 }, 50),
      this.safeFind(PracticalLabAttempt, { owner: ownerId, status: "submitted" }, { submittedAt: -1 }, 50),
      this.safeFind(ToolActivityRecord, { user: ownerId }, { createdAt: -1 }, 30),
      this.safeFind(GitHubAnalysis, { owner: ownerId }, { updatedAt: -1 }, 5),
      this.safeFind(Resume, { owner: ownerId }, { updatedAt: -1 }, 5),
    ]);

    const timeline = [];
    const seenEvidenceIds = new Set();
    const seenSourceRecordIds = new Set();

    // Helper to calculate evidence age and freshness metadata
    const computeFreshness = (dateString) => {
      const timestamp = dateString ? new Date(dateString).getTime() : now;
      const ageInDays = Math.max(0, Math.round((now - timestamp) / (1000 * 60 * 60 * 24)));
      return {
        ageInDays,
        isFresh: ageInDays <= 60,
        isStale: ageInDays > 60,
      };
    };

    // Helper to safely append deduplicated evidence items
    const appendEvidence = (item) => {
      if (!item || !item.evidenceId || seenEvidenceIds.has(item.evidenceId)) {
        return;
      }
      // Sanitize score and percentage bounds against NaN, Infinity, negative, and out-of-range values
      const rawPct = Number(item.percentage);
      item.percentage = Number.isFinite(rawPct) ? Math.max(0, Math.min(100, Math.round(rawPct))) : 0;
      const rawScore = Number(item.score);
      item.score = Number.isFinite(rawScore) ? Math.max(0, rawScore) : 0;
      const rawMax = Number(item.maxScore);
      item.maxScore = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 100;

      seenEvidenceIds.add(item.evidenceId);
      if (item.sourceRecordId) {
        seenSourceRecordIds.add(item.sourceRecordId);
      }
      timeline.push(item);
    };

    // 1. Normalize Assessment Center attempts (Phase 44)
    const normalizedAssessmentTaskIds = new Set();
    for (const attempt of assessmentAttempts) {
      if (attempt.assessmentId) normalizedAssessmentTaskIds.add(attempt.assessmentId);
      if (attempt._id) normalizedAssessmentTaskIds.add(attempt._id.toString());
      const percentage = attempt.percentage ?? (attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0);
      const isPass = attempt.isPassing ?? percentage >= 70;
      const rawSkills = (attempt.skillsCovered && attempt.skillsCovered.length > 0 ? attempt.skillsCovered : null) || (attempt.skillsEvaluated && attempt.skillsEvaluated.length > 0 ? attempt.skillsEvaluated : null) || ASSESSMENT_SKILLS_MAP.get(attempt.assessmentId) || [attempt.assessmentId];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];
      const dateStr = attempt.submittedAt || attempt.createdAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_assess_${attempt._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceRecordId: attempt._id ? attempt._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "academic/assessment-center",
          academicDiscipline: attempt.disciplineCategory || "Cross-Disciplinary / Shared",
          canonicalSkill: canonical,
          sourceType: "assessment_attempt",
          evidenceType: "objective_automated_scoring",
          status: "demonstrated_knowledge", // Veracity tier: objectively tested by assessment
          verificationStatus: isPass ? "VERIFIED_OBJECTIVE" : "ASSESSED_NEEDS_IMPROVEMENT",
          isPassing: isPass,
          score: attempt.score ?? 0,
          maxScore: attempt.maxScore ?? 100,
          percentage,
          timestamp: dateStr,
          freshness,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.ASSESSMENT_CENTER,
          confidenceType: "deterministic_heuristic_strength",
          provenance: "assessment_center_deterministic_server_evaluation",
          version: attempt.version || 1,
          assessmentId: attempt.assessmentId,
          topicPerformance: attempt.topicPerformance || [],
          metadata: {
            strengths: attempt.strengths || [],
            areasForImprovement: attempt.areasForImprovement || [],
            scoringMethod: attempt.scoringMethod,
          },
        });
      }
    }

    // 2. Normalize Coding Challenges
    const normalizedCodingTaskIds = new Set();
    for (const sub of codingSubmissions) {
      if (sub.taskId) normalizedCodingTaskIds.add(sub.taskId);
      const percentage = sub.score !== undefined ? Math.round((sub.score / 10) * 100) : sub.status === "passed" ? 100 : 0;
      const isPass = sub.status === "passed" || percentage >= 70;
      const canonical = normalizeSkill(sub.skill || sub.taskId) || "Software Development";
      const dateStr = sub.submittedAt || sub.createdAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      appendEvidence({
        evidenceId: `ev_code_${sub._id}`,
        sourceRecordId: sub._id ? sub._id.toString() : null,
        studentOwnership: ownerIdStr,
        sourceModule: "coding/challenges",
        academicDiscipline: "Computer Science & Engineering",
        canonicalSkill: canonical,
        sourceType: "coding_submission",
        evidenceType: "docker_sandbox_execution",
        status: "demonstrated_knowledge", // Veracity tier: automated container execution
        verificationStatus: isPass ? "VERIFIED_OBJECTIVE" : "ASSESSED_NEEDS_IMPROVEMENT",
        isPassing: isPass,
        score: sub.score ?? 0,
        maxScore: 10,
        percentage,
        timestamp: dateStr,
        freshness,
        confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.CODING_SANDBOX,
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.CODING_SANDBOX,
        confidenceType: "deterministic_heuristic_strength",
        provenance: "docker_container_sandbox_automated_test_suite",
        taskId: sub.taskId,
        metadata: {
          testCasesPassed: sub.testCasesPassed,
          testCasesTotal: sub.testCasesTotal,
          language: sub.language,
        },
      });
    }

    // 3. Normalize Practical Learning Lab Attempts (Phase 46)
    for (const labAttempt of practicalLabAttempts) {
      const percentage = labAttempt.percentage ?? (labAttempt.maxScore ? Math.round((labAttempt.serverScore / labAttempt.maxScore) * 100) : 0);
      const isPass = labAttempt.isPassing ?? percentage >= 70;
      const rawSkills = (labAttempt.skillsEvaluated && labAttempt.skillsEvaluated.length > 0)
        ? labAttempt.skillsEvaluated
        : [labAttempt.disciplineCategory || "Practical Skills"];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];
      const dateStr = labAttempt.submittedAt || labAttempt.createdAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_lab_${labAttempt._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceRecordId: labAttempt._id ? labAttempt._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "academic/practical-labs",
          academicDiscipline: labAttempt.disciplineCategory || "Engineering Calculations",
          canonicalSkill: canonical,
          sourceType: "practical_lab",
          evidenceType: "server_evaluated_practical_lab",
          status: "demonstrated_knowledge", // Server-evaluated practical exercise
          verificationStatus: isPass ? "VERIFIED_DETERMINISTIC" : "ASSESSED_NEEDS_IMPROVEMENT",
          isPassing: isPass,
          score: labAttempt.serverScore ?? 0,
          maxScore: labAttempt.maxScore ?? 100,
          percentage,
          timestamp: dateStr,
          freshness,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PRACTICAL_LAB,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PRACTICAL_LAB,
          confidenceType: "deterministic_heuristic_strength",
          provenance: "server_side_deterministic_formula_verification",
          labId: labAttempt.labId,
          version: labAttempt.labVersion || 1,
          metadata: {
            disciplineCategory: labAttempt.disciplineCategory,
            masteryLevel: labAttempt.masteryLevel,
            taskResultsCount: (labAttempt.taskResults || []).length,
          },
        });
      }
    }

    // 4. Normalize Specialized Tool Activity Records (Phases 50, 51, 52)
    for (const toolRec of toolActivityRecords) {
      const toolId = toolRec.toolId;
      const isVerified = toolRec.verificationStatus === "VERIFIED_DETERMINISTIC";
      const confidenceWeight = isVerified
        ? DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.TOOL_DETERMINISTIC_PROOF
        : DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.TOOL_ACTIVITY_FORMATIVE;

      const rawSkills = (toolRec.relevantSkills && toolRec.relevantSkills.length > 0 ? toolRec.relevantSkills : null) || TOOL_SKILLS_MAP[toolId] || [toolRec.academicDiscipline || "Specialized Studio Practice"];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];
      const dateStr = toolRec.createdAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_tool_${toolRec._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceRecordId: toolRec._id ? toolRec._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "tools/specialized-studios",
          academicDiscipline: toolRec.academicDiscipline || "Cross-Disciplinary / Shared",
          canonicalSkill: canonical,
          sourceType: "tool_activity",
          evidenceType: isVerified ? "deterministic_tool_calculation" : "formative_studio_practice",
          // Formative practice: never silently promote AI/tool activity to independent demonstrated mastery
          status: isVerified ? "inferred_proficiency" : "formative_practice",
          verificationStatus: toolRec.verificationStatus || (isVerified ? "VERIFIED_DETERMINISTIC" : "FORMATIVE_PRACTICE"),
          isPassing: toolRec.status === "success",
          score: isVerified ? 85 : 75,
          maxScore: 100,
          percentage: isVerified ? 85 : 75,
          timestamp: dateStr,
          freshness,
          confidence: confidenceWeight,
          confidenceWeight: confidenceWeight,
          confidenceType: "deterministic_heuristic_strength",
          provenance: toolRec.provenance || "specialized_tool_deterministic_execution",
          toolId: toolRec.toolId,
          metadata: {
            toolDisplayName: toolRec.toolDisplayName,
            academicDiscipline: toolRec.academicDiscipline,
            executionMode: toolRec.executionMode,
            isSavedToPortfolio: Boolean(toolRec.isSavedToPortfolio),
            portfolioHeadline: toolRec.portfolioMetadata?.headline || "",
            reportTitle: toolRec.reportDraft?.title || "",
          },
        });
      }
    }

    // 5. Normalize Project Studio Deliverables (Phase 43)
    for (const proj of studentProjects) {
      const evaluation = proj.evaluation || {};
      const percentage = evaluation.overallScore ?? (proj.status === "completed" ? 85 : 50);
      const isPass = percentage >= 70;
      const rawSkills = proj.relevantSkills || [proj.disciplineCategory || "Applied Project"];
      const uniqueSkills = [...new Set(rawSkills.map((s) => normalizeSkill(s) || s))];
      const dateStr = proj.evaluatedAt || proj.updatedAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      for (const canonical of uniqueSkills) {
        appendEvidence({
          evidenceId: `ev_proj_${proj._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceRecordId: proj._id ? proj._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "academic/project-studio",
          academicDiscipline: proj.disciplineCategory || "Engineering Projects",
          canonicalSkill: canonical,
          sourceType: "project_deliverable",
          evidenceType: "rubric_milestone_evaluation",
          status: "inferred_proficiency", // Structured rubric assessment
          verificationStatus: isPass ? "RUBRIC_EVALUATED" : "IN_PROGRESS",
          isPassing: isPass,
          score: evaluation.overallScore ?? percentage,
          maxScore: 100,
          percentage,
          timestamp: dateStr,
          freshness,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.PROJECT_STUDIO_RUBRIC,
          confidenceType: "deterministic_heuristic_strength",
          provenance: "project_studio_structured_rubric_evaluation",
          templateId: proj.templateId,
          metadata: {
            status: proj.status,
            milestonesCompleted: (proj.milestonesProgress || []).filter((m) => m.isCompleted).length,
            milestonesTotal: (proj.milestonesProgress || []).length,
          },
        });
      }
    }

    // 6. Normalize Spaced Revision Sessions (Phase 39)
    for (const rev of spacedRevisions) {
      if (rev.lastReviewedDate) {
        const percentage = rev.lastScore ?? (rev.status === "completed" ? 80 : 50);
        const canonical = normalizeSkill(rev.canonicalName || rev.skill) || rev.skill;
        const freshness = computeFreshness(rev.lastReviewedDate);

        appendEvidence({
          evidenceId: `ev_rev_${rev._id}`,
          sourceRecordId: rev._id ? rev._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "skills/spaced-revision",
          academicDiscipline: "Applied Cognition & Retrieval Practice",
          canonicalSkill: canonical,
          sourceType: "spaced_revision",
          evidenceType: "retrieval_practice_session",
          status: "inferred_proficiency",
          verificationStatus: percentage >= 70 ? "RETRIEVAL_PRACTICE_ACTIVE" : "RETRIEVAL_DUE",
          isPassing: percentage >= 70,
          score: percentage,
          maxScore: 100,
          percentage,
          timestamp: rev.lastReviewedDate,
          freshness,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.SPACED_REVISION,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.SPACED_REVISION,
          confidenceType: "deterministic_heuristic_strength",
          provenance: "spaced_retrieval_interval_schedule",
          metadata: {
            retrievalInterval: rev.currentIntervalDays,
            consecutiveSuccesses: rev.consecutiveSuccesses,
          },
        });
      }
    }

    // 7. Normalize Checkpoint Quiz Attempts (EduTube)
    for (const cp of checkpointAttempts) {
      const canonical = normalizeSkill(cp.skill || "General Knowledge") || "General Knowledge";
      const dateStr = cp.attemptedAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      appendEvidence({
        evidenceId: `ev_cp_${cp._id}`,
        sourceRecordId: cp._id ? cp._id.toString() : null,
        studentOwnership: ownerIdStr,
        sourceModule: "edutube/checkpoints",
        academicDiscipline: "Educational Video Curriculum",
        canonicalSkill: canonical,
        sourceType: "quiz_checkpoint",
        evidenceType: "formative_checkpoint_quiz",
        status: "demonstrated_knowledge",
        verificationStatus: cp.isCorrect ? "VERIFIED_OBJECTIVE" : "ASSESSED_NEEDS_IMPROVEMENT",
        isPassing: Boolean(cp.isCorrect),
        score: cp.isCorrect ? 100 : 0,
        maxScore: 100,
        percentage: cp.isCorrect ? 100 : 0,
        timestamp: dateStr,
        freshness,
        confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.QUIZ_CHECKPOINT,
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.QUIZ_CHECKPOINT,
        confidenceType: "deterministic_heuristic_strength",
        provenance: "edutube_video_checkpoint_assessment",
        metadata: {
          videoId: cp.videoId,
          questionId: cp.questionId,
        },
      });
    }

    // 8. Normalize Historical Assessment records (with Safeguard 2 Deduplication)
    for (const hist of historyRecords) {
      // SAFEGUARD 2: Do NOT count the same assessment twice because it was recorded in multiple modules
      if (
        hist.evidenceSource === "assessment" &&
        (normalizedAssessmentTaskIds.has(hist.taskId) ||
         normalizedAssessmentTaskIds.has(hist.assessmentId) ||
         (hist.assessmentId && normalizedAssessmentTaskIds.has(hist.assessmentId.toString())))
      ) {
        continue;
      }
      if (hist.evidenceSource === "coding" && normalizedCodingTaskIds.has(hist.taskId)) {
        continue;
      }

      const canonical = normalizeSkill(hist.canonicalName || hist.skill) || hist.skill;
      const dateStr = hist.assessmentDate || hist.createdAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      appendEvidence({
        evidenceId: `ev_hist_${hist._id}`,
        sourceRecordId: hist._id ? hist._id.toString() : null,
        studentOwnership: ownerIdStr,
        sourceModule: "skills/assessment-history",
        academicDiscipline: "Historical Assessments",
        canonicalSkill: canonical,
        sourceType: "skill_history",
        evidenceType: "historical_assessment_log",
        status: "demonstrated_knowledge",
        verificationStatus: hist.score >= 70 ? "VERIFIED_OBJECTIVE" : "ASSESSED_NEEDS_IMPROVEMENT",
        isPassing: hist.score >= 70,
        score: hist.score,
        maxScore: 100,
        percentage: hist.score,
        timestamp: dateStr,
        freshness,
        confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.HISTORICAL_ASSESSMENT,
        confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.HISTORICAL_ASSESSMENT,
        confidenceType: "deterministic_heuristic_strength",
        provenance: "historical_assessment_record",
        metadata: {
          scoreDelta: hist.scoreDelta,
          previousScore: hist.previousScore,
          evidenceSource: hist.evidenceSource,
        },
      });
    }

    // 9. Normalize Verified GitHub Intelligence Code Evidence
    for (const gh of githubRecords) {
      const languages = gh.languages || [];
      const dateStr = gh.updatedAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      for (const lang of languages) {
        const canonical = normalizeSkill(lang.name || lang) || lang;
        appendEvidence({
          evidenceId: `ev_gh_${gh._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceRecordId: gh._id ? gh._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "github/intelligence",
          academicDiscipline: "Software Engineering & Code Repositories",
          canonicalSkill: canonical,
          sourceType: "github_repository",
          evidenceType: "verified_public_code_volume",
          status: "inferred_proficiency",
          verificationStatus: "OBSERVED_PUBLIC_REPOSITORY",
          isPassing: (lang.byteCount || 0) > 1000,
          score: Math.min(100, Math.round(((lang.byteCount || 5000) / 10000) * 80)),
          maxScore: 100,
          percentage: Math.min(100, Math.round(((lang.byteCount || 5000) / 10000) * 80)),
          timestamp: dateStr,
          freshness,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.GITHUB_VERIFIED_CODE,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.GITHUB_VERIFIED_CODE,
          confidenceType: "deterministic_heuristic_strength",
          provenance: "github_public_repository_analysis",
          metadata: {
            byteCount: lang.byteCount,
            repoCount: gh.totalRepos || 1,
          },
        });
      }
    }

    // 10. Normalize Resume Claims (Strictly Self-Reported; Never Promoted to Verified)
    for (const resItem of resumeRecords) {
      const skills = (resItem.skills || []).slice(0, 15);
      const dateStr = resItem.updatedAt || resItem.createdAt || new Date().toISOString();
      const freshness = computeFreshness(dateStr);

      for (const raw of skills) {
        const canonical = normalizeSkill(raw) || raw;
        appendEvidence({
          evidenceId: `ev_res_${resItem._id}_${canonical.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          sourceRecordId: resItem._id ? resItem._id.toString() : null,
          studentOwnership: ownerIdStr,
          sourceModule: "resume/analysis",
          academicDiscipline: "Self-Reported Resume Claims",
          canonicalSkill: canonical,
          sourceType: "resume_claim",
          evidenceType: "self_reported_skill_claim",
          // Strictly self-reported: NEVER treat resume claim as verified skill
          status: "self_reported",
          verificationStatus: "SELF_REPORTED_CLAIM",
          isPassing: false,
          score: 50,
          maxScore: 100,
          percentage: 50,
          timestamp: dateStr,
          freshness,
          confidence: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.RESUME_CLAIM,
          confidenceWeight: DETERMINISTIC_EVIDENCE_STRENGTH_WEIGHTS.RESUME_CLAIM,
          confidenceType: "deterministic_heuristic_strength",
          provenance: "resume_extracted_keyword_claim",
          metadata: {
            resumeTitle: resItem.title || "Curriculum Vitae",
          },
        });
      }
    }

    // Sort complete timeline descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Group normalized evidence by canonical skill
    const normalizedBySkill = {};
    for (const item of timeline) {
      const key = item.canonicalSkill;
      if (!normalizedBySkill[key]) {
        normalizedBySkill[key] = {
          canonicalSkill: key,
          history: [],
          latestEvidence: null,
          previousEvidence: null,
          highestEvidence: null,
          overallStatus: "insufficient_evidence",
          latestScore: 0,
          previousScore: null,
          scoreDelta: null,
          hasPassed: false,
          hasDemonstratedEvidence: false,
          hasVerifiedDeterministicProof: false,
          hasConflictingEvidence: false,
          conflictSummary: null,
          isStale: false,
        };
      }

      normalizedBySkill[key].history.push(item);
    }

    // Compute skill aggregates and progression deltas
    for (const [key, skillData] of Object.entries(normalizedBySkill)) {
      const items = skillData.history;
      if (items.length > 0) {
        skillData.latestEvidence = items[0];
        skillData.latestScore = items[0].percentage;
        skillData.hasPassed = items.some((i) => i.isPassing);
        skillData.hasDemonstratedEvidence = items.some((i) => i.status === "demonstrated_knowledge");
        skillData.hasVerifiedDeterministicProof = items.some((i) => i.verificationStatus === "VERIFIED_DETERMINISTIC");
        skillData.isStale = Boolean(items[0].freshness?.isStale);

        // Find highest score
        let highest = items[0];
        for (const it of items) {
          if (it.percentage > highest.percentage) {
            highest = it;
          }
        }
        skillData.highestEvidence = highest;

        // If there's an earlier comparable evidence item (from the same source type)
        const previousComparable = items.slice(1).find((it) => it.sourceType === items[0].sourceType);
        if (previousComparable) {
          skillData.previousEvidence = previousComparable;
          skillData.previousScore = previousComparable.percentage;
          skillData.scoreDelta = items[0].percentage - previousComparable.percentage;
        }

        // Detect conflicting evidence (passing vs failing attempts, or high divergence >= 35% between tested records)
        const evaluatedItems = items.filter(
          (i) => i.status === "demonstrated_knowledge" || i.status === "inferred_proficiency"
        );
        if (evaluatedItems.length >= 2) {
          const hasPass = evaluatedItems.some((i) => i.isPassing);
          const hasFail = evaluatedItems.some((i) => !i.isPassing);
          const scores = evaluatedItems.map((i) => i.percentage);
          const minScore = Math.min(...scores);
          const maxScore = Math.max(...scores);
          if ((hasPass && hasFail) || maxScore - minScore >= 35) {
            skillData.hasConflictingEvidence = true;
            skillData.conflictSummary = `Conflicting performance detected for ${key} across attempts (${minScore}% vs ${maxScore}%). Formative practice or re-assessment recommended.`;
          }
        }

        // Determine overall status based on highest confidence evidence
        const hasDemonstrated = items.some((i) => i.status === "demonstrated_knowledge");
        const hasInferred = items.some((i) => i.status === "inferred_proficiency");

        if (hasDemonstrated) {
          skillData.overallStatus = "demonstrated_knowledge";
        } else if (hasInferred) {
          skillData.overallStatus = "inferred_proficiency";
        } else {
          skillData.overallStatus = "self_reported";
        }
      }
    }

    return {
      rawCount: timeline.length,
      normalizedBySkill,
      timeline,
      records: timeline,
    };
  }
}

export const evidenceNormalizationService = new EvidenceNormalizationService();
export default evidenceNormalizationService;
