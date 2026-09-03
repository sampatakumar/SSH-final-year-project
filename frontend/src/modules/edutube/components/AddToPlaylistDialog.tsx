import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ListPlus, Plus, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import { EduTubeApi } from "../services/edutube.api";
import type { EduTubeVideoItem } from "../types/edutube.types";

export interface AddToPlaylistDialogProps {
  video: EduTubeVideoItem;
  trigger?: React.ReactNode;
}

export const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  video,
  trigger,
}) => {
  const { authInitialized, firebaseUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "playlists"],
    queryFn: () => EduTubeApi.getPlaylists(),
    enabled: open && authInitialized && Boolean(firebaseUser),
  });

  const playlists = data?.playlists || [];

  const addVideoMutation = useMutation({
    mutationFn: ({ playlistId }: { playlistId: string }) =>
      EduTubeApi.addVideoToPlaylist(playlistId, {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail?.high || video.thumbnail?.default || "",
        channelTitle: video.channelTitle,
      }),
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlist", vars.playlistId] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Added to playlist!");
      setOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add video to playlist");
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: (name: string) => EduTubeApi.createPlaylist({ name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
      // Immediately add the video to newly created playlist
      addVideoMutation.mutate({ playlistId: res.playlist._id });
      setNewPlaylistName("");
      setIsCreatingNew(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create playlist");
    },
  });

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylistMutation.mutate(newPlaylistName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs font-semibold gap-1.5 shadow-neo-raised-sm">
            <ListPlus className="h-3.5 w-3.5 text-primary" />
            <span>Playlist</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-surface border-border/40 shadow-neo-raised">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ListPlus className="h-4 w-4 text-primary" />
            <span>Add to Learning Playlist</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isLoading ? (
            <div className="py-6 flex items-center justify-center text-xs text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading your playlists...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {playlists.length === 0 && !isCreatingNew ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  You haven't created any playlists yet.
                </p>
              ) : (
                playlists.map((pl) => {
                  const alreadyInPlaylist = pl.videos?.some((v) => v.videoId === video.videoId);

                  return (
                    <div
                      key={pl._id}
                      className="p-3 rounded-xl bg-background border border-border/40 flex items-center justify-between gap-3 text-xs shadow-neo-raised-sm"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <p className="font-bold text-foreground truncate">{pl.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {pl.videos?.length || 0} lessons • {pl.progressPercentage || 0}% complete
                        </p>
                      </div>

                      <Button
                        size="sm"
                        disabled={alreadyInPlaylist || addVideoMutation.isPending}
                        onClick={() => addVideoMutation.mutate({ playlistId: pl._id })}
                        className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg"
                      >
                        {alreadyInPlaylist ? (
                          <>
                            <Check className="h-3 w-3 text-success" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            <span>Add</span>
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Create New Playlist Form */}
          {isCreatingNew ? (
            <form onSubmit={handleCreateAndAdd} className="p-3 bg-background border border-border/40 rounded-xl space-y-2 shadow-neo-raised-sm">
              <Input
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name (e.g. React Mastery Track)..."
                className="h-8 text-xs bg-surface"
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsCreatingNew(false)}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending}
                  className="h-7 text-xs font-bold"
                >
                  Create & Add
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingNew(true)}
              className="w-full text-xs font-bold gap-1.5 h-8 border-dashed shadow-neo-raised-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create New Playlist</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
