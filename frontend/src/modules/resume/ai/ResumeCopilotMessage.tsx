import React, { useState } from "react";
import {
  Bot,
  User,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Plus,
  CornerDownLeft,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface ResumeCopilotMessageProps {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  onApplyToResume?: (suggestedText: string, originalText?: string, targetSection?: string) => void;
}

export const ResumeCopilotMessage: React.FC<ResumeCopilotMessageProps> = ({
  sender,
  text,
  timestamp,
  onApplyToResume,
}) => {
  const isUser = sender === "user";
  const [copiedEntire, setCopiedEntire] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [appliedIndex, setAppliedIndex] = useState<string | null>(null);

  const handleCopy = (contentToCopy: string, identifier?: string) => {
    navigator.clipboard.writeText(contentToCopy);
    if (identifier) {
      setCopiedIndex(identifier);
      setTimeout(() => setCopiedIndex(null), 2000);
    } else {
      setCopiedEntire(true);
      setTimeout(() => setCopiedEntire(false), 2000);
    }
    toast.success("Copied to clipboard!");
  };

  const handleApply = (suggestedText: string, originalText?: string, identifier?: string) => {
    if (!onApplyToResume) {
      toast.error("Resume apply handler not available");
      return;
    }
    onApplyToResume(suggestedText, originalText);
    if (identifier) {
      setAppliedIndex(identifier);
      setTimeout(() => setAppliedIndex(null), 3000);
    }
  };

  // Inline formatting helper (Bold, Italic, Code chips)
  const formatInlineText = (str: string) => {
    const parts: React.ReactNode[] = [];
    // Regex for bold **...**, code `...`, italic *...*
    const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={match.index} className="font-bold text-slate-100">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-cyan-300 font-mono text-[11px]"
          >
            {token.slice(1, -1)}
          </code>
        );
      } else if (token.startsWith("*") && token.endsWith("*")) {
        parts.push(
          <em key={match.index} className="italic text-slate-300">
            {token.slice(1, -1)}
          </em>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  // Structured Markdown Blocks Parser (Tables, Code Blocks, Headers, Lists, Paragraphs)
  const renderMessageContent = () => {
    if (isUser) {
      return <div className="text-xs text-white leading-relaxed whitespace-pre-wrap">{text}</div>;
    }

    const lines = text.split("\n");
    const blocks: React.ReactNode[] = [];
    let i = 0;
    let blockKey = 0;

    while (i < lines.length) {
      const line = lines[i];

      // 1. Code Block: ```lang ... ```
      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim() || "text";
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const fullCode = codeLines.join("\n");
        const codeId = `code-${blockKey++}`;

        blocks.push(
          <div key={codeId} className="my-2.5 rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden text-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400">
              <span className="font-mono font-semibold uppercase">{lang}</span>
              <div className="flex items-center gap-1.5">
                {onApplyToResume && (
                  <button
                    type="button"
                    onClick={() => handleApply(fullCode, undefined, codeId)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/30 transition-colors"
                  >
                    {appliedIndex === codeId ? <Check className="h-3 w-3 text-emerald-400" /> : <Plus className="h-3 w-3" />}
                    <span>{appliedIndex === codeId ? "Applied!" : "Apply to Resume"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(fullCode, codeId)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  {copiedIndex === codeId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedIndex === codeId ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
            <pre className="p-3 font-mono text-[11px] leading-relaxed text-slate-200 overflow-x-auto custom-scrollbar">
              {fullCode}
            </pre>
          </div>
        );
        continue;
      }

      // 2. Markdown Table: consecutive lines with |
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableLines.push(lines[i].trim());
          i++;
        }

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0]
            .split("|")
            .map((c) => c.trim())
            .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

          // Skip separator row (|---|---|)
          const bodyRows = tableLines.slice(2).map((rowLine) =>
            rowLine
              .split("|")
              .map((c) => c.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          );

          const tableId = `tbl-${blockKey++}`;

          blocks.push(
            <div key={tableId} className="my-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 custom-scrollbar">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/90 text-[11px] font-bold text-slate-300">
                    {headerCells.map((h, hIdx) => (
                      <th key={hIdx} className="px-3 py-2 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px] text-slate-300">
                  {bodyRows.map((row, rIdx) => {
                    const rowId = `${tableId}-r${rIdx}`;
                    // Identify original vs corrected text
                    // Typically: col 0 is #, col 1 is Original Text, col 2 is Corrected Text, col 3 is Reason
                    const originalText = row.length >= 3 ? row[1]?.replace(/\*\*/g, "") : undefined;
                    const correctedText = row.length >= 3 ? row[2]?.replace(/\*\*/g, "") : row[row.length - 1]?.replace(/\*\*/g, "");
                    const isNoChange = correctedText?.toLowerCase().includes("no change") || originalText === correctedText;

                    return (
                      <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 align-top">
                            {formatInlineText(cell)}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right align-top whitespace-nowrap">
                          {!isNoChange && correctedText && (
                            <div className="flex items-center justify-end gap-1">
                              {onApplyToResume && (
                                <button
                                  type="button"
                                  title="Directly apply correction to active resume draft"
                                  onClick={() => handleApply(correctedText, originalText, rowId)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 transition-colors"
                                >
                                  {appliedIndex === rowId ? <Check className="h-3 w-3 text-emerald-400" /> : <Sparkles className="h-3 w-3" />}
                                  <span>{appliedIndex === rowId ? "Applied!" : "Apply"}</span>
                                </button>
                              )}
                              <button
                                type="button"
                                title="Copy suggested text"
                                onClick={() => handleCopy(correctedText, rowId)}
                                className="inline-flex items-center gap-1 p-1 rounded text-[10px] bg-slate-800 text-slate-300 hover:text-white transition-colors"
                              >
                                {copiedIndex === rowId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // 3. Header 3 & 4
      if (line.startsWith("#### ")) {
        blocks.push(
          <h4 key={blockKey++} className="text-xs font-black uppercase tracking-wider text-cyan-400 mt-3 mb-1">
            {line.replace("#### ", "")}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith("### ")) {
        blocks.push(
          <h3 key={blockKey++} className="text-sm font-bold text-white mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            {line.replace("### ", "")}
          </h3>
        );
        i++;
        continue;
      }

      // 4. Bullet Items (- or * or numbered)
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || /^\d+\.\s+/.test(line.trim())) {
        const bulletText = line.trim().replace(/^([-*]|\d+\.)\s+/, "");
        const bulletId = `bullet-${blockKey++}`;

        blocks.push(
          <div key={bulletId} className="group flex items-start justify-between gap-2 py-1 px-2 rounded-lg hover:bg-slate-850/60 transition-colors text-xs text-slate-200">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="leading-relaxed flex-1">{formatInlineText(bulletText)}</div>
            </div>

            {/* Quick action chips on hover or focus */}
            <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
              {onApplyToResume && (
                <button
                  type="button"
                  title="Insert / apply this bullet to resume"
                  onClick={() => handleApply(bulletText, undefined, bulletId)}
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-600/20 text-cyan-300 hover:bg-cyan-600/40 transition-colors flex items-center gap-1"
                >
                  {appliedIndex === bulletId ? <Check className="h-3 w-3 text-emerald-400" /> : <CornerDownLeft className="h-3 w-3" />}
                  <span>{appliedIndex === bulletId ? "Applied" : "Apply"}</span>
                </button>
              )}
              <button
                type="button"
                title="Copy line"
                onClick={() => handleCopy(bulletText, bulletId)}
                className="p-1 rounded text-[10px] bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                {copiedIndex === bulletId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          </div>
        );
        i++;
        continue;
      }

      // 5. Empty line
      if (!line.trim()) {
        blocks.push(<div key={blockKey++} className="h-1.5" />);
        i++;
        continue;
      }

      // 6. Regular paragraph
      blocks.push(
        <p key={blockKey++} className="text-xs text-slate-200 leading-relaxed my-1">
          {formatInlineText(line)}
        </p>
      );
      i++;
    }

    return blocks;
  };

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}>
      {!isUser && (
        <div className="h-7 w-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`max-w-[88%] rounded-xl p-3.5 text-xs leading-relaxed transition-all shadow-sm ${
          isUser
            ? "bg-cyan-600 text-white"
            : "bg-slate-900/90 border border-slate-800 text-slate-200"
        }`}
      >
        {/* Message Content */}
        <div className="space-y-1">{renderMessageContent()}</div>

        {/* Footer info & global message copy */}
        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/80 text-[10px] opacity-75">
          <span className="font-mono">{timestamp}</span>
          {!isUser && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(text)}
                className="inline-flex items-center gap-1 hover:text-cyan-300 transition-colors"
              >
                {copiedEntire ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedEntire ? "Copied" : "Copy Response"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default ResumeCopilotMessage;
