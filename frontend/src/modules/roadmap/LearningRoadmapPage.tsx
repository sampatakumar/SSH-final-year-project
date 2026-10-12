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

        <div className="flex items-center gap-2.5">
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
          {recommendations.map((rec, index) => (
            <div
              key={rec.recommendationId || `${rec.skill}-${index}`}
              className="p-5 rounded-2xl border border-border/30 bg-surface shadow-neo-raised hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-start justify-between gap-5"
            >
              {/* Milestone Info */}
              <div className="space-y-3 max-w-3xl flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-bold text-foreground">{rec.skill}</h3>
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

                  {rec.targetLevel && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono">
                      Target: {rec.targetLevel}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 pl-8 text-xs">
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
              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0 pl-8 lg:pl-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-border/20">
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
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningRoadmapPage;
