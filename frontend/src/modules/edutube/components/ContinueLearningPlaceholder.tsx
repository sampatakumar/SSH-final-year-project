import React from "react";
import { BookOpen, Sparkles, Clock, Bookmark, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ContinueLearningPlaceholder: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl border border-border/40 bg-surface/60 shadow-neo-raised backdrop-blur-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <h3 className="text-sm font-bold text-foreground">Continue Learning</h3>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/40">
              Phase 3B Preview
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your recently watched video lessons, playback milestones, and saved tutorial playlists will appear here once playback tracking is enabled in the upcoming update.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-background px-3 py-2 rounded-xl border border-border/40 shadow-neo-raised-sm">
            <Bookmark className="h-3.5 w-3.5 text-primary" />
            <span>0 Saved Courses</span>
          </div>
        </div>
      </div>
    </div>
  );
};
