import { apiRequest } from "@/lib/api";
import {
  CareerRole,
  RoleReadinessDiagnosis,
  RoleComparisonResult,
  PreparationPlanResult,
} from "../types/careerPathway.types";

export interface GetCareerRolesParams {
  branch?: string;
  roleFamily?: string;
  search?: string;
  includeCrossDisciplinary?: boolean;
}

export const careerPathwayApi = {
  /**
   * Fetch canonical career roles filtered and ranked by branch relevance.
   */
  async getCareerRoles(params?: GetCareerRolesParams): Promise<{ roles: CareerRole[]; branch: string | null; total: number }> {
    const query = new URLSearchParams();
    if (params?.branch) query.set("branch", params.branch);
    if (params?.roleFamily && params.roleFamily !== "all") query.set("roleFamily", params.roleFamily);
    if (params?.search) query.set("search", params.search);
    if (params?.includeCrossDisciplinary !== undefined) {
      query.set("includeCrossDisciplinary", String(params.includeCrossDisciplinary));
    }

    const queryString = query.toString();
    const endpoint = `/career/pathways/roles${queryString ? `?${queryString}` : ""}`;
    const res = await apiRequest<{ roles: CareerRole[]; branch: string | null; total: number }>(endpoint);
    return res.data;
  },

  /**
   * Fetch full role details including linked practical labs, assessments, and projects.
   */
  async getRoleById(roleId: string): Promise<CareerRole> {
    const res = await apiRequest<{ role: CareerRole }>(`/career/pathways/roles/${encodeURIComponent(roleId)}`);
    return res.data.role;
  },

  /**
   * Evaluate authenticated student's evidence-based readiness for a target role.
   */
  async evaluateRoleReadiness(roleId: string): Promise<RoleReadinessDiagnosis> {
    const res = await apiRequest<RoleReadinessDiagnosis>(`/career/pathways/readiness/${encodeURIComponent(roleId)}`);
    return res.data;
  },

  /**
   * Side-by-side comparison between two career roles for the authenticated student.
   */
  async compareRoles(roleId1: string, roleId2: string): Promise<RoleComparisonResult> {
    const res = await apiRequest<RoleComparisonResult>(`/career/pathways/compare`, {
      method: "POST",
      body: JSON.stringify({ roleId1, roleId2 }),
    });
    return res.data;
  },

  /**
   * Generate ordered, deduplicated preparation plan connecting to SSH platform activities.
   */
  async getPreparationPlan(roleId: string): Promise<PreparationPlanResult> {
    const res = await apiRequest<PreparationPlanResult>(`/career/pathways/preparation-plan/${encodeURIComponent(roleId)}`);
    return res.data;
  },
};
