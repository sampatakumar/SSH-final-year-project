import mongoose from "mongoose";
import { ProjectTemplate } from "../models/projectTemplate.models.js";
import { StudentProject } from "../models/studentProject.models.js";
import { Project } from "../../resume/models/project.models.js";
import { User } from "../../../core/database/models/user.models.js";
import { INITIAL_PROJECT_TEMPLATES } from "../constants/projectTemplatesCatalog.js";
import { projectRubricEvaluationService } from "./projectRubricEvaluation.service.js";
import { normalizeAcademicProfile } from "./academicNormalization.service.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export class ProjectStudioService {
  /**
   * Seed initial project templates to MongoDB.
   */
  async seedProjectTemplates() {
    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (!isDbConnected && !ProjectTemplate.findOne?.mock) {
      return { seeded: 0, total: INITIAL_PROJECT_TEMPLATES.length };
    }

    try {
      let seeded = 0;
      for (const tpl of INITIAL_PROJECT_TEMPLATES) {
        await ProjectTemplate.findOneAndUpdate(
          { templateId: tpl.templateId },
          { $set: tpl },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        seeded += 1;
      }
      return { seeded, total: INITIAL_PROJECT_TEMPLATES.length };
    } catch {
      return { seeded: 0, total: INITIAL_PROJECT_TEMPLATES.length };
    }
  }

  /**
   * List available project templates with filtering and discipline sorting.
   */
  async listTemplates(filters = {}) {
    const { branchSlug, disciplineCategory, difficulty, search, status = "published" } = filters;
    const roleSlug = (filters.roleSlug || filters.role || "").toLowerCase();

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    let templates = [];

    if (isDbConnected || ProjectTemplate.find?.mock) {
      try {
        const query = {};
        if (status) query.status = status;
        if (difficulty) query.difficulty = difficulty;
        if (disciplineCategory) query.disciplineCategory = disciplineCategory;
        if (branchSlug) query.branchSlugs = branchSlug.toLowerCase();
        if (roleSlug) query.relevantRoleSlugs = { $regex: roleSlug.replace(/[^a-z0-9]/g, "-"), $options: "i" };
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { relevantSkills: { $regex: search, $options: "i" } },
          ];
        }

        templates = await ProjectTemplate.find(query).lean();
      } catch {
        // Fall back to in-memory templates
      }
    }

    // In-memory fallback if database empty or disconnected
    if (!templates || templates.length === 0) {
      templates = INITIAL_PROJECT_TEMPLATES.filter((tpl) => {
        if (status && tpl.status !== status) return false;
        if (difficulty && tpl.difficulty.toLowerCase() !== difficulty.toLowerCase()) return false;
        if (disciplineCategory && tpl.disciplineCategory.toLowerCase() !== disciplineCategory.toLowerCase()) return false;
        if (branchSlug && !tpl.branchSlugs.map((s) => s.toLowerCase()).includes(branchSlug.toLowerCase())) return false;
        if (roleSlug) {
          const normRole = roleSlug.replace(/[^a-z0-9]/g, "-");
          const hasRole = tpl.relevantRoleSlugs.some((r) => r.includes(normRole) || normRole.includes(r));
          if (!hasRole) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const matchTitle = tpl.title.toLowerCase().includes(q);
          const matchDesc = tpl.description.toLowerCase().includes(q);
          const matchSkills = tpl.relevantSkills.some((s) => s.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchSkills) return false;
        }
        return true;
      });
    }

    // Relevance sort: if branchSlug specified, prioritize templates tailored to that branch
    if (branchSlug) {
      const bSlug = branchSlug.toLowerCase();
      templates.sort((a, b) => {
        const aMatches = a.branchSlugs?.map((s) => s.toLowerCase()).includes(bSlug) ? 1 : 0;
        const bMatches = b.branchSlugs?.map((s) => s.toLowerCase()).includes(bSlug) ? 1 : 0;
        return bMatches - aMatches;
      });
    }

    return templates;
  }

  /**
   * Get template by templateId slug.
   */
  async getTemplateById(templateId) {
    if (!templateId) return null;
    const cleanId = String(templateId).trim().toLowerCase();

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);
    if (isDbConnected || ProjectTemplate.findOne?.mock) {
      try {
        const tpl = await ProjectTemplate.findOne({ templateId: cleanId }).lean();
        if (tpl) return tpl;
      } catch {
        // Fall back to constants
      }
    }

    return INITIAL_PROJECT_TEMPLATES.find((t) => t.templateId === cleanId) || null;
  }

  /**
   * Start a project for an authenticated student from a template.
   */
  async startProject(userId, templateId, options = {}) {
    if (!userId) throw new ApiError(401, "Authentication required to start a project");
    if (!templateId) throw new ApiError(400, "templateId is required");

    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new ApiError(404, "Project template not found or unavailable");
    }

    const isDbConnected = Boolean(mongoose.connection && mongoose.connection.readyState === 1);

    // Check if user already has an active project instance
    let existing = null;
    if (isDbConnected || StudentProject.findOne?.mock) {
      try {
        let q = StudentProject.findOne({
          owner: userId,
          templateId: template.templateId,
          status: { $in: ["in_progress", "submitted", "changes_requested"] },
        });
        existing = q && typeof q.lean === "function" ? await q.lean() : await q;
      } catch {
        existing = null;
      }
    }

    if (existing) {
      return existing;
    }

    // Initialize milestone states
    const milestoneProgress = (template.milestones || []).map((m, idx) => ({
      milestoneId: m.milestoneId,
      title: m.title,
      status: idx === 0 ? "in_progress" : "pending",
      completedAt: null,
      notes: "",
    }));

    // Initialize draft deliverables
    const deliverables = (template.deliverables || []).map((d) => ({
      key: d.key,
      label: d.label,
      type: d.type,
      content: "",
      fileUrl: "",
      fileName: "",
      fileSize: 0,
      mimeType: "",
      externalUrl: "",
      submittedAt: null,
      notes: "",
    }));

    // Determine default branch and target role from user or options
    let branchSlug = options.branchSlug || template.branchSlugs[0] || "general";
    let roleSlug = options.roleSlug || template.relevantRoleSlugs[0] || "";

    const user = (isDbConnected || User.findById?.mock)
      ? await User.findById(userId).lean().catch(() => null)
      : null;
    if (user?.academic?.branchSlug) {
      branchSlug = user.academic.branchSlug;
    }

    const studentProject = await StudentProject.create({
      owner: userId,
      templateId: template.templateId,
      title: template.title,
      description: template.description,
      branchSlug,
      roleSlug,
      status: "in_progress",
      currentMilestoneIndex: 0,
      milestoneProgress,
      deliverables,
      writtenExplanations: "",
      evaluation: {
        status: "pending",
        score: 0,
        maxScore: 100,
        percentScore: 0,
        rubricFeedback: [],
        overallFeedback: "",
        evaluatedAt: null,
        evaluator: "automated_rubric",
      },
      portfolioVisibility: false,
      history: [
        {
          event: "project_started",
          fromStatus: "available",
          toStatus: "in_progress",
          timestamp: new Date(),
          notes: `Project started from template "${template.title}".`,
        },
      ],
    });

    return studentProject;
  }

  /**
   * List all projects for a student.
   */
  async listStudentProjects(userId, filters = {}) {
    if (!userId) throw new ApiError(401, "Authentication required");

    const query = { owner: userId };
    if (filters.status) query.status = filters.status;
    if (filters.branchSlug) query.branchSlug = filters.branchSlug;

    const projects = await StudentProject.find(query).sort({ updatedAt: -1 }).lean();
    return projects;
  }

  /**
   * Get single student project by ID with strict ownership validation.
   */
  async getStudentProjectById(userId, projectId) {
    if (!userId) throw new ApiError(401, "Authentication required");
    if (!mongoose.isValidObjectId(projectId)) {
      throw new ApiError(400, "Invalid project ID format");
    }

    const project = await StudentProject.findById(projectId);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (String(project.owner) !== String(userId)) {
      throw new ApiError(403, "Access denied. You do not own this project.");
    }

    const template = await this.getTemplateById(project.templateId);
    return {
      project,
      template,
    };
  }

  /**
   * Helper alias for getting a student project directly.
   */
  async getStudentProject(userId, projectId) {
    const { project } = await this.getStudentProjectById(userId, projectId);
    return project;
  }

  /**
   * Update milestone progress for a project.
   */
  async updateMilestoneProgress(userId, projectId, milestoneId, status, notes = "") {
    const { project } = await this.getStudentProjectById(userId, projectId);

    if (["submitted", "completed"].includes(project.status)) {
      throw new ApiError(400, `Cannot modify milestones while project is ${project.status}`);
    }

    const validStatuses = ["pending", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid milestone status. Allowed: ${validStatuses.join(", ")}`);
    }

    const milestone = (project.milestoneProgress || []).find(
      (m) => m.milestoneId === milestoneId || m.id === milestoneId
    );
    if (!milestone) {
      throw new ApiError(404, `Milestone "${milestoneId}" not found in project`);
    }

    milestone.status = status;
    milestone.completed = status === "completed";
    if (status === "completed") {
      milestone.completedAt = new Date();
    }
    if (notes) {
      milestone.notes = notes;
    }

    const completedCount = (project.milestoneProgress || []).filter(
      (m) => m.completed || m.status === "completed"
    ).length;
    project.progressPercentage = (project.milestoneProgress || []).length > 0
      ? Math.round((completedCount / project.milestoneProgress.length) * 100)
      : 0;

    // Auto-advance currentMilestoneIndex
    const firstNonCompleted = (project.milestoneProgress || []).findIndex(
      (m) => !m.completed && m.status !== "completed"
    );
    project.currentMilestoneIndex = firstNonCompleted === -1 ? project.milestoneProgress.length - 1 : firstNonCompleted;

    if (project.history) {
      project.history.push({
        event: "milestone_updated",
        fromStatus: project.status,
        toStatus: project.status,
        timestamp: new Date(),
        notes: `Milestone "${milestone.title}" set to ${status}.`,
      });
    }

    await project.save();
    return project;
  }

  /**
   * Helper alias for updating a milestone with boolean or status.
   */
  async updateMilestone(userId, projectId, milestoneId, completedOrStatus, notes = "") {
    const status = typeof completedOrStatus === "boolean"
      ? (completedOrStatus ? "completed" : "pending")
      : completedOrStatus;
    return this.updateMilestoneProgress(userId, projectId, milestoneId, status, notes);
  }

  /**
   * Save draft deliverables and written explanations.
   */
  async saveProjectDeliverables(userId, projectId, payload = {}, maybeWritten = "") {
    const { project } = await this.getStudentProjectById(userId, projectId);

    if (["submitted", "completed"].includes(project.status)) {
      throw new ApiError(400, `Cannot modify deliverables while project is ${project.status}`);
    }

    const deliverablesList = Array.isArray(payload) ? payload : (payload.deliverables || []);
    const written = typeof payload.writtenExplanations === "string" ? payload.writtenExplanations : maybeWritten;

    if (written) {
      project.writtenExplanations = written;
    }

    for (const update of deliverablesList) {
      const uKey = update.key || update.deliverableId;
      const existing = (project.deliverables || []).find((d) => d.key === uKey || d.deliverableId === uKey);
      if (existing) {
        if (update.content !== undefined) existing.content = update.content;
        if (update.textContent !== undefined) existing.textContent = update.textContent;
        if (update.fileUrl !== undefined) existing.fileUrl = update.fileUrl;
        if (update.fileName !== undefined) existing.fileName = update.fileName;
        if (update.fileSize !== undefined) existing.fileSize = update.fileSize;
        if (update.fileSizeKB !== undefined) existing.fileSizeKB = update.fileSizeKB;
        if (update.mimeType !== undefined) existing.mimeType = update.mimeType;
        if (update.externalUrl !== undefined) existing.externalUrl = update.externalUrl;
        if (update.notes !== undefined) existing.notes = update.notes;
        existing.submittedAt = new Date();
      } else if (uKey) {
        if (!project.deliverables) project.deliverables = [];
        project.deliverables.push({
          key: uKey,
          deliverableId: uKey,
          label: update.label || update.title || uKey,
          title: update.title || update.label || uKey,
          type: update.type || "text",
          content: update.content || update.textContent || "",
          textContent: update.textContent || update.content || "",
          fileUrl: update.fileUrl || "",
          fileName: update.fileName || "",
          fileSize: update.fileSize || 0,
          fileSizeKB: update.fileSizeKB || 0,
          mimeType: update.mimeType || "",
          externalUrl: update.externalUrl || "",
          submittedAt: new Date(),
          notes: update.notes || "",
        });
      }
    }

    if (project.history) {
      project.history.push({
        event: "deliverables_saved",
        fromStatus: project.status,
        toStatus: project.status,
        timestamp: new Date(),
        notes: "Project deliverables and draft explanations updated.",
      });
    }

    await project.save();
    return project;
  }

  /**
   * Helper alias for saveProjectDeliverables.
   */
  async saveDeliverables(userId, projectId, deliverables, writtenExplanations = "") {
    return this.saveProjectDeliverables(userId, projectId, deliverables, writtenExplanations);
  }

  /**
   * Submit project for rubric-based evaluation.
   * Enforces complete deliverables and valid state transition.
   */
  async submitProjectForReview(userId, projectId, writtenExplanations = "") {
    const { project, template } = await this.getStudentProjectById(userId, projectId);

    if (!["in_progress", "changes_requested"].includes(project.status)) {
      throw new ApiError(400, `Invalid state transition: cannot submit project in "${project.status}" status`);
    }

    if (writtenExplanations) {
      project.writtenExplanations = writtenExplanations;
    }

    // Run deterministic rubric evaluation
    const evaluation = projectRubricEvaluationService.evaluateSubmission(template, project);
    project.evaluation = evaluation;

    const fromStatus = project.status;
    if (evaluation.passed) {
      project.status = "completed";
      project.completedAt = new Date();
      project.progressPercentage = 100;
      if (project.history) {
        project.history.push({
          event: "evaluation_passed",
          fromStatus,
          toStatus: "completed",
          timestamp: new Date(),
          notes: `Rubric evaluation passed with ${evaluation.percentScore}%. Project completed.`,
        });
      }
    } else {
      project.status = "changes_requested";
      if (project.history) {
        project.history.push({
          event: "changes_requested",
          fromStatus,
          toStatus: "changes_requested",
          timestamp: new Date(),
          notes: `Rubric evaluation score ${evaluation.percentScore}% < 70% threshold. Revisions requested.`,
        });
      }
    }

    await project.save();
    return project;
  }

  /**
   * Helper alias for submitProjectForReview.
   */
  async submitProject(userId, projectId, writtenExplanations = "") {
    return this.submitProjectForReview(userId, projectId, writtenExplanations);
  }

  /**
   * Toggle portfolio visibility for a completed project.
   */
  async togglePortfolioVisibility(userId, projectId, visibility) {
    const { project } = await this.getStudentProjectById(userId, projectId);

    if (project.status !== "completed") {
      throw new ApiError(400, "Only completed projects can be showcased in the evidence portfolio");
    }

    project.portfolioVisibility = Boolean(visibility);
    if (project.history) {
      project.history.push({
        event: "portfolio_visibility_toggled",
        fromStatus: project.status,
        toStatus: project.status,
        timestamp: new Date(),
        notes: `Portfolio visibility set to ${project.portfolioVisibility}.`,
      });
    }

    await project.save();
    return project;
  }

  /**
   * Sync a completed project to Resume Showcase (`Project` collection).
   */
  async syncToResumeShowcase(userId, projectId) {
    const { project, template } = await this.getStudentProjectById(userId, projectId);

    if (project.status !== "completed") {
      throw new ApiError(400, "Only completed projects can be synced to your resume showcase.");
    }

    const deliverables = project.deliverables || [];
    const demoUrlDeliverable = deliverables.find((d) => d.type === "link" && d.externalUrl);
    const demoUrl = demoUrlDeliverable ? demoUrlDeliverable.externalUrl : "";

    const stack = (project.relevantSkills && project.relevantSkills.length > 0)
      ? project.relevantSkills
      : (template?.relevantSkills || []);
    const dateFormatted = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });

    let resumeProject;
    if (project.resumeProjectId) {
      resumeProject = await Project.findOneAndUpdate(
        { _id: project.resumeProjectId, owner: userId },
        {
          $set: {
            title: project.title,
            description: project.writtenExplanations?.slice(0, 500) || project.description,
            stack,
            demoUrl,
            source: "manual",
          },
        },
        { new: true }
      );
    }

    if (!resumeProject) {
      resumeProject = await Project.create({
        owner: userId,
        title: project.title,
        description: project.writtenExplanations?.slice(0, 500) || project.description,
        stack,
        date: dateFormatted,
        demoUrl,
        source: "manual",
      });

      project.resumeProjectId = resumeProject._id;
    }

    project.syncedToResume = true;
    if (project.history) {
      project.history.push({
        event: "synced_to_resume",
        fromStatus: project.status,
        toStatus: project.status,
        timestamp: new Date(),
        notes: `Synced to resume showcase project ID ${resumeProject._id}.`,
      });
    }

    await project.save();
    return {
      synced: true,
      success: true,
      resumeProjectId: resumeProject._id,
      project,
    };
  }

  /**
   * Get public or user evidence portfolio projects.
   */
  async getPortfolioProjects(userId, publicOnly = false) {
    if (!userId) return [];
    const query = {
      owner: userId,
      status: "completed",
    };
    if (publicOnly) {
      query.portfolioVisibility = true;
    }

    const projects = await StudentProject.find(query).sort({ completedAt: -1 }).lean();
    return projects;
  }
}

export const projectStudioService = new ProjectStudioService();
