import React from "react";
import { CanonicalTool } from "../types/tools.types";
import {
  Wrench,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface ToolCardProps {
  tool: CanonicalTool;
  onLaunch: (tool: CanonicalTool) => void;
  isRecommended?: boolean;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onLaunch, isRecommended = false }) => {
  const getDisciplineColor = (discipline: string) => {
    switch (discipline) {
      case "Computer Science & IT":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Mechanical Engineering":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "ECE & EEE":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Civil Engineering":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "Chemical Engineering":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Biotechnology":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Business & Management":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Commerce & Finance":
        return "bg-teal-500/10 text-teal-400 border-teal-500/20";
      case "Arts & Humanities":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "Nursing & Allied Health":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/20";
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border p-5 transition-all duration-300 hover:shadow-xl backdrop-blur-md ${
        isRecommended
          ? "border-primary/40 bg-gradient-to-b from-primary/10 via-card/60 to-card shadow-lg shadow-primary/5"
          : "border-border/60 bg-card/40 hover:border-border hover:bg-card/70"
      }`}
    >
      {/* Top Banner / Tags */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDisciplineColor(
              tool.academicDiscipline
            )}`}
          >
            {tool.academicDiscipline}
          </span>

          <div className="flex items-center gap-1.5">
            {isRecommended && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="w-2.5 h-2.5" />
                Recommended
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                tool.executionMode === "deterministic"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              }`}
            >
              {tool.executionMode === "deterministic" ? (
                <>
                  <Zap className="w-2.5 h-2.5" />
                  Deterministic Math
                </>
              ) : (
                <>
                  <Cpu className="w-2.5 h-2.5" />
                  Hybrid AI
                </>
              )}
            </span>
          </div>
        </div>

        {/* Title & Short Description */}
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1.5">
          {tool.displayName}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
          {tool.shortDescription}
        </p>

        {/* Input Parameters Tag list */}
        <div className="mb-4">
          <div className="text-[11px] font-medium text-muted-foreground/80 mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Supported Inputs & Checks:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tool.supportedInputs.slice(0, 3).map((inp) => (
              <span
                key={inp.name}
                className="text-[10px] px-2 py-0.5 rounded bg-muted/60 text-foreground/80 border border-border/40 font-mono"
              >
                {inp.name}
                {inp.unit ? ` (${inp.unit})` : ""}
              </span>
            ))}
            {tool.supportedInputs.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                +{tool.supportedInputs.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Safety Notice or Footnote */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground line-clamp-1">
          <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
          <span>v{tool.version} • {tool.category}</span>
        </div>

        <button
          onClick={() => onLaunch(tool)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm group-hover:translate-x-0.5"
        >
          <span>{tool.isExternalRoute ? "Open Tool" : "Launch Workspace"}</span>
          {tool.isExternalRoute ? (
            <ExternalLink className="w-3 h-3" />
          ) : (
            <ArrowRight className="w-3 h-3" />
          )}
        </button>
      </div>
    </div>
  );
};
