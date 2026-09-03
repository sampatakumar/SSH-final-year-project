import React, { useState } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface SearchBarProps {
  onSearch: (username: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

const POPULAR_EXAMPLES = ["torvalds", "gaearon", "shadcn", "sindresorhus"];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  initialValue = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const prevInitialRef = React.useRef(initialValue);

  React.useEffect(() => {
    if (initialValue !== prevInitialRef.current) {
      prevInitialRef.current = initialValue;
      setValue(initialValue);
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleQuickSelect = (username: string) => {
    setValue(username);
    onSearch(username);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search GitHub username (e.g. torvalds)..."
            className="pl-10 h-10 text-sm bg-card/60 focus:bg-card border-border/60"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="h-10 px-5 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
      </form>

      {/* Quick Example Tags */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium">Try popular profiles:</span>
        {POPULAR_EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => handleQuickSelect(example)}
            disabled={isLoading}
            className="px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors border border-border/40 font-mono"
          >
            @{example}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
