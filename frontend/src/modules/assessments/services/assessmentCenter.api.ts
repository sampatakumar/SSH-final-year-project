import { apiRequest } from "@/lib/api";
import {
  BranchAssessment,
  AssessmentAttempt,
  RecommendationsResponse,
} from "../types/assessmentCenter.types";

export interface AssessmentFilters {
  branchSlug?: string;
  disciplineCategory?: string;
  difficulty?: string;
  roleSlug?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const assessmentCenterApi = {
  /**
   * Fetch published assessments with optional branch, category, difficulty, or search filters
   */
  async fetchAssessments(token?: string, filters: AssessmentFilters = {}) {
    const params = new URLSearchParams();
    if (filters.branchSlug && filters.branchSlug !== "all") params.set("branchSlug", filters.branchSlug);
    if (filters.disciplineCategory && filters.disciplineCategory !== "all") params.set("disciplineCategory", filters.disciplineCategory);
    if (filters.difficulty && filters.difficulty !== "all") params.set("difficulty", filters.difficulty);
    if (filters.roleSlug) params.set("roleSlug", filters.roleSlug);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiRequest<{ assessments: BranchAssessment[]; total: number }>(
      `/academic/assessments${query}`,
      { token }
    );
    return res.data;
  },

  /**
   * Fetch a single assessment definition by ID (sanitized)
   */
  async fetchAssessmentById(assessmentId: string, token?: string) {
    const res = await apiRequest<BranchAssessment>(
      `/academic/assessments/${assessmentId}`,
      { token }
    );
    return res.data;
  },

  /**
   * Fetch personalized assessment recommendations for the authenticated user
   */
  async fetchRecommendations(token: string) {
    const res = await apiRequest<RecommendationsResponse>(
      `/academic/assessments/user/recommendations`,
      { token }
    );
    return res.data;
  },

  /**
   * Start a new persistent assessment attempt
   */
  async startAttempt(assessmentId: string, token: string) {
    const res = await apiRequest<{
      attemptId: string;
      assessment: BranchAssessment;
      startedAt: string;
      status: string;
    }>(`/academic/assessments/${assessmentId}/start`, {
      method: "POST",
      token,
    });
    return res.data;
  },

  /**
   * Submit an assessment attempt for server-side evaluation and scoring
   */
  async submitAttempt(
    attemptId: string,
    payload: { answers: Record<string, any>; timeSpentSeconds: number },
    token: string
  ) {
    const res = await apiRequest<AssessmentAttempt>(
      `/academic/assessments/attempts/${attemptId}/submit`,
      {
        method: "POST",
        token,
        body: payload,
      }
    );
    return res.data;
  },

  /**
   * Fetch student's attempt history
   */
  async fetchMyAttempts(
    token: string,
    options: { assessmentId?: string; page?: number; limit?: number } = {}
  ) {
    const params = new URLSearchParams();
    if (options.assessmentId) params.set("assessmentId", options.assessmentId);
    if (options.page) params.set("page", String(options.page));
    if (options.limit) params.set("limit", String(options.limit));

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiRequest<{ attempts: AssessmentAttempt[]; total: number }>(
      `/academic/assessments/user/attempts${query}`,
      { token }
    );
    return res.data;
  },

  /**
   * Fetch a specific attempt by ID
   */
  async fetchAttemptById(attemptId: string, token: string) {
    const res = await apiRequest<AssessmentAttempt>(
      `/academic/assessments/attempts/${attemptId}`,
      { token }
    );
    return res.data;
  },
};

export default assessmentCenterApi;
