import React from "react";
import { SlidersHorizontal, RotateCcw, Globe, BookOpen, Clock, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LANGUAGE_OPTIONS,
  LEVEL_OPTIONS,
  DURATION_OPTIONS,
  SORT_OPTIONS,
} from "../utils/edutube.utils";
import type {
  EduTubeLanguage,
  EduTubeLevel,
  EduTubeDuration,
  EduTubeSort,
} from "../types/edutube.types";

export interface FilterBarProps {
  language: EduTubeLanguage;
  level: EduTubeLevel;
  duration: EduTubeDuration;
  sort: EduTubeSort;
  onLanguageChange: (lang: EduTubeLanguage) => void;
  onLevelChange: (level: EduTubeLevel) => void;
  onDurationChange: (dur: EduTubeDuration) => void;
  onSortChange: (sort: EduTubeSort) => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  language,
  level,
  duration,
  sort,
  onLanguageChange,
  onLevelChange,
  onDurationChange,
  onSortChange,
  onReset,
}) => {
  const hasActiveFilters =
    language !== "all" || level !== "all" || duration !== "all" || sort !== "relevance";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface/80 border border-border/40 rounded-2xl shadow-neo-raised backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span className="hidden sm:inline">Filters:</span>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1 bg-background border border-border/40 rounded-xl px-2.5 py-1.5 text-xs shadow-neo-raised-sm">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as EduTubeLanguage)}
            className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            aria-label="Filter by language"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-background text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Level Selector */}
        <div className="flex items-center gap-1 bg-background border border-border/40 rounded-xl px-2.5 py-1.5 text-xs shadow-neo-raised-sm">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value as EduTubeLevel)}
            className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            aria-label="Filter by difficulty level"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-background text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Selector */}
        <div className="flex items-center gap-1 bg-background border border-border/40 rounded-xl px-2.5 py-1.5 text-xs shadow-neo-raised-sm">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <select
            value={duration}
            onChange={(e) => onDurationChange(e.target.value as EduTubeDuration)}
            className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            aria-label="Filter by duration"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-background text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-1 bg-background border border-border/40 rounded-xl px-2.5 py-1.5 text-xs shadow-neo-raised-sm">
          <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as EduTubeSort)}
            className="bg-transparent text-foreground font-semibold focus:outline-none cursor-pointer"
            aria-label="Sort videos"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-background text-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      )}
    </div>
  );
};
