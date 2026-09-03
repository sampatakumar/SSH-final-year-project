import React, { useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Download,
  Maximize2,
  Minimize2,
  Sparkles,
  Compass,
  Check,
  RefreshCw,
  Palette,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ResumeEditorHeaderProps {
  resumeTitle: string;
  onChangeTitle: (newTitle: string) => void;
  templateName: string;
  onBack: () => void;
  onOpenCareerMentor: () => void;
  onOpenSyncDialog: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  activeLeftTab: "design" | "formatting" | null;
  onToggleLeftTab: (tab: "design" | "formatting") => void;
}

export const ResumeEditorHeader: React.FC<ResumeEditorHeaderProps> = ({
  resumeTitle,
  onChangeTitle,
  templateName,
  onBack,
  onOpenCareerMentor,
  onOpenSyncDialog,
  onExportPdf,
  isExportingPdf,
  isFullScreen,
  onToggleFullScreen,
  activeLeftTab,
  onToggleLeftTab,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <header className="h-13 bg-card border-b border-border/50 px-4 flex items-center justify-between shrink-0 select-none z-20 gap-3">
      {/* Left: Navigation & Inline Title */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
          title="Back to Resumes list"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <Input
              autoFocus
              value={resumeTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") setIsEditingTitle(false);
              }}
              className="h-7 text-xs font-bold w-48 sm:w-60 bg-background"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors truncate max-w-[180px] sm:max-w-[260px] group"
              title="Click to rename resume"
            >
              <span className="truncate">{resumeTitle || "Untitled Resume"}</span>
              <Edit2 className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 opacity-70" />
            </button>
          )}

          <span className="hidden md:inline-flex text-[10px] font-semibold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
            {templateName}
          </span>
        </div>
      </div>

      {/* Center / Left Panel Toggles for Desktop */}
      <div className="hidden lg:flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/40 text-xs">
        <button
          type="button"
          onClick={() => onToggleLeftTab("design")}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            activeLeftTab === "design"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="h-3.5 w-3.5 text-primary" /> Design & Template
        </button>
        <button
          type="button"
          onClick={() => onToggleLeftTab("formatting")}
          className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
            activeLeftTab === "formatting"
              ? "bg-card text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-primary" /> Formatting & Spacing
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* AI Career Mentor Trigger */}
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenCareerMentor}
          className="h-8 text-xs font-semibold bg-gradient-to-r from-primary/10 to-indigo-500/10 border-primary/30 text-primary hover:bg-primary/20 gap-1.5 shadow-2xs"
          title="Open AI Career Mentor for technical guidance"
        >
          <Compass className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="hidden sm:inline">AI Career Mentor</span>
        </Button>

        {/* Full Screen Preview */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleFullScreen}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hidden md:flex"
          title={isFullScreen ? "Exit Full Screen" : "Full Screen Preview"}
        >
          {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {/* Export PDF Primary Action */}
        <Button
          size="sm"
          onClick={onExportPdf}
          disabled={isExportingPdf}
          className="h-8 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isExportingPdf ? "Building PDF..." : "Export PDF"}</span>
        </Button>
      </div>
    </header>
  );
};
