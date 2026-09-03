import { firebaseAuth, getAuthToken } from "../auth/firebase";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

export const getBackendOrigin = () =>
  getApiBaseUrl().replace(/\/api\/v1$/i, "");

export interface ApiEnvelope<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<ApiEnvelope<T>> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  try {
    const token =
      options.token !== undefined
        ? options.token
        : await getAuthToken();

    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
      },
      cache: "no-store",
      body: options.body
        ? isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body)
        : undefined,
    });

    const payload = (await response.json()) as ApiEnvelope<T> | { message?: string; error?: string };

    if (!response.ok) {
      throw new Error((payload as { message?: string }).message || (payload as { error?: string }).error || "Request failed");
    }

    return payload as ApiEnvelope<T>;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Failed to reach backend at ${getApiBaseUrl()}. Make sure the backend server is running.`
      );
    }
    throw error;
  }
}

// Re-export core interfaces
export interface EvaluatedSkill {
  skill: string;
  canonicalName: string;
  category: string;
  score: number;
  level: "Limited Evidence" | "Developing" | "Competent" | "Proficient" | "Strong Evidence";
  confidence: number;
  sources: string[];
  evidenceCount: number;
  lastObservedAt: string;
  explanation: string;
  observations?: string[];
}

export interface SkillProfileResponse {
  profile: {
    _id: string;
    owner: string;
    targetRole: string;
    overallReadinessScore: number;
    skills: EvaluatedSkill[];
    evidenceSummary: {
      resumeEvidenceCount: number;
      githubReposAnalyzed: number;
      codingProblemsSolved: number;
      totalSubmissions: number;
    };
    evaluationVersion: string;
    lastEvaluatedAt: string;
  };
}

export interface SkillGapItem {
  skill: string;
  canonicalName: string;
  category: string;
  status: "Missing" | "Weak / Action Required" | "Developing / Limited Evidence" | "Met Requirement";
  priority: "Critical" | "High" | "Medium" | "Low" | "None";
  isCore: boolean;
  currentScore: number;
  currentLevel: string;
  requiredLevel: string;
  reason: string;
}

export interface SkillGapResponse {
  gapAnalysis: {
    targetRole: string;
    roleDescription: string;
    roleMatchPercentage: number;
    totalRequiredSkills: number;
    metSkillsCount: number;
    gapsCount: number;
    gaps: SkillGapItem[];
    metSkills: Array<{
      skill: string;
      canonicalName: string;
      category: string;
      currentScore: number;
      currentLevel: string;
      requiredLevel: string;
    }>;
  };
}

export interface RecommendationItem {
  recommendationId: string;
  skill: string;
  canonicalName: string;
  category: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  gapStatus: string;
  currentScore: number;
  currentLevel: string;
  targetLevel: string;
  targetRole: string;
  learningObjective: string;
  practicalAction: string;
  reasoning: string;
  platformTaskId: string | null;
  platformTaskTitle: string | null;
  documentationUrl: string;
  estimatedHours: number;
  actionStatus: string;
}

export interface CodingTaskSummary {
  id: string;
  title: string;
  language: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  points: number;
  testCount: number;
  descriptionSummary: string;
  skills: string[];
}

export interface CodingTaskDetail extends CodingTaskSummary {
  description: string;
  starterCode: string;
  sampleTests: Array<{
    input: unknown[];
    expected: unknown;
    description: string;
    isSample: boolean;
  }>;
  totalTestsCount: number;
  constraints?: string[];
  examples?: Array<{ input: string; output: string; explanation?: string }>;
}

export interface SubmissionEvaluationResult {
  submissionId: string;
  status: "passed" | "failed" | "error" | "timeout";
  score: number;
  maxScore: number;
  passed: number;
  failed: number;
  total: number;
  executionTimeMs: number;
  tests: Array<{
    index: number;
    description: string;
    passed: boolean;
    error?: string;
    isSample: boolean;
  }>;
  stdout?: string;
  stderr?: string;
}

// Domain API Call Methods
export const api = {
  // Skills
  getSkillProfile: () => apiRequest<SkillProfileResponse>("/skills/profile"),
  evaluateSkills: () => apiRequest<SkillProfileResponse>("/skills/evaluate", { method: "POST" }),
  getSkillHistory: () => apiRequest<unknown>("/skills/history"),

  // Gaps
  getGaps: (role?: string) =>
    apiRequest<SkillGapResponse>(role ? `/gaps/role/${encodeURIComponent(role)}` : "/gaps"),
  analyzeGaps: (targetRole: string) => apiRequest<SkillGapResponse>("/gaps/analyze", { method: "POST", body: { targetRole } }),
  getRoles: () => apiRequest<{ roles: Array<{ key: string; roleName: string; description: string }> }>("/gaps/roles"),

  // Recommendations
  getRecommendations: (role?: string) =>
    apiRequest<{ targetRole: string; recommendationsCount: number; recommendations: RecommendationItem[]; gapsSummary: unknown }>(
      `/recommendations${role ? `?role=${encodeURIComponent(role)}` : ""}`
    ),
  getRoadmap: (role?: string) =>
    apiRequest<{ targetRole: string; roadmap: Array<{ phase: number; title: string; items: RecommendationItem[] }> }>(
      `/recommendations/roadmap${role ? `?role=${encodeURIComponent(role)}` : ""}`
    ),
  getSkillRecommendation: (skill: string) =>
    apiRequest<{ recommendation: RecommendationItem }>(`/recommendations/skill/${encodeURIComponent(skill)}`),

  // Coding Platform
  getCodingTasks: () => apiRequest<{ tasks: CodingTaskSummary[] }>("/coding/tasks"),
  getCodingTask: (taskId: string) => apiRequest<{ task: CodingTaskDetail }>(`/coding/tasks/${taskId}`),
  runCodeSample: (taskId: string, code: string) =>
    apiRequest<{ status: string; passed: number; failed: number; tests: unknown[]; stdout?: string; stderr?: string }>(
      "/coding/run",
      { method: "POST", body: { taskId, code } }
    ),
  submitCodingTask: (taskId: string, code: string) =>
    apiRequest<SubmissionEvaluationResult>("/coding/submit", { method: "POST", body: { taskId, code } }),
  getCodingSubmissions: () => apiRequest<{ submissions: unknown[] }>("/coding/submissions"),

  // GitHub Intelligence
  getGitHubAnalysis: () => apiRequest<unknown>("/github/analysis"),
  analyzeGitHub: (username: string) => apiRequest<unknown>("/github/analyze", { method: "POST", body: { username } }),
  getGitHubInsights: () => apiRequest<unknown>("/github/ai/insights"),
  getCareerMentor: (username: string, role?: string) =>
    apiRequest<unknown>(`/github/mentor/${encodeURIComponent(username)}${role ? `?role=${encodeURIComponent(role)}` : ""}`),
  askCareerMentor: (username: string, question: string, role?: string) =>
    apiRequest<unknown>(`/github/mentor/${encodeURIComponent(username)}/ask`, {
      method: "POST",
      body: { question, role },
    }),
};
