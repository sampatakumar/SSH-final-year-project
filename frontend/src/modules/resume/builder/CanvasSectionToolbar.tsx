import React from "react";
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  Edit3,
  EyeOff,
  Trash2,
  Plus,
  GripVertical,
} from "lucide-react";

export interface CanvasSectionToolbarProps {
  sectionId: string;
  sectionTitle: string;
  onAction?: (
    action: "moveUp" | "moveDown" | "duplicate" | "hide" | "delete" | "ai" | "edit" | "addItem",
    sectionId: string,
    itemId?: string
  ) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  canAddItem?: boolean;
}

export const CanvasSectionToolbar: React.FC<CanvasSectionToolbarProps> = ({
  sectionId,
  sectionTitle,
  onAction,
  canMoveUp = true,
  canMoveDown = true,
  canAddItem = false,
}) => {
  if (!onAction) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-7.5 right-0 z-30 flex items-center gap-0.5 bg-slate-900/90 text-slate-100 backdrop-blur-md rounded-md px-1.5 py-0.5 shadow-md border border-slate-700/60 select-none animate-in fade-in zoom-in-95 duration-100 text-[10px] pointer-events-auto"
    >
      <span className="font-semibold text-slate-300 mr-1 flex items-center gap-0.5 border-r border-slate-700/80 pr-1.5 py-0.5">
        <GripVertical className="h-2.5 w-2.5 text-slate-400" />
        {sectionTitle}
      </span>

      {canMoveUp && (
        <button
          type="button"
          onClick={() => onAction("moveUp", sectionId)}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          title="Move section up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
      )}

      {canMoveDown && (
        <button
          type="button"
          onClick={() => onAction("moveDown", sectionId)}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors"
          title="Move section down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      )}

      {canAddItem && (
        <button
          type="button"
          onClick={() => onAction("addItem", sectionId)}
          className="p-1 hover:bg-emerald-500/20 rounded text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5"
          title="Add entry to section"
        >
          <Plus className="h-3 w-3" />
        </button>
      )}

      <button
        type="button"
        onClick={() => onAction("ai", sectionId)}
        className="p-1 hover:bg-amber-500/20 rounded text-amber-300 hover:text-amber-200 transition-colors"
        title="AI Improve Section"
      >
        <Sparkles className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onAction("edit", sectionId)}
        className="p-1 hover:bg-slate-800 rounded text-blue-400 hover:text-blue-300 transition-colors"
        title="Open in sidebar editor"
      >
        <Edit3 className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onAction("hide", sectionId)}
        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-colors"
        title="Hide section from resume"
      >
        <EyeOff className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onAction("delete", sectionId)}
        className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 transition-colors"
        title="Remove section"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
};

export default React.memo(CanvasSectionToolbar);
