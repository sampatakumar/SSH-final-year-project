import React from "react";
import { GraduationCap, Search, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  query?: string;
  onClearQuery?: () => void;
  onSelectSuggestion?: (s: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  query,
  onClearQuery,
  onSelectSuggestion,
}) => {
  const SUGGESTIONS = ["JavaScript Full Course", "React Tutorial for Beginners", "Python Crash Course", "Docker Tutorial"];

  return (
    <div className="py-16 px-4 text-center border border-border/40 bg-surface/60 rounded-3xl p-8 space-y-4 shadow-neo-raised max-w-xl mx-auto">
      <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-neo-raised-sm">
        <GraduationCap className="h-7 w-7" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-foreground">
          {query ? `No educational videos found for "${query}"` : "Start Your Learning Journey"}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          {query
            ? "Try adjusting your search terms or resetting the difficulty and duration filters."
            : "Discover curated coding tutorials, full courses, and hands-on projects tailored for developers."}
        </p>
      </div>

      {query && onClearQuery && (
        <Button variant="outline" size="sm" onClick={onClearQuery} className="text-xs font-semibold gap-1.5 shadow-neo-raised-sm">
          <RefreshCw className="h-3 w-3" />
          Clear Search
        </Button>
      )}

      {onSelectSuggestion && (
        <div className="pt-3 border-t border-border/30 space-y-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Searches</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onSelectSuggestion(s)}
                className="px-2.5 py-1 text-xs font-semibold bg-background hover:bg-surface text-foreground rounded-lg border border-border/40 transition-colors shadow-neo-raised-sm"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="py-16 px-4 text-center border border-destructive/30 bg-destructive/5 rounded-3xl p-8 space-y-4 shadow-neo-raised max-w-lg mx-auto">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/30 flex items-center justify-center mx-auto">
        <AlertCircle className="h-6 w-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-foreground">EduTube Service Notice</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          {error || "EduTube is temporarily unable to retrieve videos. Please check your connection or try again."}
        </p>
      </div>

      <Button variant="default" size="sm" onClick={onRetry} className="text-xs font-bold gap-1.5 shadow-neo-raised-sm">
        <RefreshCw className="h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
};
