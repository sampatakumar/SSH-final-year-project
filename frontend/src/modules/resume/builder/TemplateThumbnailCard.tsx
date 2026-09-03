import React from "react";
import type { TemplateId } from "../templates/types";

interface TemplateThumbnailCardProps {
  id: TemplateId;
  name: string;
  category: string;
  description: string;
  atsScore: string;
  badge?: string;
  isSelected: boolean;
  accentColor: string;
  onSelect: (id: TemplateId) => void;
}

export const TemplateThumbnailCard: React.FC<TemplateThumbnailCardProps> = ({
  id,
  name,
  category,
  description,
  atsScore,
  badge,
  isSelected,
  accentColor,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left p-3 rounded-xl border transition-all relative group flex flex-col gap-2.5 ${
        isSelected
          ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/40"
          : "bg-background/80 border-border/60 hover:border-primary/40 hover:bg-muted/40"
      }`}
    >
      {/* Badge */}
      {badge && (
        <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
          {badge}
        </span>
      )}

      {/* Miniature Visual Layout Preview */}
      <div className="w-full h-24 bg-white rounded-md border border-slate-200 p-2 shadow-2xs overflow-hidden flex flex-col justify-between pointer-events-none select-none">
        {id === "ats-classic" && (
          <div className="space-y-1.5 w-full">
            <div className="h-1.5 w-2/5 bg-slate-900 mx-auto rounded-xs" />
            <div className="h-0.5 w-3/4 bg-slate-400 mx-auto rounded-xs" />
            <div className="border-b border-slate-800 pb-0.5">
              <div className="h-1 w-1/4 bg-slate-800 rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
              <div className="h-1 w-5/6 bg-slate-300 rounded-xs" />
            </div>
            <div className="border-b border-slate-800 pb-0.5">
              <div className="h-1 w-1/3 bg-slate-800 rounded-xs" />
            </div>
            <div className="flex justify-between">
              <div className="h-1 w-1/3 bg-slate-500 rounded-xs" />
              <div className="h-1 w-1/5 bg-slate-400 rounded-xs" />
            </div>
          </div>
        )}

        {id === "modern-developer" && (
          <div className="space-y-1.5 w-full">
            <div className="flex items-center justify-between border-b pb-1" style={{ borderColor: accentColor }}>
              <div className="h-2 w-1/3 rounded-xs" style={{ backgroundColor: accentColor }} />
              <div className="flex gap-1">
                <div className="h-1.5 w-4 bg-slate-300 rounded-xs" />
                <div className="h-1.5 w-4 bg-slate-300 rounded-xs" />
              </div>
            </div>
            <div className="flex gap-1 py-0.5">
              <span className="h-2 px-1 rounded-xs bg-slate-100 border border-slate-300 text-[6px] font-mono text-slate-700">React</span>
              <span className="h-2 px-1 rounded-xs bg-slate-100 border border-slate-300 text-[6px] font-mono text-slate-700">TypeScript</span>
              <span className="h-2 px-1 rounded-xs bg-slate-100 border border-slate-300 text-[6px] font-mono text-slate-700">Node</span>
            </div>
            <div className="space-y-0.5">
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
              <div className="h-1 w-4/5 bg-slate-300 rounded-xs" />
            </div>
          </div>
        )}

        {id === "minimal" && (
          <div className="space-y-2 w-full">
            <div className="space-y-0.5">
              <div className="h-2 w-1/2 bg-slate-900 rounded-xs tracking-wider" />
              <div className="h-0.5 w-2/3 bg-slate-400 rounded-xs" />
            </div>
            <div className="space-y-1">
              <div className="h-1 w-1/4 bg-slate-700 rounded-xs" />
              <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
              <div className="h-1 w-5/6 bg-slate-300 rounded-xs" />
              <div className="h-1 w-4/6 bg-slate-300 rounded-xs" />
            </div>
          </div>
        )}

        {id === "two-column" && (
          <div className="grid grid-cols-3 gap-1.5 w-full h-full">
            <div className="col-span-1 bg-slate-100 p-1 rounded-xs space-y-1 border-r border-slate-200">
              <div className="h-1.5 w-full bg-slate-800 rounded-xs" />
              <div className="h-1 w-3/4 bg-slate-400 rounded-xs" />
              <div className="h-1 w-full bg-slate-400 rounded-xs" />
              <div className="h-1 w-2/3 bg-slate-400 rounded-xs" />
            </div>
            <div className="col-span-2 p-1 space-y-1">
              <div className="h-1.5 w-1/2 bg-slate-900 rounded-xs" />
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
              <div className="h-1 w-5/6 bg-slate-300 rounded-xs" />
              <div className="h-1 w-4/5 bg-slate-300 rounded-xs" />
            </div>
          </div>
        )}

        {id === "compact" && (
          <div className="space-y-1 w-full">
            <div className="flex justify-between items-center border-b border-slate-800 pb-0.5">
              <div className="h-1.5 w-1/3 bg-slate-900 rounded-xs" />
              <div className="h-1 w-1/2 bg-slate-400 rounded-xs" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
            </div>
            <div className="space-y-0.5">
              <div className="h-0.5 w-full bg-slate-200 rounded-xs" />
              <div className="h-1 w-full bg-slate-300 rounded-xs" />
              <div className="h-1 w-5/6 bg-slate-300 rounded-xs" />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center text-[7px] text-slate-400 font-mono pt-1 border-t border-slate-100">
          <span>{category}</span>
          <span className="font-bold text-emerald-600">{atsScore}</span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground truncate">{name}</span>
          {isSelected && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </div>
        <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};
