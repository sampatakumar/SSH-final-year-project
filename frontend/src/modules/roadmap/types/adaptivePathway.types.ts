export type CycleStage =
  | "ASSESS"
  | "DIAGNOSE"
  | "PLAN"
  | "LEARN_REMEDIATE"
  | "FOUNDATIONAL_PREREQUISITE"
  | "PRACTICE_APPLY"
  | "PLAN_PRACTICE"
  | "MEASURE_IMPROVEMENT";

export type DiagnosedStatus =
  | "demonstrated_mastery"
  | "competent"
  | "needs_remediation"
  | "prerequisite_missing"
  | "unassessed";

export type ActionType =
  | "review_objective"
  | "edutube_lesson"
  | "spaced_revision"
  | "practice_activity"
  | "reassessment"
  | "project_studio"
  | "prerequisite_remediation";

export interface LearningActionItem {
  actionId: string;
  skill: string;
  actionType: ActionType;
  title: string;
  whyRecommended: string;
  supportingEvidence: {
    sourceType: string;
    assessmentId?: string;
    previousScore?: number;
    areasForImprovement?: string[];
    [key: string]: any;
  };
  intendedOutcome: string;
  destination: string;
  actionLabel: string;
  category: "review" | "lesson" | "revision" | "practice" | "assessment" | "project";
  priority: "critical" | "high" | "medium" | "low";
  estimatedMinutes: number;
  isCompleted: boolean;
}

export interface DiagnosedSkillItem {
  skill: string;
  importance: string;
  roleWeight: number;
  targetScore: number;
  currentStatus: DiagnosedStatus;
  evidenceStatus: string;
  latestScore: number | null;
  previousScore: number | null;
  scoreDelta: number | null;
  hasEvidence: boolean;
  isPassing: boolean;
  daysSinceLastEvaluation: number | null;
  prerequisites: {
    hasPrerequisites: boolean;
    isReady: boolean;
    missingPrerequisites: string[];
    difficulty: string;
  };
  learningPriorityScore: number;
  recommendedActionCategory: string;
  actionRationale: string;
  latestEvidenceSource: string | null;
  assessmentId: string | null;
}

export interface ProgressionComparisonItem {
  skill: string;
  sourceType: string;
  initialScore: number;
  initialDate: string;
  latestScore: number;
  latestDate: string;
  scoreDelta: number;
  isImproved: boolean;
  interpretation: string;
  isComparable: boolean;
}

export interface MasteryProgressionReport {
  totalComparisons: number;
  positiveProgressionCount: number;
  averageScoreDelta: number;
  comparisons: ProgressionComparisonItem[];
  hasDemonstratedImprovement: boolean;
  evaluatedAt: string;
}

export interface AdaptivePathwayResponse {
  targetRole: string;
  userBranch: string;
  cycleStage: CycleStage;
  primaryNextStep: LearningActionItem | null;
  activeActionsCount: number;
  completedActionsCount: number;
  totalActionsCount: number;
  actions: LearningActionItem[];
  diagnosis: {
    totalDiagnosed: number;
    priorityGapsCount: number;
    masteredSkillsCount: number;
    unassessedCount: number;
    priorityGaps: DiagnosedSkillItem[];
    masteredSkills: DiagnosedSkillItem[];
    unassessedSkills: DiagnosedSkillItem[];
    allDiagnosed: DiagnosedSkillItem[];
  };
  masteryProgression: MasteryProgressionReport;
  generatedAt: string;
}
