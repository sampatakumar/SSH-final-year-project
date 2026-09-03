import React, { useState, useRef, useEffect } from "react";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import ResumeTemplateRenderer from "../templates/ResumeTemplateRenderer";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResumePreviewWorkspaceProps {
  data: ResumeData;
  config: ResumeBuilderConfig;
  activeSection?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  estimatedPages?: number;
  onOptimizeForOnePage?: () => void;
  isOverflowing?: boolean;
}

export const ResumePreviewWorkspace: React.FC<ResumePreviewWorkspaceProps> = ({
  data,
  config,
  activeSection,
  isFullScreen = false,
  onToggleFullScreen,
  estimatedPages = 1,
  onOptimizeForOnePage,
  isOverflowing = false,
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.4, prev + 0.1));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.5, prev - 0.1));
  const handleResetZoom = () => setZoom(0.85);

  const handleFitWidth = () => {
    if (containerRef.current && containerRef.current.clientWidth > 0) {
      const containerWidth = containerRef.current.clientWidth - 48;
      const targetScale = Math.min(1.1, Math.max(0.5, containerWidth / 794));
      setZoom(Number(targetScale.toFixed(2)));
    } else {
      setZoom(0.85);
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-slate-950/60 overflow-hidden relative select-none"
    >
      {/* Floating Canvas Controls Overlay */}
      <div className="absolute top-3 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-xl text-slate-200">
        {/* Page Count Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono">
          <FileText className="h-3 w-3 text-primary" />
          <span>Page 1 of {estimatedPages}</span>
        </div>

        {/* 1-Page Optimizer trigger if overflowing */}
        {isOverflowing && onOptimizeForOnePage && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOptimizeForOnePage}
            className="h-6 text-[10px] px-2 bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-bold"
            title="Optimize typography and spacing to fit on 1 page"
          >
            <Sparkles className="h-2.5 w-2.5 mr-1" /> Fit 1 Page
          </Button>
        )}

        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono text-slate-300 min-w-[38px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleFitWidth}
            className="px-1.5 py-0.5 text-[10px] font-semibold hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors ml-0.5"
            title="Fit to canvas width"
          >
            Fit
          </button>
        </div>

        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            title={isFullScreen ? "Exit full screen" : "Full screen preview"}
          >
            {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Center Paper Viewport */}
      <div className="flex-1 overflow-auto p-6 sm:p-10 flex justify-center items-start custom-scrollbar">
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
            transition: "transform 100ms ease-out",
          }}
          className="transition-all"
        >
          {/* True A4 Paper Canvas (210mm x 297mm @ 96DPI ~ 794px x 1123px) */}
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
    </div>
  );
};
