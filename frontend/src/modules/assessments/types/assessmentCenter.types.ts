export type QuestionType = "single_choice" | "multiple_select" | "numeric" | "case_study_response";

export interface QuestionOption {
  optionId: string;
  text: string;
}

export interface AssessmentQuestion {
  questionId: string;
  type: QuestionType;
  prompt: string;
  options?: QuestionOption[];
  points: number;
  topic: string;
  tolerance?: number;
  unit?: string;
  explanation?: string;
  remediationGuidance?: string;
  caseStudyContext?: string;
  rubricCriteria?: string[];
}

export interface BranchAssessment {
  assessmentId: string;
  title: string;
  description: string;
  branchSlugs: string[];
  disciplineCategory: string;
  compatibleDegrees?: string[];
  relevantRoleSlugs?: string[];
  relevantSkills: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedDuration: string;
  assessmentType: "objective_quiz" | "case_study" | "mixed";
  learningObjectives: string[];
  prerequisites: string[];
  passingCriteria: {
    minScore: number;
    passingPercentage: number;
  };
  recommendedProjectIds?: string[];
  questions: AssessmentQuestion[];
  version?: number;
  status: "published" | "draft" | "archived";
  explanationAndRemediation?: string;
}

export interface QuestionResult {
  questionId: string;
  type: QuestionType;
  prompt: string;
  submittedAnswer: any;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  explanation: string;
  remediationGuidance: string;
  topic: string;
}

export interface TopicPerformance {
  topic: string;
  questionsCount: number;
  correctCount: number;
  score: number;
  maxScore: number;
  percentage: number;
  masteryLevel: "Proficient" | "Competent" | "Needs Improvement";
}

export interface RecommendedNextStep {
  actionType: "review_topic" | "retry_assessment" | "start_project" | "explore_resources";
  title: string;
  description: string;
  linkUrl: string;
}

export interface AssessmentAttempt {
  _id: string;
  owner: string;
  assessmentId: string;
  version: number;
  status: "in_progress" | "submitted" | "abandoned";
  startedAt: string;
  submittedAt?: string;
  timeSpentSeconds: number;
  submittedAnswers: Record<string, any>;
  score?: number;
  maxScore?: number;
  percentage?: number;
  isPassing?: boolean;
  questionResults?: QuestionResult[];
  topicPerformance?: TopicPerformance[];
  strengths?: string[];
  areasForImprovement?: string[];
  recommendedNextSteps?: RecommendedNextStep[];
  scoringMethod?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecommendedAssessmentItem {
  reason: "retake_to_pass" | "project_prerequisite" | "branch_core";
  reasonLabel: string;
  assessment: BranchAssessment;
  priority: number;
  passed?: boolean;
}

export interface RecommendationsResponse {
  recommendations: RecommendedAssessmentItem[];
  branchSlug: string;
  targetRole?: string | null;
  totalAttempts: number;
}
