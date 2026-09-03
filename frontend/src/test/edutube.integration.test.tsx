import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EduTubePage } from "../modules/edutube/pages/EduTubePage";
import { HistoryPage } from "../modules/edutube/pages/HistoryPage";
import { SavedVideosPage } from "../modules/edutube/pages/SavedVideosPage";
import { PlaylistsPage } from "../modules/edutube/pages/PlaylistsPage";
import { PlaylistDetailPage } from "../modules/edutube/pages/PlaylistDetailPage";
import { VideoCard } from "../modules/edutube/components/VideoCard";
import { VideoPlayer } from "../modules/edutube/components/VideoPlayer";
import { VideoDetails } from "../modules/edutube/components/VideoDetails";
import { VideoNotes } from "../modules/edutube/components/VideoNotes";
import { ContinueLearningSection } from "../modules/edutube/components/ContinueLearningSection";
import { EduTubeApi } from "../modules/edutube/services/edutube.api";
import * as apiModule from "../lib/api";

const mockVideoItem1 = {
  videoId: "W6NZfCO5SIk",
  title: "JavaScript Course for Beginners",
  description: "Learn JS from scratch in 1 hour.",
  thumbnail: {
    default: "https://i.ytimg.com/vi/W6NZfCO5SIk/default.jpg",
    high: "https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg",
  },
  channelId: "UCWv7vMbMWH4-V0ZXdmDpPBA",
  channelTitle: "Programming with Mosh",
  publishedAt: "2024-01-01T00:00:00Z",
  embedUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
  youtubeUrl: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
  educationalScore: 98,
  educationalSignals: ["Course keyword in title", "Top educational channel"],
};

const mockVideoItem2 = {
  videoId: "PkZNo7MFNFg",
  title: "Learn JavaScript - Full Course for Beginners",
  description: "Complete JavaScript tutorial.",
  thumbnail: {
    default: "https://i.ytimg.com/vi/PkZNo7MFNFg/default.jpg",
    high: "https://i.ytimg.com/vi/PkZNo7MFNFg/hqdefault.jpg",
  },
  channelId: "UC8butISFwT-Wl7EV0hUK0BQ",
  channelTitle: "freeCodeCamp.org",
  publishedAt: "2023-05-15T00:00:00Z",
  embedUrl: "https://www.youtube.com/embed/PkZNo7MFNFg",
  youtubeUrl: "https://www.youtube.com/watch?v=PkZNo7MFNFg",
  educationalScore: 95,
  educationalSignals: ["Full course keyword"],
};

const mockVideoDetail = {
  videoId: "W6NZfCO5SIk",
  title: "JavaScript Course for Beginners",
  description: "Detailed overview of variables, functions, and objects in JS.",
  channel: "Programming with Mosh",
  channelId: "UCWv7vMbMWH4-V0ZXdmDpPBA",
  thumbnails: { high: "https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg" },
  publishedAt: "2024-01-01T00:00:00Z",
  duration: { raw: "PT48M17S", seconds: 2897, formatted: "48:17" },
  tags: ["javascript", "tutorial", "web"],
  categoryId: "27",
  statistics: { viewCount: 15200000, likeCount: 420000, commentCount: 12000 },
  embeddable: true,
  liveStatus: "none",
  youtubeUrl: "https://www.youtube.com/watch?v=W6NZfCO5SIk",
  embedUrl: "https://www.youtube.com/embed/W6NZfCO5SIk",
};

