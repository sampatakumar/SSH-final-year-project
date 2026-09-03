import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { History, Trash2, Clock, Play, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { EduTubeApi } from "../services/edutube.api";
import { EduTubeHeader } from "../components/EduTubeHeader";
import { EduTubeSidebar } from "../components/EduTubeSidebar";
import type { WatchHistoryItem } from "../types/edutube.types";

export const HistoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["edutube", "history"],
    queryFn: () => EduTubeApi.getHistory({ limit: 50 }),
  });

  const historyItems = data?.items || [];

  const deleteItemMutation = useMutation({
    mutationFn: (videoId: string) => EduTubeApi.deleteHistoryItem(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "history"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "continue-learning"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Removed from history");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete history item");
    },
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => EduTubeApi.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["edutube", "history"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "continue-learning"] });
      queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
      toast.success("Watch history cleared");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to clear history");
    },
  });

  // Group items by Today, Yesterday, and Older
  const groupHistory = (items: WatchHistoryItem[]) => {
    const today: WatchHistoryItem[] = [];
    const yesterday: WatchHistoryItem[] = [];
    const older: WatchHistoryItem[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

    for (const item of items) {
      const itemTime = new Date(item.watchedAt).getTime();
      if (itemTime >= todayStart) {
        today.push(item);
      } else if (itemTime >= yesterdayStart) {
        yesterday.push(item);
      } else {
        older.push(item);
      }
    }

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupHistory(historyItems);

  const handleWatch = (videoId: string) => {
    navigate(`/dashboard/edutube/watch/${videoId}`);
  };

  const renderGroup = (title: string, groupItems: WatchHistoryItem[]) => {
    if (groupItems.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
          {title}
        </h3>

        <div className="space-y-2">
          {groupItems.map((item) => (
            <div
              key={item.videoId}
              className="p-3 bg-surface hover:bg-surface/80 border border-border/40 hover:border-primary/40 rounded-xl flex items-center justify-between gap-4 transition-all duration-150 shadow-neo-raised-sm"
            >
              <div
                onClick={() => handleWatch(item.videoId)}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 border border-border/40">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                      Lesson
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-4 w-4 text-white fill-current" />
                  </div>
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-foreground truncate hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">{item.channelTitle}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(item.watchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {item.completed && (
                      <span className="text-success font-semibold">Completed ✓</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleWatch(item.videoId)}
                  className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Resume</span>
                </Button>

                <button
                  onClick={() => deleteItemMutation.mutate(item.videoId)}
                  disabled={deleteItemMutation.isPending}
                  className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  title="Remove from history"
                  aria-label="Remove from history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
              <History className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black text-foreground">Watch History</h2>
              <span className="text-xs font-bold text-muted-foreground">({historyItems.length})</span>
            </div>

            {historyItems.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-bold text-destructive hover:bg-destructive/10 gap-1.5 shadow-neo-raised-sm">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear All History</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-surface border-border/40 shadow-neo-raised">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base font-bold">Clear Watch History?</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground">
                      This will remove all recently watched lessons from your EduTube history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearHistoryMutation.mutate()}
                      className="text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {isLoading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Loading watch history...</span>
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-16 text-center border border-border/40 bg-surface/60 rounded-3xl p-8 space-y-3 max-w-md mx-auto shadow-neo-raised">
              <History className="h-10 w-10 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Watch History</h3>
              <p className="text-xs text-muted-foreground">
                Videos you watch on EduTube will be saved here so you can easily resume anytime.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("/dashboard/edutube")}
                className="text-xs font-bold"
              >
                Browse Lessons
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {renderGroup("Today", today)}
              {renderGroup("Yesterday", yesterday)}
              {renderGroup("Older", older)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default HistoryPage;
