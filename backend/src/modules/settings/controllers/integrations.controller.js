import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { settingsService } from "../services/settings.service.js";

/**
 * GET /api/v1/integrations
 * Overview of all external integrations
 */
export const getIntegrations = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user._id);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        github: settings.githubIntegration || { connected: false },
      },
      "Integrations retrieved successfully"
    )
  );
});

/**
 * GET /api/v1/integrations/github
 * Status of GitHub integration
 */
export const getGitHubStatus = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user._id);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        integration: settings.githubIntegration || { connected: false },
      },
      "GitHub integration status retrieved"
    )
  );
});

/**
 * GET /api/v1/integrations/github/connect
 * Initiate GitHub OAuth flow
 */
export const connectGitHub = asyncHandler(async (req, res) => {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:8000";
  const hostUrl = `${protocol}://${host}`;

  const { authUrl, state } = settingsService.generateGitHubOAuthUrl(req.user._id, hostUrl);
  return res.status(200).json(
    new ApiResponse(
      200,
      { authUrl, state },
      "GitHub OAuth authorization URL generated"
    )
  );
});

/**
 * GET /api/v1/integrations/github/callback
 * Handle GitHub OAuth code exchange and redirect to frontend
 */
export const handleGitHubCallback = asyncHandler(async (req, res) => {
  const { code, state, error, error_description } = req.query;

  let frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || frontendUrl === "*") {
    const cors = process.env.CORS_ORIGIN?.split(",")[0]?.trim();
    if (cors && cors !== "*" && cors.startsWith("http")) {
      frontendUrl = cors;
    } else {
      frontendUrl = "http://localhost:8081";
    }
  }
  frontendUrl = frontendUrl.replace(/\/+$/, "");

  if (error) {
    console.warn("GitHub OAuth callback error:", error, error_description);
    return res.redirect(`${frontendUrl}/dashboard/settings?github_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/dashboard/settings?github_error=missing_parameters`);
  }

  try {
    const { username } = await settingsService.handleGitHubCallback(code, state);
    return res.redirect(`${frontendUrl}/dashboard/settings?github=connected&username=${encodeURIComponent(username)}`);
  } catch (err) {
    console.error("GitHub callback processing failed:", err);
    return res.redirect(`${frontendUrl}/dashboard/settings?github_error=${encodeURIComponent(err.message || "Failed to link GitHub")}`);
  }
});

/**
 * POST /api/v1/integrations/github/sync
 * Manually trigger synchronization of GitHub repositories and signals
 */
export const syncGitHub = asyncHandler(async (req, res) => {
  const result = await settingsService.syncGitHubData(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "GitHub repositories and intelligence synchronized successfully")
  );
});

/**
 * DELETE /api/v1/integrations/github
 * Disconnect GitHub account
 */
export const disconnectGitHub = asyncHandler(async (req, res) => {
  const result = await settingsService.disconnectGitHub(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "GitHub account disconnected successfully")
  );
});
