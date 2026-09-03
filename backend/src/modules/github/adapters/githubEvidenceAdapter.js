import { normalizeSkill, getSkillCategory } from "../../../shared/taxonomy/skillTaxonomy.service.js";
import {
  createSkillEvidencePackage,
  EVIDENCE_SOURCES,
  EVIDENCE_TYPES,
} from "../../../shared/evidence/skillEvidenceContract.js";

/**
 * Extract normalized skill evidence from GitHub profile & repository analysis data.
 *
 * @param {object} params
 * @param {string|object} params.userId - Canonical user identity
 * @param {object} params.githubData - Profile & repository analysis result from github.service.js
 * @returns {object} Validated SkillEvidencePackage
 */
export function extractGitHubEvidence({ userId, githubData = {} }) {
  if (!userId) {
    throw new Error("extractGitHubEvidence requires a valid userId");
  }

  const repositories = githubData.repositories || [];
  const languages = githubData.languages || {};
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
        repoCount: 0,
        originalRepoCount: 0,
        forkedRepoCount: 0,
        totalBytes: 0,
        percentage: 0,
        starsCount: 0,
        repoNames: [],
        observations: [],
      });
    }
    return skillEvidenceMap.get(key);
  };

  // 1. Process aggregated language breakdown
  if (languages instanceof Map || typeof languages === "object") {
    const entries = languages instanceof Map ? Array.from(languages.entries()) : Object.entries(languages);

    for (const [langName, langStats] of entries) {
      const entry = getOrCreateSkillEntry(langName);
      if (!entry) continue;

      entry.totalBytes = Math.max(entry.totalBytes, langStats.size || 0);
      entry.percentage = Math.max(entry.percentage, langStats.percentage || 0);
      entry.repoCount = Math.max(entry.repoCount, langStats.repoCount || 0);
    }
  }

  // 2. Process individual repositories for language and topic signals
  for (const repo of repositories) {
    const repoName = repo.name || "repo";
    const isFork = Boolean(repo.fork);
    const stars = repo.stars || repo.stargazers_count || 0;

    // Primary language
    if (repo.language) {
      const entry = getOrCreateSkillEntry(repo.language);
      if (entry) {
        if (!entry.repoNames.includes(repoName)) {
          entry.repoNames.push(repoName);
          if (isFork) entry.forkedRepoCount += 1;
          else entry.originalRepoCount += 1;
          entry.starsCount += stars;
        }
      }
    }

    // Repository topics (if present)
    const topics = Array.isArray(repo.topics) ? repo.topics : [];
    for (const topic of topics) {
      const entry = getOrCreateSkillEntry(topic);
      if (entry && !entry.repoNames.includes(repoName)) {
        entry.repoNames.push(repoName);
        if (isFork) entry.forkedRepoCount += 1;
        else entry.originalRepoCount += 1;
        entry.starsCount += stars;
      }
    }
  }

  // 3. Construct normalized skill evidence items with calibrated confidence
  const skills = Array.from(skillEvidenceMap.values()).map((entry) => {
    // Confidence calibration:
    // Base observed project exposure: 0.70
    // Multiple original repositories: +0.06
    // Substantial code bytes (> 20KB): +0.05
    // Community stars (> 5 stars): +0.03
    // Max confidence for observed project evidence: 0.85
    let confidence = 0.70;
    if (entry.originalRepoCount >= 2) confidence += 0.06;
    if (entry.totalBytes > 20000) confidence += 0.05;
    if (entry.starsCount >= 5) confidence += 0.03;
    confidence = Math.min(0.85, Number(confidence.toFixed(2)));

    const topReposStr = entry.repoNames.slice(0, 3).join(", ");
    const observations = [];

    if (entry.originalRepoCount > 0) {
      observations.push(
        `Observed in ${entry.originalRepoCount} original repository${entry.originalRepoCount > 1 ? "s" : ""}${
          topReposStr ? ` (${topReposStr})` : ""
        }`
      );
    } else if (entry.repoNames.length > 0) {
      observations.push(`Detected in repository fork: ${topReposStr}`);
    }

    if (entry.percentage > 0) {
      observations.push(`Constitutes ${entry.percentage}% of public GitHub code repository share`);
    }

    if (entry.starsCount > 0) {
      observations.push(`Projects in this technology have accumulated ${entry.starsCount} stargazer⭐`);
    }

    return {
      skill: entry.canonicalName,
      canonicalName: entry.canonicalName,
      category: entry.category,
      evidenceType: EVIDENCE_TYPES.OBSERVED_PROJECT,
      confidence,
      signals: {
        repoCount: entry.repoNames.length,
        originalRepoCount: entry.originalRepoCount,
        forkedRepoCount: entry.forkedRepoCount,
        totalBytes: entry.totalBytes,
        codePercentage: entry.percentage,
        starsCount: entry.starsCount,
      },
      observations: observations.length > 0 ? observations : ["Detected in GitHub repository stack."],
    };
  });

  return createSkillEvidencePackage({
    source: EVIDENCE_SOURCES.GITHUB,
    userId,
    skills,
    metadata: {
      githubUsername: githubData.username || null,
      publicReposCount: githubData.profile?.publicRepos || repositories.length,
      dominantLanguage: githubData.dominantLanguage || null,
      totalStars: githubData.aggregateStats?.totalStars || 0,
    },
  });
}
