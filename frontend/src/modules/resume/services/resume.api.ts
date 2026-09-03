import { apiRequest } from "@/lib/api";

export interface ExtractedProfileData {
  profile: {
    displayName?: string;
    headline?: string;
    phone?: string;
    about?: string;
    customDomain?: string;
  };
  preferences: {
    linkedInUrl?: string;
    githubUrl?: string;
    leetCodeId?: string;
    geeksForGeeksId?: string;
  };
  contact: {
    email?: string;
  };
  educationEntries: Array<{
    degree?: string;
    specialization?: string;
    college?: string;
    location?: string;
    endDate?: string;
    grade?: string;
  }>;
  skillSections: Array<{
    title?: string;
    skills?: string[];
  }>;
  experience: Array<{
    role?: string;
    company?: string;
    location?: string;
    date?: string;
    bullets?: string[] | string;
  }>;
  projects: Array<{
    title?: string;
    description?: string;
    stack?: string[] | string;
    date?: string;
    githubUrl?: string;
    demoUrl?: string;
  }>;
  achievements: Array<{
    title?: string;
    date?: string;
    bullets?: string[] | string;
  }>;
}

export interface ExtractionConfidence {
  overall: "HIGH" | "MEDIUM" | "LOW";
  fields: Record<string, { value?: string; count?: number; confidence: "HIGH" | "MEDIUM" | "LOW" }>;
}

export interface ResumeUploadExtractionResponse {
  resume: {
    _id: string;
    title: string;
    format: string;
    filePath?: string;
    signedUrlExpiresAt?: string;
    content?: string;
    createdAt: string;
    updatedAt: string;
  };
  extractedProfile: ExtractedProfileData;
  confidence: ExtractionConfidence;
  extractionMeta: {
    originalFileName: string;
    fileSize: number;
    mimeType: string;
    textLength: number;
    extractedLinksCount: number;
    status: "READY" | "PROCESSING" | "FAILED";
  };
}

export const ResumeApi = {
  /**
   * Upload resume document (PDF, DOCX, TXT, RTF, Image) and trigger automated detail extraction
   */
  uploadAndExtract: async (file: File, title?: string): Promise<ResumeUploadExtractionResponse> => {
    const formData = new FormData();
    formData.append("resumeFile", file);
    if (title) {
      formData.append("title", title);
    }

    const res = await apiRequest<ResumeUploadExtractionResponse>("/resumes/upload", {
      method: "POST",
      body: formData,
    });

    return res.data;
  },

  /**
   * Re-extract details from an existing uploaded resume by ID
   */
  extractById: async (resumeId: string): Promise<{
    resumeId: string;
    extractedProfile: ExtractedProfileData;
    confidence: ExtractionConfidence;
  }> => {
    const res = await apiRequest<{
      resumeId: string;
      extractedProfile: ExtractedProfileData;
      confidence: ExtractionConfidence;
    }>(`/resumes/${encodeURIComponent(resumeId)}/extract`, {
      method: "POST",
    });

    return res.data;
  },

  /**
   * Safely merge and apply reviewed extracted profile data to the user profile
   */
  applyToProfile: async (payload: Partial<ExtractedProfileData>): Promise<{ user: any }> => {
    const res = await apiRequest<{ user: any }>("/resumes/apply-profile", {
      method: "POST",
      body: payload,
    });

    return res.data;
  },

  /**
   * Get all user resumes
   */
  getResumes: async (): Promise<Array<any>> => {
    const res = await apiRequest<{ resumes: Array<any> }>("/resumes");
    return res.data.resumes;
  },

  /**
   * Delete uploaded resume file by ID
   */
  deleteResume: async (resumeId: string): Promise<{ resumeId: string }> => {
    const res = await apiRequest<{ resumeId: string }>(`/resumes/${encodeURIComponent(resumeId)}`, {
      method: "DELETE",
    });
    return res.data;
  },
};
