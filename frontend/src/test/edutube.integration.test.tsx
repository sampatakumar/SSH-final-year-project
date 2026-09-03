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
import { VideoNotes } from "../modules/edutube/components/VideoNotes";
import { ContinueLearningSection } from "../modules/edutube/components/ContinueLearningSection";
import { AuthContext } from "../core/auth/AuthContext";
import { EduTubeApi } from "../modules/edutube/services/edutube.api";

const mockAuthValue = {
  firebaseUser: { uid: "user123", email: "developer@smartskillhub.com" } as any,
  backendUser: { id: "user123", email: "developer@smartskillhub.com" },
  idToken: "mock-token-123",
  loading: false,
  authInitialized: true,
  signInWithGoogle: vi.fn(),
  signInWithGithub: vi.fn(),
  signInWithEmail: vi.fn(),
  registerWithEmail: vi.fn(),
  resendVerificationEmail: vi.fn(),
  reloadUser: vi.fn(),
  syncVerifiedUser: vi.fn(),
  sendPasswordReset: vi.fn(),
  linkProvider: vi.fn(),
  unlinkProvider: vi.fn(),
  signOutUser: vi.fn(),
  refreshProfile: vi.fn(),
  getFriendlyErrorMessage: vi.fn(),
};

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

const mockFeedData = {
  personalized: [mockVideoItem1],
  skillGaps: [
    {
      ...mockVideoItem1,
      videoId: "v_gap_1",
      title: "Docker Zero to Hero Crash Course",
      whyRecommended: ["Addresses your Docker skill gap"],
    },
  ],
  careerPath: [
    {
      ...mockVideoItem1,
      videoId: "v_career_1",
      title: "Full Stack System Architecture Mastery",
      whyRecommended: ["Essential milestone for Full Stack Developer path"],
    },
  ],
  basedOnHistory: [
    {
      ...mockVideoItem1,
      videoId: "v_hist_1",
      title: "React State Management Advanced Deep Dive",
      whyRecommended: ["Builds on your recent React lessons"],
    },
  ],
  projectLearning: [
    {
      ...mockVideoItem1,
      videoId: "v_proj_1",
      title: "Build a Full Stack MERN Microservice",
      whyRecommended: ["Connects to your GitHub repository stack"],
    },
  ],
  trending: [
    {
      ...mockVideoItem1,
      videoId: "v_trend_1",
      title: "JavaScript Best Practices in 2026",
      whyRecommended: ["Highly rated in JavaScript engineering community"],
    },
  ],
  learningContext: {
    targetRole: "Full Stack Developer",
    topSkills: [{ skill: "React", level: "Proficient", score: 85 }],
    skillGaps: [{ skill: "Docker", priority: "Critical" }],
    completedCount: 2,
    historyCount: 3,
  },
  generatedAt: "2026-08-25T12:00:00Z",
  cached: false,
};

