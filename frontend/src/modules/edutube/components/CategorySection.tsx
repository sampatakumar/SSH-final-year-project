import React from "react";
import { Sparkles, Terminal, Code2 } from "lucide-react";
import { POPULAR_TECHNOLOGIES } from "../utils/edutube.utils";

export interface CategorySectionProps {
  activeQuery?: string;
  onSelectTechnology: (techQuery: string, techName: string) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  activeQuery,
  onSelectTechnology,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            Explore by Technology
          </h2>
        </div>
        <span className="text-[11px] text-muted-foreground font-medium">Curated Tracks</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {POPULAR_TECHNOLOGIES.map((tech) => {
          const isSelected =
            activeQuery &&
            (activeQuery.toLowerCase().includes(tech.name.toLowerCase()) ||
              tech.query.toLowerCase().includes(activeQuery.toLowerCase()));

          return (
            <button
              key={tech.name}
              onClick={() => onSelectTechnology(tech.query, tech.name)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-neo-pressed"
                  : "bg-surface hover:bg-surface/80 text-foreground border-border/40 hover:border-primary/40 shadow-neo-raised-sm"
              }`}
            >
              <Code2 className="h-3.5 w-3.5 text-primary/80 shrink-0" />
              <span>{tech.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${isSelected ? "bg-black/20 text-white" : "bg-muted text-muted-foreground"}`}>
                {tech.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
