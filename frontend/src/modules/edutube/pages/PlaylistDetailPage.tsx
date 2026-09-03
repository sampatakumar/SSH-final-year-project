import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ListVideo,
  Play,
  Trash2,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Loader2,
  Clock,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EduTubeApi } from "../services/edutube.api";
import { EduTubeHeader } from "../components/EduTubeHeader";
import { useAuth } from "@/core/auth";
import { EduTubeSidebar } from "../components/EduTubeSidebar";
import type { Playlist, PlaylistVideo } from "../types/edutube.types";

export const PlaylistDetailPage: React.FC = () => {
  const { authInitialized, firebaseUser } = useAuth();
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "playlist", playlistId],
    queryFn: () => EduTubeApi.getPlaylist(playlistId!),
    enabled: authInitialized && Boolean(firebaseUser) && Boolean(playlistId),
  });

  const playlist = data?.playlist;

  const removeVideoMutation = useMutation({
    mutationFn: (videoId: string) =>
      EduTubeApi.removeVideoFromPlaylist(playlistId!, videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Lesson removed from playlist");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove video");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (videoIds: string[]) =>
      EduTubeApi.reorderPlaylist(playlistId!, videoIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlist", playlistId] });
      toast.success("Playlist order updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to reorder playlist");
    },
  });

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!playlist?.videos) return;
    const items = [...playlist.videos];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    const newIds = items.map((v) => v.videoId);
    reorderMutation.mutate(newIds);
  };

  const handleWatch = (videoId: string) => {
    navigate(`/dashboard/edutube/watch/${videoId}`);
  };

  const total = playlist?.totalVideos || playlist?.videos?.length || 0;
  const completed = playlist?.completedVideos || 0;
  const pct = playlist?.progressPercentage || 0;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-150">
      <EduTubeHeader
        searchQuery=""
        onSearch={(q) => navigate(`/dashboard/edutube?q=${encodeURIComponent(q)}`)}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <EduTubeSidebar />

        <main className="flex-1 w-full space-y-6 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard/edutube/playlists")}
            className="text-xs font-bold text-muted-foreground hover:text-foreground gap-2 pl-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Playlists</span>
          </Button>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading playlist track...</span>
            </div>
          ) : !playlist ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              Playlist not found.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Banner & Track Progress */}
              <div className="p-6 rounded-2xl bg-surface border border-border/40 space-y-4 shadow-neo-raised">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ListVideo className="h-5 w-5 text-primary" />
                      <h1 className="text-xl font-black text-foreground tracking-tight">
                        {playlist.name}
                      </h1>
                    </div>
                    {playlist.description && (
                      <p className="text-xs text-muted-foreground">{playlist.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold">
                    <span className="text-muted-foreground">
                      {completed}/{total} Completed
                    </span>
                    <span className="text-primary text-base font-black">{pct}%</span>
                  </div>
                </div>

                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>

              {/* Lesson Items List */}
              <div className="space-y-2">
                {playlist.videos.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border/40 rounded-2xl p-6 text-xs text-muted-foreground">
                    This playlist is currently empty. Browse videos on EduTube and click "+ Add to Playlist" to add lessons here.
                  </div>
                ) : (
                  playlist.videos.map((item, idx) => (
                    <div
                      key={item.videoId}
                      className="p-3 bg-surface hover:bg-surface/80 border border-border/40 rounded-xl flex items-center justify-between gap-4 transition-all duration-150 shadow-neo-raised-sm"
                    >
                      {/* Lesson Index & Completion Badge */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xs font-bold text-muted-foreground w-6 text-center">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>

                        <div className="shrink-0">
                          {item.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div
                          onClick={() => handleWatch(item.videoId)}
                          className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 cursor-pointer border border-border/40"
                        >
                          {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                              Lesson
                            </div>
                          )}
                        </div>

                        <div
                          onClick={() => handleWatch(item.videoId)}
                          className="space-y-0.5 min-w-0 flex-1 cursor-pointer"
                        >
                          <h4 className="font-bold text-xs text-foreground truncate hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">{item.channelTitle}</p>
                        </div>
                      </div>

                      {/* Controls (Move up, Move down, Play, Delete) */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="flex flex-col">
                          <button
                            disabled={idx === 0 || reorderMutation.isPending}
                            onClick={() => handleMove(idx, "up")}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted"
                            title="Move up"
                            aria-label="Move lesson up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={idx === playlist.videos.length - 1 || reorderMutation.isPending}
                            onClick={() => handleMove(idx, "down")}
                            className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted"
                            title="Move down"
                            aria-label="Move lesson down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWatch(item.videoId)}
                          className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Watch</span>
                        </Button>

                        <button
                          onClick={() => removeVideoMutation.mutate(item.videoId)}
                          disabled={removeVideoMutation.isPending}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                          title="Remove from playlist"
                          aria-label="Remove from playlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PlaylistDetailPage;
