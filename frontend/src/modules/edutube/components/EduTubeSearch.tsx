import React, { useState, useEffect } from "react";
import { Search, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface EduTubeSearchProps {
  initialQuery?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  isLoading?: boolean;
}

export const EduTubeSearch: React.FC<EduTubeSearchProps> = ({
  initialQuery = "",
  onSearch,
  onClear,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    if (onClear) {
      onClear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-4 w-4 text-muted-foreground pointer-events-none" />

        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses, tutorials, technologies (e.g. JavaScript, React, Docker)..."
          className="w-full pl-11 pr-24 h-12 rounded-2xl bg-surface border-border/40 text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary shadow-neo-raised transition-all"
        />

        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !searchTerm.trim()}
          className="absolute right-2 h-8 px-3.5 rounded-xl font-bold text-xs gap-1.5 shadow-neo-raised-sm"
          aria-label="Submit search"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </Button>
      </div>
    </form>
  );
};
