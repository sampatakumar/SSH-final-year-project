import React, { useState } from "react";
import { GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeBuilderConfig, CustomSection } from "../templates/types";

export interface SectionReorderListProps {
  config: ResumeBuilderConfig;
  activeSection: string;
  onSelectSection: (sectionKey: string) => void;
  onUpdateConfig: (newConfig: ResumeBuilderConfig) => void;
  onAddCustomSection: () => void;
}

const SECTION_LABELS: Record<string, { label: string; icon?: string }> = {
  personal: { label: "Personal Information" },
  summary: { label: "Professional Summary" },
  experience: { label: "Work Experience" },
  projects: { label: "Projects & Demos" },
  education: { label: "Education" },
  skills: { label: "Technical Skills" },
  achievements: { label: "Achievements & Awards" },
  custom: { label: "Custom Sections" }
};

export const SectionReorderList: React.FC<SectionReorderListProps> = ({
  config,
  activeSection,
  onSelectSection,
  onUpdateConfig,
  onAddCustomSection,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sections = config.sectionOrder;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sections];
    const [movedItem] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, movedItem);

    setDraggedIndex(index);
    onUpdateConfig({
      ...config,
      sectionOrder: newOrder,
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === 0) return;
    const newOrder = [...sections];
    const [item] = newOrder.splice(index, 1);
    newOrder.splice(index - 1, 0, item);
    onUpdateConfig({ ...config, sectionOrder: newOrder });
  };

  const moveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index === sections.length - 1) return;
    const newOrder = [...sections];
    const [item] = newOrder.splice(index, 1);
    newOrder.splice(index + 1, 0, item);
    onUpdateConfig({ ...config, sectionOrder: newOrder });
  };

  const toggleVisibility = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isHidden = config.hiddenSections.includes(key);
    const newHidden = isHidden
      ? config.hiddenSections.filter((k) => k !== key)
      : [...config.hiddenSections, key];

    onUpdateConfig({ ...config, hiddenSections: newHidden });
  };

  return (
    <div className="space-y-3">
      {/* Permanent Header Section */}
      <div
        onClick={() => onSelectSection("personal")}
        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-sm font-medium ${
          activeSection === "personal"
            ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
            : "bg-card/60 hover:bg-card border-border/40 text-foreground"
        }`}
      >
        <span>👤 Personal Information</span>
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Fixed Header</span>
      </div>

      {/* Draggable Reorderable Sections */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Resume Sections ({sections.length})
        </p>

        {sections.map((key, index) => {
          const isHidden = config.hiddenSections.includes(key);
          const label = SECTION_LABELS[key]?.label || key;
          const isActive = activeSection === key;

          return (
            <div
              key={key}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectSection(key)}
              className={`group flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer text-xs select-none ${
                isActive
                  ? "bg-primary/10 border-primary/40 text-primary font-semibold shadow-sm"
                  : isHidden
                  ? "bg-muted/30 border-dashed border-border/40 text-muted-foreground opacity-60"
                  : "bg-card/70 hover:bg-card border-border/50 text-foreground"
              }`}
            >
              {/* Drag Handle & Label */}
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
                <span className="truncate">{label}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100">
                {/* Accessible Reordering Buttons */}
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={(e) => moveUp(index, e)}
                  aria-label={`Move ${label} up`}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-20 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === sections.length - 1}
                  onClick={(e) => moveDown(index, e)}
                  aria-label={`Move ${label} down`}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-20 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Hide / Show Toggle */}
                <button
                  type="button"
                  onClick={(e) => toggleVisibility(key, e)}
                  aria-label={isHidden ? `Show ${label}` : `Hide ${label}`}
                  className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                  title={isHidden ? "Show section" : "Hide section from resume"}
                >
                  {isHidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-primary" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Section Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAddCustomSection}
        className="w-full text-xs border-dashed border-border/70 hover:border-primary/50 text-muted-foreground hover:text-foreground h-8"
      >
        <Plus className="h-3.5 w-3.5 mr-1" /> Add Custom Section
      </Button>
    </div>
  );
};

export default SectionReorderList;