describe("EduTube Frontend Module Suite (Phase 3A + Phase 3B)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialRoute = "/dashboard/edutube") => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/dashboard/edutube" element={<EduTubePage />} />
            <Route path="/dashboard/edutube/watch/:videoId" element={<EduTubePage />} />
            <Route path="/dashboard/edutube/history" element={<HistoryPage />} />
            <Route path="/dashboard/edutube/saved" element={<SavedVideosPage />} />
            <Route path="/dashboard/edutube/playlists" element={<PlaylistsPage />} />
            <Route path="/dashboard/edutube/playlists/:playlistId" element={<PlaylistDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  // ==========================================
  // SECTION 1: SEARCH & DISCOVERY (PHASE 3A)
  // ==========================================
  describe("Section 1: Video Search & Discovery", () => {
    it("1. EduTube route and header branding render correctly", async () => {
      vi.spyOn(EduTubeApi, "search").mockResolvedValueOnce({
        items: [mockVideoItem1],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 1,
        cached: false,
        query: "JavaScript full course",
      });

      renderWithRouter();

      expect(screen.getByText("EduTube")).toBeInTheDocument();
      expect(screen.getByText("Learning Layer")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/search courses, tutorials, technologies/i)
      ).toBeInTheDocument();
    });

    it("2. Search calls EduTubeApi.search with expected query parameters", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search").mockResolvedValue({
        items: [mockVideoItem1],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 1,
        cached: false,
        query: "React tutorial",
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("JavaScript Course for Beginners")).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/search courses, tutorials, technologies/i);
      fireEvent.change(input, { target: { value: "React tutorial" } });

      const searchBtn = screen.getByRole("button", { name: /submit search/i });
      expect(searchBtn).not.toBeDisabled();
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            q: "React tutorial",
          })
        );
      });
    });

    it("3. Search does not trigger API call for empty or whitespace query", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search").mockResolvedValue({
        items: [mockVideoItem1],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 1,
        cached: false,
        query: "JavaScript",
      });

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText("JavaScript Course for Beginners")).toBeInTheDocument();
      });

      searchSpy.mockClear();

      const input = screen.getByPlaceholderText(/search courses, tutorials, technologies/i);
      fireEvent.change(input, { target: { value: "   " } });

      const searchBtn = screen.getByRole("button", { name: /submit search/i });
      expect(searchBtn).toBeDisabled();
      expect(searchSpy).not.toHaveBeenCalled();
    });

    it("4. Empty results state renders with helpful search suggestions", async () => {
      vi.spyOn(EduTubeApi, "search").mockResolvedValueOnce({
        items: [],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 0,
        cached: false,
        query: "unknown_weird_query_xyz",
      });

      renderWithRouter("/dashboard/edutube?q=unknown_weird_query_xyz");

      await waitFor(() => {
        expect(
          screen.getByText(/no educational videos found for "unknown_weird_query_xyz"/i)
        ).toBeInTheDocument();
        expect(screen.getByText("Clear Search")).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // SECTION 2: CONTINUE LEARNING & PLAYBACK RESUME (PHASE 3B)
  // ==========================================
  describe("Section 2: Continue Learning & Playback Resume", () => {
    it("5. Continue Learning section renders in-progress lessons with progress percentage", async () => {
      vi.spyOn(EduTubeApi, "getContinueLearning").mockResolvedValueOnce({
        items: [
          {
            videoId: "W6NZfCO5SIk",
            title: "JavaScript Full Course",
            thumbnail: "https://example.com/thumb.jpg",
            channelTitle: "freeCodeCamp",
            durationSeconds: 3600,
            positionSeconds: 1800,
            remainingSeconds: 1800,
            percentage: 50,
            completed: false,
          },
        ],
      });

      render(
        <QueryClientProvider client={queryClient}>
          <ContinueLearningSection onContinueVideo={() => {}} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("JavaScript Full Course")).toBeInTheDocument();
        expect(screen.getByText("50% complete")).toBeInTheDocument();
        expect(screen.getByText("30m left")).toBeInTheDocument();
      });
    });

    it("6. VideoPlayer renders resume prompt and handles Start Over and Continue actions", async () => {
      vi.spyOn(EduTubeApi, "getProgress").mockResolvedValueOnce({
        videoId: "W6NZfCO5SIk",
        positionSeconds: 600,
        durationSeconds: 1200,
        completed: false,
        percentage: 50,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <VideoPlayer
            videoId="W6NZfCO5SIk"
            title="JavaScript Course"
            onBack={() => {}}
          />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Resume playback from/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /continue/i }));

      // Prompt dismissed and playback started
      await waitFor(() => {
        expect(screen.queryByText(/Resume playback from/i)).not.toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // SECTION 3: SAVED VIDEOS & BOOKMARKS (PHASE 3B)
  // ==========================================
  describe("Section 3: Saved Videos & Bookmarks", () => {
    it("7. VideoCard toggles real bookmark save mutation", async () => {
      vi.spyOn(EduTubeApi, "isVideoSaved").mockResolvedValueOnce({ isSaved: false });
      const saveSpy = vi.spyOn(EduTubeApi, "saveVideo").mockResolvedValueOnce({
        saved: {
          videoId: "W6NZfCO5SIk",
          title: "JavaScript Course",
          thumbnail: "",
          channelTitle: "",
          savedAt: new Date().toISOString(),
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <VideoCard video={mockVideoItem1} onWatch={() => {}} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save video/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /save video/i }));

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            videoId: "W6NZfCO5SIk",
          })
        );
      });
    });

    it("8. SavedVideosPage renders saved bookmark items", async () => {
      vi.spyOn(EduTubeApi, "getSavedVideos").mockResolvedValueOnce({
        items: [
          {
            videoId: "W6NZfCO5SIk",
            title: "Saved JavaScript Course",
            thumbnail: "https://example.com/thumb.jpg",
            channelTitle: "Mosh",
            savedAt: new Date().toISOString(),
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      renderWithRouter("/dashboard/edutube/saved");

      await waitFor(() => {
        expect(screen.getByText("Saved Videos & Bookmarks")).toBeInTheDocument();
        expect(screen.getByText("Saved JavaScript Course")).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // SECTION 4: PLAYLISTS & PROGRESS (PHASE 3B)
  // ==========================================
  describe("Section 4: Custom Playlists & Track Progress", () => {
    it("9. PlaylistsPage renders playlists with calculated progress percentage", async () => {
      vi.spyOn(EduTubeApi, "getPlaylists").mockResolvedValueOnce({
        playlists: [
          {
            _id: "pl123",
            name: "React Mastery Track",
            description: "From beginner to advanced",
            videos: [
              {
                videoId: "v1",
                title: "Lesson 1",
                thumbnail: "",
                channelTitle: "",
                durationSeconds: 100,
                addedAt: new Date().toISOString(),
              },
              {
                videoId: "v2",
                title: "Lesson 2",
                thumbnail: "",
                channelTitle: "",
                durationSeconds: 100,
                addedAt: new Date().toISOString(),
              },
            ],
            totalVideos: 2,
            completedVideos: 1,
            progressPercentage: 50,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      renderWithRouter("/dashboard/edutube/playlists");

      await waitFor(() => {
        expect(screen.getByText("My Learning Playlists")).toBeInTheDocument();
        expect(screen.getByText("React Mastery Track")).toBeInTheDocument();
        expect(screen.getByText("50% complete")).toBeInTheDocument();
        expect(screen.getByText("1/2 completed")).toBeInTheDocument();
      });
    });

    it("10. PlaylistDetailPage renders ordered lessons with completion status", async () => {
      vi.spyOn(EduTubeApi, "getPlaylist").mockResolvedValueOnce({
        playlist: {
          _id: "pl123",
          name: "React Mastery Track",
          description: "From beginner to advanced",
          videos: [
            {
              videoId: "v1",
              title: "React Fundamentals",
              thumbnail: "",
              channelTitle: "freeCodeCamp",
              durationSeconds: 500,
              addedAt: new Date().toISOString(),
              completed: true,
            },
            {
              videoId: "v2",
              title: "React Hooks Deep Dive",
              thumbnail: "",
              channelTitle: "freeCodeCamp",
              durationSeconds: 500,
              addedAt: new Date().toISOString(),
              completed: false,
            },
          ],
          totalVideos: 2,
          completedVideos: 1,
          progressPercentage: 50,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      renderWithRouter("/dashboard/edutube/playlists/pl123");

      await waitFor(() => {
        expect(screen.getByText("React Mastery Track")).toBeInTheDocument();
        expect(screen.getByText("React Fundamentals")).toBeInTheDocument();
        expect(screen.getByText("React Hooks Deep Dive")).toBeInTheDocument();
        expect(screen.getByText("1/2 Completed")).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // SECTION 5: VIDEO NOTES & HISTORY (PHASE 3B)
  // ==========================================
  describe("Section 5: Video Notes & History", () => {
    it("11. VideoNotes renders notes list and handles new note creation", async () => {
      vi.spyOn(EduTubeApi, "getVideoNotes").mockResolvedValueOnce({
        notes: [
          {
            _id: "n1",
            videoId: "W6NZfCO5SIk",
            content: "Closure encapsulates state safely",
            timestampSeconds: 125,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const createNoteSpy = vi.spyOn(EduTubeApi, "createVideoNote").mockResolvedValueOnce({
        note: {
          _id: "n2",
          videoId: "W6NZfCO5SIk",
          content: "UseEffect dependency array rule",
          timestampSeconds: 300,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <VideoNotes videoId="W6NZfCO5SIk" currentPlaybackSeconds={300} />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Closure encapsulates state safely")).toBeInTheDocument();
      });

      // Click Add Note button
      fireEvent.click(screen.getByRole("button", { name: /add note/i }));

      const textarea = screen.getByPlaceholderText(/write key takeaways/i);
      fireEvent.change(textarea, { target: { value: "UseEffect dependency array rule" } });

      fireEvent.click(screen.getByRole("button", { name: /save note/i }));

      await waitFor(() => {
        expect(createNoteSpy).toHaveBeenCalledWith(
          "W6NZfCO5SIk",
          expect.objectContaining({
            content: "UseEffect dependency array rule",
          })
        );
      });
    });

    it("12. HistoryPage renders grouped watch history and handles deletion", async () => {
      vi.spyOn(EduTubeApi, "getHistory").mockResolvedValueOnce({
        items: [
          {
            videoId: "W6NZfCO5SIk",
            title: "JavaScript Course",
            thumbnail: "https://example.com/thumb.jpg",
            channelTitle: "Mosh",
            durationSeconds: 1000,
            positionSeconds: 500,
            completed: false,
            watchedAt: new Date().toISOString(),
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      });

      const deleteSpy = vi.spyOn(EduTubeApi, "deleteHistoryItem").mockResolvedValueOnce({
        deleted: true,
        videoId: "W6NZfCO5SIk",
      });

      renderWithRouter("/dashboard/edutube/history");

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /^watch history$/i })).toBeInTheDocument();
        expect(screen.getByText("JavaScript Course")).toBeInTheDocument();
      });

      const delBtn = screen.getByRole("button", { name: /remove from history/i });
      fireEvent.click(delBtn);

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith("W6NZfCO5SIk");
      });
    });

    it("13. Security audit confirms zero YouTube API key in API client requests", async () => {
      const fetchSpy = vi.spyOn(apiModule, "apiRequest").mockResolvedValue({
        statusCode: 200,
        data: { history: {} },
        message: "success",
        success: true,
      });

      await EduTubeApi.recordHistory({ videoId: "test1", title: "Test Title" });

      expect(fetchSpy).toHaveBeenCalledWith(
        "/edutube/history",
        expect.objectContaining({ method: "POST" })
      );

      const calledBody = fetchSpy.mock.calls[0][1]?.body;
      expect(calledBody).not.toContain("key=");
      expect(calledBody).not.toContain("AIza");
    });
  });
});
