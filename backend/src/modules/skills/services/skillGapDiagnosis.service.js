import { normalizeSkill } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import { evidenceNormalizationService } from "./evidenceNormalization.service.js";
import { ROLE_REQUIREMENTS } from "../../gaps/benchmarks/roleRequirements.js";
import { ASSESSMENTS_CATALOG } from "../../academic/constants/assessmentCatalog.js";

// Multi-discipline prerequisite dependency graph
export const DISCIPLINE_PREREQUISITE_GRAPH = {
  // Mechanical Engineering
  "Engineering Mechanics": { prerequisites: ["Calculus I", "Physics (Mechanics)"], difficulty: "Intermediate" },
  "Statics": { prerequisites: ["Engineering Mechanics"], difficulty: "Intermediate" },
  "Truss Analysis": { prerequisites: ["Statics", "Free Body Diagrams"], difficulty: "Intermediate" },
  "Materials Science": { prerequisites: ["General Chemistry", "Physics"], difficulty: "Beginner" },
  "Machine Element Design": { prerequisites: ["Strength of Materials", "Engineering Mechanics"], difficulty: "Advanced" },
  "SolidWorks": { prerequisites: ["Engineering Drawing"], difficulty: "Intermediate" },

  // Electronics & Electrical (ECE / EEE)
  "Circuit Analysis": { prerequisites: ["Physics (Electricity & Magnetism)", "Differential Equations"], difficulty: "Beginner" },
  "Digital Electronics": { prerequisites: ["Boolean Algebra", "Circuit Analysis"], difficulty: "Intermediate" },
  "Thevenin Theorem": { prerequisites: ["Circuit Analysis"], difficulty: "Intermediate" },
  "Op-Amps": { prerequisites: ["Circuit Analysis", "Analog Electronics"], difficulty: "Intermediate" },
  "Embedded C": { prerequisites: ["C Programming", "Digital Electronics"], difficulty: "Intermediate" },

  // Civil Engineering
  "Structural Analysis": { prerequisites: ["Engineering Mechanics", "Strength of Materials"], difficulty: "Intermediate" },
  "Reinforced Concrete": { prerequisites: ["Structural Analysis", "Construction Materials"], difficulty: "Advanced" },
  "Reinforced Concrete Design": { prerequisites: ["Structural Analysis", "Construction Materials"], difficulty: "Advanced" },
  "AutoCAD": { prerequisites: ["Engineering Drawing"], difficulty: "Beginner" },

  // Chemical Engineering
  "Mass Balance": { prerequisites: ["General Chemistry", "Calculus I"], difficulty: "Intermediate" },
  "Thermodynamics": { prerequisites: ["Physics", "Physical Chemistry"], difficulty: "Intermediate" },
  "Process Engineering": { prerequisites: ["Mass Balance", "Thermodynamics"], difficulty: "Advanced" },

  // Biotechnology
  "Molecular Biology": { prerequisites: ["Cell Biology", "Biochemistry"], difficulty: "Intermediate" },
  "Bioinformatics": { prerequisites: ["Molecular Biology", "Basic Python"], difficulty: "Intermediate" },
  "PCR": { prerequisites: ["Molecular Biology"], difficulty: "Beginner" },

  // Business & Finance
  "Business Strategy": { prerequisites: ["Microeconomics", "Business Fundamentals"], difficulty: "Intermediate" },
  "Financial Modeling": { prerequisites: ["Corporate Accounting", "Excel Basics"], difficulty: "Intermediate" },
  "Valuation": { prerequisites: ["Financial Modeling", "Corporate Finance"], difficulty: "Advanced" },
  "DCF Valuation": { prerequisites: ["Financial Modeling", "Corporate Finance"], difficulty: "Advanced" },
  "Accounting": { prerequisites: ["Business Math"], difficulty: "Beginner" },

  // Arts & Humanities
  "Critical Analysis": { prerequisites: ["Formal Logic", "Academic Writing"], difficulty: "Beginner" },
  "Historical Research": { prerequisites: ["Critical Analysis", "Source Criticism"], difficulty: "Intermediate" },

  // Nursing & Healthcare
  "Clinical Assessment": { prerequisites: ["Human Anatomy & Physiology"], difficulty: "Intermediate" },
  "Pharmacology & Drug Administration": { prerequisites: ["Human Anatomy & Physiology", "Biochemistry"], difficulty: "Intermediate" },
  "Patient Safety": { prerequisites: ["Clinical Assessment"], difficulty: "Beginner" },

  // Computer Science & IT
  "Data Structures": { prerequisites: ["Variables & Loops", "Arrays"], difficulty: "Intermediate" },
  "Algorithms": { prerequisites: ["Data Structures", "Time Complexity"], difficulty: "Intermediate" },
  "React": { prerequisites: ["JavaScript", "HTML/CSS"], difficulty: "Intermediate" },
  "Node.js": { prerequisites: ["JavaScript", "Asynchronous Programming"], difficulty: "Intermediate" },
  "Docker": { prerequisites: ["Linux CLI", "Networking Basics"], difficulty: "Intermediate" },
  "System Design": { prerequisites: ["REST APIs", "Database Fundamentals", "Distributed Concepts"], difficulty: "Advanced" },
};

