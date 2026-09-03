import React, { useState, useRef, useEffect } from "react";
import { Send, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MentorInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const MentorInput: React.FC<MentorInputProps> = ({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;

    const messageToSend = input.trim();
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSend(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 p-2 rounded-2xl bg-surface border border-border/50 shadow-neo-raised focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask Smart Mentor about your career, GitHub repos, skill gaps, or learning roadmap..."
        className="flex-1 max-h-40 min-h-[44px] py-2.5 px-3 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none disabled:opacity-50"
      />

      <div className="flex items-center gap-1 shrink-0 pb-1 pr-1">
        {isLoading ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={onStop}
            className="h-9 px-3 rounded-xl gap-1.5 font-bold text-xs shadow-neo-raised-sm"
          >
            <Square className="h-3 w-3 fill-current" />
            <span>Stop</span>
          </Button>
        ) : (
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || disabled}
            className="h-9 px-4 rounded-xl gap-1.5 font-bold text-xs bg-primary text-primary-foreground shadow-neo-raised hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            <span>Ask</span>
            <Send className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </form>
  );
};
