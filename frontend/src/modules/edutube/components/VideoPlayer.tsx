import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  Play,
  RotateCcw,
  Clock,
  Flag,
  HelpCircle,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { EduTubeApi } from "../services/edutube.api";
import { SmartSkillApi, type VideoCheckpoint, type CheckpointSubmissionResult } from "@/lib/api";

export interface VideoPlayerProps {
  videoId: string;
  title: string;
  thumbnail?: string;
  channelTitle?: string;
  durationSeconds?: number;
  embeddable?: boolean;
  isBlocked?: boolean;
  rejectionReason?: string;
  rejectionCodes?: string[];
  onBack: () => void;
  onSeekPositionChange?: (currentSeconds: number) => void;
  seekToSeconds?: number | null;
  onReport?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  title,
  thumbnail = "",
  channelTitle = "",
  durationSeconds = 0,
  embeddable = true,
  isBlocked = false,
  rejectionReason,
  rejectionCodes = [],
  onBack,
  onSeekPositionChange,
  seekToSeconds = null,
  onReport,
}) => {
  const queryClient = useQueryClient();
  const [resumePrompt, setResumePrompt] = useState<{
    positionSeconds: number;
    completed: boolean;
  } | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [currentSeconds, setCurrentSeconds] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Phase 39: Interactive Video Checkpoints & Retrieval Quizzes
  const [checkpoints, setCheckpoints] = useState<VideoCheckpoint[]>([]);
  const [activeCheckpoint, setActiveCheckpoint] = useState<VideoCheckpoint | null>(null);
  const [dismissedCheckpointIds, setDismissedCheckpointIds] = useState<Set<string>>(new Set());
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submissionResult, setSubmissionResult] = useState<CheckpointSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch checkpoints for the video
  useEffect(() => {
    let isCancelled = false;
    SmartSkillApi.getVideoCheckpoints(videoId)
      .then((cps) => {
        if (!isCancelled) {
          setCheckpoints(cps || []);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [videoId]);

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
          handleStartPlayback(typeof seekToSeconds === "number" && seekToSeconds > 0 ? seekToSeconds : 0);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          handleStartPlayback(typeof seekToSeconds === "number" && seekToSeconds > 0 ? seekToSeconds : 0);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId, handleStartPlayback, seekToSeconds]);

  // Handle external seek requests
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
      if (currentSecondsRef.current > 0) {
        saveCurrentProgress(currentSecondsRef.current);
      }
    };
  }, [hasStarted, saveCurrentProgress, onSeekPositionChange]);

  // 4. Synchronize video playback with checkpoint trigger
  useEffect(() => {
    if (!hasStarted || activeCheckpoint) return;

    for (const cp of checkpoints) {
      if (
        !dismissedCheckpointIds.has(cp.checkpointId) &&
        !cp.isPassed &&
        currentSeconds >= cp.timestampSeconds &&
        currentSeconds <= cp.timestampSeconds + 15
      ) {
        setActiveCheckpoint(cp);
        setSelectedOption(null);
        setSubmissionResult(null);
        break;
      }
    }
  }, [currentSeconds, checkpoints, dismissedCheckpointIds, hasStarted, activeCheckpoint]);

  const handleSubmitCheckpoint = async () => {
    if (!activeCheckpoint || selectedOption === null) return;
    setIsSubmitting(true);
    try {
      const res = await SmartSkillApi.submitVideoCheckpoint(
        videoId,
        activeCheckpoint.checkpointId,
        { selectedOptionIndex: selectedOption }
      );
      setSubmissionResult(res);
      setCheckpoints((prev) =>
        prev.map((c) =>
          c.checkpointId === activeCheckpoint.checkpointId
            ? {
                ...c,
                hasAttempted: true,
                isPassed: res.isCorrect,
                lastScore: res.score,
                explanation: res.explanation,
              }
            : c
        )
      );
      queryClient.invalidateQueries({ queryKey: ["dashboard-intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["spaced-revision"] });
      queryClient.invalidateQueries({ queryKey: ["adaptive-loop"] });
      toast(res.isCorrect ? "Correct answer!" : "Incorrect — scheduled for reinforcement", {
        description: res.explanation,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit checkpoint answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseCheckpoint = () => {
    if (activeCheckpoint) {
      setDismissedCheckpointIds((prev) => new Set([...prev, activeCheckpoint.checkpointId]));
      setActiveCheckpoint(null);
      setSelectedOption(null);
      setSubmissionResult(null);
    }
  };

  const handleOpenCheckpointManual = (cp: VideoCheckpoint) => {
    setActiveCheckpoint(cp);
    setSelectedOption(null);
    setSubmissionResult(null);
  };

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

      {/* Embedded Player Container with Interactive Checkpoint Overlay */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-border/40 shadow-neo-raised">
        {isBlocked ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-surface text-foreground">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-neo-raised-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-md">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Education-Only Gate
              </span>
              <h3 className="text-sm font-bold text-foreground">
                Playback Blocked: Non-Educational Content
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rejectionReason ||
                  "EduTube strictly restricts playback to accredited programming, engineering, mathematics, and academic courses. Entertainment media, music videos, and short-form content are blocked."}
              </p>
              {rejectionCodes.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 pt-1">
                  {rejectionCodes.map((code) => (
                    <span
                      key={code}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted/60 text-muted-foreground border border-border/40"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="text-xs font-bold gap-1.5 shadow-neo-raised-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to EduTube</span>
              </Button>
              {onReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReport}
                  className="text-xs font-semibold gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Flag className="h-3 w-3" />
                  <span>Report Error</span>
                </Button>
              )}
            </div>
          </div>
        ) : embeddable ? (
          <>
            <iframe
              src={embedUrl}
              title={title || "EduTube Video Lesson"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />

            {/* Checkpoint Knowledge Check Overlay */}
            {activeCheckpoint && (
              <div
                className="absolute inset-0 bg-background/90 backdrop-blur-md z-30 p-5 flex flex-col justify-between overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-label="Interactive Video Checkpoint"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <HelpCircle className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                        Checkpoint Quiz • {formatTimestamp(activeCheckpoint.timestampSeconds)}
                      </span>
                      <h4 className="text-sm font-bold text-foreground">
                        {activeCheckpoint.skill} Concept Check
                      </h4>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseCheckpoint}
                    className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                    aria-label="Close Checkpoint"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="my-auto py-4 space-y-4 max-w-xl mx-auto w-full">
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {activeCheckpoint.question}
                  </p>

                  <div className="space-y-2">
                    {activeCheckpoint.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      let optionStyle =
                        "border-border/50 bg-surface/70 hover:bg-surface hover:border-primary/50 text-foreground";

                      if (submissionResult) {
                        if (idx === submissionResult.correctOptionIndex) {
                          optionStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                        } else if (isSelected && !submissionResult.isCorrect) {
                          optionStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-primary bg-primary/10 text-primary font-bold shadow-neo-raised-sm";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={Boolean(submissionResult) || isSubmitting}
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${optionStyle}`}
                        >
                          <span className="shrink-0 h-5 w-5 rounded-full border flex items-center justify-center font-mono font-bold text-[10px] bg-background/50">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-relaxed">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {submissionResult && (
                    <div
                      className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                        submissionResult.isCorrect
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {submissionResult.isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Correct! Spaced Revision schedule updated.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-rose-400" />
                            <span>Needs Practice — scheduled for spaced reinforcement.</span>
                          </>
                        )}
                      </div>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {submissionResult.explanation}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  {!submissionResult ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCloseCheckpoint}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Skip for now
                      </Button>
                      <Button
                        size="sm"
                        disabled={selectedOption === null || isSubmitting}
                        onClick={handleSubmitCheckpoint}
                        className="text-xs font-bold px-4"
                      >
                        {isSubmitting ? "Validating..." : "Submit Answer"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleCloseCheckpoint}
                      className="text-xs font-bold gap-1 px-4"
                    >
                      <span>Resume Playback</span>
                      <Play className="h-3 w-3 fill-current ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
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

      {/* Checkpoints Timeline Bar */}
      {checkpoints.length > 0 && (
        <div className="p-3 rounded-xl bg-surface/60 border border-border/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-neo-raised-sm">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Interactive Checkpoints ({checkpoints.length}):</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {checkpoints.map((cp) => (
              <button
                key={cp.checkpointId}
                onClick={() => handleOpenCheckpointManual(cp)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  cp.isPassed
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                    : cp.hasAttempted
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "bg-surface border-border/40 hover:border-primary/50 text-foreground"
                }`}
                title={cp.question}
              >
                <span>{formatTimestamp(cp.timestampSeconds)}</span>
                <span className="font-bold">• {cp.skill}</span>
                {cp.isPassed && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
