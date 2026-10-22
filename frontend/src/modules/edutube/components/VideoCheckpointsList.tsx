import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HelpCircle, CheckCircle2, XCircle, Play, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SmartSkillApi, type VideoCheckpoint } from "@/lib/api";

export interface VideoCheckpointsListProps {
  videoId: string;
  currentPlaybackSeconds?: number;
  onSeekTo?: (seconds: number) => void;
}

export const VideoCheckpointsList: React.FC<VideoCheckpointsListProps> = ({
  videoId,
  onSeekTo,
}) => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submissionResults, setSubmissionResults] = useState<Record<string, any>>({});

  const { data: checkpoints = [], isLoading } = useQuery({
    queryKey: ["edutube", "checkpoints", videoId],
    queryFn: () => SmartSkillApi.getVideoCheckpoints(videoId),
    enabled: Boolean(videoId),
  });

  const submitMutation = useMutation({
    mutationFn: async ({ checkpointId, selectedOptionIndex }: { checkpointId: string; selectedOptionIndex: number }) => {
      return await SmartSkillApi.submitVideoCheckpoint(videoId, checkpointId, { selectedOptionIndex });
    },
    onSuccess: (res, vars) => {
      setSubmissionResults((prev) => ({ ...prev, [vars.checkpointId]: res }));
      queryClient.invalidateQueries({ queryKey: ["edutube", "checkpoints", videoId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-intelligence"] });
      queryClient.invalidateQueries({ queryKey: ["spaced-revision"] });
      toast(res.isCorrect ? "Correct answer!" : "Incorrect — scheduled for reinforcement", {
        description: res.explanation,
      });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit checkpoint answer.");
    },
  });

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = Math.floor(sec % 60);
    return `${mins}:${remaining.toString().padStart(2, "0")}`;
  };

  if (isLoading || checkpoints.length === 0) {
    return null;
  }

  return (
    <div className="p-4 rounded-2xl bg-surface/80 border border-border/40 space-y-3 shadow-neo-raised text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm">
            Interactive Checkpoints ({checkpoints.length})
          </h3>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {checkpoints.filter((c) => c.isPassed).length}/{checkpoints.length} Mastered
        </span>
      </div>

      <div className="space-y-2 pt-1">
        {checkpoints.map((cp) => {
          const isExpanded = expandedId === cp.checkpointId;
          const result = submissionResults[cp.checkpointId];
          const hasAttempted = cp.hasAttempted || Boolean(result);
          const isPassed = cp.isPassed || Boolean(result?.isCorrect);
          const selectedOption = selectedAnswers[cp.checkpointId];

          return (
            <div
              key={cp.checkpointId}
              className={`rounded-xl border transition-all ${
                isPassed
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : hasAttempted
                  ? "border-rose-500/30 bg-rose-500/5"
                  : "border-border/40 bg-surface/60"
              }`}
            >
              {/* Checkpoint Header Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : cp.checkpointId)}
                className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeekTo?.(cp.timestampSeconds);
                    }}
                    className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-[10px] hover:bg-primary/20 transition-colors flex items-center gap-1"
                    title="Jump to video timestamp"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    <span>{formatTime(cp.timestampSeconds)}</span>
                  </button>

                  <div className="truncate">
                    <span className="font-semibold text-foreground text-xs">{cp.question}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">({cp.skill})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPassed ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Passed</span>
                    </span>
                  ) : hasAttempted ? (
                    <span className="flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Needs Review</span>
                    </span>
                  ) : null}

                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded Question Card */}
              {isExpanded && (
                <div className="p-3 pt-0 border-t border-border/20 mt-1 space-y-3">
                  <p className="text-xs font-medium text-foreground pt-2">{cp.question}</p>

                  <div className="space-y-1.5">
                    {cp.options.map((opt, optIdx) => {
                      const isOptionSelected = selectedOption === optIdx;
                      let optionStyle =
                        "border-border/40 bg-surface/80 hover:bg-surface text-foreground";

                      if (result) {
                        if (optIdx === result.correctOptionIndex) {
                          optionStyle = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold";
                        } else if (isOptionSelected && !result.isCorrect) {
                          optionStyle = "border-rose-500/50 bg-rose-500/10 text-rose-400";
                        }
                      } else if (isOptionSelected) {
                        optionStyle = "border-primary bg-primary/10 text-primary font-bold";
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={Boolean(result) || submitMutation.isPending}
                          onClick={() =>
                            setSelectedAnswers((prev) => ({ ...prev, [cp.checkpointId]: optIdx }))
                          }
                          className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all flex items-start gap-2 ${optionStyle}`}
                        >
                          <span className="h-4 w-4 rounded-full border flex items-center justify-center font-mono text-[9px] shrink-0 bg-background/50">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {result && (
                    <div
                      className={`p-2.5 rounded-lg text-xs space-y-1 ${
                        result.isCorrect
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
                      }`}
                    >
                      <span className="font-bold">
                        {result.isCorrect ? "Correct!" : "Incorrect — Added to Spaced Revision"}
                      </span>
                      <p className="text-muted-foreground text-[11px] leading-relaxed">
                        {result.explanation}
                      </p>
                    </div>
                  )}

                  {!result && (
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        disabled={selectedOption === undefined || submitMutation.isPending}
                        onClick={() =>
                          submitMutation.mutate({
                            checkpointId: cp.checkpointId,
                            selectedOptionIndex: selectedOption,
                          })
                        }
                        className="text-xs font-bold h-7 px-3"
                      >
                        {submitMutation.isPending ? "Submitting..." : "Check Answer"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoCheckpointsList;
