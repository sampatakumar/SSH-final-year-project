import { apiRequest } from "@/lib/api";
import type { BackendUser } from "@/core/auth/types";

export interface UpdateProfilePayload {
  displayName?: string;
  headline?: string;
  phone?: string;
  about?: string;
  customDomain?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  leetCodeId?: string;
  geeksForGeeksId?: string;
  educationEntries?: Array<{
    degree?: string;
    specialization?: string;
    college?: string;
    location?: string;
    endDate?: string;
    grade?: string;
  }>;
  education?: string[];
  skillSections?: Array<{
    title?: string;
    skills?: string[];
  }>;
  skillLanguages?: string[];
  skillFrameworks?: string[];
  skillTools?: string[];
  skillLibraries?: string[];
  experience?: Array<{
    role?: string;
    company?: string;
    location?: string;
    date?: string;
    bullets?: string[];
  }>;
  achievements?: Array<{
    title?: string;
    date?: string;
    bullets?: string[];
  }>;
}

export interface GenerateProfileSummaryPayload {
  tone?: "professional" | "confident" | "concise" | "friendly";
  maxWords?: number;
  skills?: string[];
  educationLines?: string[];
  achievements?: Array<{
    title?: string;
    date?: string;
    bullets?: string[];
  }>;
  projects?: Array<{
    title?: string;
    description?: string;
    stack?: string | string[];
    date?: string;
  }>;
}

export interface ProfileSummaryResponse {
  profileSummary?: string;
  summary?: string;
  metadata?: {
    provider?: string;
    model?: string;
  };
}

export const ProfileApi = {
  /**
   * Fetch current authenticated user profile
   */
  getProfile: async (): Promise<BackendUser> => {
    const res = await apiRequest<{ user: BackendUser }>("/auth/me");
    return res.data.user;
  },

  /**
   * Update current authenticated user profile
   */
  updateProfile: async (payload: UpdateProfilePayload): Promise<BackendUser> => {
    const res = await apiRequest<{ user: BackendUser }>("/auth/me", {
      method: "PATCH",
      body: payload,
    });
    return res.data.user;
  },

  /**
   * Generate AI professional profile summary using Groq openai/gpt-oss-120b
   */
  generateProfileSummary: async (
    payload: GenerateProfileSummaryPayload = {}
  ): Promise<ProfileSummaryResponse> => {
    const res = await apiRequest<ProfileSummaryResponse>("/ai/profile-summary", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },
};
