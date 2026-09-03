import React from "react";
import {
  Sparkles,
  TrendingUp,
  GitBranch,
  Target,
  Calendar,
  FileText,
  Code2,
} from "lucide-react";

interface MentorSuggestionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const SUGGESTIONS = [
  { text: "How am I progressing?", icon: TrendingUp },
  { text: "What should I learn next?", icon: Target },
  { text: "Review my GitHub profile & repos", icon: GitBranch },
  { text: "Which repos need a README or description?", icon: Code2 },
  { text: "Am I ready for my target role?", icon: Sparkles },
  { text: "Give me a 30-day placement plan", icon: Calendar },
  { text: "What are my biggest skill gaps?", icon: Target },
  { text: "How can I make my resume stronger?", icon: FileText },
];

export const MentorSuggestions: React.FC<MentorSuggestionsProps> = ({
  onSelect,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
        Quick Guidance Prompts
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-wrap">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.text)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/90 hover:bg-surface border border-border/40 hover:border-primary/40 text-xs font-semibold text-foreground/90 hover:text-primary shadow-neo-raised-sm hover:shadow-neo-raised transition-all disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              <Icon className="h-3 w-3 text-primary shrink-0" />
              <span>{item.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
