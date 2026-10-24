/**
 * SMART SKILL HUB — ASSESSMENT GRADING & ANALYTICS SERVICE (PHASE 44)
 *
 * Implements deterministic server-side grading, partial-credit evaluation,
 * numeric tolerance validation, and topic-level mastery analytics.
 */

/**
 * Strips sensitive answer keys from questions when serving an assessment for testing.
 *
 * @param {object} assessment
 * @returns {object} Clean assessment payload without answers
 */
export function sanitizeAssessmentForClient(assessment) {
  if (!assessment) return null;
  const raw = assessment.toObject ? assessment.toObject() : { ...assessment };

  const sanitizedQuestions = (raw.questions || []).map((q) => {
    const { correctAnswer, ...clientQuestion } = q;
    return clientQuestion;
  });

  return {
    ...raw,
    questions: sanitizedQuestions,
  };
}

/**
 * Grade a single question submission deterministically on the server.
 *
 * @param {object} question - Question definition from catalog or DB
 * @param {any} submittedAnswer - Student's answer
 * @returns {object} { isCorrect: boolean, pointsEarned: number, maxPoints: number, explanation: string, remediationGuidance: string }
 */
export function gradeSingleQuestion(question, submittedAnswer) {
  const maxPoints = Number(question.points) || 10;
  const type = question.type;

  let pointsEarned = 0;
  let isCorrect = false;

  if (submittedAnswer === undefined || submittedAnswer === null || submittedAnswer === "") {
    return {
      questionId: question.questionId,
      type,
      prompt: question.prompt,
      submittedAnswer: null,
      isCorrect: false,
      pointsEarned: 0,
      maxPoints,
      explanation: question.explanation || "",
      remediationGuidance: question.remediationGuidance || "",
      topic: question.topic || "General",
    };
  }

  switch (type) {
    case "single_choice": {
      const cleanSub = String(submittedAnswer).trim().toLowerCase();
      const cleanAns = String(question.correctAnswer).trim().toLowerCase();
      if (cleanSub === cleanAns) {
        pointsEarned = maxPoints;
        isCorrect = true;
      }
      break;
    }

    case "multiple_select": {
      const subArray = Array.isArray(submittedAnswer)
        ? submittedAnswer.map((s) => String(s).trim().toLowerCase())
        : [String(submittedAnswer).trim().toLowerCase()];

      const rawAns = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      const correctArray = rawAns.map((a) => String(a).trim().toLowerCase());

      const correctSelected = subArray.filter((s) => correctArray.includes(s)).length;
      const incorrectSelected = subArray.filter((s) => !correctArray.includes(s)).length;

      // Partial credit calculation: (correct - incorrect) / total_correct bounded [0, 1]
      const totalCorrect = correctArray.length || 1;
      const fraction = Math.max(0, (correctSelected - incorrectSelected) / totalCorrect);

      pointsEarned = Math.round(maxPoints * fraction);
      isCorrect = correctSelected === totalCorrect && incorrectSelected === 0;
      break;
    }

    case "numeric": {
      const subNum = parseFloat(String(submittedAnswer).replace(/,/g, ""));
      const corNum = parseFloat(question.correctAnswer);
      const tol = Number(question.tolerance) || 0;

      if (!isNaN(subNum) && !isNaN(corNum)) {
        const diff = Math.abs(subNum - corNum);
        if (diff <= tol + 1e-6) {
          pointsEarned = maxPoints;
          isCorrect = true;
        }
      }
      break;
    }

    case "case_study_response": {
      const subText = String(submittedAnswer).toLowerCase();
      const keyTermsRaw = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : String(question.correctAnswer).split(",").map((t) => t.trim().toLowerCase());

      const matchedTerms = keyTermsRaw.filter((term) =>
        subText.includes(term.toLowerCase())
      );

      // Require meaningful word count and key concepts
      const words = subText.trim().split(/\s+/).filter(Boolean);
      if (words.length >= 8 && matchedTerms.length >= 1) {
        if (matchedTerms.length >= 2 || words.length >= 20) {
          pointsEarned = maxPoints;
          isCorrect = true;
        } else {
          pointsEarned = Math.round(maxPoints * 0.6);
          isCorrect = false;
        }
      }
      break;
    }

    default: {
      if (String(submittedAnswer).trim() === String(question.correctAnswer).trim()) {
        pointsEarned = maxPoints;
        isCorrect = true;
      }
    }
  }

  return {
    questionId: question.questionId,
    type,
    prompt: question.prompt,
    submittedAnswer,
    isCorrect,
    pointsEarned,
    maxPoints,
    explanation: question.explanation || "",
    remediationGuidance: question.remediationGuidance || "",
    topic: question.topic || "General",
  };
}

