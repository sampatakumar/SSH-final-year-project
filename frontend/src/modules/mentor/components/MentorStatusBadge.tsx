import React from "react";
import { Sparkles, Cpu, ShieldCheck } from "lucide-react";

interface MentorStatusBadgeProps {
  source?: "groq" | "local_nlp" | "deterministic";
  isStreaming?: boolean;
}

export const MentorStatusBadge: React.FC<MentorStatusBadgeProps> = ({
  source = "groq",
  isStreaming = false,
}) => {
  if (source === "local_nlp" || source === "deterministic") {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-neo-raised-sm animate-in fade-in duration-200">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Cpu className="h-3 w-3" />
        <span>Local Mentor Mode (Instant)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold shadow-neo-raised-sm animate-in fade-in duration-200">
      <span className="relative flex h-2 w-2">
        {isStreaming && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <Sparkles className="h-3 w-3" />
      <span>AI Mentor Online (GPT-OSS-120B)</span>
    </div>
  );
};
