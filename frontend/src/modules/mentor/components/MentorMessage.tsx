import React, { useState } from "react";
import { User, Sparkles, Cpu, Copy, Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { MentorActionCard } from "./MentorActionCard";
import type { MentorMessageItem } from "../types/smartMentor.types";

interface MentorMessageProps {
  message: MentorMessageItem;
}

export const MentorMessage: React.FC<MentorMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Advice copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic formatting renderer for structured markdown
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Header 4
      if (line.startsWith("#### ")) {
        return (
          <h4 key={idx} className="text-xs font-black text-foreground mt-3 mb-1 uppercase tracking-wider">
            {line.replace("#### ", "")}
          </h4>
        );
      }
      // Header 3
      if (line.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-sm font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
            {line.replace("### ", "")}
          </h3>
        );
      }
      // Bullet items
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const bulletText = line.trim().replace(/^[-*]\s+/, "");
        return (
          <li key={idx} className="text-xs text-foreground/90 leading-relaxed ml-4 list-disc my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatBoldAndCode(bulletText) }} />
          </li>
        );
      }
      // Numbered items
      if (/^\d+\.\s+/.test(line.trim())) {
        const itemText = line.trim().replace(/^\d+\.\s+/, "");
        return (
          <li key={idx} className="text-xs text-foreground/90 leading-relaxed ml-4 list-decimal my-0.5">
            <span dangerouslySetInnerHTML={{ __html: formatBoldAndCode(itemText) }} />
          </li>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p
          key={idx}
          className="text-xs text-foreground/90 leading-relaxed my-1"
          dangerouslySetInnerHTML={{ __html: formatBoldAndCode(line) }}
        />
      );
    });
  };

  const formatBoldAndCode = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong class='font-bold text-foreground'>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em class='italic'>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='px-1.5 py-0.5 rounded bg-muted/60 text-primary font-mono text-[11px] font-semibold'>$1</code>");
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl animate-in fade-in duration-200 transition-all ${
        isUser
          ? "bg-primary/5 border border-primary/20 ml-auto max-w-2xl shadow-neo-raised-sm"
          : "bg-surface/90 border border-border/40 max-w-3xl shadow-neo-raised-sm"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
          isUser
            ? "bg-primary/20 text-primary border-primary/30"
            : "bg-surface border-border/50 text-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-primary" />}
      </div>

      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-foreground">
              {isUser ? "You" : "Smart Mentor"}
            </span>

            {!isUser && message.source && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                  message.source === "groq"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {message.source === "groq" ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5" />
                    GPT-OSS-120B
                  </>
                ) : (
                  <>
                    <Cpu className="h-2.5 w-2.5" />
                    Local Engine
                  </>
                )}
              </span>
            )}
          </div>

          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Copy advice"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        {/* Message Content */}
        <div className="space-y-1">{renderFormattedContent(message.content)}</div>

        {/* Action Items Recommendation Panel */}
        {!isUser && message.actions && message.actions.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border/30 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-foreground uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              <span>Recommended Next Actions</span>
            </div>
            <div className="space-y-2">
              {message.actions.map((act, aIdx) => (
                <MentorActionCard key={aIdx} action={act} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
