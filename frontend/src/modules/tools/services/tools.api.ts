import { apiRequest } from "@/lib/api";
import {
  CanonicalTool,
  ToolCatalogResponse,
  ToolExecutionResult,
  ToolActivityRecord,
} from "../types/tools.types";

export interface GetToolCatalogParams {
  branch?: string;
  category?: string;
  discipline?: string;
  search?: string;
}

export const toolsApi = {
  /**
   * Fetch canonical tool registry with branch, category, and keyword filters.
   */
  async getToolCatalog(params?: GetToolCatalogParams): Promise<ToolCatalogResponse> {
    const query = new URLSearchParams();
    if (params?.branch) query.set("branch", params.branch);
    if (params?.category && params.category !== "All") query.set("category", params.category);
    if (params?.discipline && params.discipline !== "All") query.set("discipline", params.discipline);
    if (params?.search) query.set("search", params.search);

    const qs = query.toString();
    const endpoint = `/tools${qs ? `?${qs}` : ""}`;
    const res = await apiRequest<ToolCatalogResponse>(endpoint);
    return res.data;
  },

  /**
   * Get single tool specification by ID.
   */
  async getToolById(toolId: string): Promise<CanonicalTool> {
    const res = await apiRequest<{ tool: CanonicalTool }>(`/tools/${encodeURIComponent(toolId)}`);
    return res.data.tool;
  },

  /**
   * Execute tool with validated inputs and obtain deterministic calculation or hybrid AI review.
   */
  async executeTool(toolId: string, inputs: Record<string, any>): Promise<ToolExecutionResult> {
    const res = await apiRequest<ToolExecutionResult>(`/tools/${encodeURIComponent(toolId)}/execute`, {
      method: "POST",
      body: JSON.stringify({ inputs }),
    });
    return res.data;
  },

  /**
   * Get authenticated student's recent tool activities.
   */
  async getMyToolActivity(limit = 20): Promise<{ records: ToolActivityRecord[]; total: number }> {
    const res = await apiRequest<{ records: ToolActivityRecord[]; total: number }>(
      `/tools/history/my-activity?limit=${limit}`
    );
    return res.data;
  },

  /**
   * Toggle portfolio saving preference on a student's tool activity record.
   */
  async togglePortfolioSave(
    recordId: string,
    payload?: { headline?: string; summary?: string; tags?: string[]; isSaved?: boolean }
  ): Promise<{ recordId: string; isSavedToPortfolio: boolean; portfolioMetadata: any }> {
    const res = await apiRequest<{ recordId: string; isSavedToPortfolio: boolean; portfolioMetadata: any }>(
      `/tools/history/${encodeURIComponent(recordId)}/portfolio`,
      {
        method: "PATCH",
        body: JSON.stringify(payload || {}),
      }
    );
    return res.data;
  },

  /**
   * Update editable report draft on student's tool activity record.
   */
  async updateReportDraft(
    recordId: string,
    reportDraft: Record<string, any>
  ): Promise<{ recordId: string; reportDraft: any }> {
    const res = await apiRequest<{ recordId: string; reportDraft: any }>(
      `/tools/history/${encodeURIComponent(recordId)}/report`,
      {
        method: "PUT",
        body: JSON.stringify({ reportDraft }),
      }
    );
    return res.data;
  },
};
