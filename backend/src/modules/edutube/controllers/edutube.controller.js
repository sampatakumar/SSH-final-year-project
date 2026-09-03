/**
 * EduTube Controller
 * Handles video search, video metadata, watch history, playback progress,
 * saved bookmarks, custom playlists, and video notes.
 */

import { asyncHandler } from "../../../core/errors/asyncHandler.js";
import { ApiResponse } from "../../../core/errors/ApiResponse.js";
import { EduTubeError, ApiError } from "../../../core/errors/ApiError.js";
import { edutubeSearchService } from "../services/edutube-search.service.js";
import { edutubePersistenceService } from "../services/edutube-persistence.service.js";
import { edutubeRecommendationService } from "../services/edutube-recommendation.service.js";

// ==========================================
// PHASE 2: SEARCH & VIDEO DETAILS (PUBLIC / AUTH)
// ==========================================

export const searchEducationalVideos = asyncHandler(async (req, res) => {
  const { q, language, regionCode, pageToken, maxResults, level, duration, sort } = req.query;

  if (!q || typeof q !== "string" || !q.trim()) {
    throw new EduTubeError(400, "Search query 'q' parameter is required and cannot be empty.");
  }

  const parsedMaxResults = maxResults ? parseInt(maxResults, 10) : 10;
  if (isNaN(parsedMaxResults) || parsedMaxResults < 1 || parsedMaxResults > 50) {
    throw new EduTubeError(400, "'maxResults' must be an integer between 1 and 50.");
  }

  const result = await edutubeSearchService.searchVideos({
    q: q.trim(),
    language,
    regionCode,
    pageToken,
    maxResults: parsedMaxResults,
    level,
    duration,
    sort,
  });

  return res.status(200).json(
    new ApiResponse(200, result, "Educational videos retrieved successfully")
  );
});

export const getVideoDetails = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || typeof videoId !== "string" || !videoId.trim()) {
    throw new EduTubeError(400, "Parameter 'videoId' is required.");
  }

  const result = await edutubeSearchService.getVideoById(videoId.trim());

  return res.status(200).json(
    new ApiResponse(200, result, "Video details retrieved successfully")
  );
});

// ==========================================
// PHASE 3B: WATCH HISTORY
// ==========================================

export const recordHistory = asyncHandler(async (req, res) => {
  const history = await edutubePersistenceService.recordHistory(req.user._id, req.body);
  return res.status(200).json(
    new ApiResponse(200, { history }, "Watch history recorded successfully")
  );
});

export const getHistory = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await edutubePersistenceService.getHistory(req.user._id, { page, limit });
  return res.status(200).json(
    new ApiResponse(200, result, "Watch history retrieved successfully")
  );
});

export const deleteHistoryItem = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const result = await edutubePersistenceService.deleteHistoryItem(req.user._id, videoId);
  return res.status(200).json(
    new ApiResponse(200, result, "History record deleted successfully")
  );
});

export const clearHistory = asyncHandler(async (req, res) => {
  const result = await edutubePersistenceService.clearHistory(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "Watch history cleared successfully")
  );
});

// ==========================================
// PHASE 3B: PLAYBACK PROGRESS & CONTINUE LEARNING
// ==========================================

export const saveProgress = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { positionSeconds, durationSeconds, completed } = req.body;

  const progress = await edutubePersistenceService.saveProgress(req.user._id, videoId, {
    positionSeconds,
    durationSeconds,
    completed,
  });

  return res.status(200).json(
    new ApiResponse(200, { progress }, "Playback progress saved successfully")
  );
});

export const getProgress = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const progress = await edutubePersistenceService.getProgress(req.user._id, videoId);
  return res.status(200).json(
    new ApiResponse(200, progress, "Playback progress retrieved successfully")
  );
});

export const getContinueLearning = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const result = await edutubePersistenceService.getContinueLearning(req.user._id, { limit });
  return res.status(200).json(
    new ApiResponse(200, result, "Continue learning items retrieved successfully")
  );
});

// ==========================================
// PHASE 3B: SAVED VIDEOS (BOOKMARKS)
// ==========================================

export const saveVideo = asyncHandler(async (req, res) => {
  const saved = await edutubePersistenceService.saveVideo(req.user._id, req.body);
  return res.status(201).json(
    new ApiResponse(201, { saved }, "Video saved to bookmarks successfully")
  );
});

export const getSavedVideos = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await edutubePersistenceService.getSavedVideos(req.user._id, { page, limit });
  return res.status(200).json(
    new ApiResponse(200, result, "Saved videos retrieved successfully")
  );
});

export const unsaveVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const result = await edutubePersistenceService.unsaveVideo(req.user._id, videoId);
  return res.status(200).json(
    new ApiResponse(200, result, "Video removed from saved bookmarks")
  );
});

export const isVideoSaved = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const result = await edutubePersistenceService.isVideoSaved(req.user._id, videoId);
  return res.status(200).json(
    new ApiResponse(200, result, "Saved status retrieved successfully")
  );
});

