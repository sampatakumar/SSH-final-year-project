import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  BookOpen,
  Award,
  Video,
  ListVideo,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/core/auth";
import { EduTubeApi } from "../services/edutube.api";
import { EduTubeHeader } from "../components/EduTubeHeader";
import { EduTubeSidebar } from "../components/EduTubeSidebar";
import { FilterBar } from "../components/FilterBar";
import { CategorySection } from "../components/CategorySection";
import { ContinueLearningSection } from "../components/ContinueLearningSection";
import { VideoGrid } from "../components/VideoGrid";
import { VideoPlayer } from "../components/VideoPlayer";
import { VideoDetails } from "../components/VideoDetails";
import { PersonalizedFeed } from "../components/PersonalizedFeed";
import type {
  EduTubeVideoItem,
  EduTubeLanguage,
  EduTubeLevel,
  EduTubeDuration,
  EduTubeSort,
} from "../types/edutube.types";

export const EduTubePage: React.FC = () => {
  const { authInitialized, firebaseUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter State — submittedQuery controls active search mode
  const initialSubmittedQuery = searchParams.get("q") || "";
  const [submittedQuery, setSubmittedQuery] = useState<string>(initialSubmittedQuery);
  const [displayQuery, setDisplayQuery] = useState<string>(initialSubmittedQuery);
  const [language, setLanguage] = useState<EduTubeLanguage>((searchParams.get("lang") as EduTubeLanguage) || "all");
  const [level, setLevel] = useState<EduTubeLevel>((searchParams.get("level") as EduTubeLevel) || "all");
  const [duration, setDuration] = useState<EduTubeDuration>((searchParams.get("dur") as EduTubeDuration) || "all");
  const [sort, setSort] = useState<EduTubeSort>((searchParams.get("sort") as EduTubeSort) || "relevance");

  // Video State
  const [videos, setVideos] = useState<EduTubeVideoItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<EduTubeVideoItem | null>(null);

  // Playback & Seeking State
  const [currentPlaybackSeconds, setCurrentPlaybackSeconds] = useState(0);
  const [seekToSeconds, setSeekToSeconds] = useState<number | null>(null);

  // Loading & Error States (Initial loading is true only if explicit query is present)
  const [isLoading, setIsLoading] = useState(Boolean(initialSubmittedQuery.trim()));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize routeVideoId if navigated directly to watch route
  useEffect(() => {
    if (routeVideoId) {
      if (!activeVideo || activeVideo.videoId !== routeVideoId) {
        setActiveVideo({
          videoId: routeVideoId,
          title: "Video Lesson",
          description: "",
          thumbnail: { default: "" },
          channelId: "",
          channelTitle: "",
          publishedAt: "",
          embedUrl: `https://www.youtube.com/embed/${routeVideoId}`,
          youtubeUrl: `https://www.youtube.com/watch?v=${routeVideoId}`,
        });
      }
    }
  }, [routeVideoId]);

  // Execute Video Search — only called when a non-empty submitted query exists
  const fetchVideos = useCallback(
    async (
      searchQuery: string,
      targetLanguage = language,
      targetLevel = level,
      targetDuration = duration,
      targetSort = sort,
      pageTokenToFetch?: string
    ) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setVideos([]);
        setIsLoading(false);
        return;
      }

      const isLoadMore = Boolean(pageTokenToFetch);

      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await EduTubeApi.search({
          q: trimmed,
          language: targetLanguage,
          level: targetLevel,
          duration: targetDuration,
          sort: targetSort,
          pageToken: pageTokenToFetch,
          maxResults: 12,
        });

        if (isLoadMore) {
          setVideos((prev) => {
            const existingIds = new Set(prev.map((v) => v.videoId));
            const newItems = (result.items || []).filter((item) => !existingIds.has(item.videoId));
            return [...prev, ...newItems];
          });
        } else {
          setVideos(result.items || []);
        }

        setNextPageToken(result.nextPageToken || null);
        setDisplayQuery(trimmed);
      } catch (err: any) {
        console.error("EduTube search error:", err);
        setError(err.message || "Failed to load educational lessons. Please try again.");
        if (!isLoadMore) {
          setVideos([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [language, level, duration, sort]
  );

  // Synchronize state with searchParams (initial load & navigation changes)
  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    const trimmed = qParam.trim();
    if (trimmed) {
      setSubmittedQuery(trimmed);
      setDisplayQuery(trimmed);
      fetchVideos(trimmed);
    } else {
      setSubmittedQuery("");
      setDisplayQuery("");
      setVideos([]);
      setIsLoading(false);
    }
  }, [searchParams]);

  // Learning Stats query
  const { data: statsData } = useQuery({
    queryKey: ["edutube", "stats"],
    queryFn: () => EduTubeApi.getLearningStats(),
    enabled: authInitialized && Boolean(firebaseUser),
    staleTime: 1000 * 5,
  });

  const stats = statsData?.stats || {
    videosWatched: 0,
    completedVideos: 0,
    activePlaylists: 0,
    savedVideos: 0,
  };

  const handleSearchSubmit = (newQuery: string) => {
    if (!newQuery?.trim()) return;
    const trimmed = newQuery.trim();
    const params = new URLSearchParams(searchParams);
    params.set("q", trimmed);
    setSearchParams(params);
  };

  const handleSelectTechnology = (techQuery: string) => {
    handleSearchSubmit(techQuery);
  };

  const handleClearSearch = () => {
    setSubmittedQuery("");
    setDisplayQuery("");
    setVideos([]);
    setNextPageToken(null);
    setError(null);
    setIsLoading(false);
    const params = new URLSearchParams(searchParams);
    params.delete("q");
    setSearchParams(params);
  };

  const handleLanguageChange = (newLang: EduTubeLanguage) => {
    setLanguage(newLang);
    const params = new URLSearchParams(searchParams);
    if (newLang === "all") params.delete("lang");
    else params.set("lang", newLang);
    setSearchParams(params);
    if (submittedQuery) {
      fetchVideos(submittedQuery, newLang, level, duration, sort);
    }
  };

  const handleLevelChange = (newLevel: EduTubeLevel) => {
    setLevel(newLevel);
    const params = new URLSearchParams(searchParams);
    if (newLevel === "all") params.delete("level");
    else params.set("level", newLevel);
    setSearchParams(params);
    if (submittedQuery) {
      fetchVideos(submittedQuery, language, newLevel, duration, sort);
    }
  };

  const handleDurationChange = (newDuration: EduTubeDuration) => {
    setDuration(newDuration);
    const params = new URLSearchParams(searchParams);
    if (newDuration === "all") params.delete("dur");
    else params.set("dur", newDuration);
    setSearchParams(params);
    if (submittedQuery) {
      fetchVideos(submittedQuery, language, level, newDuration, sort);
    }
  };

  const handleSortChange = (newSort: EduTubeSort) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams);
    if (newSort === "relevance") params.delete("sort");
    else params.set("sort", newSort);
    setSearchParams(params);
    if (submittedQuery) {
      fetchVideos(submittedQuery, language, level, duration, newSort);
    }
  };

  const handleResetFilters = () => {
    setLanguage("all");
    setLevel("all");
    setDuration("all");
    setSort("relevance");
    if (submittedQuery) {
      fetchVideos(submittedQuery, "all", "all", "all", "relevance");
    }
  };

  const handleWatchVideo = (video: EduTubeVideoItem | string) => {
    if (typeof video === "string") {
      setActiveVideo({
        videoId: video,
        title: "Video Lesson",
        description: "",
        thumbnail: { default: "" },
        channelId: "",
        channelTitle: "",
        publishedAt: "",
        embedUrl: `https://www.youtube.com/embed/${video}`,
        youtubeUrl: `https://www.youtube.com/watch?v=${video}`,
      });
    } else {
      setActiveVideo(video);
    }
    setSeekToSeconds(null);
    setCurrentPlaybackSeconds(0);
    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
      try {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {}
    }
  };

  const handleBackToList = () => {
    setActiveVideo(null);
    setSeekToSeconds(null);
    queryClient.invalidateQueries({ queryKey: ["edutube"] });
    if (routeVideoId) {
      navigate("/dashboard/edutube");
    }
  };

  const isSearchActive = Boolean(submittedQuery && submittedQuery.trim().length > 0);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-150">
      {/* Top Header */}
      <EduTubeHeader
        searchQuery={displayQuery}
        onSearch={handleSearchSubmit}
        onClear={handleClearSearch}
        isLoading={isLoading}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sidebar Navigation */}
        <EduTubeSidebar />

        {/* Main Content Area */}
        <main className="flex-1 w-full space-y-6 min-w-0">
          {activeVideo ? (
            /* Dedicated Video Player View */
            <div className="space-y-6">
              <VideoPlayer
                videoId={activeVideo.videoId}
                title={activeVideo.title}
                thumbnail={activeVideo.thumbnail?.high || activeVideo.thumbnail?.default}
                channelTitle={activeVideo.channelTitle}
                onBack={handleBackToList}
                onSeekPositionChange={(sec) => setCurrentPlaybackSeconds(sec)}
                seekToSeconds={seekToSeconds}
              />

              <VideoDetails
                videoId={activeVideo.videoId}
                initialVideo={activeVideo}
                currentPlaybackSeconds={currentPlaybackSeconds}
                onSelectRelatedVideo={handleWatchVideo}
                onSeekTo={(sec) => setSeekToSeconds(sec)}
              />
            </div>
          ) : isSearchActive ? (
            /* SEARCH MODE: Search Results Primary, Followed by Recommendations */
            <div className="space-y-8 animate-in fade-in-50 duration-200">
              {/* Technology Category Chips */}
              <CategorySection
                activeQuery={submittedQuery}
                onSelectTechnology={handleSelectTechnology}
              />

              {/* Filters Bar */}
              <FilterBar
                language={language}
                level={level}
                duration={duration}
                sort={sort}
                onLanguageChange={handleLanguageChange}
                onLevelChange={handleLevelChange}
                onDurationChange={handleDurationChange}
                onSortChange={handleSortChange}
                onReset={handleResetFilters}
              />

              {/* Search Results Header */}
              <div className="flex items-center justify-between pt-2 border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    Educational Lessons for "{displayQuery}"
                  </h2>
                </div>
                {!isLoading && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {videos.length} videos displayed
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSearch}
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear Search
                    </Button>
                  </div>
                )}
              </div>

              {/* Responsive Video Grid with Skeletons & Load More */}
              <VideoGrid
                videos={videos}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                error={error}
                hasMore={Boolean(nextPageToken)}
                onLoadMore={() =>
                  fetchVideos(submittedQuery, language, level, duration, sort, nextPageToken || undefined)
                }
                onWatch={handleWatchVideo}
                onRetry={() => fetchVideos(submittedQuery)}
                query={displayQuery}
                onClearQuery={handleClearSearch}
                onSelectSuggestion={(s) => handleSearchSubmit(s)}
              />

              {/* Recommendations remain available in search mode below search results */}
              <div className="pt-8 border-t border-border/30 space-y-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="text-base font-bold text-foreground">
                    Recommended for You
                  </h2>
                </div>
                <PersonalizedFeed onWatch={handleWatchVideo} />
              </div>
            </div>
          ) : (
            /* DEFAULT PERSONALIZED MODE: No Search Called Initially */
            <div className="space-y-8 animate-in fade-in-50 duration-200">
              {/* Learning Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-surface/80 border border-border/40 rounded-xl space-y-1 shadow-neo-raised-sm">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    Videos Watched
                  </span>
                  <p className="text-lg font-black text-foreground">{stats.videosWatched}</p>
                </div>

                <div className="p-3 bg-surface/80 border border-border/40 rounded-xl space-y-1 shadow-neo-raised-sm">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-success" />
                    Completed
                  </span>
                  <p className="text-lg font-black text-foreground">{stats.completedVideos}</p>
                </div>

                <div className="p-3 bg-surface/80 border border-border/40 rounded-xl space-y-1 shadow-neo-raised-sm">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <ListVideo className="h-3.5 w-3.5 text-primary" />
                    Playlists
                  </span>
                  <p className="text-lg font-black text-foreground">{stats.activePlaylists}</p>
                </div>

                <div className="p-3 bg-surface/80 border border-border/40 rounded-xl space-y-1 shadow-neo-raised-sm">
                  <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                    <Bookmark className="h-3.5 w-3.5 text-warning" />
                    Saved
                  </span>
                  <p className="text-lg font-black text-foreground">{stats.savedVideos}</p>
                </div>
              </div>

              {/* Continue Learning Active Section */}
              <ContinueLearningSection onContinueVideo={handleWatchVideo} />

              {/* AI Personalized Learning Feed */}
              <PersonalizedFeed onWatch={handleWatchVideo} />

              {/* Technology Category Chips / Curated Tracks */}
              <div className="pt-4 border-t border-border/30">
                <CategorySection
                  activeQuery={submittedQuery}
                  onSelectTechnology={handleSelectTechnology}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EduTubePage;
