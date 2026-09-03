/**
 * EduTube Express Router
 * Rate-limited educational video discovery, watch history, playback progress,
 * saved bookmarks, custom playlists, video notes, and personalized AI learning engine.
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { verifyFirebaseToken } from "../../../core/auth/auth.middleware.js";
import {
  searchEducationalVideos,
  getVideoDetails,
  // Phase 3B: Watch History
  recordHistory,
  getHistory,
  deleteHistoryItem,
  clearHistory,
  // Phase 3B: Playback Progress & Continue Learning
  saveProgress,
  getProgress,
  getContinueLearning,
  // Phase 3B: Saved Videos (Bookmarks)
  saveVideo,
  getSavedVideos,
  unsaveVideo,
  isVideoSaved,
  // Phase 3B: Custom Playlists
  createPlaylist,
  getPlaylists,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
  // Phase 3B: Video Notes
  createVideoNote,
  getVideoNotes,
  updateVideoNote,
  deleteVideoNote,
  // Phase 3B: Learning Stats
  getLearningStats,
  // Phase 3C: Personalized AI Learning Engine
  getPersonalizedRecommendations,
  refreshPersonalizedRecommendations,
  recordRecommendationFeedback,
  generateLearningTrack,
  saveTrackAsPlaylist,
} from "../controllers/edutube.controller.js";

const router = Router();

// Dedicated rate limiter for EduTube video discovery requests (60 req / 15 min per IP)
const edutubeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: "Too many EduTube video requests. Please wait a moment before searching again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// 1. PUBLIC / CACHED VIDEO DISCOVERY
// ==========================================
router.get("/search", edutubeLimiter, searchEducationalVideos);
router.get("/video/:videoId", edutubeLimiter, getVideoDetails);

// ==========================================
// 2. AUTHENTICATED PERSONAL LEARNING ROUTES
// ==========================================

// Watch History
router.post("/history", verifyFirebaseToken, recordHistory);
router.get("/history", verifyFirebaseToken, getHistory);
router.delete("/history/:videoId", verifyFirebaseToken, deleteHistoryItem);
router.delete("/history", verifyFirebaseToken, clearHistory);

// Playback Progress & Continue Learning
router.put("/progress/:videoId", verifyFirebaseToken, saveProgress);
router.get("/progress/:videoId", verifyFirebaseToken, getProgress);
router.get("/continue-learning", verifyFirebaseToken, getContinueLearning);

// Saved Videos (Bookmarks)
router.post("/saved", verifyFirebaseToken, saveVideo);
router.get("/saved", verifyFirebaseToken, getSavedVideos);
router.delete("/saved/:videoId", verifyFirebaseToken, unsaveVideo);
router.get("/saved/:videoId", verifyFirebaseToken, isVideoSaved);

// Custom Playlists
router.post("/playlists", verifyFirebaseToken, createPlaylist);
router.get("/playlists", verifyFirebaseToken, getPlaylists);
router.get("/playlists/:playlistId", verifyFirebaseToken, getPlaylistById);
router.patch("/playlists/:playlistId", verifyFirebaseToken, updatePlaylist);
router.delete("/playlists/:playlistId", verifyFirebaseToken, deletePlaylist);
router.post("/playlists/:playlistId/videos", verifyFirebaseToken, addVideoToPlaylist);
router.delete("/playlists/:playlistId/videos/:videoId", verifyFirebaseToken, removeVideoFromPlaylist);
router.patch("/playlists/:playlistId/videos/reorder", verifyFirebaseToken, reorderPlaylistVideos);

// Video Notes
router.post("/videos/:videoId/notes", verifyFirebaseToken, createVideoNote);
router.get("/videos/:videoId/notes", verifyFirebaseToken, getVideoNotes);
router.patch("/notes/:noteId", verifyFirebaseToken, updateVideoNote);
router.delete("/notes/:noteId", verifyFirebaseToken, deleteVideoNote);

// Learning Stats
router.get("/stats", verifyFirebaseToken, getLearningStats);

// ==========================================
// 3. PHASE 3C: PERSONALIZED AI LEARNING ENGINE
// ==========================================
router.get("/recommendations", verifyFirebaseToken, getPersonalizedRecommendations);
router.post("/recommendations/refresh", verifyFirebaseToken, refreshPersonalizedRecommendations);
router.post("/recommendations/feedback", verifyFirebaseToken, recordRecommendationFeedback);
router.post("/tracks/generate", verifyFirebaseToken, generateLearningTrack);
router.post("/tracks/save-as-playlist", verifyFirebaseToken, saveTrackAsPlaylist);

export default router;
