import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Clock, Sparkles, BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EduTubeApi } from "../services/edutube.api";
import { formatPublishedDate } from "../utils/edutube.utils";
import type { ContinueLearningItem, EduTubeVideoItem } from "../types/edutube.types";

export interface ContinueLearningSectionProps {
  onContinueVideo: (video: EduTubeVideoItem) => void;
}

export const ContinueLearningSection: React.FC<ContinueLearningSectionProps> = ({
  onContinueVideo,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "continue-learning"],
    queryFn: () => EduTubeApi.getContinueLearning(6),
    staleTime: 1000 * 30, // 30s
  });

  const items = data?.items || [];

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl border border-border/40 bg-surface/60 shadow-neo-raised space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-36 bg-muted" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Skeleton className="h-28 rounded-xl bg-muted" />
          <Skeleton className="h-28 rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-5 rounded-2xl border border-border/40 bg-surface/60 shadow-neo-raised backdrop-blur-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                <Clock className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">Continue Learning</h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Start any tutorial or course below. Your playback milestone, completed percentage, and lesson progress will automatically be saved and appear here.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-background px-3 py-2 rounded-xl border border-border/40 shadow-neo-raised-sm">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>0 Active Lessons</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl border border-border/40 bg-surface/80 shadow-neo-raised backdrop-blur-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          </span>
          <h3 className="text-sm font-bold text-foreground">Continue Learning</h3>
          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-primary-foreground">
            {items.length} In Progress
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const remainingMinutes = Math.ceil(item.remainingSeconds / 60);

          return (
            <div
              key={item.videoId}
              onClick={() =>
                onContinueVideo({
                  videoId: item.videoId,
                  title: item.title,
                  thumbnail: { default: item.thumbnail, high: item.thumbnail },
                  channelId: "",
                  channelTitle: item.channelTitle,
                  publishedAt: "",
                  embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
                  youtubeUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                })
              }
              className="group p-3 bg-background hover:bg-surface border border-border/40 hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-150 flex flex-col justify-between space-y-3 shadow-neo-raised-sm"
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onContinueVideo({
                    videoId: item.videoId,
                    title: item.title,
                    thumbnail: { default: item.thumbnail, high: item.thumbnail },
                    channelId: "",
                    channelTitle: item.channelTitle,
                    publishedAt: "",
                    embedUrl: `https://www.youtube.com/embed/${item.videoId}`,
                    youtubeUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
                  });
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-muted shrink-0 border border-border/40">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      Lesson
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4 text-white fill-current" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">{item.channelTitle}</p>
                </div>
              </div>

              {/* Progress Bar & Status */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-primary font-bold">{item.percentage}% complete</span>
                  <span className="text-muted-foreground">
                    {remainingMinutes > 0 ? `${remainingMinutes}m left` : "Almost done"}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(5, item.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
