import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles,
  Route,
  Loader2,
  Play,
  CheckCircle2,
  ListPlus,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { EduTubeApi } from "../services/edutube.api";
import type { LearningTrack } from "../types/edutube.types";

export interface LearningTrackDialogProps {
  initialTopic?: string;
  targetRole?: string;
  trigger?: React.ReactNode;
}

export const LearningTrackDialog: React.FC<LearningTrackDialogProps> = ({
  initialTopic = "",
  targetRole = "Full Stack Developer",
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState(initialTopic);
  const [generatedTrack, setGeneratedTrack] = useState<LearningTrack | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const generateMutation = useMutation({
    mutationFn: (topicInput: string) =>
      EduTubeApi.generateLearningTrack({
        topic: topicInput,
        targetRole,
      }),
    onSuccess: (res) => {
      setGeneratedTrack(res.track);
      toast.success("Learning Track generated with verified YouTube lessons!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to generate learning track");
    },
  });

  const savePlaylistMutation = useMutation({
    mutationFn: () =>
      EduTubeApi.saveTrackAsPlaylist({
        name: generatedTrack?.trackTitle || `${topic} Mastery Track`,
        description: generatedTrack?.description || `Curated learning track for ${topic}`,
        track: generatedTrack!,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Saved learning track to your Playlists!");
      setOpen(false);
      navigate(`/dashboard/edutube/playlists/${res.playlist._id}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save track as playlist");
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    generateMutation.mutate(topic.trim());
  };

  const handleChipClick = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
    generateMutation.mutate(suggestedTopic);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold shadow-neo-raised text-xs h-9 px-4 rounded-xl hover:opacity-95"
          >
            <Sparkles className="h-4 w-4" />
            <span>Generate AI Track</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl bg-surface border-border/50 shadow-neo-raised max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Route className="h-4 w-4" />
            </div>
            <div>
              <p>AI Learning Track Architect</p>
              <p className="text-xs font-normal text-muted-foreground">
                Generates a structured, chronological curriculum with verified YouTube lessons.
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Topic Form */}
          <form onSubmit={handleGenerate} className="flex gap-2">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="E.g. Docker & Kubernetes, React Architecture, System Design..."
              className="bg-background text-xs h-9"
              disabled={generateMutation.isPending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!topic.trim() || generateMutation.isPending}
              className="h-9 px-4 text-xs font-bold gap-1.5 shrink-0"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Build Track</span>
                </>
              )}
            </Button>
          </form>

          {/* Quick Skill Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-semibold mr-1">
              Popular Tracks:
            </span>
            {["Docker & DevOps", "MERN Full Stack", "REST APIs & Microservices", "React Performance", "TypeScript Deep Dive"].map(
              (chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  disabled={generateMutation.isPending}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-background border border-border/40 hover:border-primary/50 text-foreground font-medium transition-all shadow-neo-raised-sm hover:text-primary"
                >
                  {chip}
                </button>
              )
            )}
          </div>

          {/* Generated Track Display */}
          {generatedTrack && (
            <div className="space-y-4 pt-2 border-t border-border/40 animate-in fade-in-50 duration-300">
              <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-background border border-border/40 shadow-neo-raised-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-foreground text-sm">
                      {generatedTrack.trackTitle}
                    </h4>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                      {generatedTrack.lessons.length} Lessons
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {generatedTrack.description}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => savePlaylistMutation.mutate()}
                  disabled={savePlaylistMutation.isPending}
                  className="h-8 px-3 text-xs font-bold gap-1.5 shrink-0 bg-primary shadow-neo-raised-sm"
                >
                  {savePlaylistMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ListPlus className="h-3.5 w-3.5" />
                  )}
                  <span>Save as Playlist</span>
                </Button>
              </div>

              {/* Lesson Roadmap Steps */}
              <div className="space-y-2.5">
                {generatedTrack.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.videoId || idx}
                    className="p-3 rounded-xl bg-background border border-border/40 flex items-center justify-between gap-3 shadow-neo-raised-sm group hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">
                          {lesson.lessonTitle}
                        </p>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {lesson.learningObjective}
                        </p>
                        <p className="text-[10px] text-primary/80 font-medium truncate">
                          Lesson video: {lesson.title} ({lesson.channelTitle})
                        </p>
                      </div>
                    </div>

                    <a
                      href={lesson.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-surface hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0"
                      title="Preview on YouTube"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
