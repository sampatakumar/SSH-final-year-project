import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { projectStudioService } from "../services/projectStudio.service.js";

/**
 * List available project templates with filtering.
 */
export const listTemplates = asyncHandler(async (req, res) => {
  const { branch, discipline, difficulty, role, search } = req.query;

  const templates = await projectStudioService.listTemplates({
    branchSlug: branch,
    disciplineCategory: discipline,
    difficulty,
    roleSlug: role,
    search,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      total: templates.length,
      templates,
    }, "Project templates retrieved successfully")
  );
});

/**
 * Get single template by templateId.
 */
export const getTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const template = await projectStudioService.getTemplateById(templateId);

  if (!template) {
    throw new ApiError(404, `Project template "${templateId}" not found`);
  }

  return res.status(200).json(
    new ApiResponse(200, template, "Project template details retrieved successfully")
  );
});

/**
 * Start a project for authenticated student.
 */
export const startProject = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { templateId, branchSlug, roleSlug } = req.body;

  if (!templateId) {
    throw new ApiError(400, "templateId is required in request body");
  }

  const project = await projectStudioService.startProject(userId, templateId, {
    branchSlug,
    roleSlug,
  });

  return res.status(201).json(
    new ApiResponse(201, project, "Project initialized successfully in Project Studio")
  );
});

/**
 * List all projects belonging to the authenticated student.
 */
export const listMyProjects = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { status, branch } = req.query;

  const projects = await projectStudioService.listStudentProjects(userId, {
    status,
    branchSlug: branch,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      count: projects.length,
      projects,
    }, "Student projects retrieved successfully")
  );
});

/**
 * Get project details with template metadata (ownership enforced).
 */
export const getProjectDetails = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId } = req.params;

  const result = await projectStudioService.getStudentProjectById(userId, projectId);

  return res.status(200).json(
    new ApiResponse(200, result, "Project details retrieved successfully")
  );
});

/**
 * Update milestone status.
 */
export const updateMilestone = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId, milestoneId } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    throw new ApiError(400, "Milestone status is required");
  }

  const project = await projectStudioService.updateMilestoneProgress(
    userId,
    projectId,
    milestoneId,
    status,
    notes
  );

  return res.status(200).json(
    new ApiResponse(200, project, "Milestone progress updated successfully")
  );
});

/**
 * Save draft deliverables and written explanations.
 */
export const saveDeliverables = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId } = req.params;
  const { deliverables, writtenExplanations } = req.body;

  const project = await projectStudioService.saveProjectDeliverables(userId, projectId, {
    deliverables,
    writtenExplanations,
  });

  return res.status(200).json(
    new ApiResponse(200, project, "Deliverables saved successfully")
  );
});

/**
 * Upload deliverable file attachment.
 */
export const uploadDeliverableFile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId } = req.params;
  const { key, label, type, notes } = req.body;

  if (!req.file) {
    throw new ApiError(400, "Deliverable file attachment is required");
  }

  if (!key) {
    throw new ApiError(400, "Deliverable key is required");
  }

  // Convert buffer to data URI for safe, self-contained persistence without external cloud storage
  const base64Data = req.file.buffer.toString("base64");
  const fileUrl = `data:${req.file.mimetype};base64,${base64Data}`;

  const deliverableUpdate = {
    key,
    label: label || req.file.originalname,
    type: type || "report",
    fileUrl,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    notes: notes || "",
  };

  const project = await projectStudioService.saveProjectDeliverables(userId, projectId, {
    deliverables: [deliverableUpdate],
  });

  return res.status(200).json(
    new ApiResponse(200, {
      deliverable: deliverableUpdate,
      project,
    }, "Deliverable file uploaded successfully")
  );
});

/**
 * Submit project for rubric-based evaluation.
 */
export const submitForReview = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId } = req.params;

  const project = await projectStudioService.submitProjectForReview(userId, projectId);

  return res.status(200).json(
    new ApiResponse(200, project, "Project submitted and evaluated successfully")
  );
});

/**
 * Toggle portfolio visibility for a completed project.
 */
export const togglePortfolioVisibility = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId } = req.params;
  const { visible } = req.body;

  const project = await projectStudioService.togglePortfolioVisibility(
    userId,
    projectId,
    Boolean(visible)
  );

  return res.status(200).json(
    new ApiResponse(200, project, "Portfolio visibility updated successfully")
  );
});

/**
 * Sync completed project to resume showcase.
 */
export const syncToResume = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { projectId } = req.params;

  const result = await projectStudioService.syncToResumeShowcase(userId, projectId);

  return res.status(200).json(
    new ApiResponse(200, result, "Project successfully synced to Resume showcase")
  );
});

/**
 * Get authenticated student's completed portfolio projects.
 */
export const getMyPortfolioProjects = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const projects = await projectStudioService.getPortfolioProjects(userId, false);

  return res.status(200).json(
    new ApiResponse(200, { count: projects.length, projects }, "Portfolio projects retrieved")
  );
});

/**
 * Get public portfolio projects for a given user.
 */
export const getPublicPortfolioProjects = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const projects = await projectStudioService.getPortfolioProjects(userId, true);

  return res.status(200).json(
    new ApiResponse(200, { count: projects.length, projects }, "Public portfolio projects retrieved")
  );
});