export class SkillGapDiagnosisService {
  /**
   * Determine prerequisite readiness for a skill given current learner skills map
   */
  checkPrerequisites(skill, normalizedEvidenceMap = {}) {
    const canonical = normalizeSkill(skill) || skill;
    const config = DISCIPLINE_PREREQUISITE_GRAPH[canonical] || { prerequisites: [], difficulty: "Medium" };

    const statusList = [];
    const missing = [];

    for (const prereq of config.prerequisites) {
      const canonicalPrereq = normalizeSkill(prereq) || prereq;
      const evidence = normalizedEvidenceMap[canonicalPrereq];
      const isMet = Boolean(evidence && evidence.latestScore >= 70);

      statusList.push({
        prerequisite: canonicalPrereq,
        isMet,
        score: evidence?.latestScore ?? null,
      });

      if (!isMet) {
        missing.push(canonicalPrereq);
      }
    }

    return {
      hasPrerequisites: config.prerequisites.length > 0,
      isReady: missing.length === 0,
      prerequisites: statusList,
      missingPrerequisites: missing,
      difficulty: config.difficulty,
    };
  }

  /**
   * Diagnose all relevant skills for a student based on academic branch, target role, and normalized evidence.
   *
   * @param {object} user - Authenticated student user object
   * @param {object} normalizedEvidence - Result from EvidenceNormalizationService
   * @param {string} [targetRoleOverride] - Optional target role
   * @returns {object} Full diagnosis report with prioritized gaps, strengths, and unassessed areas
   */
  diagnoseStudentSkillGaps(user, normalizedEvidence = { normalizedBySkill: {} }, targetRoleOverride = null) {
    const targetRole = targetRoleOverride || user?.targetRole || "Full Stack Developer";
    const userBranch = user?.branch || user?.academicBranch || "cse";
    const evidenceBySkill = normalizedEvidence.normalizedBySkill || {};

    // 1. Collect skills required by user's target role and academic assessments
    const skillExpectations = new Map();

    // A. Role benchmark skills
    const roleConfig = ROLE_REQUIREMENTS[targetRole];
    if (roleConfig?.coreSkills) {
      roleConfig.coreSkills.forEach((s) => {
        const canonical = normalizeSkill(s.skill) || s.skill;
        skillExpectations.set(canonical, {
          skill: canonical,
          importance: s.importance === "critical" ? "Critical" : "Core",
          roleWeight: s.importance === "critical" ? 100 : 85,
          targetScore: s.importance === "critical" ? 80 : 70,
        });
      });
    }
    if (roleConfig?.secondarySkills) {
      roleConfig.secondarySkills.forEach((s) => {
        const canonical = normalizeSkill(s.skill) || s.skill;
        if (!skillExpectations.has(canonical)) {
          skillExpectations.set(canonical, {
            skill: canonical,
            importance: "Secondary",
            roleWeight: 65,
            targetScore: 65,
          });
        }
      });
    }

    // B. Academic assessments relevant to user's branch
    const branchAssessments = ASSESSMENTS_CATALOG.filter((a) =>
      a.branchSlugs && a.branchSlugs.some((b) => b.toLowerCase() === userBranch.toLowerCase())
    );

    branchAssessments.forEach((assess) => {
      (assess.relevantSkills || []).forEach((sk) => {
        const canonical = normalizeSkill(sk) || sk;
        if (!skillExpectations.has(canonical)) {
          skillExpectations.set(canonical, {
            skill: canonical,
            importance: "Academic Core",
            roleWeight: 80,
            targetScore: 70,
            assessmentId: assess.assessmentId,
          });
        }
      });
    });

    // If no specific benchmark skills were detected, seed discipline core defaults
    if (skillExpectations.size === 0) {
      ["Critical Thinking", "Problem Solving", "Domain Fundamentals"].forEach((defSkill) => {
        skillExpectations.set(defSkill, {
          skill: defSkill,
          importance: "Core",
          roleWeight: 75,
          targetScore: 70,
        });
      });
    }

    // Also include any skills where the student has evidence even if not in the target role
    Object.keys(evidenceBySkill).forEach((evSkill) => {
      if (!skillExpectations.has(evSkill)) {
        skillExpectations.set(evSkill, {
          skill: evSkill,
          importance: "Discovered Evidence",
          roleWeight: 60,
          targetScore: 70,
        });
      }
    });

    const diagnosedSkills = [];

    // 2. Perform deterministic evaluation for each skill
    for (const [canonicalSkill, config] of skillExpectations.entries()) {
      const evidence = evidenceBySkill[canonicalSkill];
      const hasEvidence = Boolean(evidence && evidence.latestEvidence);
      const latestScore = hasEvidence ? evidence.latestScore : null;
      const isPassing = hasEvidence ? Boolean(evidence.hasPassed) : false;

      // Prerequisite check
      const prereqCheck = this.checkPrerequisites(canonicalSkill, evidenceBySkill);

      // Determine current status based on verified evidence
      let currentStatus = "unassessed";
      if (hasEvidence) {
        if (latestScore >= 80) currentStatus = "demonstrated_mastery";
        else if (latestScore >= 70) currentStatus = "competent";
        else currentStatus = "needs_remediation";
      } else if (!prereqCheck.isReady) {
        currentStatus = "prerequisite_missing";
      } else {
        currentStatus = "unassessed";
      }

      // Recency evaluation
      let recencyScore = 50; // default for unassessed
      let daysSinceLast = null;
      if (hasEvidence && evidence.latestEvidence?.timestamp) {
        const lastDate = new Date(evidence.latestEvidence.timestamp);
        const now = new Date();
        daysSinceLast = Math.max(0, Math.round((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
        if (currentStatus === "needs_remediation") {
          // Fresh failure needs immediate remediation while material is top of mind
          recencyScore = daysSinceLast <= 7 ? 85 : daysSinceLast <= 30 ? 65 : 45;
        } else if (currentStatus === "demonstrated_mastery" || currentStatus === "competent") {
          // Mastered skills: older evidence needs spaced revision review
          recencyScore = daysSinceLast > 30 ? 70 : 20;
        } else {
          recencyScore = 50;
        }
      }

      // Gap magnitude score S_gap in [0, 100]
      let gapScore = 50; // default neutral priority for unassessed (avoids treating missing as failure)
      if (hasEvidence) {
        gapScore = Math.max(0, 100 - latestScore);
      }

      // Prerequisite priority influence S_prereq
      let prereqFactor = 50;
      if (!hasEvidence && !prereqCheck.isReady) {
        prereqFactor = 25; // lower unassessed dependent skill priority until prerequisites are completed
      } else if (prereqCheck.hasPrerequisites && prereqCheck.isReady) {
        prereqFactor = 75; // primed to learn
      }

      // Deterministic Learning Priority Score Formula:
      // P(s) = 0.35 * RoleWeight + 0.35 * GapScore + 0.15 * Recency + 0.15 * PrereqFactor
      const learningPriorityScore = Math.round(
        0.35 * config.roleWeight +
        0.35 * gapScore +
        0.15 * recencyScore +
        0.15 * prereqFactor
      );

      // Identify recommended next action category
      let recommendedActionCategory = "review_objective";
      let actionRationale = "";

      if (currentStatus === "needs_remediation") {
        recommendedActionCategory = "reassessment";
        actionRationale = `Score was ${latestScore}%. Conceptual review and targeted reassessment recommended to attain the 70% mastery mark.`;
      } else if (currentStatus === "prerequisite_missing") {
        recommendedActionCategory = "prerequisite_remediation";
        actionRationale = `Prerequisite foundation needed: complete ${prereqCheck.missingPrerequisites.join(", ")} before advancing.`;
      } else if (currentStatus === "unassessed") {
        recommendedActionCategory = "diagnostic_assessment";
        actionRationale = `Core skill for ${targetRole} with no verified platform evidence on record. Take an objective diagnostic assessment.`;
      } else if (currentStatus === "competent" || currentStatus === "demonstrated_mastery") {
        recommendedActionCategory = "project_application";
        actionRationale = `Foundational knowledge demonstrated (${latestScore}%). Apply this competence on guided Project Studio blueprints.`;
      }

      diagnosedSkills.push({
        skill: canonicalSkill,
        importance: config.importance,
        roleWeight: config.roleWeight,
        targetScore: config.targetScore,
        currentStatus,
        evidenceStatus: evidence?.overallStatus || "insufficient_evidence",
        latestScore,
        previousScore: evidence?.previousScore ?? null,
        scoreDelta: evidence?.scoreDelta ?? null,
        gapScore,
        hasEvidence,
        isPassing,
        daysSinceLastEvaluation: daysSinceLast,
        prerequisites: prereqCheck,
        learningPriorityScore,
        recommendedActionCategory,
        actionRationale,
        latestEvidenceSource: evidence?.latestEvidence?.sourceType || null,
        assessmentId: config.assessmentId || evidence?.latestEvidence?.assessmentId || null,
      });
    }

    // Sort by learningPriorityScore descending
    diagnosedSkills.sort((a, b) => b.learningPriorityScore - a.learningPriorityScore);

    // Segment into priorities
    const priorityGaps = diagnosedSkills.filter(
      (s) => s.currentStatus === "needs_remediation" || s.currentStatus === "prerequisite_missing" || s.currentStatus === "unassessed"
    );
    const masteredSkills = diagnosedSkills.filter(
      (s) => s.currentStatus === "demonstrated_mastery" || s.currentStatus === "competent"
    );
    const unassessedSkills = diagnosedSkills.filter((s) => s.currentStatus === "unassessed");

    return {
      targetRole,
      userBranch,
      totalDiagnosed: diagnosedSkills.length,
      priorityGapsCount: priorityGaps.length,
      masteredSkillsCount: masteredSkills.length,
      unassessedCount: unassessedSkills.length,
      diagnosedSkills,
      priorityGaps,
      masteredSkills,
      unassessedSkills,
      diagnosedAt: new Date().toISOString(),
    };
  }
}

export const skillGapDiagnosisService = new SkillGapDiagnosisService();
export default skillGapDiagnosisService;
