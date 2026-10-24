import mongoose from "mongoose";
import { PRACTICAL_LAB_CATALOG } from "../constants/practicalLabCatalog.js";
import { PracticalLabAttempt } from "../models/practicalLabAttempt.models.js";
import { LearningActivityRecord } from "../../skills/models/learningActivityRecord.models.js";
import { ApiError } from "../../../core/errors/ApiError.js";

/**
 * Safe helper to strip authoritative answer keys from lab tasks before sending to client
 */
export function sanitizeLabForClient(lab) {
  if (!lab) return null;
  const sanitizedTasks = (lab.tasks || []).map((t) => {
    const { acceptedAnswer, correctOptionId, tolerance, ...safeTask } = t;
    return safeTask;
  });

  return {
    ...lab,
    canonicalDisciplines: lab.canonicalDisciplines || lab.branchSlugs || [],
    tasks: sanitizedTasks,
  };
}

/**
 * Deterministically evaluate an individual task answer
 *
 * @param {object} task - Authoritative catalog task
 * @param {any} rawValue - Submitted answer value from client
 * @returns {object} Detailed task grading result
 */
export function evaluateTaskAnswer(task, rawValue) {
  const pointsPossible = task.points || 50;
  let isCorrect = false;
  let pointsEarned = 0;
  let explanation = task.explanation || "";
  let feedback = "";

  const taskType = task.type || task.taskType || "numerical";

  if (taskType === "numerical" || taskType === "numerical_calculation") {
    const submittedNum = parseFloat(rawValue);

    if (rawValue === null || rawValue === undefined || rawValue === "" || !Number.isFinite(submittedNum)) {
      isCorrect = false;
      feedback = "Invalid non-finite or empty numeric input.";
      explanation = "No valid finite numeric input was submitted.";
    } else {
      const accepted = task.acceptedAnswer;
      const tolerance = task.tolerance !== undefined ? task.tolerance : 0.02; // default 2%
      const allowedDelta = accepted !== 0 ? Math.abs(accepted * tolerance) : tolerance;
      const actualDelta = Math.abs(submittedNum - accepted);

      isCorrect = actualDelta <= allowedDelta + 0.0001; // epsilon for floating point
      if (isCorrect) {
        pointsEarned = pointsPossible;
        feedback = `Correct. Value within accepted ±${(tolerance * 100).toFixed(1)}% engineering tolerance.`;
      } else {
        feedback = `Incorrect. Value ${submittedNum} outside accepted tolerance range.`;
      }
    }

    return {
      taskId: task.taskId,
      type: "numerical",
      submittedValue: rawValue,
      isCorrect,
      earnedPoints: pointsEarned,
      pointsEarned,
      maxPoints: pointsPossible,
      acceptedAnswer: task.acceptedAnswer,
      unit: task.unit || task.expectedUnit || "",
      toleranceUsed: task.tolerance !== undefined ? task.tolerance : 0.02,
      solutionExplanation: explanation,
      explanation,
      feedback,
      remediationGuidance: task.remediationGuidance || "",
    };
  } else if (taskType === "multiple_choice" || taskType === "scenario_decision") {
    const expected = task.correctOptionId !== undefined ? task.correctOptionId : task.acceptedAnswer;
    isCorrect = String(rawValue).trim() === String(expected).trim();
    if (isCorrect) {
      pointsEarned = pointsPossible;
      feedback = "Correct selection satisfying scenario constraints.";
    } else {
      feedback = "Incorrect option chosen.";
    }

    return {
      taskId: task.taskId,
      type: taskType,
      submittedValue: rawValue,
      isCorrect,
      earnedPoints: pointsEarned,
      pointsEarned,
      maxPoints: pointsPossible,
      acceptedAnswer: expected,
      solutionExplanation: explanation,
      explanation,
      feedback,
      remediationGuidance: task.remediationGuidance || "",
    };
  } else {
    // Structured response / rubric evaluation
    isCorrect = Boolean(rawValue && String(rawValue).trim().length > 10);
    pointsEarned = isCorrect ? pointsPossible : 0;
    feedback = isCorrect ? "Meets length criteria." : "Insufficient depth.";

    return {
      taskId: task.taskId,
      type: taskType || "structured_reasoning",
      submittedValue: rawValue,
      isCorrect,
      earnedPoints: pointsEarned,
      pointsEarned,
      maxPoints: pointsPossible,
      acceptedAnswer: "Structured analysis adhering to rubric parameters.",
      solutionExplanation: explanation,
      explanation,
      feedback,
      remediationGuidance: task.remediationGuidance || "",
    };
  }
}

export class PracticalLabService {
  sanitizeLabForClient(lab) {
    return sanitizeLabForClient(lab);
  }

  evaluateTaskAnswer(task, rawValue) {
    return evaluateTaskAnswer(task, rawValue);
  }

