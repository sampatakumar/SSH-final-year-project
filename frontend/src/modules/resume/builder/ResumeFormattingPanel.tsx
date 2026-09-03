import React from "react";
import type { ResumeBuilderConfig, SpacingPreset, TypographySettings } from "../templates/types";
import { SPACING_PRESETS } from "../templates/TemplateRegistry";
import { Sliders, Type, LayoutGrid, FileText } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export interface ResumeFormattingPanelProps {
  config: ResumeBuilderConfig;
  onUpdateConfig: (newConfig: ResumeBuilderConfig) => void;
}

const FONT_OPTIONS: Array<{ label: string; value: TypographySettings["fontFamily"] }> = [
  { label: "Inter (Modern Sans)", value: "Inter" },
  { label: "Helvetica (Clean Sans)", value: "Helvetica" },
  { label: "Arial (Standard)", value: "Arial" },
  { label: "Times New Roman (ATS Standard)", value: "Times New Roman" },
  { label: "Georgia (Editorial Serif)", value: "Georgia" },
  { label: "System UI (Native)", value: "system-ui" },
];

export const ResumeFormattingPanel: React.FC<ResumeFormattingPanelProps> = ({
  config,
  onUpdateConfig,
}) => {
  const typo = config.typography;

  const handleUpdateTypo = (patch: Partial<TypographySettings>) => {
    onUpdateConfig({
      ...config,
      typography: {
        ...config.typography,
        ...patch,
      },
    });
  };

  const handleApplyPreset = (preset: SpacingPreset) => {
    const presetValues = SPACING_PRESETS[preset];
    onUpdateConfig({
      ...config,
      spacingPreset: preset,
      typography: {
        ...config.typography,
        ...presetValues,
      },
    });
  };

  const handlePageMode = (mode: "one-page" | "two-page" | "auto") => {
    onUpdateConfig({
      ...config,
      pageMode: mode,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Spacing Preset Buttons */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Density Presets
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["compact", "balanced", "spacious"] as SpacingPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all capitalize ${
                config.spacingPreset === preset
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background/80 border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Page Fit Mode */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Target Page Fit
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "one-page", label: "1 Page Target" },
            { id: "two-page", label: "2 Pages" },
            { id: "auto", label: "Automatic" },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => handlePageMode(mode.id as any)}
              className={`px-2 py-1.5 text-xs font-semibold rounded-xl border transition-all text-center ${
                config.pageMode === mode.id
                  ? "bg-primary/20 text-primary border-primary/50 shadow-xs"
                  : "bg-background/80 border-border hover:bg-muted text-muted-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Typography & Font Family */}
      <div className="space-y-3 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Font Family & Scale
          </h3>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Font Family
          </label>
          <select
            value={typo.fontFamily}
            onChange={(e) => handleUpdateTypo({ fontFamily: e.target.value as any })}
            className="w-full h-8 px-2 text-xs font-medium rounded-lg border border-border bg-background text-foreground shadow-xs cursor-pointer"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Body Font Size Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Body Font Size</span>
            <span className="font-mono text-primary">{typo.bodySize} pt</span>
          </div>
          <Slider
            value={[typo.bodySize]}
            min={9}
            max={12}
            step={0.25}
            onValueChange={([val]) => handleUpdateTypo({ bodySize: val })}
            className="py-1 cursor-pointer"
          />
        </div>

        {/* Heading Font Size Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Heading Font Size</span>
            <span className="font-mono text-primary">{typo.headingSize} pt</span>
          </div>
          <Slider
            value={[typo.headingSize]}
            min={11}
            max={15}
            step={0.5}
            onValueChange={([val]) => handleUpdateTypo({ headingSize: val })}
            className="py-1 cursor-pointer"
          />
        </div>
      </div>

      {/* 4. Document Spacing Controls */}
      <div className="space-y-3 pt-1 border-t border-border/40">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Document Margins & Spacing
          </h3>
        </div>

        {/* Section Gap */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Section Spacing</span>
            <span className="font-mono text-primary">{typo.sectionGap} px</span>
          </div>
          <Slider
            value={[typo.sectionGap]}
            min={6}
            max={24}
            step={1}
            onValueChange={([val]) => handleUpdateTypo({ sectionGap: val })}
            className="py-1 cursor-pointer"
          />
        </div>

        {/* Line Spacing */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Line Height</span>
            <span className="font-mono text-primary">{typo.lineHeight}x</span>
          </div>
          <Slider
            value={[typo.lineHeight]}
            min={1.1}
            max={1.4}
            step={0.02}
            onValueChange={([val]) => handleUpdateTypo({ lineHeight: Number(val.toFixed(2)) })}
            className="py-1 cursor-pointer"
          />
        </div>

        {/* Page Margins */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-muted-foreground">Page Margins (Padding)</span>
            <span className="font-mono text-primary">{typo.pageMargins || 32} px</span>
          </div>
          <Slider
            value={[typo.pageMargins || 32]}
            min={20}
            max={48}
            step={2}
            onValueChange={([val]) => handleUpdateTypo({ pageMargins: val })}
            className="py-1 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
