/**
 * Recommendation Ranking Service
 *
 * Modular ranking service supporting:
 * 1. Deterministic baseline ranker (rule-based multi-signal scoring)
 * 2. Machine learning ranker (gradient-boosted / weighted model from model registry)
 * 3. Safe, instantaneous fallback to baseline on any failure or missing model
 */

import { recommendationFeatureExtractor } from "./feature-extractor.js";
import { RecommendationModelRegistry } from "../../models/recommendationModelRegistry.models.js";

// Deterministic baseline weights
export const BASELINE_WEIGHTS = {
  f_gap_relevance: 0.25,
  f_educational_score: 0.20,
  f_role_alignment: 0.15,
  f_channel_authority: 0.12,
  f_duration_suitability: 0.10,
  f_structured_substance: 0.08,
  f_user_positive_affinity: 0.10,
};

export class RecommendationRankingService {
  constructor() {
    this.activeModel = null;
    this.activeModelVersion = "baseline_v1";
    this.isMlDeployed = false;
  }

  /**
   * Load active deployed model from database or initialize baseline.
   */
  async loadActiveModel() {
    try {
      const deployedModel = await RecommendationModelRegistry.findOne({
        status: "deployed",
      })
        .sort({ deployedAt: -1 })
        .lean();

      if (deployedModel && deployedModel.featureWeights) {
        this.activeModel = deployedModel;
        this.activeModelVersion = deployedModel.version;
        this.isMlDeployed = deployedModel.modelType !== "deterministic_baseline";
      } else {
        this.activeModel = null;
        this.activeModelVersion = "baseline_v1";
        this.isMlDeployed = false;
      }
    } catch {
      // Fallback silently to baseline
      this.activeModel = null;
      this.activeModelVersion = "baseline_v1";
      this.isMlDeployed = false;
    }
  }

  /**
   * Compute deterministic baseline score from feature vector.
   *
   * @param {object} features - Normalized feature vector
   * @returns {number} Score bounded in [0, 100]
   */
  scoreBaseline(features) {
    let score =
      (features.f_gap_relevance ?? 0) * BASELINE_WEIGHTS.f_gap_relevance +
      (features.f_educational_score ?? 0.7) * BASELINE_WEIGHTS.f_educational_score +
      (features.f_role_alignment ?? 0.5) * BASELINE_WEIGHTS.f_role_alignment +
      (features.f_channel_authority ?? 0.5) * BASELINE_WEIGHTS.f_channel_authority +
      (features.f_duration_suitability ?? 0.5) * BASELINE_WEIGHTS.f_duration_suitability +
      (features.f_structured_substance ?? 0.5) * BASELINE_WEIGHTS.f_structured_substance +
      (features.f_user_positive_affinity ?? 0) * BASELINE_WEIGHTS.f_user_positive_affinity;

    // Apply negative penalty
    if (features.f_user_negative_penalty < 0) {
      score += features.f_user_negative_penalty * 0.4;
    }

    // Convert from [0, 1] to [0, 100]
    return Math.max(0, Math.min(100, Math.round(score * 100)));
  }

  /**
   * Compute ML model score using deployed feature weights.
   *
   * @param {object} features - Normalized feature vector
   * @param {object} weights - Learned feature weights
   * @returns {number} Score bounded in [0, 100]
   */
  scoreML(features, weights = {}) {
    let rawScore = 0;
    let totalWeight = 0;

    for (const [featKey, val] of Object.entries(features)) {
      const weight = weights[featKey] ?? BASELINE_WEIGHTS[featKey] ?? 0.05;
      rawScore += val * weight;
      totalWeight += Math.abs(weight);
    }

    if (features.f_user_negative_penalty < 0) {
      rawScore += features.f_user_negative_penalty * 0.5;
    }

    const normalized = totalWeight > 0 ? rawScore / totalWeight : 0.5;
    return Math.max(0, Math.min(100, Math.round(normalized * 100)));
  }

  /**
   * Rank an array of candidate videos with feature extraction, model scoring,
   * and guaranteed fallback to baseline.
   *
   * @param {Array<object>} candidates - Eligible candidate videos
   * @param {object} userContext - Learner context
   * @param {object} options - Options
   * @returns {Promise<Array<object>>} Ranked candidates sorted descending by personalizationScore
   */
  async rankCandidates(candidates = [], userContext = {}, options = {}) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];

    let modelUsed = this.activeModelVersion;
    let fallbackTriggered = false;

    const scored = candidates.map((candidate, index) => {
      // 1. Extract engineered features
      const features = recommendationFeatureExtractor.extractFeatures(
        candidate,
        userContext,
        index
      );

      let score = 50;

      // 2. Score via ML if deployed, with automatic baseline fallback
      if (this.isMlDeployed) {
        try {
          if (!this.activeModel?.featureWeights) {
            throw new Error("Missing active model feature weights");
          }
          score = this.scoreML(features, this.activeModel.featureWeights);
        } catch (err) {
          fallbackTriggered = true;
          score = this.scoreBaseline(features);
          modelUsed = "baseline_v1 (fallback)";
        }
      } else {
        score = this.scoreBaseline(features);
      }

      // 3. Compile signal explanations
      const signals = [];
      if (features.f_gap_relevance >= 0.8) {
        signals.push("High priority skill gap match");
      }
      if (features.f_channel_authority >= 0.9) {
        signals.push("Verified high-reputation educational channel");
      }
      if (features.f_structured_substance >= 0.9) {
        signals.push("Structured comprehensive tutorial");
      }
      if (features.f_user_positive_affinity > 0) {
        signals.push("Aligned with your preferred learning topics");
      }
      if (features.f_role_alignment >= 0.7) {
        signals.push(`Aligned with ${userContext.targetRole || "target role"}`);
      }

      return {
        ...candidate,
        personalizationScore: score,
        featuresSnapshot: features,
        rankingSignals: signals,
        rankedByModelVersion: modelUsed,
        fallbackTriggered,
      };
    });

    // 4. Sort descending by personalizationScore
    return scored.sort((a, b) => b.personalizationScore - a.personalizationScore);
  }
}

export const recommendationRankingService = new RecommendationRankingService();
