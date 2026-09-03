import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  BookOpen,
  Layers,
  Flame,
  Search,
  Award,
  Video,
  ListVideo,
  Bookmark,
  Compass,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { videoId: routeVideoId } = useParams<{ videoId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter State
  const initialQuery = searchParams.get("q") || "JavaScript full course";
  const [query, setQuery] = useState(initialQuery);
  const [displayQuery, setDisplayQuery] = useState(initialQuery);
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

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
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

  // Execute Video Search
  const fetchVideos = useCallback(
    async (
      searchQuery: string,
      targetLanguage = language,
      targetLevel = level,
      targetDuration = duration,
      targetSort = sort,
      pageTokenToFetch?: string
    ) => {
      if (!searchQuery.trim()) return;

      const isLoadMore = Boolean(pageTokenToFetch);

      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const result = await EduTubeApi.search({
          q: searchQuery,
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
        setDisplayQuery(searchQuery);
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

  // Initial catalog load on mount
  useEffect(() => {
    fetchVideos(initialQuery);
  }, []);

  // Synchronize when searchParams change
  useEffect(() => {
    const qParam = searchParams.get("q");
    if (qParam && qParam !== query) {
      setQuery(qParam);
      fetchVideos(qParam);
    }
  }, [searchParams]);

  // Learning Stats query (Phase 3B)
  const { data: statsData } = useQuery({
    queryKey: ["edutube", "stats"],
    queryFn: () => EduTubeApi.getLearningStats(),
    staleTime: 1000 * 5,
  });

  const stats = statsData?.stats || {
    videosWatched: 0,
    completedVideos: 0,
    activePlaylists: 0,
    savedVideos: 0,
  };

  const handleSearchSubmit = (searchQuery: string) => {
    setQuery(searchQuery);
    const params = new URLSearchParams(searchParams);
    params.set("q", searchQuery);
    setSearchParams(params);
    fetchVideos(searchQuery);
  };

  const handleSelectTechnology = (techQuery: string) => {
    setQuery(techQuery);
    const params = new URLSearchParams(searchParams);
    params.set("q", techQuery);
    setSearchParams(params);
    fetchVideos(techQuery);
  };

  const handleLanguageChange = (newLang: EduTubeLanguage) => {
    setLanguage(newLang);
    const params = new URLSearchParams(searchParams);
    if (newLang === "all") params.delete("lang");
    else params.set("lang", newLang);
    setSearchParams(params);
    fetchVideos(query, newLang, level, duration, sort);
  };

  const handleLevelChange = (newLevel: EduTubeLevel) => {
    setLevel(newLevel);
    const params = new URLSearchParams(searchParams);
    if (newLevel === "all") params.delete("level");
    else params.set("level", newLevel);
    setSearchParams(params);
    fetchVideos(query, language, newLevel, duration, sort);
  };

  const handleDurationChange = (newDuration: EduTubeDuration) => {
    setDuration(newDuration);
    const params = new URLSearchParams(searchParams);
    if (newDuration === "all") params.delete("dur");
    else params.set("dur", newDuration);
    setSearchParams(params);
    fetchVideos(query, language, level, newDuration, sort);
  };

  const handleSortChange = (newSort: EduTubeSort) => {
    setSort(newSort);
    const params = new URLSearchParams(searchParams);
    if (newSort === "relevance") params.delete("sort");
    else params.set("sort", newSort);
    setSearchParams(params);
    fetchVideos(query, language, level, duration, newSort);
  };

  const handleResetFilters = () => {
    setLanguage("all");
    setLevel("all");
    setDuration("all");
    setSort("relevance");
    fetchVideos(query, "all", "all", "all", "relevance");
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

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-150">
      {/* Top Header */}
      <EduTubeHeader
        searchQuery={query}
        onSearch={handleSearchSubmit}
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
          ) : (
            /* Discovery & AI Personalized Feed View */
            <div className="space-y-8">
              {/* Learning Stats Bar (Phase 3B) */}
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

              {/* Continue Learning Active Section (Phase 3B) */}
              <ContinueLearningSection onContinueVideo={handleWatchVideo} />

              {/* Phase 3C: AI Personalized Learning Feed */}
              <PersonalizedFeed onWatch={handleWatchVideo} />

              {/* Phase 3A: Search, Categories & Filters */}
              <div className="space-y-6 pt-4 border-t border-border/30 animate-in fade-in-50 duration-200">
                {/* Technology Category Chips */}
                <CategorySection
                  activeQuery={query}
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
                    <span className="text-xs font-semibold text-muted-foreground">
                      {videos.length} videos displayed
                    </span>
                  )}
                </div>

                {/* Responsive Video Grid with Skeletons & Load More */}
                <VideoGrid
                  videos={videos}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingMore}
                  error={error}
                  hasMore={Boolean(nextPageToken)}
                  onLoadMore={() => fetchVideos(query, language, level, duration, sort, nextPageToken || undefined)}
                  onWatch={handleWatchVideo}
                  onRetry={() => fetchVideos(query)}
                  query={displayQuery}
                  onClearQuery={() => handleSearchSubmit("JavaScript tutorial")}
                  onSelectSuggestion={(s) => handleSearchSubmit(s)}
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
