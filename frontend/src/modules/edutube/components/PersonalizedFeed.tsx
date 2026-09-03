import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  RefreshCw,
  Target,
  Briefcase,
  History,
  Layers,
  Flame,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EduTubeApi } from "../services/edutube.api";
import { RecommendationCard } from "./RecommendationCard";
import { LearningTrackDialog } from "./LearningTrackDialog";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import type { PersonalizedRecommendation } from "../types/edutube.types";

export interface PersonalizedFeedProps {
  onWatch: (videoId: string) => void;
}

export const PersonalizedFeed: React.FC<PersonalizedFeedProps> = ({ onWatch }) => {
  const { authInitialized, firebaseUser } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isRefetching } = useQuery({
    queryKey: ["edutube", "recommendations"],
    queryFn: () => EduTubeApi.getPersonalizedRecommendations(),
    enabled: authInitialized && Boolean(firebaseUser),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  });

  const refreshMutation = useMutation({
    mutationFn: () => EduTubeApi.getPersonalizedRecommendations({ refresh: true }),
    onSuccess: (newData) => {
      queryClient.setQueryData(["edutube", "recommendations"], newData);
      toast.success("Learning feed refreshed with latest profile signals!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to refresh recommendations");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8 py-4 animate-in fade-in-50 duration-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-surface rounded-lg animate-pulse" />
            <div className="h-4 w-72 bg-surface/60 rounded-lg animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-surface rounded-xl animate-pulse" />
        </div>

        {/* Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-surface/60 border border-border/40 animate-pulse p-4 space-y-3">
              <div className="aspect-video w-full bg-background rounded-xl" />
              <div className="h-4 w-3/4 bg-background rounded" />
              <div className="h-3 w-1/2 bg-background rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const feed = data;
  const targetRole = feed?.learningContext?.targetRole || "Full Stack Developer";
  const skillGaps = feed?.learningContext?.skillGaps || [];

  return (
    <div className="space-y-10 pb-12 animate-in fade-in-50 duration-300">
      {/* AI Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-surface to-secondary/10 border border-border/50 shadow-neo-raised">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Your Personalized Learning Feed
            </h2>
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 shadow-neo-raised-sm gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>AI Personalized</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Synthesized dynamically from your Master Profile, Skill Matrix, Skill Gaps, and Target Role ({targetRole}).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending || isRefetching}
            className="h-9 px-3 text-xs font-semibold gap-1.5 shadow-neo-raised-sm rounded-xl bg-surface hover:bg-background"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                refreshMutation.isPending || isRefetching ? "animate-spin text-primary" : ""
              }`}
            />
            <span>Refresh Feed</span>
          </Button>

          <LearningTrackDialog targetRole={targetRole} />
        </div>
      </div>

      {isError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Personalized AI recommendations are temporarily running on heuristic fallback. Showing recommendations grounded in your learning data.
          </span>
        </div>
      )}

      {/* SECTION 1: 🎯 Recommended For You */}
      {feed?.personalized && feed.personalized.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Recommended For You</h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              High-priority personalized picks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.personalized.map((video) => (
              <RecommendationCard key={video.videoId} video={video} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: 📈 Close Your Skill Gaps */}
      {feed?.skillGaps && feed.skillGaps.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Close Your Skill Gaps</h3>
              </div>
            </div>

            {skillGaps.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {skillGaps.slice(0, 3).map((gap) => (
                  <Badge key={gap.skill} variant="outline" className="text-[10px] bg-amber-500/5 border-amber-500/20 text-amber-400">
                    {gap.skill} ({gap.priority})
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.skillGaps.map((video) => (
              <RecommendationCard key={video.videoId} video={video} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: 💼 Your Career Path */}
      {feed?.careerPath && feed.careerPath.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Briefcase className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Your Career Path: {targetRole}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Milestones to achieve role readiness
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.careerPath.map((video) => (
              <RecommendationCard key={video.videoId} video={video} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: 🧠 Based On Your Learning (History) */}
      {feed?.basedOnHistory && feed.basedOnHistory.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                <History className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Based On Your Learning</h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Next-level concepts from your recent history
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.basedOnHistory.map((video) => (
              <RecommendationCard key={video.videoId} video={video} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: 🛠 Learn Through Projects */}
      {feed?.projectLearning && feed.projectLearning.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Learn Through Projects</h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Connects to your GitHub repository stack
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.projectLearning.map((video) => (
              <RecommendationCard key={video.videoId} video={video} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 6: 🔥 Trending In Your Stack */}
      {feed?.trending && feed.trending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <Flame className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Trending In Your Stack</h3>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              Top educational courses
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {feed.trending.map((video) => (
              <RecommendationCard key={video.videoId} video={video} onWatch={onWatch} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
