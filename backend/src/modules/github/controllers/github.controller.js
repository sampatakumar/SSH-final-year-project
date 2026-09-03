import { fetchGitHubProfileData } from "../services/github.service.js";
import { generateGitHubInsights } from "../services/githubAi.service.js";
import { buildCareerMentorPlan } from "../services/githubCareer.service.js";
import { answerMentorQuestion } from "../services/githubMentorAi.service.js";
import {
  analyzeRepositoryQuality,
  generateGroundedReadmeDraft,
} from "../services/githubProjectCoach.service.js";
import { extractGitHubEvidence } from "../adapters/githubEvidenceAdapter.js";
import { GitHubAnalysis } from "../models/githubAnalysis.models.js";
import { UserSettings } from "../../settings/models/userSettings.models.js";
import { ApiError, GitHubError } from "../../../core/errors/ApiError.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { asyncHandler } from "../../../core/errors/asyncHandler.js";

/**
 * Fetch and analyze a GitHub username.
 * If user is authenticated, saves analysis into MongoDB.
 */
export const analyzeProfile = asyncHandler(async (req, res) => {
  let username = req.params.username || req.query.username || req.body?.username;

  // Auto-detect username from connected GitHub integration or user profile
  if (!username && req.user?._id) {
    const settings = await UserSettings.findOne({ owner: req.user._id }).lean().catch(() => null);
    if (settings?.githubIntegration?.connected && settings.githubIntegration.githubUsername) {
      username = settings.githubIntegration.githubUsername;
    } else if (req.user.githubUrl) {
      const match = req.user.githubUrl.match(/github\.com\/([A-Za-z0-9_.-]+)/);
      if (match) username = match[1];
    }
  }

  if (!username) {
    throw new ApiError(400, "GitHub username is required.");
  }

  const profileData = await fetchGitHubProfileData(username);

  // If authenticated user, save or update GitHubAnalysis in database
  let savedRecord = null;
  if (req.user?._id) {
    savedRecord = await GitHubAnalysis.findOneAndUpdate(
      { owner: req.user._id, githubUsername: username.toLowerCase() },
      {
        owner: req.user._id,
        githubUsername: username.toLowerCase(),
        profile: profileData.profile,
        repositories: profileData.repositories,
        languages: profileData.languages,
        dominantLanguage: profileData.dominantLanguage,
        aggregateStats: profileData.aggregateStats,
        recentEvents: profileData.recentEvents,
        analyzedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        ...profileData,
        analysisId: savedRecord?._id || null
      },
      "GitHub profile analyzed successfully"
    )
  );
});

/**
 * Generate AI Insights for GitHub profile.
 */
export const getAIInsights = asyncHandler(async (req, res) => {
  const { username, profileData } = req.body;

  let data = profileData;
  if (!data && username) {
    data = await fetchGitHubProfileData(username);
  }

  if (!data) {
    throw new ApiError(400, "GitHub profile data or username is required.");
  }

  const insights = await generateGitHubInsights(data);

  // Update saved analysis record if user is authenticated
  if (req.user?._id && (username || data.username)) {
    const targetUser = (username || data.username).toLowerCase();
    await GitHubAnalysis.findOneAndUpdate(
      { owner: req.user._id, githubUsername: targetUser },
      { aiInsights: insights }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { insights }, "AI insights generated successfully")
  );
});



/**
 * Compare two GitHub profiles.
 */
export const compareProfiles = asyncHandler(async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    throw new ApiError(400, "Both user1 and user2 query parameters are required.");
  }

  const [data1, data2] = await Promise.all([
    fetchGitHubProfileData(user1),
    fetchGitHubProfileData(user2),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { user1: data1, user2: data2 },
      "Profile comparison completed"
    )
  );
});

/**
 * Get latest saved analysis for current authenticated user.
 */
export const getLatestUserAnalysis = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Authentication required.");
  }

  let analysis = await GitHubAnalysis.findOne({ owner: req.user._id })
    .sort({ updatedAt: -1 });

  if (!analysis) {
    const settings = await UserSettings.findOne({ owner: req.user._id }).lean().catch(() => null);
    if (settings?.githubIntegration?.connected && settings.githubIntegration.githubUsername) {
      const profileData = await fetchGitHubProfileData(settings.githubIntegration.githubUsername);
      analysis = await GitHubAnalysis.findOneAndUpdate(
        { owner: req.user._id, githubUsername: settings.githubIntegration.githubUsername.toLowerCase() },
        {
          owner: req.user._id,
          githubUsername: settings.githubIntegration.githubUsername.toLowerCase(),
          profile: profileData.profile,
          repositories: profileData.repositories,
          languages: profileData.languages,
          dominantLanguage: profileData.dominantLanguage,
          aggregateStats: profileData.aggregateStats,
          recentEvents: profileData.recentEvents,
          analyzedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { analysis }, "Latest GitHub analysis")
  );
});

/**
 * Extract Smart Skill Hub skill evidence from GitHub profile.
 */
export const getSkillEvidence = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username;
  if (!username) {
    throw new ApiError(400, "GitHub username is required.");
  }

  const profileData = await fetchGitHubProfileData(username);
  const evidencePackage = extractGitHubEvidence({
    userId: req.user?._id || "anonymous-developer",
    githubData: profileData,
  });

  return res.status(200).json(
    new ApiResponse(200, { evidence: evidencePackage }, "GitHub skill evidence extracted successfully")
  );
});

/**
 * Get Personalized Career Mentor plan for a developer profile.
 */
