import React, { useState, useEffect, useCallback } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  RotateCcw,
  Check,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SmartSkillApi, type SpacedRevisionItem } from "@/lib/api";

export const SpacedRevisionWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"due" | "upcoming">("due");
  const [queue, setQueue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeItem, setActiveItem] = useState<SpacedRevisionItem | null>(null);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [answerText, setAnswerText] = useState("");

  const fetchQueue = useCallback(async (isMounted = { current: true }) => {
    try {
      setIsLoading(true);
      const data = await SmartSkillApi.getRevisionQueue(10);
      if (isMounted.current) setQueue(data);
    } catch {
      // Graceful fallback for non-blocking UI
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    fetchQueue(isMounted);
    return () => {
      isMounted.current = false;
    };
  }, [fetchQueue]);

  const handleCompleteRetrieval = async () => {
    if (!activeItem || selfScore === null || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await SmartSkillApi.reviewRevisionAttempt(activeItem._id, {
        score: selfScore,
        answerGiven: answerText,
        idempotencyKey: `rev_${activeItem._id}_${Date.now()}`,
      });
      toast.success(
        res.passed
          ? `Retrieval Successful! Next review in ${res.newIntervalDays} days.`
          : "Scheduled for immediate reinforcement review tomorrow.",
        { description: res.rationale }
      );
      setActiveItem(null);
      setSelfScore(null);
      setAnswerText("");
      await fetchQueue();
    } catch (err: any) {
      toast.error(err.message || "Failed to record revision review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 rounded-2xl bg-surface border border-border/40 shadow-neo-raised animate-pulse h-48 flex items-center justify-center">
        <span className="text-xs text-muted-foreground font-semibold">Loading revision queue...</span>
      </div>
    );
  }

  const dueItems = queue?.due || [];
  const upcomingItems = queue?.upcoming || [];
  const stats = {
    dueTodayCount: queue?.stats?.dueTodayCount ?? dueItems.length,
    upcomingCount: queue?.stats?.upcomingCount ?? upcomingItems.length,
    needsReinforcementCount:
      queue?.stats?.needsReinforcementCount ??
      dueItems.filter((i: SpacedRevisionItem) => i.status === "needs_reinforcement").length,
    totalScheduled:
      queue?.stats?.totalScheduled ?? (dueItems.length + upcomingItems.length),
  };

  const displayedItems = activeTab === "due" ? dueItems : upcomingItems;

  return (
    <div className="p-5 rounded-2xl bg-surface border border-border/40 shadow-neo-raised space-y-4">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Adaptive Spaced Revision</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                Heuristic SM Ladder
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reinforces long-term retention via progressive 1→3→7→14→30 day retrieval intervals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Due Today</span>
            <span className={`font-mono font-extrabold text-sm ${stats.dueTodayCount > 0 ? "text-primary" : "text-foreground"}`}>
              {stats.dueTodayCount}
            </span>
          </div>
          <div className="text-right border-l border-border/30 pl-3">
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Upcoming</span>
            <span className="font-mono font-extrabold text-muted-foreground text-sm">
              {stats.upcomingCount}
            </span>
          </div>
          {stats.needsReinforcementCount > 0 && (
            <div className="text-right border-l border-border/30 pl-3">
              <span className="text-amber-400 block text-[10px] uppercase font-bold">Reinforce</span>
              <span className="font-mono font-extrabold text-amber-400 text-sm">
                {stats.needsReinforcementCount}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("due")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            activeTab === "due"
              ? "bg-primary text-primary-foreground shadow-neo-raised-sm"
              : "bg-surface/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          Due Today ({stats.dueTodayCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upcoming")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            activeTab === "upcoming"
              ? "bg-primary text-primary-foreground shadow-neo-raised-sm"
              : "bg-surface/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          Upcoming ({stats.upcomingCount})
        </button>
      </div>

      {/* Active Revision Practice Card Modal */}
      {activeItem && (
        <div className="p-4 rounded-xl border border-primary/40 bg-primary/5 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              Active Retrieval Practice • Stage {activeItem.stage} ({activeItem.intervalDays}d)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveItem(null)}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">
              {activeItem.targetConcept || activeItem.canonicalName || activeItem.skill}
            </h4>
            <p className="text-xs text-foreground/90 bg-background/80 p-3 rounded-lg border border-border/40 font-medium">
              {activeItem.promptQuestion || "Explain the core mechanics and trade-offs of this concept in your own words."}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground block">
              Your Retrieval Recall:
            </label>
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your explanation or mental model here before checking the answer..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg bg-background border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
            />
          </div>

          {/* Self-Rating Feedback Scale */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-muted-foreground block">
              How accurately did you recall this concept?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { score: 30, label: "Forgot / Missed (Reset)", color: "text-rose-400 border-rose-500/30" },
                { score: 60, label: "Hard / Partial Recall", color: "text-amber-400 border-amber-500/30" },
                { score: 85, label: "Good - Solid Recall", color: "text-primary border-primary/30" },
                { score: 100, label: "Easy - Fully Mastered", color: "text-emerald-400 border-emerald-500/30" },
              ].map((tier) => (
                <button
                  key={tier.score}
                  type="button"
                  onClick={() => setSelfScore(tier.score)}
                  className={`p-2 rounded-lg border text-[11px] text-center transition-all ${tier.color} ${
                    selfScore === tier.score ? "bg-primary/20 ring-1 ring-primary font-bold shadow-neo-raised-sm" : "bg-surface"
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              disabled={selfScore === null || isSubmitting}
              onClick={handleCompleteRetrieval}
              className="text-xs font-bold px-4 h-8"
            >
              {isSubmitting ? "Recording..." : "Complete Retrieval"}
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      {!activeItem && displayedItems.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-2">
            {displayedItems.map((item: SpacedRevisionItem) => (
              <div
                key={item._id}
                className="p-3 rounded-xl border border-border/30 bg-surface/70 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-neo-raised-sm"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground">
                      {item.canonicalName || item.skill}
                    </span>
                    {item.targetConcept && (
                      <span className="text-xs text-muted-foreground">
                        • {item.targetConcept}
                      </span>
                    )}
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Stage {item.stage} ({item.intervalDays}d)
                    </span>
                    {item.status === "needs_reinforcement" && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Needs Reinforcement
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {item.promptQuestion || `Practice retrieval for ${item.targetConcept || item.canonicalName}`}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveItem(item);
                    setSelfScore(null);
                    setAnswerText("");
                  }}
                  className="h-7 text-xs font-bold gap-1 shadow-neo-raised-sm border-primary/30 text-primary hover:bg-primary/10"
                >
                  <span>Practice Retrieval</span>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State / All Caught Up */}
      {!activeItem && displayedItems.length === 0 && (
        <div className="p-4 rounded-xl border border-dashed border-border/40 text-center space-y-2 bg-surface/40">
          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              {activeTab === "due" ? "All Spaced Revisions Caught Up!" : "No Upcoming Revisions Scheduled"}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md mx-auto">
              {activeTab === "due"
                ? "No retrieval reviews are currently due. Completing interactive EduTube checkpoints or roadmap milestones automatically schedules your next review."
                : "Complete interactive checkpoints in EduTube videos or milestone tasks to add concepts to your revision schedule."}
            </p>
          </div>

          {upcomingItems.length > 0 && activeTab === "due" && (
            <div className="pt-1 flex justify-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                Next scheduled review:{" "}
                <strong className="text-foreground">
                  {upcomingItems[0].canonicalName || upcomingItems[0].skill} on{" "}
                  {new Date(upcomingItems[0].scheduledDate).toLocaleDateString()}
                </strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SpacedRevisionWidget;
