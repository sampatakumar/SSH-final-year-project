export type MentorActionPriority = "critical" | "high" | "medium" | "low";

export type MentorActionCategory =
  | "github"
  | "skills"
  | "learning"
  | "resume"
  | "project"
  | "career"
  | "interview"
  | "edutube";

export interface MentorAction {
  title: string;
  priority: MentorActionPriority;
  category: MentorActionCategory;
  estimatedMinutes?: number;
  route?: string;
}

export interface MentorReference {
  title: string;
  type?: string;
  url?: string;
}

export interface MentorMessageItem {
  role: "user" | "assistant" | "system";
  content: string;
  source?: "user" | "groq" | "local_nlp" | "deterministic";
  confidence?: number;
  actions?: MentorAction[];
  references?: MentorReference[];
  createdAt?: string;
}

export interface MentorContextData {
  career: {
    name: string;
    targetRole: string;
    headline: string;
    readinessScore: number;
    education: string[];
    experienceYears: string;
  };
  skills: Array<{
    name: string;
    level: string;
    score: number;
    category: string;
  }>;
  skillGaps: Array<{
    skill: string;
    priority: string;
    currentScore: number;
    targetScore: number;
    reason: string;
  }>;
  roadmap: Array<{
    skill: string;
    title: string;
    type: string;
    description: string;
  }>;
  github: {
    username: string;
    hasAnalysis: boolean;
    repositoryCount: number;
    repositoriesWithoutDescription: number;
    repositoriesWithoutReadme: number;
    reposWithoutDescList: string[];
    reposWithoutReadmeList: string[];
    topLanguages: string[];
    totalStars: number;
    optimizationScore: number;
    strengths: string[];
    weaknesses: string[];
    readmeQualityTips: string[];
    portfolioTips: string[];
  };
  learning: {
    videosWatched: number;
    completedVideos: number;
    savedCount: number;
    playlistsCount: number;
    recentTopics: string[];
    continueLearningTitle: string | null;
  };
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    hasGithubUrl: boolean;
    hasDemoUrl: boolean;
  }>;
  resume: {
    resumeCount: number;
    hasSummary: boolean;
    hasExperience: boolean;
    hasEducation: boolean;
  };
  coding: {
    totalSubmissions: number;
    passedCount: number;
  };
  insights: string[];
  updatedAt: string;
}

export interface MentorChatResponse {
  message: string;
  summary: string;
  actions: MentorAction[];
  references: MentorReference[];
  confidence: number;
  source: "groq" | "local_nlp" | "deterministic";
  contextSnapshot?: {
    targetRole?: string;
    readinessScore?: number;
    skillGapsCount?: number;
    githubReposCount?: number;
  };
}
