/**
 * Recommendation Feature Extractor
 *
 * Extracts leak-free, normalized signals for candidate videos evaluated against
 * a learner's grounded profile and active learning intent.
 */

import { PROVEN_EDUCATIONAL_CHANNELS } from "../edutube-ranking.service.js";

export class RecommendationFeatureExtractor {
  /**
   * Extract numeric feature vector for a candidate video given user context.
   *
   * @param {object} candidate - Candidate video with metadata
   * @param {object} userContext - Grounded learner profile and intent
   * @param {number} position - Position in exposure batch (for debiasing)
   * @returns {object} Normalized feature vector (all values typically bounded in [0, 1] or [-1, 1])
   */
  extractFeatures(candidate, userContext = {}, position = 0) {
    const title = String(candidate.title || "").toLowerCase();
    const description = String(candidate.description || "").toLowerCase();
    const channel = String(candidate.channelTitle || candidate.channel || "").toLowerCase();
    const fullText = `${title} ${description}`;

    // 1. Skill Gap Priority Feature [0, 1]
    let f_gap_relevance = 0;
    const skillGaps = userContext.skillGaps || [];
    for (const gap of skillGaps) {
      const gapSkill = String(gap.skill || gap.canonicalName || "").toLowerCase();
      if (gapSkill && fullText.includes(gapSkill)) {
        if (gap.priority === "Critical") f_gap_relevance = 1.0;
        else if (gap.priority === "High") f_gap_relevance = Math.max(f_gap_relevance, 0.8);
        else if (gap.priority === "Medium") f_gap_relevance = Math.max(f_gap_relevance, 0.5);
        else f_gap_relevance = Math.max(f_gap_relevance, 0.25);
      }
    }

    // 2. Target Role Alignment [0, 1]
    const role = String(userContext.targetRole || "Full Stack Developer").toLowerCase();
    const roleKeywords = role.split(/\s+/).filter((w) => w.length > 2);
    let roleMatches = 0;
    for (const kw of roleKeywords) {
      if (fullText.includes(kw)) roleMatches++;
    }
    const f_role_alignment = roleKeywords.length > 0
      ? Math.min(1.0, (roleMatches / roleKeywords.length) * 0.8 + (fullText.includes(role) ? 0.3 : 0))
      : 0.5;

    // 3. Educational Score Feature [0, 1]
    const rawEduScore = Number(candidate.educationalScore ?? 75);
    const f_educational_score = Math.max(0, Math.min(1.0, rawEduScore / 100));

    // 4. Channel Authority Feature [0, 1]
    const hasProvenChannel = (PROVEN_EDUCATIONAL_CHANNELS || []).some((c) =>
      channel.includes(c.toLowerCase())
    );
    const f_channel_authority = hasProvenChannel ? 1.0 : 0.4;

    // 5. Duration Suitability Feature [0, 1]
    // Quality gate requires >= 120s. Ideal tutorial range is 10m to 60m (600s to 3600s).
    const durSeconds = Number(
      candidate.duration?.seconds || candidate.durationSeconds || candidate.verifiedDurationSeconds || 0
    );
    let f_duration_suitability = 0.5;
    if (durSeconds < 120) {
      f_duration_suitability = 0.0; // Rejected by quality gate
    } else if (durSeconds >= 600 && durSeconds <= 3600) {
      f_duration_suitability = 1.0; // Sweet spot for comprehensive tutorials
    } else if (durSeconds > 3600 && durSeconds <= 18000) {
      f_duration_suitability = 0.85; // Full bootcamp / multi-hour masterclass
    } else if (durSeconds >= 120 && durSeconds < 600) {
      f_duration_suitability = 0.65; // Short concept explanation
    } else {
      f_duration_suitability = 0.6; // Ultra-long livestream
    }

    // 6. User Positive Affinity (Likes, Saves, More Like This) [0, 1]
    const boostedTopics = (userContext.boostedTopics || []).map((t) => String(t).toLowerCase());
    const savedTitles = (userContext.savedTitles || []).map((t) => String(t).toLowerCase());
    let positiveMatches = 0;
    for (const topic of boostedTopics) {
      if (fullText.includes(topic)) positiveMatches++;
    }
    for (const st of savedTitles) {
      if (fullText.includes(st) || (candidate.title && st.includes(title))) positiveMatches++;
    }
    const f_user_positive_affinity = positiveMatches > 0 ? Math.min(1.0, 0.5 + positiveMatches * 0.25) : 0.0;

    // 7. User Negative Penalty (Not Interested / Already Know) [-1, 0]
    const notInterested = (userContext.notInterestedVideos || []).map((id) => String(id));
    const alreadyKnown = (userContext.alreadyKnownTopics || []).map((t) => String(t).toLowerCase());
    let f_user_negative_penalty = 0;
    if (candidate.videoId && notInterested.includes(String(candidate.videoId))) {
      f_user_negative_penalty = -1.0;
    } else {
      for (const ak of alreadyKnown) {
        if (fullText.includes(ak)) {
          f_user_negative_penalty = Math.max(f_user_negative_penalty, -0.6);
        }
      }
    }

    // 8. Historical User Completion Rate [0, 1]
    const completedCount = Number(userContext.completedCount || userContext.completedVideoIds?.length || 0);
    const historyCount = Number(userContext.historyCount || userContext.recentHistory?.length || 0);
    const f_historical_completion_rate = historyCount > 0
      ? Math.min(1.0, completedCount / Math.max(1, historyCount))
      : 0.5;

    // 9. Skill Level Alignment [0, 1]
    let f_skill_level_match = 0.5;
    const topSkills = userContext.topSkills || [];
    const isBeginnerLearner = topSkills.length === 0 || topSkills.every((s) => s.score < 40);
    if (isBeginnerLearner && (fullText.includes("beginner") || fullText.includes("from scratch") || fullText.includes("basics"))) {
      f_skill_level_match = 1.0;
    } else if (!isBeginnerLearner && (fullText.includes("advanced") || fullText.includes("architecture") || fullText.includes("deep dive"))) {
      f_skill_level_match = 1.0;
    }

    // 10. Inverse Position Bias Weight [0, 1]
    // Handles exposure bias: lower positions receive slightly higher normalization to account for rank bias
    const f_inverse_position_bias = 1.0 / Math.log2(position + 2);

    // 11. Code Volume / GitHub Stack Overlap [0, 1]
    const ghLanguages = (userContext.githubLanguages || []).map((l) => String(l).toLowerCase());
    let stackMatches = 0;
    for (const lang of ghLanguages) {
      if (fullText.includes(lang)) stackMatches++;
    }
    const f_github_stack_overlap = ghLanguages.length > 0
      ? Math.min(1.0, stackMatches / ghLanguages.length)
      : 0.4;

    // 12. Structured Tutorial Substance [0, 1]
    const isStructured = /\b(full course|complete tutorial|step by step|build a|masterclass)\b/i.test(fullText);
    const f_structured_substance = isStructured ? 1.0 : 0.6;

    return {
      f_gap_relevance,
      f_role_alignment,
      f_educational_score,
      f_channel_authority,
      f_duration_suitability,
      f_user_positive_affinity,
      f_user_negative_penalty,
      f_historical_completion_rate,
      f_skill_level_match,
      f_inverse_position_bias,
      f_github_stack_overlap,
      f_structured_substance,
    };
  }
}

export const recommendationFeatureExtractor = new RecommendationFeatureExtractor();
