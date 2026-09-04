import React, { useState } from "react";
import {
  ListOrdered,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
  User,
  FileText,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Cpu,
  Trophy,
  Bookmark,
  Sparkles,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResumeBuilderConfig, CustomSection } from "../templates/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ResumeSectionsPanelProps {
  config: ResumeBuilderConfig;
  onUpdateConfig: (newConfig: ResumeBuilderConfig) => void;
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
  sectionCounts: Record<string, number>;
  onReorderSections?: (sourceSectionId: string, targetSectionId: string) => void;
  onCollapse?: () => void;
}

const BASE_SECTIONS = [
  { id: "personal", label: "Contact & Header", icon: User, required: true },
  { id: "summary", label: "Professional Summary", icon: FileText, required: false },
  { id: "experience", label: "Work Experience", icon: Briefcase, required: false },
  { id: "projects", label: "Technical Projects", icon: FolderGit2, required: false },
  { id: "education", label: "Education", icon: GraduationCap, required: false },
  { id: "skills", label: "Technical Skills", icon: Cpu, required: false },
  { id: "achievements", label: "Achievements & Awards", icon: Trophy, required: false },
];

const ADDABLE_PRESETS = [
  "Certifications",
  "Publications",
  "Volunteer Experience",
  "Relevant Coursework",
  "Languages",
  "Leadership & Activities",
  "Custom Section",
];

