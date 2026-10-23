import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { INITIAL_PROJECT_TEMPLATES } from "../src/modules/academic/constants/projectTemplatesCatalog.js";
import { projectStudioService } from "../src/modules/academic/services/projectStudio.service.js";
import { evaluateProjectSubmission } from "../src/modules/academic/services/projectRubricEvaluation.service.js";
import {
  getBranchCapabilities,
  CAPABILITY_KEYS,
  CAPABILITY_STATUS,
} from "../src/modules/academic/services/branchCapabilityRegistry.service.js";
import { StudentProject } from "../src/modules/academic/models/studentProject.models.js";
import { ProjectTemplate } from "../src/modules/academic/models/projectTemplate.models.js";
import { Project } from "../src/modules/resume/models/project.models.js";
import { smartMentorLocalService } from "../src/modules/mentor/services/smart-mentor-local.service.js";
import { smartMentorContextService } from "../src/modules/mentor/services/smart-mentor-context.service.js";

describe("Phase 43: Branch-Aware Project Studio & Evidence Portfolio", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const mockOtherUserId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. CURATED TEMPLATES CATALOG & DISCIPLINE COVERAGE
  // =========================================================================
  describe("1. Curated Templates Catalog & Multi-Discipline Coverage", () => {
    it("provides functional templates spanning all 8 core discipline families", () => {
      const templateIds = INITIAL_PROJECT_TEMPLATES.map((t) => t.templateId);

      // Mechanical
      expect(templateIds).toContain("mech-cad-gearbox-design");
      expect(templateIds).toContain("mech-fea-bracket-optimization");

      // ECE / EEE
      expect(templateIds).toContain("ece-embedded-iot-telemetry");
      expect(templateIds).toContain("eee-power-converter-analysis");

      // Civil
      expect(templateIds).toContain("civil-structural-framing-bim");

      // Chemical
      expect(templateIds).toContain("chem-distillation-column-mass-balance");

      // Biotechnology
      expect(templateIds).toContain("biotech-bioinformatics-pipeline");

      // Business / MBA
      expect(templateIds).toContain("bba-market-expansion-strategy");

      // B.Com / Finance
      expect(templateIds).toContain("bcom-financial-statement-audit");

      // Arts / Humanities
      expect(templateIds).toContain("arts-digital-media-campaign");

      // Nursing / Allied Health
      expect(templateIds).toContain("nursing-clinical-case-reflection");

      // CSE / IT
      expect(templateIds).toContain("cse-distributed-microservices-app");
    });

    it("ensures each published template contains real objectives, deliverables, and rubric dimensions", () => {
      INITIAL_PROJECT_TEMPLATES.forEach((tpl) => {
        expect(tpl.title).toBeTruthy();
        expect(tpl.description.length).toBeGreaterThan(20);
        expect(tpl.learningObjectives.length).toBeGreaterThanOrEqual(2);
        expect(tpl.milestones.length).toBeGreaterThanOrEqual(3);
        expect(tpl.deliverables.length).toBeGreaterThanOrEqual(2);
        expect(tpl.rubric.length).toBeGreaterThanOrEqual(3);

        // Verify rubric dimension weights sum to 100
        const totalWeight = tpl.rubric.reduce((acc, d) => acc + d.weight, 0);
        expect(totalWeight).toBe(100);

        // Verify required deliverables exist
        const requiredDelivs = tpl.deliverables.filter((d) => d.required);
        expect(requiredDelivs.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("filters templates by branch slug and career role", async () => {
      const mechTemplates = await projectStudioService.listTemplates({ branchSlug: "mech" });
      expect(mechTemplates.some((t) => t.templateId === "mech-cad-gearbox-design")).toBe(true);
      expect(mechTemplates.every((t) => t.branchSlugs.includes("mech"))).toBe(true);

      const financeTemplates = await projectStudioService.listTemplates({ branchSlug: "bcom-gen" });
      expect(financeTemplates.some((t) => t.templateId === "bcom-financial-statement-audit")).toBe(true);

      const roleTemplates = await projectStudioService.listTemplates({ role: "Embedded Systems Engineer" });
      expect(roleTemplates.some((t) => t.templateId === "ece-embedded-iot-telemetry")).toBe(true);
    });

    it("allows cross-disciplinary browsing without hard restrictions", async () => {
      const allTemplates = await projectStudioService.listTemplates();
      expect(allTemplates.length).toBeGreaterThanOrEqual(10);
    });
  });

  // =========================================================================
  // 2. PROJECT CREATION, OWNERSHIP & LIFECYCLE
  // =========================================================================
  describe("2. Project Creation & Ownership Protection", () => {
    it("starts a project from an active template and initializes milestone progress", async () => {
      const template = INITIAL_PROJECT_TEMPLATES.find((t) => t.templateId === "mech-cad-gearbox-design");
      vi.spyOn(ProjectTemplate, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(template),
      });

      const mockCreated = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        templateId: template.templateId,
        title: template.title,
        status: "in_progress",
        milestoneProgress: template.milestones.map((m) => ({
          milestoneId: m.id,
          title: m.title,
          completed: false,
          notes: "",
        })),
        deliverables: [],
        progressPercentage: 0,
      };

      vi.spyOn(StudentProject, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });
      vi.spyOn(StudentProject, "create").mockResolvedValue(mockCreated);

      const result = await projectStudioService.startProject(mockUserId, "mech-cad-gearbox-design");
      expect(result.status).toBe("in_progress");
      expect(result.milestoneProgress.length).toBe(template.milestones.length);
      expect(result.title).toBe(template.title);
    });

    it("prevents starting non-existent or unpublished templates", async () => {
      vi.spyOn(ProjectTemplate, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        projectStudioService.startProject(mockUserId, "unknown-quantum-sim")
      ).rejects.toThrow("Project template not found or unavailable");
    });

    it("enforces strict ownership protection on project access", async () => {
      vi.spyOn(StudentProject, "findById").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          owner: mockOtherUserId, // Different user
          title: "Confidential Student Design",
        }),
      });

      await expect(
        projectStudioService.getStudentProject(mockUserId, new mongoose.Types.ObjectId())
      ).rejects.toThrow("Access denied. You do not own this project.");
    });
  });

  // =========================================================================
  // 3. MILESTONE PROGRESSION & DELIVERABLE SUBMISSION
  // =========================================================================
  describe("3. Milestone Progression & Deliverable Management", () => {
    it("updates milestone completion and recalculates overall progress percentage", async () => {
      const projectDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        status: "in_progress",
        milestoneProgress: [
          { milestoneId: "m1", title: "Specification", completed: false },
          { milestoneId: "m2", title: "CAD Modeling", completed: false },
          { milestoneId: "m3", title: "Analysis", completed: false },
          { milestoneId: "m4", title: "Documentation", completed: false },
        ],
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);

      const updated = await projectStudioService.updateMilestone(
        mockUserId,
        projectDoc._id,
        "m1",
        true,
        "Completed design specifications and torque calculations."
      );

      expect(projectDoc.milestoneProgress[0].completed).toBe(true);
      expect(projectDoc.milestoneProgress[0].notes).toBe("Completed design specifications and torque calculations.");
      expect(projectDoc.progressPercentage).toBe(25); // 1 of 4 = 25%
      expect(projectDoc.save).toHaveBeenCalled();
    });

    it("saves deliverables and validates against required deliverable schema", async () => {
      const projectDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        status: "in_progress",
        deliverables: [],
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);

      const deliverables = [
        {
          deliverableId: "gearbox-cad-model",
          title: "3D CAD Assembly",
          type: "file",
          fileUrl: "data:application/pdf;base64,JVBERi0xLjQK...",
          fileName: "gearbox_assembly.pdf",
          fileSizeKB: 245,
          notes: "Complete step file and 2D drawings included.",
        },
        {
          deliverableId: "gear-calculation-sheet",
          title: "Gear Calculations",
          type: "text",
          textContent: "AGMA bending stress calculation yielding factor of safety 2.4.",
        },
      ];

      await projectStudioService.saveDeliverables(mockUserId, projectDoc._id, deliverables);

      expect(projectDoc.deliverables.length).toBe(2);
      expect(projectDoc.deliverables[0].deliverableId).toBe("gearbox-cad-model");
      expect(projectDoc.deliverables[1].textContent).toContain("AGMA bending stress");
      expect(projectDoc.save).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 4. RUBRIC EVALUATION & STATE TRANSITIONS
  // =========================================================================
  describe("4. Rubric Evaluation & State Transitions", () => {
    const template = INITIAL_PROJECT_TEMPLATES.find((t) => t.templateId === "mech-cad-gearbox-design");

    it("evaluates a complete, high-quality submission as passing (>= 70%) and marks completed", () => {
      const deliverables = [
        {
          deliverableId: "gearbox-cad-model",
          title: "CAD Model",
          type: "file",
          fileUrl: "https://example.com/gearbox.step",
          notes: "Full 3D parametric CAD assembly with tolerance stackup analysis.",
        },
        {
          deliverableId: "gear-calculation-sheet",
          title: "Calculation Sheet",
          type: "text",
          textContent: "Comprehensive torque and bending calculations with safety factor 2.4 conforming to AGMA 2001-D04.",
        },
        {
          deliverableId: "bill-of-materials",
          title: "BOM",
          type: "text",
          textContent: "Complete Bill of Materials listing bearings, shaft materials, gears, and fasteners with supplier parts.",
        },
      ];

      const evaluation = evaluateProjectSubmission(
        template,
        deliverables,
        "Detailed engineering design of 2-stage helical reducer for industrial conveyor."
      );

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(70);
      expect(evaluation.isPassing).toBe(true);
      expect(evaluation.rubricBreakdown.length).toBe(template.rubric.length);
      expect(evaluation.missingDeliverables.length).toBe(0);
      expect(evaluation.provenance).toBe("RUBRIC_EVALUATED");
    });

    it("requests changes and prevents completion if required deliverables are missing", () => {
      // Submitting without the required gearbox-cad-model deliverable
      const incompleteDeliverables = [
        {
          deliverableId: "gear-calculation-sheet",
          title: "Calculation Sheet",
          type: "text",
          textContent: "Preliminary torque calculation.",
        },
      ];

      const evaluation = evaluateProjectSubmission(
        template,
        incompleteDeliverables,
        "Brief work in progress summary."
      );

      expect(evaluation.isPassing).toBe(false);
      expect(evaluation.missingDeliverables.some((m) => m.toLowerCase().includes("cad") || m.toLowerCase().includes("drawing"))).toBe(true);
      expect(evaluation.overallScore).toBeLessThan(70);
      expect(evaluation.feedbackSummary).toContain("Missing");
    });

    it("transitions project status correctly: in_progress -> submitted -> completed", async () => {
      const projectDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        templateId: "mech-cad-gearbox-design",
        status: "in_progress",
        deliverables: [
          {
            deliverableId: "gearbox-cad-model",
            title: "CAD Model",
            type: "file",
            fileUrl: "https://example.com/gearbox.pdf",
            notes: "Complete CAD assembly model.",
          },
          {
            deliverableId: "gear-calculation-sheet",
            title: "Calculations",
            type: "text",
            textContent: "Gear stresses, torque, and factor of safety 2.4.",
          },
          {
            deliverableId: "bill-of-materials",
            title: "BOM",
            type: "text",
            textContent: "Comprehensive Bill of Materials with ISO standard parts.",
          },
        ],
        writtenExplanations: "Thorough engineering analysis and design documentation.",
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);
      vi.spyOn(ProjectTemplate, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(template),
      });

      const evaluated = await projectStudioService.submitProject(
        mockUserId,
        projectDoc._id,
        "Thorough engineering analysis and design documentation."
      );

      expect(projectDoc.status).toBe("completed");
      expect(projectDoc.completedAt).toBeDefined();
      expect(projectDoc.evaluation.isPassing).toBe(true);
      expect(projectDoc.evaluation.overallScore).toBeGreaterThanOrEqual(70);
    });

    it("prevents direct frontend manipulation of project completion without rubric pass", async () => {
      // Test that updating status to completed directly is rejected by transitions
      const projectDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        templateId: "mech-cad-gearbox-design",
        status: "in_progress",
        deliverables: [],
        save: vi.fn(),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);
      vi.spyOn(ProjectTemplate, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(template),
      });

      // Submitting empty deliverables
      await projectStudioService.submitProject(mockUserId, projectDoc._id, "Empty summary");
      expect(projectDoc.status).toBe("changes_requested");
      expect(projectDoc.status).not.toBe("completed");
    });
  });

  // =========================================================================
  // 5. PORTFOLIO & RESUME INTEGRATION
  // =========================================================================
  describe("5. Portfolio Visibility & Resume Showcase Integration", () => {
    it("allows toggling portfolio visibility for completed projects", async () => {
      const projectDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        status: "completed",
        portfolioVisibility: false,
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);

      const result = await projectStudioService.togglePortfolioVisibility(
        mockUserId,
        projectDoc._id,
        true
      );

      expect(result.portfolioVisibility).toBe(true);
      expect(projectDoc.save).toHaveBeenCalled();
    });

    it("syncs completed project to resume showcase collection without overwriting manual resumes", async () => {
      const projectDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        templateId: "mech-cad-gearbox-design",
        title: "Mechanical Gearbox Design & Analysis",
        status: "completed",
        syncedToResume: false,
        relevantSkills: ["CAD Modeling", "Mechanical Design", "FEA Analysis"],
        evaluation: { overallScore: 88 },
        history: [],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(projectDoc);
      vi.spyOn(Project, "findOne").mockResolvedValue(null);
      vi.spyOn(Project, "create").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        title: projectDoc.title,
        stack: projectDoc.relevantSkills,
      });

      const syncResult = await projectStudioService.syncToResumeShowcase(mockUserId, projectDoc._id);

      expect(syncResult.synced).toBe(true);
      expect(projectDoc.syncedToResume).toBe(true);
      expect(Project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: mockUserId,
          title: "Mechanical Gearbox Design & Analysis",
          stack: expect.arrayContaining(["CAD Modeling", "Mechanical Design"]),
        })
      );
    });

    it("refuses to sync incomplete or in-progress projects to resume showcase", async () => {
      const inProgressDoc = {
        _id: new mongoose.Types.ObjectId(),
        owner: mockUserId,
        status: "in_progress",
      };

      vi.spyOn(StudentProject, "findById").mockResolvedValue(inProgressDoc);

      await expect(
        projectStudioService.syncToResumeShowcase(mockUserId, inProgressDoc._id)
      ).rejects.toThrow("Only completed projects can be synced to your resume showcase.");
    });
  });

  // =========================================================================
  // 6. CAPABILITY REGISTRY INTEGRATION
  // =========================================================================
  describe("6. Capability Registry Integration", () => {
    it("registers PROJECT_STUDIO capability as AVAILABLE across all 8 branch families", () => {
      expect(CAPABILITY_KEYS.PROJECT_STUDIO).toBe("project_studio");

      const testBranches = ["mech", "ece", "civil", "chem", "biotech", "bba-gen", "bcom-gen", "nursing-gen", "ba-gen", "cse"];

      testBranches.forEach((branchSlug) => {
        const capabilities = getBranchCapabilities(branchSlug);
        expect(capabilities.capabilities.project_studio).toBeDefined();
        expect(capabilities.capabilities.project_studio).toBe(CAPABILITY_STATUS.AVAILABLE);
      });
    });

    it("keeps specialized simulation engines strictly PLANNED to preserve capability integrity", () => {
      const mechCaps = getBranchCapabilities("mech");
      expect(mechCaps.capabilities.cad_portfolio).toBe(CAPABILITY_STATUS.PLANNED);
      expect(mechCaps.capabilities.engineering_simulation).toBe(CAPABILITY_STATUS.PLANNED);

      const eceCaps = getBranchCapabilities("ece");
      expect(eceCaps.capabilities.circuit_exercises).toBe(CAPABILITY_STATUS.PLANNED);

      const healthCaps = getBranchCapabilities("nursing-gen");
      expect(healthCaps.capabilities.healthcare_learning_assessment).toBe(CAPABILITY_STATUS.PLANNED);
    });
  });

  // =========================================================================
  // 7. SMART MENTOR & STUDENT CONTEXT INTEGRATION
  // =========================================================================
  describe("7. Smart Mentor Integration", () => {
    it("classifies project studio and deliverable queries into project_studio_guidance intent", () => {
      expect(smartMentorLocalService.classifyIntent("How do I submit my project deliverable?")).toBe("project_studio_guidance");
      expect(smartMentorLocalService.classifyIntent("What is the rubric evaluation for Project Studio?")).toBe("project_studio_guidance");
      expect(smartMentorLocalService.classifyIntent("Can I sync my portfolio project to resume?")).toBe("project_studio_guidance");
    });

    it("generates deterministic local guidance referencing active Project Studio status", async () => {
      const mockContext = {
        career: { targetRole: "Mechanical Design Engineer" },
        projectStudio: {
          totalProjects: 1,
          inProgressCount: 1,
          completedCount: 0,
          activeProjects: [
            {
              projectId: "p1",
              title: "Gearbox Design Case Study",
              status: "in_progress",
              disciplineCategory: "Mechanical Engineering",
              progressPercentage: 50,
              completedMilestones: 2,
              totalMilestones: 4,
              submittedDeliverables: 1,
            },
          ],
          completedProjects: [],
        },
      };

      const guidance = await smartMentorLocalService.generateLocalGuidance(
        "project_studio_guidance",
        mockContext,
        "What should I do on my project?"
      );

      expect(guidance.answer).toContain("Gearbox Design Case Study");
      expect(guidance.answer).toContain("50% overall progress");
      expect(guidance.actions[0].route).toBe("/dashboard/projects");
      expect(guidance.actions[0].title).toContain("Continue Gearbox Design Case Study");
    });

    it("provides guidance on missing deliverables when changes are requested", async () => {
      const mockContext = {
        career: { targetRole: "Mechanical Engineer" },
        projectStudio: {
          totalProjects: 1,
          activeProjects: [
            {
              projectId: "p1",
              title: "Gearbox Design",
              status: "changes_requested",
              progressPercentage: 25,
              completedMilestones: 1,
              totalMilestones: 4,
              submittedDeliverables: 1,
            },
          ],
          completedProjects: [],
        },
      };

      const guidance = await smartMentorLocalService.generateLocalGuidance(
        "project_studio_guidance",
        mockContext,
        "How do I fix my project deliverables?"
      );

      expect(guidance.answer).toContain("Changes have been requested");
      expect(guidance.actions[0].title).toContain("Revise Gearbox Design Deliverables");
    });
  });
});