export const getCareerMentorDashboard = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username || req.body?.username;
  const targetRole = req.query.role || req.body?.role || "Full Stack Developer";

  if (!username) {
    throw new ApiError(400, "GitHub username is required.");
  }

  let profileData = req.body?.profileData;
  if (!profileData) {
    profileData = await fetchGitHubProfileData(username);
  }

  const mentorPlan = buildCareerMentorPlan({
    githubData: profileData,
    targetRole,
  });

  // Save to database if user is authenticated
  if (req.user?._id) {
    const targetUser = username.toLowerCase();
    await GitHubAnalysis.findOneAndUpdate(
      { owner: req.user._id, githubUsername: targetUser },
      { careerMentor: mentorPlan }
    );
  }

  return res.status(200).json(
    new ApiResponse(200, { mentor: mentorPlan }, "Personal Career Mentor plan generated successfully")
  );
});

/**
 * Ask a career development question to the Personal Career Mentor.
 */
export const askCareerMentor = asyncHandler(async (req, res) => {
  const username = req.params.username || req.body?.username;
  const question = req.body?.question;
  const targetRole = req.body?.role || req.query.role || "Full Stack Developer";

  if (!username || !question) {
    throw new ApiError(400, "Both GitHub username and question are required.");
  }

  let profileData = req.body?.profileData;
  if (!profileData) {
    profileData = await fetchGitHubProfileData(username);
  }

  const answer = await answerMentorQuestion({
    question,
    githubData: profileData,
    targetRole,
  });

  return res.status(200).json(
    new ApiResponse(200, { answer }, "Mentor response generated successfully")
  );
});

/**
 * Get Mentor Action Plan.
 */
export const getMentorActionPlan = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username;
  const targetRole = req.query.role || "Full Stack Developer";

  if (!username) {
    throw new ApiError(400, "GitHub username is required.");
  }

  const profileData = await fetchGitHubProfileData(username);
  const mentorPlan = buildCareerMentorPlan({ githubData: profileData, targetRole });

  return res.status(200).json(
    new ApiResponse(200, { nextActions: mentorPlan.nextActions, weeklyPlan: mentorPlan.weeklyPlan }, "Mentor action plan")
  );
});

/**
 * Get Mentor GitHub Improvement Plan.
 */
export const getMentorGitHubPlan = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username;
  const targetRole = req.query.role || "Full Stack Developer";

  if (!username) {
    throw new ApiError(400, "GitHub username is required.");
  }

  const profileData = await fetchGitHubProfileData(username);
  const mentorPlan = buildCareerMentorPlan({ githubData: profileData, targetRole });

  return res.status(200).json(
    new ApiResponse(200, { githubImprovementPlan: mentorPlan.githubImprovementPlan, repositoryActionCenter: mentorPlan.repositoryActionCenter }, "GitHub improvement plan")
  );
});

/**
 * Get Mentor Career Path.
 */
export const getMentorCareerPath = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username;
  const targetRole = req.query.role || "Full Stack Developer";

  if (!username) {
    throw new ApiError(400, "GitHub username is required.");
  }

  const profileData = await fetchGitHubProfileData(username);
  const mentorPlan = buildCareerMentorPlan({ githubData: profileData, targetRole });

  return res.status(200).json(
    new ApiResponse(200, { careerPath: mentorPlan.careerPath, milestones: mentorPlan.milestones }, "Career path milestones")
  );
});

/**
 * Get detailed repository quality audit and recruiter scorecard for a specific repository.
 */
export const getRepositoryQualityDetails = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username;
  const repoName = req.params.repoName;
  const targetRole = req.query.role || "Full Stack Developer";

  if (!username || !repoName) {
    throw new ApiError(400, "Both GitHub username and repository name are required.");
  }

  const profileData = await fetchGitHubProfileData(username);
  const repo = (profileData.repositories || []).find(
    (r) => r.name.toLowerCase() === repoName.toLowerCase()
  );

  if (!repo) {
    throw new ApiError(404, `Repository "${repoName}" not found for user "${username}".`);
  }

  const qualityAudit = analyzeRepositoryQuality(repo, targetRole);

  return res.status(200).json(
    new ApiResponse(200, { qualityAudit }, "Repository quality audit completed")
  );
});

/**
 * Generate a grounded professional README draft for a specific repository.
 */
export const generateProjectReadme = asyncHandler(async (req, res) => {
  const username = req.params.username || req.query.username || req.body?.username;
  const repoName = req.params.repoName || req.body?.repoName;
  const targetRole = req.body?.role || req.query.role || "Full Stack Developer";

  if (!username || !repoName) {
    throw new ApiError(400, "Both GitHub username and repository name are required.");
  }

  let profileData = req.body?.profileData;
  if (!profileData) {
    profileData = await fetchGitHubProfileData(username);
  }

  const repo = (profileData.repositories || []).find(
    (r) => r.name.toLowerCase() === repoName.toLowerCase()
  );

  if (!repo) {
    throw new ApiError(404, `Repository "${repoName}" not found.`);
  }

  const readmeDraft = generateGroundedReadmeDraft(repo, targetRole);
  const qualityAudit = analyzeRepositoryQuality(repo, targetRole);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        repoName: repo.name,
        suggestedDescription: qualityAudit.suggestedDescription,
        readmeMarkdown: readmeDraft,
        scorecard: qualityAudit.scorecard,
        recruiterEvaluation: qualityAudit.recruiterEvaluation,
      },
      "Grounded README draft generated successfully"
    )
  );
});
