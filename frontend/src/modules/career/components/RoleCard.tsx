import React from "react";
import { CareerRole } from "../types/careerPathway.types";
import {
  Briefcase,
  Compass,
  FlaskConical,
  ClipboardCheck,
  FolderGit2,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";

interface RoleCardProps {
  role: CareerRole;
  isSelectedForCompare: boolean;
  onToggleCompare: (roleId: string) => void;
  onInspect: (role: CareerRole) => void;
  onViewPlan: (role: CareerRole) => void;
  canCompare: boolean;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  role,
  isSelectedForCompare,
  onToggleCompare,
  onInspect,
  onViewPlan,
  canCompare,
}) => {
  const isPrimary = role.relevance?.type === "primary";
  const isCross = role.relevance?.type === "cross_disciplinary";

  return (
    <div
      className={`group relative rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between ${
        isSelectedForCompare
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
          : "border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-background/50"
      }`}
      data-testid={`role-card-${role.roleId}`}
    >
      <div>
        {/* Top Badges & Selection Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {isPrimary && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-3 h-3" />
                Degree Match
              </span>
            )}
            {isCross && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                <Compass className="w-3 h-3" />
                Cross-Discipline Bridge
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
              {role.roleFamily}
            </span>
          </div>

          {/* Compare Checkbox */}
          <button
            type="button"
            onClick={() => onToggleCompare(role.roleId)}
            disabled={!isSelectedForCompare && !canCompare}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
              isSelectedForCompare
                ? "bg-primary text-primary-foreground font-semibold"
                : canCompare
                ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                : "text-muted-foreground/40 cursor-not-allowed"
            }`}
            title={
              isSelectedForCompare
                ? "Remove from comparison"
                : canCompare
                ? "Select to compare side by side"
                : "Maximum 2 roles selected for comparison"
            }
            aria-label={`Compare ${role.title}`}
          >
            {isSelectedForCompare ? (
              <CheckSquare className="w-3.5 h-3.5" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            <span>Compare</span>
          </button>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors tracking-tight mb-1.5">
          {role.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {role.description}
        </p>

        {/* Regulatory Alert Banner if any */}
        {role.regulatoryNotes && (
          <div className="mb-3.5 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{role.regulatoryNotes}</span>
          </div>
        )}

        {/* Core Skills Chips */}
        <div className="mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
            Core Competencies
          </span>
          <div className="flex flex-wrap gap-1.5">
            {role.coreSkills.slice(0, 4).map((c) => (
              <span
                key={c.skill}
                className="px-2 py-0.5 rounded text-xs bg-muted/80 text-foreground border border-border/60"
              >
                {c.skill}
              </span>
            ))}
            {role.coreSkills.length > 4 && (
              <span className="px-1.5 py-0.5 rounded text-xs text-muted-foreground">
                +{role.coreSkills.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Activities & Actions */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-3">
            {role.suggestedLabIds && role.suggestedLabIds.length > 0 && (
              <span className="inline-flex items-center gap-1" title={`${role.suggestedLabIds.length} Practical Labs`}>
                <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
                {role.suggestedLabIds.length} Labs
              </span>
            )}
            {role.suggestedAssessmentIds && role.suggestedAssessmentIds.length > 0 && (
              <span className="inline-flex items-center gap-1" title={`${role.suggestedAssessmentIds.length} Assessments`}>
                <ClipboardCheck className="w-3.5 h-3.5 text-emerald-500" />
                {role.suggestedAssessmentIds.length} Tests
              </span>
            )}
            {role.suggestedProjectIds && role.suggestedProjectIds.length > 0 && (
              <span className="inline-flex items-center gap-1" title={`${role.suggestedProjectIds.length} Projects`}>
                <FolderGit2 className="w-3.5 h-3.5 text-amber-500" />
                {role.suggestedProjectIds.length} Projects
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onInspect(role)}
            className="w-full px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-background hover:bg-muted text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <Briefcase className="w-3.5 h-3.5" />
            Inspect Track
          </button>
          <button
            type="button"
            onClick={() => onViewPlan(role)}
            className="w-full px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
          >
            <span>Prep Plan</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
