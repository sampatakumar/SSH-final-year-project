import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { ApiError } from "../../../core/errors/ApiError.js";
import { CANONICAL_TOOL_REGISTRY, TOOL_REGISTRY_MAP } from "../constants/toolRegistry.js";
import { executeTool } from "../services/toolExecution.service.js";
import { ToolActivityRecord } from "../models/toolActivityRecord.models.js";

/**
 * GET /api/v1/tools
 * Get canonical tool registry with branch, category, and keyword filtering.
 */
export const getToolCatalogController = asyncHandler(async (req, res) => {
  const { branch, category, search, discipline } = req.query;

  // Resolve active student branch context
  const studentBranch =
    branch ||
    req.user?.academic?.branch ||
    req.user?.academicBranch ||
    req.user?.branch ||
    null;

  let tools = [...CANONICAL_TOOL_REGISTRY];

  // 1. Filter by branch slug (or include shared tools with "all")
  if (studentBranch && studentBranch !== "all") {
    const normalizedBranch = String(studentBranch).toLowerCase().trim();
    tools = tools.filter((tool) => {
      if (tool.branchSlugs.includes("all")) return true;
      return tool.branchSlugs.some(
        (slug) => slug.toLowerCase() === normalizedBranch || normalizedBranch.includes(slug.toLowerCase())
      );
    });
  }

  // 2. Filter by category
  if (category && category !== "All") {
    tools = tools.filter((tool) => tool.category === category);
  }

  // 3. Filter by discipline
  if (discipline && discipline !== "All") {
    tools = tools.filter((tool) => tool.academicDiscipline === discipline);
  }

  // 4. Search keyword in displayName, shortDescription, intendedTask
  if (search && typeof search === "string" && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    tools = tools.filter(
      (tool) =>
        tool.displayName.toLowerCase().includes(q) ||
        tool.shortDescription.toLowerCase().includes(q) ||
        tool.intendedTask.toLowerCase().includes(q) ||
        tool.academicDiscipline.toLowerCase().includes(q)
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tools,
        total: tools.length,
        studentBranch,
        availableCategories: Array.from(new Set(CANONICAL_TOOL_REGISTRY.map((t) => t.category))),
        availableDisciplines: Array.from(new Set(CANONICAL_TOOL_REGISTRY.map((t) => t.academicDiscipline))),
      },
      "Tool catalog retrieved successfully"
    )
  );
});

/**
 * GET /api/v1/tools/:toolId
 * Get individual tool specification by tool ID.
 */
export const getToolByIdController = asyncHandler(async (req, res) => {
  const { toolId } = req.params;
  const tool = TOOL_REGISTRY_MAP.get(toolId);

  if (!tool) {
    throw new ApiError(404, `Tool '${toolId}' not found in canonical catalog.`);
  }

  return res.status(200).json(
    new ApiResponse(200, { tool }, "Tool specification retrieved successfully")
  );
});

/**
 * POST /api/v1/tools/:toolId/execute
 * Execute tool with user-provided parameters, perform deterministic math or hybrid AI reasoning,
 * and persist activity record.
 */
export const executeToolController = asyncHandler(async (req, res) => {
  const { toolId } = req.params;
  const inputs = req.body?.inputs || req.body || {};
  const tool = TOOL_REGISTRY_MAP.get(toolId);

  if (!tool) {
    throw new ApiError(404, `Tool '${toolId}' not found in canonical catalog.`);
  }

  // Execute calculation or workflow
  let executionResult;
  try {
    executionResult = await executeTool(toolId, inputs, req.user);
  } catch (err) {
    // Record failed execution attempt if user authenticated
    if (req.user?._id) {
      await ToolActivityRecord.create({
        user: req.user._id,
        toolId: tool.toolId,
        toolDisplayName: tool.displayName,
        toolVersion: tool.version,
        academicDiscipline: tool.academicDiscipline,
        inputParameters: inputs,
        resultData: {},
        executionMode: tool.executionMode,
        status: "error",
        errorMessage: err.message,
      }).catch(() => null);
    }
    throw new ApiError(400, `Execution error in ${tool.displayName}: ${err.message}`);
  }

  // Persist successful activity record
  let savedRecord = null;
  if (req.user?._id) {
    try {
      savedRecord = await ToolActivityRecord.create({
        user: req.user._id,
        toolId: tool.toolId,
        toolDisplayName: tool.displayName,
        toolVersion: tool.version,
        academicDiscipline: tool.academicDiscipline,
        inputParameters: inputs,
        resultData: executionResult.resultData,
        executionMode: tool.executionMode,
        status: "success",
      });
    } catch (saveErr) {
      console.warn("[tools] Failed to persist activity record:", saveErr.message);
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...executionResult,
        activityRecordId: savedRecord?._id || null,
        safetyDisclaimers: tool.safetyDisclaimers,
        limitations: tool.limitations,
      },
      "Tool executed successfully"
    )
  );
});

/**
 * GET /api/v1/tools/history/my-activity
 * Retrieve student's recent tool usage history.
 */
export const getMyToolActivityController = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Authentication required to view activity history.");
  }

  const limit = Math.min(50, Math.max(1, Number(req.query?.limit) || 20));
  const records = await ToolActivityRecord.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return res.status(200).json(
    new ApiResponse(200, { records, total: records.length }, "Tool history retrieved successfully")
  );
});

/**
 * PATCH /api/v1/tools/history/:recordId/portfolio
 * Toggle portfolio saving preference on a student's tool activity record.
 */
export const togglePortfolioSaveController = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { recordId } = req.params;
  const { headline, summary, tags, isSaved } = req.body;

  if (!userId) {
    throw new ApiError(401, "Authentication required to update portfolio.");
  }

  const record = await ToolActivityRecord.findOne({ _id: recordId, user: userId });
  if (!record) {
    throw new ApiError(404, "Tool activity record not found or access denied.");
  }

  const nextState = isSaved !== undefined ? Boolean(isSaved) : !record.isSavedToPortfolio;
  record.isSavedToPortfolio = nextState;

  if (nextState) {
    record.portfolioMetadata = {
      headline: headline || `${record.toolDisplayName} Project Artifact`,
      summary: summary || `Calculated educational exercise in ${record.academicDiscipline}.`,
      tags: Array.isArray(tags) ? tags : [record.academicDiscipline],
      savedAt: new Date(),
    };
  } else {
    record.portfolioMetadata = {
      headline: "",
      summary: "",
      tags: [],
      savedAt: null,
    };
  }

  await record.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        recordId: record._id,
        isSavedToPortfolio: record.isSavedToPortfolio,
        portfolioMetadata: record.portfolioMetadata,
      },
      record.isSavedToPortfolio ? "Saved to student portfolio" : "Removed from student portfolio"
    )
  );
});
