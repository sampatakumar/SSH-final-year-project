/**
 * ============================================================================
 * SMART SKILL HUB — WEIGHTED EVIDENCE EVALUATION METHODOLOGY (v1.0.0)
 * ============================================================================
 *
 * Deterministic, explainable, multi-source weighted evidence evaluation engine.
 *
 * Caps & Synergy:
 * 1. Resume Claimed Evidence: Max 30 base points
 * 2. GitHub Observed Project Evidence: Max 40 base points
 * 3. Coding Practical Assessment Evidence: Max 45 base points
 * 4. Multi-Source Diversity Synergy Bonus:
 *    - 2 independent sources: +10 points bonus
 *    - 3 independent sources: +18 points bonus
 * 5. Normalization: finalScore = Math.min(100, Math.max(20, Math.round(rawScore)))
 * 6. Single-source ceiling guarantees:
 *    - Resume alone max 30/100
 *    - GitHub alone max 40/100
 *    - Coding alone max 45/100
 *    - Proficient (75+) and Strong Evidence (90+) require multi-source corroboration.
 * ============================================================================
 */

import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";

export const EVALUATION_VERSION = "1.0.0";

export const PROFICIENCY_LEVELS = {
  LIMITED_EVIDENCE: "Limited Evidence", // Score 20-39
  DEVELOPING: "Developing",             // Score 40-59
  COMPETENT: "Competent",               // Score 60-74
  PROFICIENT: "Proficient",             // Score 75-89
  STRONG_EVIDENCE: "Strong Evidence",   // Score 90-100
};

/**
 * Determine proficiency level string from numeric score.
 */
export function getProficiencyLevel(score) {
  if (score >= 90) return PROFICIENCY_LEVELS.STRONG_EVIDENCE;
  if (score >= 75) return PROFICIENCY_LEVELS.PROFICIENT;
  if (score >= 60) return PROFICIENCY_LEVELS.COMPETENT;
  if (score >= 40) return PROFICIENCY_LEVELS.DEVELOPING;
  return PROFICIENCY_LEVELS.LIMITED_EVIDENCE;
}

/**
 * Core Skill Evaluation Engine.
 * Ingests standardized Skill Evidence packages across Resume, GitHub, and Coding.
 * Produces deterministic, explainable, and versioned Skill Profiles.
 *
 * @param {Array<object>} evidencePackages - Array of SkillEvidencePackage objects
 * @returns {object} Evaluated skills and composite readiness summary
 */