// ==========================================
// PHASE 3B: CUSTOM PLAYLISTS
// ==========================================

export const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const playlist = await edutubePersistenceService.createPlaylist(req.user._id, {
    name,
    description,
  });
  return res.status(201).json(
    new ApiResponse(201, { playlist }, "Playlist created successfully")
  );
});

export const getPlaylists = asyncHandler(async (req, res) => {
  const result = await edutubePersistenceService.getPlaylists(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "Playlists retrieved successfully")
  );
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const result = await edutubePersistenceService.getPlaylistById(req.user._id, playlistId);
  return res.status(200).json(
    new ApiResponse(200, result, "Playlist details retrieved successfully")
  );
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  const playlist = await edutubePersistenceService.updatePlaylist(req.user._id, playlistId, {
    name,
    description,
  });
  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Playlist updated successfully")
  );
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const result = await edutubePersistenceService.deletePlaylist(req.user._id, playlistId);
  return res.status(200).json(
    new ApiResponse(200, result, "Playlist deleted successfully")
  );
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const playlist = await edutubePersistenceService.addVideoToPlaylist(
    req.user._id,
    playlistId,
    req.body
  );
  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Video added to playlist successfully")
  );
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const playlist = await edutubePersistenceService.removeVideoFromPlaylist(
    req.user._id,
    playlistId,
    videoId
  );
  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Video removed from playlist successfully")
  );
});

export const reorderPlaylistVideos = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { videoIds } = req.body;
  const playlist = await edutubePersistenceService.reorderPlaylistVideos(
    req.user._id,
    playlistId,
    videoIds
  );
  return res.status(200).json(
    new ApiResponse(200, { playlist }, "Playlist videos reordered successfully")
  );
});

// ==========================================
// PHASE 3B: VIDEO NOTES
// ==========================================

export const createVideoNote = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content, timestampSeconds } = req.body;
  const note = await edutubePersistenceService.createNote(req.user._id, videoId, {
    content,
    timestampSeconds,
  });
  return res.status(201).json(
    new ApiResponse(201, { note }, "Video note created successfully")
  );
});

export const getVideoNotes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const result = await edutubePersistenceService.getVideoNotes(req.user._id, videoId);
  return res.status(200).json(
    new ApiResponse(200, result, "Video notes retrieved successfully")
  );
});

export const updateVideoNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const { content, timestampSeconds } = req.body;
  const note = await edutubePersistenceService.updateNote(req.user._id, noteId, {
    content,
    timestampSeconds,
  });
  return res.status(200).json(
    new ApiResponse(200, { note }, "Video note updated successfully")
  );
});

export const deleteVideoNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const result = await edutubePersistenceService.deleteNote(req.user._id, noteId);
  return res.status(200).json(
    new ApiResponse(200, result, "Video note deleted successfully")
  );
});

// ==========================================
// PHASE 3B: LEARNING STATS
// ==========================================

export const getLearningStats = asyncHandler(async (req, res) => {
  const result = await edutubePersistenceService.getLearningStats(req.user._id);
  return res.status(200).json(
    new ApiResponse(200, result, "Learning stats retrieved successfully")
  );
});

// ==========================================
// PHASE 3C: PERSONALIZED AI LEARNING ENGINE
// ==========================================

export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const { refresh } = req.query;
  const result = await edutubeRecommendationService.getPersonalizedRecommendations(
    req.user._id,
    { forceRefresh: refresh === "true" || refresh === "1" }
  );
  return res.status(200).json(
    new ApiResponse(200, result, "Personalized learning recommendations retrieved successfully")
  );
});

export const refreshPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const result = await edutubeRecommendationService.getPersonalizedRecommendations(
    req.user._id,
    { forceRefresh: true }
  );
  return res.status(200).json(
    new ApiResponse(200, result, "Personalized recommendations refreshed successfully")
  );
});

export const recordRecommendationFeedback = asyncHandler(async (req, res) => {
  const { videoId, action, topic } = req.body;
  const feedback = await edutubeRecommendationService.recordFeedback(req.user._id, {
    videoId,
    action,
    topic,
  });
  return res.status(201).json(
    new ApiResponse(201, { feedback }, "Feedback recorded successfully")
  );
});

export const generateLearningTrack = asyncHandler(async (req, res) => {
  const { topic, targetRole } = req.body;
  const track = await edutubeRecommendationService.generateLearningTrack(req.user._id, {
    topic,
    targetRole,
  });
  return res.status(200).json(
    new ApiResponse(200, { track }, "AI learning track generated successfully")
  );
});

export const saveTrackAsPlaylist = asyncHandler(async (req, res) => {
  const { name, description, track } = req.body;
  const result = await edutubeRecommendationService.saveTrackAsPlaylist(req.user._id, {
    name,
    description,
    track,
  });
  return res.status(201).json(
    new ApiResponse(201, result, "Learning track saved as playlist successfully")
  );
});

