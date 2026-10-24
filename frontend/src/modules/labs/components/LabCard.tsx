import React from "react";
import { PracticalLab } from "../types/practicalLab.types";
import { Clock, Award, ArrowRight, BookOpen, Layers } from "lucide-react";

interface LabCardProps {
  lab: PracticalLab;
  onSelect: (labId: string) => void;
}

export const LabCard: React.FC<LabCardProps> = ({ lab, onSelect }) => {
  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "beginner":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "advanced":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "intermediate":
      default:
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md">
      <div>
        {/* Top Badges */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <Layers className="h-3 w-3" />
            {lab.disciplineCategory}
          </span>
          <div className="flex items-center gap-2">
            {lab.safetySensitive && (
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Safety-Sensitive
              </span>
            )}
            <span
              className={`rounded-md border px-2 py-0.5 text-xs font-medium ${getDifficultyBadge(
                lab.difficulty
              )}`}
            >
              {lab.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {lab.estimatedMinutes}m
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
          {lab.title}
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {lab.description}
        </p>

        {/* Relevant Skills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {lab.relevantSkills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {skill}
            </span>
          ))}
          {lab.relevantSkills.length > 3 && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              +{lab.relevantSkills.length - 3}
            </span>
          )}
        </div>

        {/* Learning Objectives Preview */}
        <div className="mb-4 rounded-lg bg-muted/50 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span>Learning Objectives</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-[11px] text-muted-foreground">
            {lab.learningObjectives.slice(0, 2).map((obj, i) => (
              <li key={i} className="line-clamp-1">
                {obj}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Award className="h-3.5 w-3.5 text-amber-500" />
          {lab.tasks.length} Practical Tasks
        </span>
        <button
          onClick={() => onSelect(lab.labId)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Launch Lab</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
