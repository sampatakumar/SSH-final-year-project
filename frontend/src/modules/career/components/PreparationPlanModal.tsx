import React, { useState, useEffect } from "react";
import { PreparationPlanResult, CareerRole } from "../types/careerPathway.types";
import { careerPathwayApi } from "../services/careerPathway.api";
import {
  X,
  Compass,
  ArrowRight,
  Loader2,
  FlaskConical,
  ClipboardCheck,
  FolderGit2,
  RotateCcw,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

interface PreparationPlanModalProps {
  roleId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PreparationPlanModal: React.FC<PreparationPlanModalProps> = ({
  roleId,
  isOpen,
  onClose,
}) => {
  const [planResult, setPlanResult] = useState<PreparationPlanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !roleId) {
      setPlanResult(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    careerPathwayApi
      .getPreparationPlan(roleId)
      .then((data) => {
        if (isMounted) setPlanResult(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to generate preparation plan.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, roleId]);

  if (!isOpen) return null;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "practical_lab":
        return <FlaskConical className="w-4 h-4 text-indigo-500" />;
      case "assessment":
        return <ClipboardCheck className="w-4 h-4 text-emerald-500" />;
      case "project_studio":
        return <FolderGit2 className="w-4 h-4 text-amber-500" />;
      case "spaced_revision":
        return <RotateCcw className="w-4 h-4 text-purple-500" />;
      default:
        return <GraduationCap className="w-4 h-4 text-sky-500" />;
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    if (priority.includes("Immediate") || priority.includes("Critical")) {
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30";
    }
    if (priority.includes("High") || priority.includes("Remediation")) {
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30";
    }
    if (priority.includes("Portfolio")) {
      return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30";
    }
    return "bg-primary/10 text-primary border border-primary/20";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prep-plan-dialog-title"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Personalized Preparation Plan</span>
            </div>
            <h2 id="prep-plan-dialog-title" className="text-xl font-bold text-foreground tracking-tight">
              {planResult ? planResult.roleTitle : "Career Preparation Plan"}
            </h2>
            {planResult && (
              <span className="text-xs text-muted-foreground mt-0.5 block">
                Current Readiness: <strong className="text-foreground">{planResult.heuristicReadinessIndex}%</strong> ({planResult.readinessBand}) • {planResult.totalSteps} Actionable Steps
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-sm text-foreground">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Generating your personalized evidence preparation plan...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          ) : planResult && planResult.plan.length > 0 ? (
            <div className="space-y-3">
              {planResult.regulatoryNotes && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{planResult.regulatoryNotes}</span>
                </div>
              )}

              {planResult.plan.map((step) => (
                <div
                  key={step.stepNumber}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[11px] font-bold text-foreground">
                        {step.stepNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${getPriorityBadgeClass(step.priority)}`}>
                        {step.priority}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {step.targetSkill}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {getActivityIcon(step.activityType)}
                      {step.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.rationale}
                    </p>

                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Outcome: {step.expectedOutcome}</span>
                    </div>
                  </div>

                  <Link
                    to={step.destinationRoute}
                    onClick={onClose}
                    className="shrink-0 px-3.5 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}

              <p className="text-[11px] text-muted-foreground italic leading-relaxed pt-2">
                {planResult.disclaimer}
              </p>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No preparation steps generated. You have demonstrated strong alignment for this pathway!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex items-center justify-end bg-card">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
