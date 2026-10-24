export interface ToolInputParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
  unit?: string;
  placeholder?: string;
  options?: string[];
}

export interface CanonicalTool {
  toolId: string;
  displayName: string;
  shortDescription: string;
  academicDiscipline: string;
  disciplineCategory: string;
  branchSlugs: string[];
  category: string;
  intendedTask: string;
  executionMode: "deterministic" | "hybrid_ai_deterministic" | "ai";
  status: "operational" | "limited" | "config_required" | "planned";
  route: string;
  isExternalRoute: boolean;
  supportedInputs: ToolInputParam[];
  outputFormat: string;
  safetyDisclaimers: string | null;
  limitations: string[];
  version: string;
}

export interface ToolExecutionResult {
  toolId: string;
  displayName: string;
  version: string;
  academicDiscipline: string;
  executionMode: string;
  resultData: any;
  activityRecordId?: string | null;
  safetyDisclaimers?: string | null;
  limitations?: string[];
}

export interface ToolActivityRecord {
  _id: string;
  toolId: string;
  toolDisplayName: string;
  toolVersion: string;
  academicDiscipline: string;
  inputParameters: Record<string, any>;
  resultData: Record<string, any>;
  executionMode: string;
  status: "success" | "error" | "partial";
  isSavedToPortfolio: boolean;
  portfolioMetadata?: {
    headline: string;
    summary: string;
    tags: string[];
    savedAt?: string;
  };
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolCatalogResponse {
  tools: CanonicalTool[];
  total: number;
  studentBranch: string | null;
  availableCategories: string[];
  availableDisciplines: string[];
}

export interface EngineeringMissingInput {
  item: string;
  importance: "CRITICAL" | "RECOMMENDED" | "ADVISORY";
  explanation: string;
}

export interface LearningPathwayLink {
  id: string;
  title: string;
  type: "PRACTICAL_LAB" | "ASSESSMENT" | "PROJECT_STUDIO";
  route: string;
}

export interface EngineeringAiInterpretation {
  problemSummary: string;
  applicableTheory: string;
  assumptionsAndIdealizations: string[];
  limitationsAndCaveats: string[];
  missingInputsChecklist: EngineeringMissingInput[];
  troubleshootingAdvice?: string[] | null;
  learningPathwayLinks: LearningPathwayLink[];
  provenance: string;
  provider: string;
}

export interface VerifiedClaim {
  parameter?: string;
  claim?: string;
  value?: any;
  status: "VERIFIED_DETERMINISTIC" | "USER_PROVIDED" | "THEORETICAL_MODEL_ASSUMPTION" | "UNVERIFIED_ESTIMATE";
  provenance: string;
  verificationMethod: string;
}

export interface EngineeringVerificationResult {
  status: string;
  summary: string;
  verifiedClaimsCount: number;
  unverifiedClaimsCount: number;
  verifiedClaims: VerifiedClaim[];
  unverifiedClaims: VerifiedClaim[];
  isAuthoritativeMathGuaranteed: boolean;
}

export interface EngineeringReportDraft {
  reportId: string;
  title: string;
  discipline: string;
  toolId: string;
  toolDisplayName: string;
  objective: string;
  problemStatement: string;
  governingEquations: string;
  suppliedInputs: Record<string, any>;
  calculationSteps: string[];
  numericalResults: Record<string, any>;
  billOfQuantities?: any[] | null;
  engineeringDiscussion: string;
  applicableTheory: string;
  assumptions: string[];
  limitations: string[];
  missingInputsChecklist: EngineeringMissingInput[];
  troubleshootingAdvice?: string[] | null;
  verificationStatus: string;
  verificationSummary: string;
  verifiedClaims: VerifiedClaim[];
  unverifiedClaims: VerifiedClaim[];
  learningPathwayLinks: LearningPathwayLink[];
  safetyNotice: string;
  studentNotes?: string;
  authorName: string;
  generatedAt: string;
  lastEditedAt?: string | null;
  isStudentDraft: boolean;
}
