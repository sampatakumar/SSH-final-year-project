import mongoose from "mongoose";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
  EduTubeVideoNote,
} from "../models/index.js";
import { ApiError } from "../../../core/errors/ApiError.js";

export class EduTubePersistenceService {
  // ==========================================
  // 1. WATCH HISTORY
  // ==========================================

  async recordHistory(ownerId, payload) {
    if (!payload?.videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    const videoId = payload.videoId.trim();
    const title = (payload.title || "Video Lesson").trim();
    const thumbnail = payload.thumbnail || "";
    const channelTitle = (payload.channelTitle || "").trim();
    const duration = payload.duration || null;
    const durationSeconds = Number(payload.durationSeconds) || (duration?.seconds ? Number(duration.seconds) : 0);
    const positionSeconds = Math.max(0, Number(payload.positionSeconds) || 0);
    const completed = Boolean(payload.completed);

    const history = await EduTubeWatchHistory.findOneAndUpdate(
      { owner: ownerId, videoId },
      {
        $set: {
          title,
          thumbnail,
          channelTitle,
          duration,
          durationSeconds,
          positionSeconds,
          completed,
          watchedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also update progress snapshot if position is provided
    if (positionSeconds > 0 || durationSeconds > 0) {
      const percentage = durationSeconds > 0
        ? Math.min(100, Math.round((positionSeconds / durationSeconds) * 100))
        : 0;

      await EduTubeProgress.findOneAndUpdate(
        { owner: ownerId, videoId },
        {
          $set: {
            positionSeconds,
            durationSeconds,
            completed: completed || percentage >= 95,
            percentage,
            lastUpdated: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    }

    return history;
  }

  async getHistory(ownerId, { page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      EduTubeWatchHistory.find({ owner: ownerId })
        .sort({ watchedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EduTubeWatchHistory.countDocuments({ owner: ownerId }),
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async deleteHistoryItem(ownerId, videoId) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    const result = await EduTubeWatchHistory.findOneAndDelete({
      owner: ownerId,
      videoId: videoId.trim(),
    });
    if (!result) {
      throw new ApiError(404, "History record not found.");
    }
    return { deleted: true, videoId };
  }

  async clearHistory(ownerId) {
    await EduTubeWatchHistory.deleteMany({ owner: ownerId });
    return { cleared: true };
  }

  // ==========================================
  // 2. PLAYBACK PROGRESS & CONTINUE LEARNING
  // ==========================================

  async saveProgress(ownerId, videoId, { positionSeconds = 0, durationSeconds = 0, completed = false }) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    const cleanVideoId = videoId.trim();
    const pos = Math.max(0, Number(positionSeconds) || 0);
    const dur = Math.max(0, Number(durationSeconds) || 0);
    const percentage = dur > 0 ? Math.min(100, Math.round((pos / dur) * 100)) : 0;
    const isCompleted = Boolean(completed) || percentage >= 95;

    const progress = await EduTubeProgress.findOneAndUpdate(
      { owner: ownerId, videoId: cleanVideoId },
      {
        $set: {
          positionSeconds: pos,
          durationSeconds: dur,
          completed: isCompleted,
          percentage,
          lastUpdated: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Sync position & completed to watch history if present
    await EduTubeWatchHistory.updateOne(
      { owner: ownerId, videoId: cleanVideoId },
      {
        $set: {
          positionSeconds: pos,
          durationSeconds: dur,
          completed: isCompleted,
          watchedAt: new Date(),
        },
      }
    );

    return progress;
  }

  async getProgress(ownerId, videoId) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    const progress = await EduTubeProgress.findOne({
      owner: ownerId,
      videoId: videoId.trim(),
    }).lean();

    if (!progress) {
      return {
        videoId: videoId.trim(),
        positionSeconds: 0,
        durationSeconds: 0,
        completed: false,
        percentage: 0,
      };
    }

    return {
      videoId: progress.videoId,
      positionSeconds: progress.positionSeconds,
      durationSeconds: progress.durationSeconds,
      completed: progress.completed,
      percentage: progress.percentage,
    };
  }

  async getContinueLearning(ownerId, { limit = 10 } = {}) {
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    // Find incomplete progress with active positions
    const progressItems = await EduTubeProgress.find({
      owner: ownerId,
      completed: false,
      positionSeconds: { $gt: 0 },
    })
      .sort({ lastUpdated: -1 })
      .limit(limitNum)
      .lean();

    if (progressItems.length === 0) {
      return { items: [] };
    }

    const videoIds = progressItems.map((p) => p.videoId);

    // Fetch matching metadata from Watch History
    const historyRecords = await EduTubeWatchHistory.find({
      owner: ownerId,
      videoId: { $in: videoIds },
    }).lean();

    const historyMap = new Map(historyRecords.map((h) => [h.videoId, h]));

    const items = progressItems.map((prog) => {
      const hist = historyMap.get(prog.videoId);
      const remainingSeconds = Math.max(0, prog.durationSeconds - prog.positionSeconds);

      return {
        videoId: prog.videoId,
        title: hist?.title || "Video Lesson",
        thumbnail: hist?.thumbnail || "",
        channelTitle: hist?.channelTitle || "",
        duration: hist?.duration || null,
        durationSeconds: prog.durationSeconds,
        positionSeconds: prog.positionSeconds,
        remainingSeconds,
        percentage: prog.percentage,
        completed: prog.completed,
        lastUpdated: prog.lastUpdated,
      };
    });

    return { items };
  }

  // ==========================================
  // 3. SAVED VIDEOS (BOOKMARKS)
  // ==========================================

  async saveVideo(ownerId, payload) {
    if (!payload?.videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    const videoId = payload.videoId.trim();
    const title = (payload.title || "Saved Video").trim();
    const thumbnail = payload.thumbnail || "";
    const channelTitle = (payload.channelTitle || "").trim();
    const duration = payload.duration || null;

    const saved = await EduTubeSavedVideo.findOneAndUpdate(
      { owner: ownerId, videoId },
      {
        $set: {
          title,
          thumbnail,
          channelTitle,
          duration,
          savedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return saved;
  }

  async getSavedVideos(ownerId, { page = 1, limit = 50 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      EduTubeSavedVideo.find({ owner: ownerId })
        .sort({ savedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EduTubeSavedVideo.countDocuments({ owner: ownerId }),
    ]);

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  async unsaveVideo(ownerId, videoId) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    const result = await EduTubeSavedVideo.findOneAndDelete({
      owner: ownerId,
      videoId: videoId.trim(),
    });
    if (!result) {
      throw new ApiError(404, "Saved video not found.");
    }
    return { unsaved: true, videoId };
  }

  async isVideoSaved(ownerId, videoId) {
    if (!videoId?.trim()) return { isSaved: false };
    const count = await EduTubeSavedVideo.countDocuments({
      owner: ownerId,
      videoId: videoId.trim(),
    });
    return { isSaved: count > 0 };
  }

  // ==========================================
  // 4. CUSTOM PLAYLISTS & PROGRESS
  // ==========================================

  async createPlaylist(ownerId, { name, description = "" }) {
    if (!name?.trim()) {
      throw new ApiError(400, "Playlist name is required.");
    }
    const playlist = await EduTubePlaylist.create({
      owner: ownerId,
      name: name.trim(),
      description: description.trim(),
      videos: [],
    });
    return playlist;
  }

  async getPlaylists(ownerId) {
    const playlists = await EduTubePlaylist.find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch user progress for all videos across playlists to derive deterministic progress
    const allVideoIds = [
      ...new Set(playlists.flatMap((p) => (p.videos || []).map((v) => v.videoId))),
    ];

    const progressRecords = await EduTubeProgress.find({
      owner: ownerId,
      videoId: { $in: allVideoIds },
    }).lean();

    const progressMap = new Map(progressRecords.map((p) => [p.videoId, p]));

    const enrichedPlaylists = playlists.map((pl) => {
      const totalVideos = pl.videos?.length || 0;
      let completedVideos = 0;

      for (const v of pl.videos || []) {
        const prog = progressMap.get(v.videoId);
        if (prog?.completed) {
          completedVideos++;
        }
      }

      const progressPercentage =
        totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

      return {
        ...pl,
        totalVideos,
        completedVideos,
        progressPercentage,
      };
    });

    return { playlists: enrichedPlaylists };
  }

  async getPlaylistById(ownerId, playlistId) {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID format.");
    }
    const playlist = await EduTubePlaylist.findOne({
      _id: playlistId,
      owner: ownerId,
    }).lean();

    if (!playlist) {
      throw new ApiError(404, "Playlist not found or unauthorized.");
    }

    const videoIds = (playlist.videos || []).map((v) => v.videoId);
    const progressRecords = await EduTubeProgress.find({
      owner: ownerId,
      videoId: { $in: videoIds },
    }).lean();

    const progressMap = new Map(progressRecords.map((p) => [p.videoId, p]));

    let completedVideos = 0;
    const enrichedVideos = (playlist.videos || []).map((v) => {
      const prog = progressMap.get(v.videoId);
      const isCompleted = Boolean(prog?.completed);
      if (isCompleted) completedVideos++;

      return {
        ...v,
        completed: isCompleted,
        percentage: prog?.percentage || 0,
        positionSeconds: prog?.positionSeconds || 0,
      };
    });

    const totalVideos = enrichedVideos.length;
    const progressPercentage =
      totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

    return {
      playlist: {
        ...playlist,
        videos: enrichedVideos,
        totalVideos,
        completedVideos,
        progressPercentage,
      },
    };
  }

  async updatePlaylist(ownerId, playlistId, { name, description }) {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID format.");
    }
    const updateFields = {};
    if (name !== undefined) {
      if (!name.trim()) throw new ApiError(400, "Playlist name cannot be empty.");
      updateFields.name = name.trim();
    }
    if (description !== undefined) {
      updateFields.description = description.trim();
    }

    const playlist = await EduTubePlaylist.findOneAndUpdate(
      { _id: playlistId, owner: ownerId },
      { $set: updateFields },
      { new: true }
    );

    if (!playlist) {
      throw new ApiError(404, "Playlist not found or unauthorized.");
    }

    return playlist;
  }

  async deletePlaylist(ownerId, playlistId) {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID format.");
    }
    const result = await EduTubePlaylist.findOneAndDelete({
      _id: playlistId,
      owner: ownerId,
    });
    if (!result) {
      throw new ApiError(404, "Playlist not found or unauthorized.");
    }
    return { deleted: true, playlistId };
  }

  async addVideoToPlaylist(ownerId, playlistId, payload) {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID format.");
    }
    if (!payload?.videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }

    const playlist = await EduTubePlaylist.findOne({
      _id: playlistId,
      owner: ownerId,
    });

    if (!playlist) {
      throw new ApiError(404, "Playlist not found or unauthorized.");
    }

    const videoId = payload.videoId.trim();
    const alreadyExists = playlist.videos.some((v) => v.videoId === videoId);
    if (alreadyExists) {
      throw new ApiError(409, "Video already exists in this playlist.");
    }

    playlist.videos.push({
      videoId,
      title: (payload.title || "Video Lesson").trim(),
      thumbnail: payload.thumbnail || "",
      channelTitle: (payload.channelTitle || "").trim(),
      duration: payload.duration || null,
      durationSeconds: Number(payload.durationSeconds) || 0,
      addedAt: new Date(),
    });

    await playlist.save();
    return playlist;
  }

  async removeVideoFromPlaylist(ownerId, playlistId, videoId) {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID format.");
    }
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }

    const playlist = await EduTubePlaylist.findOneAndUpdate(
      { _id: playlistId, owner: ownerId },
      { $pull: { videos: { videoId: videoId.trim() } } },
      { new: true }
    );

    if (!playlist) {
      throw new ApiError(404, "Playlist not found or unauthorized.");
    }

    return playlist;
  }

  async reorderPlaylistVideos(ownerId, playlistId, videoIds) {
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
      throw new ApiError(400, "Invalid playlist ID format.");
    }
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      throw new ApiError(400, "videoIds array is required for reordering.");
    }

    const playlist = await EduTubePlaylist.findOne({
      _id: playlistId,
      owner: ownerId,
    });

    if (!playlist) {
      throw new ApiError(404, "Playlist not found or unauthorized.");
    }

    const existingVideoMap = new Map(playlist.videos.map((v) => [v.videoId, v]));

    // Validate that all videoIds exist in playlist and no duplicates
    const uniqueIds = new Set(videoIds);
    if (uniqueIds.size !== videoIds.length || uniqueIds.size !== playlist.videos.length) {
      throw new ApiError(400, "videoIds array must contain all playlist videos without duplicates.");
    }

    const reorderedVideos = [];
    for (const id of videoIds) {
      const v = existingVideoMap.get(id);
      if (!v) {
        throw new ApiError(400, `Video ID ${id} is not part of this playlist.`);
      }
      reorderedVideos.push(v);
    }

    playlist.videos = reorderedVideos;
    await playlist.save();

    return playlist;
  }

  // ==========================================
  // 5. VIDEO NOTES
  // ==========================================

  async createNote(ownerId, videoId, { content, timestampSeconds = 0 }) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }
    if (!content?.trim()) {
      throw new ApiError(400, "Note content cannot be empty.");
    }

    const note = await EduTubeVideoNote.create({
      owner: ownerId,
      videoId: videoId.trim(),
      content: content.trim(),
      timestampSeconds: Math.max(0, Number(timestampSeconds) || 0),
    });

    return note;
  }

  async getVideoNotes(ownerId, videoId) {
    if (!videoId?.trim()) {
      throw new ApiError(400, "Valid videoId is required.");
    }

    const notes = await EduTubeVideoNote.find({
      owner: ownerId,
      videoId: videoId.trim(),
    })
      .sort({ timestampSeconds: 1, createdAt: -1 })
      .lean();

    return { notes };
  }

  async updateNote(ownerId, noteId, { content, timestampSeconds }) {
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw new ApiError(400, "Invalid note ID format.");
    }

    const updateFields = {};
    if (content !== undefined) {
      if (!content.trim()) throw new ApiError(400, "Note content cannot be empty.");
      updateFields.content = content.trim();
    }
    if (timestampSeconds !== undefined) {
      updateFields.timestampSeconds = Math.max(0, Number(timestampSeconds) || 0);
    }

    const note = await EduTubeVideoNote.findOneAndUpdate(
      { _id: noteId, owner: ownerId },
      { $set: updateFields },
      { new: true }
    );

    if (!note) {
      throw new ApiError(404, "Note not found or unauthorized.");
    }

    return note;
  }

  async deleteNote(ownerId, noteId) {
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      throw new ApiError(400, "Invalid note ID format.");
    }

    const result = await EduTubeVideoNote.findOneAndDelete({
      _id: noteId,
      owner: ownerId,
    });

    if (!result) {
      throw new ApiError(404, "Note not found or unauthorized.");
    }

    return { deleted: true, noteId };
  }

  // ==========================================
  // 6. LEARNING DASHBOARD STATS
  // ==========================================

  async getLearningStats(ownerId) {
    const [videosWatched, completedVideos, activePlaylists, savedVideos] = await Promise.all([
      EduTubeWatchHistory.countDocuments({ owner: ownerId }),
      EduTubeProgress.countDocuments({ owner: ownerId, completed: true }),
      EduTubePlaylist.countDocuments({ owner: ownerId }),
      EduTubeSavedVideo.countDocuments({ owner: ownerId }),
    ]);

    return {
      stats: {
        videosWatched,
        completedVideos,
        activePlaylists,
        savedVideos,
      },
    };
  }
}

export const edutubePersistenceService = new EduTubePersistenceService();