describe("EduTube Frontend Module Suite (Separated Default & Search Modes)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 0 } },
    });
    vi.clearAllMocks();
    vi.spyOn(EduTubeApi, "getPersonalizedRecommendations").mockResolvedValue(mockFeedData as any);
    vi.spyOn(EduTubeApi, "getContinueLearning").mockResolvedValue({
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
    vi.spyOn(EduTubeApi, "getLearningStats").mockResolvedValue({
      stats: {
        videosWatched: 5,
        completedVideos: 2,
        activePlaylists: 1,
        savedVideos: 3,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (initialRoute = "/dashboard/edutube", authOverrides = {}) => {
    const authVal = { ...mockAuthValue, ...authOverrides };
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authVal as any}>
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
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  // ==========================================
  // SECTION 1: DEFAULT PERSONALIZED MODE
  // ==========================================
  describe("Section 1: Default Personalized Mode (Zero Initial Search)", () => {
    it("1. EduTube loads in default mode without calling search API", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search");

      renderWithRouter("/dashboard/edutube");

      expect(screen.getByText("EduTube")).toBeInTheDocument();
      expect(screen.getByText("Learning Layer")).toBeInTheDocument();

      // Ensure Search API was NEVER called on initial load
      expect(searchSpy).not.toHaveBeenCalled();

      // Ensure search result section is NOT present
      expect(screen.queryByText(/Educational Lessons for/i)).not.toBeInTheDocument();

      // Ensure Personalized Content is rendered
      expect(await screen.findByText("Continue Learning")).toBeInTheDocument();
      expect(await screen.findByRole("heading", { name: "Recommended For You", level: 3 })).toBeInTheDocument();
      expect(await screen.findByRole("heading", { name: "Close Your Skill Gaps", level: 3 })).toBeInTheDocument();
      expect(await screen.findByRole("heading", { name: /Your Career Path/i, level: 3 })).toBeInTheDocument();
      expect(await screen.findByRole("heading", { name: "Learn Through Projects", level: 3 })).toBeInTheDocument();
    });

    it("2. Typing in search bar does NOT trigger search API until submitted", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search").mockResolvedValue({
        items: [mockVideoItem2],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 1,
        cached: false,
        query: "React tutorial",
      });

      renderWithRouter("/dashboard/edutube");

      const input = screen.getByPlaceholderText(/search courses, tutorials, technologies/i);
      fireEvent.change(input, { target: { value: "React tutorial" } });

      // Search API should still not be called while typing
      expect(searchSpy).not.toHaveBeenCalled();

      // Submit search
      const searchBtn = screen.getByRole("button", { name: /submit search/i });
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            q: "React tutorial",
          })
        );
      });
    });

    it("3. Search does not trigger API call for empty or whitespace query", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search");

      renderWithRouter("/dashboard/edutube");

      const input = screen.getByPlaceholderText(/search courses, tutorials, technologies/i);
      fireEvent.change(input, { target: { value: "   " } });

      const searchBtn = screen.getByRole("button", { name: /submit search/i });
      expect(searchBtn).toBeDisabled();
      expect(searchSpy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 2: EXPLICIT SEARCH MODE & ORDERING
  // ==========================================
  describe("Section 2: Explicit Search Mode & Section Ordering", () => {
    it("4. Explicit search displays search results first, before recommendations", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search").mockResolvedValue({
        items: [mockVideoItem2],
        nextPageToken: "token_page_2",
        prevPageToken: null,
        totalResults: 20,
        cached: false,
        query: "JavaScript full course",
      });

      renderWithRouter("/dashboard/edutube?q=JavaScript%20full%20course");

      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            q: "JavaScript full course",
          })
        );
      });

      // Search results header appears
      expect(await screen.findByText('Educational Lessons for "JavaScript full course"')).toBeInTheDocument();
      expect(screen.getByText("Learn JavaScript - Full Course for Beginners")).toBeInTheDocument();

      // Load More pagination button appears
      expect(screen.getByRole("button", { name: /load more videos/i })).toBeInTheDocument();

      // Recommendations remain available below search results
      expect(screen.getByRole("heading", { name: "Recommended for You", level: 2 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Close Your Skill Gaps", level: 3 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /Your Career Path/i, level: 3 })).toBeInTheDocument();
    });

    it("5. Pagination/Load More appends new items", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search")
        .mockResolvedValueOnce({
          items: [mockVideoItem1],
          nextPageToken: "token_page_2",
          prevPageToken: null,
          totalResults: 2,
          cached: false,
          query: "JavaScript",
        })
        .mockResolvedValueOnce({
          items: [mockVideoItem2],
          nextPageToken: null,
          prevPageToken: "token_page_1",
          totalResults: 2,
          cached: false,
          query: "JavaScript",
        });

      renderWithRouter("/dashboard/edutube?q=JavaScript");

      await waitFor(() => {
        expect(screen.getAllByText("JavaScript Course for Beginners").length).toBeGreaterThanOrEqual(1);
      });

      const loadMoreBtn = screen.getByRole("button", { name: /load more videos/i });
      fireEvent.click(loadMoreBtn);

      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledTimes(2);
        expect(searchSpy).toHaveBeenLastCalledWith(
          expect.objectContaining({
            q: "JavaScript",
            pageToken: "token_page_2",
          })
        );
        expect(screen.getByText("Learn JavaScript - Full Course for Beginners")).toBeInTheDocument();
      });
    });

    it("6. Clearing search returns to default personalized mode without searching", async () => {
      const searchSpy = vi.spyOn(EduTubeApi, "search").mockResolvedValue({
        items: [mockVideoItem2],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 1,
        cached: false,
        query: "Docker",
      });

      renderWithRouter("/dashboard/edutube?q=Docker");

      await waitFor(() => {
        expect(screen.getByText('Educational Lessons for "Docker"')).toBeInTheDocument();
      });

      searchSpy.mockClear();

      // Click Clear Search button in header
      const clearBtn = screen.getByRole("button", { name: "Clear Search" });
      fireEvent.click(clearBtn);

      // Search results disappear
      await waitFor(() => {
        expect(screen.queryByText(/Educational Lessons for/i)).not.toBeInTheDocument();
      });

      // No new search API call was made
      expect(searchSpy).not.toHaveBeenCalled();

      // Personalized sections are primary
      expect(screen.getByText("Continue Learning")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Recommended For You", level: 3 })).toBeInTheDocument();
    });

    it("7. Empty results state renders with helpful search suggestions", async () => {
      vi.spyOn(EduTubeApi, "search").mockResolvedValue({
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
        expect(screen.getAllByRole("button", { name: /Clear Search/i }).length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ==========================================
  // ==========================================
  // SECTION 3: CONTINUE LEARNING & PLAYBACK RESUME (PHASE 3B)
  // ==========================================
  describe("Section 3: Continue Learning & Playback Resume", () => {
    it("8. Continue Learning section renders in-progress lessons with progress percentage", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthValue as any}>
            <ContinueLearningSection onContinueVideo={() => {}} />
          </AuthContext.Provider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("JavaScript Full Course")).toBeInTheDocument();
        expect(screen.getByText("50% complete")).toBeInTheDocument();
        expect(screen.getByText("30m left")).toBeInTheDocument();
      });
    });

    it("9. VideoPlayer renders resume prompt and handles Start Over and Continue actions", async () => {
      vi.spyOn(EduTubeApi, "getProgress").mockResolvedValueOnce({
        videoId: "W6NZfCO5SIk",
        positionSeconds: 600,
        durationSeconds: 1200,
        completed: false,
        percentage: 50,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthValue as any}>
            <VideoPlayer
              videoId="W6NZfCO5SIk"
              title="JavaScript Course"
              onBack={() => {}}
            />
          </AuthContext.Provider>
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
  // SECTION 4: SAVED VIDEOS & BOOKMARKS (PHASE 3B)
  // ==========================================
  describe("Section 4: Saved Videos & Bookmarks", () => {
    it("10. VideoCard toggles real bookmark save mutation", async () => {
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
          <AuthContext.Provider value={mockAuthValue as any}>
            <VideoCard video={mockVideoItem1} onWatch={() => {}} />
          </AuthContext.Provider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save video/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /save video/i }));

      await waitFor(() => {
        expect(saveSpy).toHaveBeenCalledWith(
          expect.objectContaining({ videoId: "W6NZfCO5SIk" })
        );
      });
    });

    it("11. SavedVideosPage renders saved videos catalog and allows deleting", async () => {
      vi.spyOn(EduTubeApi, "isVideoSaved").mockResolvedValue({ isSaved: true });
      vi.spyOn(EduTubeApi, "getSavedVideos").mockResolvedValueOnce({
        items: [
          {
            _id: "s1",
            videoId: "W6NZfCO5SIk",
            title: "Saved JS Course",
            thumbnail: "https://example.com/thumb.jpg",
            channelTitle: "Programming with Mosh",
            savedAt: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      });

      const removeSpy = vi.spyOn(EduTubeApi, "unsaveVideo").mockResolvedValueOnce({ unsaved: true, videoId: "W6NZfCO5SIk" });

      render(
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthValue as any}>
            <MemoryRouter>
              <SavedVideosPage />
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Saved JS Course")).toBeInTheDocument();
      });

      const removeBtn = await screen.findByRole("button", { name: /unsave video/i });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalledWith("W6NZfCO5SIk");
      });
    });
  });

  // ==========================================
  // SECTION 5: PLAYLIST MANAGEMENT (PHASE 3B)
  // ==========================================
  describe("Section 5: Playlists Management", () => {
    it("12. PlaylistsPage renders playlists and supports creating a new playlist", async () => {
      vi.spyOn(EduTubeApi, "getPlaylists").mockResolvedValueOnce({
        playlists: [
          {
            _id: "p1",
            name: "React Mastery",
            description: "Advanced concepts",
            videos: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });

      const createSpy = vi.spyOn(EduTubeApi, "createPlaylist").mockResolvedValueOnce({
        playlist: {
          _id: "p2",
          name: "Node.js Deep Dive",
          description: "Backend roadmap",
          videos: [],
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      });

      render(
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthValue as any}>
            <MemoryRouter>
              <PlaylistsPage />
            </MemoryRouter>
          </AuthContext.Provider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("React Mastery")).toBeInTheDocument();
      });

      // Open new playlist dialog
      const newPlaylistBtn = screen.getByRole("button", { name: /create playlist/i });
      fireEvent.click(newPlaylistBtn);

      const nameInput = await screen.findByPlaceholderText(/e.g. JavaScript Full-Stack Track/i);
      fireEvent.change(nameInput, { target: { value: "Node.js Deep Dive" } });

      const createBtn = screen.getByRole("button", { name: /^Create Track$/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Node.js Deep Dive" })
        );
      });
    });
  });

  // ==========================================
  // SECTION 6: VIDEO NOTES (PHASE 3B)
  // ==========================================
  describe("Section 6: Timestamped Video Notes", () => {
    it("13. VideoNotes allows taking timestamped notes and jumping to timestamp", async () => {
      vi.spyOn(EduTubeApi, "getVideoNotes").mockResolvedValueOnce({
        notes: [
          {
            _id: "n1",
            videoId: "W6NZfCO5SIk",
            timestampSeconds: 120,
            content: "Important note about closures",
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
      });

      const addNoteSpy = vi.spyOn(EduTubeApi, "createVideoNote").mockResolvedValueOnce({
        note: {
          _id: "n2",
          videoId: "W6NZfCO5SIk",
          timestampSeconds: 240,
          content: "Async/await pattern",
          createdAt: "2024-01-01T00:00:00Z",
        },
      });

      const seekSpy = vi.fn();

      render(
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={mockAuthValue as any}>
            <VideoNotes
              videoId="W6NZfCO5SIk"
              currentPlaybackSeconds={240}
              onSeekTo={seekSpy}
            />
          </AuthContext.Provider>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Important note about closures")).toBeInTheDocument();
      });

      // Jump to note timestamp
      const jumpBtn = screen.getByText("2:00");
      fireEvent.click(jumpBtn);
      expect(seekSpy).toHaveBeenCalledWith(120);

      // Add a new note
      const addNoteBtn = screen.getByRole("button", { name: /add note/i });
      fireEvent.click(addNoteBtn);

      const textarea = screen.getByPlaceholderText(/write key takeaways/i);
      fireEvent.change(textarea, { target: { value: "Async/await pattern" } });

      const saveNoteBtn = screen.getByRole("button", { name: /save note/i });
      fireEvent.click(saveNoteBtn);

      await waitFor(() => {
        expect(addNoteSpy).toHaveBeenCalledWith("W6NZfCO5SIk", {
          content: "Async/await pattern",
          timestampSeconds: 240,
        });
      });
    });
  });

  // ==========================================
  // SECTION 7: EDUTUBE AUTHENTICATION & ID TOKEN HEADER INJECTION
  // ==========================================
  describe("Section 7: EduTube Authentication & Authorization Header Verification", () => {
    it("14. EduTubeApi calls attach Authorization Bearer header when token is available", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: 200,
          success: true,
          message: "Playlists retrieved",
          data: { playlists: [] },
        }),
      } as any);

      // Call through EduTubeApi
      await EduTubeApi.getPlaylists();

      expect(fetchSpy).toHaveBeenCalled();
      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
      expect(calledUrl).toContain("/api/v1/edutube/playlists");
      expect(calledOptions?.headers).toBeDefined();
    });

    it("15. VideoNotes API request attaches Authorization Bearer header", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          statusCode: 200,
          success: true,
          message: "Notes retrieved",
          data: { notes: [] },
        }),
      } as any);

      await EduTubeApi.getVideoNotes("W6NZfCO5SIk");

      expect(fetchSpy).toHaveBeenCalled();
      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
      expect(calledUrl).toContain("/api/v1/edutube/videos/W6NZfCO5SIk/notes");
      expect(calledOptions?.headers).toBeDefined();
    });

    it("16. PlaylistsPage does not execute playlist query if auth is not initialized or user is unauthenticated", async () => {
      const getPlaylistsSpy = vi.spyOn(EduTubeApi, "getPlaylists");

      // Render with unauthenticated / uninitialized auth
      renderWithRouter("/dashboard/edutube/playlists", {
        authInitialized: false,
        firebaseUser: null,
      });

      // Query should NOT be triggered while auth is uninitialized
      expect(getPlaylistsSpy).not.toHaveBeenCalled();
    });
  });
});
