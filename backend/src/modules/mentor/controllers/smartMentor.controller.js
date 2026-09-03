import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { smartMentorService } from "../services/smart-mentor.service.js";
import { smartMentorContextService } from "../services/smart-mentor-context.service.js";

/**
 * GET /api/v1/mentor/context
 * Retrieve compact, unified user context and proactive insights.
 */
export const getMentorContext = asyncHandler(async (req, res) => {
  const context = await smartMentorContextService.getUnifiedUserContext(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, { context }, "Mentor user context retrieved successfully")
  );
});

/**
 * POST /api/v1/mentor/refresh-context
 * Invalidate cached context and synthesize fresh signals.
 */
export const refreshMentorContext = asyncHandler(async (req, res) => {
  const context = await smartMentorContextService.getUnifiedUserContext(req.user._id, {
    forceRefresh: true,
  });
  return res.status(200).json(
    new ApiResponse(200, { context }, "Mentor context refreshed successfully")
  );
});

/**
 * POST /api/v1/mentor/chat
 * Standard JSON chat interaction with automatic fallback.
 */
export const handleMentorChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const result = await smartMentorService.processChatMessage(req.user._id, message);
  return res.status(200).json(
    new ApiResponse(200, result, "Mentor guidance generated successfully")
  );
});

/**
 * POST /api/v1/mentor/chat/stream
 * Server-Sent Events (SSE) streaming chat endpoint with seamless local fallback.
 */
export const handleMentorChatStream = async (req, res) => {
  const { message } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  await smartMentorService.streamChatMessage(req.user._id, message, res);
};

/**
 * GET /api/v1/mentor/history
 * Retrieve user's past mentor chat history.
 */
export const getMentorHistory = asyncHandler(async (req, res) => {
  const conversation = await smartMentorService.getConversation(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, { conversation }, "Mentor conversation history retrieved successfully")
  );
});

/**
 * DELETE /api/v1/mentor/history
 * Clear user's conversation history.
 */
export const clearMentorHistory = asyncHandler(async (req, res) => {
  const result = await smartMentorService.clearHistory(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "Mentor conversation history cleared successfully")
  );
});
