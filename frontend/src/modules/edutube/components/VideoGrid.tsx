import React from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoCard } from "./VideoCard";
import { EmptyState, ErrorState } from "./EmptyState";
import type { EduTubeVideoItem } from "../types/edutube.types";

export interface VideoGridProps {
  videos: EduTubeVideoItem[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onWatch: (video: EduTubeVideoItem) => void;
  onRetry?: () => void;
  query?: string;
  onClearQuery?: () => void;
  onSelectSuggestion?: (s: string) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  isLoading,
  isLoadingMore = false,
  error,
  hasMore = false,
  onLoadMore,
  onWatch,
  onRetry,
  query,
  onClearQuery,
  onSelectSuggestion,
}) => {
  if (error && (!videos || videos.length === 0)) {
    return <ErrorState error={error} onRetry={onRetry || (() => {})} />;
  }

  if (isLoading && (!videos || videos.length === 0)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col bg-surface border border-border/40 rounded-2xl overflow-hidden p-3 space-y-3 shadow-neo-raised"
          >
            <Skeleton className="aspect-video w-full rounded-xl bg-muted" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-5/6 bg-muted" />
              <Skeleton className="h-3 w-1/2 bg-muted" />
            </div>
            <div className="pt-2 flex justify-between items-center">
              <Skeleton className="h-3 w-1/4 bg-muted" />
              <Skeleton className="h-7 w-16 bg-muted rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && (!videos || videos.length === 0)) {
    return (
      <EmptyState
        query={query}
        onClearQuery={onClearQuery}
        onSelectSuggestion={onSelectSuggestion}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Responsive Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard key={video.videoId} video={video} onWatch={onWatch} />
        ))}
      </div>

      {/* Load More Pagination Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2 h-10 text-xs font-bold gap-2 rounded-xl shadow-neo-raised-sm bg-background border-border/40"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading more lessons...</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-primary" />
                <span>Load More Videos</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
