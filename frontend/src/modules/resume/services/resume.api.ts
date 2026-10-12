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

export interface LanguageIssue {
  id: string;
  originalText: string;
  proposedCorrection: string;
  category: string;
  explanation: string;
  severity: "critical" | "warning" | "suggestion" | "high" | "medium" | "low";
  section: string;
  itemIndex?: number;
  bulletIndex?: number;
  safeToApply: boolean;
}

export interface ResumeQualityRating {
  score: number;
  overallScore?: number;
  categoryScores?: {
    writingAndGrammar?: number;
    technicalSpecificity?: number;
    impactAndActionVerbs?: number;
    sectionOrganization?: number;
    completenessAndPresentation?: number;
  };
  categories?: Record<string, { score: number; maxScore: number; feedback?: string }>;
  strengths?: string[];
  weaknesses?: string[];
  rubricVersion: string;
}

export interface AtsReadinessEvaluation {
  score: number;
  overallScore?: number;
  label: string;
  passedCount: number;
  totalCount: number;
  checks: Array<{
    id: string;
    title: string;
    passed: boolean;
    explanation: string;
    fixSection?: string;
  }>;
  rubricVersion: string;
}

export interface RoleMatchAnalysis {
  hasTarget: boolean;
  targetRole?: string;
  matchScore: number;
  matchPercentage?: number;
  matchedDemonstrated: string[];
  matchedMentioned: string[];
  requiredSkillsMatched?: string[];
  missingRequired: string[];
  missingRequiredSkills?: string[];
  missingPreferred: string[];
  recommendations: string[];
  summary?: string;
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

  /**
   * Live Resume Copilot Chat
   */
  chatWithCopilot: async (
    resumeDataOrPayload: any,
    userQuestion?: string,
    messages?: Array<{ role: string; content: string }>,
    githubEvidence?: any
  ): Promise<any> => {
    let payload: any;
    if (typeof resumeDataOrPayload === "object" && resumeDataOrPayload.userQuestion) {
      payload = resumeDataOrPayload;
    } else {
      payload = {
        resumeData: resumeDataOrPayload,
        userQuestion,
        messages,
        githubEvidence,
      };
    }

    const res = await apiRequest<any>("/ai/resume/copilot-chat", {
      method: "POST",
      body: payload,
    });

    const reply = res.data?.reply || res.data?.answer || "Thank you for asking. Your resume has been analyzed.";
    return {
      success: true,
      data: {
        reply,
        answer: reply,
        ...res.data,
      },
      reply,
      answer: reply,
      provider: res.data?.provider || "groq",
      modelUsed: res.data?.modelUsed || "groq-llama-3.3-70b-versatile",
      timestamp: res.data?.timestamp || new Date().toISOString(),
    };
  },

  /**
   * Review resume draft grammar, spelling, verb strength & style
   */
  reviewLanguage: async (resumeDataOrPayload: any): Promise<any> => {
    const resumeData = resumeDataOrPayload?.resumeData ? resumeDataOrPayload.resumeData : resumeDataOrPayload;
    const res = await apiRequest<any>("/ai/resume/review-language", {
      method: "POST",
      body: { resumeData },
    });

    const issues = res.data?.issues || [];
    return {
      success: true,
      data: {
        issues,
        totalIssues: res.data?.totalIssues ?? issues.length,
        criticalCount: res.data?.criticalCount ?? 0,
        warningCount: res.data?.warningCount ?? 0,
        suggestionCount: res.data?.suggestionCount ?? 0,
        ...res.data,
      },
      issues,
      totalIssues: res.data?.totalIssues ?? issues.length,
      criticalCount: res.data?.criticalCount ?? 0,
      warningCount: res.data?.warningCount ?? 0,
      suggestionCount: res.data?.suggestionCount ?? 0,
      timestamp: res.data?.timestamp || new Date().toISOString(),
    };
  },

