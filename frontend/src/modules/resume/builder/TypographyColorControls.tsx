import React from "react";
import type { ResumeBuilderConfig, TemplateId, SpacingPreset, TypographySettings } from "../templates/types";
import { TEMPLATE_REGISTRY, ACCENT_COLOR_PALETTE, SPACING_PRESETS } from "../templates/TemplateRegistry";
import { Palette, Type, Sliders, Check, LayoutTemplate } from "lucide-react";

export interface TypographyColorControlsProps {
  config: ResumeBuilderConfig;
  onChange: (updated: ResumeBuilderConfig) => void;
}

const FONT_OPTIONS: Array<{ label: string; value: TypographySettings["fontFamily"]; type: string }> = [
  { label: "Inter (Modern Sans)", value: "Inter", type: "Sans-serif" },
  { label: "Arial (Standard)", value: "Arial", type: "Sans-serif" },
  { label: "Helvetica (Clean)", value: "Helvetica", type: "Sans-serif" },
  { label: "Times New Roman (Classic)", value: "Times New Roman", type: "Serif" },
  { label: "Georgia (Editorial)", value: "Georgia", type: "Serif" },
];

export const TypographyColorControls: React.FC<TypographyColorControlsProps> = ({
  config,
  onChange,
}) => {
  const handleTemplateChange = (templateId: TemplateId) => {
    const meta = TEMPLATE_REGISTRY[templateId];
    onChange({
      ...config,
      templateId,
      accentColor: templateId === "ats-classic" ? "#111827" : config.accentColor || "#6366F1",
      typography: {
        ...config.typography,
        fontFamily: meta?.defaultFont || config.typography.fontFamily,
      },
    });
  };

  const handleSpacingPreset = (preset: SpacingPreset) => {
    const patch = SPACING_PRESETS[preset];
    onChange({
      ...config,
      spacingPreset: preset,
      typography: {
        ...config.typography,
        ...patch,
      },
    });
  };

  const handleFontChange = (fontFamily: TypographySettings["fontFamily"]) => {
    onChange({
      ...config,
      typography: {
        ...config.typography,
        fontFamily,
      },
    });
  };

  const handleColorChange = (accentColor: string) => {
    onChange({
      ...config,
      accentColor,
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Template Selector Cards */}
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Resume Templates</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Object.values(TEMPLATE_REGISTRY).map((tmpl) => {
            const isSelected = config.templateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleTemplateChange(tmpl.id)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-background/60 hover:bg-background border-border/60 hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-xs text-foreground">{tmpl.name}</span>
                  {tmpl.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/15 text-primary border border-primary/20">
                      {tmpl.badge}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                  {tmpl.description}
                </p>

                <div className="mt-auto flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{tmpl.atsScore}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Typography & Font Family */}
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Typography & Font</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FONT_OPTIONS.map((f) => {
            const isSelected = config.typography.fontFamily === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFontChange(f.value)}
                className={`px-3 py-2 rounded-lg border text-xs text-left transition-all ${
                  isSelected
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                    : "bg-background/60 hover:bg-background border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="truncate font-medium">{f.label.split(" ")[0]}</div>
                <div className="text-[10px] text-muted-foreground/80">{f.type}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Spacing & Density Presets */}
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Spacing Density</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["compact", "balanced", "spacious"] as const).map((preset) => {
            const isSelected = config.spacingPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handleSpacingPreset(preset)}
                className={`py-2 px-2 text-center rounded-lg border text-xs capitalize transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-background/60 hover:bg-background border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Curated Accent Color */}
      <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Accent Color</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {ACCENT_COLOR_PALETTE.map((col) => {
            const isSelected = config.accentColor?.toLowerCase() === col.value.toLowerCase();
            return (
              <button
                key={col.value}
                type="button"
                onClick={() => handleColorChange(col.value)}
                style={{ backgroundColor: col.value }}
                className={`h-7 w-7 rounded-full transition-transform flex items-center justify-center shadow-sm ${
                  isSelected ? "scale-125 ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                }`}
                title={col.label}
              >
                {isSelected && <Check className="h-4 w-4 text-white drop-shadow stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TypographyColorControls;
