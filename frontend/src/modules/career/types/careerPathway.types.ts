/**
 * Frontend Types for Multi-Branch Career Pathway Studio (Phase 49)
 */

export interface CareerRoleCoreSkill {
  skill: string;
  importance: "critical" | "high" | "medium";
  minProficiency: string;
  targetScore: number;
}

export interface CareerRoleRecommendedSkill {
  skill: string;
  importance: "medium" | "low";
}

export interface LinkedPlatformActivity {
  labId?: string;
  assessmentId?: string;
  templateId?: string;
  title: string;
  difficulty?: string;
  estimatedMinutes?: number;
  estimatedHours?: number;
  relevantSkills?: string[];
  route: string;
}

export interface CareerRole {
  roleId: string;
  title: string;
  roleFamily: string;
  disciplineCategory: string;
  branchSlugs: string[];
  crossDisciplinaryAccessible: boolean;
  transferableSkills: string[];
  mobilityRationale: string;
  description: string;
  experienceLevel: string;
  coreSkills: CareerRoleCoreSkill[];
  recommendedSkills: CareerRoleRecommendedSkill[];
  prerequisiteCompetencies: string[];
  relevantEvidenceTypes: string[];
  portfolioExpectations: string[];
  unassessableCompetencies: string[];
  regulatoryNotes: string | null;
  relevance?: {
    type: "primary" | "cross_disciplinary" | "alternative" | "general";
    score: number;
    rationale: string;
  };
  linkedActivities?: {
    labs: LinkedPlatformActivity[];
    assessments: LinkedPlatformActivity[];
    projects: LinkedPlatformActivity[];
  };
}

export interface DemonstratedSkillEvidence {
  skill: string;
  score: number;
  targetScore: number;
  importance: string;
  sourceType: string;
  confidenceWeight: number;
  timestamp: string;
}

export interface PartialSkillEvidence {
  skill: string;
  score: number;
  targetScore: number;
  importance: string;
  sourceType: string;
  confidenceWeight: number;
  timestamp: string;
}

export interface UnassessedSkill {
  skill: string;
  importance: string;
  targetScore: number;
  status: "unassessed";
  prerequisitesMet: boolean;
}

export interface GapSkillEvidence {
  skill: string;
  score: number;
  targetScore: number;
  importance: string;
  sourceType: string;
  confidenceWeight: number;
  timestamp: string;
}

export interface StaleEvidenceRecord {
  skill: string;
  lastVerifiedDate: string;
  daysSinceVerification: number;
  score: number;
}

export interface ConflictingEvidenceRecord {
  skill: string;
  highestScore: number;
  latestScore: number;
  discrepancyDelta: number;
  latestSource: string;
}

export interface MissingPrerequisiteRecord {
  targetSkill: string;
  missing: string[];
}

export interface RoleReadinessDiagnosis {
  roleId: string;
  roleTitle: string;
  roleFamily: string;
  disciplineCategory: string;
  heuristicReadinessIndex: number;
  readinessBand: "Strong Alignment" | "Substantially Evidenced" | "Developing Competency" | "Early Preparation" | "Unassessed";
  evidenceCoveragePercent: number;
  counts: {
    totalCoreSkills: number;
    demonstrated: number;
    partial: number;
    unassessed: number;
    gaps: number;
    stale: number;
  };
  skillsBreakdown: {
    demonstrated: DemonstratedSkillEvidence[];
    partial: PartialSkillEvidence[];
    unassessed: UnassessedSkill[];
    gaps: GapSkillEvidence[];
  };
  evidenceQualityNotes: {
    staleEvidence: StaleEvidenceRecord[];
    conflictingEvidence: ConflictingEvidenceRecord[];
    missingPrerequisites: MissingPrerequisiteRecord[];
  };
  unassessableCompetencies: string[];
  regulatoryNotes: string | null;
  disclaimer: string;
}

export interface RoleComparisonResult {
  role1: {
    roleId: string;
    title: string;
    roleFamily: string;
    disciplineCategory: string;
    readinessIndex: number;
    readinessBand: string;
    evidenceCoveragePercent: number;
    uniqueSkills: string[];
    regulatoryNotes: string | null;
  };
  role2: {
    roleId: string;
    title: string;
    roleFamily: string;
    disciplineCategory: string;
    readinessIndex: number;
    readinessBand: string;
    evidenceCoveragePercent: number;
    uniqueSkills: string[];
    regulatoryNotes: string | null;
  };
  comparison: {
    sharedCoreSkills: string[];
    sharedDemonstratedSkills: string[];
    readinessDelta: number;
    higherReadinessRoleId: string;
    alignmentSummary: string;
  };
}

export interface PreparationPlanStep {
  stepNumber: number;
  priority: string;
  targetSkill: string;
  evidenceGapType: "prerequisite_missing" | "skill_gap" | "missing_evidence" | "stale_evidence";
  title: string;
  rationale: string;
  activityType: "practical_lab" | "assessment" | "project_studio" | "spaced_revision" | "learning_module" | "edutube_video";
  activityId: string;
  activityTitle: string;
  destinationRoute: string;
  prerequisiteRequirement: string | null;
  expectedOutcome: string;
}

export interface PreparationPlanResult {
  roleId: string;
  roleTitle: string;
  readinessBand: string;
  heuristicReadinessIndex: number;
  totalSteps: number;
  plan: PreparationPlanStep[];
  regulatoryNotes: string | null;
  disclaimer: string;
}