/**
 * Evaluates full assessment submission and computes topic mastery analytics.
 *
 * @param {object} assessment - Full assessment definition
 * @param {object} submittedAnswers - Map of { questionId: answer }
 * @param {number} timeSpentSeconds - Time spent in seconds
 * @returns {object} Graded attempt analytics
 */
export function evaluateAssessmentSubmission(assessment, submittedAnswers = {}, timeSpentSeconds = 0) {
  const questions = assessment.questions || [];
  let totalScore = 0;
  let maxScore = 0;

  const questionResults = [];
  const topicMap = new Map();

  for (const q of questions) {
    const qId = q.questionId;
    const answer = submittedAnswers[qId];
    const result = gradeSingleQuestion(q, answer);

    totalScore += result.pointsEarned;
    maxScore += result.maxPoints;
    questionResults.push(result);

    // Topic performance aggregation
    const topic = q.topic || "General";
    if (!topicMap.has(topic)) {
      topicMap.set(topic, {
        topic,
        questionsCount: 0,
        correctCount: 0,
        score: 0,
        maxScore: 0,
      });
    }

    const t = topicMap.get(topic);
    t.questionsCount += 1;
    if (result.isCorrect) t.correctCount += 1;
    t.score += result.pointsEarned;
    t.maxScore += result.maxPoints;
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const minScoreThreshold = assessment.passingCriteria?.minScore ?? 70;
  const isPassing = percentage >= minScoreThreshold;

  // Build topic performance array
  const topicPerformance = [];
  const strengths = [];
  const areasForImprovement = [];

  for (const [topic, t] of topicMap.entries()) {
    const topicPercent = t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0;
    let masteryLevel = "Needs Improvement";
    if (topicPercent >= 80) {
      masteryLevel = "Proficient";
      strengths.push(topic);
    } else if (topicPercent >= 60) {
      masteryLevel = "Competent";
    } else {
      areasForImprovement.push(topic);
    }

    topicPerformance.push({
      topic,
      questionsCount: t.questionsCount,
      correctCount: t.correctCount,
      score: t.score,
      maxScore: t.maxScore,
      percentage: topicPercent,
      masteryLevel,
    });
  }

  // Recommended next steps
  const recommendedNextSteps = [];
  if (!isPassing) {
    recommendedNextSteps.push({
      actionType: "retry_assessment",
      title: `Review Weak Topics & Retry ${assessment.title}`,
      description: `Target ${areasForImprovement.slice(0, 2).join(", ") || "core topics"} before retaking this assessment to meet the 70% threshold.`,
      linkUrl: `/dashboard/assessments/${assessment.assessmentId}`,
    });
    if (areasForImprovement.length > 0) {
      recommendedNextSteps.push({
        actionType: "review_topic",
        title: `Remediate ${areasForImprovement[0]}`,
        description: `Deepen conceptual grounding using recommended study resources and textbook problem sets.`,
        linkUrl: `/dashboard/roadmap`,
      });
    }
  } else {
    // Recommend linked Project Studio blueprint if available
    const linkedProject = assessment.recommendedProjectIds?.[0];
    if (linkedProject) {
      recommendedNextSteps.push({
        actionType: "start_project",
        title: `Apply Knowledge in Project Studio`,
        description: `You have demonstrated foundational mastery! Put this into practice on project blueprint ${linkedProject}.`,
        linkUrl: `/dashboard/projects`,
      });
    } else {
      recommendedNextSteps.push({
        actionType: "explore_resources",
        title: `Advance to Next Career Milestone`,
        description: `Explore advanced topics and projects tailored to your target career role.`,
        linkUrl: `/dashboard/skills`,
      });
    }
  }

  return {
    score: totalScore,
    maxScore,
    percentage,
    isPassing,
    timeSpentSeconds,
    questionResults,
    topicPerformance,
    strengths,
    areasForImprovement,
    recommendedNextSteps,
    scoringMethod: "deterministic_server_evaluated",
  };
}

export const assessmentGradingService = {
  sanitizeAssessmentForClient,
  gradeSingleQuestion,
  evaluateAssessmentSubmission,
};

export default assessmentGradingService;
