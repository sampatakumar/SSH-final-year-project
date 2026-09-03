import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { settingsService } from "../services/settings.service.js";

/**
 * GET /api/v1/settings
 * Retrieve user configuration preferences
 */
export const getUserSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, { settings }, "User settings retrieved successfully")
  );
});

/**
 * PATCH /api/v1/settings
 * Update user configuration preferences
 */
export const updateUserSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.user._id, req.body);
  return res.status(200).json(
    new ApiResponse(200, { settings }, "User settings updated successfully")
  );
});