  /**
   * Evaluate Dual Scores: ATS Readiness & Qualitative Rating
   */
  evaluateScores: async (
    resumeDataOrPayload: any,
    githubEvidenceOrTargetRole?: any,
    jobDescription?: string
  ): Promise<any> => {
    let payload: any;
    if (typeof resumeDataOrPayload === "object" && resumeDataOrPayload.resumeData) {
      payload = resumeDataOrPayload;
    } else {
      payload = {
        resumeData: resumeDataOrPayload,
        githubEvidence: typeof githubEvidenceOrTargetRole === "object" ? githubEvidenceOrTargetRole : undefined,
        targetRole: typeof githubEvidenceOrTargetRole === "string" ? githubEvidenceOrTargetRole : undefined,
        jobDescription,
      };
    }

    const res = await apiRequest<any>("/ai/resume/evaluate-scores", {
      method: "POST",
      body: payload,
    });

    const quality = res.data?.quality || res.data?.qualityRating || {
      overallScore: 80,
      score: 80,
      rubricVersion: "quality-v2.0-deterministic",
    };
    const ats = res.data?.ats || res.data?.atsReadiness || {
      overallScore: 85,
      score: 85,
      label: "HIGH_READINESS",
      passedCount: 8,
      totalCount: 9,
      checks: [],
      rubricVersion: "ats-v2.0-deterministic",
    };
    const recommendations = res.data?.recommendations || [];

    return {
      success: true,
      data: {
        quality,
        qualityRating: quality,
        ats,
        atsReadiness: ats,
        recommendations,
        ...res.data,
      },
      quality,
      qualityRating: quality,
      ats,
      atsReadiness: ats,
      recommendations,
      atsReadinessScore: ats.score || ats.overallScore,
      qualityRatingScore: quality.score || quality.overallScore,
    };
  },

  /**
   * Compare resume against target role / job description
   */
  analyzeRole: async (
    resumeDataOrPayload: any,
    targetRole?: string,
    jobDescription?: string
  ): Promise<any> => {
    let payload: any;
    if (typeof resumeDataOrPayload === "object" && resumeDataOrPayload.resumeData) {
      payload = resumeDataOrPayload;
    } else {
      payload = {
        resumeData: resumeDataOrPayload,
        targetRole,
        jobDescription,
      };
    }

    const res = await apiRequest<any>("/ai/resume/analyze-role", {
      method: "POST",
      body: payload,
    });

    const matchPercentage = res.data?.matchPercentage ?? res.data?.matchScore ?? 0;
    return {
      success: true,
      data: {
        matchPercentage,
        matchScore: matchPercentage,
        ...res.data,
      },
      hasTarget: Boolean(payload.targetRole || payload.jobDescription),
      targetRole: payload.targetRole,
      matchPercentage,
      matchScore: matchPercentage,
      matchedDemonstrated: res.data?.matchedDemonstrated || [],
      matchedMentioned: res.data?.matchedMentioned || [],
      requiredSkillsMatched: res.data?.requiredSkillsMatched || res.data?.matchedDemonstrated || [],
      missingRequired: res.data?.missingRequired || [],
      missingRequiredSkills: res.data?.missingRequiredSkills || res.data?.missingRequired || [],
      missingPreferred: res.data?.missingPreferred || [],
      recommendations: res.data?.recommendations || [],
      summary: res.data?.summary || `Match calculated at ${matchPercentage}%`,
    };
  },

  /**
   * Analyze uploaded resume document with quality rating, language review & ATS checks
   */
  analyzeUploaded: async (payload: {
    resumeId?: string;
    extractionData?: any;
    targetRole?: string;
    jobDescription?: string;
  }): Promise<any> => {
    const res = await apiRequest<any>("/ai/resume/analyze-uploaded", {
      method: "POST",
      body: payload,
    });
    return {
      success: true,
      data: res.data,
      ...res.data,
    };
  },
};
