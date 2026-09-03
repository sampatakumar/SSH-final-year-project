import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  Clock,
  Calendar,
  Share2,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { EduTubeApi } from "../services/edutube.api";
import { formatViews, formatPublishedDate } from "../utils/edutube.utils";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { VideoNotes } from "./VideoNotes";
import type { EduTubeVideoDetail, EduTubeVideoItem } from "../types/edutube.types";

export interface VideoDetailsProps {
  videoId: string;
  initialVideo?: EduTubeVideoItem | null;
  currentPlaybackSeconds?: number;
  onSelectRelatedVideo: (video: EduTubeVideoItem) => void;
  onSeekTo?: (seconds: number) => void;
}

export const VideoDetails: React.FC<VideoDetailsProps> = ({
  videoId,
  initialVideo,
  currentPlaybackSeconds = 0,
  onSelectRelatedVideo,
  onSeekTo,
}) => {
  const queryClient = useQueryClient();
  const [video, setVideo] = useState<EduTubeVideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Related videos state
  const [relatedVideos, setRelatedVideos] = useState<EduTubeVideoItem[]>([]);

  // Saved bookmark query
  const { data: savedData } = useQuery({
    queryKey: ["edutube", "is-saved", videoId],
    queryFn: () => EduTubeApi.isVideoSaved(videoId),
    enabled: Boolean(videoId),
  });

  const isSaved = Boolean(savedData?.isSaved);

  const saveMutation = useMutation({
    mutationFn: () =>
      EduTubeApi.saveVideo({
        videoId,
        title: video?.title || initialVideo?.title || "Video",
        thumbnail: video?.thumbnails?.high || initialVideo?.thumbnail?.high || "",
        channelTitle: video?.channel || initialVideo?.channelTitle || "",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "is-saved", videoId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Lesson saved to bookmarks!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save video");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => EduTubeApi.unsaveVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "is-saved", videoId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Lesson removed from bookmarks");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove video");
    },
  });

  const handleToggleSave = () => {
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const res = await EduTubeApi.getVideo(videoId);
        if (!isCancelled) {
          setVideo(res.video);

          // Fetch related educational videos based on title keywords
          if (res.video?.title) {
            const queryKeywords = res.video.title
              .replace(/[^\w\s]/gi, "")
              .split(/\s+/)
              .filter((w) => w.length > 3)
              .slice(0, 3)
              .join(" ");

            if (queryKeywords) {
              EduTubeApi.search({ q: `${queryKeywords} tutorial`, maxResults: 4 })
                .then((searchRes) => {
                  if (!isCancelled) {
                    setRelatedVideos(
                      (searchRes.items || []).filter((v) => v.videoId !== videoId).slice(0, 3)
                    );
                  }
                })
                .catch(() => {});
            }
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          toast.error(err.message || "Failed to load video details");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Lesson link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !video) {
    return (
      <div className="space-y-4 pt-4">
        <Skeleton className="h-7 w-3/4 bg-muted" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32 bg-muted" />
          <Skeleton className="h-4 w-24 bg-muted" />
        </div>
        <Skeleton className="h-24 w-full bg-muted rounded-2xl" />
      </div>
    );
  }

  const title = video?.title || initialVideo?.title || "Video Lesson";
  const channel = video?.channel || initialVideo?.channelTitle || "Educational Channel";
  const description = video?.description || initialVideo?.description || "No description provided.";
  const views = formatViews(video?.statistics?.viewCount);
  const duration = video?.duration?.formatted || "Lesson";
  const published = formatPublishedDate(video?.publishedAt || initialVideo?.publishedAt);

  const currentVideoItem: EduTubeVideoItem = {
    videoId,
    title,
    description,
    thumbnail: { default: video?.thumbnails?.default || "", high: video?.thumbnails?.high || "" },
    channelId: video?.channelId || "",
    channelTitle: channel,
    publishedAt: video?.publishedAt || "",
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Title & Metadata Banner */}
      <div className="space-y-3">
        <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight leading-snug">
          {title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-medium">
            <span className="font-bold text-foreground bg-primary/10 text-primary px-2.5 py-1 rounded-lg border border-primary/20">
              {channel}
            </span>

            {views && (
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {views}
              </span>
            )}

            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {duration}
              </span>
            )}

            {published && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {published}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Real Bookmark Action */}
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleToggleSave}
              disabled={saveMutation.isPending || unsaveMutation.isPending}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-neo-raised-sm"
              aria-label={isSaved ? "Unsave video" : "Save video"}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5 text-primary" />
                  <span>Save</span>
                </>
              )}
            </Button>

            {/* Add to Playlist Dialog */}
            <AddToPlaylistDialog video={currentVideoItem} />

            {/* Share Link */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 px-3 text-xs font-semibold gap-1.5 shadow-neo-raised-sm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Share"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Video Notes Module (Phase 3B) */}
      <VideoNotes
        videoId={videoId}
        currentPlaybackSeconds={currentPlaybackSeconds}
        onSeekTo={onSeekTo}
      />

      {/* Description Box */}
      <div className="p-4 rounded-2xl bg-surface/80 border border-border/40 space-y-2.5 shadow-neo-raised text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-foreground flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Lesson Overview
          </span>

          <button
            onClick={() => setIsDescExpanded(!isDescExpanded)}
            className="text-primary hover:underline flex items-center gap-1 font-bold"
          >
            <span>{isDescExpanded ? "Show less" : "Show more"}</span>
            {isDescExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        <p
          className={`text-muted-foreground whitespace-pre-line leading-relaxed ${
            isDescExpanded ? "" : "line-clamp-3"
          }`}
        >
          {description}
        </p>

        {/* Tags */}
        {video?.tags && video.tags.length > 0 && isDescExpanded && (
          <div className="pt-2 border-t border-border/30 flex flex-wrap gap-1.5">
            {video.tags.slice(0, 10).map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-semibold"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Related Educational Lessons */}
      {relatedVideos.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Related Educational Lessons</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {relatedVideos.map((item) => (
              <div
                key={item.videoId}
                onClick={() => onSelectRelatedVideo(item)}
                className="p-3 bg-surface hover:bg-surface/80 border border-border/40 hover:border-primary/40 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-2 shadow-neo-raised-sm"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-foreground line-clamp-2 leading-snug">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{item.channelTitle}</p>
                </div>
                <span className="text-[10px] text-primary font-bold">Watch Lesson →</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
