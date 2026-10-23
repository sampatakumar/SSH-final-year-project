import { apiRequest } from "@/lib/api";
import { ProjectTemplate, StudentProject } from "../types/projectStudio.types";

export interface TemplateFilters {
  branchSlug?: string;
  disciplineCategory?: string;
  difficulty?: string;
  roleSlug?: string;
  search?: string;
}

export const projectStudioApi = {
  /**
   * Fetch published project templates with optional branch and category filters
   */
  async fetchTemplates(token?: string, filters: TemplateFilters = {}) {
    const params = new URLSearchParams();
    if (filters.branchSlug) params.set("branchSlug", filters.branchSlug);
    if (filters.disciplineCategory) params.set("disciplineCategory", filters.disciplineCategory);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    if (filters.roleSlug) params.set("roleSlug", filters.roleSlug);
    if (filters.search) params.set("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiRequest<{ templates: ProjectTemplate[]; total: number }>(
      `/academic/projects/templates${query}`,
      { token }
    );
    return res.data;
  },

  /**
   * Fetch a specific project template by its template ID
   */
  async fetchTemplateById(templateId: string, token?: string) {
    const res = await apiRequest<{ template: ProjectTemplate }>(
      `/academic/projects/templates/${templateId}`,
      { token }
    );
    return res.data.template;
  },

  /**
   * Start a new project instance from a template
   */
  async startProject(token: string, templateId: string, options: { branchSlug?: string; roleSlug?: string } = {}) {
    const res = await apiRequest<{ project: StudentProject }>(
      `/academic/projects/start`,
      {
        method: "POST",
        token,
        body: { templateId, ...options },
      }
    );
    return res.data.project;
  },

  /**
   * Fetch all active and completed student projects for the current user
   */
  async fetchMyProjects(token: string) {
    const res = await apiRequest<{
      projects: StudentProject[];
      summary: {
        total: number;
        inProgress: number;
        completed: number;
        changesRequested: number;
        submitted: number;
      };
    }>(`/academic/projects/my-projects`, { token });
    return res.data;
  },

  /**
   * Fetch a single student project by ID with its template details
   */
  async fetchProjectById(projectId: string, token: string) {
    const res = await apiRequest<{ project: StudentProject; template: ProjectTemplate }>(
      `/academic/projects/my-projects/${projectId}`,
      { token }
    );
    return res.data;
  },

  /**
   * Update milestone progress status and notes
   */
  async updateMilestone(
    projectId: string,
    milestoneId: string,
    status: "pending" | "in_progress" | "completed",
    notes: string = "",
    token: string
  ) {
    const res = await apiRequest<{ project: StudentProject }>(
      `/academic/projects/my-projects/${projectId}/milestones/${milestoneId}`,
      {
        method: "PATCH",
        token,
        body: { status, notes },
      }
    );
    return res.data.project;
  },

  /**
   * Save draft deliverables and written explanations
   */
  async saveDeliverables(
    projectId: string,
    payload: { deliverables?: any[]; writtenExplanations?: string },
    token: string
  ) {
    const res = await apiRequest<{ project: StudentProject }>(
      `/academic/projects/my-projects/${projectId}/deliverables`,
      {
        method: "PUT",
        token,
        body: payload,
      }
    );
    return res.data.project;
  },

  /**
   * Upload an evidence deliverable file (CAD drawings, PDF reports, images)
   */
  async uploadDeliverableFile(
    projectId: string,
    formData: FormData,
    token: string
  ) {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const res = await fetch(`${baseUrl}/academic/projects/my-projects/${projectId}/deliverables/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "File upload failed" }));
      throw new Error(err.message || "File upload failed");
    }

    const json = await res.json();
    return json.data;
  },

  /**
   * Submit project for rubric-based evaluation
   */
  async submitProject(
    projectId: string,
    writtenExplanations: string = "",
    token: string
  ) {
    const res = await apiRequest<{ project: StudentProject }>(
      `/academic/projects/my-projects/${projectId}/submit`,
      {
        method: "POST",
        token,
        body: { writtenExplanations },
      }
    );
    return res.data.project;
  },

  /**
   * Toggle portfolio visibility for a completed project
   */
  async togglePortfolioVisibility(
    projectId: string,
    visibility: boolean,
    token: string
  ) {
    const res = await apiRequest<{ project: StudentProject }>(
      `/academic/projects/my-projects/${projectId}/portfolio-visibility`,
      {
        method: "PATCH",
        token,
        body: { visibility },
      }
    );
    return res.data.project;
  },

  /**
   * Sync a completed project to the student's resume showcase collection
   */
  async syncToResume(projectId: string, token: string) {
    const res = await apiRequest<{
      synced: boolean;
      resumeProjectId?: string;
      project: StudentProject;
    }>(`/academic/projects/my-projects/${projectId}/sync-resume`, {
      method: "POST",
      token,
    });
    return res.data;
  },

  /**
   * Fetch public or user evidence portfolio
   */
  async fetchEvidencePortfolio(ownerId?: string, token?: string) {
    const query = ownerId ? `?ownerId=${ownerId}` : "";
    const res = await apiRequest<{
      projects: StudentProject[];
      total: number;
    }>(`/academic/projects/evidence-portfolio${query}`, { token });
    return res.data;
  },
};
