import { apiRequest } from "@/lib/api";

export interface AcademicDegreeOption {
  _id?: string;
  slug: string;
  name: string;
  shortName: string;
  stream: string;
  durationYears: number;
  totalSemesters: number;
  description?: string;
}

export interface AcademicSpecializationOption {
  slug: string;
  name: string;
  description?: string;
}

export interface AcademicBranchOption {
  _id?: string;
  slug: string;
  name: string;
  code: string;
  degreeSlugs: string[];
  stream: string;
  description?: string;
  aliases?: string[];
  specializations: AcademicSpecializationOption[];
}

export interface CareerRoleOption {
  _id?: string;
  slug: string;
  title: string;
  category: string;
  description?: string;
  experienceLevel?: string;
  coreSkills?: string[];
  prerequisiteSkills?: string[];
  mapping?: {
    relationshipType: "primary" | "related" | "interdisciplinary" | "optional";
    relevanceScore: number;
    notes?: string;
    recommendedPrerequisites?: string[];
  };
}

export interface AcademicOptionsResponse {
  degrees: AcademicDegreeOption[];
  branches: AcademicBranchOption[];
  careerRoles: CareerRoleOption[];
  streams: string[];
  careerCategories: string[];
}

export const AcademicApi = {
  /**
   * Fetch all academic options (degrees, branches, specializations, career roles)
   */
  getOptions: async (): Promise<AcademicOptionsResponse> => {
    const res = await apiRequest<AcademicOptionsResponse>("/academic/options");
    return res.data;
  },

  /**
   * Fetch recommended career roles for a specific branch
   */
  getBranchRoles: async (branchSlug: string): Promise<CareerRoleOption[]> => {
    if (!branchSlug) return [];
    const res = await apiRequest<{ branchSlug: string; roles: CareerRoleOption[] }>(
      `/academic/branches/${encodeURIComponent(branchSlug)}/roles`
    );
    return res.data.roles || [];
  },
};

export const academicApi = AcademicApi;
