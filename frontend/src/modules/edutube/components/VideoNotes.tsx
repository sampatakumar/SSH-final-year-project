import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StickyNote, Plus, Trash2, Edit2, Check, X, Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/core/auth";
import { EduTubeApi } from "../services/edutube.api";
import type { VideoNote } from "../types/edutube.types";

export interface VideoNotesProps {
  videoId: string;
  currentPlaybackSeconds?: number;
  onSeekTo?: (seconds: number) => void;
}

export const VideoNotes: React.FC<VideoNotesProps> = ({
  videoId,
  currentPlaybackSeconds = 0,
  onSeekTo,
}) => {
  const { authInitialized, firebaseUser } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [content, setContent] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState(currentPlaybackSeconds);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "notes", videoId],
    queryFn: () => EduTubeApi.getVideoNotes(videoId),
    enabled: authInitialized && Boolean(firebaseUser) && Boolean(videoId),
  });

  const notes = data?.notes || [];

  const createMutation = useMutation({
    mutationFn: (payload: { content: string; timestampSeconds: number }) =>
      EduTubeApi.createVideoNote(videoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "notes", videoId] });
      setContent("");
      setIsAdding(false);
      toast.success("Note saved!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save note");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: { content: string } }) =>
      EduTubeApi.updateVideoNote(noteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "notes", videoId] });
      setEditingNoteId(null);
      toast.success("Note updated!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update note");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: string) => EduTubeApi.deleteVideoNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "notes", videoId] });
      toast.success("Note deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete note");
    },
  });

  const formatTimestamp = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = Math.floor(sec % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleStartAdd = () => {
    setNoteTimestamp(Math.floor(currentPlaybackSeconds));
    setIsAdding(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createMutation.mutate({
      content: content.trim(),
      timestampSeconds: noteTimestamp,
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-surface/80 border border-border/40 space-y-4 shadow-neo-raised">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Video Notes & Timestamps</h3>
          <span className="text-[11px] font-bold text-muted-foreground">({notes.length})</span>
        </div>

        {!isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartAdd}
            className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl shadow-neo-raised-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Note</span>
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {isAdding && (
        <form onSubmit={handleCreateSubmit} className="p-3 bg-background border border-border/40 rounded-xl space-y-3 shadow-neo-raised-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              Timestamp: <strong className="text-foreground">{formatTimestamp(noteTimestamp)}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write key takeaways, code syntax, or questions to revisit..."
            rows={2}
            className="w-full p-2.5 text-xs rounded-lg bg-surface border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground resize-none"
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || createMutation.isPending}
              className="h-7 text-xs font-bold gap-1 rounded-lg shadow-neo-raised-sm"
            >
              Save Note
            </Button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAdding ? (
        <p className="text-xs text-muted-foreground italic py-2">
          No personal notes yet for this lesson. Click "+ Add Note" to capture key concepts.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
          {notes.map((note) => {
            const isEditing = editingNoteId === note._id;

            return (
              <div
                key={note._id}
                className="p-2.5 rounded-xl bg-background border border-border/40 flex items-start justify-between gap-3 text-xs shadow-neo-raised-sm"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSeekTo?.(note.timestampSeconds)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] hover:bg-primary/20 transition-colors border border-primary/20"
                      title="Seek to timestamp"
                    >
                      <Play className="h-2.5 w-2.5 fill-current" />
                      <span>{formatTimestamp(note.timestampSeconds)}</span>
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="h-8 text-xs bg-surface"
                      />
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingNoteId(null)}
                          className="h-6 px-2 text-[10px]"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateMutation.mutate({
                              noteId: note._id,
                              payload: { content: editContent.trim() },
                            })
                          }
                          className="h-6 px-2 text-[10px] font-bold"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingNoteId(note._id);
                        setEditContent(note.content);
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                      title="Edit note"
                      aria-label="Edit note"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(note._id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                      title="Delete note"
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
