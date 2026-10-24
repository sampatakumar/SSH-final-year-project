import React, { useState, useEffect } from "react";
import { RoleComparisonResult, CareerRole } from "../types/careerPathway.types";
import { careerPathwayApi } from "../services/careerPathway.api";
import {
  X,
  Compass,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertTriangle,
} from "lucide-react";

interface RoleComparisonModalProps {
  role1Id: string | null;
  role2Id: string | null;
  isOpen: boolean;
  onClose: () => void;
  onViewPlan: (roleId: string) => void;
}

export const RoleComparisonModal: React.FC<RoleComparisonModalProps> = ({
  role1Id,
  role2Id,
  isOpen,
  onClose,
  onViewPlan,
}) => {
  const [comparison, setComparison] = useState<RoleComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !role1Id || !role2Id) {
      setComparison(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    careerPathwayApi
      .compareRoles(role1Id, role2Id)
      .then((data) => {
        if (isMounted) setComparison(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to compare roles.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, role1Id, role2Id]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-dialog-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Multi-Branch Track Comparator</span>
            </div>
            <h2 id="comparison-dialog-title" className="text-xl font-bold text-foreground tracking-tight">
              Side-by-Side Career Pathway Comparison
            </h2>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-foreground">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Analyzing skill overlaps and readiness deltas...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          ) : comparison ? (
            <>
              {/* Comparative Alignment Banner */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="text-xs text-foreground leading-relaxed">
                  <span className="font-bold block mb-1">Comparative Trajectory Analysis</span>
                  <p>{comparison.comparison.alignmentSummary}</p>
                </div>
              </div>

              {/* Side-by-Side Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ROLE 1 CARD */}
                <div className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {comparison.role1.roleFamily}
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-2 mb-1">
                      {comparison.role1.title}
                    </h3>
                    <span className="text-xs text-muted-foreground block mb-4">
                      {comparison.role1.disciplineCategory}
                    </span>

                    {/* Readiness Meter */}
                    <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 mb-4">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Demonstrated Readiness</span>
                        <span className="text-xl font-extrabold text-foreground">
                          {comparison.role1.readinessIndex}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${comparison.role1.readinessIndex}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1.5 block">
                        Band: <strong className="text-foreground">{comparison.role1.readinessBand}</strong>
                      </span>
                    </div>

                    {/* Unique Skills to Role 1 */}
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                        Distinct Requirements for this Track ({comparison.role1.uniqueSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {comparison.role1.uniqueSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-xs bg-muted text-foreground border border-border/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewPlan(comparison.role1.roleId)}
                    className="w-full py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Plan for {comparison.role1.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ROLE 2 CARD */}
                <div className="p-5 rounded-xl border border-border bg-card flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {comparison.role2.roleFamily}
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-2 mb-1">
                      {comparison.role2.title}
                    </h3>
                    <span className="text-xs text-muted-foreground block mb-4">
                      {comparison.role2.disciplineCategory}
                    </span>

                    {/* Readiness Meter */}
                    <div className="p-3.5 rounded-lg bg-muted/30 border border-border/80 mb-4">
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-xs font-semibold text-muted-foreground">Demonstrated Readiness</span>
                        <span className="text-xl font-extrabold text-foreground">
                          {comparison.role2.readinessIndex}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${comparison.role2.readinessIndex}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1.5 block">
                        Band: <strong className="text-foreground">{comparison.role2.readinessBand}</strong>
                      </span>
                    </div>

                    {/* Unique Skills to Role 2 */}
                    <div className="mb-4">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                        Distinct Requirements for this Track ({comparison.role2.uniqueSkills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {comparison.role2.uniqueSkills.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded text-xs bg-muted text-foreground border border-border/70"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewPlan(comparison.role2.roleId)}
                    className="w-full py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>View Plan for {comparison.role2.title}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Shared Core Competencies Row */}
              <div className="p-4 rounded-xl border border-border bg-muted/10">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Shared Foundational Competencies ({comparison.comparison.sharedCoreSkills.length})
                </h4>
                {comparison.comparison.sharedCoreSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {comparison.comparison.sharedCoreSkills.map((s) => {
                      const isDemonstrated = comparison.comparison.sharedDemonstratedSkills.includes(s);
                      return (
                        <span
                          key={s}
                          className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${
                            isDemonstrated
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                              : "bg-muted border-border text-muted-foreground"
                          }`}
                        >
                          {isDemonstrated && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {s}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    These tracks require completely separate technical specializations.
                  </p>
                )}
              </div>
            </>
          ) : null}
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
