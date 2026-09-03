export interface GitHubUserProfile {
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
}

export interface GitHubRepositoryItem {
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
  topics?: string[];
}

export interface LanguageStatItem {
  size: number;
  percentage: number;
  repoCount: number;
}

export interface AggregateGitHubStats {
  totalStars: number;
  totalForks: number;
  totalWatchers: number;
  totalIssues: number;
  totalSizeKB: number;
  archivedCount: number;
  forkedCount: number;
}

export interface EngineeringQualityData {
  overallScore: number;
  grade: string;
  dimensions: {
    documentation: number;
    testingAndCicd: number;
    architectureDiversity: number;
    repositoryHygiene: number;
  };
  observations: string[];
  strengths: string[];
  improvements: string[];
}

export interface ClassifiedProject {
  repoName: string;
  htmlUrl?: string;
  language: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  score: number;
  reasons: string[];
  isFork?: boolean;
  stars?: number;
}

export interface PortfolioComplexityData {
  summary: {
    beginnerCount: number;
    intermediateCount: number;
    advancedCount: number;
    advancedRatio: number;
    intermediateRatio: number;
    beginnerRatio: number;
  };
  topComplexProjects: ClassifiedProject[];
  classifiedProjects: ClassifiedProject[];
}

export interface GitHubAIInsights {
  summary: string;
  skillAssessment: string;
  strengths: string[];
  weaknesses: string[];
  portfolioImprovementTips: string[];
  readmeQualityTips: string[];
  recommendedTechnologies: string[];
  careerSuggestions: string[];
  githubOptimizationScore: number;
}

// Personal Career Mentor Data Types
export interface CareerHero {
  targetRole: string;
  currentStage: string;
  strongestArea: string;
  biggestGap: string;
  nextPriority: string;
}

export interface CareerReadinessDimension {
  dimension: string;
  status: "Strong" | "Developing" | "Limited Evidence" | "Needs Attention";
  score: number;
  evidence: string;
}

export interface ActionPlanItem {
  order: string;
  title: string;
  priority: "Critical" | "High" | "Medium";
  requirements: string[];
  why: string;
  estimatedHours: number;
}

export interface GitHubImprovementPlan {
  profile: string[];
  repositories: string[];
  engineering: string[];
  activity: string[];
}

export interface RepoActionItem {
  repoName: string;
  htmlUrl: string;
  language: string;
  isFork: boolean;
  documentationStatus: string;
  testingStatus: string;
  cicdStatus: string;
  readmeStatus: string;
  architectureStatus: string;
  actionItems: string[];
  priority: string;
}

export interface ShowcaseProject {
  rank: number;
  repoName: string;
  language: string;
  stars: number;
  why: string;
  whatToImprove: string;
  portfolioValue: string;
}

export interface CareerPath {
  current: string;
  nextSkill: string;
  nextProject: string;
  nextEvidence: string;
  targetRole: string;
}

export interface WeeklyPlanItem {
  id: string;
  task: string;
  priority: "Critical" | "High" | "Medium";
  estimatedHours: number;
  reason: string;
  expectedEvidence: string;
  completed?: boolean;
}

export interface MilestonesPlan {
  days30: { phase: string; goals: string[] };
  days60: { phase: string; goals: string[] };
  days90: { phase: string; goals: string[] };
}

export interface RepositoryQualityScorecard {
  documentation: string;
  readme: string;
  description: string;
  screenshots: string;
  liveDemo: string;
  tests: string;
  cicd: string;
  license: string;
}

export interface RecruiterChecklistItem {
  question: string;
  pass: boolean;
  reason: string;
}

export interface RecruiterEvaluation {
  score: number;
  maxScore: number;
  checklist: RecruiterChecklistItem[];
}

export interface AuditedRepoQuality {
  repoName: string;
  htmlUrl: string;
  projectType: string;
  language: string;
  isFork: boolean;
  isArchived: boolean;
  stars: number;
  forks: number;
  sizeKB: number;
  scorecard: RepositoryQualityScorecard;
  recruiterEvaluation: RecruiterEvaluation;
  suggestedDescription: string;
  missingReadmeSections: { section: string; importance: string; recommended: boolean }[];
  highestImpactImprovements: string[];
  specificAdvice: { presentation: string; features: string[] };
}

export interface ProjectToImproveItem {
  rank: number;
  repoName: string;
  htmlUrl: string;
  projectType: string;
  language: string;
  currentQuality: string;
  recruiterScore: string;
  missingItems: string[];
  whyItMatters: string;
  recommendedChanges: string[];
  priority: string;
  careerValue: string;
  suggestedDescription: string;
  scorecard: RepositoryQualityScorecard;
}

export interface StartWithProjectRecommendation {
  repoName: string;
  htmlUrl: string;
  language: string;
  projectType: string;
  whyStartHere: string;
  top3Actions: string[];
}

export interface ProjectCoachData {
  classifiedTiers: {
    showcaseNow: AuditedRepoQuality[];
    improveNext: AuditedRepoQuality[];
    needsWork: AuditedRepoQuality[];
    archiveLowPriority: AuditedRepoQuality[];
  };
  top5ProjectsToImprove: ProjectToImproveItem[];
  startWithProject: StartWithProjectRecommendation | null;
  summaryStats: {
    totalAudited: number;
    missingDescriptions: number;
    missingDemos: number;
    missingTests: number;
  };
}

export interface PersonalCareerMentorData {
  targetRole: string;
  hero: CareerHero;
  readinessDimensions: CareerReadinessDimension[];
  nextActions: ActionPlanItem[];
  githubImprovementPlan: GitHubImprovementPlan;
  repositoryActionCenter: RepoActionItem[];
  topProjectsToShowcase: ShowcaseProject[];
  careerPath: CareerPath;
  weeklyPlan: WeeklyPlanItem[];
  milestones: MilestonesPlan;
  projectCoach?: ProjectCoachData;
  recommendations?: any[];
  generatedAt: string;
}

export interface MentorQnAResponse {
  question: string;
  currentSituation: string;
  evidence: string[];
  gap: string;
  recommendation: string;
  action: string[];
  expectedOutcome: string;
}

export interface GitHubAnalysisData {
  username: string;
  profile: GitHubUserProfile;
  repositories: GitHubRepositoryItem[];
  languages: Record<string, LanguageStatItem>;
  dominantLanguage: string;
  aggregateStats: AggregateGitHubStats;
  engineeringQuality?: EngineeringQualityData;
  projectComplexity?: PortfolioComplexityData;
  aiInsights?: GitHubAIInsights;
  careerMentor?: PersonalCareerMentorData;
  recentEvents?: any[];
  analyzedAt: string;
}
