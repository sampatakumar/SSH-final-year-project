import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  CAREER_PATHWAY_CATALOG,
  CAREER_PATHWAY_MAP,
  CAREER_DISCIPLINE_FAMILIES,
} from "../src/modules/career/constants/careerPathwayCatalog.js";
import { careerPathwayService } from "../src/modules/career/services/careerPathway.service.js";
import { evidenceNormalizationService } from "../src/modules/skills/services/evidenceNormalization.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";

describe("Phase 49: Multi-Branch Career Pathway Studio Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. ROLE CATALOG VALIDATION & 10-DISCIPLINE FAMILY COVERAGE
  // =========================================================================
  describe("Group 1: Canonical Role Catalog & Multi-Branch Schema", () => {
    it("1.1 Catalog contains valid role definitions across all 10 academic discipline families", () => {
      expect(CAREER_PATHWAY_CATALOG.length).toBeGreaterThanOrEqual(16);

      const families = new Set(CAREER_PATHWAY_CATALOG.map((r) => r.roleFamily));
      expect(families.has("Software & Computing")).toBe(true);
      expect(families.has("Mechanical & Manufacturing")).toBe(true);
      expect(families.has("Electronics & Embedded")).toBe(true);
      expect(families.has("Civil & Infrastructure")).toBe(true);
      expect(families.has("Chemical & Process Engineering")).toBe(true);
      expect(families.has("Biotechnology & Life Sciences")).toBe(true);
      expect(families.has("Business & Management")).toBe(true);
      expect(families.has("Commerce & Financial Services")).toBe(true);
      expect(families.has("Arts, Media & Humanities")).toBe(true);
      expect(families.has("Nursing & Allied Health")).toBe(true);
    });

    it("1.2 Every catalog role adheres to the strict schema contract", () => {
      for (const role of CAREER_PATHWAY_CATALOG) {
        expect(role.roleId).toBeTypeOf("string");
        expect(role.title).toBeTypeOf("string");
        expect(role.roleFamily).toBeTypeOf("string");
        expect(role.disciplineCategory).toBeTypeOf("string");
        expect(Array.isArray(role.branchSlugs)).toBe(true);
        expect(role.branchSlugs.length).toBeGreaterThan(0);
        expect(typeof role.crossDisciplinaryAccessible).toBe("boolean");
        expect(Array.isArray(role.transferableSkills)).toBe(true);
        expect(role.description).toBeTypeOf("string");
        expect(Array.isArray(role.coreSkills)).toBe(true);
        expect(role.coreSkills.length).toBeGreaterThanOrEqual(3);

        for (const core of role.coreSkills) {
          expect(core.skill).toBeTypeOf("string");
          expect(["critical", "high", "medium"]).toContain(core.importance);
          expect(core.targetScore).toBeGreaterThanOrEqual(60);
        }

        expect(Array.isArray(role.prerequisiteCompetencies)).toBe(true);
        expect(Array.isArray(role.relevantEvidenceTypes)).toBe(true);
        expect(Array.isArray(role.suggestedLabIds)).toBe(true);
        expect(Array.isArray(role.suggestedAssessmentIds)).toBe(true);
        expect(Array.isArray(role.suggestedProjectIds)).toBe(true);
        expect(Array.isArray(role.portfolioExpectations)).toBe(true);
        expect(Array.isArray(role.unassessableCompetencies)).toBe(true);
        expect(role.catalogSource).toBe("SSH_CANONICAL_V1");
        expect(role.validationStatus).toBe("curated");
      }
    });

    it("1.3 Regulated professions include explicit statutory disclaimers", () => {
      const nurseRole = CAREER_PATHWAY_MAP.get("registered-nurse");
      expect(nurseRole).toBeDefined();
      expect(nurseRole.regulatoryNotes).toContain("CRITICAL STATUTORY NOTICE");
      expect(nurseRole.regulatoryNotes).toContain("does NOT confer clinical authorization");

      const structuralRole = CAREER_PATHWAY_MAP.get("structural-design-engineer");
      expect(structuralRole).toBeDefined();
      expect(structuralRole.regulatoryNotes).toContain("PE / SE / Chartered Civil Engineer");

      const clinicalCoord = CAREER_PATHWAY_MAP.get("clinical-research-coordinator");
      expect(clinicalCoord).toBeDefined();
      expect(clinicalCoord.regulatoryNotes).toContain("ICH-GCP");
    });
  });

  // =========================================================================
  // 2. BRANCH RELEVANCE & CROSS-DISCIPLINARY DISCOVERY
  // =========================================================================
  describe("Group 2: Branch Relevance & Cross-Disciplinary Personalization", () => {
    it("2.1 Mechanical student receives Mechanical pathways ranked as primary", () => {
      const roles = careerPathwayService.getCareerRoles({ branch: "mech" });
      expect(roles[0].roleFamily).toBe("Mechanical & Manufacturing");
      expect(roles[0].relevance.type).toBe("primary");
      expect(roles[0].relevance.score).toBe(95);

      const primaryRoles = roles.filter((r) => r.relevance.type === "primary");
      expect(primaryRoles.some((r) => r.roleId === "mechanical-design-engineer")).toBe(true);
      expect(primaryRoles.some((r) => r.roleId === "manufacturing-engineer")).toBe(true);
    });

    it("2.2 Civil Engineering student receives Civil tracks as primary", () => {
      const roles = careerPathwayService.getCareerRoles({ branch: "civil" });
      const primaryRoles = roles.filter((r) => r.relevance.type === "primary");
      expect(primaryRoles.some((r) => r.roleId === "structural-design-engineer")).toBe(true);
      expect(primaryRoles.some((r) => r.roleId === "construction-project-engineer")).toBe(true);
    });

    it("2.3 Nursing student receives Healthcare pathways as primary", () => {
      const roles = careerPathwayService.getCareerRoles({ branch: "nursing-gen" });
      const primaryRoles = roles.filter((r) => r.relevance.type === "primary");
      expect(primaryRoles.some((r) => r.roleId === "registered-nurse")).toBe(true);
      expect(primaryRoles.some((r) => r.roleId === "clinical-research-coordinator")).toBe(true);
    });

    it("2.4 Cross-disciplinary roles are identified with transferable skills and rationale", () => {
      const roles = careerPathwayService.getCareerRoles({ branch: "mech" });
      const crossRoles = roles.filter((r) => r.relevance.type === "cross_disciplinary");

      expect(crossRoles.length).toBeGreaterThan(0);
      const frontendOption = crossRoles.find((r) => r.roleId === "frontend-developer");
      expect(frontendOption).toBeDefined();
      expect(frontendOption.transferableSkills).toContain("Problem Solving");
      expect(frontendOption.relevance.rationale).toContain("Accessible from non-computing disciplines");
    });

    it("2.5 Regulated tracks strictly block non-accredited cross-disciplinary transition", () => {
      const nurseRole = CAREER_PATHWAY_MAP.get("registered-nurse");
      expect(nurseRole.crossDisciplinaryAccessible).toBe(false);
      expect(nurseRole.mobilityRationale).toContain("Restricted strictly to accredited Nursing");
    });
  });

  // =========================================================================
  // 3. EVIDENCE-BASED ROLE READINESS SCORING & INTEGRITY
  // =========================================================================
  describe("Group 3: Evidence-Based Readiness Evaluation & Semantics", () => {
    it("3.1 Learner with zero evidence gets 0 readiness and Unassessed band without zero-scoring", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 0,
        normalizedBySkill: {},
        timeline: [],
      });

      const readiness = await careerPathwayService.evaluateRoleReadiness("mock-student-1", "mechanical-design-engineer");

      expect(readiness.heuristicReadinessIndex).toBe(0);
      expect(readiness.readinessBand).toBe("Unassessed");
      expect(readiness.evidenceCoveragePercent).toBe(0);
      expect(readiness.counts.demonstrated).toBe(0);
      expect(readiness.counts.gaps).toBe(0);
      expect(readiness.counts.unassessed).toBe(readiness.counts.totalCoreSkills);

      // Verify unassessed skills are explicitly listed as unassessed, not scored as 0
      for (const unassessed of readiness.skillsBreakdown.unassessed) {
        expect(unassessed.status).toBe("unassessed");
      }

      expect(readiness.disclaimer).toContain("Internal heuristic readiness index for formative learning guidance only");
    });

    it("3.2 Learner with verified passing evidence calculates explainable readiness index", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 4,
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            latestScore: 85,
            hasPassed: true,
            latestEvidence: {
              sourceType: "practical_lab",
              confidenceWeight: 0.90,
              timestamp: new Date().toISOString(),
            },
          },
          "Materials Science": {
            canonicalSkill: "Materials Science",
            latestScore: 80,
            hasPassed: true,
            latestEvidence: {
              sourceType: "assessment_attempt",
              confidenceWeight: 0.95,
              timestamp: new Date().toISOString(),
            },
          },
          "Stress Analysis": {
            canonicalSkill: "Stress Analysis",
            latestScore: 50, // Partial
            hasPassed: false,
            latestEvidence: {
              sourceType: "practical_lab",
              confidenceWeight: 0.90,
              timestamp: new Date().toISOString(),
            },
          },
        },
        timeline: [],
      });

      const readiness = await careerPathwayService.evaluateRoleReadiness("mock-student-2", "mechanical-design-engineer");

      expect(readiness.heuristicReadinessIndex).toBeGreaterThan(0);
      expect(readiness.counts.demonstrated).toBe(2);
      expect(readiness.counts.partial).toBe(1);
      expect(readiness.counts.unassessed).toBe(2); // Machine Element Design, CAD Modeling
      expect(["Developing Competency", "Substantially Evidenced"]).toContain(readiness.readinessBand);
    });

    it("3.3 Stale evidence (> 60 days) is detected and flagged in quality notes", async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 1,
        normalizedBySkill: {
          "JavaScript": {
            canonicalSkill: "JavaScript",
            latestScore: 85,
            latestEvidence: {
              sourceType: "coding_submission",
              confidenceWeight: 0.95,
              timestamp: ninetyDaysAgo,
            },
          },
        },
        timeline: [],
      });

      const readiness = await careerPathwayService.evaluateRoleReadiness("mock-student-3", "frontend-developer");
      expect(readiness.evidenceQualityNotes.staleEvidence.length).toBe(1);
      expect(readiness.evidenceQualityNotes.staleEvidence[0].skill).toBe("JavaScript");
      expect(readiness.evidenceQualityNotes.staleEvidence[0].daysSinceVerification).toBeGreaterThanOrEqual(89);
    });

    it("3.4 Conflicting divergent evidence is captured without silent data loss", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 2,
        normalizedBySkill: {
          "React": {
            canonicalSkill: "React",
            latestScore: 45, // Recent test drop
            highestEvidence: { percentage: 88, sourceType: "project_deliverable" },
            latestEvidence: { percentage: 45, sourceType: "assessment_attempt", timestamp: new Date().toISOString() },
          },
        },
        timeline: [],
      });

      const readiness = await careerPathwayService.evaluateRoleReadiness("mock-student-4", "frontend-developer");
      expect(readiness.evidenceQualityNotes.conflictingEvidence.length).toBe(1);
      expect(readiness.evidenceQualityNotes.conflictingEvidence[0].skill).toBe("React");
      expect(readiness.evidenceQualityNotes.conflictingEvidence[0].discrepancyDelta).toBe(43);
    });
  });

  // =========================================================================
  // 4. SIDE-BY-SIDE ROLE COMPARISON
  // =========================================================================
  describe("Group 4: Side-by-Side Role Comparison Experience", () => {
    it("4.1 Compares two roles side by side and detects shared and unique core competencies", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 2,
        normalizedBySkill: {
          "Engineering Mechanics": {
            canonicalSkill: "Engineering Mechanics",
            latestScore: 85,
            latestEvidence: { percentage: 85, sourceType: "assessment_attempt", timestamp: new Date().toISOString() },
          },
        },
        timeline: [],
      });

      const comparison = await careerPathwayService.compareRoles(
        "mock-student-5",
        "mechanical-design-engineer",
        "structural-design-engineer"
      );

      expect(comparison.role1.title).toBe("Mechanical Design Engineer");
      expect(comparison.role2.title).toBe("Structural Design Engineer");

      // Shared core skill: Engineering Mechanics is required in both
      expect(comparison.comparison.sharedCoreSkills).toContain("Engineering Mechanics");

      // Unique skills
      expect(comparison.role1.uniqueSkills).toContain("Machine Element Design");
      expect(comparison.role2.uniqueSkills).toContain("Reinforced Concrete Design");

      expect(comparison.comparison.alignmentSummary).toBeTypeOf("string");
    });

    it("4.2 Correctly calculates readiness delta between two roles", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 3,
        normalizedBySkill: {
          "JavaScript": { latestScore: 85, latestEvidence: { percentage: 85, timestamp: new Date().toISOString() } },
          "React": { latestScore: 82, latestEvidence: { percentage: 82, timestamp: new Date().toISOString() } },
          "HTML/CSS": { latestScore: 90, latestEvidence: { percentage: 90, timestamp: new Date().toISOString() } },
        },
        timeline: [],
      });

      const comparison = await careerPathwayService.compareRoles(
        "mock-student-6",
        "frontend-developer",
        "mechanical-design-engineer"
      );

      expect(comparison.comparison.readinessDelta).toBeGreaterThan(0);
      expect(comparison.comparison.higherReadinessRoleId).toBe("frontend-developer");
    });
  });

  // =========================================================================
  // 5. PERSONALIZED PREPARATION PLANS & SSH ACTIVITY LINKAGE
  // =========================================================================
  describe("Group 5: Personalized Preparation Plans & Existing Platform Linkage", () => {
    it("5.1 Generates ordered preparation plan linking to actual SSH Labs, Assessments, and Projects", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 1,
        normalizedBySkill: {
          "Mass Balance": {
            latestScore: 30, // Active gap needing remediation
            latestEvidence: { percentage: 30, timestamp: new Date().toISOString() },
          },
        },
        timeline: [],
      });

      const planResult = await careerPathwayService.generateRolePreparationPlan(
        "mock-student-7",
        "chemical-process-engineer"
      );

      expect(planResult.roleId).toBe("chemical-process-engineer");
      expect(planResult.plan.length).toBeGreaterThan(0);

      // Verify plan steps connect to real platform modules
      const routes = new Set(planResult.plan.map((s) => s.destinationRoute));
      expect(routes.has("/dashboard/labs") || routes.has("/dashboard/assessments") || routes.has("/dashboard/projects")).toBe(true);

      // Verify gap remediation is prioritized
      const remediationStep = planResult.plan.find((s) => s.evidenceGapType === "skill_gap");
      expect(remediationStep).toBeDefined();
      expect(remediationStep.priority).toContain("Remediation");

      // Verify disclaimer is present
      expect(planResult.disclaimer).toContain("does not constitute a placement guarantee");
    });

    it("5.2 Preparation plan generation is idempotent and free of duplicate steps", async () => {
      vi.spyOn(evidenceNormalizationService, "getNormalizedStudentEvidence").mockResolvedValue({
        rawCount: 0,
        normalizedBySkill: {},
        timeline: [],
      });

      const plan1 = await careerPathwayService.generateRolePreparationPlan("mock-student-8", "frontend-developer");
      const plan2 = await careerPathwayService.generateRolePreparationPlan("mock-student-8", "frontend-developer");

      expect(plan1.totalSteps).toBe(plan2.totalSteps);

      // Check for zero duplicate activity IDs
      const activityKeys = plan1.plan.map((p) => `${p.activityType}:${p.activityId}`);
      const uniqueKeys = new Set(activityKeys);
      expect(uniqueKeys.size).toBe(activityKeys.length);
    });
  });

  // =========================================================================
  // 6. SMART MENTOR CONTEXT GROUNDING & GRACEFUL FALLBACK
  // =========================================================================
  describe("Group 6: Smart Mentor Career Pathway Grounding", () => {
    it("6.1 SmartMentorContextService incorporates Career Pathway Studio diagnosis into unified context", async () => {
      // Mock minimal DB calls in getUnifiedUserContext
      smartMentorContextService.invalidateContext("mock-mentor-user-1");

      const context = await smartMentorContextService.getUnifiedUserContext("mock-mentor-user-1", {
        forceRefresh: true,
      });

      expect(context).toBeDefined();
      expect(context.careerPathway).toBeDefined();
      if (context.careerPathway) {
        expect(context.careerPathway.roleId).toBeTypeOf("string");
        expect(context.careerPathway.heuristicReadinessIndex).toBeTypeOf("number");
        expect(context.careerPathway.disclaimer).toContain("Internal heuristic readiness index");
      }
    });
  });
});
