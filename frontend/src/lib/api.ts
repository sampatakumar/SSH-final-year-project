import { firebaseAuth, getAuthToken } from "./firebase";

const DEFAULT_API_BASE_URL = "http://localhost:8000/api/v1";

export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.host;
    const hostname = window.location.hostname;

    // If accessed through devtunnels (e.g. p7vc1nkb-8080.inc1.devtunnels.ms)
    if (host.includes(".devtunnels.ms")) {
      const backendTunnelHost = host.replace(/-8080\./, "-8000.");
      return `https://${backendTunnelHost}/api/v1`;
    }

    // In production non-localhost environments without explicit VITE_API_URL,
    // fallback to same-origin path to prevent mixed-content or unreachable localhost calls
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${window.location.origin}/api/v1`;
    }
  }

  return DEFAULT_API_BASE_URL.replace(/\/$/, "");
};

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
  if (rawPath.startsWith("/api/v1/")) {
    return `${getBackendOrigin()}${rawPath}`;
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
        "X-Tunnel-Skip-Anti-Phishing-Page": "1",
        "bypass-tunnel-reminder": "1",
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
      const err = new Error(errObj.message || errObj.error || "Request failed");
      (err as any).statusCode = response.status;
      (err as any).data = (payload as any)?.data;
      throw err;
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
  observableEvidence?: string;
  evidenceType?: string[];
  learningRoute?: string;
  roadmapRoute?: string;
}

export interface MultiRoleComparisonReport {
  comparedRoles: string[];
  rolesCount: number;
  rolesSummary: Array<{
    roleName: string;
    targetRole: string;
    roleDescription?: string;
    benchmarkStatus: "validated" | "benchmark_pending" | "unknown_role";
    benchmarkPending?: boolean;
    roleMatchPercentage: number | null;
    totalRequiredSkills: number;
    metSkillsCount: number;
    gapsCount: number;
    topPriorityGap?: SkillGapItem | null;
  }>;
  sharedSkillsCount: number;
  sharedSkills: Array<{
    skill: string;
    canonicalName: string;
    category?: string;
    rolesRequiring: string[];
    rolesMet: string[];
    rolesMissing: string[];
    currentScore?: number;
    currentLevel?: string;
    requiredLevel?: string;
    priority?: string;
    evidenceType?: string[];
    observableEvidence?: string;
    learningRoute?: string;
  }>;
  roleSpecificSkillsCount: number;
  roleSpecificSkills: Record<string, Array<{
    skill: string;
    canonicalName: string;
    category?: string;
    rolesRequiring: string[];
    rolesMet: string[];
    rolesMissing: string[];
    currentScore?: number;
    currentLevel?: string;
    requiredLevel?: string;
    priority?: string;
    evidenceType?: string[];
    observableEvidence?: string;
    learningRoute?: string;
  }>>;
  highLeverageSkillsCount: number;
  highLeverageSkills: Array<{
    skill: string;
    canonicalName: string;
    category?: string;
    rolesRequiring: string[];
    rolesMet: string[];
    rolesMissing: string[];
    roleCount: number;
    roles: string[];
    currentScore?: number;
    currentLevel?: string;
    requiredLevel?: string;
    priority?: string;
    evidenceType?: string[];
    observableEvidence?: string;
    learningRoute?: string;
  }>;
  topCombinedGaps: Array<SkillGapItem & { affectedRoles: string[] }>;
  roleAnalyses?: any[];
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
  observableEvidence?: string;
  evidenceType?: string[];
  learningRoute?: string;
  roadmapRoute?: string;
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
      observableEvidence: "",
      evidenceType: ["project"],
      learningRoute: "/dashboard/edutube",
      roadmapRoute: "/dashboard/roadmap",
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
  const observableEvidence = typeof raw.observableEvidence === "string" ? raw.observableEvidence : "";
  const evidenceType = Array.isArray(raw.evidenceType) ? raw.evidenceType : ["project", "github"];
  const learningRoute = raw.learningRoute || `/dashboard/edutube?search=${encodeURIComponent(canonicalName)}`;
  const roadmapRoute = raw.roadmapRoute || "/dashboard/roadmap";

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
    observableEvidence,
    evidenceType,
    learningRoute,
    roadmapRoute,
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
  reasoning?: string;
  currentScore?: number;
  currentLevel?: string;
  targetLevel?: string;
  prerequisites?: string[];
  completionCriteria?: string;
  assessmentMethod?: string;
  estimatedEffortText?: string;
  edutubeTopicQuery?: string;
  platformTaskId?: string | null;
  platformTaskTitle?: string | null;
  documentationUrl?: string;
  estimatedHours?: number;
  status?: string;
  isCompleted?: boolean;
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

export interface CompetencyEvidenceKnowledge {
  satisfied: boolean;
  distinctCheckpointsPassed: number;
  totalCheckpointsAttempted: number;
  averageScore: number;
  passingThreshold: number;
  checkpoints: Array<{
    checkpointId: string;
    score: number;
    isCorrect: boolean;
    attemptedAt: string;
  }>;
}

export interface CompetencyEvidenceRetention {
  satisfied: boolean;
  maxStage: number;
  consecutiveSuccesses: number;
  bestScore: number;
  schedulesCount: number;
}

export interface CompetencyEvidenceApplied {
  satisfied: boolean;
  problemsSolvedCount: number;
  solvedTaskIds: string[];
  totalTestCasesPassed: number;
  totalTestCases: number;
  testPassRate: number;
}

export interface CompetencyEvidenceCapstone {
  satisfied: boolean;
  allPillarsSatisfied: boolean;
}

export interface CompetencyEvidenceBreakdown {
  knowledge: CompetencyEvidenceKnowledge;
  retention: CompetencyEvidenceRetention;
  applied: CompetencyEvidenceApplied;
  capstone: CompetencyEvidenceCapstone;
}

export interface CompetencyMatrixItem {
  competencyId: string;
  name: string;
  description: string;
  canonicalSkill: string;
  category: string;
  roles: string[];
  rubricVersion: string;
  status: "not_assessed" | "insufficient_evidence" | "knowledge_verified" | "applied_verified" | "retention_verified" | "capstone_competence";
  evidence: CompetencyEvidenceBreakdown;
  missingRequirements: string[];
  recommendedNextAction: {
    actionType: string;
    title: string;
    description: string;
    targetModule: string;
  };
  eligibleBadgeTypes: Array<"knowledge_specialist" | "applied_practitioner" | "retention_master" | "capstone_competence">;
  earnedBadges: CompetencyBadgeItem[];
}

export interface CompetencyMatrixSummary {
  totalCompetencies: number;
  capstoneVerified: number;
  appliedVerified: number;
  knowledgeVerified: number;
  retentionVerified: number;
  totalBadgesEarned: number;
  rubricVersion: string;
  evaluatedAt: string;
}

export interface CompetencyBadgeItem {
  _id?: string;
  badgeId: string;
  recipientIdentifier: string;
  competencyId: string;
  competencyName: string;
  skill: string;
  canonicalSkill: string;
  badgeType: "knowledge_specialist" | "applied_practitioner" | "retention_master" | "capstone_competence";
  rubricVersion: string;
  status: "active" | "revoked";
  revocationReason?: string;
  revokedAt?: string;
  issuedAt: string;
  signature: string;
  keyId: string;
  evidenceSummary: {
    evidenceCategories: string[];
    knowledgeScore: number;
    knowledgeCheckpointsPassed: number;
    retentionStage: number;
    consecutiveRetrievals: number;
    appliedProblemsSolved: number;
    appliedTestCasesPassed: number;
    verifiedAt: string;
  };
  issuer: string;
  criteriaUrl: string;
}

export interface PublicBadgeVerification {
  exists: boolean;
  isValid: boolean;
  isRevoked: boolean;
  revocationReason?: string;
  revokedAt?: string;
  badge?: {
    badgeId: string;
    recipientIdentifier: string;
    competencyId: string;
    competencyName: string;
    skill: string;
    canonicalSkill: string;
    badgeType: string;
    rubricVersion: string;
    issuedAt: string;
    issuer: string;
    keyId: string;
    evidenceSummary: {
      evidenceCategories: string[];
      knowledgeScore: number;
      knowledgeCheckpointsPassed: number;
      retentionStage: number;
      appliedProblemsSolved: number;
      verifiedAt: string;
    };
  };
  message: string;
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

  compareRoles: async (roles?: string[]) => {
    if (Array.isArray(roles) && roles.length > 0) {
      return (await apiRequest<{ comparison: MultiRoleComparisonReport }>(
        "/gaps/compare",
        {
          method: "POST",
          body: { roles },
        }
      )).data.comparison;
    }
    return (await apiRequest<{ comparison: MultiRoleComparisonReport }>(
      "/gaps/compare"
    )).data.comparison;
  },

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

  getAdaptiveLearningPathway: async (role?: string) =>
    (await apiRequest<any>(
      `/recommendations/pathway${role ? `?role=${encodeURIComponent(role)}` : ""}`
    )).data,

  getPathwayProgression: async () =>
    (await apiRequest<any>("/recommendations/pathway/progression")).data,

  completePathwayAction: async (
    actionId: string,
    metadata?: { skill?: string; title?: string; activityType?: string }
  ) =>
    (
      await apiRequest<any>(
        `/recommendations/pathway/action/${encodeURIComponent(actionId)}/complete`,
        {
          method: "POST",
          body: metadata || {},
        }
      )
    ).data,

  updateRoadmapMilestoneStatus: async (
    recommendationId: string,
    status: "completed" | "pending" | "in_progress",
    metadata?: { skill?: string; canonicalName?: string; title?: string }
  ) =>
    (
      await apiRequest<{
        recommendationId: string;
        status: string;
        isCompleted: boolean;
        updatedAt: string;
      }>(`/recommendations/item/${encodeURIComponent(recommendationId)}`, {
        method: "PATCH",
        body: { status, ...metadata },
      })
    ).data,

  toggleDailyMission: async (
    id: string,
    metadata?: { title?: string; targetSkill?: string; completed?: boolean }
  ) =>
    (
      await apiRequest<{
        missionId: string;
        completed: boolean;
        updatedAt: string;
      }>(`/dashboard/missions/${encodeURIComponent(id)}/toggle`, {
        method: "POST",
        body: metadata,
      })
    ).data,

  // Coding
  getCodingTasks: async (language: string = "javascript") =>
    (await apiRequest<{ tasks: CodingTaskSummary[] }>(`/coding/tasks?language=${encodeURIComponent(language)}`)).data.tasks,

  getTaskDetail: async (taskId: string, language: string = "javascript") =>
    (await apiRequest<{ task: CodingTaskDetail }>(`/coding/tasks/${encodeURIComponent(taskId)}?language=${encodeURIComponent(language)}`)).data.task,

  runCode: async (code: string, taskId?: string, language: string = "javascript") =>
    (await apiRequest<CodingExecutionResult>("/coding/run", {
      method: "POST",
      body: { code, taskId, language },
    })).data,

  submitSolution: async (taskId: string, code: string, language: string = "javascript") =>
    (await apiRequest<CodingExecutionResult>("/coding/submit", {
      method: "POST",
      body: { taskId, code, language },
    })).data,

  getCodingSubmissions: async () =>
    (await apiRequest<{ submissions: any[] }>("/coding/submissions")).data.submissions,

  getSandboxStatus: async () =>
    (await apiRequest<{
      dockerAvailable: boolean;
      reason: string | null;
      executionLimits: any;
      isolation: any;
      supportedLanguages: string[];
    }>("/coding/sandbox/status")).data,

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

  // Dashboard Intelligence & Adaptive Skill Loop
  getDashboardIntelligence: async () =>
    (await apiRequest<DashboardIntelligenceData>("/dashboard/intelligence")).data,

  getUnifiedWorkspace: async () =>
    (await apiRequest<UnifiedWorkspaceData>("/dashboard/unified-workspace")).data,

  getAdaptiveLoop: async () =>
    (await apiRequest<any>("/skills/adaptive/loop")).data,

  recordAdaptiveAssessment: async (payload: {
    skill: string;
    taskId?: string;
    score: number;
    maxScore?: number;
    testCasesPassed?: number;
    testCasesTotal?: number;
    assessmentType?: string;
  }) =>
    (await apiRequest<any>("/skills/adaptive/assess", {
      method: "POST",
      body: payload,
    })).data,

  getAdaptiveLearningPlan: async (role?: string) =>
    (await apiRequest<AdaptiveLearningPlanData>(`/skills/learning-loop/plan${role ? `?role=${encodeURIComponent(role)}` : ""}`)).data,

  recordLearningActivity: async (payload: {
    activityType: string;
    skill: string;
    targetRole?: string;
    entityId?: string;
    title?: string;
    status?: string;
    evidence?: any;
    idempotencyKey?: string;
  }) =>
    (await apiRequest<any>("/skills/learning-loop/activity", {
      method: "POST",
      body: payload,
    })).data,

  getLearnerActivities: async (params?: { limit?: number; skip?: number; activityType?: string; skill?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.skip) searchParams.set("skip", String(params.skip));
    if (params?.activityType) searchParams.set("activityType", params.activityType);
    if (params?.skill) searchParams.set("skill", params.skill);
    const qs = searchParams.toString();
    return (await apiRequest<any>(`/skills/learning-loop/activities${qs ? `?${qs}` : ""}`)).data;
  },

  compareMultiRolePlans: async (roles?: string[]) => {
    const qs = roles && roles.length > 0 ? `?roles=${encodeURIComponent(roles.join(","))}` : "";
    return (await apiRequest<any>(`/skills/learning-loop/compare${qs}`)).data;
  },

  logRecommendationImpressions: async (impressions: any[]) =>
    (await apiRequest<{ count: number }>("/edutube/recommendations/impression", {
      method: "POST",
      body: { impressions },
    })).data,

  evaluateAdaptiveLoop: async (targetRole?: string) =>
    (
      await apiRequest<{
        evaluatedAt: string;
        targetRole: string;
        overallReadinessScore: number;
        focalSkill: string;
        loopState: any;
        recommendations: any[];
        telemetry: AdaptiveTelemetryData;
        evaluationWarning?: string | null;
      }>("/adaptive-loop/evaluate", {
        method: "POST",
        body: { targetRole },
      })
    ).data,

  getAdaptiveTelemetry: async (role?: string) =>
    (
      await apiRequest<AdaptiveTelemetryData>(
        `/adaptive-loop/telemetry${role ? `?role=${encodeURIComponent(role)}` : ""}`
      )
    ).data,

  // Spaced Revision (Phase 39)
  getDueRevisions: async (limit: number = 20) =>
    (await apiRequest<{ items: SpacedRevisionItem[]; count: number }>(`/skills/spaced-revision/due?limit=${limit}`)).data.items,

  getUpcomingRevisions: async (limit: number = 20) =>
    (await apiRequest<{ items: SpacedRevisionItem[]; count: number }>(`/skills/spaced-revision/upcoming?limit=${limit}`)).data.items,

  getRevisionQueue: async (limit: number = 10) =>
    (await apiRequest<{
      due: SpacedRevisionItem[];
      upcoming: SpacedRevisionItem[];
      stats: {
        dueTodayCount: number;
        upcomingCount: number;
        needsReinforcementCount: number;
        totalScheduled: number;
      };
    }>(`/skills/spaced-revision/queue?limit=${limit}`)).data,

  reviewRevisionAttempt: async (scheduleId: string, payload: { score: number; idempotencyKey?: string; answerGiven?: string }) =>
    (await apiRequest<{
      isDuplicate: boolean;
      schedule: SpacedRevisionItem;
      passed: boolean;
      score: number;
      previousIntervalDays: number;
      newIntervalDays: number;
      nextDueDate: string;
      status: string;
      rationale: string;
    }>(`/skills/spaced-revision/${encodeURIComponent(scheduleId)}/review`, {
      method: "POST",
      body: payload,
    })).data,

  createRevisionTarget: async (payload: {
    skill: string;
    targetId?: string;
    targetConcept?: string;
    resourceId?: string;
    resourceType?: string;
    quizId?: string;
    promptQuestion?: string;
    recommendedExerciseId?: string;
    isPassed?: boolean;
    lastScore?: number;
  }) =>
    (await apiRequest<{ schedule: SpacedRevisionItem }>("/skills/spaced-revision/target", {
      method: "POST",
      body: payload,
    })).data,

  // Video Checkpoints & Quizzes (Phase 39)
  getVideoCheckpoints: async (videoId: string) =>
    (await apiRequest<{ checkpoints: VideoCheckpoint[]; count: number }>(`/edutube/video/${encodeURIComponent(videoId)}/checkpoints`)).data.checkpoints,

  submitVideoCheckpoint: async (videoId: string, checkpointId: string, payload: { selectedOptionIndex: number; idempotencyKey?: string }) =>
    (await apiRequest<CheckpointSubmissionResult>(`/edutube/video/${encodeURIComponent(videoId)}/checkpoints/${encodeURIComponent(checkpointId)}/submit`, {
      method: "POST",
      body: payload,
    })).data,

  // Competency Matrix & Verifiable Badges (Phase 40)
  getCompetencyMatrix: async () =>
    (await apiRequest<{ matrix: CompetencyMatrixItem[]; summary: CompetencyMatrixSummary }>("/skills/competencies/matrix")).data,

  getCompetencyEvidence: async (id: string) =>
    (await apiRequest<CompetencyMatrixItem>(`/skills/competencies/${encodeURIComponent(id)}/evidence`)).data,

  getCompetencyTaxonomy: async () =>
    (await apiRequest<{ taxonomy: any[] }>("/skills/competencies/taxonomy")).data.taxonomy,

  getMyBadges: async () =>
    (await apiRequest<{ badges: CompetencyBadgeItem[] }>("/skills/badges/my")).data.badges,

  claimCompetencyBadge: async (payload: { competencyId: string; badgeType: string; recipientIdentifier?: string }) =>
    (await apiRequest<{ badge: CompetencyBadgeItem; isNewlyIssued: boolean }>("/skills/badges/claim", {
      method: "POST",
      body: payload,
    })).data,

  revokeBadge: async (badgeId: string, reason?: string) =>
    (await apiRequest<{ badge: CompetencyBadgeItem }>(`/skills/badges/${encodeURIComponent(badgeId)}/revoke`, {
      method: "POST",
      body: { reason },
    })).data,

  verifyPublicBadge: async (badgeId: string) =>
    (await apiRequest<PublicBadgeVerification>(`/badges/verify/${encodeURIComponent(badgeId)}`)).data,
};

export interface AdaptivePlanAction {
  actionId: string;
  skill: string;
  canonicalName: string;
  category: string;
  targetRole: string;
  actionType: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  evidenceState: string;
  currentScore: number;
  targetScore: number;
  isDemonstratedCompetency: boolean;
  prerequisites?: any[];
  missingPrerequisites?: string[];
  hasPrerequisitesMet?: boolean;
  failureCount?: number;
  reasoning: string;
  practicalAction: string;
  completionCriteria: string;
  codingTask?: {
    taskId: string;
    taskTitle: string;
    category?: string;
    language?: string;
  } | null;
  educationalResource?: {
    title: string;
    youtubeUrl: string | null;
    edutubeUrl: string;
    type: string;
    duration?: string;
  };
  documentationUrl?: string;
  estimatedMinutes?: number;
}

export interface AdaptiveLearningPlanData {
  targetRole: string;
  overallReadinessScore: number;
  currentObjective: string;
  nextAction: AdaptivePlanAction | null;
  actionsCount: number;
  pendingActionsCount: number;
  verifiedCompetenciesCount: number;
  actions: AdaptivePlanAction[];
  generatedAt: string;
}

export interface DashboardIntelligenceData {
  overview: {
    targetRole: string;
    empiricalMastery: {
      score: number | null;
      isEmpirical: boolean;
      testedSkillsCount: number;
      calculation: string;
    };
    readinessEstimate: {
      score: number;
      isEstimate: boolean;
      totalSkillsEvaluated: number;
      calculation: string;
    };
    studyTimeThisWeek: {
      hours: number;
      minutes: number;
      calculation: string;
    };
    consistencyStreakDays: number;
    careerGoalProgress: {
      targetRole: string;
      progressPercent: number;
      metSkillsCount: number;
      totalRequiredSkillsCount: number;
    };
    competencyBadges?: {
      count: number;
      badges: Array<{ id: string; name: string; issuedAt: string }>;
    };
    academic?: {
      branchSlug?: string;
      branchName?: string;
      degreeSlug?: string;
      degreeName?: string;
      isConfigured?: boolean;
    };
  };
  learningConsistency: {
    streakDays: number;
    weeklyStudyHours: number;
    dailyTrends: Array<{
      day: string;
      date: string;
      videosCompleted: number;
      codingSolved: number;
    }>;
  };
  skillVisualization: {
    total: number;
    strongSkills: Array<{ name: string; score: number; level: string; sources?: string[] }>;
    improvingSkills: Array<{ name: string; score: number; level: string; sources?: string[] }>;
    weakSkills: Array<{ name: string; score: number; level: string; sources?: string[] }>;
    prerequisiteGaps: Array<{
      skill: string;
      priority: string;
      currentScore: number;
      targetScore: number;
      reason: string;
      blocksTechnologies: string[];
      isPrerequisiteBlocker: boolean;
    }>;
  };
  recentAssessments: Array<{
    skill: string;
    score: number;
    previousScore: number;
    scoreDelta: number;
    assessmentType: string;
    taskId?: string;
    testCasesPassed?: number;
    testCasesTotal?: number;
    date: string;
  }>;
  dailyLearningPlan: Array<{
    id: string;
    type: string;
    title: string;
    targetSkill: string;
    estimatedMinutes: number;
    completed: boolean;
    actionUrl: string;
    explanation: string;
  }>;
  nextRecommendedAction: {
    title: string;
    targetSkill: string;
    estimatedMinutes: number;
    actionUrl: string;
    reasoning: string;
  };
  topEduTubeRecommendations: Array<{
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    verifiedDurationSeconds: number;
    durationFormatted: string;
    educationalScore: number;
    whyRecommended: string[];
    qualityGatePassed: boolean;
  }>;
  roadmapSummary: {
    totalItems: number;
    completedItems: number;
  };
  telemetry?: AdaptiveTelemetryData;
  unifiedWorkspace?: UnifiedWorkspaceData;
  generatedAt: string;
}

export interface UnifiedWorkspaceData {
  questionsAnswered: {
    targetObjective: string;
    evidenceSummary: string;
    remainingGaps: string;
    nextLearningAction: string;
    careerPathwayAlignment: string;
  };
  studentProfile: {
    studentId: string;
    displayName: string;
    canonicalDiscipline: string;
    branchName: string;
    degreeName: string;
    semester: number | null;
  };
  learningOverview: {
    academicDiscipline: string;
    targetCareerRole: string;
    activeLearningStage: string;
    overallReadinessScore: number;
    studyStreakDays: number;
    weeklyStudyHours: number;
  };
  careerReadiness: {
    roleId: string;
    roleTitle: string;
    roleFamily: string;
    disciplineCategory: string;
    heuristicReadinessIndex: number;
    readinessBand: string;
    evidenceCoveragePercent: number;
    counts: {
      demonstrated: number;
      unassessed: number;
      gaps: number;
      totalRequired: number;
    };
    skillsBreakdown: {
      demonstrated: Array<{ skill: string; currentLevel: string; demonstratedScore: number; supportingEvidenceSources: string[] }>;
      unassessed: Array<{ skill: string; requiredLevel: string }>;
      gaps: Array<{ skill: string; latestScore: number; targetScore: number; gapDelta: number }>;
    };
    unassessableCompetencies: string[];
    regulatoryNotes?: string;
    disclaimer: string;
  };
  evidenceLedger: {
    summary: {
      totalRecords: number;
      verifiedCount: number;
      rubricScoredCount: number;
      formativePracticeCount: number;
      selfReportedCount: number;
      inferredCount: number;
    };
    records: Array<{
      sourceModule: string;
      sourceRecordId: string;
      canonicalSkill: string;
      academicDiscipline: string;
      evidenceType: string;
      score: number;
      verificationStatus: string;
      provenance: string;
      freshness: { ageInDays: number; isFresh: boolean; isStale: boolean };
    }>;
  };
  skillGapAnalysis: {
    totalDiagnosed: number;
    priorityGapsCount: number;
    masteredSkillsCount: number;
    unassessedCount: number;
    priorityGaps: Array<{ skill: string; currentStatus: string; latestScore: number; missingPrerequisites?: string[] }>;
    masteredSkills: Array<{ skill: string; latestScore: number }>;
    unassessedSkills: Array<{ skill: string }>;
  };
  nextBestAction: {
    primaryAction: {
      actionId: string;
      skill: string;
      actionType: string;
      title: string;
      whyRecommended: string;
      supportingEvidence: any;
      intendedOutcome: string;
      destination: string;
      actionLabel: string;
      category: string;
      priority: string;
      estimatedMinutes: number;
      isCompleted: boolean;
    } | null;
    secondaryActions: Array<{
      actionId: string;
      skill: string;
      actionType: string;
      title: string;
      whyRecommended: string;
      destination: string;
      actionLabel: string;
      category: string;
      priority: string;
      estimatedMinutes: number;
      isCompleted: boolean;
    }>;
  };
  activeProjects: Array<{
    projectId: string;
    templateId: string;
    title: string;
    disciplineCategory: string;
    status: string;
    progressPercentage: number;
    completedMilestones: number;
    totalMilestones: number;
    deliverablesCount: number;
    overallScore: number | null;
  }>;
  portfolioArtifacts: Array<{
    artifactId: string;
    sourceModule: string;
    title: string;
    discipline: string;
    artifactType: string;
    createdAt: string;
    isShared: boolean;
  }>;
  recentActivity: Array<{
    activityId: string;
    sourceModule: string;
    title: string;
    discipline: string;
    outcomeSummary: string;
    timestamp: string;
    route: string;
  }>;
}

export interface AdaptiveTelemetryData {
  milestonesCompleted: number;
  milestonesTotal: number;
  dailyMissionsCompleted: number;
  dailyMissionsTotal: number;
  codingChallengesAttempted: number;
  codingChallengesSolved: number;
  recentSkillImprovements: number;
  persistentSkillGapsCount: number;
  overallReadinessScore: number;
  revisionsDueToday?: number;
  upcomingRevisionsCount?: number;
  revisionsNeedingReinforcement?: number;
  quizCheckpointsAttempted?: number;
  quizCheckpointsPassed?: number;
  quizPassRate?: number;
  competencyBadgesCount?: number;
  demonstratedCompetenciesCount?: number;
  isPersonalized: boolean;
  recommendationSource: string;
  evaluatedAt: string;
}

export interface SpacedRevisionItem {
  _id: string;
  skill: string;
  canonicalName: string;
  targetId?: string;
  targetConcept?: string;
  resourceId?: string;
  resourceType?: "edutube" | "coding_task" | "roadmap_milestone" | "quiz_checkpoint" | "concept_review";
  stage: number;
  intervalDays: number;
  scheduledDate: string;
  status: "pending" | "completed" | "skipped" | "overdue" | "in_progress" | "needs_reinforcement";
  lastScore: number;
  attemptsCount: number;
  consecutiveSuccesses: number;
  promptQuestion?: string;
  recommendedExerciseId?: string;
  isDue?: boolean;
  isOverdue?: boolean;
  computedStatus?: string;
}

export interface VideoCheckpoint {
  checkpointId: string;
  videoId: string;
  timestampSeconds: number;
  question: string;
  options: string[];
  conceptKey?: string;
  skill: string;
  canonicalName: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  explanation?: string;
  hasAttempted?: boolean;
  isPassed?: boolean;
  lastScore?: number | null;
}

export interface CheckpointSubmissionResult {
  isDuplicate: boolean;
  isCorrect: boolean;
  score: number;
  correctOptionIndex: number;
  explanation: string;
  conceptKey?: string;
  skill: string;
  nextScheduledReview?: string | null;
  reviewStatus?: string;
}

export interface InAppNotification {
  _id: string;
  owner: string;
  type: "learning_milestone" | "skill_gap" | "roadmap" | "reminder" | "system";
  title: string;
  message: string;
  destination?: string;
  isRead: boolean;
  readAt?: string | null;
  eventId?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  notifications: InAppNotification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export const NotificationsApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.unreadOnly) query.set("unreadOnly", "true");
    const qs = query.toString();
    const res = await apiRequest<NotificationsListResponse>(`/notifications${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiRequest<{ unreadCount: number }>("/notifications/unread-count");
    return res.data?.unreadCount ?? 0;
  },

  markAsRead: async (id: string): Promise<InAppNotification> => {
    const res = await apiRequest<{ notification: InAppNotification }>(
      `/notifications/${encodeURIComponent(id)}/read`,
      { method: "PATCH" }
    );
    return res.data.notification;
  },

  markAllAsRead: async (): Promise<number> => {
    const res = await apiRequest<{ modifiedCount: number }>("/notifications/mark-all-read", {
      method: "PATCH",
    });
    return res.data?.modifiedCount ?? 0;
  },
};

