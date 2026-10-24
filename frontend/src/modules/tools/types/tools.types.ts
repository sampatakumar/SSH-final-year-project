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
