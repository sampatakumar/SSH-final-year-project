export type LabType =
  | "numerical_calculation"
  | "scenario_decision"
  | "structured_reasoning"
  | "data_interpretation";

export type LabDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface LabTaskOption {
  optionId: string;
  label: string;
  description?: string;
}

export interface PracticalLabTask {
  taskId: string;
  prompt: string;
  type: "numerical" | "multiple_choice" | "structured_reasoning" | "tradeoff_analysis";
  unit?: string;
  roundingDecimals?: number;
  points: number;
  options?: LabTaskOption[];
  explanation?: string;
  remediationGuidance?: string;
}

export interface LabScenario {
  context: string;
  assumptions?: string;
  parameters?: Record<string, string | number>;
}

export interface PracticalLab {
  labId: string;
  title: string;
  description: string;
  disciplineCategory: string;
  canonicalDisciplines?: string[];
  branchSlugs?: string[];
  relevantSkills: string[];
  learningObjectives: string[];
  difficulty: LabDifficulty;
  estimatedMinutes: number;
  labType: LabType;
  scenario: LabScenario;
  tasks: PracticalLabTask[];
  disclaimer: string;
  passingCriteria?: {
    minScore: number;
    passingPercentage: number;
  };
  recommendedAssessmentIds?: string[];
  recommendedProjectIds?: string[];
  version: number;
  status: "published" | "draft" | "deprecated";
}

export interface TaskResult {
  taskId: string;
  prompt?: string;
  type?: string;
  submittedValue: any;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  acceptedAnswer?: any;
  unit?: string;
  toleranceUsed?: number;
  solutionExplanation?: string;
  explanation?: string;
  feedback?: string;
  remediationGuidance?: string;
}

export interface NextActionRecommendation {
  type?: string;
  actionType: string;
  title: string;
  destination: string;
  description: string;
}

export interface PracticalLabAttempt {
  _id: string;
  owner: string;
  labId: string;
  labVersion: number;
  title: string;
  disciplineCategory: string;
  branchSlugs?: string[];
  canonicalDisciplines?: string[];
  labType: LabType;
  serverScore: number;
  maxScore: number;
  percentage: number;
  isPassing: boolean;
  masteryLevel: "Mastered" | "Competent" | "Needs Remediation";
  evaluationFeedback?: {
    summary?: string;
    passingThreshold?: number;
  } | string;
  taskResults: TaskResult[];
  skillsEvaluated: string[];
  learningObjectivesEvaluated: string[];
  nextActionRecommendations: NextActionRecommendation[];
  status: "submitted" | "in_progress" | "abandoned";
  startedAt?: string;
  submittedAt?: string;
  durationMinutes?: number;
  createdAt?: string;
}

export interface PracticalLabFilters {
  branch?: string;
  difficulty?: string;
  search?: string;
  labType?: string;
}

export interface LabSubmissionPayload {
  submittedAnswers: Record<string, any> | Array<{ taskId: string; value: any }>;
  startedAt?: string;
}
