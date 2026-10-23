export interface MilestoneTemplate {
  milestoneId: string;
  title: string;
  description: string;
  order: number;
  required: boolean;
  suggestedDeliverables?: string[];
}

export interface DeliverableTemplate {
  key: string;
  label: string;
  type: "report" | "image" | "drawing" | "data" | "link" | "text" | "design_doc";
  description?: string;
  required: boolean;
  acceptedFileTypes?: string[];
}

export interface RubricDimension {
  dimensionKey: string;
  dimensionName: string;
  weight: number;
  maxScore: number;
  description?: string;
  criteria?: string[];
}

export interface ProjectTemplate {
  templateId: string;
  title: string;
  description: string;
  branchSlugs: string[];
  disciplineCategory: string;
  compatibleDegrees?: string[];
  relevantRoleSlugs?: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedEffort: string;
  prerequisites: string[];
  learningObjectives: string[];
  milestones: MilestoneTemplate[];
  deliverables: DeliverableTemplate[];
  rubric: RubricDimension[];
  relevantSkills: string[];
  version?: number;
  status: "draft" | "published" | "archived";
}

export interface MilestoneProgressItem {
  milestoneId: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  completed?: boolean;
  notes?: string;
  completedAt?: string;
}

export interface DeliverableSubmissionItem {
  key: string;
  deliverableId?: string;
  label: string;
  title?: string;
  type: string;
  content?: string;
  textContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileSizeKB?: number;
  mimeType?: string;
  externalUrl?: string;
  notes?: string;
  submittedAt?: string;
}

export interface RubricFeedbackItem {
  dimensionKey: string;
  dimensionName: string;
  score: number;
  maxScore: number;
  feedback: string;
  criteriaMet: boolean;
}

export interface ProjectEvaluationResult {
  status: string;
  score: number;
  maxScore: number;
  percentScore: number;
  overallScore?: number;
  passed: boolean;
  isPassing?: boolean;
  rubricFeedback: RubricFeedbackItem[];
  rubricBreakdown?: RubricFeedbackItem[];
  overallFeedback: string;
  feedbackSummary?: string;
  missingDeliverables?: string[];
  evaluatedAt: string;
  evaluator?: string;
  provenance?: string;
}

export interface StudentProject {
  _id: string;
  owner: string;
  templateId: string;
  title: string;
  description: string;
  branchSlug: string;
  roleSlug?: string;
  status: "available" | "in_progress" | "submitted" | "changes_requested" | "completed" | "archived";
  currentMilestoneIndex: number;
  progressPercentage?: number;
  milestoneProgress: MilestoneProgressItem[];
  deliverables: DeliverableSubmissionItem[];
  writtenExplanations: string;
  evaluation?: ProjectEvaluationResult;
  portfolioVisibility: boolean;
  syncedToResume: boolean;
  resumeProjectId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
