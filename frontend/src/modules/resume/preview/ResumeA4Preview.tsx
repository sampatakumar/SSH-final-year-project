import React, { useState, useMemo } from "react";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import ResumeTemplateRenderer from "../templates/ResumeTemplateRenderer";
import { ZoomIn, ZoomOut, Maximize2, Download, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateResumeDensity, optimizeConfigForOnePage } from "./resume-density.utils";

export interface ResumeA4PreviewProps {
  data: ResumeData;
  config: ResumeBuilderConfig;
  onUpdateConfig?: (newConfig: ResumeBuilderConfig) => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
}

export const ResumeA4Preview: React.FC<ResumeA4PreviewProps> = ({
  data,
  config,
  onUpdateConfig,
  onExportPdf,
  isExportingPdf = false,
}) => {
  const [zoom, setZoom] = useState<number>(0.9);

  const density = useMemo(() => {
    return calculateResumeDensity(data, config);
  }, [data, config]);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.3, prev + 0.1));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, prev - 0.1));
  const handleResetZoom = () => setZoom(0.9);

  const handleOptimizeForOnePage = () => {
    if (!onUpdateConfig) return;
    const optimized = optimizeConfigForOnePage(data, config);
    onUpdateConfig(optimized);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-border/50 overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950/80 border-b border-border/40 text-slate-200">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Live A4 Preview
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            {density.estimatedPages === 1 ? "1 Page" : `${density.estimatedPages} Pages`}
          </span>
          {density.status === "overflowing" && onUpdateConfig && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOptimizeForOnePage}
              className="h-7 text-xs bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
              title="Adjust spacing safely to fit content into 1 page"
            >
              <Sparkles className="h-3 w-3 mr-1 text-amber-400" /> Optimize 1 Page
            </Button>
          )}
        </div>

        {/* Zoom & Actions */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono text-slate-300 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors ml-0.5"
              title="Fit to view"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>

          {onExportPdf && (
            <Button
              size="sm"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {isExportingPdf ? "Building PDF..." : "Export PDF"}
            </Button>
          )}
        </div>
      </div>

      {/* A4 Paper Viewport Canvas */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start bg-slate-950/40 custom-scrollbar">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 120ms ease-out",
          }}
          className="transition-all"
        >
          {/* True A4 Page (210mm x 297mm scaled ~ 794px x 1123px) */}
          <div
            id="resume-a4-preview-canvas"
            className="w-[794px] min-h-[1123px] bg-white text-slate-900 rounded-sm shadow-2xl relative select-text"
            style={{
              padding: `${config.typography?.pageMargins || 32}px`,
            }}
          >
            <ResumeTemplateRenderer data={data} config={config} />
          </div>
        </div>
      </div>

      {/* Bottom Status / Density Indicator */}
      {density.warnings.length > 0 && (
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="truncate">{density.warnings[0]}</span>
          </div>
          {density.suggestions[0] && (
            <span className="hidden lg:inline text-slate-500 italic truncate max-w-sm">
              Tip: {density.suggestions[0]}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(ResumeA4Preview);
