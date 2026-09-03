import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import {
  createSkillEvidencePackage,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
} from "../../../shared/evidence/skillEvidenceContract.js";

/**
 * Extract normalized skill evidence from student coding submissions and assessment history.
 *
 * @param {object} params
 * @param {string|object} params.userId - Canonical user identity
 * @param {Array<object>} params.submissions - List of CodingSubmission documents or evaluation results
 * @returns {object} Validated SkillEvidencePackage
 */
export function extractCodingEvidence({ userId, submissions = [] }) {
  if (!userId) {
    throw new Error("extractCodingEvidence requires a valid userId");
  }

  const skillEvidenceMap = new Map();

  // Helper to ensure a skill entry exists in map
  const getOrCreateSkillEntry = (rawName) => {
    const canonical = normalizeSkill(rawName);
    if (!canonical) return null;

    const key = canonical.toLowerCase();
    if (!skillEvidenceMap.has(key)) {
      skillEvidenceMap.set(key, {
        skill: canonical,
        canonicalName: canonical,
        category: getSkillCategory(canonical),
        problemsAttempted: 0,
        problemsSolved: 0,
        totalTestCasesPassed: 0,
        totalTestCases: 0,
        problemTitles: new Set(),
        solvedProblemTitles: new Set(),
        languagesUsed: new Set(),
        executionTimes: [],
      });
    }
    return skillEvidenceMap.get(key);
  };

  // 1. Process all submissions
  for (const sub of submissions) {
    const isPassed = sub.status === "passed" || (sub.score > 0 && sub.passed === sub.total);
    const problemTitle = sub.title || sub.taskId || "Coding Task";
    const language = sub.language || "javascript";
    const skillsCovered = Array.isArray(sub.skillsCovered) && sub.skillsCovered.length > 0
      ? sub.skillsCovered
      : [sub.category || "Problem Solving"];

    // Also attribute language skill (e.g. JavaScript)
    if (language) {
      skillsCovered.push(language);
    }

    for (const rawSkill of skillsCovered) {
      const entry = getOrCreateSkillEntry(rawSkill);
      if (!entry) continue;

      entry.problemsAttempted += 1;
      entry.problemTitles.add(problemTitle);
      entry.languagesUsed.add(language);
      entry.totalTestCasesPassed += sub.passed || 0;
      entry.totalTestCases += sub.total || 0;

      if (sub.executionTimeMs) {
        entry.executionTimes.push(sub.executionTimeMs);
      }

      if (isPassed) {
        entry.problemsSolved += 1;
        entry.solvedProblemTitles.add(problemTitle);
      }
    }
  }

  // 2. Construct normalized skill evidence items with calibrated confidence
  const skills = Array.from(skillEvidenceMap.values()).map((entry) => {
    const solvedCount = entry.solvedProblemTitles.size;
    const attemptedCount = entry.problemTitles.size;
    const passRate = attemptedCount > 0 ? Number((solvedCount / attemptedCount).toFixed(2)) : 0;

    // Confidence calibration:
    // Base for practical assessment with passes: 0.85
    // Multiple distinct problems solved (>= 2): +0.05
    // High test pass rate (>= 90%): +0.03
    // Consistent execution (< 100ms): +0.02
    // If attempted but 0 solved: confidence 0.40 (negative/weak signal)
    // Max confidence: 0.95
    let confidence = 0.50;
    if (solvedCount > 0) {
      confidence = 0.85;
      if (solvedCount >= 2) confidence += 0.05;
      if (passRate >= 0.90) confidence += 0.03;
      if (entry.executionTimes.length > 0 && entry.executionTimes.every((t) => t < 100)) {
        confidence += 0.02;
      }
    } else {
      confidence = 0.40;
    }
    confidence = Math.min(0.95, Number(confidence.toFixed(2)));

    const solvedListStr = Array.from(entry.solvedProblemTitles).slice(0, 3).join(", ");
    const observations = [];

    if (solvedCount > 0) {
      observations.push(
        `Successfully passed ${solvedCount}/${attemptedCount} practical coding task${
          attemptedCount > 1 ? "s" : ""
        }${solvedListStr ? ` (${solvedListStr})` : ""}`
      );
    } else {
      observations.push(`Attempted ${attemptedCount} coding task${attemptedCount > 1 ? "s" : ""}, but all test cases failed.`);
    }

    if (entry.totalTestCases > 0) {
      observations.push(
        `Achieved ${entry.totalTestCasesPassed}/${entry.totalTestCases} cumulative test case passes (${Math.round(
          (entry.totalTestCasesPassed / entry.totalTestCases) * 100
        )}%)`
      );
    }

    return {
      skill: entry.canonicalName,
      canonicalName: entry.canonicalName,
      category: entry.category,
      evidenceType: EVIDENCE_TYPES.PRACTICAL_ASSESSMENT,
      confidence,
      signals: {
        problemsAttempted: attemptedCount,
        problemsSolved: solvedCount,
        passRate,
        totalTestCasesPassed: entry.totalTestCasesPassed,
        totalTestCases: entry.totalTestCases,
        languagesUsed: Array.from(entry.languagesUsed),
      },
      observations: observations.length > 0 ? observations : ["Evaluated in coding assessment sandbox."],
    };
  });

  return createSkillEvidencePackage({
    source: EVIDENCE_SOURCES.CODING,
    userId,
    skills,
    metadata: {
      totalSubmissionsProcessed: submissions.length,
      skillsEvaluatedCount: skills.length,
    },
  });
}
