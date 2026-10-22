import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  MapPin,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Youtube,
  Target,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, RecommendationItem } from "@/lib/api";
import { toast } from "sonner";

export const LearningRoadmapPage = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("Full Stack Developer");
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const recs = await SmartSkillApi.getRecommendations();
      setRecommendations(recs);
    } catch (err: any) {
      console.error("Failed to load recommendations:", err);
      toast.error(err.message || "Failed to load learning roadmap");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const toggleMilestone = async (rec: RecommendationItem) => {
    const recId = rec.recommendationId || rec.skill;
    const newStatus = rec.isCompleted ? "pending" : "completed";

    setUpdatingIds((prev) => ({ ...prev, [recId]: true }));
    // Optimistic UI update
    setRecommendations((prev) =>
      prev.map((r) => {
        const match =
          (r.recommendationId && r.recommendationId === rec.recommendationId) ||
          r.skill === rec.skill;
        return match ? { ...r, isCompleted: !r.isCompleted } : r;
      })
    );

    try {
      await SmartSkillApi.updateRoadmapMilestoneStatus(recId, newStatus, {
        skill: rec.skill,
        canonicalName: rec.skill,
        title: rec.learningObjective || `Roadmap: ${rec.skill}`,
      });
      toast.success(
        newStatus === "completed"
          ? `Milestone "${rec.skill}" completed!`
          : `Milestone "${rec.skill}" set to pending.`
      );
    } catch (err: any) {
      // Revert optimistic update
      setRecommendations((prev) =>
        prev.map((r) => {
          const match =
            (r.recommendationId && r.recommendationId === rec.recommendationId) ||
            r.skill === rec.skill;
          return match ? { ...r, isCompleted: rec.isCompleted } : r;
        })
      );
      toast.error(err.message || "Failed to update milestone status.");
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [recId]: false }));
    }
  };

  const completedCount = recommendations.filter((r) => r.isCompleted).length;
  const progressPct = recommendations.length > 0 ? Math.round((completedCount / recommendations.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Actionable Learning Roadmap
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized milestones and practical coding practice mapped directly to your detected skill gaps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {recommendations.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-xs shadow-neo-raised-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">
                Progress: {completedCount}/{recommendations.length} completed ({progressPct}%)
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="shadow-neo-raised-sm bg-background border-border/40 gap-2 h-9 text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            Refresh Roadmap
          </Button>
        </div>
      </div>

      {/* Recommendations Timeline List */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground space-y-2">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
          <p>Generating personalized learning roadmap...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="py-16 text-center border border-border/40 bg-surface rounded-2xl p-8 space-y-3">
          <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
          <h3 className="text-base font-bold text-foreground">All Skill Gaps Addressed!</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Your evaluated evidence satisfies your target role benchmarks. Re-evaluate your profile after adding new projects or repositories.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => {
            const recKey = rec.recommendationId || `${rec.skill}-${index}`;
            const isUpdating = updatingIds[rec.recommendationId || rec.skill];

            return (
              <div
                key={recKey}
                className={`p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-5 shadow-neo-raised ${
                  rec.isCompleted
                    ? "bg-emerald-950/10 border-emerald-500/30"
                    : "bg-surface border-border/30 hover:border-primary/40"
                }`}
              >
                {/* Milestone Info */}
                <div className="space-y-3 max-w-3xl flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleMilestone(rec)}
                      disabled={isUpdating}
                      title={rec.isCompleted ? "Click to unmark milestone" : "Click to mark milestone complete"}
                      className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                        rec.isCompleted
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                          : "bg-muted/40 border-border/60 text-muted-foreground hover:border-primary/50 hover:text-primary"
                      }`}
                    >
                      {isUpdating ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <CheckCircle2 className={`h-4 w-4 ${rec.isCompleted ? "fill-emerald-400/20" : ""}`} />
                      )}
                    </button>

                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h3 className={`text-base font-bold ${rec.isCompleted ? "text-foreground line-through opacity-80" : "text-foreground"}`}>
                      {rec.skill}
                    </h3>

                    {rec.isCompleted ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
                        Completed
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase ${
                          rec.priority === "Critical"
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : rec.priority === "High"
                            ? "bg-warning/10 text-warning border-warning/30"
                            : "bg-secondary text-muted-foreground border-border/40"
                        }`}
                      >
                        {rec.priority} Priority
                      </span>
                    )}

                    {rec.targetLevel && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono">
                        Target: {rec.targetLevel}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 pl-9 text-xs">
                    <p className="text-foreground font-medium leading-relaxed">
                      🎯 <b>Objective:</b> {rec.learningObjective}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      🛠️ <b>Action:</b> {rec.action || rec.practicalAction}
                    </p>
                    {rec.reasoning && (
                      <p className="text-muted-foreground/90 leading-relaxed text-[11px]">
                        💡 <b>Why it matters:</b> {rec.reasoning}
                      </p>
                    )}

                    {/* Prerequisites */}
                    {rec.prerequisites && rec.prerequisites.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] font-semibold text-muted-foreground">Prerequisites:</span>
                        {rec.prerequisites.map((p) => (
                          <span
                            key={p}
                            className="text-[10px] px-2 py-0.2 rounded-md bg-muted/50 border border-border/30 text-foreground font-mono"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Completion criteria */}
                    {rec.completionCriteria && (
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>{rec.completionCriteria}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons & Time Estimate */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0 pl-9 lg:pl-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-border/20">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Est: {rec.estimatedHours || 5} hours (estimate)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {rec.platformTaskId && (
                      <Link
                        to={`/dashboard/coding?taskId=${encodeURIComponent(rec.platformTaskId)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-neo-raised-sm"
                      >
                        <Code2 className="h-3.5 w-3.5" /> Solve in Sandbox
                      </Link>
                    )}

                    {rec.documentationUrl && (
                      <a
                        href={rec.documentationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/40 text-foreground text-xs font-semibold hover:border-primary/40 transition-all shadow-neo-raised-sm"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-primary" /> Docs <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </a>
                    )}

                    <Link
                      to={`/dashboard/edutube?search=${encodeURIComponent(rec.skill)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-all shadow-neo-raised-sm"
                    >
                      <Youtube className="h-3.5 w-3.5" /> EduTube Lessons
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningRoadmapPage;
