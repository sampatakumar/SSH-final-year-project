import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Bookmark, BookmarkCheck, Award, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import { formatPublishedDate, getBestThumbnailUrl } from "../utils/edutube.utils";
import { EduTubeApi } from "../services/edutube.api";
import type { EduTubeVideoItem } from "../types/edutube.types";

export interface VideoCardProps {
  video: EduTubeVideoItem;
  onWatch: (video: EduTubeVideoItem) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onWatch }) => {
  const { authInitialized, firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const thumbnailUrl = getBestThumbnailUrl(video.thumbnail);
  const timeAgo = formatPublishedDate(video.publishedAt);
  const eduScore = video.educationalScore ?? 85;

  const { data: savedData } = useQuery({
    queryKey: ["edutube", "is-saved", video.videoId],
    queryFn: () => EduTubeApi.isVideoSaved(video.videoId),
    enabled: authInitialized && Boolean(firebaseUser) && Boolean(video.videoId),
    staleTime: 1000 * 60,
  });

  const isSaved = Boolean(savedData?.isSaved);

  const saveMutation = useMutation({
    mutationFn: () =>
      EduTubeApi.saveVideo({
        videoId: video.videoId,
        title: video.title,
        thumbnail: thumbnailUrl,
        channelTitle: video.channelTitle,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "is-saved", video.videoId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Saved to bookmarks!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save video");
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => EduTubeApi.unsaveVideo(video.videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "is-saved", video.videoId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Removed from bookmarks");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove video");
    },
  });

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveMutation.mutate();
    } else {
      saveMutation.mutate();
    }
  };

  return (
    <div
      onClick={() => onWatch(video)}
      className="group flex flex-col justify-between bg-surface border border-border/40 rounded-2xl overflow-hidden shadow-neo-raised hover:border-primary/50 transition-all duration-200 cursor-pointer focus-within:ring-2 focus-within:ring-primary outline-none"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onWatch(video);
        }
      }}
      aria-label={`Watch ${video.title}`}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full bg-background overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-bold">
            No Preview Available
          </div>
        )}

        {/* Hover Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Educational Score Badge */}
        {eduScore > 0 && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background/90 text-primary border border-primary/30 text-[11px] font-black backdrop-blur-md shadow-sm">
            <Award className="h-3 w-3 text-primary shrink-0" />
            <span>{eduScore} EduScore</span>
          </div>
        )}
      </div>

      {/* Video Content Metadata */}
      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <h3
            className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
            title={video.title}
          >
            {video.title}
          </h3>

          <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 font-medium">
            <span>{video.channelTitle}</span>
          </p>
        </div>

        {/* Action Row & Time */}
        <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2 text-xs">
          <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo || "Recent"}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 transition-colors ${
                isSaved
                  ? "text-primary hover:text-primary/80 bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              onClick={handleToggleSave}
              title={isSaved ? "Remove from bookmarks" : "Save to bookmarks"}
              aria-label={isSaved ? "Unsave video" : "Save video"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-3.5 w-3.5 fill-current" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </Button>

            <Button
              variant="default"
              size="sm"
              className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onWatch(video);
              }}
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Watch</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
