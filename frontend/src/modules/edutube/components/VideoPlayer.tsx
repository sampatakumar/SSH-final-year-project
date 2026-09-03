import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ExternalLink, ShieldAlert, Play, RotateCcw, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { EduTubeApi } from "../services/edutube.api";

export interface VideoPlayerProps {
  videoId: string;
  title: string;
  thumbnail?: string;
  channelTitle?: string;
  durationSeconds?: number;
  embeddable?: boolean;
  onBack: () => void;
  onSeekPositionChange?: (currentSeconds: number) => void;
  seekToSeconds?: number | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  thumbnail = "",
  channelTitle = "",
  durationSeconds = 0,
  embeddable = true,
  onBack,
  onSeekPositionChange,
  seekToSeconds = null,
}) => {
  const queryClient = useQueryClient();
  const [resumePrompt, setResumePrompt] = useState<{
    positionSeconds: number;
    completed: boolean;
  } | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const lastSavedSecondsRef = useRef(0);
  const totalDurationRef = useRef(durationSeconds);
  const currentSecondsRef = useRef(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (durationSeconds > 0) {
      totalDurationRef.current = durationSeconds;
    }
  }, [durationSeconds]);

  // Keep currentSecondsRef in sync
  useEffect(() => {
    currentSecondsRef.current = currentSeconds;
  }, [currentSeconds]);

  const invalidateEduTubeCaches = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["edutube", "history"] });
    queryClient.invalidateQueries({ queryKey: ["edutube", "continue-learning"] });
    queryClient.invalidateQueries({ queryKey: ["edutube", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["edutube", "progress", videoId] });
    queryClient.invalidateQueries({ queryKey: ["edutube", "playlists"] });
  }, [queryClient, videoId]);

  // Record history & start tracking
  const handleStartPlayback = useCallback(
    (startAt = 0) => {
      setStartSeconds(startAt);
      setCurrentSeconds(startAt);
      currentSecondsRef.current = startAt;
      setHasStarted(true);
      setResumePrompt(null);

      EduTubeApi.recordHistory({
        videoId,
        title,
        thumbnail,
        channelTitle,
        durationSeconds: totalDurationRef.current,
        positionSeconds: startAt,
      })
        .then(() => invalidateEduTubeCaches())
        .catch(() => {});
    },
    [videoId, title, thumbnail, channelTitle, invalidateEduTubeCaches]
  );

  // 1. Fetch saved progress on mount
  useEffect(() => {
    let isCancelled = false;

    EduTubeApi.getProgress(videoId)
      .then((prog) => {
        if (isCancelled) return;
        if (prog && prog.positionSeconds > 10) {
          setResumePrompt({
            positionSeconds: prog.positionSeconds,
            completed: prog.completed,
          });
        } else {
          // If no previous milestone, start playback & history immediately
          handleStartPlayback(0);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          handleStartPlayback(0);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId, handleStartPlayback]);

  // Handle external seek requests (e.g. clicking a timestamp note)
  useEffect(() => {
    if (typeof seekToSeconds === "number" && seekToSeconds >= 0) {
      setStartSeconds(Math.floor(seekToSeconds));
      setCurrentSeconds(Math.floor(seekToSeconds));
      currentSecondsRef.current = Math.floor(seekToSeconds);
      setHasStarted(true);
      setResumePrompt(null);
    }
  }, [seekToSeconds]);

  // 2. Throttled progress saver
  const saveCurrentProgress = useCallback(
    async (pos: number, forceCompleted = false) => {
      if (pos <= 0 && !forceCompleted) return;
      if (Math.abs(pos - lastSavedSecondsRef.current) < 5 && !forceCompleted) return;

      lastSavedSecondsRef.current = pos;
      try {
        await EduTubeApi.saveProgress(videoId, {
          positionSeconds: pos,
          durationSeconds: totalDurationRef.current || 600,
          completed: forceCompleted,
        });
        invalidateEduTubeCaches();
      } catch {}
    },
    [videoId, invalidateEduTubeCaches]
  );

  // 3. Progress interval tracker (simulated heartbeat while active)
  useEffect(() => {
    if (!hasStarted) return;

    progressTimerRef.current = setInterval(() => {
      setCurrentSeconds((prev) => {
        const next = prev + 5;
        currentSecondsRef.current = next;
        onSeekPositionChange?.(next);
        saveCurrentProgress(next);
        return next;
      });
    }, 5000);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      // Flush progress on unmount using latest ref value
      if (currentSecondsRef.current > 0) {
        saveCurrentProgress(currentSecondsRef.current);
      }
    };
  }, [hasStarted, saveCurrentProgress, onSeekPositionChange]);

  const formatTimestamp = (sec: number) => {
    const minutes = Math.floor(sec / 60);
    const remainingSeconds = Math.floor(sec % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
    videoId
  )}?rel=0&modestbranding=1&enablejsapi=1&autoplay=1${startSeconds > 0 ? `&start=${startSeconds}` : ""}`;
  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;

  return (
    <div className="space-y-4">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-xs font-bold text-muted-foreground hover:text-foreground gap-2 pl-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to EduTube</span>
        </Button>

        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Resume Playback Prompt Banner */}
      {resumePrompt && !hasStarted && (
        <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-neo-raised">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            {resumePrompt.completed ? (
              <span>You previously finished this lesson. Watch again?</span>
            ) : (
              <span>
                Resume playback from{" "}
                <strong className="text-primary font-bold">
                  {formatTimestamp(resumePrompt.positionSeconds)}
                </strong>
                ?
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStartPlayback(0)}
              className="h-7 text-xs font-bold gap-1 shadow-neo-raised-sm"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Start Over</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleStartPlayback(resumePrompt.positionSeconds)}
              className="h-7 text-xs font-bold gap-1 shadow-neo-raised-sm"
            >
              <Play className="h-3 w-3 fill-current" />
              <span>Continue</span>
            </Button>
          </div>
        </div>
      )}

      {/* Embedded Player Container */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border/40 shadow-neo-raised">
        {embeddable ? (
          <iframe
            src={embedUrl}
            title={title || "EduTube Video Lesson"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-surface text-foreground">
            <ShieldAlert className="h-10 w-10 text-warning" />
            <h3 className="text-base font-bold">Embedding Restricted by Content Owner</h3>
            <p className="text-xs text-muted-foreground max-w-md">
              This video is restricted from inline playback by the publisher. You can still watch it directly on YouTube.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => window.open(watchUrl, "_blank", "noopener,noreferrer")}
              className="text-xs font-bold gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Watch on YouTube
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
