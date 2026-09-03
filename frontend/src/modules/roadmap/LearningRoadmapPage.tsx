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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSkillApi, RecommendationItem } from "@/lib/api";
import { toast } from "sonner";

const LearningRoadmapPage = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const recs = await SmartSkillApi.getRecommendations();
      setRecommendations(recs);
    } catch (err: any) {
      console.error("Failed to load recommendations:", err);
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
              className="p-5 rounded-2xl border border-border/30 bg-surface shadow-neo-raised hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Milestone Info */}
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2.5">
                  <span className="h-6 w-6 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold flex items-center justify-center">
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
                </div>

                <div className="space-y-1 pl-8">
                  <p className="text-xs text-foreground font-medium">
                    🎯 <b>Objective:</b> {rec.learningObjective}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    🛠️ <b>Action:</b> {rec.action || rec.practicalAction}
                  </p>
                </div>
              </div>

              {/* Action Buttons & Time Estimate */}
              <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0 pl-8 md:pl-0 border-t md:border-t-0 pt-3 md:pt-0 border-border/20">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Est: {rec.estimatedHours || 5} hours</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
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
                      <BookOpen className="h-3.5 w-3.5 text-primary" /> Official Docs <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </a>
                  )}
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
