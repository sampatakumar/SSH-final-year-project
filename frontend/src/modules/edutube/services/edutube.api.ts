/**
 * EduTube API Client Service
 * Strictly routes through Smart Skill Hub backend (/api/v1/edutube/*).
 * Zero raw YouTube API calls or keys in browser.
 */

import { apiRequest } from "@/lib/api";
import type {
  EduTubeSearchParams,
  EduTubeSearchResult,
  EduTubeVideoDetail,
  WatchHistoryItem,
  VideoProgress,
  ContinueLearningItem,
  SavedVideo,
  Playlist,
  VideoNote,
  LearningStats,
  PersonalizedFeedData,
  FeedbackAction,
  LearningTrack,
} from "../types/edutube.types";

export const EduTubeApi = {
  // ==========================================
  // PHASE 2: SEARCH & VIDEO METADATA
  // ==========================================

  search: async (params: EduTubeSearchParams): Promise<EduTubeSearchResult> => {
    const searchParams = new URLSearchParams();

    if (params.q?.trim()) {
      searchParams.set("q", params.q.trim());
    }
    if (params.language && params.language !== "all") {
      searchParams.set("language", params.language);
    }
    if (params.regionCode) {
      searchParams.set("regionCode", params.regionCode);
    }
    if (params.pageToken?.trim()) {
      searchParams.set("pageToken", params.pageToken.trim());
    }
    if (params.maxResults) {
      searchParams.set("maxResults", String(params.maxResults));
    }
    if (params.level && params.level !== "all") {
      searchParams.set("level", params.level);
    }
    if (params.duration && params.duration !== "all") {
      searchParams.set("duration", params.duration);
    }
    if (params.sort && params.sort !== "relevance") {
      searchParams.set("sort", params.sort);
    }

    const queryString = searchParams.toString();
    const endpoint = `/edutube/search${queryString ? `?${queryString}` : ""}`;

    const res = await apiRequest<EduTubeSearchResult>(endpoint, {
      method: "GET",
    });

    return res.data;
  },

  getVideo: async (videoId: string): Promise<{ video: EduTubeVideoDetail; cached: boolean }> => {
    if (!videoId?.trim()) {
      throw new Error("Valid videoId is required.");
    }

    const endpoint = `/edutube/video/${encodeURIComponent(videoId.trim())}`;
    const res = await apiRequest<{ video: EduTubeVideoDetail; cached: boolean }>(endpoint, {
      method: "GET",
    });

    return res.data;
  },

  // ==========================================
  // PHASE 3B: WATCH HISTORY
  // ==========================================

  recordHistory: async (payload: {
    videoId: string;
    title: string;
    thumbnail?: string;
    channelTitle?: string;
    duration?: any;
    durationSeconds?: number;
    positionSeconds?: number;
    completed?: boolean;
  }): Promise<{ history: WatchHistoryItem }> => {
    const res = await apiRequest<{ history: WatchHistoryItem }>("/edutube/history", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  getHistory: async (params: { page?: number; limit?: number } = {}): Promise<{
    items: WatchHistoryItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    const res = await apiRequest<{
      items: WatchHistoryItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/edutube/history${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
    return res.data;
  },

  deleteHistoryItem: async (videoId: string): Promise<{ deleted: boolean; videoId: string }> => {
    const res = await apiRequest<{ deleted: boolean; videoId: string }>(
      `/edutube/history/${encodeURIComponent(videoId)}`,
      {
        method: "DELETE",
      }
    );
    return res.data;
  },

  clearHistory: async (): Promise<{ cleared: boolean }> => {
    const res = await apiRequest<{ cleared: boolean }>("/edutube/history", {
      method: "DELETE",
    });
    return res.data;
  },

  // ==========================================
  // PHASE 3B: PLAYBACK PROGRESS & CONTINUE LEARNING
  // ==========================================

  saveProgress: async (
    videoId: string,
    payload: { positionSeconds: number; durationSeconds: number; completed?: boolean }
  ): Promise<{ progress: VideoProgress }> => {
    const res = await apiRequest<{ progress: VideoProgress }>(
      `/edutube/progress/${encodeURIComponent(videoId)}`,
      {
        method: "PUT",
        body: payload,
      }
    );
    return res.data;
  },

  getProgress: async (videoId: string): Promise<VideoProgress> => {
    const res = await apiRequest<VideoProgress>(
      `/edutube/progress/${encodeURIComponent(videoId)}`,
      {
        method: "GET",
      }
    );
    return res.data;
  },

  getContinueLearning: async (limit = 10): Promise<{ items: ContinueLearningItem[] }> => {
    const res = await apiRequest<{ items: ContinueLearningItem[] }>(
      `/edutube/continue-learning?limit=${limit}`,
      {
        method: "GET",
      }
    );
    return res.data;
  },

  // ==========================================
  // PHASE 3B: SAVED VIDEOS (BOOKMARKS)
  // ==========================================

  saveVideo: async (payload: {
    videoId: string;
    title: string;
    thumbnail?: string;
    channelTitle?: string;
    duration?: any;
  }): Promise<{ saved: SavedVideo }> => {
    const res = await apiRequest<{ saved: SavedVideo }>("/edutube/saved", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  getSavedVideos: async (params: { page?: number; limit?: number } = {}): Promise<{
    items: SavedVideo[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    const res = await apiRequest<{
      items: SavedVideo[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/edutube/saved${qs ? `?${qs}` : ""}`, {
      method: "GET",
    });
    return res.data;
  },

  unsaveVideo: async (videoId: string): Promise<{ unsaved: boolean; videoId: string }> => {
    const res = await apiRequest<{ unsaved: boolean; videoId: string }>(
      `/edutube/saved/${encodeURIComponent(videoId)}`,
      {
        method: "DELETE",
      }
    );
    return res.data;
  },

  isVideoSaved: async (videoId: string): Promise<{ isSaved: boolean }> => {
    const res = await apiRequest<{ isSaved: boolean }>(
      `/edutube/saved/${encodeURIComponent(videoId)}`,
      {
        method: "GET",
      }
    );
    return res.data;
  },

  // ==========================================
  // PHASE 3B: CUSTOM PLAYLISTS
  // ==========================================

  createPlaylist: async (payload: {
    name: string;
    description?: string;
  }): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>("/edutube/playlists", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  getPlaylists: async (): Promise<{ playlists: Playlist[] }> => {
    const res = await apiRequest<{ playlists: Playlist[] }>("/edutube/playlists", {
      method: "GET",
    });
    return res.data;
  },

  getPlaylist: async (playlistId: string): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>(
      `/edutube/playlists/${encodeURIComponent(playlistId)}`,
      {
        method: "GET",
      }
    );
    return res.data;
  },

  updatePlaylist: async (
    playlistId: string,
    payload: { name?: string; description?: string }
  ): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>(
      `/edutube/playlists/${encodeURIComponent(playlistId)}`,
      {
        method: "PATCH",
        body: payload,
      }
    );
    return res.data;
  },

  deletePlaylist: async (playlistId: string): Promise<{ deleted: boolean; playlistId: string }> => {
    const res = await apiRequest<{ deleted: boolean; playlistId: string }>(
      `/edutube/playlists/${encodeURIComponent(playlistId)}`,
      {
        method: "DELETE",
      }
    );
    return res.data;
  },

  addVideoToPlaylist: async (
    playlistId: string,
    videoPayload: {
      videoId: string;
      title: string;
      thumbnail?: string;
      channelTitle?: string;
      duration?: any;
      durationSeconds?: number;
    }
  ): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>(
      `/edutube/playlists/${encodeURIComponent(playlistId)}/videos`,
      {
        method: "POST",
        body: videoPayload,
      }
    );
    return res.data;
  },

  removeVideoFromPlaylist: async (
    playlistId: string,
    videoId: string
  ): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>(
      `/edutube/playlists/${encodeURIComponent(playlistId)}/videos/${encodeURIComponent(videoId)}`,
      {
        method: "DELETE",
      }
    );
    return res.data;
  },

  reorderPlaylist: async (
    playlistId: string,
    videoIds: string[]
  ): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>(
      `/edutube/playlists/${encodeURIComponent(playlistId)}/videos/reorder`,
      {
        method: "PATCH",
        body: { videoIds },
      }
    );
    return res.data;
  },

  // ==========================================
  // PHASE 3B: VIDEO NOTES
  // ==========================================

  createVideoNote: async (
    videoId: string,
    payload: { content: string; timestampSeconds?: number }
  ): Promise<{ note: VideoNote }> => {
    const res = await apiRequest<{ note: VideoNote }>(
      `/edutube/videos/${encodeURIComponent(videoId)}/notes`,
      {
        method: "POST",
        body: payload,
      }
    );
    return res.data;
  },

  getVideoNotes: async (videoId: string): Promise<{ notes: VideoNote[] }> => {
    const res = await apiRequest<{ notes: VideoNote[] }>(
      `/edutube/videos/${encodeURIComponent(videoId)}/notes`,
      {
        method: "GET",
      }
    );
    return res.data;
  },

  updateVideoNote: async (
    noteId: string,
    payload: { content?: string; timestampSeconds?: number }
  ): Promise<{ note: VideoNote }> => {
    const res = await apiRequest<{ note: VideoNote }>(
      `/edutube/notes/${encodeURIComponent(noteId)}`,
      {
        method: "PATCH",
        body: payload,
      }
    );
    return res.data;
  },

  deleteVideoNote: async (noteId: string): Promise<{ deleted: boolean; noteId: string }> => {
    const res = await apiRequest<{ deleted: boolean; noteId: string }>(
      `/edutube/notes/${encodeURIComponent(noteId)}`,
      {
        method: "DELETE",
      }
    );
    return res.data;
  },

  // ==========================================
  // PHASE 3B: LEARNING STATS
  // ==========================================

  getLearningStats: async (): Promise<{ stats: LearningStats }> => {
    const res = await apiRequest<{ stats: LearningStats }>("/edutube/stats", {
      method: "GET",
    });
    return res.data;
  },

  // ==========================================
  // PHASE 3C: PERSONALIZED AI LEARNING ENGINE
  // ==========================================

  getPersonalizedRecommendations: async (options?: {
    refresh?: boolean;
  }): Promise<PersonalizedFeedData> => {
    const query = options?.refresh ? "?refresh=true" : "";
    const res = await apiRequest<PersonalizedFeedData>(`/edutube/recommendations${query}`, {
      method: "GET",
    });
    return res.data;
  },

  submitRecommendationFeedback: async (payload: {
    videoId: string;
    action: FeedbackAction;
    topic?: string;
  }): Promise<{ feedback: any }> => {
    const res = await apiRequest<{ feedback: any }>("/edutube/recommendations/feedback", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  generateLearningTrack: async (payload: {
    topic: string;
    targetRole?: string;
  }): Promise<{ track: LearningTrack }> => {
    const res = await apiRequest<{ track: LearningTrack }>("/edutube/tracks/generate", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },

  saveTrackAsPlaylist: async (payload: {
    name: string;
    description?: string;
    track: LearningTrack;
  }): Promise<{ playlist: Playlist }> => {
    const res = await apiRequest<{ playlist: Playlist }>("/edutube/tracks/save-as-playlist", {
      method: "POST",
      body: payload,
    });
    return res.data;
  },
};

