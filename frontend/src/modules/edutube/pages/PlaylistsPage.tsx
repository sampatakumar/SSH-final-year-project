import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListVideo, Plus, Play, Trash2, Edit2, Loader2, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/core/auth";
import { EduTubeApi } from "../services/edutube.api";
import { EduTubeHeader } from "../components/EduTubeHeader";
import { EduTubeSidebar } from "../components/EduTubeSidebar";
import type { Playlist } from "../types/edutube.types";

export const PlaylistsPage: React.FC = () => {
  const { authInitialized, firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "playlists"],
    queryFn: () => EduTubeApi.getPlaylists(),
    enabled: authInitialized && Boolean(firebaseUser),
  });

  const playlists = data?.playlists || [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) =>
      EduTubeApi.createPlaylist(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      setName("");
      setDescription("");
      setIsCreateOpen(false);
      toast.success("Playlist created!");
      navigate(`/dashboard/edutube/playlists/${res.playlist._id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create playlist");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (playlistId: string) => EduTubeApi.deletePlaylist(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Playlist deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete playlist");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in-50 duration-150">
      <EduTubeHeader
        searchQuery=""
        onSearch={(q) => navigate(`/dashboard/edutube?q=${encodeURIComponent(q)}`)}
      />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <EduTubeSidebar />

        <main className="flex-1 w-full space-y-6 min-w-0">
          <div className="flex items-center justify-between border-b border-border/30 pb-4">
            <div className="flex items-center gap-2">
              <ListVideo className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-foreground">My Learning Playlists</h2>
              <span className="text-xs font-bold text-muted-foreground">({playlists.length})</span>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs font-bold gap-1.5 shadow-neo-raised-sm">
                  <Plus className="h-4 w-4" />
                  <span>Create Playlist</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-surface border-border/40 shadow-neo-raised">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <ListVideo className="h-4 w-4 text-primary" />
                    <span>Create New Course Track</span>
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Playlist Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. JavaScript Full-Stack Track"
                      className="h-9 text-xs bg-background"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Description (Optional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Goal or milestones for this playlist..."
                      rows={3}
                      className="w-full p-2.5 text-xs rounded-lg bg-background border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreateOpen(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!name.trim() || createMutation.isPending}
                      className="text-xs font-bold"
                    >
                      Create Track
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading playlists...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-16 text-center border border-border/40 bg-surface/60 rounded-3xl p-8 space-y-3 max-w-md mx-auto shadow-neo-raised">
              <ListVideo className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Playlists Created Yet</h3>
              <p className="text-xs text-muted-foreground">
                Organize videos into custom course tracks, measure completion progress, and level up your skills systematically.
              </p>
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="text-xs font-bold gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Your First Playlist</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((pl) => {
                const total = pl.totalVideos || pl.videos?.length || 0;
                const completed = pl.completedVideos || 0;
                const pct = pl.progressPercentage || (total > 0 ? Math.round((completed / total) * 100) : 0);

                return (
                  <div
                    key={pl._id}
                    onClick={() => navigate(`/dashboard/edutube/playlists/${pl._id}`)}
                    className="group p-5 bg-surface hover:bg-surface/80 border border-border/40 hover:border-primary/50 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 shadow-neo-raised"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {pl.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(pl._id);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                          title="Delete playlist"
                          aria-label="Delete playlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {pl.description || "Custom developer learning curriculum."}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/30">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">
                          {total} {total === 1 ? "lesson" : "lessons"}
                        </span>
                        <span className="text-primary font-bold">{pct}% complete</span>
                      </div>

                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>

                      <div className="pt-2 flex justify-between items-center text-xs">
                        <span className="text-[11px] text-muted-foreground">
                          {completed}/{total} completed
                        </span>
                        <span className="text-primary font-bold flex items-center gap-1">
                          <span>Open Track</span>
                          <span>→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PlaylistsPage;
