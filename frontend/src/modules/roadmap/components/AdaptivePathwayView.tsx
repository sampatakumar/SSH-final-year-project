import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Code2,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  CheckSquare,
  ShieldAlert,
  GraduationCap,
  TrendingUp,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdaptivePathwayResponse,
  LearningActionItem,
  DiagnosedSkillItem,
} from "../types/adaptivePathway.types";
import { SmartSkillApi } from "@/lib/api";
import { toast } from "sonner";

interface AdaptivePathwayViewProps {
  pathway: AdaptivePathwayResponse;
  onRefresh: () => void;
}

const CYCLE_STAGES = [
  { key: "ASSESS", label: "Assess" },
  { key: "DIAGNOSE", label: "Diagnose" },
  { key: "PLAN", label: "Plan" },
  { key: "LEARN_REMEDIATE", label: "Learn / Remediate" },
  { key: "PRACTICE_APPLY", label: "Practice" },
  { key: "REASSESS", label: "Reassess" },
  { key: "MEASURE_IMPROVEMENT", label: "Measure Improvement" },
];

export const AdaptivePathwayView: React.FC<AdaptivePathwayViewProps> = ({ pathway, onRefresh }) => {
  const [completingIds, setCompletingIds] = useState<Record<string, boolean>>({});
  const [completedSet, setCompletedSet] = useState<Set<string>>(
    new Set(pathway.actions.filter((a) => a.isCompleted).map((a) => a.actionId))
  );

  const handleCompleteAction = async (action: LearningActionItem) => {
    const isCurrentlyDone = completedSet.has(action.actionId);
    setCompletingIds((prev) => ({ ...prev, [action.actionId]: true }));

    // Optimistic toggle
    setCompletedSet((prev) => {
      const next = new Set(prev);
      if (isCurrentlyDone) {
        next.delete(action.actionId);
      } else {
        next.add(action.actionId);
      }
      return next;
    });

    try {
      await SmartSkillApi.completePathwayAction(action.actionId, {
        skill: action.skill,
        title: action.title,
        activityType: action.category || "roadmap_action",
      });
      toast.success(
        !isCurrentlyDone
          ? `Completed "${action.title}"!`
          : `Marked "${action.title}" as pending.`
      );
      onRefresh();
    } catch (err: any) {
      // Revert optimistic toggle
      setCompletedSet((prev) => {
        const next = new Set(prev);
        if (isCurrentlyDone) {
          next.add(action.actionId);
        } else {
          next.delete(action.actionId);
        }
        return next;
      });
      toast.error(err.message || "Failed to update action status.");
    } finally {
      setCompletingIds((prev) => ({ ...prev, [action.actionId]: false }));
    }
  };

  const getStatusBadge = (status: DiagnosedSkillItem["currentStatus"]) => {
    switch (status) {
      case "demonstrated_mastery":
        return {
          label: "Mastered (≥ 80%)",
          className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      case "competent":
        return {
          label: "Competent (70-79%)",
          className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        };
      case "needs_remediation":
        return {
          label: "Needs Remediation (< 70%)",
          className: "bg-destructive/15 text-destructive border-destructive/30",
        };
      case "prerequisite_missing":
        return {
          label: "Prerequisites Missing",
          className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        };
      case "unassessed":
      default:
        return {
          label: "Unassessed",
          className: "bg-muted/60 text-muted-foreground border-border/40",
        };
    }
  };

  const getActionIcon = (actionType: LearningActionItem["actionType"]) => {
    switch (actionType) {
      case "review_objective":
        return <BookOpen className="h-4 w-4 text-primary" />;
      case "edutube_lesson":
        return <PlayCircle className="h-4 w-4 text-red-400" />;
      case "reassessment":
        return <RotateCcw className="h-4 w-4 text-warning" />;
      case "practice_activity":
        return <Code2 className="h-4 w-4 text-purple-400" />;
      case "project_studio":
        return <Layers className="h-4 w-4 text-emerald-400" />;
      case "spaced_revision":
        return <BrainCircuit className="h-4 w-4 text-cyan-400" />;
      default:
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  const renderActionLink = (action: LearningActionItem) => {
    const isExternal = action.destination.startsWith("http://") || action.destination.startsWith("https://");
    if (isExternal) {
      return (
        <a
          href={action.destination}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
        >
          {action.actionLabel}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return (
      <Link
        to={action.destination}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
      >
        {action.actionLabel}
        <ArrowRight className="h-3 w-3" />
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. Cycle Stage Visual Pipeline Banner */}
      <div className="p-4 rounded-2xl bg-surface border border-border/40 shadow-neo-raised space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Learning-Improvement Loop Status
            </h2>
          </div>
          <span className="text-xs font-semibold text-foreground">
            Current Stage: <span className="text-primary font-mono">{pathway.cycleStage.replace("_", " ")}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
          {CYCLE_STAGES.map((st, idx) => {
            const isActive =
              pathway.cycleStage === st.key ||
              (pathway.cycleStage === "PLAN_PRACTICE" && (st.key === "PLAN" || st.key === "PRACTICE_APPLY"));
            return (
              <div
                key={st.key}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                  isActive
                    ? "bg-primary/10 border-primary/50 text-primary shadow-sm"
                    : "bg-background/40 border-border/30 text-muted-foreground/80 opacity-70"
                }`}
              >
                <span className="text-[10px] font-mono font-bold opacity-60">0{idx + 1}</span>
                <span className={`text-[11px] font-semibold mt-0.5 ${isActive ? "text-primary font-bold" : ""}`}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Recommended Next Step Hero Card */}
      {pathway.primaryNextStep && (
        <div className="p-6 rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-surface shadow-neo-raised relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary text-primary-foreground">
                  Immediate Recommended Step
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" /> ~{pathway.primaryNextStep.estimatedMinutes} mins
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                {getActionIcon(pathway.primaryNextStep.actionType)}
                {pathway.primaryNextStep.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <b>Why this matters:</b> {pathway.primaryNextStep.whyRecommended}
              </p>
              <p className="text-xs text-foreground/90 font-medium">
                🎯 <b>Target Outcome:</b> {pathway.primaryNextStep.intendedOutcome}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {renderActionLink(pathway.primaryNextStep)}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCompleteAction(pathway.primaryNextStep!)}
                disabled={completingIds[pathway.primaryNextStep.actionId]}
                className="text-xs border-border/50 gap-1.5 h-8 font-semibold"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Mark Completed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Action Plan Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Personalized Action Plan
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Targeted remediation, verified lessons, and reassessments generated directly from your diagnosed gaps.
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {pathway.completedActionsCount} of {pathway.totalActionsCount} completed
          </span>
        </div>

        {pathway.actions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-border/40 bg-surface space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-foreground">No Pending Actions Required</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your academic skills have verified mastery. Advance to Project Studio or attempt diagnostic assessments in other domains.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pathway.actions.map((act) => {
              const isDone = completedSet.has(act.actionId);
              const isBusy = completingIds[act.actionId];

              return (
                <div
                  key={act.actionId}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-neo-raised ${
                    isDone
                      ? "bg-emerald-950/10 border-emerald-500/30 opacity-75"
                      : "bg-surface border-border/30 hover:border-primary/40"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getActionIcon(act.actionType)}
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                          {act.category}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                          act.priority === "critical"
                            ? "bg-destructive/15 text-destructive border-destructive/30"
                            : act.priority === "high"
                            ? "bg-warning/15 text-warning border-warning/30"
                            : "bg-muted text-muted-foreground border-border/40"
                        }`}
                      >
                        {act.priority}
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {act.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {act.whyRecommended}
                    </p>

                    <div className="text-[11px] text-foreground/80 font-medium">
                      🎯 {act.intendedOutcome}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/20">
                    <button
                      type="button"
                      onClick={() => handleCompleteAction(act)}
                      disabled={isBusy}
                      className={`text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isDone ? "text-emerald-400 hover:text-emerald-300" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                      {isDone ? "Completed" : "Mark as Done"}
                    </button>

                    {renderActionLink(act)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Diagnosed Skills & Priorities Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" /> Diagnosed Academic Competencies & Gaps
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparent breakdown of your current skill evidence status, prerequisite readiness, and priority score.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/40 bg-surface shadow-neo-raised">
          <table className="w-full text-left text-xs">
            <thead className="bg-background/80 border-b border-border/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3 px-4">Skill & Focus</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Latest Score</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Prerequisites</th>
                <th className="py-3 px-4">Recommended Step</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {pathway.diagnosis.allDiagnosed.map((item) => {
                const badge = getStatusBadge(item.currentStatus);
                return (
                  <tr key={item.skill} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{item.skill}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{item.importance}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {item.latestScore !== null ? (
                        <span className={`font-mono font-bold ${item.latestScore >= 70 ? "text-emerald-400" : "text-destructive"}`}>
                          {item.latestScore}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono text-[11px]">Unassessed</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-foreground">
                        {item.learningPriorityScore}
                      </span>
                      <span className="text-[10px] text-muted-foreground"> / 100</span>
                    </td>
                    <td className="py-3 px-4">
                      {item.prerequisites.hasPrerequisites ? (
                        item.prerequisites.isReady ? (
                          <span className="text-[10px] font-semibold text-emerald-400">All Met</span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold" title={item.prerequisites.missingPrerequisites.join(", ")}>
                            Needs: {item.prerequisites.missingPrerequisites.slice(0, 1).join(", ")}
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-[11px] text-muted-foreground line-clamp-2">
                        {item.actionRationale}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Evidence-Based Comparable Mastery Progression */}
      <div className="p-5 rounded-2xl bg-surface border border-border/40 shadow-neo-raised space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" /> Evidence-Based Mastery Progression
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified score improvement measured exclusively across comparable assessment attempts.
            </p>
          </div>
          {pathway.masteryProgression.totalComparisons > 0 && (
            <span className="text-xs font-mono font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
              Avg Δ: {pathway.masteryProgression.averageScoreDelta > 0 ? `+${pathway.masteryProgression.averageScoreDelta}%` : `${pathway.masteryProgression.averageScoreDelta}%`}
            </span>
          )}
        </div>

        {pathway.masteryProgression.comparisons.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">No Reassessment Comparisons Available Yet</p>
            <p className="max-w-md mx-auto">
              Mastery progression is computed when you retake a comparable assessment after targeted revision. Single baseline attempts cannot infer progression without subsequent evidence.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pathway.masteryProgression.comparisons.map((c) => (
              <div
                key={`${c.skill}-${c.latestDate}`}
                className="p-3.5 rounded-xl border border-border/30 bg-background/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-foreground">{c.skill}</div>
                  <div className="text-muted-foreground text-[11px]">{c.interpretation}</div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Baseline vs Latest</div>
                    <div className="font-mono text-xs">
                      {c.initialScore}% → <span className="font-bold">{c.latestScore}%</span>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-bold text-xs px-2 py-1 rounded border ${
                      c.scoreDelta > 0
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : c.scoreDelta === 0
                        ? "bg-muted text-muted-foreground border-border/40"
                        : "bg-destructive/15 text-destructive border-destructive/30"
                    }`}
                  >
                    {c.scoreDelta > 0 ? `+${c.scoreDelta}%` : `${c.scoreDelta}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-[10px] text-muted-foreground/75 leading-relaxed pt-2 border-t border-border/20">
          ℹ️ <b>Integrity Safeguard:</b> Score deltas reflect verified server-graded performance on comparable assessment objectives. Improvement is demonstrated solely through subsequent evidence, not passive activity views.
        </div>
      </div>
    </div>
  );
};

export default AdaptivePathwayView;
