import React from "react";
import { Code2, Filter } from "lucide-react";
import type { LanguageStatItem } from "../types/github.types";

export interface LanguageDistributionProps {
  languages: Record<string, LanguageStatItem>;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  Vue: "#41b883",
  Dart: "#00B4AB",
};

export const getLanguageColor = (lang: string): string => {
  return LANGUAGE_COLORS[lang] || "#6366f1";
};

export const LanguageDistribution: React.FC<LanguageDistributionProps> = ({
  languages,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const languageEntries = Object.entries(languages).sort(
    (a, b) => b[1].percentage - a[1].percentage
  );

  if (languageEntries.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm text-foreground">Language Distribution</h3>
        </div>

        {selectedLanguage !== "ALL" && (
          <button
            onClick={() => onSelectLanguage("ALL")}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <Filter className="h-3 w-3" /> Reset Filter ({selectedLanguage})
          </button>
        )}
      </div>

      {/* Multi-colored Progress Bar */}
      <div className="h-3 w-full rounded-full bg-muted/60 overflow-hidden flex shadow-inner">
        {languageEntries.map(([lang, stat]) => (
          <div
            key={lang}
            style={{
              width: `${Math.max(1, stat.percentage)}%`,
              backgroundColor: getLanguageColor(lang),
            }}
            title={`${lang}: ${stat.percentage}%`}
            className="h-full transition-all hover:opacity-80 cursor-pointer"
            onClick={() => onSelectLanguage(selectedLanguage === lang ? "ALL" : lang)}
          />
        ))}
      </div>

      {/* Language Pills / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
        {languageEntries.map(([lang, stat]) => {
          const isSelected = selectedLanguage === lang;
          return (
            <button
              key={lang}
              type="button"
              onClick={() => onSelectLanguage(isSelected ? "ALL" : lang)}
              className={`p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                isSelected
                  ? "bg-primary/10 border-primary shadow-xs"
                  : "bg-background/60 hover:bg-background border-border/50"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: getLanguageColor(lang) }}
                />
                <span className="font-medium text-foreground truncate">{lang}</span>
              </div>
              <span className="font-mono text-muted-foreground ml-1.5 shrink-0">
                {stat.percentage}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageDistribution;
