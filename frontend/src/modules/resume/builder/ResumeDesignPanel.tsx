import React from "react";
import type { ResumeBuilderConfig, TemplateId } from "../templates/types";
import { TEMPLATE_REGISTRY, ACCENT_COLOR_PALETTE } from "../templates/TemplateRegistry";
import { TemplateThumbnailCard } from "./TemplateThumbnailCard";
import { Palette, LayoutTemplate } from "lucide-react";

export interface ResumeDesignPanelProps {
  config: ResumeBuilderConfig;
  onUpdateConfig: (newConfig: ResumeBuilderConfig) => void;
}

const EXTENDED_COLOR_PALETTE = [
  { label: "Monochrome / Black", value: "#111827" },
  { label: "Deep Navy", value: "#0F172A" },
  { label: "Slate Gray", value: "#334155" },
  { label: "Royal Blue", value: "#1D4ED8" },
  { label: "SSH Indigo", value: "#6366F1" },
  { label: "Teal Cyan", value: "#0D9488" },
  { label: "Emerald Green", value: "#059669" },
  { label: "Amber Warm", value: "#D97706" },
  { label: "Rose Crimson", value: "#E11D48" },
];

export const ResumeDesignPanel: React.FC<ResumeDesignPanelProps> = ({
  config,
  onUpdateConfig,
}) => {
  const handleSelectTemplate = (templateId: TemplateId) => {
    onUpdateConfig({
      ...config,
      templateId,
    });
  };

  const handleSelectColor = (accentColor: string) => {
    onUpdateConfig({
      ...config,
      accentColor,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Accent Color Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Theme & Accent Color
          </h3>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {EXTENDED_COLOR_PALETTE.map((c) => {
            const isSelected = config.accentColor.toLowerCase() === c.value.toLowerCase();
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleSelectColor(c.value)}
                title={c.label}
                className={`h-7 rounded-lg border transition-all flex items-center justify-center relative ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 border-white"
                    : "border-border/60 hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
              >
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-xs" />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Color Input */}
        <div className="flex items-center gap-2 pt-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Custom Color:</label>
          <input
            type="color"
            value={config.accentColor || "#6366F1"}
            onChange={(e) => handleSelectColor(e.target.value)}
            className="h-6 w-8 rounded cursor-pointer border border-border bg-transparent p-0"
          />
          <span className="text-[11px] font-mono text-muted-foreground uppercase">
            {config.accentColor}
          </span>
        </div>
      </div>

      {/* 2. Visual Template Selector Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ATS Templates (5 Available)
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground">Preserves all data</span>
        </div>

        <div className="space-y-3">
          {(Object.keys(TEMPLATE_REGISTRY) as TemplateId[]).map((tid) => {
            const meta = TEMPLATE_REGISTRY[tid];
            return (
              <TemplateThumbnailCard
                key={tid}
                id={tid}
                name={meta.name}
                category={meta.category}
                description={meta.description}
                atsScore={meta.atsScore}
                badge={meta.badge}
                isSelected={config.templateId === tid}
                accentColor={config.accentColor || "#6366F1"}
                onSelect={handleSelectTemplate}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
