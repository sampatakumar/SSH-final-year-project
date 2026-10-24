import { apiRequest } from "@/lib/api";
import {
  PracticalLab,
  PracticalLabAttempt,
  PracticalLabFilters,
  LabSubmissionPayload,
} from "../types/practicalLab.types";

export const practicalLabApi = {
  /**
   * Fetch published practical labs catalog with optional branch, difficulty, or search filters
   */
  async fetchLabCatalog(token?: string, filters: PracticalLabFilters = {}) {
    const params = new URLSearchParams();
    if (filters.branch && filters.branch !== "all") params.set("branch", filters.branch);
    if (filters.difficulty && filters.difficulty !== "all") params.set("difficulty", filters.difficulty);
    if (filters.labType && filters.labType !== "all") params.set("labType", filters.labType);
    if (filters.search) params.set("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiRequest<{ labs: PracticalLab[]; total: number }>(
      `/academic/labs${query}`,
      { token }
    );
    return res.data;
  },

  /**
   * Fetch single sanitized lab definition by ID
   */
  async fetchLabById(labId: string, token?: string) {
    const res = await apiRequest<PracticalLab>(
      `/academic/labs/${encodeURIComponent(labId)}`,
      { token }
    );
    return res.data;
  },

  /**
   * Submit student answers for authoritative server-side scoring
   */
  async submitLabAttempt(labId: string, payload: LabSubmissionPayload, token?: string) {
    const res = await apiRequest<PracticalLabAttempt>(
      `/academic/labs/${encodeURIComponent(labId)}/submit`,
      {
        method: "POST",
        token,
        body: payload,
      }
    );
    return res.data;
  },

  /**
   * Fetch authenticated student's practical lab attempt history
   */
  async fetchUserLabHistory(token?: string, labId?: string) {
    const query = labId ? `?labId=${encodeURIComponent(labId)}` : "";
    const res = await apiRequest<PracticalLabAttempt[]>(
      `/academic/labs/history${query}`,
      { token }
    );
    return res.data;
  },

  /**
   * Fetch details of a specific past lab attempt
   */
  async fetchAttemptById(attemptId: string, token?: string) {
    const res = await apiRequest<PracticalLabAttempt>(
      `/academic/labs/attempts/${encodeURIComponent(attemptId)}`,
      { token }
    );
    return res.data;
  },
};