export interface AdminUserItem {
  _id: string;
  displayName?: string;
  email: string;
  role: "student" | "admin";
  emailVerified: boolean;
  photoURL?: string;
  headline?: string;
  academic?: {
    degreeSlug?: string;
    degreeName?: string;
    branchSlug?: string;
    branchName?: string;
    specializationSlug?: string;
    specializationName?: string;
    currentSemester?: number;
    institution?: string;
    graduationYear?: number;
  };
  targetRole?: string;
  targetRoles?: string[];
  onboardingCompletedAt?: string | null;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminUsersListResponse {
  users: AdminUserItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

export interface AdminUserDetailsResponse {
  user: AdminUserItem & Record<string, any>;
  stats: {
    projectsCount: number;
    submissionsCount: number;
    skillsEvaluated: number;
    readinessScore: number | null;
    empiricalMastery: number | null;
  };
}

export interface CatalogIntegrityReport {
  status: "healthy" | "attention_needed";
  issuesCount: number;
  totals: {
    degreesCount: number;
    branchesCount: number;
    careerRolesCount: number;
    mappingsCount: number;
    validatedBenchmarksCount: number;
    pendingBenchmarksCount: number;
  };
  orphanDegreeReferences: Array<{
    branchSlug: string;
    branchName: string;
    invalidDegreeSlugs: string[];
  }>;
  invalidMappings: Array<{
    mappingId: string;
    branchSlug: string;
    roleSlug: string;
    branchExists: boolean;
    roleExists: boolean;
  }>;
  unmappedRoles: Array<{
    slug: string;
    title: string;
    category?: string;
  }>;
  pendingBenchmarkRoles: Array<{
    slug: string;
    title: string;
    category?: string;
    coreSkillsCount: number;
  }>;
}

export const AdminApi = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    branch?: string;
    semester?: number;
    status?: string;
  }): Promise<AdminUsersListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.role) query.set("role", params.role);
    if (params?.branch) query.set("branch", params.branch);
    if (params?.semester) query.set("semester", String(params.semester));
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    const res = await apiRequest<AdminUsersListResponse>(`/admin/users${qs ? `?${qs}` : ""}`);
    return res.data;
  },

  getUserDetails: async (userId: string): Promise<AdminUserDetailsResponse> => {
    const res = await apiRequest<AdminUserDetailsResponse>(`/admin/users/${encodeURIComponent(userId)}`);
    return res.data;
  },

  updateUserRole: async (userId: string, role: "student" | "admin"): Promise<{ _id: string; role: string }> => {
    const res = await apiRequest<{ _id: string; role: string }>(
      `/admin/users/${encodeURIComponent(userId)}/role`,
      {
        method: "PATCH",
        body: { role },
      }
    );
    return res.data;
  },

  updateUserStatus: async (
    userId: string,
    patch: { emailVerified?: boolean; onboardingCompleted?: boolean }
  ): Promise<any> => {
    const res = await apiRequest(
      `/admin/users/${encodeURIComponent(userId)}/status`,
      {
        method: "PATCH",
        body: patch,
      }
    );
    return res.data;
  },

  getCatalogIntegrity: async (): Promise<CatalogIntegrityReport> => {
    const res = await apiRequest<CatalogIntegrityReport>("/admin/catalog/integrity");
    return res.data;
  },

  safeDeleteDegree: async (slug: string): Promise<{ success: boolean; action: string; message: string }> => {
    const res = await apiRequest<{ success: boolean; action: string; message: string }>(
      `/admin/catalog/degrees/${encodeURIComponent(slug)}`,
      { method: "DELETE" }
    );
    return res.data;
  },

  safeDeleteBranch: async (slug: string): Promise<{ success: boolean; action: string; message: string }> => {
    const res = await apiRequest<{ success: boolean; action: string; message: string }>(
      `/admin/catalog/branches/${encodeURIComponent(slug)}`,
      { method: "DELETE" }
    );
    return res.data;
  },

  safeDeleteCareerRole: async (slug: string): Promise<{ success: boolean; action: string; message: string }> => {
    const res = await apiRequest<{ success: boolean; action: string; message: string }>(
      `/admin/catalog/career-roles/${encodeURIComponent(slug)}`,
      { method: "DELETE" }
    );
    return res.data;
  },
};


