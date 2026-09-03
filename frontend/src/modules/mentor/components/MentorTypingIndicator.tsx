import React from "react";
import { Sparkles } from "lucide-react";

export const MentorTypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-surface/80 border border-border/40 max-w-lg shadow-neo-raised-sm animate-in fade-in duration-200">
      <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
          Smart Mentor
          <span className="text-[10px] text-muted-foreground font-normal">● Thinking...</span>
        </p>
        <div className="flex items-center gap-1 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce"></span>
        </div>
      </div>
    </div>
  );
};