export const ResumeSectionsPanel: React.FC<ResumeSectionsPanelProps> = ({
  config,
  onUpdateConfig,
  activeSection,
  onSelectSection,
  sectionCounts,
  onReorderSections,
  onCollapse,
}) => {
  const { sectionOrder = [], hiddenSections = [], customSections = [] } = config;
  const [dragOverSecKey, setDragOverSecKey] = useState<string | null>(null);

  const isHidden = (key: string) => hiddenSections.includes(key);

  const toggleVisibility = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextHidden = isHidden(key)
      ? hiddenSections.filter((k) => k !== key)
      : [...hiddenSections, key];
    onUpdateConfig({ ...config, hiddenSections: nextHidden });
  };

  const moveSection = (index: number, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const next = [...sectionOrder];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onUpdateConfig({ ...config, sectionOrder: next });
  };

  const handleAddCustomSection = (title: string) => {
    const newSec: CustomSection = {
      id: `sec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      entries: [
        {
          id: `entry-1`,
          title: `Sample ${title} Entry`,
          subtitle: "Organization / Institution",
          date: "2024",
          bullets: ["Key achievement or credential details."],
        },
      ],
    };

    onUpdateConfig({
      ...config,
      customSections: [...customSections, newSec],
      sectionOrder: sectionOrder.includes("custom") ? sectionOrder : [...sectionOrder, "custom"],
    });
    onSelectSection(`custom-${newSec.id}`);
  };

  const handleRemoveCustomSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateConfig({
      ...config,
      customSections: customSections.filter((s) => s.id !== id),
    });
    if (activeSection === `custom-${id}`) {
      onSelectSection("personal");
    }
  };

  const handleSectionClick = (secId: string) => {
    onSelectSection(secId);
    const targetId = secId === "personal" ? "canvas-section-personal" : `canvas-section-${secId}`;
    const el = document.getElementById(targetId) || document.getElementById(`canvas-section-${secId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resume Sections
          </h3>
        </div>

        {/* Add Section Dropdown & Collapse */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 font-semibold">
                <Plus className="h-3.5 w-3.5 text-primary" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {ADDABLE_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset}
                  onClick={() => handleAddCustomSection(preset)}
                  className="text-xs cursor-pointer"
                >
                  <Plus className="h-3 w-3 mr-2 text-primary" /> {preset}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {onCollapse && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onCollapse}
              className="h-7 w-7 text-muted-foreground hover:text-foreground hidden lg:flex"
              title="Collapse Sections panel (<)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Persistent Section Order Navigation List */}
      <div className="space-y-1.5">
        {/* Contact info (always top) */}
        <div
          onClick={() => handleSectionClick("personal")}
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
            activeSection === "personal"
              ? "bg-primary text-primary-foreground border-primary shadow-xs"
              : "bg-background/80 border-border/60 hover:border-primary/40 hover:bg-muted/40 text-foreground"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <User className={`h-4 w-4 ${activeSection === "personal" ? "text-white" : "text-primary"}`} />
            <span className="text-xs font-semibold truncate">Contact & Header</span>
          </div>
          <span className="text-[10px] opacity-75 font-mono">Always on top</span>
        </div>

        {/* Dynamic Ordered Sections with HTML5 Drag-and-Drop */}
        {sectionOrder.map((key, index) => {
          if (key === "custom") {
            // Render custom sections list
            return customSections.map((sec) => {
              const secId = `custom-${sec.id}`;
              const hidden = isHidden(secId);
              const isSelected = activeSection === secId;

              return (
                <div
                  key={sec.id}
                  onClick={() => handleSectionClick(secId)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : hidden
                      ? "bg-muted/30 border-border/30 opacity-60 text-muted-foreground"
                      : "bg-background/80 border-border/60 hover:border-primary/40 hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bookmark className={`h-4 w-4 ${isSelected ? "text-white" : "text-primary"}`} />
                    <span className="text-xs font-semibold truncate">{sec.title}</span>
                    <span className="text-[10px] font-mono opacity-80">({sec.entries?.length || 0})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => toggleVisibility(secId, e)}
                      className="p-1 hover:opacity-100 opacity-80"
                      title={hidden ? "Show in resume" : "Hide from resume"}
                    >
                      {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCustomSection(sec.id, e)}
                      className="p-1 hover:text-red-400 opacity-80"
                      title="Delete section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            });
          }

          const base = BASE_SECTIONS.find((s) => s.id === key);
          if (!base) return null;
          const hidden = isHidden(key);
          const isSelected = activeSection === key;
          const count = sectionCounts[key];
          const Icon = base.icon;
          const isOver = dragOverSecKey === key;

          return (
            <div key={key}>
              {isOver && <div className="h-1 bg-primary rounded-full mb-1 animate-pulse transition-all" />}
              <div
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify({ type: "section", sectionId: key }));
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverSecKey !== key) setDragOverSecKey(key);
                }}
                onDragLeave={() => {
                  if (dragOverSecKey === key) setDragOverSecKey(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverSecKey(null);
                  try {
                    const raw = e.dataTransfer.getData("application/json");
                    if (raw) {
                      const payload = JSON.parse(raw);
                      if (payload.type === "section" && payload.sectionId !== key) {
                        onReorderSections?.(payload.sectionId, key);
                      }
                    }
                  } catch {}
                }}
                onClick={() => handleSectionClick(key)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : hidden
                    ? "bg-muted/30 border-border/30 opacity-60 text-muted-foreground"
                    : "bg-background/80 border-border/60 hover:border-primary/40 hover:bg-muted/40 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GripVertical className="h-3.5 w-3.5 opacity-40 hover:opacity-100 cursor-grab shrink-0" />
                  <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-primary"} shrink-0`} />
                  <span className="text-xs font-semibold truncate">{base.label}</span>
                  {typeof count === "number" && count > 0 && (
                    <span className="text-[10px] font-mono opacity-80">({count})</span>
                  )}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => moveSection(index, "up", e)}
                    className="p-1 hover:opacity-100 opacity-70 disabled:opacity-20"
                    title="Move section up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sectionOrder.length - 1}
                    onClick={(e) => moveSection(index, "down", e)}
                    className="p-1 hover:opacity-100 opacity-70 disabled:opacity-20"
                    title="Move section down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => toggleVisibility(key, e)}
                    className="p-1 hover:opacity-100 opacity-80 ml-0.5"
                    title={hidden ? "Show section" : "Hide section"}
                  >
                    {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
