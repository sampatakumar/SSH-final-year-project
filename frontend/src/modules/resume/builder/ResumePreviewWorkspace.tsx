import React, { useState, useRef, useEffect, useCallback } from "react";
import type { ResumeData, ResumeBuilderConfig } from "../templates/types";
import ResumeTemplateRenderer from "../templates/ResumeTemplateRenderer";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  FileText,
  MousePointerClick,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResumePreviewWorkspaceProps {
  data: ResumeData;
  config: ResumeBuilderConfig;
  activeSection?: string;
  selectedItemId?: string;
  onSelectSection?: (sectionId: string, itemId?: string) => void;
  onDirectEdit?: (path: string, value: any) => void;
  onSectionAction?: (action: string, sectionId: string, itemId?: string) => void;
  onReorderSections?: (sourceSectionId: string, targetSectionId: string) => void;
  onReorderItems?: (sectionId: string, sourceIndex: number, targetIndex: number) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  estimatedPages?: number;
  onOptimizeForOnePage?: () => void;
  isOverflowing?: boolean;
}

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

export const ResumePreviewWorkspace: React.FC<ResumePreviewWorkspaceProps> = ({
  data,
  config,
  activeSection,
  selectedItemId,
  onSelectSection,
  onDirectEdit,
  onSectionAction,
  onReorderSections,
  onReorderItems,
  isFullScreen = false,
  onToggleFullScreen,
  estimatedPages = 1,
  onOptimizeForOnePage,
  isOverflowing = false,
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((prev) => Math.min(1.6, Number((prev + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.45, Number((prev - 0.1).toFixed(2))));
  const handleResetZoom = () => setZoom(0.85);

  const getUsableDimensions = useCallback(() => {
    if (!containerRef.current) return { usableWidth: 794, usableHeight: 900 };
    const { clientWidth, clientHeight } = containerRef.current;
    // Dynamic safe breathing room: 32px - 56px on each side
    const paddingH = clientWidth > 1200 ? 96 : clientWidth > 900 ? 64 : 48;
    const paddingV = 72;
    return {
      usableWidth: Math.max(200, clientWidth - paddingH),
      usableHeight: Math.max(200, clientHeight - paddingV),
    };
  }, []);

  // Fit Width: fits the 794px width into visible center canvas width
  const handleFitWidth = useCallback(() => {
    const { usableWidth } = getUsableDimensions();
    const targetScale = Math.min(1.5, Math.max(0.45, usableWidth / A4_WIDTH_PX));
    setZoom(Number(targetScale.toFixed(2)));
  }, [getUsableDimensions]);

  // Fit Page: fits the full 1123px height into visible center canvas height (accounting for header & status bar)
  const handleFitPage = useCallback(() => {
    const { usableWidth, usableHeight } = getUsableDimensions();
    const scaleW = usableWidth / A4_WIDTH_PX;
    const scaleH = usableHeight / A4_HEIGHT_PX;
    const targetScale = Math.min(1.25, Math.max(0.45, Math.min(scaleW, scaleH)));
    setZoom(Number(targetScale.toFixed(2)));
  }, [getUsableDimensions]);

  // Intelligent Initial Zoom on mount & ResizeObserver on center canvas container
  useEffect(() => {
    if (!containerRef.current) return;
    let initialDone = false;

    const updateZoomOnResize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth < 200 || clientHeight < 200) return;

      const paddingH = clientWidth > 1200 ? 96 : clientWidth > 900 ? 64 : 48;
      const paddingV = 72;
      const usableW = clientWidth - paddingH;
      const usableH = clientHeight - paddingV;
      const fitPageScale = usableH / A4_HEIGHT_PX;
      const fitWidthScale = usableW / A4_WIDTH_PX;

      if (!initialDone) {
        initialDone = true;
        // Default to safe fit page (or fit width if height is ample)
        const safeDefault = Math.max(0.65, Math.min(1.15, Math.min(fitWidthScale, fitPageScale)));
        setZoom(Number(safeDefault.toFixed(2)));
      }
    };

    updateZoomOnResize();

    const observer = new ResizeObserver(() => {
      updateZoomOnResize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Keyboard shortcut for zooming and fit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (!isInput && (e.ctrlKey || e.metaKey)) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          handleResetZoom();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const pageCount = Math.max(1, estimatedPages);
  const pageMargin = config.typography?.pageMargins || 32;

  const scrollToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    const el = document.getElementById(`resume-a4-page-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-slate-100/90 dark:bg-slate-950 overflow-hidden relative select-none"
    >
      {/* Top Floating Document Canvas Controls Bar */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-lg text-slate-700 dark:text-slate-200">
        {/* Interactive Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          <MousePointerClick className="h-3 w-3" />
          <span>Interactive Canvas</span>
        </div>

        {/* Page Navigator */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono">
          <FileText className="h-3 w-3 text-primary" />
          <span>
            Page {currentPage} of {pageCount}
          </span>
          {pageCount > 1 && (
            <div className="flex items-center ml-1 gap-0.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 rounded transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={currentPage >= pageCount}
                onClick={() => scrollToPage(Math.min(pageCount, currentPage + 1))}
                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 rounded transition-colors"
                title="Next page"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* 1-Page Optimizer Trigger if overflowing */}
        {isOverflowing && onOptimizeForOnePage && (
          <Button
            size="sm"
            variant="outline"
            onClick={onOptimizeForOnePage}
            className="h-6 text-[10px] px-2 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 font-bold"
            title="Optimize typography and spacing to fit on 1 page"
          >
            <Sparkles className="h-2.5 w-2.5 mr-1" /> Fit 1 Page
          </Button>
        )}

        {/* Zoom Controls & Presets */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors"
            title="Zoom out (Ctrl + -)"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          <span className="px-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors"
            title="Zoom in (Ctrl + +)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            className="px-1.5 py-0.5 text-[10px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors ml-0.5"
            title="Fit to workspace width"
          >
            Width
          </button>

          <button
            type="button"
            onClick={handleFitPage}
            className="px-1.5 py-0.5 text-[10px] font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors"
            title="Fit whole A4 page vertically"
          >
            Fit
          </button>
        </div>

        {/* Fullscreen Toggle */}
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-foreground transition-colors"
            title={isFullScreen ? "Exit full screen" : "Full screen canvas"}
          >
            {isFullScreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* Canvas Direct Edit Hint */}
      <div className="absolute bottom-3 left-4 z-20 pointer-events-none hidden md:flex items-center gap-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 shadow-sm">
        <MousePointerClick className="h-3 w-3 text-primary" />
        <span>Click any text on the A4 page to edit directly</span>
      </div>

      {/* Center Document Scrolling Canvas */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center custom-scrollbar">
        {/* Scaled Document Container with explicit layout footprint to prevent scroll clipping */}
        <div
          ref={pageContainerRef}
          style={{
            width: `${A4_WIDTH_PX * zoom}px`,
            height: `${A4_HEIGHT_PX * zoom}px`,
            transition: "width 80ms ease-out, height 80ms ease-out",
          }}
          className="relative shrink-0 mx-auto"
        >
          {/* Page 1 Badge */}
          <div className="absolute -top-6 left-0 text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            <span>PAGE 1 (A4 • 210 × 297 mm)</span>
          </div>

          {/* True A4 Paper Canvas (210mm x 297mm @ 96DPI ~ 794px x 1123px) */}
          <div
            id="resume-a4-page-1"
            style={{
              width: `${A4_WIDTH_PX}px`,
              minHeight: `${A4_HEIGHT_PX}px`,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              position: "absolute",
              top: 0,
              left: 0,
              transition: "transform 80ms ease-out",
              padding: `${pageMargin}px`,
            }}
            className="bg-white text-slate-900 rounded-none shadow-2xl select-text border border-slate-200/80 dark:border-slate-800/40 ring-1 ring-black/5 shrink-0"
          >
            <ResumeTemplateRenderer
              data={data}
              config={config}
              isInteractive={true}
              selectedSection={activeSection}
              selectedItemId={selectedItemId}
              onSelectSection={onSelectSection}
              onDirectEdit={onDirectEdit}
              onSectionAction={onSectionAction}
              onReorderSections={onReorderSections}
              onReorderItems={onReorderItems}
            />
          </div>
        </div>

        {/* Dedicated Bottom Clearance: Mathematically guarantees the status bar never overlaps the A4 document */}
        <div className="h-28 w-full shrink-0" />
      </div>
    </div>
  );
};

export default ResumePreviewWorkspace;
