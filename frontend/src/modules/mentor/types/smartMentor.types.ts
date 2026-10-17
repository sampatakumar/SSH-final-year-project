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
  courseRecommendations?: CourseRecommendationsPayload | null;
  learningPackage?: LearningPackageData | null;
  createdAt?: string;
}

export interface MentorAcademicContext {
  degreeName?: string;
  degreeSlug?: string;
  branchName?: string;
  branchSlug?: string;
  specializationName?: string;
  specializationSlug?: string;
  currentYear?: number | null;
  currentSemester?: number | null;
  institution?: string;
  academicScheme?: string;
  isConfigured: boolean;
}

export interface MentorContextData {
  career: {
    name: string;
    targetRole: string;
    targetRoles?: string[];
    careerInterests?: string[];
    academic?: MentorAcademicContext;
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
  adaptivePlan?: {
    currentObjective?: string;
    nextAction?: any;
    verifiedCompetenciesCount?: number;
    pendingActionsCount?: number;
  } | null;
  insights: string[];
  updatedAt: string;
}

export interface CourseRecommendationItem {
  id: string;
  title: string;
  channelTitle: string;
  instructor?: string;
  duration?: { formatted: string; seconds: number; isVerified?: boolean } | null;
  publishedAt?: string;
  courseType: "full_course" | "complete_playlist" | "focused_tutorial" | "project_course" | "dsa_course" | string;
  technology: string;
  level: string;
  topicsCovered: string[];
  limitations: string[];
  whyMatches: string;
  levelSuitability: string;
  youtubeUrl: string;
  edutubeUrl: string;
  isPlaylist?: boolean;
  engagement?: {
    source: string;
    publicStarRating?: string;
    ratingNote?: string;
    approxViews?: number;
  };
  ranking?: {
    totalScore: number;
    breakdown?: {
      technologyMatch: number;
      curriculumCompleteness: number;
      courseStructureLength: number;
      practicalProjects: number;
      levelSuitability: number;
    };
  };
}

export interface CourseComparisonData {
  recommendedStartingCourseId: string;
  startingRecommendationReason: string;
  courses: Array<{
    courseId: string;
    title: string;
    instructor: string;
    strength: string;
    bestFor: string;
    tradeOff: string;
    isStartingPick: boolean;
  }>;
}

export interface LearningPackageModule {
  order: number;
  title: string;
  recommendedCourse: {
    title: string;
    youtubeUrl: string;
    type: string;
  };
  coreConcepts: string[];
  handsOnExercises: string[];
  milestone: string;
  isSkippedBasedOnProfile?: boolean;
}

export interface LearningPackageData {
  title: string;
  technology: string;
  targetRole: string;
  prerequisites: string[];
  modules: LearningPackageModule[];
  projects: {
    miniProjects: Array<{
      title: string;
      description: string;
      keySkills: string[];
    }>;
    capstoneProject: {
      title: string;
      description: string;
      keySkills: string[];
      architectureTip?: string;
    };
  };
  codingChallenges: Array<{
    taskId: string;
    title: string;
    difficulty: string;
    category: string;
  }>;
  milestones: string[];
  revisionInterview: {
    keyQuestions: string[];
    dsaPracticeTopics: string[];
  };
  nextSteps: Array<{
    step: string;
    route: string;
    reason: string;
  }>;
  masteryNote: string;
}

export interface CourseRecommendationsPayload {
  intent: {
    technologyKey: string;
    technologyName: string;
    level: string;
    objective: string;
    preferredLanguage: string;
    targetRole: string;
    needsClarification?: boolean;
  };
  shortlist: CourseRecommendationItem[];
  recommendedStartingCourseId?: string;
  comparison?: CourseComparisonData | null;
  learningPackage?: LearningPackageData | null;
  cachedAt?: string;
}

export interface MentorChatResponse {
  message: string;
  summary: string;
  actions: MentorAction[];
  references: MentorReference[];
  confidence: number;
  source: "groq" | "local_nlp" | "deterministic";
  courseRecommendations?: CourseRecommendationsPayload | null;
  learningPackage?: LearningPackageData | null;
  contextSnapshot?: {
    targetRole?: string;
    readinessScore?: number;
    skillGapsCount?: number;
    githubReposCount?: number;
  };
}
