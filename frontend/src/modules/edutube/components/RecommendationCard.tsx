import React, { useState } from "react";
import {
  Play,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  ThumbsDown,
  CheckCircle2,
  ThumbsUp,
  GraduationCap,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/core/auth";
import { EduTubeApi } from "../services/edutube.api";
import { toast } from "sonner";
import type { PersonalizedRecommendation, FeedbackAction } from "../types/edutube.types";

export interface RecommendationCardProps {
  video: PersonalizedRecommendation;
  onWatch: (videoId: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  video,
  onWatch,
}) => {
  const { authInitialized, firebaseUser } = useAuth();
  const [showWhy, setShowWhy] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const queryClient = useQueryClient();

  const { data: savedStatus } = useQuery({
    queryKey: ["edutube", "saved", video.videoId],
    queryFn: () => EduTubeApi.isVideoSaved(video.videoId),
    enabled: authInitialized && Boolean(firebaseUser) && Boolean(video.videoId),
  });

  const isSaved = savedStatus?.isSaved ?? false;

  const saveMutation = useMutation({
    mutationFn: () =>
      isSaved
        ? EduTubeApi.unsaveVideo(video.videoId)
        : EduTubeApi.saveVideo({
            videoId: video.videoId,
            title: video.title,
            thumbnail: video.thumbnail?.high || video.thumbnail?.default || "",
            channelTitle: video.channelTitle,
          }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "saved"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "saved", video.videoId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success(isSaved ? "Removed from saved lessons" : "Saved to your learning list!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update saved status");
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ action }: { action: FeedbackAction }) =>
      EduTubeApi.submitRecommendationFeedback({
        videoId: video.videoId,
        action,
        topic: video.topic || video.title,
      }),
    onSuccess: (_, vars) => {
      if (vars.action === "not_interested" || vars.action === "already_know") {
        setDismissed(true);
      }
      queryClient.invalidateQueries({ queryKey: ["edutube", "recommendations"] });
      if (vars.action === "not_interested") {
        toast.info("We'll recommend fewer lessons like this.");
      } else if (vars.action === "already_know") {
        toast.info("Got it! We'll tailor towards more advanced content.");
      } else {
        toast.success("Thanks! We'll recommend more content on this topic.");
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to record feedback");
    },
  });

  if (dismissed) {
    return null;
  }

  const thumbUrl =
    video.thumbnail?.high ||
    video.thumbnail?.medium ||
    video.thumbnail?.default ||
    "";

  return (
    <div className="group flex flex-col rounded-2xl bg-surface/90 border border-border/60 hover:border-primary/50 transition-all duration-200 shadow-neo-raised overflow-hidden hover:shadow-neo-raised-hover">
      {/* Thumbnail Header */}
      <div className="relative aspect-video w-full bg-background overflow-hidden cursor-pointer" onClick={() => onWatch(video.videoId)}>
        <img
          src={thumbUrl}
          alt={video.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40 backdrop-blur-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-neo-raised transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {video.personalizationScore && (
              <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-0 text-[11px] font-bold px-2 py-0.5 flex items-center gap-1 shadow-neo-raised-sm">
                <Sparkles className="h-3 w-3" />
                <span>{video.personalizationScore}% Match</span>
              </Badge>
            )}
            {video.educationalScore && (
              <Badge className="bg-background/80 text-foreground backdrop-blur-md border border-border/40 text-[11px] font-semibold px-2 py-0.5 flex items-center gap-1 shadow-neo-raised-sm">
                <GraduationCap className="h-3 w-3 text-secondary" />
                <span>EduScore {video.educationalScore}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <h3
            onClick={() => onWatch(video.videoId)}
            className="text-sm font-bold text-foreground line-clamp-2 hover:text-primary transition-colors cursor-pointer leading-snug"
            title={video.title}
          >
            {video.title}
          </h3>
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <span>{video.channelTitle}</span>
          </p>
        </div>

        {/* Grounded Why Recommended Button */}
        {video.whyRecommended && video.whyRecommended.length > 0 && (
          <div className="space-y-1.5">
            <button
              onClick={() => setShowWhy(!showWhy)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors py-1 px-2 rounded-lg bg-primary/5 hover:bg-primary/10 border border-primary/20"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                <span>Why recommended for you?</span>
              </div>
              {showWhy ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showWhy && (
              <div className="p-2.5 rounded-xl bg-background/90 border border-border/50 text-[11px] space-y-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                {video.whyRecommended.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-foreground/90 leading-tight">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls & Feedback */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => onWatch(video.videoId)}
              className="h-8 px-3 text-xs font-bold gap-1.5 rounded-xl shadow-neo-raised-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Watch</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className={`h-8 px-2.5 text-xs font-semibold rounded-xl gap-1 shadow-neo-raised-sm ${
                isSaved ? "bg-primary/10 border-primary text-primary" : ""
              }`}
              title={isSaved ? "Remove from saved" : "Save video"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </Button>

            <AddToPlaylistDialog video={video} />
          </div>

          {/* User Feedback Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg"
              title="More like this"
              onClick={() => feedbackMutation.mutate({ action: "more_like_this" })}
              disabled={feedbackMutation.isPending}
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg"
              title="I already know this topic"
              onClick={() => feedbackMutation.mutate({ action: "already_know" })}
              disabled={feedbackMutation.isPending}
            >
              <CheckCircle2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
              title="Not interested"
              onClick={() => feedbackMutation.mutate({ action: "not_interested" })}
              disabled={feedbackMutation.isPending}
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