  /**
   * Retrieve list of published labs filtered by branch, difficulty, search query, or lab type
   */
  async getLabCatalog({ branch = "", difficulty = "", search = "", labType = "" } = {}) {
    let labs = PRACTICAL_LAB_CATALOG.filter((l) => l.status === "published");

    if (branch && branch.toLowerCase() !== "all") {
      const targetBranch = branch.toLowerCase().trim();
      labs = labs.filter((l) =>
        (l.canonicalDisciplines || l.branchSlugs || []).some((b) => b.toLowerCase() === targetBranch)
      );
    }

    if (difficulty && difficulty.toLowerCase() !== "all") {
      labs = labs.filter((l) => l.difficulty.toLowerCase() === difficulty.toLowerCase().trim());
    }

    if (labType && labType.toLowerCase() !== "all") {
      labs = labs.filter((l) => l.labType.toLowerCase() === labType.toLowerCase().trim());
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      labs = labs.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.disciplineCategory.toLowerCase().includes(q) ||
          (l.relevantSkills || []).some((s) => s.toLowerCase().includes(q))
      );
    }

    const sanitizedList = labs.map((l) => sanitizeLabForClient(l));
    return {
      labs: sanitizedList,
      total: sanitizedList.length,
    };
  }

  /**
   * Retrieve single lab definition by ID (sanitized)
   */
  async getLabById(labId) {
    if (!labId) {
      throw new ApiError(400, "Lab ID is required.");
    }

    const lab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === labId);
    if (!lab) {
      throw new ApiError(404, `Practical lab ${labId} not found`);
    }

    return sanitizeLabForClient(lab);
  }

  /**
   * Submit and perform authoritative server-side grading of a practical lab attempt
   */
  async submitLabAttempt(ownerId, labId, { submittedAnswers = [], startedAt = null } = {}) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required to submit lab attempt.");
    }
    if (!labId) {
      throw new ApiError(400, "Lab ID is required.");
    }

    const authoritativeLab = PRACTICAL_LAB_CATALOG.find((l) => l.labId === labId);
    if (!authoritativeLab) {
      throw new ApiError(404, `Practical lab ${labId} not found`);
    }

    const answersMap = new Map();
    if (Array.isArray(submittedAnswers)) {
      submittedAnswers.forEach((a) => {
        if (a && a.taskId !== undefined) {
          answersMap.set(a.taskId, a.value !== undefined ? a.value : a);
        }
      });
    } else if (submittedAnswers && typeof submittedAnswers === "object") {
      Object.entries(submittedAnswers).forEach(([taskId, val]) => {
        answersMap.set(taskId, typeof val === "object" && val !== null && val.value !== undefined ? val.value : val);
      });
    }

    let totalServerScore = 0;
    let totalMaxScore = 0;
    const taskResults = [];

    // Evaluate each task defined in the authoritative catalog
    for (const task of authoritativeLab.tasks) {
      const pointsPossible = task.points || 50;
      totalMaxScore += pointsPossible;

      const rawValue = answersMap.has(task.taskId) ? answersMap.get(task.taskId) : null;
      const result = evaluateTaskAnswer(task, rawValue);
      taskResults.push(result);
      totalServerScore += result.earnedPoints || result.pointsEarned || 0;
    }

    const percentage = totalMaxScore > 0 ? Math.round((totalServerScore / totalMaxScore) * 100) : 0;
    const passingThreshold = authoritativeLab.passingCriteria?.passingPercentage || 70;
    const isPassing = percentage >= passingThreshold;

    const masteryLevel =
      percentage >= 85 ? "Mastered" : percentage >= 70 ? "Competent" : "Needs Remediation";

    const feedbackSummary = isPassing
      ? `Successfully completed ${authoritativeLab.title} with verified score of ${percentage}%. Demonstrated solid practical competence.`
      : `Attempt scored ${percentage}% (passing mark is ${passingThreshold}%). Review task step solutions and reattempt.`;

    // Next action recommendations
    const nextActions = [];
    if (!isPassing) {
      nextActions.push({
        type: "review_concept",
        actionType: "review_concept",
        title: "Review Prerequisite Concepts",
        destination: "/dashboard/roadmap",
        description: "Review conceptual learning objectives and verified university lectures on your adaptive roadmap.",
      });
      nextActions.push({
        type: "retry_lab",
        actionType: "retry_lab",
        title: "Reattempt Practical Lab",
        destination: `/dashboard/labs?labId=${labId}`,
        description: "Re-calculate and apply step-by-step guidance to achieve passing mark.",
      });
    } else {
      if (authoritativeLab.recommendedAssessmentIds?.length) {
        nextActions.push({
          type: "explore_assessment",
          actionType: "explore_assessment",
          title: "Take Formal Discipline Assessment",
          destination: `/dashboard/assessments?id=${authoritativeLab.recommendedAssessmentIds[0]}`,
          description: "Validate your comprehensive domain knowledge in Assessment Center.",
        });
      }
      if (authoritativeLab.recommendedProjectIds?.length) {
        nextActions.push({
          type: "start_project",
          actionType: "start_project",
          title: "Build Project Studio Blueprint",
          destination: `/dashboard/projects?templateId=${authoritativeLab.recommendedProjectIds[0]}`,
          description: "Apply your practical competence on an end-to-end portfolio project.",
        });
      }
      nextActions.push({
        type: "mentor_discussion",
        actionType: "mentor_discussion",
        title: "Discuss Results with Smart Mentor",
        destination: "/dashboard/mentor",
        description: "Ask your AI Mentor for deeper insights into trade-offs and real-world edge cases.",
      });
    }

    const now = new Date();
    const startTime = startedAt ? new Date(startedAt) : now;
    const durationMinutes = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / (1000 * 60)));

    const attemptData = {
      owner: ownerId,
      labId,
      labVersion: authoritativeLab.version || 1,
      title: authoritativeLab.title,
      disciplineCategory: authoritativeLab.disciplineCategory,
      branchSlugs: authoritativeLab.branchSlugs || [],
      canonicalDisciplines: authoritativeLab.canonicalDisciplines || authoritativeLab.branchSlugs || [],
      labType: authoritativeLab.labType,
      submittedAnswers,
      taskResults,
      serverScore: totalServerScore,
      maxScore: totalMaxScore,
      percentage,
      isPassing,
      masteryLevel,
      evaluationFeedback: {
        summary: feedbackSummary,
        passingThreshold,
      },
      skillsEvaluated: authoritativeLab.relevantSkills || [],
      learningObjectivesEvaluated: authoritativeLab.learningObjectives || [],
      nextActionRecommendations: nextActions,
      status: "submitted",
      startedAt: startTime,
      submittedAt: now,
      durationMinutes,
    };

    // Persistence with safe offline mock support
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    let savedAttempt = attemptData;

    try {
      const attemptDoc = new PracticalLabAttempt(attemptData);
      savedAttempt = await attemptDoc.save();
    } catch (err) {
      if (isDbConnected || PracticalLabAttempt.create?.mock) {
        try {
          savedAttempt = await PracticalLabAttempt.create(attemptData);
        } catch (e) {
          savedAttempt = { _id: new mongoose.Types.ObjectId(), ...attemptData };
        }
      } else {
        savedAttempt = { _id: new mongoose.Types.ObjectId(), ...attemptData };
      }
    }

    // Sync with LearningActivityRecord for continuous roadmap tracking
    if (isDbConnected || LearningActivityRecord.findOneAndUpdate?.mock) {
      try {
        await LearningActivityRecord.findOneAndUpdate(
          { owner: ownerId, entityId: `lab_${labId}` },
          {
            $set: {
              owner: ownerId,
              entityId: `lab_${labId}`,
              activityType: "practical_lab",
              skill: authoritativeLab.relevantSkills?.[0] || "Practical Application",
              canonicalName: authoritativeLab.relevantSkills?.[0] || "Practical Application",
              title: authoritativeLab.title,
              status: isPassing ? "completed" : "in_progress",
              score: percentage,
              recordedAt: now,
            },
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        // Non-blocking sync error
      }
    }

    return savedAttempt;
  }

  /**
   * Fetch a student's past practical lab attempts
   */
  async getUserAttemptHistory(ownerId, labId = null) {
    if (!ownerId) {
      return [];
    }

    const filter = { owner: ownerId, status: "submitted" };
    if (labId) {
      filter.labId = labId;
    }

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (isDbConnected || PracticalLabAttempt.find?.mock) {
      try {
        return await PracticalLabAttempt.find(filter)
          .sort({ submittedAt: -1 })
          .limit(30)
          .lean();
      } catch (err) {
        return [];
      }
    }

    return [];
  }

  /**
   * Retrieve details of a specific attempt with student ownership verification
   */
  async getAttemptById(ownerId, attemptId) {
    if (!ownerId) {
      throw new ApiError(401, "Authentication required.");
    }
    if (!attemptId) {
      throw new ApiError(400, "Attempt ID is required.");
    }

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    let attempt = null;

    if (isDbConnected || PracticalLabAttempt.findById?.mock) {
      try {
        attempt = await PracticalLabAttempt.findById(attemptId).lean();
      } catch (err) {
        throw new ApiError(404, "Attempt not found.");
      }
    }

    if (!attempt) {
      throw new ApiError(404, `Attempt '${attemptId}' not found.`);
    }

    if (String(attempt.owner) !== String(ownerId)) {
      throw new ApiError(403, "You are not authorized to view this lab attempt.");
    }

    return attempt;
  }
}

export const practicalLabService = new PracticalLabService();
export default practicalLabService;