export function evaluateEvidencePackages(evidencePackages = []) {
  if (!Array.isArray(evidencePackages)) {
    throw new TypeError("evaluateEvidencePackages requires an array of evidence packages");
  }

  // Aggregate evidence by canonical skill key
  const aggregatedSkillsMap = new Map();

  for (const pkg of evidencePackages) {
    if (!pkg || !pkg.source || !Array.isArray(pkg.skills)) continue;

    const source = pkg.source;

    for (const item of pkg.skills) {
      const canonical = normalizeSkill(item.skill || item.canonicalName);
      if (!canonical) continue;

      const key = canonical.toLowerCase();
      if (!aggregatedSkillsMap.has(key)) {
        aggregatedSkillsMap.set(key, {
          skill: canonical,
          canonicalName: canonical,
          category: item.category || getSkillCategory(canonical),
          evidenceSources: new Set(),
          evidenceItems: [],
          observations: [],
          resumeSignal: null,
          githubSignal: null,
          codingSignal: null,
        });
      }

      const record = aggregatedSkillsMap.get(key);
      record.evidenceSources.add(source);
      record.evidenceItems.push({
        source,
        evidenceType: item.evidenceType,
        confidence: item.confidence,
        signals: item.signals || {},
        observations: item.observations || [],
        timestamp: pkg.timestamp || new Date().toISOString(),
      });

      if (Array.isArray(item.observations)) {
        record.observations.push(...item.observations);
      }

      if (source === "resume") {
        record.resumeSignal = item;
      } else if (source === "github") {
        record.githubSignal = item;
      } else if (source === "coding") {
        record.codingSignal = item;
      }
    }
  }

  // Evaluate each aggregated skill deterministically
  const evaluatedSkills = [];

  for (const [key, record] of aggregatedSkillsMap.entries()) {
    const sources = Array.from(record.evidenceSources);
    const sourceCount = sources.length;

    let totalScore = 0;
    const explanationFactors = [];

    // 1. Resume Claimed Evidence Points (Max 30 base points)
    if (record.resumeSignal) {
      const sig = record.resumeSignal.signals || {};
      let resumePts = 20; // base for presence in skills section
      if (sig.inProjects) resumePts += 5;
      if (sig.inExperience) resumePts += 5;
      totalScore += resumePts;
      explanationFactors.push(`Claimed on Resume (+${resumePts} pts: skills profile${sig.inProjects ? ", project reference" : ""}${sig.inExperience ? ", work experience" : ""})`);
    }

    // 2. GitHub Observed Project Evidence Points (Max 40 base points)
    if (record.githubSignal) {
      const sig = record.githubSignal.signals || {};
      let ghPts = 22; // base for observed repository code
      if (sig.originalRepoCount >= 1) ghPts += 6;
      if (sig.originalRepoCount >= 2) ghPts += 4;
      if (sig.totalBytes > 20000) ghPts += 5;
      if (sig.starsCount > 0) ghPts += 3;
      totalScore += ghPts;
      explanationFactors.push(`Observed in GitHub (${sig.originalRepoCount || 0} original repos, ${Math.round((sig.totalBytes || 0) / 1024)} KB code: +${ghPts} pts)`);
    }

    // 3. Coding Practical Assessment Evidence Points (Max 45 base points)
    if (record.codingSignal) {
      const sig = record.codingSignal.signals || {};
      const solved = sig.problemsSolved || 0;
      const attempted = sig.problemsAttempted || 0;

      let codingPts = 0;
      if (solved > 0) {
        codingPts = 25; // base for verified passed problem
        if (solved >= 2) codingPts += 10;
        if (sig.passRate >= 0.9) codingPts += 5;
        if (sig.totalTestCasesPassed >= 5) codingPts += 5;
        explanationFactors.push(`Demonstrated in practical Coding Sandbox (${solved}/${attempted} passed tasks: +${codingPts} pts)`);
      } else if (attempted > 0) {
        codingPts = 5;
        explanationFactors.push(`Attempted ${attempted} practical coding tasks without full test pass (+5 pts)`);
      }
      totalScore += codingPts;
    }

    // 4. Multi-Source Diversity Synergy Bonus
    let diversityBonus = 0;
    if (sourceCount === 2) {
      diversityBonus = 10;
      explanationFactors.push(`Cross-source validation bonus (2 independent sources: +10 pts)`);
    } else if (sourceCount >= 3) {
      diversityBonus = 18;
      explanationFactors.push(`Triangulated validation bonus (Resume + GitHub + Coding: +18 pts)`);
    }
    totalScore += diversityBonus;

    // Bound final score between 20 and 100
    const finalScore = Math.min(100, Math.max(20, Math.round(totalScore)));
    const level = getProficiencyLevel(finalScore);

    // Calculate Overall Evaluation Confidence
    let evaluationConfidence = 0.55;
    if (sourceCount === 1) {
      evaluationConfidence = record.codingSignal ? 0.70 : 0.60;
    } else if (sourceCount === 2) {
      evaluationConfidence = 0.80;
    } else if (sourceCount >= 3) {
      evaluationConfidence = 0.92;
    }

    // Unique observations
    const uniqueObservations = Array.from(new Set(record.observations)).slice(0, 4);

    evaluatedSkills.push({
      skill: record.canonicalName,
      canonicalName: record.canonicalName,
      category: record.category,
      score: finalScore,
      level,
      confidence: Number(evaluationConfidence.toFixed(2)),
      sources,
      evidenceCount: record.evidenceItems.length,
      evidence: record.evidenceItems,
      observations: uniqueObservations,
      explanation: explanationFactors.join(" | "),
      methodologyVersion: EVALUATION_VERSION,
      lastAssessedAt: new Date().toISOString(),
    });
  }

  // Sort evaluated skills by score descending
  evaluatedSkills.sort((a, b) => b.score - a.score);

  // Compute composite overall readiness score across all evaluated skills
  const overallReadinessScore = evaluatedSkills.length > 0
    ? Math.round(evaluatedSkills.reduce((acc, s) => acc + s.score, 0) / evaluatedSkills.length)
    : 0;

  return {
    evaluationVersion: EVALUATION_VERSION,
    overallReadinessScore,
    skillsCount: evaluatedSkills.length,
    skills: evaluatedSkills,
    evaluatedAt: new Date().toISOString(),
  };
}
