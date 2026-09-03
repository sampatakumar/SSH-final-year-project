import { describe, it, expect, beforeEach, vi } from "vitest";
import mongoose from "mongoose";
import { EduTubePersistenceService } from "../src/modules/edutube/services/edutube-persistence.service.js";
import {
  EduTubeWatchHistory,
  EduTubeProgress,
  EduTubeSavedVideo,
  EduTubePlaylist,
  EduTubeVideoNote,
} from "../src/modules/edutube/models/index.js";

describe("EduTube Phase 3B Persistence & Personal Learning Suite", () => {
  let service;
  const userA = new mongoose.Types.ObjectId().toString();
  const userB = new mongoose.Types.ObjectId().toString();

  // In-memory data tables
  let historyTable = [];
  let progressTable = [];
  let savedTable = [];
  let playlistTable = [];
  let notesTable = [];

  beforeEach(() => {
    historyTable = [];
    progressTable = [];
    savedTable = [];
    playlistTable = [];
    notesTable = [];

    // Mock EduTubeWatchHistory
    vi.spyOn(EduTubeWatchHistory, "findOneAndUpdate").mockImplementation(async (filter, update) => {
      const idx = historyTable.findIndex(
        (h) => h.owner.toString() === filter.owner.toString() && h.videoId === filter.videoId
      );
      const setFields = update.$set || {};
      if (idx >= 0) {
        historyTable[idx] = { ...historyTable[idx], ...setFields, owner: filter.owner };
        return historyTable[idx];
      }
      const record = {
        _id: new mongoose.Types.ObjectId().toString(),
        owner: filter.owner,
        videoId: filter.videoId,
        ...setFields,
        watchedAt: new Date(),
      };
      historyTable.push(record);
      return record;
    });

    vi.spyOn(EduTubeWatchHistory, "find").mockImplementation((filter) => {
      let result = historyTable.filter((h) => h.owner.toString() === filter.owner.toString());
      if (filter.videoId?.$in) {
        result = result.filter((h) => filter.videoId.$in.includes(h.videoId));
      }
      return {
        sort: (sortObj) => ({
          skip: (skipNum) => ({
            limit: (limitNum) => ({
              lean: async () => result.slice(skipNum, skipNum + limitNum),
            }),
          }),
        }),
        lean: async () => result,
      };
    });

    vi.spyOn(EduTubeWatchHistory, "countDocuments").mockImplementation(async (filter) => {
      return historyTable.filter((h) => h.owner.toString() === filter.owner.toString()).length;
    });

    vi.spyOn(EduTubeWatchHistory, "findOneAndDelete").mockImplementation(async (filter) => {
      const idx = historyTable.findIndex(
        (h) => h.owner.toString() === filter.owner.toString() && h.videoId === filter.videoId
      );
      if (idx >= 0) {
        return historyTable.splice(idx, 1)[0];
      }
      return null;
    });

    vi.spyOn(EduTubeWatchHistory, "deleteMany").mockImplementation(async (filter) => {
      historyTable = historyTable.filter((h) => h.owner.toString() !== filter.owner.toString());
      return { deletedCount: 1 };
    });

    vi.spyOn(EduTubeWatchHistory, "updateOne").mockImplementation(async (filter, update) => {
      const idx = historyTable.findIndex(
        (h) => h.owner.toString() === filter.owner.toString() && h.videoId === filter.videoId
      );
      if (idx >= 0) {
        historyTable[idx] = { ...historyTable[idx], ...(update.$set || {}) };
      }
      return { modifiedCount: idx >= 0 ? 1 : 0 };
    });

    // Mock EduTubeProgress
    vi.spyOn(EduTubeProgress, "findOneAndUpdate").mockImplementation(async (filter, update) => {
      const idx = progressTable.findIndex(
        (p) => p.owner.toString() === filter.owner.toString() && p.videoId === filter.videoId
      );
      const setFields = update.$set || {};
      if (idx >= 0) {
        progressTable[idx] = { ...progressTable[idx], ...setFields, owner: filter.owner };
        return progressTable[idx];
      }
      const record = {
        _id: new mongoose.Types.ObjectId().toString(),
        owner: filter.owner,
        videoId: filter.videoId,
        ...setFields,
      };
      progressTable.push(record);
      return record;
    });

    vi.spyOn(EduTubeProgress, "findOne").mockImplementation((filter) => {
      const found = progressTable.find(
        (p) => p.owner.toString() === filter.owner.toString() && p.videoId === filter.videoId
      );
      return {
        lean: async () => (found ? { ...found } : null),
      };
    });

    vi.spyOn(EduTubeProgress, "find").mockImplementation((filter) => {
      let result = progressTable.filter((p) => p.owner.toString() === filter.owner.toString());
      if (filter.completed === false) {
        result = result.filter((p) => p.completed === false);
      }
      if (filter.positionSeconds?.$gt !== undefined) {
        result = result.filter((p) => p.positionSeconds > filter.positionSeconds.$gt);
      }
      if (filter.videoId?.$in) {
        result = result.filter((p) => filter.videoId.$in.includes(p.videoId));
      }
      return {
        sort: () => ({
          limit: (limitNum) => ({
            lean: async () => result.slice(0, limitNum),
          }),
        }),
        lean: async () => result,
      };
    });

    vi.spyOn(EduTubeProgress, "countDocuments").mockImplementation(async (filter) => {
      let result = progressTable.filter((p) => p.owner.toString() === filter.owner.toString());
      if (filter.completed !== undefined) {
        result = result.filter((p) => p.completed === filter.completed);
      }
      return result.length;
    });

    // Mock EduTubeSavedVideo
    vi.spyOn(EduTubeSavedVideo, "findOneAndUpdate").mockImplementation(async (filter, update) => {
      const idx = savedTable.findIndex(
        (s) => s.owner.toString() === filter.owner.toString() && s.videoId === filter.videoId
      );
      const setFields = update.$set || {};
      if (idx >= 0) {
        savedTable[idx] = { ...savedTable[idx], ...setFields, owner: filter.owner };
        return savedTable[idx];
      }
      const record = {
        _id: new mongoose.Types.ObjectId().toString(),
        owner: filter.owner,
        videoId: filter.videoId,
        ...setFields,
        savedAt: new Date(),
      };
      savedTable.push(record);
      return record;
    });

    vi.spyOn(EduTubeSavedVideo, "find").mockImplementation((filter) => {
      const result = savedTable.filter((s) => s.owner.toString() === filter.owner.toString());
      return {
        sort: () => ({
          skip: (skipNum) => ({
            limit: (limitNum) => ({
              lean: async () => result.slice(skipNum, skipNum + limitNum),
            }),
          }),
        }),
      };
    });

    vi.spyOn(EduTubeSavedVideo, "countDocuments").mockImplementation(async (filter) => {
      let result = savedTable.filter((s) => s.owner.toString() === filter.owner.toString());
      if (filter.videoId) {
        result = result.filter((s) => s.videoId === filter.videoId);
      }
      return result.length;
    });

    vi.spyOn(EduTubeSavedVideo, "findOneAndDelete").mockImplementation(async (filter) => {
      const idx = savedTable.findIndex(
        (s) => s.owner.toString() === filter.owner.toString() && s.videoId === filter.videoId
      );
      if (idx >= 0) {
        return savedTable.splice(idx, 1)[0];
      }
      return null;
    });

    // Mock EduTubePlaylist
    vi.spyOn(EduTubePlaylist, "create").mockImplementation(async (doc) => {
      const record = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...doc,
        videos: doc.videos || [],
        createdAt: new Date(),
      };
      playlistTable.push(record);
      return record;
    });

    vi.spyOn(EduTubePlaylist, "find").mockImplementation((filter) => {
      const result = playlistTable.filter((p) => p.owner.toString() === filter.owner.toString());
      return {
        sort: () => ({
          lean: async () => result.map((p) => ({ ...p })),
        }),
      };
    });

    vi.spyOn(EduTubePlaylist, "findOne").mockImplementation((filter) => {
      const found = playlistTable.find(
        (p) =>
          p.owner.toString() === filter.owner.toString() &&
          (!filter._id || p._id.toString() === filter._id.toString())
      );
      if (!found) {
        return {
          lean: async () => null,
        };
      }
      return {
        ...found,
        save: async function () {
          const idx = playlistTable.findIndex((p) => p._id.toString() === this._id.toString());
          if (idx >= 0) playlistTable[idx] = { ...this };
          return this;
        },
        lean: async () => ({ ...found }),
      };
    });

    vi.spyOn(EduTubePlaylist, "findOneAndUpdate").mockImplementation(async (filter, update) => {
      const idx = playlistTable.findIndex(
        (p) =>
          p.owner.toString() === filter.owner.toString() &&
          p._id.toString() === filter._id.toString()
      );
      if (idx < 0) return null;

      if (update.$set) {
        playlistTable[idx] = { ...playlistTable[idx], ...update.$set };
      }
      if (update.$pull?.videos) {
        const pullVid = update.$pull.videos.videoId;
        playlistTable[idx].videos = playlistTable[idx].videos.filter((v) => v.videoId !== pullVid);
      }
      return playlistTable[idx];
    });

    vi.spyOn(EduTubePlaylist, "findOneAndDelete").mockImplementation(async (filter) => {
      const idx = playlistTable.findIndex(
        (p) =>
          p.owner.toString() === filter.owner.toString() &&
          p._id.toString() === filter._id.toString()
      );
      if (idx >= 0) {
        return playlistTable.splice(idx, 1)[0];
      }
      return null;
    });

    vi.spyOn(EduTubePlaylist, "countDocuments").mockImplementation(async (filter) => {
      return playlistTable.filter((p) => p.owner.toString() === filter.owner.toString()).length;
    });

    // Mock EduTubeVideoNote
    vi.spyOn(EduTubeVideoNote, "create").mockImplementation(async (doc) => {
      const record = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...doc,
        createdAt: new Date(),
      };
      notesTable.push(record);
      return record;
    });

    vi.spyOn(EduTubeVideoNote, "find").mockImplementation((filter) => {
      const result = notesTable.filter(
        (n) =>
          n.owner.toString() === filter.owner.toString() &&
          (!filter.videoId || n.videoId === filter.videoId)
      );
      return {
        sort: () => ({
          lean: async () => result.map((n) => ({ ...n })),
        }),
      };
    });

    vi.spyOn(EduTubeVideoNote, "findOneAndUpdate").mockImplementation(async (filter, update) => {
      const idx = notesTable.findIndex(
        (n) =>
          n.owner.toString() === filter.owner.toString() &&
          n._id.toString() === filter._id.toString()
      );
      if (idx < 0) return null;
      notesTable[idx] = { ...notesTable[idx], ...(update.$set || {}) };
      return notesTable[idx];
    });

    vi.spyOn(EduTubeVideoNote, "findOneAndDelete").mockImplementation(async (filter) => {
      const idx = notesTable.findIndex(
        (n) =>
          n.owner.toString() === filter.owner.toString() &&
          n._id.toString() === filter._id.toString()
      );
      if (idx >= 0) {
        return notesTable.splice(idx, 1)[0];
      }
      return null;
    });

    service = new EduTubePersistenceService();
  });

  // ==========================================
  // GROUP 1: WATCH HISTORY & PROGRESS
  // ==========================================
  describe("Group 1: Watch History", () => {
    it("1. records new watch history record and auto-syncs progress snapshot", async () => {
      const history = await service.recordHistory(userA, {
        videoId: "vid123",
        title: "JavaScript Async Course",
        thumbnail: "https://example.com/thumb.jpg",
        channelTitle: "Code Masters",
        durationSeconds: 1000,
        positionSeconds: 250,
      });

      expect(history.videoId).toBe("vid123");
      expect(history.owner.toString()).toBe(userA.toString());
      expect(history.positionSeconds).toBe(250);

      // Verify progress snapshot was created
      const progress = await service.getProgress(userA, "vid123");
      expect(progress.positionSeconds).toBe(250);
      expect(progress.percentage).toBe(25);
      expect(progress.completed).toBe(false);
    });

    it("2. updates existing history record for same user without duplicating", async () => {
      await service.recordHistory(userA, {
        videoId: "vid123",
        title: "JavaScript Course v1",
        positionSeconds: 100,
      });

      await service.recordHistory(userA, {
        videoId: "vid123",
        title: "JavaScript Course v2",
        positionSeconds: 400,
      });

      const count = await EduTubeWatchHistory.countDocuments({ owner: userA, videoId: "vid123" });
      expect(count).toBe(1);
    });

    it("3. retrieves paginated history sorted by watchedAt descending", async () => {
      await service.recordHistory(userA, { videoId: "v1", title: "Vid 1" });
      await service.recordHistory(userA, { videoId: "v2", title: "Vid 2" });
      await service.recordHistory(userA, { videoId: "v3", title: "Vid 3" });

      const res = await service.getHistory(userA, { page: 1, limit: 2 });
      expect(res.items.length).toBe(2);
      expect(res.pagination.total).toBe(3);
      expect(res.pagination.totalPages).toBe(2);
    });

    it("4. deletes a specific history record by videoId", async () => {
      await service.recordHistory(userA, { videoId: "v1", title: "Vid 1" });
      await service.recordHistory(userA, { videoId: "v2", title: "Vid 2" });

      const delRes = await service.deleteHistoryItem(userA, "v1");
      expect(delRes.deleted).toBe(true);

      const remaining = await service.getHistory(userA);
      expect(remaining.items.length).toBe(1);
      expect(remaining.items[0].videoId).toBe("v2");
    });

    it("5. clears entire watch history for owner", async () => {
      await service.recordHistory(userA, { videoId: "v1", title: "Vid 1" });
      await service.recordHistory(userA, { videoId: "v2", title: "Vid 2" });

      await service.clearHistory(userA);
      const res = await service.getHistory(userA);
      expect(res.items.length).toBe(0);
    });
  });

  // ==========================================
  // GROUP 2: PLAYBACK PROGRESS & CONTINUE LEARNING
  // ==========================================
  describe("Group 2: Playback Progress & Continue Learning", () => {
    it("6. saves and updates playback progress with percentage calculation", async () => {
      const p1 = await service.saveProgress(userA, "vid101", {
        positionSeconds: 300,
        durationSeconds: 600,
      });
      expect(p1.percentage).toBe(50);
      expect(p1.completed).toBe(false);

      const p2 = await service.saveProgress(userA, "vid101", {
        positionSeconds: 580,
        durationSeconds: 600,
      });
      expect(p2.percentage).toBe(97);
      expect(p2.completed).toBe(true); // Auto-completed at >= 95%
    });

    it("7. returns default zeroed progress for unwatched video", async () => {
      const p = await service.getProgress(userA, "unwatched_video");
      expect(p.positionSeconds).toBe(0);
      expect(p.durationSeconds).toBe(0);
      expect(p.completed).toBe(false);
      expect(p.percentage).toBe(0);
    });

    it("8. getContinueLearning returns active incomplete videos and excludes completed ones", async () => {
      await service.recordHistory(userA, { videoId: "vActive", title: "Active Lesson" });
      await service.saveProgress(userA, "vActive", {
        positionSeconds: 300,
        durationSeconds: 1000,
      });

      await service.recordHistory(userA, { videoId: "vDone", title: "Done Lesson" });
      await service.saveProgress(userA, "vDone", {
        positionSeconds: 1000,
        durationSeconds: 1000,
        completed: true,
      });

      const res = await service.getContinueLearning(userA);
      expect(res.items.length).toBe(1);
      expect(res.items[0].videoId).toBe("vActive");
      expect(res.items[0].title).toBe("Active Lesson");
      expect(res.items[0].percentage).toBe(30);
      expect(res.items[0].remainingSeconds).toBe(700);
    });
  });

  // ==========================================
  // GROUP 3: SAVED VIDEOS (BOOKMARKS)
  // ==========================================
  describe("Group 3: Saved Videos", () => {
    it("9. saves video bookmark and prevents duplicate entries per user", async () => {
      await service.saveVideo(userA, {
        videoId: "vSaved1",
        title: "Saved Python Course",
        channelTitle: "Python Guru",
      });

      await service.saveVideo(userA, {
        videoId: "vSaved1",
        title: "Saved Python Course (Updated)",
        channelTitle: "Python Guru",
      });

      const count = await EduTubeSavedVideo.countDocuments({ owner: userA, videoId: "vSaved1" });
      expect(count).toBe(1);

      const check = await service.isVideoSaved(userA, "vSaved1");
      expect(check.isSaved).toBe(true);
    });

    it("10. unsaves video bookmark and updates isSaved status", async () => {
      await service.saveVideo(userA, { videoId: "vSaved1", title: "Saved Video" });
      expect((await service.isVideoSaved(userA, "vSaved1")).isSaved).toBe(true);

      await service.unsaveVideo(userA, "vSaved1");
      expect((await service.isVideoSaved(userA, "vSaved1")).isSaved).toBe(false);
    });
  });

  // ==========================================
  // GROUP 4: CUSTOM PLAYLISTS & PROGRESS
  // ==========================================
  describe("Group 4: Custom Playlists", () => {
    it("11. creates, updates, and deletes custom playlist", async () => {
      const pl = await service.createPlaylist(userA, {
        name: "Full Stack Roadmap",
        description: "My custom track",
      });
      expect(pl.name).toBe("Full Stack Roadmap");
      expect(pl.owner.toString()).toBe(userA.toString());

      const updated = await service.updatePlaylist(userA, pl._id.toString(), {
        name: "Full Stack Masterclass",
      });
      expect(updated.name).toBe("Full Stack Masterclass");

      const del = await service.deletePlaylist(userA, pl._id.toString());
      expect(del.deleted).toBe(true);
    });

    it("12. adds video and rejects duplicate video IDs in same playlist (409)", async () => {
      const pl = await service.createPlaylist(userA, { name: "Docker Mastery" });

      await service.addVideoToPlaylist(userA, pl._id.toString(), {
        videoId: "dock1",
        title: "Docker Basics",
      });

      await expect(
        service.addVideoToPlaylist(userA, pl._id.toString(), {
          videoId: "dock1",
          title: "Docker Basics Again",
        })
      ).rejects.toThrow("Video already exists in this playlist");
    });

    it("13. reorders playlist videos and validates completeness", async () => {
      const pl = await service.createPlaylist(userA, { name: "React Series" });
      await service.addVideoToPlaylist(userA, pl._id.toString(), { videoId: "r1", title: "R1" });
      await service.addVideoToPlaylist(userA, pl._id.toString(), { videoId: "r2", title: "R2" });
      await service.addVideoToPlaylist(userA, pl._id.toString(), { videoId: "r3", title: "R3" });

      const reordered = await service.reorderPlaylistVideos(userA, pl._id.toString(), [
        "r3",
        "r1",
        "r2",
      ]);

      expect(reordered.videos[0].videoId).toBe("r3");
      expect(reordered.videos[1].videoId).toBe("r1");
      expect(reordered.videos[2].videoId).toBe("r2");
    });

    it("14. calculates deterministic playlist progress from video completion states", async () => {
      const pl = await service.createPlaylist(userA, { name: "TypeScript Path" });
      await service.addVideoToPlaylist(userA, pl._id.toString(), { videoId: "ts1", title: "TS1" });
      await service.addVideoToPlaylist(userA, pl._id.toString(), { videoId: "ts2", title: "TS2" });

      // Mark ts1 as completed
      await service.saveProgress(userA, "ts1", {
        positionSeconds: 500,
        durationSeconds: 500,
        completed: true,
      });

      const detail = await service.getPlaylistById(userA, pl._id.toString());
      expect(detail.playlist.totalVideos).toBe(2);
      expect(detail.playlist.completedVideos).toBe(1);
      expect(detail.playlist.progressPercentage).toBe(50);
      expect(detail.playlist.videos[0].completed).toBe(true);
      expect(detail.playlist.videos[1].completed).toBe(false);
    });
  });

  // ==========================================
  // GROUP 5: VIDEO NOTES
  // ==========================================
  describe("Group 5: Video Notes", () => {
    it("15. creates, updates, and deletes timestamped video note", async () => {
      const note = await service.createNote(userA, "vidNotes", {
        content: "Understanding closures and lexical scope",
        timestampSeconds: 145,
      });

      expect(note.content).toBe("Understanding closures and lexical scope");
      expect(note.timestampSeconds).toBe(145);

      const notesRes = await service.getVideoNotes(userA, "vidNotes");
      expect(notesRes.notes.length).toBe(1);

      const updated = await service.updateNote(userA, note._id.toString(), {
        content: "Updated closure note",
      });
      expect(updated.content).toBe("Updated closure note");

      await service.deleteNote(userA, note._id.toString());
      const afterDel = await service.getVideoNotes(userA, "vidNotes");
      expect(afterDel.notes.length).toBe(0);
    });
  });

  // ==========================================
  // GROUP 6: OWNERSHIP ISOLATION & STATS
  // ==========================================
  describe("Group 6: Ownership Isolation & Stats", () => {
    it("16. enforces cross-user ownership isolation for playlists, notes, and history", async () => {
      const plA = await service.createPlaylist(userA, { name: "User A Playlist" });
      const noteA = await service.createNote(userA, "vidX", { content: "User A Note" });
      await service.recordHistory(userA, { videoId: "vidX", title: "User A History" });

      // User B cannot access or modify User A's playlist
      await expect(
        service.getPlaylistById(userB, plA._id.toString())
      ).rejects.toThrow("Playlist not found or unauthorized");

      await expect(
        service.deletePlaylist(userB, plA._id.toString())
      ).rejects.toThrow("Playlist not found or unauthorized");

      // User B cannot access User A's notes
      const notesB = await service.getVideoNotes(userB, "vidX");
      expect(notesB.notes.length).toBe(0);

      // User B history is empty
      const histB = await service.getHistory(userB);
      expect(histB.items.length).toBe(0);
    });

    it("17. compiles learning stats aggregation accurately", async () => {
      await service.recordHistory(userA, { videoId: "v1", title: "V1" });
      await service.recordHistory(userA, { videoId: "v2", title: "V2" });
      await service.saveProgress(userA, "v1", { positionSeconds: 100, durationSeconds: 100, completed: true });
      await service.saveVideo(userA, { videoId: "v1", title: "V1" });
      await service.createPlaylist(userA, { name: "PL1" });

      const statsRes = await service.getLearningStats(userA);
      expect(statsRes.stats.videosWatched).toBe(2);
      expect(statsRes.stats.completedVideos).toBe(1);
      expect(statsRes.stats.savedVideos).toBe(1);
      expect(statsRes.stats.activePlaylists).toBe(1);
    });
  });
});
