import { firebaseAuth, getAuthToken } from "./firebase";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

export const getBackendOrigin = () =>
  getApiBaseUrl().replace(/\/api\/v1$/i, "");

export const ensureExternalHttpsUrl = (value: string) => {
  const trimmedValue = String(value || "").trim();
  if (!trimmedValue) return "";
  if (/^https?:\/\//i.test(trimmedValue)) return trimmedValue;
  return `https://${trimmedValue.replace(/^\/+/, "")}`;
};

export const resolveResumeViewerUrl = (resume: { _id?: string; filePath?: string }): string => {
  const rawPath = String(resume.filePath || "").trim();
  if (rawPath.startsWith("https://") || rawPath.startsWith("http://")) {
    return rawPath;
  }
  if (resume._id) {
    return `${getApiBaseUrl()}/resumes/${encodeURIComponent(resume._id)}/file`;
  }
  return "";
};

export type ApiEnvelope<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

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

    const payload = (await response.json()) as (ApiEnvelope<T> & { message?: string; error?: string }) | { message?: string; error?: string };

    if (!response.ok) {
      const errObj = payload as { message?: string; error?: string };
      throw new Error(errObj.message || errObj.error || "Request failed");
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

// ==========================================
// TYPED API CLIENT FOR SMART SKILL HUB
// ==========================================

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

export interface SkillGapItem {
  skill: string;
  canonicalName: string;
  category: string;
  status: "Missing" | "Weak / Action Required" | "Developing / Limited Evidence" | "Met Requirement" | string;
  priority: "Critical" | "High" | "Medium" | "Low" | "None" | string;
  isCore?: boolean;
  currentScore?: number;
  currentLevel?: string;
  requiredLevel?: string;
  reason?: string;
}

export type SkillGapViewModel = {
  skill: string;
  canonicalName: string;
  category: string;
  status: string;
  priority: string;
  isCore: boolean;
  currentScore: number;
  currentLevel: string;
  requiredLevel: string;
  reason: string;
};

export function normalizeSkillGap(raw: any): SkillGapViewModel {
  if (!raw || typeof raw !== "object") {
    return {
      skill: "Unknown",
      canonicalName: "Unknown",
      category: "General",
      status: "Missing",
      priority: "Medium",
      isCore: false,
      currentScore: 0,
      currentLevel: "None",
      requiredLevel: "Competent",
      reason: "No evidence observed across connected sources.",
    };
  }

  const canonicalName = String(raw.canonicalName || raw.skill || "Unknown").trim();
  const skill = String(raw.skill || canonicalName).trim();
  const category = String(raw.category || "General").trim();
  const currentScore = typeof raw.currentScore === "number" ? raw.currentScore : Number(raw.currentScore) || 0;
  const currentLevel = String(raw.currentLevel || (currentScore >= 70 ? "Competent" : currentScore >= 40 ? "Developing" : "None")).trim();
  const requiredLevel = String(raw.requiredLevel || "Competent").trim();
  const priority = String(raw.priority || (currentScore === 0 ? "High" : "Medium")).trim();
  const reason = String(raw.reason || raw.explanation || (currentScore === 0 ? "No evidence observed across connected sources." : "Proficiency is below target requirement.")).trim();

  // If status is present, use it safely; otherwise infer reliably from score / missingFrom
  let status = String(raw.status || "").trim();
  if (!status) {
    if (currentScore === 0 || (Array.isArray(raw.missingFrom) && raw.missingFrom.length > 0)) {
      status = "Missing";
    } else if (currentScore < 50) {
      status = "Weak / Action Required";
    } else if (currentScore < 75) {
      status = "Developing / Limited Evidence";
    } else {
      status = "Met Requirement";
    }
  }

  return {
    skill,
    canonicalName,
    category,
    status,
    priority,
    isCore: Boolean(raw.isCore),
    currentScore,
    currentLevel,
    requiredLevel,
    reason,
  };
}

export function normalizeSkillGaps(rawGaps: any): SkillGapViewModel[] {
  if (!Array.isArray(rawGaps)) return [];
  return rawGaps
    .filter((g) => g != null)
    .map(normalizeSkillGap);
}

export interface RecommendationItem {
  recommendationId?: string;
  skill: string;
  priority: string;
  gapStatus?: string;
  learningObjective: string;
  action: string;
  practicalAction?: string;
  platformTaskId?: string | null;
  platformTaskTitle?: string | null;
  documentationUrl?: string;
  estimatedHours?: number;
  status?: string;
}

export interface SkillProfileData {
  _id?: string;
  owner?: string;
  targetRole: string;
  overallReadinessScore: number;
  skills: EvaluatedSkill[];
  skillGaps: SkillGapItem[];
  recommendations: RecommendationItem[];
  evaluationVersion: string;
  evaluatedAt: string;
}

export interface CodingTaskSummary {
  id: string;
  title: string;
  language: string;
  difficulty: string;
  category: string;
  points: number;
  testCount: number;
  descriptionSummary: string;
  skills: string[];
}

export interface CodingTaskDetail {
  id: string;
  language: string;
  title: string;
  functionName: string;
  difficulty: string;
  category: string;
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCode: string;
  points: number;
  sampleTests: Array<{ id: number; name: string; isSample: boolean; input?: any; expected?: any }>;
  totalTestsCount: number;
  skills: string[];
}

export interface CodingExecutionResult {
  type: string;
  taskId?: string;
  status: "completed" | "failed" | "timeout" | "syntax_error";
  score?: number;
  maxScore?: number;
  passed?: number;
  failed?: number;
  total?: number;
  tests?: Array<{
    id: number;
    name: string;
    passed: boolean;
    isSample: boolean;
    expected: any;
    actual: any;
    input: any;
    executionTimeMs?: number;
    error?: string;
  }>;
  taskResults?: {
    results: Array<{ id: number; name: string; passed: boolean; actual: any; executionTimeMs: number; error?: string }>;
  };
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  submissionId?: string;
}

export interface GitHubProfileAnalysis {
  analysisId?: string;
  username: string;
  profile: {
    name: string;
    bio: string;
    avatarUrl: string;
    company: string;
    location: string;
    blog: string;
    publicRepos: number;
    followers: number;
    following: number;
    createdAt: string;
  };
  repositories: Array<{
    name: string;
    description: string;
    htmlUrl: string;
    language: string;
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    sizeKB: number;
    archived: boolean;
    fork: boolean;
    updatedAt: string;
  }>;
  languages: Record<string, { size: number; percentage: number; repoCount: number }>;
  dominantLanguage: string;
  aggregateStats: {
    totalStars: number;
    totalForks: number;
    totalWatchers: number;
    totalIssues: number;
    totalSizeKB: number;
    archivedCount: number;
    forkedCount: number;
  };
  aiInsights?: {
    summary: string;
    skillAssessment: string;
    strengths: string[];
    weaknesses: string[];
    portfolioImprovementTips: string[];
    readmeQualityTips: string[];
    recommendedTechnologies: string[];
    careerSuggestions: string[];
    githubOptimizationScore: number;
  };
  aiRoast?: {
    level: string;
    roastTitle: string;
    roastBody: string;
    bullets: string[];
    roastScore: number;
    recoverabilityIndex: string;
    potentialScore: string;
    entertainmentValue: string;
    constructiveAdvice: string;
  };
  analyzedAt: string;
}

export const SmartSkillApi = {
  // Skills
  evaluateSkills: async () =>
    (await apiRequest<{ profile: SkillProfileData; evaluation: any; gapAnalysis: any; recommendations: any }>(
      "/skills/evaluate",
      { method: "POST" }
    )).data,

  getSkillProfile: async () =>
    (await apiRequest<{ profile: SkillProfileData }>("/skills/profile")).data.profile,

  getSkillGaps: async (role?: string) =>
    (await apiRequest<{ gapAnalysis: { targetRole: string; roleDescription: string; roleMatchPercentage: number; gaps: SkillGapItem[]; metSkills: any[] } }>(
      role ? `/gaps/role/${encodeURIComponent(role)}` : "/gaps"
    )).data.gapAnalysis,

  getRoles: async () =>
    (await apiRequest<{ roles: Array<{ key: string; roleName: string; description: string }> }>("/gaps/roles")).data.roles,

  getRecommendations: async (role?: string) =>
    (await apiRequest<{ recommendations: RecommendationItem[] }>(
      `/recommendations${role ? `?role=${encodeURIComponent(role)}` : ""}`
    )).data.recommendations,

  getRoadmap: async (role?: string) =>
    (await apiRequest<{ targetRole: string; roadmap: Array<{ phase: number; title: string; items: RecommendationItem[] }> }>(
      `/recommendations/roadmap${role ? `?role=${encodeURIComponent(role)}` : ""}`
    )).data.roadmap,

  // Coding
  getCodingTasks: async () =>
    (await apiRequest<{ tasks: CodingTaskSummary[] }>("/coding/tasks")).data.tasks,

  getTaskDetail: async (taskId: string) =>
    (await apiRequest<{ task: CodingTaskDetail }>(`/coding/tasks/${encodeURIComponent(taskId)}`)).data.task,

  runCode: async (code: string, taskId?: string) =>
    (await apiRequest<CodingExecutionResult>("/coding/run", {
      method: "POST",
      body: { code, taskId },
    })).data,

  submitSolution: async (taskId: string, code: string) =>
    (await apiRequest<CodingExecutionResult>("/coding/submit", {
      method: "POST",
      body: { taskId, code },
    })).data,

  getCodingSubmissions: async () =>
    (await apiRequest<{ submissions: any[] }>("/coding/submissions")).data.submissions,

  // GitHub
  analyzeGitHub: async (username?: string) =>
    (await apiRequest<GitHubProfileAnalysis>("/github/analyze", {
      method: "POST",
      body: username ? { username } : {},
    })).data,

  getGitHubInsights: async (username: string, profileData?: any) =>
    (await apiRequest<{ insights: GitHubProfileAnalysis["aiInsights"] }>("/github/ai/insights", {
      method: "POST",
      body: { username, profileData },
    })).data.insights,

  getCareerMentor: async (username: string, role?: string, profileData?: any) =>
    (await apiRequest<{ mentor: any }>(
      `/github/mentor/${encodeURIComponent(username)}${role ? `?role=${encodeURIComponent(role)}` : ""}`,
      { method: "GET" }
    )).data.mentor,

  askCareerMentor: async (username: string, question: string, role?: string, profileData?: any) =>
    (await apiRequest<{ answer: any }>("/github/mentor/ask", {
      method: "POST",
      body: { username, question, role, profileData },
    })).data.answer,

  getLatestGitHubAnalysis: async () =>
    (await apiRequest<{ analysis: GitHubProfileAnalysis | null }>("/github/latest")).data.analysis,

  compareGitHub: async (user1: string, user2: string) =>
    (await apiRequest<{ user1: GitHubProfileAnalysis; user2: GitHubProfileAnalysis }>(
      `/github/compare?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`
    )).data,
};
